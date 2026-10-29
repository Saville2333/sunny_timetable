/* ============================================================
 * 太阳神的随身陪伴课程表 · Android 桌面小组件桥
 * 将「今日课程 + 天气 + 下一节课」同步给原生 AppWidgetProvider
 * 浏览器环境没有 SunnyWidget，会自动跳过。
 * ============================================================ */
(function () {
  'use strict';

  var Store = window.AppStore;
  var App = window.App;
  var D = window.AppData;
  var U = window.AppUtils;
  function minutes(text) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(text || ''));
    return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
  }
  function coursePayload(course) {
    var start = Store.periodTime(course.start) || {
      start: '--:--',
      end: '--:--'
    };
    var end = Store.periodTime(course.end) || start;
    return {
      id: course.id,
      name: course.name,
      emoji: course.emoji || '📘',
      room: course.room || '',
      teacher: course.teacher || '',
      start: start.start,
      end: end.end,
      startMin: minutes(start.start),
      endMin: minutes(end.end)
    };
  }
  function weatherPayload() {
    var w = App.weather;
    if (!w || !w.current) return null;
    var code = Number(w.current.code);
    var isDay = w.current.isDay !== false;
    var emoji = '🌤️';
    if (code === 0) emoji = isDay ? '☀️' : '🌙';else if (code <= 2) emoji = isDay ? '⛅' : '☁️';else if (code === 3) emoji = '☁️';else if (code >= 45 && code <= 48) emoji = '🌫️';else if (code >= 51 && code <= 67 || code >= 80 && code <= 82) emoji = '🌧️';else if (code >= 71 && code <= 77) emoji = '🌨️';else if (code >= 95) emoji = '⛈️';
    var desc = '天气';
    if (code === 0) desc = '晴';else if (code === 1) desc = '晴间多云';else if (code === 2) desc = '多云';else if (code === 3) desc = '阴';else if (code >= 45 && code <= 48) desc = '有雾';else if (code >= 51 && code <= 67) desc = '有雨';else if (code >= 71 && code <= 77) desc = '有雪';else if (code >= 95) desc = '雷雨';
    return {
      emoji: emoji,
      desc: desc,
      temp: w.current.temp === null || w.current.temp === undefined ? '--' : String(w.current.temp),
      feels: w.current.apparent === null || w.current.apparent === undefined ? '' : String(w.current.apparent),
      place: w.place || '当前位置'
    };
  }
  App.buildWidgetData = function () {
    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    var courses = Store.todayCourses().map(coursePayload);
    var current = null;
    var next = null;
    courses.forEach(function (course) {
      if (course.startMin <= nowMin && nowMin < course.endMin) current = course;
      if (course.startMin > nowMin && !next) next = course;
    });
    return {
      version: 1,
      date: now.getFullYear() + '-' + U.pad2(now.getMonth() + 1) + '-' + U.pad2(now.getDate()),
      weekday: D.WEEKDAYS[Store.todayDayIndex() - 1] || '今天',
      updatedAt: now.getTime(),
      weather: weatherPayload(),
      courses: courses,
      current: current,
      next: next
    };
  };
  App.pushWidgetData = function () {
    if (!window.SunnyWidget || typeof window.SunnyWidget.updateWidget !== 'function') return;
    try {
      var data = this.buildWidgetData();
      var json = JSON.stringify(data);
      if (json === this._lastWidgetJson) return;
      this._lastWidgetJson = json;
      window.SunnyWidget.updateWidget(json);
    } catch (e) {
      console.warn('[Widget] 同步失败', e);
    }
  };
  App.startWidgetSync = function () {
    if (!window.SunnyWidget) return;
    var self = this;
    this.pushWidgetData();
    if (this._widgetTimer) clearInterval(this._widgetTimer);
    this._widgetTimer = setInterval(function () {
      if (!document.hidden) self.pushWidgetData();
    }, 60000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) self.pushWidgetData();
    });
  };
})();