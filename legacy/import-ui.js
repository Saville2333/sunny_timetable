/* ============================================================
 * 太阳神课程表 · 导入交互
 * 教务系统自动检测 / 智能粘贴 / 识别预览 / 示例课表
 * ============================================================ */
(function () {
  'use strict';

  var Store = window.AppStore;
  var U = window.AppUtils;
  var D = window.AppData;
  var Importer = window.AppImporter;
  var App = window.App;
  var UI = window.AppUI;
  var H = window.AppHelpers;
  var $ = H.$;
  var esc = H.esc;
  var SAMPLE_TEXT = ['高等数学|张明|教学楼 A302|1-16周|周一|1-2节|高等数学（第七版）、习题册', '大学英语|李悦|外语楼 B205|1-16周|周一|3-4节|新视野大学英语 2', '程序设计基础|王磊|实验楼 C401|1-16周|周二|1-2节|C 语言程序设计', '线性代数|陈曦|教学楼 A201|1-16周|周二|3-4节|线性代数', '大学物理|刘洋|理科楼 D103|1-16周|周三|1-2节|大学物理学 上册', '数据结构|孙倩|实验楼 C302|1-16周|周三|3-4节|数据结构（C 语言版）', '思想道德与法治|周敏|人文楼 E101|1-16周|周四|5-6节|思想道德与法治', '体育（篮球）|赵鹏|体育馆 2 号场|1-16周|周四|7-8节|运动服、球鞋', '概率论与数理统计|吴迪|教学楼 A305|1-16周|周五|1-2节|概率论与数理统计'].join('\n');

  /* ---------------- 日志 ---------------- */
  App.logImport = function (message, type) {
    var box = $('#importLog');
    if (!box) {
      console.log('[Import] ' + message);
      return;
    }
    box.hidden = false;
    var line = document.createElement('div');
    if (type) line.className = type;
    line.textContent = message;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
    console.log('[Import] ' + message);
  };
  App.clearImportLog = function () {
    var box = $('#importLog');
    if (box) {
      box.innerHTML = '';
      box.hidden = true;
    }
  };

  /* ---------------- 导入页 ---------------- */
  App.renderImport = function () {
    // 页面为静态结构，解析结果通过模态展示；此处保持日志状态即可
    var input = $('#importUrl');
    if (input && input.value && input.value.length > 300) input.value = '';
  };

  /* ---------------- PDF 课表 ---------------- */
  App.setPdfStatus = function (text, type) {
    var box = $('#pdfStatus');
    if (!box) return;
    box.hidden = !text;
    box.textContent = text || '';
    box.className = 'pdf-status' + (type ? ' is-' + type : '');
  };
  App.formatFileSize = function (bytes) {
    var n = Number(bytes) || 0;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(1) + ' MB';
  };
  App.handlePdfFile = function (file) {
    var self = this;
    if (!file) return;
    if (this._pdfBusy) {
      UI.toast('正在解析上一份 PDF，请稍候');
      return;
    }
    var isPdfName = /\.pdf$/i.test(file.name || '');
    var isPdfType = /application\/pdf/i.test(file.type || '');
    if (!isPdfName && !isPdfType) {
      UI.toast('请选择 PDF 文件 📄');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      UI.toast('PDF 请小于 20MB');
      return;
    }
    if (!window.PdfLite || typeof window.PdfLite.extract !== 'function') {
      UI.toast('PDF 解析组件未加载，请刷新后重试');
      return;
    }
    this._pdfBusy = true;
    this.clearImportLog();
    this.logImport('📄 收到 PDF：' + file.name + '（' + this.formatFileSize(file.size) + '）');
    this.setPdfStatus('正在读取 PDF 结构…', 'busy');
    var title = $('#pdfDropTitle');
    if (title) title.textContent = '正在解析 ' + file.name + '…';
    var read = typeof file.arrayBuffer === 'function' ? file.arrayBuffer() : new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(reader.error || new Error('读取文件失败'));
      };
      reader.readAsArrayBuffer(file);
    });
    read.then(function (buffer) {
      var bytes = new Uint8Array(buffer);
      var head = '';
      for (var i = 0; i < Math.min(8, bytes.length); i += 1) head += String.fromCharCode(bytes[i]);
      if (head.indexOf('%PDF') < 0) {
        throw new Error('文件头不是 %PDF，可能不是有效 PDF');
      }
      self.setPdfStatus('PDF 已读取，正在提取文字层…', 'busy');
      self.logImport('🔍 检测到 PDF 文件头，开始提取文字与坐标');
      return window.PdfLite.extract(bytes);
    }).then(function (extracted) {
      self.logImport('📑 共 ' + extracted.pageCount + ' 页 · ' + extracted.itemCount + ' 个文字片段');
      if (!extracted.hasText) {
        throw new Error('这份 PDF 没有文字层（可能是扫描件或图片），请用 OCR 识别后粘贴，或手动添加课程');
      }
      self.setPdfStatus('文字提取完成，正在识别课表表格…', 'busy');
      var result = Importer.parsePdf(extracted);
      if (!result.courses.length) {
        var warnings = (result.warnings || []).join('；');
        throw new Error(warnings || 'PDF 中没有识别到完整课程，请确认是课表 PDF，或换用粘贴导入');
      }
      var label = 'PDF 课表 · ' + file.name + ' · ' + extracted.pageCount + ' 页';
      self.setPdfStatus('识别到 ' + result.courses.length + ' 门课程，请在弹窗中确认 ✨', 'ok');
      self.logImport('✨ PDF 识别成功，共 ' + result.courses.length + ' 门课程', 'ok');
      self.showImportPreview(result, label);
    }).catch(function (err) {
      console.error('[Import] PDF 解析失败', err);
      var message = err && err.message || 'PDF 解析失败';
      self.setPdfStatus('❌ ' + message, 'err');
      self.logImport('❌ ' + message, 'err');
      UI.confirm({
        title: 'PDF 解析未成功 😢',
        sub: message + '。若 PDF 是扫描件，需要先用 OCR；文字版 PDF 也可以复制文字后使用「智能粘贴导入」。',
        okText: '知道了'
      });
    }).then(function () {
      self._pdfBusy = false;
      var titleEl = $('#pdfDropTitle');
      if (titleEl) titleEl.textContent = '点击选择 PDF 文件';
      var input = $('#pdfFileInput');
      if (input) input.value = '';
    });
  };

  /* ---------------- 识别预览 ---------------- */
  App.showImportPreview = function (result, sourceLabel) {
    var courses = result && result.courses || [];
    this.state.pendingImport = courses.slice();
    this.state.importSelected = courses.map(function () {
      return true;
    });
    this.state.importSource = sourceLabel || '导入内容';
    if (!courses.length) {
      var _warnText = result && result.warnings && result.warnings.length ? result.warnings.slice(0, 4).join('\n') : '可以检查一下内容格式，或直接手动添加课程。';
      UI.showModal('<div class="modal-title">没有识别到课程 😢</div>' + '<div class="modal-sub" style="white-space:pre-wrap;text-align:left">' + esc(_warnText) + '</div>' + '<div class="modal-sub" style="text-align:left">正确格式示例：<br>高等数学|张明|教学楼A302|1-16周|周一|1-2节|教材名</div>' + '<div class="modal-actions"><button type="button" class="btn primary" data-action="close">知道了</button></div>');
      return;
    }
    var items = courses.map(function (course, index) {
      var color = Store.courseColor(course);
      return '<button type="button" class="preview-item" data-action="toggle-preview" data-index="' + index + '">' + '<span class="pi-dot" style="background:' + color.main + '"></span>' + '<span class="pi-main">' + '<span class="pi-name" style="display:block">' + esc((course.emoji || '📘') + ' ' + course.name) + '</span>' + '<span class="pi-meta" style="display:block">' + D.WEEKDAYS[course.day - 1] + ' 第 ' + course.start + '-' + course.end + ' 节 · ' + esc(course.room || '教室未填') + ' · ' + esc(Store.weeksText(course.weeks)) + '</span>' + '</span>' + '<span class="pi-check is-checked">✓</span>' + '</button>';
    }).join('');
    var warnText = result.warnings && result.warnings.length ? '<br>⚠️ ' + esc(result.warnings.slice(0, 2).join('；')) : '';
    var html = '<div class="modal-title">识别到 ' + courses.length + ' 门课程 ✨</div>' + '<div class="modal-sub">来源：' + esc(sourceLabel) + ' · 点击条目可取消勾选' + warnText + '</div>' + '<div class="preview-list">' + items + '</div>' + '<div class="row-btns" style="margin-bottom:9px">' + '<button type="button" class="btn primary" data-action="import-merge">合并导入</button>' + '<button type="button" class="btn ghost" data-action="import-replace">替换全部</button>' + '</div>' + '<button type="button" class="btn ghost full" data-action="close">取消</button>';
    UI.showModal(html);
  };
  App.confirmImport = function (mode) {
    var self = this;
    var pending = this.state.pendingImport || [];
    var selected = pending.filter(function (course, index) {
      return !!self.state.importSelected[index];
    });
    if (!selected.length) {
      UI.toast('请至少选择一门课程');
      return;
    }
    UI.closeModal();
    var task = mode === 'replace' ? Store.replaceCourses(selected) : Store.mergeCourses(selected);
    task.then(function (count) {
      self.state.week = Store.currentWeek();
      self.renderAll();
      if (typeof self.renderSettings === 'function') self.renderSettings();
      self.logImport(mode === 'replace' ? '✅ 已替换为 ' + count + ' 门课程' : '✅ 新增 ' + count + ' 门课程', 'ok');
      UI.toast(mode === 'replace' ? '课表已替换 ⭐' : '已导入 ' + count + ' 门课程 ⭐');
    }).catch(function (err) {
      console.error('[Import] 导入失败', err);
      UI.toast('导入失败，请重试');
    });
  };

  /* ---------------- 教务系统自动检测 ---------------- */
  App.handleFetch = function () {
    var input = $('#importUrl');
    var url = input ? input.value.trim() : '';
    if (!url) {
      UI.toast('请先填写教务系统课表网址 🔗');
      if (input) input.focus();
      return;
    }
    var self = this;
    var btn = $('#btnFetch');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '检测中…';
    }
    this.clearImportLog();
    this.logImport('🔗 目标：' + url);
    Importer.fetchTimetable(url, function (message) {
      self.logImport(message);
    }).then(function (result) {
      self.logImport('✅ 解析完成，共 ' + result.courses.length + ' 门课程', 'ok');
      self.showImportPreview({
        courses: result.courses,
        warnings: result.warnings || []
      }, '教务系统自动检测');
    }).catch(function (err) {
      console.error('[Import] 教务检测失败', err);
      var message = err && err.message || '检测失败';
      self.logImport('❌ ' + message, 'err');
      UI.confirm({
        title: '自动检测未成功 😢',
        sub: message + '。可以在浏览器打开课表页面，复制网页源码后使用「智能粘贴导入」。',
        okText: '去粘贴导入',
        onOk: function onOk() {
          var paste = $('#importPaste');
          if (paste) {
            paste.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
            paste.focus();
          }
        }
      });
    }).then(function () {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '📡 开始检测';
      }
    });
  };

  /* ---------------- 智能粘贴 ---------------- */
  App.handlePasteParse = function () {
    var box = $('#importPaste');
    var text = box ? box.value.trim() : '';
    if (!text) {
      UI.toast('请先粘贴课表内容 📋');
      if (box) box.focus();
      return;
    }
    var result;
    try {
      result = Importer.parseAny(text);
    } catch (err) {
      console.error('[Import] 解析异常', err);
      UI.toast('解析出错，请检查内容格式');
      return;
    }
    var labels = {
      html: '教务网页源码',
      json: '课表 JSON 数据',
      text: '课表文本'
    };
    this.logImport('✨ 识别类型：' + (labels[result.type] || '未知') + '，候选课程 ' + result.courses.length + ' 门', 'ok');
    this.showImportPreview(result, labels[result.type] || '粘贴内容');
  };
  App.fillSampleText = function () {
    var box = $('#importPaste');
    if (!box) return;
    box.value = SAMPLE_TEXT;
    box.focus();
    UI.toast('已填入示例文本，点「智能识别」试试 ✨');
  };

  /* ---------------- 示例 / 清空 ---------------- */
  App.loadDemoCourses = function () {
    var self = this;
    UI.confirm({
      title: '载入示例课表？',
      sub: '会覆盖当前全部课程，载入后仍可自由编辑',
      okText: '载入示例',
      onOk: function onOk() {
        return Store.replaceCourses(D.buildDemoCourses()).then(function (count) {
          self.state.week = Store.currentWeek();
          self.renderAll();
          if (typeof self.renderSettings === 'function') self.renderSettings();
          self.logImport('🧪 已载入 ' + count + ' 门示例课程', 'ok');
          UI.toast('已载入示例课表 ⭐');
        });
      }
    });
  };
  App.clearAllCourses = function () {
    var self = this;
    var count = Store.courses.length;
    if (!count) {
      UI.toast('当前没有课程可清空');
      return;
    }
    UI.confirm({
      title: '清空全部课程？',
      sub: '共 ' + count + ' 门课程将被删除，此操作不可恢复',
      okText: '清空',
      danger: true,
      onOk: function onOk() {
        return Store.clearCourses().then(function () {
          self.renderAll();
          if (typeof self.renderSettings === 'function') self.renderSettings();
          UI.toast('课表已清空 🧹');
        });
      }
    });
  };

  /* ---------------- 事件 ---------------- */
  App.bindImportEvents = function () {
    var self = this;
    var fetchBtn = $('#btnFetch');
    if (fetchBtn) {
      fetchBtn.addEventListener('click', function () {
        self.handleFetch();
      });
    }
    var helpBtn = $('#btnFetchHelp');
    if (helpBtn) {
      helpBtn.addEventListener('click', function () {
        UI.showModal('<div class="modal-title">教务自动检测怎么用 📡</div>' + '<div class="modal-sub" style="text-align:left;line-height:1.7">' + '1. 在浏览器登录学校教务系统，打开「我的课表」页面<br>' + '2. 复制该页面的网址，粘贴到输入框，点「开始检测」<br>' + '3. 系统会抓取网页中的课表表格并智能识别<br>' + '4. 若提示跨域或需要登录，请在该页面「查看网页源代码」，<br>&nbsp;&nbsp;&nbsp;全选复制后粘贴到「智能粘贴导入」<br>' + '5. 识别结果会先预览，确认后再写入课表<br>' + '⭐ 本应用不会保存你的账号密码，也不会向第三方上传课表。' + '</div>' + '<div class="modal-actions"><button type="button" class="btn primary" data-action="close">知道啦</button></div>');
      });
    }
    var parseBtn = $('#btnParsePaste');
    if (parseBtn) {
      parseBtn.addEventListener('click', function () {
        self.handlePasteParse();
      });
    }
    var sampleBtn = $('#btnFillDemo');
    if (sampleBtn) {
      sampleBtn.addEventListener('click', function () {
        self.fillSampleText();
      });
    }
    var demoBtn = $('#btnLoadDemo');
    if (demoBtn) {
      demoBtn.addEventListener('click', function () {
        self.loadDemoCourses();
      });
    }
    var clearBtn = $('#btnClearCourses');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        self.clearAllCourses();
      });
    }

    /* ---- PDF 选择 / 拖拽 ---- */
    var pdfInput = $('#pdfFileInput');
    var pdfDrop = $('#pdfDrop');
    var openPdfPicker = function openPdfPicker() {
      if (self._pdfBusy) {
        UI.toast('正在解析 PDF，请稍候');
        return;
      }
      if (pdfInput) pdfInput.click();
    };
    var pickPdfBtn = $('#btnPickPdf');
    if (pickPdfBtn) pickPdfBtn.addEventListener('click', openPdfPicker);
    if (pdfInput) {
      pdfInput.addEventListener('change', function () {
        var file = pdfInput.files && pdfInput.files[0];
        if (file) self.handlePdfFile(file);
      });
    }
    if (pdfDrop) {
      pdfDrop.addEventListener('click', function (e) {
        if (e.target === pdfInput) return;
        openPdfPicker();
      });
      pdfDrop.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPdfPicker();
        }
      });
      ['dragenter', 'dragover'].forEach(function (type) {
        pdfDrop.addEventListener(type, function (e) {
          e.preventDefault();
          e.stopPropagation();
          pdfDrop.classList.add('is-over');
        });
      });
      ['dragleave', 'drop'].forEach(function (type) {
        pdfDrop.addEventListener(type, function (e) {
          e.preventDefault();
          e.stopPropagation();
          pdfDrop.classList.remove('is-over');
        });
      });
      pdfDrop.addEventListener('drop', function (e) {
        var dt = e.dataTransfer;
        var file = dt && dt.files && dt.files[0];
        if (file) self.handlePdfFile(file);
      });
    }
    var pdfHelpBtn = $('#btnPdfHelp');
    if (pdfHelpBtn) {
      pdfHelpBtn.addEventListener('click', function () {
        UI.showModal('<div class="modal-title">PDF 课表怎么导入 📄</div>' + '<div class="modal-sub" style="text-align:left;line-height:1.75">' + '1. 从教务系统下载或导出「课程表 PDF」<br>' + '2. 点「选择 PDF 课表」，或把文件拖进虚线框<br>' + '3. 应用会检测 PDF 文字层，按表头「星期」与节次列切分单元格<br>' + '4. 识别结果先预览，勾选需要的课程后再合并/替换<br><br>' + '⚠️ 扫描件（整页是图片）没有文字层，无法直接读取，需要先用 OCR 转成文字；<br>' + '⚠️ 加密 PDF 请先在阅读器中解除密码；<br>' + '⭐ 文件只在本机解析，不会上传到服务器。' + '</div>' + '<div class="modal-actions"><button type="button" class="btn primary" data-action="close">知道啦</button></div>');
      });
    }

    /* 预览模态交互 */
    var modal = $('#modalCard');
    if (modal) {
      modal.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var action = btn.dataset.action;
        if (action === 'toggle-preview') {
          var index = Number(btn.dataset.index);
          if (!Number.isInteger(index) || typeof self.state.importSelected[index] === 'undefined') return;
          self.state.importSelected[index] = !self.state.importSelected[index];
          btn.classList.toggle('is-off', !self.state.importSelected[index]);
          var check = btn.querySelector('.pi-check');
          if (check) check.classList.toggle('is-checked', self.state.importSelected[index]);
          return;
        }
        if (action === 'import-merge' || action === 'import-replace') {
          self.confirmImport(action === 'import-replace' ? 'replace' : 'merge');
        }
      });
    }
  };
})();
/* ============ 导入模块结束 ============ */