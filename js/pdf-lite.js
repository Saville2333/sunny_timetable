/* ============================================================
 * 星海课表 · 轻量 PDF 解析内核（pdf-lite）
 * ------------------------------------------------------------
 * 纯前端、零依赖，用于从「教务系统导出的 PDF 课表」里提取文字与版面：
 *   1) 顺序扫描 PDF 对象（含对象流 ObjStm），不依赖 xref，容错坏文件
 *   2) 支持 FlateDecode / ASCIIHex / ASCII85 / RunLength
 *   3) 支持 ToUnicode CMap（中文双语字体）、Differences、GBK/Big5 兜底
 *   4) 解析内容流文字矩阵，输出带坐标的文字片段
 *   5) 按坐标聚类成行，识别课表表头 / 节次列 / 星期列，切出单元格
 * 说明：扫描件（纯图片 PDF）没有文字层，需先用 OCR 或手动粘贴。
 * ============================================================ */
(function (global) {
  'use strict';

  const VERSION = '1.0.0';

  /* ---------------- 字节与字符串 ---------------- */
  function bytesToLatin1(u8) {
    const CHUNK = 0x8000;
    const parts = [];
    for (let i = 0; i < u8.length; i += CHUNK) {
      parts.push(String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK)));
    }
    return parts.join('');
  }

  function latin1ToBytes(str) {
    const out = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i += 1) out[i] = str.charCodeAt(i) & 0xff;
    return out;
  }

  function bytesToHexKey(str, start, count) {
    let key = '';
    for (let i = 0; i < count; i += 1) {
      const b = str.charCodeAt(start + i) & 0xff;
      key += (b < 16 ? '0' : '') + b.toString(16).toUpperCase();
    }
    return key;
  }

  /* ---------------- 兜底 inflate（老 WebView 没有 DecompressionStream） ---------------- */
  const LEN_BASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
  const LEN_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
  const DIST_BASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
  const DIST_EXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
  const CL_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

  function buildHuffman(lengths) {
    const blCount = new Array(16).fill(0);
    for (let i = 0; i < lengths.length; i += 1) {
      const len = lengths[i];
      if (len) blCount[len] += 1;
    }
    const nextCode = new Array(16).fill(0);
    let code = 0;
    for (let bits = 1; bits <= 15; bits += 1) {
      code = (code + blCount[bits - 1]) << 1;
      nextCode[bits] = code;
    }
    const table = new Map();
    for (let sym = 0; sym < lengths.length; sym += 1) {
      const len = lengths[sym];
      if (!len) continue;
      table.set(len + ':' + nextCode[len], sym);
      nextCode[len] += 1;
    }
    return table;
  }

  function inflateRaw(data) {
    let bytePos = 0;
    let bitPos = 0;
    const out = [];

    function readBit() {
      if (bytePos >= data.length) throw new Error('inflate: 数据意外结束');
      /* Deflate 把位按字节内从低到高（LSB first）写入；Huffman 码虽然
       * 按 MSB first 解释，但读到的第一位就是码的最高位。 */
      const bit = (data[bytePos] >> bitPos) & 1;
      bitPos += 1;
      if (bitPos === 8) {
        bitPos = 0;
        bytePos += 1;
      }
      return bit;
    }

    function readBits(n) {
      /* Deflate 的附加位是按低位在前（LSB first）打包的；Huffman 码本身仍按
       * MSB first 逐位读取，所以这里必须与 decodeSym 的读法区分开。 */
      let value = 0;
      for (let i = 0; i < n; i += 1) value |= readBit() << i;
      return value;
    }

    function decodeSym(table) {
      let code = 0;
      for (let len = 1; len <= 15; len += 1) {
        code = (code << 1) | readBit();
        const sym = table.get(len + ':' + code);
        if (sym !== undefined) return sym;
      }
      throw new Error('inflate: 非法哈夫曼编码');
    }

    function fixedTables() {
      const lit = new Array(288);
      for (let i = 0; i < 144; i += 1) lit[i] = 8;
      for (let i = 144; i < 256; i += 1) lit[i] = 9;
      for (let i = 256; i < 280; i += 1) lit[i] = 7;
      for (let i = 280; i < 288; i += 1) lit[i] = 8;
      const dist = new Array(30).fill(5);
      return { lit: buildHuffman(lit), dist: buildHuffman(dist) };
    }

    let last = 0;
    let litTable = null;
    let distTable = null;

    while (!last) {
      last = readBit();
      const type = readBits(2);
      if (type === 0) {
        bitPos = 0;
        bytePos += 1;
        if (bytePos + 4 > data.length) break;
        const len = data[bytePos] | (data[bytePos + 1] << 8);
        bytePos += 4;
        for (let i = 0; i < len; i += 1) out.push(data[bytePos + i]);
        bytePos += len;
      } else if (type === 1) {
        const t = fixedTables();
        litTable = t.lit;
        distTable = t.dist;
      } else if (type === 2) {
        const hlit = readBits(5) + 257;
        const hdist = readBits(5) + 1;
        const hclen = readBits(4) + 4;
        const clLengths = new Array(19).fill(0);
        for (let i = 0; i < hclen; i += 1) clLengths[CL_ORDER[i]] = readBits(3);
        const clTable = buildHuffman(clLengths);
        const lens = [];
        while (lens.length < hlit + hdist) {
          const sym = decodeSym(clTable);
          if (sym < 16) {
            lens.push(sym);
          } else if (sym === 16) {
            const prev = lens[lens.length - 1] || 0;
            const repeat = 3 + readBits(2);
            for (let i = 0; i < repeat; i += 1) lens.push(prev);
          } else if (sym === 17) {
            const repeat = 3 + readBits(3);
            for (let i = 0; i < repeat; i += 1) lens.push(0);
          } else {
            const repeat = 11 + readBits(7);
            for (let i = 0; i < repeat; i += 1) lens.push(0);
          }
        }
        litTable = buildHuffman(lens.slice(0, hlit));
        distTable = buildHuffman(lens.slice(hlit, hlit + hdist));
      } else {
        throw new Error('inflate: 保留块类型');
      }
      if (type === 1 || type === 0) {
        // 继续读取下一个块
      }
      if (type === 0) continue;

      while (true) {
        const sym = decodeSym(litTable);
        if (sym < 256) {
          out.push(sym);
        } else if (sym === 256) {
          break;
        } else {
          const li = sym - 257;
          if (li >= LEN_BASE.length) throw new Error('inflate: 长度码越界');
          const len = LEN_BASE[li] + (LEN_EXTRA[li] ? readBits(LEN_EXTRA[li]) : 0);
          const dsym = decodeSym(distTable);
          const dist = DIST_BASE[dsym] + (DIST_EXTRA[dsym] ? readBits(DIST_EXTRA[dsym]) : 0);
          if (!dist || dist > out.length) throw new Error('inflate: 非法回溯距离');
          const start = out.length - dist;
          for (let i = 0; i < len; i += 1) out.push(out[start + i]);
        }
      }
    }
    return new Uint8Array(out);
  }

  function looksLikeZlib(data) {
    return data.length > 2 && (data[0] & 0x0f) === 8 && ((data[0] << 8) | data[1]) % 31 === 0;
  }

  async function inflateBytes(data) {
    if (typeof DecompressionStream === 'function' && typeof Blob === 'function') {
      try {
        const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate'));
        const buf = await new Response(stream).arrayBuffer();
        return new Uint8Array(buf);
      } catch (err) {
        /* 头信息异常时尝试裸 deflate，再退回自写实现 */
        try {
          const raw = looksLikeZlib(data) ? data.subarray(2) : data;
          const stream2 = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
          const buf2 = await new Response(stream2).arrayBuffer();
          return new Uint8Array(buf2);
        } catch (err2) {
          console.warn('[PdfLite] 原生解压失败，使用内置 inflate', err2);
        }
      }
    }
    return inflateRaw(looksLikeZlib(data) ? data.subarray(2) : data);
  }

  /* ---------------- 其他过滤器 ---------------- */
  function asciiHexDecode(data) {
    const out = [];
    let hi = -1;
    for (let i = 0; i < data.length; i += 1) {
      const c = data[i];
      if (c === 0x3e) break; // >
      let v = -1;
      if (c >= 48 && c <= 57) v = c - 48;
      else if (c >= 65 && c <= 70) v = c - 55;
      else if (c >= 97 && c <= 102) v = c - 87;
      if (v < 0) continue;
      if (hi < 0) hi = v;
      else {
        out.push((hi << 4) | v);
        hi = -1;
      }
    }
    if (hi >= 0) out.push(hi << 4);
    return new Uint8Array(out);
  }

  function ascii85Decode(data) {
    const out = [];
    const group = [];
    let i = 0;
    if (data[0] === 0x3c && data[1] === 0x7e) i = 2; // <~
    for (; i < data.length; i += 1) {
      const c = data[i];
      if (c === 0x7e) break; // ~
      if (c === 0x20 || c === 0x0a || c === 0x0d || c === 0x09 || c === 0x0c || c === 0x00) continue;
      if (c === 0x7a && group.length === 0) {
        out.push(0, 0, 0, 0);
        continue;
      }
      if (c < 33 || c > 117) continue;
      group.push(c - 33);
      if (group.length === 5) {
        let value = 0;
        for (let k = 0; k < 5; k += 1) value = value * 85 + group[k];
        out.push((value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255);
        group.length = 0;
      }
    }
    if (group.length > 1) {
      let value = 0;
      for (let k = 0; k < 5; k += 1) value = value * 85 + (group[k] || 0);
      const bytes = [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
      for (let k = 0; k < group.length - 1; k += 1) out.push(bytes[k]);
    }
    return new Uint8Array(out);
  }

  function runLengthDecode(data) {
    const out = [];
    let i = 0;
    while (i < data.length) {
      const len = data[i];
      i += 1;
      if (len === 128) break;
      if (len < 128) {
        for (let k = 0; k <= len && i < data.length; k += 1) out.push(data[i + k]);
        i += len + 1;
      } else {
        const byte = data[i];
        i += 1;
        for (let k = 0; k < 257 - len; k += 1) out.push(byte);
      }
    }
    return new Uint8Array(out);
  }

  /* ---------------- PDF 词法 / 语法 ---------------- */
  const WS = ' \t\r\n\f\u0000';

  function isDelimiter(ch) {
    return '()<>[]{}/%'.indexOf(ch) >= 0;
  }

  class Parser {
    constructor(src, pos) {
      this.src = src;
      this.i = pos || 0;
    }

    eof() {
      return this.i >= this.src.length;
    }

    skipWS() {
      const s = this.src;
      while (this.i < s.length) {
        const c = s[this.i];
        if (c === '%') {
          while (this.i < s.length && s[this.i] !== '\n' && s[this.i] !== '\r') this.i += 1;
        } else if (WS.indexOf(c) >= 0) {
          this.i += 1;
        } else {
          break;
        }
      }
    }

    readName() {
      const s = this.src;
      this.i += 1; // '/'
      let name = '';
      while (this.i < s.length) {
        const c = s[this.i];
        if (WS.indexOf(c) >= 0 || isDelimiter(c)) break;
        if (c === '#' && this.i + 2 < s.length) {
          const hex = s.substr(this.i + 1, 2);
          if (/^[0-9a-fA-F]{2}$/.test(hex)) {
            name += String.fromCharCode(parseInt(hex, 16));
            this.i += 3;
            continue;
          }
        }
        name += c;
        this.i += 1;
      }
      return name;
    }

    readLiteral() {
      const s = this.src;
      this.i += 1; // '('
      let depth = 1;
      let out = '';
      while (this.i < s.length) {
        const c = s[this.i];
        if (c === '\\') {
          const next = s[this.i + 1];
          this.i += 2;
          if (next === 'n') out += '\n';
          else if (next === 'r') out += '\r';
          else if (next === 't') out += '\t';
          else if (next === 'b') out += '\b';
          else if (next === 'f') out += '\f';
          else if (next === '\n' || next === '\r') {
            /* 续行 */
          } else if (next >= '0' && next <= '7') {
            let oct = next;
            for (let k = 0; k < 2; k += 1) {
              const d = s[this.i];
              if (d >= '0' && d <= '7') {
                oct += d;
                this.i += 1;
              } else break;
            }
            out += String.fromCharCode(parseInt(oct, 8) & 0xff);
          } else {
            out += next == null ? '' : next;
          }
          continue;
        }
        if (c === '(') depth += 1;
        if (c === ')') {
          depth -= 1;
          if (depth === 0) {
            this.i += 1;
            break;
          }
        }
        out += c;
        this.i += 1;
      }
      return out;
    }

    readHex() {
      const s = this.src;
      this.i += 1; // '<'
      let hex = '';
      while (this.i < s.length) {
        const c = s[this.i];
        this.i += 1;
        if (c === '>') break;
        if (/[0-9a-fA-F]/.test(c)) hex += c;
      }
      if (hex.length % 2) hex += '0';
      let out = '';
      for (let i = 0; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      return out;
    }

    readToken() {
      this.skipWS();
      if (this.eof()) return null;
      const s = this.src;
      const c = s[this.i];
      if (c === '/') return { t: 'name', v: this.readName() };
      if (c === '(') return { t: 'str', v: this.readLiteral() };
      if (c === '<') {
        if (s[this.i + 1] === '<') {
          this.i += 2;
          return { t: 'dict', v: this.readDictBody() };
        }
        return { t: 'str', v: this.readHex() };
      }
      if (c === '[') {
        this.i += 1;
        return { t: 'arr', v: this.readArrayBody() };
      }
      if (c === ']' || c === ')' || c === '>' || c === '{' || c === '}') {
        this.i += 1;
        return { t: 'op', v: c };
      }
      if (c === '>' && s[this.i + 1] === '>') {
        this.i += 2;
        return { t: 'op', v: '>>' };
      }
      const num = /^[+-]?(\d+\.?\d*|\.\d+)/.exec(s.substr(this.i, 40));
      if (num) {
        this.i += num[0].length;
        return { t: 'num', v: Number(num[0]) };
      }
      let end = this.i;
      while (end < s.length && WS.indexOf(s[end]) < 0 && !isDelimiter(s[end])) end += 1;
      if (end === this.i) {
        this.i += 1;
        return null;
      }
      const word = s.slice(this.i, end);
      this.i = end;
      return { t: 'op', v: word };
    }

    readDictBody() {
      const dict = {};
      const s = this.src;
      for (;;) {
        this.skipWS();
        if (s.substr(this.i, 2) === '>>') {
          this.i += 2;
          break;
        }
        if (this.eof()) break;
        const key = this.readToken();
        if (!key) continue;
        if (key.t !== 'name') {
          if (key.t === 'op' && key.v === 'endobj') break;
          continue;
        }
        const value = this.readValue();
        dict[key.v] = value;
      }
      return dict;
    }

    readArrayBody() {
      const arr = [];
      const s = this.src;
      for (;;) {
        this.skipWS();
        if (s[this.i] === ']') {
          this.i += 1;
          break;
        }
        if (this.eof()) break;
        const before = this.i;
        const value = this.readValue();
        if (value === undefined) {
          if (this.i === before) this.i += 1;
          continue;
        }
        arr.push(value);
      }
      return arr;
    }

    readValue() {
      const tok = this.readToken();
      if (!tok) return undefined;
      if (tok.t === 'num') {
        const save = this.i;
        const second = this.readToken();
        if (second && second.t === 'num') {
          const third = this.readToken();
          if (third && third.t === 'op' && third.v === 'R') return { ref: tok.v };
          this.i = save;
          return tok.v;
        }
        this.i = save;
        return tok.v;
      }
      if (tok.t === 'dict') return tok.v;
      if (tok.t === 'arr') return tok.v;
      if (tok.t === 'str') return tok.v;
      if (tok.t === 'name') return { name: tok.v };
      if (tok.t === 'op') {
        if (tok.v === 'true') return true;
        if (tok.v === 'false') return false;
        if (tok.v === 'null') return null;
        return { keyword: tok.v };
      }
      return undefined;
    }
  }

  function nameOf(value) {
    return value && typeof value === 'object' && typeof value.name === 'string' ? value.name : '';
  }

  function isRef(value) {
    return !!value && typeof value === 'object' && typeof value.ref === 'number';
  }

  /* ---------------- PDF 文档 ---------------- */
  class PdfDoc {
    constructor(bytes) {
      this.src = bytesToLatin1(bytes);
      this.objects = new Map();
      this.decoded = new Map();
      this.scan();
      this.expandObjectStreams();
    }

    scan() {
      const src = this.src;
      const re = /(\d+)\s+(\d+)\s+obj\b/g;
      let pos = 0;
      for (;;) {
        re.lastIndex = pos;
        const m = re.exec(src);
        if (!m) break;
        const num = Number(m[1]);
        const parser = new Parser(src, m.index + m[0].length);
        let value;
        try {
          value = parser.readValue();
        } catch (err) {
          pos = m.index + 3;
          continue;
        }
        parser.skipWS();
        let stream = null;
        if (src.substr(parser.i, 6) === 'stream') {
          let dataStart = parser.i + 6;
          if (src[dataStart] === '\r') dataStart += 1;
          if (src[dataStart] === '\n') dataStart += 1;
          let end = src.indexOf('endstream', dataStart);
          if (end < 0) end = src.length;
          let dataEnd = end;
          if (dataEnd > dataStart && src[dataEnd - 1] === '\n') dataEnd -= 1;
          if (dataEnd > dataStart && src[dataEnd - 1] === '\r') dataEnd -= 1;
          stream = { start: dataStart, end: dataEnd };
          const after = src.indexOf('endstream', end);
          pos = after >= 0 ? after + 9 : Math.min(src.length, end + 9);
        } else {
          const endObj = src.indexOf('endobj', parser.i);
          pos = endObj >= 0 ? endObj + 6 : parser.i + 1;
        }
        // 增量更新中后出现的对象覆盖之前的定义
        this.objects.set(num, { num: num, value: value, stream: stream });
      }
      this.scanCount = this.objects.size;
    }

    expandObjectStreams() {
      const self = this;
      const toAdd = [];
      this.objects.forEach(function (entry) {
        const dict = entry.value;
        if (!dict || typeof dict !== 'object' || Array.isArray(dict)) return;
        if (nameOf(dict.Type) !== 'ObjStm' || !entry.stream) return;
        const n = Number(self.resolve(dict.N)) || 0;
        const first = Number(self.resolve(dict.First)) || 0;
        if (!n) return;
        let bytes;
        try {
          bytes = self.streamBytesSync(entry);
        } catch (err) {
          console.warn('[PdfLite] 对象流解压失败', err);
          return;
        }
        if (!bytes) return;
        const text = bytesToLatin1(bytes);
        const nums = [];
        const head = text.slice(0, first);
        const headRe = /(\d+)\s+(\d+)/g;
        let hm;
        while ((hm = headRe.exec(head))) nums.push({ num: Number(hm[1]), off: Number(hm[2]) });
        for (let i = 0; i < Math.min(n, nums.length); i += 1) {
          const info = nums[i];
          const parser = new Parser(text, first + info.off);
          let value;
          try {
            value = parser.readValue();
          } catch (err) {
            continue;
          }
          toAdd.push({ num: info.num, value: value });
        }
      });
      for (let i = 0; i < toAdd.length; i += 1) {
        if (!this.objects.has(toAdd[i].num)) {
          this.objects.set(toAdd[i].num, { num: toAdd[i].num, value: toAdd[i].value, stream: null });
        }
      }
    }

    resolve(value) {
      let current = value;
      let guard = 0;
      while (isRef(current) && guard < 32) {
        const entry = this.objects.get(current.ref);
        current = entry ? entry.value : null;
        guard += 1;
      }
      return current;
    }

    dictOf(value) {
      const v = this.resolve(value);
      if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
      if (typeof v.ref === 'number' || typeof v.name === 'string') return null;
      return v;
    }

    entryOf(value) {
      if (!isRef(value)) return null;
      return this.objects.get(value.ref) || null;
    }

    async streamBytes(entry) {
      if (!entry || !entry.stream) return null;
      if (this.decoded.has(entry.num)) return this.decoded.get(entry.num);
      const promise = this.decodeEntry(entry);
      this.decoded.set(entry.num, promise);
      return promise;
    }

    streamBytesSync(entry) {
      // 对象流里的 Flate 需要同步路径：优先用自写 inflate
      if (!entry || !entry.stream) return null;
      const raw = latin1ToBytes(this.src.slice(entry.stream.start, entry.stream.end));
      const dict = this.dictOf(entry.value);
      if (!dict) return raw;
      const filter = this.resolve(dict.Filter);
      const filters = Array.isArray(filter) ? filter.map((f) => nameOf(f)) : (nameOf(filter) ? [nameOf(filter)] : []);
      let data = raw;
      for (let i = 0; i < filters.length; i += 1) {
        if (filters[i] === 'FlateDecode' || filters[i] === 'Fl') {
          data = inflateRaw(looksLikeZlib(data) ? data.subarray(2) : data);
        } else if (filters[i] === 'ASCIIHexDecode' || filters[i] === 'AHx') {
          data = asciiHexDecode(data);
        } else if (filters[i] === 'ASCII85Decode' || filters[i] === 'A85') {
          data = ascii85Decode(data);
        } else if (filters[i] === 'RunLengthDecode' || filters[i] === 'RL') {
          data = runLengthDecode(data);
        } else {
          return null; // 图片类过滤器，跳过
        }
      }
      return data;
    }

    async decodeEntry(entry) {
      if (!entry.stream) return null;
      const raw = latin1ToBytes(this.src.slice(entry.stream.start, entry.stream.end));
      const dict = this.dictOf(entry.value);
      if (!dict) return raw;
      const filter = this.resolve(dict.Filter);
      let filters = [];
      if (Array.isArray(filter)) filters = filter.map((f) => nameOf(this.resolve(f)));
      else if (nameOf(filter)) filters = [nameOf(filter)];
      let data = raw;
      for (let i = 0; i < filters.length; i += 1) {
        const name = filters[i];
        if (name === 'FlateDecode' || name === 'Fl') data = await inflateBytes(data);
        else if (name === 'ASCIIHexDecode' || name === 'AHx') data = asciiHexDecode(data);
        else if (name === 'ASCII85Decode' || name === 'A85') data = ascii85Decode(data);
        else if (name === 'RunLengthDecode' || name === 'RL') data = runLengthDecode(data);
        else return null;
      }
      return data;
    }

    async streamText(entry) {
      const bytes = await this.streamBytes(entry);
      return bytes ? bytesToLatin1(bytes) : '';
    }

    pages() {
      const self = this;
      const result = [];
      const seen = new Set();
      let catalog = null;
      this.objects.forEach(function (entry) {
        const dict = entry.value;
        if (dict && typeof dict === 'object' && !Array.isArray(dict) && nameOf(dict.Type) === 'Catalog') {
          catalog = dict;
        }
      });
      const root = catalog ? this.dictOf(catalog.Pages) : null;

      function walk(node, inherited, depth) {
        const dict = self.dictOf(node);
        if (!dict || depth > 64) return;
        const key = dict;
        if (seen.has(key)) return;
        seen.add(key);
        const resources = self.dictOf(dict.Resources) || inherited;
        const type = nameOf(dict.Type);
        if (type === 'Pages' || (!type && dict.Kids)) {
          const kids = self.resolve(dict.Kids);
          if (Array.isArray(kids)) {
            kids.forEach(function (kid) {
              walk(kid, resources, depth + 1);
            });
          }
        } else if (type === 'Page' || (!type && dict.Contents)) {
          result.push({ dict: dict, resources: resources });
        }
      }

      if (root) walk(root, null, 0);

      if (!result.length) {
        this.objects.forEach(function (entry) {
          const dict = entry.value;
          if (dict && typeof dict === 'object' && !Array.isArray(dict) && nameOf(dict.Type) === 'Page') {
            result.push({ dict: dict, resources: self.dictOf(dict.Resources) });
          }
        });
      }
      return result;
    }

    async pageContent(page) {
      const contents = this.resolve(page.dict.Contents);
      const parts = [];
      if (Array.isArray(contents)) {
        for (let i = 0; i < contents.length; i += 1) {
          const entry = this.entryOf(contents[i]);
          if (entry) parts.push(await this.streamText(entry));
        }
      } else {
        const entry = this.entryOf(page.dict.Contents);
        if (entry) parts.push(await this.streamText(entry));
      }
      return parts.join('\n');
    }

    async pageFonts(page) {
      const fonts = new Map();
      const resources = page.resources;
      if (!resources) return fonts;
      const fontDict = this.dictOf(resources.Font);
      if (!fontDict) return fonts;
      const self = this;
      const rawNames = Object.keys(fontDict);
      for (let i = 0; i < rawNames.length; i += 1) {
        const resName = rawNames[i];
        const entry = this.entryOf(fontDict[resName]);
        if (!entry) continue;
        try {
          fonts.set(resName, await this.buildFont(entry));
        } catch (err) {
          console.warn('[PdfLite] 字体解析失败：' + resName, err);
        }
      }
      // 页面直接写字体字典（少见）
      if (!fonts.size && rawNames.length === 0) return fonts;
      return fonts;
    }

    async buildFont(entry) {
      const font = this.dictOf(entry.value);
      if (!font) return { name: '', twoByte: false, map: null, codeBytes: 1, widths: new Map(), defaultWidth: 500 };
      const subtype = nameOf(this.resolve(font.Subtype));
      const twoByte = subtype === 'Type0';
      let info = {
        name: nameOf(this.resolve(font.BaseFont)),
        subtype: subtype,
        twoByte: twoByte,
        map: null,
        codeBytes: twoByte ? 2 : 1,
        widths: new Map(),
        defaultWidth: twoByte ? 1000 : 500,
        decoder: ''
      };

      /* ToUnicode */
      const toUniEntry = this.entryOf(font.ToUnicode);
      if (toUniEntry) {
        try {
          const cmapText = await this.streamText(toUniEntry);
          const parsed = parseToUnicode(cmapText);
          if (parsed.map.size) {
            info.map = parsed.map;
            info.codeBytes = parsed.codeBytes || info.codeBytes;
          }
        } catch (err) {
          console.warn('[PdfLite] ToUnicode 解析失败', err);
        }
      }

      /* 编码兜底 */
      const encRaw = this.resolve(font.Encoding);
      const encName = nameOf(encRaw);
      const encDict = this.dictOf(encRaw);
      if (!info.map) {
        if (twoByte && /(GBK|GB-EUC|GBpc|GBK2K|GBT|GB2312)/i.test(encName)) {
          info.decoder = 'gbk';
        } else if (twoByte && /(B5|Big5|CNS)/i.test(encName)) {
          info.decoder = 'big5';
        } else if (!twoByte) {
          info.map = buildSimpleEncoding(encDict);
        }
      }

      /* 字宽 */
      if (twoByte) {
        const descendants = this.resolve(font.DescendantFonts);
        const child = Array.isArray(descendants) ? this.dictOf(descendants[0]) : null;
        if (child) {
          info.defaultWidth = Number(this.resolve(child.DW)) || 1000;
          const w = this.resolve(child.W);
          if (Array.isArray(w)) {
            let i = 0;
            while (i < w.length) {
              const first = Number(this.resolve(w[i]));
              const next = this.resolve(w[i + 1]);
              if (Array.isArray(next)) {
                next.forEach(function (item, idx) {
                  info.widths.set(first + idx, Number(item) || info.defaultWidth);
                });
                i += 2;
              } else {
                const last = Number(next);
                const width = Number(this.resolve(w[i + 2]));
                for (let code = first; code <= last && code - first < 2000; code += 1) {
                  info.widths.set(code, width || info.defaultWidth);
                }
                i += 3;
              }
            }
          }
        }
      } else {
        const widths = this.resolve(font.Widths);
        const firstChar = Number(this.resolve(font.FirstChar)) || 0;
        if (Array.isArray(widths)) {
          widths.forEach(function (item, idx) {
            info.widths.set(firstChar + idx, Number(item) || 0);
          });
        }
        info.defaultWidth = Number(this.resolve(font.MissingWidth)) || 500;
      }
      return info;
    }
  }

  /* ---------------- ToUnicode / 编码表 ---------------- */
  function hexToUnits(hex) {
    const clean = String(hex || '').replace(/[^0-9a-fA-F]/g, '');
    const units = [];
    for (let i = 0; i + 3 < clean.length + 1 && i + 4 <= clean.length; i += 4) {
      units.push(parseInt(clean.substr(i, 4), 16));
    }
    if (!units.length && clean.length >= 2) units.push(parseInt(clean.substr(0, 2), 16));
    return units;
  }

  function unitsToString(units) {
    let out = '';
    for (let i = 0; i < units.length; i += 1) out += String.fromCharCode(units[i]);
    return out;
  }

  function parseToUnicode(text) {
    const map = new Map();
    let codeBytes = 2;
    const charBlock = /beginbfchar([\s\S]*?)endbfchar/g;
    let m;
    while ((m = charBlock.exec(text))) {
      const pairRe = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g;
      let p;
      while ((p = pairRe.exec(m[1]))) {
        const src = p[1];
        if (src.length % 2 === 0 && src.length >= 2) codeBytes = src.length / 2;
        map.set(src.toUpperCase(), unitsToString(hexToUnits(p[2])));
      }
    }
    const rangeBlock = /beginbfrange([\s\S]*?)endbfrange/g;
    while ((m = rangeBlock.exec(text))) {
      const entryRe = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<([0-9a-fA-F]*)>|\[([\s\S]*?)\])/g;
      let e;
      while ((e = entryRe.exec(m[1]))) {
        const startHex = e[1];
        if (startHex.length % 2 === 0) codeBytes = startHex.length / 2;
        const start = parseInt(startHex, 16);
        const end = parseInt(e[2], 16);
        if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue;
        if (e[3].charAt(0) === '[') {
          const arrRe = /<([0-9a-fA-F]*)>/g;
          let a;
          let idx = 0;
          while ((a = arrRe.exec(e[5]))) {
            map.set((start + idx).toString(16).toUpperCase().padStart(startHex.length, '0'), unitsToString(hexToUnits(a[1])));
            idx += 1;
          }
        } else {
          const base = hexToUnits(e[4]);
          for (let code = start; code <= end && code - start < 65536; code += 1) {
            const units = base.slice();
            if (units.length) units[units.length - 1] = (units[units.length - 1] + (code - start)) & 0xffff;
            map.set(code.toString(16).toUpperCase().padStart(startHex.length, '0'), unitsToString(units));
          }
        }
      }
    }
    return { map: map, codeBytes: codeBytes };
  }

  const GLYPH_NAMES = {
    space: ' ', exclam: '!', quotedbl: '"', numbersign: '#', dollar: '$', percent: '%',
    ampersand: '&', quotesingle: "'", parenleft: '(', parenright: ')', asterisk: '*',
    plus: '+', comma: ',', hyphen: '-', period: '.', slash: '/', zero: '0', one: '1',
    two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8',
    nine: '9', colon: ':', semicolon: ';', less: '<', equal: '=', greater: '>',
    question: '?', at: '@', bracketleft: '[', backslash: '\\', bracketright: ']',
    asciicircum: '^', underscore: '_', grave: '`', braceleft: '{', bar: '|',
    braceright: '}', asciitilde: '~', endash: '–', emdash: '—', bullet: '•',
    quoteleft: '‘', quoteright: '’', quotedblleft: '“', quotedblright: '”',
    ellipsis: '…', nbspace: ' ', middot: '·', degree: '°', plusminus: '±',
    multiply: '×', divide: '÷', copyright: '©', registered: '®', trademark: '™'
  };

  function glyphToUnicode(name) {
    if (!name) return '';
    if (GLYPH_NAMES[name]) return GLYPH_NAMES[name];
    if (name.length === 1) return name;
    let m = /^uni([0-9A-Fa-f]{4})$/.exec(name);
    if (m) return String.fromCharCode(parseInt(m[1], 16));
    m = /^u([0-9A-Fa-f]{4,6})$/.exec(name);
    if (m) return String.fromCodePoint(parseInt(m[1], 16));
    m = /^c(\d{1,3})$/.exec(name);
    if (m) return String.fromCharCode(parseInt(m[1], 10));
    return '';
  }

  function winAnsiChar(code) {
    if (code >= 32 && code <= 126) return String.fromCharCode(code);
    if (code === 9 || code === 10 || code === 13) return ' ';
    const special = {
      0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡',
      0x88: 'ˆ', 0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ', 0x8e: 'Ž', 0x91: '‘',
      0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—', 0x98: '˜',
      0x99: '™', 0x9a: 'š', 0x9b: '›', 0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ'
    };
    if (special[code]) return special[code];
    return String.fromCharCode(code);
  }

  function buildSimpleEncoding(encDict) {
    const map = new Map();
    for (let code = 0; code < 256; code += 1) map.set(bytesToHexKey(String.fromCharCode(code), 0, 1), winAnsiChar(code));
    if (encDict && Array.isArray(encDict.Differences)) {
      let code = 0;
      encDict.Differences.forEach(function (item) {
        if (typeof item === 'number') {
          code = item;
          return;
        }
        const name = nameOf(item);
        if (!name) return;
        const ch = glyphToUnicode(name);
        if (ch && code >= 0 && code < 256) map.set(bytesToHexKey(String.fromCharCode(code), 0, 1), ch);
        code += 1;
      });
    }
    return map;
  }

  /* ---------------- 内容流解析 ---------------- */
  function multiplyMatrix(a, b) {
    return [
      a[0] * b[0] + a[1] * b[2],
      a[0] * b[1] + a[1] * b[3],
      a[2] * b[0] + a[3] * b[2],
      a[2] * b[1] + a[3] * b[3],
      a[4] * b[0] + a[5] * b[2] + b[4],
      a[4] * b[1] + a[5] * b[3] + b[5]
    ];
  }

  function decodeShowText(bytesStr, font) {
    const glyphs = [];
    if (!font) return glyphs;
    if (font.map) {
      const step = font.codeBytes || 1;
      for (let i = 0; i + step <= bytesStr.length; i += step) {
        const key = bytesToHexKey(bytesStr, i, step);
        const ch = font.map.get(key);
        const code = parseInt(key, 16);
        let width = font.widths.get(code);
        if (!width) width = font.defaultWidth || (step === 2 ? 1000 : 500);
        glyphs.push({ ch: ch || '', code: code, width: width });
      }
      return glyphs;
    }
    if (font.decoder) {
      try {
        const decoder = new TextDecoder(font.decoder);
        const text = decoder.decode(latin1ToBytes(bytesStr));
        for (let i = 0; i < text.length; i += 1) {
          const ch = text[i];
          glyphs.push({ ch: ch, code: text.charCodeAt(i), width: ch.charCodeAt(0) > 0x2e80 ? 1000 : 500 });
        }
      } catch (err) {
        console.warn('[PdfLite] ' + font.decoder + ' 解码失败', err);
      }
      return glyphs;
    }
    return glyphs;
  }

  function extractPageItems(content, fonts) {
    const parser = new Parser(content, 0);
    const items = [];
    let ctm = [1, 0, 0, 1, 0, 0];
    let ctmStack = [];
    let tm = [1, 0, 0, 1, 0, 0];
    let tlm = [1, 0, 0, 1, 0, 0];
    let font = null;
    let fontSize = 0;
    let charSpace = 0;
    let wordSpace = 0;
    let hScale = 1;
    let leading = 0;
    let rise = 0;
    const operands = [];

    function resetText() {
      tm = [1, 0, 0, 1, 0, 0];
      tlm = [1, 0, 0, 1, 0, 0];
    }

    function moveText(tx, ty) {
      tlm = multiplyMatrix([1, 0, 0, 1, tx, ty], tlm);
      tm = tlm.slice();
    }

    function emit(bytesStr) {
      if (!font || !bytesStr) return;
      const glyphs = decodeShowText(bytesStr, font);
      if (!glyphs.length) return;
      let text = '';
      let advance = 0;
      for (let i = 0; i < glyphs.length; i += 1) {
        const g = glyphs[i];
        text += g.ch;
        let step = (g.width / 1000) * fontSize;
        if (g.ch === ' ' || g.code === 32) step += wordSpace;
        step += charSpace;
        advance += step * hScale;
      }
      const matrix = multiplyMatrix(tm, ctm);
      const scale = Math.hypot(matrix[2], matrix[3]) || Math.abs(matrix[0]) || 1;
      const size = Math.abs(fontSize) * scale;
      const y = matrix[5] + rise * (matrix[1] || 0);
      const x = matrix[4] + rise * (matrix[0] || 0);
      if (text.trim()) items.push({ text: text, x: x, y: y, w: Math.abs(advance) * scale, size: size, font: font.name });
      // 推进文字矩阵
      tm[4] += advance * tm[0];
      tm[5] += advance * tm[1];
    }

    function applyOp(op) {
      switch (op) {
        case 'BT':
          resetText();
          break;
        case 'ET':
          break;
        case 'Tf':
          if (operands.length >= 2) {
            const name = nameOf(operands[operands.length - 2]);
            fontSize = Number(operands[operands.length - 1]) || 0;
            font = fonts.get(name) || null;
          }
          break;
        case 'Td':
          if (operands.length >= 2) moveText(Number(operands[0]) || 0, Number(operands[1]) || 0);
          break;
        case 'TD':
          if (operands.length >= 2) {
            const tx = Number(operands[0]) || 0;
            const ty = Number(operands[1]) || 0;
            leading = -ty;
            moveText(tx, ty);
          }
          break;
        case 'Tm':
          if (operands.length >= 6) {
            tm = operands.slice(0, 6).map(function (n) { return Number(n) || 0; });
            tlm = tm.slice();
          }
          break;
        case 'T*':
          moveText(0, -leading);
          break;
        case 'TL':
          leading = Number(operands[0]) || 0;
          break;
        case 'Tc':
          charSpace = Number(operands[0]) || 0;
          break;
        case 'Tw':
          wordSpace = Number(operands[0]) || 0;
          break;
        case 'Tz':
          hScale = (Number(operands[0]) || 100) / 100;
          break;
        case 'Ts':
          rise = Number(operands[0]) || 0;
          break;
        case 'Tj':
          emit(typeof operands[0] === 'string' ? operands[0] : '');
          break;
        case "'":
          moveText(0, -leading);
          emit(typeof operands[0] === 'string' ? operands[0] : '');
          break;
        case '"':
          wordSpace = Number(operands[0]) || wordSpace;
          charSpace = Number(operands[1]) || charSpace;
          moveText(0, -leading);
          emit(typeof operands[2] === 'string' ? operands[2] : '');
          break;
        case 'TJ':
          if (Array.isArray(operands[0])) {
            for (let i = 0; i < operands[0].length; i += 1) {
              const part = operands[0][i];
              if (typeof part === 'string') emit(part);
              else if (typeof part === 'number') {
                const shift = (-part / 1000) * fontSize * hScale;
                tm[4] += shift * tm[0];
                tm[5] += shift * tm[1];
              }
            }
          }
          break;
        case 'cm':
          if (operands.length >= 6) {
            ctm = multiplyMatrix(operands.slice(0, 6).map(function (n) { return Number(n) || 0; }), ctm);
          }
          break;
        case 'q':
          ctmStack.push(ctm.slice());
          break;
        case 'Q':
          if (ctmStack.length) ctm = ctmStack.pop();
          break;
        case 'BI': {
          // 跳过内联图片二进制数据
          const idIndex = content.indexOf('ID', parser.i);
          if (idIndex >= 0) {
            const eiIndex = content.indexOf('EI', idIndex + 3);
            parser.i = eiIndex >= 0 ? eiIndex + 2 : content.length;
          }
          break;
        }
        default:
          break;
      }
    }

    for (;;) {
      const tok = parser.readToken();
      if (!tok) break;
      if (tok.t === 'op') {
        applyOp(tok.v);
        operands.length = 0;
      } else if (tok.t === 'dict') {
        operands.push(tok.v);
      } else if (tok.t === 'arr') {
        operands.push(tok.v);
      } else if (tok.t === 'str') {
        operands.push(tok.v);
      } else if (tok.t === 'name') {
        operands.push({ name: tok.v });
      } else {
        operands.push(tok.v);
      }
      if (operands.length > 64) operands.shift();
    }
    return items;
  }

  /* ---------------- 行聚类 ---------------- */
  function median(values) {
    if (!values.length) return 0;
    const sorted = values.slice().sort(function (a, b) { return a - b; });
    return sorted[Math.floor(sorted.length / 2)];
  }

  function groupRows(items, tolerance) {
    const tol = tolerance || 3;
    const sorted = items.slice().sort(function (a, b) {
      return b.y - a.y || a.x - b.x;
    });
    const rows = [];
    let current = null;
    sorted.forEach(function (item) {
      if (!current || Math.abs(item.y - current.y) > tol) {
        current = { y: item.y, items: [item] };
        rows.push(current);
      } else {
        current.items.push(item);
        current.y = (current.y * (current.items.length - 1) + item.y) / current.items.length;
      }
    });
    rows.forEach(function (row) {
      row.items.sort(function (a, b) { return a.x - b.x; });
    });
    return rows;
  }

  function rowText(row) {
    let text = '';
    let prevEnd = null;
    row.items.forEach(function (item) {
      if (prevEnd !== null) {
        const gap = item.x - prevEnd;
        if (gap > Math.max(1.2, (item.size || 10) * 0.25) && !/\s$/.test(text) && !/^\s/.test(item.text)) text += ' ';
      }
      text += item.text;
      prevEnd = item.x + (item.w || 0);
    });
    return text.replace(/\s+/g, ' ').trim();
  }

  function itemsToLines(items) {
    const sizes = items.map(function (i) { return i.size; }).filter(function (s) { return s > 2 && s < 100; });
    const tol = Math.max(2.5, median(sizes) * 0.42 || 2.5);
    const rows = groupRows(items, tol);
    return rows.map(function (row) {
      return { y: row.y, text: rowText(row), items: row.items };
    }).filter(function (line) { return line.text; });
  }

  /* ---------------- 完整提取 ---------------- */
  async function extractPdf(arrayBuffer) {
    const bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
    if (!bytes.length) throw new Error('PDF 内容为空');
    let header = '';
    for (let i = 0; i < Math.min(8, bytes.length); i += 1) header += String.fromCharCode(bytes[i]);
    if (header.indexOf('%PDF') < 0) {
      throw new Error('这不是 PDF 文件（缺少 %PDF 文件头）');
    }

    const doc = new PdfDoc(bytes);
    if (!doc.objects.size) throw new Error('PDF 结构异常，未找到任何对象');

    let pageList = doc.pages();
    if (!pageList.length) throw new Error('PDF 中没有找到页面');

    const pages = [];
    let allText = '';
    let itemCount = 0;

    for (let p = 0; p < pageList.length; p += 1) {
      const page = pageList[p];
      let content = '';
      try {
        content = await doc.pageContent(page);
      } catch (err) {
        console.warn('[PdfLite] 第 ' + (p + 1) + ' 页内容读取失败', err);
      }
      let fonts = new Map();
      try {
        fonts = await doc.pageFonts(page);
      } catch (err) {
        console.warn('[PdfLite] 第 ' + (p + 1) + ' 页字体读取失败', err);
      }
      const items = content ? extractPageItems(content, fonts) : [];
      itemCount += items.length;
      const lines = itemsToLines(items);
      const text = lines.map(function (l) { return l.text; }).join('\n');
      pages.push({ index: p + 1, items: items, lines: lines, text: text });
      allText += (allText ? '\n\n' : '') + text;
    }

    return {
      version: VERSION,
      pageCount: pageList.length,
      objectCount: doc.objects.size,
      itemCount: itemCount,
      pages: pages,
      text: allText,
      hasText: itemCount > 0
    };
  }

  /* ---------------- 课表版面识别 ---------------- */
  const DAYS_CN = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7, 七: 7 };
  const DAYS_EN = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };

  function dayFromText(text) {
    const s = String(text || '');
    let m = /(?:周|星期|礼拜)\s*([一二三四五六日天])/.exec(s);
    if (m) return DAYS_CN[m[1]] || 0;
    m = /^(?:周|星期|礼拜)?\s*([一二三四五六日天])$/.exec(s.trim());
    if (m) return DAYS_CN[m[1]] || 0;
    m = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(mon|tue|wed|thu|fri|sat|sun)/i.exec(s);
    if (m) {
      const word = (m[1] || m[2] || '').toLowerCase();
      return DAYS_EN[word.slice(0, 3)] || 0;
    }
    if (/^[1-7]$/.test(s.trim())) return Number(s.trim());
    return 0;
  }

  function sectionRange(text) {
    const s = String(text || '').replace(/[—－至到~]/g, '-');
    /* 时间列（08:00-09:40）和「1-16周」不是节次，必须先排除，
     * 否则会被数字区间规则误读成 1-9 节。 */
    if (/\d{1,2}:\d{2}/.test(s) && !/节/.test(s)) return [0, 0];
    if (/周/.test(s) && !/节/.test(s)) return [0, 0];
    let m = /(?:第)?\s*(\d{1,2})\s*-\s*(\d{1,2})\s*节?/.exec(s);
    if (m) {
      const rawB = Number(m[2]);
      if (rawB > 12 && !/节/.test(s)) return [0, 0];
      const a = Math.max(1, Math.min(12, Number(m[1])));
      const b = Math.max(a, Math.min(12, rawB));
      return [a, b];
    }
    m = /(?:第)?\s*(\d{1,2})\s*节/.exec(s);
    if (m) {
      const a = Math.max(1, Math.min(12, Number(m[1])));
      return [a, a];
    }
    m = /^\s*(\d{1,2})\s*$/.exec(s);
    if (m) {
      const a = Math.max(1, Math.min(12, Number(m[1])));
      return [a, a];
    }
    return [0, 0];
  }

  /**
   * 从文本片段中识别课表表格，返回 { cells, days, warning }
   * 每个 cell: { day, start, end, lines }
   */
  function detectTable(items) {
    const usable = items.filter(function (item) {
      return item.text && item.text.trim();
    });
    if (!usable.length) return { cells: [], warning: '没有文字层' };

    const sizes = usable.map(function (i) { return i.size; }).filter(function (s) { return s > 2 && s < 100; });
    const tol = Math.max(2.5, median(sizes) * 0.42 || 2.5);
    const rows = groupRows(usable, tol);

    /* 1) 找表头：包含 >=3 个星期 */
    let header = null;
    let headerIdx = -1;
    for (let i = 0; i < rows.length; i += 1) {
      const days = new Set();
      rows[i].items.forEach(function (item) {
        const d = dayFromText(item.text);
        if (d) days.add(d);
      });
      if (days.size >= 3) {
        header = rows[i];
        headerIdx = i;
        break;
      }
    }
    if (!header) return { cells: [], warning: '未识别到「星期」表头' };

    const dayCols = new Map();
    header.items.forEach(function (item) {
      const d = dayFromText(item.text);
      if (!d) return;
      const center = item.x + (item.w || 0) / 2;
      if (!dayCols.has(d)) dayCols.set(d, []);
      dayCols.get(d).push(center);
    });
    const cols = Array.from(dayCols.keys()).sort(function (a, b) { return a - b; }).map(function (day) {
      const list = dayCols.get(day);
      const center = list.reduce(function (sum, v) { return sum + v; }, 0) / list.length;
      return { day: day, center: center };
    });
    if (cols.length < 3) return { cells: [], warning: '星期表头不完整' };

    /* 列边界：相邻列中心的中点；第一列左侧还要排除「节次/时间」列，
     * 否则节次文字会被误算进星期一的课程单元格。表头文字通常居中，
     * 而单元格文字左对齐，所以不能直接用表头中心减固定值。 */
    const colWidth = cols.length > 1 ? cols[1].center - cols[0].center : 86;
    const firstDayLeft = cols[0].center - colWidth / 2;
    let firstColRight = cols[0].center - colWidth * 0.42;
    const headerBeforeFirstDay = header.items.filter(function (item) {
      return item.x + (item.w || 0) / 2 < cols[0].center;
    });
    if (headerBeforeFirstDay.length) {
      const headerRight = headerBeforeFirstDay.reduce(function (max, item) {
        return Math.max(max, item.x + (item.w || 0));
      }, 0);
      if (headerRight > 0 && headerRight < firstDayLeft) {
        firstColRight = (headerRight + firstDayLeft) / 2;
      }
    }
    const boundaries = [firstColRight];
    for (let i = 1; i < cols.length; i += 1) {
      boundaries.push((cols[i - 1].center + cols[i].center) / 2);
    }
    boundaries.push(Infinity);
    const firstColEdge = firstColRight;

    /* 2) 找节次行（表头下方，第一列）。只保留能解析出明确节次的行，
     * 例如「第1-2节」；同一单元格里的时间行「08:00-09:40」不单独成行。 */
    const sectionRows = [];
    for (let i = headerIdx + 1; i < rows.length; i += 1) {
      const cells = rows[i].items.filter(function (item) { return item.x < firstColRight; });
      if (!cells.length) continue;
      const text = rowText({ items: cells });
      const range = sectionRange(text);
      if (!range[0]) continue;
      sectionRows.push({ y: rows[i].y, text: text, range: range, index: i });
    }

    const autoSections = sectionRows.length < 2;
    let bands = [];
    if (autoSections) {
      // 没有清晰节次列：按文字行之间的垂直间距分组，避免把同一个单元格里的
      // 课程名、教师、教室拆成四个「节次」。
      const dataRows = rows.slice(headerIdx + 1).filter(function (row) {
        return row.items.some(function (item) { return item.x >= firstColRight; });
      });
      if (!dataRows.length) return { cells: [], warning: '表头下方没有内容' };
      const fontSizes2 = usable.map(function (item) { return item.size; }).filter(function (s) { return s > 2 && s < 100; });
      const lineH2 = Math.max(7, (median(fontSizes2) || 9) * 1.25);
      const groups = [];
      let group = [];
      dataRows.forEach(function (row) {
        if (group.length && group[group.length - 1].y - row.y > lineH2 * 1.6) {
          groups.push(group);
          group = [];
        }
        group.push(row);
      });
      if (group.length) groups.push(group);
      bands = groups.map(function (rowsInBand, idx) {
        return {
          top: rowsInBand[0].y + lineH2,
          bottom: rowsInBand[rowsInBand.length - 1].y - lineH2,
          start: idx + 1,
          end: idx + 1
        };
      });
    } else {
      /* 3) 行区间：每个节次标签是单元格顶行，一直延伸到下一个节次标签。
       * 用字体高度的一半做微调，避免把下一节的标签收进上一节。 */
      const fontSizes = usable.map(function (item) { return item.size; }).filter(function (s) { return s > 2 && s < 100; });
      const lineH = Math.max(6, (median(fontSizes) || 9) * 0.85);
      const sorted = sectionRows.slice().sort(function (a, b) { return b.y - a.y; });
      const minY = usable.reduce(function (min, item) { return Math.min(min, item.y); }, sorted[sorted.length - 1].y);
      for (let i = 0; i < sorted.length; i += 1) {
        const top = sorted[i].y + lineH * 1.8;
        const bottom = i < sorted.length - 1 ? sorted[i + 1].y + lineH * 1.8 : minY - lineH;
        bands.push({ top: top, bottom: bottom, start: sorted[i].range[0], end: sorted[i].range[1] });
      }
    }

    /* 4) 把片段分配到单元格 */
    const cells = [];
    for (let b = 0; b < bands.length; b += 1) {
      const band = bands[b];
      for (let c = 0; c < cols.length; c += 1) {
        const left = boundaries[c];
        const right = boundaries[c + 1];
        const picked = usable.filter(function (item) {
          const center = item.x + (item.w || 0) / 2;
          return item.y <= band.top && item.y > band.bottom && center >= left && center < right;
        });
        if (!picked.length) continue;
        const lines = itemsToLines(picked).map(function (line) { return line.text; });
        const text = lines.join(' ').trim();
        if (!text) continue;
        if (dayFromText(text) && lines.length === 1) continue; // 表头重复
        if (/^(节次|时间|星期|课程表|备注|上午|下午|晚上|中午|休息)$/.test(text)) continue;
        cells.push({
          day: cols[c].day,
          start: band.start,
          end: band.end,
          lines: lines,
          text: text,
          y: (band.top + band.bottom) / 2,
          x: cols[c].center
        });
      }
    }

    return { cells: cells, days: cols.map(function (c) { return c.day; }), warning: autoSections ? '节次列未识别，已按行顺序推断' : '' };
  }

  /* ---------------- 对外接口 ---------------- */
  global.PdfLite = {
    version: VERSION,
    extract: extractPdf,
    detectTable: detectTable,
    itemsToLines: itemsToLines,
    dayFromText: dayFromText,
    sectionRange: sectionRange,
    inflateRaw: inflateRaw
  };
})(typeof window !== 'undefined' ? window : this);
