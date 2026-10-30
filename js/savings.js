/* ============================================================
 * 攒钱计划小程序
 * ============================================================ */
(function () {
  'use strict';

  const App = window.App;
  const Store = window.AppStore;
  const UI = window.AppUI;
  const H = window.AppHelpers;
  const $ = H.$;
  const KEY = 'wusi_savings_plan_v1';

  let plan = null;

  function load() {
    const raw = Store.read(KEY);
    plan = raw && typeof raw === 'object' ? {
      name: String(raw.name || '我的攒钱计划').slice(0, 20),
      target: Math.max(0, Number(raw.target) || 0),
      current: Math.max(0, Number(raw.current) || 0)
    } : { name: '我的攒钱计划', target: 3000, current: 0 };
  }

  function save() {
    Store.write(KEY, plan);
  }

  function render() {
    if (!plan) load();
    const name = $('#savingsName');
    const target = $('#savingsTarget');
    const current = $('#savingsCurrent');
    if (name) name.value = plan.name;
    if (target) target.value = plan.target || '';
    if (current) current.value = plan.current || '';
    const pct = plan.target > 0 ? Math.min(100, plan.current / plan.target * 100) : 0;
    const bar = $('#savingsBar');
    if (bar) bar.style.width = pct.toFixed(1) + '%';
    const summary = $('#savingsSummary');
    if (summary) {
      summary.innerHTML = plan.target > 0
        ? '<b>¥' + plan.current.toFixed(0) + '</b> / ¥' + plan.target.toFixed(0) +
          '<span>' + pct.toFixed(0) + '% · 还差 ¥' + Math.max(0, plan.target - plan.current).toFixed(0) + '</span>'
        : '设一个目标，猫猫陪你慢慢存 🐈‍⬛';
    }
  }

  function bind() {
    load();
    render();
    ['savingsName', 'savingsTarget', 'savingsCurrent'].forEach(function (id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', function () {
        if (!plan) load();
        if (id === 'savingsName') plan.name = el.value.trim().slice(0, 20) || '我的攒钱计划';
        if (id === 'savingsTarget') plan.target = Math.max(0, Number(el.value) || 0);
        if (id === 'savingsCurrent') plan.current = Math.max(0, Number(el.value) || 0);
        save();
        render();
      });
    });
    const addBtn = $('#btnSavingsAdd');
    const addInput = $('#savingsAdd');
    if (addBtn && addInput) {
      addBtn.addEventListener('click', function () {
        const amount = Math.max(0, Number(addInput.value) || 0);
        if (!amount) { UI.toast('输入这次存多少钱'); return; }
        plan.current = Math.max(0, plan.current + amount);
        save();
        addInput.value = '';
        render();
        UI.toast('已存 ¥' + amount + ' · 离目标更近了 🐖');
      });
    }
    const reset = $('#btnSavingsReset');
    if (reset) reset.addEventListener('click', function () {
      UI.confirm({
        title: '重置攒钱计划？',
        sub: '会把已存金额清零，但保留目标金额。',
        okText: '重置',
        onOk: function () {
          plan.current = 0;
          save();
          render();
          UI.toast('已重置，重新开始攒钱吧');
        }
      });
    });
  }

  App.enterSavingsApp = function () {
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
