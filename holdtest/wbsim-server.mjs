// WB 仿真宿主服务器（E2E 用）：骨架屏 + 长同步阻塞模块 + seed 脚本
import http from 'http';

const PORT = 9462;

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

const hits = [];
const server = http.createServer((req, res) => {
  hits.push(`[${new Date().toISOString().slice(11, 23)}] ${req.method} ${req.url}`);
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
console.log(`WB-sim server on http://127.0.0.1:${PORT}`);

// 请求时间线落盘（供断言"闸门期间服务端没收到脚本请求"）
setInterval(() => {
  if (hits.length) {
    console.log(hits.join('\n'));
    hits.length = 0;
  }
}, 1000);
