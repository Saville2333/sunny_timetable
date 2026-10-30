/* ============================================================
 * 太阳币 / 太阳小铺
 * ============================================================ */
(function () {
  'use strict';

  var App = window.App;
  var Store = window.AppStore;
  var UI = window.AppUI;
  var H = window.AppHelpers;
  var $ = H.$;
  var esc = H.esc;
  var COIN_KEY = 'wusi_sun_coins_v1';
  var OWNED_KEY = 'wusi_sun_shop_owned_v1';
  var GOODS = [{
    id: 'cat-pin',
    icon: '🐈‍⬛',
    name: '猫猫挂件',
    price: 20,
    desc: '把猫猫别在课表上'
  }, {
    id: 'sun-badge',
    icon: '☀️',
    name: '太阳徽章',
    price: 35,
    desc: '太阳神认证'
  }, {
    id: 'star-cape',
    icon: '🌟',
    name: '星星披风',
    price: 60,
    desc: '专注时闪闪发光'
  }, {
    id: 'error-frame',
    icon: '⚠️',
    name: '错误文档头像框',
    price: 80,
    desc: '错误也是一种风格'
  }, {
    id: 'coffee',
    icon: '☕',
    name: '猫猫咖啡',
    price: 15,
    desc: '休息时来一杯'
  }];
  function getCoins() {
    var n = Number(Store.read(COIN_KEY));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }
  function setCoins(n) {
    var value = Math.max(0, Math.floor(Number(n) || 0));
    Store.write(COIN_KEY, value);
    return value;
  }
  function getOwned() {
    var raw = Store.read(OWNED_KEY);
    return Array.isArray(raw) ? raw.filter(function (id) {
      return GOODS.some(function (g) {
        return g.id === id;
      });
    }) : [];
  }
  function setOwned(list) {
    Store.write(OWNED_KEY, list);
    return list;
  }
  App.getSunCoins = getCoins;
  App.addSunCoins = function (amount, reason) {
    var value = Math.max(0, Math.floor(Number(amount) || 0));
    if (!value) return getCoins();
    var coins = setCoins(getCoins() + value);
    var focusCoins = $('#focusCoins');
    if (focusCoins) focusCoins.textContent = String(coins);
    var shopCoins = $('#shopCoins');
    if (shopCoins) shopCoins.textContent = String(coins);
    if (reason) UI.toast('☀️ +' + value + ' 太阳币 · ' + reason);
    renderShop();
    return coins;
  };
  App.spendSunCoins = function (amount) {
    var value = Math.max(0, Math.floor(Number(amount) || 0));
    if (getCoins() < value) return false;
    var coins = setCoins(getCoins() - value);
    var focusCoins = $('#focusCoins');
    if (focusCoins) focusCoins.textContent = String(coins);
    var shopCoins = $('#shopCoins');
    if (shopCoins) shopCoins.textContent = String(coins);
    return true;
  };
  App.updateCoinDisplays = function () {
    var coins = getCoins();
    var focusCoins = $('#focusCoins');
    if (focusCoins) focusCoins.textContent = String(coins);
    var shopCoins = $('#shopCoins');
    if (shopCoins) shopCoins.textContent = String(coins);
  };
  function renderShop() {
    var box = $('#shopItems');
    if (!box) return;
    var coins = getCoins();
    var owned = getOwned();
    box.innerHTML = GOODS.map(function (g) {
      var has = owned.indexOf(g.id) >= 0;
      return '<div class="shop-item' + (has ? ' is-owned' : '') + '">' + '<div class="si-icon">' + g.icon + '</div>' + '<div class="si-main"><b>' + esc(g.name) + '</b><small>' + esc(g.desc) + '</small></div>' + '<div class="si-price">☀️ ' + g.price + '</div>' + (has ? '<button class="btn ghost mini-btn" type="button" disabled>已拥有</button>' : '<button class="btn primary mini-btn" type="button" data-buy="' + g.id + '"' + (coins < g.price ? ' disabled' : '') + '>兑换</button>') + '</div>';
    }).join('');
    var ownedBox = $('#shopOwned');
    if (ownedBox) {
      ownedBox.innerHTML = owned.length ? '已收藏：' + owned.map(function (id) {
        var g = GOODS.filter(function (x) {
          return x.id === id;
        })[0];
        return g ? g.icon + ' ' + g.name : '';
      }).join(' · ') : '还没有兑换商品';
    }
    App.updateCoinDisplays();
  }
  function buy(id) {
    var g = GOODS.filter(function (x) {
      return x.id === id;
    })[0];
    if (!g) return;
    var owned = getOwned();
    if (owned.indexOf(id) >= 0) {
      UI.toast('已经拥有了');
      return;
    }
    if (!App.spendSunCoins(g.price)) {
      UI.toast('太阳币不够，去专注赚一点吧 ☀️');
      return;
    }
    owned.push(id);
    setOwned(owned);
    renderShop();
    UI.toast('兑换成功：' + g.icon + ' ' + g.name);
  }
  App.enterShopApp = function () {
    renderShop();
  };
  App.getSunOwned = getOwned;
  function bind() {
    var box = $('#shopItems');
    if (box) {
      box.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-buy]');
        if (btn) buy(btn.dataset.buy);
      });
    }
    var focusShop = $('#btnFocusShop');
    if (focusShop) {
      focusShop.addEventListener('click', function () {
        App.openMiniApp('shop');
      });
    }
    App.updateCoinDisplays();
  }
  var origBind = App.bindEvents;
  App.bindEvents = function () {
    origBind.apply(this, arguments);
    bind();
  };
  if (document.readyState !== 'loading') bind();else document.addEventListener('DOMContentLoaded', bind);
})();