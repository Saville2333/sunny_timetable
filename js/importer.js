/* ============================================================
 * 星海课表 · 导入解析引擎
 * 支持：教务网页 URL 抓取、HTML 源码表格解析、文本课表、JSON
 * ============================================================ */
(function (global) {
  'use strict';

  const Utils = global.AppUtils;
  const Data = global.AppData;
  const normalizeCourse = Data.normalizeCourse;

  const DAY_MAP = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7 };
  const CN_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

  let warnings = [];
  let colorCursor = 0;

  function warn(msg) {
    if (msg && warnings.indexOf(msg) === -1) warnings.push(msg);
  }

  function nextColor() {
    const c = colorCursor % Data.COURSE_COLORS.length;
    colorCursor += 1;
    return c;
  }

  function cnToNum(text) {
    const s = String(text || '');
    if (!s) return 0;
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    if (s === '十') return 10;
    if (s.length === 1) return CN_NUM[s] || 0;
    if (s.charAt(0) === '十') return 10 + (CN_NUM[s.charAt(1)] || 0);
    if (s.charAt(1) === '十') return (CN_NUM[s.charAt(0)] || 0) * 10 + (CN_NUM[s.charAt(2)] || 0);
    return CN_NUM[s.charAt(0)] || 0;
  }

  function cleanLine(line) {
    return String(line || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[\u200b\u3000]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* ---------- 星期解析 ---------- */
  function parseDay(raw) {
    const s = String(raw || '').trim();
    if (!s) return 0;
    const m = /(?:周|星期|礼拜)\s*([一二三四五六日天1-7])/.exec(s);
    if (m) {
      if (/\d/.test(m[1])) return Number(m[1]);
      return DAY_MAP[m[1]] || 0;
    }
    const only = /^([一二三四五六日天])$/.exec(s);
    if (only) return DAY_MAP[only[1]] || 0;
    if (/^[1-7]$/.test(s)) return Number(s);
    const en = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.exec(s);
    if (en) {
      const map = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 };
      return map[en[1].toLowerCase()] || 0;
    }
    return 0;
  }

  function dayInText(text) {
    const m = /(?:周|星期|礼拜)\s*([一二三四五六日天])/.exec(String(text || ''));
    return m ? DAY_MAP[m[1]] || 0 : 0;
  }

  /* ---------- 节次解析 ---------- */
  function parseSections(raw) {
    const s = String(raw || '');
    let m = /(?:第)?\s*(\d{1,2}|[一二三四五六七八九十]{1,3})\s*[-~－—至到]\s*(\d{1,2}|[一二三四五六七八九十]{1,3})\s*节/.exec(s);
    if (m) {
      const a = Math.max(1, cnToNum(m[1]));
      const b = Math.max(a, cnToNum(m[2]));
      return [Math.min(a, 12), Math.min(b, 12)];
    }
    m = /(?:第)?\s*(\d{1,2}|[一二三四五六七八九十]{1,3})\s*节/.exec(s);
    if (m) {
      const a = Math.max(1, Math.min(12, cnToNum(m[1])));
      return [a, a];
    }
    m = /(?:第)?\s*([一二三四五六七八九十]{1,3})\s*大节/.exec(s);
    if (m) {
      const a = Math.max(1, Math.min(12, cnToNum(m[1])));
      return [a, a];
    }
    m = /^\s*(\d{1,2})\s*[-~－—至到]\s*(\d{1,2})\s*$/.exec(s);
    if (m) {
      const a = Math.max(1, Math.min(12, Number(m[1])));
      const b = Math.max(a, Math.min(12, Number(m[2])));
      return [a, b];
    }
    m = /^\s*(\d{1,2})\s*$/.exec(s);
    if (m) {
      const a = Math.max(1, Math.min(12, Number(m[1])));
      return [a, a];
    }
    return [0, 0];
  }

  function sectionInText(text) {
    const sec = parseSections(String(text || ''));
    return sec[0] ? sec : [0, 0];
  }

  /* ---------- 周次解析 ---------- */
  function addRange(out, from, to) {
    const a = Math.max(1, Math.min(30, from));
    const b = Math.max(a, Math.min(30, to));
    for (let i = a; i <= b; i += 1) out.push(i);
  }

  function parseWeeks(raw, total) {
    const s = String(raw || '').replace(/，/g, ',').replace(/、/g, ',');
    if (!s) return [];
    const out = [];
    // 1-16周 / 第1~16周
    const rangeRe = /(\d{1,2})\s*[-~－—至到]\s*(\d{1,2})\s*周/g;
    let m = rangeRe.exec(s);
    while (m) {
      addRange(out, Number(m[1]), Number(m[2]));
      m = rangeRe.exec(s);
    }
    // 1,3,5周
    const listRe = /((?:\d{1,2}\s*,\s*)+\d{1,2})\s*周/g;
    m = listRe.exec(s);
    while (m) {
      m[1].split(',').forEach(function (n) {
        const v = parseInt(n, 10);
        if (v >= 1 && v <= 30) out.push(v);
      });
      m = listRe.exec(s);
    }
    // 单独 5周
    const singleRe = /(?:^|[^\d\-~－—至到,])(\d{1,2})\s*周/g;
    m = singleRe.exec(s);
    while (m) {
      const v = Number(m[1]);
      if (v >= 1 && v <= 30) out.push(v);
      m = singleRe.exec(s);
    }
    let uniq = Array.from(new Set(out)).sort(function (a, b) { return a - b; });
    const hasOdd = /单周|\(单\)|（单）/.test(s);
    const hasEven = /双周|\(双\)|（双）/.test(s);
    if (hasOdd && !hasEven) uniq = uniq.filter(function (n) { return n % 2 === 1; });
    if (hasEven && !hasOdd) uniq = uniq.filter(function (n) { return n % 2 === 0; });
    if (!uniq.length) return [];
    const limit = Math.max(total || 18, 18);
    return uniq.filter(function (n) { return n <= limit; });
  }

  /* ---------- 文本清理 ---------- */
  function stripMeta(text) {
    return String(text || '')
      .replace(/\(\s*(?:单|双)\s*周?\s*\)|（\s*(?:单|双)\s*周?\s*）/g, ' ')
      .replace(/(?:第)?\d{1,2}\s*[-~－—至到]?\s*\d{0,2}\s*周/g, ' ')
      .replace(/(?:第)?\d{1,2}\s*[-~－—至到]?\s*\d{0,2}\s*节/g, ' ')
      .replace(/(?:周|星期|礼拜)[一二三四五六日天]/g, ' ')
      .replace(/[|｜]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function looksLikeRoom(text) {
    const s = String(text || '');
    if (!s || s.length > 20) return false;
    // 包含楼/室/馆/场/机房等地点词，或形如 A302 / 301 的编号
    return /(楼|室|馆|场|机房|报告厅|号)/.test(s) || /^[A-Za-z]?\d{2,4}$/.test(s);
  }

  function looksLikeTeacher(text) {
    return /(老师|教授|讲师|助教|teacher)/i.test(text);
  }

  function guessTeacher(text) {
    const clean = stripMeta(text);
    if (!clean) return '';
    if (clean.length <= 12 && /^[\u4e00-\u9fa5·]{2,6}$/.test(clean)) return clean;
    return '';
  }

  /* ---------- 单门课程构建 ---------- */
  function makeCourse(fields) {
    const name = Utils.str(fields.name, 30);
    if (!name) {
      warn('有一门课程缺少名称，已跳过');
      return null;
    }
    const day = Utils.clampInt(fields.day, 1, 7, 0);
    if (!day) {
      warn('《' + name + '》没有识别到星期，已跳过');
      return null;
    }
    const start = Utils.clampInt(fields.start, 1, 12, 0);
    if (!start) {
      warn('《' + name + '》没有识别到节次，已跳过');
      return null;
    }
    const end = Math.max(start, Utils.clampInt(fields.end, start, 12, start));
    let weeks = Data.clampWeeks(fields.weeks, 30);
    if (!weeks.length) weeks = Data.rangeWeeks(1, 18);
    return normalizeCourse({
      name: name,
      teacher: fields.teacher || '',
      room: fields.room || '',
      books: fields.books || '',
      note: fields.note || '',
      emoji: fields.emoji || '📘',
      day: day,
      start: start,
      end: end,
      weeks: weeks,
      colorIndex: typeof fields.colorIndex === 'number' ? fields.colorIndex : nextColor(),
      createdAt: Date.now()
    });
  }

  /* ---------- 管道分隔行：课程名|教师|教室|周次|星期|节次|教材 ---------- */
  function parsePipeLine(line) {
    const parts = String(line || '').split(/[|｜]/).map(function (s) { return s.trim(); });
    if (parts.length < 3) return parseLooseText(line);
    const name = stripMeta(parts[0]);
    const teacher = parts[1] || '';
    const room = parts[2] || '';
    const weeks = parseWeeks(parts[3] || '', 30);
    let day = parseDay(parts[4] || '');
    if (!day) day = dayInText(parts[4] || '') || dayInText(line);
    let sec = parseSections(parts[5] || '');
    if (!sec[0]) sec = sectionInText(line);
    const books = parts[6] || '';
    if (!name) {
      warn('有一行课程缺少名称，已跳过');
      return null;
    }
    if (!day) {
      warn('《' + name + '》缺少星期信息（第 5 个字段），已跳过');
      return null;
    }
    if (!sec[0]) {
      warn('《' + name + '》缺少节次信息（第 6 个字段），已跳过');
      return null;
    }
    return makeCourse({
      name: name,
      teacher: teacher,
      room: room,
      books: books,
      day: day,
      start: sec[0],
      end: sec[1],
      weeks: weeks
    });
  }

  /* ---------- 自由文本行 ---------- */
  function parseLooseText(line) {
    const text = cleanLine(line);
    if (!text) return null;
    if (/^(课程|课程名称|时间|节次|星期|备注|上午|下午|晚上)$/.test(text)) return null;
    const day = dayInText(text);
    const sec = sectionInText(text);
    const weeks = parseWeeks(text, 30);
    const rest = stripMeta(text);
    const chunks = rest.split(/[\s,，;；/]+/).filter(Boolean);
    if (!day || !sec[0]) {
      warn('无法识别这一行的星期或节次：' + text.slice(0, 24));
      return null;
    }
    let name = chunks[0] || '';
    let teacher = '';
    let room = '';
    let books = '';
    for (let i = 1; i < chunks.length; i += 1) {
      const c = chunks[i];
      if (!room && looksLikeRoom(c)) {
        room = c;
      } else if (!teacher && looksLikeTeacher(c)) {
        teacher = c.replace(/老师|教授|讲师|助教/g, '');
      } else if (!teacher && guessTeacher(c)) {
        teacher = guessTeacher(c);
      } else if (!books) {
        books = c;
      }
    }
    if (!name) return null;
    return makeCourse({ name: name, teacher: teacher, room: room, books: books, day: day, start: sec[0], end: sec[1], weeks: weeks });
  }

  /* ---------- 多行块（教务系统常见单元格内容） ---------- */
  function parseBlock(lines, ctx) {
    const clean = lines.map(cleanLine).filter(Boolean);
    if (!clean.length) return null;

    const context = ctx || {};
    const joined = clean.join(' ');
    const day = context.day || dayInText(joined) || 0;
    const sec = (context.sections && context.sections[0]) ? context.sections : sectionInText(joined);
    const weeks = parseWeeks(joined, 30);

    let name = '';
    let teacher = '';
    let room = '';
    let books = '';

    clean.forEach(function (line) {
      const rest = stripMeta(line);
      if (!rest) return;
      const chunks = rest.split(/[\s,，;；\/]+/).filter(Boolean);
      chunks.forEach(function (chunk) {
        if (!name) {
          name = chunk;
          return;
        }
        if (!room && looksLikeRoom(chunk)) {
          room = chunk;
          return;
        }
        if (!teacher && (looksLikeTeacher(chunk) || guessTeacher(chunk))) {
          teacher = chunk.replace(/老师|教授|讲师|助教/g, '');
          return;
        }
        if (!books) books = chunk;
      });
    });

    if (!name) {
      name = stripMeta(clean[0]);
    }
    if (!name) return null;
    if (!day) {
      warn('《' + name + '》未识别到星期，已跳过');
      return null;
    }
    if (!sec[0]) {
      warn('《' + name + '》未识别到节次，已跳过');
      return null;
    }
    return makeCourse({ name: name, teacher: teacher, room: room, books: books, day: day, start: sec[0], end: sec[1], weeks: weeks });
  }

  /* ---------- 文本课表 ---------- */
  function parseText(text) {
    const raw = String(text || '').replace(/\r/g, '').trim();
    if (!raw) {
      warn('内容为空');
      return [];
    }
    const blocks = raw.split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    const results = [];

    blocks.forEach(function (block) {
      const lines = block.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      if (!lines.length) return;
      if (lines.length === 1) {
        const line = lines[0];
        if (line.indexOf('|') >= 0 || line.indexOf('｜') >= 0) {
          results.push(parsePipeLine(line));
        } else {
          results.push(parseLooseText(line));
        }
        return;
      }
      const pipeLines = lines.filter(function (l) { return l.indexOf('|') >= 0 || l.indexOf('｜') >= 0; });
      if (pipeLines.length === lines.length) {
        lines.forEach(function (l) { results.push(parsePipeLine(l)); });
        return;
      }
      // 多行块：若块内同时出现多个星期关键词，则按行拆分
      const dayHits = lines.filter(function (l) { return dayInText(l); }).length;
      if (dayHits >= 2 && lines.length >= 3) {
        lines.forEach(function (l) {
          if (dayInText(l)) {
            results.push(parseLooseText(l));
          } else {
            results.push(parseBlock([l]));
          }
        });
        return;
      }
      results.push(parseBlock(lines));
    });

    return results.filter(Boolean);
  }

  /* ---------- HTML 表格 ---------- */
  function cellToText(cell) {
    try {
      const clone = cell.cloneNode(true);
      const brs = clone.querySelectorAll('br');
      Array.prototype.forEach.call(brs, function (br) {
        br.parentNode.replaceChild(document.createTextNode('\n'), br);
      });
      const blocks = clone.querySelectorAll('div,p,li,tr');
      Array.prototype.forEach.call(blocks, function (el) {
        el.appendChild(document.createTextNode('\n'));
      });
      return (clone.textContent || '')
        .replace(/\u00a0/g, ' ')
        .replace(/\r/g, '')
        .split('\n')
        .map(function (s) { return s.replace(/\s+/g, ' ').trim(); })
        .filter(Boolean)
        .join('\n');
    } catch (e) {
      console.warn('[Importer] 单元格解析失败', e);
      return cleanLine(cell.textContent || '');
    }
  }

  function splitCellEntries(text) {
    const lines = String(text || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!lines.length) return [];
    const weekRe = /\d{1,2}\s*(?:[-~－—至到]\s*\d{1,2}\s*)?周/;
    const weekLines = lines.filter(function (l) { return weekRe.test(l); }).length;
    if (weekLines < 2) return [lines.join('\n')];
    const groups = [];
    let buf = [];
    lines.forEach(function (line) {
      buf.push(line);
      if (weekRe.test(line)) {
        groups.push(buf.join('\n'));
        buf = [];
      }
    });
    if (buf.length) groups.push(buf.join('\n'));
    return groups;
  }

  function parseHtml(html) {
    const source = String(html || '');
    if (!source) {
      warn('HTML 内容为空');
      return [];
    }
    let doc;
    try {
      doc = new DOMParser().parseFromString(source, 'text/html');
    } catch (e) {
      warn('HTML 解析失败');
      return [];
    }
    const tables = Array.prototype.slice.call(doc.querySelectorAll('table'));
    if (!tables.length) {
      warn('页面中没有找到表格');
      return [];
    }

    let best = null;
    let bestCells = 0;
    tables.forEach(function (table) {
      const count = table.querySelectorAll('td,th').length;
      if (count > bestCells) {
        bestCells = count;
        best = table;
      }
    });
    if (!best || bestCells < 4) {
      warn('表格内容过少，无法识别');
      return [];
    }

    const rows = Array.prototype.slice.call(best.rows || []);
    let headerIdx = -1;
    let colDays = {};
    for (let i = 0; i < rows.length && i < 12; i += 1) {
      const cells = Array.prototype.slice.call(rows[i].cells || []);
      const map = {};
      let hits = 0;
      cells.forEach(function (cell, ci) {
        const d = dayInText(cell.textContent || '');
        if (d) {
          map[ci] = d;
          hits += 1;
        }
      });
      if (hits >= 3) {
        headerIdx = i;
        colDays = map;
        break;
      }
    }

    if (headerIdx < 0) {
      warn('未找到「星期」表头行');
      return [];
    }

    const results = [];
    for (let r = headerIdx + 1; r < rows.length; r += 1) {
      const cells = Array.prototype.slice.call(rows[r].cells || []);
      if (!cells.length) continue;
      const rowText = cleanLine(cells[0].textContent || '');
      let rowSec = sectionInText(rowText);
      if (!rowSec[0]) {
        // 有些表格第一列是日期或空，尝试用行序号推断
        const guess = r - headerIdx;
        if (guess >= 1 && guess <= 12) rowSec = [guess, guess];
      }
      cells.forEach(function (cell, ci) {
        const day = colDays[ci];
        if (!day) return;
        const text = cellToText(cell);
        if (!text || text.replace(/\s/g, '').length < 2) return;
        if (/^(节次|时间|星期|上午|下午|中午|晚上|备注|休息)$/.test(cleanLine(text))) return;
        const entries = splitCellEntries(text);
        entries.forEach(function (entry) {
          // 星期来自表头列，节次来自首列，作为上下文传入解析
          const item = parseBlock(entry.split('\n'), { day: day, sections: rowSec });
          if (item) results.push(item);
        });
      });
    }

    return results;
  }

  /* ---------- PDF 课表 ---------- */
  function parsePdfCells(cells) {
    const results = [];
    (Array.isArray(cells) ? cells : []).forEach(function (cell) {
      if (!cell || !cell.day || !cell.start) return;
      const entries = splitCellEntries((cell.lines || []).join('\n'));
      entries.forEach(function (entry) {
        const item = parseBlock(entry.split('\n'), {
          day: cell.day,
          sections: [cell.start, cell.end || cell.start]
        });
        if (item) results.push(item);
      });
    });
    return dedupe(results);
  }

  function parsePdf(extraction) {
    reset();
    const pages = extraction && Array.isArray(extraction.pages) ? extraction.pages : [];
    if (!pages.length) {
      warn('PDF 中没有可读取的页面');
      return { type: 'pdf', courses: [], warnings: warnings };
    }
    if (extraction && extraction.hasText === false) {
      warn('这份 PDF 没有文字层（可能是扫描件/图片），请使用 OCR 或手动粘贴');
      return { type: 'pdf', courses: [], warnings: warnings };
    }

    let all = [];
    let cellCount = 0;
    pages.forEach(function (page) {
      const table = global.PdfLite && global.PdfLite.detectTable
        ? global.PdfLite.detectTable(page.items || [])
        : { cells: [], warning: 'PDF 解析内核未加载' };
      if (table.warning) warn('第 ' + page.index + ' 页：' + table.warning);
      if (table.cells && table.cells.length) {
        cellCount += table.cells.length;
        all = all.concat(parsePdfCells(table.cells));
      }
    });

    all = dedupe(all);
    if (!all.length) {
      /* 表格识别失败时退回纯文本识别；部分教务 PDF 会把课程写成
       * “课程名 教师 教室 周一 1-2节” 的连续文本。 */
      const plain = pages.map(function (page) { return page.text || ''; }).join('\n\n');
      const fallback = dedupe(parseText(plain));
      if (fallback.length) {
        warn('未识别到标准课表表格，已按文本方式识别');
        all = fallback;
      }
    }
    sortCourses(all);
    return {
      type: 'pdf',
      courses: all,
      warnings: warnings,
      meta: { pageCount: pages.length, cellCount: cellCount }
    };
  }

  /* ---------- JSON ---------- */
  function parseJson(text) {
    let data;
    try {
      data = JSON.parse(String(text || ''));
    } catch (e) {
      warn('JSON 格式有误：' + (e && e.message ? e.message : '解析失败'));
      return [];
    }
    let list = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (data && Array.isArray(data.courses)) {
      list = data.courses;
    } else if (data && Array.isArray(data.list)) {
      list = data.list;
    } else {
      warn('JSON 中没有找到课程数组');
      return [];
    }
    return list.map(normalizeCourse).filter(Boolean);
  }

  /* ---------- 去重合并 ---------- */
  function dedupe(list) {
    const map = new Map();
    list.forEach(function (course) {
      if (!course) return;
      const key = [course.name, course.day, course.start, course.end].join('|');
      if (map.has(key)) {
        const exist = map.get(key);
        exist.weeks = Array.from(new Set(exist.weeks.concat(course.weeks))).sort(function (a, b) { return a - b; });
        if (!exist.teacher && course.teacher) exist.teacher = course.teacher;
        if (!exist.room && course.room) exist.room = course.room;
        if (!exist.books && course.books) exist.books = course.books;
      } else {
        map.set(key, course);
      }
    });
    return Array.from(map.values());
  }

  function reset() {
    warnings = [];
    colorCursor = 0;
  }

  /* ---------- 对外接口 ---------- */
  function parseAny(raw) {
    reset();
    const text = String(raw || '').trim();
    if (!text) {
      warn('请先粘贴课表内容');
      return { type: 'empty', courses: [], warnings: warnings };
    }

    if (/^[\[{]/.test(text)) {
      try {
        JSON.parse(text);
        const courses = parseJson(text);
        sortCourses(courses);
        return { type: 'json', courses: courses, warnings: warnings };
      } catch (e) {
        warn('内容看起来像 JSON 但解析失败，继续按文本识别');
      }
    }

    if (/<table|<html|<body|<tr|<td/i.test(text)) {
      const courses = dedupe(parseHtml(text));
      if (courses.length) {
        sortCourses(courses);
        return { type: 'html', courses: courses, warnings: warnings };
      }
      warn('HTML 表格中没有识别到完整课程，尝试按文本识别');
    }

    const textCourses = dedupe(parseText(text));
    sortCourses(textCourses);
    return { type: 'text', courses: textCourses, warnings: warnings };
  }

  function sortCourses(list) {
    list.sort(function (a, b) {
      if (a.day !== b.day) return a.day - b.day;
      return a.start - b.start;
    });
  }

  /* ---------- 教务系统抓取 ---------- */
  async function fetchTimetable(url, onLog) {
    const log = typeof onLog === 'function' ? onLog : function () {};
    let target = String(url || '').trim();
    if (!target) throw new Error('请先填写教务系统课表网址');
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
    if (typeof global.wusiFetch !== 'function') {
      throw new Error('当前环境不支持网络请求，请使用粘贴导入');
    }

    log('📡 正在连接教务系统…');
    let res;
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(function () { controller.abort(); }, 20000) : null;
    try {
      res = await global.wusiFetch(target, {
        method: 'GET',
        headers: { Accept: 'text/html,application/xhtml+xml,*/*' },
        signal: controller ? controller.signal : undefined
      });
    } catch (e) {
      if (timer) clearTimeout(timer);
      console.error('[Importer] 抓取失败', e);
      const msg = e && e.name === 'AbortError' ? '请求超时（20 秒）' : (e && e.message) || '网络请求失败';
      throw new Error(msg + '，可能是跨域限制或需要登录。请改用「智能粘贴导入」。');
    }
    if (timer) clearTimeout(timer);

    if (!res || !res.ok) {
      throw new Error('教务系统返回状态异常：HTTP ' + (res ? res.status : '无响应'));
    }

    let html = '';
    try {
      html = await res.text();
    } catch (e) {
      throw new Error('读取网页内容失败');
    }

    log('✅ 已获取页面 ' + Math.max(1, Math.round(html.length / 1024)) + ' KB，开始识别课表…');
    if (!html || html.length < 80) {
      throw new Error('页面内容过短，可能被拦截，请使用粘贴导入');
    }
    if (/登录|login|验证码|密码/i.test(html.slice(0, 1200)) && !/<table/i.test(html)) {
      warn('页面疑似登录页，建议先登录后再粘贴课表源码');
    }

    reset();
    const courses = dedupe(parseHtml(html));
    if (courses.length) {
      sortCourses(courses);
      log('✨ 识别成功，共 ' + courses.length + ' 门课程安排');
      return { courses: courses, warnings: warnings };
    }

    // 退一步：把网页当纯文本再试
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const plain = doc.body ? doc.body.textContent || '' : '';
      const fallback = dedupe(parseText(plain));
      if (fallback.length) {
        sortCourses(fallback);
        log('✨ 通过文本方式识别到 ' + fallback.length + ' 门课程');
        return { courses: fallback, warnings: warnings };
      }
    } catch (e) {
      console.warn('[Importer] 文本兜底失败', e);
    }

    throw new Error('未在页面中识别到课表表格，请复制课表页面的 HTML 源码粘贴导入');
  }

  global.AppImporter = {
    fetchTimetable: fetchTimetable,
    parseAny: parseAny,
    parseHtml: parseHtml,
    parseText: parseText,
    parseJson: parseJson,
    parsePdf: parsePdf,
    parsePdfCells: parsePdfCells,
    parseWeeks: parseWeeks,
    parseSections: parseSections,
    parseDay: parseDay,
    stripMeta: stripMeta
  };
})(window);
/* ============ 解析引擎结束 ============ */