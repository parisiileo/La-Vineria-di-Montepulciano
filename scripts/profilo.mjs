// Controlli di profilazione del §4 che si possono eseguire invece di guardare.
//
// Quello che uno script può verificare: ascoltatori di scroll non passivi,
// `will-change` statici, quanti `backdrop-filter` sono attivi insieme nei tre
// stati della pagina. Quello che resta all'occhio e al profiler del browser —
// il conteggio dei layer compositi — è dichiarato in DESIGN_NOTES §11.5.

import { chromium } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3111/it/composizione";
let falliti = 0;
const riga = (ok, testo, extra = "") => {
  if (!ok) falliti++;
  console.log(`${ok ? "  ok  " : "  FAIL"} ${testo}${extra ? " — " + extra : ""}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const cdp = await page.context().newCDPSession(page);
await cdp.send("DOM.enable");
await cdp.send("Runtime.enable");
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

// --- ascoltatori non passivi che contano davvero
//
// Su `scroll` il flag `passive` non ha alcun effetto: l'evento non è
// annullabile, quindi il browser non deve mai attendere il gestore. Contano
// `wheel`, `touchstart` e `touchmove`, dove un gestore non passivo obbliga il
// compositore ad aspettare prima di poter scorrere.
//
// Lenis ne ha bisogno di tre — è il modo in cui sostituisce lo scroll nativo —
// e sono l'unico prezzo accettato. Uno in più significa che qualcun altro sta
// bloccando il compositore.
const LENIS_AMMESSI = 3;
const bersagli = ["window", "document"];
const bloccanti = [];
const informativi = [];
for (const espr of bersagli) {
  const { result } = await cdp.send("Runtime.evaluate", { expression: espr });
  const { listeners } = await cdp.send("DOMDebugger.getEventListeners", { objectId: result.objectId });
  for (const l of listeners) {
    if (l.passive) continue;
    if (["wheel", "touchstart", "touchmove"].includes(l.type)) bloccanti.push(`${espr}.${l.type}`);
    else if (l.type === "scroll") informativi.push(`${espr}.${l.type}`);
  }
}
riga(
  bloccanti.length <= LENIS_AMMESSI,
  "nessun ascoltatore bloccante oltre a quelli di Lenis",
  `${bloccanti.length} non passivi su wheel/touch (${bloccanti.join(", ") || "nessuno"}), ` +
    `più ${informativi.length} su scroll dove il flag è ininfluente`,
);

// --- will-change statici
const willChange = await page.evaluate(() =>
  [...document.querySelectorAll("*")].filter((el) => {
    const w = getComputedStyle(el).willChange;
    return w && w !== "auto";
  }).map((el) => el.tagName.toLowerCase() + "." + (el.className || "").toString().slice(0, 40)),
);
riga(willChange.length <= 4, "will-change sotto controllo",
  willChange.length ? `${willChange.length} elementi (li mette GSAP durante il tween)` : "nessuno");

// --- backdrop-filter attivi nei tre stati
const conta = () => page.evaluate(() =>
  [...document.querySelectorAll("*")].filter((e) => getComputedStyle(e).backdropFilter !== "none").length);
const aRiposo = await conta();
await page.evaluate(() => window.scrollTo(0, 400));
await page.waitForTimeout(500);
// La barra si nasconde scorrendo in giù: la si fa riapparire con un gesto
// verso l'alto, altrimenti il pulsante del menu è fuori dal viewport.
await cdp.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: 720, y: 450, deltaX: 0, deltaY: -120 });
await page.waitForTimeout(800);
const conBarra = await conta();
await page.click("[data-navbar] button[aria-expanded]");
await page.waitForTimeout(1500);
const conMenu = await conta();
const massimo = Math.max(aRiposo, conBarra, conMenu);
riga(massimo <= 2, "non più di due backdrop-filter insieme",
  `riposo ${aRiposo}, barra ${conBarra}, menu ${conMenu}`);

// --- letture di layout dentro il ciclo di animazione
// Si strumenta getBoundingClientRect e si conta quante volte viene chiamata
// durante dodici secondi di scroll: dentro un rAF loop il numero esploderebbe.
await page.keyboard.press("Escape");
await page.waitForTimeout(600);
await page.evaluate(() => {
  window.__letture = 0;
  const orig = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function (...a) {
    window.__letture++;
    return orig.apply(this, a);
  };
});
for (let i = 0; i < 60; i++) {
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseWheel", x: 720, y: 450, deltaX: 0, deltaY: 150 });
  await page.waitForTimeout(30);
}
const letture = await page.evaluate(() => window.__letture);
// Soglia: ScrollTrigger rimisura ai refresh e agli ingressi, non a ogni frame.
// Sopra un migliaio in due secondi di scroll qualcuno sta misurando nel loop.
riga(letture < 1000, "nessuna lettura di layout nel ciclo di animazione",
  `${letture} chiamate a getBoundingClientRect in ~2s di scroll`);

await browser.close();
console.log(falliti ? `\n${falliti} controlli falliti` : "\nTutti i controlli superati");
process.exit(falliti ? 1 : 0);
