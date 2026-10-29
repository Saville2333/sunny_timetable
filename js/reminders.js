/* ============================================================
 * 星海课表 · 自定义弹窗提醒
 * 单次 / 每天 / 工作日 / 每周重复，支持提前 N 分钟
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

  const GRACE_MIN = 5;

  function repeatText(rem) {
    if (rem.repeat === 'daily') return '每天';
    if (rem.repeat === 'weekdays') return '工作日';
    if (rem.repeat === 'weekly') {
      const day = D.WEEKDAYS[Math.max(0, Math.min(6, rem.weekday - 1))] || '周一';
      return '每' + day;
    }
    return rem.date ? rem.date + ' 单次' : '单次';
  }

  function timeMinutes(rem) {
    const m = /^(\d{2}):(\d{2})$/.exec(rem.time || '');
    if (!m) return 8 * 60;
    return Math.max(0, Math.min(23, Number(m[1]))) * 60 + Math.max(0, Math.min(59, Number(m[2])));
  }

  function dayIndex(date) {
    const wd = date.getDay();
    return wd === 0 ? 7 : wd;
  }

  function occursOn(rem, date) {
    if (rem.repeat === 'none') return rem.date === U.dateKey(date);
    if (rem.repeat === 'daily') return true;
    if (rem.repeat === 'weekdays') return dayIndex(date) <= 5;
    if (rem.repeat === 'weekly') return dayIndex(date) === rem.weekday;
    return false;
  }

  function occurrenceFor(rem, now) {
    const base = new Date(now.getTime());
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 21; i += 1) {
      const date = U.addDays(base, i);
      if (!occursOn(rem, date)) continue;
      const mins = timeMinutes(rem);
      const at = new Date(date.getTime());
      at.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
      const fireAt = new Date(at.getTime() - (Number(rem.advance) || 0) * 60000);
      if (fireAt.getTime() >= now.getTime() - GRACE_MIN * 60000) {
        return { at: at, fireAt: fireAt, date: date };
      }
    }
    return null;
  }

  App.reminderRepeatText = repeatText;
  App.reminderOccurrence = occurrenceFor;

  App.renderCustomReminders = function () {
    const list = $('#customReminderList');
    if (!list) return;
    const items = Store.reminders.slice().sort(function (a, b) {
      const oa = occurrenceFor(a, new Date());
      const ob = occurrenceFor(b, new Date());
      return (oa ? oa.fireAt.getTime() : Infinity) - (ob ? ob.fireAt.getTime() : Infinity);
    });

    if (!items.length) {
      list.innerHTML = '<div class="cr-empty">还没有自定义提醒，点下方按钮添加一个吧 ✨</div>';
      return;
    }

    list.innerHTML = items.map(function (rem) {
      const next = occurrenceFor(rem, new Date());
      const when = next
        ? (U.dateKey(next.fireAt) === U.dateKey(new Date()) ? '今天 ' : (next.fireAt.getMonth() + 1) + '/' + next.fireAt.getDate() + ' ') +
          U.pad2(next.fireAt.getHours()) + ':' + U.pad2(next.fireAt.getMinutes())
        : '暂无后续';
      const advance = rem.advance ? ' · 提前 ' + rem.advance + ' 分' : '';
      return '<div class="cr-item' + (rem.enabled ? '' : ' is-off') + '">' +
        '<span class="cr-emoji">' + esc(rem.emoji || '🔔') + '</span>' +
        '<span class="cr-main">' +
        '<span class="cr-title">' + esc(rem.title) + '</span>' +
        '<span class="cr-meta">' + esc(repeatText(rem) + ' ' + rem.time + advance) + ' · 下次 ' + esc(when) + '</span>' +
        '</span>' +
        '<button type="button" class="cr-icon" data-reminder-toggle="' + rem.id + '" title="' + (rem.enabled ? '关闭' : '开启') + '">' +
        (rem.enabled ? '⏸' : '▶') + '</button>' +
        '<button type="button" class="cr-icon" data-reminder-edit="' + rem.id + '" title="编辑">✏️</button>' +
        '<button type="button" class="cr-icon danger" data-reminder-del="' + rem.id + '" title="删除">🗑</button>' +
        '</div>';
    }).join('');
  };

  /* ---------------- 编辑弹层 ---------------- */
  function syncReminderForm() {
    const repeat = $('#remRepeat');
    if (!repeat) return;
    const value = repeat.value;
    const dateRow = $('#remDateRow');
    const weekRow = $('#remWeekRow');
    if (dateRow) dateRow.hidden = value !== 'none';
    if (weekRow) weekRow.hidden = value !== 'weekly';
  }

  App.openReminderEditor = function (id) {
    const editing = id ? Store.getReminder(id) : null;
    const now = new Date();
    const rem = editing || {
      id: '',
      title: '',
      body: '',
      emoji: '🔔',
      time: '08:00',
      date: U.dateKey(now),
      repeat: 'none',
      weekday: dayIndex(now),
      advance: 0,
      enabled: true
    };

    const repeats = [
      { value: 'none', label: '单次' },
      { value: 'daily', label: '每天' },
      { value: 'weekdays', label: '工作日（周一至周五）' },
      { value: 'weekly', label: '每周' }
    ];
    const advances = [0, 5, 10, 15, 20, 30, 60];

    UI.showModal(
      '<div class="modal-title">' + (editing ? '编辑提醒 ✏️' : '添加弹窗提醒 🔔') + '</div>' +
      '<div class="modal-sub">到点后会弹出提醒，支持重复与提前提醒</div>' +
      '<div class="rem-form">' +
      '<label class="form-label" for="remTitle">提醒内容 <i class="req">*</i></label>' +
      '<input id="remTitle" class="input" maxlength="30" placeholder="例：交高数作业" value="' + esc(rem.title) + '">' +
      '<div class="rem-form-grid">' +
      '<div><label class="form-label" for="remEmoji">图标</label>' +
      '<input id="remEmoji" class="input" maxlength="4" value="' + esc(rem.emoji || '🔔') + '"></div>' +
      '<div><label class="form-label" for="remTime">时间</label>' +
      '<input id="remTime" type="time" class="input" value="' + esc(rem.time) + '"></div>' +
      '</div>' +
      '<label class="form-label" for="remRepeat">重复</label>' +
      '<select id="remRepeat" class="input select">' +
      repeats.map(function (r) {
        return '<option value="' + r.value + '"' + (rem.repeat === r.value ? ' selected' : '') + '>' + r.label + '</option>';
      }).join('') +
      '</select>' +
      '<div id="remDateRow" class="rem-inline-row"><label class="form-label" for="remDate">日期</label>' +
      '<input id="remDate" type="date" class="input" value="' + esc(rem.date || U.dateKey(now)) + '"></div>' +
      '<div id="remWeekRow" class="rem-inline-row"><label class="form-label" for="remWeekday">星期</label>' +
      '<select id="remWeekday" class="input select">' +
      [1, 2, 3, 4, 5, 6, 7].map(function (d) {
        return '<option value="' + d + '"' + (Number(rem.weekday) === d ? ' selected' : '') + '>' + D.WEEKDAYS[d - 1] + '</option>';
      }).join('') +
      '</select></div>' +
      '<label class="form-label" for="remAdvance">提前提醒</label>' +
      '<select id="remAdvance" class="input select">' +
      advances.map(function (m) {
        return '<option value="' + m + '"' + (Number(rem.advance) === m ? ' selected' : '') + '>' +
          (m ? '提前 ' + m + ' 分钟' : '准点提醒') + '</option>';
      }).join('') +
      '</select>' +
      '<label class="form-label" for="remBody">备注（可选）</label>' +
      '<textarea id="remBody" class="textarea" rows="2" maxlength="120" placeholder="补充说明，例如：提交到学习通">' + esc(rem.body || '') + '</textarea>' +
      '<label class="rem-check"><input type="checkbox" id="remEnabled"' + (rem.enabled ? ' checked' : '') + '> 启用这条提醒</label>' +
      '</div>' +
      '<div class="modal-actions">' +
      (editing ? '<button type="button" class="btn danger-ghost" data-action="delete-reminder" data-id="' + esc(rem.id) + '">🗑</button>' : '') +
      '<button type="button" class="btn ghost" data-action="close">取消</button>' +
      '<button type="button" class="btn primary" data-action="save-reminder" data-id="' + esc(rem.id) + '">保存</button>' +
      '</div>'
    );
    syncReminderForm();
    const title = $('#remTitle');
    if (title) setTimeout(function () { title.focus(); }, 60);
  };

  App.saveReminderForm = function (id) {
    const title = ($('#remTitle') && $('#remTitle').value || '').trim();
    if (!title) {
      UI.toast('请填写提醒内容');
      const el = $('#remTitle');
      if (el) el.focus();
      return;
    }
    const time = ($('#remTime') && $('#remTime').value) || '08:00';
    const repeat = ($('#remRepeat') && $('#remRepeat').value) || 'none';
    const date = ($('#remDate') && $('#remDate').value) || U.dateKey(new Date());
    if (repeat === 'none' && !U.parseDate(date)) {
      UI.toast('请选择提醒日期');
      return;
    }
    const payload = {
      id: id || undefined,
      title: title,
      body: ($('#remBody') && $('#remBody').value || '').trim(),
      emoji: ($('#remEmoji') && $('#remEmoji').value || '🔔').trim() || '🔔',
      time: time,
      repeat: repeat,
      date: repeat === 'none' ? date : '',
      weekday: U.clampInt($('#remWeekday') && $('#remWeekday').value, 1, 7, dayIndex(new Date())),
      advance: U.clampInt($('#remAdvance') && $('#remAdvance').value, 0, 120, 0),
      enabled: !!($('#remEnabled') && $('#remEnabled').checked),
      lastFiredKey: ''
    };

    Store.upsertReminder(payload).then(function (saved) {
      UI.closeModal();
      App.renderCustomReminders();
      UI.toast(id ? '提醒已更新 🔔' : '提醒已添加 🔔');
      if (saved && saved.enabled) {
        const next = occurrenceFor(saved, new Date());
        if (next) {
          UI.toast('下次提醒：' + (next.fireAt.getMonth() + 1) + '/' + next.fireAt.getDate() + ' ' +
            U.pad2(next.fireAt.getHours()) + ':' + U.pad2(next.fireAt.getMinutes()));
        }
      }
    }).catch(function (err) {
      console.error('[Reminder] 保存失败', err);
      UI.toast('保存失败，请重试');
    });
  };

  /* ---------------- 到点检查 ---------------- */
  App.checkCustomReminders = function (now) {
    const date = now || new Date();
    const todayKey = U.dateKey(date);
    const nowMin = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
    if (!Store.reminders.length) return false;

    const due = [];
    Store.reminders.forEach(function (rem) {
      if (!rem || !rem.enabled) return;
      if (!occursOn(rem, date)) return;
      const at = timeMinutes(rem) - (Number(rem.advance) || 0);
      const late = nowMin - at;
      if (late < 0 || late > GRACE_MIN) return;
      const key = todayKey + '|' + rem.id;
      if (rem.lastFiredKey === key) return;
      due.push({ rem: rem, at: at, key: key });
    });

    if (!due.length) return false;
    due.sort(function (a, b) { return a.at - b.at; });
    const item = due[0];
    item.rem.lastFiredKey = item.key;
    Store.markReminderFired(item.rem.id, item.key, date.getTime()).catch(function (err) {
      console.warn('[Reminder] 记录触发失败', err);
    });

    const atText = U.pad2(Math.floor(item.at / 60) % 24) + ':' + U.pad2(Math.round(item.at) % 60);
    App.presentReminder({
      type: 'custom',
      customId: item.rem.id,
      emoji: item.rem.emoji || '🔔',
      title: item.rem.title,
      body: (item.rem.body ? item.rem.body + ' · ' : '') + '提醒时间 ' + atText +
        (item.rem.advance ? '（提前 ' + item.rem.advance + ' 分钟）' : ''),
      kicker: '自定义提醒',
      allowSnooze: true
    }, false);
    return true;
  };

  App.showReminderHelp = function () {
    UI.showModal(
      '<div class="modal-title">自定义提醒怎么用 🔔</div>' +
      '<div class="modal-sub" style="text-align:left;line-height:1.75">' +
      '1. 点「添加提醒」，填写内容与时间<br>' +
      '2. 选择重复方式：单次 / 每天 / 工作日 / 每周<br>' +
      '3. 可以设置提前 5～60 分钟提醒，适合交作业、开会、取快递<br>' +
      '4. 到点会在 App 内弹出提醒，可选「稍后 5 分钟」<br><br>' +
      '⚠️ 与课程提醒一样，App 在前台时才会弹出；WebView 不支持后台推送。<br>' +
      '⭐ 所有提醒只保存在本机，可随时编辑或删除。' +
      '</div>' +
      '<div class="modal-actions"><button type="button" class="btn primary" data-action="close">知道啦</button></div>'
    );
  };

  /* ---------------- 事件 ---------------- */
  App.bindReminderEvents = function () {
    if (this._reminderBound) return;
    this._reminderBound = true;
    const self = this;

    const add = $('#btnAddReminder');
    if (add) add.addEventListener('click', function () { self.openReminderEditor(); });
    const help = $('#btnReminderHelp');
    if (help) help.addEventListener('click', function () { self.showReminderHelp(); });

    const list = $('#customReminderList');
    if (list) {
      list.addEventListener('click', function (e) {
        const edit = e.target.closest('[data-reminder-edit]');
        if (edit) {
          self.openReminderEditor(edit.getAttribute('data-reminder-edit'));
          return;
        }
        const del = e.target.closest('[data-reminder-del]');
        if (del) {
          const id = del.getAttribute('data-reminder-del');
          const rem = Store.getReminder(id);
          UI.confirm({
            title: '删除这条提醒？',
            sub: (rem ? '「' + rem.title + '」' : '该提醒') + ' 删除后无法恢复。',
            okText: '删除',
            danger: true,
            onOk: function () {
              return Store.deleteReminder(id).then(function () {
                self.renderCustomReminders();
                UI.toast('提醒已删除 🗑');
              });
            }
          });
          return;
        }
        const toggle = e.target.closest('[data-reminder-toggle]');
        if (toggle) {
          const id = toggle.getAttribute('data-reminder-toggle');
          const rem = Store.getReminder(id);
          if (!rem) return;
          Store.upsertReminder(Object.assign({}, rem, { enabled: !rem.enabled })).then(function () {
            self.renderCustomReminders();
            UI.toast(rem.enabled ? '提醒已关闭' : '提醒已开启');
          });
        }
      });
    }

    const modal = $('#modalCard');
    if (modal) {
      modal.addEventListener('change', function (e) {
        if (e.target && e.target.id === 'remRepeat') syncReminderForm();
      });
      modal.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        if (action === 'save-reminder') {
          self.saveReminderForm(btn.getAttribute('data-id') || '');
          return;
        }
        if (action === 'delete-reminder') {
          const id = btn.getAttribute('data-id');
          const rem = Store.getReminder(id);
          if (!rem) return;
          UI.confirm({
            title: '删除这条提醒？',
            sub: '「' + rem.title + '」删除后无法恢复。',
            okText: '删除',
            danger: true,
            onOk: function () {
              return Store.deleteReminder(id).then(function () {
                self.renderCustomReminders();
                UI.toast('提醒已删除 🗑');
              });
            }
          });
        }
      });
    }
  };
})();
/* ============ 自定义提醒模块结束 ============ */
