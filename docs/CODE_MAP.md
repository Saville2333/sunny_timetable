# 太阳神的随身陪伴课程表 · 代码地图 v2.0

本文按「数据 → 解析 → 界面 → 提醒/天气 → 桌面/APK」的顺序说明各模块职责、关键函数和修改入口。应用没有构建步骤，脚本按 `index.html` 底部的顺序加载，模块之间通过 `window.App*` 单例通信。

## 1. 全局对象

| 全局名 | 来源 | 用途 |
| --- | --- | --- |
| `AppStore` | `store.js` | 设置、课程、自定义提醒、持久化、日期/周次工具 |
| `AppData` | `store.js` | 常量：作息、主题、背景、颜色、星期、提醒重复类型、天气 Key |
| `AppUtils` | `store.js` | `pad2`、`dateKey`、`parseDate`、`addDays`、`clampInt` 等 |
| `App` | `app.js` | 应用主体，所有 UI 模块把方法挂到它上面 |
| `AppUI` | `app.js` | `toast`、`showModal`、`closeModal`、`confirm` |
| `AppHelpers` | `app.js` | `$`、`$$`、`esc`、`fmtClock`、`hexToRgb` |
| `AppImporter` | `importer.js` | `parseAny`、`parseHtml`、`parseText`、`parseJson`、`parsePdf` |
| `PdfLite` | `pdf-lite.js` | `extract(arrayBuffer)`、`detectTable(items)` |
| `wusiStorage/wusiFetch/wusiShare/wusiFile` | 宿主注入（可选） | 无思微程序能力桥接 |

模块加载顺序（`index.html`）：

```text
store → pdf-lite → importer → app → views → delight → editor → import-ui
      → settings → reminders → weather → rhythm → food
```

`app.js` 在 `DOMContentLoaded` 后调用 `App.init()`。`settings.js` 汇总 `App.bindEvents()`；`app.js` 在初始化末尾调用 `startWeather()` 和 `startLife()`。因此新增模块时：

1. 在 `index.html` 中按依赖顺序加 `<script>`
2. 如需初始化，暴露 `App.startXxx()` 并在 `app.js` 的 `init()` 中调用
3. 如需事件绑定，暴露 `App.bindXxxEvents()` 并在 `App.bindEvents()` 中调用

## 2. 数据层 `store.js`

### 设置 `defaultSettings()`

新增设置都集中在这里，`Store.init()` 会把已保存设置合并到默认值上。当前分组：

- 学期：`semesterStart`、`totalWeeks`、`sections`、`showWeekend`
- 主题：`designVersion`、`themeIndex`、`themePreset`（sun/error/water）、`bgId`、`bgColor`、`bgImage`、`autoTheme`、`bgFollowPhase`
- 课程提醒：`remindPreClass/Min`、`remindEndClass/Min`、`remindMeal/Min`、`remindSound`、`remindVibrate`、`remindPopup`
- 天气：`weatherOn`、`weatherMode`、`weatherCity`、`weatherLat/Lon`、`weatherPlace`、`weatherManualCode/Temp`、`weatherFx`、`weatherTheme`、`weatherOutfit`、`weatherUpdatedAt`

修改设置时优先调用：

```js
await Store.updateSettings({ weatherFx: false });
```

`updateSettings()` 会做范围/枚举校验；新增字段建议在这里补校验，避免脏数据。

### 课程模型 `normalizeCourse()`

字段：`id/name/teacher/room/books/note/emoji/day/start/end/weeks/colorIndex/createdAt`。导入与编辑最终都走这里。

### 自定义提醒 `normalizeReminder()`

字段：`id/title/body/emoji/time/repeat/date/weekday/advance/enabled/lastFiredAt/lastFiredKey/createdAt`。

- `repeat`：`none | daily | weekdays | weekly`
- `lastFiredKey`：`YYYY-MM-DD|id`，用于跨重启去重
- `upsertReminder()`、`deleteReminder()`、`markReminderFired()`、`clearReminders()`

### 日期/周次

- `semesterStartDate()`、`weekStartDate(week)`、`weekDates(week)`
- `realWeek()`、`currentWeek()`、`todayDayIndex()`、`todayCourses()`
- `periodTime(section)` 返回默认作息时间

## 3. PDF 解析 `pdf-lite.js`

### 对外接口

```js
const extracted = await PdfLite.extract(arrayBuffer);
const table = PdfLite.detectTable(extracted.pages[0].items);
```

`extract()` 返回：

```js
{
  pageCount, objectCount, itemCount, hasText,
  pages: [{
    index,
    items: [{ text, x, y, w, size, font }],
    lines: [{ y, text, items }],
    text
  }],
  text
}
```

`detectTable(items)` 返回：

