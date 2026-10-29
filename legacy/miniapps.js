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

  /* ---------------- 专注番茄钟 ---------------- */
  var focusTotal = 25 * 60;
  var focusLeft = 25 * 60;
  var focusTimer = null;
  var focusRunning = false;
  function formatFocus(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
  function renderFocus() {
    var time = $('#focusTime');
    var label = $('#focusLabel');
    var ring = $('#focusRing');
    if (time) time.textContent = formatFocus(focusLeft);
    if (label) label.textContent = focusRunning ? '专注中 · 猫猫陪你' : focusLeft === focusTotal ? '准备开始' : '已暂停';
    if (ring) {
      var p = focusTotal ? (1 - focusLeft / focusTotal) * 100 : 0;
      ring.style.setProperty('--focus-p', p.toFixed(1) + '%');
    }
    var start = $('#btnFocusStart');
    if (start) start.textContent = focusRunning ? '暂停' : focusLeft === focusTotal ? '开始专注' : '继续';
    H.$$('.focus-mode').forEach(function (btn) {
      btn.classList.toggle('is-on', Number(btn.dataset.focusMin) * 60 === focusTotal);
    });
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
      renderFocus();
      return;
    }
    focusRunning = true;
    focusTimer = setInterval(function () {
      focusLeft -= 1;
      if (focusLeft <= 0) {
        focusLeft = 0;
        stopFocus();
        renderFocus();
        focusBeep();
        UI.toast('专注完成！休息一下再继续 ☕');
      } else {
        renderFocus();
      }
    }, 1000);
    renderFocus();
  }
  function resetFocus() {
    stopFocus();
    focusLeft = focusTotal;
    renderFocus();
  }
  function bindFocusEvents() {
    var start = $('#btnFocusStart');
    if (start) start.addEventListener('click', toggleFocus);
    var reset = $('#btnFocusReset');
    if (reset) reset.addEventListener('click', resetFocus);
    H.$$('.focus-mode').forEach(function (btn) {
      btn.addEventListener('click', function () {
        stopFocus();
        focusTotal = Number(btn.dataset.focusMin) * 60;
        focusLeft = focusTotal;
        renderFocus();
      });
    });
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