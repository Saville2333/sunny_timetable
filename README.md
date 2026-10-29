# 太阳神的随身陪伴课程表 · v2.2.0

> ☀️ 太阳神、猫猫、颜文字和一点点错误文档，一起陪你上课。

这是一个纯前端大学生课表应用。原「星海课表 V1.0.0.2」源码已完整保留在 `_original/`，本目录是可继续开发的新版本。

## 1. 这次做了什么

- **改名 / 重做品牌**：全站改为「太阳神的随身陪伴课程表」，页面标题、顶栏、底部导航、关于页、空状态、提示文案全部更新。
- **太阳神元素**：漂浮太阳、旋转光芒、太阳印章、太阳主题卡、太阳按钮、猫咪太阳图标。
- **❌️⚠️ 错误文档元素**：错误文档黑蓝主题、`⚠️ ERROR DOC` 印章、错误日志文案、警告/叉号漂浮符号。
- **颜文字与小猫**：猫猫播报卡、多种猫猫 emoji、12 组颜文字轮换、点击猫猫换一条；空状态、课表提示、吃饭转盘也加入了猫猫/颜文字。
- **主题预设**：UI 颜色自选中新增
  - ☀️ **太阳神 · 白黄**
  - ⚠️ **错误文档 · 黑蓝**
  - 点预设卡会自动开启「一天四变」；普通色块仍可手动选色。
- **完整一天四变**：太阳神/错误文档各自有清晨、正午、下午、夜晚四套颜色、背景、氛围和文案；每天按真实时间自动切换。
- **天气变形**：雨、雪、雾、云、晴、雷暴会改变背景、今日卡片、全屏粒子与主题色调；太阳神/错误文档都有独立雨天/雷暴样式。
- **电脑端**：响应式宽屏布局（≥1024px），今日页双栏、设置页双栏、导入页双栏；支持鼠标悬停；提供 PWA 安装和「启动电脑版.bat」。
- **Android APK**：内置完整 WebView 容器，离线加载 assets；支持系统文件选择器导入 PDF 课表、定位权限、天气网络请求；带小/中/大三种桌面小组件。
- **旧手机兼容**：APK 默认加载 Babel 转译的 ES5 页面，避免旧 WebView 不支持 `async/await` 导致白屏；同时保留启动失败提示。
- **作息与计划**：每节课上下课时间/时长可编辑，支持早/晚自习、假期/考试倒计时、今日待办与下课后作业弹窗。
- **小程序合集**：原来吃啥转盘移入第三页，新增课程笔记（照片/字体颜色/分割线）、番茄钟、随机决定。
- **体验增强**：卡片透明度可调；APK 内可以直接打开教务系统网址，右下角「检测课表」自动回传页面导入。
- **保留并增强原功能**：课程表、今日、吃饭转盘、教务网页/粘贴/JSON/PDF 导入、课程编辑、提醒、天气穿搭、备份导入导出。

## 2. 直接使用

### 电脑浏览器

```powershell
cd xinghai-timetable
python -m http.server 8080
```

打开 `http://127.0.0.1:8080/`。也可以双击 `启动电脑版.bat`（自动尝试 Python 本地服务，失败则直接打开 `index.html`）。

Chrome / Edge 地址栏右侧会出现「安装」按钮（PWA），安装后可以像桌面应用一样打开。

### Android APK

直接安装：

```text
dist/太阳神的随身陪伴课程表-v2.2.0.apk
```

安装时允许「安装未知来源应用」。APK 已使用本地调试证书签名，适合个人使用；如果要上架应用商店，请用自己的发布证书重新签名。

APK 功能：

- 自动加载内置 Web 资源，无需联网安装
- 「收课表 → PDF 课表检测导入」调用 Android 文件选择器，选 PDF 后直接解析并预览
- 首次使用天气会请求定位权限；拒绝后自动回退到城市/IP/手动天气
- 支持系统返回键、屏幕旋转、WebView DOM 存储（课表保存在本机）
- **桌面小组件**：长按桌面 → 小组件 → 「太阳神课程表」；支持小/中/大三档尺寸
  - 小：天气 + 当前/下节课 + 上课/下课时间 + 地点
  - 中：天气 + 下节课 + 今日 2 节课程
  - 大：天气 + 下节课 + 今日最多 6 节课程
  - 点击卡片打开 App；点击「↻ 刷新」重新读取已同步数据

> APK 使用 `file:///android_asset/index-legacy.html` 加载（Babel 转译的 ES5 版本）；网页版仍使用 `index.html`，旧浏览器会自动跳转到 `index-legacy.html`。
> 如果学校教务系统导出的 PDF 是扫描件（没有文字层），仍需先 OCR；这是 PDF 本身的限制。

