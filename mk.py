#!/usr/bin/env python3
"""把上游 dsh-rhine-splash 的 splash.js 改成 WorkBuddy 注入版，并产出三个产物：

  src/splash.wb.js      改造后的浏览器脚本（可读，便于维护）
  out/splash.inject.js  CDP 注入载荷：注入样式表 + 挂载开屏（自执行）
  out/splash.html       单文件预览页，双击即可看动画

样式：src/splash.css 逐字未改，src/wb-overrides.css 是增量层。
"""
from __future__ import annotations

import base64
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'src'
OUT = ROOT
OUT.mkdir(exist_ok=True, parents=True)


def read(p: pathlib.Path) -> str:
    t = p.read_text(encoding='utf-8')
    if not t.strip():
        sys.exit(f'空文件: {p}')
    return t


# --------------------------------------------------------------- JS 改造

def patch_js(text: str) -> str:
    edits: list[tuple[str, str]] = [
        # 1) 文件头注释
        ("""/**
 * Rhine Lab style boot splash — browser half.""",
         """/**
 * WorkBuddy 版莱茵生命开屏 — 浏览器端（派生自 dsh-rhine-splash，MIT）。"""),

        # 2) 默认配置：WorkBuddy 品牌 + iris 退场
        ("""  const DEFAULTS = {
    title: 'DEEPSEEK HARNESS',
    subtitle: 'RHINE LAB STYLE · ARTIFICIAL INTELLIGENCE DIVISION',
    code: 'RL-DSH/0.2',""",
         """  const DEFAULTS = {
    title: 'WORKBUDDY',
    subtitle: 'RHINE LAB STYLE · AGENT WORKBENCH DIVISION',
    code: 'RL-WB/0.2',
    poweredBy: 'WORKBUDDY',"""),

        ("""    exit: 'random',
    duration: BASE_MS,
    maxWait: 8000,
    skippable: true,
    replayOnReload: false,
  }""",
         """    exit: 'iris',
    duration: BASE_MS,
    maxWait: 8000,
    skippable: true,
    replayOnReload: true,
  }"""),

        # 3) 双语索引轨 + 阶段表
        ("""  const RAIL = ['ACCESS', 'IDENTITY', 'MODULES', 'SESSION', 'TERMINAL']""",
         """  const RAIL = ['ACCESS', 'IDENTITY', 'MODULES', 'SESSION', 'TERMINAL']
  // 索引轨的中文对照，与 RAIL 一一对应。
  const RAIL_ZH = ['接入', '身份', '模块', '会话', '终端']"""),

        ("""  const RAIL_AT = [500, BEAT.grant, BEAT.tiles, BEAT.session, BEAT.ready]""",
         """  const RAIL_AT = [500, BEAT.grant, BEAT.tiles, BEAT.session, BEAT.ready]
  // 双语阶段条：五段与索引轨同拍，第 1 段从 0 开始。
  const STAGES = [
    { at: 0, zh: '接入核验', en: 'ACCESS' },
    { at: BEAT.grant, zh: '身份确认', en: 'IDENTITY' },
    { at: BEAT.tiles, zh: '模块装载', en: 'MODULES' },
    { at: BEAT.session, zh: '会话建立', en: 'SESSION' },
    { at: BEAT.ready, zh: '终端就绪', en: 'TERMINAL' },
  ]"""),

        # 4) 索引轨中英并排
        ("""<span class="rl-rail-tx">${label}</span>""",
         """<span class="rl-rail-tx">${label}<em class="rl-cn">${RAIL_ZH[i]}</em></span>"""),

        # 5) 阶段条元素（放顶部框架条正中）
        ("""  const root = doc.createElement('div')""",
         """  const stagebar = `
<div class="rl-wb-stagebar">
  <span class="rl-wb-sb-no">阶段 <b>01</b> / 05</span>
  <i class="rl-wb-sb-sep"></i>
  <span class="rl-wb-sb-now"><span class="rl-wb-sb-zh">${STAGES[0].zh}</span><span class="rl-wb-sb-en">${STAGES[0].en}</span></span>
  <span class="rl-wb-sb-ticks">${STAGES.map(() => '<i></i>').join('')}</span>
</div>`

  const root = doc.createElement('div')"""),

        # 6) 顶部状态栏三态 + 英文/中文
        ("""<span class="rl-status-a">REQUESTING ACCESS</span><span class="rl-status-b">ACCESS GRANTED</span><span class="rl-status-c">TERMINAL READY</span>""",
         """<span class="rl-status-a">REQUESTING ACCESS<em class="rl-cn">请求接入</em></span><span class="rl-status-b">ACCESS GRANTED<em class="rl-cn">权限已授予</em></span><span class="rl-status-c">TERMINAL READY<em class="rl-cn">终端就绪</em></span>"""),

        # 7) 顶部中间插入阶段条
        ("""    <div class="rl-top-r"><span class="rl-live"><i></i>LIVE</span>""",
         """    ${stagebar}
    <div class="rl-top-r"><span class="rl-live"><i></i>LIVE</span>"""),

        # 8) 身份确认行
        ("""<div class="rl-access-sub"><i></i>ID CONFIRMED</div>""",
         """<div class="rl-access-sub"><i></i>ID CONFIRMED<em class="rl-cn">身份已确认</em></div>"""),

        # 9) 欢迎面板
        ("""<span>ACCESS LEVEL // INTERNAL</span></div>""",
         """<span>ACCESS LEVEL // INTERNAL<em class="rl-cn">内部权限</em></span></div>"""),
        ("""<div class="rl-w rl-w1">WELCOME TO</div>""",
         """<div class="rl-w rl-w1">WELCOME TO<em class="rl-cn">欢迎使用</em></div>"""),
        ("""<div class="rl-w rl-w2">INTERNAL TERMINAL</div>""",
         """<div class="rl-w rl-w2">INTERNAL TERMINAL<em class="rl-cn">内部终端</em></div>"""),

        # 10) POWERED BY 改为可配置
        ("""<div class="rl-powered">POWERED BY <b>DEEPSEEK</b><i></i></div>""",
         """<div class="rl-powered">POWERED BY <b></b><i></i></div>"""),

        # 11) 档案号前缀
        ("""  $('.rl-file-no').textContent = `DSH-${code.replace(/[^0-9A-Z]/gi, '').slice(-4).toUpperCase() || '0423'}`""",
         """  $('.rl-file-no').textContent = `WB-${code.replace(/[^0-9A-Z]/gi, '').slice(-4).toUpperCase() || '0417'}`
  $('.rl-powered b').textContent = text(cfg.poweredBy, DEFAULTS.poweredBy)"""),

        # 12) 宿主根节点：注入 WorkBuddy 时是 #root
        ("""  const appReady = () => {
    const app = doc.getElementById('root')""",
         """  const appReady = () => {
    // 注入 WorkBuddy 时宿主根节点是 #root；独立预览页用 #wb-app 占位。
    const app = doc.getElementById('root') || doc.getElementById('wb-app')"""),
    ]

    for old, new in edits:
        if old not in text:
            sys.exit('锚点未命中: ' + old.splitlines()[0][:70])
        text = text.replace(old, new, 1)

    # 13) 水印自适应（挂载后量宽）+ 阶段条驱动
    text = text.replace(
        """  doc.body.append(root)""",
        """  ;(doc.body || doc.documentElement).append(root)

  // 水印按标题首词铺满。上游固定 13vw 是照 "DEEPSEEK" 调的，WORKBUDDY 更长会溢出，
  // 所以挂载后量一次实际宽度再等比收。注意必须挂载后量，游离节点量出来全是 0。
  {
    const wm = $('.rl-watermark')
    const maxW = innerWidth * 0.62
    const w = wm.getBoundingClientRect().width
    if (w > maxW) wm.style.fontSize = `${(13 * maxW / w).toFixed(2)}vw`
  }

  // 自适应降级：宿主启动时会和我们抢渲染主线程，不同机器差别很大，所以不写死。
  // 播放头 24 帧（约 400ms）量一遍间隔，p95 超过 34ms 就切 is-lite。
  {
    const samples = []
    let last = performance.now()
    const step = (now) => {
      samples.push(now - last)
      last = now
      if (samples.length < 24) { requestAnimationFrame(step); return }
      const sorted = samples.slice().sort((a, b) => a - b)
      const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0
      if (p95 > 34) root.classList.add('is-lite')
    }
    requestAnimationFrame(step)
  }

  // 连接条读头改用 transform 位移（left 每帧改会触发布局），所以要先知道轨道宽度。
  // 必须在挂载之后量，游离节点量出来是 0。
  const syncBarWidth = () => {
    if (!barEl) return
    const w = barEl.getBoundingClientRect().width
    if (w > 0) barEl.style.setProperty('--rl-bar-w', `${w}px`)
  }
  syncBarWidth()
  addEventListener('resize', syncBarWidth)

  // ---- 双语阶段条：由 tick() 按时间轴毫秒驱动，与进度条严格同拍 ----
  const sbNo = $('.rl-wb-sb-no b')
  const sbZh = $('.rl-wb-sb-zh')
  const sbEn = $('.rl-wb-sb-en')
  const sbNow = $('.rl-wb-sb-now')
  const sbTicks = Array.from(root.querySelectorAll('.rl-wb-sb-ticks > i'))
  let stageIndex = -1
  const setStage = (index) => {
    if (index === stageIndex) return
    const swap = stageIndex !== -1
    stageIndex = index
    const stage = STAGES[index]
    sbNo.textContent = pad(index + 1)
    sbZh.textContent = stage.zh
    sbEn.textContent = stage.en
    sbTicks.forEach((tick, k) => {
      tick.classList.toggle('is-on', k < index)
      tick.classList.toggle('is-now', k === index)
    })
    if (swap && !reduced && typeof sbNow.animate === 'function') {
      sbNow.animate(
        [{ opacity: 0, transform: 'translateY(-3px)' }, { opacity: 1, transform: 'none' }],
        { duration: 240, easing: 'cubic-bezier(.16, 1, .3, 1)' },
      )
    }
  }
  setStage(0)""",
        1,
    )

    text = text.replace(
        """    pct.textContent = pad(Math.round(p * 100), 3)
    stepScramble(now)""",
        """    pct.textContent = pad(Math.round(p * 100), 3)
    if (!reduced && !leaving) {
      let index = 0
      for (let i = STAGES.length - 1; i > 0; i--) {
        if (ms >= STAGES[i].at) { index = i; break }
      }
      setStage(index)
    }
    stepScramble(now)""",
        1,
    )

    text = text.replace(
        """    if (reduced) setStage(STAGES.length - 1)""",
        """    if (reduced) setStage(STAGES.length - 1)""",
    )
    # 减弱动态时不跑时间轴，阶段条直接定在终点
    text = text.replace(
        """    t0 = performance.now()
    // Next frame, so the static first frame is committed before keyframes""",
        """    t0 = performance.now()
    if (reduced) setStage(STAGES.length - 1)
    // Next frame, so the static first frame is committed before keyframes""",
        1,
    )

    # 14) 关键：CDP 以 document-start 注入时既没有 body、documentElement 也可能还没有
    text = text.replace(
        """  const doc = document
  if (!doc.body || doc.getElementById(ID)) return""",
        """  const doc = document
  if (doc.getElementById(ID)) return

  // CDP 用 addScriptToEvaluateOnNewDocument 注入时，脚本在 document-start 执行，
  // 此刻还没有 document.body。挂到 <html> 上也能 fixed 铺满（append 那步做了兜底），
  // 反而能赶在宿主首帧之前；连 documentElement 都没有时才退回等 DOMContentLoaded。
  if (!doc.body && !doc.documentElement) {
    doc.addEventListener('DOMContentLoaded', () => mount(overrides), { once: true })
    return
  }""",
        1,
    )

    # 15) 主题优先跟随宿主写在 <html> 上的 data-theme
    text = text.replace(
        """  const dark = cfg.theme === 'dark' || (cfg.theme !== 'light' && (
    doc.documentElement.dataset.dsThemeSource !== undefined
      ? doc.body.hasAttribute('data-ds-dark-theme')
      : matches('(prefers-color-scheme: dark)')
  ))""",
        """  // 宿主（WorkBuddy）会在 <html> 上写 data-theme，优先跟随它，其次系统偏好。
  const hostTheme = doc.documentElement.dataset.theme
  const dark = cfg.theme === 'dark' || (cfg.theme !== 'light' && (
    hostTheme === 'dark' || hostTheme === 'light'
      ? hostTheme === 'dark'
      : (doc.documentElement.dataset.dsThemeSource !== undefined && doc.body
          ? doc.body.hasAttribute('data-ds-dark-theme')
          : matches('(prefers-color-scheme: dark)'))
  ))""",
        1,
    )

    # 16) 性能：每帧变量别写在 :root 上
    text = text.replace(
        """  const pct = $('.rl-pct')""",
        """  const pct = $('.rl-pct')
  // 每帧要变的两个变量，绑到极小的子树上去写（详见 wb-overrides.css 性能层）。
  // 写在 :root 上会让整棵子树重算——实测那是掉帧的主因。
  const progBar = $('.rl-prog-bar')
  const barEl = $('.rl-bar')""",
        1,
    )

    text = text.replace(
        """    root.style.setProperty('--rl-p', p.toFixed(4))
    root.style.setProperty('--rl-q', q.toFixed(4))""",
        """    if (progBar) progBar.style.setProperty('--rl-p', p.toFixed(4))
    if (barEl) barEl.style.setProperty('--rl-q', q.toFixed(4))""",
        1,
    )

    # 读头改用 transform，需要轨道宽度：挂载后量一次，窗口缩放时更新
    text = text.replace(
        """  /**
   * Mount the overlay.""",
        """  /**
   * Mount the overlay.""",
        1,
    )
    text = text.replace(
        """  // -------------------------------------------------------- launch signal""",
        """  // 读头位移用 transform（left 每帧改会触发布局），所以要知道轨道宽度
  const syncBarWidth = () => {
    if (!barEl) return
    const w = barEl.getBoundingClientRect().width
    if (w > 0) barEl.style.setProperty('--rl-bar-w', `${w}px`)
  }
  syncBarWidth()
  addEventListener('resize', syncBarWidth)

  // -------------------------------------------------------- launch signal""",
        1,
    )

    text = text.replace(
        """    globalThis.removeEventListener('keydown', onKey, true)""",
        """    globalThis.removeEventListener('keydown', onKey, true)
    removeEventListener('resize', syncBarWidth)""",
        1,
    )

    # 17) hold-boot 网络闸门：注入器用 CDP Fetch 把宿主网络请求全部扣住，
    #     主线程在整个播放期归开屏独占（真机录屏证明掉帧来自宿主启动的长同步任务，
    #     CSS 级优化救不了主线程被饿死）。
    text = text.replace(
        """  const cfg = Object.assign({}, DEFAULTS, globalThis.__RHINE_SPLASH__ || {}, overrides)""",
        """  const cfg = Object.assign({}, DEFAULTS, globalThis.__RHINE_SPLASH__ || {}, overrides)

  // ---- WorkBuddy hold-boot（网络闸门） ----
  // 注入器（Start-WorkBuddySplash.ps1）通过 CDP Fetch 扣住宿主全部网络请求，
  // 让主线程在整个播放期归开屏独占。HOLD 为真时：
  //   1) 时间轴自然走完（exitWhenReady）→ 置 __WB_SPLASH_DONE__，注入器放行网络，
  //      宿主开始全速启动；
  //   2) 照旧等 #root 挂上宿主 UI（appReady）再播退场动画——退场时宿主已在屏上；
  //   3) 跳过（点击/Esc）→ leave() 同样置 DONE，宿主立刻启动。
  const HOLD = globalThis.__WB_SPLASH_HOLD__ === true
  let holdSignalled = false
  const signalHold = () => {
    if (!HOLD || holdSignalled) return
    holdSignalled = true
    try { globalThis.__WB_SPLASH_DONE__ = true } catch (_) { /* storage 不可用也无所谓 */ }
  }""",
        1,
    )

    # 18) hold-boot：等宿主就绪是常态，硬上限从 8s 提到 15s
    text = text.replace(
        """  const maxWait = Math.max(num(cfg.maxWait, DEFAULTS.maxWait), exitAt)""",
        """  let maxWait = Math.max(num(cfg.maxWait, DEFAULTS.maxWait), exitAt)
  if (HOLD) maxWait = Math.max(maxWait, 15000)""",
        1,
    )

    # 19) hold-boot：上游把「#root 不存在」当就绪（它假设文档已解析完）。
    #     hold 期间解析器停在 <head>，#root 还没被解析出来，必须等它真正有内容。
    text = text.replace(
        """  const appReady = () => {
    // 注入 WorkBuddy 时宿主根节点是 #root；独立预览页用 #wb-app 占位。
    const app = doc.getElementById('root') || doc.getElementById('wb-app')
    return app === null || app.childElementCount > 0
  }""",
        """  const appReady = () => {
    // 注入 WorkBuddy 时宿主根节点是 #root；独立预览页用 #wb-app 占位。
    const app = doc.getElementById('root') || doc.getElementById('wb-app')
    if (HOLD) return app !== null && app.childElementCount > 0
    return app === null || app.childElementCount > 0
  }""",
        1,
    )

    # 20) hold-boot：exitWhenReady 先放行网络再等宿主；#root 可能还没被解析
    #     出来（解析器停在被扣住的脚本上），此时退化为观察整棵树。
    text = text.replace(
        """  const exitWhenReady = () => {
    if (appReady()) return leave()
    const app = doc.getElementById('root')
    observer = new MutationObserver(() => { if (appReady()) leave() })
    observer.observe(app, { childList: true })
  }""",
        """  const exitWhenReady = () => {
    signalHold() // 网络闸门：时间轴走完，先放宿主进来启动
    if (appReady()) return leave()
    observer = new MutationObserver(() => { if (appReady()) leave() })
    const app = doc.getElementById('root')
    if (app) observer.observe(app, { childList: true })
    else observer.observe(doc.documentElement || doc, { childList: true, subtree: true })
  }""",
        1,
    )

    # 21) hold-boot：任何退场路径（跳过、maxWait 兜底）都要放行网络
    text = text.replace(
        """  const leave = () => {
    if (leaving || destroyed) return
    leaving = true""",
        """  const leave = () => {
    if (leaving || destroyed) return
    signalHold() // 跳过也要放行网络，否则宿主永远起不来
    leaving = true""",
        1,
    )

    return text


