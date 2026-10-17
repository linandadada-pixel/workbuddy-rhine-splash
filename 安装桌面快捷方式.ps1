#Requires -Version 5.1
<#
.SYNOPSIS
    在桌面创建「WorkBuddy 莱茵开屏」快捷方式。

.DESCRIPTION
    快捷方式做的事：双击 → 自动关掉正在运行的 WorkBuddy → 带 CDP 端口重开 → 在它自己的
    窗口里播开屏 → 播完正常使用。

    不写注册表、不动 WorkBuddy 安装目录、不替换任何现有快捷方式（纯新增）。

.PARAMETER Uninstall
    删除本快捷方式（不动其它任何图标）。

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\安装桌面快捷方式.ps1
    powershell -ExecutionPolicy Bypass -File .\安装桌面快捷方式.ps1 -Uninstall
#>
[CmdletBinding()]
param([switch]$Uninstall)

$ErrorActionPreference = 'Stop'
$launcher = Join-Path $PSScriptRoot 'Start-WorkBuddySplash.ps1'
$icon = Join-Path $PSScriptRoot 'assets\splash.ico'
$desktop = [Environment]::GetFolderPath('Desktop')
$linkPath = Join-Path $desktop 'WorkBuddy 莱茵开屏.lnk'

if ($Uninstall) {
    if (Test-Path -LiteralPath $linkPath) {
        Remove-Item -LiteralPath $linkPath -Force
        Write-Host "已删除: $linkPath" -ForegroundColor Green
    } else {
        Write-Host '没有找到本快捷方式。' -ForegroundColor Yellow
    }
    exit 0
}

if (-not (Test-Path -LiteralPath $launcher)) { throw "找不到启动器: $launcher" }

$exe = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
if (-not (Test-Path -LiteralPath $exe)) { $exe = 'powershell.exe' }

# -Restart：已经开着就先关掉再重开；-Popup：隐藏控制台时用弹窗报告失败。
$arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcher`" -Restart -Popup"

$shell = New-Object -ComObject WScript.Shell
$lnk = $shell.CreateShortcut($linkPath)
$lnk.TargetPath = $exe
$lnk.Arguments = $arguments
$lnk.WorkingDirectory = $PSScriptRoot
$lnk.Description = '重启 WorkBuddy 并在它自己的窗口里播放莱茵生命开屏'
$lnk.WindowStyle = 7   # 最小化启动，避免黑框闪一下
if (Test-Path -LiteralPath $icon) { $lnk.IconLocation = "$icon,0" }
$lnk.Save()

Write-Host ''
Write-Host "已创建: $linkPath" -ForegroundColor Green
Write-Host '用法  : 直接双击。它会先把 WorkBuddy 关掉，再带开屏重新打开。' -ForegroundColor Cyan
Write-Host '注意  : 关掉 WorkBuddy 会中断当前正在跑的对话，确认没在跑长任务再点。' -ForegroundColor Yellow
Write-Host '移除  : 运行本脚本加 -Uninstall' -ForegroundColor DarkGray
