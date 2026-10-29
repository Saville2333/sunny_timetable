# 太阳神的随身陪伴课程表 · GitHub Pages 部署包

这个文件夹是**可以直接上传到 GitHub Pages 的网站根目录**，不是源码工程。

- `index.html`：网页入口（现代浏览器）
- `index-legacy.html`：旧 WebView / 旧浏览器入口（ES5 版本）
- `download/sunny-timetable-v2.1.0.apk`：Android 安装包
- `js/`、`legacy/`、`icons/`、`app.css`、`manifest.webmanifest`、`sw.js`
- `.nojekyll`：告诉 GitHub Pages 不要用 Jekyll 处理这些文件

---

## 方法一：用 Git 命令部署（推荐）

### 1. 在 GitHub 新建仓库

打开 <https://github.com/new>：

- Repository name：例如 `sunny-timetable`
- 可见性：**Public**（免费账号的 GitHub Pages 需要公开仓库；Pro 可以私有）
- 不要勾选 “Add a README file”
- 点击 **Create repository**

### 2. 进入本文件夹并初始化

在本文件夹打开 PowerShell：

```powershell
cd github-pages
git init
git add .
git commit -m "Deploy 太阳神课程表 to GitHub Pages"
git branch -M main
```

### 3. 关联远程仓库并推送

把下面地址换成你自己的：

```powershell
git remote add origin https://github.com/你的用户名/sunny-timetable.git
git push -u origin main
```

如果第一次推送要求登录：

- 密码处不要填 GitHub 登录密码
- 使用 **Personal Access Token（PAT）**，或者用 GitHub Desktop / Git Credential Manager 登录
- PAT 至少需要 `repo` 权限

### 4. 打开 GitHub Pages

进入仓库 → **Settings** → 左侧 **Pages**：

- Source：**Deploy from a branch**
- Branch：**main**
- Folder：**/ (root)**
- 点击 **Save**

等 1～3 分钟，访问：

```text
https://你的用户名.github.io/sunny-timetable/
```

如果仓库名是 `你的用户名.github.io`，地址就是：

```text
https://你的用户名.github.io/
```

---

## 方法二：用 GitHub 网页上传

1. 新建仓库（同上）。
2. 在仓库首页点击 **Add file → Upload files**。
3. 把本文件夹里的**所有文件和文件夹**拖进去（包括 `.nojekyll`）。
4. 填写提交信息，点击 **Commit changes**。
5. 按上面的方法打开 **Settings → Pages → main / root**。

> Windows 资源管理器默认不显示 `.nojekyll`。如果上传时看不到它，可以在文件夹选项里打开“显示隐藏的项目”，或者直接用 Git 命令上传。

---

## 方法三：GitHub Desktop

1. 安装 GitHub Desktop 并登录。
2. **File → Add local repository**，选择本文件夹。
3. 点 **Publish repository**，取消 “Keep this code private”。
4. 到 GitHub 仓库的 **Settings → Pages** 选择 `main` / root。

---

## 部署后检查

打开：

```text
https://你的用户名.github.io/sunny-timetable/
```

应该能看到「☀️ 太阳神课程表」。

再检查：

```text
https://你的用户名.github.io/sunny-timetable/download/sunny-timetable-v2.1.0.apk
```

手机浏览器会下载 APK；如果提示“文件可能有害”，选择“仍然下载”。安装 APK 前请先卸载旧版（签名不同，不能覆盖安装）。

### PWA / 定位

GitHub Pages 默认是 HTTPS，所以：

- 手机浏览器可以「添加到主屏幕」
- 天气定位权限可以正常请求
- Service Worker 可以正常注册

### 更新网站

修改文件后：

```powershell
git add .
git commit -m "Update timetable"
git push
```

如果网页没有立刻更新：

1. 手机/电脑强制刷新
2. 或在 `sw.js` 里把 `const CACHE = 'sunny-timetable-v3';` 改成 `v4`、`v5`……
3. 再提交推送

---

## 常见问题

### 打开是 404

确认 **Settings → Pages** 里的分支和目录选对了；本包必须让 `index.html` 位于所选目录的根层。

### 样式/JS 404

确认上传时保留了 `js/`、`legacy/`、`icons/` 三个文件夹的层级，不要把它们的内容平铺到根目录。

### APK 下载后无法安装

- 先卸载旧版 2.0.x
- 允许浏览器/文件管理器“安装未知应用”
- 确认下载的是完整的 `.apk`，不是 `.zip`

### 不想公开源码

GitHub Pages 对免费账号通常要求公开仓库。可以只把本部署包放公开仓库；完整源码和 Android 工程放在另一个私有仓库，或使用其他静态托管。

### APK 更新后旧版数据

卸载会清除旧 App 本地数据。如果旧 App 还能打开，先在「小窝 → 课表数据 → 导出备份」备份，再卸载安装新版。
