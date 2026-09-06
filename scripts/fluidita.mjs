// IL TEST DELLA FLUIDITÀ (§5). Sei prove, eseguite e non stimate.
//
// Il metodo è sempre lo stesso: si registra un'impronta dello stato animato
// della pagina a una data posizione di scroll — trasformazioni, opacità,
// maschere, geometria — e la si confronta con la stessa impronta dopo aver
// maltrattato la pagina. Se i numeri coincidono, niente è diventato stale.
//
// È la prova 2 a rompere la maggior parte dei siti guidati dallo scroll, ed è
// anche la sola che un occhio umano sbaglia a giudicare: uno scarto di venti
// pixel su una sezione pinnata si vede solo se si sa già dove guardare.

import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3111/it/composizione";
const VIEWPORT = { width: 1440, height: 900 };

let falliti = 0;
const esito = (ok, titolo, dettaglio = "") => {
  if (!ok) falliti++;
  console.log(`${ok ? "  ok  " : "  FAIL"} ${titolo}${dettaglio ? " — " + dettaglio : ""}`);
};

/** Prima differenza fra due impronte, per capire cosa si è spostato. */
const differenza = (a, b) => {
  const A = JSON.parse(a), B = JSON.parse(b);
  for (const k of Object.keys(A)) {
    const x = JSON.stringify(A[k]), y = JSON.stringify(B[k]);
    if (x !== y) return `${k}: atteso ${x.slice(0, 150)} — trovato ${y.slice(0, 150)}`;
  }
  return "identiche";
};

/**
 * Impronta dello stato animato.
 *
 * `conMaschere` esiste perché le maschere di ingresso delle fotografie
 * dipendono legittimamente dal PERCORSO fatto, non solo dalla posizione:
 * un'immagine scavalcata con un salto secco non è ancora entrata, e non deve
 * esserlo. Confrontarle fra due visite con storie diverse misurerebbe la
 * storia, non la tenuta della pagina. Le prove che riguardano le misure —
 * ridimensionamento e cambio lingua — usano quindi il sottoinsieme
 * invariante, e il recupero delle immagini scavalcate ha una prova sua.
 */
const IMPRONTA = (conMaschere = true) => {
  const arrotonda = (v) => Math.round(Number(v) * 1000) / 1000;
  const nodi = [...document.querySelectorAll("[data-discesa]")].map((el) => {
    const cs = getComputedStyle(el);
    return `${el.dataset.discesa}:${cs.transform}|${arrotonda(cs.opacity)}`;
  });
  const maschere = [...document.querySelectorAll("main [style*='clip-path'], main .overflow-hidden")]
    .map((el) => getComputedStyle(el).clipPath)
    .filter((c) => c !== "none");
  const corsa = document.querySelector(".discesa-corsa")?.getBoundingClientRect();
  return JSON.stringify({
    // La posizione di scroll fa parte dell'impronta: due campioni presi a
    // quote diverse non sono confrontabili, e senza questo campo la
    // differenza si manifesterebbe come un falso difetto della pagina.
    y: Math.round(window.scrollY),
    nodi,
    maschere: conMaschere ? maschere : null,
    corsa: corsa ? { t: Math.round(corsa.top), h: Math.round(corsa.height) } : null,
    altezza: document.body.scrollHeight,
    largh: document.documentElement.scrollWidth,
  });
};

/**
 * Attende che lo scroll sia fermo.
 *
 * Serve PRIMA di ogni posizionamento a colpo secco, e il motivo è il modo in
 * cui Lenis riconcilia uno scroll che non arriva da lui: sincronizza la
 * propria posizione con quella del documento solo quando non sta già
 * animando. Chiamare `window.scrollTo` mentre Lenis è ancora in corsa
 * significa essere ignorati — Lenis prosegue verso il proprio bersaglio, e
 * l'impronta di riferimento viene presa a una quota che nessuno ha chiesto.
 *
 * Era il difetto della prova 4 e della 5: entrambe confrontavano la pagina
 * con un riferimento preso in fondo al documento invece che a metà discesa.
 * Non si vedeva sulla pagina di prova dello Step 02 solo perché era più alta
 * della corsa della prova 1, e Lenis faceva in tempo a fermarsi da solo.
 */
