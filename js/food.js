/* ============================================================
 * 星海课表 · 今天吃啥（幸运转盘）
 * Canvas 转盘 / 分类筛选 / 避开最近 / 自定义菜单 / 历史记录
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

  const MENU_KEY = 'wusi_food_menu_v1';
  const HISTORY_KEY = 'wusi_food_history_v1';
  const PREF_KEY = 'wusi_food_pref_v1';
  const MAX_MENU = 24;
  const MAX_HISTORY = 30;
  const MAX_WHEEL = 12;

  const WHEEL_COLORS = [
    '#ffe3b8', '#c9f1f8', '#d8f5e4', '#e7dcfb',
    '#ffd9e2', '#fff2b8', '#d3ecff', '#fbe0cd',
    '#d9f7ef', '#e9e6ff', '#ffe9f2', '#e2f0d8'
  ];

  const CAT_EMOJI = { '饭': '🍚', '面食': '🍜', '小吃': '🍢', '轻食': '🥗', '快餐': '🍔' };

  /* ---------------- 状态 ---------------- */
  App.foodMenu = [];
  App.foodHistory = [];
  App.foodPref = { cat: 'all', avoidRecent: false };
  App.wheelItems = [];
  App.wheelRotation = 0;
  App.wheelSpinning = false;
  App.foodResult = null;

  function defaultMenu() {
    return D.FOODS.map(function (item) {
      return { name: item.name, emoji: item.emoji, cat: item.cat };
    });
  }

  function normalizeMenuItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const name = U.str(raw.name, 10);
    if (!name) return null;
    const cat = D.FOOD_CATS.indexOf(raw.cat) >= 0 ? raw.cat : '饭';
    const emoji = U.str(raw.emoji, 4) || CAT_EMOJI[cat] || '🍽';
    return { name: name, emoji: emoji, cat: cat };
  }

  function histTime(ts) {
    const time = Number(ts) || Date.now();
    const d = new Date(time);
    const now = new Date();
    const key = U.dateKey(d);
    if (key === U.dateKey(now)) {
      return '今天 ' + U.pad2(d.getHours()) + ':' + U.pad2(d.getMinutes());
    }
    const yesterday = new Date(now.getTime() - 86400000);
    if (key === U.dateKey(yesterday)) return '昨天';
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  /* ---------------- 数据读写 ---------------- */
  App.loadFoodData = function () {
    /* 菜单 */
    try {
      const saved = Store.read(MENU_KEY);
      if (Array.isArray(saved) && saved.length) {
        const seen = {};
        const clean = [];
        saved.forEach(function (raw) {
          const item = normalizeMenuItem(raw);
          if (!item || seen[item.name]) return;
          seen[item.name] = true;
          clean.push(item);
        });
        this.foodMenu = clean.slice(0, MAX_MENU);
      } else {
        this.foodMenu = defaultMenu();
      }
    } catch (e) {
      console.warn('[Food] 菜单读取失败，使用默认菜单', e);
      this.foodMenu = defaultMenu();
    }
    if (!this.foodMenu.length) this.foodMenu = defaultMenu();

    /* 历史 */
    try {
      const savedHistory = Store.read(HISTORY_KEY);
      if (Array.isArray(savedHistory)) {
        this.foodHistory = savedHistory.map(function (raw) {
          if (!raw || typeof raw !== 'object') return null;
          const name = U.str(raw.name, 10);
          if (!name) return null;
          return {
            name: name,
            emoji: U.str(raw.emoji, 4) || '🍽',
            at: Number(raw.at) || Date.now()
          };
        }).filter(Boolean).slice(0, MAX_HISTORY);
      } else {
        this.foodHistory = [];
      }
    } catch (e) {
      console.warn('[Food] 历史读取失败', e);
      this.foodHistory = [];
    }

    /* 偏好 */
    this.foodPref = { cat: 'all', avoidRecent: false };
    try {
      const pref = Store.read(PREF_KEY);
      if (pref && typeof pref === 'object') {
        if (pref.cat === 'all' || D.FOOD_CATS.indexOf(pref.cat) >= 0) {
          this.foodPref.cat = pref.cat;
        }
        this.foodPref.avoidRecent = !!pref.avoidRecent;
      }
    } catch (e) {
      console.warn('[Food] 偏好读取失败', e);
    }
  };

  App.saveFoodMenu = function () {
    const result = Store.write(MENU_KEY, this.foodMenu);
    if (result && typeof result.catch === 'function') {
      result.catch(function (err) {
        console.warn('[Food] 菜单保存失败', err);
      });
    }
  };

  App.saveFoodHistory = function () {
    const result = Store.write(HISTORY_KEY, this.foodHistory);
    if (result && typeof result.catch === 'function') {
      result.catch(function (err) {
        console.warn('[Food] 历史保存失败', err);
      });
    }
  };

  App.saveFoodPref = function () {
    const result = Store.write(PREF_KEY, this.foodPref);
    if (result && typeof result.catch === 'function') {
      result.catch(function (err) {
        console.warn('[Food] 偏好保存失败', err);
      });
    }
  };

  /* ---------------- 候选计算 ---------------- */
  App.buildWheelItems = function () {
    let list = this.foodMenu.slice();

    if (this.foodPref.cat && this.foodPref.cat !== 'all') {
      list = list.filter(function (item) {
        return item.cat === App.foodPref.cat;
      });
    }

    if (this.foodPref.avoidRecent) {
      const recent = this.foodHistory.slice(0, 3).map(function (item) {
        return item.name;
      });
      const filtered = list.filter(function (item) {
        return recent.indexOf(item.name) < 0;
      });
      if (filtered.length >= 2) list = filtered;
    }

    if (list.length > MAX_WHEEL) {
      list = list.slice().sort(function () {
        return Math.random() - 0.5;
      }).slice(0, MAX_WHEEL);
    }
    return list;
  };

  /* 切换 Tab 或筛选后刷新转盘 */
  App.refreshWheel = function () {
    this.wheelItems = this.buildWheelItems();
    this.renderFood();
    this.renderResult(this.foodResult);
    this.drawWheel();
  };

  App.enterFoodTab = function () {
    if (!this.foodMenu || !this.foodMenu.length) this.loadFoodData();
    if (!this.wheelItems || !this.wheelItems.length) {
      this.wheelItems = this.buildWheelItems();
    }
    this.renderFood();
    const self = this;
    requestAnimationFrame(function () {
      self.drawWheel();
    });
    setTimeout(function () {
      self.drawWheel();
    }, 140);
  };

  /* ---------------- 页面渲染 ---------------- */
  App.renderFood = function () {
    const self = this;

    /* 分类筛选 */
    const filterBox = $('#foodFilters');
    if (filterBox) {
      const cats = [{ key: 'all', label: '全部' }].concat(D.FOOD_CATS.map(function (cat) {
        return { key: cat, label: cat };
      }));
      filterBox.innerHTML = cats.map(function (cat) {
        const on = self.foodPref.cat === cat.key ? ' is-on' : '';
        return '<button class="food-chip' + on + '" type="button" data-cat="' + cat.key + '">' +
          cat.label + '</button>';
      }).join('');
    }

    const avoid = $('#foodAvoidRecent');
    if (avoid) avoid.checked = !!this.foodPref.avoidRecent;

    this.renderHistory();
    if (this.foodResult) this.renderResult(this.foodResult);
  };

  App.renderHistory = function () {
    const list = $('#foodHistoryList');
    if (!list) return;
    if (!this.foodHistory.length) {
      list.innerHTML = '<div class="food-empty">还没有记录，转一次试试吧 🎡</div>';
      return;
    }
    list.innerHTML = this.foodHistory.slice(0, 6).map(function (item) {
      return '<div class="hist-item">' +
        '<span class="hist-emoji">' + esc(item.emoji) + '</span>' +
        '<span class="hist-name">' + esc(item.name) + '</span>' +
        '<span class="hist-time">' + esc(histTime(item.at)) + '</span>' +
        '</div>';
    }).join('');
  };

  App.renderResult = function (item) {
    const box = $('#wheelResult');
    if (!box) return;
    if (!item) {
      box.classList.remove('is-win');
      box.innerHTML =
        '<div class="wr-label">准备好了吗</div>' +
        '<div class="wr-name">点下面的按钮开转 🍚</div>' +
        '<div class="wr-cat">命运正在召唤</div>';
      return;
    }
    box.innerHTML =
      '<div class="wr-label">今天就吃</div>' +
      '<div class="wr-name">' + esc(item.emoji + ' ' + item.name) + '</div>' +
      '<div class="wr-cat">' + esc(item.cat) + ' · 已记入最近吃过</div>';
    box.classList.remove('is-win');
    /* 触发重排，让结果弹跳动画重新播放 */
    void box.offsetWidth;
    box.classList.add('is-win');
  };

  App.recordFoodHistory = function (item) {
    if (!item) return;
    this.foodHistory.unshift({ name: item.name, emoji: item.emoji, at: Date.now() });
    this.foodHistory = this.foodHistory.slice(0, MAX_HISTORY);
    this.saveFoodHistory();
    this.renderHistory();
  };

  /* ---------------- Canvas 转盘绘制（适配 Retina） ---------------- */
  App.drawWheel = function () {
    const canvas = $('#foodWheel');
    if (!canvas) return;
    const stage = canvas.parentElement;
    const stageWidth = stage ? stage.clientWidth : 0;
    /* 视图隐藏时宽度为 0，等切到「吃啥」再绘制 */
    if (!stageWidth) return;

    const size = Math.max(220, Math.min(stageWidth - 6, 330));
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const px = Math.round(size * dpr);
    if (canvas.width !== px || canvas.height !== px) {
      canvas.width = px;
      canvas.height = px;
    }
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 9;
    const items = this.wheelItems || [];
    const fontFamily = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';

    if (!items.length) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f2f9fb';
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#8aa9b0';
      ctx.font = '600 13px ' + fontFamily;
      ctx.fillText('菜单空空如也', cx, cy - 9);
      ctx.font = '500 11px ' + fontFamily;
      ctx.fillText('点「菜单」补充几个吧', cx, cy + 13);
      return;
    }

    const seg = (Math.PI * 2) / items.length;

    /* 扇形底色 */
    items.forEach(function (item, index) {
      const a0 = App.wheelRotation + index * seg;
      const a1 = a0 + seg;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, a0, a1);
      ctx.closePath();
      ctx.fillStyle = WHEEL_COLORS[index % WHEEL_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    /* 扇形文字：沿半径方向排布，按扇区弦宽自动截断，避免文字越过分隔线 */
    const fontSize = Math.max(10, Math.round(size * 0.037));
    const textRadius = radius - 12;
    const maxLabelWidth = Math.max(42, 2 * textRadius * Math.tan(seg / 2) - 10);
    items.forEach(function (item, index) {
      const mid = App.wheelRotation + index * seg + seg / 2;
      let text = item.emoji + ' ' + item.name;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(mid);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = '700 ' + fontSize + 'px ' + fontFamily;
      if (ctx.measureText(text).width > maxLabelWidth) {
        /* 使用 Array.from 保证不会把 emoji 的代理对截成半个字符 */
        const chars = Array.from(text);
        while (chars.length > 1 && ctx.measureText(chars.join('') + '…').width > maxLabelWidth) {
          chars.pop();
        }
        text = chars.join('') + '…';
      }
      ctx.fillStyle = '#12414c';
      ctx.fillText(text, textRadius, 0);
      ctx.restore();
    });

    /* 外圈与中心底盘 */
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    ctx.fill();

    if (!this.wheelSpinning) {
      const btn = $('#btnSpinWheel');
      if (btn) btn.textContent = this.foodResult ? '🎯 再转一次' : '🎯 开始转动';
    }
  };

  /* ---------------- 旋转与结果 ---------------- */
  App.spinWheel = function () {
    if (this.wheelSpinning) return;

    /* 开启「避开最近吃过」时，每次开转前按最新历史重建候选，连续转动也不会重复 */
    if (this.foodPref.avoidRecent) {
      const refreshed = this.buildWheelItems();
      if (refreshed.length >= 2) this.wheelItems = refreshed;
    } else if (!this.wheelItems || !this.wheelItems.length) {
      /* 未开启时保持转盘选项稳定，只有为空时才重新生成 */
      this.wheelItems = this.buildWheelItems();
    }

    if (!this.wheelItems.length) {
      UI.toast('这个分类下还没有菜，先去菜单加点吧 🍽');
      this.drawWheel();
      return;
    }
    if (this.wheelItems.length < 2) {
      UI.toast('至少要有 2 个选项才好转，再补一道菜吧');
      this.drawWheel();
      return;
    }

    this.wheelSpinning = true;
    this.foodResult = null;
    this.renderResult(null);

    const btn = $('#btnSpinWheel');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '转动中…';
    }
    const centerBtn = $('#wheelCenterBtn');
    if (centerBtn) centerBtn.textContent = '…';

    const startRot = this.wheelRotation;
    const turns = 4 + Math.random() * 2;
    const target = startRot + turns * Math.PI * 2 + Math.random() * Math.PI * 2;
    const duration = 4200;
    const startedAt = (window.performance && performance.now) ? performance.now() : Date.now();
    const self = this;

    function ease(p) {
      return 1 - Math.pow(1 - p, 3.2);
    }

    function step(nowTs) {
      const p = Math.min(1, Math.max(0, (nowTs - startedAt) / duration));
      self.wheelRotation = startRot + (target - startRot) * ease(p);
      self.drawWheel();
      if (p < 1) {
        requestAnimationFrame(step);
        return;
      }
      self.wheelRotation = target % (Math.PI * 2);
      self.drawWheel();
      self.finishSpin();
    }

    requestAnimationFrame(step);
  };

  App.finishSpin = function () {
    const items = this.wheelItems;
    this.wheelSpinning = false;

    const btn = $('#btnSpinWheel');
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🎯 再转一次';
    }
    const centerBtn = $('#wheelCenterBtn');
    if (centerBtn) centerBtn.textContent = '转';

    if (!items || !items.length) return;

    const seg = (Math.PI * 2) / items.length;
    let angle = (-Math.PI / 2 - this.wheelRotation) % (Math.PI * 2);
    if (angle < 0) angle += Math.PI * 2;
    const index = Math.floor(angle / seg) % items.length;
    const item = items[index];

    this.foodResult = item;
    this.renderResult(item);
    this.recordFoodHistory(item);
    if (typeof this.playChime === 'function') this.playChime();
    if (typeof this.vibrate === 'function') this.vibrate([16, 50, 16]);
    UI.toast('就吃「' + item.name + '」🍽');
  };

  /* ---------------- 菜单管理 ---------------- */
  App.showFoodMenu = function () {
    const items = this.foodMenu;
    const rows = items.map(function (item) {
      return '<div class="fm-item">' +
        '<span class="fm-emoji">' + esc(item.emoji) + '</span>' +
        '<span class="fm-name">' + esc(item.name) + '</span>' +
        '<span class="fm-cat">' + esc(item.cat) + '</span>' +
        '<button type="button" class="fm-del" data-action="food-del" data-name="' + esc(item.name) + '" aria-label="删除">✕</button>' +
        '</div>';
    }).join('');

    const cats = D.FOOD_CATS.map(function (cat) {
      return '<option value="' + esc(cat) + '">' + esc(cat) + '</option>';
    }).join('');

    UI.showModal(
      '<div class="modal-title">自定义转盘菜单 🍽</div>' +
      '<div class="modal-sub">共 ' + items.length + ' / ' + MAX_MENU + ' 个选项 · 每次最多转 12 个</div>' +
      '<div class="food-menu-list">' + (rows || '<div class="food-empty">菜单空空的，先加一个吧</div>') + '</div>' +
      '<div class="food-add-row">' +
      '<input type="text" id="foodName" class="input" maxlength="8" placeholder="菜名，如 螺蛳粉" />' +
      '<input type="text" id="foodEmoji" class="input food-emoji-input" maxlength="4" placeholder="🍜" />' +
      '</div>' +
      '<div class="food-add-row" style="margin-top:7px">' +
      '<select id="foodCat" class="select input">' + cats + '</select>' +
      '<button type="button" class="btn primary food-add-btn" data-action="food-add">加入</button>' +
      '</div>' +
      '<div class="modal-actions" style="margin-top:12px">' +
      '<button type="button" class="btn ghost" data-action="food-reset">恢复默认</button>' +
      '<button type="button" class="btn primary" data-action="close">完成</button>' +
      '</div>'
    );
  };

  /* 重绘菜单弹层并保留滚动位置；添加成功后把光标放回菜名输入框，方便连续录入 */
  App.reopenFoodMenu = function (scrollTop, focusName) {
    this.showFoodMenu();
    const card = $('#modalCard');
    if (card) card.scrollTop = Math.max(0, scrollTop || 0);
    if (focusName) {
      const input = $('#foodName');
      if (input) input.focus();
    }
  };

  App.addFoodItem = function () {
    const nameInput = $('#foodName');
    const emojiInput = $('#foodEmoji');
    const catSelect = $('#foodCat');
    const name = U.str(nameInput ? nameInput.value : '', 10);
    if (!name) {
      UI.toast('先写个菜名吧 ✏️');
      return;
    }
    if (this.foodMenu.some(function (item) { return item.name === name; })) {
      UI.toast('菜单里已经有这道菜啦');
      return;
    }
    if (this.foodMenu.length >= MAX_MENU) {
      UI.toast('最多 ' + MAX_MENU + ' 个选项，先删几个吧');
      return;
    }

    const cat = catSelect && D.FOOD_CATS.indexOf(catSelect.value) >= 0 ? catSelect.value : '饭';
    const emoji = U.str(emojiInput ? emojiInput.value : '', 4) || CAT_EMOJI[cat] || '🍽';

    const card = $('#modalCard');
    const scrollTop = card ? card.scrollTop : 0;
    this.foodMenu.push({ name: name, emoji: emoji, cat: cat });
    this.saveFoodMenu();
    this.foodResult = null;
    this.reopenFoodMenu(scrollTop, true);
    this.refreshWheel();
    UI.toast('已加入「' + name + '」🍽');
  };

  /* ---------------- 事件绑定 ---------------- */
  App.bindWheelEvents = function () {
    if (this._wheelBound) return;
    this._wheelBound = true;
    const self = this;

    const spinBtn = $('#btnSpinWheel');
    if (spinBtn) {
      spinBtn.addEventListener('click', function () {
        self.spinWheel();
      });
    }

    const centerBtn = $('#wheelCenterBtn');
    if (centerBtn) {
      centerBtn.addEventListener('click', function () {
        self.spinWheel();
      });
    }

    const filters = $('#foodFilters');
    if (filters) {
      filters.addEventListener('click', function (e) {
        const chip = e.target.closest('[data-cat]');
        if (!chip) return;
        const cat = chip.dataset.cat;
        if (cat !== 'all' && D.FOOD_CATS.indexOf(cat) < 0) return;
        if (self.foodPref.cat === cat) return;
        if (self.wheelSpinning) {
          UI.toast('转盘转完再换分类吧 🎡');
          return;
        }

        self.foodPref.cat = cat;
        self.foodResult = null;
        self.saveFoodPref();
        self.wheelItems = self.buildWheelItems();
        self.renderFood();
        self.renderResult(null);
        self.drawWheel();
        if (!self.wheelItems.length) UI.toast('这个分类下还没有菜，先去菜单加点吧');
      });
    }

    const avoid = $('#foodAvoidRecent');
    if (avoid) {
      avoid.addEventListener('change', function () {
        if (self.wheelSpinning) {
          avoid.checked = !!self.foodPref.avoidRecent;
          UI.toast('转盘转完再改设置吧 🎡');
          return;
        }
        self.foodPref.avoidRecent = !!avoid.checked;
        self.foodResult = null;
        self.saveFoodPref();
        self.wheelItems = self.buildWheelItems();
        self.renderFood();
        self.renderResult(null);
        self.drawWheel();
        UI.toast(avoid.checked ? '已避开最近 3 次吃过的 🎲' : '已关闭避开最近吃过');
      });
    }

    const menuBtn = $('#btnFoodMenu');
    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        if (self.wheelSpinning) {
          UI.toast('转盘还在转，等结果出来再改菜单吧 🎡');
          return;
        }
        self.showFoodMenu();
      });
    }

    const clearBtn = $('#btnClearFoodHistory');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (!self.foodHistory.length) {
          UI.toast('还没有记录可以清空');
          return;
        }
        UI.confirm({
          title: '清空最近吃过？',
          sub: '只清空历史记录，不影响转盘菜单和课程数据',
          okText: '清空',
          danger: true,
          onOk: function () {
            self.foodHistory = [];
            self.saveFoodHistory();
            self.renderHistory();
            UI.toast('记录已清空 🧾');
          }
        });
      });
    }

    /* 菜单弹层动作：与通用弹层的事件委托共存，互不冲突 */
    const modal = $('#modalCard');
    if (modal) {
      modal.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;

        if (action === 'food-add') {
          self.addFoodItem();
          return;
        }

        if (action === 'food-del') {
          const name = btn.dataset.name;
          if (!name) return;
          const card = $('#modalCard');
          const scrollTop = card ? card.scrollTop : 0;
          self.foodMenu = self.foodMenu.filter(function (item) {
            return item.name !== name;
          });
          self.saveFoodMenu();
          self.foodResult = null;
          self.reopenFoodMenu(scrollTop, false);
          self.refreshWheel();
          UI.toast('已删除「' + name + '」');
          return;
        }

        if (action === 'food-reset') {
          /* 恢复默认会覆盖自定义菜品，先二次确认 */
          UI.confirm({
            title: '恢复默认菜单？',
            sub: '自定义菜品会被替换成 12 个默认选项，最近吃过记录不受影响',
            okText: '恢复默认',
            danger: true,
            onOk: function () {
              self.foodMenu = defaultMenu();
              self.saveFoodMenu();
              self.foodResult = null;
              self.wheelItems = self.buildWheelItems();
              self.renderFood();
              self.renderResult(null);
              self.drawWheel();
              UI.toast('菜单已恢复默认 🍽');
            }
          });
        }
      });
    }

    /* 屏幕旋转 / 尺寸变化后重新计算画布尺寸 */
    let resizeTimer = null;
    const redraw = function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        self.drawWheel();
      }, 180);
    };
    window.addEventListener('resize', redraw);
    window.addEventListener('orientationchange', redraw);
  };

  App.mountWheel = function () {
    this.loadFoodData();
    this.bindWheelEvents();
    this.wheelItems = this.buildWheelItems();
  };

  /* 「清空全部数据」时一并重置吃饭菜单、历史与偏好 */
  App.resetFoodData = function () {
    this.foodMenu = defaultMenu();
    this.foodHistory = [];
    this.foodPref = { cat: 'all', avoidRecent: false };
    this.wheelItems = this.buildWheelItems();
    this.wheelRotation = 0;
    this.foodResult = null;
    this.saveFoodMenu();
    this.saveFoodHistory();
    this.saveFoodPref();
    this.renderFood();
    this.renderResult(null);
    this.drawWheel();
  };
})();
/* ============ 今天吃啥模块结束 ============ */