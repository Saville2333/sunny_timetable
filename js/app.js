/* ============================================================
 * 星海课表 · 主逻辑
 * 课表渲染 / 今日 / 导入 / 设置 / 课程编辑 / 主题与背景
 * ============================================================ */
(function () {
  'use strict';

  const Store = window.AppStore;
  const U = window.AppUtils;
  const D = window.AppData;
  const Importer = window.AppImporter;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || '').trim());
    if (!m) return '35, 196, 216';
    return parseInt(m[1], 16) + ', ' + parseInt(m[2], 16) + ', ' + parseInt(m[3], 16);
  }

  function fmtClock(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return U.pad2(h) + ':' + U.pad2(m) + ':' + U.pad2(sec);
  }

  /* ---------------- 轻提示与模态 ---------------- */
  const UI = {
    _toastTimer: null,
    _confirmOk: null,

    toast(msg) {
      const el = $('#toast');
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

    showModal(html) {
      const mask = $('#modalMask');
      const card = $('#modalCard');
      if (!mask || !card) return;
      card.innerHTML = html;
      mask.hidden = false;
      card.scrollTop = 0;
    },

    closeModal() {
      const mask = $('#modalMask');
      const card = $('#modalCard');
      if (!mask || !card) return;
      mask.hidden = true;
      card.innerHTML = '';
      this._confirmOk = null;
    },

    confirm(options) {
      const opt = options || {};
      this.showModal(
        '<div class="modal-title">' + esc(opt.title || '确认操作') + '</div>' +
        (opt.sub ? '<div class="modal-sub">' + esc(opt.sub) + '</div>' : '<div style="height:8px"></div>') +
        '<div class="modal-actions">' +
        '<button class="btn ghost" type="button" data-action="modal-cancel">取消</button>' +
        '<button class="btn ' + (opt.danger ? 'danger-ghost' : 'primary') + '" type="button" data-action="modal-ok">' +
        esc(opt.okText || '确定') + '</button>' +
        '</div>'
      );
      this._confirmOk = typeof opt.onOk === 'function' ? opt.onOk : null;
    }
  };

  /* ---------------- 应用主体 ---------------- */
  const App = {
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

    async init() {
      try {
        await Store.init();
      } catch (e) {
        console.error('[App] 数据初始化失败', e);
      }

      if (window.__hideBootFallback) window.__hideBootFallback();

      this.state.week = Store.currentWeek();
      this.applyTheme();
      this.applyBackground();
      this.renderAll();
      this.renderSettings();
      this.bindEvents();
      this.startClock();
      this.loadBgImage();

      /* 启动天气与穿搭（独立模块，失败不影响课表） */
      if (typeof this.startWeather === 'function') {
        try {
          this.startWeather();
        } catch (err) {
          console.error('[App] 天气模块启动失败', err);
        }
      }

      /* 启动时段配色与提醒引擎（模块由 rhythm.js / food.js 提供，脚本加载完成后才执行） */
      if (typeof this.startWidgetSync === 'function') {
        try { this.startWidgetSync(); } catch (err) { console.warn('[App] 小组件同步启动失败', err); }
      }

      if (typeof this.startLife === 'function') {
        try {
          this.startLife();
        } catch (err) {
          console.error('[App] 时段与提醒模块启动失败', err);
        }
      }

      try {
        history.replaceState({ page: 'tab', tab: 'schedule' }, '', '#schedule');
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
    },

    /* 当前品牌预设：sun / error / water */
    activePreset() {
      const s = Store.settings;
      if (s.themePreset && D.PRESETS[s.themePreset]) return s.themePreset;
      const theme = D.THEMES[U.clampInt(s.themeIndex, 0, D.THEMES.length - 1, 8)] || D.THEMES[8];
      return theme && theme.preset ? theme.preset : 'water';
    },

    presetInfo() {
      return D.PRESETS[this.activePreset()] || D.PRESETS.sun;
    },

    /* ---- 主题：太阳神 / 错误文档预设 + 一天四段自动换色 ---- */
    applyTheme() {
      const root = document.documentElement;
      const s = Store.settings;
      const preset = this.activePreset();
      const presetInfo = D.PRESETS[preset] || D.PRESETS.sun;
      const phase = D.phaseOf(new Date(), preset);
      const idx = U.clampInt(s.themeIndex, 0, D.THEMES.length - 1, 8);
      const theme = s.autoTheme ? phase.theme : (D.THEMES[idx] || D.THEMES[8]);

      root.style.setProperty('--theme', theme.main);
      root.style.setProperty('--theme-deep', theme.deep);
      root.style.setProperty('--theme-soft', theme.soft);
      root.style.setProperty('--theme-rgb', hexToRgb(theme.main));
      root.style.setProperty('--preset-accent', theme.main);
      root.style.setProperty('--preset-deep', theme.deep);
      root.style.setProperty('--preset-soft', theme.soft);
      /* 边框/分隔线跟随主题色，避免换到橙、蓝、紫时仍残留水色边线 */
      root.style.setProperty('--line', 'rgba(' + hexToRgb(theme.main) + ', ' + (preset === 'error' ? '0.28' : '0.18') + ')');
      const darkPreset = preset === 'error';
      root.style.setProperty(
        '--phase-veil',
        (s.autoTheme || darkPreset)
          ? phase.veil
          : 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.86))'
      );

      root.setAttribute('data-preset', preset);
      root.setAttribute('data-phase', phase.key || 'noon');
      root.setAttribute('data-phase-auto', s.autoTheme ? 'on' : 'off');
      root.setAttribute('data-preset-dark', darkPreset ? 'on' : 'off');
      root.setAttribute('data-preset-emoji', presetInfo.emoji || '☀️');

      this.lastPhaseKey = phase.key;
      this.updatePhaseLabel(phase);
      if (typeof this.renderDelight === 'function') this.renderDelight();
    },

    /* 更新今日页 / 设置页的时段标签 */
    updatePhaseLabel(phase) {
      const preset = this.activePreset();
      const presetInfo = D.PRESETS[preset] || D.PRESETS.sun;
      const p = phase || D.phaseOf(new Date(), preset);
      const label = $('#heroPhase');
      if (label) {
        label.textContent = Store.settings.autoTheme
          ? p.emoji + ' ' + p.name + ' · ' + p.label + ' · ' + presetInfo.emoji + ' ' + presetInfo.name
          : presetInfo.emoji + ' ' + presetInfo.name + ' · ' + p.emoji + ' ' + p.name + '（手动）';
      }
      const mood = $('#heroMood');
      if (mood) mood.textContent = p.mood;
    },

    /* ---- 背景 ---- */
    applyBackground() {
      const s = Store.settings;
      const layer = $('#bgLayer');
      const image = $('#bgImage');
      if (!layer || !image) return;

      const presetKey = this.activePreset();
      const presetInfo = D.PRESETS[presetKey] || D.PRESETS.sun;
      const phase = D.phaseOf(new Date(), presetKey);
      const preset = D.BACKGROUNDS.filter(function (b) { return b.id === s.bgId; })[0];
      let presetCss = preset ? preset.css : D.BACKGROUNDS[0].css;
      /* 旧存档/默认水光背景在品牌预设下自动换成对应底色 */
      if (s.bgId === 'aqua' && presetInfo && presetInfo.bg) presetCss = presetInfo.bg;

      /* 优先级：自定义背景色 > 跟随时段背景（错误文档强制暗底） > 预设背景 */
      const followPhase = (!!s.autoTheme || presetKey === 'error') && !!s.bgFollowPhase && !s.bgColor && !s.bgImage;
      layer.style.background = s.bgColor ? s.bgColor : (followPhase ? phase.bg : presetCss);
      layer.classList.toggle('is-night', presetKey === 'error' || (!!s.autoTheme && !s.bgColor && phase.key === 'night'));
      document.documentElement.style.setProperty(
        '--phase-veil',
        (s.autoTheme || presetKey === 'error')
          ? phase.veil
          : 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.86))'
      );

      if (s.bgImage && this.bgObjectUrl) {
        layer.classList.add('has-image');
        image.style.backgroundImage = 'url("' + this.bgObjectUrl + '")';
      } else {
        layer.classList.remove('has-image');
        image.style.backgroundImage = 'none';
      }
    },

    async loadBgImage() {
      const filename = Store.settings.bgImage;
      if (!filename) return;
      if (!window.wusiFile || typeof window.wusiFile.read !== 'function') {
        console.warn('[App] 文件存储不可用，跳过背景图加载');
        return;
      }
      try {
        const blob = await window.wusiFile.read(filename);
        if (blob) {
          if (this.bgObjectUrl) URL.revokeObjectURL(this.bgObjectUrl);
          this.bgObjectUrl = URL.createObjectURL(blob);
          this.applyBackground();
        }
      } catch (e) {
        console.warn('[App] 背景图读取失败', e);
      }
    },

    /* ---- 时钟 ---- */
    startClock() {
      if (this.clockTimer) clearInterval(this.clockTimer);
      const self = this;
      this.updateNextClass();
      this.clockTimer = setInterval(function () {
        self.updateNextClass();
      }, 1000);
    },

    /* ---- 统一渲染 ---- */
    renderAll() {
      this.renderSchedule();
      this.renderToday();
      this.renderHeader();
      if (typeof this.renderDelight === 'function') this.renderDelight();
      if (typeof this.pushWidgetData === 'function') this.pushWidgetData();
    },

    renderHeader() {
      const map = {
        schedule: '☀️ 太阳神课程表',
        today: '🐈 太阳神的一天',
        apps: '🧰 太阳神小程序',
        import: '📄 太阳神收课表',
        me: '🌻 太阳神的小窝'
      };
      const title = $('#headerTitle');
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