```js
{
  days: [1,2,3,...],
  warning: '',
  cells: [{
    day, start, end,
    lines: ['高等数学','张明','教学楼A302','1-16周'],
    text, x, y
  }]
}
```

### 关键实现位置

| 功能 | 函数 |
| --- | --- |
| 内置 inflate | `inflateRaw()`、`readBit()`、`readBits()` |
| 对象扫描/对象流 | `PdfDoc.scan()`、`expandObjectStreams()` |
| 过滤器 | `decodeEntry()`、`streamBytesSync()` |
| 页面/字体 | `pages()`、`pageContent()`、`pageFonts()`、`buildFont()` |
| CMap | `parseToUnicode()` |
| 内容流文字状态 | `extractPageItems()`、`emit()` |
| 行聚类 | `groupRows()`、`itemsToLines()` |
| 表格识别 | `detectTable()` |
| 节次解析 | `sectionRange()` |

### 调整 PDF 识别时的注意事项

- 表头文字一般居中、单元格文字左对齐，所以第一列边界用「表头首列右边缘 + 第一列左边缘」的中点计算；不要简单用 `cols[0].center - 固定值`。
- 节次标签可能在单元格底部/中部，`detectTable()` 的行带上下边界留了 `lineH * 1.8` 的余量；若遇到特殊版式，优先调 `bands` 的 top/bottom。
- 时间列（`08:00-09:40`）和「1-16周」必须先排除，否则会被误读成节次；相关逻辑在 `sectionRange()`。
- 没有节次列时，`autoSections` 按文字行的垂直间距分组，不会把同一单元格的 4 行拆成 4 节。

## 4. 导入 `importer.js` / `import-ui.js`

### `importer.js`

| 方法 | 用途 |
| --- | --- |
| `parseAny(text)` | 自动判断 JSON / HTML / 文本 |
| `parseHtml(html)` | 找最大表格、识别星期表头、按单元格解析 |
| `parseText(text)` | 管道行、自由文本、多行块 |
| `parseJson(text)` | 数组 / `{courses}` / `{list}` |
| `parsePdf(extraction)` | 遍历 pages → `detectTable` → `parsePdfCells`，失败退回文本 |
| `parsePdfCells(cells)` | 单元格上下文（day/start/end）+ `parseBlock` → 课程 |

`parsePdf()` 的 `warnings` 会显示在预览弹窗顶部。

### `import-ui.js`

- `App.showImportPreview(result, label)`：所有导入方式的统一预览
- `App.confirmImport(mode)`：`merge` / `replace`
- `App.handlePdfFile(file)`：格式/大小校验 → `%PDF` 文件头 → `PdfLite.extract` → `Importer.parsePdf` → 预览
- 拖拽/点击事件在 `App.bindImportEvents()`

增加新的导入格式时，只要构造 `{ courses, warnings, meta }` 并调用 `showImportPreview` 即可复用预览/合并/替换流程。

## 5. 提醒 `rhythm.js` / `reminders.js`

### 课程提醒 `rhythm.js`

- `App.todayReminders(now)`：生成当天的课前/下课/外卖提醒，含 `at`、`until`、`enabled`
- `App.reminderTick()`：每 15 秒检查一次；先检查自定义提醒，再处理「稍后 5 分钟」，最后处理课程提醒
- `App.presentReminder(item, isRepeat)`：按 `remindPopup` 选择弹窗或横幅
- `App.showReminderPopup()` / `App.closeReminderPopup()`：底部弹窗
- `App.presentBannerReminder()`：旧横幅
- `App.snoozeReminder()`：写入 `pendingRepeats`，5 分钟后再次提示
- `App.renderReminderPlan()`：今日页提醒时间表
- 日志：`wusi_reminder_log_v1`，按天清理

弹窗打开时 `reminderTick()` 会直接返回，避免叠层；关闭后下一轮继续。这个判断在 `reminderTick()` 顶部。

### 自定义提醒 `reminders.js`

- `occurrenceFor(rem, now)`：未来 21 天内下一次触发时间
- `App.renderCustomReminders()`：设置页列表
- `App.openReminderEditor(id)` / `App.saveReminderForm(id)`：编辑弹层
- `App.checkCustomReminders(now)`：判断今天是否到点、去重、调用 `presentReminder`
- `App.bindReminderEvents()`：列表按钮/弹层事件

新增提醒类型时，改 `occursOn()`、`repeatText()` 和编辑器里的 `repeats` 选项即可。

## 6. 天气 `weather.js`

### 数据流

```text
startWeather()
  ├─ loadWeatherCache() → 立即渲染缓存
  ├─ bindWeatherEvents()
  └─ 缓存过期 → refreshWeather()

refreshWeather(showToast)
  ├─ manual → manualWeather()
  └─ auto/city → resolveWeatherPlace()
        → getPosition() / geocodeCity() / ipLocate() / 上次坐标 / 默认
     → fetchForecast(place)
     → normalize current + daily
     → saveWeatherCache()
     → renderWeatherUI() / renderWeatherFx()
```

