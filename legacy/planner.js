function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
/* ============================================================
 * 太阳神课程表 · 作息 / 自习 / 倒计时 / 待办
 * 不引入依赖，全部数据保存在本机 settings 中
 * ============================================================ */
(function () {
  'use strict';

  var Store = window.AppStore;
  var U = window.AppUtils;
  var D = window.AppData;
  var App = window.App;
  var UI = window.AppUI;
  var H = window.AppHelpers;
  var $ = H.$;
  var esc = H.esc;
  var PROMPT_KEY = 'wusi_homework_prompted_v1';
  var TYPE_EMOJI = {
    holiday: '🎉',
    vacation: '🌴',
    exam: '📝',
    other: '⏳'
  };
  var TYPE_NAME = {
    holiday: '法定节假日',
    vacation: '寒暑假',
    exam: '考试',
    other: '其他'
  };
  function settings() {
    return Store.settings || {};
  }
  function todayKey() {
    return U.dateKey(new Date());
  }
  function daysUntil(dateStr) {
    if (!dateStr) return null;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var target = new Date(dateStr + 'T00:00:00');
    if (isNaN(target.getTime())) return null;
    return Math.round((target - today) / 86400000);
  }
  function nextRepeatDate(dateStr) {
    var days = daysUntil(dateStr);
    if (days === null) return dateStr;
    if (days >= 0) return dateStr;
    var d = new Date(dateStr + 'T00:00:00');
    var now = new Date();
    while (d < now) d.setFullYear(d.getFullYear() + 1);
    return U.dateKey(d);
  }
  function getCountdowns() {
    var list = (settings().countdowns || []).map(function (item) {
      var date = item.repeat ? nextRepeatDate(item.date) : item.date;
      return {
        id: item.id,
        title: item.title,
        date: date,
        originalDate: item.date,
        type: TYPE_EMOJI[item.type] ? item.type : 'other',
        emoji: item.emoji || TYPE_EMOJI[item.type] || '⏳',
        repeat: !!item.repeat,
        days: daysUntil(date)
      };
    }).filter(function (item) {
      return item.days !== null;
    }).sort(function (a, b) {
      return a.days - b.days;
    });
    return list;
  }
  function saveTodos(todos) {
    return Store.updateSettings({
      todos: todos
    });
  }
  function saveCountdowns(list) {
    return Store.updateSettings({
      countdowns: list
    });
  }
  function renderTodoList() {
    var box = $('#todoList');
    if (!box) return;
    var todos = (settings().todos || []).slice().sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    var done = todos.filter(function (t) {
      return t.done;
    }).length;
    var stats = $('#todoStats');
    if (stats) stats.textContent = done + ' / ' + todos.length;
    if (!todos.length) {
      box.innerHTML = '<div class="planner-empty">还没有待办。下课时猫猫会来提醒你记作业 ฅ^•ﻌ•^ฅ</div>';
      return;
    }
    box.innerHTML = todos.map(function (item) {
      return '<div class="todo-row' + (item.done ? ' is-done' : '') + '">' + '<label class="todo-check"><input type="checkbox" data-todo-done="' + esc(item.id) + '"' + (item.done ? ' checked' : '') + ' /><span></span></label>' + '<div class="todo-body"><div class="todo-text">' + esc(item.text) + '</div>' + (item.course ? '<div class="todo-meta">📘 ' + esc(item.course) + '</div>' : '') + (item.due ? '<div class="todo-meta">⏰ ' + esc(item.due) + '</div>' : '') + '</div>' + '<button class="todo-del" type="button" data-todo-del="' + esc(item.id) + '" aria-label="删除">🗑</button>' + '</div>';
    }).join('');
  }
  function addTodo(text, course) {
    var clean = String(text || '').trim();
    if (!clean) {
      UI.toast('先写点什么吧 ฅ^•ﻌ•^ฅ');
      return null;
    }
    var todos = (settings().todos || []).slice();
    var item = {
      id: 'td_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      text: clean.slice(0, 200),
      course: String(course || '').slice(0, 40),
      due: '',
      done: false,
      createdAt: Date.now()
    };
    todos.push(item);
    saveTodos(todos).then(function () {
      renderTodoList();
      App.renderToday();
      UI.toast('已加入待办 ✅');
    });
    return item;
  }
  function toggleTodo(id, done) {
    var todos = (settings().todos || []).map(function (item) {
      if (item.id !== id) return item;
      return Object.assign({}, item, {
        done: !!done
      });
    });
    saveTodos(todos).then(renderTodoList);
  }
  function deleteTodo(id) {
    var todos = (settings().todos || []).filter(function (item) {
      return item.id !== id;
    });
    saveTodos(todos).then(function () {
      renderTodoList();
      UI.toast('待办已删除');
    });
  }
  function renderCountdowns() {
    var strip = $('#countdownStrip');
    var all = $('#countdownAll');
    var stats = $('#countdownStats');
    if (!strip) return;
    var list = getCountdowns();
    var nearest = list.filter(function (item) {
      return item.days >= 0;
    });
    if (stats) stats.textContent = nearest.length ? '最近 ' + (nearest[0].days === 0 ? '今天' : 'D-' + nearest[0].days) : '暂无';
    if (!nearest.length) {
      strip.innerHTML = '<div class="planner-empty">还没有倒计时。到「小窝 → 假期 / 考试倒计时」添加一个吧 ⏳</div>';
      if (all) all.innerHTML = '';
      return;
    }
    var top = nearest.slice(0, 3);
    strip.innerHTML = top.map(function (item) {
      var dayText = item.days === 0 ? '就是今天' : '还有 ' + item.days + ' 天';
      return '<div class="cd-card cd-' + item.type + '">' + '<div class="cd-emoji">' + esc(item.emoji) + '</div>' + '<div class="cd-main"><div class="cd-title">' + esc(item.title) + '</div>' + '<div class="cd-sub">' + esc(item.date) + ' · ' + dayText + '</div></div>' + '<div class="cd-days">' + (item.days === 0 ? '今天' : 'D-' + item.days) + '</div>' + '</div>';
    }).join('');
    if (all) {
      var rest = nearest.slice(3);
      all.innerHTML = rest.length ? rest.map(function (item) {
        return '<div class="cd-line"><span>' + esc(item.emoji) + ' ' + esc(item.title) + '</span>' + '<span>' + (item.days === 0 ? '今天' : 'D-' + item.days) + '</span></div>';
      }).join('') : '';
    }
  }
  function weeksLabel(weeks) {
    if (!weeks || !weeks.length) return '全部周';
    try {
      return Store.weeksText(weeks);
    } catch (e) {
      return weeks.join(',') + ' 周';
    }
  }
  function isStudyThisWeek(item) {
    if (!item || !item.weeks || !item.weeks.length) return true;
    var week = Store.currentWeek();
    return item.weeks.indexOf(week) >= 0;
  }
  function appendTodayExtra(html) {
    var list = $('#todayList');
    if (!list) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    while (wrap.firstChild) list.appendChild(wrap.firstChild);
  }
  function clearExtras(selector) {
    H.$$('.extra-item' + (selector ? '.' + selector : '')).forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  }
  function renderSelfStudy() {
    var study = settings().selfStudy || {};
    var items = [{
      key: 'morning',
      icon: '🌅',
      label: '早自习',
      data: study.morning
    }, {
      key: 'evening',
      icon: '🌙',
      label: '晚自习',
      data: study.evening
    }].filter(function (item) {
      return item.data && item.data.enabled && isStudyThisWeek(item.data);
    });
    clearExtras('study-extra');
    if (!items.length) return;
    appendTodayExtra(items.map(function (item) {
      var start = item.data.start || '--:--';
      var end = item.data.end || '--:--';
      return '<div class="today-item extra-item study-extra">' + '<div class="ti-time"><div class="ti-start">' + esc(start) + '</div><div class="ti-end">' + esc(end) + '</div></div>' + '<div class="ti-card extra-card study-card">' + '<div class="ti-head"><span class="ti-name">' + item.icon + ' ' + item.label + '</span>' + '<span class="ti-badge">' + esc(weeksLabel(item.data.weeks)) + '</span></div>' + '<div class="ti-meta">' + (item.data.place ? '<span>📍 ' + esc(item.data.place) + '</span>' : '') + '<span>🕯️ 自定义自习</span></div>' + '</div></div>';
    }).join(''));
  }
  function renderMealBreaks() {
    var breaks = settings().mealBreaks || {};
    var items = [{
      key: 'lunch',
      icon: '🍜',
      data: breaks.lunch
    }, {
      key: 'dinner',
      icon: '🌙',
      data: breaks.dinner
    }].filter(function (item) {
      return item.data && item.data.enabled;
    });
    clearExtras('meal-extra');
    if (!items.length) return;
    appendTodayExtra(items.map(function (item) {
      return '<div class="today-item extra-item meal-extra">' + '<div class="ti-time"><div class="ti-start">' + esc(item.data.start) + '</div><div class="ti-end">' + esc(item.data.end) + '</div></div>' + '<div class="ti-card extra-card meal-card">' + '<div class="ti-head"><span class="ti-name">' + item.icon + ' ' + esc(item.data.label || '休息') + '</span></div>' + '<div class="ti-meta"><span>🍚 吃饭、喝水、休息一下</span></div>' + '</div></div>';
    }).join(''));
  }
  function renderMealStrip() {
    var box = $('#mealStrip');
    if (!box) return;
    var breaks = settings().mealBreaks || {};
    var items = [{
      icon: '🍜',
      data: breaks.lunch
    }, {
      icon: '🌙',
      data: breaks.dinner
    }].filter(function (item) {
      return item.data && item.data.enabled;
    });
    if (!items.length) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    box.hidden = false;
    box.innerHTML = items.map(function (item) {
      return '<span class="meal-pill">' + item.icon + ' ' + esc(item.data.label || '休息') + ' <b>' + esc(item.data.start) + ' - ' + esc(item.data.end) + '</b></span>';
    }).join('');
  }
  function renderMealSettings() {
    var box = $('#mealBreakEditor');
    if (!box) return;
    var breaks = settings().mealBreaks || {};
    var items = [{
      key: 'lunch',
      icon: '🍜',
      label: '午休'
    }, {
      key: 'dinner',
      icon: '🌙',
      label: '晚饭'
    }];
    box.innerHTML = items.map(function (item) {
      var data = breaks[item.key] || {};
      return '<div class="meal-edit">' + '<div class="sse-head"><span>' + item.icon + ' ' + item.label + '</span>' + '<label class="switch"><input type="checkbox" data-meal-enabled="' + item.key + '"' + (data.enabled !== false ? ' checked' : '') + ' /><span class="switch-track"><span class="switch-dot"></span></span></label></div>' + '<div class="sse-fields">' + '<input class="input compact" type="text" maxlength="8" data-meal-label="' + item.key + '" value="' + esc(data.label || item.label) + '" />' + '<input class="input compact time" type="time" data-meal-start="' + item.key + '" value="' + esc(data.start || '') + '" />' + '<span class="pr-dash">—</span>' + '<input class="input compact time" type="time" data-meal-end="' + item.key + '" value="' + esc(data.end || '') + '" />' + '</div></div>';
    }).join('');
  }
  function renderPlannerToday() {
    renderTodoList();
    renderCountdowns();
    renderSelfStudy();
    renderMealBreaks();
  }
  function periodRow(index, time, total) {
    var duration = Math.max(0, U.timeToMinutes(time.end) - U.timeToMinutes(time.start));
    return '<div class="period-row">' + '<span class="pr-no">第 ' + index + ' 节</span>' + '<input class="input compact time" type="time" data-period-start="' + index + '" value="' + esc(time.start) + '" />' + '<span class="pr-dash">—</span>' + '<input class="input compact time" type="time" data-period-end="' + index + '" value="' + esc(time.end) + '" />' + '<span class="pr-duration">' + (duration > 0 ? duration + ' 分' : '—') + '</span>' + '</div>';
  }
  function renderPeriodEditor() {
    var box = $('#periodEditor');
    if (!box) return;
    var count = U.clampInt(settings().sections, 6, 12, 10);
    var times = settings().periodTimes || D.PERIOD_TIMES;
    var html = '';
    for (var i = 1; i <= count; i += 1) {
      html += periodRow(i, times[i - 1] || D.PERIOD_TIMES[i - 1], count);
    }
    box.innerHTML = html;
    var durInput = $('#setClassDuration');
    if (durInput) durInput.value = settings().classDuration || 45;
    var brInput = $('#setBreakDuration');
    if (brInput) brInput.value = settings().breakDuration || 10;
  }
  function renderSelfStudyEditor() {
    var box = $('#selfStudyEditor');
    if (!box) return;
    var study = settings().selfStudy || {};
    var items = [{
      key: 'morning',
      icon: '🌅',
      label: '早自习'
    }, {
      key: 'evening',
      icon: '🌙',
      label: '晚自习'
    }];
    box.innerHTML = items.map(function (item) {
      var data = study[item.key] || {};
      var total = U.clampInt(settings().totalWeeks, 1, 30, 18);
      var weeks = Array.isArray(data.weeks) ? data.weeks : [];
      var all = !weeks.length;
      var chips = '';
      for (var w = 1; w <= total; w += 1) {
        chips += '<button type="button" class="week-chip' + (all || weeks.indexOf(w) >= 0 ? ' is-on' : '') + '" data-study-week="' + item.key + '" data-week="' + w + '">' + w + '</button>';
      }
      return '<div class="self-study-edit">' + '<div class="sse-head"><span>' + item.icon + ' ' + item.label + '</span>' + '<label class="switch"><input type="checkbox" data-study-enabled="' + item.key + '"' + (data.enabled ? ' checked' : '') + ' /><span class="switch-track"><span class="switch-dot"></span></span></label></div>' + '<div class="sse-fields">' + '<input class="input compact time" type="time" data-study-start="' + item.key + '" value="' + esc(data.start || '') + '" />' + '<span class="pr-dash">—</span>' + '<input class="input compact time" type="time" data-study-end="' + item.key + '" value="' + esc(data.end || '') + '" />' + '<input class="input compact" type="text" maxlength="16" data-study-place="' + item.key + '" value="' + esc(data.place || '') + '" placeholder="地点" />' + '</div>' + '<div class="week-chip-label">所在周 · ' + (all ? '全部周' : weeksLabel(weeks)) + '</div>' + '<div class="week-chips">' + chips + '</div>' + '</div>';
    }).join('');
  }
  function renderCountdownSettings() {
    var box = $('#countdownSettingsList');
    if (!box) return;
    var list = settings().countdowns || [];
    if (!list.length) {
      box.innerHTML = '<div class="planner-empty">可以添加：期末考试、寒假、暑假、国庆……</div>';
      return;
    }
    box.innerHTML = list.slice().sort(function (a, b) {
      return String(a.date).localeCompare(String(b.date));
    }).map(function (item) {
      var type = TYPE_EMOJI[item.type] ? item.type : 'other';
      return '<div class="countdown-setting-row">' + '<span class="cs-emoji">' + esc(item.emoji || TYPE_EMOJI[type]) + '</span>' + '<div class="cs-main"><b>' + esc(item.title) + '</b><small>' + esc(item.date) + ' · ' + TYPE_NAME[type] + (item.repeat ? ' · 每年' : '') + '</small></div>' + '<button class="todo-del" type="button" data-cd-del="' + esc(item.id) + '" aria-label="删除">🗑</button>' + '</div>';
    }).join('');
  }
  function renderCountdownPresets() {
    var box = $('#countdownPresets');
    if (!box) return;
    var presets = [{
      key: 'newyear',
      label: '元旦',
      type: 'holiday',
      month: 1,
      day: 1
    }, {
      key: 'labor',
      label: '劳动节',
      type: 'holiday',
      month: 5,
      day: 1
    }, {
      key: 'national',
      label: '国庆',
      type: 'holiday',
      month: 10,
      day: 1
    }, {
      key: 'winter',
      label: '寒假',
      type: 'vacation',
      month: 1,
      day: 20
    }, {
      key: 'summer',
      label: '暑假',
      type: 'vacation',
      month: 7,
      day: 1
    }, {
      key: 'final',
      label: '期末考试',
      type: 'exam',
      days: 60
    }];
    box.innerHTML = presets.map(function (p) {
      return '<button type="button" class="cd-preset" data-cd-preset="' + p.key + '">' + p.label + '</button>';
    }).join('');
  }
  function applyPreset(key) {
    var now = new Date();
    var year = now.getFullYear();
    function nextMonthDay(month, day) {
      var d = new Date(year, month - 1, day);
      if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) d = new Date(year + 1, month - 1, day);
      return U.dateKey(d);
    }
    var map = {
      newyear: ['元旦', 'holiday', nextMonthDay(1, 1), true],
      labor: ['劳动节', 'holiday', nextMonthDay(5, 1), true],
      national: ['国庆', 'holiday', nextMonthDay(10, 1), true],
      winter: ['寒假', 'vacation', nextMonthDay(1, 20), false],
      summer: ['暑假', 'vacation', nextMonthDay(7, 1), false],
      final: ['期末考试', 'exam', U.dateKey(new Date(Date.now() + 60 * 86400000)), false]
    };
    var item = map[key];
    if (!item) return;
    var title = $('#cdTitle');
    var date = $('#cdDate');
    var type = $('#cdType');
    var repeat = $('#cdRepeat');
    if (title) title.value = item[0];
    if (date) date.value = item[2];
    if (type) type.value = item[1];
    if (repeat) repeat.checked = item[3];
    UI.toast('已填入「' + item[0] + '」，可改日期后点添加');
  }
  function addCountdown() {
    var title = $('#cdTitle');
    var date = $('#cdDate');
    var type = $('#cdType');
    var repeat = $('#cdRepeat');
    var name = title ? title.value.trim() : '';
    var dateValue = date ? date.value : '';
    if (!name) {
      UI.toast('先写倒计时名称');
      return;
    }
    if (!dateValue || !U.parseDate(dateValue)) {
      UI.toast('选一个日期');
      return;
    }
    var list = (settings().countdowns || []).slice();
    list.push({
      id: 'cd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      title: name.slice(0, 20),
      date: dateValue,
      type: type ? type.value : 'other',
      emoji: TYPE_EMOJI[type && type.value || 'other'] || '⏳',
      repeat: !!(repeat && repeat.checked)
    });
    saveCountdowns(list).then(function () {
      if (title) title.value = '';
      if (date) date.value = '';
      if (repeat) repeat.checked = false;
      renderCountdownSettings();
      renderCountdowns();
      App.renderToday();
      UI.toast('倒计时已添加 ⏳');
    });
  }
  function updatePeriod(index, key, value) {
    if (!/^\d{1,2}:\d{2}$/.test(String(value || ''))) return;
    var times = (settings().periodTimes || []).map(function (item) {
      return {
        start: item.start,
        end: item.end
      };
    });
    if (!times[index - 1]) return;
    times[index - 1][key] = value;
    if (U.timeToMinutes(times[index - 1].end) <= U.timeToMinutes(times[index - 1].start)) {
      UI.toast('下课时间要晚于上课时间');
      return;
    }
    Store.updateSettings({
      periodTimes: times
    }).then(function () {
      App.renderSchedule();
      App.renderToday();
      renderPeriodEditor();
      if (typeof App.pushWidgetData === 'function') App.pushWidgetData();
      UI.toast('第 ' + index + ' 节时间已更新 ⏰');
    });
  }
  function applyDuration() {
    var input = $('#setClassDuration');
    var duration = U.clampInt(input ? input.value : 45, 20, 180, 45);
    var times = (settings().periodTimes || []).map(function (item) {
      return {
        start: item.start,
        end: item.end
      };
    });
    times.forEach(function (item) {
      var start = U.timeToMinutes(item.start);
      var end = Math.min(23 * 60 + 59, start + duration);
      item.end = U.pad2(Math.floor(end / 60)) + ':' + U.pad2(end % 60);
    });
    Store.updateSettings({
      periodTimes: times,
      classDuration: duration
    }).then(function () {
      renderPeriodEditor();
      App.renderSchedule();
      App.renderToday();
      if (typeof App.pushWidgetData === 'function') App.pushWidgetData();
      UI.toast('所有课程时长已改为 ' + duration + ' 分钟');
    });
  }
  function reapplyPeriods() {
    var duration = U.clampInt($('#setClassDuration') ? $('#setClassDuration').value : 45, 20, 180, 45);
    var breakMin = U.clampInt($('#setBreakDuration') ? $('#setBreakDuration').value : 10, 0, 60, 10);
    var times = (settings().periodTimes || []).map(function (item) {
      return {
        start: item.start,
        end: item.end
      };
    });
    var first = U.timeToMinutes(times[0] ? times[0].start : '08:00');
    times.forEach(function (item) {
      var start = first;
      var end = Math.min(23 * 60 + 59, start + duration);
      item.start = U.pad2(Math.floor(start / 60)) + ':' + U.pad2(start % 60);
      item.end = U.pad2(Math.floor(end / 60)) + ':' + U.pad2(end % 60);
      first = Math.min(23 * 60 + 59, end + breakMin);
    });
    Store.updateSettings({
      periodTimes: times,
      classDuration: duration,
      breakDuration: breakMin
    }).then(function () {
      renderPeriodEditor();
      App.renderSchedule();
      App.renderToday();
      if (typeof App.pushWidgetData === 'function') App.pushWidgetData();
      UI.toast('已按 ' + duration + ' 分钟 + ' + breakMin + ' 分钟课间重排，午休可手动调整');
    });
  }
  function updateStudy(key, patch) {
    var study = Object.assign({}, settings().selfStudy || {});
    study[key] = Object.assign({}, study[key] || {}, patch);
    Store.updateSettings({
      selfStudy: study
    }).then(function () {
      renderSelfStudyEditor();
      renderSelfStudy();
      App.renderToday();
    });
  }
  function updateMeal(key, patch) {
    var breaks = Object.assign({}, settings().mealBreaks || {});
    breaks[key] = Object.assign({}, breaks[key] || {}, patch);
    Store.updateSettings({
      mealBreaks: breaks
    }).then(function () {
      renderMealSettings();
      renderMealStrip();
      App.renderToday();
    });
  }
  function closeTodoPopup() {
    var popup = $('#todoPopup');
    if (popup) popup.hidden = true;
    App._todoPromptKey = '';
  }
  function markPrompted(key) {
    if (!key) return;
    App._promptedMap = App._promptedMap || {};
    App._promptedMap[key] = 1;
    try {
      var raw = localStorage.getItem(PROMPT_KEY);
      var map = raw ? JSON.parse(raw) : {};
      map[key] = Date.now();
      var keys = Object.keys(map);
      if (keys.length > 80) {
        keys.sort(function (a, b) {
          return map[a] - map[b];
        }).slice(0, keys.length - 60).forEach(function (k) {
          delete map[k];
        });
      }
      localStorage.setItem(PROMPT_KEY, JSON.stringify(map));
    } catch (e) {/* file:// 或隐私模式忽略 */}
  }
  function wasPrompted(key) {
    if (App._promptedMap && App._promptedMap[key]) return true;
    try {
      var raw = localStorage.getItem(PROMPT_KEY);
      return !!(raw && JSON.parse(raw)[key]);
    } catch (e) {
      return false;
    }
  }
  function checkHomeworkPrompt() {
    if (settings().autoHomework === false) return;
    if (document.hidden) return;
    var popup = $('#todoPopup');
    if (!popup || !popup.hidden) return;
    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var courses = Store.todayCourses ? Store.todayCourses() : [];
    var _loop = function _loop() {
        var course = courses[i];
        var end = Store.periodTime(course.end);
        var endMin = U.timeToMinutes(end.end);
        if (nowMin < endMin || nowMin > endMin + 10) return 0; // continue
        var key = todayKey() + '_' + course.id + '_' + end.end;
        if (wasPrompted(key)) return 0; // continue
        App._todoPromptKey = key;
        var title = $('#todoPopupTitle');
        var sub = $('#todoPopupCourse');
        var text = $('#todoPopupText');
        if (title) title.textContent = '「' + course.name + '」下课啦';
        if (sub) sub.textContent = end.end + ' 下课 · 记一下作业或待办，别让猫猫忘记';
        App._todoPromptCourse = course.name;
        if (text) text.value = '';
        popup.hidden = false;
        setTimeout(function () {
          if (text) text.focus();
        }, 80);
        return {
          v: void 0
        };
      },
      _ret;
    for (var i = 0; i < courses.length; i += 1) {
      _ret = _loop();
      if (_ret === 0) continue;
      if (_ret) return _ret.v;
    }
  }
  function bindTodoEvents() {
    var list = $('#todoList');
    if (list) {
      list.addEventListener('change', function (e) {
        var input = e.target.closest('[data-todo-done]');
        if (!input) return;
        toggleTodo(input.dataset.todoDone, input.checked);
      });
      list.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-todo-del]');
        if (btn) deleteTodo(btn.dataset.todoDel);
      });
    }
    var add = $('#btnAddTodo');
    var input = $('#todoInput');
    function addFromInput() {
      if (!input) return;
      var item = addTodo(input.value, '');
      if (item) input.value = '';
    }
    if (add) add.addEventListener('click', addFromInput);
    if (input) input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addFromInput();
      }
    });
    var popup = $('#todoPopup');
    if (popup) {
      popup.addEventListener('click', function (e) {
        if (e.target.closest('[data-todo-close]')) {
          markPrompted(App._todoPromptKey);
          closeTodoPopup();
        }
      });
      var save = $('#btnTodoPopupSave');
      if (save) save.addEventListener('click', function () {
        var text = $('#todoPopupText');
        var courseName = App._todoPromptCourse || '';
        if (text && text.value.trim()) {
          addTodo(text.value, courseName);
          markPrompted(App._todoPromptKey);
          closeTodoPopup();
        } else {
          UI.toast('写点作业内容再保存吧 ฅ^•ﻌ•^ฅ');
        }
      });
    }
  }
  function bindSettingsEvents() {
    var editor = $('#periodEditor');
    if (editor) {
      editor.addEventListener('change', function (e) {
        var start = e.target.closest('[data-period-start]');
        if (start) {
          updatePeriod(Number(start.dataset.periodStart), 'start', start.value);
          return;
        }
        var end = e.target.closest('[data-period-end]');
        if (end) updatePeriod(Number(end.dataset.periodEnd), 'end', end.value);
      });
    }
    var apply = $('#btnApplyDuration');
    if (apply) apply.addEventListener('click', applyDuration);
    var reapply = $('#btnReapplyPeriods');
    if (reapply) reapply.addEventListener('click', reapplyPeriods);
    var study = $('#selfStudyEditor');
    if (study) {
      study.addEventListener('change', function (e) {
        var enabled = e.target.closest('[data-study-enabled]');
        if (enabled) {
          updateStudy(enabled.dataset.studyEnabled, {
            enabled: enabled.checked
          });
          return;
        }
        var start = e.target.closest('[data-study-start]');
        if (start) {
          updateStudy(start.dataset.studyStart, {
            start: start.value
          });
          return;
        }
        var end = e.target.closest('[data-study-end]');
        if (end) {
          updateStudy(end.dataset.studyEnd, {
            end: end.value
          });
          return;
        }
        var place = e.target.closest('[data-study-place]');
        if (place) updateStudy(place.dataset.studyPlace, {
          place: place.value
        });
      });
      study.addEventListener('click', function (e) {
        var chip = e.target.closest('[data-study-week]');
        if (!chip) return;
        var key = chip.dataset.studyWeek;
        var week = Number(chip.dataset.week);
        var total = U.clampInt(settings().totalWeeks, 1, 30, 18);
        var data = (settings().selfStudy || {})[key] || {};
        var weeks = Array.isArray(data.weeks) ? data.weeks.slice() : [];
        if (!weeks.length) {
          for (var w = 1; w <= total; w += 1) weeks.push(w);
        }
        if (weeks.indexOf(week) >= 0) weeks = weeks.filter(function (w) {
          return w !== week;
        });else weeks.push(week);
        weeks.sort(function (a, b) {
          return a - b;
        });
        if (!weeks.length) weeks = [];
        updateStudy(key, {
          weeks: weeks
        });
      });
    }
    var meal = $('#mealBreakEditor');
    if (meal) {
      meal.addEventListener('change', function (e) {
        var enabled = e.target.closest('[data-meal-enabled]');
        if (enabled) {
          updateMeal(enabled.dataset.mealEnabled, {
            enabled: enabled.checked
          });
          return;
        }
        var label = e.target.closest('[data-meal-label]');
        if (label) {
          updateMeal(label.dataset.mealLabel, {
            label: label.value
          });
          return;
        }
        var start = e.target.closest('[data-meal-start]');
        if (start) {
          updateMeal(start.dataset.mealStart, {
            start: start.value
          });
          return;
        }
        var end = e.target.closest('[data-meal-end]');
        if (end) updateMeal(end.dataset.mealEnd, {
          end: end.value
        });
      });
    }
    var addCd = $('#btnAddCountdown');
    if (addCd) addCd.addEventListener('click', addCountdown);
    var presets = $('#countdownPresets');
    if (presets) {
      presets.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-cd-preset]');
        if (btn) applyPreset(btn.dataset.cdPreset);
      });
    }
    var cdList = $('#countdownSettingsList');
    if (cdList) {
      cdList.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-cd-del]');
        if (!btn) return;
        var list = (settings().countdowns || []).filter(function (item) {
          return item.id !== btn.dataset.cdDel;
        });
        saveCountdowns(list).then(function () {
          renderCountdownSettings();
          renderCountdowns();
          App.renderToday();
          UI.toast('倒计时已删除');
        });
      });
    }
    var alpha = $('#setUiAlpha');
    if (alpha) {
      alpha.addEventListener('input', function () {
        var value = Math.max(0.45, Math.min(1, Number(alpha.value) / 100));
        document.documentElement.style.setProperty('--box-alpha', String(value));
        var label = $('#uiAlphaText');
        if (label) label.textContent = Math.round(value * 100) + '%';
      });
      alpha.addEventListener('change', function () {
        var value = Math.max(0.45, Math.min(1, Number(alpha.value) / 100));
        Store.updateSettings({
          uiAlpha: value
        }).then(function () {
          App.applyUiAlpha();
          UI.toast('卡片透明度已保存');
        });
      });
    }
    var autoHomework = $('#setAutoHomework');
    if (autoHomework) {
      autoHomework.addEventListener('change', function () {
        Store.updateSettings({
          autoHomework: !!autoHomework.checked
        }).then(function () {
          UI.toast(autoHomework.checked ? '下课后会提醒记作业 📚' : '已关闭下课作业提醒');
        });
      });
    }
  }
  App.applyUiAlpha = function () {
    var value = Math.max(0.45, Math.min(1, Number(settings().uiAlpha) || 0.93));
    document.documentElement.style.setProperty('--box-alpha', String(value));
  };
  App.renderPlannerToday = renderPlannerToday;
  App.renderPlannerSettings = function () {
    renderPeriodEditor();
    renderSelfStudyEditor();
    renderMealSettings();
    renderCountdownSettings();
    renderCountdownPresets();
    var alpha = $('#setUiAlpha');
    if (alpha) {
      var value = Math.max(45, Math.min(100, Math.round((Number(settings().uiAlpha) || 0.93) * 100)));
      alpha.value = String(value);
      var label = $('#uiAlphaText');
      if (label) label.textContent = value + '%';
    }
    var autoHomework = $('#setAutoHomework');
    if (autoHomework) autoHomework.checked = settings().autoHomework !== false;
    App.applyUiAlpha();
  };
  var plannerBound = false;
  App.bindPlannerEvents = function () {
    if (plannerBound) return;
    plannerBound = true;
    bindTodoEvents();
    bindSettingsEvents();
  };
  if (document.readyState !== 'loading') {
    App.bindPlannerEvents();
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      App.bindPlannerEvents();
    });
  }
  App.startPlanner = function () {
    this.applyUiAlpha();
    renderPlannerToday();
    renderMealStrip();
    if (this._plannerTimer) clearInterval(this._plannerTimer);
    this._plannerTimer = setInterval(function () {
      checkHomeworkPrompt();
      renderSelfStudy();
    }, 20000);
    setTimeout(checkHomeworkPrompt, 2500);
  };

  /* 包裹现有渲染与初始化，避免改动原模块太多 */
  var origRenderToday = App.renderToday;
  App.renderToday = function () {
    origRenderToday.apply(this, arguments);
    if (typeof this.renderPlannerToday === 'function') this.renderPlannerToday();
  };
  var origRenderSchedule = App.renderSchedule;
  App.renderSchedule = function () {
    origRenderSchedule.apply(this, arguments);
    renderMealStrip();
  };
  var origRenderSettings = App.renderSettings;
  App.renderSettings = function () {
    origRenderSettings.apply(this, arguments);
    if (typeof this.renderPlannerSettings === 'function') this.renderPlannerSettings();
  };
  var origBindEvents = App.bindEvents;
  App.bindEvents = function () {
    origBindEvents.apply(this, arguments);
    if (typeof this.bindPlannerEvents === 'function') this.bindPlannerEvents();
  };
  var origApplyTheme = App.applyTheme;
  App.applyTheme = function () {
    origApplyTheme.apply(this, arguments);
    if (typeof this.applyUiAlpha === 'function') this.applyUiAlpha();
  };
  var origInit = App.init;
  App.init = /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
    var _args = arguments;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          _context.n = 1;
          return origInit.apply(this, _args);
        case 1:
          if (typeof this.startPlanner === 'function') this.startPlanner();
        case 2:
          return _context.a(2);
      }
    }, _callee, this);
  }));
})();