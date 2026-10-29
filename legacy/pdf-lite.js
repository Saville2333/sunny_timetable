function _regeneratorValues(e) { if (null != e) { var t = e["function" == typeof Symbol && Symbol.iterator || "@@iterator"], r = 0; if (t) return t.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) return { next: function next() { return e && r >= e.length && (e = void 0), { value: e && e[r++], done: !e }; } }; } throw new TypeError(_typeof(e) + " is not iterable"); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, e) { if ("object" != _typeof(t) || !t) return t; var r; if ("undefined" != typeof Symbol && void 0 !== (r = t[Symbol.toPrimitive])) { var i = r.call(t, e || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === e ? String : Number)(t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
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

  var VERSION = '1.0.0';

  /* ---------------- 字节与字符串 ---------------- */
  function bytesToLatin1(u8) {
    var CHUNK = 0x8000;
    var parts = [];
    for (var i = 0; i < u8.length; i += CHUNK) {
      parts.push(String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK)));
    }
    return parts.join('');
  }
  function latin1ToBytes(str) {
    var out = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i += 1) out[i] = str.charCodeAt(i) & 0xff;
    return out;
  }
  function bytesToHexKey(str, start, count) {
    var key = '';
    for (var i = 0; i < count; i += 1) {
      var b = str.charCodeAt(start + i) & 0xff;
      key += (b < 16 ? '0' : '') + b.toString(16).toUpperCase();
    }
    return key;
  }

  /* ---------------- 兜底 inflate（老 WebView 没有 DecompressionStream） ---------------- */
  var LEN_BASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
  var LEN_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
  var DIST_BASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
  var DIST_EXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
  var CL_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
  function buildHuffman(lengths) {
    var blCount = new Array(16).fill(0);
    for (var i = 0; i < lengths.length; i += 1) {
      var len = lengths[i];
      if (len) blCount[len] += 1;
    }
    var nextCode = new Array(16).fill(0);
    var code = 0;
    for (var bits = 1; bits <= 15; bits += 1) {
      code = code + blCount[bits - 1] << 1;
      nextCode[bits] = code;
    }
    var table = new Map();
    for (var sym = 0; sym < lengths.length; sym += 1) {
      var _len = lengths[sym];
      if (!_len) continue;
      table.set(_len + ':' + nextCode[_len], sym);
      nextCode[_len] += 1;
    }
    return table;
  }
  function inflateRaw(data) {
    var bytePos = 0;
    var bitPos = 0;
    var out = [];
    function readBit() {
      if (bytePos >= data.length) throw new Error('inflate: 数据意外结束');
      /* Deflate 把位按字节内从低到高（LSB first）写入；Huffman 码虽然
       * 按 MSB first 解释，但读到的第一位就是码的最高位。 */
      var bit = data[bytePos] >> bitPos & 1;
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
      var value = 0;
      for (var i = 0; i < n; i += 1) value |= readBit() << i;
      return value;
    }
    function decodeSym(table) {
      var code = 0;
      for (var len = 1; len <= 15; len += 1) {
        code = code << 1 | readBit();
        var sym = table.get(len + ':' + code);
        if (sym !== undefined) return sym;
      }
      throw new Error('inflate: 非法哈夫曼编码');
    }
    function fixedTables() {
      var lit = new Array(288);
      for (var i = 0; i < 144; i += 1) lit[i] = 8;
      for (var _i = 144; _i < 256; _i += 1) lit[_i] = 9;
      for (var _i2 = 256; _i2 < 280; _i2 += 1) lit[_i2] = 7;
      for (var _i3 = 280; _i3 < 288; _i3 += 1) lit[_i3] = 8;
      var dist = new Array(30).fill(5);
      return {
        lit: buildHuffman(lit),
        dist: buildHuffman(dist)
      };
    }
    var last = 0;
    var litTable = null;
    var distTable = null;
    while (!last) {
      last = readBit();
      var type = readBits(2);
      if (type === 0) {
        bitPos = 0;
        bytePos += 1;
        if (bytePos + 4 > data.length) break;
        var len = data[bytePos] | data[bytePos + 1] << 8;
        bytePos += 4;
        for (var i = 0; i < len; i += 1) out.push(data[bytePos + i]);
        bytePos += len;
      } else if (type === 1) {
        var t = fixedTables();
        litTable = t.lit;
        distTable = t.dist;
      } else if (type === 2) {
        var hlit = readBits(5) + 257;
        var hdist = readBits(5) + 1;
        var hclen = readBits(4) + 4;
        var clLengths = new Array(19).fill(0);
        for (var _i4 = 0; _i4 < hclen; _i4 += 1) clLengths[CL_ORDER[_i4]] = readBits(3);
        var clTable = buildHuffman(clLengths);
        var lens = [];
        while (lens.length < hlit + hdist) {
          var sym = decodeSym(clTable);
          if (sym < 16) {
            lens.push(sym);
          } else if (sym === 16) {
            var prev = lens[lens.length - 1] || 0;
            var repeat = 3 + readBits(2);
            for (var _i5 = 0; _i5 < repeat; _i5 += 1) lens.push(prev);
          } else if (sym === 17) {
            var _repeat = 3 + readBits(3);
            for (var _i6 = 0; _i6 < _repeat; _i6 += 1) lens.push(0);
          } else {
            var _repeat2 = 11 + readBits(7);
            for (var _i7 = 0; _i7 < _repeat2; _i7 += 1) lens.push(0);
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
        var _sym = decodeSym(litTable);
        if (_sym < 256) {
          out.push(_sym);
        } else if (_sym === 256) {
          break;
        } else {
          var li = _sym - 257;
          if (li >= LEN_BASE.length) throw new Error('inflate: 长度码越界');
          var _len2 = LEN_BASE[li] + (LEN_EXTRA[li] ? readBits(LEN_EXTRA[li]) : 0);
          var dsym = decodeSym(distTable);
          var dist = DIST_BASE[dsym] + (DIST_EXTRA[dsym] ? readBits(DIST_EXTRA[dsym]) : 0);
          if (!dist || dist > out.length) throw new Error('inflate: 非法回溯距离');
          var start = out.length - dist;
          for (var _i8 = 0; _i8 < _len2; _i8 += 1) out.push(out[start + _i8]);
        }
      }
    }
    return new Uint8Array(out);
  }
  function looksLikeZlib(data) {
    return data.length > 2 && (data[0] & 0x0f) === 8 && (data[0] << 8 | data[1]) % 31 === 0;
  }
  function inflateBytes(_x) {
    return _inflateBytes.apply(this, arguments);
  }
  /* ---------------- 其他过滤器 ---------------- */
  function _inflateBytes() {
    _inflateBytes = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7(data) {
      var stream, buf, raw, stream2, buf2, _t7, _t8;
      return _regenerator().w(function (_context8) {
        while (1) switch (_context8.p = _context8.n) {
          case 0:
            if (!(typeof DecompressionStream === 'function' && typeof Blob === 'function')) {
              _context8.n = 7;
              break;
            }
            _context8.p = 1;
            stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate'));
            _context8.n = 2;
            return new Response(stream).arrayBuffer();
          case 2:
            buf = _context8.v;
            return _context8.a(2, new Uint8Array(buf));
          case 3:
            _context8.p = 3;
            _t7 = _context8.v;
            _context8.p = 4;
            raw = looksLikeZlib(data) ? data.subarray(2) : data;
            stream2 = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
            _context8.n = 5;
            return new Response(stream2).arrayBuffer();
          case 5:
            buf2 = _context8.v;
            return _context8.a(2, new Uint8Array(buf2));
          case 6:
            _context8.p = 6;
            _t8 = _context8.v;
            console.warn('[PdfLite] 原生解压失败，使用内置 inflate', _t8);
          case 7:
            return _context8.a(2, inflateRaw(looksLikeZlib(data) ? data.subarray(2) : data));
        }
      }, _callee7, null, [[4, 6], [1, 3]]);
    }));
    return _inflateBytes.apply(this, arguments);
  }
  function asciiHexDecode(data) {
    var out = [];
    var hi = -1;
    for (var i = 0; i < data.length; i += 1) {
      var c = data[i];
      if (c === 0x3e) break; // >
      var v = -1;
      if (c >= 48 && c <= 57) v = c - 48;else if (c >= 65 && c <= 70) v = c - 55;else if (c >= 97 && c <= 102) v = c - 87;
      if (v < 0) continue;
      if (hi < 0) hi = v;else {
        out.push(hi << 4 | v);
        hi = -1;
      }
    }
    if (hi >= 0) out.push(hi << 4);
    return new Uint8Array(out);
  }
  function ascii85Decode(data) {
    var out = [];
    var group = [];
    var i = 0;
    if (data[0] === 0x3c && data[1] === 0x7e) i = 2; // <~
    for (; i < data.length; i += 1) {
      var c = data[i];
      if (c === 0x7e) break; // ~
      if (c === 0x20 || c === 0x0a || c === 0x0d || c === 0x09 || c === 0x0c || c === 0x00) continue;
      if (c === 0x7a && group.length === 0) {
        out.push(0, 0, 0, 0);
        continue;
      }
      if (c < 33 || c > 117) continue;
      group.push(c - 33);
      if (group.length === 5) {
        var value = 0;
        for (var k = 0; k < 5; k += 1) value = value * 85 + group[k];
        out.push(value >>> 24 & 255, value >>> 16 & 255, value >>> 8 & 255, value & 255);
        group.length = 0;
      }
    }
    if (group.length > 1) {
      var _value = 0;
      for (var _k = 0; _k < 5; _k += 1) _value = _value * 85 + (group[_k] || 0);
      var bytes = [_value >>> 24 & 255, _value >>> 16 & 255, _value >>> 8 & 255, _value & 255];
      for (var _k2 = 0; _k2 < group.length - 1; _k2 += 1) out.push(bytes[_k2]);
    }
    return new Uint8Array(out);
  }
  function runLengthDecode(data) {
    var out = [];
    var i = 0;
    while (i < data.length) {
      var len = data[i];
      i += 1;
      if (len === 128) break;
      if (len < 128) {
        for (var k = 0; k <= len && i < data.length; k += 1) out.push(data[i + k]);
        i += len + 1;
      } else {
        var byte = data[i];
        i += 1;
        for (var _k3 = 0; _k3 < 257 - len; _k3 += 1) out.push(byte);
      }
    }
    return new Uint8Array(out);
  }

  /* ---------------- PDF 词法 / 语法 ---------------- */
  var WS = " \t\r\n\f\0";
  function isDelimiter(ch) {
    return '()<>[]{}/%'.indexOf(ch) >= 0;
  }
  var Parser = /*#__PURE__*/function () {
    function Parser(src, pos) {
      _classCallCheck(this, Parser);
      this.src = src;
      this.i = pos || 0;
    }
    return _createClass(Parser, [{
      key: "eof",
      value: function eof() {
        return this.i >= this.src.length;
      }
    }, {
      key: "skipWS",
      value: function skipWS() {
        var s = this.src;
        while (this.i < s.length) {
          var c = s[this.i];
          if (c === '%') {
            while (this.i < s.length && s[this.i] !== '\n' && s[this.i] !== '\r') this.i += 1;
          } else if (WS.indexOf(c) >= 0) {
            this.i += 1;
          } else {
            break;
          }
        }
      }
    }, {
      key: "readName",
      value: function readName() {
        var s = this.src;
        this.i += 1; // '/'
        var name = '';
        while (this.i < s.length) {
          var c = s[this.i];
          if (WS.indexOf(c) >= 0 || isDelimiter(c)) break;
          if (c === '#' && this.i + 2 < s.length) {
            var hex = s.substr(this.i + 1, 2);
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
    }, {
      key: "readLiteral",
      value: function readLiteral() {
        var s = this.src;
        this.i += 1; // '('
        var depth = 1;
        var out = '';
        while (this.i < s.length) {
          var c = s[this.i];
          if (c === '\\') {
            var next = s[this.i + 1];
            this.i += 2;
            if (next === 'n') out += '\n';else if (next === 'r') out += '\r';else if (next === 't') out += '\t';else if (next === 'b') out += '\b';else if (next === 'f') out += '\f';else if (next === '\n' || next === '\r') {
              /* 续行 */
            } else if (next >= '0' && next <= '7') {
              var oct = next;
              for (var k = 0; k < 2; k += 1) {
                var d = s[this.i];
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
    }, {
      key: "readHex",
      value: function readHex() {
        var s = this.src;
        this.i += 1; // '<'
        var hex = '';
        while (this.i < s.length) {
          var c = s[this.i];
          this.i += 1;
          if (c === '>') break;
          if (/[0-9a-fA-F]/.test(c)) hex += c;
        }
        if (hex.length % 2) hex += '0';
        var out = '';
        for (var i = 0; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        return out;
      }
    }, {
      key: "readToken",
      value: function readToken() {
        this.skipWS();
        if (this.eof()) return null;
        var s = this.src;
        var c = s[this.i];
        if (c === '/') return {
          t: 'name',
          v: this.readName()
        };
        if (c === '(') return {
          t: 'str',
          v: this.readLiteral()
        };
        if (c === '<') {
          if (s[this.i + 1] === '<') {
            this.i += 2;
            return {
              t: 'dict',
              v: this.readDictBody()
            };
          }
          return {
            t: 'str',
            v: this.readHex()
          };
        }
        if (c === '[') {
          this.i += 1;
          return {
            t: 'arr',
            v: this.readArrayBody()
          };
        }
        if (c === ']' || c === ')' || c === '>' || c === '{' || c === '}') {
          this.i += 1;
          return {
            t: 'op',
            v: c
          };
        }
        if (c === '>' && s[this.i + 1] === '>') {
          this.i += 2;
          return {
            t: 'op',
            v: '>>'
          };
        }
        var num = /^[+-]?(\d+\.?\d*|\.\d+)/.exec(s.substr(this.i, 40));
        if (num) {
          this.i += num[0].length;
          return {
            t: 'num',
            v: Number(num[0])
          };
        }
        var end = this.i;
        while (end < s.length && WS.indexOf(s[end]) < 0 && !isDelimiter(s[end])) end += 1;
        if (end === this.i) {
          this.i += 1;
          return null;
        }
        var word = s.slice(this.i, end);
        this.i = end;
        return {
          t: 'op',
          v: word
        };
      }
    }, {
      key: "readDictBody",
      value: function readDictBody() {
        var dict = {};
        var s = this.src;
        for (;;) {
          this.skipWS();
          if (s.substr(this.i, 2) === '>>') {
            this.i += 2;
            break;
          }
          if (this.eof()) break;
          var key = this.readToken();
          if (!key) continue;
          if (key.t !== 'name') {
            if (key.t === 'op' && key.v === 'endobj') break;
            continue;
          }
          var value = this.readValue();
          dict[key.v] = value;
        }
        return dict;
      }
    }, {
      key: "readArrayBody",
      value: function readArrayBody() {
        var arr = [];
        var s = this.src;
        for (;;) {
          this.skipWS();
          if (s[this.i] === ']') {
            this.i += 1;
            break;
          }
          if (this.eof()) break;
          var before = this.i;
          var value = this.readValue();
          if (value === undefined) {
            if (this.i === before) this.i += 1;
            continue;
          }
          arr.push(value);
        }
        return arr;
      }
    }, {
      key: "readValue",
      value: function readValue() {
        var tok = this.readToken();
        if (!tok) return undefined;
        if (tok.t === 'num') {
          var save = this.i;
          var second = this.readToken();
          if (second && second.t === 'num') {
            var third = this.readToken();
            if (third && third.t === 'op' && third.v === 'R') return {
              ref: tok.v
            };
            this.i = save;
            return tok.v;
          }
          this.i = save;
          return tok.v;
        }
        if (tok.t === 'dict') return tok.v;
        if (tok.t === 'arr') return tok.v;
        if (tok.t === 'str') return tok.v;
        if (tok.t === 'name') return {
          name: tok.v
        };
        if (tok.t === 'op') {
          if (tok.v === 'true') return true;
          if (tok.v === 'false') return false;
          if (tok.v === 'null') return null;
          return {
            keyword: tok.v
          };
        }
        return undefined;
      }
    }]);
  }();
  function nameOf(value) {
    return value && _typeof(value) === 'object' && typeof value.name === 'string' ? value.name : '';
  }
  function isRef(value) {
    return !!value && _typeof(value) === 'object' && typeof value.ref === 'number';
  }

  /* ---------------- PDF 文档 ---------------- */
  var PdfDoc = /*#__PURE__*/function () {
    function PdfDoc(bytes) {
      _classCallCheck(this, PdfDoc);
      this.src = bytesToLatin1(bytes);
      this.objects = new Map();
      this.decoded = new Map();
      this.scan();
      this.expandObjectStreams();
    }
    return _createClass(PdfDoc, [{
      key: "scan",
      value: function scan() {
        var src = this.src;
        var re = /(\d+)\s+(\d+)\s+obj\b/g;
        var pos = 0;
        for (;;) {
          re.lastIndex = pos;
          var m = re.exec(src);
          if (!m) break;
          var num = Number(m[1]);
          var parser = new Parser(src, m.index + m[0].length);
          var value = void 0;
          try {
            value = parser.readValue();
          } catch (err) {
            pos = m.index + 3;
            continue;
          }
          parser.skipWS();
          var stream = null;
          if (src.substr(parser.i, 6) === 'stream') {
            var dataStart = parser.i + 6;
            if (src[dataStart] === '\r') dataStart += 1;
            if (src[dataStart] === '\n') dataStart += 1;
            var end = src.indexOf('endstream', dataStart);
            if (end < 0) end = src.length;
            var dataEnd = end;
            if (dataEnd > dataStart && src[dataEnd - 1] === '\n') dataEnd -= 1;
            if (dataEnd > dataStart && src[dataEnd - 1] === '\r') dataEnd -= 1;
            stream = {
              start: dataStart,
              end: dataEnd
            };
            var after = src.indexOf('endstream', end);
            pos = after >= 0 ? after + 9 : Math.min(src.length, end + 9);
          } else {
            var endObj = src.indexOf('endobj', parser.i);
            pos = endObj >= 0 ? endObj + 6 : parser.i + 1;
          }
          // 增量更新中后出现的对象覆盖之前的定义
          this.objects.set(num, {
            num: num,
            value: value,
            stream: stream
          });
        }
        this.scanCount = this.objects.size;
      }
    }, {
      key: "expandObjectStreams",
      value: function expandObjectStreams() {
        var self = this;
        var toAdd = [];
        this.objects.forEach(function (entry) {
          var dict = entry.value;
          if (!dict || _typeof(dict) !== 'object' || Array.isArray(dict)) return;
          if (nameOf(dict.Type) !== 'ObjStm' || !entry.stream) return;
          var n = Number(self.resolve(dict.N)) || 0;
          var first = Number(self.resolve(dict.First)) || 0;
          if (!n) return;
          var bytes;
          try {
            bytes = self.streamBytesSync(entry);
          } catch (err) {
            console.warn('[PdfLite] 对象流解压失败', err);
            return;
          }
          if (!bytes) return;
          var text = bytesToLatin1(bytes);
          var nums = [];
          var head = text.slice(0, first);
          var headRe = /(\d+)\s+(\d+)/g;
          var hm;
          while (hm = headRe.exec(head)) nums.push({
            num: Number(hm[1]),
            off: Number(hm[2])
          });
          for (var i = 0; i < Math.min(n, nums.length); i += 1) {
            var info = nums[i];
            var parser = new Parser(text, first + info.off);
            var value = void 0;
            try {
              value = parser.readValue();
            } catch (err) {
              continue;
            }
            toAdd.push({
              num: info.num,
              value: value
            });
          }
        });
        for (var i = 0; i < toAdd.length; i += 1) {
          if (!this.objects.has(toAdd[i].num)) {
            this.objects.set(toAdd[i].num, {
              num: toAdd[i].num,
              value: toAdd[i].value,
              stream: null
            });
          }
        }
      }
    }, {
      key: "resolve",
      value: function resolve(value) {
        var current = value;
        var guard = 0;
        while (isRef(current) && guard < 32) {
          var entry = this.objects.get(current.ref);
          current = entry ? entry.value : null;
          guard += 1;
        }
        return current;
      }
    }, {
      key: "dictOf",
      value: function dictOf(value) {
        var v = this.resolve(value);
        if (!v || _typeof(v) !== 'object' || Array.isArray(v)) return null;
        if (typeof v.ref === 'number' || typeof v.name === 'string') return null;
        return v;
      }
    }, {
      key: "entryOf",
      value: function entryOf(value) {
        if (!isRef(value)) return null;
        return this.objects.get(value.ref) || null;
      }
    }, {
      key: "streamBytes",
      value: function () {
        var _streamBytes = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(entry) {
          var promise;
          return _regenerator().w(function (_context) {
            while (1) switch (_context.n) {
              case 0:
                if (!(!entry || !entry.stream)) {
                  _context.n = 1;
                  break;
                }
                return _context.a(2, null);
              case 1:
                if (!this.decoded.has(entry.num)) {
                  _context.n = 2;
                  break;
                }
                return _context.a(2, this.decoded.get(entry.num));
              case 2:
                promise = this.decodeEntry(entry);
                this.decoded.set(entry.num, promise);
                return _context.a(2, promise);
            }
          }, _callee, this);
        }));
        function streamBytes(_x2) {
          return _streamBytes.apply(this, arguments);
        }
        return streamBytes;
      }()
    }, {
      key: "streamBytesSync",
      value: function streamBytesSync(entry) {
        // 对象流里的 Flate 需要同步路径：优先用自写 inflate
        if (!entry || !entry.stream) return null;
        var raw = latin1ToBytes(this.src.slice(entry.stream.start, entry.stream.end));
        var dict = this.dictOf(entry.value);
        if (!dict) return raw;
        var filter = this.resolve(dict.Filter);
        var filters = Array.isArray(filter) ? filter.map(function (f) {
          return nameOf(f);
        }) : nameOf(filter) ? [nameOf(filter)] : [];
        var data = raw;
        for (var i = 0; i < filters.length; i += 1) {
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
    }, {
      key: "decodeEntry",
      value: function () {
        var _decodeEntry = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(entry) {
          var _this = this;
          var raw, dict, filter, filters, data, i, name;
          return _regenerator().w(function (_context2) {
            while (1) switch (_context2.n) {
              case 0:
                if (entry.stream) {
                  _context2.n = 1;
                  break;
                }
                return _context2.a(2, null);
              case 1:
                raw = latin1ToBytes(this.src.slice(entry.stream.start, entry.stream.end));
                dict = this.dictOf(entry.value);
                if (dict) {
                  _context2.n = 2;
                  break;
                }
                return _context2.a(2, raw);
              case 2:
                filter = this.resolve(dict.Filter);
                filters = [];
                if (Array.isArray(filter)) filters = filter.map(function (f) {
                  return nameOf(_this.resolve(f));
                });else if (nameOf(filter)) filters = [nameOf(filter)];
                data = raw;
                i = 0;
              case 3:
                if (!(i < filters.length)) {
                  _context2.n = 10;
                  break;
                }
                name = filters[i];
                if (!(name === 'FlateDecode' || name === 'Fl')) {
                  _context2.n = 5;
                  break;
                }
                _context2.n = 4;
                return inflateBytes(data);
              case 4:
                data = _context2.v;
                _context2.n = 9;
                break;
              case 5:
                if (!(name === 'ASCIIHexDecode' || name === 'AHx')) {
                  _context2.n = 6;
                  break;
                }
                data = asciiHexDecode(data);
                _context2.n = 9;
                break;
              case 6:
                if (!(name === 'ASCII85Decode' || name === 'A85')) {
                  _context2.n = 7;
                  break;
                }
                data = ascii85Decode(data);
                _context2.n = 9;
                break;
              case 7:
                if (!(name === 'RunLengthDecode' || name === 'RL')) {
                  _context2.n = 8;
                  break;
                }
                data = runLengthDecode(data);
                _context2.n = 9;
                break;
              case 8:
                return _context2.a(2, null);
              case 9:
                i += 1;
                _context2.n = 3;
                break;
              case 10:
                return _context2.a(2, data);
            }
          }, _callee2, this);
        }));
        function decodeEntry(_x3) {
          return _decodeEntry.apply(this, arguments);
        }
        return decodeEntry;
      }()
    }, {
      key: "streamText",
      value: function () {
        var _streamText = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(entry) {
          var bytes;
          return _regenerator().w(function (_context3) {
            while (1) switch (_context3.n) {
              case 0:
                _context3.n = 1;
                return this.streamBytes(entry);
              case 1:
                bytes = _context3.v;
                return _context3.a(2, bytes ? bytesToLatin1(bytes) : '');
            }
          }, _callee3, this);
        }));
        function streamText(_x4) {
          return _streamText.apply(this, arguments);
        }
        return streamText;
      }()
    }, {
      key: "pages",
      value: function pages() {
        var self = this;
        var result = [];
        var seen = new Set();
        var catalog = null;
        this.objects.forEach(function (entry) {
          var dict = entry.value;
          if (dict && _typeof(dict) === 'object' && !Array.isArray(dict) && nameOf(dict.Type) === 'Catalog') {
            catalog = dict;
          }
        });
        var root = catalog ? this.dictOf(catalog.Pages) : null;
        function walk(node, inherited, depth) {
          var dict = self.dictOf(node);
          if (!dict || depth > 64) return;
          var key = dict;
          if (seen.has(key)) return;
          seen.add(key);
          var resources = self.dictOf(dict.Resources) || inherited;
          var type = nameOf(dict.Type);
          if (type === 'Pages' || !type && dict.Kids) {
            var kids = self.resolve(dict.Kids);
            if (Array.isArray(kids)) {
              kids.forEach(function (kid) {
                walk(kid, resources, depth + 1);
              });
            }
          } else if (type === 'Page' || !type && dict.Contents) {
            result.push({
              dict: dict,
              resources: resources
            });
          }
        }
        if (root) walk(root, null, 0);
        if (!result.length) {
          this.objects.forEach(function (entry) {
            var dict = entry.value;
            if (dict && _typeof(dict) === 'object' && !Array.isArray(dict) && nameOf(dict.Type) === 'Page') {
              result.push({
                dict: dict,
                resources: self.dictOf(dict.Resources)
              });
            }
          });
        }
        return result;
      }
    }, {
      key: "pageContent",
      value: function () {
        var _pageContent = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(page) {
          var contents, parts, i, entry, _entry, _t, _t2;
          return _regenerator().w(function (_context4) {
            while (1) switch (_context4.n) {
              case 0:
                contents = this.resolve(page.dict.Contents);
                parts = [];
                if (!Array.isArray(contents)) {
                  _context4.n = 5;
                  break;
                }
                i = 0;
              case 1:
                if (!(i < contents.length)) {
                  _context4.n = 4;
                  break;
                }
                entry = this.entryOf(contents[i]);
                if (!entry) {
                  _context4.n = 3;
                  break;
                }
                _t = parts;
                _context4.n = 2;
                return this.streamText(entry);
              case 2:
                _t.push.call(_t, _context4.v);
              case 3:
                i += 1;
                _context4.n = 1;
                break;
              case 4:
                _context4.n = 7;
                break;
              case 5:
                _entry = this.entryOf(page.dict.Contents);
                if (!_entry) {
                  _context4.n = 7;
                  break;
                }
                _t2 = parts;
                _context4.n = 6;
                return this.streamText(_entry);
              case 6:
                _t2.push.call(_t2, _context4.v);
              case 7:
                return _context4.a(2, parts.join('\n'));
            }
          }, _callee4, this);
        }));
        function pageContent(_x5) {
          return _pageContent.apply(this, arguments);
        }
        return pageContent;
      }()
    }, {
      key: "pageFonts",
      value: function () {
        var _pageFonts = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(page) {
          var fonts, resources, fontDict, self, rawNames, i, resName, entry, _t3, _t4, _t5;
          return _regenerator().w(function (_context5) {
            while (1) switch (_context5.p = _context5.n) {
              case 0:
                fonts = new Map();
                resources = page.resources;
                if (resources) {
                  _context5.n = 1;
                  break;
                }
                return _context5.a(2, fonts);
              case 1:
                fontDict = this.dictOf(resources.Font);
                if (fontDict) {
                  _context5.n = 2;
                  break;
                }
                return _context5.a(2, fonts);
              case 2:
                self = this;
                rawNames = Object.keys(fontDict);
                i = 0;
              case 3:
                if (!(i < rawNames.length)) {
                  _context5.n = 8;
                  break;
                }
                resName = rawNames[i];
                entry = this.entryOf(fontDict[resName]);
                if (entry) {
                  _context5.n = 4;
                  break;
                }
                return _context5.a(3, 7);
              case 4:
                _context5.p = 4;
                _t3 = fonts;
                _t4 = resName;
                _context5.n = 5;
                return this.buildFont(entry);
              case 5:
                _t3.set.call(_t3, _t4, _context5.v);
                _context5.n = 7;
                break;
              case 6:
                _context5.p = 6;
                _t5 = _context5.v;
                console.warn('[PdfLite] 字体解析失败：' + resName, _t5);
              case 7:
                i += 1;
                _context5.n = 3;
                break;
              case 8:
                if (!(!fonts.size && rawNames.length === 0)) {
                  _context5.n = 9;
                  break;
                }
                return _context5.a(2, fonts);
              case 9:
                return _context5.a(2, fonts);
            }
          }, _callee5, this, [[4, 6]]);
        }));
        function pageFonts(_x6) {
          return _pageFonts.apply(this, arguments);
        }
        return pageFonts;
      }()
    }, {
      key: "buildFont",
      value: function () {
        var _buildFont = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(entry) {
          var _this2 = this;
          var font, subtype, twoByte, info, toUniEntry, cmapText, parsed, encRaw, encName, encDict, descendants, child, w, i, _loop, widths, firstChar, _t6;
          return _regenerator().w(function (_context7) {
            while (1) switch (_context7.p = _context7.n) {
              case 0:
                font = this.dictOf(entry.value);
                if (font) {
                  _context7.n = 1;
                  break;
                }
                return _context7.a(2, {
                  name: '',
                  twoByte: false,
                  map: null,
                  codeBytes: 1,
                  widths: new Map(),
                  defaultWidth: 500
                });
              case 1:
                subtype = nameOf(this.resolve(font.Subtype));
                twoByte = subtype === 'Type0';
                info = {
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
                toUniEntry = this.entryOf(font.ToUnicode);
                if (!toUniEntry) {
                  _context7.n = 5;
                  break;
                }
                _context7.p = 2;
                _context7.n = 3;
                return this.streamText(toUniEntry);
              case 3:
                cmapText = _context7.v;
                parsed = parseToUnicode(cmapText);
                if (parsed.map.size) {
                  info.map = parsed.map;
                  info.codeBytes = parsed.codeBytes || info.codeBytes;
                }
                _context7.n = 5;
                break;
              case 4:
                _context7.p = 4;
                _t6 = _context7.v;
                console.warn('[PdfLite] ToUnicode 解析失败', _t6);
              case 5:
                /* 编码兜底 */
                encRaw = this.resolve(font.Encoding);
                encName = nameOf(encRaw);
                encDict = this.dictOf(encRaw);
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
                if (!twoByte) {
                  _context7.n = 9;
                  break;
                }
                descendants = this.resolve(font.DescendantFonts);
                child = Array.isArray(descendants) ? this.dictOf(descendants[0]) : null;
                if (!child) {
                  _context7.n = 8;
                  break;
                }
                info.defaultWidth = Number(this.resolve(child.DW)) || 1000;
                w = this.resolve(child.W);
                if (!Array.isArray(w)) {
                  _context7.n = 8;
                  break;
                }
                i = 0;
                _loop = /*#__PURE__*/_regenerator().m(function _loop() {
                  var first, next, last, width, code;
                  return _regenerator().w(function (_context6) {
                    while (1) switch (_context6.n) {
                      case 0:
                        first = Number(_this2.resolve(w[i]));
                        next = _this2.resolve(w[i + 1]);
                        if (Array.isArray(next)) {
                          next.forEach(function (item, idx) {
                            info.widths.set(first + idx, Number(item) || info.defaultWidth);
                          });
                          i += 2;
                        } else {
                          last = Number(next);
                          width = Number(_this2.resolve(w[i + 2]));
                          for (code = first; code <= last && code - first < 2000; code += 1) {
                            info.widths.set(code, width || info.defaultWidth);
                          }
                          i += 3;
                        }
                      case 1:
                        return _context6.a(2);
                    }
                  }, _loop);
                });
              case 6:
                if (!(i < w.length)) {
                  _context7.n = 8;
                  break;
                }
                return _context7.d(_regeneratorValues(_loop()), 7);
              case 7:
                _context7.n = 6;
                break;
              case 8:
                _context7.n = 10;
                break;
              case 9:
                widths = this.resolve(font.Widths);
                firstChar = Number(this.resolve(font.FirstChar)) || 0;
                if (Array.isArray(widths)) {
                  widths.forEach(function (item, idx) {
                    info.widths.set(firstChar + idx, Number(item) || 0);
                  });
                }
                info.defaultWidth = Number(this.resolve(font.MissingWidth)) || 500;
              case 10:
                return _context7.a(2, info);
            }
          }, _callee6, this, [[2, 4]]);
        }));
        function buildFont(_x7) {
          return _buildFont.apply(this, arguments);
        }
        return buildFont;
      }()
    }]);
  }();
  /* ---------------- ToUnicode / 编码表 ---------------- */
  function hexToUnits(hex) {
    var clean = String(hex || '').replace(/[^0-9a-fA-F]/g, '');
    var units = [];
    for (var _i9 = 0; _i9 + 3 < clean.length + 1 && _i9 + 4 <= clean.length; _i9 += 4) {
      units.push(parseInt(clean.substr(_i9, 4), 16));
    }
    if (!units.length && clean.length >= 2) units.push(parseInt(clean.substr(0, 2), 16));
    return units;
  }
  function unitsToString(units) {
    var out = '';
    for (var _i0 = 0; _i0 < units.length; _i0 += 1) out += String.fromCharCode(units[_i0]);
    return out;
  }
  function parseToUnicode(text) {
    var map = new Map();
    var codeBytes = 2;
    var charBlock = /beginbfchar([\s\S]*?)endbfchar/g;
    var m;
    while (m = charBlock.exec(text)) {
      var pairRe = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g;
      var p = void 0;
      while (p = pairRe.exec(m[1])) {
        var src = p[1];
        if (src.length % 2 === 0 && src.length >= 2) codeBytes = src.length / 2;
        map.set(src.toUpperCase(), unitsToString(hexToUnits(p[2])));
      }
    }
    var rangeBlock = /beginbfrange([\s\S]*?)endbfrange/g;
    while (m = rangeBlock.exec(text)) {
      var entryRe = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<([0-9a-fA-F]*)>|\[([\s\S]*?)\])/g;
      var e = void 0;
      while (e = entryRe.exec(m[1])) {
        var startHex = e[1];
        if (startHex.length % 2 === 0) codeBytes = startHex.length / 2;
        var start = parseInt(startHex, 16);
        var end = parseInt(e[2], 16);
        if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue;
        if (e[3].charAt(0) === '[') {
          var arrRe = /<([0-9a-fA-F]*)>/g;
          var a = void 0;
          var idx = 0;
          while (a = arrRe.exec(e[5])) {
            map.set((start + idx).toString(16).toUpperCase().padStart(startHex.length, '0'), unitsToString(hexToUnits(a[1])));
            idx += 1;
          }
        } else {
          var base = hexToUnits(e[4]);
          for (var code = start; code <= end && code - start < 65536; code += 1) {
            var units = base.slice();
            if (units.length) units[units.length - 1] = units[units.length - 1] + (code - start) & 0xffff;
            map.set(code.toString(16).toUpperCase().padStart(startHex.length, '0'), unitsToString(units));
          }
        }
      }
    }
    return {
      map: map,
      codeBytes: codeBytes
    };
  }
  var GLYPH_NAMES = {
    space: ' ',
    exclam: '!',
    quotedbl: '"',
    numbersign: '#',
    dollar: '$',
    percent: '%',
    ampersand: '&',
    quotesingle: "'",
    parenleft: '(',
    parenright: ')',
    asterisk: '*',
    plus: '+',
    comma: ',',
    hyphen: '-',
    period: '.',
    slash: '/',
    zero: '0',
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
    colon: ':',
    semicolon: ';',
    less: '<',
    equal: '=',
    greater: '>',
    question: '?',
    at: '@',
    bracketleft: '[',
    backslash: '\\',
    bracketright: ']',
    asciicircum: '^',
    underscore: '_',
    grave: '`',
    braceleft: '{',
    bar: '|',
    braceright: '}',
    asciitilde: '~',
    endash: '–',
    emdash: '—',
    bullet: '•',
    quoteleft: '‘',
    quoteright: '’',
    quotedblleft: '“',
    quotedblright: '”',
    ellipsis: '…',
    nbspace: ' ',
    middot: '·',
    degree: '°',
    plusminus: '±',
    multiply: '×',
    divide: '÷',
    copyright: '©',
    registered: '®',
    trademark: '™'
  };
  function glyphToUnicode(name) {
    if (!name) return '';
    if (GLYPH_NAMES[name]) return GLYPH_NAMES[name];
    if (name.length === 1) return name;
    var m = /^uni([0-9A-Fa-f]{4})$/.exec(name);
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
    var special = {
      0x80: '€',
      0x82: '‚',
      0x83: 'ƒ',
      0x84: '„',
      0x85: '…',
      0x86: '†',
      0x87: '‡',
      0x88: 'ˆ',
      0x89: '‰',
      0x8a: 'Š',
      0x8b: '‹',
      0x8c: 'Œ',
      0x8e: 'Ž',
      0x91: '‘',
      0x92: '’',
      0x93: '“',
      0x94: '”',
      0x95: '•',
      0x96: '–',
      0x97: '—',
      0x98: '˜',
      0x99: '™',
      0x9a: 'š',
      0x9b: '›',
      0x9c: 'œ',
      0x9e: 'ž',
      0x9f: 'Ÿ'
    };
    if (special[code]) return special[code];
    return String.fromCharCode(code);
  }
  function buildSimpleEncoding(encDict) {
    var map = new Map();
    for (var code = 0; code < 256; code += 1) map.set(bytesToHexKey(String.fromCharCode(code), 0, 1), winAnsiChar(code));
    if (encDict && Array.isArray(encDict.Differences)) {
      var _code = 0;
      encDict.Differences.forEach(function (item) {
        if (typeof item === 'number') {
          _code = item;
          return;
        }
        var name = nameOf(item);
        if (!name) return;
        var ch = glyphToUnicode(name);
        if (ch && _code >= 0 && _code < 256) map.set(bytesToHexKey(String.fromCharCode(_code), 0, 1), ch);
        _code += 1;
      });
    }
    return map;
  }

  /* ---------------- 内容流解析 ---------------- */
  function multiplyMatrix(a, b) {
    return [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3], a[4] * b[0] + a[5] * b[2] + b[4], a[4] * b[1] + a[5] * b[3] + b[5]];
  }
  function decodeShowText(bytesStr, font) {
    var glyphs = [];
    if (!font) return glyphs;
    if (font.map) {
      var step = font.codeBytes || 1;
      for (var _i1 = 0; _i1 + step <= bytesStr.length; _i1 += step) {
        var key = bytesToHexKey(bytesStr, _i1, step);
        var ch = font.map.get(key);
        var code = parseInt(key, 16);
        var width = font.widths.get(code);
        if (!width) width = font.defaultWidth || (step === 2 ? 1000 : 500);
        glyphs.push({
          ch: ch || '',
          code: code,
          width: width
        });
      }
      return glyphs;
    }
    if (font.decoder) {
      try {
        var decoder = new TextDecoder(font.decoder);
        var text = decoder.decode(latin1ToBytes(bytesStr));
        for (var _i10 = 0; _i10 < text.length; _i10 += 1) {
          var _ch = text[_i10];
          glyphs.push({
            ch: _ch,
            code: text.charCodeAt(_i10),
            width: _ch.charCodeAt(0) > 0x2e80 ? 1000 : 500
          });
        }
      } catch (err) {
        console.warn('[PdfLite] ' + font.decoder + ' 解码失败', err);
      }
      return glyphs;
    }
    return glyphs;
  }
  function extractPageItems(content, fonts) {
    var parser = new Parser(content, 0);
    var items = [];
    var ctm = [1, 0, 0, 1, 0, 0];
    var ctmStack = [];
    var tm = [1, 0, 0, 1, 0, 0];
    var tlm = [1, 0, 0, 1, 0, 0];
    var font = null;
    var fontSize = 0;
    var charSpace = 0;
    var wordSpace = 0;
    var hScale = 1;
    var leading = 0;
    var rise = 0;
    var operands = [];
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
      var glyphs = decodeShowText(bytesStr, font);
      if (!glyphs.length) return;
      var text = '';
      var advance = 0;
      for (var _i11 = 0; _i11 < glyphs.length; _i11 += 1) {
        var g = glyphs[_i11];
        text += g.ch;
        var step = g.width / 1000 * fontSize;
        if (g.ch === ' ' || g.code === 32) step += wordSpace;
        step += charSpace;
        advance += step * hScale;
      }
      var matrix = multiplyMatrix(tm, ctm);
      var scale = Math.hypot(matrix[2], matrix[3]) || Math.abs(matrix[0]) || 1;
      var size = Math.abs(fontSize) * scale;
      var y = matrix[5] + rise * (matrix[1] || 0);
      var x = matrix[4] + rise * (matrix[0] || 0);
      if (text.trim()) items.push({
        text: text,
        x: x,
        y: y,
        w: Math.abs(advance) * scale,
        size: size,
        font: font.name
      });
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
            var name = nameOf(operands[operands.length - 2]);
            fontSize = Number(operands[operands.length - 1]) || 0;
            font = fonts.get(name) || null;
          }
          break;
        case 'Td':
          if (operands.length >= 2) moveText(Number(operands[0]) || 0, Number(operands[1]) || 0);
          break;
        case 'TD':
          if (operands.length >= 2) {
            var tx = Number(operands[0]) || 0;
            var ty = Number(operands[1]) || 0;
            leading = -ty;
            moveText(tx, ty);
          }
          break;
        case 'Tm':
          if (operands.length >= 6) {
            tm = operands.slice(0, 6).map(function (n) {
              return Number(n) || 0;
            });
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
            for (var _i12 = 0; _i12 < operands[0].length; _i12 += 1) {
              var part = operands[0][_i12];
              if (typeof part === 'string') emit(part);else if (typeof part === 'number') {
                var shift = -part / 1000 * fontSize * hScale;
                tm[4] += shift * tm[0];
                tm[5] += shift * tm[1];
              }
            }
          }
          break;
        case 'cm':
          if (operands.length >= 6) {
            ctm = multiplyMatrix(operands.slice(0, 6).map(function (n) {
              return Number(n) || 0;
            }), ctm);
          }
          break;
        case 'q':
          ctmStack.push(ctm.slice());
          break;
        case 'Q':
          if (ctmStack.length) ctm = ctmStack.pop();
          break;
        case 'BI':
          {
            // 跳过内联图片二进制数据
            var idIndex = content.indexOf('ID', parser.i);
            if (idIndex >= 0) {
              var eiIndex = content.indexOf('EI', idIndex + 3);
              parser.i = eiIndex >= 0 ? eiIndex + 2 : content.length;
            }
            break;
          }
        default:
          break;
      }
    }
    for (;;) {
      var tok = parser.readToken();
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
        operands.push({
          name: tok.v
        });
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
    var sorted = values.slice().sort(function (a, b) {
      return a - b;
    });
    return sorted[Math.floor(sorted.length / 2)];
  }
  function groupRows(items, tolerance) {
    var tol = tolerance || 3;
    var sorted = items.slice().sort(function (a, b) {
      return b.y - a.y || a.x - b.x;
    });
    var rows = [];
    var current = null;
    sorted.forEach(function (item) {
      if (!current || Math.abs(item.y - current.y) > tol) {
        current = {
          y: item.y,
          items: [item]
        };
        rows.push(current);
      } else {
        current.items.push(item);
        current.y = (current.y * (current.items.length - 1) + item.y) / current.items.length;
      }
    });
    rows.forEach(function (row) {
      row.items.sort(function (a, b) {
        return a.x - b.x;
      });
    });
    return rows;
  }
  function rowText(row) {
    var text = '';
    var prevEnd = null;
    row.items.forEach(function (item) {
      if (prevEnd !== null) {
        var gap = item.x - prevEnd;
        if (gap > Math.max(1.2, (item.size || 10) * 0.25) && !/\s$/.test(text) && !/^\s/.test(item.text)) text += ' ';
      }
      text += item.text;
      prevEnd = item.x + (item.w || 0);
    });
    return text.replace(/\s+/g, ' ').trim();
  }
  function itemsToLines(items) {
    var sizes = items.map(function (i) {
      return i.size;
    }).filter(function (s) {
      return s > 2 && s < 100;
    });
    var tol = Math.max(2.5, median(sizes) * 0.42 || 2.5);
    var rows = groupRows(items, tol);
    return rows.map(function (row) {
      return {
        y: row.y,
        text: rowText(row),
        items: row.items
      };
    }).filter(function (line) {
      return line.text;
    });
  }

  /* ---------------- 完整提取 ---------------- */
  function extractPdf(_x8) {
    return _extractPdf.apply(this, arguments);
  }
  /* ---------------- 课表版面识别 ---------------- */
  function _extractPdf() {
    _extractPdf = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8(arrayBuffer) {
      var bytes, header, _i17, doc, pageList, pages, allText, itemCount, p, page, content, fonts, items, lines, text, _t9, _t0;
      return _regenerator().w(function (_context9) {
        while (1) switch (_context9.p = _context9.n) {
          case 0:
            bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
            if (bytes.length) {
              _context9.n = 1;
              break;
            }
            throw new Error('PDF 内容为空');
          case 1:
            header = '';
            for (_i17 = 0; _i17 < Math.min(8, bytes.length); _i17 += 1) header += String.fromCharCode(bytes[_i17]);
            if (!(header.indexOf('%PDF') < 0)) {
              _context9.n = 2;
              break;
            }
            throw new Error('这不是 PDF 文件（缺少 %PDF 文件头）');
          case 2:
            doc = new PdfDoc(bytes);
            if (doc.objects.size) {
              _context9.n = 3;
              break;
            }
            throw new Error('PDF 结构异常，未找到任何对象');
          case 3:
            pageList = doc.pages();
            if (pageList.length) {
              _context9.n = 4;
              break;
            }
            throw new Error('PDF 中没有找到页面');
          case 4:
            pages = [];
            allText = '';
            itemCount = 0;
            p = 0;
          case 5:
            if (!(p < pageList.length)) {
              _context9.n = 15;
              break;
            }
            page = pageList[p];
            content = '';
            _context9.p = 6;
            _context9.n = 7;
            return doc.pageContent(page);
          case 7:
            content = _context9.v;
            _context9.n = 9;
            break;
          case 8:
            _context9.p = 8;
            _t9 = _context9.v;
            console.warn('[PdfLite] 第 ' + (p + 1) + ' 页内容读取失败', _t9);
          case 9:
            fonts = new Map();
            _context9.p = 10;
            _context9.n = 11;
            return doc.pageFonts(page);
          case 11:
            fonts = _context9.v;
            _context9.n = 13;
            break;
          case 12:
            _context9.p = 12;
            _t0 = _context9.v;
            console.warn('[PdfLite] 第 ' + (p + 1) + ' 页字体读取失败', _t0);
          case 13:
            items = content ? extractPageItems(content, fonts) : [];
            itemCount += items.length;
            lines = itemsToLines(items);
            text = lines.map(function (l) {
              return l.text;
            }).join('\n');
            pages.push({
              index: p + 1,
              items: items,
              lines: lines,
              text: text
            });
            allText += (allText ? '\n\n' : '') + text;
          case 14:
            p += 1;
            _context9.n = 5;
            break;
          case 15:
            return _context9.a(2, {
              version: VERSION,
              pageCount: pageList.length,
              objectCount: doc.objects.size,
              itemCount: itemCount,
              pages: pages,
              text: allText,
              hasText: itemCount > 0
            });
        }
      }, _callee8, null, [[10, 12], [6, 8]]);
    }));
    return _extractPdf.apply(this, arguments);
  }
  var DAYS_CN = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    日: 7,
    天: 7,
    七: 7
  };
  var DAYS_EN = {
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
    sun: 7
  };
  function dayFromText(text) {
    var s = String(text || '');
    var m = /(?:周|星期|礼拜)\s*([一二三四五六日天])/.exec(s);
    if (m) return DAYS_CN[m[1]] || 0;
    m = /^(?:周|星期|礼拜)?\s*([一二三四五六日天])$/.exec(s.trim());
    if (m) return DAYS_CN[m[1]] || 0;
    m = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(mon|tue|wed|thu|fri|sat|sun)/i.exec(s);
    if (m) {
      var word = (m[1] || m[2] || '').toLowerCase();
      return DAYS_EN[word.slice(0, 3)] || 0;
    }
    if (/^[1-7]$/.test(s.trim())) return Number(s.trim());
    return 0;
  }
  function sectionRange(text) {
    var s = String(text || '').replace(/[—－至到~]/g, '-');
    /* 时间列（08:00-09:40）和「1-16周」不是节次，必须先排除，
     * 否则会被数字区间规则误读成 1-9 节。 */
    if (/\d{1,2}:\d{2}/.test(s) && !/节/.test(s)) return [0, 0];
    if (/周/.test(s) && !/节/.test(s)) return [0, 0];
    var m = /(?:第)?\s*(\d{1,2})\s*-\s*(\d{1,2})\s*节?/.exec(s);
    if (m) {
      var rawB = Number(m[2]);
      if (rawB > 12 && !/节/.test(s)) return [0, 0];
      var a = Math.max(1, Math.min(12, Number(m[1])));
      var b = Math.max(a, Math.min(12, rawB));
      return [a, b];
    }
    m = /(?:第)?\s*(\d{1,2})\s*节/.exec(s);
    if (m) {
      var _a = Math.max(1, Math.min(12, Number(m[1])));
      return [_a, _a];
    }
    m = /^\s*(\d{1,2})\s*$/.exec(s);
    if (m) {
      var _a2 = Math.max(1, Math.min(12, Number(m[1])));
      return [_a2, _a2];
    }
    return [0, 0];
  }

  /**
   * 从文本片段中识别课表表格，返回 { cells, days, warning }
   * 每个 cell: { day, start, end, lines }
   */
  function detectTable(items) {
    var usable = items.filter(function (item) {
      return item.text && item.text.trim();
    });
    if (!usable.length) return {
      cells: [],
      warning: '没有文字层'
    };
    var sizes = usable.map(function (i) {
      return i.size;
    }).filter(function (s) {
      return s > 2 && s < 100;
    });
    var tol = Math.max(2.5, median(sizes) * 0.42 || 2.5);
    var rows = groupRows(usable, tol);

    /* 1) 找表头：包含 >=3 个星期 */
    var header = null;
    var headerIdx = -1;
    var _loop2 = function _loop2() {
      var days = new Set();
      rows[_i13].items.forEach(function (item) {
        var d = dayFromText(item.text);
        if (d) days.add(d);
      });
      if (days.size >= 3) {
        header = rows[_i13];
        headerIdx = _i13;
        return 1; // break
      }
    };
    for (var _i13 = 0; _i13 < rows.length; _i13 += 1) {
      if (_loop2()) break;
    }
    if (!header) return {
      cells: [],
      warning: '未识别到「星期」表头'
    };
    var dayCols = new Map();
    header.items.forEach(function (item) {
      var d = dayFromText(item.text);
      if (!d) return;
      var center = item.x + (item.w || 0) / 2;
      if (!dayCols.has(d)) dayCols.set(d, []);
      dayCols.get(d).push(center);
    });
    var cols = Array.from(dayCols.keys()).sort(function (a, b) {
      return a - b;
    }).map(function (day) {
      var list = dayCols.get(day);
      var center = list.reduce(function (sum, v) {
        return sum + v;
      }, 0) / list.length;
      return {
        day: day,
        center: center
      };
    });
    if (cols.length < 3) return {
      cells: [],
      warning: '星期表头不完整'
    };

    /* 列边界：相邻列中心的中点；第一列左侧还要排除「节次/时间」列，
     * 否则节次文字会被误算进星期一的课程单元格。表头文字通常居中，
     * 而单元格文字左对齐，所以不能直接用表头中心减固定值。 */
    var colWidth = cols.length > 1 ? cols[1].center - cols[0].center : 86;
    var firstDayLeft = cols[0].center - colWidth / 2;
    var firstColRight = cols[0].center - colWidth * 0.42;
    var headerBeforeFirstDay = header.items.filter(function (item) {
      return item.x + (item.w || 0) / 2 < cols[0].center;
    });
    if (headerBeforeFirstDay.length) {
      var headerRight = headerBeforeFirstDay.reduce(function (max, item) {
        return Math.max(max, item.x + (item.w || 0));
      }, 0);
      if (headerRight > 0 && headerRight < firstDayLeft) {
        firstColRight = (headerRight + firstDayLeft) / 2;
      }
    }
    var boundaries = [firstColRight];
    for (var _i14 = 1; _i14 < cols.length; _i14 += 1) {
      boundaries.push((cols[_i14 - 1].center + cols[_i14].center) / 2);
    }
    boundaries.push(Infinity);
    var firstColEdge = firstColRight;

    /* 2) 找节次行（表头下方，第一列）。只保留能解析出明确节次的行，
     * 例如「第1-2节」；同一单元格里的时间行「08:00-09:40」不单独成行。 */
    var sectionRows = [];
    for (var _i15 = headerIdx + 1; _i15 < rows.length; _i15 += 1) {
      var _cells = rows[_i15].items.filter(function (item) {
        return item.x < firstColRight;
      });
      if (!_cells.length) continue;
      var text = rowText({
        items: _cells
      });
      var range = sectionRange(text);
      if (!range[0]) continue;
      sectionRows.push({
        y: rows[_i15].y,
        text: text,
        range: range,
        index: _i15
      });
    }
    var autoSections = sectionRows.length < 2;
    var bands = [];
    if (autoSections) {
      // 没有清晰节次列：按文字行之间的垂直间距分组，避免把同一个单元格里的
      // 课程名、教师、教室拆成四个「节次」。
      var dataRows = rows.slice(headerIdx + 1).filter(function (row) {
        return row.items.some(function (item) {
          return item.x >= firstColRight;
        });
      });
      if (!dataRows.length) return {
        cells: [],
        warning: '表头下方没有内容'
      };
      var fontSizes2 = usable.map(function (item) {
        return item.size;
      }).filter(function (s) {
        return s > 2 && s < 100;
      });
      var lineH2 = Math.max(7, (median(fontSizes2) || 9) * 1.25);
      var groups = [];
      var group = [];
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
      var fontSizes = usable.map(function (item) {
        return item.size;
      }).filter(function (s) {
        return s > 2 && s < 100;
      });
      var lineH = Math.max(6, (median(fontSizes) || 9) * 0.85);
      var sorted = sectionRows.slice().sort(function (a, b) {
        return b.y - a.y;
      });
      var minY = usable.reduce(function (min, item) {
        return Math.min(min, item.y);
      }, sorted[sorted.length - 1].y);
      for (var _i16 = 0; _i16 < sorted.length; _i16 += 1) {
        var top = sorted[_i16].y + lineH * 1.8;
        var bottom = _i16 < sorted.length - 1 ? sorted[_i16 + 1].y + lineH * 1.8 : minY - lineH;
        bands.push({
          top: top,
          bottom: bottom,
          start: sorted[_i16].range[0],
          end: sorted[_i16].range[1]
        });
      }
    }

    /* 4) 把片段分配到单元格 */
    var cells = [];
    var _loop3 = function _loop3() {
      var band = bands[b];
      var _loop4 = function _loop4() {
          var left = boundaries[c];
          var right = boundaries[c + 1];
          var picked = usable.filter(function (item) {
            var center = item.x + (item.w || 0) / 2;
            return item.y <= band.top && item.y > band.bottom && center >= left && center < right;
          });
          if (!picked.length) return 0; // continue
          var lines = itemsToLines(picked).map(function (line) {
            return line.text;
          });
          var text = lines.join(' ').trim();
          if (!text) return 0; // continue
          if (dayFromText(text) && lines.length === 1) return 0; // continue
          // 表头重复
          if (/^(节次|时间|星期|课程表|备注|上午|下午|晚上|中午|休息)$/.test(text)) return 0; // continue
          cells.push({
            day: cols[c].day,
            start: band.start,
            end: band.end,
            lines: lines,
            text: text,
            y: (band.top + band.bottom) / 2,
            x: cols[c].center
          });
        },
        _ret;
      for (var c = 0; c < cols.length; c += 1) {
        _ret = _loop4();
        if (_ret === 0) continue;
      }
    };
    for (var b = 0; b < bands.length; b += 1) {
      _loop3();
    }
    return {
      cells: cells,
      days: cols.map(function (c) {
        return c.day;
      }),
      warning: autoSections ? '节次列未识别，已按行顺序推断' : ''
    };
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