// Baseline dello Step 05: i numeri prima di toccare qualsiasi cosa.
//
// Misura quattro cose che Lighthouse non dà, o non dà nella forma utile:
//
//   1. peso trasferito su mobile, per tipo di risorsa
//   2. copertura: quanto del JS e del CSS scaricato viene davvero eseguito
//   3. fps su 10 secondi di scroll continuo con Slow 4G + CPU 4×
//   4. quale variante di ogni immagine il browser scarica DAVVERO su mobile
//
// Il punto 4 è quello che smaschera i `sizes` sbagliati: un `sizes` scritto
// male non produce nessun errore, produce solo il download della variante
// desktop su un telefono.

import { chromium, devices } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const URL = process.argv[2] ?? "http://localhost:3111/it";
const ETICHETTA = process.argv[3] ?? "base";
const OUT = "artifacts/step-05";
mkdirSync(OUT, { recursive: true });

const iPhone = devices["iPhone 13"];
const browser = await chromium.launch();
const context = await browser.newContext({ ...iPhone });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);

// Slow 4G come lo definisce Lighthouse, più CPU 4×.
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
});
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

// Peso TRASFERITO, non peso decompresso.
//
// `content-length` manca su molte risposte e `response.body()` restituisce il
// corpo già decompresso: sommarlo dà un numero che non è mai passato sulla
// rete. `Network.loadingFinished` porta `encodedDataLength`, che è il byte
// count reale del filo — l'unico confrontabile con un budget.
const trasferito = new Map();
const tipoPerRichiesta = new Map();
cdp.on("Network.responseReceived", (e) => tipoPerRichiesta.set(e.requestId, e.type));
cdp.on("Network.loadingFinished", (e) => {
  trasferito.set(e.requestId, e.encodedDataLength);
});

// La copertura passa dall'API di Playwright e non dal protocollo grezzo.
// Il formato di `Profiler.takePreciseCoverage` è annidato e quello di
// `CSS.takeCoverageDelta` è cumulativo: entrambi vanno de-annidati e
// deduplicati a mano, ed entrambe le volte che l'ho fatto a mano il risultato
// era sbagliato in modo vistoso — 100% di JS coperto, 16791% di CSS usato.
// Playwright restituisce il testo di ogni risorsa con gli intervalli usati
// già ridotti, che è la forma in cui la domanda ha una risposta sola.
await page.coverage.startJSCoverage({ resetOnNavigation: false });
await page.coverage.startCSSCoverage({ resetOnNavigation: false });

const t0 = Date.now();
await page.goto(URL, { waitUntil: "load", timeout: 120000 });
const tLoad = Date.now() - t0;
await page.waitForTimeout(3000);

// --- 10 secondi di scroll continuo, contando i frame
await page.evaluate(() => {
  window.__f = [];
  let p = performance.now();
  const passo = (t) => {
    window.__f.push(t - p);
    p = t;
    window.__r = requestAnimationFrame(passo);
  };
  window.__r = requestAnimationFrame(passo);
});
const fine = Date.now() + 10000;
let giu = true;
while (Date.now() < fine) {
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseWheel",
    x: 180,
    y: 420,
    deltaX: 0,
    deltaY: giu ? 220 : -220,
  });
  const y = await page.evaluate(() => window.scrollY);
  const h = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
  if (y >= h - 40) giu = false;
  if (y <= 40) giu = true;
  await page.waitForTimeout(24);
}
const frames = await page.evaluate(() => {
  cancelAnimationFrame(window.__r);
  return window.__f.slice(5);
});

// Le immagini si leggono DOPO la corsa: prima della prima discesa quelle
// sotto la piega non hanno ancora un `currentSrc`, e la misura racconterebbe
// solo l'hero.
const immagini = await page.evaluate(() =>
  [...document.querySelectorAll("img")].map((img) => ({
    scaricata: img.currentSrc,
    larghezzaCss: Math.round(img.getBoundingClientRect().width),
    dpr: window.devicePixelRatio,
    sizes: img.getAttribute("sizes") ?? "",
    alt: (img.getAttribute("alt") ?? "").slice(0, 40),
  })),
);

// --- copertura
const jsCov = await page.coverage.stopJSCoverage();
const cssCov = await page.coverage.stopCSSCoverage();

const somma = (voci) => {
  let usati = 0;
  let totale = 0;
  for (const v of voci) {
    // Alcune voci arrivano senza testo — script inline, fogli generati:
    // senza il testo non c'è un totale da confrontare, e vanno saltate.
    if (!v.url || !v.url.startsWith("http") || typeof v.text !== "string") continue;
    totale += v.text.length;
    for (const r of v.ranges) usati += r.end - r.start;
  }
  return { usati, totale };
};

/**
 * Copertura JS, con la maschera per byte.
 *
 * Playwright restituisce il CSS già ridotto (`text` + `ranges`), ma per il JS
 * passa il formato grezzo di V8: `source` più funzioni ANNIDATE, dove un
 * intervallo con `count: 0` è un buco DENTRO un intervallo esterno che può
 * essere stato eseguito. Sommare le lunghezze conta due volte; sommare i
 * massimi dichiara il 100% su qualunque file.
 *
 * Qui si parte dal file intero non usato, si marcano usati gli intervalli con
 * `count > 0` e si ri-marcano non usati i buchi interni. L'ordine — dal più
 * largo al più stretto — è tutto.
 */
