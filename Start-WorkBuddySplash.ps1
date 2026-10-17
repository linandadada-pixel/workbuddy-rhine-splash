#Requires -Version 5.1
<#
.SYNOPSIS
    在 WorkBuddy 自己的窗口里，于首帧之前注入莱茵生命开屏。

.DESCRIPTION
    走的不是"另开一个窗口播动画"，而是 WorkBuddy 官方留的 CDP 开关：
    环境变量 WORKBUDDY_REMOTE_DEBUGGING_PORT —— 主进程读到后会
    appendSwitch('remote-debugging-port') 并自动配好 remote-allow-origins。

    注入时机是关键，分两手：
      1) Page.addScriptToEvaluateOnNewDocument  —— 覆盖后续文档（reload / 二次加载）
      2) Runtime.evaluate 立即注入              —— 覆盖当前文档
    两者都在渲染进程"还没画完"的时候发生，所以开屏是铺在 WorkBuddy 自己的
    首帧上的，不是事后盖上去的一层。

.PARAMETER Probe
    只注入一块纯色遮罩 + 计时文字，用来验证链路和量时序，不加载 124KB 的正式载荷。

.PARAMETER Force
    WorkBuddy 已在运行时也照跑（单实例会转给已有进程，通常拿不到端口；仅供排查）。

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\Start-WorkBuddySplash.ps1 -DryRun
    powershell -ExecutionPolicy Bypass -File .\Start-WorkBuddySplash.ps1 -Probe
    powershell -ExecutionPolicy Bypass -File .\Start-WorkBuddySplash.ps1
#>
[CmdletBinding()]
param(
    [int]$Port = 9335,
    [string]$WorkBuddyExe,
    [string]$Payload,
    [switch]$Probe,
    [switch]$DryRun,
    [switch]$Force,
    # 自动关掉正在运行的 WorkBuddy 再带 CDP 重开（桌面快捷方式用的就是这个）
    [switch]$Restart,
    # 硬失败时弹 Windows 消息框（快捷方式是隐藏控制台启动的，不弹就什么都看不到）
    [switch]$Popup,
    # 只连接已有的 CDP 端口，不启动 WorkBuddy。用于重播开屏，或对别的 Chromium 做验证。
    [switch]$AttachOnly,
    # 注入后截一张图（验证用）。
    [string]$Screenshot,
    [switch]$NoLog,
    # target 匹配规则（默认只认 WorkBuddy 主窗口）
    [string]$MatchUrl = '*/renderer/index.html*',
    # 验证用：注入后导航到指定 URL，检验 document-start 注入路径
    [string]$NavigateUrl,
    [int]$WaitTargetSeconds = 30,
    # 网络闸门：CDP Fetch 扣住宿主网络请求，让主线程在整个播放期归开屏独占。
    # 播完/跳过自动放行。默认开（正式载荷模式）；排查链路时用 -NoHoldBoot 退回旧行为。
    [switch]$NoHoldBoot,
    # 验证用：配合 -WorkBuddyExe 给目标程序传启动参数（如 Chrome 的 --remote-debugging-port）
    [string]$ExeArgs
)

$ErrorActionPreference = 'Stop'
$script:Root = Split-Path -Parent $PSScriptRoot
$script:LogPath = Join-Path $PSScriptRoot 'last-run.log'
$script:LogLines = New-Object System.Collections.Generic.List[string]
$script:T0 = Get-Date
$script:PausedLogCount = 0

function Say([string]$Text, [string]$Level = 'info') {
    $prefix = @{ info = '  '; step = '> '; ok = 'v '; warn = '! '; fail = 'x ' }[$Level]
    $elapsed = [int]((Get-Date) - $script:T0).TotalMilliseconds
    $line = "$prefix$Text"
    $script:LogLines.Add(('{0,6}ms {1}' -f $elapsed, $line)) | Out-Null
    Write-Host $line -ForegroundColor @{ info = 'Gray'; step = 'Cyan'; ok = 'Green'; warn = 'Yellow'; fail = 'Red' }[$Level]
}

function Save-Log {
    if ($NoLog -or $DryRun) { return }
    try {
        $head = @(
            'WorkBuddy 莱茵开屏 · 首帧注入日志',
            "时间 : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
            "模式 : $(if ($Probe) { 'Probe（纯色遮罩）' } elseif ($NoHoldBoot) { 'Splash（普通注入，无闸门）' } else { 'Splash + HoldBoot（网络闸门）' })",
            "PS   : $($PSVersionTable.PSVersion)",
            ('-' * 60)
        )
        Set-Content -LiteralPath $script:LogPath -Value ($head + $script:LogLines) -Encoding UTF8
        Write-Host "  日志: $script:LogPath" -ForegroundColor DarkGray
    } catch {
        Write-Host "  （日志写入失败：$($_.Exception.Message)）" -ForegroundColor DarkGray
    }
}

