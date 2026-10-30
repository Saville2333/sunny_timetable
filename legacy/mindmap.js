function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
/* ============================================================
 * 思维导图小程序
 * ============================================================ */
(function () {
  'use strict';

  var App = window.App;
  var Store = window.AppStore;
  var UI = window.AppUI;
  var H = window.AppHelpers;
  var $ = H.$;
  var esc = H.esc;
  var KEY = 'wusi_mindmap_v1';
  var map = null;
  function uid() {
    return 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  }
  function load() {
    var raw = Store.read(KEY);
    map = raw && _typeof(raw) === 'object' ? {
      topic: String(raw.topic || '我的思维导图').slice(0, 30),
      branches: Array.isArray(raw.branches) ? raw.branches.filter(function (b) {
        return b && _typeof(b) === 'object';
      }).map(function (b) {
        return {
          id: String(b.id || uid()),
          text: String(b.text || '新分支').slice(0, 40),
          children: Array.isArray(b.children) ? b.children.map(function (c) {
            return {
              id: String(c.id || uid()),
              text: String(c.text || '子节点').slice(0, 50)
            };
          }) : []
        };
      }) : []
    } : {
      topic: '我的思维导图',
      branches: []
    };
  }
  function save() {
    if (map) Store.write(KEY, map);
  }
  function render() {
    if (!map) load();
    var topic = $('#mindTopic');
    if (topic) topic.value = map.topic;
    var box = $('#mindCanvas');
    if (!box) return;
    if (!map.branches.length) {
      box.innerHTML = '<div class="mind-empty">点「＋ 分支」开始画一张思维导图 🧠</div>';
      return;
    }
    box.innerHTML = '<div class="mind-center">' + esc(map.topic) + '</div>' + '<div class="mind-branches">' + map.branches.map(function (b) {
      return '<div class="mind-branch" data-branch="' + esc(b.id) + '">' + '<div class="mind-branch-head">' + '<input class="input mind-input" type="text" maxlength="40" data-mind-branch-text="' + esc(b.id) + '" value="' + esc(b.text) + '" />' + '<button class="mind-mini" type="button" data-mind-add-child="' + esc(b.id) + '" title="添加子节点">＋</button>' + '<button class="mind-del" type="button" data-mind-del="' + esc(b.id) + '" title="删除分支">🗑</button>' + '</div>' + (b.children.length ? '<div class="mind-children">' + b.children.map(function (c) {
        return '<div class="mind-child">' + '<input class="input mind-input" type="text" maxlength="50" data-mind-child-text="' + esc(b.id) + '|' + esc(c.id) + '" value="' + esc(c.text) + '" />' + '<button class="mind-del" type="button" data-mind-del-child="' + esc(b.id) + '|' + esc(c.id) + '" title="删除子节点">✕</button>' + '</div>';
      }).join('') + '</div>' : '') + '</div>';
    }).join('') + '</div>';
  }
  function addBranch() {
    if (!map) load();
    map.branches.push({
      id: uid(),
      text: '新分支',
      children: []
    });
    save();
    render();
    var inputs = document.querySelectorAll('[data-mind-branch-text]');
    var last = inputs[inputs.length - 1];
    if (last) {
      last.focus();
      last.select();
    }
  }
  function bind() {
    load();
    var add = $('#btnMindAdd');
    if (add) add.addEventListener('click', addBranch);
    var saveBtn = $('#btnMindSave');
    if (saveBtn) saveBtn.addEventListener('click', function () {
      var topic = $('#mindTopic');
      if (topic) map.topic = topic.value.trim().slice(0, 30) || '我的思维导图';
      save();
      render();
      UI.toast('思维导图已保存 🧠');
    });
    var topic = $('#mindTopic');
    if (topic) topic.addEventListener('input', function () {
      map.topic = topic.value.slice(0, 30);
      save();
    });
    var box = $('#mindCanvas');
    if (box) {
      box.addEventListener('input', function (e) {
        var branchText = e.target.closest('[data-mind-branch-text]');
        if (branchText) {
          var b = map.branches.filter(function (x) {
            return x.id === branchText.dataset.mindBranchText;
          })[0];
          if (b) {
            b.text = branchText.value.slice(0, 40);
            save();
          }
          return;
        }
        var childText = e.target.closest('[data-mind-child-text]');
        if (childText) {
          var parts = childText.dataset.mindChildText.split('|');
          var _b = map.branches.filter(function (x) {
            return x.id === parts[0];
          })[0];
          var c = _b && _b.children.filter(function (x) {
            return x.id === parts[1];
          })[0];
          if (c) {
            c.text = childText.value.slice(0, 50);
            save();
          }
        }
      });
      box.addEventListener('click', function (e) {
        var addChild = e.target.closest('[data-mind-add-child]');
        if (addChild) {
          var b = map.branches.filter(function (x) {
            return x.id === addChild.dataset.mindAddChild;
          })[0];
          if (b) {
            b.children.push({
              id: uid(),
              text: '新子节点'
            });
            save();
            render();
            var inputs = document.querySelectorAll('[data-mind-child-text]');
            var last = inputs[inputs.length - 1];
            if (last) {
              last.focus();
              last.select();
            }
          }
          return;
        }
        var del = e.target.closest('[data-mind-del]');
        if (del) {
          map.branches = map.branches.filter(function (x) {
            return x.id !== del.dataset.mindDel;
          });
          save();
          render();
          return;
        }
        var delChild = e.target.closest('[data-mind-del-child]');
        if (delChild) {
          var parts = delChild.dataset.mindDelChild.split('|');
          var _b2 = map.branches.filter(function (x) {
            return x.id === parts[0];
          })[0];
          if (_b2) {
            _b2.children = _b2.children.filter(function (x) {
              return x.id !== parts[1];
            });
            save();
            render();
          }
        }
      });
    }
  }
  App.enterMindmapApp = function () {
    render();
  };
  var origBind = App.bindEvents;
  App.bindEvents = function () {
    origBind.apply(this, arguments);
    bind();
  };
  if (document.readyState !== 'loading') bind();else document.addEventListener('DOMContentLoaded', bind);
})();