function coperturaJs(entry) {
  const totale = entry.source?.length ?? 0;
  if (!totale) return { usati: 0, totale: 0 };
  const usato = new Uint8Array(totale);
  const intervalli = (entry.functions ?? [])
    .flatMap((f) => f.ranges)
    .sort((a, b) => b.endOffset - b.startOffset - (a.endOffset - a.startOffset));
  for (const r of intervalli) {
    usato.fill(r.count > 0 ? 1 : 0, r.startOffset, Math.min(r.endOffset, totale));
  }
  let usati = 0;
  for (let i = 0; i < totale; i++) usati += usato[i];
  return { usati, totale };
}

const jsFile = jsCov
  .filter((v) => v.url && v.url.includes("/_next/"))
  .map((v) => ({ url: v.url, ...coperturaJs(v) }));
const jsTotali = jsFile.reduce(
  (a, v) => ({ usati: a.usati + v.usati, totale: a.totale + v.totale }),
  { usati: 0, totale: 0 },
);
const cssTotali = somma(cssCov);
const cssUsato = cssTotali.usati;
const cssTot = cssTotali.totale;
const jsPerFile = new Map(jsFile.map((v) => [v.url, { usati: v.usati, totale: v.totale }]));

const perTipo = {};
for (const [id, bytes] of trasferito) {
  const tipo = tipoPerRichiesta.get(id) ?? "altro";
  perTipo[tipo] = (perTipo[tipo] ?? 0) + bytes;
}
const totale = Object.values(perTipo).reduce((a, b) => a + b, 0);

const kb = (n) => (n / 1024).toFixed(1) + " kB";
const media = frames.reduce((a, b) => a + b, 0) / frames.length;
const saltati = frames.filter((x) => x > 33).length;

const rapporto = {
  etichetta: ETICHETTA,
  url: URL,
  loadMs: tLoad,
  peso: { totale, perTipo },
  fps: {
    frame: frames.length,
    medi: Number((1000 / media).toFixed(1)),
    peggiore: Math.round(Math.max(...frames)),
    saltatiPct: Number(((100 * saltati) / frames.length).toFixed(1)),
  },
  css: { usato: cssUsato, totale: cssTot },
  js: [...jsPerFile.entries()].map(([url, v]) => ({ file: url.split("/").pop(), ...v })),
  immagini,
};
writeFileSync(`${OUT}/baseline-${ETICHETTA}.json`, JSON.stringify(rapporto, null, 2));

console.log(`\n=== ${ETICHETTA} · ${URL} · iPhone 13 · Slow 4G · CPU 4× ===`);
console.log(`load                 ${tLoad} ms`);
console.log(`peso trasferito      ${kb(totale)}`);
for (const [t, b] of Object.entries(perTipo).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t.padEnd(16)} ${kb(b)}`);
}
console.log(`\nfps su 10s di scroll ${rapporto.fps.medi} medi, peggiore ${rapporto.fps.peggiore} ms, ${rapporto.fps.saltatiPct}% oltre 33ms`);
console.log(`CSS usato            ${kb(cssUsato)} su ${kb(cssTot)} (${((100 * cssUsato) / cssTot).toFixed(0)}%)`);

console.log(
  `JS eseguito          ${kb(jsTotali.usati)} su ${kb(jsTotali.totale)} (${((100 * jsTotali.usati) / jsTotali.totale).toFixed(0)}%)`,
);
console.log("  i cinque file con più byte mai eseguiti:");
for (const f of [...jsPerFile.entries()]
  .map(([u, v]) => ({ file: u.split("/").pop(), sprecati: v.totale - v.usati, ...v }))
  .sort((a, b) => b.sprecati - a.sprecati)
  .slice(0, 5)) {
  console.log(`    ${kb(f.sprecati).padStart(9)} non usati su ${kb(f.totale).padStart(9)}  ${f.file}`);
}

console.log("\nimmagini scaricate su 390px:");
for (const i of immagini) {
  const w = /[?&]w=(\d+)/.exec(i.scaricata)?.[1] ?? "?";
  // Il confronto giusto è coi pixel FISICI dello slot, non con quelli CSS:
  // su un iPhone il rapporto è 3, e una variante da 1200px per uno slot da
  // 390 CSS px è esattamente quella corretta, non uno spreco.
  const necessari = i.larghezzaCss * i.dpr;
  const eccesso = Number(w) > necessari * 1.35 ? `  ← ${Math.round(Number(w) / necessari)}× il necessario` : "";
  console.log(
    `  w=${String(w).padStart(4)}  slot ${String(i.larghezzaCss).padStart(3)}px ×${i.dpr} = ${String(Math.round(necessari)).padStart(4)}px  ${i.alt}${eccesso}`,
  );
}

await browser.close();
