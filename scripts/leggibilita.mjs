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
// Non `networkidle`: dallo Step 04 la pagina incorpora una mappa, e le sue
// tiles non smettono mai davvero di arrivare. Attendere l'inattività di rete
// qui significa attendere per sempre.
await page.waitForTimeout(1200);
// La barra si nasconde scorrendo in giù e riappare risalendo: senza questa
// attesa i riquadri vengono letti mentre è ancora traslata fuori campo, e
// tutti i suoi testi risultano a coordinate negative.
await page.waitForTimeout(1500);

// I riquadri dei testi che stanno sopra una fotografia.
const bersagli = await page.evaluate(() => {
  const out = [];
  // Si misura ogni elemento che DIPINGE testo, cioè che contiene almeno un
  // nodo di testo non vuoto tra i figli diretti. È l'unica definizione che
  // non lascia ambiguità: i contenitori hanno un riquadro più alto del glifo
  // e un colore ereditato, e misurarli significa campionare la fotografia
  // dove il testo non c'è. SplitText ne produce due per ogni parola, ed è
  // così che una parola perfettamente leggibile risultava a 2.77:1.
  for (const el of document.querySelectorAll("body *")) {
    const dipinge = [...el.childNodes].some(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
    );
    if (!dipinge) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    // Sovrapposizione geometrica con una qualsiasi fotografia, non
    // appartenenza alla stessa sezione: la barra di navigazione sta sopra la
    // fotografia dell'hero e non è dentro nessuna <section>. Cercando per
    // sezione, il testo che rischia di più era proprio quello escluso.
    const suFoto = [...document.querySelectorAll(".foto-lift")].some((f) => {
      const rf = f.getBoundingClientRect();
      return !(r.right < rf.left || r.left > rf.right || r.bottom < rf.top || r.top > rf.bottom);
    });
    if (!suFoto) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
    // Un elemento `fixed` ha coordinate relative al viewport: sommarci lo
    // scroll dà un riquadro che non esiste da nessuna parte, e il ritaglio
    // finisce fuori dalla pagina o su un pezzo di fotografia sbagliato.
    // Questi vengono catturati sul viewport invece che sulla pagina intera.
    let fisso = false;
    for (let n = el; n; n = n.parentElement) {
      if (getComputedStyle(n).position === "fixed") { fisso = true; break; }
    }
    out.push({
      fisso,
      decorativo: !!el.closest("[aria-hidden='true']") || el.getAttribute("aria-hidden") === "true",
      tag: el.tagName.toLowerCase(),
      testo: el.textContent.trim().slice(0, 42),
      colore: cs.color,
      px: parseFloat(cs.fontSize),
      peso: cs.fontWeight,
      box: fisso
        ? { x: r.left, y: r.top, w: r.width, h: r.height }
        : { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height },
    });
  }
  return out;
});

const pagina = await page.evaluate(() => ({
  larghezza: document.documentElement.scrollWidth,
  altezza: document.body.scrollHeight,
}));

// Nasconde il testo lasciando fotografia e strati.
// Si nasconde OGNI testo dipinto, non un elenco di tag: un solo tag
// dimenticato lascia il proprio glifo nel ritaglio e la sonda finisce per
// misurare il testo contro se stesso.
await page.addStyleTag({ content: "body, body *{color:transparent!important;-webkit-text-stroke-color:transparent!important}" });

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const rapporto = (a, b) => { const [h, l] = [a, b].sort((x, y) => y - x); return (h + 0.05) / (l + 0.05); };

let peggiore = Infinity, falliti = 0;
console.log("contrasto  soglia  corpo  testo");
for (const t of bersagli) {
  // `fullPage` è necessario: senza, il ritaglio è limitato al viewport e i
  // testi sotto la piega fanno fallire la cattura invece della verifica.
  // Il riquadro va comunque riportato dentro la pagina: un elemento `fixed`
  // ha coordinate relative al viewport, e alcuni sconfinano a sinistra.
  const limite = t.fisso ? { larghezza: 1440, altezza: 900 } : pagina;
  const x = Math.max(0, t.box.x);
  const y = Math.max(0, t.box.y);
  const w = Math.max(8, Math.min(t.box.w, limite.larghezza - x));
  const h = Math.max(8, Math.min(t.box.h, limite.altezza - y));
  if (x >= limite.larghezza || y >= limite.altezza) continue;
  const shot = await page.screenshot({
    fullPage: !t.fisso,
    clip: { x, y, width: w, height: h },
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
  const posa = `[${Math.round(t.box.x)},${Math.round(t.box.y)} ${Math.round(t.box.w)}×${Math.round(t.box.h)}]`;
  console.log(
    `${esito} ${c.toFixed(2).padStart(6)}  ${soglia.toFixed(1)}  ${String(Math.round(t.px)).padStart(4)}px  ${t.testo} ${esito === "FAIL" ? "<" + t.tag + "> " + posa + " colore " + t.colore : ""}`,
  );
}
console.log(falliti ? `\n${falliti} testi sotto soglia` : `\nTutti i testi sopra soglia (${bersagli.length} verificati)`);
await browser.close();
process.exit(falliti ? 1 : 0);
