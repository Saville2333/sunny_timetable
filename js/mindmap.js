/* ============================================================
 * 思维导图小程序
 * ============================================================ */
(function () {
  'use strict';

  const App = window.App;
  const Store = window.AppStore;
  const UI = window.AppUI;
  const H = window.AppHelpers;
  const $ = H.$;
  const esc = H.esc;
  const KEY = 'wusi_mindmap_v1';

  let map = null;

  function uid() {
    return 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  }

  function load() {
    const raw = Store.read(KEY);
    map = raw && typeof raw === 'object' ? {
      topic: String(raw.topic || '我的思维导图').slice(0, 30),
      branches: Array.isArray(raw.branches) ? raw.branches.filter(function (b) {
        return b && typeof b === 'object';
      }).map(function (b) {
        return {
          id: String(b.id || uid()),
          text: String(b.text || '新分支').slice(0, 40),
          children: Array.isArray(b.children) ? b.children.map(function (c) {
            return { id: String(c.id || uid()), text: String(c.text || '子节点').slice(0, 50) };
          }) : []
        };
      }) : []
    } : { topic: '我的思维导图', branches: [] };
  }

  function save() {
    if (map) Store.write(KEY, map);
  }

  function render() {
    if (!map) load();
    const topic = $('#mindTopic');
    if (topic) topic.value = map.topic;
    const box = $('#mindCanvas');
    if (!box) return;
    if (!map.branches.length) {
      box.innerHTML = '<div class="mind-empty">点「＋ 分支」开始画一张思维导图 🧠</div>';
      return;
    }
    box.innerHTML = '<div class="mind-center">' + esc(map.topic) + '</div>' +
      '<div class="mind-branches">' + map.branches.map(function (b) {
        return '<div class="mind-branch" data-branch="' + esc(b.id) + '">' +
          '<div class="mind-branch-head">' +
          '<input class="input mind-input" type="text" maxlength="40" data-mind-branch-text="' + esc(b.id) + '" value="' + esc(b.text) + '" />' +
          '<button class="mind-mini" type="button" data-mind-add-child="' + esc(b.id) + '" title="添加子节点">＋</button>' +
          '<button class="mind-del" type="button" data-mind-del="' + esc(b.id) + '" title="删除分支">🗑</button>' +
          '</div>' +
          (b.children.length ? '<div class="mind-children">' + b.children.map(function (c) {
            return '<div class="mind-child">' +
              '<input class="input mind-input" type="text" maxlength="50" data-mind-child-text="' + esc(b.id) + '|' + esc(c.id) + '" value="' + esc(c.text) + '" />' +
              '<button class="mind-del" type="button" data-mind-del-child="' + esc(b.id) + '|' + esc(c.id) + '" title="删除子节点">✕</button>' +
              '</div>';
          }).join('') + '</div>' : '') +
          '</div>';
      }).join('') + '</div>';
  }

  function addBranch() {
    if (!map) load();
    map.branches.push({ id: uid(), text: '新分支', children: [] });
    save();
    render();
    const inputs = document.querySelectorAll('[data-mind-branch-text]');
    const last = inputs[inputs.length - 1];
    if (last) { last.focus(); last.select(); }
  }

  function bind() {
    load();
    const add = $('#btnMindAdd');
    if (add) add.addEventListener('click', addBranch);
    const saveBtn = $('#btnMindSave');
    if (saveBtn) saveBtn.addEventListener('click', function () {
      const topic = $('#mindTopic');
      if (topic) map.topic = topic.value.trim().slice(0, 30) || '我的思维导图';
      save();
      render();
      UI.toast('思维导图已保存 🧠');
    });
    const topic = $('#mindTopic');
    if (topic) topic.addEventListener('input', function () {
      map.topic = topic.value.slice(0, 30);
      save();
    });
    const box = $('#mindCanvas');
    if (box) {
      box.addEventListener('input', function (e) {
        const branchText = e.target.closest('[data-mind-branch-text]');
        if (branchText) {
          const b = map.branches.filter(function (x) { return x.id === branchText.dataset.mindBranchText; })[0];
          if (b) { b.text = branchText.value.slice(0, 40); save(); }
          return;
        }
        const childText = e.target.closest('[data-mind-child-text]');
        if (childText) {
          const parts = childText.dataset.mindChildText.split('|');
          const b = map.branches.filter(function (x) { return x.id === parts[0]; })[0];
          const c = b && b.children.filter(function (x) { return x.id === parts[1]; })[0];
          if (c) { c.text = childText.value.slice(0, 50); save(); }
        }
      });
      box.addEventListener('click', function (e) {
        const addChild = e.target.closest('[data-mind-add-child]');
        if (addChild) {
          const b = map.branches.filter(function (x) { return x.id === addChild.dataset.mindAddChild; })[0];
          if (b) {
            b.children.push({ id: uid(), text: '新子节点' });
            save();
            render();
            const inputs = document.querySelectorAll('[data-mind-child-text]');
            const last = inputs[inputs.length - 1];
            if (last) { last.focus(); last.select(); }
          }
          return;
        }
        const del = e.target.closest('[data-mind-del]');
        if (del) {
          map.branches = map.branches.filter(function (x) { return x.id !== del.dataset.mindDel; });
          save();
          render();
          return;
        }
        const delChild = e.target.closest('[data-mind-del-child]');
        if (delChild) {
          const parts = delChild.dataset.mindDelChild.split('|');
          const b = map.branches.filter(function (x) { return x.id === parts[0]; })[0];
          if (b) {
            b.children = b.children.filter(function (x) { return x.id !== parts[1]; });
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

  const origBind = App.bindEvents;
  App.bindEvents = function () {
    origBind.apply(this, arguments);
    bind();
  };

  if (document.readyState !== 'loading') bind();
  else document.addEventListener('DOMContentLoaded', bind);
})();