### 关键常量

- `WEATHER_INFO`：WMO code → 中文文案、场景、昼夜 emoji
- `SCENE_STYLE`：场景 → 主题色/柔和色/色调
- `CACHE_TTL`：30 分钟
- `DEFAULT_LOCATION`：广州（仅在所有兜底失败时使用）

### 关键函数

| 函数 | 用途 |
| --- | --- |
| `fetchJson(url, timeout)` | `wusiFetch` 优先，失败回退原生 `fetch`；带超时 |
| `getPosition()` | Geolocation Promise 化 |
| `geocodeCity(city)` | Open-Meteo Geocoding |
| `ipLocate()` | `ipwho.is` 网络定位 |
| `fetchForecast(place)` | Open-Meteo forecast |
| `manualWeather()` | 无网络时的手动天气对象 |
| `outfitFor(weather)` | 穿搭规则；返回 `title/short/items/tip` |
| `shortOutfit()` | 今日卡片一行摘要（含带伞/防滑/防风） |
| `App.renderWeatherUI()` | 顶栏、今日卡片、设置状态 |
| `App.renderWeatherFx()` | 生成雨滴/雪花/云/雾/阳光/闪电 |
| `App.renderWeatherTheme()` | 设置 `data-weather` 与 CSS 变量 |
| `App.showWeatherDetail()` | 天气详情 + 3 天预报 + 穿搭 |
| `App.renderWeatherSettings()` | 设置页回填 |
| `App.bindWeatherEvents()` | 天气相关事件 |

### 扩展天气源

如果宿主提供原生天气 API（例如 `window.wusiWeather`），可在 `refreshWeather()` 的 `task` 分支里加一个 `platformWeather()`，返回与 `fetchForecast()` 相同结构的对象即可；`renderWeatherUI()` 与特效层不需要改。

### 扩展穿搭规则

只改 `outfitFor()` 的温度分段与附加条件。建议保持 `items` 为字符串数组，`short` 由 `shortOutfit()` 统一生成，详情弹窗与今日卡片会自动复用。

## 7. 样式与界面

- `index.html`：结构；新增节点包括
  - `#weatherFx` / `#wfParticles` / `#wfClouds`
  - `#headerWeather`、`#weatherCard`、`#weatherPlace`
  - `#reminderPopup`
  - `#pdfDrop` / `#pdfFileInput` / `#pdfStatus`
  - 设置页 `#customReminderList`、`#setWeather*`
- `app.css`：新增样式集中在文件末尾 `天气 / 提醒弹窗 / PDF 导入（v1.1 新增）` 段
- 全局 `[hidden] { display:none !important; }`：避免 `.hero-next`、`.setting-row` 的 `display:flex` 覆盖 `hidden`

移动端适配建议在 390px 宽度下检查：

- 顶栏标题与右侧天气胶囊不重叠
- 天气来源下拉框能完整显示「手动天气」
- 提醒弹窗按钮不超出底部安全区
- PDF 面板在「导入」页可滚动到

## 8. 测试与 fixture

- `test/generate_pdf.py`：生成带 ToUnicode 的最小 PDF；`--no-section` 生成无节次列版本
- `test/pdf-smoke.mjs`：文字提取 + `detectTable` 输出
- `test/pdf-import.mjs`：PDF → 课程完整链路
- `test/dom-smoke.mjs`：linkedom 下的完整应用回归（天气、提醒、PDF 预览/导入）
- `test/screenshot.mjs` / `test/mobile-shot.mjs`：截图脚本（需要本机 Chrome；mobile-shot 用 CDP 模拟 390px 视口）

`test/README.md` 记录测试依赖与运行方式。

## 9. 品牌预设与一天四变（v2.0）

### 数据

`store.js` 中：

- `THEMES`：10 个主题卡。前 8 个原水色，最后两个是 `{ preset: 'sun' }` / `{ preset: 'error' }`。
- `PRESETS`：三套品牌元数据 `sun / error / water`，包含名称、emoji、默认背景、主题索引、是否暗色。
- `PRESET_PHASES`：太阳神/错误文档各自的 `dawn/noon/afternoon/night` 变体。
- `phaseOf(date, preset)`：先按真实时间找基础 phase，再合并 preset 变体。

### 应用

`app.js`：

