// Profilazione degli fps sotto rallentamento della CPU.
//
// Non misura «quanto è fluido a occhio»: dispatcha eventi di rotella reali via
// CDP — quindi passa da Lenis, non da `window.scrollTo` che lo scavalcherebbe —
// e raccoglie i tempi di ogni frame dentro la pagina. Il numero che conta non
// è la media, che una manciata di frame buoni gonfia, ma il 95° percentile del
// tempo di frame e quanti frame hanno superato i 33ms.

import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3111/it/composizione";
const RALLENTAMENTO = Number(process.argv[3] ?? 4);
const SECONDI = 12;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const cdp = await page.context().newCDPSession(page);

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

await cdp.send("Emulation.setCPUThrottlingRate", { rate: RALLENTAMENTO });

await page.evaluate(() => {
  window.__frames = [];
  let precedente = performance.now();
  const passo = (t) => {
    window.__frames.push(t - precedente);
    precedente = t;
    window.__raf = requestAnimationFrame(passo);
  };
  window.__raf = requestAnimationFrame(passo);
});

// Rotella verso il basso per metà del tempo, poi verso l'alto.
const passi = SECONDI * 10;
for (let i = 0; i < passi; i++) {
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseWheel",
    x: 720,
    y: 450,
    deltaX: 0,
    deltaY: i < passi / 2 ? 140 : -140,
  });
  await page.waitForTimeout(100);
}

const frames = await page.evaluate(() => {
  cancelAnimationFrame(window.__raf);
  return window.__frames;
});
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
await browser.close();

// I primi frame comprendono l'avvio del rallentamento: si scartano.
const f = frames.slice(10).filter((x) => x > 0 && x < 2000);
f.sort((a, b) => a - b);
const q = (t) => f[Math.min(f.length - 1, Math.floor(t * f.length))];
const media = f.reduce((a, b) => a + b, 0) / f.length;
const oltre = (ms) => (100 * f.filter((x) => x > ms).length) / f.length;

console.log(`CPU rallentata ${RALLENTAMENTO}×, ${f.length} frame su ${SECONDI}s di rotella`);
console.log(`  fps medi          ${(1000 / media).toFixed(1)}`);
console.log(`  fps al 95° perc.  ${(1000 / q(0.95)).toFixed(1)}  (frame ${q(0.95).toFixed(1)}ms)`);
console.log(`  frame > 16.7ms    ${oltre(16.7).toFixed(1)}%`);
console.log(`  frame > 33ms      ${oltre(33).toFixed(1)}%  ← saltati`);
console.log(oltre(33) > 5 ? "  ESITO: sotto soglia, semplificare" : "  ESITO: fluido");
