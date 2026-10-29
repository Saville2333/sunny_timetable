/* ============================================================
 * 星海课表 · 视图渲染
 * 课表网格 / 今日课程 / 周次切换 / 课程详情
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
  const fmtClock = H.fmtClock;

  /* ============================================================
   * 一周课表
   * ============================================================ */
  App.renderSchedule = function () {
    const grid = $('#ttGrid');
    if (!grid) return;

    const settings = Store.settings;
    const week = U.clampInt(this.state.week, 1, settings.totalWeeks, 1);
    this.state.week = week;
    const days = settings.showWeekend ? 7 : 5;
    const sections = settings.sections;
    const dates = Store.weekDates(week);
    const todayIdx = Store.todayDayIndex();
    const isThisWeek = week === Store.currentWeek();

    grid.style.gridTemplateColumns = '36px repeat(' + days + ', minmax(0, 1fr))';
    grid.style.gridTemplateRows = '44px repeat(' + sections + ', 56px)';
    grid.innerHTML = '';

    const frag = document.createDocumentFragment();

    /* 左上角 */
    const corner = document.createElement('div');
    corner.className = 'tt-corner';
    corner.textContent = '节';
    corner.style.gridRow = '1';
    corner.style.gridColumn = '1';
    frag.appendChild(corner);

    /* 星期表头 */
    for (let d = 1; d <= days; d += 1) {
      const head = document.createElement('div');
      head.className = 'tt-day-head' + (isThisWeek && d === todayIdx ? ' is-today' : '');
      head.style.gridRow = '1';
      head.style.gridColumn = String(d + 1);

      const dow = document.createElement('span');
      dow.className = 'dow';
      dow.textContent = D.WEEKDAYS[d - 1];
      head.appendChild(dow);

      const dn = document.createElement('span');
      dn.className = 'dnum';
      dn.textContent = U.fmtMD(dates[d - 1]);
      head.appendChild(dn);

      frag.appendChild(head);
    }

    /* 节次列 */
    for (let r = 1; r <= sections; r += 1) {
      const time = Store.periodTime(r);
      const sec = document.createElement('div');
      sec.className = 'tt-section';
      sec.style.gridRow = String(r + 1);
      sec.style.gridColumn = '1';

      const idx = document.createElement('span');
      idx.className = 'idx';
      idx.textContent = String(r);
      sec.appendChild(idx);

      if (time) {
        const st = document.createElement('span');
        st.className = 'st';
        st.textContent = time.start;
        sec.appendChild(st);
      }
      frag.appendChild(sec);
    }

    /* 空白格：点击添加课程 */
    for (let r = 1; r <= sections; r += 1) {
      for (let d = 1; d <= days; d += 1) {
        const cell = document.createElement('div');
        cell.className = 'tt-cell';
        cell.style.gridRow = String(r + 1);
        cell.style.gridColumn = String(d + 1);
        cell.dataset.day = String(d);
        cell.dataset.section = String(r);
        frag.appendChild(cell);
      }
    }

    /* 课程块 */
    const now = new Date();
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    Store.courses.forEach(function (course) {
      if (course.day < 1 || course.day > days) return;
      if (course.weeks.indexOf(week) === -1) return;
      if (course.start > sections) return;

      const start = Math.max(1, course.start);
      const end = Math.min(sections, course.end);
      const len = Math.max(1, end - start + 1);
      const color = Store.courseColor(course);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'course-block' + (len === 1 ? ' is-compact' : '');
      btn.style.gridRow = start + 1 + ' / span ' + len;
      btn.style.gridColumn = String(course.day + 1);
      btn.style.setProperty('--cb-main', color.main);
      btn.style.setProperty('--cb-soft', color.soft);
      btn.style.setProperty('--cb-line', color.line);
      btn.style.setProperty('--cb-ink', color.ink);
      btn.dataset.id = course.id;
      btn.title = course.name;

      if (isThisWeek && course.day === todayIdx) {
        const t1 = Store.periodTime(course.start);
        const t2 = Store.periodTime(course.end);
        const s = U.timeToMinutes(t1.start) * 60;
        const e = U.timeToMinutes(t2.end) * 60;
        if (nowSec >= s && nowSec <= e) btn.classList.add('is-now');
      }

      const name = document.createElement('span');
      name.className = 'cb-name';
      name.textContent = (course.emoji ? course.emoji + ' ' : '') + course.name;
      btn.appendChild(name);

      if (course.room) {
        const room = document.createElement('span');
        room.className = 'cb-room';
        room.textContent = '📍' + course.room;
        btn.appendChild(room);
      }

      if (len >= 3 && course.teacher) {
        const teacher = document.createElement('span');
        teacher.className = 'cb-teacher';
        teacher.textContent = '👤' + course.teacher;
        btn.appendChild(teacher);
      }

      frag.appendChild(btn);
    });

    grid.appendChild(frag);

    const wkNum = $('#wkNum');
    const wkDate = $('#wkDate');
    if (wkNum) wkNum.textContent = '第 ' + week + ' 周';
    if (wkDate) {
      wkDate.textContent = U.fmtMD(dates[0]) + ' - ' + U.fmtMD(dates[6]) + (isThisWeek ? ' · 本周' : '');
    }
  };

  /* ============================================================
   * 今日课程
   * ============================================================ */
  App.renderFairyLights = function () {
    const box = $('#fairyLights');
    if (!box || box.childElementCount > 0) return;
    for (let i = 0; i < 11; i += 1) {
      let dot;
      if (i % 4 === 0) {
        dot = document.createElement('span');
        dot.className = 'light-star';
        dot.textContent = '⭐';
      } else {
        dot = document.createElement('span');
        dot.className = 'light' + (i % 3 === 0 ? ' gold' : '');
      }
      dot.style.animationDelay = (i * 0.24).toFixed(2) + 's';
      box.appendChild(dot);
    }
  };

  App.renderToday = function () {
    this.renderFairyLights();
    if (typeof this.updatePhaseLabel === 'function') this.updatePhaseLabel();
    const now = new Date();
    const dayIdx = Store.todayDayIndex();
    const week = Store.currentWeek();
    const dates = Store.weekDates(week);
    const realWeek = Store.realWeek();
    const isOutOfTerm = realWeek < 1 || realWeek > Store.settings.totalWeeks;

    const dateEl = $('#todayDate');
    if (dateEl) {
      dateEl.textContent = (now.getMonth() + 1) + '月' + now.getDate() + '日 · ' + D.WEEKDAYS_FULL[dayIdx - 1];
    }

    const weekEl = $('#todayWeek');
    if (weekEl) {
      weekEl.textContent = '第 ' + week + ' 周 · ' + U.fmtMD(dates[dayIdx - 1]) +
        (isOutOfTerm ? ' · 学期外' : '') + ' · ' + Store.settings.nickname;
    }

    const courses = isOutOfTerm ? [] : Store.todayCourses();
    const countEl = $('#todayCount');
    if (countEl) {
      countEl.textContent = courses.length
        ? '☀️ 今天有 ' + courses.length + ' 节课 ⭐ 猫猫陪你一起加油'
        : '🐈 今天没有课，猫猫批准你晒太阳 ✨';
    }

    const list = $('#todayList');
    if (!list) return;

    if (!courses.length) {
      list.innerHTML =
        '<div class="empty-box">' +
        '<div class="empty-emoji">🐈‍⬛</div>' +
        '<div class="empty-title">猫猫说：今天没有安排课程</div>' +
        '<div class="empty-sub">去晒太阳、去图书馆，或者补个觉吧～<br>(=^･ω･^=) 也可以手动加一节临时课程</div>' +
        '<button class="btn ghost" id="emptyAddBtn" type="button">＋ 召唤一节课</button>' +
        '</div>';
      const addBtn = $('#emptyAddBtn');
      if (addBtn) {
        addBtn.addEventListener('click', function () {
          App.openEditor({ day: Store.todayDayIndex(), section: 1 });
        });
      }
      this.updateNextClass();
      if (typeof this.renderReminderPlan === 'function') this.renderReminderPlan();
      if (typeof this.renderDelight === 'function') this.renderDelight();
      return;
    }

    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const frag = document.createDocumentFragment();

    courses.forEach(function (course) {
      const color = Store.courseColor(course);
      const t1 = Store.periodTime(course.start);
      const t2 = Store.periodTime(course.end);
      const startSec = U.timeToMinutes(t1.start) * 60;
      const endSec = U.timeToMinutes(t2.end) * 60;
      const isPast = nowSec > endSec;
      const isNow = nowSec >= startSec && nowSec <= endSec;

      const item = document.createElement('div');
      item.className = 'today-item';
      item.style.setProperty('--cb-main', color.main);

      const timeBox = document.createElement('div');
      timeBox.className = 'ti-time';
      timeBox.innerHTML = '<div class="ti-start">' + t1.start + '</div><div class="ti-end">' + t2.end + '</div>';

      const card = document.createElement('div');
      card.className = 'ti-card' + (isPast ? ' is-past' : '');
      card.dataset.courseId = course.id;
      card.innerHTML =
        '<div class="ti-head">' +
        '<span class="ti-name">' + esc((course.emoji || '📘') + ' ' + course.name) + '</span>' +
        (isNow ? '<span class="ti-badge">上课中</span>' : '') +
        '</div>' +
        '<div class="ti-meta">' +
        (course.room ? '<span>📍 ' + esc(course.room) + '</span>' : '') +
        (course.teacher ? '<span>👤 ' + esc(course.teacher) + '</span>' : '') +
        '</div>' +
        '<div class="ti-section">第 ' + course.start + '-' + course.end + ' 节 · ' + D.WEEKDAYS[course.day - 1] + '</div>' +
        (course.books ? '<div class="ti-books">📚 要带：' + esc(course.books) + '</div>' : '');

      item.appendChild(timeBox);
      item.appendChild(card);
      frag.appendChild(item);
    });

    list.innerHTML = '';
    list.appendChild(frag);
    this.updateNextClass();
    if (typeof this.renderReminderPlan === 'function') this.renderReminderPlan();
    if (typeof this.renderDelight === 'function') this.renderDelight();
  };

  /* 下一节课倒计时 */
  App.updateNextClass = function () {
    const box = $('#todayNext');
    if (!box) return;

    /* 学期外不显示倒计时，避免拿第 1 周课程误当成今天的课 */
    const realWeek = Store.realWeek();
    if (realWeek < 1 || realWeek > Store.settings.totalWeeks) {
      box.hidden = true;
      return;
    }

    const now = new Date();
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const courses = Store.todayCourses();
    let current = null;
    let next = null;

    courses.forEach(function (course) {
      const t1 = Store.periodTime(course.start);
      const t2 = Store.periodTime(course.end);
      const s = U.timeToMinutes(t1.start) * 60;
      const e = U.timeToMinutes(t2.end) * 60;
      if (nowSec >= s && nowSec <= e) {
        if (!current) current = { course: course, startSec: s, endSec: e };
      } else if (nowSec < s) {
        if (!next || s < next.startSec) next = { course: course, startSec: s, endSec: e };
      }
    });

    if (!current && !next) {
      box.hidden = true;
      return;
    }

    const target = current || next;
    const labelEl = box.querySelector('.hn-label');
    const nameEl = $('#nextName');
    const timeEl = $('#nextTime');
    const remain = current ? current.endSec - nowSec : next.startSec - nowSec;

    box.hidden = false;
    if (labelEl) labelEl.textContent = current ? '上课中' : '下一节';
    if (nameEl) {
      nameEl.textContent = target.course.name + (target.course.room ? ' · ' + target.course.room : '');
    }
    if (timeEl) {
      timeEl.textContent = (current ? '剩 ' : '') + fmtClock(remain);
    }
  };

  /* ============================================================
   * 周次切换
   * ============================================================ */
  App.changeWeek = function (delta) {
    const total = Store.settings.totalWeeks;
    const next = U.clampInt(this.state.week + delta, 1, total, 1);
    if (next === this.state.week) {
      UI.toast(delta > 0 ? '已经是最后一周啦 ⭐' : '已经是第一周啦');
      return;
    }
    this.state.week = next;
    this.renderSchedule();
  };

  App.goCurrentWeek = function () {
    this.state.week = Store.currentWeek();
    this.switchTab('schedule');
    this.renderSchedule();
    UI.toast('已回到本周 ⭐');
  };

  App.showWeekPicker = function () {
    const total = Store.settings.totalWeeks;
    const current = this.state.week;
    const thisWeek = Store.currentWeek();
    let html = '<div class="modal-title">选择查看周次 🗓</div>';
    html += '<div class="modal-sub">带 ⭐ 的为当前自然周</div>';
    html += '<div class="week-picker-grid">';
    for (let w = 1; w <= total; w += 1) {
      const cls = 'wp-item' + (w === current ? ' is-on' : '') + (w === thisWeek ? ' is-now' : '');
      html += '<button type="button" class="' + cls + '" data-action="pick-week" data-week="' + w + '">' +
        (w === thisWeek ? '⭐' : '') + w + '</button>';
    }
    html += '</div>';
    html += '<button type="button" class="btn ghost full" data-action="close">关闭</button>';
    UI.showModal(html);
  };

  /* ============================================================
   * 视图切换
   * ============================================================ */
  App.switchTab = function (tab) {
    const requested = tab;
    if (tab === 'food') tab = 'apps';
    const titles = {
      schedule: '☀️ 太阳神课程表',
      today: '🐈 太阳神的一天',
      apps: '🧰 太阳神小程序',
      import: '📄 太阳神收课表',
      me: '🌻 太阳神的小窝'
    };
    if (!titles[tab]) return;
    this.state.tab = tab;

    H.$$('.view').forEach(function (view) {
      view.classList.toggle('is-active', view.id === 'view-' + tab);
    });
    H.$$('.tab').forEach(function (item) {
      item.classList.toggle('is-active', item.dataset.tab === tab);
    });

    const title = $('#headerTitle');
    if (title) title.textContent = titles[tab];

    if (tab === 'schedule') this.renderSchedule();
    if (tab === 'today') this.renderToday();
    if (tab === 'apps' && typeof this.enterAppsTab === 'function') this.enterAppsTab();
    if (tab === 'apps' && requested === 'food' && typeof this.openMiniApp === 'function') this.openMiniApp('food');
    if (tab === 'me' && typeof this.renderSettings === 'function') this.renderSettings();
    if (tab === 'import' && typeof this.renderImport === 'function') this.renderImport();
  };

  /* ============================================================
   * 课程详情
   * ============================================================ */
  App.showCourseDetail = function (id) {
    const course = Store.getCourse(id);
    if (!course) {
      UI.toast('课程不存在，可能已被删除');
      return;
    }
    const color = Store.courseColor(course);
    const t1 = Store.periodTime(course.start);
    const t2 = Store.periodTime(course.end);

    const rows = [];
    rows.push('<div class="detail-row"><span class="dl">教师</span><span class="dv">' + esc(course.teacher || '未填写') + '</span></div>');
    rows.push('<div class="detail-row"><span class="dl">教室</span><span class="dv">' + esc(course.room || '未填写') + '</span></div>');
    rows.push('<div class="detail-row"><span class="dl">教材</span><span class="dv books">' + esc(course.books || '未填写') + '</span></div>');
    rows.push('<div class="detail-row"><span class="dl">周次</span><span class="dv">' + esc(Store.weeksText(course.weeks)) + '</span></div>');
    rows.push('<div class="detail-row"><span class="dl">时间</span><span class="dv">' + D.WEEKDAYS[course.day - 1] + ' · 第 ' + course.start + '-' + course.end + ' 节<br>' + t1.start + ' - ' + t2.end + '</span></div>');
    if (course.note) {
      rows.push('<div class="detail-row"><span class="dl">备注</span><span class="dv">' + esc(course.note) + '</span></div>');
    }

    const html =
      '<div class="detail-top">' +
      '<div class="detail-icon" style="--cb-soft:' + color.soft + ';--cb-line:' + color.line + '">' + esc(course.emoji || '📘') + '</div>' +
      '<div><div class="detail-name">' + esc(course.name) + '</div>' +
      '<div class="detail-time">' + D.WEEKDAYS[course.day - 1] + ' · 第 ' + course.start + '-' + course.end + ' 节</div></div>' +
      '</div>' +
      '<div class="detail-list">' + rows.join('') + '</div>' +
      '<div class="modal-actions">' +
      '<button class="btn danger-ghost" type="button" data-action="delete-course" data-id="' + course.id + '">🗑</button>' +
      '<button class="btn ghost" type="button" data-action="edit-course" data-id="' + course.id + '">✏️ 编辑</button>' +
      '<button class="btn primary" type="button" data-action="close">关闭</button>' +
      '</div>';

    UI.showModal(html);
  };

  /* ============================================================
   * 课表 / 今日相关事件
   * ============================================================ */
  App.bindViewEvents = function () {
    const self = this;

    const prev = $('#wkPrev');
    const next = $('#wkNext');
    const label = $('#wkLabel');
    const todayBtn = $('#wkTodayBtn');
    if (prev) prev.addEventListener('click', function () { self.changeWeek(-1); });
    if (next) next.addEventListener('click', function () { self.changeWeek(1); });
    if (label) label.addEventListener('click', function () { self.showWeekPicker(); });
    if (todayBtn) todayBtn.addEventListener('click', function () { self.goCurrentWeek(); });

    /* 课表：点击课程看详情、点击空格添加、长按课程编辑 */
    const grid = $('#ttGrid');
    if (grid) {
      grid.addEventListener('click', function (e) {
        if (Date.now() < self.state.suppressDetailUntil) return;
        const block = e.target.closest('.course-block');
        if (block) {
          self.showCourseDetail(block.dataset.id);
          return;
        }
        const cell = e.target.closest('.tt-cell');
        if (cell) {
          self.openEditor({
            day: U.clampInt(cell.dataset.day, 1, 7, 1),
            section: U.clampInt(cell.dataset.section, 1, 12, 1)
          });
        }
      });

      let pressTimer = null;
      const clearPress = function () {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      };
      grid.addEventListener('pointerdown', function (e) {
        const block = e.target.closest('.course-block');
        if (!block) return;
        clearPress();
        pressTimer = setTimeout(function () {
          pressTimer = null;
          self.state.suppressDetailUntil = Date.now() + 900;
          if (navigator.vibrate) {
            try { navigator.vibrate(12); } catch (err) { /* 忽略 */ }
          }
          self.openEditor({ id: block.dataset.id });
        }, 620);
      });
      grid.addEventListener('pointerup', clearPress);
      grid.addEventListener('pointercancel', clearPress);
      grid.addEventListener('pointermove', clearPress);
      grid.addEventListener('pointerleave', clearPress);

      /* 左右滑动切换周次 */
      let swipeX = 0;
      let swipeY = 0;
      let swipeAt = 0;
      grid.addEventListener('touchstart', function (e) {
        if (!e.touches || !e.touches.length) return;
        swipeX = e.touches[0].clientX;
        swipeY = e.touches[0].clientY;
        swipeAt = Date.now();
      }, { passive: true });
      grid.addEventListener('touchend', function (e) {
        if (!e.changedTouches || !e.changedTouches.length) return;
        const dx = e.changedTouches[0].clientX - swipeX;
        const dy = e.changedTouches[0].clientY - swipeY;
        const fast = Date.now() - swipeAt < 900;
        if (Math.abs(dx) > 56 && Math.abs(dy) < 42 && fast) {
          self.state.suppressDetailUntil = Date.now() + 400;
          self.changeWeek(dx < 0 ? 1 : -1);
        }
      }, { passive: true });
    }

    const scrollBox = $('#timetableScroll');
    if (scrollBox) {
      scrollBox.addEventListener('scroll', function () {
        self.state.suppressDetailUntil = 0;
      });
    }

    /* 今日列表 */
    const todayList = $('#todayList');
    if (todayList) {
      todayList.addEventListener('click', function (e) {
        const card = e.target.closest('.ti-card');
        if (card && card.dataset.courseId) self.showCourseDetail(card.dataset.courseId);
      });
    }

    /* 底部 Tab */
    H.$$('.tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        self.switchTab(btn.dataset.tab);
      });
    });

    /* 顶部快捷按钮 */
    const quickBtn = $('#headerQuickBtn');
    if (quickBtn) {
      quickBtn.addEventListener('click', function () { self.goCurrentWeek(); });
    }

    /* 点击遮罩关闭弹层 */
    const mask = $('#modalMask');
    if (mask) {
      mask.addEventListener('click', function (e) {
        if (e.target === mask) UI.closeModal();
      });
    }

    /* 模态层动作（通用部分） */
    const modal = $('#modalCard');
    if (modal) {
      modal.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;

        if (action === 'close' || action === 'modal-cancel') {
          UI.closeModal();
          return;
        }

        if (action === 'modal-ok') {
          const handler = UI._confirmOk;
          UI.closeModal();
          if (handler) {
            try {
              const result = handler();
              if (result && typeof result.catch === 'function') {
                result.catch(function (err) { console.error('[App] 确认操作失败', err); });
              }
            } catch (err) {
              console.error('[App] 确认操作失败', err);
            }
          }
          return;
        }

        if (action === 'pick-week') {
          self.state.week = U.clampInt(btn.dataset.week, 1, Store.settings.totalWeeks, 1);
          UI.closeModal();
          self.renderSchedule();
          return;
        }

        if (action === 'edit-course') {
          const id = btn.dataset.id;
          UI.closeModal();
          self.openEditor({ id: id });
          return;
        }

        if (action === 'delete-course') {
          const id = btn.dataset.id;
          const course = Store.getCourse(id);
          UI.confirm({
            title: '删除这门课程？',
            sub: (course ? '《' + course.name + '》' : '该课程') + ' 会从课表中移除，此操作不可撤销。',
            okText: '删除',
            danger: true,
            onOk: function () {
              return Store.deleteCourse(id).then(function () {
                self.renderAll();
                if (typeof self.renderSettings === 'function') self.renderSettings();
                UI.toast('已删除 🗑');
              });
            }
          });
        }
      });
    }
  };
})();
/* ============ 视图模块结束 ============ */