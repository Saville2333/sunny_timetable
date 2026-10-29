@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8080

where python >nul 2>nul
if %errorlevel%==0 (
  start "" cmd /c "ping 127.0.0.1 -n 2 >nul & start http://127.0.0.1:%PORT%/"
  echo 太阳神课程表已启动：http://127.0.0.1:%PORT%/
  echo 关闭此窗口即可停止本地服务。
  python -m http.server %PORT%
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  start "" cmd /c "ping 127.0.0.1 -n 2 >nul & start http://127.0.0.1:%PORT%/"
  echo 太阳神课程表已启动：http://127.0.0.1:%PORT%/
  py -m http.server %PORT%
  goto :eof
)

echo 未检测到 Python，直接用浏览器打开本地文件。
start "" "index.html"
