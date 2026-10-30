/* ============================================================
 * 太阳神课程表 · 课程编辑页
 * 新增 / 编辑课程，星期、节次、周次、颜色、教材
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
  const $$ = H.$$;

  const EMOJI_LIST = ['📘', '📐', '🧮', '🧪', '💻', '🖥️', '🎨', '🎧', '🏀', '📷', '🌊', '⭐', '✨', '🌿', '🎼', '📚'];

  /* ---------------- 选项渲染 ---------------- */
  App.renderDayChips = function () {
    const box = $('#fDay');
    if (!box) return;
    const self = this;
    box.innerHTML = '';
    for (let d = 1; d <= 7; d += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip' + (self.state.selectedDay === d ? ' is-on' : '');
      btn.dataset.day = String(d);
      btn.textContent = D.WEEKDAYS[d - 1];
      box.appendChild(btn);
    }
  };

  App.renderSectionSelects = function () {
    const startSel = $('#fStart');
    const endSel = $('#fEnd');
    if (!startSel || !endSel) return;
    startSel.innerHTML = '';
    endSel.innerHTML = '';
    for (let i = 1; i <= 12; i += 1) {
      const time = Store.periodTime(i);
      const label = '第 ' + i + ' 节 ' + (time ? time.start : '');
      const opt1 = document.createElement('option');
      opt1.value = String(i);
      opt1.textContent = label;
      startSel.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = String(i);
      opt2.textContent = label;
      endSel.appendChild(opt2);
    }
    startSel.value = String(U.clampInt(this.state.selectedStart, 1, 12, 1));
    endSel.value = String(U.clampInt(this.state.selectedEnd, 1, 12, 1));
  };

  App.renderWeekChips = function () {
    const box = $('#fWeeks');
    if (!box) return;
    const total = U.clampInt(Store.settings.totalWeeks, 1, 30, 18);
    const selected = this.state.selectedWeeks || [];
    box.innerHTML = '';
    for (let w = 1; w <= total; w += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'week-chip' + (selected.indexOf(w) >= 0 ? ' is-on' : '');
      btn.dataset.week = String(w);
      btn.textContent = String(w);
      box.appendChild(btn);
    }
  };

  App.renderColorDots = function () {
    const box = $('#fColors');
    if (!box) return;
    const selected = U.clampInt(this.state.selectedColor, 0, D.COURSE_COLORS.length - 1, 0);
    box.innerHTML = '';
    D.COURSE_COLORS.forEach(function (color, index) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-dot' + (index === selected ? ' is-on' : '');
      btn.dataset.color = String(index);
      btn.style.background = 'linear-gradient(150deg,' + color.soft + ' 10%,' + color.main + ' 100%)';
      btn.setAttribute('aria-label', '课程颜色 ' + (index + 1));
      box.appendChild(btn);
    });
  };

  App.renderEmojiQuick = function () {
    const box = $('#emojiQuick');
    if (!box) return;
    box.innerHTML = '';
    EMOJI_LIST.forEach(function (emoji) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-q';
      btn.dataset.emoji = emoji;
      btn.textContent = emoji;
      box.appendChild(btn);
    });
  };

  /* ---------------- 时间提示 ---------------- */
  App.updateSectionHint = function () {
    const hint = $('#sectionTimeHint');
    if (!hint) return;
    const start = U.clampInt(this.state.selectedStart, 1, 12, 1);
    const end = Math.max(start, U.clampInt(this.state.selectedEnd, 1, 12, start));
    const t1 = Store.periodTime(start);
    const t2 = Store.periodTime(end);
    const dayIdx = U.clampInt(this.state.selectedDay, 1, 7, 1);
    hint.textContent = '⏰ ' + D.WEEKDAYS[dayIdx - 1] + ' 第 ' + start + '-' + end + ' 节 · ' +
      t1.start + ' - ' + t2.end + '（共 ' + (end - start + 1) + ' 节）';
  };

  /* ---------------- 打开 / 关闭 ---------------- */
  App.openEditor = function (options) {
    const opts = options || {};
    const page = $('#editorPage');
    if (!page) return;
    const settings = Store.settings;

    let course = null;
    if (opts.id) {
      course = Store.getCourse(opts.id);
      if (!course) {
        UI.toast('课程不存在，可能已被删除');
        return;
      }
    }

    if (course) {
      this.state.editingId = course.id;
      this.state.selectedDay = course.day;
      this.state.selectedStart = course.start;
      this.state.selectedEnd = course.end;
      this.state.selectedWeeks = course.weeks.slice();
      this.state.selectedColor = course.colorIndex;
      this.state.selectedEmoji = course.emoji || '📘';
    } else {
      this.state.editingId = null;
      this.state.selectedDay = U.clampInt(opts.day, 1, 7, 1);
      const sec = U.clampInt(opts.section, 1, settings.sections, 1);
      this.state.selectedStart = sec;
      this.state.selectedEnd = Math.min(12, sec + 1);
      this.state.selectedWeeks = D.rangeWeeks(1, settings.totalWeeks);
      this.state.selectedColor = Math.floor(Math.random() * D.COURSE_COLORS.length);
      this.state.selectedEmoji = '📘';
    }

    this.renderDayChips();
    this.renderSectionSelects();
    this.renderWeekChips();
    this.renderColorDots();
    this.renderEmojiQuick();

    const values = {
      fName: course ? course.name : '',
      fTeacher: course ? course.teacher : '',
      fRoom: course ? course.room : '',
      fBooks: course ? course.books : '',
      fNote: course ? course.note : '',
      fEmoji: course ? course.emoji : ''
    };
    Object.keys(values).forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.value = values[id];
    });

    const title = $('#editorTitle');
    if (title) title.textContent = course ? '编辑课程 ✏️' : '添加课程 ⭐';

    const delBtn = $('#btnDeleteCourse');
    if (delBtn) delBtn.style.display = course ? 'inline-flex' : 'none';

    this.updateSectionHint();

    page.classList.add('is-open');
    page.setAttribute('aria-hidden', 'false');
    this.state.editorOpen = true;

    const scroller = $('#editorScroll');
    if (scroller) scroller.scrollTop = 0;

    // 只有入栈成功，关闭时才回退，避免误退出页面
    this.state.editorPushed = false;
    try {
      history.pushState({ page: 'editor' }, '', '#editor');
      this.state.editorPushed = true;
    } catch (e) {
      console.warn('[Editor] history 记录失败', e);
    }
  };

  App.closeEditor = function (fromHistory) {
    if (!this.state.editorOpen) return;
    this.state.editorOpen = false;
    this.state.editingId = null;

    const page = $('#editorPage');
    if (page) {
      page.classList.remove('is-open');
      page.setAttribute('aria-hidden', 'true');
    }

    const pushed = !!this.state.editorPushed;
    this.state.editorPushed = false;

    if (!fromHistory && pushed) {
      try {
        history.back();
      } catch (e) {
        console.warn('[Editor] history 回退失败', e);
      }
    }
    this.renderAll();
  };

  /* ---------------- 保存 ---------------- */
  App.saveCourse = function () {
    const nameEl = $('#fName');
    const name = nameEl ? nameEl.value.trim() : '';
    if (!name) {
      UI.toast('请填写课程名称 📘');
      if (nameEl) nameEl.focus();
      return;
    }

    const start = U.clampInt(this.state.selectedStart, 1, 12, 1);
    const end = Math.max(start, U.clampInt(this.state.selectedEnd, 1, 12, start));
    const weeks = (this.state.selectedWeeks || []).slice().sort(function (a, b) { return a - b; });
    if (!weeks.length) {
      UI.toast('请至少选择一个上课周次');
      return;
    }

    const wasEdit = !!this.state.editingId;
    const payload = {
      id: this.state.editingId || U.uid(),
      name: name,
      teacher: $('#fTeacher') ? $('#fTeacher').value.trim() : '',
      room: $('#fRoom') ? $('#fRoom').value.trim() : '',
      books: $('#fBooks') ? $('#fBooks').value.trim() : '',
      note: $('#fNote') ? $('#fNote').value.trim() : '',
      emoji: $('#fEmoji') ? $('#fEmoji').value.trim().slice(0, 4) : '',
      day: U.clampInt(this.state.selectedDay, 1, 7, 1),
      start: start,
      end: end,
      weeks: weeks,
      colorIndex: U.clampInt(this.state.selectedColor, 0, D.COURSE_COLORS.length - 1, 0),
      createdAt: Date.now()
    };

    const self = this;
    const btn = $('#btnSaveCourse');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '保存中…';
    }

    Store.upsertCourse(payload)
      .then(function () {
        // 保持当前查看的周次；若该课程不在这一周，则跳到它的第一个上课周
        if (payload.weeks.indexOf(self.state.week) === -1) {
          self.state.week = payload.weeks[0] || Store.currentWeek();
        }
        self.closeEditor(false);
        if (typeof self.renderSettings === 'function') self.renderSettings();
        UI.toast(wasEdit ? '课程已更新 ⭐' : '课程已添加 ✨');
      })
      .catch(function (err) {
        console.error('[Editor] 保存失败', err);
        UI.toast('保存失败：' + ((err && err.message) || '未知错误'));
      })
      .then(function () {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '保存课程 ⭐';
        }
      });
  };

  App.deleteEditingCourse = function () {
    const id = this.state.editingId;
    if (!id) return;
    const course = Store.getCourse(id);
    const self = this;
    UI.confirm({
      title: '删除这门课程？',
      sub: (course ? '《' + course.name + '》' : '该课程') + ' 会从课表中移除，此操作不可撤销。',
      okText: '删除',
      danger: true,
      onOk: function () {
        return Store.deleteCourse(id).then(function () {
          self.closeEditor(false);
          if (typeof self.renderSettings === 'function') self.renderSettings();
          UI.toast('已删除 🗑');
        });
      }
    });
  };

  /* ---------------- 编辑页事件 ---------------- */
  App.bindEditorEvents = function () {
    const self = this;
    const page = $('#editorPage');
    if (!page) return;

    /* 拦截表单默认提交，避免回车刷新页面 */
    const form = $('#courseForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        self.saveCourse();
      });
    }

    const backBtn = $('#editorBack');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        self.closeEditor(false);
      });
    }

    const saveBtn = $('#btnSaveCourse');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        self.saveCourse();
      });
    }

    const delBtn = $('#btnDeleteCourse');
    if (delBtn) {
      delBtn.addEventListener('click', function () {
        self.deleteEditingCourse();
      });
    }

    const dayBox = $('#fDay');
    if (dayBox) {
      dayBox.addEventListener('click', function (e) {
        const btn = e.target.closest('.chip');
        if (!btn) return;
        self.state.selectedDay = U.clampInt(btn.dataset.day, 1, 7, 1);
        $$('.chip', dayBox).forEach(function (item) {
          item.classList.toggle('is-on', item === btn);
        });
        self.updateSectionHint();
      });
    }

    const startSel = $('#fStart');
    if (startSel) {
      startSel.addEventListener('change', function () {
        const value = U.clampInt(startSel.value, 1, 12, 1);
        self.state.selectedStart = value;
        if (self.state.selectedEnd < value) {
          self.state.selectedEnd = value;
          const endSel = $('#fEnd');
          if (endSel) endSel.value = String(value);
        }
        self.updateSectionHint();
      });
    }

    const endSel = $('#fEnd');
    if (endSel) {
      endSel.addEventListener('change', function () {
        let value = U.clampInt(endSel.value, 1, 12, 1);
        if (value < self.state.selectedStart) {
          value = self.state.selectedStart;
          endSel.value = String(value);
          UI.toast('结束节次不能早于开始节次');
        }
        self.state.selectedEnd = value;
        self.updateSectionHint();
      });
    }

    const weekBox = $('#fWeeks');
    if (weekBox) {
      weekBox.addEventListener('click', function (e) {
        const btn = e.target.closest('.week-chip');
        if (!btn) return;
        const week = U.clampInt(btn.dataset.week, 1, 30, 1);
        const list = self.state.selectedWeeks || [];
        const index = list.indexOf(week);
        if (index >= 0) {
          list.splice(index, 1);
          btn.classList.remove('is-on');
        } else {
          list.push(week);
          btn.classList.add('is-on');
        }
      });
    }

    const quick = $('#weekQuick');
    if (quick) {
      quick.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-quick]');
        if (!btn) return;
        const total = U.clampInt(Store.settings.totalWeeks, 1, 30, 18);
        const mode = btn.dataset.quick;
        if (mode === 'all') {
          self.state.selectedWeeks = D.rangeWeeks(1, total);
        } else if (mode === 'none') {
          self.state.selectedWeeks = [];
        } else if (mode === 'odd') {
          self.state.selectedWeeks = D.rangeWeeks(1, total).filter(function (w) { return w % 2 === 1; });
        } else if (mode === 'even') {
          self.state.selectedWeeks = D.rangeWeeks(1, total).filter(function (w) { return w % 2 === 0; });
        }
        self.renderWeekChips();
      });
    }

    const colorRow = $('#fColors');
    if (colorRow) {
      colorRow.addEventListener('click', function (e) {
        const btn = e.target.closest('.color-dot');
        if (!btn) return;
        self.state.selectedColor = U.clampInt(btn.dataset.color, 0, D.COURSE_COLORS.length - 1, 0);
        $$('.color-dot', colorRow).forEach(function (item) {
          item.classList.toggle('is-on', item === btn);
        });
      });
    }

    const emojiRow = $('#emojiQuick');
    if (emojiRow) {
      emojiRow.addEventListener('click', function (e) {
        const btn = e.target.closest('.emoji-q');
        if (!btn) return;
        const emoji = btn.dataset.emoji || '📘';
        self.state.selectedEmoji = emoji;
        const input = $('#fEmoji');
        if (input) input.value = emoji;
      });
    }
  };

  /* 浏览器返回键 / 手势：关闭编辑页 */
  window.addEventListener('popstate', function () {
    if (App.state.editorOpen) {
      App.closeEditor(true);
    }
  });
})();
/* ============ 编辑页模块结束 ============ */