function Show-Popup([string]$Message, [string]$Title = 'WorkBuddy 莱茵开屏', [int]$Icon = 48) {
    if (-not $Popup) { return }
    try { (New-Object -ComObject WScript.Shell).Popup($Message, 0, $Title, $Icon) | Out-Null } catch { }
}

# 优雅关闭：先 CloseMainWindow（等同点窗口右上角 X，会话会存盘），等不到再强杀。
function Close-WorkBuddy {
    $procs = @(Get-Process -Name 'WorkBuddy' -ErrorAction SilentlyContinue)
    if ($procs.Count -eq 0) { return }
    Say "正在关闭 WorkBuddy（$($procs.Count) 个进程）…" 'step'
    foreach ($proc in $procs) {
        try { [void]$proc.CloseMainWindow() } catch { }
    }
    $deadline = (Get-Date).AddSeconds(8)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds 250
        if (-not (Get-Process -Name 'WorkBuddy' -ErrorAction SilentlyContinue)) { break }
    }
    $left = @(Get-Process -Name 'WorkBuddy' -ErrorAction SilentlyContinue)
    if ($left.Count -gt 0) {
        Say "仍有 $($left.Count) 个进程未退出，强制结束" 'warn'
        foreach ($proc in $left) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Milliseconds 800
    } else {
        Say 'WorkBuddy 已退出' 'ok'
    }
}

# ---------------------------------------------------------------- 路径

function Find-WorkBuddy {
    if ($WorkBuddyExe) {
        if (Test-Path -LiteralPath $WorkBuddyExe) { return (Resolve-Path -LiteralPath $WorkBuddyExe).Path }
        throw "指定的 WorkBuddy.exe 不存在: $WorkBuddyExe"
    }
    $running = Get-Process -Name 'WorkBuddy' -ErrorAction SilentlyContinue |
        Where-Object { $_.Path } | Select-Object -First 1
    if ($running) { return $running.Path }
    foreach ($p in @(
        'D:\wb\WorkBuddy\WorkBuddy.exe',
        "$env:LOCALAPPDATA\Programs\WorkBuddy\WorkBuddy.exe",
        "$env:LOCALAPPDATA\WorkBuddy\WorkBuddy.exe",
        "$env:ProgramFiles\WorkBuddy\WorkBuddy.exe",
        "${env:ProgramFiles(x86)}\WorkBuddy\WorkBuddy.exe"
    )) {
        if ($p -and (Test-Path -LiteralPath $p)) { return (Resolve-Path -LiteralPath $p).Path }
    }
    return $null
}

# ---------------------------------------------------------------- CDP

function Get-CdpTargets([int]$CdpPort) {
    $response = $null; $reader = $null
    try {
        $request = [Net.HttpWebRequest]::Create("http://127.0.0.1:$CdpPort/json/list")
        $request.Proxy = $null
        $request.Timeout = 800
        $response = $request.GetResponse()
        $reader = New-Object IO.StreamReader($response.GetResponseStream(), [Text.Encoding]::UTF8)
        $parsed = ConvertFrom-Json $reader.ReadToEnd()

        # 显式展平：ConvertFrom-Json 把整个 JSON 数组当成「一个对象」发射，
        # 用管道 + @() 收集不到元素（会得到 1 元素数组，元素还是数组）。
        $flat = New-Object System.Collections.Generic.List[object]
        foreach ($item in $parsed) {
            if ($item -is [System.Array]) {
                foreach ($inner in $item) { [void]$flat.Add($inner) }
            } else {
                [void]$flat.Add($item)
            }
        }

        $pages = New-Object System.Collections.Generic.List[object]
        foreach ($item in $flat) {
            if ($item.type -eq 'page' -and $item.webSocketDebuggerUrl) { [void]$pages.Add($item) }
        }
        $pages.ToArray()
    } catch {
        @()
    } finally {
        if ($reader) { $reader.Dispose() }
        if ($response) { $response.Dispose() }
    }
}

function Wait-CdpPort([int]$CdpPort, [int]$Seconds) {
    $deadline = (Get-Date).AddSeconds($Seconds)
    do {
        $t = @(Get-CdpTargets $CdpPort)
        if ($t.Count -gt 0) { return $t }
        Start-Sleep -Milliseconds 60
    } while ((Get-Date) -lt $deadline)
    @()
}

