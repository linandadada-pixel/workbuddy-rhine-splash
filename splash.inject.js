/* WorkBuddy 莱茵生命开屏 · CDP 注入载荷（build.py 生成，勿手改）
 * 视觉与时间轴派生自 dsh-rhine-splash，MIT © 2026 ArtemisFowl */
(function () {
  var booted = false;
  function boot() {
    if (booted) { return; }
    booted = true;
    var CSS_ID = "rhine-splash-css";
    var CSS = "/* ==== dsh-rhine-splash lib/splash.css 原文，逐字未改 ==== */\n/*\n * Rhine Lab style boot splash — styles.\n *\n * Everything is scoped under #rhine-splash so the shell's own stylesheets\n * (loaded later) can neither reach in nor be affected. Base rules describe\n * the *final* frame; keyframes animate *from* the hidden state with\n * `animation-fill-mode: both`, so reduced motion simply drops the\n * animations. Timings are written as `calc(<ms> * var(--t))` against a\n * 4.5 s timeline; --t scales with the configured duration.\n *\n * Act A (≈0.25–1.6 s): access check — \"PERMISSION AUTHORIZED\".\n * Act B (≈1.6–3.7 s): welcome lockup, emblem, module tiles.\n * Exit  (≈3.7–4.5 s): stage fades, seam opens, doors part.\n */\n\n#rhine-splash {\n  --rl-k: 1;\n  --t: calc(var(--rl-k) * 1ms);\n  --rl-p: 0;\n  --rl-accent: #e46f24;\n  --rl-signal: #a5c22a;\n  --rl-bg: #edece8;\n  --rl-ink: #141414;\n  --rl-muted: #8b8a85;\n  --rl-line: rgba(20, 20, 20, 0.13);\n  --rl-line-strong: rgba(20, 20, 20, 0.4);\n  --rl-dot: rgba(20, 20, 20, 0.09);\n  --rl-hex: rgba(20, 20, 20, 0.06);\n  --rl-glass: rgba(237, 236, 232, 0.6);\n  --rl-accent-ink: color-mix(in srgb, var(--rl-accent) 78%, #000);\n  --rl-vignette: rgba(20, 20, 20, 0.045);\n  --rl-img-bars: var(--rl-img-bars-light, none);\n  --rl-sans: \"Montserrat\", \"Helvetica Neue\", \"PingFang SC\", \"Segoe UI\", \"Microsoft YaHei\", Arial, sans-serif;\n  --rl-cond: \"DIN Condensed\", \"Bahnschrift\", \"Roboto Condensed\", \"Arial Narrow\", \"Helvetica Neue\", sans-serif;\n  --rl-mono: \"SF Mono\", \"JetBrains Mono\", \"Cascadia Mono\", Menlo, Consolas, monospace;\n  --B: 1600; /* act B start, in timeline ms */\n  --G: 1250; /* grant beat: AUTHORIZED has resolved */\n  --R: 3300; /* ready beat: every meter has landed */\n  --beat: 1.2s; /* tempo for every idle loop */\n  --e-out: cubic-bezier(.16, 1, .3, 1);\n  --e-io: cubic-bezier(.65, 0, .35, 1);\n  --e-in: cubic-bezier(.7, 0, .84, 0);\n  --e-pop: cubic-bezier(.34, 1.56, .64, 1);\n\n  position: fixed;\n  inset: 0;\n  z-index: 2147483647;\n  overflow: hidden;\n  color: var(--rl-ink);\n  font-family: var(--rl-sans);\n  line-height: 1.2;\n  cursor: default;\n  user-select: none;\n  -webkit-user-select: none;\n  -webkit-font-smoothing: antialiased;\n  contain: strict;\n}\n\n#rhine-splash[data-theme=\"dark\"] {\n  --rl-accent: #f0893e;\n  --rl-signal: #c8e639;\n  --rl-bg: #151517;\n  --rl-ink: #ecebe7;\n  --rl-muted: #8a8986;\n  --rl-line: rgba(236, 235, 231, 0.11);\n  --rl-line-strong: rgba(236, 235, 231, 0.36);\n  --rl-dot: rgba(236, 235, 231, 0.06);\n  --rl-hex: rgba(236, 235, 231, 0.05);\n  --rl-glass: rgba(21, 21, 23, 0.55);\n  --rl-accent-ink: var(--rl-accent);\n  --rl-vignette: rgba(0, 0, 0, 0.35);\n  --rl-img-bars: var(--rl-img-bars-dark, none);\n}\n\n#rhine-splash *,\n#rhine-splash *::before,\n#rhine-splash *::after {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n}\n\n#rhine-splash i {\n  display: block;\n  font-style: normal;\n}\n\n#rhine-splash b { font-weight: 800; }\n\n/* ------------------------------------------------------------ backdrop */\n\n#rhine-splash .rl-door {\n  position: absolute;\n  left: 0;\n  right: 0;\n  height: 50%;\n  overflow: hidden;\n  will-change: transform;\n}\n\n#rhine-splash .rl-door--top { top: 0; }\n#rhine-splash .rl-door--bottom { bottom: 0; }\n\n/* Each door paints a full-window backdrop clipped to its half, so the dot\n   grid stays continuous across the seam. */\n#rhine-splash .rl-door::before {\n  content: \"\";\n  position: absolute;\n  left: 0;\n  right: 0;\n  height: 200%;\n  background-color: var(--rl-bg);\n  background-image:\n    radial-gradient(ellipse at 50% 46%, transparent 52%, var(--rl-vignette) 100%),\n    radial-gradient(var(--rl-dot) 1px, transparent 1.3px);\n  background-size: 100% 100%, 22px 22px;\n  background-position: 0 0, 11px 11px;\n}\n\n#rhine-splash .rl-door--top::before { top: 0; }\n#rhine-splash .rl-door--bottom::before { bottom: 0; }\n\n/* Accent edge on each door's inner side, shown only while the doors part. */\n#rhine-splash .rl-door::after {\n  content: \"\";\n  position: absolute;\n  left: 0;\n  right: 0;\n  height: 2px;\n  background: var(--rl-accent);\n  opacity: 0;\n}\n\n#rhine-splash .rl-door--top::after { bottom: 0; }\n#rhine-splash .rl-door--bottom::after { top: 0; }\n\n#rhine-splash .rl-seam {\n  position: absolute;\n  left: 0;\n  right: 0;\n  top: calc(50% - 1px);\n  height: 2px;\n  background: var(--rl-accent);\n  box-shadow: 0 0 14px 1px var(--rl-accent);\n  transform: scaleX(0);\n  opacity: 0;\n  pointer-events: none;\n}\n\n#rhine-splash .rl-stage {\n  position: absolute;\n  inset: 0;\n}\n\n#rhine-splash:not(.is-playing) .rl-stage { visibility: hidden; }\n\n#rhine-splash .rl-drag {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 44px;\n  z-index: 3;\n  -webkit-app-region: drag;\n}\n\n/* Rendered slat field (assets/bars-*.jpg, inlined by the host). */\n#rhine-splash .rl-field {\n  position: absolute;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  width: 74vw;\n  background: var(--rl-img-bars) right center / cover no-repeat;\n  -webkit-mask-image: linear-gradient(to right, transparent, #000 38%);\n  mask-image: linear-gradient(to right, transparent, #000 38%);\n}\n\n#rhine-splash .rl-watermark {\n  position: absolute;\n  right: -1vw;\n  bottom: 1vh;\n  font: 800 13vw/0.8 var(--rl-sans);\n  letter-spacing: -0.02em;\n  color: transparent;\n  -webkit-text-stroke: 1px var(--rl-line-strong);\n  opacity: 0.28;\n  white-space: nowrap;\n}\n\n#rhine-splash .rl-orbit {\n  position: absolute;\n  border-radius: 50%;\n}\n\n#rhine-splash .rl-orbit--1 {\n  width: 118vmin;\n  height: 118vmin;\n  right: -46vmin;\n  top: -36vmin;\n  border: 1px solid var(--rl-line);\n}\n\n#rhine-splash .rl-orbit--2 {\n  width: 76vmin;\n  height: 76vmin;\n  right: -22vmin;\n  top: 10vmin;\n  border: 1.5px solid transparent;\n  border-top-color: var(--rl-line-strong);\n  border-left-color: var(--rl-line-strong);\n}\n\n#rhine-splash .rl-orbit--2::after {\n  content: \"\";\n  position: absolute;\n  left: 50%;\n  top: -4.5px;\n  width: 8px;\n  height: 8px;\n  margin-left: -4px;\n  border-radius: 50%;\n  background: var(--rl-accent);\n}\n\n/* ------------------------------------------------------------ HUD frame */\n\n#rhine-splash .rl-corner {\n  position: absolute;\n  width: 22px;\n  height: 22px;\n  border: 0 solid var(--rl-line-strong);\n}\n\n#rhine-splash .rl-corner--tl { top: 52px; left: 24px; border-top-width: 1px; border-left-width: 1px; --dx: -8px; --dy: -8px; }\n#rhine-splash .rl-corner--tr { top: 52px; right: 24px; border-top-width: 1px; border-right-width: 1px; --dx: 8px; --dy: -8px; }\n#rhine-splash .rl-corner--bl { bottom: 24px; left: 24px; border-bottom-width: 1px; border-left-width: 1px; --dx: -8px; --dy: 8px; }\n#rhine-splash .rl-corner--br { bottom: 24px; right: 24px; border-bottom-width: 1px; border-right-width: 1px; --dx: 8px; --dy: 8px; }\n\n/* Registration marks. */\n#rhine-splash .rl-reg {\n  position: absolute;\n  width: 13px;\n  height: 13px;\n}\n\n#rhine-splash .rl-reg::before,\n#rhine-splash .rl-reg::after {\n  content: \"\";\n  position: absolute;\n  background: var(--rl-line-strong);\n}\n\n#rhine-splash .rl-reg::before { left: 6px; top: 0; width: 1px; height: 13px; }\n#rhine-splash .rl-reg::after { top: 6px; left: 0; height: 1px; width: 13px; }\n#rhine-splash .rl-reg--a { top: 58px; left: 50%; }\n#rhine-splash .rl-reg--b { bottom: 30px; left: 34%; }\n#rhine-splash .rl-reg--c { top: 50%; right: 18px; }\n\n#rhine-splash .rl-top {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: 44px;\n  padding: 0 28px 0 92px;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  border-bottom: 1px solid var(--rl-line);\n  font: 500 10px/1 var(--rl-mono);\n  letter-spacing: 0.18em;\n  color: var(--rl-muted);\n  white-space: nowrap;\n}\n\n#rhine-splash .rl-top-l,\n#rhine-splash .rl-top-r {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n}\n\n#rhine-splash .rl-status { display: inline-grid; color: var(--rl-ink); }\n#rhine-splash .rl-status > span { grid-area: 1 / 1; }\n#rhine-splash .rl-status-a,\n#rhine-splash .rl-status-b { opacity: 0; }\n#rhine-splash .rl-dim { opacity: 0.7; letter-spacing: 0.08em; }\n#rhine-splash .rl-code { color: var(--rl-ink); }\n#rhine-splash .rl-clock { font-variant-numeric: tabular-nums; }\n\n#rhine-splash .rl-live {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  color: var(--rl-ink);\n}\n\n#rhine-splash .rl-live > i {\n  width: 6px;\n  height: 6px;\n  border-radius: 50%;\n  background: var(--rl-signal);\n  box-shadow: 0 0 6px var(--rl-signal);\n}\n\n#rhine-splash .rl-sq {\n  display: inline-block;\n  width: 6px;\n  height: 6px;\n  background: var(--rl-accent);\n  flex: none;\n}\n\n/* Corporate lockup, top left. */\n#rhine-splash .rl-lockup {\n  position: absolute;\n  top: 64px;\n  left: 72px;\n  color: var(--rl-ink);\n  white-space: nowrap;\n}\n\n#rhine-splash .rl-lk-1 { font: 800 15px/1.05 var(--rl-sans); letter-spacing: 0.02em; }\n#rhine-splash .rl-lk-2 { margin-top: 3px; font: 600 6.5px/1.2 var(--rl-sans); letter-spacing: 0.08em; }\n#rhine-splash .rl-lk-3 { margin-top: 2px; font: 300 15px/1.05 var(--rl-sans); letter-spacing: 0.04em; }\n#rhine-splash .rl-lk-3 b { margin-left: 0.25em; }\n\n/* Index rail, left edge. */\n#rhine-splash .rl-rail {\n  position: absolute;\n  left: 40px;\n  top: 150px;\n  bottom: 176px;\n  width: 1px;\n}\n\n#rhine-splash .rl-rail-line {\n  position: absolute;\n  inset: 0;\n  background: var(--rl-line-strong);\n  transform-origin: center top;\n}\n\n#rhine-splash .rl-rail-sig {\n  position: absolute;\n  left: -2.5px;\n  top: -14px;\n  width: 6px;\n  height: 6px;\n  border-radius: 50%;\n  background: var(--rl-signal);\n}\n\n#rhine-splash .rl-rail-item {\n  position: absolute;\n  left: 0;\n  top: calc(var(--i) * 25%);\n  transform: translateY(-50%);\n  padding-left: 12px;\n  font: 500 8.5px/1 var(--rl-mono);\n  letter-spacing: 0.14em;\n  color: var(--rl-ink);\n  white-space: nowrap;\n}\n\n#rhine-splash .rl-rail-mk {\n  position: absolute;\n  left: -3px;\n  top: 0;\n  width: 7px;\n  height: 7px;\n  background: var(--rl-ink);\n}\n\n#rhine-splash .rl-rail-no { margin-right: 6px; color: var(--rl-muted); }\n\n#rhine-splash .rl-rail-bar {\n  width: 64px;\n  height: 2px;\n  margin-top: 5px;\n  background: var(--rl-ink);\n  transform-origin: left center;\n}\n\n/* ------------------------------------------------------- act A: access */\n\n#rhine-splash .rl-access {\n  position: absolute;\n  inset: 44px 0 0;\n  padding-bottom: 40px; /* same optical centre as act B */\n  display: grid;\n  place-items: center;\n  opacity: 0;\n}\n\n#rhine-splash .rl-access-ring {\n  position: absolute;\n  left: 50%;\n  top: calc(50% - 20px);\n  width: 240px;\n  height: 240px;\n  margin: -120px 0 0 -120px;\n  overflow: visible;\n  fill: none;\n}\n\n#rhine-splash .rl-ar-faint { stroke: var(--rl-line); stroke-width: 1; }\n#rhine-splash .rl-ar-arcs { transform-box: view-box; transform-origin: 120px 120px; }\n#rhine-splash .rl-ar-arcs circle { stroke: var(--rl-ink); stroke-width: 1.3; }\n\n#rhine-splash .rl-access-text {\n  position: relative;\n  margin-right: -0.5em;\n  font: 300 clamp(14px, 1.6vw, 19px)/1 var(--rl-sans);\n  letter-spacing: 0.5em;\n  color: var(--rl-ink);\n  white-space: nowrap;\n}\n\n#rhine-splash .rl-ac { display: inline-block; min-width: 0.55em; text-align: center; }\n#rhine-splash .rl-ac.is-raw { color: var(--rl-muted); }\n\n#rhine-splash .rl-access-dot {\n  position: absolute;\n  left: 50%;\n  width: 6px;\n  height: 6px;\n  margin-left: -3px;\n  border-radius: 50%;\n  background: var(--rl-accent);\n}\n\n#rhine-splash .rl-access-dot--t { top: calc(50% - 70px); }\n#rhine-splash .rl-access-dot--b { top: calc(50% + 24px); }\n\n#rhine-splash .rl-access-sub {\n  position: absolute;\n  left: 50%;\n  top: calc(50% + 54px);\n  transform: translateX(-50%);\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font: 500 9px/1 var(--rl-mono);\n  letter-spacing: 0.22em;\n  color: var(--rl-muted);\n  white-space: nowrap;\n}\n\n#rhine-splash .rl-access-sub > i {\n  width: 5px;\n  height: 5px;\n  border-radius: 50%;\n  background: var(--rl-ink);\n}\n\n/* -------------------------------------------------- act B: centrepiece */\n\n#rhine-splash .rl-center {\n  position: absolute;\n  inset: 44px 0 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 44px;\n  padding: 0 32px 40px;\n}\n\n#rhine-splash .rl-emblem {\n  position: relative;\n  flex: none;\n  width: 184px;\n  height: 184px;\n  color: var(--rl-accent);\n}\n\n#rhine-splash .rl-e {\n  position: relative;\n  display: block;\n  width: 100%;\n  height: 100%;\n  overflow: visible;\n  fill: none;\n  stroke-linecap: butt;\n}\n\n#rhine-splash .rl-e-ticks,\n#rhine-splash .rl-e-arcs,\n#rhine-splash .rl-e-sweep {\n  transform-box: view-box;\n  transform-origin: 110px 110px;\n}\n\n#rhine-splash .rl-e-ticks circle { stroke: var(--rl-line-strong); }\n#rhine-splash .rl-e-ticks .rl-e-major { stroke: var(--rl-ink); opacity: 0.55; }\n#rhine-splash .rl-e-ring { stroke: var(--rl-ink); stroke-width: 1.2; stroke-dasharray: 1; stroke-dashoffset: 0; }\n#rhine-splash .rl-e-arc { stroke: var(--rl-accent); stroke-width: 3.6; }\n#rhine-splash .rl-e-arc--b { opacity: 0.55; }\n#rhine-splash .rl-e-sweep { opacity: 0; }\n#rhine-splash .rl-e-cross path { stroke: var(--rl-line-strong); stroke-width: 1; }\n#rhine-splash .rl-e-hex { stroke: var(--rl-ink); stroke-width: 1.5; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 0; }\n#rhine-splash .rl-e-bond { stroke: var(--rl-ink); stroke-width: 1.1; opacity: 0.7; }\n#rhine-splash .rl-e-node { fill: var(--rl-bg); stroke: var(--rl-ink); stroke-width: 1.3; transform-box: fill-box; transform-origin: center; }\n#rhine-splash .rl-e-core { fill: var(--rl-accent); transform-box: fill-box; transform-origin: center; }\n#rhine-splash .rl-e-label text {\n  fill: var(--rl-muted);\n  font: 500 7px var(--rl-mono);\n  letter-spacing: 0.2em;\n  text-anchor: middle;\n}\n\n/* Guide lines reach out from the emblem to the window edges. */\n#rhine-splash .rl-gl {\n  position: absolute;\n  background: var(--rl-line);\n}\n\n#rhine-splash .rl-gl--h {\n  top: 50%;\n  right: calc(100% + 16px);\n  width: 100vw;\n  height: 1px;\n  transform-origin: right center;\n}\n\n#rhine-splash .rl-gl--h::after {\n  content: \"\";\n  position: absolute;\n  right: 0;\n  top: -3px;\n  width: 1px;\n  height: 7px;\n  background: var(--rl-line-strong);\n}\n\n#rhine-splash .rl-gl--v1,\n#rhine-splash .rl-gl--v2 {\n  left: 50%;\n  width: 1px;\n  height: 100vh;\n}\n\n#rhine-splash .rl-gl--v1 { bottom: calc(100% + 16px); transform-origin: center bottom; }\n#rhine-splash .rl-gl--v2 { top: calc(100% + 16px); transform-origin: center top; }\n\n/* Act A dissolves into this accent hairline on the emblem's axis, which\n   hands over to the emblem's own guide lines. */\n#rhine-splash .rl-handoff {\n  position: absolute;\n  left: 0;\n  right: 0;\n  top: calc(50% - 20px);\n  height: 1px;\n  background: var(--rl-accent);\n  box-shadow: 0 0 8px var(--rl-accent);\n  transform: scaleX(0);\n  opacity: 0;\n  pointer-events: none;\n}\n\n#rhine-splash .rl-divider {\n  flex: none;\n  width: 1px;\n  height: 168px;\n  background: var(--rl-line-strong);\n}\n\n#rhine-splash .rl-text {\n  position: relative;\n  isolation: isolate;\n  display: flex;\n  flex-direction: column;\n  align-items: flex-start;\n  min-width: 0;\n}\n\n/* Frosted glass panel behind the lockup, with corner screws. */\n#rhine-splash .rl-panel {\n  position: absolute;\n  inset: -26px -30px -24px -26px;\n  z-index: -1;\n  background: var(--rl-glass);\n  -webkit-backdrop-filter: blur(10px) saturate(1.1);\n  backdrop-filter: blur(10px) saturate(1.1);\n  border: 1px solid var(--rl-line);\n}\n\n#rhine-splash .rl-panel > i {\n  position: absolute;\n  width: 5px;\n  height: 5px;\n  border: 1px solid var(--rl-line-strong);\n  border-radius: 50%;\n}\n\n#rhine-splash .rl-panel > i:nth-child(1) { top: 7px; left: 7px; }\n#rhine-splash .rl-panel > i:nth-child(2) { top: 7px; right: 7px; }\n#rhine-splash .rl-panel > i:nth-child(3) { bottom: 7px; left: 7px; }\n#rhine-splash .rl-panel > i:nth-child(4) { bottom: 7px; right: 7px; }\n\n#rhine-splash .rl-panel-id {\n  position: absolute;\n  top: 8px;\n  right: 18px;\n  font: 500 7px/1 var(--rl-mono);\n  letter-spacing: 0.22em;\n  color: var(--rl-muted);\n}\n\n#rhine-splash .rl-over {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  font: 500 9.5px/1 var(--rl-mono);\n  letter-spacing: 0.22em;\n  color: var(--rl-accent-ink);\n}\n\n#rhine-splash .rl-w {\n  font: 800 clamp(14px, 1.5vw, 19px)/1 var(--rl-sans);\n  letter-spacing: 0.08em;\n  color: var(--rl-ink);\n}\n\n#rhine-splash .rl-w1 { margin: 14px 0 7px; }\n#rhine-splash .rl-w2 { margin: 7px 0 0; }\n\n#rhine-splash .rl-title {\n  display: inline-flex;\n  padding: 0.2em 0.34em 0.16em 0.4em;\n  background: var(--rl-ink);\n  color: var(--rl-bg);\n  font: 800 clamp(24px, 3vw, 40px)/1 var(--rl-sans);\n  letter-spacing: 0.06em;\n  white-space: nowrap;\n}\n\n#rhine-splash .rl-ch {\n  display: inline-block;\n  will-change: transform, opacity, filter;\n}\n\n/* Link meter under INTERNAL TERMINAL: a ruled track whose orange fill is\n   driven by --rl-q (session link progress, set per frame by splash.js),\n   with a riding read head and a glint that sweeps on the --beat. */\n#rhine-splash .rl-bar {\n  position: relative;\n  width: 100%;\n  height: 2px;\n  margin-top: 16px;\n  background: var(--rl-line);\n}\n\n#rhine-splash .rl-bar::before {\n  content: \"\";\n  position: absolute;\n  left: 0;\n  right: 0;\n  top: 5px;\n  height: 4px;\n  background: repeating-linear-gradient(90deg, var(--rl-line-strong) 0 1px, transparent 1px 8px);\n  -webkit-mask-image: linear-gradient(90deg, #000 55%, transparent);\n  mask-image: linear-gradient(90deg, #000 55%, transparent);\n}\n\n#rhine-splash .rl-bar::after {\n  content: \"\";\n  position: absolute;\n  right: 0;\n  top: -4px;\n  width: 1px;\n  height: 10px;\n  background: var(--rl-ink);\n}\n\n#rhine-splash .rl-bar-fill {\n  position: absolute;\n  left: 0;\n  top: 0;\n  bottom: 0;\n  width: calc(var(--rl-q, 0) * 100%);\n  background:\n    linear-gradient(90deg, transparent, color-mix(in srgb, var(--rl-accent) 30%, #fff), transparent) no-repeat,\n    var(--rl-accent);\n  background-size: 56px 100%, auto;\n  background-position: -56px 0, 0 0;\n}\n\n#rhine-splash .rl-bar-head {\n  position: absolute;\n  top: -3px;\n  left: calc(var(--rl-q, 0) * 100%);\n  width: 6px;\n  height: 8px;\n  margin-left: -3px;\n  background: var(--rl-ink);\n}\n\n#rhine-splash .rl-bar-head::before {\n  content: \"\";\n  position: absolute;\n  left: 2.5px;\n  bottom: calc(100% + 2px);\n  width: 1px;\n  height: 6px;\n  background: var(--rl-accent);\n}\n\n#rhine-splash .rl-bar-head::after {\n  content: \"LINK\";\n  position: absolute;\n  left: 7px;\n  bottom: calc(100% + 3px);\n  font: 600 6.5px/1 var(--rl-mono);\n  letter-spacing: 0.16em;\n  color: var(--rl-accent-ink);\n}\n\n#rhine-splash .rl-sub {\n  margin-top: 14px;\n  font: 400 10.5px/1.4 var(--rl-mono);\n  letter-spacing: 0.16em;\n  color: var(--rl-muted);\n  white-space: nowrap;\n}\n\n#rhine-splash .rl-caret {\n  display: inline-block;\n  width: 0.62em;\n  height: 1.05em;\n  margin-left: 4px;\n  vertical-align: -0.18em;\n  background: var(--rl-accent);\n}\n\n/* Module tiles: inverted squares with condensed abbreviations. */\n#rhine-splash .rl-tiles {\n  display: flex;\n  gap: 8px;\n  margin-top: 18px;\n  perspective: 600px;\n}\n\n#rhine-splash .rl-tile {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  width: 62px;\n  height: 62px;\n  padding: 6px 6px 6px 7px;\n  background: var(--rl-ink);\n  color: var(--rl-bg);\n  overflow: hidden;\n  transform-origin: left center;\n}\n\n/* One condensed family for the abbreviation and its caption, so the label\n   reads as a single stamped plate; the index stays mono as metadata. */\n#rhine-splash .rl-tile-no { font: 500 6px/1 var(--rl-mono); letter-spacing: 0.08em; opacity: 0.6; }\n#rhine-splash .rl-tile-ab {\n  margin-top: 2px;\n  font: 700 25px/0.86 var(--rl-cond);\n  font-stretch: condensed;\n  letter-spacing: 0.02em;\n}\n#rhine-splash .rl-tile-cap {\n  font: 700 7px/1.05 var(--rl-cond);\n  font-stretch: condensed;\n  letter-spacing: 0.05em;\n  opacity: 0.8;\n  overflow-wrap: anywhere;\n}\n\n#rhine-splash .rl-tile--hot::after {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  right: 0;\n  width: 12px;\n  height: 12px;\n  background: var(--rl-accent);\n  clip-path: polygon(0 0, 100% 0, 100% 100%);\n}\n\n/* ------------------------------------------------- specimen, top right */\n\n#rhine-splash .rl-specimen {\n  position: absolute;\n  top: 70px;\n  right: 56px;\n  display: grid;\n  grid-template-columns: auto 34px 112px;\n  align-items: start;\n  color: var(--rl-ink);\n}\n\n#rhine-splash .rl-spec-label {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-end;\n  gap: 4px;\n  margin-top: 2px;\n  white-space: nowrap;\n}\n\n#rhine-splash .rl-spec-label b { font: 800 13px/1 var(--rl-sans); letter-spacing: 0.04em; }\n#rhine-splash .rl-spec-label span { font: 500 7px/1 var(--rl-mono); letter-spacing: 0.16em; color: var(--rl-muted); }\n\n#rhine-splash .rl-spec-lead {\n  position: relative;\n  height: 1px;\n  margin: 7px 4px 0 6px;\n  background: var(--rl-line-strong);\n  transform-origin: left center;\n}\n\n#rhine-splash .rl-spec-lead::before {\n  content: \"\";\n  position: absolute;\n  left: -3px;\n  top: -2px;\n  width: 5px;\n  height: 5px;\n  background: var(--rl-ink);\n}\n\n#rhine-splash .rl-spec-view {\n  position: relative;\n  width: 112px;\n  height: 112px;\n  border-radius: 50%;\n  overflow: hidden;\n  border: 1px solid var(--rl-line-strong);\n  outline: 1px dashed var(--rl-line-strong);\n  outline-offset: 5px;\n  background:\n    var(--rl-img-specimen, radial-gradient(circle at 30% 35%, #c9c9c9 0 13%, transparent 14%) ,\n    radial-gradient(circle at 66% 58%, #a9a9a9 0 17%, transparent 18%)),\n    #4a4a4a;\n  background-size: 170%;\n  background-position: 42% 46%;\n}\n\n#rhine-splash .rl-spec-view::before,\n#rhine-splash .rl-spec-view::after {\n  content: \"\";\n  position: absolute;\n  background: rgba(255, 255, 255, 0.55);\n}\n\n#rhine-splash .rl-spec-view::before { left: 50%; top: 18%; bottom: 18%; width: 1px; }\n#rhine-splash .rl-spec-view::after { top: 50%; left: 18%; right: 18%; height: 1px; }\n\n#rhine-splash .rl-spec-scan {\n  position: absolute;\n  left: 0;\n  right: 0;\n  top: 0;\n  height: 2px;\n  background: var(--rl-accent);\n  box-shadow: 0 0 8px var(--rl-accent);\n  opacity: 0;\n}\n\n#rhine-splash .rl-spec-data {\n  grid-column: 1 / -1;\n  justify-self: end;\n  display: flex;\n  gap: 10px;\n  margin-top: 12px;\n  padding-top: 5px;\n  border-top: 1px solid var(--rl-line-strong);\n  font: 500 7.5px/1 var(--rl-mono);\n  letter-spacing: 0.1em;\n  color: var(--rl-muted);\n  white-space: nowrap;\n}\n\n#rhine-splash .rl-spec-scale {\n  grid-column: 1 / -1;\n  justify-self: end;\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin-top: 6px;\n  font: 500 7.5px/1 var(--rl-mono);\n  color: var(--rl-ink);\n}\n\n#rhine-splash .rl-spec-scale > i {\n  width: 36px;\n  height: 4px;\n  border: 1px solid var(--rl-ink);\n  border-top: 0;\n}\n\n/* --------------------------------------------------- file tag, bottom left */\n\n#rhine-splash .rl-file {\n  position: absolute;\n  left: 72px;\n  bottom: 46px;\n  width: 232px;\n}\n\n#rhine-splash .rl-file-lead {\n  position: absolute;\n  right: calc(100% + 6px);\n  top: 9px;\n  width: 66px;\n  height: 1px;\n  background: var(--rl-line-strong);\n  transform-origin: left center;\n}\n\n#rhine-splash .rl-file-lead::after {\n  content: \"\";\n  position: absolute;\n  right: -2px;\n  top: -2px;\n  width: 5px;\n  height: 5px;\n  background: var(--rl-ink);\n}\n\n#rhine-splash .rl-file-box {\n  padding: 1px 0 1px 10px;\n  border-left: 3px solid var(--rl-ink);\n  font: 500 8.5px/1.75 var(--rl-mono);\n  letter-spacing: 0.12em;\n  color: var(--rl-muted);\n  white-space: nowrap;\n}\n\n#rhine-splash .rl-file-box b { color: var(--rl-ink); font-weight: 700; }\n\n#rhine-splash .rl-redact {\n  display: grid;\n  gap: 4px;\n  margin-top: 10px;\n}\n\n#rhine-splash .rl-redact > i {\n  width: var(--w);\n  height: 6px;\n  background: var(--rl-ink);\n  transform-origin: left center;\n}\n\n#rhine-splash .rl-redact > i.rl-redact--h {\n  background: repeating-linear-gradient(-45deg, var(--rl-ink) 0 2px, transparent 2px 5px);\n}\n\n#rhine-splash .rl-code-row {\n  display: flex;\n  align-items: flex-end;\n  gap: 8px;\n  margin-top: 10px;\n}\n\n#rhine-splash .rl-barcode {\n  display: block;\n  width: 148px;\n  height: 20px;\n  fill: var(--rl-ink);\n}\n\n#rhine-splash .rl-code-tx { font: 500 7.5px/1 var(--rl-mono); letter-spacing: 0.12em; color: var(--rl-muted); }\n\n/* ---------------------------------------------- caution + progress, bottom right */\n\n#rhine-splash .rl-foot-r {\n  position: absolute;\n  right: 56px;\n  bottom: 40px;\n  width: 232px;\n  display: flex;\n  flex-direction: column;\n  align-items: stretch;\n  gap: 12px;\n}\n\n#rhine-splash .rl-caution {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font: 600 7.5px/1 var(--rl-mono);\n  letter-spacing: 0.14em;\n  color: var(--rl-ink);\n  white-space: nowrap;\n}\n\n#rhine-splash .rl-caution > i {\n  flex: none;\n  width: 30px;\n  height: 10px;\n  background: repeating-linear-gradient(-45deg, var(--rl-accent) 0 4px, var(--rl-ink) 4px 8px);\n}\n\n#rhine-splash .rl-prog-head {\n  display: flex;\n  align-items: baseline;\n  gap: 6px;\n  font-family: var(--rl-mono);\n  color: var(--rl-muted);\n}\n\n#rhine-splash .rl-prog-label {\n  flex: 1;\n  font-size: 10px;\n  letter-spacing: 0.22em;\n}\n\n#rhine-splash .rl-pct {\n  font: 200 30px/1 var(--rl-sans);\n  letter-spacing: 0.04em;\n  font-variant-numeric: tabular-nums;\n  color: var(--rl-ink);\n}\n\n#rhine-splash .rl-pct-unit { font-size: 11px; }\n\n#rhine-splash .rl-prog-bar {\n  position: relative;\n  height: 2px;\n  margin-top: 10px;\n  background: var(--rl-line);\n}\n\n#rhine-splash .rl-prog-bar > i {\n  position: absolute;\n  inset: 0;\n  background: var(--rl-accent);\n  transform: scaleX(var(--rl-p));\n  transform-origin: left center;\n}\n\n#rhine-splash .rl-prog-ticks {\n  height: 5px;\n  margin-top: 4px;\n  background-image: repeating-linear-gradient(90deg, var(--rl-line-strong) 0 1px, transparent 1px 11.5px);\n  opacity: 0.7;\n}\n\n#rhine-splash .rl-powered {\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n  gap: 4px;\n  font: 600 8px/1 var(--rl-sans);\n  letter-spacing: 0.12em;\n  color: var(--rl-muted);\n}\n\n#rhine-splash .rl-powered b { color: var(--rl-ink); }\n#rhine-splash .rl-powered > i { width: 22px; height: 2px; margin-left: 6px; background: var(--rl-ink); }\n\n#rhine-splash .rl-hint {\n  position: absolute;\n  left: 50%;\n  bottom: 16px;\n  transform: translateX(-50%);\n  font: 400 9.5px/1 var(--rl-mono);\n  letter-spacing: 0.2em;\n  color: var(--rl-muted);\n  white-space: nowrap;\n  opacity: 0.75;\n}\n\n/* ------------------------------------------------------------ timeline\n *\n * Beats, in ms on the 4.5 s timeline (scaled by --t):\n *   frame   0–500    top bar, corners, rail spine, lockup\n *   act A   250–1450 access check; G (--G) = grant beat: status flips,\n *                    rail 02 lights, ID CONFIRMED, the two dots ping\n *   sweep   600–1300 peripheral HUD boots clockwise:\n *                    specimen → caution/progress → file tag\n *   act B   1600     emblem, panel, lockup; tiles 2550 (rail 03)\n *   handoff 1400     act A dissolves into an accent hairline on the axis\n *   ready   3300     (--R) TERMINAL READY, corners lock, rail 05, meters 97%\n * One easing family: --e-out enters, --e-io draws and wipes, --e-in\n * leaves, --e-pop pops. Idle loops run on multiples of --beat so nothing\n * flickers out of step.\n */\n\n/* backdrop */\n#rhine-splash.is-playing .rl-field { animation: rl-field-in calc(2600 * var(--t)) var(--e-out) both; }\n#rhine-splash.is-playing .rl-watermark { animation: rl-drift calc(1800 * var(--t)) var(--e-out) calc(400 * var(--t)) both; }\n#rhine-splash.is-playing .rl-orbit--1 { animation: rl-fade calc(900 * var(--t)) var(--e-out) calc(200 * var(--t)) both; }\n#rhine-splash.is-playing .rl-orbit--2 {\n  animation:\n    rl-orbit-in calc(1600 * var(--t)) var(--e-out) calc(200 * var(--t)) both,\n    rl-spin calc(var(--beat) * 80) linear calc(1800 * var(--t)) infinite;\n}\n\n/* frame */\n#rhine-splash.is-playing .rl-top { animation: rl-drop calc(420 * var(--t)) var(--e-out) calc(100 * var(--t)) both; }\n#rhine-splash.is-playing .rl-status-a {\n  animation:\n    rl-in calc(200 * var(--t)) linear calc(150 * var(--t)) both,\n    rl-out calc(160 * var(--t)) linear calc(var(--G) * var(--t)) forwards;\n}\n#rhine-splash.is-playing .rl-status-b {\n  animation:\n    rl-in calc(200 * var(--t)) linear calc((var(--G) + 40) * var(--t)) both,\n    rl-out calc(160 * var(--t)) linear calc(var(--R) * var(--t)) forwards;\n}\n#rhine-splash.is-playing .rl-status-c { animation: rl-fade calc(200 * var(--t)) linear calc((var(--R) + 40) * var(--t)) both; }\n#rhine-splash.is-playing .rl-live > i { animation: rl-pulse calc(var(--beat) * 2) ease-in-out infinite; }\n#rhine-splash.is-playing .rl-corner {\n  animation:\n    rl-corner calc(520 * var(--t)) var(--e-out) calc(160 * var(--t)) both,\n    rl-lock calc(700 * var(--t)) var(--e-out) calc(var(--R) * var(--t));\n}\n#rhine-splash.is-playing .rl-reg { animation: rl-fade calc(400 * var(--t)) var(--e-out) calc(300 * var(--t)) both; }\n#rhine-splash.is-playing .rl-lk-1 { animation: rl-slide calc(420 * var(--t)) var(--e-out) calc(180 * var(--t)) both; }\n#rhine-splash.is-playing .rl-lk-2 { animation: rl-slide calc(420 * var(--t)) var(--e-out) calc(230 * var(--t)) both; }\n#rhine-splash.is-playing .rl-lk-3 { animation: rl-slide calc(420 * var(--t)) var(--e-out) calc(280 * var(--t)) both; }\n\n/* index rail: items light at their semantic beat (--at, set per item) */\n#rhine-splash.is-playing .rl-rail-line { animation: rl-grow-y calc(900 * var(--t)) var(--e-io) calc(250 * var(--t)) both; }\n#rhine-splash.is-playing .rl-rail-sig {\n  animation:\n    rl-fade calc(300 * var(--t)) var(--e-out) calc(300 * var(--t)) both,\n    rl-pulse calc(var(--beat) * 2) ease-in-out calc(600 * var(--t)) infinite;\n}\n#rhine-splash.is-playing .rl-rail-item { animation: rl-dim-in calc(420 * var(--t)) var(--e-out) calc((350 + var(--i) * 70) * var(--t)) both; }\n#rhine-splash.is-playing .rl-rail-tx { animation: rl-ink-in calc(260 * var(--t)) var(--e-out) calc(var(--at) * var(--t)) both; }\n#rhine-splash.is-playing .rl-rail-mk { animation: rl-mk-hot calc(900 * var(--t)) var(--e-out) calc(var(--at) * var(--t)) both; }\n#rhine-splash.is-playing .rl-rail-bar { animation: rl-grow-x calc(420 * var(--t)) var(--e-io) calc(var(--at) * var(--t)) both; }\n\n/* act A */\n#rhine-splash.is-playing .rl-access {\n  animation:\n    rl-in calc(300 * var(--t)) var(--e-out) calc(250 * var(--t)) both,\n    rl-out calc(240 * var(--t)) var(--e-in) calc(1450 * var(--t)) forwards;\n}\n#rhine-splash.is-playing .rl-access-text { animation: rl-spread calc(280 * var(--t)) var(--e-in) calc(1420 * var(--t)) both; }\n#rhine-splash.is-playing .rl-handoff { animation: rl-handoff calc(760 * var(--t)) var(--e-io) calc(1400 * var(--t)) both; }\n#rhine-splash.is-playing .rl-ar-arcs { animation: rl-arc-turn calc(1500 * var(--t)) var(--e-io) calc(250 * var(--t)) both; }\n#rhine-splash.is-playing .rl-ar-faint { animation: rl-fade calc(500 * var(--t)) var(--e-out) calc(300 * var(--t)) both; }\n#rhine-splash.is-playing .rl-access-dot {\n  animation:\n    rl-pop calc(360 * var(--t)) var(--e-pop) calc(480 * var(--t)) both,\n    rl-ping calc(520 * var(--t)) var(--e-out) calc(var(--G) * var(--t));\n}\n#rhine-splash.is-playing .rl-access-dot--b { animation-delay: calc(540 * var(--t)), calc((var(--G) + 60) * var(--t)); }\n#rhine-splash.is-playing .rl-ellipsis { animation: rl-blink calc(var(--beat) / 2) steps(1, end) infinite; }\n#rhine-splash.is-playing .rl-access-sub { animation: rl-rise calc(320 * var(--t)) var(--e-out) calc(var(--G) * var(--t)) both; }\n\n/* peripheral HUD sweep, clockwise from the top right */\n#rhine-splash.is-playing .rl-specimen { animation: rl-fade calc(400 * var(--t)) var(--e-out) calc(600 * var(--t)) both; }\n#rhine-splash.is-playing .rl-spec-view { animation: rl-focus calc(900 * var(--t)) var(--e-out) calc(640 * var(--t)) both; }\n#rhine-splash.is-playing .rl-spec-scan { animation: rl-scan calc(var(--beat) * 2) var(--e-io) calc(900 * var(--t)) infinite; }\n#rhine-splash.is-playing .rl-spec-lead { animation: rl-grow-x calc(360 * var(--t)) var(--e-io) calc(760 * var(--t)) both; }\n#rhine-splash.is-playing .rl-spec-data { animation: rl-slide-r calc(420 * var(--t)) var(--e-out) calc(840 * var(--t)) both; }\n#rhine-splash.is-playing .rl-spec-scale { animation: rl-fade calc(300 * var(--t)) var(--e-out) calc(920 * var(--t)) both; }\n\n#rhine-splash.is-playing .rl-caution { animation: rl-slide-r calc(420 * var(--t)) var(--e-out) calc(720 * var(--t)) both; }\n#rhine-splash.is-playing .rl-caution > i { animation: rl-hazard var(--beat) linear infinite; }\n#rhine-splash.is-playing .rl-prog { animation: rl-slide-r calc(420 * var(--t)) var(--e-out) calc(800 * var(--t)) both; }\n#rhine-splash.is-playing .rl-powered { animation: rl-slide-r calc(420 * var(--t)) var(--e-out) calc(880 * var(--t)) both; }\n\n#rhine-splash.is-playing .rl-file-lead { animation: rl-grow-x calc(480 * var(--t)) var(--e-io) calc(900 * var(--t)) both; }\n#rhine-splash.is-playing .rl-file-box { animation: rl-slide calc(420 * var(--t)) var(--e-out) calc(980 * var(--t)) both; }\n#rhine-splash.is-playing .rl-redact > i { animation: rl-grow-x calc(420 * var(--t)) var(--e-io) calc(1060 * var(--t)) both; }\n#rhine-splash.is-playing .rl-redact > i:nth-child(2) { animation-delay: calc(1120 * var(--t)); }\n#rhine-splash.is-playing .rl-redact > i:nth-child(3) { animation-delay: calc(1180 * var(--t)); }\n#rhine-splash.is-playing .rl-code-row { animation: rl-wipe calc(480 * var(--t)) var(--e-io) calc(1260 * var(--t)) both; }\n#rhine-splash.is-playing .rl-hint { animation: rl-hint calc(600 * var(--t)) var(--e-out) calc(1700 * var(--t)) both; }\n\n/* act B: emblem — ticks counter-rotate against the accent arcs */\n#rhine-splash.is-playing .rl-e-ring { animation: rl-draw calc(820 * var(--t)) var(--e-io) calc(var(--B) * var(--t)) both; }\n#rhine-splash.is-playing .rl-e-ticks {\n  animation:\n    rl-ticks-in calc(700 * var(--t)) var(--e-out) calc((var(--B) + 100) * var(--t)) both,\n    rl-spin-rev calc(var(--beat) * 40) linear calc((var(--B) + 800) * var(--t)) infinite;\n}\n#rhine-splash.is-playing .rl-e-hex { animation: rl-draw calc(760 * var(--t)) var(--e-io) calc((var(--B) + 200) * var(--t)) both; }\n#rhine-splash.is-playing .rl-e-cross { animation: rl-fade calc(400 * var(--t)) var(--e-out) calc((var(--B) + 350) * var(--t)) both; }\n#rhine-splash.is-playing .rl-e-arcs { animation: rl-spin calc(var(--beat) * 8) linear calc((var(--B) + 450) * var(--t)) infinite; }\n#rhine-splash.is-playing .rl-e-arc { animation: rl-arc calc(620 * var(--t)) var(--e-io) calc((var(--B) + 450) * var(--t)) both; }\n#rhine-splash.is-playing .rl-e-sweep { animation: rl-sweep calc(1500 * var(--t)) var(--e-io) calc((var(--B) + 550) * var(--t)) both; }\n#rhine-splash.is-playing .rl-e-bond { animation: rl-fade calc(300 * var(--t)) var(--e-out) calc((var(--B) + 700) * var(--t)) both; }\n#rhine-splash.is-playing .rl-e-node { animation: rl-pop calc(360 * var(--t)) var(--e-pop) calc((var(--B) + 720) * var(--t)) both; }\n#rhine-splash.is-playing .rl-e-node:nth-of-type(2) { animation-delay: calc((var(--B) + 800) * var(--t)); }\n#rhine-splash.is-playing .rl-e-node:nth-of-type(3) { animation-delay: calc((var(--B) + 880) * var(--t)); }\n#rhine-splash.is-playing .rl-e-core {\n  animation:\n    rl-pop calc(360 * var(--t)) var(--e-pop) calc((var(--B) + 940) * var(--t)) both,\n    rl-pulse calc(var(--beat) * 2) ease-in-out calc((var(--B) + 1400) * var(--t)) infinite;\n}\n#rhine-splash.is-playing .rl-e-label { animation: rl-fade calc(400 * var(--t)) var(--e-out) calc((var(--B) + 800) * var(--t)) both; }\n#rhine-splash.is-playing .rl-gl--h { animation: rl-grow-x calc(900 * var(--t)) var(--e-io) calc((var(--B) + 150) * var(--t)) both; }\n#rhine-splash.is-playing .rl-gl--v1,\n#rhine-splash.is-playing .rl-gl--v2 { animation: rl-grow-y calc(900 * var(--t)) var(--e-io) calc((var(--B) + 230) * var(--t)) both; }\n#rhine-splash.is-playing .rl-divider { animation: rl-grow-y calc(600 * var(--t)) var(--e-io) calc((var(--B) + 500) * var(--t)) both; }\n\n/* act B: lockup */\n#rhine-splash.is-playing .rl-panel { animation: rl-panel-in calc(520 * var(--t)) var(--e-io) calc((var(--B) + 200) * var(--t)) both; }\n#rhine-splash.is-playing .rl-over { animation: rl-slide calc(420 * var(--t)) var(--e-out) calc((var(--B) + 300) * var(--t)) both; }\n#rhine-splash.is-playing .rl-w1 { animation: rl-slide calc(420 * var(--t)) var(--e-out) calc((var(--B) + 360) * var(--t)) both; }\n#rhine-splash.is-playing .rl-title { animation: rl-wipe calc(380 * var(--t)) var(--e-io) calc((var(--B) + 420) * var(--t)) both; }\n#rhine-splash.is-playing .rl-ch { animation: rl-char calc(420 * var(--t)) var(--e-out) calc((var(--B) + 600 + var(--i) * 28) * var(--t)) both; }\n#rhine-splash.is-playing .rl-w2 { animation: rl-slide calc(420 * var(--t)) var(--e-out) calc((var(--B) + 720) * var(--t)) both; }\n#rhine-splash.is-playing .rl-bar { animation: rl-wipe-wide calc(520 * var(--t)) var(--e-io) calc((var(--B) + 800) * var(--t)) both; }\n#rhine-splash.is-playing .rl-bar-head { animation: rl-head-in calc(360 * var(--t)) var(--e-pop) calc((var(--B) + 900) * var(--t)) both; }\n#rhine-splash.is-playing .rl-bar-fill { animation: rl-glint calc(var(--beat) * 2) var(--e-io) calc((var(--B) + 950) * var(--t)) infinite; }\n#rhine-splash.is-playing .rl-sc { animation: rl-fade 1ms linear calc((var(--B) + 1000 + var(--i) * 12) * var(--t)) both; }\n#rhine-splash.is-playing .rl-caret {\n  animation:\n    rl-fade 1ms linear calc((var(--B) + 1000 + var(--n, 40) * 12) * var(--t)) both,\n    rl-blink var(--beat) steps(1, end) calc((var(--B) + 1000 + var(--n, 40) * 12) * var(--t)) infinite;\n}\n#rhine-splash.is-playing .rl-tile { animation: rl-tile-in calc(460 * var(--t)) var(--e-out) calc((var(--B) + 950 + var(--i) * 110) * var(--t)) both; }\n\n/* ---------------------------------------------------------------- exit */\n\n#rhine-splash.is-leaving { pointer-events: none; }\n#rhine-splash.is-leaving .rl-drag { -webkit-app-region: no-drag; }\n#rhine-splash[data-exit=\"doors\"].is-leaving .rl-stage { animation: rl-stage-out 220ms var(--e-in) both; }\n#rhine-splash[data-exit=\"doors\"].is-leaving .rl-seam { animation: rl-seam 380ms var(--e-io) 80ms both; }\n#rhine-splash[data-exit=\"doors\"].is-leaving .rl-door::after { opacity: 1; }\n#rhine-splash[data-exit=\"doors\"].is-reduced .rl-door::after { display: none; }\n#rhine-splash[data-exit=\"doors\"].is-leaving .rl-door--top { animation: rl-door-up 540ms var(--e-io) 280ms both; }\n#rhine-splash[data-exit=\"doors\"].is-leaving .rl-door--bottom { animation: rl-door-down 540ms var(--e-io) 280ms both; }\n#rhine-splash[data-exit=\"fade\"].is-leaving { animation: rl-out 320ms var(--e-out) both; }\n\n#rhine-splash .rl-decode {\n  position: absolute;\n  inset: 0;\n  width: 100%;\n  height: 100%;\n  z-index: 5;\n  pointer-events: none;\n}\n\n#rhine-splash .rl-slice {\n  position: absolute;\n  inset: 0;\n  z-index: 5;\n  background: var(--rl-bg);\n  overflow: hidden;\n  pointer-events: none;\n}\n\n#rhine-splash .rl-slice,\n#rhine-splash .rl-slice * { animation: none !important; transition: none !important; }\n#rhine-splash .rl-slice .rl-stage { visibility: visible; }\n#rhine-splash[data-exit=\"glitch\"].is-leaving .rl-slice {\n  text-shadow: 2px 0 rgba(255, 40, 90, .75), -2px 0 rgba(0, 210, 255, .75);\n}\n/* The outline watermark has transparent fill, so a shadow would paint the\n   whole glyph solid; keep it a bare outline. */\n#rhine-splash[data-exit=\"glitch\"].is-leaving .rl-slice .rl-watermark { text-shadow: none; }\n\n#rhine-splash .rl-glitch-bar {\n  position: absolute;\n  left: 0;\n  right: 0;\n  height: 2px;\n  z-index: 6;\n  background: var(--rl-accent);\n  box-shadow: 0 0 8px var(--rl-accent);\n  pointer-events: none;\n}\n\n#rhine-splash[data-exit=\"iris\"].is-leaving {\n  clip-path: polygon(evenodd,\n    0 0, 100% 0, 100% 100%, 0 100%, 0 0,\n    var(--rl-cx) calc(var(--rl-cy) - var(--rl-iris-s) * 100px),\n    calc(var(--rl-cx) + var(--rl-iris-s) * 86.6px) calc(var(--rl-cy) - var(--rl-iris-s) * 50px),\n    calc(var(--rl-cx) + var(--rl-iris-s) * 86.6px) calc(var(--rl-cy) + var(--rl-iris-s) * 50px),\n    var(--rl-cx) calc(var(--rl-cy) + var(--rl-iris-s) * 100px),\n    calc(var(--rl-cx) - var(--rl-iris-s) * 86.6px) calc(var(--rl-cy) + var(--rl-iris-s) * 50px),\n    calc(var(--rl-cx) - var(--rl-iris-s) * 86.6px) calc(var(--rl-cy) - var(--rl-iris-s) * 50px),\n    var(--rl-cx) calc(var(--rl-cy) - var(--rl-iris-s) * 100px), 0 0);\n  animation: rl-iris 760ms var(--e-io) 300ms both;\n}\n\n#rhine-splash .rl-iris-ring {\n  position: absolute;\n  left: var(--rl-cx);\n  top: var(--rl-cy);\n  width: 200px;\n  height: 200px;\n  margin: -100px 0 0 -100px;\n  z-index: 6;\n  overflow: visible;\n  fill: none;\n  stroke: var(--rl-accent);\n  stroke-width: 2;\n  filter: drop-shadow(0 0 6px var(--rl-accent));\n  pointer-events: none;\n  transform: scale(var(--rl-iris-s));\n}\n\n#rhine-splash .rl-iris-ring polygon { vector-effect: non-scaling-stroke; }\n#rhine-splash .rl-iris-ring--b {\n  stroke-width: 1;\n  opacity: .6;\n  animation: rl-iris 760ms var(--e-io) 360ms both;\n}\n#rhine-splash[data-exit=\"iris\"].is-leaving .rl-stage { animation: rl-out 320ms var(--e-in) 760ms both; }\n\n/* Iris prime (0–300 ms) guides the eye to where the aperture will open:\n   a spotlight dims the scene around the emblem, its guide lines turn\n   orange and retract into it, the hexagon charges and the emblem bumps,\n   and three hex pings ripple out of the centre. */\n#rhine-splash .rl-iris-spot {\n  position: absolute;\n  inset: 0;\n  z-index: 4;\n  background: radial-gradient(circle at var(--rl-cx) var(--rl-cy),\n    transparent 0, transparent 118px,\n    color-mix(in srgb, var(--rl-bg) 80%, transparent) 250px);\n  pointer-events: none;\n  animation: rl-fade 260ms var(--e-out) both;\n}\n#rhine-splash[data-exit=\"iris\"].is-leaving .rl-emblem {\n  z-index: 5;\n  animation: rl-iris-prime 320ms var(--e-out) both;\n}\n#rhine-splash[data-exit=\"iris\"].is-leaving .rl-e-hex {\n  stroke: var(--rl-accent);\n  stroke-width: 2.6;\n  filter: drop-shadow(0 0 3px var(--rl-accent));\n}\n#rhine-splash[data-exit=\"iris\"].is-leaving .rl-gl {\n  background: var(--rl-accent);\n  box-shadow: 0 0 6px var(--rl-accent);\n}\n#rhine-splash[data-exit=\"iris\"].is-leaving .rl-gl--h { width: var(--rl-gl-left, 100vw); animation: rl-iris-pull-x 300ms var(--e-io) both; }\n#rhine-splash[data-exit=\"iris\"].is-leaving .rl-gl--v1 { height: var(--rl-gl-up, 100vh); animation: rl-iris-pull-y 300ms var(--e-io) both; }\n#rhine-splash[data-exit=\"iris\"].is-leaving .rl-gl--v2 { height: var(--rl-gl-down, 100vh); animation: rl-iris-pull-y 300ms var(--e-io) both; }\n#rhine-splash .rl-iris-ping {\n  position: absolute;\n  left: var(--rl-cx);\n  top: var(--rl-cy);\n  width: 200px;\n  height: 200px;\n  margin: -100px 0 0 -100px;\n  z-index: 6;\n  overflow: visible;\n  fill: none;\n  stroke: var(--rl-accent);\n  stroke-width: 1.5;\n  pointer-events: none;\n  opacity: 0;\n  animation: rl-iris-ping 460ms var(--e-out) both;\n}\n#rhine-splash .rl-iris-ping polygon { vector-effect: non-scaling-stroke; }\n\n/* ------------------------------------------------------ reduced motion */\n\n#rhine-splash.is-reduced .rl-stage *,\n#rhine-splash.is-reduced .rl-stage *::before,\n#rhine-splash.is-reduced .rl-stage *::after { animation: none !important; }\n#rhine-splash.is-reduced .rl-access,\n#rhine-splash.is-reduced .rl-handoff { display: none; }\n#rhine-splash.is-reduced .rl-e-sweep,\n#rhine-splash.is-reduced .rl-spec-scan { opacity: 0; }\n#rhine-splash.is-reduced.is-leaving > * { animation: none !important; }\n#rhine-splash.is-reduced.is-leaving { animation: rl-out 320ms ease-out both; }\n\n/* ---------------------------------------------------- smaller windows */\n\n@media (max-width: 1099px), (max-height: 719px) {\n  #rhine-splash .rl-specimen { display: none; }\n}\n\n@media (max-height: 699px) {\n  #rhine-splash .rl-file,\n  #rhine-splash .rl-caution { display: none; }\n}\n\n@media (max-width: 899px) {\n  #rhine-splash .rl-rail { display: none; }\n}\n\n@media (max-width: 860px) {\n  #rhine-splash .rl-center { flex-direction: column; gap: 22px; padding-bottom: 110px; }\n  #rhine-splash .rl-emblem { width: 120px; height: 120px; }\n  #rhine-splash .rl-gl--h { display: none; }\n  #rhine-splash .rl-divider { width: 96px; height: 1px; }\n  #rhine-splash.is-playing .rl-divider { animation-name: rl-grow-x; }\n  #rhine-splash .rl-text { align-items: center; text-align: center; }\n  #rhine-splash .rl-title { font-size: clamp(20px, 5.4vw, 34px); }\n  #rhine-splash .rl-sub { font-size: 9.5px; letter-spacing: 0.1em; white-space: normal; max-width: 80vw; }\n  #rhine-splash .rl-tiles { justify-content: center; }\n  #rhine-splash .rl-watermark,\n  #rhine-splash .rl-file { display: none; }\n}\n\n@media (max-width: 700px) {\n  #rhine-splash .rl-top .rl-dim,\n  #rhine-splash .rl-top .rl-clock,\n  #rhine-splash .rl-top .rl-live { display: none; }\n  #rhine-splash .rl-foot-r { left: 50%; right: auto; transform: translateX(-50%); }\n  #rhine-splash .rl-tile { width: 52px; height: 52px; }\n  #rhine-splash .rl-tile-ab { font-size: 20px; }\n  #rhine-splash .rl-tile-cap { font-size: 6px; }\n}\n\n/* ---------------------------------------------------------- keyframes */\n\n@keyframes rl-fade { from { opacity: 0; } }\n@keyframes rl-in { from { opacity: 0; } to { opacity: 1; } }\n@keyframes rl-out { to { opacity: 0; } }\n@keyframes rl-drop { from { opacity: 0; transform: translateY(-10px); } }\n@keyframes rl-slide { from { opacity: 0; transform: translateX(-12px); } }\n@keyframes rl-slide-r { from { opacity: 0; transform: translateX(12px); } }\n@keyframes rl-corner { from { opacity: 0; transform: translate(var(--dx), var(--dy)); } }\n@keyframes rl-draw { from { stroke-dashoffset: 1; } }\n@keyframes rl-arc { from { stroke-dasharray: 0 360; } }\n@keyframes rl-spin { to { transform: rotate(360deg); } }\n@keyframes rl-spin-rev { to { transform: rotate(-360deg); } }\n@keyframes rl-handoff { 0% { opacity: 1; transform: scaleX(0); } 50% { opacity: 1; transform: scaleX(1); } 100% { opacity: 0; transform: scaleX(1); } }\n@keyframes rl-lock { 0% { border-color: var(--rl-accent); } }\n@keyframes rl-ping { 35% { transform: scale(2.2); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rl-accent) 30%, transparent); } }\n@keyframes rl-rise { from { opacity: 0; transform: translate(-50%, 6px); } }\n@keyframes rl-ticks-in { from { opacity: 0; transform: rotate(-40deg) scale(0.94); } }\n@keyframes rl-sweep {\n  0% { opacity: 0; transform: rotate(-60deg); }\n  25% { opacity: 1; }\n  100% { opacity: 0; transform: rotate(300deg); }\n}\n@keyframes rl-pop { from { transform: scale(0); } }\n@keyframes rl-pulse { 50% { opacity: 0.45; } }\n@keyframes rl-grow-x { from { transform: scaleX(0); } }\n@keyframes rl-grow-y { from { transform: scaleY(0); } }\n@keyframes rl-char { from { opacity: 0; transform: translateY(0.3em); filter: blur(5px); } }\n@keyframes rl-blink { 50% { opacity: 0; } }\n@keyframes rl-hint { from { opacity: 0; } to { opacity: 0.75; } }\n@keyframes rl-field-in { from { opacity: 0; transform: scale(1.06) translateX(2%); } }\n@keyframes rl-drift { from { opacity: 0; transform: translateX(4vw); } }\n@keyframes rl-orbit-in { from { opacity: 0; transform: rotate(-140deg); } }\n@keyframes rl-arc-turn { from { transform: rotate(-90deg); } to { transform: rotate(90deg); } }\n@keyframes rl-spread { to { opacity: 0; letter-spacing: 0.9em; } }\n@keyframes rl-dim-in { from { opacity: 0; transform: translate(-6px, -50%); } }\n@keyframes rl-ink-in { from { color: var(--rl-muted); } }\n@keyframes rl-mk-hot { 0% { opacity: 0.3; } 1% { opacity: 1; background: var(--rl-accent); transform: scale(1.6); } 40% { background: var(--rl-accent); transform: none; } }\n@keyframes rl-panel-in { from { opacity: 0; clip-path: inset(0 0 100% 0); } to { opacity: 1; clip-path: inset(0); } }\n@keyframes rl-wipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0); } }\n@keyframes rl-wipe-wide { from { clip-path: inset(-14px 100% -14px -10px); } to { clip-path: inset(-14px -10px -14px -10px); } }\n@keyframes rl-head-in { from { opacity: 0; transform: translateY(-8px); } }\n@keyframes rl-glint { from { background-position: -56px 0, 0 0; } 70%, to { background-position: calc(100% + 56px) 0, 0 0; } }\n@keyframes rl-tile-in { from { opacity: 0; transform: rotateY(-80deg) translateX(-6px); } }\n@keyframes rl-focus { from { opacity: 0; transform: scale(0.86); filter: blur(6px); } }\n@keyframes rl-scan { 0% { top: 0; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { top: 100%; opacity: 0; } }\n@keyframes rl-hazard { to { background-position: 11.3px 0; } }\n@keyframes rl-stage-out { to { opacity: 0; transform: scale(1.015); } }\n@keyframes rl-seam {\n  0% { opacity: 1; transform: scaleX(0); }\n  65% { opacity: 1; transform: scaleX(1); }\n  100% { opacity: 0; transform: scaleX(1); }\n}\n@keyframes rl-door-up { to { transform: translateY(-101%); } }\n@keyframes rl-door-down { to { transform: translateY(101%); } }\n\n@property --rl-iris-s { syntax: '<number>'; inherits: true; initial-value: 0; }\n@keyframes rl-iris { from { --rl-iris-s: 0; } to { --rl-iris-s: var(--rl-iris-max); } }\n@keyframes rl-iris-prime { 45% { transform: scale(1.1); } 100% { transform: scale(0.96); } }\n@keyframes rl-iris-pull-x { to { transform: scaleX(0); } }\n@keyframes rl-iris-pull-y { to { transform: scaleY(0); } }\n@keyframes rl-iris-ping { 0% { opacity: 1; transform: scale(0.12); } 100% { opacity: 0; transform: scale(1.15); } }\n\n\n/* ==== WorkBuddy 增量层 ==== */\n/*\n * WorkBuddy 版莱茵生命开屏 —— 增量样式层。\n *\n * 上游 lib/splash.css 全文原封内联，本文件只在其后追加，作用域同样限制在\n * #rhine-splash 下。新增类名以 rl-wb- 开头，不碰上游的 rl-*。\n */\n\n/* ------------------------------------------------- bilingual 中文注释 */\n\n#rhine-splash em.rl-cn {\n  font-style: normal;\n  font-weight: 500;\n  margin-left: 0.58em;\n  letter-spacing: 0.08em;\n  opacity: 0.62;\n}\n\n#rhine-splash .rl-status em.rl-cn { font-size: 10px; letter-spacing: 0.04em; }\n\n#rhine-splash .rl-w em.rl-cn {\n  margin-left: 0.6em;\n  font-size: 0.78em;\n  font-weight: 500;\n  letter-spacing: 0.12em;\n  opacity: 0.55;\n}\n\n#rhine-splash .rl-access-sub em.rl-cn { font-size: 9.5px; letter-spacing: 0.06em; }\n\n#rhine-splash .rl-over em.rl-cn { font-size: 9.5px; letter-spacing: 0.1em; }\n\n#rhine-splash .rl-rail-tx em.rl-cn {\n  margin-left: 7px;\n  font-size: 8.5px;\n  letter-spacing: 0.14em;\n  opacity: 0.5;\n}\n\n/* ------------------------------------------------------------ 阶段条 */\n\n/* 顶部框架条正中，跟随 .rl-top 的 rl-drop 动画一起落位 */\n#rhine-splash .rl-wb-stagebar {\n  position: absolute;\n  left: 50%;\n  top: 50%;\n  transform: translate(-50%, -50%);\n  display: flex;\n  align-items: center;\n  gap: 9px;\n  padding-left: 12px;\n  font: 500 9px/1 var(--rl-mono);\n  letter-spacing: 0.16em;\n  color: var(--rl-muted);\n  white-space: nowrap;\n  pointer-events: none;\n}\n\n/* 左侧橙色竖线，呼应索引轨的刻度语言 */\n#rhine-splash .rl-wb-stagebar::before {\n  content: \"\";\n  position: absolute;\n  left: 0;\n  top: 50%;\n  width: 1px;\n  height: 13px;\n  margin-top: -6.5px;\n  background: var(--rl-accent);\n}\n\n#rhine-splash .rl-wb-sb-no { font-variant-numeric: tabular-nums; }\n#rhine-splash .rl-wb-sb-no b { color: var(--rl-accent-ink); font-weight: 700; }\n\n#rhine-splash .rl-wb-sb-sep {\n  display: block;\n  width: 15px;\n  height: 1px;\n  background: var(--rl-line-strong);\n}\n\n#rhine-splash .rl-wb-sb-now {\n  display: inline-flex;\n  align-items: baseline;\n  gap: 7px;\n  color: var(--rl-ink);\n  will-change: opacity, transform;\n}\n\n#rhine-splash .rl-wb-sb-zh { font-size: 10px; letter-spacing: 0.18em; }\n\n#rhine-splash .rl-wb-sb-en {\n  font-size: 8px;\n  letter-spacing: 0.22em;\n  color: var(--rl-muted);\n}\n\n#rhine-splash .rl-wb-sb-ticks {\n  display: inline-flex;\n  gap: 3px;\n  margin-left: 3px;\n}\n\n#rhine-splash .rl-wb-sb-ticks > i {\n  width: 11px;\n  height: 3px;\n  background: var(--rl-line-strong);\n  opacity: 0.45;\n}\n\n#rhine-splash .rl-wb-sb-ticks > i.is-on { background: var(--rl-accent); opacity: 0.45; }\n#rhine-splash .rl-wb-sb-ticks > i.is-now { background: var(--rl-accent); opacity: 1; }\n\n#rhine-splash.is-playing .rl-wb-stagebar {\n  animation: rl-fade calc(420 * var(--t)) var(--e-out) calc(260 * var(--t)) both;\n}\n\n/* ------------------------------------------------------------ 布局对齐 */\n\n/* 阶段条与顶部中央注册刻度（rl-reg--a，top:58px 居中）重叠，挪开 */\n#rhine-splash .rl-reg--a { top: 96px; }\n\n/* 上游标题列实测 464px；品牌名更短会让白底标题块变窄、把第 5 个模块方块\n   挤出面板。钉同一宽度，面板宽度与徽记位置跟上游逐像素对齐。 */\n#rhine-splash .rl-text { min-width: 464px; }\n\n@media (max-width: 1180px) {\n  #rhine-splash .rl-status em.rl-cn { display: none; }\n}\n\n@media (max-width: 980px) {\n  #rhine-splash .rl-wb-stagebar { display: none; }\n}\n\n/* 注入宿主时兜底：不吃宿主的鼠标事件，退出后不留痕迹 */\n#rhine-splash { pointer-events: auto; }\n\n/* ================= 性能层 =================\n *\n * 实测基线（Chrome 1600×900 / CPU 4× 降速模拟宿主启动期抢主线程）：\n *   4.42s 窗口里 61 帧、p50 75ms、52 帧超过 50ms；样式重算 3180ms。\n * 三个原因，逐个换掉：\n *   ① 每帧在 :root 上写 --rl-p / --rl-q —— 自定义属性可继承，\n *      写在根上等于整棵子树（87 条动画规则、上百个节点）全部重算；\n *   ② 连接条用 width / left 每帧改，每帧触发布局；\n *   ③ 面板 backdrop-filter 要对身后内容做 10px 模糊，而身后还在动。\n */\n\n#rhine-splash {\n  /* 独占合成层 + 容器隔离：宿主界面在后面怎么重排重绘，都不波及我们。\n     不用 contain: paint，避免把 beyond-viewport 的光圈/舱门裁掉。 */\n  contain: layout style;\n  transform: translateZ(0);\n}\n\n/* ① --rl-p 现在写在 .rl-prog-bar 上（见 splash.wb.js），\n      重算范围从\"整棵树\"缩到\"一条填充\"。 */\n#rhine-splash .rl-prog-bar > i {\n  transform: scaleX(var(--rl-p, 0));\n  will-change: transform;\n}\n\n/* ② 填充：width 每帧改 → clip-path（只重绘不重排），渐变保留原始尺寸，观感不变 */\n#rhine-splash .rl-bar-fill {\n  width: 100% !important;\n  clip-path: inset(0 calc((1 - var(--rl-q, 0)) * 100%) 0 0);\n}\n\n/* ② 读头：left 每帧改 → transform；--rl-bar-w 是挂载时量一次的轨道宽度 */\n#rhine-splash .rl-bar-head {\n  left: 0 !important;\n  transform: translateX(calc(var(--rl-q, 0) * var(--rl-bar-w, 0px)));\n  will-change: transform;\n}\n\n/* ③ 静态时几乎看不出来，但它每帧要对身后一整块做模糊 */\n#rhine-splash .rl-glass {\n  -webkit-backdrop-filter: none !important;\n  backdrop-filter: none !important;\n}\n\n/* 退场光圈：全屏 SVG 多边形 + drop-shadow，且每帧在放大 —— 等于每帧对整屏\n   重新栅格化一遍阴影。实测退场段（3.3~4.5s）的尖峰就出在这里。\n   去掉阴影、把描边加粗一点补回存在感，观感差别很小。 */\n#rhine-splash .rl-iris-ring {\n  filter: none !important;\n  stroke-width: 2.6;\n}\n\n/* 逐字落位 / 样本窗对焦原本带 blur(5~6px)：每个字符一个合成层、每帧重新栅格化。\n   在 4.5 秒的动画里，这点模糊看不出来，代价却是实打实的。 */\n@keyframes rl-char {\n  from { opacity: 0; transform: translateY(0.3em); }\n}\n\n@keyframes rl-focus {\n  from { opacity: 0; transform: scale(0.86); }\n}\n\n/* 既然不再用 filter，就别让它留在 will-change 里占一层纹理 */\n#rhine-splash .rl-ch { will-change: transform, opacity; }\n\n/* ---------- 自适应降级 is-lite ----------\n *\n * 宿主启动时会和我们抢渲染主线程，不同机器上到底卡不卡差别很大。\n * 所以不写死：播放头 400ms 内量一遍帧间隔，p95 超过 34ms 才切到 is-lite，\n * 只去掉\"最费绘制\"的装饰层，主构图（徽记 / 标题板 / 阶段条 / 方块）一样不少。\n */\n\n/* 点阵场：74vw 的位图 + 渐变蒙版 + 每帧位移。降级后保留静态底纹，去掉位移和蒙版 */\n#rhine-splash.is-lite .rl-field {\n  animation: none !important;\n  mask-image: none;\n  -webkit-mask-image: none;\n  opacity: 0.55;\n}\n\n/* 大字水印：整幅宽的描边文字，重绘成本高。降级后只留很淡的填充 */\n#rhine-splash.is-lite .rl-watermark {\n  -webkit-text-stroke: 0;\n  color: var(--rl-line-strong);\n  opacity: 0.14;\n}\n\n/* 警示斜纹：每帧改 background-position，纯重绘 */\n#rhine-splash.is-lite .rl-hazard { animation: none !important; }\n\n/* 逐字落位：去掉位移缓动，直接淡入 */\n#rhine-splash.is-lite .rl-ch {\n  animation-name: rl-fade !important;\n  will-change: opacity;\n}\n\n/* 外环长转：96 秒一圈，看不出价值，先停 */\n#rhine-splash.is-lite .rl-orbit--2 { animation-play-state: paused; }\n\n\n/* ==== 内联素材 ==== */\n#rhine-splash{--rl-img-specimen:url(\"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAASABIAAD/4QBARXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAABQKADAAQAAAABAAABQAAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/+IRrElDQ19QUk9GSUxFAAEBAAARnGFwcGwCAAAAbW50ckdSQVlYWVogB9wACAAXAA8ALgAPYWNzcEFQUEwAAAAAbm9uZQAAAAAAAAAAAAAAAAAAAAAAAPbWAAEAAAAA0y1hcHBsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFZGVzYwAAAMAAAAB5ZHNjbQAAATwAAAgaY3BydAAACVgAAAAjd3RwdAAACXwAAAAUa1RSQwAACZAAAAgMZGVzYwAAAAAAAAAfR2VuZXJpYyBHcmF5IEdhbW1hIDIuMiBQcm9maWxlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG1sdWMAAAAAAAAAHwAAAAxza1NLAAAALgAAAYRkYURLAAAAOgAAAbJjYUVTAAAAOAAAAex2aVZOAAAAQAAAAiRwdEJSAAAASgAAAmR1a1VBAAAALAAAAq5mckZVAAAAPgAAAtpodUhVAAAANAAAAxh6aFRXAAAAGgAAA0xrb0tSAAAAIgAAA2ZuYk5PAAAAOgAAA4hjc0NaAAAAKAAAA8JoZUlMAAAAJAAAA+pyb1JPAAAAKgAABA5kZURFAAAATgAABDhpdElUAAAATgAABIZzdlNFAAAAOAAABNR6aENOAAAAGgAABQxqYUpQAAAAJgAABSZlbEdSAAAAKgAABUxwdFBPAAAAUgAABXZubE5MAAAAQAAABchlc0VTAAAATAAABgh0aFRIAAAAMgAABlR0clRSAAAAJAAABoZmaUZJAAAARgAABqpockhSAAAAPgAABvBwbFBMAAAASgAABy5hckVHAAAALAAAB3hydVJVAAAAOgAAB6RlblVTAAAAPAAAB94AVgFhAGUAbwBiAGUAYwBuAOEAIABzAGkAdgDhACAAZwBhAG0AYQAgADIALAAyAEcAZQBuAGUAcgBpAHMAawAgAGcAcgDlACAAMgAsADIAIABnAGEAbQBtAGEALQBwAHIAbwBmAGkAbABHAGEAbQBtAGEAIABkAGUAIABnAHIAaQBzAG8AcwAgAGcAZQBuAOgAcgBpAGMAYQAgADIALgAyAEMepQB1ACAAaADsAG4AaAAgAE0A4AB1ACAAeADhAG0AIABDAGgAdQBuAGcAIABHAGEAbQBtAGEAIAAyAC4AMgBQAGUAcgBmAGkAbAAgAEcAZQBuAOkAcgBpAGMAbwAgAGQAYQAgAEcAYQBtAGEAIABkAGUAIABDAGkAbgB6AGEAcwAgADIALAAyBBcEMAQzBDAEOwRMBD0EMAAgAEcAcgBhAHkALQQzBDAEPAQwACAAMgAuADIAUAByAG8AZgBpAGwAIABnAOkAbgDpAHIAaQBxAHUAZQAgAGcAcgBpAHMAIABnAGEAbQBtAGEAIAAyACwAMgDBAGwAdABhAGwA4QBuAG8AcwAgAHMAegD8AHIAawBlACAAZwBhAG0AbQBhACAAMgAuADKQGnUocHCWjlFJXqYAMgAuADKCcl9pY8+P8Md8vBgAINaMwMkAIKwQucgAIAAyAC4AMgAg1QS4XNMMx3wARwBlAG4AZQByAGkAcwBrACAAZwByAOUAIABnAGEAbQBtAGEAIAAyACwAMgAtAHAAcgBvAGYAaQBsAE8AYgBlAGMAbgDhACABYQBlAGQA4QAgAGcAYQBtAGEAIAAyAC4AMgXSBdAF3gXUACAF0AXkBdUF6AAgBdsF3AXcBdkAIAAyAC4AMgBHAGEAbQBhACAAZwByAGkAIABnAGUAbgBlAHIAaQBjAQMAIAAyACwAMgBBAGwAbABnAGUAbQBlAGkAbgBlAHMAIABHAHIAYQB1AHMAdAB1AGYAZQBuAC0AUAByAG8AZgBpAGwAIABHAGEAbQBtAGEAIAAyACwAMgBQAHIAbwBmAGkAbABvACAAZwByAGkAZwBpAG8AIABnAGUAbgBlAHIAaQBjAG8AIABkAGUAbABsAGEAIABnAGEAbQBtAGEAIAAyACwAMgBHAGUAbgBlAHIAaQBzAGsAIABnAHIA5QAgADIALAAyACAAZwBhAG0AbQBhAHAAcgBvAGYAaQBsZm6QGnBwXqZ8+2VwADIALgAyY8+P8GWHTvZOAIIsMLAw7DCkMKww8zDeACAAMgAuADIAIDDXMO0w1TChMKQw6wOTA7UDvQO5A7oDzAAgA5MDugPBA7kAIAOTA6wDvAO8A7EAIAAyAC4AMgBQAGUAcgBmAGkAbAAgAGcAZQBuAOkAcgBpAGMAbwAgAGQAZQAgAGMAaQBuAHoAZQBuAHQAbwBzACAAZABhACAARwBhAG0AbQBhACAAMgAsADIAQQBsAGcAZQBtAGUAZQBuACAAZwByAGkAagBzACAAZwBhAG0AbQBhACAAMgAsADIALQBwAHIAbwBmAGkAZQBsAFAAZQByAGYAaQBsACAAZwBlAG4A6QByAGkAYwBvACAAZABlACAAZwBhAG0AbQBhACAAZABlACAAZwByAGkAcwBlAHMAIAAyACwAMg4jDjEOBw4qDjUOQQ4BDiEOIQ4yDkAOAQ4jDiIOTA4XDjEOSA4nDkQOGwAgADIALgAyAEcAZQBuAGUAbAAgAEcAcgBpACAARwBhAG0AYQAgADIALAAyAFkAbABlAGkAbgBlAG4AIABoAGEAcgBtAGEAYQBuACAAZwBhAG0AbQBhACAAMgAsADIAIAAtAHAAcgBvAGYAaQBpAGwAaQBHAGUAbgBlAHIAaQENAGsAaQAgAEcAcgBhAHkAIABHAGEAbQBtAGEAIAAyAC4AMgAgAHAAcgBvAGYAaQBsAFUAbgBpAHcAZQByAHMAYQBsAG4AeQAgAHAAcgBvAGYAaQBsACAAcwB6AGEAcgBvAVsAYwBpACAAZwBhAG0AbQBhACAAMgAsADIGOgYnBkUGJwAgADIALgAyACAGRAZIBkYAIAYxBkUGJwYvBkoAIAY5BicGRQQeBDEESQQwBE8AIARBBDUEQAQwBE8AIAQzBDAEPAQ8BDAAIAAyACwAMgAtBD8EQAQ+BEQEOAQ7BEwARwBlAG4AZQByAGkAYwAgAEcAcgBhAHkAIABHAGEAbQBtAGEAIAAyAC4AMgAgAFAAcgBvAGYAaQBsAGUAAHRleHQAAAAAQ29weXJpZ2h0IEFwcGxlIEluYy4sIDIwMTIAAFhZWiAAAAAAAADzUQABAAAAARbMY3VydgAAAAAAAAQAAAAABQAKAA8AFAAZAB4AIwAoAC0AMgA3ADsAQABFAEoATwBUAFkAXgBjAGgAbQByAHcAfACBAIYAiwCQAJUAmgCfAKQAqQCuALIAtwC8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\");}\n";
    if (!document.getElementById(CSS_ID)) {
      var style = document.createElement("style");
      style.id = CSS_ID;
      style.textContent = CSS;
      (document.head || document.documentElement).appendChild(style);
    }
    globalThis.__RHINE_SPLASH__ = Object.assign({
      title: "WORKBUDDY",
      subtitle: "RHINE LAB STYLE · AGENT WORKBENCH DIVISION",
      code: "RL-WB/0.2",
      poweredBy: "WORKBUDDY",
      theme: "auto",
      exit: "iris",
      duration: 4500,
      skippable: true,
      replayOnReload: true
    }, globalThis.__RHINE_SPLASH__ || {});
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

  }
  if (document.documentElement) { boot(); return; }
  // document-start：<html> 还没建出来，等它出现（仍在解析期，赶得上首帧）
  try {
    var mo = new MutationObserver(function () {
      if (document.documentElement) { mo.disconnect(); boot(); }
    });
    mo.observe(document, { childList: true, subtree: true });
  } catch (e) {
    document.addEventListener("readystatechange", function () {
      if (document.documentElement) { boot(); }
    });
  }
})();
