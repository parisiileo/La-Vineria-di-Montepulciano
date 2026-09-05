// Verifica di leggibilità del testo sovrapposto alle fotografie.
//
// Il colore del testo viene risolto dal browser stesso su canvas: Tailwind
// esprime le opacità in `oklab()`, e leggerne le componenti come se fossero
// canali RGB dà numeri plausibili e completamente sbagliati. L'alfa viene poi
// composta sullo sfondo campionato, che è ciò che l'occhio vede davvero.
//
// Non stima: nasconde il testo, fotografa esattamente il suo riquadro con
// sotto la fotografia e i suoi strati, e calcola il contrasto WCAG fra il
// colore del testo e il pixel PEGGIORE del riquadro (95° percentile di
// luminanza per il testo chiaro). Se il caso peggiore passa, passa tutto.

import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3111/it/composizione";
const SOGLIA_GRANDE = 3.0; // WCAG AA, testo ≥ 24px o ≥ 18.66px bold
const SOGLIA_NORMALE = 4.5;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await page.goto(URL, { waitUntil: "networkidle" });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
  window.scrollTo(0, 0);
});
await page.waitForLoadState("networkidle");

// I riquadri dei testi che stanno sopra una fotografia.
const bersagli = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll("h1, h2, h3, p, span, a")) {
    if (!el.textContent?.trim() || el.children.length > 2) continue;
    const suFoto = el.closest("section")?.querySelector(".foto-lift");
    if (!suFoto) continue;
    const rf = suFoto.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    // solo se il testo si sovrappone davvero alla fotografia
    if (r.right < rf.left || r.left > rf.right || r.bottom < rf.top || r.top > rf.bottom) continue;
    const cs = getComputedStyle(el);
    out.push({
      decorativo: !!el.closest("[aria-hidden='true']") || el.getAttribute("aria-hidden") === "true",
      testo: el.textContent.trim().slice(0, 42),
      colore: cs.color,
      px: parseFloat(cs.fontSize),
      peso: cs.fontWeight,
      box: { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height },
    });
  }
  return out;
});

// Nasconde il testo lasciando fotografia e strati.
await page.addStyleTag({ content: "main :is(h1,h2,h3,p,span,a){color:transparent!important}" });

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const rapporto = (a, b) => { const [h, l] = [a, b].sort((x, y) => y - x); return (h + 0.05) / (l + 0.05); };

let peggiore = Infinity, falliti = 0;
console.log("contrasto  soglia  corpo  testo");
for (const t of bersagli) {
  // `fullPage` è necessario: senza, il ritaglio è limitato al viewport e i
  // testi sotto la piega fanno fallire la cattura invece della verifica.
  const shot = await page.screenshot({
    fullPage: true,
    clip: { x: t.box.x, y: t.box.y, width: Math.max(8, t.box.w), height: Math.max(8, t.box.h) },
  });
  const px = await page.evaluate(async (b64) => {
    const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = "data:image/png;base64," + b64; });
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0);
    return Array.from(ctx.getImageData(0, 0, c.width, c.height).data);
  }, shot.toString("base64"));

  const L = [];
  for (let i = 0; i < px.length; i += 4) L.push(lum(px[i], px[i + 1], px[i + 2]));
  L.sort((a, b) => a - b);
  const sfondoPeggiore = L[Math.floor(L.length * 0.95)];
  const [r, g, b, a] = await page.evaluate((colore) => {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    ctx.fillStyle = colore;
    ctx.fillRect(0, 0, 1, 1);
    return Array.from(ctx.getImageData(0, 0, 1, 1).data).map((v, i) => (i === 3 ? v / 255 : v));
  }, t.colore);

  // Il testo semitrasparente lascia passare lo sfondo: il colore efficace è
  // la composizione, non il colore dichiarato.
  const ordinati = [];
  for (let i = 0; i < px.length; i += 4) ordinati.push([px[i], px[i + 1], px[i + 2], lum(px[i], px[i + 1], px[i + 2])]);
  ordinati.sort((x, y) => x[3] - y[3]);
  const sf = ordinati[Math.floor(ordinati.length * 0.95)];
  const eff = [0, 1, 2].map((k) => [r, g, b][k] * a + sf[k] * (1 - a));
  const c = rapporto(lum(eff[0], eff[1], eff[2]), sfondoPeggiore);
  const soglia = t.px >= 24 || (t.px >= 18.66 && Number(t.peso) >= 700) ? SOGLIA_GRANDE : SOGLIA_NORMALE;
  // Il testo marcato aria-hidden è decorativo: non è soggetto al criterio
  // WCAG 1.4.3, perché non porta informazione. Viene comunque misurato e
  // riportato — un numero civico invisibile resta un difetto di composizione,
  // anche quando non è un difetto di accessibilità.
  const esito = t.decorativo ? "dec " : c >= soglia ? "ok  " : "FAIL";
  if (c < soglia && !t.decorativo) falliti++;
  peggiore = Math.min(peggiore, c / soglia);
  console.log(`${esito} ${c.toFixed(2).padStart(6)}  ${soglia.toFixed(1)}  ${String(Math.round(t.px)).padStart(4)}px  ${t.testo}`);
}
console.log(falliti ? `\n${falliti} testi sotto soglia` : `\nTutti i testi sopra soglia (${bersagli.length} verificati)`);
await browser.close();
process.exit(falliti ? 1 : 0);
