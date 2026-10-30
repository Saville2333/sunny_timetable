/* ============================================================
 * 太阳神课程表 · 时段与提醒
 * 1) 随现实时间一天四段检查（清晨 / 中午 / 下午 / 晚上）
 * 2) 课前提醒、临近下课提醒、取外卖提醒
 * 3) 提醒横幅、提示音、今日提醒时间表
 * 说明：提醒依赖 App 处于前台运行，WebView 环境暂不支持后台推送。
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

  const LOG_KEY = 'wusi_reminder_log_v1';
  const MAX_LOG = 240;
  const MINUTE = 60 * 1000;
  /* 提醒到点后的宽限分钟数：超过则视为错过，不补弹、也不再标记为已提醒 */
  const GRACE_MIN = 5;
  /* ---------------- 运行状态 ---------------- */
  App.reminderLog = { date: '', fired: {} };
  App.lastPhaseKey = '';
  App.phaseTimer = null;
  App.reminderTimer = null;
  App.bannerTimer = null;
  App.reminderPopupTimer = null;
  App.reminderPopupToken = 0;
  App.pendingRepeats = [];
  App.audioCtx = null;
  App.currentReminder = null;

  /* ---------------- 小工具 ---------------- */
  function minutesOfDate(date) {
    const d = date || new Date();
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  }

  function fmtAt(mins) {
    const m = Math.max(0, Math.round(mins));
    return U.pad2(Math.floor(m / 60) % 24) + ':' + U.pad2(m % 60);
  }

  function courseWhere(course) {
    const parts = [];
    if (course.room) parts.push(course.room);
    if (course.teacher) parts.push(course.teacher);
    return parts.join(' · ');
  }

  function shortBooks(course) {
    const text = String(course.books || '').trim();
    if (!text) return '';
    return text.length > 26 ? text.slice(0, 26) + '…' : text;
  }

  App.vibrate = function (pattern) {
    if (!Store.settings.remindVibrate) return;
    if (!navigator.vibrate) return;
    try {
      navigator.vibrate(pattern || 22);
    } catch (e) {
      /* 部分设备不支持振动，忽略即可 */
    }
  };

  /* ---------------- 提示音（Web Audio） ---------------- */
  App.ensureAudio = function () {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        const ctx = this.audioCtx;
        ctx.resume().catch(function (err) {
          console.warn('[Rhythm] 音频恢复失败', err);
        });
      }
      return this.audioCtx;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    try {
      this.audioCtx = new Ctx();
    } catch (e) {
      console.warn('[Rhythm] 音频初始化失败', e);
      this.audioCtx = null;
    }
    return this.audioCtx;
  };

  App.playChime = function () {
    if (!Store.settings.remindSound) return;
    const ctx = this.ensureAudio();
    if (!ctx) return;
    try {
      const base = ctx.currentTime;
      [880, 1174].forEach(function (freq, index) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const at = base + index * 0.19;
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.15, at + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.36);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(at);
        osc.stop(at + 0.38);
      });
    } catch (e) {
      console.warn('[Rhythm] 播放提示音失败', e);
    }
  };

  /* ---------------- 启动 ---------------- */
  App.startLife = function () {
    this.loadReminderLog();
    this.ensureReminderDay(new Date());
    this.bindRhythmEvents();

    const preset = typeof this.activePreset === 'function' ? this.activePreset() : 'sun';
    const phase = D.phaseOf(new Date(), preset);
    this.lastPhaseKey = phase.key;
    this.updatePhaseLabel(phase);
    this.renderReminderPlan();

    const self = this;
    if (this.phaseTimer) clearInterval(this.phaseTimer);
    if (this.reminderTimer) clearInterval(this.reminderTimer);
    this.phaseTimer = setInterval(function () {
      self.checkPhaseTimer();
    }, 30000);
    this.reminderTimer = setInterval(function () {
      self.reminderTick();
    }, 15000);
    setTimeout(function () {
      self.reminderTick();
    }, 2500);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) return;
      self.checkPhaseTimer();
      self.reminderTick();
    });

    if (typeof this.mountWheel === 'function') this.mountWheel();
    console.log('[Rhythm] 时段配色与提醒引擎已启动');
  };

  /* 每 30 秒检查一次是否跨入新的时段 */
  App.checkPhaseTimer = function () {
    const preset = typeof this.activePreset === 'function' ? this.activePreset() : 'sun';
    const phase = D.phaseOf(new Date(), preset);
    if (phase.key !== this.lastPhaseKey) {
      this.lastPhaseKey = phase.key;
      this.applyTheme();
      this.applyBackground();
      this.renderToday();
      if (typeof this.renderSettings === 'function') this.renderSettings();
      const presetInfo = D.PRESETS[preset] || D.PRESETS.sun;
      UI.toast(presetInfo.emoji + ' ' + presetInfo.name + ' · ' + phase.name + '「' + phase.label + '」到啦');
      this.vibrate(12);
    } else {
      this.updatePhaseLabel(phase);
    }
  };

  /* ---------------- 提醒日志（按天去重） ---------------- */
  App.loadReminderLog = function () {
    let raw = null;
    try {
      raw = Store.read(LOG_KEY);
    } catch (e) {
      console.warn('[Rhythm] 提醒日志读取失败', e);
    }
    if (
      raw &&
      typeof raw === 'object' &&
      raw.fired &&
      typeof raw.fired === 'object' &&
      !Array.isArray(raw.fired)
    ) {
      const fired = {};
      Object.keys(raw.fired).forEach(function (key) {
        const ts = Number(raw.fired[key]);
        if (key && Number.isFinite(ts)) fired[key] = ts;
      });
      this.reminderLog = { date: String(raw.date || ''), fired: fired };
    } else {
      this.reminderLog = { date: '', fired: {} };
    }
  };

  App.ensureReminderDay = function (now) {
    const key = U.dateKey(now || new Date());
    if (this.reminderLog.date === key) return false;
    this.reminderLog = { date: key, fired: {} };
    this.pendingRepeats = [];
    return true;
  };

  App.saveReminderLog = function () {
    try {
      const fired = this.reminderLog.fired;
      const keys = Object.keys(fired);
      if (keys.length > MAX_LOG) {
        keys.sort(function (a, b) {
          return (fired[a] || 0) - (fired[b] || 0);
        });
        const keep = {};
        keys.slice(keys.length - MAX_LOG).forEach(function (k) {
          keep[k] = fired[k];
        });
        this.reminderLog.fired = keep;
      }
      const result = Store.write(LOG_KEY, this.reminderLog);
      if (result && typeof result.catch === 'function') {
        result.catch(function (err) {
          console.warn('[Rhythm] 提醒日志保存失败', err);
        });
      }
    } catch (e) {
      console.warn('[Rhythm] 提醒日志保存异常', e);
    }
  };

  /* ---------------- 提醒规则计算 ---------------- */
  App.reminderEnabled = function (type) {
    const s = Store.settings;
    if (type === 'pre') return !!s.remindPreClass;
    if (type === 'end') return !!s.remindEndClass;
    if (type === 'lunch' || type === 'dinner') return !!s.remindMeal;
    return false;
  };

  /* 清空提醒记录（「清空全部数据」时调用） */
  App.resetReminderLog = function () {
    this.reminderLog = { date: '', fired: {} };
    this.pendingRepeats = [];
    this.ensureReminderDay(new Date());
    this.saveReminderLog();
    this.hideReminder();
    this.renderReminderPlan();
  };

  /* 返回今天所有提醒（按时间升序），at 为「当天第几分钟」 */
  App.todayReminders = function (now) {
    const date = now || new Date();
    const s = Store.settings;
    const realWeek = Store.realWeek(date);
    if (realWeek < 1 || realWeek > s.totalWeeks) return [];

    let courses = [];
    try {
      courses = Store.todayCourses();
    } catch (e) {
      console.error('[Rhythm] 读取今日课程失败', e);
      return [];
    }
    if (!courses.length) return [];

    const list = [];
    /* until：该提醒的最晚有效时间（当天第几分钟），过点后不再弹出，避免「下课了才提醒快下课」 */
    const push = function (type, course, at, title, body, emoji, until) {
      if (!Number.isFinite(at)) return;
      const atClamped = Math.max(0, Math.round(at));
      const untilClamped = Number.isFinite(until)
        ? Math.max(atClamped, Math.round(until))
        : atClamped + GRACE_MIN;
      list.push({
        id: type + '|' + course.id + '|' + atClamped,
        type: type,
        courseId: course.id,
        courseName: course.name,
        title: title,
        body: body,
        emoji: emoji,
        at: atClamped,
        until: untilClamped,
        enabled: App.reminderEnabled(type)
      });
    };

    const preMin = U.clampInt(s.remindPreMin, 5, 60, 20);
    const endMin = U.clampInt(s.remindEndMin, 2, 20, 5);
    const mealMin = U.clampInt(s.remindMealMin, 10, 60, 30);

    courses.forEach(function (course) {
      const t1 = Store.periodTime(course.start);
      const t2 = Store.periodTime(course.end);
      const startMin = U.timeToMinutes(t1.start);
      const endMinOfCourse = U.timeToMinutes(t2.end);
      if (!startMin || !endMinOfCourse) return;

      const where = courseWhere(course);
      const books = shortBooks(course);
      const name = (course.emoji || '📘') + ' ' + course.name;

      /* 上课前提醒：上课时间一到立即失效；关闭状态也生成，便于在今日提醒表中标记 */
      const preAt = startMin - preMin;
      const preDetail = name + (where ? ' · ' + where : '') + (books ? ' · 要带：' + books : '');
      push('pre', course, preAt, '还有 ' + preMin + ' 分钟上课', preDetail, '⏰', startMin);

      /* 临近下课提醒：课程结束后立即失效 */
      const endAt = endMinOfCourse - endMin;
      push(
        'end',
        course,
        endAt,
        endMin + ' 分钟后下课',
        name + ' 即将结束，收拾好随身物品，别落下东西 🎒',
        '📚',
        endMinOfCourse
      );
    });

    /* 取外卖提醒：上午最后一节 + 下午最后一节；关闭状态也生成，便于在提醒表中标记 */
    let lunch = null;
    let dinner = null;
    courses.forEach(function (course) {
      const t1 = Store.periodTime(course.start);
      const t2 = Store.periodTime(course.end);
      const startMin = U.timeToMinutes(t1.start);
      const endMinOfCourse = U.timeToMinutes(t2.end);
      if (!startMin || !endMinOfCourse) return;

      /* 上午接近中午的课：11:00 之后下课、13:00 之前结束 */
      if (startMin < 12 * 60 && endMinOfCourse >= 11 * 60 && endMinOfCourse <= 13 * 60) {
        if (!lunch || endMinOfCourse > lunch.endMin) {
          lunch = { course: course, endMin: endMinOfCourse };
        }
      }
      /* 下午靠后的最后一节：16:00 之后下课、19:00 之前结束 */
      if (startMin >= 12 * 60 && endMinOfCourse >= 16 * 60 && endMinOfCourse <= 19 * 60) {
        if (!dinner || endMinOfCourse > dinner.endMin) {
          dinner = { course: course, endMin: endMinOfCourse };
        }
      }
    });

    if (lunch) {
      const at = lunch.endMin - mealMin;
      push(
        'lunch',
        lunch.course,
        at,
        '该点午饭啦 🍱',
        '「' + lunch.course.name + '」还有 ' + mealMin + ' 分钟下课，先下单，避开食堂排队',
        '🍱',
        lunch.endMin
      );
    }
    if (dinner) {
      const at = dinner.endMin - mealMin;
      push(
        'dinner',
        dinner.course,
        at,
        '晚饭时间快到了 🍜',
        '「' + dinner.course.name + '」还有 ' + mealMin + ' 分钟下课，先点个晚饭吧',
        '🍜',
        dinner.endMin
      );
    }

    return list.sort(function (a, b) {
      return a.at - b.at;
    });
  };

  /* ---------------- 定时检查并触发提醒 ---------------- */
  App.reminderTick = function () {
    if (!Store.loaded) return;
    /* App 在后台时不抢占提醒，回到前台后由 visibilitychange 再检查 */
    if (document.hidden) return;

    /* 弹层或课程编辑页打开时先不弹，避免横幅被遮住；关闭后下一轮再提醒 */
    const mask = $('#modalMask');
    if ((mask && !mask.hidden) || this.state.editorOpen) return;
    const popup = $('#reminderPopup');
    if (popup && !popup.hidden) return;

    const now = new Date();
    this.ensureReminderDay(now);
    const nowMin = minutesOfDate(now);
    const nowTs = now.getTime();
    let changed = false;

    /* 自定义提醒优先于课程提醒检查；返回 true 表示已经弹出 */
    if (typeof this.checkCustomReminders === 'function') {
      try {
        if (this.checkCustomReminders(now)) {
          this.renderReminderPlan();
          return;
        }
      } catch (err) {
        console.warn('[Rhythm] 自定义提醒检查失败', err);
      }
    }

    /* 弹窗还开着时先不弹下一条，避免叠在一起 */
    /* 「稍后 5 分钟」到点后重新弹出；超过该条提醒的有效期则直接丢弃 */
    if (this.pendingRepeats.length) {
      const due = this.pendingRepeats.filter(function (item) {
        return item.at <= nowTs;
      });
      this.pendingRepeats = this.pendingRepeats.filter(function (item) {
        return item.at > nowTs;
      });
      for (let i = 0; i < due.length; i += 1) {
        const repeat = due[i].reminder;
        const until = repeat && Number.isFinite(repeat.until) ? repeat.until : Infinity;
        if (nowMin >= until) continue;
        this.presentReminder(repeat, true);
        this.renderReminderPlan();
        return;
      }
    }

    const list = this.todayReminders(now);
    for (let i = 0; i < list.length; i += 1) {
      const item = list[i];
      if (this.reminderLog.fired[item.id]) continue;
      if (nowMin < item.at) continue;

      const late = nowMin - item.at;
      const until = Number.isFinite(item.until) ? item.until : item.at + GRACE_MIN;

      /* 已经错过（或事件本身已结束）的提醒不再补弹，保留「已过时」状态 */
      if (late > GRACE_MIN || nowMin >= until) continue;

      this.reminderLog.fired[item.id] = nowTs;
      changed = true;

      /* 已关闭的提醒到点后静默处理，避免用户中途开启时突然弹出旧提醒 */
      if (!item.enabled) continue;

      this.presentReminder(item, false);
      break;
    }

    if (changed) this.saveReminderLog();
    this.renderReminderPlan();
  };

  /* ---------------- 提醒展示：弹窗 / 横幅 ---------------- */
  App.presentReminder = function (item, isRepeat) {
    if (!item) return;
    if (Store.settings.remindPopup) {
      this.showReminderPopup(item, isRepeat);
      return;
    }
    this.presentBannerReminder(item, isRepeat);
  };

  /* 底部弹窗：更醒目，独立于普通模态，不会阻塞提醒引擎 */
  App.showReminderPopup = function (item, isRepeat) {
    const popup = $('#reminderPopup');
    if (!popup) return;
    this.currentReminder = item;
    const isMeal = item.type === 'lunch' || item.type === 'dinner';
    const isCustom = item.type === 'custom';

    let titleText = item.title;
    if (Number.isFinite(item.until) && (item.type === 'pre' || item.type === 'end')) {
      const remain = Math.max(1, Math.round(item.until - minutesOfDate(new Date())));
      titleText = item.type === 'pre'
        ? '还有 ' + remain + ' 分钟上课'
        : remain + ' 分钟后下课';
    }
    const kicker = item.kicker || (isCustom ? '自定义提醒' : (isMeal ? '外卖提醒' : (item.type === 'pre' ? '上课提醒' : (item.type === 'end' ? '下课提醒' : '提醒'))));

    const emojiEl = $('#reminderPopupEmoji');
    const kickerEl = $('#reminderPopupKicker');
    const titleEl = $('#reminderPopupTitle');
    const bodyEl = $('#reminderPopupBody');
    const courseBtn = popup.querySelector('[data-popup="course"]');
    if (emojiEl) emojiEl.textContent = item.emoji || '🔔';
    if (kickerEl) kickerEl.textContent = kicker + (isRepeat ? ' · 再提醒一次' : '');
    if (titleEl) titleEl.textContent = titleText;
    if (bodyEl) bodyEl.textContent = item.body || '';
    if (courseBtn) {
      if (isMeal) {
        courseBtn.hidden = false;
        courseBtn.textContent = '🍜 去转盘挑一个';
      } else if (isCustom && item.customId) {
        courseBtn.hidden = false;
        courseBtn.textContent = '✏️ 查看提醒';
      } else if (item.courseId) {
        courseBtn.hidden = false;
        courseBtn.textContent = '看看课程';
      } else {
        courseBtn.hidden = true;
      }
    }

    popup.hidden = false;
    const token = ++this.reminderPopupToken;
    requestAnimationFrame(function () {
      if (token === App.reminderPopupToken && !popup.hidden) popup.classList.add('is-show');
    });
    this.playChime();
    this.vibrate(isMeal ? [24, 70, 24] : 28);

    clearTimeout(this.reminderPopupTimer);
    this.reminderPopupTimer = setTimeout(function () {
      App.closeReminderPopup();
    }, 60000);
  };

  App.closeReminderPopup = function () {
    const popup = $('#reminderPopup');
    if (!popup) return;
    const token = ++this.reminderPopupToken;
    popup.classList.remove('is-show');
    clearTimeout(this.reminderPopupTimer);
    setTimeout(function () {
      if (token === App.reminderPopupToken && !popup.classList.contains('is-show')) popup.hidden = true;
    }, 240);
  };

  App.presentBannerReminder = function (item, isRepeat) {
    const banner = $('#remindBanner');
    const inner = $('#remindBannerInner');
    if (!banner || !inner) return;

    this.currentReminder = item;
    const isMeal = item.type === 'lunch' || item.type === 'dinner';

    let actions = '<button class="rb-btn" type="button" data-rb="snooze">' +
      (isMeal ? '稍后 5 分钟' : '稍后提醒') + '</button>';

    if (isMeal) {
      actions += '<button class="rb-btn primary" type="button" data-rb="wheel">🍜 去转盘挑一个</button>';
    } else if (item.type === 'pre' && item.courseId) {
      actions += '<button class="rb-btn primary" type="button" data-rb="detail">看看课程</button>';
    } else if (item.type === 'custom' && item.customId) {
      actions += '<button class="rb-btn primary" type="button" data-rb="custom">查看提醒</button>';
    } else {
      actions += '<button class="rb-btn primary" type="button" data-rb="close">好，知道啦</button>';
    }

    /* 按当前时间重算剩余分钟，避免提醒稍晚弹出时仍显示「还有 20 分钟」 */
    let titleText = item.title;
    if (Number.isFinite(item.until) && (item.type === 'pre' || item.type === 'end')) {
      const remain = Math.max(1, Math.round(item.until - minutesOfDate(new Date())));
      titleText = item.type === 'pre'
        ? '还有 ' + remain + ' 分钟上课'
        : remain + ' 分钟后下课';
    }

    inner.innerHTML =
      '<div class="rb-card">' +
      '<div class="rb-top">' +
      '<div class="rb-emoji">' + esc(item.emoji || '🔔') + '</div>' +
      '<div class="rb-body">' +
      '<div class="rb-title">' + esc(titleText) + (isRepeat ? ' · 再提醒一次' : '') + '</div>' +
      '<div class="rb-sub">' + esc(item.body) + '</div>' +
      '</div>' +
      '<button class="rb-close" type="button" data-rb="close" aria-label="关闭提醒">✕</button>' +
      '</div>' +
      '<div class="rb-actions">' + actions + '</div>' +
      '</div>';

    banner.hidden = false;
    requestAnimationFrame(function () {
      banner.classList.add('is-show');
    });

    this.playChime();
    this.vibrate(isMeal ? [24, 70, 24] : 26);

    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(function () {
      App.hideReminder();
    }, 24000);
  };

  App.hideReminder = function () {
    const banner = $('#remindBanner');
    if (banner) {
      banner.classList.remove('is-show');
      clearTimeout(this.bannerTimer);
      setTimeout(function () {
        if (!banner.classList.contains('is-show')) banner.hidden = true;
      }, 280);
    }
    this.closeReminderPopup();
  };

  App.snoozeReminder = function (item) {
    if (item) {
      this.pendingRepeats.push({ at: Date.now() + 5 * MINUTE, reminder: item });
      UI.toast('好，5 分钟后再提醒你 ⏰');
    }
    this.hideReminder();
  };

  /* ---------------- 今日提醒时间表 ---------------- */
  App.renderReminderPlan = function () {
    const listEl = $('#remindPlanList');
    if (!listEl) return;

    const now = new Date();
    const nowMin = minutesOfDate(now);
    const items = this.todayReminders(now);
    const subEl = $('#remindPlanSub');

    if (!items.length) {
      listEl.innerHTML = '<div class="rp-empty">今天没有需要提醒的课程，安心安排自己的节奏 ✨</div>';
      if (subEl) subEl.textContent = D.phaseOf(now, typeof App.activePreset === 'function' ? App.activePreset() : 'sun').emoji + ' ' +
        D.phaseOf(now, typeof App.activePreset === 'function' ? App.activePreset() : 'sun').name;
      return;
    }

    let next = null;
    items.forEach(function (item) {
      if (!next && item.enabled && item.at > nowMin) next = item;
    });

    if (subEl) {
      if (next) {
        const remain = Math.max(1, Math.ceil(next.at - nowMin));
        subEl.textContent = '下一条 ' + fmtAt(next.at) + ' · ' + remain + ' 分钟后';
      } else {
        const hasEnabled = items.some(function (item) { return item.enabled; });
        subEl.textContent = hasEnabled ? '今天的提醒都过啦' : '提醒已全部关闭';
      }
    }

    listEl.innerHTML = items.slice(0, 6).map(function (item) {
      const fired = !!App.reminderLog.fired[item.id];
      const past = item.at <= nowMin;
      const tag = !item.enabled ? '已关闭' : (fired ? '已提醒' : (past ? '已过时' : '待提醒'));
      const cls = 'rp-item' + (!item.enabled ? ' is-off' : '') + (fired ? ' is-done' : '');
      return '<div class="' + cls + '">' +
        '<span class="rp-time">' + fmtAt(item.at) + '</span>' +
        '<span class="rp-emoji">' + esc(item.emoji) + '</span>' +
        '<span class="rp-text">' + esc(item.title + ' · ' + item.courseName) + '</span>' +
        '<span class="rp-tag">' + tag + '</span>' +
        '</div>';
    }).join('');
  };

  /* 今日提醒明细弹层 */
  App.showReminderOverview = function () {
    const now = new Date();
    const items = this.todayReminders(now);
    const rows = items.map(function (item) {
      const done = !!App.reminderLog.fired[item.id];
      const state = !item.enabled ? ' · 已关闭' : (done ? ' ✅' : '');
      return '<div class="detail-row"><span class="dl">' + fmtAt(item.at) + '</span><span class="dv">' +
        esc(item.emoji + ' ' + item.title) + state + '<br>' +
        esc(item.body) +
        '</span></div>';
    }).join('');

    UI.showModal(
      '<div class="modal-title">今日提醒时间表 ⏰</div>' +
      '<div class="modal-sub">按本机时间与课表节次计算 · App 打开时生效</div>' +
      (rows || '<div class="rp-empty" style="padding:18px 0">今天没有可提醒的课程</div>') +
      '<div class="modal-actions" style="margin-top:12px">' +
      '<button type="button" class="btn primary" data-action="close">知道啦</button>' +
      '</div>'
    );
  };

  /* 提醒规则说明 */
  App.showReminderRules = function () {
    UI.showModal(
      '<div class="modal-title">提醒规则 📋</div>' +
      '<div class="modal-sub">全部按你的课表自动计算</div>' +
      '<div class="detail-list">' +
      '<div class="detail-row"><span class="dl">上课前</span><span class="dv">默认提前 20 分钟提醒下一节课，带上教室、教师与要带的书。</span></div>' +
      '<div class="detail-row"><span class="dl">快下课</span><span class="dv">默认提前 5 分钟提醒，方便提前收拾东西。</span></div>' +
      '<div class="detail-row"><span class="dl">点外卖</span><span class="dv">上午接近中午的最后一节（11:00 后下课、13:00 前结束）与下午靠后的最后一节（16:00 后下课、19:00 前结束）各提前 30 分钟提醒，可直接跳到转盘挑饭。</span></div>' +
      '<div class="detail-row"><span class="dl">提醒方式</span><span class="dv">默认使用底部弹窗；可在设置里切换为不打断操作的横幅。自定义提醒也走同一套弹窗。</span></div>' +
      '<div class="detail-row"><span class="dl">防重复</span><span class="dv">每条提醒每天只弹一次；到点后 5 分钟内没有回到 App 就自动跳过，不补弹过期提醒；点「稍后」会在 5 分钟后再次提示。</span></div>' +
      '<div class="detail-row"><span class="dl">限制</span><span class="dv">WebView 暂不支持后台推送，App 在前台时才会弹出提醒。</span></div>' +
      '</div>' +
      '<button type="button" class="btn primary full" data-action="close">明白了</button>'
    );
  };

  /* ---------------- 事件绑定 ---------------- */
  App.bindRhythmEvents = function () {
    if (this._rhythmBound) return;
    this._rhythmBound = true;
    const self = this;

    /* 首次点按解锁音频（移动端自动播放限制） */
    document.addEventListener('pointerdown', function () {
      self.ensureAudio();
    }, { once: true });

    const banner = $('#remindBanner');
    if (banner) {
      banner.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-rb]');
        if (!btn) return;
        const action = btn.dataset.rb;
        const item = self.currentReminder;

        if (action === 'close') {
          self.hideReminder();
          return;
        }
        if (action === 'snooze') {
          self.snoozeReminder(item);
          return;
        }
        if (action === 'wheel') {
          self.hideReminder();
          self.switchTab('food');
          UI.toast('转到什么就吃什么 🍜');
          return;
        }
        if (action === 'detail') {
          self.hideReminder();
          if (item && item.courseId) self.showCourseDetail(item.courseId);
        }
        if (action === 'custom') {
          self.hideReminder();
          if (item && item.customId && typeof self.openReminderEditor === 'function') {
            self.openReminderEditor(item.customId);
          }
        }
      });
    }

    /* 提醒弹窗动作 */
    const popup = $('#reminderPopup');
    if (popup) {
      popup.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-popup]');
        if (!btn) return;
        const action = btn.dataset.popup;
        const item = self.currentReminder;
        if (action === 'close') {
          self.hideReminder();
          return;
        }
        if (action === 'snooze') {
          self.snoozeReminder(item);
          return;
        }
        if (action === 'course') {
          self.hideReminder();
          if (item && (item.type === 'lunch' || item.type === 'dinner')) {
            self.switchTab('food');
            UI.toast('转到什么就吃什么 🍜');
          } else if (item && item.type === 'custom' && item.customId && typeof self.openReminderEditor === 'function') {
            self.openReminderEditor(item.customId);
          } else if (item && item.courseId) {
            self.showCourseDetail(item.courseId);
          }
        }
      });
    }

    const overviewBtn = $('#btnRemindOverview');
    if (overviewBtn) {
      overviewBtn.addEventListener('click', function () {
        self.showReminderOverview();
      });
    }

    const rulesBtn = $('#btnRemindRules');
    if (rulesBtn) {
      rulesBtn.addEventListener('click', function () {
        self.showReminderRules();
      });
    }

    const testBtn = $('#btnRemindTest');
    if (testBtn) {
      testBtn.addEventListener('click', function () {
        self.ensureAudio();
        self.presentReminder({
          type: 'pre',
          emoji: '🔔',
          title: '提醒效果预览',
          body: '真实上课前会这样提醒你，可在今日页查看完整时间表。',
          courseId: ''
        }, false);
      });
    }
  };
})();
/* ============ 时段与提醒模块结束 ============ */