- `activePreset()`：优先读 `settings.themePreset`，否则从 `THEMES[themeIndex].preset` 推断。
- `applyTheme()`：设置 `--theme*`、`data-preset`、`data-phase`、`data-phase-auto`、`data-preset-dark`。
- `applyBackground()`：`themePreset==='error'` 时强制暗底；`bgId==='aqua'` 时自动换成预设背景。
- `updatePhaseLabel()`：显示「预设 + 时段」。
- `renderDelight()`：猫猫播报。

`settings.js`：

- `renderThemeGrid()`：渲染普通色卡 + 两个 `is-special` 预设卡。
- 点击预设卡：`themeIndex + autoTheme:true + bgFollowPhase:true + bgId=sun/error`，即「一天四变 + 天气变形」。
- `renderPhaseSettings()`：按当前预设渲染四变卡片与说明。
- 主题选择器与阶段选择器都用 `D.phaseOf(new Date(), preset)`。

`app.css`：

- `html[data-preset="sun"]`：白黄、太阳光、太阳顶栏、太阳卡片。
- `html[data-preset="error"]`：黑蓝、深色卡片、输入框、弹窗、课程块、错误文档印章。
- `data-weather` 与 `data-preset` 组合出雨天/雷暴变体。
- `@media (min-width:1024px)`：桌面双栏。

## 10. 猫猫 / 颜文字 `delight.js`

- 数据：`CATS`、`KAOMOJI`、`SUN_WORDS`、`ERROR_WORDS`、`RAIN_WORDS`、`NO_CLASS_WORDS`
- `App.renderDelight()`：根据 preset、phase、天气码、今日课程数、昵称生成稳定种子，更新
  - `#catWhisperCat` / `#catWhisperKao` / `#catWhisperText` / `#catWhisperBadge`
  - `#heroStamp`
  - `html[data-mood]`
- `App.cycleCatWhisper()`：点击猫猫卡轮换颜文字
- `App.bindDelightEvents()`：在 `App.bindEvents()` 中绑定

增加文案/猫猫/颜文字：直接改数组即可；`seed` 保证同一天内不频繁跳变。

## 11. 桌面 / PWA / APK

### 桌面

- `app.css` 的 `@media (min-width:1024px)`：内容最大宽 1180，今日/设置/导入双栏，课表字号增大，鼠标 hover。
- `启动电脑版.bat`：优先启动 Python `http.server` 并打开浏览器，找不到 Python 时直接打开 `index.html`。
- `manifest.webmanifest` + `sw.js`：Chrome/Edge 可安装为独立窗口 PWA，支持离线缓存。
- `app.js` 末尾注册 Service Worker，仅 `http(s)` 生效。

### APK

- 工程：`android/`
- 入口：`android/src/com/sunny/timetable/MainActivity.java`
- 资源：构建时从 `xinghai-timetable/` 复制到 `android/assets/`
- 构建：`android/build-apk.ps1`（aapt2 → javac → d8 → zipalign → apksigner）
- 关键 WebView 配置：
  - `setJavaScriptEnabled` / `setDomStorageEnabled`
  - `setAllowFileAccess` / `setAllowContentAccess`
  - `setGeolocationEnabled`
  - `onShowFileChooser` → 系统 SAF 文件选择器（PDF 导入）
  - `onGeolocationPermissionsShowPrompt` → 运行时定位权限
- 输出：`dist/太阳神的随身陪伴课程表-v2.1.0.apk`

若要上架或长期分发，请在 `build-apk.ps1` 中替换 `sunny.keystore` 为自己的发布证书，并修改 `applicationId` / 版本号。

## 13. 桌面小组件与 legacy 页面（v2.1.0）

- `js/widget.js`：把今日课程、当前/下一节课、天气整理成 JSON，通过 `window.SunnyWidget.updateWidget(json)` 交给 Android。
- `android/src/com/sunny/timetable/MainActivity.java`：注册 `SunnyWidget` JS 桥；加载 `file:///android_asset/index-legacy.html`。
- `android/src/com/sunny/timetable/SunnyWidgetProvider.java`：读取 SharedPreferences，按小组件宽高选择 `widget_small/widget_medium/widget_large`，计算当前/下一节课。
- `android/res/xml/sunny_widget_info.xml`：2x2 初始、可横向/纵向调整到 4x2 / 4x4。
- `android/res/layout/widget_*.xml`：三种尺寸布局；`widget_row.xml` 是课程行。
- `xinghai-timetable/legacy/`：Babel 从 `js/` 转译的 ES5 脚本；`index-legacy.html` 是 APK/旧浏览器入口，不再用 async 语法检查。
- 重新生成 legacy：

```powershell
node .babel-node\node_modules\@babel\cli\bin\babel.js xinghai-timetable\js --out-dir xinghai-timetable\legacy --config-file .babel-node\babel.config.json
```

- APK：`versionCode 20100 / versionName 2.1.0 / minSdk 21`，签名使用 `android/build/sunny.keystore`。

