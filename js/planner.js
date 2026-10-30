/* ============================================================
 * 太阳神课程表 · 作息 / 自习 / 倒计时 / 待办
 * 不引入依赖，全部数据保存在本机 settings 中
 * ============================================================ */
(function () {
  'use strict';

  const Store = window.AppStore;
  const U = window.AppUtils;
  const D = window.AppData;
  const App = window.App;
  const UI = window.AppUI;
  const H = window.AppHelpers;
  const $ = H.$;
  const esc = H.esc;

  const PROMPT_KEY = 'wusi_homework_prompted_v1';
  const TYPE_EMOJI = { holiday: '🎉', vacation: '🌴', exam: '📝', other: '⏳' };
  const TYPE_NAME = { holiday: '法定节假日', vacation: '寒暑假', exam: '考试', other: '其他' };

  function settings() {
    return Store.settings || {};
  }

  function todayKey() {
    return U.dateKey(new Date());
  }

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    if (isNaN(target.getTime())) return null;
    return Math.round((target - today) / 86400000);
  }

  function nextRepeatDate(dateStr) {
    let days = daysUntil(dateStr);
    if (days === null) return dateStr;
    if (days >= 0) return dateStr;
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    while (d < now) d.setFullYear(d.getFullYear() + 1);
    return U.dateKey(d);
  }

  function getCountdowns() {
    const list = (settings().countdowns || []).map(function (item) {
      const date = item.repeat ? nextRepeatDate(item.date) : item.date;
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
    return Store.updateSettings({ todos: todos });
  }

  function saveCountdowns(list) {
    return Store.updateSettings({ countdowns: list });
  }

  function renderTodoList() {
    const box = $('#todoList');
    if (!box) return;
    const todos = (settings().todos || []).slice().sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    const done = todos.filter(function (t) { return t.done; }).length;
    const stats = $('#todoStats');
    if (stats) stats.textContent = done + ' / ' + todos.length;
    if (!todos.length) {
      box.innerHTML = '<div class="planner-empty">还没有待办。下课时猫猫会来提醒你记作业 ฅ^•ﻌ•^ฅ</div>';
      return;
    }
    box.innerHTML = todos.map(function (item) {
      return '<div class="todo-row' + (item.done ? ' is-done' : '') + '">' +
        '<label class="todo-check"><input type="checkbox" data-todo-done="' + esc(item.id) + '"' +
        (item.done ? ' checked' : '') + ' /><span></span></label>' +
        '<div class="todo-body"><div class="todo-text">' + esc(item.text) + '</div>' +
        (item.course ? '<div class="todo-meta">📘 ' + esc(item.course) + '</div>' : '') +
        (item.due ? '<div class="todo-meta">⏰ ' + esc(item.due) + '</div>' : '') +
        '</div>' +
        '<button class="todo-del" type="button" data-todo-del="' + esc(item.id) + '" aria-label="删除">🗑</button>' +
        '</div>';
    }).join('');
  }

  function addTodo(text, course) {
    const clean = String(text || '').trim();
    if (!clean) {
      UI.toast('先写点什么吧 ฅ^•ﻌ•^ฅ');
      return null;
    }
    const todos = (settings().todos || []).slice();
    const item = {
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
    const todos = (settings().todos || []).map(function (item) {
      if (item.id !== id) return item;
      return Object.assign({}, item, { done: !!done });
    });
    saveTodos(todos).then(function () {
      renderTodoList();
      if (done && App.progressEvent) App.progressEvent('todo');
      if (done && App.fireConfetti) App.fireConfetti(22);
    });
  }

  function deleteTodo(id) {
    const todos = (settings().todos || []).filter(function (item) { return item.id !== id; });
    saveTodos(todos).then(function () {
      renderTodoList();
      UI.toast('待办已删除');
    });
  }

  function renderCountdowns() {
    const strip = $('#countdownStrip');
    const all = $('#countdownAll');
    const stats = $('#countdownStats');
    if (!strip) return;
    const list = getCountdowns();
    const nearest = list.filter(function (item) { return item.days >= 0; });
    if (stats) stats.textContent = nearest.length ? '最近 ' + (nearest[0].days === 0 ? '今天' : 'D-' + nearest[0].days) : '暂无';
    if (!nearest.length) {
      strip.innerHTML = '<div class="planner-empty">还没有倒计时。到「小窝 → 假期 / 考试倒计时」添加一个吧 ⏳</div>';
      if (all) all.innerHTML = '';
      return;
    }
    const top = nearest.slice(0, 3);
    strip.innerHTML = top.map(function (item) {
      const dayText = item.days === 0 ? '就是今天' : '还有 ' + item.days + ' 天';
      return '<div class="cd-card cd-' + item.type + '">' +
        '<div class="cd-emoji">' + esc(item.emoji) + '</div>' +
        '<div class="cd-main"><div class="cd-title">' + esc(item.title) + '</div>' +
        '<div class="cd-sub">' + esc(item.date) + ' · ' + dayText + '</div></div>' +
        '<div class="cd-days">' + (item.days === 0 ? '今天' : 'D-' + item.days) + '</div>' +
        '</div>';
    }).join('');
    if (all) {
      const rest = nearest.slice(3);
      all.innerHTML = rest.length ? rest.map(function (item) {
        return '<div class="cd-line"><span>' + esc(item.emoji) + ' ' + esc(item.title) + '</span>' +
          '<span>' + (item.days === 0 ? '今天' : 'D-' + item.days) + '</span></div>';
      }).join('') : '';
    }
  }

  function weeksLabel(weeks) {
    if (!weeks || !weeks.length) return '全部周';
    try { return Store.weeksText(weeks); } catch (e) { return weeks.join(',') + ' 周'; }
  }

  function isStudyThisWeek(item) {
    if (!item) return false;
    if (item.weeks && item.weeks.length && item.weeks.indexOf(Store.currentWeek()) < 0) return false;
    if (item.days && item.days.length) {
      const day = new Date().getDay() || 7;
      if (item.days.indexOf(day) < 0) return false;
    }
    return true;
  }

  function appendTodayExtra(html) {
    const list = $('#todayList');
    if (!list) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    while (wrap.firstChild) list.appendChild(wrap.firstChild);
  }

  function clearExtras(selector) {
    H.$$('.extra-item' + (selector ? '.' + selector : '')).forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  }

  function sortTodayItems() {
    const list = $('#todayList');
    if (!list) return;
    const items = H.$$('.today-item', list);
    if (items.length < 2) return;
    const keyed = items.map(function (el, index) {
      const start = el.querySelector('.ti-start');
      const text = start ? start.textContent.trim() : '';
      const m = /^(\d{1,2}):(\d{2})$/.exec(text);
      return {
        el: el,
        index: index,
        minutes: m ? Number(m[1]) * 60 + Number(m[2]) : 24 * 60 + index
      };
    });
    keyed.sort(function (a, b) {
      return a.minutes - b.minutes || a.index - b.index;
    });
    keyed.forEach(function (item) { list.appendChild(item.el); });
  }

  function renderSelfStudy() {
    const study = settings().selfStudy || {};
    const items = [
      { key: 'morning', icon: '🌅', label: '早自习', data: study.morning },
      { key: 'evening', icon: '🌙', label: '晚自习', data: study.evening }
    ].filter(function (item) {
      return item.data && item.data.enabled && isStudyThisWeek(item.data);
    });
    clearExtras('study-extra');
    if (!items.length) return;
    appendTodayExtra(items.map(function (item) {
      const start = item.data.start || '--:--';
      const end = item.data.end || '--:--';
      return '<div class="today-item extra-item study-extra">' +
        '<div class="ti-time"><div class="ti-start">' + esc(start) + '</div><div class="ti-end">' + esc(end) + '</div></div>' +
        '<div class="ti-card extra-card study-card">' +
        '<div class="ti-head"><span class="ti-name">' + item.icon + ' ' + item.label + '</span>' +
        '<span class="ti-badge">' + esc(weeksLabel(item.data.weeks)) + '</span></div>' +
        '<div class="ti-meta">' + (item.data.place ? '<span>📍 ' + esc(item.data.place) + '</span>' : '') +
        '<span>🕯️ 自定义自习</span></div>' +
        '</div></div>';
    }).join(''));
    sortTodayItems();
  }

  function renderMealBreaks() {
    const breaks = settings().mealBreaks || {};
    const items = [
      { key: 'lunch', icon: '🍜', data: breaks.lunch },
      { key: 'dinner', icon: '🌙', data: breaks.dinner }
    ].filter(function (item) { return item.data && item.data.enabled; });
    clearExtras('meal-extra');
    if (!items.length) return;
    appendTodayExtra(items.map(function (item) {
      return '<div class="today-item extra-item meal-extra">' +
        '<div class="ti-time"><div class="ti-start">' + esc(item.data.start) + '</div><div class="ti-end">' + esc(item.data.end) + '</div></div>' +
        '<div class="ti-card extra-card meal-card">' +
        '<div class="ti-head"><span class="ti-name">' + item.icon + ' ' + esc(item.data.label || '休息') + '</span></div>' +
        '<div class="ti-meta"><span>🍚 吃饭、喝水、休息一下</span></div>' +
        '</div></div>';
    }).join(''));
    sortTodayItems();
  }

  function renderMealStrip() {
    const box = $('#mealStrip');
    if (!box) return;
    const breaks = settings().mealBreaks || {};
    const items = [
      { icon: '🍜', data: breaks.lunch },
      { icon: '🌙', data: breaks.dinner }
    ].filter(function (item) { return item.data && item.data.enabled; });
    if (!items.length) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    box.hidden = false;
    box.innerHTML = items.map(function (item) {
      return '<span class="meal-pill">' + item.icon + ' ' + esc(item.data.label || '休息') +
        ' <b>' + esc(item.data.start) + ' - ' + esc(item.data.end) + '</b></span>';
    }).join('');
  }

  function renderMealSettings() {
    const box = $('#mealBreakEditor');
    if (!box) return;
    const breaks = settings().mealBreaks || {};
    const items = [
      { key: 'lunch', icon: '🍜', label: '午休' },
      { key: 'dinner', icon: '🌙', label: '晚饭' }
    ];
    box.innerHTML = items.map(function (item) {
      const data = breaks[item.key] || {};
      return '<div class="meal-edit">' +
        '<div class="sse-head"><span>' + item.icon + ' ' + item.label + '</span>' +
        '<label class="switch"><input type="checkbox" data-meal-enabled="' + item.key + '"' +
        (data.enabled !== false ? ' checked' : '') + ' /><span class="switch-track"><span class="switch-dot"></span></span></label></div>' +
        '<div class="sse-fields">' +
        '<input class="input compact" type="text" maxlength="8" data-meal-label="' + item.key + '" value="' + esc(data.label || item.label) + '" />' +
        '<input class="input compact time" type="time" data-meal-start="' + item.key + '" value="' + esc(data.start || '') + '" />' +
        '<span class="pr-dash">—</span>' +
        '<input class="input compact time" type="time" data-meal-end="' + item.key + '" value="' + esc(data.end || '') + '" />' +
        '</div></div>';
    }).join('');
  }

  function renderPlannerToday() {
    renderTodoList();
    renderCountdowns();
    renderSelfStudy();
    renderMealBreaks();
    sortTodayItems();
  }

  function periodRow(index, time, total) {
    const duration = Math.max(0, U.timeToMinutes(time.end) - U.timeToMinutes(time.start));
    return '<div class="period-row">' +
      '<span class="pr-no">第 ' + index + ' 节</span>' +
      '<input class="input compact time" type="time" data-period-start="' + index + '" value="' + esc(time.start) + '" />' +
      '<span class="pr-dash">—</span>' +
      '<input class="input compact time" type="time" data-period-end="' + index + '" value="' + esc(time.end) + '" />' +
      '<span class="pr-duration">' + (duration > 0 ? duration + ' 分' : '—') + '</span>' +
      '</div>';
  }

  function renderPeriodEditor() {
    const box = $('#periodEditor');
    if (!box) return;
    const count = U.clampInt(settings().sections, 6, 12, 10);
    const times = settings().periodTimes || D.PERIOD_TIMES;
    let html = '';
    for (let i = 1; i <= count; i += 1) {
      html += periodRow(i, times[i - 1] || D.PERIOD_TIMES[i - 1], count);
    }
    box.innerHTML = html;
    const durInput = $('#setClassDuration');
    if (durInput) durInput.value = settings().classDuration || 45;
    const brInput = $('#setBreakDuration');
    if (brInput) brInput.value = settings().breakDuration || 10;
    const morning = $('#genMorningStart');
    if (morning) morning.value = (times[0] && times[0].start) || '08:00';
    const breakData = settings().mealBreaks || {};
    const lunch = breakData.lunch || {};
    const dinner = breakData.dinner || {};
    const lunchStart = $('#genLunchStart');
    if (lunchStart) lunchStart.value = lunch.start || '12:00';
    const lunchEnd = $('#genLunchEnd');
    if (lunchEnd) lunchEnd.value = lunch.end || '14:00';
    const dinnerStart = $('#genDinnerStart');
    if (dinnerStart) dinnerStart.value = dinner.start || '17:40';
    const dinnerEnd = $('#genDinnerEnd');
    if (dinnerEnd) dinnerEnd.value = dinner.end || '19:00';
    const eveningEnd = $('#genEveningEnd');
    if (eveningEnd) eveningEnd.value = (times[count - 1] && times[count - 1].end) || '21:35';
  }

  function minutesText(mins) {
    const m = Math.max(0, Math.min(23 * 60 + 59, Math.round(mins)));
    return U.pad2(Math.floor(m / 60)) + ':' + U.pad2(m % 60);
  }

  function generateSchedule() {
    const count = U.clampInt(settings().sections, 6, 12, 10);
    const classMin = U.clampInt($('#setClassDuration') ? $('#setClassDuration').value : 45, 20, 180, 45);
    const breakMin = U.clampInt($('#setBreakDuration') ? $('#setBreakDuration').value : 10, 0, 60, 10);
    const morning = U.timeToMinutes($('#genMorningStart') ? $('#genMorningStart').value : '08:00');
    let lunchStart = U.timeToMinutes($('#genLunchStart') ? $('#genLunchStart').value : '12:00');
    let lunchEnd = U.timeToMinutes($('#genLunchEnd') ? $('#genLunchEnd').value : '14:00');
    let dinnerStart = U.timeToMinutes($('#genDinnerStart') ? $('#genDinnerStart').value : '17:40');
    let dinnerEnd = U.timeToMinutes($('#genDinnerEnd') ? $('#genDinnerEnd').value : '19:00');
    let eveningEnd = U.timeToMinutes($('#genEveningEnd') ? $('#genEveningEnd').value : '21:35');
    if (lunchStart <= morning) lunchStart = morning + classMin + breakMin;
    if (lunchEnd <= lunchStart) lunchEnd = lunchStart + 90;
    if (dinnerStart <= lunchEnd) dinnerStart = lunchEnd + classMin + breakMin;
    if (dinnerEnd <= dinnerStart) dinnerEnd = dinnerStart + 80;
    if (eveningEnd <= dinnerEnd) eveningEnd = dinnerEnd + classMin;
    const slots = [];
    function fill(start, end) {
      let t = start;
      while (t + classMin <= end && slots.length < count) {
        slots.push({ start: minutesText(t), end: minutesText(t + classMin) });
        t += classMin + breakMin;
      }
    }
    fill(morning, lunchStart);
    fill(lunchEnd, dinnerStart);
    fill(dinnerEnd, eveningEnd);
    /* 窗口不够时，从最后一节继续补足，避免课程表缺节 */
    while (slots.length < count) {
      const prev = slots.length ? U.timeToMinutes(slots[slots.length - 1].end) : eveningEnd;
      slots.push({ start: minutesText(prev + breakMin), end: minutesText(prev + breakMin + classMin) });
    }
    const times = slots.slice(0, count);
    while (times.length < 12) {
      const prev = times.length ? U.timeToMinutes(times[times.length - 1].end) : eveningEnd;
      times.push({ start: minutesText(prev + breakMin), end: minutesText(prev + breakMin + classMin) });
    }
    const mealBreaks = {
      lunch: { enabled: true, start: minutesText(lunchStart), end: minutesText(lunchEnd), label: '午休' },
      dinner: { enabled: true, start: minutesText(dinnerStart), end: minutesText(dinnerEnd), label: '晚饭' }
    };
    Store.updateSettings({
      periodTimes: times,
      classDuration: classMin,
      breakDuration: breakMin,
      mealBreaks: mealBreaks
    }).then(function () {
      renderPeriodEditor();
      renderMealStrip();
      App.renderSchedule();
      App.renderToday();
      if (typeof App.pushWidgetData === 'function') App.pushWidgetData();
      UI.toast('时间表已生成：上午 ' + times[0].start + ' 开始，午休 ' + mealBreaks.lunch.start + '，晚饭 ' + mealBreaks.dinner.start);
    });
  }

  function renderSelfStudyEditor() {
    const box = $('#selfStudyEditor');
    if (!box) return;
    const study = settings().selfStudy || {};
    const items = [
      { key: 'morning', icon: '🌅', label: '早自习' },
      { key: 'evening', icon: '🌙', label: '晚自习' }
    ];
    box.innerHTML = items.map(function (item) {
      const data = study[item.key] || {};
      const total = U.clampInt(settings().totalWeeks, 1, 30, 18);
      const weeks = Array.isArray(data.weeks) ? data.weeks : [];
      const days = Array.isArray(data.days) ? data.days : [];
      const all = !weeks.length;
      let chips = '';
      for (let w = 1; w <= total; w += 1) {
        chips += '<button type="button" class="week-chip' + (all || weeks.indexOf(w) >= 0 ? ' is-on' : '') +
          '" data-study-week="' + item.key + '" data-week="' + w + '">' + w + '</button>';
      }
      let dayChips = '';
      ['一', '二', '三', '四', '五', '六', '日'].forEach(function (label, idx) {
        const day = idx + 1;
        const on = !days.length || days.indexOf(day) >= 0;
        dayChips += '<button type="button" class="week-chip day-chip' + (on ? ' is-on' : '') +
          '" data-study-day="' + item.key + '" data-day="' + day + '">' + label + '</button>';
      });
      return '<div class="self-study-edit">' +
        '<div class="sse-head"><span>' + item.icon + ' ' + item.label + '</span>' +
        '<label class="switch"><input type="checkbox" data-study-enabled="' + item.key + '"' +
        (data.enabled ? ' checked' : '') + ' /><span class="switch-track"><span class="switch-dot"></span></span></label></div>' +
        '<div class="sse-fields">' +
        '<input class="input compact time" type="time" data-study-start="' + item.key + '" value="' + esc(data.start || '') + '" />' +
        '<span class="pr-dash">—</span>' +
        '<input class="input compact time" type="time" data-study-end="' + item.key + '" value="' + esc(data.end || '') + '" />' +
        '<input class="input compact" type="text" maxlength="16" data-study-place="' + item.key + '" value="' + esc(data.place || '') + '" placeholder="地点" />' +
        '</div>' +
        '<div class="week-chip-label">星期 · ' + (days.length ? days.map(function (d) { return '周' + ['一','二','三','四','五','六','日'][d - 1]; }).join('、') : '每天') + '</div>' +
        '<div class="week-chips">' + dayChips + '</div>' +
        '<div class="week-chip-label">所在周 · ' + (all ? '全部周' : weeksLabel(weeks)) + '</div>' +
        '<div class="week-chips">' + chips + '</div>' +
        '</div>';
    }).join('');
  }

  function renderCountdownSettings() {
    const box = $('#countdownSettingsList');
    if (!box) return;
    const list = settings().countdowns || [];
    if (!list.length) {
      box.innerHTML = '<div class="planner-empty">可以添加：期末考试、寒假、暑假、国庆……</div>';
      return;
    }
    box.innerHTML = list.slice().sort(function (a, b) {
      return String(a.date).localeCompare(String(b.date));
    }).map(function (item) {
      const type = TYPE_EMOJI[item.type] ? item.type : 'other';
      return '<div class="countdown-setting-row">' +
        '<span class="cs-emoji">' + esc(item.emoji || TYPE_EMOJI[type]) + '</span>' +
        '<div class="cs-main"><b>' + esc(item.title) + '</b><small>' + esc(item.date) + ' · ' + TYPE_NAME[type] +
        (item.repeat ? ' · 每年' : '') + '</small></div>' +
        '<button class="todo-del" type="button" data-cd-del="' + esc(item.id) + '" aria-label="删除">🗑</button>' +
        '</div>';
    }).join('');
  }

  function renderCountdownPresets() {
    const box = $('#countdownPresets');
    if (!box) return;
    const presets = [
      { key: 'newyear', label: '元旦', type: 'holiday', month: 1, day: 1 },
      { key: 'labor', label: '劳动节', type: 'holiday', month: 5, day: 1 },
      { key: 'national', label: '国庆', type: 'holiday', month: 10, day: 1 },
      { key: 'winter', label: '寒假', type: 'vacation', month: 1, day: 20 },
      { key: 'summer', label: '暑假', type: 'vacation', month: 7, day: 1 },
      { key: 'final', label: '期末考试', type: 'exam', days: 60 }
    ];
    box.innerHTML = presets.map(function (p) {
      return '<button type="button" class="cd-preset" data-cd-preset="' + p.key + '">' + p.label + '</button>';
    }).join('');
  }

  function applyPreset(key) {
    const now = new Date();
    const year = now.getFullYear();
    function nextMonthDay(month, day) {
      let d = new Date(year, month - 1, day);
      if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) d = new Date(year + 1, month - 1, day);
      return U.dateKey(d);
    }
    const map = {
      newyear: ['元旦', 'holiday', nextMonthDay(1, 1), true],
      labor: ['劳动节', 'holiday', nextMonthDay(5, 1), true],
      national: ['国庆', 'holiday', nextMonthDay(10, 1), true],
      winter: ['寒假', 'vacation', nextMonthDay(1, 20), false],
      summer: ['暑假', 'vacation', nextMonthDay(7, 1), false],
      final: ['期末考试', 'exam', U.dateKey(new Date(Date.now() + 60 * 86400000)), false]
    };
    const item = map[key];
    if (!item) return;
    const title = $('#cdTitle');
    const date = $('#cdDate');
    const type = $('#cdType');
    const repeat = $('#cdRepeat');
    if (title) title.value = item[0];
    if (date) date.value = item[2];
    if (type) type.value = item[1];
    if (repeat) repeat.checked = item[3];
    UI.toast('已填入「' + item[0] + '」，可改日期后点添加');
  }

  function addCountdown() {
    const title = $('#cdTitle');
    const date = $('#cdDate');
    const type = $('#cdType');
    const repeat = $('#cdRepeat');
    const name = title ? title.value.trim() : '';
    const dateValue = date ? date.value : '';
    if (!name) { UI.toast('先写倒计时名称'); return; }
    if (!dateValue || !U.parseDate(dateValue)) { UI.toast('选一个日期'); return; }
    const list = (settings().countdowns || []).slice();
    list.push({
      id: 'cd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      title: name.slice(0, 20),
      date: dateValue,
      type: type ? type.value : 'other',
      emoji: TYPE_EMOJI[(type && type.value) || 'other'] || '⏳',
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
    const times = (settings().periodTimes || []).map(function (item) {
      return { start: item.start, end: item.end };
    });
    if (!times[index - 1]) return;
    times[index - 1][key] = value;
    if (U.timeToMinutes(times[index - 1].end) <= U.timeToMinutes(times[index - 1].start)) {
      UI.toast('下课时间要晚于上课时间');
      return;
    }
    Store.updateSettings({ periodTimes: times }).then(function () {
      App.renderSchedule();
      App.renderToday();
      renderPeriodEditor();
      if (typeof App.pushWidgetData === 'function') App.pushWidgetData();
      UI.toast('第 ' + index + ' 节时间已更新 ⏰');
    });
  }

  function applyDuration() {
    const input = $('#setClassDuration');
    const duration = U.clampInt(input ? input.value : 45, 20, 180, 45);
    const times = (settings().periodTimes || []).map(function (item) {
      return { start: item.start, end: item.end };
    });
    times.forEach(function (item) {
      const start = U.timeToMinutes(item.start);
      const end = Math.min(23 * 60 + 59, start + duration);
      item.end = U.pad2(Math.floor(end / 60)) + ':' + U.pad2(end % 60);
    });
    Store.updateSettings({ periodTimes: times, classDuration: duration }).then(function () {
      renderPeriodEditor();
      App.renderSchedule();
      App.renderToday();
      if (typeof App.pushWidgetData === 'function') App.pushWidgetData();
      UI.toast('所有课程时长已改为 ' + duration + ' 分钟');
    });
  }

  function reapplyPeriods() {
    const duration = U.clampInt($('#setClassDuration') ? $('#setClassDuration').value : 45, 20, 180, 45);
    const breakMin = U.clampInt($('#setBreakDuration') ? $('#setBreakDuration').value : 10, 0, 60, 10);
    const times = (settings().periodTimes || []).map(function (item) {
      return { start: item.start, end: item.end };
    });
    let first = U.timeToMinutes(times[0] ? times[0].start : '08:00');
    times.forEach(function (item) {
      const start = first;
      const end = Math.min(23 * 60 + 59, start + duration);
      item.start = U.pad2(Math.floor(start / 60)) + ':' + U.pad2(start % 60);
      item.end = U.pad2(Math.floor(end / 60)) + ':' + U.pad2(end % 60);
      first = Math.min(23 * 60 + 59, end + breakMin);
    });
    Store.updateSettings({ periodTimes: times, classDuration: duration, breakDuration: breakMin }).then(function () {
      renderPeriodEditor();
      App.renderSchedule();
      App.renderToday();
      if (typeof App.pushWidgetData === 'function') App.pushWidgetData();
      UI.toast('已按 ' + duration + ' 分钟 + ' + breakMin + ' 分钟课间重排，午休可手动调整');
    });
  }

  function updateStudy(key, patch) {
    const study = Object.assign({}, settings().selfStudy || {});
    study[key] = Object.assign({}, study[key] || {}, patch);
    Store.updateSettings({ selfStudy: study }).then(function () {
      renderSelfStudyEditor();
      renderSelfStudy();
      App.renderToday();
    });
  }

  function updateMeal(key, patch) {
    const breaks = Object.assign({}, settings().mealBreaks || {});
    breaks[key] = Object.assign({}, breaks[key] || {}, patch);
    Store.updateSettings({ mealBreaks: breaks }).then(function () {
      renderMealSettings();
      renderMealStrip();
      App.renderToday();
    });
  }

  function closeTodoPopup() {
    const popup = $('#todoPopup');
    if (popup) popup.hidden = true;
    App._todoPromptKey = '';
  }

  function markPrompted(key) {
    if (!key) return;
    App._promptedMap = App._promptedMap || {};
    App._promptedMap[key] = 1;
    try {
      const raw = localStorage.getItem(PROMPT_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[key] = Date.now();
      const keys = Object.keys(map);
      if (keys.length > 80) {
        keys.sort(function (a, b) { return map[a] - map[b]; }).slice(0, keys.length - 60).forEach(function (k) {
          delete map[k];
        });
      }
      localStorage.setItem(PROMPT_KEY, JSON.stringify(map));
    } catch (e) { /* file:// 或隐私模式忽略 */ }
  }

  function wasPrompted(key) {
    if (App._promptedMap && App._promptedMap[key]) return true;
    try {
      const raw = localStorage.getItem(PROMPT_KEY);
      return !!(raw && JSON.parse(raw)[key]);
    } catch (e) {
      return false;
    }
  }

  function checkHomeworkPrompt() {
    if (settings().autoHomework === false) return;
    if (document.hidden) return;
    const popup = $('#todoPopup');
    if (!popup || !popup.hidden) return;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const courses = Store.todayCourses ? Store.todayCourses() : [];
    for (let i = 0; i < courses.length; i += 1) {
      const course = courses[i];
      const end = Store.periodTime(course.end);
      const endMin = U.timeToMinutes(end.end);
      if (nowMin < endMin || nowMin > endMin + 10) continue;
      const key = todayKey() + '_' + course.id + '_' + end.end;
      if (wasPrompted(key)) continue;
      App._todoPromptKey = key;
      const title = $('#todoPopupTitle');
      const sub = $('#todoPopupCourse');
      const text = $('#todoPopupText');
      if (title) title.textContent = '「' + course.name + '」下课啦';
      if (sub) sub.textContent = end.end + ' 下课 · 记一下作业或待办，别让猫猫忘记';
      App._todoPromptCourse = course.name;
      if (text) text.value = '';
      popup.hidden = false;
      setTimeout(function () { if (text) text.focus(); }, 80);
      return;
    }
  }

  function bindTodoEvents() {
    const list = $('#todoList');
    if (list) {
      list.addEventListener('change', function (e) {
        const input = e.target.closest('[data-todo-done]');
        if (!input) return;
        toggleTodo(input.dataset.todoDone, input.checked);
      });
      list.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-todo-del]');
        if (btn) deleteTodo(btn.dataset.todoDel);
      });
    }
    const add = $('#btnAddTodo');
    const input = $('#todoInput');
    function addFromInput() {
      if (!input) return;
      const item = addTodo(input.value, '');
      if (item) input.value = '';
    }
    if (add) add.addEventListener('click', addFromInput);
    if (input) input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addFromInput(); }
    });

    const popup = $('#todoPopup');
    if (popup) {
      popup.addEventListener('click', function (e) {
        if (e.target.closest('[data-todo-close]')) {
          markPrompted(App._todoPromptKey);
          closeTodoPopup();
        }
      });
      const save = $('#btnTodoPopupSave');
      if (save) save.addEventListener('click', function () {
        const text = $('#todoPopupText');
        const courseName = App._todoPromptCourse || '';
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
    const editor = $('#periodEditor');
    if (editor) {
      editor.addEventListener('change', function (e) {
        const start = e.target.closest('[data-period-start]');
        if (start) { updatePeriod(Number(start.dataset.periodStart), 'start', start.value); return; }
        const end = e.target.closest('[data-period-end]');
        if (end) updatePeriod(Number(end.dataset.periodEnd), 'end', end.value);
      });
    }
    const apply = $('#btnApplyDuration');
    if (apply) apply.addEventListener('click', applyDuration);
    const reapply = $('#btnReapplyPeriods');
    if (reapply) reapply.addEventListener('click', reapplyPeriods);
    const generate = $('#btnGenerateSchedule');
    if (generate) generate.addEventListener('click', generateSchedule);

    const study = $('#selfStudyEditor');
    if (study) {
      study.addEventListener('change', function (e) {
        const enabled = e.target.closest('[data-study-enabled]');
        if (enabled) {
          updateStudy(enabled.dataset.studyEnabled, { enabled: enabled.checked });
          return;
        }
        const start = e.target.closest('[data-study-start]');
        if (start) { updateStudy(start.dataset.studyStart, { start: start.value }); return; }
        const end = e.target.closest('[data-study-end]');
        if (end) { updateStudy(end.dataset.studyEnd, { end: end.value }); return; }
        const place = e.target.closest('[data-study-place]');
        if (place) updateStudy(place.dataset.studyPlace, { place: place.value });
      });
      study.addEventListener('click', function (e) {
        const dayChip = e.target.closest('[data-study-day]');
        if (dayChip) {
          const key = dayChip.dataset.studyDay;
          const day = Number(dayChip.dataset.day);
          const data = (settings().selfStudy || {})[key] || {};
          let days = Array.isArray(data.days) ? data.days.slice() : [];
          if (!days.length) days = [1, 2, 3, 4, 5, 6, 7];
          if (days.indexOf(day) >= 0) days = days.filter(function (d) { return d !== day; });
          else days.push(day);
          days.sort(function (a, b) { return a - b; });
          updateStudy(key, { days: days });
          return;
        }
        const chip = e.target.closest('[data-study-week]');
        if (!chip) return;
        const key = chip.dataset.studyWeek;
        const week = Number(chip.dataset.week);
        const total = U.clampInt(settings().totalWeeks, 1, 30, 18);
        const data = (settings().selfStudy || {})[key] || {};
        let weeks = Array.isArray(data.weeks) ? data.weeks.slice() : [];
        if (!weeks.length) {
          for (let w = 1; w <= total; w += 1) weeks.push(w);
        }
        if (weeks.indexOf(week) >= 0) weeks = weeks.filter(function (w) { return w !== week; });
        else weeks.push(week);
        weeks.sort(function (a, b) { return a - b; });
        if (!weeks.length) weeks = [];
        updateStudy(key, { weeks: weeks });
      });
    }

    const meal = $('#mealBreakEditor');
    if (meal) {
      meal.addEventListener('change', function (e) {
        const enabled = e.target.closest('[data-meal-enabled]');
        if (enabled) {
          updateMeal(enabled.dataset.mealEnabled, { enabled: enabled.checked });
          return;
        }
        const label = e.target.closest('[data-meal-label]');
        if (label) { updateMeal(label.dataset.mealLabel, { label: label.value }); return; }
        const start = e.target.closest('[data-meal-start]');
        if (start) { updateMeal(start.dataset.mealStart, { start: start.value }); return; }
        const end = e.target.closest('[data-meal-end]');
        if (end) updateMeal(end.dataset.mealEnd, { end: end.value });
      });
    }

    const addCd = $('#btnAddCountdown');
    if (addCd) addCd.addEventListener('click', addCountdown);
    const presets = $('#countdownPresets');
    if (presets) {
      presets.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-cd-preset]');
        if (btn) applyPreset(btn.dataset.cdPreset);
      });
    }
    const cdList = $('#countdownSettingsList');
    if (cdList) {
      cdList.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-cd-del]');
        if (!btn) return;
        const list = (settings().countdowns || []).filter(function (item) { return item.id !== btn.dataset.cdDel; });
        saveCountdowns(list).then(function () {
          renderCountdownSettings();
          renderCountdowns();
          App.renderToday();
          UI.toast('倒计时已删除');
        });
      });
    }

    const alpha = $('#setUiAlpha');
    if (alpha) {
      alpha.addEventListener('input', function () {
        const value = Math.max(0.45, Math.min(1, Number(alpha.value) / 100));
        document.documentElement.style.setProperty('--box-alpha', String(value));
        const label = $('#uiAlphaText');
        if (label) label.textContent = Math.round(value * 100) + '%';
      });
      alpha.addEventListener('change', function () {
        const value = Math.max(0.45, Math.min(1, Number(alpha.value) / 100));
        Store.updateSettings({ uiAlpha: value }).then(function () {
          App.applyUiAlpha();
          UI.toast('卡片透明度已保存');
        });
      });
    }

    const autoHomework = $('#setAutoHomework');
    if (autoHomework) {
      autoHomework.addEventListener('change', function () {
        Store.updateSettings({ autoHomework: !!autoHomework.checked }).then(function () {
          UI.toast(autoHomework.checked ? '下课后会提醒记作业 📚' : '已关闭下课作业提醒');
        });
      });
    }

    const powerSave = $('#setPowerSave');
    if (powerSave) {
      powerSave.addEventListener('change', function () {
        Store.updateSettings({ powerSave: !!powerSave.checked }).then(function () {
          App.applyPowerSave();
          UI.toast(powerSave.checked ? '省电模式已开启，减少动画和发热 🌿' : '省电模式已关闭');
        });
      });
    }
  }

  App.applyUiAlpha = function () {
    const value = Math.max(0.45, Math.min(1, Number(settings().uiAlpha) || 0.93));
    document.documentElement.style.setProperty('--box-alpha', String(value));
  };

  App.renderPlannerToday = renderPlannerToday;
  App.applyPowerSave = function () {
    const on = !!(settings().powerSave);
    document.documentElement.setAttribute('data-powersave', on ? 'on' : 'off');
    const fx = $('#weatherFx');
    if (fx) fx.style.display = on ? 'none' : '';
  };

  App.renderPlannerSettings = function () {    renderPeriodEditor();
    renderSelfStudyEditor();
    renderMealSettings();
    renderCountdownSettings();
    renderCountdownPresets();
    const alpha = $('#setUiAlpha');
    if (alpha) {
      const value = Math.max(45, Math.min(100, Math.round((Number(settings().uiAlpha) || 0.93) * 100)));
      alpha.value = String(value);
      const label = $('#uiAlphaText');
      if (label) label.textContent = value + '%';
    }
    const autoHomework = $('#setAutoHomework');
    if (autoHomework) autoHomework.checked = settings().autoHomework !== false;
    const powerSave = $('#setPowerSave');
    if (powerSave) powerSave.checked = !!settings().powerSave;
    App.applyPowerSave();
    App.applyUiAlpha();
  };

  let plannerBound = false;
  App.bindPlannerEvents = function () {
    if (plannerBound) return;
    plannerBound = true;
    bindTodoEvents();
    bindSettingsEvents();
  };

  if (document.readyState !== 'loading') {
    App.bindPlannerEvents();
  } else {
    document.addEventListener('DOMContentLoaded', function () { App.bindPlannerEvents(); });
  }

  App.startPlanner = function () {
    this.applyUiAlpha();
    this.applyPowerSave();
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
  const origRenderToday = App.renderToday;
  App.renderToday = function () {
    origRenderToday.apply(this, arguments);
    if (typeof this.renderPlannerToday === 'function') this.renderPlannerToday();
  };

  const origRenderSchedule = App.renderSchedule;
  App.renderSchedule = function () {
    origRenderSchedule.apply(this, arguments);
    renderMealStrip();
  };

  const origRenderSettings = App.renderSettings;
  App.renderSettings = function () {
    origRenderSettings.apply(this, arguments);
    if (typeof this.renderPlannerSettings === 'function') this.renderPlannerSettings();
  };

  const origBindEvents = App.bindEvents;
  App.bindEvents = function () {
    origBindEvents.apply(this, arguments);
    if (typeof this.bindPlannerEvents === 'function') this.bindPlannerEvents();
  };

  const origApplyTheme = App.applyTheme;
  App.applyTheme = function () {
    origApplyTheme.apply(this, arguments);
    if (typeof this.applyUiAlpha === 'function') this.applyUiAlpha();
  };

  const origInit = App.init;
  App.init = async function () {
    await origInit.apply(this, arguments);
    if (typeof this.startPlanner === 'function') this.startPlanner();
  };
})();
