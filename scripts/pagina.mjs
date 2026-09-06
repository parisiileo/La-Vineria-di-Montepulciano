// Verifica dello Step 04: la pagina intera, alle due larghezze e nelle due
// lingue. È la prova che il brief chiede — 390px e 1440px, it ed en — e
// serve a vedere quattro cose che un solo scatto non mostra:
//
//   · il ritmo delle densità regge anche in inglese, dove ogni frase è più
//     corta e i blocchi si accorciano;
//   · il titolo dell'hero non rompe il layout tradotto;
//   · a 390px nulla deborda in orizzontale;
//   · la barra fissa mobile compare dopo l'hero e non prima.
//
// Il movimento è revocato: qui si guarda la composizione ferma. La fluidità
// ha già la sua suite (scripts/fluidita.mjs).

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3111";
const OUT = "artifacts/step-06";
const VIEWPORT = { largo: { width: 1440, height: 900 }, stretto: { width: 390, height: 844 } };
const LINGUE = ["it", "en"];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
let problemi = 0;

for (const lingua of LINGUE) {
  for (const [nome, viewport] of Object.entries(VIEWPORT)) {
    const page = await browser.newPage({ viewport, reducedMotion: "reduce", deviceScaleFactor: 1 });
    await page.goto(`${BASE}/${lingua}`, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    // Non `networkidle`: la mappa entra in campo durante lo scorrimento e le
    // sue tiles non smettono mai davvero di arrivare. Attendere l'inattività
    // di rete su questa pagina significa attendere per sempre.
    await page.waitForTimeout(1500);

    // Nessuno scorrimento orizzontale: è il difetto che si vede solo col
    // dito, e che a schermo largo non esiste.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 0) {
      problemi++;
      console.log(`  FAIL  ${lingua}/${nome}: ${overflow}px di scorrimento orizzontale`);
    } else {
      console.log(`  ok    ${lingua}/${nome}: nessun debordo orizzontale`);
    }

    // La barra fissa mobile: assente sopra l'hero, presente sotto.
    if (nome === "stretto") {
      const barra = page.locator("[data-barra-mobile]");
      const inCima = await barra.evaluate((el) => el.getBoundingClientRect().top);
      await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
      await page.waitForTimeout(700);
      const dopo = await barra.evaluate((el) => el.getBoundingClientRect().top);
      const ok = inCima >= window_h(viewport) && dopo < window_h(viewport);
      if (!ok) problemi++;
      console.log(
        `  ${ok ? "ok  " : "FAIL"}  ${lingua}: barra fissa fuori campo in cima (${Math.round(inCima)}), in campo dopo l'hero (${Math.round(dopo)})`,
      );
      await page.screenshot({ path: `${OUT}/${lingua}-barra.png` });
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);

    await page.screenshot({ path: `${OUT}/${lingua}-${nome}.png`, fullPage: true });

    // Una sezione per scatto: la pagina intera è alta diecimila pixel e a
    // quella scala non si giudica niente. La barra fissa viene nascosta —
    // altrimenti finisce dentro ogni scatto e copre la testata della sezione
    // che si sta guardando.
    mkdirSync(`${OUT}/sezioni`, { recursive: true });
    await page.addStyleTag({
      content: "[data-navbar],[data-barra-mobile]{display:none!important}",
    });
    const blocchi = await page.locator("main > *, body > footer").all();
    let i = 0;
    for (const blocco of blocchi) {
      const box = await blocco.boundingBox();
      if (!box || box.height < 24) continue;
      i++;
      await blocco.screenshot({
        path: `${OUT}/sezioni/${lingua}-${viewport.width}-${String(i).padStart(2, "0")}.png`,
        scale: "css",
      });
    }

    await page.close();
  }
}

function window_h(v) {
  return v.height - 1;
}

// --- l'hero con la barra di Safari aperta, e in orizzontale
//
// 745px è l'altezza utile reale di un iPhone 13 con la barra dell'indirizzo
// visibile: è la condizione in cui arriva la maggior parte dei visitatori, e
// non quella che il device toolbar mostra per default.
for (const [nome, viewport] of [
  ["safari-aperta", { width: 390, height: 745 }],
  ["orizzontale", { width: 844, height: 390 }],
]) {
  const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
  await page.goto(`${BASE}/it`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const esito = await page.evaluate(() => {
    const h = window.innerHeight;
    const dentro = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { visibile: r.bottom <= h && r.top >= 0, bottom: Math.round(r.bottom) };
    };
    const cta = [...document.querySelectorAll("#hero a")].filter((a) =>
      a.className.includes("min-h-"),
    );
    const primaCta = cta[0]?.getBoundingClientRect();
    return {
      viewport: h,
      hero: Math.round(document.querySelector("#hero").getBoundingClientRect().height),
      titolo: dentro("#hero h1"),
      sommario: dentro("#hero p"),
      primaCta: primaCta
        ? { visibile: primaCta.bottom <= h, bottom: Math.round(primaCta.bottom) }
        : null,
    };
  });
  // In orizzontale su telefono il criterio è diverso, e deve esserlo: a 390px
  // di altezza utile non esiste composizione in cui titolo, sommario e CTA
  // stiano insieme sopra la piega. Qui si chiede che l'hero NON sia forzato
  // all'altezza del viewport — cioè che si sia arreso all'altezza del proprio
  // contenuto — e che il titolo si legga senza scorrere.
  const ok =
    nome === "orizzontale"
      ? esito.titolo?.visibile && esito.hero > esito.viewport
      : esito.titolo?.visibile && esito.sommario?.visibile && esito.primaCta?.visibile;
  if (!ok) problemi++;
  console.log(
    `  ${ok ? "ok  " : "FAIL"}  ${nome} (${viewport.width}×${viewport.height}): hero ${esito.hero}px · titolo ${esito.titolo?.bottom} · sommario ${esito.sommario?.bottom} · prima CTA ${esito.primaCta?.bottom} su ${esito.viewport}`,
  );
  await page.screenshot({ path: `${OUT}/hero-${nome}.png` });
  await page.close();
}

await browser.close();
console.log(problemi ? `\n${problemi} problemi` : "\nTutte le prove superate");
process.exit(problemi ? 1 : 0);