async function attendiQuiete(page, limiteMs = 4000) {
  const inizio = Date.now();
  let ultima = -1;
  let fermo = 0;
  while (Date.now() - inizio < limiteMs) {
    const y = await page.evaluate(() => Math.round(window.scrollY));
    fermo = y === ultima ? fermo + 1 : 0;
    if (fermo >= 3) return;
    ultima = y;
    await page.waitForTimeout(80);
  }
}

/** Porta lo scroll a `y` con la rotella (quindi passando per Lenis) o di
 *  colpo, e lascia allo scrub il tempo di raggiungere la posizione. */
async function vaiA(page, cdp, y, colpo = false) {
  if (colpo) {
    await attendiQuiete(page);
    await page.evaluate((y) => window.scrollTo(0, y), y);
  } else {
    const attuale = await page.evaluate(() => window.scrollY);
    const delta = y - attuale;
    const passi = Math.max(1, Math.ceil(Math.abs(delta) / 160));
    for (let i = 0; i < passi; i++) {
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mouseWheel", x: 720, y: 450, deltaX: 0, deltaY: Math.sign(delta) * 160,
      });
      await page.waitForTimeout(16);
    }
  }
  // Lo scrub ha un ritardo di 1s: senza attesa si misura il transitorio.
  await page.waitForTimeout(1800);
}

const browser = await chromium.launch();

