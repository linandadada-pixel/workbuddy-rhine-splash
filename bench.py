#!/usr/bin/env python3
"""用真实 Chrome + CDP 测开屏动画的帧时间。

采样方式：注入后立刻起一个 rAF 循环，记录每帧间隔，直到开屏节点自行移除。
同时读 Performance domain 的 RecalcStyleDuration / LayoutDuration，
用来区分"掉帧是样式重算、布局，还是绘制"。

用法：
    python bench.py                 # 1 倍速（正常机器）
    python bench.py --throttle 4    # 4 倍 CPU 降速（模拟宿主正在启动、抢主线程）
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import secrets
import socket
import struct
import subprocess
import sys
import tempfile
import time
import urllib.request

CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
HERE = os.path.dirname(os.path.abspath(__file__))
PAGE = os.path.join(HERE, 'splash.html')

SAMPLER = r"""
new Promise((resolve) => {
  const el = () => document.getElementById('rhine-splash');
  const times = [];
  let last = performance.now();
  let started = false;
  function tick(now) {
    const dt = now - last;
    last = now;
    if (!started) { started = !!el(); }
    if (started && dt > 0) { times.push(dt); }
    const gone = started && !el();
    if ((gone || now - (window.__benchT0 || now) > 8000) && times.length > 10) {
      const s = times.slice().sort((a, b) => a - b);
      const q = (p) => s[Math.min(s.length - 1, Math.floor(s.length * p))] || 0;
      const mean = s.reduce((a, b) => a + b, 0) / s.length;
      resolve(JSON.stringify({
        frames: s.length,
        mean: +mean.toFixed(2),
        p50: +q(0.5).toFixed(2),
        p95: +q(0.95).toFixed(2),
        max: +(s[s.length - 1] || 0).toFixed(2),
        over33: s.filter((x) => x > 33.4).length,
        over50: s.filter((x) => x > 50).length,
        spikes: (() => { const arr = times.map((dt, i) => [Math.round(i === 0 ? 0 : times.slice(0, i).reduce((a,b)=>a+b,0)), Math.round(dt)]).filter(x => x[1] > 45).slice(0, 8); return arr; })(),
        windowMs: Math.round(s.reduce((a, b) => a + b, 0)),
      }));
      return;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})
"""


class WS:
    def __init__(self, url: str, timeout: float = 30.0):
        rest = url.split('://', 1)[1]
        hostport, _, path = rest.partition('/')
        host, _, port = hostport.partition(':')
        self.sock = socket.create_connection((host, int(port or 80)), timeout=timeout)
        self.sock.settimeout(timeout)
        key = base64.b64encode(secrets.token_bytes(16)).decode()
        self.sock.sendall((
            f'GET /{path} HTTP/1.1\r\nHost: {hostport}\r\nUpgrade: websocket\r\n'
            f'Connection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n'
        ).encode())
        buf = b''
        while b'\r\n\r\n' not in buf:
            chunk = self.sock.recv(1024)
            if not chunk:
                raise RuntimeError('握手失败')
            buf += chunk
        self.buf = buf.split(b'\r\n\r\n', 1)[1]
        self.id = 0

    def _exact(self, n: int) -> bytes:
        while len(self.buf) < n:
            chunk = self.sock.recv(65536)
            if not chunk:
                raise RuntimeError('连接关闭')
            self.buf += chunk
        out, self.buf = self.buf[:n], self.buf[n:]
        return out

    def send(self, method: str, params: dict) -> int:
        self.id += 1
        payload = json.dumps({'id': self.id, 'method': method, 'params': params}).encode()
        header = bytearray([0x81])
        n = len(payload)
        if n < 126:
            header.append(0x80 | n)
        elif n < (1 << 16):
            header.append(0x80 | 126)
            header += struct.pack('>H', n)
        else:
            header.append(0x80 | 127)
            header += struct.pack('>Q', n)
        mask = secrets.token_bytes(4)
        header += mask
        self.sock.sendall(bytes(header) + bytes(b ^ mask[i % 4] for i, b in enumerate(payload)))
        return self.id

    def recv(self) -> dict:
        while True:
            first, second = self._exact(2)
            op = first & 0x0F
            masked = second & 0x80
            length = second & 0x7F
            if length == 126:
                length = struct.unpack('>H', self._exact(2))[0]
            elif length == 127:
                length = struct.unpack('>Q', self._exact(8))[0]
            mk = self._exact(4) if masked else b''
            data = self._exact(length)
            if masked:
                data = bytes(b ^ mk[i % 4] for i, b in enumerate(data))
            if op == 0x9:
                self.sock.sendall(bytes([0x8A, 0x80]) + secrets.token_bytes(4))
                continue
            if op in (0xA,):
                continue
            if op == 0x8:
                raise RuntimeError('对端关闭')
            return json.loads(data.decode())

    def call(self, method: str, params: dict) -> dict:
        mid = self.send(method, params)
        while True:
            msg = self.recv()
            if msg.get('id') == mid:
                if msg.get('error'):
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get('result', {})


def wait_port(port: int, seconds: int = 20) -> dict:
    deadline = time.time() + seconds
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list', timeout=1) as r:
                for t in json.loads(r.read().decode()):
                    if t.get('type') == 'page' and 'splash.html' in t.get('url', ''):
                        return t
        except Exception:
            pass
        time.sleep(0.2)
    raise RuntimeError('没等到页面 target')


def metrics(ws: WS) -> dict:
    ws.call('Performance.enable', {})
    raw = ws.call('Performance.getMetrics', {})['metrics']
    return {m['name']: m['value'] for m in raw}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--port', type=int, default=9410)
    ap.add_argument('--throttle', type=float, default=1.0)
    args = ap.parse_args()

    if not os.path.exists(PAGE):
        sys.exit(f'找不到 {PAGE}')

    prof = os.path.join(tempfile.gettempdir(), f'wb-bench-{int(time.time())}')
    chrome = subprocess.Popen([
        CHROME, '--headless=new', f'--remote-debugging-port={args.port}',
        f'--user-data-dir={prof}', '--no-first-run', '--no-default-browser-check',
        '--window-size=1600,900', '--hide-scrollbars', '--force-device-scale-factor=1',
        '--disable-extensions', 'file:///' + PAGE.replace('\\', '/'),
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        target = wait_port(args.port)
        ws = WS(target['webSocketDebuggerUrl'])
        ws.call('Page.enable', {})
        ws.call('Runtime.enable', {})
        if args.throttle > 1:
            ws.call('Emulation.setCPUThrottlingRate', {'rate': args.throttle})

        # 重新加载，让采样器与动画同帧开始
        ws.call('Page.reload', {'ignoreCache': True})
        time.sleep(0.35)

        m0 = metrics(ws)
        ws.call('Runtime.evaluate', {
            'expression': 'window.__benchT0 = performance.now(); 1',
            'returnByValue': True,
        })
        res = ws.call('Runtime.evaluate', {
            'expression': SAMPLER, 'awaitPromise': True, 'returnByValue': True,
        })
        value = res['result'].get('value')
        m1 = metrics(ws)

        if not value:
            sys.exit(f'采样失败: {res}')
        stats = json.loads(value)
        delta = {
            '样式重算 ms': round((m1.get('RecalcStyleDuration', 0) - m0.get('RecalcStyleDuration', 0)) * 1000, 1),
            '布局 ms': round((m1.get('LayoutDuration', 0) - m0.get('LayoutDuration', 0)) * 1000, 1),
            '脚本 ms': round((m1.get('ScriptDuration', 0) - m0.get('ScriptDuration', 0)) * 1000, 1),
        }

        print(json.dumps({'throttle': args.throttle, **stats, **delta}, ensure_ascii=False))
        return 0
    finally:
        chrome.terminate()
        try:
            chrome.wait(timeout=5)
        except Exception:
            chrome.kill()


if __name__ == '__main__':
    sys.exit(main())