function New-CdpSession([string]$Url) {
    $socket = [Net.WebSockets.ClientWebSocket]::new()
    try { $socket.Options.Proxy = [Net.WebProxy]::new() } catch { }
    $cts = [Threading.CancellationTokenSource]::new([TimeSpan]::FromSeconds(8))
    # PS 5.1 会把 GetResult() 返回的 VoidTaskResult 也发射到输出流，导致函数返回值
    # 变成 [VoidTaskResult, 哈希表] 两元素数组 —— 必须 Out-Null 掉。
    $socket.ConnectAsync([Uri]$Url, $cts.Token).GetAwaiter().GetResult() | Out-Null
    $cts.Dispose()

    # 后台读取线程：socket 的 ReceiveAsync 一旦被取消，整个 WebSocket 会进入
    # Aborted（.NET 行为），所以绝对不能给接收加超时——由专职读取线程无限期等，
    # 命令响应放 Responses 表、事件放 Events 队列，主线程只查表/收队列。
    # 这样某条 Runtime.evaluate 撞上导航的上下文销毁（响应会被 Chromium 直接
    # 丢弃，永远不来）时，只是这一条命令超时，连接本身毫发无损。
    $events = [System.Collections.Queue]::Synchronized((New-Object System.Collections.Queue))
    $responses = [System.Collections.Hashtable]::Synchronized(@{})
    $reader = [System.Management.Automation.PowerShell]::Create()
    [void]$reader.AddScript({
        param($sock, $evq, $resp)
        $buf = New-Object byte[] 262144
        try {
            while ($sock.State -eq [Net.WebSockets.WebSocketState]::Open) {
                $ms = New-Object IO.MemoryStream
                try {
                    $eom = $false
                    while (-not $eom) {
                        $r = $sock.ReceiveAsync([ArraySegment[byte]]::new($buf), [Threading.CancellationToken]::None).GetAwaiter().GetResult()
                        if ($r.MessageType -eq [Net.WebSockets.WebSocketMessageType]::Close) { return }
                        $ms.Write($buf, 0, $r.Count)
                        $eom = $r.EndOfMessage
                    }
                    $text = [Text.Encoding]::UTF8.GetString($ms.ToArray())
                } finally { $ms.Dispose() }
                $msg = $null
                try { $msg = $text | ConvertFrom-Json } catch { }
                if ($null -eq $msg) { continue }
                if ($null -ne $msg.id) { $resp[[int]$msg.id] = $msg }
                else { $evq.Enqueue($msg) }
            }
        } catch { }
    }).AddArgument($socket).AddArgument($events).AddArgument($responses)
    $handle = $reader.BeginInvoke()

    @{
        Socket       = $socket
        Id           = 0
        Events       = $events
        Responses    = $responses
        Reader       = $reader
        ReaderHandle = $handle
    }
}

function Send-Cdp($Session, [string]$Method, [hashtable]$Params = @{}, [int]$TimeoutSec = 8) {
    # Windows PS 5.1 不支持 $obj.Prop++（只在 PS7+ 可以）
    $id = [int]$Session['Id'] + 1
    $Session['Id'] = $id
    $payload = @{ id = $id; method = $Method; params = $Params } | ConvertTo-Json -Compress -Depth 12
    $bytes = [Text.Encoding]::UTF8.GetBytes($payload)
    # 发送侧可以有超时（发送不会长阻塞）；接收侧绝不能取消（见 New-CdpSession）
    $sendCts = [Threading.CancellationTokenSource]::new([TimeSpan]::FromSeconds(8))
    try {
        $Session['Socket'].SendAsync(
            [ArraySegment[byte]]::new($bytes),
            [Net.WebSockets.WebSocketMessageType]::Text, $true, $sendCts.Token
        ).GetAwaiter().GetResult() | Out-Null
    } finally { $sendCts.Dispose() }

    # 等后台读取线程把对应 id 的响应放进表里。响应可能永远不来（导航销毁了
    # 执行上下文时 Chromium 会直接丢弃 Runtime.evaluate 的响应），所以这里
    # 必须有超时——超时只放弃这一条命令，连接不受影响。
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        $msg = $Session['Responses'][$id]
        if ($null -ne $msg) {
            [void]$Session['Responses'].Remove($id)
            if ($msg.error) { throw "$Method 失败：$($msg.error.message)" }
            return $msg.result
        }
        Start-Sleep -Milliseconds 20
    }
    throw "$Method 超时（${TimeoutSec}s 无响应）"
}

# 即发即忘：不等响应。批量放行被扣请求时用——逐条等响应会累计巨大延迟
# （每条 ~45ms 轮询间隔 × 上百条 = 数秒，开屏干停在 97%）。响应会由读取线程
# 收进 Responses 表里不再清理，一次性脚本无所谓。
function Send-CdpFire($Session, [string]$Method, [hashtable]$Params = @{}) {
    $id = [int]$Session['Id'] + 1
    $Session['Id'] = $id
    $payload = @{ id = $id; method = $Method; params = $Params } | ConvertTo-Json -Compress -Depth 12
    $bytes = [Text.Encoding]::UTF8.GetBytes($payload)
    $sendCts = [Threading.CancellationTokenSource]::new([TimeSpan]::FromSeconds(8))
    try {
        $Session['Socket'].SendAsync(
            [ArraySegment[byte]]::new($bytes),
            [Net.WebSockets.WebSocketMessageType]::Text, $true, $sendCts.Token
        ).GetAwaiter().GetResult() | Out-Null
    } finally { $sendCts.Dispose() }
}