def main() -> None:
    css_upstream = read(SRC / 'upstream-splash.css')
    css_override = read(SRC / 'wb-overrides.css')
    js = patch_js(read(SRC / 'upstream-splash.js'))

    img = (SRC / 'specimen.jpg').read_bytes()
    css = (
        '/* ==== dsh-rhine-splash lib/splash.css 原文，逐字未改 ==== */\n'
        + css_upstream
        + '\n\n/* ==== WorkBuddy 增量层 ==== */\n'
        + css_override
        + '\n\n/* ==== 内联素材 ==== */\n'
        + '#rhine-splash{--rl-img-specimen:url("data:image/jpeg;base64,'
        + base64.b64encode(img).decode('ascii')
        + '");}\n'
    )

    (SRC / 'splash.wb.js').write_text(js, encoding='utf-8')

    # ---- 注入载荷：补样式表 → 挂载开屏 ----
    # 关键：addScriptToEvaluateOnNewDocument 在 document-start 执行时，
    # document.documentElement 可能还是 null，此时 appendChild 会抛 TypeError
    # 直接掐断整个载荷。所以包一层等 <html> 出现的引导。
    payload = (
        '/* WorkBuddy 莱茵生命开屏 · CDP 注入载荷（build.py 生成，勿手改）\n'
        ' * 视觉与时间轴派生自 dsh-rhine-splash，MIT © 2026 ArtemisFowl */\n'
        '(function () {\n'
        '  var booted = false;\n'
        '  function boot() {\n'
        '    if (booted) { return; }\n'
        '    booted = true;\n'
        '    var CSS_ID = "rhine-splash-css";\n'
        '    var CSS = ' + json.dumps(css, ensure_ascii=False) + ';\n'
        '    if (!document.getElementById(CSS_ID)) {\n'
        '      var style = document.createElement("style");\n'
        '      style.id = CSS_ID;\n'
        '      style.textContent = CSS;\n'
        '      (document.head || document.documentElement).appendChild(style);\n'
        '    }\n'
        '    globalThis.__RHINE_SPLASH__ = Object.assign({\n'
        '      title: "WORKBUDDY",\n'
        '      subtitle: "RHINE LAB STYLE · AGENT WORKBENCH DIVISION",\n'
        '      code: "RL-WB/0.2",\n'
        '      poweredBy: "WORKBUDDY",\n'
        '      theme: "auto",\n'
        '      exit: "iris",\n'
        '      duration: 4500,\n'
        '      skippable: true,\n'
        '      replayOnReload: true\n'
        '    }, globalThis.__RHINE_SPLASH__ || {});\n'
        + js
        + '\n  }\n'
        '  if (document.documentElement) { boot(); return; }\n'
        '  // document-start：<html> 还没建出来，等它出现（仍在解析期，赶得上首帧）\n'
        '  try {\n'
        '    var mo = new MutationObserver(function () {\n'
        '      if (document.documentElement) { mo.disconnect(); boot(); }\n'
        '    });\n'
        '    mo.observe(document, { childList: true, subtree: true });\n'
        '  } catch (e) {\n'
        '    document.addEventListener("readystatechange", function () {\n'
        '      if (document.documentElement) { boot(); }\n'
        '    });\n'
        '  }\n'
        '})();\n'
    )
    (OUT / 'splash.inject.js').write_text(payload, encoding='utf-8')

    # ---- 单文件预览页 ----
    preview = (
        '<!DOCTYPE html>\n<html lang="zh-CN"><head><meta charset="UTF-8">'
        '<title>WorkBuddy · 莱茵生命开屏</title>'
        '<style>html,body{margin:0;height:100%;background:#151517;overflow:hidden}'
        '#wb-app{height:100%}</style>'
        '<style>' + css + '</style></head><body>'
        '<div id="root"><div id="wb-app"></div></div>'
        '<script>' + payload + '</script>'
        '<script>addEventListener("keydown",e=>{if(e.key==="r"||e.key==="R")'
        'window.__rhineSplash&&window.__rhineSplash.replay()})</script>'
        '</body></html>\n'
    )
    (OUT / 'splash.html').write_text(preview, encoding='utf-8')

    for f in ('splash.inject.js', 'splash.html'):
        print(f'{f}  {(OUT / f).stat().st_size / 1024:.1f} KB')
    print(f'CSS {len(css) / 1024:.1f} KB · JS {len(js) / 1024:.1f} KB')


if __name__ == '__main__':
    main()
