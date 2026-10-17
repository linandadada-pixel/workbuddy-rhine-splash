/**
 * WorkBuddy 版莱茵生命开屏 — 浏览器端（派生自 dsh-rhine-splash，MIT）。
 *
 * Injected by lib/index.js as a body script that runs before the DeepSeek
 * Harness shell boots. It builds a full-window overlay in two acts — an
 * access check ("PERMISSION AUTHORIZED") and the terminal welcome lockup —
 * framed by a persistent HUD (lockup, index rail, specimen scope, file tag,
 * caution tag, progress). The CSS timeline starts once the window is
 * visible; the overlay leaves through a split-door exit once the minimum
 * duration has passed and the shell has rendered into #root (or maxWait
 * elapses). Config arrives on globalThis.__RHINE_SPLASH__; every key has a
 * local fallback so the script also runs standalone (see preview/).
 */
(() => {
  'use strict'

  function mount(overrides = {}) {

  const ID = 'rhine-splash'
  const PLAYED_KEY = 'rhine-splash:played'
  const BASE_MS = 4500 // the CSS timeline is authored for this duration
  const EXITS = {
    doors: { ms: 820 },
    decode: { ms: 1100, run: decodeExit },
    glitch: { ms: 720, run: glitchExit },
    iris: { ms: 1100, run: irisExit }, // 300 ms prime + 760 ms aperture
  }
  const REDUCED_HOLD_MS = 900
  const REDUCED_EXIT_MS = 320
  const DEFAULTS = {
    title: 'WORKBUDDY',
    subtitle: 'RHINE LAB STYLE · AGENT WORKBENCH DIVISION',
    code: 'RL-WB/0.2',
    poweredBy: 'WORKBUDDY',
    accentLight: '#e46f24',
    accentDark: '#f0893e',
    theme: 'auto',
    exit: 'iris',
    duration: BASE_MS,
    maxWait: 8000,
    skippable: true,
    replayOnReload: true,
  }
  const ACCESS_FROM = 'REQUESTING ACCESS'
  const ACCESS_TO = 'PERMISSION AUTHORIZED'
  const RAIL = ['ACCESS', 'IDENTITY', 'MODULES', 'SESSION', 'TERMINAL']
  // 索引轨的中文对照，与 RAIL 一一对应。
  const RAIL_ZH = ['接入', '身份', '模块', '会话', '终端']
  // Timeline beats (ms on the BASE_MS timeline); keep in sync with splash.css.
  const BEAT = { grant: 1250, tiles: 2550, session: 2950, ready: 3300 }
  const RAIL_AT = [500, BEAT.grant, BEAT.tiles, BEAT.session, BEAT.ready]
  // 双语阶段条：五段与索引轨同拍，第 1 段从 0 开始。
  const STAGES = [
    { at: 0, zh: '接入核验', en: 'ACCESS' },
    { at: BEAT.grant, zh: '身份确认', en: 'IDENTITY' },
    { at: BEAT.tiles, zh: '模块装载', en: 'MODULES' },
    { at: BEAT.session, zh: '会话建立', en: 'SESSION' },
    { at: BEAT.ready, zh: '终端就绪', en: 'TERMINAL' },
  ]
  // Loading % follows the same beats instead of a free-running curve.
  const PROGRESS = [[0, 0], [300, 0.05], [BEAT.grant, 0.24], [BEAT.tiles, 0.56], [BEAT.session, 0.8], [BEAT.ready, 0.97]]
  // The link meter under INTERNAL TERMINAL runs from the tiles to ready.
  const LINK = [[BEAT.tiles, 0], [BEAT.session, 0.55], [BEAT.ready, 0.97]]
  const TILES = [
    ['LLM', 'REASONING CORE'],
    ['MCP', 'CONNECTOR BUS'],
    ['SBX', 'SANDBOX'],
    ['CTX', 'CONTEXT STORE'],
    ['TOOL', 'TOOLCHAIN'],
  ]
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/<>='

  const doc = document
  if (doc.getElementById(ID)) return

  // CDP 用 addScriptToEvaluateOnNewDocument 注入时，脚本在 document-start 执行，
  // 此刻还没有 document.body。挂到 <html> 上也能 fixed 铺满（append 那步做了兜底），
  // 反而能赶在宿主首帧之前；连 documentElement 都没有时才退回等 DOMContentLoaded。
  if (!doc.body && !doc.documentElement) {
    doc.addEventListener('DOMContentLoaded', () => mount(overrides), { once: true })
    return
  }

  const cfg = Object.assign({}, DEFAULTS, globalThis.__RHINE_SPLASH__ || {}, overrides)

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
  }

  if (!cfg.replayOnReload) {
    try {
      if (sessionStorage.getItem(PLAYED_KEY)) return
      sessionStorage.setItem(PLAYED_KEY, String(Date.now()))
    } catch (_) { /* storage blocked: play every time */ }
  }

  const matches = (query) => {
    try { return matchMedia(query).matches } catch (_) { return false }
  }
  const num = (value, fallback) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback)
  const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value))
  const color = (value, fallback) => {
    try { return typeof value === 'string' && CSS.supports('color', value) ? value : fallback } catch (_) { return fallback }
  }
  const text = (value, fallback) => (typeof value === 'string' && value.trim() ? value.trim() : fallback)

  // The theme bootstrap row (dsh-client-ui-theme) runs before us and marks the
  // body; without it (standalone page) fall back to the OS preference.
  // 宿主（WorkBuddy）会在 <html> 上写 data-theme，优先跟随它，其次系统偏好。
  const hostTheme = doc.documentElement.dataset.theme
  const dark = cfg.theme === 'dark' || (cfg.theme !== 'light' && (
    hostTheme === 'dark' || hostTheme === 'light'
      ? hostTheme === 'dark'
      : (doc.documentElement.dataset.dsThemeSource !== undefined && doc.body
          ? doc.body.hasAttribute('data-ds-dark-theme')
          : matches('(prefers-color-scheme: dark)'))
  ))
  const reduced = cfg.reducedMotion === true || matches('(prefers-reduced-motion: reduce)')

  function pickExit(value) {
    const keys = Object.keys(EXITS)
    let previous
    try { previous = localStorage.getItem('rhine-splash:last-exit') } catch (_) { /* storage blocked */ }
    const choices = keys.filter((key) => key !== previous)
    const chosen = keys.includes(value) ? value : choices[Math.floor(Math.random() * choices.length)]
    try { localStorage.setItem('rhine-splash:last-exit', chosen) } catch (_) { /* storage blocked */ }
    return chosen
  }

  const exitName = reduced ? 'fade' : pickExit(cfg.exit)
  const exitMs = reduced ? REDUCED_EXIT_MS : EXITS[exitName].ms
  const duration = clamp(num(cfg.duration, DEFAULTS.duration), 0, 15000)
  const speed = clamp(duration / BASE_MS, 0.45, 2)
  const exitAt = reduced ? REDUCED_HOLD_MS : Math.max(duration - exitMs, 600)
  let maxWait = Math.max(num(cfg.maxWait, DEFAULTS.maxWait), exitAt)
  if (HOLD) maxWait = Math.max(maxWait, 15000)

  const title = text(cfg.title, DEFAULTS.title)
  const code = text(cfg.code, DEFAULTS.code)

  // ---------------------------------------------------------------- markup

  /** Small deterministic PRNG so the barcode is stable for a given code. */
  const prng = (seed) => {
    let s = 2166136261
    for (const ch of seed) s = Math.imul(s ^ ch.charCodeAt(0), 16777619) >>> 0
    return () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0)
  }

  const barcode = (seed, width = 148, height = 20) => {
    const next = prng(seed)
    let x = 0
    let rects = ''
    while (x < width) {
      const r = next()
      const bar = 1 + ((r >>> 27) % 3)
      if (x + bar > width) break
      rects += `<rect x="${x}" width="${bar}" height="${height}"/>`
      x += bar + 1 + ((r >>> 23) % 3)
    }
    return `<svg class="rl-barcode" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">${rects}</svg>`
  }

  const C = 110 // emblem centre in its 220×220 viewBox
  const emblem = `
<svg class="rl-e" viewBox="0 0 220 220" aria-hidden="true">
  <defs>
    <linearGradient id="rl-sweep-g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="currentColor" stop-opacity="0"/>
      <stop offset="1" stop-color="currentColor" stop-opacity=".3"/>
    </linearGradient>
  </defs>
  <g class="rl-e-ticks">
    <circle cx="${C}" cy="${C}" r="93" pathLength="360" stroke-dasharray=".5 4.5" stroke-width="5"/>
    <circle class="rl-e-major" cx="${C}" cy="${C}" r="93" pathLength="360" stroke-dasharray="1.2 28.8" stroke-width="9"/>
  </g>
  <circle class="rl-e-ring" cx="${C}" cy="${C}" r="80" pathLength="1"/>
  <g class="rl-e-sweep"><path d="M${C} ${C} L${C} 32 A78 78 0 0 1 165.15 54.85 Z" fill="url(#rl-sweep-g)"/></g>
  <g class="rl-e-arcs">
    <circle class="rl-e-arc" cx="${C}" cy="${C}" r="70" pathLength="360" stroke-dasharray="96 264"/>
    <circle class="rl-e-arc rl-e-arc--b" cx="${C}" cy="${C}" r="70" pathLength="360" stroke-dasharray="38 322" transform="rotate(170 ${C} ${C})"/>
  </g>
  <g class="rl-e-cross"><path d="M${C} 50V58M${C} 162V170M50 ${C}H58M162 ${C}H170"/></g>
  <polygon class="rl-e-hex" pathLength="1" points="110,64 149.84,87 149.84,133 110,156 70.16,133 70.16,87"/>
  <g class="rl-e-mol">
    <path class="rl-e-bond" d="M${C} ${C}L110 86M${C} ${C}L130.78 122M${C} ${C}L89.22 122"/>
    <circle class="rl-e-node" cx="110" cy="86" r="3.4"/>
    <circle class="rl-e-node" cx="130.78" cy="122" r="3.4"/>
    <circle class="rl-e-node" cx="89.22" cy="122" r="3.4"/>
    <circle class="rl-e-core" cx="${C}" cy="${C}" r="5.6"/>
  </g>
  <g class="rl-e-label"><text x="${C}" y="8.5">001</text><text x="${C}" y="217">SYS</text></g>
</svg>`

  const access = `
<svg class="rl-access-ring" viewBox="0 0 240 240" aria-hidden="true">
  <circle class="rl-ar-faint" cx="120" cy="120" r="104"/>
  <g class="rl-ar-arcs">
    <circle cx="120" cy="120" r="104" pathLength="360" stroke-dasharray="46 314" transform="rotate(200 120 120)"/>
    <circle cx="120" cy="120" r="104" pathLength="360" stroke-dasharray="46 314" transform="rotate(20 120 120)"/>
  </g>
</svg>`

  const rail = RAIL.map((label, i) =>
    `<div class="rl-rail-item" style="--i:${i};--at:${RAIL_AT[i]}"><span class="rl-rail-mk"></span><span class="rl-rail-no">0${i + 1}</span><span class="rl-rail-tx">${label}<em class="rl-cn">${RAIL_ZH[i]}</em></span><i class="rl-rail-bar"></i></div>`,
  ).join('')

  const tiles = TILES.map(([abbr, caption], i) =>
    `<div class="rl-tile${i === 0 ? ' rl-tile--hot' : ''}" style="--i:${i}"><span class="rl-tile-no">M-0${i + 1}</span><span class="rl-tile-ab">${abbr}</span><span class="rl-tile-cap">${caption}</span></div>`,
  ).join('')

  const stagebar = `
<div class="rl-wb-stagebar">
  <span class="rl-wb-sb-no">阶段 <b>01</b> / 05</span>
  <i class="rl-wb-sb-sep"></i>
  <span class="rl-wb-sb-now"><span class="rl-wb-sb-zh">${STAGES[0].zh}</span><span class="rl-wb-sb-en">${STAGES[0].en}</span></span>
  <span class="rl-wb-sb-ticks">${STAGES.map(() => '<i></i>').join('')}</span>
</div>`

  const root = doc.createElement('div')
  root.id = ID
  root.className = 'rl-root'
  root.dataset.theme = dark ? 'dark' : 'light'
  root.dataset.exit = exitName
  root.setAttribute('aria-hidden', 'true')
  root.style.setProperty('--rl-accent', dark ? color(cfg.accentDark, DEFAULTS.accentDark) : color(cfg.accentLight, DEFAULTS.accentLight))
  root.style.setProperty('--rl-k', String(speed))
  if (reduced) root.classList.add('is-reduced')

  root.innerHTML = `
<div class="rl-door rl-door--top"></div>
<div class="rl-door rl-door--bottom"></div>
<div class="rl-seam"></div>
<div class="rl-stage">
  <div class="rl-drag"></div>
  <div class="rl-field"></div>
  <div class="rl-watermark"></div>
  <i class="rl-orbit rl-orbit--1"></i><i class="rl-orbit rl-orbit--2"></i>
  <i class="rl-corner rl-corner--tl"></i><i class="rl-corner rl-corner--tr"></i>
  <i class="rl-corner rl-corner--bl"></i><i class="rl-corner rl-corner--br"></i>
  <i class="rl-reg rl-reg--a"></i><i class="rl-reg rl-reg--b"></i><i class="rl-reg rl-reg--c"></i>

  <div class="rl-top">
    <div class="rl-top-l">
      <span class="rl-sq"></span>
      <span class="rl-status"><span class="rl-status-a">REQUESTING ACCESS<em class="rl-cn">请求接入</em></span><span class="rl-status-b">ACCESS GRANTED<em class="rl-cn">权限已授予</em></span><span class="rl-status-c">TERMINAL READY<em class="rl-cn">终端就绪</em></span></span>
      <span class="rl-dim">// 启动序列</span>
    </div>
    ${stagebar}
    <div class="rl-top-r"><span class="rl-live"><i></i>LIVE</span><span class="rl-code"></span><span class="rl-clock"></span></div>
  </div>

  <div class="rl-lockup">
    <div class="rl-lk-1"></div>
    <div class="rl-lk-2">SYNTHESIZE INFORMATION</div>
    <div class="rl-lk-3">AGENT <b>OS</b></div>
  </div>

  <div class="rl-rail"><i class="rl-rail-line"></i><i class="rl-rail-sig"></i>${rail}</div>

  <div class="rl-access">
    ${access}
    <i class="rl-access-dot rl-access-dot--t"></i><i class="rl-access-dot rl-access-dot--b"></i>
    <div class="rl-access-text">${ACCESS_FROM}<span class="rl-ellipsis">...</span></div>
    <div class="rl-access-sub"><i></i>ID CONFIRMED<em class="rl-cn">身份已确认</em></div>
  </div>

  <div class="rl-center">
    <i class="rl-handoff"></i>
    <div class="rl-emblem">
      <i class="rl-gl rl-gl--h"></i><i class="rl-gl rl-gl--v1"></i><i class="rl-gl rl-gl--v2"></i>
      ${emblem}
    </div>
    <div class="rl-divider"></div>
    <div class="rl-text">
      <div class="rl-panel"><i></i><i></i><i></i><i></i><span class="rl-panel-id">PANEL-A1</span></div>
      <div class="rl-over"><span class="rl-sq"></span><span>ACCESS LEVEL // INTERNAL<em class="rl-cn">内部权限</em></span></div>
      <div class="rl-w rl-w1">WELCOME TO<em class="rl-cn">欢迎使用</em></div>
      <div class="rl-title"></div>
      <div class="rl-w rl-w2">INTERNAL TERMINAL<em class="rl-cn">内部终端</em></div>
      <div class="rl-bar"><i class="rl-bar-fill"></i><i class="rl-bar-head"></i></div>
      <div class="rl-sub"></div>
      <div class="rl-tiles">${tiles}</div>
    </div>
  </div>

  <div class="rl-specimen">
    <div class="rl-spec-label"><b>LAB-01</b><span>SPECIMEN · CELL CULTURE</span></div>
    <i class="rl-spec-lead"></i>
    <div class="rl-spec-view"><i class="rl-spec-scan"></i></div>
    <div class="rl-spec-data"><span>MAG ×4.0K</span><span>HV 12.0 kV</span><span>WD 8.2 mm</span></div>
    <div class="rl-spec-scale"><i></i>50 µm</div>
  </div>

  <div class="rl-file">
    <i class="rl-file-lead"></i>
    <div class="rl-file-box">
      <div>FILE NUMBER: <b class="rl-file-no"></b></div>
      <div>CONFIDENTIALITY: <b>INTERNAL</b></div>
    </div>
    <div class="rl-redact"><i style="--w:92%"></i><i style="--w:68%"></i><i class="rl-redact--h" style="--w:80%"></i></div>
    <div class="rl-code-row">${barcode(code)}<span class="rl-code-tx"></span></div>
  </div>

  <div class="rl-foot-r">
    <div class="rl-caution"><i></i><span>CAUTION · AUTHORIZED PERSONNEL ONLY</span></div>
    <div class="rl-prog">
      <div class="rl-prog-head"><span class="rl-prog-label">LOADING</span><span class="rl-pct">000</span><span class="rl-pct-unit">%</span></div>
      <div class="rl-prog-bar"><i></i></div>
      <div class="rl-prog-ticks"></div>
    </div>
    <div class="rl-powered">POWERED BY <b></b><i></i></div>
  </div>

  <div class="rl-hint">点击任意处跳过 · CLICK TO SKIP</div>
</div>`

  const $ = (selector) => root.querySelector(selector)

  /** Split a string into indexed spans so CSS can stagger each glyph. */
  const spell = (host, value, cls) => {
    const glyphs = Array.from(value)
    host.textContent = ''
    const spans = glyphs.map((glyph, i) => {
      const span = doc.createElement('span')
      span.className = glyph === ' ' ? `${cls} ${cls}--sp` : cls
      span.style.setProperty('--i', String(i))
      span.textContent = glyph === ' ' ? ' ' : glyph
      host.append(span)
      return span
    })
    host.style.setProperty('--n', String(glyphs.length))
    return spans
  }

  spell($('.rl-title'), title, 'rl-ch')
  const sub = $('.rl-sub')
  spell(sub, text(cfg.subtitle, DEFAULTS.subtitle), 'rl-sc')
  sub.append(Object.assign(doc.createElement('span'), { className: 'rl-caret' }))
  $('.rl-lk-1').textContent = title
  $('.rl-watermark').textContent = title.split(/\s+/)[0]
  $('.rl-code').textContent = code
  $('.rl-file-no').textContent = `WB-${code.replace(/[^0-9A-Z]/gi, '').slice(-4).toUpperCase() || '0417'}`
  $('.rl-powered b').textContent = text(cfg.poweredBy, DEFAULTS.poweredBy)
  $('.rl-code-tx').textContent = code
  if (!cfg.skippable) $('.rl-hint').remove()

  const clock = $('.rl-clock')
  const pct = $('.rl-pct')
  // 每帧要变的两个变量，绑到极小的子树上去写（详见 wb-overrides.css 性能层）。
  // 写在 :root 上会让整棵子树重算——实测那是掉帧的主因。
  const progBar = $('.rl-prog-bar')
  const barEl = $('.rl-bar')
  const pad = (n, w = 2) => String(n).padStart(w, '0')
  const renderClock = () => {
    const d = new Date()
    clock.textContent = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
  renderClock()

  ;(doc.body || doc.documentElement).append(root)

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
  setStage(0)

  // -------------------------------------------------------------- timeline

  let started = false
  let leaving = false
  let destroyed = false
  let t0 = 0
  let frame = 0
  let exitFrame = 0
  let leaveAt = 0
  let meters = [0, 0] // [loading, link] at the last pre-exit frame
  let observer
  const timers = []
  const later = (fn, ms) => { timers.push(setTimeout(fn, ms)) }

  const appReady = () => {
    // 注入 WorkBuddy 时宿主根节点是 #root；独立预览页用 #wb-app 占位。
    const app = doc.getElementById('root') || doc.getElementById('wb-app')
    if (HOLD) return app !== null && app.childElementCount > 0
    return app === null || app.childElementCount > 0
  }

  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

  /** Piecewise eased value along [timelineMs, value] milestones. */
  const along = (stops, ms) => {
    if (ms <= stops[0][0]) return stops[0][1]
    for (let i = 1; i < stops.length; i++) {
      const [t1, v1] = stops[i]
      if (ms <= t1) {
        const [t0, v0] = stops[i - 1]
        return v0 + (v1 - v0) * easeInOut((ms - t0) / (t1 - t0))
      }
    }
    return stops[stops.length - 1][1]
  }

  // Act one: "REQUESTING ACCESS" decrypts glyph by glyph into the grant.
  const accessText = $('.rl-access-text')
  let scramble = null
  const startScramble = () => {
    if (destroyed) return
    const spans = spell(accessText, ACCESS_TO, 'rl-ac')
    const next = prng(ACCESS_TO + Date.now())
    const begin = performance.now()
    // Every glyph settles before the grant beat (BEAT.grant).
    const settleAt = spans.map((_, i) => (100 + i * 18 + (next() % 80)) * speed)
    scramble = { spans, begin, settleAt, next, flickAt: 0 }
  }
  const stepScramble = (now) => {
    if (!scramble) return
    const elapsed = now - scramble.begin
    const flick = now >= scramble.flickAt // re-roll glyphs ~22×/s, not every frame
    if (flick) scramble.flickAt = now + 45
    let pending = 0
    scramble.spans.forEach((span, i) => {
      const target = ACCESS_TO[i]
      if (target === ' ') return
      if (elapsed >= scramble.settleAt[i]) {
        if (span.textContent !== target) {
          span.textContent = target
          span.classList.remove('is-raw')
        }
      } else {
        pending++
        if (flick) span.textContent = GLYPHS[scramble.next() % GLYPHS.length]
        span.classList.add('is-raw')
      }
    })
    if (pending === 0) scramble = null
  }

  const tick = () => {
    if (destroyed) return
    const now = performance.now()
    const elapsed = now - t0
    const ms = elapsed / speed
    let p
    let q
    if (reduced) {
      p = easeInOut(Math.min(1, elapsed / exitAt)) * 0.97
      q = 1
    } else if (ms < BEAT.ready) {
      p = along(PROGRESS, ms)
      q = along(LINK, ms)
    } else {
      p = q = Math.min(0.99, 0.97 + (ms - BEAT.ready) / 60000)
    }
    if (leaving) {
      // Both meters complete while the stage fades out.
      const k = easeInOut(Math.min(1, (now - leaveAt) / 200))
      p = meters[0] + (1 - meters[0]) * k
      q = meters[1] + (1 - meters[1]) * k
    } else {
      meters = [p, q]
    }
    if (progBar) progBar.style.setProperty('--rl-p', p.toFixed(4))
    if (barEl) barEl.style.setProperty('--rl-q', q.toFixed(4))
    pct.textContent = pad(Math.round(p * 100), 3)
    if (!reduced && !leaving) {
      let index = 0
      for (let i = STAGES.length - 1; i > 0; i--) {
        if (ms >= STAGES[i].at) { index = i; break }
      }
      setStage(index)
    }
    stepScramble(now)
    frame = requestAnimationFrame(tick)
  }

  const destroy = () => {
    if (destroyed) return
    destroyed = true
    timers.forEach(clearTimeout)
    cancelAnimationFrame(frame)
    cancelAnimationFrame(exitFrame)
    observer?.disconnect()
    doc.removeEventListener('visibilitychange', onVisible)
    globalThis.removeEventListener('focus', start)
    globalThis.removeEventListener('keydown', onKey, true)
    removeEventListener('resize', syncBarWidth)
    root.remove()
  }

  const leave = () => {
    if (leaving || destroyed) return
    signalHold() // 跳过也要放行网络，否则宿主永远起不来
    leaving = true
    leaveAt = performance.now()
    // Run the exit before .is-leaving: anything it measures or sets (the iris
    // centre and scale cap) must exist when the exit's CSS animations are
    // created, and measuring forces a style pass.
    if (!reduced && EXITS[exitName].run) {
      try { EXITS[exitName].run() } catch (_) { root.dataset.exit = 'fade' }
    }
    root.classList.add('is-leaving')
    later(destroy, exitMs + 60)
  }

  function decodeExit() {
    const canvas = doc.createElement('canvas')
    canvas.className = 'rl-decode'
    root.append(canvas)
    const width = innerWidth
    const height = innerHeight
    const ratio = devicePixelRatio || 1
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context unavailable')
    ctx.scale(ratio, ratio)
    ctx.font = '500 11px "SF Mono", Menlo, Consolas, monospace'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    const style = getComputedStyle(root)
    const bg = style.getPropertyValue('--rl-bg').trim()
    const ink = style.getPropertyValue('--rl-ink').trim()
    const accent = style.getPropertyValue('--rl-accent').trim()
    const glyphs = '0123456789ABCDEF<>/{}[]=+*#'
    const cols = Math.ceil(width / 14)
    const rows = Math.ceil(height / 18)
    const count = cols * rows
    const encodeAt = new Float32Array(count)
    const clearAt = new Float32Array(count)
    const seeds = new Float32Array(count)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c
        const x = c / cols
        encodeAt[i] = x * 260 + Math.random() * 40
        // Never clear before the stage is hidden at 300 ms, or the cell would
        // flash the old content back for a frame or two.
        // A ragged but coherent front: small per-cell jitter on top of two
        // slow vertical wobbles, so few stray cells linger behind it.
        const wobble = 50 * Math.sin(r * 0.32) + 18 * Math.sin(r * 1.9)
        clearAt[i] = clamp(320 + x * 560 + (Math.random() - 0.5) * 110 + wobble, 320, 1040)
        seeds[i] = Math.random()
      }
    }
    const hash = (seed, beat) => {
      let value = (Math.floor(seed * 0xffffffff) ^ Math.imul(beat + 1, 0x9e3779b9)) >>> 0
      value = Math.imul(value ^ (value >>> 16), 0x45d9f3b)
      return (value ^ (value >>> 16)) >>> 0
    }
    const start = performance.now()
    let hidden = false
    const draw = (now) => {
      if (destroyed) { cancelAnimationFrame(exitFrame); return }
      const t = now - start
      ctx.clearRect(0, 0, width, height)
      if (t >= 300 && !hidden) {
        root.querySelectorAll('.rl-door, .rl-seam, .rl-stage').forEach((el) => { el.style.opacity = '0' })
        hidden = true
      }
      if (t >= 1100) return
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          if (t < encodeAt[i] || t >= clearAt[i]) continue
          ctx.globalAlpha = 1
          ctx.fillStyle = bg
          ctx.fillRect(c * 14, r * 18, 14, 18)
          const edge = clearAt[i] - t < 60
          ctx.fillStyle = edge || seeds[i] < 0.06 ? accent : ink
          ctx.globalAlpha = edge ? 1 : seeds[i] < 0.06 ? 0.85 : 0.55
          ctx.fillText(glyphs[hash(seeds[i], Math.floor(t / 70)) % glyphs.length], c * 14 + 7, r * 18 + 9)
        }
      }
      ctx.globalAlpha = 1
      exitFrame = requestAnimationFrame(draw)
    }
    exitFrame = requestAnimationFrame(draw)
  }

  function glitchExit() {
    const stage = $('.rl-stage')
    const weights = Array.from({ length: 7 }, () => Math.random())
    const total = weights.reduce((sum, weight) => sum + weight, 0) || 1
    const slices = []
    let top = 0
    weights.forEach((weight, i) => {
      const bottom = i === 6 ? innerHeight : top + innerHeight * (0.06 + 0.58 * weight / total)
      const slice = doc.createElement('div')
      slice.className = 'rl-slice'
      slice.style.clipPath = `inset(${top}px 0 ${innerHeight - bottom}px 0)`
      const clone = stage.cloneNode(true)
      clone.removeAttribute('id')
      clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'))
      slice.append(clone)
      root.append(slice)
      slices.push(slice)
      top = bottom
    })
    root.querySelectorAll(':scope > .rl-stage, :scope > .rl-door, :scope > .rl-seam').forEach((el) => { el.style.opacity = '0' })
    const offset = (lo, hi) => (lo + Math.random() * (hi - lo)) * (Math.random() < 0.5 ? -1 : 1)
    for (const time of [0, 90, 180]) {
      later(() => slices.forEach((slice) => { slice.style.transform = `translateX(${offset(8, 48)}px)` }), time)
    }
    later(() => {
      slices.forEach((slice) => { slice.style.transform = 'translateX(0)' })
      const first = Math.floor(Math.random() * slices.length)
      const second = (first + 1 + Math.floor(Math.random() * (slices.length - 1))) % slices.length
      for (const i of [first, second]) slices[i].style.transform = `translateX(${offset(6, 14)}px)`
    }, 270)
    slices.forEach((slice) => {
      const time = 360 + Math.random() * 340
      later(() => { slice.style.opacity = '0' }, time)
      later(() => { slice.style.opacity = '1' }, time + 40)
      later(() => { slice.style.opacity = '0' }, time + 80)
    })
    const bars = 2 + Math.floor(Math.random() * 2)
    for (let i = 0; i < bars; i++) {
      later(() => {
        const bar = doc.createElement('i')
        bar.className = 'rl-glitch-bar'
        bar.style.top = `${5 + Math.random() * 90}%`
        root.append(bar)
        later(() => bar.remove(), 60)
      }, 360 + Math.random() * 280)
    }
  }

  function irisExit() {
    const emblem = $('.rl-emblem')
    const r = emblem?.getBoundingClientRect()
    const cx = r && r.width && r.height ? r.left + r.width / 2 : innerWidth / 2
    const cy = r && r.width && r.height ? r.top + r.height / 2 : innerHeight / 2
    const d = Math.max(...[[0, 0], [innerWidth, 0], [0, innerHeight], [innerWidth, innerHeight]]
      .map(([x, y]) => Math.hypot(x - cx, y - cy)))
    root.style.setProperty('--rl-cx', `${cx}px`)
    root.style.setProperty('--rl-cy', `${cy}px`)
    root.style.setProperty('--rl-iris-max', String((d / 0.866) / 100 + 0.3))
    // Guide lines are 100vw/100vh long; trim them to what is on screen so
    // their retraction into the emblem is actually visible.
    if (r && r.width) {
      root.style.setProperty('--rl-gl-left', `${Math.max(0, r.left - 16)}px`)
      root.style.setProperty('--rl-gl-up', `${Math.max(0, r.top - 16)}px`)
      root.style.setProperty('--rl-gl-down', `${Math.max(0, innerHeight - r.bottom - 16)}px`)
    }
    const hex = (cls, delay = 0) => {
      const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('class', cls)
      svg.setAttribute('viewBox', '-100 -100 200 200')
      if (delay) svg.style.animationDelay = `${delay}ms`
      const polygon = doc.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      polygon.setAttribute('points', '0,-100 86.6,-50 86.6,50 0,100 -86.6,50 -86.6,-50')
      svg.append(polygon)
      root.append(svg)
    }
    // Prime: a spotlight dims everything but the emblem, and three hex pings
    // ripple out of its centre, so the eye is already there when it opens.
    const spot = doc.createElement('i')
    spot.className = 'rl-iris-spot'
    $('.rl-stage').append(spot)
    for (let i = 0; i < 3; i++) hex('rl-iris-ping', i * 90)
    hex('rl-iris-ring')
    hex('rl-iris-ring rl-iris-ring--b')
  }

  const exitWhenReady = () => {
    signalHold() // 网络闸门：时间轴走完，先放宿主进来启动
    if (appReady()) return leave()
    observer = new MutationObserver(() => { if (appReady()) leave() })
    const app = doc.getElementById('root')
    if (app) observer.observe(app, { childList: true })
    else observer.observe(doc.documentElement || doc, { childList: true, subtree: true })
  }

  function start() {
    if (started || destroyed) return
    started = true
    t0 = performance.now()
    if (reduced) setStage(STAGES.length - 1)
    // Next frame, so the static first frame is committed before keyframes
    // run; the timeout covers throttled rAF in a backgrounded renderer.
    let playing = false
    const play = () => {
      if (playing || destroyed) return
      playing = true
      root.classList.add('is-playing')
      tick()
    }
    requestAnimationFrame(play)
    later(play, 80)
    if (!reduced) later(startScramble, 600 * speed)
    later(exitWhenReady, exitAt)
    later(leave, maxWait)
    later(destroy, maxWait + exitMs + 2000)
    timers.push(setInterval(renderClock, 1000))
  }

  function onVisible() {
    if (doc.visibilityState === 'visible') start()
  }

  function onKey(event) {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') leave()
  }

  if (cfg.skippable) {
    root.addEventListener('pointerdown', leave)
    globalThis.addEventListener('keydown', onKey, true)
  }

  // Electron may run this before the window is shown; hold the first frame
  // until the page is visible so the intro is not spent off-screen.
  if (doc.visibilityState === 'visible') start()
  else {
    doc.addEventListener('visibilitychange', onVisible)
    globalThis.addEventListener('focus', start)
    later(start, 2500)
  }
  }

  if (!globalThis.__rhineSplash) {
    globalThis.__rhineSplash = {
      replay(options = {}) {
        document.getElementById('rhine-splash')?.remove()
        mount({ ...options, replayOnReload: true })
      },
    }
  }
  const cfg = globalThis.__RHINE_SPLASH__ || {}
  if (cfg.enabled !== false) mount()
})()
