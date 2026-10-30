function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
/* ============================================================
 * 太阳神小程序合集：吃什么 / 课程笔记 / 番茄钟 / 随机决定
 * ============================================================ */
(function () {
  'use strict';

  var Store = window.AppStore;
  var App = window.App;
  var UI = window.AppUI;
  var H = window.AppHelpers;
  var $ = H.$;
  var esc = H.esc;
  var NOTE_KEY = 'wusi_course_notes_v1';
  var RANDOM_KEY = 'wusi_random_options_v1';
  var NOTE_COLORS = ['#4a3000', '#b96b00', '#f0a30a', '#d64545', '#2e8b57', '#2c6bed', '#7b4bb7', '#6b7280'];
  var notes = [];
  var activeNoteId = '';
  var noteSaveTimer = null;
  var savedRange = null;

  /* ---------------- 小程序切换 ---------------- */
  App.enterAppsTab = function () {
    var grid = $('#appsGrid');
    if (grid) grid.hidden = false;
    H.$$('.mini-panel').forEach(function (panel) {
      panel.hidden = true;
    });
    this.state.miniApp = '';
    if (typeof this.renderApps === 'function') this.renderApps();
  };
  App.openMiniApp = function (name) {
    var grid = $('#appsGrid');
    if (grid) grid.hidden = true;
    H.$$('.mini-panel').forEach(function (panel) {
      panel.hidden = true;
    });
    var panel = document.getElementById('mini' + name.charAt(0).toUpperCase() + name.slice(1));
    if (panel) panel.hidden = false;
    this.state.miniApp = name;
    if (name === 'food' && typeof this.enterFoodTab === 'function') this.enterFoodTab();
    if (name === 'notes') this.enterNotesApp();
    if (name === 'focus') this.renderFocus();
    if (name === 'random') this.enterRandomApp();
    if (name === 'gpa' && typeof this.enterGpaApp === 'function') this.enterGpaApp();
    if (name === 'shop' && typeof this.enterShopApp === 'function') this.enterShopApp();
    if (name === 'savings' && typeof this.enterSavingsApp === 'function') this.enterSavingsApp();
    if (name === 'mindmap' && typeof this.enterMindmapApp === 'function') this.enterMindmapApp();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  App.closeMiniApp = function () {
    var grid = $('#appsGrid');
    if (grid) grid.hidden = false;
    H.$$('.mini-panel').forEach(function (panel) {
      panel.hidden = true;
    });
    this.state.miniApp = '';
  };
  function bindAppsEvents() {
    var grid = $('#appsGrid');
    if (grid) {
      grid.addEventListener('click', function (e) {
        var card = e.target.closest('[data-app]');
        if (card) App.openMiniApp(card.dataset.app);
      });
    }
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-app-back]')) {
        App.closeMiniApp();
      }
    });
  }

  /* ---------------- 课程笔记 ---------------- */
  function loadNotes() {
    var raw = Store.read(NOTE_KEY);
    notes = Array.isArray(raw) ? raw.filter(function (n) {
      return n && _typeof(n) === 'object' && typeof n.id === 'string';
    }).map(function (n) {
      return {
        id: n.id,
        title: String(n.title || '未命名笔记').slice(0, 30),
        course: String(n.course || '').slice(0, 40),
        html: String(n.html || ''),
        updatedAt: Number(n.updatedAt) || Date.now()
      };
    }) : [];
  }
  function saveNotes() {
    return Store.write(NOTE_KEY, notes).then(function (ok) {
      if (!ok) UI.toast('笔记保存失败，可能是本地空间不足 ⚠️');
      return ok;
    });
  }
  function activeNote() {
    return notes.filter(function (n) {
      return n.id === activeNoteId;
    })[0] || null;
  }
  function noteTitle(note) {
    return note.title || '未命名笔记';
  }
  function renderNoteCourseSelect() {
    var select = $('#noteCourse');
    if (!select) return;
    var current = select.value || (activeNote() ? activeNote().course : '');
    var names = [];
    (Store.courses || []).forEach(function (c) {
      if (c.name && names.indexOf(c.name) < 0) names.push(c.name);
    });
    select.innerHTML = '<option value="">不关联课程</option>' + names.map(function (name) {
      return '<option value="' + esc(name) + '">' + esc(name) + '</option>';
    }).join('');
    select.value = names.indexOf(current) >= 0 ? current : '';
  }
  function renderNoteList() {
    var box = $('#noteList');
    if (!box) return;
    var sorted = notes.slice().sort(function (a, b) {
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
    if (!sorted.length) {
      box.innerHTML = '<div class="notes-empty">还没有笔记，点「＋ 新笔记」开始 ฅ^•ﻌ•^ฅ</div>';
      return;
    }
    box.innerHTML = sorted.map(function (n) {
      return '<div class="note-item' + (n.id === activeNoteId ? ' is-on' : '') + '" role="button" tabindex="0" data-note-id="' + esc(n.id) + '">' + '<span class="ni-title">' + esc(noteTitle(n)) + '</span>' + '<span class="ni-meta">' + (n.course ? esc(n.course) + ' · ' : '') + formatNoteDate(n.updatedAt) + '</span>' + '<button class="note-del" type="button" data-note-del="' + esc(n.id) + '" aria-label="删除笔记">🗑</button>' + '</div>';
    }).join('');
    H.$$('.note-item', box).forEach(function (item) {
      item.addEventListener('click', function (e) {
        if (e.target.closest('[data-note-del]')) return;
        openNote(item.dataset.noteId);
      });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openNote(item.dataset.noteId);
        }
      });
    });
  }
  function formatNoteDate(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return d.getMonth() + 1 + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function newNote() {
    var note = {
      id: 'nt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      title: '未命名笔记',
      course: '',
      html: '',
      updatedAt: Date.now()
    };
    notes.push(note);
    activeNoteId = note.id;
    saveNotes();
    renderNoteList();
    renderNoteCourseSelect();
    openNote(note.id);
    var title = $('#noteTitle');
    if (title) {
      title.value = note.title;
      title.focus();
    }
  }
  function openNote(id) {
    var note = notes.filter(function (n) {
      return n.id === id;
    })[0];
    if (!note) return;
    activeNoteId = id;
    var title = $('#noteTitle');
    var editor = $('#noteEditor');
    if (title) title.value = note.title;
    if (editor) editor.innerHTML = note.html || '';
    renderNoteCourseSelect();
    renderNoteList();
    updateNoteStatus('已保存 · ' + formatNoteDate(note.updatedAt));
  }
  function deleteNote(id) {
    if (!confirm('删除这篇笔记？')) return;
    notes = notes.filter(function (n) {
      return n.id !== id;
    });
    if (activeNoteId === id) activeNoteId = notes[0] ? notes[0].id : '';
    saveNotes().then(function () {
      renderNoteList();
      if (activeNoteId) openNote(activeNoteId);else clearEditor();
      UI.toast('笔记已删除');
    });
  }
  function clearEditor() {
    var editor = $('#noteEditor');
    if (editor) editor.innerHTML = '';
    var title = $('#noteTitle');
    if (title) title.value = '';
    updateNoteStatus('自动保存在本机');
  }
  function updateNoteStatus(text) {
    var el = $('#noteStatus');
    if (el) el.textContent = text;
  }
  function collectNote() {
    var note = activeNote();
    if (!note) return null;
    var title = $('#noteTitle');
    var editor = $('#noteEditor');
    var course = $('#noteCourse');
    note.title = (title && title.value.trim() || '未命名笔记').slice(0, 30);
    note.course = course && course.value || '';
    note.html = editor ? editor.innerHTML : '';
    note.updatedAt = Date.now();
    return note;
  }
  function scheduleNoteSave() {
    updateNoteStatus('正在输入…');
    if (noteSaveTimer) clearTimeout(noteSaveTimer);
    noteSaveTimer = setTimeout(function () {
      if (!collectNote()) return;
      saveNotes().then(function (ok) {
        if (ok) {
          renderNoteList();
          updateNoteStatus('已自动保存 · ' + formatNoteDate(Date.now()));
        }
      });
    }, 650);
  }
  function saveNoteNow() {
    if (!collectNote()) return;
    saveNotes().then(function (ok) {
      if (ok) {
        renderNoteList();
        updateNoteStatus('已保存 · ' + formatNoteDate(Date.now()));
        UI.toast('笔记已保存 📝');
      }
    });
  }
  function execCommand(cmd, value) {
    var editor = $('#noteEditor');
    if (!editor) return;
    editor.focus();
    if (savedRange) {
      try {
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
      } catch (e) {/* ignore */}
    }
    try {
      document.execCommand(cmd, false, value || null);
    } catch (e) {/* ignore */}
    scheduleNoteSave();
  }
  function insertHtml(html) {
    var editor = $('#noteEditor');
    if (!editor) return;
    editor.focus();
    if (savedRange) {
      try {
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
      } catch (e) {/* ignore */}
    }
    try {
      document.execCommand('insertHTML', false, html);
    } catch (e) {
      editor.insertAdjacentHTML('beforeend', html);
    }
    savedRange = null;
    scheduleNoteSave();
  }
  function saveRange() {
    var sel = window.getSelection();
    if (sel && sel.rangeCount && $('#noteEditor') && $('#noteEditor').contains(sel.anchorNode)) {
      savedRange = sel.getRangeAt(0).cloneRange();
    }
  }
  function compressImage(file) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var max = 1100;
          var w = img.width;
          var h = img.height;
          if (w > max || h > max) {
            var scale = Math.min(max / w, max / h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        img.onerror = function () {
          resolve('');
        };
        img.src = reader.result;
      };
      reader.onerror = function () {
        resolve('');
      };
      reader.readAsDataURL(file);
    });
  }
  function insertPhotos(files) {
    var list = Array.prototype.slice.call(files || []).filter(function (f) {
      return f.type && f.type.indexOf('image/') === 0;
    }).slice(0, 4);
    if (!list.length) return;
    Promise.all(list.map(compressImage)).then(function (urls) {
      var html = urls.filter(Boolean).map(function (url) {
        return '<div class="note-photo"><img src="' + url + '" alt="课程照片" /></div>';
      }).join('');
      if (html) insertHtml(html);
      updateNoteStatus('照片已插入，正在保存…');
    });
  }
  function enterNotesApp() {
    if (!notes.length) loadNotes();
    renderNoteCourseSelect();
    renderNoteList();
    if (!activeNoteId && notes.length) activeNoteId = notes[0].id;
    if (activeNoteId) openNote(activeNoteId);else clearEditor();
  }
  function bindNotesEvents() {
    var newBtn = $('#btnNewNote');
    if (newBtn) newBtn.addEventListener('click', newNote);
    var saveBtn = $('#btnSaveNote');
    if (saveBtn) saveBtn.addEventListener('click', saveNoteNow);
    var title = $('#noteTitle');
    if (title) title.addEventListener('input', scheduleNoteSave);
    var editor = $('#noteEditor');
    if (editor) {
      editor.addEventListener('input', scheduleNoteSave);
      editor.addEventListener('blur', function () {
        if (noteSaveTimer) {
          clearTimeout(noteSaveTimer);
          noteSaveTimer = null;
          saveNoteNow();
        }
      });
      editor.addEventListener('keyup', saveRange);
      editor.addEventListener('mouseup', saveRange);
      editor.addEventListener('paste', function (e) {
        // 允许富文本，但去掉外部样式和不安全事件
        var html = (e.clipboardData || window.clipboardData).getData('text/html');
        if (!html) return;
        e.preventDefault();
        var clean = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+="[^"]*"/gi, '');
        document.execCommand('insertHTML', false, clean);
      });
    }
    var course = $('#noteCourse');
    if (course) course.addEventListener('change', scheduleNoteSave);
    H.$$('.nt-btn[data-cmd]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        execCommand(btn.dataset.cmd);
      });
    });
    var hr = $('#btnNoteHr');
    if (hr) hr.addEventListener('click', function () {
      execCommand('insertHorizontalRule');
    });
    var color = $('#noteColor');
    if (color) color.addEventListener('input', function () {
      execCommand('foreColor', color.value);
    });
    var fontSize = $('#noteFontSize');
    if (fontSize) fontSize.addEventListener('change', function () {
      execCommand('fontSize', fontSize.value);
    });
    var colors = $('#noteColors');
    if (colors) {
      colors.innerHTML = NOTE_COLORS.map(function (c) {
        return '<button type="button" class="nt-color" data-color="' + c + '" style="background:' + c + '"></button>';
      }).join('');
      colors.addEventListener('click', function (e) {
        var b = e.target.closest('[data-color]');
        if (b) execCommand('foreColor', b.dataset.color);
      });
    }
    var photo = $('#btnNotePhoto');
    var file = $('#notePhotoInput');
    if (photo && file) {
      photo.addEventListener('click', function () {
        saveRange();
        file.click();
      });
      file.addEventListener('change', function () {
        insertPhotos(file.files);
        file.value = '';
      });
    }
    var list = $('#noteList');
    if (list) {
      list.addEventListener('click', function (e) {
        var del = e.target.closest('[data-note-del]');
        if (del) {
          e.stopPropagation();
          deleteNote(del.dataset.noteDel);
        }
      });
    }
  }

  /* ---------------- 专注（番茄 / 连续 / 正计时 / 倒计时） ---------------- */
  var focusMode = 'pomodoro';
  var focusFocusSec = 25 * 60;
  var focusBreakSec = 5 * 60;
  var focusRounds = 2;
  var focusPhase = 'focus';
  var focusRound = 1;
  var focusLeft = 25 * 60;
  var focusElapsed = 0;
  var focusTimer = null;
  var focusRunning = false;
  var FOCUS_PREF_KEY = 'wusi_focus_prefs_v1';
  function loadFocusPrefs() {
    var raw = Store.read(FOCUS_PREF_KEY);
    if (!raw || _typeof(raw) !== 'object') return;
    if (raw.mode && ['pomodoro', 'continuous', 'stopwatch', 'countdown'].indexOf(raw.mode) >= 0) focusMode = raw.mode;
    if (raw.focus) focusFocusSec = Math.max(60, Number(raw.focus) * 60);
    if (raw.break) focusBreakSec = Math.max(60, Number(raw.break) * 60);
    if (raw.rounds) focusRounds = Math.max(1, Math.min(12, Number(raw.rounds)));
    var min = $('#focusMinutes');
    var br = $('#focusBreak');
    var rounds = $('#focusRounds');
    if (min) min.value = String(Math.round(focusFocusSec / 60));
    if (br) br.value = String(Math.round(focusBreakSec / 60));
    if (rounds) rounds.value = String(focusRounds);
    focusLeft = focusFocusSec;
  }
  function formatFocus(sec) {
    var s = Math.max(0, Math.floor(sec));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  }
  function readFocusInputs() {
    var min = $('#focusMinutes');
    var br = $('#focusBreak');
    var rounds = $('#focusRounds');
    focusFocusSec = Math.max(60, (Number(min && min.value) || 25) * 60);
    focusBreakSec = Math.max(60, (Number(br && br.value) || 5) * 60);
    focusRounds = Math.max(1, Math.min(12, Number(rounds && rounds.value) || 2));
    Store.write(FOCUS_PREF_KEY, {
      mode: focusMode,
      focus: Math.round(focusFocusSec / 60),
      break: Math.round(focusBreakSec / 60),
      rounds: focusRounds
    });
  }
  function focusEarnCoins(seconds, reason) {
    var minutes = Math.floor(seconds / 60);
    var coins = Math.max(1, Math.floor(minutes / 5));
    if (App.addSunCoins) App.addSunCoins(coins, reason);
  }
  function resetFocusState() {
    readFocusInputs();
    focusPhase = 'focus';
    focusRound = 1;
    focusElapsed = 0;
    focusLeft = focusMode === 'stopwatch' ? 0 : focusFocusSec;
    renderFocus();
  }
  function renderFocus() {
    var time = $('#focusTime');
    var label = $('#focusLabel');
    var sub = $('#focusSub');
    var ring = $('#focusRing');
    if (time) time.textContent = formatFocus(focusMode === 'stopwatch' ? focusElapsed : focusLeft);
    if (label) {
      if (focusRunning) label.textContent = focusPhase === 'break' ? '休息中 · 猫猫陪你' : '专注中 · 猫猫陪你';else label.textContent = focusPhase === 'break' ? '休息一下' : focusMode === 'stopwatch' && focusElapsed > 0 ? '已暂停' : '准备开始';
    }
    if (sub) {
      sub.textContent = focusMode === 'continuous' ? '第 ' + focusRound + ' / ' + focusRounds + ' 轮 · 专注 ' + Math.round(focusFocusSec / 60) + ' 分，休息 ' + Math.round(focusBreakSec / 60) + ' 分' : focusMode === 'stopwatch' ? '正计时 · 停止后按已完成时长结算太阳币' : '完成专注可以赚太阳币 ☀️';
    }
    if (ring) {
      var p = 0;
      if (focusMode === 'stopwatch') p = Math.min(100, focusElapsed / 1500 * 100);else if (focusPhase === 'break') p = 100;else if (focusFocusSec > 0) p = Math.max(0, Math.min(100, (1 - focusLeft / focusFocusSec) * 100));
      ring.style.setProperty('--focus-p', p.toFixed(1) + '%');
      ring.classList.toggle('is-break', focusPhase === 'break');
    }
    var start = $('#btnFocusStart');
    if (start) {
      start.textContent = focusRunning ? '暂停' : focusMode === 'stopwatch' && focusElapsed > 0 ? '继续' : '开始专注';
      start.classList.toggle('is-running', focusRunning);
    }
    H.$$('.focus-mode').forEach(function (btn) {
      btn.classList.toggle('is-on', btn.dataset.focusMode === focusMode);
    });
    var roundsWrap = $('#focusRoundsWrap');
    if (roundsWrap) roundsWrap.hidden = focusMode !== 'continuous';
    var cfg = $('#focusConfig');
    if (cfg) cfg.hidden = focusMode === 'stopwatch';
    if (App.updateCoinDisplays) App.updateCoinDisplays();
  }
  function focusTick() {
    if (focusMode === 'stopwatch') {
      focusElapsed += 1;
      renderFocus();
      return;
    }
    focusLeft -= 1;
    if (focusLeft <= 0) {
      if (focusPhase === 'focus') {
        focusEarnCoins(focusFocusSec, '专注完成');
        focusBeep();
        if (focusMode === 'continuous' && focusRound < focusRounds) {
          focusPhase = 'break';
          focusLeft = focusBreakSec;
          UI.toast('第 ' + focusRound + ' 轮完成，休息 ' + Math.round(focusBreakSec / 60) + ' 分钟');
          renderFocus();
          return;
        }
        stopFocus();
        focusLeft = 0;
        renderFocus();
        UI.toast(focusMode === 'continuous' ? '连续专注完成！今天也很棒 ☀️' : '专注完成！休息一下再继续 ☕');
        return;
      }
      focusPhase = 'focus';
      focusRound += 1;
      focusLeft = focusFocusSec;
      focusBeep();
      UI.toast('休息结束，开始第 ' + focusRound + ' 轮专注');
      renderFocus();
      return;
    }
    renderFocus();
  }
  function focusBeep() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      [0, 0.18].forEach(function (delay) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.22);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.24);
      });
      setTimeout(function () {
        ctx.close();
      }, 800);
    } catch (e) {/* ignore */}
  }
  function stopFocus() {
    if (focusTimer) clearInterval(focusTimer);
    focusTimer = null;
    focusRunning = false;
  }
  function toggleFocus() {
    if (focusRunning) {
      stopFocus();
      if (focusMode === 'stopwatch' && focusElapsed >= 60) {
        focusEarnCoins(focusElapsed, '正计时结算');
        focusElapsed = 0;
      }
      renderFocus();
      return;
    }
    if (focusMode === 'stopwatch') {
      if (focusElapsed === 0) focusLeft = 0;
    } else if (focusLeft <= 0) {
      resetFocusState();
    }
    focusRunning = true;
    focusTimer = setInterval(focusTick, 1000);
    renderFocus();
  }
  function resetFocus() {
    stopFocus();
    focusElapsed = 0;
    focusPhase = 'focus';
    focusRound = 1;
    readFocusInputs();
    focusLeft = focusMode === 'stopwatch' ? 0 : focusFocusSec;
    renderFocus();
  }
  function bindFocusEvents() {
    loadFocusPrefs();
    var start = $('#btnFocusStart');
    if (start) start.addEventListener('click', toggleFocus);
    var reset = $('#btnFocusReset');
    if (reset) reset.addEventListener('click', resetFocus);
    H.$$('.focus-mode').forEach(function (btn) {
      btn.addEventListener('click', function () {
        stopFocus();
        focusMode = btn.dataset.focusMode || 'pomodoro';
        focusElapsed = 0;
        readFocusInputs();
        focusLeft = focusFocusSec;
        focusPhase = 'focus';
        focusRound = 1;
        renderFocus();
      });
    });
    ['focusMinutes', 'focusBreak', 'focusRounds'].forEach(function (id) {
      var input = document.getElementById(id);
      if (input) input.addEventListener('change', function () {
        if (!focusRunning) {
          readFocusInputs();
          if (focusMode !== 'continuous') focusLeft = focusFocusSec;
          renderFocus();
        }
      });
    });
    if (App.updateCoinDisplays) App.updateCoinDisplays();
  }

  /* ---------------- 随机决定 ---------------- */
  function enterRandomApp() {
    var input = $('#randomInput');
    if (input && !input.value) {
      var raw = Store.read(RANDOM_KEY);
      if (raw && typeof raw.text === 'string') input.value = raw.text;
    }
  }
  function pickRandom() {
    var input = $('#randomInput');
    var result = $('#randomResult');
    if (!input) return;
    var list = input.value.split('\n').map(function (s) {
      return s.trim();
    }).filter(Boolean);
    if (list.length < 2) {
      UI.toast('至少写两个选项 ฅ^•ﻌ•^ฅ');
      return;
    }
    Store.write(RANDOM_KEY, {
      text: input.value
    });
    var index = Math.floor(Math.random() * list.length);
    var tries = 0;
    while (result && result.dataset.last === String(index) && tries < 4) {
      index = Math.floor(Math.random() * list.length);
      tries += 1;
    }
    if (result) {
      result.dataset.last = String(index);
      result.innerHTML = '<span class="rr-emoji">🎯</span><span class="rr-text">' + esc(list[index]) + '</span>';
      result.classList.remove('is-pop');
      void result.offsetWidth;
      result.classList.add('is-pop');
    }
  }
  function bindRandomEvents() {
    var pick = $('#btnRandomPick');
    if (pick) pick.addEventListener('click', pickRandom);
    var clear = $('#btnRandomClear');
    if (clear) clear.addEventListener('click', function () {
      var input = $('#randomInput');
      if (input) input.value = '';
      Store.write(RANDOM_KEY, {
        text: ''
      });
      var result = $('#randomResult');
      if (result) result.textContent = '命运还没有开口…';
    });
  }

  /* ---------------- 包裹原有事件绑定 ---------------- */
  App.enterNotesApp = enterNotesApp;
  App.renderFocus = renderFocus;
  App.enterRandomApp = enterRandomApp;
  var miniBound = false;
  function bindAllMini() {
    if (miniBound) return;
    miniBound = true;
    bindAppsEvents();
    bindNotesEvents();
    bindFocusEvents();
    bindRandomEvents();
    loadNotes();
  }
  var origBind = App.bindEvents;
  App.bindEvents = function () {
    origBind.apply(this, arguments);
    bindAllMini();
  };

  /* 脚本在 </body> 前加载，直接绑定一次，避免旧 WebView 的 DOMContentLoaded 顺序差异 */
  if (document.readyState !== 'loading') {
    bindAllMini();
  } else {
    document.addEventListener('DOMContentLoaded', bindAllMini);
  }
})();