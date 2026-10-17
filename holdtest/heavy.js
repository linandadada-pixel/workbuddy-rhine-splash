// fake heavy module
const t0 = performance.now();
while (performance.now() - t0 < 800) { } // 800ms synchronous block
window.__heavyDone = performance.now();
