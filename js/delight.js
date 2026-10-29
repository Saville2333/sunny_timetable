/* ============================================================
 * 太阳神的随身陪伴课程表 · 小猫 / 颜文字 / 错误文档氛围
 * 根据预设（太阳神 / 错误文档）、时段、天气和今日课程数轮换文案
 * ============================================================ */
(function () {
  'use strict';

  const Store = window.AppStore;
  const D = window.AppData;
  const App = window.App;
  const H = window.AppHelpers;
  const $ = H.$;
  const esc = H.esc;

  const CATS = ['🐈‍⬛', '🐈', '😺', '😸', '🐱', '😼', '🙀', '🐾'];
  const KAOMOJI = [
    '(=^･ω･^=)',
    'ฅ^•ﻌ•^ฅ',
    '(๑•̀ㅂ•́)و✧',
    '(˶ᵔ ᵕ ᵔ˶)',
    '₍˄·͈༝·͈˄*₎◞ ̑̑',
    '( ˘ω˘ )',
    'ヽ(•‿•)ノ',
    '( •̀ ω •́ )✧',
    '૮₍ ˃ ⤙ ˂ ₎ა',
    '(´･ω･`)',
    'ᓚᘏᗢ',
    '(=①ω①=)'
  ];
  const SUN_WORDS = [
    '太阳神把光装进你的书包，出发！',
    '今天的太阳是限量款，记得抬头看看 ☀️',
    '猫猫说：晒到太阳的地方，就没有坏心情。',
    '太阳神批准你今天慢慢来，但别迟到喵。',
    '把课表晒一晒，霉运就会蒸发 ☀️'
  ];
  const ERROR_WORDS = [
    '⚠️ 错误文档 #404：猫猫没有找到摆烂许可。',
    '❌ 警告：你已连续学习 25 分钟，建议摸摸猫。',
    '⚠️ 系统提示：太阳神正在修复你的早八 bug。',
    '❌ 这份课表没有错误，只有一点猫毛。',
    '⚠️ 错误文档已归档：请带着猫猫继续前进。'
  ];
  const RAIN_WORDS = [
    '☔ 雨滴正在给课表降温，猫猫把伞叼来了。',
    '⚠️ 天气警告：忘记带伞会被猫猫嘲笑。',
    '🌧 太阳神今天开了柔光滤镜，适合穿外套。',
    '☔ 雨声是白噪音，猫猫建议你带好雨具。'
  ];
  const NO_CLASS_WORDS = [
    '今天没有课，猫猫批准你晒太阳 20 分钟。',
    '空课表 detected：适合睡觉、吃饭、发呆。',
    '没有课的一天，连错误文档都变得可爱了。',
    '猫猫已经把今天的自由时间打包好了。'
  ];

  function hash(text) {
    let h = 2166136261;
    const s = String(text || '');
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }

  function pick(list, seed) {
    if (!list || !list.length) return '';
    return list[seed % list.length];
  }

  function weatherScene() {
    const w = App.weather;
    if (!w || !w.current) return '';
    const code = Number(w.current.code);
    if ([95, 96, 99, 82].indexOf(code) >= 0) return 'storm';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    return '';
  }

  App.renderDelight = function () {
    const catEl = $('#catWhisperCat');
    const kaoEl = $('#catWhisperKao');
    const textEl = $('#catWhisperText');
    const badgeEl = $('#catWhisperBadge');
    const stampEl = $('#heroStamp');
    if (!textEl) return;

    const preset = typeof this.activePreset === 'function' ? this.activePreset() : 'sun';
    const presetInfo = D.PRESETS[preset] || D.PRESETS.sun;
    const phase = D.phaseOf(new Date(), preset);
    const scene = weatherScene();
    let courses = [];
    try { courses = Store.todayCourses(); } catch (e) { courses = []; }

    const seed = hash([
      U_dateKey(),
      preset,
      phase.key,
      scene,
      courses.length,
      Store.settings.nickname
    ].join('|'));
    const cat = CATS[seed % CATS.length];
    const kao = KAOMOJI[(seed >> 3) % KAOMOJI.length];

    let text;
    if (preset === 'error') text = pick(ERROR_WORDS, seed >> 2);
    else if (scene === 'rain' || scene === 'storm') text = pick(RAIN_WORDS, seed >> 2);
    else if (!courses.length) text = pick(NO_CLASS_WORDS, seed >> 2);
    else text = pick(SUN_WORDS, seed >> 1);
    if (courses.length && preset !== 'error' && scene !== 'rain') {
      text = '☀️ 今天有 ' + courses.length + ' 节课。' + text;
    }

    if (catEl) catEl.textContent = cat;
    if (kaoEl) kaoEl.textContent = kao;
    textEl.textContent = text;
    if (badgeEl) badgeEl.textContent = preset === 'error' ? '⚠️ ERROR' : '☀️ SUN';
    if (stampEl) stampEl.textContent = preset === 'error' ? '⚠️ ERROR DOC' : '☀️ SUN MODE';
    document.documentElement.setAttribute('data-mood', preset === 'error' ? 'error' : (scene || phase.key));
  };

  function U_dateKey() {
    const d = new Date();
    const p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  /* 点猫猫换一条，增加可玩性 */
  App.cycleCatWhisper = function () {
    const kaoEl = $('#catWhisperKao');
    const catEl = $('#catWhisperCat');
    const textEl = $('#catWhisperText');
    if (!kaoEl || !textEl) return;
    const current = kaoEl.textContent;
    let index = KAOMOJI.indexOf(current);
    index = (index + 1) % KAOMOJI.length;
    kaoEl.textContent = KAOMOJI[index];
    if (catEl) catEl.textContent = CATS[(index + 3) % CATS.length];
    const preset = typeof this.activePreset === 'function' ? this.activePreset() : 'sun';
    textEl.textContent = preset === 'error'
      ? '⚠️ 猫猫说：错误文档已经被我踩住了，继续上课吧。'
      : '☀️ 猫猫说：太阳神听见你的召唤了，今天也会顺利的。';
    if (window.AppUI) window.AppUI.toast('🐾 ' + KAOMOJI[index]);
  };

  App.bindDelightEvents = function () {
    if (this._delightBound) return;
    this._delightBound = true;
    const cat = $('#catWhisper');
    if (cat) {
      cat.addEventListener('click', function () {
        App.cycleCatWhisper();
      });
    }
  };
})();
/* ============ 小猫与颜文字模块结束 ============ */