## 3. 主题系统

### 太阳神 · 白黄

- 主色：`#f0a30a`，深色 `#b96b00`，柔和 `#fff3cf`
- 背景：奶油白 → 蜂蜜黄
- 四变：金晨 → 烈日 → 斜阳 → 星夜（夜晚顶栏转深，内容保留暖黄）
- 雨天：保留白黄，同时压低饱和度并加入雨丝

### 错误文档 · 黑蓝

- 主色：`#4c8dff`，深色 `#1746b3`
- 背景：近黑 → 深蓝
- 四变：蓝屏清晨 → 正午告警 → 修补午后 → 夜间错误
- 雨天/雷暴：蓝黑背景 + 蓝色告警光 + 闪烁边框
- 所有卡片、输入框、弹窗、课程块都有深色版本，不是简单地换一个 accent 色

实现位置：

- `js/store.js`：`THEMES`、`PRESETS`、`PRESET_PHASES`、`phaseOf(date, preset)`
- `js/app.js`：`activePreset()`、`applyTheme()`、`applyBackground()`
- `js/settings.js`：预设卡、一天四变设置、天气设置
- `app.css`：`html[data-preset="sun"]` / `html[data-preset="error"]` 全套样式

### 一天四变 & 天气变形

时段由 `D.phaseOf(new Date(), preset)` 计算，每 30 秒检查一次。每个预设都定义了：

```js
{
  dawn, noon, afternoon, night: {
    emoji, label, mood, theme, bg, veil
  }
}
```

天气由 `weather.js` 映射为 `clear/partly/cloudy/fog/rain/storm/snow/sleet`，通过 `data-weather` 驱动雨滴、雪花、云、雾、阳光、雷电和今日卡片雨丝。天气主题色可以在设置里关闭，不影响天气文字与穿搭推荐。

## 4. 猫猫 / 颜文字

`js/delight.js` 负责：

- 根据预设、时段、天气、今日课程数和昵称生成稳定但每天变化的猫猫播报
- 12 组颜文字：`(=^･ω･^=)`、`ฅ^•ﻌ•^ฅ`、`(๑•̀ㅂ•́)و✧`、`₍˄·͈༝·͈˄*₎◞ ̑̑` 等
- 点击「猫猫播报」卡片可换一条
- 更新 `#heroStamp`（`☀️ SUN MODE` / `⚠️ ERROR DOC`）和全局 `data-mood`

## 5. PDF 课表导入

`pdf-lite.js` 是零依赖 PDF 文字/版面解析内核：

1. 扫描 PDF 对象、展开对象流
2. 解压 Flate/ASCIIHex/ASCII85/RunLength
3. ToUnicode、Differences、GBK/Big5 还原中文
4. 解析文字矩阵，输出带坐标的文字片段
5. 按「星期」表头与节次列切分单元格
6. `importer.parsePdf()` 把单元格解析成课程
7. 识别失败时退回整页文本，并在预览中警告

支持真实 Chrome 打印 PDF、嵌入 CID 字体、多页 PDF。扫描件没有文字层，会提示 OCR。

## 6. 提醒

- 课程前 / 快下课 / 外卖提醒：默认底部弹窗，可切横幅
- 自定义提醒：单次、每天、工作日、每周，提前 5～60 分钟
- 每条提醒按天去重；自定义提醒额外保存 `lastFiredKey`，跨重启不重复
- App 在前台时生效；WebView / 浏览器后台不执行提醒

## 7. 目录

```text
xinghai-timetable/
├─ index.html                 页面结构
├─ app.css                    全部样式（含太阳神/错误文档/桌面/PWA）
├─ manifest.webmanifest       PWA 安装清单
├─ sw.js                      PWA 离线缓存
├─ 启动电脑版.bat             Windows 本地启动器
├─ icons/                     PWA / APK 图标
├─ js/
│  ├─ store.js                数据层、主题预设、一天四变
│  ├─ pdf-lite.js             PDF 解析内核
│  ├─ importer.js             文本/HTML/JSON/PDF → 课程
│  ├─ app.js                  初始化、主题、背景、模态
│  ├─ views.js                课表/今日/周次/详情
│  ├─ delight.js              猫猫、颜文字、氛围文案
│  ├─ editor.js               课程编辑
│  ├─ import-ui.js            导入页 + PDF 选择/预览
│  ├─ settings.js             设置、主题、数据备份
│  ├─ reminders.js            自定义提醒
│  ├─ weather.js              定位/天气/特效/穿搭
│  ├─ rhythm.js               时段与提醒引擎
│  └─ food.js                 吃饭转盘
├─ docs/CODE_MAP.md           代码地图与扩展指南
└─ test/                      本地测试、fixture、截图（不进入发布包）

android/                      APK 工程源码（WebView 容器）
dist/                         构建产物
```