# 处理 Fetch.requestPaused 事件：Document/XHR/WebSocket 立即放行（否则导航本身
# 会被扣死），其余（Script/Stylesheet/Image/…）扣进 $Held 等开屏放行。
function Invoke-CdpEventPump($Session, [System.Collections.Generic.List[string]]$Held) {
    $q = $Session['Events']
    if ($q.Count -eq 0) { return }
    $passThrough = @('Document', 'Fetch', 'XHR', 'EventSource', 'WebSocket', 'Prefetch', 'CSPReport')
    while ($q.Count -gt 0) {
        $ev = $q.Dequeue()
        if ($ev.method -ne 'Fetch.requestPaused') { continue }
        $rid = [string]$ev.params.requestId
        $rtype = [string]$ev.params.resourceType
        $rurl = ''
        try { $rurl = [string]$ev.params.request.url } catch { }
        if ($passThrough -contains $rtype) {
            if ($script:PausedLogCount -lt 10) {
                $script:PausedLogCount = $script:PausedLogCount + 1
                Say "闸门放行 $rtype : $rurl" 'info'
            }
            try { Send-Cdp $Session 'Fetch.continueRequest' @{ requestId = $rid } | Out-Null } catch { }
        } else {
            if ($script:PausedLogCount -lt 10) {
                $script:PausedLogCount = $script:PausedLogCount + 1
                Say "闸门扣住 $rtype : $rurl" 'info'
            }
            [void]$Held.Add($rid)
        }
    }
}

function Close-Cdp($Session) {
    try {
        if ($Session['Socket'].State -eq [Net.WebSockets.WebSocketState]::Open) {
            $Session['Socket'].CloseAsync(
                [Net.WebSockets.WebSocketCloseStatus]::NormalClosure, 'done',
                [Threading.CancellationToken]::None
            ).GetAwaiter().GetResult() | Out-Null
        }
    } catch { }
    # 读取线程会在 socket 关闭后自行退出；Stop 用于 socket 已僵死时强制打断
    try { $Session['Reader'].Stop() } catch { }
    try {
        if ($Session['ReaderHandle']) { $Session['Reader'].EndInvoke($Session['ReaderHandle']) | Out-Null }
    } catch { }
    try { $Session['Reader'].Dispose() } catch { }
    $Session['Socket'].Dispose()
}

# ---------------------------------------------------------------- 载荷

function Get-ProbeSource {
    @'
(function () {
  if (document.getElementById('wb-splash-probe')) return;
  var d = document.createElement('div');
  d.id = 'wb-splash-probe';
  d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#151517;color:#f0893e;' +
    'font:600 20px/1.6 Consolas,monospace;display:flex;align-items:center;justify-content:center;' +
    'flex-direction:column;gap:12px';
  d.innerHTML = '<div>WORKBUDDY · SPLASH PROBE</div>' +
    '<div id="wb-splash-probe-state" style="font-size:13px;opacity:.7"></div>';
  (document.body || document.documentElement).appendChild(d);
  var t0 = performance.now();
  setTimeout(function () {
    var el = document.getElementById('wb-splash-probe-state');
    if (el) el.textContent = 'page readyState=' + document.readyState +
      ' · 注入后 ' + Math.round(performance.now() - t0) + 'ms';
  }, 600);
  setTimeout(function () { var n = document.getElementById('wb-splash-probe'); if (n) n.remove(); }, 4000);
})();
'@
}

# ---------------------------------------------------------------- 主体

Say 'WorkBuddy 莱茵开屏 · 首帧注入'
$exe = Find-WorkBuddy
if ($exe) { Say "WorkBuddy: $exe" 'ok' } else { Say '找不到 WorkBuddy.exe（用 -WorkBuddyExe 指定）' 'fail'; Save-Log; exit 4 }

$running = @(Get-Process -Name 'WorkBuddy' -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowHandle -ne 0 })
if ($running.Count -gt 0 -and -not $Force -and -not $AttachOnly -and -not $DryRun) {
    if ($Restart) {
        Say "WorkBuddy 正在运行 (PID $($running[0].Id))，-Restart：先关闭再带 CDP 重开" 'warn'
        Close-WorkBuddy
        Start-Sleep -Milliseconds 500
    } else {
        Say "WorkBuddy 正在运行 (PID $($running[0].Id))" 'warn'
        Say '本方案要在 WorkBuddy 启动瞬间接管。加 -Restart 让脚本自己关掉再重开。' 'fail'
        Show-Popup ("WorkBuddy 正在运行。`n`n桌面快捷方式会自动重启它；手动跑请加 -Restart 参数。")
        Save-Log
        exit 3
    }
}

