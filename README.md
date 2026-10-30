# 太阳神的随身陪伴课程表 · GitHub Pages 部署包

这个文件夹是**可以直接上传到 GitHub Pages 的网站根目录**，不是源码工程。

- `index.html`：网页入口（现代浏览器）
- `index-legacy.html`：旧 WebView / 旧浏览器入口（ES5 版本）
- `download/sunny-timetable-v2.4.0.apk`：Android 安装包
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
git init
git add .
git commit -m "Deploy 太阳神课程表 to GitHub Pages"
git branch -M main
```

### 3. 关联远程仓库并推送

```powershell
git remote add origin https://github.com/你的用户名/sunny-timetable.git
git push -u origin main
```

第一次推送如果要求登录：

- 密码处不要填 GitHub 登录密码
- 使用 **Personal Access Token（PAT）**，或 GitHub Desktop / Git Credential Manager
- PAT 至少需要 `repo` 权限

### 4. 打开 GitHub Pages

仓库 → **Settings** → 左侧 **Pages**：

- Source：**Deploy from a branch**
- Branch：**main**
- Folder：**/ (root)**
- Save

等 1–3 分钟，访问：

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
2. 仓库首页 **Add file → Upload files**。
3. 把本文件夹里的**所有文件和文件夹**拖进去（包括 `.nojekyll`）。
4. Commit changes。
5. Settings → Pages → `main` / `/ (root)` → Save。

> 不要把外层 `github-pages` 文件夹整个上传。`index.html` 必须位于仓库根目录，否则网址会多一层 `/github-pages/`。

`.nojekyll` 是隐藏文件。如果上传时看不到它，可以在仓库里用 **Add file → Create new file** 新建一个空文件，文件名填写 `.nojekyll` 并提交。

---

## 方法三：GitHub Desktop

1. 安装 GitHub Desktop 并登录。
2. **File → Add local repository**，选择本文件夹。
3. **Publish repository**，取消 “Keep this code private”。
4. GitHub 仓库 → Settings → Pages → `main` / root。

---

## 部署后检查

网页：

```text
https://你的用户名.github.io/sunny-timetable/
```

APK 直链：

```text
https://你的用户名.github.io/sunny-timetable/download/sunny-timetable-v2.4.0.apk
```

页面「小窝」里也有「📥 下载 APK」按钮。

### 注意

- 免费 GitHub Pages 一般需要 **Public 仓库**。
- GitHub Pages 默认 HTTPS，PWA、定位天气、Service Worker 都可以正常工作。
- 课表数据仍只保存在浏览器/手机本地，不会上传到 GitHub。
- APK 安装前请**先卸载旧版 2.0.x**（签名不同，不能覆盖安装）；2.1.0 → 2.4.0 可直接覆盖。

---

## 更新网站

```powershell
git add .
git commit -m "Update timetable"
git push
```

如果手机/电脑还显示旧页面：

1. 强制刷新
2. 或把 `sw.js` 里的 `const CACHE = 'sunny-timetable-v6';` 改成 `v5`
3. 再提交推送

---

## 常见问题

**打开 404**

检查 Settings → Pages 的分支和目录是否选对；`index.html` 必须在所选目录根层。

**样式或 JS 404**

确认仓库根目录有 `js/`、`legacy/`、`icons/`、`download/`，并且保留目录层级。

**APK 下载后不能安装**

- 先卸载旧版 2.0.x
- 允许浏览器/文件管理器安装未知应用
- 确认下载的是完整 `.apk`，不是 ZIP

**想绑定自己的域名**

Settings → Pages → Custom domain，填入域名，再按 GitHub 提示配置 DNS 的 `CNAME` 记录。





