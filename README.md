# WorkBuddy 莱茵生命开屏（首帧注入 + HoldBoot 网络闸门版）

> **WorkBuddy 美化项目** —— 给 [WorkBuddy](https://www.workbuddy.cn) 桌面端做一个
> 《明日方舟》莱茵生命风格的启动开屏动画。
>
> 🤖 **由 DeepSeek 与 GLM 接力完成**：DeepSeek 完成首帧注入链路与动画改造，
> GLM 接力定位掉帧根因并实现 HoldBoot 网络闸门。
>
> 📂 **完全开源**（MIT）。任何人都可以自由修改、改进、修复 bug 或卡顿掉帧问题——
> 欢迎 issue 与 PR。

在 **WorkBuddy 自己的窗口里**、**首帧之前**铺一层莱茵生命启动动画，播完自动交接给主界面。

和"另开一个窗口播动画"是两件事：这里不额外开窗口、不抢前台、不闪原生界面。

**HoldBoot**：播放期间用 CDP Fetch 把宿主的网络请求全部扣住——宿主 JS 一个字节都不执行，
主线程整个播放期归开屏独占，掉帧从根上消失（详见下面"掉帧根因与 HoldBoot"）。

---

## 怎么用

### 方式一：桌面图标（推荐）

运行一次 `安装桌面快捷方式.ps1`，桌面会出现 **「WorkBuddy 莱茵开屏」** 图标
（用开屏里的六边形徽记做图标）。

**双击它就行。** 它会自己：

1. 关闭正在运行的 WorkBuddy（等同点窗口右上角 ×，会话会存盘；8 秒没退干净才强杀）
2. 以 `WORKBUDDY_REMOTE_DEBUGGING_PORT=9335` 重新启动它
3. 在主窗口 target 出现时开网络闸门（HoldBoot）并重载注入开屏
4. 开屏独占主线程播完 → 放行宿主启动 → 宿主上屏后退场，之后正常使用

> 注意：第 1 步会中断 WorkBuddy 里正在跑的对话/任务。确认没在跑长任务再点。

图标不见了或想移除，再运行 `安装桌面快捷方式.ps1`（加 `-Uninstall` 移除）。

### 方式二：命令行

```powershell
cd <仓库目录>
powershell -ExecutionPolicy Bypass -File .\Start-WorkBuddySplash.ps1 -Restart
```

不加 `-Restart` 时，脚本会在检测到 WorkBuddy 正在运行时直接拒绝——因为它必须在 WorkBuddy
启动的那一瞬间接管，没法对一个已经跑起来的实例做首帧注入。

### 其他入口

- **只看动画**（不碰 WorkBuddy）：双击 `splash.html`
- **重播**（WorkBuddy 已在跑）：`.\Start-WorkBuddySplash.ps1 -AttachOnly -Port 9335`
- **只验证链路**：`.\Start-WorkBuddySplash.ps1 -Probe`（注入纯色遮罩）

每次运行都会写 `last-run.log`（带毫秒时间戳）。快捷方式是隐藏控制台启动的，失败会弹窗，
连同日志路径一起告诉你。

## 为什么这样能"和 DeepSeek Harness 一样"

DeepSeek Harness 有官方的 `webserver/index-inject`，插件能把自己的脚本塞进服务端渲染的 HTML。
WorkBuddy 没有这个接口（`app.asar` 里 `index-inject` / `indexInject` 命中 0 次）。

但翻 `app.asar` 发现了另一条官方通道：

```js
let r = process.env.WORKBUDDY_REMOTE_DEBUGGING_PORT;
if (r && /^\d+$/.test(r)) {
  commandLine.appendSwitch('remote-debugging-port', r);
  commandLine.appendSwitch('remote-allow-origins', 'http://127.0.0.1,...');
  logInfo(`[WorkBuddy] CDP remote debugging enabled on port ${r}`)
}
```

配合 CDP 的 `Page.addScriptToEvaluateOnNewDocument`，脚本会在**页面第一行 JS 之前**执行，
也就是铺在宿主首帧上，而不是事后盖一层。这条路径就是本项目的做法。

## 掉帧根因与 HoldBoot 网络闸门

用户录屏（30fps）逐帧差分给出了铁证：

- 开屏播放中途出现 **1.1 秒级硬冻结**（计数器从 098 卡到 098 不动），整段 4.3s 动画
  被拉长到 10s 以上
- 冻结时刻正好对应宿主 React 大包（`host-BKHs3X32.js` 及十余个模块）的解析/执行——
  **开屏的 rAF 时间轴和宿主启动在同一条主线程上抢时间**
- `bench.py` 的 4×CPU 降速模拟的是"均匀变慢"，而真实宿主启动是几百毫秒的长同步
  阻塞，比均匀降速恶劣得多——这就是基准全绿、真机卡成幻灯片的原因

CSS 级优化（变量挂载点、clip-path、去 blur……见下节）救不了"主线程被饿死"，
于是换思路：**不让宿主跑**。

HoldBoot 流程（注入器 `Start-WorkBuddySplash.ps1` 默认开启）：

1. 连上 CDP 后 `Fetch.enable` 开全局网络拦截
2. `Page.reload` 重载宿主页面；开屏载荷（含 `__WB_SPLASH_HOLD__` 标志）随
   `addScriptToEvaluateOnNewDocument` 在新文档 document-start 执行
3. 事件泵把宿主的 Script/Stylesheet/Image 请求**全部扣住**（Document/XHR/WebSocket
   放行，否则导航本身会死锁）——解析器停在网络等待上，不耗主线程一个周期
4. 开屏独占主线程满帧播放；时间轴自然走完（或用户点击/Esc 跳过）→ 置
   `__WB_SPLASH_DONE__`
5. 注入器轮询到信号，即发即忘批量 `Fetch.continueRequest` 放行 + `Fetch.disable`
6. 宿主在无竞争环境下全速启动；开屏照旧等 `#root` 挂上宿主 UI 才播退场动画
   （上游 `exitWhenReady` 逻辑，hold 模式下上限提到 15s）

实验室对照（WB 仿真宿主，含 300/400/350ms 三段长同步阻塞模块）：

| 模式 | 播放期 p95 帧间隔 | 播放期最差帧 |
| --- | --- | --- |
| 无闸门（现状） | 25.0ms | **341.7ms** |
| HoldBoot | **9.0ms** | 211.8ms（首个挂载帧，一次性） |

真机最终时间线（18:29 日志）：重载后 449ms 开屏挂载（宿主 JS 未执行）→ 播放 3.8s
期间 13 个宿主 JS 全被扣住 → 放行 → 宿主 3.0s 自然启动 → 开屏退场。

已知代价：宿主实际要"启动两次"（第一次自然启动到注入器接管为止，第二次才是真的），
总启动时间比原生多一个开屏时长的量级——换来的是动画满帧。想退回旧行为加 `-NoHoldBoot`。

顺带确认过：WorkBuddy 自带的 splash 窗口只在 vendor 解压 / DB 修复 / 数据迁移时才出现
（`SplashWindow.showIfNeeded` 的触发点在 `ensureVendorAssets` 等分支），**正常冷启动没有**，
所以不存在"两个启动画面串场"。

## 验证过的 / 没验证的

**已验证**（真实 Chromium + 真实 CDP，不是单元测试）：

| 项 | 结果 |
| --- | --- |
| CDP 端口与主窗口 target 识别（`/renderer/index.html`） | 通过，target 正确命中 |
| `addScriptToEvaluateOnNewDocument` 首帧注入 | 通过 —— 导航到全新文档后开屏节点已存在 |
| 正式载荷（125 KB，样式+图片全内联）注入并渲染 | 通过，见 `preview/1-注入到宿主页面.png` |
| 新文档首帧渲染（阶段条、索引轨、欢迎面板、水印） | 通过，见 `preview/2-新文档首帧注入.png` |
| 纯色探针模式 | 通过，见 `preview/3-链路探针.png` |
| 跳过、播完自动移除 | 沿用上游实现，行为一致 |
| **真实 WorkBuddy 冷启动端到端** | **通过（2026-10-17 16:43 实测），见下** |

### 真实冷启动实测（2026-10-17 18:29，`last-run.log`，HoldBoot 全链路）

| 时间点 | 事件 |
| --- | --- |
| 1343ms | `Page.reload` 发出，闸门开启 |
| 449ms（重载后） | 开屏挂载，`readyState=loading`，**宿主 JS 未执行** |
| 播放期 | 13 个宿主 JS（含 host-BKHs3X32.js 大模块）全部被扣住 |
| 3798ms | 开屏时间轴播完，置 `__WB_SPLASH_DONE__`，闸门放行（14 个请求） |
| 放行后 3004ms | 宿主 UI 上屏（fetch+eval+mount 的自然启动时间） |
| 同帧 | 开屏检测到 `#root` 有内容，播退场动画 |

播放期间宿主主线程 0 负载，动画满帧；放行后开屏停在 97% 等宿主上屏再退场——
这是设计行为：开屏扮演"真实启动画面"，宿主多慢就等多慢（上限 15s 兜底）。

## 排查：为什么可能"看起来没反应"

按可能性从高到低：

1. **WorkBuddy 还在跑** —— 单实例应用，对已运行的实例做不了首帧注入。用桌面图标（带
   `-Restart`）或手动加 `-Restart`。
2. **有残留进程** —— 托盘退了但还有 `WorkBuddy.exe` 残留。任务管理器结束所有 WorkBuddy
   进程再试。
3. **端口没起来** —— 说明这个版本不吃 `WORKBUDDY_REMOTE_DEBUGGING_PORT`。日志里会写
   "30 秒内没有等到 CDP 端口"。
4. **窗口太小** —— `prefers-reduced-motion: reduce` 时开屏只显示静态画面、约 1 秒后淡出，
   看起来像闪了一下。这是上游行为，Windows 设置里"显示动画"关掉就会这样。
5. **多显示器 / 缩放** —— 全屏铺满按主窗口逻辑尺寸算，跨屏时不铺到其他屏。
6. **闸门等待超时（signal=timeout/no-mount/probe-fail）** —— 日志里"闸门等待结束"会
   写明原因。无论哪种，注入器都会放行所有扣住的请求，宿主能正常启动，只是开屏
   可能没播或播了一半。no-mount 多半是重载后载荷没执行，可跑 `-Probe` 分离问题。

已排除的一种可能：**CSP 拦内联样式**。查过主窗口 CSP（`buildMainWindowCsp`），
`style-src` 带 `'unsafe-inline'`，注入的 `<style>` 不会被拦。

## 渲染自检与失败提示

快捷方式是隐藏控制台启动的，所以两条硬失败路径会弹 Windows 消息框：

- 30 秒内没等到 CDP 端口（附日志路径）
- 节点挂上了但没铺满窗口（附实测尺寸与 `position`）

其余情况看同目录 `last-run.log`。

## 文件

```
workbuddy-splash/
├─ 安装桌面快捷方式.ps1          创建/移除桌面图标（已在桌面创建）
├─ 运行开屏.cmd                 双击入口（不自动重启 WorkBuddy，需手动先退出）
├─ Start-WorkBuddySplash.ps1    注入器（纯 PowerShell + .NET WebSocket，无第三方依赖；
│                                含 HoldBoot 网络闸门与后台 CDP 读取线程）
├─ splash.inject.js             注入载荷 129 KB（样式/图片全内联，mk.py 生成，勿手改）
├─ splash.html                  单文件预览页，双击就能看动画
├─ mk.py                        重新打包（改完 src/ 跑一次）
├─ bench.py                     帧时间基准（可复现上面的数字）
├─ last-run.log                 每次运行的注入日志
├─ assets/splash.ico            快捷方式图标（取自开屏里的徽记）
├─ holdtest/                    HoldBoot 实验室（WB 仿真宿主 + 闸门对照实验）
├─ src/
│  ├─ upstream-splash.css       dsh-rhine-splash 的 lib/splash.css，逐字未改
│  ├─ upstream-splash.js        dsh-rhine-splash 的 lib/splash.js，逐字未改（对照用）
│  ├─ wb-overrides.css          增量层：双语阶段条、中文注释、布局对齐
│  ├─ splash.wb.js              改造后的脚本（mk.py 生成）
│  ├─ specimen.jpg              样本窗背景
│  └─ LICENSE-upstream.txt      上游 MIT 许可证
└─ preview/                     四张验证截图
```

改动画的约定（与上游一致）：`upstream-splash.css` 顶部的 `--B` / `--G` / `--R` 与
`splash.wb.js` 里的 `BEAT` / `STAGES` 是同一组时间点，改一处必须同步另一处。

## 参数

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `-Restart` | — | 自动关掉正在运行的 WorkBuddy 再带 CDP 重开（桌面图标用的就是它） |
| `-Port` | `9335` | CDP 调试端口 |
| `-Probe` | — | 只注入纯色遮罩，验证链路 / 量时序 |
| `-AttachOnly` | — | 只连已有端口，不启动 WorkBuddy（重播用） |
| `-Popup` | — | 硬失败时弹 Windows 消息框（快捷方式已带上） |
| `-Screenshot` | — | 注入后截一张图到指定路径 |
| `-DryRun` | — | 只打印计划 |
| `-Force` | — | WorkBuddy 在跑也照跑（排查用，通常拿不到端口） |
| `-WorkBuddyExe` | 自动 | 手动指定 exe |
| `-ExeArgs` | — | 传给目标程序的启动参数（对 Chrome 做 E2E 验证用） |
| `-MatchUrl` | `*/renderer/index.html*` | target 匹配规则 |
| `-NoHoldBoot` | — | 关掉网络闸门，退回普通注入（排查用） |
| `-NoLog` | — | 不写 last-run.log |

## 性能：为什么它一开始会卡，以及改了什么

第一版能动但掉帧。用 `bench.py` 量了一遍，问题不是"动画写得太花"，而是**每帧在干不该每帧干的事**：

| 症状 | 真正原因 |
| --- | --- |
| 4.3 秒里样式重算占 **2453ms（57%）** | 每帧 `root.style.setProperty('--rl-p')`。自定义属性可继承，写在 `:root` 上等于让整棵子树（87 条动画规则、上百个节点）重新算样式 |
| 布局每帧都在跑 | 连接条的填充用 `width: calc(...)`、读头用 `left: calc(...)`，都是布局属性 |
| 持续掉帧、发热 | 面板 `backdrop-filter: blur(10px)`，身后还在动，等于每帧重算一次 10px 模糊；逐字落位和样本窗对焦各带 `blur(5~6px)`，每个字符一个合成层、每帧重新栅格化 |

改法（都在 `src/wb-overrides.css` 的"性能层"和 `mk.py` 的补丁里）：

1. 两个每帧变量改写到 `.rl-prog-bar` / `.rl-bar` 上 —— 重算范围从"整棵树"缩到"一条填充"
2. 填充 `width` → `clip-path`（只重绘不重排，渐变保持原尺寸）；读头 `left` → `transform`（宽度挂载时量一次）
3. 去掉面板 `backdrop-filter`、去掉逐字 blur、退场光圈去掉全屏 `drop-shadow`（描边加粗补回存在感）
4. `#rhine-splash` 加 `contain: layout style` + `translateZ(0)`，宿主在后面怎么重排都不波及它
5. **自适应降级**：播放头 400ms 量帧间隔，p95 超过 34ms 就加 `is-lite`，只去掉最费绘制的装饰层（点阵场位移、大字水印描边、警示斜纹、外环长转），主构图不动

### 实测（Chrome 1600×900，`bench.py`，同一台机器）

| 指标 | 改前 | 改后 | |
| --- | --- | --- | --- |
| 4.25s 内帧数（1×） | 314 | **436** | +39% |
| 平均帧间隔 | 13.6 ms | **9.75 ms** | −28% |
| p95 帧间隔 | 25.3 ms | **16.7 ms** | −34% |
| 样式重算 | 2453 ms | **857 ms** | **−65%** |
| CPU 4× 降速下帧数 | 61 | **254** | +316% |
| CPU 4× 下 p50 | 75 ms（≈13fps） | **13.9 ms** | −81% |
| CPU 4× 下超过 50ms 的帧 | 52 | **18** | −65% |

`4×` 那一列是 `Emulation.setCPUThrottlingRate=4` 逼出来的，用来模拟"WorkBuddy 正在启动、和开屏抢主线程"。
想自己复现：

```powershell
python .\bench.py --throttle 1     # 正常
python .\bench.py --throttle 4     # 模拟宿主抢 CPU
```

剩下的尖峰只有三处：`t=0`（首次挂载与首绘，一次性）、`t≈185ms`、`t≈3.1~3.2s`（"终端就绪"这一拍 + 退场预热）。
它们都在 1 帧的量级，肉眼是"轻微一顿"而不是卡成幻灯片。

## 已知代价

- **每次启动都要从脚本进**。任务栏那个固定图标没法改（系统保护区），点它不会带 CDP 端口。
- **CDP 端口在本次运行期间是开着的**。只绑 `127.0.0.1`，且 `remote-allow-origins` 只放行
  本机地址；但对本机进程而言它就是一个调试口，介意的话播完可以退出重开（用普通图标）。
- **宿主启动两次**（HoldBoot 的代价）：第一次自然启动到注入器接管为止，reload 后才是真启动。
  总启动时间比原生多一个开屏时长量级，换来动画满帧。可用 `-NoHoldBoot` 退回并发启动。
- **HoldBoot 依赖 Fetch 域**。若未来版本 CDP 行为变化导致 `Fetch.enable` 失败，注入器会
  自动退回普通注入（日志有"Fetch.enable 失败"字样），开屏仍会出现但可能掉帧。
- **非官方手段**。`WORKBUDDY_REMOTE_DEBUGGING_PORT` 是 WorkBuddy 自己有代码支持的，但没有
  对外承诺，后续版本可能移除。移除了这个目录只是失效，不会影响 WorkBuddy。
- 不改 `app.asar`、不改安装目录、不改任何现有快捷方式。卸载 = 删掉这个目录。

## 许可与出处

动画的样式表与时间轴机制来自 [dsh-rhine-splash](https://github.com/Respawn-ID/dsh-rhine-splash)
（MIT © 2026 ArtemisFowl），分发请保留 `src/LICENSE-upstream.txt` 与页面底部出处标注。

本项目是非官方爱好者作品，与《明日方舟》权利方鹰角网络及腾讯均无关联；不含任何游戏官方
美术素材，图形均为程序绘制。

## 开源与贡献

本项目以 **MIT 协议**完全开放——所有代码、注入载荷、构建脚本、基准测试与实验环境
（`holdtest/`）全部可见、可改、可分发。

**任何人都可以自由修改、改进、修复 bug 或卡顿掉帧问题**，欢迎提 issue 与 PR。
几个可能有价值的方向：

- **时序调优**：HoldBoot 的轮询间隔（120ms）、放行批处理、maxWait 上限（15s）
- **动画风格**：`src/upstream-splash.css` 的 `--B/--G/--R` 与 `src/splash.wb.js` 的
  `BEAT/STAGES` 是同一组时间点，改一处必须同步另一处
- **其他 WorkBuddy 版本**：Fetch 域行为、CSP、骨架屏结构在不同版本可能有差异
- **其他宿主**：任何带 CDP 调试口的 Electron 应用都能套用同一管道

### 贡献者

| 阶段 | 完成者 |
| --- | --- |
| 首帧注入链路（WORKBUDDY_REMOTE_DEBUGGING_PORT + addScriptToEvaluateOnNewDocument）、动画改造与中文化、CSS 性能层 | **DeepSeek** |
| 掉帧根因定位（录屏逐帧差分）、HoldBoot 网络闸门、CDP 后台读取线程、真机验证 | **GLM** |

## English Summary

A Rhine-Lab-style boot splash injected into the WorkBuddy desktop app's own window,
**before its first paint**, via the official `WORKBUDDY_REMOTE_DEBUGGING_PORT` CDP switch.

**HoldBoot network gate**: during playback, the injector holds ALL of the host's network
requests via CDP `Fetch` interception — not a single byte of host JS executes, so the
main thread belongs entirely to the splash animation. Frame drops are eliminated at the
root (measured: p95 frame interval 25.0ms → **9.0ms**; worst frame 342ms → 212ms).
When the timeline finishes (or the user skips), the gate releases everything and the
host boots at full speed; the splash waits for the real UI to mount before exiting.

This is a **WorkBuddy beautification project**, completed in relay by **DeepSeek and GLM**.
Fully open source (MIT) — anyone may modify, improve, or fix bugs and frame drops.
PRs and issues are welcome.

## GitHub 调研结论（动手前做的）

| 关键词 | 仓库数 | 结论 |
| --- | --- | --- |
| `workbuddy splash` / `workbuddy 开屏` | 0 | 没人做过开屏动画 |
| `workbuddy skin` | 89 | 换肤生态成熟，但注入时机都在页面加载之后 |
| `WORKBUDDY_REMOTE_DEBUGGING_PORT`（代码搜索） | 53 处 | 管道写法可参考，beautiCode 明确称其为官方 CDP 开关 |
| `addScriptToEvaluateOnNewDocument` + workbuddy | 80 处 | 有人登记了，但都只用它兜后续 reload，没人拿它做首帧开屏 |

参考并复用了这些项目的管道经验：
[starsstreaming/beautiCode](https://github.com/starsstreaming/beautiCode)（宿主适配器 + 官方开关说明）、
[h1048576/wide-ps](https://github.com/h1048576/wide-ps)（Windows/PowerShell 下的 CDP 客户端写法）、
[Heng0128/AgentSkin](https://github.com/Heng0128/AgentSkin)（WorkBuddy 注入引擎架构分析）。
