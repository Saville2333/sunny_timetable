/* ============================================================
 * 太阳神课程表 · 天气与穿搭
 * ------------------------------------------------------------
 * 1) 通过手机定位读取经纬度（WebView / 浏览器 Geolocation）
 * 2) 请求 Open-Meteo 实时天气（免密钥，支持 CORS）；失败时支持城市
 *    查询、IP 兜底、上次缓存与手动天气
 * 3) 按 WMO 天气码切换界面氛围：雨、雪、雾、云、阳光、雷电
 * 4) 按体感温度、降雨、风力与昼夜温差给出穿搭建议
 * ============================================================ */
(function () {
  'use strict';

  var Store = window.AppStore;
  var U = window.AppUtils;
  var D = window.AppData;
  var App = window.App;
  var UI = window.AppUI;
  var H = window.AppHelpers;
  var $ = H.$;
  var esc = H.esc;
  var CACHE_KEY = D.KEY_WEATHER;
  var CACHE_TTL = 30 * 60 * 1000;
  var DEFAULT_LOCATION = {
    lat: 23.1291,
    lon: 113.2644,
    name: '广州（默认）'
  };
  var SOURCE_LABEL = {
    auto: '手机定位',
    city: '城市查询',
    manual: '手动天气',
    cache: '缓存',
    ip: '网络定位'
  };
  var WEATHER_INFO = {
    0: {
      label: '晴',
      scene: 'clear',
      day: '☀️',
      night: '🌙'
    },
    1: {
      label: '晴间多云',
      scene: 'clear',
      day: '🌤️',
      night: '🌙'
    },
    2: {
      label: '多云',
      scene: 'partly',
      day: '⛅',
      night: '☁️'
    },
    3: {
      label: '阴',
      scene: 'cloudy',
      day: '☁️',
      night: '☁️'
    },
    45: {
      label: '有雾',
      scene: 'fog',
      day: '🌫️',
      night: '🌫️'
    },
    48: {
      label: '雾凇',
      scene: 'fog',
      day: '🌫️',
      night: '🌫️'
    },
    51: {
      label: '小毛毛雨',
      scene: 'rain',
      day: '🌦️',
      night: '🌧️'
    },
    53: {
      label: '毛毛雨',
      scene: 'rain',
      day: '🌦️',
      night: '🌧️'
    },
    55: {
      label: '强毛毛雨',
      scene: 'rain',
      day: '🌧️',
      night: '🌧️'
    },
    56: {
      label: '冻毛毛雨',
      scene: 'sleet',
      day: '🌧️',
      night: '🌧️'
    },
    57: {
      label: '强冻毛毛雨',
      scene: 'sleet',
      day: '🌧️',
      night: '🌧️'
    },
    61: {
      label: '小雨',
      scene: 'rain',
      day: '🌦️',
      night: '🌧️'
    },
    63: {
      label: '中雨',
      scene: 'rain',
      day: '🌧️',
      night: '🌧️'
    },
    65: {
      label: '大雨',
      scene: 'rain',
      day: '🌧️',
      night: '🌧️'
    },
    66: {
      label: '冻雨',
      scene: 'sleet',
      day: '🌧️',
      night: '🌧️'
    },
    67: {
      label: '强冻雨',
      scene: 'sleet',
      day: '🌧️',
      night: '🌧️'
    },
    71: {
      label: '小雪',
      scene: 'snow',
      day: '🌨️',
      night: '🌨️'
    },
    73: {
      label: '中雪',
      scene: 'snow',
      day: '🌨️',
      night: '🌨️'
    },
    75: {
      label: '大雪',
      scene: 'snow',
      day: '❄️',
      night: '❄️'
    },
    77: {
      label: '米雪',
      scene: 'snow',
      day: '🌨️',
      night: '🌨️'
    },
    80: {
      label: '小阵雨',
      scene: 'rain',
      day: '🌦️',
      night: '🌧️'
    },
    81: {
      label: '阵雨',
      scene: 'rain',
      day: '🌧️',
      night: '🌧️'
    },
    82: {
      label: '强阵雨',
      scene: 'storm',
      day: '⛈️',
      night: '⛈️'
    },
    85: {
      label: '小阵雪',
      scene: 'snow',
      day: '🌨️',
      night: '🌨️'
    },
    86: {
      label: '强阵雪',
      scene: 'snow',
      day: '❄️',
      night: '❄️'
    },
    95: {
      label: '雷阵雨',
      scene: 'storm',
      day: '⛈️',
      night: '⛈️'
    },
    96: {
      label: '雷阵雨伴冰雹',
      scene: 'storm',
      day: '⛈️',
      night: '⛈️'
    },
    99: {
      label: '强雷暴伴冰雹',
      scene: 'storm',
      day: '⛈️',
      night: '⛈️'
    }
  };
  var SCENE_STYLE = {
    clear: {
      accent: '#e9a23b',
      soft: '#fff4dc',
      tint: 'rgba(255, 202, 112, 0.12)'
    },
    partly: {
      accent: '#5aa9d8',
      soft: '#eaf6fd',
      tint: 'rgba(126, 185, 224, 0.10)'
    },
    cloudy: {
      accent: '#7d93a8',
      soft: '#eef3f7',
      tint: 'rgba(116, 137, 156, 0.10)'
    },
    fog: {
      accent: '#8c9aa5',
      soft: '#f0f3f5',
      tint: 'rgba(168, 180, 188, 0.18)'
    },
    rain: {
      accent: '#4f86bf',
      soft: '#e8f1fb',
      tint: 'rgba(45, 82, 126, 0.22)'
    },
    storm: {
      accent: '#5966a8',
      soft: '#eceefb',
      tint: 'rgba(36, 43, 92, 0.28)'
    },
    snow: {
      accent: '#79a9c7',
      soft: '#eef8ff',
      tint: 'rgba(205, 232, 246, 0.24)'
    },
    sleet: {
      accent: '#6b8aa8',
      soft: '#edf4f9',
      tint: 'rgba(132, 160, 180, 0.20)'
    }
  };
  function codeInfo(code, isDay) {
    var info = WEATHER_INFO[Number(code)] || {
      label: '天气未知',
      scene: 'partly',
      day: '🌤️',
      night: '☁️'
    };
    return {
      label: info.label,
      scene: info.scene,
      emoji: isDay === false ? info.night : info.day
    };
  }
  function roundTemp(value) {
    var n = Number(value);
    return Number.isFinite(n) ? Math.round(n) : null;
  }
  function clamp(num, min, max) {
    return Math.max(min, Math.min(max, num));
  }
  function fmtTime(ts) {
    var d = new Date(Number(ts) || 0);
    if (!Number.isFinite(d.getTime()) || !Number(ts)) return '—';
    return U.pad2(d.getHours()) + ':' + U.pad2(d.getMinutes());
  }
  function sceneStyle(scene) {
    return SCENE_STYLE[scene] || SCENE_STYLE.partly;
  }

  /* ---------------- 网络 ---------------- */
  function fetchJson(url, timeout) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        if (!done) {
          done = true;
          reject(new Error('请求超时'));
        }
      }, timeout || 12000);
      var finish = function finish(value) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(value);
      };
      var fail = function fail(err) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err || '网络请求失败')));
      };
      var request;
      var platformFetch = typeof window.wusiFetch === 'function';
      var nativeFetch = typeof fetch === 'function';
      var requestOptions = {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      };
      var parseResponse = function parseResponse(res) {
        if (!res) throw new Error('没有收到天气响应');
        if (res.ok === false) throw new Error('天气服务返回 HTTP ' + res.status);
        if (typeof res.json === 'function') return res.json();
        if (typeof res.text === 'function') {
          return res.text().then(function (text) {
            return JSON.parse(text);
          });
        }
        return res;
      };
      var runNative = function runNative() {
        if (!nativeFetch) {
          fail(new Error('当前环境不支持网络请求'));
          return;
        }
        try {
          request = fetch(url, requestOptions);
        } catch (e) {
          fail(e);
          return;
        }
        Promise.resolve(request).then(parseResponse).then(finish).catch(fail);
      };
      try {
        if (platformFetch) {
          request = window.wusiFetch(url, requestOptions);
        } else if (nativeFetch) {
          request = fetch(url, requestOptions);
        } else {
          fail(new Error('当前环境不支持网络请求'));
          return;
        }
      } catch (e) {
        if (platformFetch) runNative();else fail(e);
        return;
      }
      Promise.resolve(request).then(parseResponse).then(finish).catch(function (err) {
        /* 微程序桥接可能限制外部域名；失败后再尝试浏览器原生 fetch */
        if (platformFetch && nativeFetch && !done) {
          console.warn('[Weather] 平台网络请求失败，尝试原生 fetch', err);
          runNative();
          return;
        }
        fail(err);
      });
    });
  }
  function getPosition() {
    return new Promise(function (resolve, reject) {
      if (!navigator.geolocation) {
        reject(new Error('设备不支持定位'));
        return;
      }
      navigator.geolocation.getCurrentPosition(function (pos) {
        if (!pos || !pos.coords) {
          reject(new Error('定位结果为空'));
          return;
        }
        resolve({
          lat: Number(pos.coords.latitude),
          lon: Number(pos.coords.longitude),
          name: '当前位置'
        });
      }, function (err) {
        var map = {
          1: '定位权限被拒绝',
          2: '暂时无法定位',
          3: '定位超时'
        };
        reject(new Error(map[err && err.code] || '定位失败'));
      }, {
        enableHighAccuracy: false,
        timeout: 9000,
        maximumAge: 10 * 60 * 1000
      });
    });
  }
  function geocodeCity(city) {
    var name = String(city || '').trim();
    if (!name) return Promise.reject(new Error('请先填写城市'));
    var url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(name) + '&count=1&language=zh&format=json';
    return fetchJson(url, 10000).then(function (json) {
      var first = json && json.results && json.results[0];
      if (!first) throw new Error('没有找到城市「' + name + '」');
      var place = [first.name, first.admin1, first.country].filter(Boolean).join(' · ');
      return {
        lat: Number(first.latitude),
        lon: Number(first.longitude),
        name: place || name
      };
    });
  }
  function ipLocate() {
    return fetchJson('https://ipwho.is/', 7000).then(function (json) {
      if (!json || json.success === false || !Number.isFinite(Number(json.latitude))) {
        throw new Error('IP 定位失败');
      }
      return {
        lat: Number(json.latitude),
        lon: Number(json.longitude),
        name: [json.city, json.region, json.country].filter(Boolean).join(' · ') || '网络定位'
      };
    });
  }
  function forecastUrl(lat, lon) {
    var params = ['latitude=' + encodeURIComponent(lat), 'longitude=' + encodeURIComponent(lon), 'current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m', 'daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset', 'timezone=auto', 'forecast_days=3'];
    return 'https://api.open-meteo.com/v1/forecast?' + params.join('&');
  }
  function fetchForecast(place) {
    return fetchJson(forecastUrl(place.lat, place.lon), 14000).then(function (json) {
      if (!json || !json.current) throw new Error('天气数据不完整');
      var c = json.current || {};
      var dailyRaw = json.daily || {};
      var days = (dailyRaw.time || []).map(function (date, index) {
        return {
          date: date,
          code: Number(dailyRaw.weather_code && dailyRaw.weather_code[index]) || 0,
          max: roundTemp(dailyRaw.temperature_2m_max && dailyRaw.temperature_2m_max[index]),
          min: roundTemp(dailyRaw.temperature_2m_min && dailyRaw.temperature_2m_min[index]),
          rainChance: Number(dailyRaw.precipitation_probability_max && dailyRaw.precipitation_probability_max[index]) || 0,
          sunrise: dailyRaw.sunrise && dailyRaw.sunrise[index] || '',
          sunset: dailyRaw.sunset && dailyRaw.sunset[index] || ''
        };
      });
      return {
        version: 1,
        source: place.source || 'auto',
        place: place.name || '当前位置',
        lat: place.lat,
        lon: place.lon,
        updatedAt: Date.now(),
        current: {
          temp: roundTemp(c.temperature_2m),
          apparent: roundTemp(c.apparent_temperature),
          humidity: roundTemp(c.relative_humidity_2m),
          code: Number(c.weather_code) || 0,
          isDay: c.is_day !== 0,
          wind: roundTemp(c.wind_speed_10m),
          precip: Number(c.precipitation) || 0,
          rain: Number(c.rain) || 0,
          showers: Number(c.showers) || 0,
          snowfall: Number(c.snowfall) || 0
        },
        daily: days
      };
    });
  }
  function manualWeather() {
    var s = Store.settings;
    var now = new Date();
    var code = Number(s.weatherManualCode) || 0;
    return {
      version: 1,
      source: 'manual',
      place: '本机设置',
      lat: null,
      lon: null,
      updatedAt: Date.now(),
      current: {
        temp: roundTemp(s.weatherManualTemp),
        apparent: roundTemp(s.weatherManualTemp),
        humidity: null,
        code: code,
        isDay: now.getHours() >= 6 && now.getHours() < 18,
        wind: 0,
        precip: /^(5|6|8|9)/.test(String(code)) ? 1 : 0,
        rain: 0,
        showers: 0,
        snowfall: 0
      },
      daily: []
    };
  }

  /* ---------------- 穿搭推荐 ---------------- */
  function outfitFor(weather) {
    var current = weather && weather.current || {};
    var temp = Number.isFinite(current.apparent) ? current.apparent : Number(current.temp) || 20;
    var info = codeInfo(current.code, current.isDay);
    var scene = info.scene;
    var wind = Number(current.wind) || 0;
    var today = weather && weather.daily && weather.daily[0];
    var range = today && Number.isFinite(today.max) && Number.isFinite(today.min) ? today.max - today.min : 0;
    var title;
    var emoji;
    var items;
    var tip;
    if (temp >= 30) {
      title = '短袖清凉装';
      emoji = '👕';
      items = ['短袖 T 恤 / 薄衬衫', '短裤或轻薄长裤', '透气运动鞋'];
      tip = '天气偏热，注意防晒、补水和避开正午暴晒。';
    } else if (temp >= 26) {
      title = '短袖为主';
      emoji = '👕';
      items = ['短袖 T 恤', '薄长裤 / 裙子', '帆布鞋或运动鞋'];
      tip = '体感温暖，室内空调冷的话可以带一件薄开衫。';
    } else if (temp >= 22) {
      title = '短袖 + 薄外搭';
      emoji = '🧥';
      items = ['短袖或薄长袖', '薄开衫 / 防晒衣', '长裤'];
      tip = '早晚可能偏凉，叠穿一件薄外套最稳妥。';
    } else if (temp >= 18) {
      title = '长袖 + 薄外套';
      emoji = '🧥';
      items = ['长袖 T 恤 / 衬衫', '薄外套 / 针织开衫', '长裤'];
      tip = '温度舒适，教室空调冷时外套正好派上用场。';
    } else if (temp >= 13) {
      title = '卫衣或毛衣';
      emoji = '🧶';
      items = ['卫衣 / 毛衣', '风衣或夹克', '长裤 + 运动鞋'];
      tip = '有点凉，建议穿一件能挡风的外套。';
    } else if (temp >= 8) {
      title = '厚外套 + 毛衣';
      emoji = '🧥';
      items = ['毛衣 / 加绒卫衣', '厚外套 / 风衣', '长裤'];
      tip = '气温偏低，早晚出门记得加围巾。';
    } else if (temp >= 3) {
      title = '棉服 / 羽绒服';
      emoji = '🧣';
      items = ['保暖内衣', '羽绒服 / 棉服', '围巾 + 长裤'];
      tip = '天气冷，注意手部和颈部保暖。';
    } else {
      title = '厚羽绒 + 保暖层';
      emoji = '🧤';
      items = ['保暖内衣 + 毛衣', '厚羽绒服', '帽子、围巾、手套'];
      tip = '严寒天气，尽量减少长时间户外停留。';
    }
    if (scene === 'rain' || scene === 'storm' || scene === 'sleet') {
      items.push('折叠伞 / 雨衣');
      items.push('防水鞋或不怕湿的鞋');
      tip = '有降雨，出门带伞，裤脚和鞋袜注意防水。';
    }
    if (scene === 'snow') {
      items.push('防滑鞋');
      items.push('手套 / 帽子');
      tip = '有雪，路面湿滑，穿防滑鞋并注意保暖。';
    }
    if (wind >= 30) {
      items.push('防风外套');
      tip = '风力较大，优先选防风外层，远离临时搭建物。';
    }
    if (range >= 8) {
      items.push('可脱卸的叠穿外层');
      tip += ' 今天昼夜温差约 ' + Math.round(range) + '℃，建议叠穿。';
    }
    return {
      title: title,
      emoji: emoji,
      items: items,
      short: shortOutfit(items, scene, wind),
      tip: tip,
      temp: temp,
      scene: scene
    };
  }

  /* 今日卡片只放一行，但必须把「带伞 / 防滑 / 防风」这类关键提醒带上 */
  function shortOutfit(items, scene, wind) {
    var text = items.slice(0, 2).join(' · ');
    if (scene === 'rain' || scene === 'storm' || scene === 'sleet') text += ' · 带伞';
    if (scene === 'snow') text += ' · 防滑';
    if (wind >= 30) text += ' · 防风';
    return text;
  }

  /* ---------------- 天气实例 ---------------- */
  App.weather = null;
  App.weatherLoading = false;
  App.weatherPromise = null;
  App.weatherRequestId = 0;
  App._weatherFxKey = '';
  App._weatherBound = false;
  App.loadWeatherCache = function () {
    var cached = Store.read(CACHE_KEY);
    if (cached && cached.current && Number.isFinite(Number(cached.current.temp))) {
      this.weather = cached;
      this.renderWeatherUI();
      this.renderWeatherFx();
      return true;
    }
    return false;
  };
  App.saveWeatherCache = function (data) {
    Store.write(CACHE_KEY, data);
    Store.updateSettings({
      weatherUpdatedAt: data.updatedAt || Date.now(),
      weatherLat: data.lat !== null && data.lat !== undefined ? data.lat : Store.settings.weatherLat,
      weatherLon: data.lon !== null && data.lon !== undefined ? data.lon : Store.settings.weatherLon,
      weatherPlace: data.place || Store.settings.weatherPlace
    });
  };
  App.resolveWeatherPlace = function () {
    var s = Store.settings;
    if (s.weatherMode === 'city') return geocodeCity(s.weatherCity).then(function (p) {
      p.source = 'city';
      return p;
    });
    if (s.weatherMode === 'auto') {
      return getPosition().then(function (p) {
        p.source = 'auto';
        return p;
      }).catch(function (err) {
        console.warn('[Weather] 定位失败，尝试城市/IP 兜底', err);
        if (s.weatherCity) {
          return geocodeCity(s.weatherCity).then(function (p) {
            p.source = 'city';
            return p;
          });
        }
        return ipLocate().then(function (p) {
          p.source = 'ip';
          return p;
        }).catch(function () {
          if (Number.isFinite(Number(s.weatherLat)) && Number.isFinite(Number(s.weatherLon))) {
            return {
              lat: Number(s.weatherLat),
              lon: Number(s.weatherLon),
              name: s.weatherPlace || '上次位置',
              source: 'cache'
            };
          }
          var p = Object.assign({}, DEFAULT_LOCATION);
          p.source = 'auto';
          p.name = '广州（定位失败，默认）';
          return p;
        });
      });
    }
    return Promise.resolve(null);
  };
  App.refreshWeather = function (showToast) {
    var self = this;
    if (!Store.settings.weatherOn) {
      this.weather = null;
      this.renderWeatherUI();
      this.renderWeatherFx();
      return Promise.resolve(null);
    }
    if (this.weatherLoading && this.weatherPromise) return this.weatherPromise;
    var requestId = ++this.weatherRequestId;
    this.weatherLoading = true;
    this.renderWeatherStatus('正在读取手机天气…');
    this.updateWeatherCardStatus('正在读取天气…');
    var task;
    if (Store.settings.weatherMode === 'manual') {
      task = Promise.resolve(manualWeather());
    } else {
      task = this.resolveWeatherPlace().then(function (place) {
        if (!place) throw new Error('没有可用的位置');
        return fetchForecast(place);
      });
    }
    this.weatherPromise = task.then(function (data) {
      if (requestId !== self.weatherRequestId) return null;
      if (!data) throw new Error('没有获取到天气数据');
      self.weather = data;
      self.saveWeatherCache(data);
      self.renderWeatherUI();
      self.renderWeatherFx();
      self.renderWeatherSettings();
      if (showToast) UI.toast('天气已更新 · ' + data.place);
      return data;
    }).catch(function (err) {
      if (requestId !== self.weatherRequestId) return null;
      console.error('[Weather] 获取失败', err);
      var message = err && err.message || '天气获取失败';
      if (self.weather) {
        self.renderWeatherStatus('⚠️ ' + message + '，正在显示上次的天气');
        self.updateWeatherCardStatus(message + ' · 显示缓存');
        if (showToast) UI.toast('天气获取失败，显示上次数据');
      } else {
        self.renderWeatherStatus('⚠️ ' + message);
        self.updateWeatherCardStatus('未能读取天气，点这里重试');
        self.updateHeaderWeather('—', '🌤');
        if (showToast) UI.toast('天气获取失败：' + message);
      }
      return null;
    }).then(function (data) {
      if (requestId === self.weatherRequestId) {
        self.weatherLoading = false;
        self.weatherPromise = null;
      }
      return data;
    });
    return this.weatherPromise;
  };
  App.updateHeaderWeather = function (temp, emoji) {
    var tempEl = $('#headerWeatherTemp');
    var iconEl = $('#headerWeatherIcon');
    if (tempEl) tempEl.textContent = temp === null || temp === undefined ? '--°' : temp + '°';
    if (iconEl) iconEl.textContent = emoji || '🌤';
  };
  App.updateWeatherCardStatus = function (text) {
    var desc = $('#weatherDesc');
    if (desc) desc.textContent = text || '';
  };
  App.renderWeatherStatus = function (text) {
    var el = $('#weatherStatus');
    if (el) {
      el.textContent = text || '还没有读取天气';
      el.classList.toggle('is-err', /⚠️|失败|未成功/.test(text || ''));
    }
  };
  App.renderWeatherUI = function () {
    var s = Store.settings;
    var w = this.weather;
    if (!s.weatherOn) {
      this.updateHeaderWeather(null, '🌤');
      this.updateWeatherCardStatus('天气同步已关闭');
      var _outfitEl = $('#weatherOutfit');
      if (_outfitEl) _outfitEl.textContent = '在「我的 → 天气与穿搭」中开启';
      var _placeEl = $('#weatherPlace');
      if (_placeEl) _placeEl.textContent = '天气同步已关闭';
      this.renderWeatherStatus('天气同步已关闭');
      return;
    }
    if (!w || !w.current) {
      this.updateHeaderWeather(null, '🌤');
      this.updateWeatherCardStatus('正在读取天气…');
      var _placeEl2 = $('#weatherPlace');
      if (_placeEl2) _placeEl2.textContent = '定位中 · 数据来自手机定位 / Open-Meteo';
      this.renderWeatherStatus('还没有读取天气');
      return;
    }
    var info = codeInfo(w.current.code, w.current.isDay);
    var temp = roundTemp(w.current.temp);
    var feels = roundTemp(w.current.apparent);
    var outfit = outfitFor(w);
    var today = w.daily && w.daily[0];
    this.updateHeaderWeather(temp, info.emoji);
    var iconEl = $('#weatherIcon');
    if (iconEl) iconEl.textContent = info.emoji;
    var tempEl = $('#weatherTemp');
    if (tempEl) tempEl.textContent = temp === null ? '--°' : temp + '°';
    var descEl = $('#weatherDesc');
    if (descEl) {
      descEl.textContent = info.label + (feels !== null && feels !== temp ? ' · 体感 ' + feels + '°' : '');
    }
    var outfitEl = $('#weatherOutfit');
    if (outfitEl) {
      outfitEl.textContent = s.weatherOutfit ? outfit.emoji + ' ' + outfit.short : '穿搭推荐已关闭';
    }
    var placeEl = $('#weatherPlace');
    if (placeEl) {
      var range = today && Number.isFinite(today.max) && Number.isFinite(today.min) ? ' · ' + today.min + '° / ' + today.max + '°' : '';
      placeEl.textContent = (w.place || '当前位置') + range + ' · ' + (SOURCE_LABEL[w.source] || '天气') + ' · 更新 ' + fmtTime(w.updatedAt);
    }
    var heroEmoji = document.querySelector('.hero-emoji');
    if (heroEmoji) heroEmoji.textContent = info.emoji;
    this.renderWeatherStatus('当前：' + info.emoji + ' ' + info.label + ' · ' + (temp === null ? '--' : temp + '℃') + ' · ' + (w.place || '当前位置') + '\n' + '穿搭：' + outfit.emoji + ' ' + outfit.title + '（' + outfit.short + '）');
    this.renderWeatherTheme(info.scene);
    if (typeof this.renderDelight === 'function') this.renderDelight();
    if (typeof this.pushWidgetData === 'function') this.pushWidgetData();
  };
  App.renderWeatherTheme = function (scene) {
    var s = Store.settings;
    var style = sceneStyle(scene);
    var root = document.documentElement;
    root.setAttribute('data-weather', s.weatherOn ? scene : 'clear');
    root.setAttribute('data-weather-theme', s.weatherOn && s.weatherTheme ? 'on' : 'off');
    root.style.setProperty('--weather-accent', s.weatherTheme ? style.accent : 'var(--theme)');
    root.style.setProperty('--weather-soft', s.weatherTheme ? style.soft : 'var(--theme-soft)');
    root.style.setProperty('--weather-tint', s.weatherTheme ? style.tint : 'transparent');
  };

  /* ---------------- 天气特效 ---------------- */
  function makeEl(className, styles) {
    var el = document.createElement('span');
    el.className = className;
    Object.keys(styles || {}).forEach(function (key) {
      el.style.setProperty(key, styles[key]);
    });
    return el;
  }
  App.renderWeatherFx = function () {
    var layer = $('#weatherFx');
    var particles = $('#wfParticles');
    var clouds = $('#wfClouds');
    if (!layer || !particles || !clouds) return;
    var s = Store.settings;
    var w = this.weather;
    var scene = s.weatherOn && w && w.current ? codeInfo(w.current.code, w.current.isDay).scene : 'clear';
    var active = !!(s.weatherOn && s.weatherFx && w && w.current);
    var key = active ? scene : 'off';
    layer.hidden = !active;
    layer.setAttribute('data-scene', scene);
    this.renderWeatherTheme(scene);
    if (this._weatherFxKey === key) return;
    this._weatherFxKey = key;
    particles.innerHTML = '';
    clouds.innerHTML = '';
    if (!active) return;
    var addClouds = function addClouds(count) {
      for (var i = 0; i < count; i += 1) {
        var cloud = makeEl('wf-cloud', {
          '--x': (8 + Math.random() * 78).toFixed(1) + '%',
          '--y': (5 + Math.random() * 32).toFixed(1) + '%',
          '--scale': (0.65 + Math.random() * 0.75).toFixed(2),
          '--d': (38 + Math.random() * 26).toFixed(1) + 's',
          '--delay': (-Math.random() * 30).toFixed(1) + 's',
          '--opacity': (0.1 + Math.random() * 0.16).toFixed(2)
        });
        clouds.appendChild(cloud);
      }
    };
    if (scene === 'clear') {
      particles.appendChild(makeEl('wf-sun', {}));
    } else if (scene === 'partly') {
      particles.appendChild(makeEl('wf-sun', {}));
      addClouds(3);
    } else if (scene === 'cloudy') {
      addClouds(5);
    } else if (scene === 'fog') {
      addClouds(2);
      for (var i = 0; i < 4; i += 1) {
        particles.appendChild(makeEl('wf-fog', {
          '--y': (18 + i * 18).toFixed(1) + '%',
          '--d': (26 + i * 7).toFixed(1) + 's',
          '--delay': (-i * 8).toFixed(1) + 's'
        }));
      }
    } else if (scene === 'rain' || scene === 'storm' || scene === 'sleet') {
      addClouds(scene === 'storm' ? 6 : 4);
      var drops = scene === 'storm' ? 76 : 58;
      for (var _i = 0; _i < drops; _i += 1) {
        particles.appendChild(makeEl('wf-drop', {
          '--x': (Math.random() * 100).toFixed(2) + '%',
          '--len': (10 + Math.random() * 18).toFixed(1) + 'px',
          '--d': (0.55 + Math.random() * 0.65).toFixed(2) + 's',
          '--delay': (-Math.random() * 2).toFixed(2) + 's',
          '--opacity': (0.22 + Math.random() * 0.45).toFixed(2)
        }));
      }
      if (scene === 'sleet') {
        for (var _i2 = 0; _i2 < 16; _i2 += 1) {
          particles.appendChild(makeEl('wf-flake', {
            '--x': (Math.random() * 100).toFixed(2) + '%',
            '--size': (8 + Math.random() * 7).toFixed(1) + 'px',
            '--d': (9 + Math.random() * 8).toFixed(1) + 's',
            '--delay': (-Math.random() * 10).toFixed(1) + 's',
            '--drift': (Math.random() * 80 - 40).toFixed(1) + 'px'
          }));
        }
      }
      if (scene === 'storm') {
        particles.appendChild(makeEl('wf-lightning', {}));
      }
    } else if (scene === 'snow') {
      addClouds(3);
      for (var _i3 = 0; _i3 < 38; _i3 += 1) {
        particles.appendChild(makeEl('wf-flake', {
          '--x': (Math.random() * 100).toFixed(2) + '%',
          '--size': (8 + Math.random() * 9).toFixed(1) + 'px',
          '--d': (8 + Math.random() * 10).toFixed(1) + 's',
          '--delay': (-Math.random() * 12).toFixed(1) + 's',
          '--drift': (Math.random() * 120 - 60).toFixed(1) + 'px'
        }));
      }
    }
  };

  /* ---------------- 详情 ---------------- */
  App.showWeatherDetail = function () {
    var self = this;
    var w = this.weather;
    if (!w || !w.current) {
      UI.toast('还没有天气数据，正在为你刷新…');
      this.refreshWeather(true).then(function (data) {
        if (data) self.showWeatherDetail();
      });
      return;
    }
    var info = codeInfo(w.current.code, w.current.isDay);
    var outfit = outfitFor(w);
    var temp = w.current.temp === null ? '--' : w.current.temp;
    var feels = w.current.apparent === null ? '--' : w.current.apparent;
    var today = w.daily && w.daily[0];
    var forecast = (w.daily || []).slice(0, 3).map(function (day) {
      var d = U.parseDate(day.date);
      var dayInfo = codeInfo(day.code, true);
      var dateLabel = d ? d.getMonth() + 1 + '/' + d.getDate() : day.date;
      return '<div class="wd-day">' + '<span class="wd-day-date">' + esc(dateLabel) + '</span>' + '<span class="wd-day-emoji">' + dayInfo.emoji + '</span>' + '<span class="wd-day-temp">' + (day.min === null ? '--' : day.min) + '° / ' + (day.max === null ? '--' : day.max) + '°</span>' + '<span class="wd-day-rain">💧' + (day.rainChance || 0) + '%</span>' + '</div>';
    }).join('');
    var outfitItems = outfit.items.map(function (item) {
      return '<span class="outfit-chip">' + esc(item) + '</span>';
    }).join('');
    UI.showModal('<div class="weather-detail-head">' + '<div class="wd-emoji">' + info.emoji + '</div>' + '<div class="wd-main"><div class="wd-temp">' + temp + '°</div>' + '<div class="wd-label">' + esc(info.label) + ' · 体感 ' + feels + '°</div>' + '<div class="wd-place">' + esc(w.place || '当前位置') + ' · ' + esc(SOURCE_LABEL[w.source] || '天气') + '</div></div>' + '</div>' + '<div class="wd-stats">' + '<div class="wd-stat"><span>湿度</span><strong>' + (w.current.humidity === null ? '--' : w.current.humidity + '%') + '</strong></div>' + '<div class="wd-stat"><span>风速</span><strong>' + (w.current.wind === null ? '--' : w.current.wind + ' km/h') + '</strong></div>' + '<div class="wd-stat"><span>降水</span><strong>' + (w.current.precip ? w.current.precip + ' mm' : '无') + '</strong></div>' + '<div class="wd-stat"><span>温差</span><strong>' + (today && Number.isFinite(today.max) ? today.max - today.min : '--') + '℃</strong></div>' + '</div>' + '<div class="wd-outfit-title">' + outfit.emoji + ' ' + esc(outfit.title) + '</div>' + '<div class="outfit-chips">' + outfitItems + '</div>' + '<div class="wd-tip">' + esc(outfit.tip) + '</div>' + (forecast ? '<div class="wd-forecast-title">未来 3 天</div><div class="wd-forecast">' + forecast + '</div>' : '') + '<div class="modal-actions" style="margin-top:14px">' + '<button type="button" class="btn ghost" data-action="weather-refresh">↻ 刷新</button>' + '<button type="button" class="btn primary" data-action="close">知道啦</button>' + '</div>');
  };

  /* ---------------- 设置页 ---------------- */
  App.renderWeatherSettings = function () {
    var s = Store.settings;
    var map = [['setWeatherOn', !!s.weatherOn], ['setWeatherFx', !!s.weatherFx], ['setWeatherTheme', !!s.weatherTheme], ['setWeatherOutfit', !!s.weatherOutfit]];
    map.forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (el) el.checked = pair[1];
    });
    var mode = $('#setWeatherMode');
    if (mode) mode.value = s.weatherMode || 'auto';
    var city = $('#setWeatherCity');
    if (city && document.activeElement !== city) city.value = s.weatherCity || '';
    var manualTemp = $('#setWeatherManualTemp');
    if (manualTemp && document.activeElement !== manualTemp) manualTemp.value = String(s.weatherManualTemp);
    var manualCode = $('#setWeatherManualCode');
    if (manualCode) manualCode.value = String(s.weatherManualCode || 0);
    var cityRow = $('#weatherCityRow');
    if (cityRow) cityRow.hidden = s.weatherMode !== 'city';
    var manualRow = $('#weatherManualRow');
    if (manualRow) manualRow.hidden = s.weatherMode !== 'manual';
    if (!s.weatherOn) {
      this.renderWeatherStatus('天气同步已关闭');
    } else if (this.weather) {
      var info = codeInfo(this.weather.current.code, this.weather.current.isDay);
      this.renderWeatherStatus('当前：' + info.emoji + ' ' + info.label + ' · ' + this.weather.current.temp + '℃ · ' + (this.weather.place || '当前位置') + '\n更新于 ' + fmtTime(this.weather.updatedAt));
    } else {
      this.renderWeatherStatus('还没有读取天气');
    }
  };
  App.setWeatherMode = function (mode) {
    var self = this;
    return Store.updateSettings({
      weatherMode: mode
    }).then(function () {
      self.renderWeatherSettings();
      if (mode === 'manual') {
        var data = manualWeather();
        self.weatherRequestId += 1;
        self.weatherLoading = false;
        self.weatherPromise = null;
        self.weather = data;
        self.saveWeatherCache(data);
        self.renderWeatherUI();
        self.renderWeatherFx();
        self.renderWeatherSettings();
        UI.toast('已使用手动天气');
      } else {
        self.refreshWeather(true);
      }
    });
  };

  /* ---------------- 事件 ---------------- */
  App.bindWeatherEvents = function () {
    if (this._weatherBound) return;
    this._weatherBound = true;
    var self = this;
    var header = $('#headerWeather');
    if (header) {
      header.addEventListener('click', function () {
        self.showWeatherDetail();
      });
    }
    var card = $('#weatherCard');
    if (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('#weatherRefresh')) return;
        self.showWeatherDetail();
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          self.showWeatherDetail();
        }
      });
    }
    var refresh = $('#weatherRefresh');
    if (refresh) {
      refresh.addEventListener('click', function (e) {
        e.stopPropagation();
        self.refreshWeather(true);
      });
    }
    var switches = [{
      id: 'setWeatherOn',
      key: 'weatherOn',
      after: function after() {
        self.renderWeatherUI();
        self.renderWeatherFx();
      }
    }, {
      id: 'setWeatherFx',
      key: 'weatherFx',
      after: function after() {
        self._weatherFxKey = '';
        self.renderWeatherFx();
      }
    }, {
      id: 'setWeatherTheme',
      key: 'weatherTheme',
      after: function after() {
        self.renderWeatherUI();
      }
    }, {
      id: 'setWeatherOutfit',
      key: 'weatherOutfit',
      after: function after() {
        self.renderWeatherUI();
      }
    }];
    switches.forEach(function (cfg) {
      var el = document.getElementById(cfg.id);
      if (!el) return;
      el.addEventListener('change', function () {
        var patch = {};
        patch[cfg.key] = !!el.checked;
        Store.updateSettings(patch).then(function () {
          if (cfg.after) cfg.after();
          self.renderWeatherSettings();
          UI.toast(el.checked ? '已开启' : '已关闭');
        });
      });
    });
    var mode = $('#setWeatherMode');
    if (mode) {
      mode.addEventListener('change', function () {
        self.setWeatherMode(mode.value);
      });
    }
    var cityBtn = $('#btnWeatherCity');
    var cityInput = $('#setWeatherCity');
    var queryCity = function queryCity() {
      var value = cityInput ? cityInput.value.trim() : '';
      if (!value) {
        UI.toast('请先填写城市名');
        if (cityInput) cityInput.focus();
        return;
      }
      Store.updateSettings({
        weatherCity: value,
        weatherMode: 'city'
      }).then(function () {
        self.renderWeatherSettings();
        return self.refreshWeather(true);
      });
    };
    if (cityBtn) cityBtn.addEventListener('click', queryCity);
    if (cityInput) {
      cityInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') queryCity();
      });
    }
    var manualTemp = $('#setWeatherManualTemp');
    var manualCode = $('#setWeatherManualCode');
    var applyManual = function applyManual() {
      var temp = U.clampInt(manualTemp ? manualTemp.value : 26, -40, 50, 26);
      var code = U.clampInt(manualCode ? manualCode.value : 0, 0, 99, 0);
      Store.updateSettings({
        weatherManualTemp: temp,
        weatherManualCode: code,
        weatherMode: 'manual'
      }).then(function () {
        var data = manualWeather();
        self.weatherRequestId += 1;
        self.weatherLoading = false;
        self.weatherPromise = null;
        self.weather = data;
        self.saveWeatherCache(data);
        self.renderWeatherUI();
        self.renderWeatherFx();
        self.renderWeatherSettings();
        UI.toast('已更新手动天气');
      });
    };
    if (manualTemp) manualTemp.addEventListener('change', applyManual);
    if (manualCode) manualCode.addEventListener('change', applyManual);
    var refreshBtn = $('#btnWeatherRefresh');
    if (refreshBtn) refreshBtn.addEventListener('click', function () {
      self.refreshWeather(true);
    });
    var detailBtn = $('#btnWeatherDetail');
    if (detailBtn) detailBtn.addEventListener('click', function () {
      self.showWeatherDetail();
    });
    var modal = $('#modalCard');
    if (modal) {
      modal.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action="weather-refresh"]');
        if (!btn) return;
        UI.closeModal();
        self.refreshWeather(true);
      });
    }
  };
  App.startWeather = function () {
    this.loadWeatherCache();
    this.bindWeatherEvents();
    this.renderWeatherSettings();
    this.renderWeatherFx();
    if (!Store.settings.weatherOn) return;
    var fresh = this.weather && Date.now() - Number(this.weather.updatedAt || 0) < CACHE_TTL;
    if (!fresh) {
      var self = this;
      setTimeout(function () {
        self.refreshWeather(false);
      }, 600);
    }
  };
})();
/* ============ 天气与穿搭模块结束 ============ */