## 8. 构建 APK

环境：JDK 8+（本项目用 JDK 25 编译通过）、Android SDK build-tools 35、platform 35。

`android/` 里是**不依赖 Gradle**的最小工程，构建脚本见 `android/build-apk.ps1`：

```powershell
powershell -ExecutionPolicy Bypass -File android/build-apk.ps1
```

脚本会：

1. 复制 `xinghai-timetable` 到 `android/assets`
2. `aapt2 compile` + `aapt2 link` 生成资源 APK
3. `javac` + `d8` 生成 `classes.dex`
4. `zipalign` + `apksigner` 签名
5. 输出到 `dist/太阳神的随身陪伴课程表-v2.2.0.apk`

APK 的 `MainActivity` 重点处理：

- `WebSettings`：JS、DOM Storage、文件访问、定位
- `WebChromeClient.onShowFileChooser`：PDF 文件选择
- `onGeolocationPermissionsShowPrompt`：定位运行时权限
- `onBackPressed`：返回键优先关闭 WebView 历史，再退出
- `assets/index.html`：离线静态资源

## 9. 测试

```powershell
python test/generate_pdf.py
python test/generate_pdf.py --no-section
node test/pdf-smoke.mjs
node test/pdf-smoke.mjs test/fixtures/chrome-timetable.pdf
node test/pdf-import.mjs test/fixtures/chrome-timetable.pdf
node test/dom-smoke.mjs
```

截屏（需本机 Chrome）：

```powershell
node test/screenshot.mjs      # 500px
node test/mobile-shot.mjs     # 390px 手机视口
node test/desktop-shot.mjs    # 1280px 电脑视口
```

已验证：

- 自建中文 PDF：15 个单元格 → 15 门课程
- Chrome 打印 PDF：15 个单元格 → 15 门课程
- DOM 回归：主题/天气/弹窗/自定义提醒/PDF 预览/导入
- 390px 与 1280px 真实浏览器截图
- APK：`aapt2 dump badging` 与 `apksigner verify` 通过

## 10. 已知边界

- **后台推送**：纯 WebView / 浏览器在 App 进入后台后不执行提醒；需要原生通知能力才能后台推送。
- **扫描件 PDF**：没有文字层，前端无法直接识别，需要 OCR。
- **定位**：首次会请求系统定位权限；拒绝后使用城市/IP/上次坐标/手动天气。
- **天气服务**：使用 Open-Meteo，需要网络；国内网络无法访问时可切到「手动天气」。
- **APK 签名**：当前使用本地调试证书，适合个人安装；上架请换发布证书。
- **应用商店**：没有上架，也不包含任何账号/云端同步。

## 11. 继续开发

- 课程提醒：`js/rhythm.js` 的 `todayReminders()`
- 自定义提醒：`js/reminders.js` 的 `checkCustomReminders()`
- 主题预设：`js/store.js` 的 `PRESETS`、`PRESET_PHASES`
- 猫猫文案：`js/delight.js` 的 `SUN_WORDS / ERROR_WORDS / KAOMOJI`
- PDF 版面：`js/pdf-lite.js` 的 `detectTable()`
- Android 容器：`android/src/com/sunny/timetable/MainActivity.java`
- 详细代码地图：[`docs/CODE_MAP.md`](docs/CODE_MAP.md)

## 12. 原版与版本

- v2.2.0：可编辑上下课时间/课时长度、早/晚自习、假期与考试倒计时、今日待办与下课作业弹窗、小程序合集（吃什么/课程笔记/番茄钟/随机决定）、卡片透明度、App 内教务浏览器与「检测课表」；APK versionCode 20200。
- v2.1.0：增加 Android 桌面小组件（小/中/大）；APK 改用 Babel ES5 legacy 页面，修复旧 WebView 的 async/await 白屏；Android 5–7 兼容修复。
- v2.0.0：太阳神/错误文档品牌、预设、一天四变、天气变形、猫猫/颜文字、电脑宽屏、PWA、APK。
- v1.1.0：提醒弹窗、自定义提醒、PDF 导入、天气/特效/穿搭。
- v1.0.0.2：原始「星海课表」课程表、今日、吃饭转盘、导入、设置、时段配色、课程提醒。



