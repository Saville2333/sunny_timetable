/* ============================================================
 * 太阳神属性 / 成就 / 成绩 / 彩蛋
 * ============================================================ */
(function () {
  'use strict';

  const App = window.App;
  const Store = window.AppStore;
  const U = window.AppUtils;
  const UI = window.AppUI;
  const H = window.AppHelpers;
  const $ = H.$;
  const esc = H.esc;

  const ATTR_KEY = 'wusi_attributes_v1';
  const ACH_KEY = 'wusi_achievements_v1';
  const STATS_KEY = 'wusi_progress_stats_v1';
  const CLASS_KEY = 'wusi_class_attendance_v1';

  const ATTRS = [
    { key: 'knowledge', name: '学识', emoji: '📚', color: '#4c8dff' },
    { key: 'execution', name: '执行', emoji: '⚡', color: '#f0a30a' },
    { key: 'vitality', name: '元气', emoji: '🌿', color: '#2e9b72' },
    { key: 'charm', name: '魅力', emoji: '✨', color: '#b06ad9' }
  ];

  const ACHIEVEMENTS = [
    { id: 'hello', emoji: '🌅', name: '初见太阳', desc: '打开太阳神课程表', check: function (s) { return s.visits >= 1; } },
    { id: 'first-class', emoji: '📖', name: '第一节课', desc: '完成一节课', check: function (s) { return s.classes >= 1; } },
    { id: 'full-day', emoji: '🔥', name: '满课日', desc: '完成 4 节课', check: function (s) { return s.classes >= 4; } },
    { id: 'todo-one', emoji: '✅', name: '待办起步', desc: '完成 1 个待办', check: function (s) { return s.todos >= 1; } },
    { id: 'todo-ten', emoji: '🧹', name: '待办达人', desc: '完成 10 个待办', check: function (s) { return s.todos >= 10; } },
    { id: 'focus-25', emoji: '⏱️', name: '专注新手', desc: '累计专注 25 分钟', check: function (s) { return s.focusMinutes >= 25; } },
    { id: 'focus-120', emoji: '🧘', name: '专注两小时', desc: '累计专注 120 分钟', check: function (s) { return s.focusMinutes >= 120; } },
    { id: 'note-three', emoji: '📝', name: '笔记收藏家', desc: '保存 3 次课程笔记', check: function (s) { return s.notes >= 3; } },
    { id: 'save-one', emoji: '🐖', name: '攒钱第一步', desc: '给攒钱计划存一笔', check: function (s) { return s.savings >= 1; } },
    { id: 'exam-one', emoji: '📊', name: '成绩记录员', desc: '记录 1 次考试成绩', check: function (s) { return s.exams >= 1; } },
    { id: 'coins-ten', emoji: '🪙', name: '第一桶太阳币', desc: '拥有 10 枚太阳币', check: function (s) { return s.coins >= 10; } },
    { id: 'split', emoji: '☀️⚠️', name: '双面人格', desc: '使用「太阳神 × 错误文档」主题', check: function (s) { return !!s.split; } },
    { id: 'easter', emoji: '🥚', name: '太阳神降临', desc: '发现一个隐藏彩蛋', check: function (s) { return !!s.easter; } }
  ];

  function read(key, fallback) {
    const v = Store.read(key);
    return v === null || v === undefined ? fallback : v;
  }

  function loadAttrs() {
    const raw = read(ATTR_KEY, {});
    const out = {};
    ATTRS.forEach(function (a) {
      const item = raw[a.key] || {};
      out[a.key] = {
        xp: Math.max(0, Number(item.xp) || 0),
        level: Math.max(1, Math.min(30, Number(item.level) || 1))
      };
    });
    return out;
  }

  function attrNeed(level) {
    return 100 + (level - 1) * 60;
  }

  function loadStats() {
    const raw = read(STATS_KEY, {});
    return {
      visits: Number(raw.visits) || 0,
      classes: Number(raw.classes) || 0,
      todos: Number(raw.todos) || 0,
      focusMinutes: Number(raw.focusMinutes) || 0,
      notes: Number(raw.notes) || 0,
      savings: Number(raw.savings) || 0,
      exams: Number(raw.exams) || 0,
      split: !!raw.split,
      easter: !!raw.easter
    };
  }

  function saveStats(stats) {
    Store.write(STATS_KEY, stats);
  }

  function loadAchievements() {
    const raw = read(ACH_KEY, {});
    return raw && typeof raw === 'object' ? raw : {};
  }

  function saveAchievements(map) {
    Store.write(ACH_KEY, map);
  }

  function renderAttributes() {
    const box = $('#attributeList');
    if (!box) return;
    const attrs = loadAttrs();
    let maxLevel = 1;
    box.innerHTML = ATTRS.map(function (a) {
      const item = attrs[a.key];
      maxLevel = Math.max(maxLevel, item.level);
      const need = attrNeed(item.level);
      const pct = Math.min(100, item.xp / need * 100);
      return '<div class="attr-row">' +
        '<span class="attr-icon">' + a.emoji + '</span>' +
        '<div class="attr-main"><div class="attr-head"><b>' + a.name + '</b><span>Lv.' + item.level + '</span></div>' +
        '<div class="attr-bar"><i style="width:' + pct.toFixed(1) + '%;background:' + a.color + '"></i></div></div>' +
        '<small class="attr-xp">' + item.xp + '/' + need + '</small>' +
        '</div>';
    }).join('');
    const total = $('#attributeTotal');
    if (total) total.textContent = 'Lv.' + maxLevel;
  }

  App.addAttribute = function (key, amount, reason) {
    const attrs = loadAttrs();
    if (!attrs[key]) return;
    attrs[key].xp += Math.max(0, Math.floor(Number(amount) || 0));
    let leveled = false;
    while (attrs[key].xp >= attrNeed(attrs[key].level) && attrs[key].level < 30) {
      attrs[key].xp -= attrNeed(attrs[key].level);
      attrs[key].level += 1;
      leveled = true;
    }
    Store.write(ATTR_KEY, attrs);
    renderAttributes();
    if (leveled) {
      const a = ATTRS.filter(function (x) { return x.key === key; })[0];
      UI.toast('✨ ' + (a ? a.name : '属性') + ' 升到 Lv.' + attrs[key].level + '！');
      if (App.addSunCoins) App.addSunCoins(2, '属性升级');
      App.fireConfetti(18);
    }
    if (reason) UI.toast('+' + amount + ' ' + (ATTRS.filter(function (x) { return x.key === key; })[0] || {}).name);
    return attrs[key];
  };

  App.fireConfetti = function (count) {
    try {
      const layer = document.createElement('div');
      layer.className = 'confetti-layer';
      const colors = ['#f0a30a', '#ffd45c', '#4c8dff', '#68c9a4', '#d64545', '#b06ad9'];
      const n = Math.max(8, Math.min(60, Number(count) || 24));
      for (let i = 0; i < n; i += 1) {
        const p = document.createElement('i');
        p.style.left = (10 + Math.random() * 80) + '%';
        p.style.background = colors[i % colors.length];
        p.style.animationDelay = (Math.random() * 0.25) + 's';
        p.style.transform = 'rotate(' + Math.round(Math.random() * 360) + 'deg)';
        p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
        layer.appendChild(p);
      }
      document.body.appendChild(layer);
      setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 2200);
    } catch (e) { /* ignore */ }
  };

  function unlock(id) {
    const map = loadAchievements();
    if (map[id]) return;
    const a = ACHIEVEMENTS.filter(function (x) { return x.id === id; })[0];
    if (!a) return;
    map[id] = Date.now();
    saveAchievements(map);
    UI.toast('🏆 成就解锁：' + a.emoji + ' ' + a.name);
    if (App.addSunCoins) App.addSunCoins(3, '成就解锁');
    App.fireConfetti(28);
    renderAchievements();
  }

  function checkAchievements() {
    const stats = loadStats();
    stats.coins = App.getSunCoins ? App.getSunCoins() : 0;
    ACHIEVEMENTS.forEach(function (a) {
      if (a.check(stats)) unlock(a.id);
    });
  }

  function renderAchievements() {
    const box = $('#achievementGrid');
    if (!box) return;
    const map = loadAchievements();
    const unlocked = ACHIEVEMENTS.filter(function (a) { return !!map[a.id]; });
    const stats = $('#achievementStats');
    if (stats) stats.textContent = unlocked.length + ' / ' + ACHIEVEMENTS.length;
    box.innerHTML = ACHIEVEMENTS.map(function (a) {
      const on = !!map[a.id];
      return '<div class="achievement-item' + (on ? ' is-on' : '') + '">' +
        '<span class="ach-icon">' + (on ? a.emoji : '🔒') + '</span>' +
        '<div class="ach-main"><b>' + esc(a.name) + '</b><small>' + esc(a.desc) + '</small></div>' +
        '</div>';
    }).join('');
  }

  App.progressEvent = function (type, value) {
    const stats = loadStats();
    if (type === 'visit') stats.visits += 1;
    if (type === 'class') { stats.classes += 1; App.addAttribute('knowledge', 8); App.addAttribute('vitality', 3); }
    if (type === 'todo') { stats.todos += 1; App.addAttribute('execution', 10); App.addAttribute('charm', 2); }
    if (type === 'focus') {
      const min = Math.max(1, Number(value) || 1);
      stats.focusMinutes += min;
      App.addAttribute('vitality', Math.max(1, Math.round(min / 2)));
      App.addAttribute('knowledge', Math.max(1, Math.round(min / 5)));
    }
    if (type === 'note') { stats.notes += 1; App.addAttribute('knowledge', 5); App.addAttribute('charm', 2); }
    if (type === 'savings') { stats.savings += 1; App.addAttribute('execution', 6); }
    if (type === 'exam') { stats.exams += 1; App.addAttribute('knowledge', 10); }
    if (type === 'split') stats.split = true;
    if (type === 'easter') stats.easter = true;
    saveStats(stats);
    checkAchievements();
  };

  /* 每节课完成后加属性；每门课每天只算一次 */
  function checkClassAttendance() {
    try {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const today = U.dateKey(now);
      let map = read(CLASS_KEY, {});
      if (!map || typeof map !== 'object') map = {};
      let changed = false;
      Store.todayCourses().forEach(function (course) {
        const end = Store.periodTime(course.end);
        const endMin = U.timeToMinutes(end.end);
        if (nowMin < endMin || nowMin > endMin + 20) return;
        const key = today + '_' + course.id;
        if (map[key]) return;
        map[key] = 1;
        changed = true;
        App.progressEvent('class');
      });
      if (changed) {
        const keys = Object.keys(map);
        if (keys.length > 120) {
          keys.slice(0, keys.length - 90).forEach(function (k) { delete map[k]; });
        }
        Store.write(CLASS_KEY, map);
      }
    } catch (e) { /* ignore */ }
  }

  function renderExams() {
    const box = $('#examList');
    if (!box) return;
    const exams = (Store.settings.exams || []).slice().sort(function (a, b) {
      return String(b.date).localeCompare(String(a.date));
    });
    const stats = $('#examStats');
    if (stats) {
      if (!exams.length) stats.textContent = '暂无';
      else {
        const avg = exams.reduce(function (sum, e) { return sum + (e.score / e.full * 100); }, 0) / exams.length;
        stats.textContent = exams.length + ' 次 · 平均 ' + avg.toFixed(1) + '%';
      }
    }
    if (!exams.length) {
      box.innerHTML = '<div class="planner-empty">记录一次考试成绩，猫猫帮你保存 📝</div>';
      return;
    }
    box.innerHTML = exams.map(function (e) {
      const pct = e.full > 0 ? e.score / e.full * 100 : 0;
      return '<div class="exam-row">' +
        '<div class="exam-main"><b>' + esc(e.title) + '</b><small>' + esc(e.date || '未填日期') + '</small></div>' +
        '<div class="exam-score">' + e.score + '<small>/ ' + e.full + '</small></div>' +
        '<div class="exam-pct">' + pct.toFixed(0) + '%</div>' +
        '<button class="todo-del" type="button" data-exam-del="' + esc(e.id) + '" aria-label="删除">🗑</button>' +
        '</div>';
    }).join('');
  }

  function addExam() {
    const name = $('#examName');
    const date = $('#examDate');
    const score = $('#examScore');
    const full = $('#examFull');
    const title = name ? name.value.trim() : '';
    if (!title) { UI.toast('先写考试名称'); return; }
    const list = (Store.settings.exams || []).slice();
    list.push({
      id: 'ex_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      title: title.slice(0, 24),
      date: date ? date.value : '',
      score: Math.max(0, Number(score && score.value) || 0),
      full: Math.max(1, Number(full && full.value) || 100)
    });
    Store.updateSettings({ exams: list }).then(function () {
      if (name) name.value = '';
      if (score) score.value = '';
      renderExams();
      App.progressEvent('exam');
      UI.toast('成绩已记录 📝');
    });
  }

  function bind() {
    const add = $('#btnAddExam');
    if (add) add.addEventListener('click', addExam);
    const list = $('#examList');
    if (list) {
      list.addEventListener('click', function (e) {
        const del = e.target.closest('[data-exam-del]');
        if (!del) return;
        const exams = (Store.settings.exams || []).filter(function (x) { return x.id !== del.dataset.examDel; });
        Store.updateSettings({ exams: exams }).then(function () {
          renderExams();
          UI.toast('成绩记录已删除');
        });
      });
    }

    /* 隐藏彩蛋：太阳印章点 7 次 / 头像点 5 次 */
    let stampClicks = 0;
    let stampTimer = null;
    const stamp = $('#heroStamp');
    if (stamp) {
      stamp.addEventListener('click', function () {
        stampClicks += 1;
        clearTimeout(stampTimer);
        stampTimer = setTimeout(function () { stampClicks = 0; }, 4000);
        if (stampClicks >= 7) {
          stampClicks = 0;
          App.progressEvent('easter');
          if (App.addSunCoins) App.addSunCoins(10, '发现太阳神彩蛋');
          UI.toast('🥚 彩蛋：太阳神说，今天也被你发现了。');
          App.fireConfetti(40);
        }
      });
    }
    let avatarClicks = 0;
    let avatarTimer = null;
    const avatar = $('#avatarBox');
    if (avatar) {
      avatar.addEventListener('click', function () {
        avatarClicks += 1;
        clearTimeout(avatarTimer);
        avatarTimer = setTimeout(function () { avatarClicks = 0; }, 3500);
        if (avatarClicks >= 5) {
          avatarClicks = 0;
          UI.toast('🐈‍⬛ 猫猫：别戳了，再戳就掉毛了。');
          App.fireConfetti(18);
        }
      });
    }
  }

  App.renderProgress = function () {
    renderAttributes();
    renderAchievements();
    renderExams();
  };

  /* 包装渲染 */
  const origRenderToday = App.renderToday;
  App.renderToday = function () {
    origRenderToday.apply(this, arguments);
    renderAttributes();
  };
  const origRenderSettings = App.renderSettings;
  App.renderSettings = function () {
    origRenderSettings.apply(this, arguments);
    renderAchievements();
    renderExams();
  };
  const origBind = App.bindEvents;
  App.bindEvents = function () {
    origBind.apply(this, arguments);
    bind();
  };
  const origInit = App.init;
  App.init = async function () {
    await origInit.apply(this, arguments);
    App.progressEvent('visit');
    renderAttributes();
    renderAchievements();
    renderExams();
    checkClassAttendance();
    setInterval(checkClassAttendance, 30000);
  };

  const origTheme = App.applyTheme;
  App.applyTheme = function () {
    origTheme.apply(this, arguments);
    if (Store.settings && Store.settings.themePreset === 'split') {
      App.progressEvent('split');
    }
  };
})();
