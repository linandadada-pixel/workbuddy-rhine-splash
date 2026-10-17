// 网络闸门机制验证：WB 仿真宿主 + 真实开屏载荷，对比无闸门 vs 闸门下的 rAF 帧健康度。
import { createRequire } from 'module';
const require = createRequire('C:/Users/18334/.workbuddy/binaries/node/workspace/');
const puppeteer = require('puppeteer-core');
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 9461;
const PAYLOAD = fs.readFileSync(path.resolve('../splash.inject.js'), 'utf-8');

// ---------------- WB 仿真宿主 ----------------
const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>WB-sim</title>
<script>
  (function(){ var m = /[?&]wbSeedToken=([0-9a-f]{32})/.exec(location.search);
    if (m) document.write('<script src="/seed.js"><\\/script>'); })();
</script>
<style>
html{background:#fff} body{margin:0;font:13px sans-serif}
#skeleton-root{position:fixed;inset:0;background:#f7f7f8;z-index:10}
.sk-side{position:absolute;left:0;top:0;bottom:0;width:200px;background:#f5f5f5}
.sk-main{position:absolute;left:220px;top:40px;right:0;bottom:0}
.sk-bar{height:28px;background:rgba(0,0,0,.06);border-radius:6px;margin:12px}
</style>
<link rel="modulepreload" href="/app.js">
</head>
<body>
<div id="skeleton-root"><div class="sk-side"></div><div class="sk-main"><div class="sk-bar"></div><div class="sk-bar" style="width:60%"></div><div class="sk-bar" style="width:80%"></div></div></div>
<div id="root"></div>
<script src="/skeleton-bootstrap.js"></script>
<script type="module" src="/app.js"></script>
</body>
</html>`;

const APP_JS = `// 模拟宿主大模块：几段长同步任务（模拟 React bundle eval / mount）+ 最后挂 UI
const marks = [];
function chunk(ms) { const t0 = performance.now(); while (performance.now() - t0 < ms) {} marks.push(Math.round(performance.now())); }
chunk(300);
await new Promise(r => setTimeout(r, 120));
chunk(400);
await new Promise(r => setTimeout(r, 150));
chunk(350);
const root = document.getElementById('root');
const ui = document.createElement('div');
ui.id = 'app-ui';
ui.textContent = 'HOST UI READY';
ui.style.cssText = 'height:100%;background:#fff;display:flex;align-items:center;justify-content:center;font:600 24px sans-serif';
root.appendChild(ui);
const sk = document.getElementById('skeleton-root');
if (sk) sk.remove();
window.__HOST_BOOTED = performance.now();`;

const serverHits = [];
const server = http.createServer((req, res) => {
  serverHits.push([Date.now(), req.url]);
  const send = (ct, body, delay = 0) => setTimeout(() => {
    res.writeHead(200, { 'Content-Type': ct });
    res.end(body);
  }, delay);
  if (req.url === '/' || req.url.startsWith('/index')) send('text/html', INDEX_HTML);
  else if (req.url === '/app.js') send('text/javascript', APP_JS);
  else if (req.url === '/skeleton-bootstrap.js') send('text/javascript', 'window.__skBoot = performance.now();');
  else if (req.url === '/seed.js') send('text/javascript', 'window.__seed = performance.now();', 100);
  else { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(PORT, '127.0.0.1', r));

const FRAME_PROBE = `
  window.__frames = [];
  var __last = performance.now();
  (function __probe(now) {
    if (window.__frames.length < 900) window.__frames.push([performance.now(), now - __last]);
    __last = now;
    requestAnimationFrame(__probe);
  })(performance.now());
`;

const stats = (frames) => {
  if (!frames || frames.length === 0) return 'no frames';
  const dts = frames.map(f => f[1]).sort((a, b) => a - b);
  const sum = dts.reduce((a, b) => a + b, 0);
  const at = (q) => dts[Math.min(dts.length - 1, Math.floor(dts.length * q))];
  return `n=${dts.length} mean=${(sum / dts.length).toFixed(1)}ms p50=${at(0.5).toFixed(1)} p95=${at(0.95).toFixed(1)} max=${dts[dts.length - 1].toFixed(1)} >50ms:${dts.filter(d => d > 50).length}`;
};

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: false,
  args: ['--window-size=1200,800'],
});

async function runMode(mode) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1174, height: 820 });
  page.on('pageerror', e => console.log(`[${mode}][pageerror]`, String(e).slice(0, 120)));

  // 帧探针 + 开屏载荷（与真实注入等价：addScriptToEvaluateOnNewDocument）
  await page.evaluateOnNewDocument(FRAME_PROBE);
  if (mode === 'gate') await page.evaluateOnNewDocument('globalThis.__WB_SPLASH_HOLD__ = true;');
  await page.evaluateOnNewDocument(PAYLOAD);

  let held = [];
  let cdp = null;
  if (mode === 'gate') {
    cdp = await page.createCDPSession();
    const passTypes = ['Document', 'Fetch', 'XHR', 'EventSource', 'WebSocket', 'Prefetch', 'CSPReport'];
    cdp.on('Fetch.requestPaused', async (ev) => {
      if (passTypes.includes(ev.resourceType)) {
        await cdp.send('Fetch.continueRequest', { requestId: ev.requestId }).catch(() => {});
      } else {
        held.push(ev.requestId);
        console.log(`[gate] held ${ev.resourceType} ${ev.request.url.slice(0, 70)} (total ${held.length})`);
      }
    });
    await cdp.send('Fetch.enable', {});
  }

  const t0 = Date.now();
  if (mode === 'gate') {
    // 闸门扣住了 parser-blocking 脚本，DOMContentLoaded 永远不会在放行前触发——
    // 不能等导航完成（真实注入器也是不等 load 的），发起后直接进轮询。
    page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 })
      .then(() => console.log(`[${mode}] DCL at +${Date.now() - t0}ms`))
      .catch(() => { });
  } else {
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log(`[${mode}] DCL at +${Date.now() - t0}ms`);
  }

  let doneAt = null;
  if (mode === 'gate') {
    // 等开屏完成信号（自然播完 exitAt≈3.4s 置 DONE）
    for (let i = 0; i < 120; i++) {
      await new Promise(r => setTimeout(r, 100));
      const st = await page.evaluate(() => ({ done: !!globalThis.__WB_SPLASH_DONE__, mount: !!document.getElementById('rhine-splash') })).catch(() => null);
      if (st && st.done) { doneAt = Date.now() - t0; break; }
    }
    console.log(`[${mode}] DONE signal at +${doneAt}ms; releasing ${held.length} held requests`);
    const relT = Date.now();
    for (const rid of held) await cdp.send('Fetch.continueRequest', { requestId: rid }).catch(() => {});
    await cdp.send('Fetch.disable').catch(() => {});
    // 等宿主挂上 UI、开屏退场
    for (let i = 0; i < 100; i++) {
      await new Promise(r => setTimeout(r, 100));
      const st = await page.evaluate(() => ({
        booted: typeof window.__HOST_BOOTED !== 'undefined',
        mount: !!document.getElementById('rhine-splash'),
      })).catch(() => null);
      if (st && st.booted && !st.mount) {
        console.log(`[${mode}] host booted & splash gone at +${Date.now() - t0}ms (release→boot ${Date.now() - relT}ms)`);
        break;
      }
      if (i === 99) console.log(`[${mode}] WARNING: host/splash state at end:`, JSON.stringify(st));
    }
  } else {
    // 无闸门：宿主自然启动（重同步块与开屏抢主线程）
    await new Promise(r => setTimeout(r, 6500));
  }

  const frames = await page.evaluate(() => window.__frames || []);
  const donePerf = await page.evaluate(() => globalThis.__WB_SPLASH_DONE__ ? window.__frames?.find ? true : true : false).catch(() => null);
  // 闸门模式按 DONE 拆两段：hold 期（应顺滑）与放行后（宿主启动，开屏在等宿主）
  if (mode === 'gate' && doneAt !== null) {
    // 用帧时间轴近似拆分：DONE 时的 performance.now 大约等于 splash 时长
    const splitAt = await page.evaluate('globalThis.__WB_SPLASH_DONE__ ? -1 : -1').catch(() => -1);
    const holdFrames = frames.slice(0, Math.max(0, frames.findIndex(f => f[1] > 45)));
    // 更可靠：直接按帧序号前 3.4s（开屏时间轴长度）切
    const holdMs = 3500;
    const inHold = frames.filter(f => f[0] <= holdMs);
    const afterHold = frames.filter(f => f[0] > holdMs);
    console.log(`[${mode}] frames DURING hold  : ${stats(inHold)}`);
    console.log(`[${mode}] frames AFTER release: ${stats(afterHold)}`);
  } else {
    console.log(`[${mode}] frames overall: ${stats(frames)}`);
  }
  const booted = await page.evaluate(() => typeof window.__HOST_BOOTED !== 'undefined' ? Math.round(window.__HOST_BOOTED) : -1).catch(() => -1);
  console.log(`[${mode}] host booted at page-time ${booted}ms`);
  await page.close();
}

console.log('=== MODE A: 无闸门（现状，宿主与开屏抢主线程）===');
await runMode('plain');
console.log('\n=== MODE B: 网络闸门（Fetch 扣住宿主网络，主线程让给开屏）===');
await runMode('gate');

await browser.close();
server.close();
process.exit(0);