if (-not $Payload) {
    # 载荷跟脚本同目录（out\ 下），不是上一级
    $Payload = Join-Path $PSScriptRoot 'out\splash.inject.js'
    if (-not (Test-Path -LiteralPath $Payload)) { $Payload = Join-Path $PSScriptRoot 'splash.inject.js' }
}
if ($Probe) {
    $source = Get-ProbeSource
    $sentinel = 'wb-splash-probe'
    Say '模式: Probe（纯色遮罩，验证链路用）'
} else {
    $sentinel = 'rhine-splash'
    if (-not (Test-Path -LiteralPath $Payload)) { Say "找不到注入载荷: $Payload" 'fail'; Save-Log; exit 4 }
    $source = [IO.File]::ReadAllText($Payload, [Text.Encoding]::UTF8)
    Say "载荷: $Payload  ($([math]::Round($source.Length / 1KB)) KB)"
}

if ($DryRun) {
    Say 'DryRun：不启动任何程序。' 'step'
    Say "将以环境变量 WORKBUDDY_REMOTE_DEBUGGING_PORT=$Port 启动" 'info'
    Say ('然后轮询 http://127.0.0.1:' + $Port + '/json/list，等 renderer/index.html 出现') 'info'
    Save-Log
    exit 0
}

# --- 启动（带官方 CDP 开关）---
if ($AttachOnly) {
    Say "AttachOnly：直接连接已有端口 $Port，不启动任何程序" 'step'
} else {
    Say "以 WORKBUDDY_REMOTE_DEBUGGING_PORT=$Port 启动 WorkBuddy…" 'step'
    $env:WORKBUDDY_REMOTE_DEBUGGING_PORT = "$Port"
    try {
        if ($ExeArgs) {
            Start-Process -FilePath $exe -WorkingDirectory (Split-Path -Parent $exe) -ArgumentList $ExeArgs | Out-Null
        } else {
            Start-Process -FilePath $exe -WorkingDirectory (Split-Path -Parent $exe) | Out-Null
        }
    } finally {
        Remove-Item Env:\WORKBUDDY_REMOTE_DEBUGGING_PORT -ErrorAction SilentlyContinue
    }
}

# --- 等端口 ---
$targets = @(Wait-CdpPort $Port $WaitTargetSeconds)
if ($targets.Count -eq 0) {
    Say "$WaitTargetSeconds 秒内没有等到 CDP 端口 $Port" 'fail'
    Say '多半是 WorkBuddy 没吃到环境变量，或旧实例还在（单实例会把参数转给老进程）。' 'fail'
    Show-Popup ("没等到 CDP 端口 $Port。`n`n可能原因：`n1) WorkBuddy 有残留进程没退干净——任务管理器结束所有 WorkBuddy.exe 再试；`n2) 这个版本移除了 WORKBUDDY_REMOTE_DEBUGGING_PORT 支持。`n`n详情见：$script:LogPath")
    Save-Log
    exit 5
}
Say "CDP 端口就绪，现有 $($targets.Count) 个 page target" 'ok'

# --- 挑主窗口 target ---
$deadline = (Get-Date).AddSeconds($WaitTargetSeconds)
$main = $null
while ((Get-Date) -lt $deadline) {
    $targets = @(Get-CdpTargets $Port)
    $main = $null
    foreach ($tgt in $targets) {
        if ($tgt.url -like $MatchUrl) { $main = $tgt; break }
    }
    if ($main) { break }
    Start-Sleep -Milliseconds 50
}
if (-not $main) {
    Say '没等到 /renderer/index.html 主窗口 target' 'fail'
    Show-Popup ("DOM 里有 CDP 端口，但没等到主窗口 target。`n`n详情见：$script:LogPath")
    $dump = @()
    foreach ($tgt in $targets) { $dump += "$($tgt.type) $($tgt.url)" }
    Say ('现有 target：' + ($dump -join ' | ')) 'info'
    Save-Log
    exit 6
}
Say "主窗口 target: $($main.url)" 'ok'

