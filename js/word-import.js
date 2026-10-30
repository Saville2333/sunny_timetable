/* ============================================================
 * Word (.docx) 课表导入
 * 纯前端解压 docx，读取 word/document.xml 的表格/段落
 * ============================================================ */
(function () {
  'use strict';

  const App = window.App;
  const UI = window.AppUI;
  const H = window.AppHelpers;
  const $ = H.$;
  const esc = H.esc;
  const PdfLite = window.PdfLite;

  function u16(bytes, offset) {
    return bytes[offset] | (bytes[offset + 1] << 8);
  }

  function u32(bytes, offset) {
    return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
  }

  function findEocd(bytes) {
    const min = Math.max(0, bytes.length - 65557);
    for (let i = bytes.length - 22; i >= min; i -= 1) {
      if (u32(bytes, i) === 0x06054b50) return i;
    }
    return -1;
  }

  function unzipOne(bytes, targetName) {
    const eocd = findEocd(bytes);
    if (eocd < 0) throw new Error('不是有效的 .docx（ZIP）文件');
    const count = u16(bytes, eocd + 10);
    let ptr = u32(bytes, eocd + 16);
    for (let i = 0; i < count; i += 1) {
      if (u32(bytes, ptr) !== 0x02014b50) break;
      const method = u16(bytes, ptr + 10);
      const compSize = u32(bytes, ptr + 20);
      const nameLen = u16(bytes, ptr + 28);
      const extraLen = u16(bytes, ptr + 30);
      const commentLen = u16(bytes, ptr + 32);
      const localOffset = u32(bytes, ptr + 42);
      const name = new TextDecoder('utf-8').decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
      if (name === targetName) {
        const localNameLen = u16(bytes, localOffset + 26);
        const localExtraLen = u16(bytes, localOffset + 28);
        const start = localOffset + 30 + localNameLen + localExtraLen;
        const compressed = bytes.subarray(start, start + compSize);
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
    const xmlBytes = unzipOne(bytes, 'word/document.xml');
    if (!xmlBytes) throw new Error('Word 中找不到 word/document.xml');
    const xml = decodeXml(xmlBytes);
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) {
      throw new Error('Word 文档 XML 解析失败');
    }
    const rows = [];
    const tables = doc.getElementsByTagName('w:tbl');
    for (let t = 0; t < tables.length; t += 1) {
      const trs = tables[t].getElementsByTagName('w:tr');
      for (let r = 0; r < trs.length; r += 1) {
        const cells = trs[r].getElementsByTagName('w:tc');
        const row = [];
        let hasText = false;
        for (let c = 0; c < cells.length; c += 1) {
          const ts = cells[c].getElementsByTagName('w:t');
          let text = '';
          for (let k = 0; k < ts.length; k += 1) text += ts[k].textContent || '';
          text = text.replace(/\s+/g, ' ').trim();
          if (text) hasText = true;
          row.push(text);
        }
        if (hasText && row.length) rows.push(row);
      }
    }
    let text = '';
    if (!rows.length) {
      const ps = doc.getElementsByTagName('w:p');
      const lines = [];
      for (let i = 0; i < ps.length; i += 1) {
        const ts = ps[i].getElementsByTagName('w:t');
        let line = '';
        for (let k = 0; k < ts.length; k += 1) line += ts[k].textContent || '';
        line = line.replace(/\s+/g, ' ').trim();
        if (line) lines.push(line);
      }
      text = lines.join('\n');
    }
    if (!rows.length && !text) throw new Error('Word 里没有读到文字或表格');
    let html = '';
    if (rows.length) {
      html = '<table>' + rows.map(function (row) {
        return '<tr>' + row.map(function (cell) { return '<td>' + esc(cell) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</table>';
    }
    return { html: html, text: text, rows: rows.length };
  }

  async function handleWordFile(file) {
    const status = $('#wordStatus');
    const title = $('#wordDropTitle');
    const drop = $('#wordDrop');
    if (!file) return;
    if (!/\.docx$/i.test(file.name)) {
      UI.confirm({
        title: '只支持 .docx',
        sub: '这是旧版 .doc 或图片 Word。请用 Word 打开后「另存为 .docx」，或导出 PDF/截图后使用 PDF 导入。',
        okText: '知道了'
      });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      UI.toast('Word 太大，请控制在 20MB 内');
      return;
    }
    if (drop) drop.classList.add('is-loading');
    if (title) title.textContent = '正在读取 Word…';
    if (status) {
      status.hidden = false;
      status.textContent = '📝 正在解压并读取表格…';
    }
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      const extracted = extractDocx(data);
      if (title) title.textContent = file.name;
      if (status) {
        status.textContent = extracted.rows
          ? '✅ 读取到 ' + extracted.rows + ' 行 Word 表格，正在识别课程…'
          : '✅ 读取到 Word 文本，正在识别课程…';
      }
      let result = null;
      if (extracted.html) result = window.AppImporter.parseAny(extracted.html);
      if ((!result || !result.courses.length) && extracted.text) {
        result = window.AppImporter.parseAny(extracted.text);
      }
      if (result && result.courses.length) {
        App.showImportPreview(
          { courses: result.courses, warnings: result.warnings || [] },
          'Word 课表导入'
        );
        if (status) status.textContent = '✅ 识别到 ' + result.courses.length + ' 门课程，请在预览中确认';
        UI.toast('Word 识别到 ' + result.courses.length + ' 门课程 ✨');
      } else {
        const box = $('#importPaste');
        if (box) {
          box.value = extracted.text || extracted.html.replace(/<[^>]+>/g, '\n');
          box.scrollIntoView({ behavior: 'smooth', block: 'center' });
          box.focus();
        }
        if (status) status.textContent = '⚠️ 没直接识别成课程，已把文字放进「智能粘贴」';
        UI.toast('已把 Word 文字放进智能粘贴，请检查格式');
      }
    } catch (e) {
      console.error('[Word] 读取失败', e);
      if (title) title.textContent = '点击选择 Word 文件';
      if (status) status.textContent = '❌ ' + ((e && e.message) || 'Word 读取失败');
      UI.toast('Word 读取失败，请确认是 .docx 文件');
    } finally {
      if (drop) drop.classList.remove('is-loading');
      const input = $('#wordFileInput');
      if (input) input.value = '';
    }
  }

  function bind() {
    const input = $('#wordFileInput');
    const pick = $('#btnPickWord');
    const drop = $('#wordDrop');
    if (pick && input) pick.addEventListener('click', function () { input.click(); });
    if (drop && input) {
      drop.addEventListener('click', function () { input.click(); });
      drop.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
      });
      drop.addEventListener('dragover', function (e) {
        e.preventDefault();
        drop.classList.add('is-over');
      });
      drop.addEventListener('dragleave', function () { drop.classList.remove('is-over'); });
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
    const help = $('#btnWordHelp');
    if (help) help.addEventListener('click', function () {
      UI.confirm({
        title: 'Word 课表导入说明',
        sub: '支持 .docx 的文字和表格。老式 .doc 请先另存为 .docx；扫描图片 Word 需要先 OCR 或转 PDF 文字版。识别后会先预览，确认再替换课表。',
        okText: '知道了'
      });
    });
  }

  const origBind = App.bindEvents;
  App.bindEvents = function () {
    origBind.apply(this, arguments);
    bind();
  };

  if (document.readyState !== 'loading') bind();
  else document.addEventListener('DOMContentLoaded', bind);
})();
