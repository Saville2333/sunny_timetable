/* ============================================================
 * 星海课表 · 设置与个性化
 * 学期设置 / 主题色 / 背景 / 数据备份 / 昵称
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

  function setSelectValue(id, value, unit) {
    const select = document.getElementById(id);
    if (!select) return;
    let exists = Array.prototype.some.call(select.options, function (opt) {
      return opt.value === String(value);
    });
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = String(value);
      opt.textContent = value + (unit || '');
      select.appendChild(opt);
    }
    select.value = String(value);
  }

  /* ---------------- 设置页渲染 ---------------- */
  App.renderSettings = function () {
    const settings = Store.settings;

    const startInput = $('#setStart');
    if (startInput && startInput.value !== settings.semesterStart) {
      startInput.value = settings.semesterStart;
    }
    setSelectValue('setWeeks', settings.totalWeeks, ' 周');
    setSelectValue('setSections', settings.sections, ' 节');

    const weekendSwitch = $('#setWeekend');
    if (weekendSwitch) weekendSwitch.checked = !!settings.showWeekend;

    const nameEl = $('#profileName');
    if (nameEl) nameEl.textContent = settings.nickname || '同学';

    const avatarEl = $('#avatarBox');
    if (avatarEl) avatarEl.textContent = settings.avatar || '🐚';

    const subEl = $('#profileSub');
    if (subEl) {
      subEl.textContent = '第 ' + Store.currentWeek() + ' 周 · 共 ' + Store.courses.length + ' 门课程 · ' +
        (settings.showWeekend ? '含周末' : '仅工作日');
    }

    const infoEl = $('#dataInfo');
    if (infoEl) {
      infoEl.textContent = '共 ' + Store.courses.length + ' 门课程 · 学期 ' + settings.totalWeeks +
        ' 周 · 每天 ' + settings.sections + ' 节';
    }

    this.renderThemeGrid();
    this.renderBgGrid();
    this.renderPhaseSettings();
    this.renderReminderSettings();
    if (typeof this.renderCustomReminders === 'function') this.renderCustomReminders();
    if (typeof this.renderWeatherSettings === 'function') this.renderWeatherSettings();

    const bgColorInput = $('#setBgColor');
    if (bgColorInput) {
      bgColorInput.value = /^#[0-9a-f]{6}$/i.test(settings.bgColor) ? settings.bgColor : '#eafafd';
    }

    const bgNote = $('#bgNote');
    if (bgNote) bgNote.hidden = !settings.bgImage;
  };

  App.renderThemeGrid = function () {
    const box = $('#themeGrid');
    if (!box) return;
    const selected = U.clampInt(Store.settings.themeIndex, 0, D.THEMES.length - 1, 8);
    const auto = !!Store.settings.autoTheme;
    const activePreset = typeof this.activePreset === 'function' ? this.activePreset() : 'sun';
    box.innerHTML = '';
    D.THEMES.forEach(function (theme, index) {
      const btn = document.createElement('button');
      btn.type = 'button';
      const special = !!theme.special;
      const currentPreset = special && auto && activePreset === theme.preset;
      /* 自动配色开启时，主题来自当前时段，不再高亮普通色块；预设卡单独高亮 */
      btn.className = 'theme-item' +
        (special ? ' is-special preset-' + theme.preset : '') +
        (!auto && index === selected ? ' is-on' : '') +
        (currentPreset ? ' is-now' : '');
      btn.dataset.theme = String(index);
      btn.title = special
        ? '套用「' + theme.name + '」：一天四变 + 天气变形'
        : '手动主题「' + theme.name + '」';

      const swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.style.background = special && theme.preset === 'error'
        ? 'linear-gradient(135deg,#05080f 0%,#0b1730 55%,#4c8dff 100%)'
        : (special
          ? 'linear-gradient(135deg,#fffdf4 0%,#ffe7a6 55%,#f0a30a 100%)'
          : 'linear-gradient(135deg,' + theme.main + ',' + theme.deep + ')');

      const label = document.createElement('span');
      label.className = 'tname';
      label.textContent = theme.name;
      if (special) {
        const tag = document.createElement('span');
        tag.className = 'ttag';
        tag.textContent = theme.emoji + (theme.preset === 'error' ? ' ERROR' : ' SUN');
        btn.appendChild(tag);
      }

      btn.appendChild(swatch);
      btn.appendChild(label);
      box.appendChild(btn);
    });

    /* 说明当前主题来源：自动时段 or 手动 */
    const note = $('#themeNote');
    if (note) {
      const autoNow = !!Store.settings.autoTheme;
      const presetKey = typeof this.activePreset === 'function' ? this.activePreset() : 'sun';
      const presetInfo = D.PRESETS[presetKey] || D.PRESETS.sun;
      const phase = D.phaseOf(new Date(), presetKey);
      note.textContent = autoNow
        ? '当前：' + presetInfo.emoji + ' ' + presetInfo.name + '「' + presetInfo.label + '」+ ' +
          phase.emoji + ' ' + phase.name + ' · ' + phase.label + '；点普通色块可切回手动主题。'
        : '手动主题「' + (D.THEMES[selected] ? D.THEMES[selected].name : '') + '」；点「太阳神 / 错误文档」预设卡可恢复一天四变。';
      note.classList.toggle('is-auto', autoNow);
      note.classList.toggle('is-error', presetKey === 'error');
    }
  };

  App.renderBgGrid = function () {
    const box = $('#bgGrid');
    if (!box) return;
    const settings = Store.settings;
    const useCustomColor = !!settings.bgColor;
    /* 自动配色且背景跟随时段时，不把任何预设标记为选中 */
    const following = (!!settings.autoTheme || settings.themePreset === 'error') &&
      !!settings.bgFollowPhase && !useCustomColor && !settings.bgImage;
    box.innerHTML = '';
    D.BACKGROUNDS.forEach(function (bg) {
      const btn = document.createElement('button');
      btn.type = 'button';
      const on = !following && !useCustomColor && bg.id === settings.bgId;
      btn.className = 'bg-item' + (on ? ' is-on' : '');
      btn.dataset.bg = bg.id;
      btn.style.background = bg.css;

      const label = document.createElement('span');
      label.className = 'bname';
      label.textContent = bg.name;

      btn.appendChild(label);
      box.appendChild(btn);
    });
  };

  /* ---------------- 时段配色（随现实时间） ---------------- */
  App.renderPhaseSettings = function () {
    const autoSwitch = $('#setAutoTheme');
    if (autoSwitch) autoSwitch.checked = !!Store.settings.autoTheme;
    const bgSwitch = $('#setBgFollow');
    if (bgSwitch) bgSwitch.checked = !!Store.settings.bgFollowPhase;

    const presetKey = typeof this.activePreset === 'function' ? this.activePreset() : 'sun';
    const presetInfo = D.PRESETS[presetKey] || D.PRESETS.sun;
    const variants = D.PRESET_PHASES[presetKey] || {};
    const box = $('#phaseGrid');
    const now = D.phaseOf(new Date(), presetKey);
    if (box) {
      box.innerHTML = D.PHASES.map(function (phase) {
        const variant = variants[phase.key] || {};
        const theme = variant.theme || phase.theme;
        const on = phase.key === now.key ? ' is-now' : '';
        return '<button type="button" class="phase-item' + on + '" data-phase="' + phase.key + '"' +
          ' style="background:linear-gradient(140deg,' + theme.soft + ',' + theme.main + ' 130%)">' +
          '<span class="pi-emoji">' + (variant.emoji || phase.emoji) + '</span>' +
          '<span class="pi-name">' + (variant.label || phase.label) + ' · ' + presetInfo.name + '</span>' +
          '<span class="pi-time">' + phase.timeText + '</span>' +
          '</button>';
      }).join('');
    }

    const nowEl = $('#phaseNow');
    if (nowEl) {
      nowEl.textContent = Store.settings.autoTheme
        ? '现在：' + presetInfo.emoji + ' ' + presetInfo.name + ' · ' + now.emoji + ' ' + now.name +
          '「' + now.label + '」（' + now.timeText + '）· 天气会继续改变氛围'
        : '现在：' + presetInfo.emoji + ' ' + presetInfo.name + ' · 自动四变已关闭，使用手动主题「' +
          (D.THEMES[Store.settings.themeIndex] ? D.THEMES[Store.settings.themeIndex].name : '') + '」';
    }
  };

  /* ---------------- 提醒设置 ---------------- */
  App.renderReminderSettings = function () {
    const s = Store.settings;
    const switches = [
      ['setRemindPre', !!s.remindPreClass],
      ['setRemindEnd', !!s.remindEndClass],
      ['setRemindMeal', !!s.remindMeal],
      ['setRemindSound', !!s.remindSound],
      ['setRemindVibrate', !!s.remindVibrate]
    ];
    switches.forEach(function (pair) {
      const el = document.getElementById(pair[0]);
      if (el) el.checked = pair[1];
    });

    setSelectValue('setRemindPreMin', U.clampInt(s.remindPreMin, 5, 60, 20), ' 分');
    setSelectValue('setRemindEndMin', U.clampInt(s.remindEndMin, 2, 20, 5), ' 分');
    setSelectValue('setRemindMealMin', U.clampInt(s.remindMealMin, 10, 60, 30), ' 分');
    const popupSelect = $('#setRemindPopup');
    if (popupSelect) popupSelect.value = s.remindPopup === false ? '0' : '1';
  };

  /* ---------------- 背景图片文件管理 ---------------- */
  App.removeBgFile = function (filename) {
    if (!filename) return Promise.resolve();
    if (!window.wusiFile || typeof window.wusiFile.delete !== 'function') return Promise.resolve();
    return window.wusiFile.delete(filename).catch(function (err) {
      console.warn('[Settings] 删除旧背景失败', err);
    });
  };

  App.handleBgFile = function (file) {
    const self = this;
    if (!file) return;
    if (!/^image\//i.test(file.type || '')) {
      UI.toast('请选择图片文件 🖼');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      UI.toast('图片请小于 8MB');
      return;
    }
    if (!window.wusiFile || typeof window.wusiFile.save !== 'function') {
      UI.toast('当前环境暂不支持自定义图片背景');
      return;
    }

    const match = /\.([a-z0-9]+)$/i.exec(file.name || '');
    const ext = match ? match[1].toLowerCase() : 'jpg';
    const filename = 'xinghai_bg_' + Date.now() + '.' + ext;
    const oldFile = Store.settings.bgImage;

    UI.toast('正在保存背景…');
    window.wusiFile.save(filename, file)
      .then(function () {
        return Store.updateSettings({ bgImage: filename, bgColor: '' });
      })
      .then(function () {
        if (oldFile && oldFile !== filename) self.removeBgFile(oldFile);
        return self.loadBgImage();
      })
      .then(function () {
        self.applyBackground();
        self.renderSettings();
        UI.toast('背景图片已更新 🖼');
      })
      .catch(function (err) {
        console.error('[Settings] 背景保存失败', err);
        UI.toast('背景保存失败，请重试');
      });
  };

  /* ---------------- 数据导出 / 导入 ---------------- */
  App.exportData = function () {
    const data = Store.exportData();
    const json = JSON.stringify(data, null, 2);
    const filename = 'xinghai_timetable_' + U.dateKey(new Date()) + '.json';
    let blob;
    try {
      blob = new Blob([json], { type: 'application/json' });
    } catch (e) {
      console.error('[Settings] 生成备份失败', e);
      UI.toast('生成备份失败');
      return;
    }

    if (typeof window.wusiShare !== 'function') {
      UI.toast('请升级到无思微程序最新版本以导出备份');
      return;
    }
    window.wusiShare({ blob: blob, filename: filename, title: '星海课表备份' })
      .then(function () {
        UI.toast('已发起导出 📤');
      })
      .catch(function (err) {
        console.error('[Settings] 导出失败', err);
        UI.toast('导出失败，请重试');
      });
  };

  App.handleImportFile = function (file) {
    const self = this;
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      UI.toast('备份文件过大');
      return;
    }
    const reader = new FileReader();
    reader.onload = function () {
      let data = null;
      try {
        data = JSON.parse(String(reader.result || ''));
      } catch (e) {
        console.error('[Settings] 备份解析失败', e);
        UI.toast('备份文件格式不正确');
        return;
      }

      const rawList = Array.isArray(data) ? data : (data && Array.isArray(data.courses) ? data.courses : null);
      if (!rawList) {
        UI.toast('备份中没有课程数据');
        return;
      }
      const cleanCourses = rawList.map(D.normalizeCourse).filter(Boolean);
      const rawSettings = data && data.settings ? data.settings : null;
      const rawReminders = data && Array.isArray(data.reminders)
        ? data.reminders.map(D.normalizeReminder).filter(Boolean)
        : [];

      UI.confirm({
        title: '导入备份？',
        sub: '将导入 ' + cleanCourses.length + ' 门课程' +
          (rawReminders.length ? '、' + rawReminders.length + ' 条自定义提醒' : '') +
          (rawSettings ? '及学期设置' : '') + '，当前课表会被替换',
        okText: '导入',
        onOk: function () {
          let patch = null;
          if (rawSettings) {
            const allowed = [
              'designVersion', 'themeIndex', 'themePreset', 'bgId', 'bgColor', 'semesterStart', 'totalWeeks', 'sections',
              'showWeekend', 'nickname', 'avatar',
              'autoTheme', 'bgFollowPhase',
              'remindPreClass', 'remindPreMin', 'remindEndClass', 'remindEndMin',
              'remindMeal', 'remindMealMin', 'remindSound', 'remindVibrate', 'remindPopup',
              'weatherOn', 'weatherMode', 'weatherCity', 'weatherLat', 'weatherLon', 'weatherPlace',
              'weatherManualCode', 'weatherManualTemp', 'weatherFx', 'weatherTheme', 'weatherOutfit',
              'weatherUpdatedAt'
            ];
            patch = {};
            allowed.forEach(function (key) {
              if (rawSettings[key] !== undefined && rawSettings[key] !== null) patch[key] = rawSettings[key];
            });
            patch.bgImage = '';
          }

          const step = patch ? Store.updateSettings(patch) : Promise.resolve();
          return step.then(function () {
            return Store.replaceCourses(cleanCourses);
          }).then(function () {
            Store.reminders = rawReminders;
            return Store.saveReminders();
          }).then(function (count) {
            self.applyTheme();
            self.applyBackground();
            self.state.week = Store.currentWeek();
            self.renderAll();
            self.renderSettings();
            if (typeof self.renderCustomReminders === 'function') self.renderCustomReminders();
            if (typeof self.renderWeatherFx === 'function') self.renderWeatherFx();
            UI.toast('已导入 ' + cleanCourses.length + ' 门课程 ⭐');
          });
        }
      });
    };
    reader.onerror = function () {
      console.error('[Settings] 文件读取失败', reader.error);
      UI.toast('读取文件失败');
    };
    reader.readAsText(file);
  };

  /* ---------------- 资料编辑 ---------------- */
  App.showProfileEditor = function () {
    UI.showModal(
      '<div class="modal-title">编辑我的资料 ✨</div>' +
      '<div class="modal-sub">给自己取个喜欢的昵称和头像 emoji</div>' +
      '<div class="form-group">' +
      '<label class="form-label" for="profileNameInput">昵称</label>' +
      '<input type="text" id="profileNameInput" class="input" maxlength="12" value="' + esc(Store.settings.nickname) + '">' +
      '</div>' +
      '<div class="form-group">' +
      '<label class="form-label" for="profileAvatarInput">头像 emoji</label>' +
      '<input type="text" id="profileAvatarInput" class="input" maxlength="4" value="' + esc(Store.settings.avatar) + '">' +
      '</div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn ghost" data-action="close">取消</button>' +
      '<button type="button" class="btn primary" data-action="save-profile">保存 ⭐</button>' +
      '</div>'
    );
  };

  /* ---------------- 课程清单管理 ---------------- */
  App.showCourseManager = function () {
    const courses = Store.courses.slice().sort(function (a, b) {
      return a.day - b.day || a.start - b.start;
    });
    if (!courses.length) {
      UI.toast('还没有课程，点课表空白格添加吧 ✨');
      return;
    }

    const items = courses.map(function (course) {
      const color = Store.courseColor(course);
      return '<button type="button" class="preview-item" data-action="manage-course" data-id="' + course.id + '">' +
        '<span class="pi-dot" style="background:' + color.main + '"></span>' +
        '<span class="pi-main">' +
        '<span class="pi-name" style="display:block">' + esc((course.emoji || '📘') + ' ' + course.name) + '</span>' +
        '<span class="pi-meta" style="display:block">' + D.WEEKDAYS[course.day - 1] + ' 第 ' + course.start + '-' + course.end +
        ' 节 · ' + esc(course.room || '教室未填') + ' · ' + esc(Store.weeksText(course.weeks)) + '</span>' +
        '</span>' +
        '<span class="pi-check" style="border:none;background:transparent;color:var(--ink-3);font-size:13px">✏️</span>' +
        '</button>';
    }).join('');

    UI.showModal(
      '<div class="modal-title">我的课程 🗂</div>' +
      '<div class="modal-sub">共 ' + courses.length + ' 门 · 点按任意课程即可编辑</div>' +
      '<div class="preview-list">' + items + '</div>' +
      '<button type="button" class="btn ghost full" data-action="close">关闭</button>'
    );
  };

  /* ---------------- 事件绑定 ---------------- */
  App.bindSettingsEvents = function () {
    const self = this;

    const startInput = $('#setStart');
    if (startInput) {
      startInput.addEventListener('change', function () {
        const date = U.parseDate(startInput.value);
        if (!date) {
          UI.toast('日期格式不正确');
          startInput.value = Store.settings.semesterStart;
          return;
        }
        Store.updateSettings({ semesterStart: U.dateKey(U.mondayOf(date)) }).then(function () {
          self.state.week = Store.currentWeek();
          self.renderAll();
          self.renderSettings();
          UI.toast('学期日期已更新，当前第 ' + Store.currentWeek() + ' 周 ⭐');
        });
      });
    }

    const weeksSelect = $('#setWeeks');
    if (weeksSelect) {
      weeksSelect.addEventListener('change', function () {
        const total = U.clampInt(weeksSelect.value, 1, 30, 18);
        Store.updateSettings({ totalWeeks: total }).then(function () {
          self.state.week = U.clampInt(self.state.week, 1, total, 1);
          self.renderSchedule();
          self.renderSettings();
          UI.toast('学期周数已设为 ' + total + ' 周');
        });
      });
    }

    const sectionsSelect = $('#setSections');
    if (sectionsSelect) {
      sectionsSelect.addEventListener('change', function () {
        const sections = U.clampInt(sectionsSelect.value, 6, 12, 10);
        Store.updateSettings({ sections: sections }).then(function () {
          self.renderSchedule();
          self.renderSettings();
          UI.toast('每天节数已设为 ' + sections + ' 节');
        });
      });
    }

    const weekendSwitch = $('#setWeekend');
    if (weekendSwitch) {
      weekendSwitch.addEventListener('change', function () {
        Store.updateSettings({ showWeekend: !!weekendSwitch.checked }).then(function () {
          self.renderSchedule();
          self.renderSettings();
          UI.toast(weekendSwitch.checked ? '已显示周末' : '已隐藏周末');
        });
      });
    }

    /* ---- 时段配色：自动跟随现实时间 ---- */
    const autoThemeSwitch = $('#setAutoTheme');
    if (autoThemeSwitch) {
      autoThemeSwitch.addEventListener('change', function () {
        const on = !!autoThemeSwitch.checked;
        Store.updateSettings({ autoTheme: on }).then(function () {
          self.applyTheme();
          self.applyBackground();
          /* 重绘整组设置，让主题说明、背景选中态和开关状态保持一致 */
          self.renderSettings();
          if (on) {
            const presetKey = typeof self.activePreset === 'function' ? self.activePreset() : 'sun';
            const presetInfo = D.PRESETS[presetKey] || D.PRESETS.sun;
            const phase = D.phaseOf(new Date(), presetKey);
            UI.toast(presetInfo.emoji + ' 一天四变已开启 · ' + phase.name + '「' + phase.label + '」');
          } else {
            UI.toast('已改用手动主题 ⚠️');
          }
        });
      });
    }

    const bgFollowSwitch = $('#setBgFollow');
    if (bgFollowSwitch) {
      bgFollowSwitch.addEventListener('change', function () {
        const on = !!bgFollowSwitch.checked;
        Store.updateSettings({ bgFollowPhase: on }).then(function () {
          self.applyTheme();
          self.applyBackground();
          self.renderSettings();
          UI.toast(on ? '背景将跟随时段变化 🌤' : '已固定当前背景');
        });
      });
    }

    const phaseGrid = $('#phaseGrid');
    if (phaseGrid) {
      phaseGrid.addEventListener('click', function (e) {
        const item = e.target.closest('.phase-item');
        if (!item) return;
        const phase = D.PHASES.filter(function (p) {
          return p.key === item.dataset.phase;
        })[0];
        if (!phase) return;

        const presetKey = typeof self.activePreset === 'function' ? self.activePreset() : 'sun';
        const variant = (D.PRESET_PHASES[presetKey] || {})[phase.key] || {};
        const now = D.phaseOf(new Date(), presetKey);
        if (phase.key === now.key) {
          Store.updateSettings({ autoTheme: true }).then(function () {
            self.applyTheme();
            self.applyBackground();
            self.renderSettings();
            UI.toast('已应用「' + (variant.label || phase.label) + '」配色 ' + (variant.emoji || phase.emoji));
          });
          return;
        }
        UI.toast((variant.emoji || phase.emoji) + '「' + phase.name + '」会在 ' + phase.timeText.split(' - ')[0] + ' 自动生效');
      });
    }

    /* ---- 提醒开关 ---- */
    const remindSwitchMap = [
      { id: 'setRemindPre', key: 'remindPreClass', on: '已开启上课前提醒 ⏰', off: '已关闭上课前提醒' },
      { id: 'setRemindEnd', key: 'remindEndClass', on: '已开启快下课提醒 📚', off: '已关闭快下课提醒' },
      { id: 'setRemindMeal', key: 'remindMeal', on: '已开启点外卖提醒 🍱', off: '已关闭点外卖提醒' },
      { id: 'setRemindSound', key: 'remindSound', on: '已开启提醒音效 🔔', off: '已静音提醒' },
      { id: 'setRemindVibrate', key: 'remindVibrate', on: '已开启提醒振动', off: '已关闭提醒振动' }
    ];
    remindSwitchMap.forEach(function (cfg) {
      const el = document.getElementById(cfg.id);
      if (!el) return;
      el.addEventListener('change', function () {
        const checked = !!el.checked;
        const patch = {};
        patch[cfg.key] = checked;
        Store.updateSettings(patch).then(function () {
          self.renderReminderSettings();
          if (typeof self.renderReminderPlan === 'function') self.renderReminderPlan();
          UI.toast(checked ? cfg.on : cfg.off);
        });
      });
    });

    /* ---- 提醒分钟数 ---- */
    const remindMinMap = [
      { id: 'setRemindPreMin', key: 'remindPreMin', fallback: 20 },
      { id: 'setRemindEndMin', key: 'remindEndMin', fallback: 5 },
      { id: 'setRemindMealMin', key: 'remindMealMin', fallback: 30 }
    ];
    remindMinMap.forEach(function (cfg) {
      const el = document.getElementById(cfg.id);
      if (!el) return;
      el.addEventListener('change', function () {
        const value = U.clampInt(el.value, 2, 60, cfg.fallback);
        const patch = {};
        patch[cfg.key] = value;
        Store.updateSettings(patch).then(function () {
          self.renderReminderSettings();
          if (typeof self.renderReminderPlan === 'function') self.renderReminderPlan();
          UI.toast('提醒时间已调整为提前 ' + value + ' 分钟');
        });
      });
    });

    /* ---- 提醒方式：弹窗 / 横幅 ---- */
    const popupSelect = $('#setRemindPopup');
    if (popupSelect) {
      popupSelect.addEventListener('change', function () {
        const on = popupSelect.value === '1';
        Store.updateSettings({ remindPopup: on }).then(function () {
          self.renderReminderSettings();
          UI.toast(on ? '已改为弹窗提醒 🔔' : '已改为横幅提醒');
        });
      });
    }

    const themeGrid = $('#themeGrid');
    if (themeGrid) {
      themeGrid.addEventListener('click', function (e) {
        const btn = e.target.closest('.theme-item');
        if (!btn) return;
        const index = U.clampInt(btn.dataset.theme, 0, D.THEMES.length - 1, 0);
        const picked = D.THEMES[index];
        if (picked && picked.special) {
          const presetKey = picked.preset;
          Store.updateSettings({
            themeIndex: index,
            autoTheme: true,
            bgFollowPhase: true,
            bgId: presetKey === 'error' ? 'error' : 'sun',
            bgColor: ''
          }).then(function () {
            self.applyTheme();
            self.applyBackground();
            self.renderSettings();
            if (typeof self.renderDelight === 'function') self.renderDelight();
            UI.toast(picked.emoji + ' 已启用「' + picked.name + '」：一天四变 + 天气变形 ☀️');
          });
          return;
        }
        Store.updateSettings({ themeIndex: index, autoTheme: false }).then(function () {
          self.applyTheme();
          self.applyBackground();
          self.renderSettings();
          UI.toast('已切换为手动主题「' + picked.name + '」⭐');
        });
      });
    }

    const bgGrid = $('#bgGrid');
    if (bgGrid) {
      bgGrid.addEventListener('click', function (e) {
        const btn = e.target.closest('.bg-item');
        if (!btn) return;
        const bgId = btn.dataset.bg;
        const oldFile = Store.settings.bgImage;
        /* 用户主动选背景时，关闭「背景跟随时段」，让选择立即生效 */
        Store.updateSettings({ bgId: bgId, bgColor: '', bgImage: '', bgFollowPhase: false }).then(function () {
          if (oldFile) self.removeBgFile(oldFile);
          if (self.bgObjectUrl) {
            URL.revokeObjectURL(self.bgObjectUrl);
            self.bgObjectUrl = '';
          }
          self.applyBackground();
          self.renderSettings();
          UI.toast('背景已更换 🖼');
        });
      });
    }

    const bgColorInput = $('#setBgColor');
    if (bgColorInput) {
      bgColorInput.addEventListener('input', function () {
        const layer = $('#bgLayer');
        const image = $('#bgImage');
        if (layer) {
          layer.style.background = bgColorInput.value;
          layer.classList.remove('has-image');
        }
        if (image) image.style.backgroundImage = 'none';
      });
      bgColorInput.addEventListener('change', function () {
        const color = bgColorInput.value;
        const oldFile = Store.settings.bgImage;
        Store.updateSettings({ bgColor: color, bgImage: '' }).then(function () {
          if (oldFile) self.removeBgFile(oldFile);
          if (self.bgObjectUrl) {
            URL.revokeObjectURL(self.bgObjectUrl);
            self.bgObjectUrl = '';
          }
          self.applyBackground();
          self.renderSettings();
          UI.toast('背景色已更新 🎨');
        });
      });
    }

    const uploadBtn = $('#btnUploadBg');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', function () {
        if (!window.wusiFile || typeof window.wusiFile.save !== 'function') {
          UI.toast('当前环境暂不支持自定义图片背景');
          return;
        }
        const picker = document.createElement('input');
        picker.type = 'file';
        picker.accept = 'image/*';
        picker.addEventListener('change', function () {
          const file = picker.files && picker.files[0];
          if (file) self.handleBgFile(file);
        });
        picker.click();
      });
    }

    const clearBgBtn = $('#btnClearBg');
    if (clearBgBtn) {
      clearBgBtn.addEventListener('click', function () {
        const oldFile = Store.settings.bgImage;
        Store.updateSettings({ bgImage: '', bgColor: '', bgId: 'aqua' }).then(function () {
          if (oldFile) self.removeBgFile(oldFile);
          if (self.bgObjectUrl) {
            URL.revokeObjectURL(self.bgObjectUrl);
            self.bgObjectUrl = '';
          }
          self.applyBackground();
          self.renderSettings();
          UI.toast('已恢复默认背景 🐚');
        });
      });
    }

    const nameBtn = $('#btnEditName');
    if (nameBtn) {
      nameBtn.addEventListener('click', function () {
        self.showProfileEditor();
      });
    }

    const exportBtn = $('#btnExport');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        self.exportData();
      });
    }

    const importBtn = $('#btnImportFile');
    const fileInput = $('#fileImport');
    if (importBtn && fileInput) {
      importBtn.addEventListener('click', function () {
        fileInput.click();
      });
      fileInput.addEventListener('change', function () {
        const file = fileInput.files && fileInput.files[0];
        if (file) self.handleImportFile(file);
        fileInput.value = '';
      });
    }

    const resetBtn = $('#btnResetAll');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        UI.confirm({
          title: '清空全部数据？',
          sub: '课程、学期设置、主题、自定义背景、吃饭菜单与提醒记录都会被删除，且无法恢复',
          okText: '全部清空',
          danger: true,
          onOk: function () {
            const oldFile = Store.settings.bgImage;
            const defaults = {
              designVersion: 3,
              themeIndex: 8,
              themePreset: 'sun',
              bgId: 'sun',
              bgColor: '',
              bgImage: '',
              semesterStart: U.dateKey(U.mondayOf(new Date())),
              totalWeeks: 18,
              sections: 10,
              showWeekend: true,
              nickname: '太阳神眷顾的同学',
              avatar: '🐈‍⬛',
              autoTheme: true,
              bgFollowPhase: true,
              remindPreClass: true,
              remindPreMin: 20,
              remindEndClass: true,
              remindEndMin: 5,
              remindMeal: true,
              remindMealMin: 30,
              remindSound: true,
              remindVibrate: true,
              remindPopup: true,
              weatherOn: true,
              weatherMode: 'auto',
              weatherCity: '',
              weatherLat: null,
              weatherLon: null,
              weatherPlace: '',
              weatherManualCode: 0,
              weatherManualTemp: 26,
              weatherFx: true,
              weatherTheme: true,
              weatherOutfit: true,
              weatherUpdatedAt: 0
            };
            return Store.updateSettings(defaults).then(function () {
              return Store.clearCourses();
            }).then(function () {
              return Store.clearReminders();
            }).then(function () {
              Store.write(window.AppData.KEY_WEATHER, null);
              self.weather = null;
              self._weatherFxKey = '';
              if (typeof self.resetFoodData === 'function') self.resetFoodData();
              if (typeof self.resetReminderLog === 'function') self.resetReminderLog();
              if (oldFile) self.removeBgFile(oldFile);
              if (self.bgObjectUrl) {
                URL.revokeObjectURL(self.bgObjectUrl);
                self.bgObjectUrl = '';
              }
              self.applyTheme();
              self.applyBackground();
              self.state.week = Store.currentWeek();
              self.renderAll();
              self.renderSettings();
              if (typeof self.renderCustomReminders === 'function') self.renderCustomReminders();
              if (typeof self.renderWeatherUI === 'function') self.renderWeatherUI();
              if (typeof self.renderWeatherFx === 'function') self.renderWeatherFx();
              UI.toast('已恢复初始状态 🐚');
            });
          }
        });
      });
    }

    /* 课程清单入口 */
    const infoEl = $('#dataInfo');
    if (infoEl) {
      infoEl.addEventListener('click', function () {
        self.showCourseManager();
      });
    }

    /* 资料保存、课程清单等模态动作 */
    const modal = $('#modalCard');
    if (modal) {
      modal.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        if (btn.dataset.action === 'manage-course') {
          const id = btn.dataset.id;
          UI.closeModal();
          self.openEditor({ id: id });
          return;
        }

        if (btn.dataset.action !== 'save-profile') return;

        const nameInput = $('#profileNameInput');
        const avatarInput = $('#profileAvatarInput');
        const nickname = (nameInput && nameInput.value.trim()) || '同学';
        const avatar = (avatarInput && avatarInput.value.trim()) || '🐚';

        Store.updateSettings({ nickname: nickname.slice(0, 12), avatar: avatar.slice(0, 4) }).then(function () {
          UI.closeModal();
          self.renderSettings();
          self.renderToday();
          UI.toast('资料已更新 ✨');
        });
      });
    }
  };

  /* 汇总所有事件绑定 */
  App.bindEvents = function () {
    this.bindViewEvents();
    this.bindEditorEvents();
    this.bindImportEvents();
    this.bindSettingsEvents();
    if (typeof this.bindReminderEvents === 'function') this.bindReminderEvents();
    if (typeof this.bindDelightEvents === 'function') this.bindDelightEvents();
  };
})();
/* ============ 设置模块结束 ============ */