// ------------------------------------------------------------------ 1..5
{
  const page = await browser.newPage({ viewport: VIEWPORT });
  const cdp = await page.context().newCDPSession(page);
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const geo = await page.evaluate(() => {
    const c = document.querySelector(".discesa-corsa").getBoundingClientRect();
    return { top: Math.round(c.top + scrollY), h: Math.round(c.height), doc: document.body.scrollHeight };
  });
  const meta = geo.top + Math.round((geo.h - VIEWPORT.height) / 2);

  // --- 1. discesa a velocità normale: nessun momento morto, nessuno scatto
  await page.evaluate(() => {
    window.__f = [];
    let p = performance.now();
    const passo = (t) => { window.__f.push(t - p); p = t; window.__r = requestAnimationFrame(passo); };
    window.__r = requestAnimationFrame(passo);
  });
  for (let i = 0; i < 90; i++) {
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: 720, y: 450, deltaX: 0, deltaY: 150 });
    await page.waitForTimeout(30);
  }
  const frames = await page.evaluate(() => { cancelAnimationFrame(window.__r); return window.__f.slice(5); });
  const peggiore = Math.max(...frames);
  const saltati = frames.filter((x) => x > 33).length;
  esito(peggiore < 120 && saltati / frames.length < 0.02,
    "1 · discesa a velocità normale",
    `frame peggiore ${peggiore.toFixed(0)}ms, ${((100 * saltati) / frames.length).toFixed(1)}% oltre 33ms`);

  // Impronta di riferimento a metà discesa, presa a pagina fresca. Il
  // posizionamento è a colpo secco come in tutti i confronti successivi: con
  // la rotella si arriva a una quota leggermente diversa a ogni giro, e il
  // confronto misurerebbe l'imprecisione del test invece della pagina.
  await vaiA(page, cdp, meta, true);
  const rifMisure = await page.evaluate(IMPRONTA, false);
  const cima = await (async () => { await vaiA(page, cdp, 0, true); return page.evaluate(IMPRONTA); })();

  // --- 2. giù veloce, poi ritorno in cima di colpo
  await vaiA(page, cdp, geo.doc, true);
  await vaiA(page, cdp, 0, true);
  const dopo = await page.evaluate(IMPRONTA);
  esito(dopo === cima, "2 · giù veloce e ritorno in cima di colpo",
    dopo === cima ? "stato identico" : "lo stato è cambiato");

  // --- 3. dieci giri: il decimo identico al primo
  let primoGiro = null;
  let ultimoGiro = null;
  for (let g = 0; g < 10; g++) {
    await page.evaluate((y) => window.scrollTo(0, y), geo.doc);
    await page.waitForTimeout(60);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(60);
    if (g === 0) { await page.waitForTimeout(1500); primoGiro = await page.evaluate(IMPRONTA); }
  }
  await page.waitForTimeout(1800);
  ultimoGiro = await page.evaluate(IMPRONTA);
  esito(primoGiro === ultimoGiro, "3 · dieci giri, il decimo come il primo",
    primoGiro === ultimoGiro ? "impronta stabile" : "deriva fra il primo e il decimo");

  // --- 4. ridimensionamento durante lo scroll
  await vaiA(page, cdp, meta, true);
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.waitForTimeout(400);
  await page.setViewportSize(VIEWPORT);
  await page.waitForTimeout(2000);
  const dopoResize = await page.evaluate(IMPRONTA, false);
  esito(dopoResize === rifMisure, "4 · ridimensionamento durante lo scroll",
    dopoResize === rifMisure ? "tutto riallineato" : differenza(rifMisure, dopoResize));

  // --- 5. cambio lingua a metà pagina e ritorno
  await vaiA(page, cdp, meta, true);
  await page.goto(URL.replace("/it/", "/en/"), { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await vaiA(page, cdp, meta, true);
  const dopoLingua = await page.evaluate(IMPRONTA, false);
  esito(dopoLingua === rifMisure, "5 · cambio lingua a metà pagina e ritorno",
    dopoLingua === rifMisure ? "stato ricostruito uguale" : differenza(rifMisure, dopoLingua));

  // --- 5b. le immagini scavalcate con un salto si recuperano risalendo
  const mascherate = async () =>
    page.evaluate(() =>
      [...document.querySelectorAll("main .overflow-hidden")].filter((el) =>
        getComputedStyle(el).clipPath.includes("100%"),
      ).length,
    );
  const saltate = await mascherate();
  await vaiA(page, cdp, 0, true);
  // Si attraversa TUTTO il documento: una risalita parziale lascerebbe
  // mascherato ciò che sta oltre, e il test misurerebbe la propria corsa.
  const passiInteri = Math.ceil((geo.doc / 200) * 1.3);
  for (let i = 0; i < passiInteri; i++) {
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: 720, y: 450, deltaX: 0, deltaY: 200 });
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(1800);
  const recuperate = saltate - (await mascherate());
  esito(
    saltate === 0 || recuperate === saltate,
    "5b · le immagini scavalcate con un salto entrano risalendo",
    `${saltate} scavalcate, ${recuperate} recuperate`,
  );

  await page.close();
}

// --------------------------------------------------------------------- 6
{
  const page = await browser.newPage({ viewport: VIEWPORT, reducedMotion: "reduce" });
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const nascosti = [...document.querySelectorAll("main *")].filter((el) => {
      const cs = getComputedStyle(el);
      return (
        el.textContent?.trim() &&
        el.children.length === 0 &&
        (Number(cs.opacity) < 0.05 || cs.visibility === "hidden" || cs.clipPath.includes("100%"))
      );
    }).length;
    const palco = document.querySelector(".discesa-palco");
    return {
      nascosti,
      pin: palco ? getComputedStyle(palco).position : "-",
      motion: document.documentElement.getAttribute("data-motion"),
      altezza: document.body.scrollHeight,
      largh: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    };
  });
  esito(r.nascosti === 0, "6a · movimento ridotto: nessun testo nascosto", `${r.nascosti} nodi invisibili`);
  esito(r.pin !== "sticky", "6b · movimento ridotto: nessun pin", `posizione del palco: ${r.pin}`);
  esito(r.motion === null, "6c · movimento ridotto: permesso revocato", `data-motion=${r.motion}`);
  esito(r.largh === r.viewport, "6d · movimento ridotto: nessuno scorrimento orizzontale");
  await page.close();
}

await browser.close();
console.log(falliti ? `\n${falliti} prove fallite` : "\nTutte le prove superate");
process.exit(falliti ? 1 : 0);
