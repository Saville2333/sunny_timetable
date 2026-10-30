function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
/* ============================================================
 * GPA 计算器小程序
 * ============================================================ */
(function () {
  'use strict';

  var App = window.App;
  var Store = window.AppStore;
  var UI = window.AppUI;
  var H = window.AppHelpers;
  var $ = H.$;
  var esc = H.esc;
  var KEY = 'wusi_gpa_courses_v1';
  var rows = [];
  var saveTimer = null;
  function load() {
    var raw = Store.read(KEY);
    rows = Array.isArray(raw) ? raw.filter(function (r) {
      return r && _typeof(r) === 'object';
    }).map(function (r) {
      return {
        name: String(r.name || '').slice(0, 24),
        credit: Number(r.credit) || 0,
        score: r.score === '' || r.score === null || r.score === undefined ? '' : Number(r.score)
      };
    }) : [];
    if (!rows.length) rows = [{
      name: '',
      credit: 2,
      score: ''
    }, {
      name: '',
      credit: 2,
      score: ''
    }, {
      name: '',
      credit: 2,
      score: ''
    }];
  }
  function gradePoint(score) {
    var s = Number(score);
    if (!isFinite(s) || s < 60) return 0;
    if (s >= 90) return 4.0;
    if (s >= 85) return 3.7;
    if (s >= 82) return 3.3;
    if (s >= 78) return 3.0;
    if (s >= 75) return 2.7;
    if (s >= 72) return 2.3;
    if (s >= 68) return 2.0;
    if (s >= 64) return 1.5;
    return 1.0;
  }
  function save() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      Store.write(KEY, rows);
    }, 300);
  }
  function render() {
    var box = $('#gpaRows');
    if (!box) return;
    box.innerHTML = rows.map(function (row, index) {
      return '<div class="gpa-row">' + '<input class="input" type="text" maxlength="24" data-gpa-name="' + index + '" value="' + esc(row.name) + '" placeholder="课程名" />' + '<input class="input compact" type="number" min="0" max="20" step="0.5" data-gpa-credit="' + index + '" value="' + (row.credit || '') + '" placeholder="学分" />' + '<input class="input compact" type="number" min="0" max="100" data-gpa-score="' + index + '" value="' + (row.score === '' ? '' : row.score) + '" placeholder="成绩" />' + '<button class="todo-del" type="button" data-gpa-del="' + index + '" aria-label="删除">🗑</button>' + '</div>';
    }).join('');
    calculate();
  }
  function calculate() {
    var box = $('#gpaSummary');
    if (!box) return;
    var credits = 0;
    var points = 0;
    var scoreSum = 0;
    var scoredCredits = 0;
    rows.forEach(function (row) {
      var c = Number(row.credit);
      var s = Number(row.score);
      if (!isFinite(c) || c <= 0 || row.score === '' || !isFinite(s)) return;
      credits += c;
      points += c * gradePoint(s);
      scoreSum += c * s;
      scoredCredits += c;
    });
    if (!credits) {
      box.innerHTML = '<span class="gs-main">还没有成绩</span><span class="gs-sub">添加课程后自动计算加权 GPA</span>';
      return;
    }
    var gpa = points / credits;
    var avg = scoreSum / scoredCredits;
    box.innerHTML = '<span class="gs-main">GPA ' + gpa.toFixed(2) + '</span>' + '<span class="gs-sub">加权平均 ' + avg.toFixed(1) + ' 分 · ' + credits.toFixed(1) + ' 学分</span>';
  }
  function addRow() {
    rows.push({
      name: '',
      credit: 2,
      score: ''
    });
    save();
    render();
    var inputs = $$('[data-gpa-name]');
    var last = inputs[inputs.length - 1];
    if (last) last.focus();
  }
  function $$(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  }
  function bind() {
    load();
    var add = $('#btnAddGpaRow');
    if (add) add.addEventListener('click', addRow);
    var box = $('#gpaRows');
    if (box) {
      box.addEventListener('input', function (e) {
        var idx = e.target.dataset.gpaName !== undefined ? Number(e.target.dataset.gpaName) : e.target.dataset.gpaCredit !== undefined ? Number(e.target.dataset.gpaCredit) : e.target.dataset.gpaScore !== undefined ? Number(e.target.dataset.gpaScore) : -1;
        if (idx < 0 || !rows[idx]) return;
        if (e.target.dataset.gpaName !== undefined) rows[idx].name = e.target.value;
        if (e.target.dataset.gpaCredit !== undefined) rows[idx].credit = Number(e.target.value) || 0;
        if (e.target.dataset.gpaScore !== undefined) rows[idx].score = e.target.value === '' ? '' : Number(e.target.value);
        save();
        calculate();
      });
      box.addEventListener('click', function (e) {
        var del = e.target.closest('[data-gpa-del]');
        if (!del) return;
        rows.splice(Number(del.dataset.gpaDel), 1);
        if (!rows.length) rows.push({
          name: '',
          credit: 2,
          score: ''
        });
        save();
        render();
      });
    }
  }
  App.enterGpaApp = function () {
    if (!rows.length) load();
    render();
  };
  var origBind = App.bindEvents;
  App.bindEvents = function () {
    origBind.apply(this, arguments);
    bind();
  };
  if (document.readyState !== 'loading') bind();else document.addEventListener('DOMContentLoaded', bind);
})();