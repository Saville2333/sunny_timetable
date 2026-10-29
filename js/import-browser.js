/* ============================================================
 * 教务系统内嵌浏览器入口
 * APK 中通过 SunnyBrowser.open(url) 打开原生 BrowserActivity，
 * 原生页右下角「检测课表」把当前 DOM 回传给 App。
 * ============================================================ */
(function () {
  'use strict';

  const App = window.App;
  const UI = window.AppUI;
  const H = window.AppHelpers;
  const $ = H.$;

  App.receiveBrowserHtml = function (html, url) {
    const source = String(html || '');
    if (!source) {
      UI.toast('教务系统页面是空的，请刷新后重试');
      return;
    }
    this.switchTab('import');
    const input = $('#importUrl');
    if (input && url) input.value = String(url).slice(0, 500);
    if (typeof this.logImport === 'function') {
      this.logImport('🌐 已从 App 内浏览器取回页面（' + Math.round(source.length / 1024) + ' KB）');
    }
    let result;
    try {
      result = window.AppImporter.parseAny(source);
    } catch (e) {
      this.receiveBrowserHtmlFallback(source);
      return;
    }
    if (!result || !result.courses || !result.courses.length) {
      this.receiveBrowserHtmlFallback(source);
      UI.toast('没识别到课表，已把网页源码放进「智能粘贴」里');
      return;
    }
    if (typeof this.showImportPreview === 'function') {
      this.showImportPreview(
        { courses: result.courses, warnings: result.warnings || [] },
        'App 内教务系统检测'
      );
    }
    UI.toast('检测到 ' + result.courses.length + ' 门课程 ✨');
  };

  App.receiveBrowserHtmlFallback = function (html) {
    const box = $('#importPaste');
    if (box) {
      box.value = String(html || '').slice(0, 900000);
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  App.openCampusBrowser = function () {
    const input = $('#importUrl');
    const url = input ? input.value.trim() : '';
    if (!url) {
      UI.toast('先填写教务系统网址，再点「在 App 内打开」🔗');
      if (input) input.focus();
      return;
    }
    if (window.SunnyBrowser && typeof window.SunnyBrowser.open === 'function') {
      window.SunnyBrowser.open(url);
      UI.toast('登录后进入课表页，点右下角「检测课表」');
      return;
    }
    UI.confirm({
      title: '网页版没有内嵌浏览器',
      sub: '「在 App 内打开」需要 Android APK。网页版可以：1) 复制课表网页源码到「智能粘贴」；2) 导出 PDF 后导入；3) 用「直接检测」尝试跨域抓取。',
      okText: '去智能粘贴',
      onOk: function () {
        const box = $('#importPaste');
        if (box) {
          box.scrollIntoView({ behavior: 'smooth', block: 'center' });
          box.focus();
        }
      }
    });
  };

  let bound = false;
  function bind() {
    if (bound) return;
    bound = true;
    const btn = $('#btnOpenBrowser');
    if (btn) {
      btn.addEventListener('click', function () { App.openCampusBrowser(); });
    }
  }

  const origBind = App.bindEvents;
  App.bindEvents = function () {
    origBind.apply(this, arguments);
    bind();
  };

  if (document.readyState !== 'loading') {
    bind();
  } else {
    document.addEventListener('DOMContentLoaded', bind);
  }
})();
