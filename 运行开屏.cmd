@echo off
chcp 65001 >nul
setlocal

rem 双击我即可：先校验 WorkBuddy 是否已完全退出，再启动它并注入开屏。
rem 全部逻辑在 Start-WorkBuddySplash.ps1，这里只做入口。

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-WorkBuddySplash.ps1" %*

echo.
if errorlevel 1 (
  echo 上面有失败原因。日志在同目录 last-run.log。
) else (
  echo 完成。开屏应该在 WorkBuddy 窗口里播放，点击或按 Esc 可以跳过。
)
echo.
pause
