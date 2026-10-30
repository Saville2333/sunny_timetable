/* ============================================================
 * 太阳神的随身陪伴课程表 · 小猫 / 颜文字 / 错误文档氛围
 * 根据预设（太阳神 / 错误文档）、时段、天气和今日课程数轮换文案
 * ============================================================ */
(function () {
  'use strict';

  var Store = window.AppStore;
  var D = window.AppData;
  var App = window.App;
  var H = window.AppHelpers;
  var $ = H.$;
  var esc = H.esc;
  var CATS = ['🐈‍⬛', '🐈', '😺', '😸', '🐱', '😼', '🙀', '🐾'];
  var KAOMOJI = ['(=^･ω･^=)', 'ฅ^•ﻌ•^ฅ', '(๑•̀ㅂ•́)و✧', '(˶ᵔ ᵕ ᵔ˶)', '₍˄·͈༝·͈˄*₎◞ ̑̑', '( ˘ω˘ )', 'ヽ(•‿•)ノ', '( •̀ ω •́ )✧', '૮₍ ˃ ⤙ ˂ ₎ა', '(´･ω･`)', 'ᓚᘏᗢ', '(=①ω①=)'];
  var SUN_WORDS = ['太阳神把光装进你的书包，出发！', '今天的太阳是限量款，记得抬头看看 ☀️', '猫猫说：晒到太阳的地方，就没有坏心情。', '太阳神批准你今天慢慢来，但别迟到喵。', '把课表晒一晒，霉运就会蒸发 ☀️', '今天的光刚刚好，适合认真上课，也适合偷看窗外。', '猫猫把好运塞进你的笔袋，记得带笔。', '太阳神说：先把今天过好，明天会自己发光。', '如果有点累，就借猫猫的尾巴靠一下。', '你是今天太阳系里最值得被照亮的那颗。', '早八不是敌人，没吃早饭才是。', '先把水杯装满，再把自己装满勇气。'];
  var ERROR_WORDS = ['⚠️ 错误文档 #404：猫猫没有找到摆烂许可。', '❌ 警告：你已连续学习 25 分钟，建议摸摸猫。', '⚠️ 系统提示：太阳神正在修复你的早八 bug。', '❌ 这份课表没有错误，只有一点猫毛。', '⚠️ 错误文档已归档：请带着猫猫继续前进。', '❌ ERROR：检测到过度努力，猫猫建议喝口水。', '⚠️ 警告：今天的人类又在偷偷变厉害。', '❌ 错误日志：快乐模块运行正常，请勿关闭。'];
  var RAIN_WORDS = ['☔ 雨滴正在给课表降温，猫猫把伞叼来了。', '⚠️ 天气警告：忘记带伞会被猫猫嘲笑。', '🌧 太阳神今天开了柔光滤镜，适合穿外套。', '☔ 雨声是白噪音，猫猫建议你带好雨具。', '🌧 下雨天适合慢一点，也适合喝热的。', '☔ 猫猫说：雨会停，课也总会下。'];
  var NO_CLASS_WORDS = ['今天没有课，猫猫批准你晒太阳 20 分钟。', '空课表 detected：适合睡觉、吃饭、发呆。', '没有课的一天，连错误文档都变得可爱了。', '猫猫已经把今天的自由时间打包好了。', '没课不是空白，是给生活留的呼吸位。', '去走走、去吃点好的，今天不用赶路。', '太阳神给你放了一天假，记得签收。'];
  var HERO_WORDS = ['太阳神说：今天也要发光 ☀️', '猫猫说：先照顾好自己，再照顾课表 🐈‍⬛', '今天的光，刚好够你慢慢来。', '把今天过成喜欢的样子，不用完美。', '早八会结束，午饭会到来。', '你负责认真，猫猫负责运气。', '太阳每天升起，你也可以每天重新开始。', '课表是地图，不是枷锁。'];
  function hash(text) {
    var h = 2166136261;
    var s = String(text || '');
    for (var i = 0; i < s.length; i += 1) {
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
    var w = App.weather;
    if (!w || !w.current) return '';
    var code = Number(w.current.code);
    if ([95, 96, 99, 82].indexOf(code) >= 0) return 'storm';
    if (code >= 51 && code <= 67 || code >= 80 && code <= 82) return 'rain';
    if (code >= 71 && code <= 77 || code === 85 || code === 86) return 'snow';
    return '';
  }
  App.renderDelight = function () {
    var catEl = $('#catWhisperCat');
    var kaoEl = $('#catWhisperKao');
    var textEl = $('#catWhisperText');
    var badgeEl = $('#catWhisperBadge');
    var stampEl = $('#heroStamp');
    if (!textEl) return;
    var preset = typeof this.activePreset === 'function' ? this.activePreset() : 'sun';
    var presetInfo = D.PRESETS[preset] || D.PRESETS.sun;
    var phase = D.phaseOf(new Date(), preset);
    var scene = weatherScene();
    var courses = [];
    try {
      courses = Store.todayCourses();
    } catch (e) {
      courses = [];
    }
    var seed = hash([U_dateKey(), preset, phase.key, scene, courses.length, Store.settings.nickname].join('|'));
    var cat = CATS[seed % CATS.length];
    var kao = KAOMOJI[(seed >> 3) % KAOMOJI.length];
    var text;
    if (preset === 'error') text = pick(ERROR_WORDS, seed >> 2);else if (scene === 'rain' || scene === 'storm') text = pick(RAIN_WORDS, seed >> 2);else if (!courses.length) text = pick(NO_CLASS_WORDS, seed >> 2);else text = pick(SUN_WORDS, seed >> 1);
    if (courses.length && preset !== 'error' && scene !== 'rain') {
      text = '☀️ 今天有 ' + courses.length + ' 节课。' + text;
    }
    if (catEl) catEl.textContent = cat;
    if (kaoEl) kaoEl.textContent = kao;
    textEl.textContent = text;
    if (badgeEl) badgeEl.textContent = preset === 'error' ? '⚠️ ERROR' : '☀️ SUN';
    if (stampEl) stampEl.textContent = preset === 'error' ? '⚠️ ERROR DOC' : '☀️ SUN MODE';
    document.documentElement.setAttribute('data-mood', preset === 'error' ? 'error' : scene || phase.key);
  };
  function U_dateKey() {
    var d = new Date();
    var p = function p(n) {
      return String(n).padStart(2, '0');
    };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  /* 点猫猫换一条，增加可玩性 */
  App.cycleCatWhisper = function () {
    var kaoEl = $('#catWhisperKao');
    var catEl = $('#catWhisperCat');
    var textEl = $('#catWhisperText');
    if (!kaoEl || !textEl) return;
    var current = kaoEl.textContent;
    var index = KAOMOJI.indexOf(current);
    index = (index + 1) % KAOMOJI.length;
    kaoEl.textContent = KAOMOJI[index];
    if (catEl) catEl.textContent = CATS[(index + 3) % CATS.length];
    var preset = typeof this.activePreset === 'function' ? this.activePreset() : 'sun';
    var seed = Date.now() + index;
    var list = preset === 'error' ? ERROR_WORDS : !Store.todayCourses().length ? NO_CLASS_WORDS : SUN_WORDS;
    textEl.textContent = '🐾 ' + pick(list, seed);
    var mood = $('#heroMood');
    if (mood) mood.textContent = pick(HERO_WORDS, seed >> 3);
    if (window.AppUI) window.AppUI.toast('🐾 ' + KAOMOJI[index]);
  };
  App.cycleHeroMood = function () {
    var mood = $('#heroMood');
    if (!mood) return;
    mood.textContent = pick(HERO_WORDS, Date.now());
  };
  App.bindDelightEvents = function () {
    if (this._delightBound) return;
    this._delightBound = true;
    var cat = $('#catWhisper');
    if (cat) {
      cat.addEventListener('click', function () {
        App.cycleCatWhisper();
      });
    }
    var mood = $('#heroMood');
    if (mood) {
      mood.style.cursor = 'pointer';
      mood.title = '点我换一句';
      mood.addEventListener('click', function () {
        App.cycleHeroMood();
      });
    }
  };
})();
/* ============ 小猫与颜文字模块结束 ============ */