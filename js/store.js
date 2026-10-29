/* ============================================================
 * 星海课表 · 数据层
 * 存储封装 / 设置项 / 课程模型 / 日期与周次工具 / 示例数据
 * ============================================================ */
(function (global) {
  'use strict';

  const KEY_COURSES = 'wusi_timetable_courses_v1';
  const KEY_SETTINGS = 'wusi_timetable_settings_v1';
  const KEY_REMINDERS = 'wusi_custom_reminders_v1';
  const KEY_WEATHER = 'wusi_weather_cache_v1';

  /* 默认作息时间（12 节） */
  const PERIOD_TIMES = [
    { start: '08:00', end: '08:45' },
    { start: '08:55', end: '09:40' },
    { start: '10:00', end: '10:45' },
    { start: '10:55', end: '11:40' },
    { start: '14:00', end: '14:45' },
    { start: '14:55', end: '15:40' },
    { start: '16:00', end: '16:45' },
    { start: '16:55', end: '17:40' },
    { start: '19:00', end: '19:45' },
    { start: '19:55', end: '20:40' },
    { start: '20:50', end: '21:35' },
    { start: '21:45', end: '22:30' }
  ];

  /* 主题色：前 8 个是原有的水色系，最后两个是「太阳神 / 错误文档」预设 */
  const THEMES = [
    { name: '水光', main: '#23c4d8', deep: '#0d95ad', soft: '#e6fafc' },
    { name: '薄荷', main: '#33c9b4', deep: '#129e8c', soft: '#e5faf6' },
    { name: '海蓝', main: '#3fa9f5', deep: '#1a80cc', soft: '#e8f4fe' },
    { name: '青碧', main: '#2bb3a3', deep: '#12897c', soft: '#e6f8f5' },
    { name: '雾蓝', main: '#5cb8e6', deep: '#2e93c4', soft: '#ecf7fd' },
    { name: '湖绿', main: '#4cc7a4', deep: '#259c7c', soft: '#e9fbf4' },
    { name: '淡紫', main: '#8f9fe0', deep: '#6675c4', soft: '#eef0fd' },
    { name: '樱粉', main: '#ef9ab4', deep: '#d06687', soft: '#fdeef3' },
    {
      name: '太阳神 · 白黄',
      main: '#f0a30a',
      deep: '#b96b00',
      soft: '#fff3cf',
      preset: 'sun',
      emoji: '☀️',
      special: true,
      dark: false
    },
    {
      name: '错误文档 · 黑蓝',
      main: '#4c8dff',
      deep: '#1746b3',
      soft: '#e7efff',
      preset: 'error',
      emoji: '⚠️',
      special: true,
      dark: true
    }
  ];

  /* 两套品牌预设：白黄太阳神 / 黑蓝错误文档 */
  const PRESETS = {
    sun: {
      key: 'sun',
      name: '太阳神',
      label: '白黄',
      emoji: '☀️',
      themeIndex: 8,
      dark: false,
      bgId: 'sun',
      motto: '太阳神说：今天也要发光，喵！',
      bg: 'linear-gradient(165deg,#fffdf4 0%,#fff4cf 42%,#ffe6a8 100%)'
    },
    error: {
      key: 'error',
      name: '错误文档',
      label: '黑蓝',
      emoji: '⚠️',
      themeIndex: 9,
      dark: true,
      bgId: 'error',
      motto: '⚠️ 错误文档已加载：请带着猫猫继续上课。',
      bg: 'linear-gradient(165deg,#05080f 0%,#0b1324 45%,#101f3d 100%)'
    },
    water: {
      key: 'water',
      name: '水色',
      label: '原版',
      emoji: '🌊',
      themeIndex: 0,
      dark: false,
      bgId: 'aqua',
      motto: '水色的一天，慢慢来。',
      bg: 'linear-gradient(160deg,#f6feff 0%,#e3f8fb 45%,#f3fdff 100%)'
    }
  };

  /* 背景预设 */
  const BACKGROUNDS = [
    { id: 'aqua', name: '水光', css: 'linear-gradient(160deg,#f6feff 0%,#e3f8fb 45%,#f3fdff 100%)' },
    { id: 'mint', name: '薄荷', css: 'linear-gradient(160deg,#f7fffd 0%,#e2f9f2 50%,#f4fffc 100%)' },
    { id: 'sky', name: '晴空', css: 'linear-gradient(160deg,#f5fbff 0%,#e1f1fd 50%,#f7fdff 100%)' },
    { id: 'wave', name: '潮汐', css: 'linear-gradient(180deg,#eafafd 0%,#ffffff 40%,#e4f8fc 100%)' },
    { id: 'pearl', name: '珍珠', css: 'linear-gradient(145deg,#ffffff 0%,#eef8fa 55%,#e3f6fa 100%)' },
    { id: 'lilac', name: '雾霭', css: 'linear-gradient(160deg,#fbfbff 0%,#eef1fd 55%,#f4fbff 100%)' },
    { id: 'sun', name: '太阳神', css: 'linear-gradient(165deg,#fffdf4 0%,#fff4cf 42%,#ffe6a8 100%)' },
    { id: 'error', name: '错误文档', css: 'linear-gradient(165deg,#05080f 0%,#0b1324 45%,#101f3d 100%)' }
  ];

  /* 一天四个时段的配色（随现实时间自动切换） */
  const PHASES = [
    {
      key: 'dawn',
      name: '清晨',
      emoji: '🌅',
      label: '晨光',
      from: 5,
      to: 10,
      timeText: '05:00 - 10:00',
      mood: '早安，新的一天慢慢开始 ☕',
      theme: { main: '#e9994a', deep: '#c8742c', soft: '#fff2e3' },
      bg: 'linear-gradient(168deg,#fffaf3 0%,#ffeede 46%,#fff6ef 100%)',
      veil: 'linear-gradient(180deg, rgba(255,250,242,0.72), rgba(255,240,225,0.86))'
    },
    {
      key: 'noon',
      name: '中午',
      emoji: '☀️',
      label: '正午',
      from: 10,
      to: 14,
      timeText: '10:00 - 14:00',
      mood: '阳光正好，记得好好吃饭 🍚',
      theme: { main: '#23c4d8', deep: '#0d95ad', soft: '#e6fafc' },
      bg: 'linear-gradient(160deg,#f6feff 0%,#e3f8fb 45%,#f3fdff 100%)',
      veil: 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.86))'
    },
    {
      key: 'afternoon',
      name: '下午',
      emoji: '🌤️',
      label: '午后',
      from: 14,
      to: 18,
      timeText: '14:00 - 18:00',
      mood: '风轻云淡，继续加油 ☁️',
      theme: { main: '#5a9fe0', deep: '#3776bc', soft: '#eaf3fd' },
      bg: 'linear-gradient(165deg,#f7fbff 0%,#e6f0fc 48%,#f5faff 100%)',
      veil: 'linear-gradient(180deg, rgba(247,252,255,0.74), rgba(235,244,255,0.88))'
    },
    {
      key: 'night',
      name: '晚上',
      emoji: '🌙',
      label: '夜色',
      from: 18,
      to: 5,
      timeText: '18:00 - 05:00',
      mood: '把今天收好，早点休息 🌙',
      theme: { main: '#8092df', deep: '#4f60ae', soft: '#eef1ff' },
      bg: 'linear-gradient(168deg,#1f2a4d 0%,#2c3862 46%,#18213c 100%)',
      veil: 'linear-gradient(180deg, rgba(31,42,77,0.66), rgba(20,27,50,0.82))'
    }
  ];

  /* 预设专属的一天四变：太阳神（白黄） / 错误文档（黑蓝） */
  const PRESET_PHASES = {
    sun: {
      dawn: {
        emoji: '🌅',
        label: '金晨',
        mood: '太阳神把第一缕金光塞进课表 ☀️',
        theme: { main: '#e79a1a', deep: '#b56b00', soft: '#fff1c9' },
        bg: 'linear-gradient(168deg,#fffaf0 0%,#ffe8b0 52%,#fff7e2 100%)',
        veil: 'linear-gradient(180deg, rgba(255,250,238,0.72), rgba(255,235,193,0.86))'
      },
      noon: {
        emoji: '🌞',
        label: '烈日',
        mood: '太阳神全功率运转：记得喝水，猫猫盯着你 ☀️',
        theme: { main: '#f0a30a', deep: '#b96b00', soft: '#fff3cf' },
        bg: 'linear-gradient(160deg,#fffdf4 0%,#fff4cf 45%,#ffe7a6 100%)',
        veil: 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,246,214,0.86))'
      },
      afternoon: {
        emoji: '🌤️',
        label: '斜阳',
        mood: '斜阳把影子拉长，猫猫在窗边打盹 🌻',
        theme: { main: '#e8842a', deep: '#b45a00', soft: '#ffedd6' },
        bg: 'linear-gradient(165deg,#fffaf1 0%,#ffe8cf 48%,#fff4e4 100%)',
        veil: 'linear-gradient(180deg, rgba(255,250,244,0.74), rgba(255,232,207,0.88))'
      },
      night: {
        emoji: '🌙',
        label: '星夜',
        mood: '太阳神下班了，换月亮和猫猫值班 🌙',
        theme: { main: '#d9a441', deep: '#9b6a17', soft: '#fff1c9' },
        bg: 'linear-gradient(168deg,#1d2332 0%,#2b2a2a 46%,#171b26 100%)',
        veil: 'linear-gradient(180deg, rgba(29,35,50,0.66), rgba(18,22,32,0.82))'
      }
    },
    error: {
      dawn: {
        emoji: '🌫️',
        label: '蓝屏清晨',
        mood: '⚠️ 早八加载中：猫猫已就位，请勿关掉页面。',
        theme: { main: '#6d9bff', deep: '#2b55c2', soft: '#e4ecff' },
        bg: 'linear-gradient(168deg,#04070d 0%,#0a1427 48%,#0e1e3b 100%)',
        veil: 'linear-gradient(180deg, rgba(4,7,13,0.74), rgba(6,12,25,0.88))'
      },
      noon: {
        emoji: '⚠️',
        label: '正午告警',
        mood: '❌ 警告：太阳很大，但错误文档说今天不许摆烂。',
        theme: { main: '#4c8dff', deep: '#1746b3', soft: '#e7efff' },
        bg: 'linear-gradient(160deg,#05080f 0%,#0b1324 45%,#101f3d 100%)',
        veil: 'linear-gradient(180deg, rgba(5,8,15,0.7), rgba(8,15,30,0.86))'
      },
      afternoon: {
        emoji: '🛠️',
        label: '修补午后',
        mood: '⚠️ 下午加载了 3 个 bug，猫猫正在用爪子修。',
        theme: { main: '#5f86ff', deep: '#244cc4', soft: '#e4ecff' },
        bg: 'linear-gradient(165deg,#060a12 0%,#0c1730 48%,#122346 100%)',
        veil: 'linear-gradient(180deg, rgba(6,10,18,0.72), rgba(9,17,35,0.88))'
      },
      night: {
        emoji: '🌑',
        label: '夜间错误',
        mood: '❌ 夜间错误日志：今天辛苦了，猫猫批准你睡觉。',
        theme: { main: '#3d6ed1', deep: '#16358c', soft: '#dfe8ff' },
        bg: 'linear-gradient(168deg,#02040a 0%,#060d1b 46%,#0a1428 100%)',
        veil: 'linear-gradient(180deg, rgba(2,4,10,0.78), rgba(3,7,15,0.9))'
      }
    }
  };

  /* 按真实时钟判断当前属于哪个时段（夜晚跨 0 点） */
  function phaseOf(date, preset) {
    const d = date || new Date();
    const h = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
    let base = PHASES[1];
    for (let i = 0; i < PHASES.length; i += 1) {
      const p = PHASES[i];
      if (p.from < p.to) {
        if (h >= p.from && h < p.to) {
          base = p;
          break;
        }
      } else if (h >= p.from || h < p.to) {
        base = p;
        break;
      }
    }
    const variants = PRESET_PHASES[preset];
    if (!variants || !variants[base.key]) return base;
    return Object.assign({}, base, variants[base.key], {
      key: base.key,
      from: base.from,
      to: base.to,
      timeText: base.timeText,
      preset: preset
    });
  }

  /* 「吃什么」转盘：默认菜单与分类 */
  const FOOD_CATS = ['饭', '面食', '小吃', '轻食', '快餐'];
  const FOODS = [
    { name: '麻辣烫', emoji: '🌶️', cat: '小吃' },
    { name: '番茄牛腩饭', emoji: '🍅', cat: '饭' },
    { name: '黄焖鸡米饭', emoji: '🍗', cat: '饭' },
    { name: '兰州牛肉面', emoji: '🍜', cat: '面食' },
    { name: '手工饺子', emoji: '🥟', cat: '面食' },
    { name: '石锅拌饭', emoji: '🍲', cat: '饭' },
    { name: '沙拉轻食', emoji: '🥗', cat: '轻食' },
    { name: '三明治', emoji: '🥪', cat: '轻食' },
    { name: '汉堡薯条', emoji: '🍔', cat: '快餐' },
    { name: '酸辣粉', emoji: '🍥', cat: '小吃' },
    { name: '寿司拼盘', emoji: '🍣', cat: '轻食' },
    { name: '鸡腿饭', emoji: '🍱', cat: '饭' }
  ];

  /* 课程色板（水色系） */
  const COURSE_COLORS = [
    { main: '#22c3d8', soft: '#e5fafd', line: '#b8eef6', ink: '#0a5c69' },
    { main: '#37c2b6', soft: '#e6faf7', line: '#bbeee8', ink: '#0b5d56' },
    { main: '#4ea8de', soft: '#e9f4fe', line: '#c3e3fa', ink: '#0b4a70' },
    { main: '#68c9a4', soft: '#ecfaf3', line: '#c7ecdb', ink: '#0d5a41' },
    { main: '#5fc5e8', soft: '#eaf8fd', line: '#c5eafa', ink: '#0a4f68' },
    { main: '#7bc8d4', soft: '#eefafb', line: '#cdeff2', ink: '#0e5760' },
    { main: '#4fb3b8', soft: '#e8f8f8', line: '#c1e9e9', ink: '#0a5457' },
    { main: '#8ec9e8', soft: '#f0f9fe', line: '#d2ecfb', ink: '#155a78' }
  ];

  const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const WEEKDAYS_FULL = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

  /* ---------------- 小工具 ---------------- */
  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function dateKey(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function parseDate(str) {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(str || '').trim());
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function addDays(d, n) {
    const x = new Date(d.getTime());
    x.setDate(x.getDate() + n);
    return x;
  }

  function mondayOf(d) {
    const x = startOfDay(d);
    const wd = x.getDay();
    return addDays(x, wd === 0 ? -6 : 1 - wd);
  }

  function diffDays(from, to) {
    return Math.round((startOfDay(to) - startOfDay(from)) / 86400000);
  }

  function fmtMD(d) {
    return pad2(d.getMonth() + 1) + '.' + pad2(d.getDate());
  }

  function uid() {
    return 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function clampInt(v, min, max, fallback) {
    const n = parseInt(v, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function str(v, max) {
    return String(v == null ? '' : v).trim().slice(0, max || 200);
  }

  function timeToMinutes(t) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || ''));
    if (!m) return 0;
    return Number(m[1]) * 60 + Number(m[2]);
  }

  function isWusiStorageReady() {
    return !!(
      global.wusiStorage &&
      typeof global.wusiStorage.getItem === 'function' &&
      typeof global.wusiStorage.setItem === 'function' &&
      typeof global.wusiStorage.getAll === 'function'
    );
  }

  /* 等待存储服务就绪（兼容老旧设备延迟） */
  function waitForStorage(maxAttempt, delay) {
    const limit = maxAttempt || 10;
    const gap = delay || 200;
    return new Promise(function (resolve) {
      let count = 0;
      function tick() {
        if (isWusiStorageReady()) return resolve(true);
        count += 1;
        if (count >= limit) return resolve(false);
        setTimeout(tick, gap);
      }
      tick();
    });
  }

  function defaultSettings() {
    return {
      designVersion: 3,
      themeIndex: 8,
      themePreset: 'sun',
      bgId: 'sun',
      bgColor: '',
      bgImage: '',
      semesterStart: dateKey(mondayOf(new Date())),
      totalWeeks: 18,
      sections: 10,
      showWeekend: true,
      nickname: '太阳神眷顾的同学',
      avatar: '🐈‍⬛',
      /* 随现实时间自动换配色（清晨/中午/下午/晚上） */
      autoTheme: true,
      bgFollowPhase: true,
      /* 上课与外卖提醒 */
      remindPreClass: true,
      remindPreMin: 20,
      remindEndClass: true,
      remindEndMin: 5,
      remindMeal: true,
      remindMealMin: 30,
      remindSound: true,
      remindVibrate: true,
      /* 提醒弹窗（弹窗 / 横幅二选一，默认弹窗） */
      remindPopup: true,
      /* 天气与穿搭 */
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
      weatherUpdatedAt: 0,
      /* 可编辑作息：数组每项 { start, end }；classDuration 用于统一重算 */
      periodTimes: PERIOD_TIMES.map(function (p) { return { start: p.start, end: p.end }; }),
      classDuration: 45,
      breakDuration: 10,
      /* 早/晚自习 */
      selfStudy: {
        morning: { enabled: false, start: '07:30', end: '08:00', place: '教室' },
        evening: { enabled: false, start: '19:00', end: '21:00', place: '图书馆' }
      },
      /* 倒计时：假期 / 考试 / 自定义 */
      countdowns: [],
      /* 待办事项 */
      todos: [],
      /* 下课后自动弹出记作业 */
      autoHomework: true,
      /* 卡片透明度 0.45 ~ 1 */
      uiAlpha: 0.93
    };
  }

  function normalizePeriodTimes(raw, sections) {
    const fallback = PERIOD_TIMES;
    const list = [];
    const source = Array.isArray(raw) ? raw : [];
    const total = 12;
    for (let i = 0; i < total; i += 1) {
      const item = source[i] || {};
      const def = fallback[i] || fallback[fallback.length - 1];
      let start = /^\d{1,2}:\d{2}$/.test(String(item.start || '')) ? String(item.start) : def.start;
      let end = /^\d{1,2}:\d{2}$/.test(String(item.end || '')) ? String(item.end) : def.end;
      let s = timeToMinutes(start);
      let e = timeToMinutes(end);
      if (s < 0) s = timeToMinutes(def.start);
      if (e <= s) e = Math.min(23 * 60 + 59, s + 45);
      start = pad2(Math.floor(s / 60)) + ':' + pad2(s % 60);
      end = pad2(Math.floor(e / 60)) + ':' + pad2(e % 60);
      list.push({ start: start, end: end });
    }
    return list;
  }

  function normalizeCountdown(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const title = str(raw.title, 24);
    const date = parseDate(raw.date);
    if (!title || !date) return null;
    const types = ['holiday', 'vacation', 'exam', 'other'];
    let type = String(raw.type || 'holiday');
    if (types.indexOf(type) < 0) type = 'other';
    const emojiMap = { holiday: '🎉', vacation: '🌴', exam: '📝', other: '⏳' };
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : 'cd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      title: title,
      date: dateKey(date),
      type: type,
      emoji: str(raw.emoji, 4) || emojiMap[type],
      repeat: !!raw.repeat
    };
  }

  function normalizeTodo(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const text = str(raw.text, 200);
    if (!text) return null;
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : 'td_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      text: text,
      course: str(raw.course, 40),
      due: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.due || '')) ? String(raw.due) : '',
      done: !!raw.done,
      createdAt: Number(raw.createdAt) || Date.now()
    };
  }

  function normalizeSelfStudy(raw) {
    const base = {
      morning: { enabled: false, start: '07:30', end: '08:00', place: '教室' },
      evening: { enabled: false, start: '19:00', end: '21:00', place: '图书馆' }
    };
    if (!raw || typeof raw !== 'object') return base;
    ['morning', 'evening'].forEach(function (key) {
      const item = raw[key];
      if (!item || typeof item !== 'object') return;
      base[key].enabled = !!item.enabled;
      if (/^\d{1,2}:\d{2}$/.test(String(item.start || ''))) base[key].start = String(item.start);
      if (/^\d{1,2}:\d{2}$/.test(String(item.end || ''))) base[key].end = String(item.end);
      base[key].place = str(item.place, 16) || base[key].place;
    });
    return base;
  }

  /* 自定义提醒事项（弹窗提醒，可每天 / 每周 / 单次重复） */
  const REMINDER_REPEATS = ['none', 'daily', 'weekdays', 'weekly'];

  function normalizeReminder(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const title = str(raw.title, 30);
    if (!title) return null;
    const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(String(raw.time || ''));
    const hour = timeMatch ? Math.max(0, Math.min(23, Number(timeMatch[1]))) : 8;
    const minute = timeMatch ? Math.max(0, Math.min(59, Number(timeMatch[2]))) : 0;
    let repeat = String(raw.repeat || 'none');
    if (REMINDER_REPEATS.indexOf(repeat) === -1) repeat = 'none';
    const date = parseDate(raw.date) ? dateKey(parseDate(raw.date)) : '';
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: title,
      body: str(raw.body, 120),
      emoji: str(raw.emoji, 4) || '🔔',
      time: pad2(hour) + ':' + pad2(minute),
      date: repeat === 'none' ? date : '',
      repeat: repeat,
      weekday: clampInt(raw.weekday, 1, 7, 1),
      advance: clampInt(raw.advance, 0, 120, 0),
      enabled: raw.enabled === undefined ? true : !!raw.enabled,
      lastFiredAt: Number(raw.lastFiredAt) || 0,
      lastFiredKey: str(raw.lastFiredKey, 40),
      createdAt: Number(raw.createdAt) || Date.now()
    };
  }

  function clampWeeks(weeks, total) {
    if (!Array.isArray(weeks)) return [];
    const max = total || 30;
    const out = [];
    weeks.forEach(function (w) {
      const n = parseInt(w, 10);
      if (Number.isFinite(n) && n >= 1 && n <= Math.max(30, max)) {
        if (out.indexOf(n) === -1) out.push(n);
      }
    });
    return out.sort(function (a, b) { return a - b; });
  }

  function rangeWeeks(from, to) {
    const out = [];
    for (let i = from; i <= to; i += 1) out.push(i);
    return out;
  }

  /* 课程数据标准化（兼容旧数据、脏数据） */
  function normalizeCourse(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const name = str(raw.name, 30);
    if (!name) return null;
    const start = clampInt(raw.start, 1, 12, 1);
    const end = clampInt(raw.end, start, 12, start);
    const weeks = clampWeeks(raw.weeks, 30);
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
      name: name,
      teacher: str(raw.teacher, 20),
      room: str(raw.room, 30),
      books: str(raw.books, 120),
      note: str(raw.note, 200),
      emoji: str(raw.emoji, 4) || '📘',
      day: clampInt(raw.day, 1, 7, 1),
      start: start,
      end: end,
      weeks: weeks.length ? weeks : rangeWeeks(1, 18),
      colorIndex: clampInt(raw.colorIndex, 0, COURSE_COLORS.length - 1, 0),
      createdAt: Number(raw.createdAt) || Date.now()
    };
  }

  /* 示例课表示范数据 */
  function buildDemoCourses() {
    const list = [
      { name: '高等数学', teacher: '张明', room: '教学楼 A302', books: '《高等数学》第七版、习题册', day: 1, start: 1, end: 2, colorIndex: 0, emoji: '📐' },
      { name: '大学英语', teacher: '李悦', room: '外语楼 B205', books: '《新视野大学英语 2》', day: 1, start: 3, end: 4, colorIndex: 2, emoji: '📘' },
      { name: '程序设计基础', teacher: '王磊', room: '实验楼 C401', books: '《C 语言程序设计》', day: 1, start: 5, end: 6, colorIndex: 4, emoji: '💻' },
      { name: '线性代数', teacher: '陈曦', room: '教学楼 A201', books: '《线性代数》', day: 2, start: 1, end: 2, colorIndex: 3, emoji: '🧮' },
      { name: '大学物理', teacher: '刘洋', room: '理科楼 D103', books: '《大学物理学》上册、实验报告本', day: 2, start: 3, end: 4, colorIndex: 1, emoji: '🧪' },
      { name: '体育（篮球）', teacher: '赵鹏', room: '体育馆 2 号场', books: '运动服、球鞋', day: 2, start: 7, end: 8, colorIndex: 5, emoji: '🏀' },
      { name: '数据结构', teacher: '孙倩', room: '实验楼 C302', books: '《数据结构（C 语言版）》', day: 3, start: 1, end: 2, colorIndex: 6, emoji: '🧠' },
      { name: '思想道德与法治', teacher: '周敏', room: '人文楼 E101', books: '《思想道德与法治》', day: 3, start: 5, end: 6, colorIndex: 7, emoji: '🌿' },
      { name: '高等数学', teacher: '张明', room: '教学楼 A302', books: '《高等数学》第七版、习题册', day: 4, start: 1, end: 2, colorIndex: 0, emoji: '📐' },
      { name: '大学英语', teacher: '李悦', room: '外语楼 B205', books: '《新视野大学英语 2》', day: 4, start: 3, end: 4, colorIndex: 2, emoji: '📘' },
      { name: '概率论与数理统计', teacher: '吴迪', room: '教学楼 A305', books: '《概率论与数理统计》', day: 5, start: 1, end: 2, colorIndex: 3, emoji: '🎲' },
      { name: '程序设计实验', teacher: '王磊', room: '实验楼 C401', books: '《C 语言程序设计实验指导》', day: 5, start: 3, end: 4, colorIndex: 4, emoji: '🖥️' },
      { name: '摄影基础（选修）', teacher: '林清', room: '艺术楼 F201', books: '《摄影入门与进阶》', day: 6, start: 3, end: 4, colorIndex: 5, emoji: '📷' }
    ];
    return list.map(function (item, index) {
      return normalizeCourse({
        id: 'demo_' + index,
        name: item.name,
        teacher: item.teacher,
        room: item.room,
        books: item.books,
        note: '',
        emoji: item.emoji,
        day: item.day,
        start: item.start,
        end: item.end,
        weeks: rangeWeeks(1, 18),
        colorIndex: item.colorIndex,
        createdAt: Date.now() + index
      });
    }).filter(Boolean);
  }

  /* ---------------- Store ---------------- */
  const Store = {
    settings: defaultSettings(),
    courses: [],
    reminders: [],
    storageMode: 'memory',
    memory: {},
    loaded: false,
    firstRun: false,

    async init() {
      const ready = await waitForStorage();
      if (ready) {
        this.storageMode = 'wusi';
      } else {
        let localOk = false;
        try {
          localStorage.setItem('__probe__', '1');
          localStorage.removeItem('__probe__');
          localOk = true;
        } catch (e) {
          localOk = false;
          console.warn('[Store] localStorage 不可用，使用内存模式', e);
        }
        this.storageMode = localOk ? 'local' : 'memory';
      }

      let savedSettings = this.read(KEY_SETTINGS);
      let savedCourses = this.read(KEY_COURSES);
      let savedReminders = this.read(KEY_REMINDERS);

      // 老旧设备存储可能延迟返回，二次确认，避免把已有数据误判为首次使用
      if (this.storageMode === 'wusi' && !savedSettings && !savedCourses) {
        await new Promise(function (resolve) { setTimeout(resolve, 200); });
        savedSettings = this.read(KEY_SETTINGS);
        savedCourses = this.read(KEY_COURSES);
      }

      // 兼容可能返回 Promise 的存储实现
      if (savedSettings && typeof savedSettings.then === 'function') {
        savedSettings = await savedSettings;
      }
      if (savedCourses && typeof savedCourses.then === 'function') {
        savedCourses = await savedCourses;
      }

      const base = defaultSettings();
      if (savedSettings && typeof savedSettings === 'object') {
        Object.keys(base).forEach(function (k) {
          if (savedSettings[k] !== undefined && savedSettings[k] !== null) base[k] = savedSettings[k];
        });
      }
      base.totalWeeks = clampInt(base.totalWeeks, 1, 30, 18);
      base.sections = clampInt(base.sections, 6, 12, 10);
      base.periodTimes = normalizePeriodTimes(base.periodTimes, base.sections);
      base.classDuration = clampInt(base.classDuration, 20, 180, 45);
      base.breakDuration = clampInt(base.breakDuration, 0, 60, 10);
      base.selfStudy = normalizeSelfStudy(base.selfStudy);
      base.countdowns = Array.isArray(base.countdowns) ? base.countdowns.map(normalizeCountdown).filter(Boolean) : [];
      base.todos = Array.isArray(base.todos) ? base.todos.map(normalizeTodo).filter(Boolean) : [];
      base.uiAlpha = Math.max(0.45, Math.min(1, Number(base.uiAlpha) || 0.93));
      if (!parseDate(base.semesterStart)) base.semesterStart = dateKey(mondayOf(new Date()));

      /* 从旧版升级到「太阳神」品牌：没有 designVersion 的存档只迁移一次外观，
       * 课程、提醒、天气设置全部保留。 */
      if (!savedSettings || savedSettings.designVersion === undefined) {
        base.designVersion = 3;
        base.themePreset = 'sun';
        base.themeIndex = 8;
        base.bgId = 'sun';
        if (!savedSettings || savedSettings.nickname === '同学') base.nickname = '太阳神眷顾的同学';
        if (!savedSettings || savedSettings.avatar === '🐚') base.avatar = '🐈‍⬛';
      }
      if (['sun', 'error', 'water'].indexOf(base.themePreset) < 0) base.themePreset = 'sun';
      base.themeIndex = clampInt(base.themeIndex, 0, THEMES.length - 1, 8);
      if (!Array.isArray(savedCourses) && savedCourses && typeof savedCourses === 'object' && Array.isArray(savedCourses.list)) {
        // 兼容 { list: [] } 结构
        this.courses = savedCourses.list.map(normalizeCourse).filter(Boolean);
      } else if (Array.isArray(savedCourses)) {
        this.courses = savedCourses.map(normalizeCourse).filter(Boolean);
      } else {
        this.courses = [];
      }

      this.settings = base;
      this.reminders = Array.isArray(savedReminders)
        ? savedReminders.map(normalizeReminder).filter(Boolean)
        : [];
      this.loaded = true;

      if (!savedSettings && !savedCourses) {
        this.firstRun = true;
        this.courses = buildDemoCourses();
        await this.saveCourses();
        await this.saveSettings();
      }
      console.log('[Store] 就绪，模式：' + this.storageMode + '，课程数：' + this.courses.length);
      return true;
    },

    read(key) {
      try {
        if (this.storageMode === 'wusi') {
          const v = global.wusiStorage.getItem(key);
          if (v == null) return null;
          if (typeof v === 'string') {
            try { return JSON.parse(v); } catch (e) { return null; }
          }
          return v;
        }
        if (this.storageMode === 'local') {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : null;
        }
      } catch (e) {
        console.error('[Store] 读取失败：' + key, e);
      }
      return this.memory[key] || null;
    },

    async write(key, value) {
      this.memory[key] = value;
      try {
        if (this.storageMode === 'wusi') {
          await global.wusiStorage.setItem(key, value);
          return true;
        }
        if (this.storageMode === 'local') {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        }
      } catch (e) {
        console.error('[Store] 保存失败：' + key, e);
      }
      return false;
    },

    saveSettings() {
      return this.write(KEY_SETTINGS, this.settings);
    },

    saveCourses() {
      return this.write(KEY_COURSES, this.courses);
    },

    saveReminders() {
      return this.write(KEY_REMINDERS, this.reminders);
    },

    getReminder(id) {
      return this.reminders.filter(function (r) { return r.id === id; })[0] || null;
    },

    async upsertReminder(item) {
      const clean = normalizeReminder(item);
      if (!clean) throw new Error('提醒内容不完整');
      const idx = this.reminders.findIndex(function (r) { return r.id === clean.id; });
      if (idx >= 0) {
        this.reminders[idx] = clean;
      } else {
        this.reminders.push(clean);
      }
      await this.saveReminders();
      return clean;
    },

    async deleteReminder(id) {
      const before = this.reminders.length;
      this.reminders = this.reminders.filter(function (r) { return r.id !== id; });
      if (this.reminders.length !== before) await this.saveReminders();
      return this.reminders.length !== before;
    },

    async clearReminders() {
      this.reminders = [];
      await this.saveReminders();
    },

    async touchReminder(id, ts) {
      const item = this.getReminder(id);
      if (!item) return;
      item.lastFiredAt = Number(ts) || Date.now();
      await this.saveReminders();
    },

    /* 记录自定义提醒本次触发（按 dayKey 去重，跨重启也能避免重复弹） */
    async markReminderFired(id, key, ts) {
      const item = this.getReminder(id);
      if (!item) return;
      item.lastFiredAt = Number(ts) || Date.now();
      item.lastFiredKey = String(key || '');
      await this.saveReminders();
    },

    async updateSettings(patch) {
      const next = Object.assign({}, patch || {});
      if (next.totalWeeks !== undefined) next.totalWeeks = clampInt(next.totalWeeks, 1, 30, 18);
      if (next.sections !== undefined) next.sections = clampInt(next.sections, 6, 12, 10);
      if (next.themeIndex !== undefined) {
        next.themeIndex = clampInt(next.themeIndex, 0, THEMES.length - 1, 8);
        if (next.themePreset === undefined) {
          const pickedTheme = THEMES[next.themeIndex];
          next.themePreset = pickedTheme && pickedTheme.preset ? pickedTheme.preset : 'water';
        }
      }
      if (next.themePreset !== undefined) {
        next.themePreset = ['sun', 'error', 'water'].indexOf(String(next.themePreset)) >= 0
          ? String(next.themePreset)
          : 'sun';
      }
      if (next.designVersion !== undefined) next.designVersion = Number(next.designVersion) || 3;
      if (next.remindPreMin !== undefined) next.remindPreMin = clampInt(next.remindPreMin, 5, 60, 20);
      if (next.remindEndMin !== undefined) next.remindEndMin = clampInt(next.remindEndMin, 2, 20, 5);
      if (next.remindMealMin !== undefined) next.remindMealMin = clampInt(next.remindMealMin, 10, 60, 30);
      if (next.weatherMode !== undefined) {
        next.weatherMode = ['auto', 'city', 'manual'].indexOf(String(next.weatherMode)) >= 0 ? String(next.weatherMode) : 'auto';
      }
      if (next.weatherLat !== undefined && next.weatherLat !== null && next.weatherLat !== '') {
        const lat = Number(next.weatherLat);
        next.weatherLat = Number.isFinite(lat) && Math.abs(lat) <= 90 ? lat : null;
      }
      if (next.weatherLon !== undefined && next.weatherLon !== null && next.weatherLon !== '') {
        const lon = Number(next.weatherLon);
        next.weatherLon = Number.isFinite(lon) && Math.abs(lon) <= 180 ? lon : null;
      }
      if (next.weatherManualTemp !== undefined) next.weatherManualTemp = clampInt(next.weatherManualTemp, -40, 50, 26);
      if (next.weatherManualCode !== undefined) next.weatherManualCode = clampInt(next.weatherManualCode, 0, 99, 0);
      if (next.weatherUpdatedAt !== undefined) next.weatherUpdatedAt = Number(next.weatherUpdatedAt) || 0;
      ['autoTheme', 'bgFollowPhase', 'remindPreClass', 'remindEndClass', 'remindMeal', 'remindSound', 'remindVibrate',
        'remindPopup', 'weatherOn', 'weatherFx', 'weatherTheme', 'weatherOutfit'].forEach(function (key) {
        if (next[key] !== undefined) next[key] = !!next[key];
      });
      if (next.semesterStart !== undefined && !parseDate(next.semesterStart)) {
        delete next.semesterStart;
      }
      Object.assign(this.settings, next);
      await this.saveSettings();
    },

    getCourse(id) {
      return this.courses.filter(function (c) { return c.id === id; })[0] || null;
    },

    async upsertCourse(course) {
      const clean = normalizeCourse(course);
      if (!clean) throw new Error('课程数据不完整');
      const idx = this.courses.findIndex(function (c) { return c.id === clean.id; });
      if (idx >= 0) {
        this.courses[idx] = clean;
      } else {
        this.courses.push(clean);
      }
      await this.saveCourses();
      return clean;
    },

    async deleteCourse(id) {
      const before = this.courses.length;
      this.courses = this.courses.filter(function (c) { return c.id !== id; });
      if (this.courses.length !== before) await this.saveCourses();
      return this.courses.length !== before;
    },

    async replaceCourses(list) {
      // 重新生成 id，避免外部导入数据存在重复标识
      this.courses = (Array.isArray(list) ? list : []).map(normalizeCourse).filter(Boolean).map(function (course) {
        course.id = uid();
        return course;
      });
      await this.saveCourses();
      return this.courses.length;
    },

    async mergeCourses(list) {
      const incoming = (Array.isArray(list) ? list : []).map(normalizeCourse).filter(Boolean);
      let added = 0;
      for (let i = 0; i < incoming.length; i += 1) {
        const c = incoming[i];
        const dup = this.courses.some(function (x) {
          return x.name === c.name && x.day === c.day && x.start === c.start && x.end === c.end;
        });
        if (!dup) {
          c.id = uid();
          this.courses.push(c);
          added += 1;
        }
      }
      await this.saveCourses();
      return added;
    },

    async clearCourses() {
      this.courses = [];
      await this.saveCourses();
    },

    /* -------- 周次 / 日期 -------- */
    semesterStartDate() {
      return parseDate(this.settings.semesterStart) || mondayOf(new Date());
    },

    weekStartDate(week) {
      return addDays(this.semesterStartDate(), (Math.max(1, week) - 1) * 7);
    },

    weekDates(week) {
      const monday = this.weekStartDate(week);
      const out = [];
      for (let i = 0; i < 7; i += 1) out.push(addDays(monday, i));
      return out;
    },

    /* 真实当前周（可能超出学期范围） */
    realWeek(date) {
      const d = date || new Date();
      const diff = diffDays(this.semesterStartDate(), d);
      return Math.floor(diff / 7) + 1;
    },

    currentWeek() {
      const raw = this.realWeek();
      return Math.max(1, Math.min(raw, this.settings.totalWeeks));
    },

    todayDayIndex() {
      const wd = new Date().getDay();
      return wd === 0 ? 7 : wd;
    },

    coursesOn(day, week) {
      const s = this.settings;
      return this.courses
        .filter(function (c) {
          return c.day === day && c.weeks.indexOf(week) >= 0 && c.start <= s.sections;
        })
        .sort(function (a, b) { return a.start - b.start; });
    },

    todayCourses() {
      return this.coursesOn(this.todayDayIndex(), this.currentWeek());
    },

    courseColor(course) {
      const idx = clampInt(course && course.colorIndex, 0, COURSE_COLORS.length - 1, 0);
      return COURSE_COLORS[idx];
    },

    weeksText(weeks) {
      if (!Array.isArray(weeks) || !weeks.length) return '未设置周次';
      const sorted = weeks.slice().sort(function (a, b) { return a - b; });
      const ranges = [];
      let start = sorted[0];
      let prev = sorted[0];
      for (let i = 1; i < sorted.length; i += 1) {
        if (sorted[i] === prev + 1) {
          prev = sorted[i];
        } else {
          ranges.push(start === prev ? String(start) : start + '-' + prev);
          start = sorted[i];
          prev = sorted[i];
        }
      }
      ranges.push(start === prev ? String(start) : start + '-' + prev);
      return ranges.join(', ') + ' 周';
    },

    periodTime(section) {
      const times = (this.settings && Array.isArray(this.settings.periodTimes) && this.settings.periodTimes.length)
        ? this.settings.periodTimes
        : PERIOD_TIMES;
      const idx = clampInt(section, 1, times.length, 1) - 1;
      return times[idx] || PERIOD_TIMES[0];
    },

    exportData() {
      return {
        app: '星海课表',
        version: 3,
        exportedAt: new Date().toISOString(),
        settings: this.settings,
        courses: this.courses,
        reminders: this.reminders
      };
    }
  };

  global.AppStore = Store;
  global.AppData = {
    PERIOD_TIMES: PERIOD_TIMES,
    THEMES: THEMES,
    BACKGROUNDS: BACKGROUNDS,
    COURSE_COLORS: COURSE_COLORS,
    WEEKDAYS: WEEKDAYS,
    WEEKDAYS_FULL: WEEKDAYS_FULL,
    KEY_COURSES: KEY_COURSES,
    KEY_SETTINGS: KEY_SETTINGS,
    KEY_REMINDERS: KEY_REMINDERS,
    KEY_WEATHER: KEY_WEATHER,
    REMINDER_REPEATS: REMINDER_REPEATS,
    normalizeReminder: normalizeReminder,
    buildDemoCourses: buildDemoCourses,
    normalizeCourse: normalizeCourse,
    rangeWeeks: rangeWeeks,
    clampWeeks: clampWeeks,
    PHASES: PHASES,
    PRESET_PHASES: PRESET_PHASES,
    PRESETS: PRESETS,
    phaseOf: phaseOf,
    FOODS: FOODS,
    FOOD_CATS: FOOD_CATS
  };
  global.AppUtils = {
    pad2: pad2,
    dateKey: dateKey,
    parseDate: parseDate,
    startOfDay: startOfDay,
    addDays: addDays,
    mondayOf: mondayOf,
    diffDays: diffDays,
    fmtMD: fmtMD,
    uid: uid,
    str: str,
    clampInt: clampInt,
    timeToMinutes: timeToMinutes,
    isWusiStorageReady: isWusiStorageReady
  };
})(window);
/* ============ 数据层结束 ============ */