# --- 连接 ---
$session = New-CdpSession $main.webSocketDebuggerUrl
Say 'CDP 已连接' 'ok'
try {
    Send-Cdp $session 'Page.enable' @{} | Out-Null
    Send-Cdp $session 'Runtime.enable' @{} | Out-Null

    # ============================================================ HoldBoot
    # 网络闸门：真机录屏证明掉帧主因是宿主启动的长同步任务饿死开屏的 rAF，
    # CSS 级优化救不了。这里用 CDP Fetch 把重载后文档的所有网络请求扣住——
    # 宿主 JS 一个字节都不执行，主线程整个播放期归开屏独占；开屏播完/跳过
    # 置 __WB_SPLASH_DONE__，这里轮询到就放行，宿主在全无竞争的环境下启动。
    $useHold = (-not $Probe) -and (-not $NoHoldBoot) -and (-not $NavigateUrl) -and (-not $AttachOnly)
    $holdDone = $false
    if ($useHold) {
        $fetchEnabled = $false
        try {
            Send-Cdp $session 'Fetch.enable' @{} | Out-Null
            $fetchEnabled = $true
            Say '网络闸门：Fetch 拦截已开启' 'ok'
        } catch {
            Say "Fetch.enable 失败，退回普通注入（$($_.Exception.Message)）" 'warn'
        }

        if ($fetchEnabled) {
            Say '模式: HoldBoot —— 扣住宿主网络，主线程整个播放期归开屏独占' 'step'

            # 注入前状态（第一份文档，仅记录；开屏会随 reload 重新开始）
            try {
                $state = Send-Cdp $session 'Runtime.evaluate' @{
                    expression = 'JSON.stringify({rs:document.readyState,body:!!document.body,app:!!document.getElementById("root")})'
                    returnByValue = $true
                }
                $st = $state.result.value | ConvertFrom-Json
                Say "注入前页面状态: readyState=$($st.rs) body=$($st.body) #root=$($st.app)" 'info'
            } catch { }

            # 新文档载荷：hold 标志 + 开屏。重载后的文档从第一帧起就是开屏，
            # 且宿主所有脚本请求都会被扣住（解析器停在网络上，不耗主线程）。
            $holdSource = 'globalThis.__WB_SPLASH_HOLD__ = true;' + "`n" + $source
            Send-Cdp $session 'Page.addScriptToEvaluateOnNewDocument' @{ source = $holdSource } | Out-Null
            Say 'addScriptToEvaluateOnNewDocument 已登记（hold 模式）' 'ok'

            $held = New-Object System.Collections.Generic.List[string]
            Send-Cdp $session 'Page.reload' @{ ignoreCache = $false } | Out-Null
            Say 'Page.reload 已发出：重载后文档的网络请求将全部被扣住' 'step'

            # 等开屏完成信号（自然播完或跳过都会置 __WB_SPLASH_DONE__）
            $holdT0 = Get-Date
            $sawMount = $false
            $signal = 'timeout'
            while ($true) {
                # 120ms：泵的频率直接决定 Document 请求被放行的延迟（也即开屏
                # 能多快挂上——空窗期窗口是白的），探针本身很轻，频率高些无妨。
                Start-Sleep -Milliseconds 120
                Invoke-CdpEventPump $session $held
                $elapsed = [int]((Get-Date) - $holdT0).TotalMilliseconds
                $pv = $null
                try {
                    # 注意：这里绝不能叫 $probe —— PS 变量名大小写不敏感，
                    # 会撞上脚本参数 [switch]$Probe 的类型约束，赋 PSCustomObject
                    # 直接抛 InvalidCastConstructorException。
                    $probeResp = Send-Cdp -Session $session -Method 'Runtime.evaluate' -TimeoutSec 3 -Params @{
                        expression = 'JSON.stringify({done:!!globalThis.__WB_SPLASH_DONE__,mount:!!document.getElementById("' + $sentinel + '"),rs:document.readyState})'
                        returnByValue = $true
                    }
                    # 表达式在页面里异常时 result 里没有 value；null 直接当"没探到"
                    $rawVal = $null
                    if ($probeResp -and $probeResp.result -and $probeResp.result.value) { $rawVal = $probeResp.result.value }
                    if ($rawVal) { $pv = $rawVal | ConvertFrom-Json }
                } catch {
                    if (-not $script:ProbeErrCount) { $script:ProbeErrCount = 0 }
                    $script:ProbeErrCount = $script:ProbeErrCount + 1
                    if ($script:ProbeErrCount -le 4) { Say "探针异常#$($script:ProbeErrCount)：$($_.Exception.Message)" 'warn' }
                    # 导航瞬间执行上下文会短暂销毁；长时间拿不到结果就直接放行
                    if ($elapsed -gt 15000) { $signal = 'probe-fail'; break }
                    continue
                }
                if (-not $pv) { continue }

                if ($pv.mount -and -not $sawMount) {
                    $sawMount = $true
                    Say "开屏已挂载（重载后 ${elapsed}ms，readyState=$($pv.rs)，宿主 JS 未执行）" 'ok'
                    # 渲染自检：节点存在 ≠ 铺满窗口，趁开屏还在量一次
                    $vis = Send-Cdp $session 'Runtime.evaluate' @{
                        expression = 'JSON.stringify((function(){var el=document.getElementById("' + $sentinel + '");if(!el)return {ok:false,w:0,h:0,pos:"none",z:"-"};var r=el.getBoundingClientRect();var cs=getComputedStyle(el);return {ok:r.width>200&&r.height>200&&cs.position==="fixed",w:Math.round(r.width),h:Math.round(r.height),pos:cs.position,z:cs.zIndex}})())'
                        returnByValue = $true
                    }
                    $v = $vis.result.value | ConvertFrom-Json
                    Say "渲染自检: $($v.w)x$($v.h) position=$($v.pos) z-index=$($v.z)" $(if ($v.ok) { 'ok' } else { 'fail' })
                    if (-not $v.ok) {
                        Show-Popup ("开屏节点挂上了但没铺满窗口（$($v.w)x$($v.h) / position=$($v.pos)）。`n`n详情见：$script:LogPath")
                    }
                    if ($Screenshot) {
                        $shot = Send-Cdp $session 'Page.captureScreenshot' @{ format = 'png' }
                        [IO.File]::WriteAllBytes($Screenshot, [Convert]::FromBase64String($shot.data))
                        Say "截图: $Screenshot（hold 播放中）" 'ok'
                    }
                }

                if ($pv.done) { $signal = "done@${elapsed}ms"; break }
                if (-not $pv.mount -and $elapsed -gt 8000) { $signal = 'no-mount'; break }
                if ($elapsed -gt 30000) { $signal = 'timeout'; break }
            }
            Say "闸门等待结束（$signal，扣住 $($held.Count) 个请求）" $(if ($signal -like 'done*') { 'ok' } else { 'warn' })

            # ---- 放行网络（即发即忘，不逐条等响应）----
            function Release-HeldRequests($Session, [System.Collections.Generic.List[string]]$Held) {
                $ok = 0; $fail = 0
                foreach ($rid in $Held.ToArray()) {
                    try { Send-CdpFire $Session 'Fetch.continueRequest' @{ requestId = $rid } | Out-Null; $ok = $ok + 1 }
                    catch { $fail = $fail + 1 }
                }
                $Held.Clear()
                , @($ok, $fail)
            }
            $relTotal = 0
            $relFail = 0
            $rr = Release-HeldRequests $session $held
            $relTotal = $relTotal + $rr[0]; $relFail = $relFail + $rr[1]
            # 放行过程中新到的请求同样处理，然后关拦截
            Start-Sleep -Milliseconds 200
            Invoke-CdpEventPump $session $held
            $rr = Release-HeldRequests $session $held
            $relTotal = $relTotal + $rr[0]; $relFail = $relFail + $rr[1]
            try { Send-Cdp $session 'Fetch.disable' @{} | Out-Null } catch { }
            # disable 后 socket 缓冲里可能还有已扣住的事件：最后泵一轮兜底
            Start-Sleep -Milliseconds 200
            try { Send-Cdp $session 'Runtime.evaluate' @{ expression = '1' } | Out-Null } catch { }
            Invoke-CdpEventPump $session $held
            $rr = Release-HeldRequests $session $held
            $relTotal = $relTotal + $rr[0]; $relFail = $relFail + $rr[1]
            Say ("网络闸门已放行（$relTotal 个请求" + $(if ($relFail) { "，$relFail 个失败" } else { '' }) + '）') 'ok'

            # ---- 观察宿主接管（纯日志：#root 挂上 UI、开屏退场）----
            # 250ms 高频轮询：宿主启动期主线程忙，Runtime.evaluate 响应可能
            # 迟到；记录首帧上屏（root 有子元素）与开屏退场两个时刻。
            $hostT0 = Get-Date
            $sawRoot = 0
            while (((Get-Date) - $hostT0).TotalSeconds -lt 15) {
                Start-Sleep -Milliseconds 250
                $hv = $null
                try {
                    $h = Send-Cdp -Session $session -Method 'Runtime.evaluate' -TimeoutSec 2 -Params @{
                        expression = 'JSON.stringify({root:!!(document.getElementById("root")&&document.getElementById("root").childElementCount>0),mount:!!document.getElementById("' + $sentinel + '"),rs:document.readyState})'
                        returnByValue = $true
                    }
                    if ($h -and $h.result -and $h.result.value) { $hv = $h.result.value | ConvertFrom-Json }
                } catch { continue }
                if (-not $hv) { continue }
                $he = [int]((Get-Date) - $hostT0).TotalMilliseconds
                if ($hv.root -and $sawRoot -eq 0) {
                    $sawRoot = $he
                    Say "宿主 UI 已上屏（放行后 ${he}ms）" 'ok'
                }
                if ($hv.root -and $hv.mount) { Say "开屏退场中（放行后 ${he}ms）" 'info'; break }
                if ($hv.root -and -not $hv.mount) { Say "开屏已退场（放行后 ${he}ms）" 'ok'; break }
                if ($sawRoot -gt 0 -and $he - $sawRoot -gt 8000) { Say '宿主已上屏但开屏长时间未退场（>8s），仅记录' 'warn'; break }
            }

            $holdDone = $true
        }
    }

    if (-not $holdDone) {
    # ============================================================ 旧流程（无闸门）

    # 1) 覆盖后续文档（reload / 二次加载）
    Send-Cdp $session 'Page.addScriptToEvaluateOnNewDocument' @{ source = $source } | Out-Null
    Say 'addScriptToEvaluateOnNewDocument 已登记' 'ok'

    # 2) 当帧状态（决定要不要补一次 reload）
    $state = Send-Cdp $session 'Runtime.evaluate' @{
        expression = 'JSON.stringify({rs:document.readyState,body:!!document.body,app:!!document.getElementById("root"),mount:!!document.getElementById("' + $sentinel + '")})'
        returnByValue = $true
    }
    $st = $state.result.value | ConvertFrom-Json
    Say "注入前页面状态: readyState=$($st.rs) body=$($st.body) #root=$($st.app)" 'info'

    if ($st.mount) {
        Say '开屏已存在（newDocument 已生效），跳过即时注入' 'ok'
    } else {
        Send-Cdp $session 'Runtime.evaluate' @{
            expression = $source
            returnByValue = $true
            awaitPromise = $false
        } | Out-Null
        Say 'Runtime.evaluate 即时注入完成' 'ok'
    }

    # 3) 核验
    $check = Send-Cdp $session 'Runtime.evaluate' @{
        expression = 'JSON.stringify({rs:document.readyState,mount:!!document.getElementById("' + $sentinel + '"),css:!!document.getElementById("rhine-splash-css")||!!document.getElementById("wb-splash-probe"),t:Math.round(performance.now())})'
        returnByValue = $true
    }
    $ck = $check.result.value | ConvertFrom-Json
    Say "注入后: 开屏节点=$($ck.mount) 样式=$($ck.css) readyState=$($ck.rs) 页面时钟=$($ck.t)ms" $(if ($ck.mount) { 'ok' } else { 'fail' })

    if ($NavigateUrl) {
        Send-Cdp $session 'Page.navigate' @{ url = $NavigateUrl } | Out-Null
        Say "已导航到 $NavigateUrl（检验 document-start 注入）" 'info'
        Start-Sleep -Milliseconds 900
        $nav = Send-Cdp $session 'Runtime.evaluate' @{
            expression = 'JSON.stringify({rs:document.readyState,mount:!!document.getElementById("' + $sentinel + '"),url:location.href})'
            returnByValue = $true
        }
        $nv = $nav.result.value | ConvertFrom-Json
        Say "新文档: 开屏节点=$($nv.mount) readyState=$($nv.rs)" $(if ($nv.mount) { 'ok' } else { 'fail' })
    }

    # 渲染自检：节点存在 ≠ 铺满了窗口（CSP 拦样式、宿主覆盖 z-index 都会导致"挂上了但看不见"）
    if ($ck.mount) {
        $vis = Send-Cdp $session 'Runtime.evaluate' @{
            expression = 'JSON.stringify((function(){var el=document.getElementById("' + $sentinel + '");if(!el)return {ok:false,w:0,h:0,pos:"none",z:"-"};var r=el.getBoundingClientRect();var cs=getComputedStyle(el);return {ok:r.width>200&&r.height>200&&cs.position==="fixed",w:Math.round(r.width),h:Math.round(r.height),pos:cs.position,z:cs.zIndex}})())'
            returnByValue = $true
        }
        $v = $vis.result.value | ConvertFrom-Json
        Say "渲染自检: $($v.w)x$($v.h) position=$($v.pos) z-index=$($v.z)" $(if ($v.ok) { 'ok' } else { 'fail' })
        if (-not $v.ok) {
            Show-Popup ("开屏节点挂上了但没铺满窗口（$($v.w)x$($v.h) / position=$($v.pos)）。`n`n详情见：$script:LogPath")
        }
    }

    if ($Screenshot) {
        Start-Sleep -Milliseconds 1500
        $shot = Send-Cdp $session 'Page.captureScreenshot' @{ format = 'png' }
        [IO.File]::WriteAllBytes($Screenshot, [Convert]::FromBase64String($shot.data))
        Say "截图: $Screenshot" 'ok'
    }

    if (-not $ck.mount -and $ck.rs -eq 'complete') {
        Say '页面已 complete 且没挂上，补一次 reload 让 newDocument 生效…' 'warn'
        Send-Cdp $session 'Page.reload' @{ ignoreCache = $false } | Out-Null
        Start-Sleep -Milliseconds 400
        $again = Send-Cdp $session 'Runtime.evaluate' @{
            expression = 'JSON.stringify({rs:document.readyState,mount:!!document.getElementById("' + $sentinel + '")})'
            returnByValue = $true
        }
        $ag = $again.result.value | ConvertFrom-Json
        Say "reload 后: 开屏节点=$($ag.mount) readyState=$($ag.rs)" $(if ($ag.mount) { 'ok' } else { 'fail' })
    }
    }   # 旧流程结束
} finally {
    Close-Cdp $session
}

if ($holdDone) {
    Say '完成。HoldBoot：开屏独占主线程播完 → 已放行宿主启动。' 'ok'
} else {
    Say '完成。开屏应在 WorkBuddy 窗口里播放（点击/Esc 可跳过）。' 'ok'
}
Save-Log
exit 0
