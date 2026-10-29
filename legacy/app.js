function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
/* ============================================================
 * 星海课表 · 主逻辑
 * 课表渲染 / 今日 / 导入 / 设置 / 课程编辑 / 主题与背景
 * ============================================================ */
(function () {
  'use strict';

  var Store = window.AppStore;
  var U = window.AppUtils;
  var D = window.AppData;
  var Importer = window.AppImporter;
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[m];
    });
  }
  function hexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || '').trim());
    if (!m) return '35, 196, 216';
    return parseInt(m[1], 16) + ', ' + parseInt(m[2], 16) + ', ' + parseInt(m[3], 16);
  }
  function fmtClock(seconds) {
    var s = Math.max(0, Math.floor(seconds));
    var h = Math.floor(s / 3600);
    var m = Math.floor(s % 3600 / 60);
    var sec = s % 60;
    return U.pad2(h) + ':' + U.pad2(m) + ':' + U.pad2(sec);
  }

  /* ---------------- 轻提示与模态 ---------------- */
  var UI = {
    _toastTimer: null,
    _confirmOk: null,
    toast: function toast(msg) {
      var el = $('#toast');
      if (!el) return;
      el.textContent = msg;
      el.hidden = false;
      requestAnimationFrame(function () {
        el.classList.add('is-show');
      });
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(function () {
        el.classList.remove('is-show');
        setTimeout(function () {
          el.hidden = true;
        }, 260);
      }, 1900);
    },
    showModal: function showModal(html) {
      var mask = $('#modalMask');
      var card = $('#modalCard');
      if (!mask || !card) return;
      card.innerHTML = html;
      mask.hidden = false;
      card.scrollTop = 0;
    },
    closeModal: function closeModal() {
      var mask = $('#modalMask');
      var card = $('#modalCard');
      if (!mask || !card) return;
      mask.hidden = true;
      card.innerHTML = '';
      this._confirmOk = null;
    },
    confirm: function confirm(options) {
      var opt = options || {};
      this.showModal('<div class="modal-title">' + esc(opt.title || '确认操作') + '</div>' + (opt.sub ? '<div class="modal-sub">' + esc(opt.sub) + '</div>' : '<div style="height:8px"></div>') + '<div class="modal-actions">' + '<button class="btn ghost" type="button" data-action="modal-cancel">取消</button>' + '<button class="btn ' + (opt.danger ? 'danger-ghost' : 'primary') + '" type="button" data-action="modal-ok">' + esc(opt.okText || '确定') + '</button>' + '</div>');
      this._confirmOk = typeof opt.onOk === 'function' ? opt.onOk : null;
    }
  };

  /* ---------------- 应用主体 ---------------- */
  var App = {
    state: {
      tab: 'schedule',
      week: 1,
      editorOpen: false,
      editingId: null,
      selectedDay: 1,
      selectedWeeks: [],
      selectedColor: 0,
      selectedEmoji: '📘',
      pendingImport: [],
      importSelected: [],
      importSource: '',
      suppressDetailUntil: 0,
      editorPushed: false
    },
    bgObjectUrl: '',
    clockTimer: null,
    init: function init() {
      var _this = this;
      return _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        var _t;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              _context.p = 0;
              _context.n = 1;
              return Store.init();
            case 1:
              _context.n = 3;
              break;
            case 2:
              _context.p = 2;
              _t = _context.v;
              console.error('[App] 数据初始化失败', _t);
            case 3:
              if (window.__hideBootFallback) window.__hideBootFallback();
              _this.state.week = Store.currentWeek();
              _this.applyTheme();
              _this.applyBackground();
              _this.renderAll();
              _this.renderSettings();
              _this.bindEvents();
              _this.startClock();
              _this.loadBgImage();

              /* 启动天气与穿搭（独立模块，失败不影响课表） */
              if (typeof _this.startWeather === 'function') {
                try {
                  _this.startWeather();
                } catch (err) {
                  console.error('[App] 天气模块启动失败', err);
                }
              }

              /* 启动时段配色与提醒引擎（模块由 rhythm.js / food.js 提供，脚本加载完成后才执行） */
              if (typeof _this.startWidgetSync === 'function') {
                try {
                  _this.startWidgetSync();
                } catch (err) {
                  console.warn('[App] 小组件同步启动失败', err);
                }
              }
              if (typeof _this.startLife === 'function') {
                try {
                  _this.startLife();
                } catch (err) {
                  console.error('[App] 时段与提醒模块启动失败', err);
                }
              }
              try {
                history.replaceState({
                  page: 'tab',
                  tab: 'schedule'
                }, '', '#schedule');
              } catch (e) {
                console.warn('[App] history 初始化失败', e);
              }
              if (Store.firstRun) {
                setTimeout(function () {
                  UI.toast('☀️ 太阳神已为你准备示例课表，猫猫在旁边看着你 ✨');
                }, 700);
              }
              console.log('[App] 太阳神的随身陪伴课程表启动完成');

              /* PWA：桌面/手机浏览器可安装；APK 的 file:// 环境会自动跳过 */
              if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
                navigator.serviceWorker.register('sw.js').catch(function (err) {
                  console.warn('[App] Service Worker 注册失败', err);
                });
              }
            case 4:
              return _context.a(2);
          }
        }, _callee, null, [[0, 2]]);
      }))();
    },
    /* 当前品牌预设：sun / error / water */activePreset: function activePreset() {
      var s = Store.settings;
      if (s.themePreset && D.PRESETS[s.themePreset]) return s.themePreset;
      var theme = D.THEMES[U.clampInt(s.themeIndex, 0, D.THEMES.length - 1, 8)] || D.THEMES[8];
      return theme && theme.preset ? theme.preset : 'water';
    },
    presetInfo: function presetInfo() {
      return D.PRESETS[this.activePreset()] || D.PRESETS.sun;
    },
    /* ---- 主题：太阳神 / 错误文档预设 + 一天四段自动换色 ---- */applyTheme: function applyTheme() {
      var root = document.documentElement;
      var s = Store.settings;
      var preset = this.activePreset();
      var presetInfo = D.PRESETS[preset] || D.PRESETS.sun;
      var phase = D.phaseOf(new Date(), preset);
      var idx = U.clampInt(s.themeIndex, 0, D.THEMES.length - 1, 8);
      var theme = s.autoTheme ? phase.theme : D.THEMES[idx] || D.THEMES[8];
      root.style.setProperty('--theme', theme.main);
      root.style.setProperty('--theme-deep', theme.deep);
      root.style.setProperty('--theme-soft', theme.soft);
      root.style.setProperty('--theme-rgb', hexToRgb(theme.main));
      root.style.setProperty('--preset-accent', theme.main);
      root.style.setProperty('--preset-deep', theme.deep);
      root.style.setProperty('--preset-soft', theme.soft);
      /* 边框/分隔线跟随主题色，避免换到橙、蓝、紫时仍残留水色边线 */
      root.style.setProperty('--line', 'rgba(' + hexToRgb(theme.main) + ', ' + (preset === 'error' ? '0.28' : '0.18') + ')');
      var darkPreset = preset === 'error';
      root.style.setProperty('--phase-veil', s.autoTheme || darkPreset ? phase.veil : 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.86))');
      root.setAttribute('data-preset', preset);
      root.setAttribute('data-phase', phase.key || 'noon');
      root.setAttribute('data-phase-auto', s.autoTheme ? 'on' : 'off');
      root.setAttribute('data-preset-dark', darkPreset ? 'on' : 'off');
      root.setAttribute('data-preset-emoji', presetInfo.emoji || '☀️');
      this.lastPhaseKey = phase.key;
      this.updatePhaseLabel(phase);
      if (typeof this.renderDelight === 'function') this.renderDelight();
    },
    /* 更新今日页 / 设置页的时段标签 */updatePhaseLabel: function updatePhaseLabel(phase) {
      var preset = this.activePreset();
      var presetInfo = D.PRESETS[preset] || D.PRESETS.sun;
      var p = phase || D.phaseOf(new Date(), preset);
      var label = $('#heroPhase');
      if (label) {
        label.textContent = Store.settings.autoTheme ? p.emoji + ' ' + p.name + ' · ' + p.label + ' · ' + presetInfo.emoji + ' ' + presetInfo.name : presetInfo.emoji + ' ' + presetInfo.name + ' · ' + p.emoji + ' ' + p.name + '（手动）';
      }
      var mood = $('#heroMood');
      if (mood) mood.textContent = p.mood;
    },
    /* ---- 背景 ---- */applyBackground: function applyBackground() {
      var s = Store.settings;
      var layer = $('#bgLayer');
      var image = $('#bgImage');
      if (!layer || !image) return;
      var presetKey = this.activePreset();
      var presetInfo = D.PRESETS[presetKey] || D.PRESETS.sun;
      var phase = D.phaseOf(new Date(), presetKey);
      var preset = D.BACKGROUNDS.filter(function (b) {
        return b.id === s.bgId;
      })[0];
      var presetCss = preset ? preset.css : D.BACKGROUNDS[0].css;
      /* 旧存档/默认水光背景在品牌预设下自动换成对应底色 */
      if (s.bgId === 'aqua' && presetInfo && presetInfo.bg) presetCss = presetInfo.bg;

      /* 优先级：自定义背景色 > 跟随时段背景（错误文档强制暗底） > 预设背景 */
      var followPhase = (!!s.autoTheme || presetKey === 'error') && !!s.bgFollowPhase && !s.bgColor && !s.bgImage;
      layer.style.background = s.bgColor ? s.bgColor : followPhase ? phase.bg : presetCss;
      layer.classList.toggle('is-night', presetKey === 'error' || !!s.autoTheme && !s.bgColor && phase.key === 'night');
      document.documentElement.style.setProperty('--phase-veil', s.autoTheme || presetKey === 'error' ? phase.veil : 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.86))');
      if (s.bgImage && this.bgObjectUrl) {
        layer.classList.add('has-image');
        image.style.backgroundImage = 'url("' + this.bgObjectUrl + '")';
      } else {
        layer.classList.remove('has-image');
        image.style.backgroundImage = 'none';
      }
    },
    loadBgImage: function loadBgImage() {
      var _this2 = this;
      return _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
        var filename, blob, _t2;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              filename = Store.settings.bgImage;
              if (filename) {
                _context2.n = 1;
                break;
              }
              return _context2.a(2);
            case 1:
              if (!(!window.wusiFile || typeof window.wusiFile.read !== 'function')) {
                _context2.n = 2;
                break;
              }
              console.warn('[App] 文件存储不可用，跳过背景图加载');
              return _context2.a(2);
            case 2:
              _context2.p = 2;
              _context2.n = 3;
              return window.wusiFile.read(filename);
            case 3:
              blob = _context2.v;
              if (blob) {
                if (_this2.bgObjectUrl) URL.revokeObjectURL(_this2.bgObjectUrl);
                _this2.bgObjectUrl = URL.createObjectURL(blob);
                _this2.applyBackground();
              }
              _context2.n = 5;
              break;
            case 4:
              _context2.p = 4;
              _t2 = _context2.v;
              console.warn('[App] 背景图读取失败', _t2);
            case 5:
              return _context2.a(2);
          }
        }, _callee2, null, [[2, 4]]);
      }))();
    },
    /* ---- 时钟 ---- */startClock: function startClock() {
      if (this.clockTimer) clearInterval(this.clockTimer);
      var self = this;
      this.updateNextClass();
      this.clockTimer = setInterval(function () {
        self.updateNextClass();
      }, 1000);
    },
    /* ---- 统一渲染 ---- */renderAll: function renderAll() {
      this.renderSchedule();
      this.renderToday();
      this.renderHeader();
      if (typeof this.renderDelight === 'function') this.renderDelight();
      if (typeof this.pushWidgetData === 'function') this.pushWidgetData();
    },
    renderHeader: function renderHeader() {
      var map = {
        schedule: '☀️ 太阳神课程表',
        today: '🐈 太阳神的一天',
        apps: '🧰 太阳神小程序',
        import: '📄 太阳神收课表',
        me: '🌻 太阳神的小窝'
      };
      var title = $('#headerTitle');
      if (title) title.textContent = map[this.state.tab] || '太阳神的随身陪伴课程表';
      this.updatePhaseLabel();
    }
  };

  /* 暴露给其他模块使用（views.js / editor.js / import-ui.js / settings.js） */
  window.App = App;
  window.AppUI = UI;
  window.AppHelpers = {
    $: $,
    $$: $$,
    esc: esc,
    fmtClock: fmtClock,
    hexToRgb: hexToRgb
  };
  document.addEventListener('DOMContentLoaded', function () {
    App.init();
  });
})();