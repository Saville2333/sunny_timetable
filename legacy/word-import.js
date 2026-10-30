function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
/* ============================================================
 * Word (.docx) 课表导入
 * 纯前端解压 docx，读取 word/document.xml 的表格/段落
 * ============================================================ */
(function () {
  'use strict';

  var App = window.App;
  var UI = window.AppUI;
  var H = window.AppHelpers;
  var $ = H.$;
  var esc = H.esc;
  var PdfLite = window.PdfLite;
  function u16(bytes, offset) {
    return bytes[offset] | bytes[offset + 1] << 8;
  }
  function u32(bytes, offset) {
    return (bytes[offset] | bytes[offset + 1] << 8 | bytes[offset + 2] << 16 | bytes[offset + 3] << 24) >>> 0;
  }
  function findEocd(bytes) {
    var min = Math.max(0, bytes.length - 65557);
    for (var i = bytes.length - 22; i >= min; i -= 1) {
      if (u32(bytes, i) === 0x06054b50) return i;
    }
    return -1;
  }
  function unzipOne(bytes, targetName) {
    var eocd = findEocd(bytes);
    if (eocd < 0) throw new Error('不是有效的 .docx（ZIP）文件');
    var count = u16(bytes, eocd + 10);
    var ptr = u32(bytes, eocd + 16);
    for (var i = 0; i < count; i += 1) {
      if (u32(bytes, ptr) !== 0x02014b50) break;
      var method = u16(bytes, ptr + 10);
      var compSize = u32(bytes, ptr + 20);
      var nameLen = u16(bytes, ptr + 28);
      var extraLen = u16(bytes, ptr + 30);
      var commentLen = u16(bytes, ptr + 32);
      var localOffset = u32(bytes, ptr + 42);
      var name = new TextDecoder('utf-8').decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
      if (name === targetName) {
        var localNameLen = u16(bytes, localOffset + 26);
        var localExtraLen = u16(bytes, localOffset + 28);
        var start = localOffset + 30 + localNameLen + localExtraLen;
        var compressed = bytes.subarray(start, start + compSize);
        if (method === 0) return compressed;
        if (method === 8) return PdfLite.inflateRaw(compressed);
        throw new Error('Word 使用了不支持的压缩方式');
      }
      ptr += 46 + nameLen + extraLen + commentLen;
    }
    return null;
  }
  function decodeXml(buffer) {
    return new TextDecoder('utf-8').decode(buffer);
  }
  function extractDocx(bytes) {
    var xmlBytes = unzipOne(bytes, 'word/document.xml');
    if (!xmlBytes) throw new Error('Word 中找不到 word/document.xml');
    var xml = decodeXml(xmlBytes);
    var parser = new DOMParser();
    var doc = parser.parseFromString(xml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) {
      throw new Error('Word 文档 XML 解析失败');
    }
    var rows = [];
    var tables = doc.getElementsByTagName('w:tbl');
    for (var t = 0; t < tables.length; t += 1) {
      var trs = tables[t].getElementsByTagName('w:tr');
      for (var r = 0; r < trs.length; r += 1) {
        var cells = trs[r].getElementsByTagName('w:tc');
        var row = [];
        var hasText = false;
        for (var c = 0; c < cells.length; c += 1) {
          var ts = cells[c].getElementsByTagName('w:t');
          var _text = '';
          for (var k = 0; k < ts.length; k += 1) _text += ts[k].textContent || '';
          _text = _text.replace(/\s+/g, ' ').trim();
          if (_text) hasText = true;
          row.push(_text);
        }
        if (hasText && row.length) rows.push(row);
      }
    }
    var text = '';
    if (!rows.length) {
      var ps = doc.getElementsByTagName('w:p');
      var lines = [];
      for (var i = 0; i < ps.length; i += 1) {
        var _ts = ps[i].getElementsByTagName('w:t');
        var line = '';
        for (var _k = 0; _k < _ts.length; _k += 1) line += _ts[_k].textContent || '';
        line = line.replace(/\s+/g, ' ').trim();
        if (line) lines.push(line);
      }
      text = lines.join('\n');
    }
    if (!rows.length && !text) throw new Error('Word 里没有读到文字或表格');
    var html = '';
    if (rows.length) {
      html = '<table>' + rows.map(function (row) {
        return '<tr>' + row.map(function (cell) {
          return '<td>' + esc(cell) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</table>';
    }
    return {
      html: html,
      text: text,
      rows: rows.length
    };
  }
  function handleWordFile(_x) {
    return _handleWordFile.apply(this, arguments);
  }
  function _handleWordFile() {
    _handleWordFile = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(file) {
      var status, title, drop, buffer, data, extracted, result, box, input, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            status = $('#wordStatus');
            title = $('#wordDropTitle');
            drop = $('#wordDrop');
            if (file) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            if (/\.docx$/i.test(file.name)) {
              _context.n = 2;
              break;
            }
            UI.confirm({
              title: '只支持 .docx',
              sub: '这是旧版 .doc 或图片 Word。请用 Word 打开后「另存为 .docx」，或导出 PDF/截图后使用 PDF 导入。',
              okText: '知道了'
            });
            return _context.a(2);
          case 2:
            if (!(file.size > 20 * 1024 * 1024)) {
              _context.n = 3;
              break;
            }
            UI.toast('Word 太大，请控制在 20MB 内');
            return _context.a(2);
          case 3:
            if (drop) drop.classList.add('is-loading');
            if (title) title.textContent = '正在读取 Word…';
            if (status) {
              status.hidden = false;
              status.textContent = '📝 正在解压并读取表格…';
            }
            _context.p = 4;
            _context.n = 5;
            return file.arrayBuffer();
          case 5:
            buffer = _context.v;
            data = new Uint8Array(buffer);
            extracted = extractDocx(data);
            if (title) title.textContent = file.name;
            if (status) {
              status.textContent = extracted.rows ? '✅ 读取到 ' + extracted.rows + ' 行 Word 表格，正在识别课程…' : '✅ 读取到 Word 文本，正在识别课程…';
            }
            result = null;
            if (extracted.html) result = window.AppImporter.parseAny(extracted.html);
            if ((!result || !result.courses.length) && extracted.text) {
              result = window.AppImporter.parseAny(extracted.text);
            }
            if (result && result.courses.length) {
              App.showImportPreview({
                courses: result.courses,
                warnings: result.warnings || []
              }, 'Word 课表导入');
              if (status) status.textContent = '✅ 识别到 ' + result.courses.length + ' 门课程，请在预览中确认';
              UI.toast('Word 识别到 ' + result.courses.length + ' 门课程 ✨');
            } else {
              box = $('#importPaste');
              if (box) {
                box.value = extracted.text || extracted.html.replace(/<[^>]+>/g, '\n');
                box.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });
                box.focus();
              }
              if (status) status.textContent = '⚠️ 没直接识别成课程，已把文字放进「智能粘贴」';
              UI.toast('已把 Word 文字放进智能粘贴，请检查格式');
            }
            _context.n = 7;
            break;
          case 6:
            _context.p = 6;
            _t = _context.v;
            console.error('[Word] 读取失败', _t);
            if (title) title.textContent = '点击选择 Word 文件';
            if (status) status.textContent = '❌ ' + (_t && _t.message || 'Word 读取失败');
            UI.toast('Word 读取失败，请确认是 .docx 文件');
          case 7:
            _context.p = 7;
            if (drop) drop.classList.remove('is-loading');
            input = $('#wordFileInput');
            if (input) input.value = '';
            return _context.f(7);
          case 8:
            return _context.a(2);
        }
      }, _callee, null, [[4, 6, 7, 8]]);
    }));
    return _handleWordFile.apply(this, arguments);
  }
  function bind() {
    var input = $('#wordFileInput');
    var pick = $('#btnPickWord');
    var drop = $('#wordDrop');
    if (pick && input) pick.addEventListener('click', function () {
      input.click();
    });
    if (drop && input) {
      drop.addEventListener('click', function () {
        input.click();
      });
      drop.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          input.click();
        }
      });
      drop.addEventListener('dragover', function (e) {
        e.preventDefault();
        drop.classList.add('is-over');
      });
      drop.addEventListener('dragleave', function () {
        drop.classList.remove('is-over');
      });
      drop.addEventListener('drop', function (e) {
        e.preventDefault();
        drop.classList.remove('is-over');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleWordFile(e.dataTransfer.files[0]);
        }
      });
    }
    if (input) {
      input.addEventListener('change', function () {
        if (input.files && input.files[0]) handleWordFile(input.files[0]);
      });
    }
    var help = $('#btnWordHelp');
    if (help) help.addEventListener('click', function () {
      UI.confirm({
        title: 'Word 课表导入说明',
        sub: '支持 .docx 的文字和表格。老式 .doc 请先另存为 .docx；扫描图片 Word 需要先 OCR 或转 PDF 文字版。识别后会先预览，确认再替换课表。',
        okText: '知道了'
      });
    });
  }
  var origBind = App.bindEvents;
  App.bindEvents = function () {
    origBind.apply(this, arguments);
    bind();
  };
  if (document.readyState !== 'loading') bind();else document.addEventListener('DOMContentLoaded', bind);
})();