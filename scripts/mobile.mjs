// Verifica mobile: niente Lenis, niente pin, niente cursore, ritardi dimezzati.
// Il contesto emula un dispositivo vero (puntatore grosso e touch), perché
// tutte e quattro le condizioni si decidono su `(pointer: coarse|fine)`.

import { chromium, devices } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3111/it/composizione";
const browser = await chromium.launch();
const page = await browser.newPage({ ...devices["iPhone 13"] });
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const r = await page.evaluate(() => ({
  puntatoreGrosso: matchMedia("(pointer: coarse)").matches,
  // Lenis marca la radice quando è attivo.
  lenis: document.documentElement.className.includes("lenis"),
  pin: getComputedStyle(document.querySelector(".discesa-palco")).position,
  corsaAuto: getComputedStyle(document.querySelector(".discesa-corsa")).height,
  cursore: !!document.querySelector(".mix-blend-difference"),
  largh: document.documentElement.scrollWidth,
  viewport: document.documentElement.clientWidth,
  altezza: document.body.scrollHeight,
  inserto: !!document.querySelector("figure img[alt*='archivio'], figure img[alt*='Archive']"),
}));

const riga = (ok, testo) => console.log(`${ok ? "  ok  " : "  FAIL"} ${testo}`);
riga(r.puntatoreGrosso, `puntatore grosso rilevato`);
riga(!r.lenis, `Lenis non attivo (classe sulla radice: ${r.lenis})`);
riga(r.pin !== "sticky", `nessun pin (palco: ${r.pin})`);
riga(!r.cursore, `nessun cursore custom`);
riga(r.largh === r.viewport, `nessuno scorrimento orizzontale (${r.largh}/${r.viewport})`);
riga(r.inserto, `l'inserto d'archivio è presente anche su mobile`);
console.log(`  ·     altezza documento ${r.altezza}px, corsa della discesa ${r.corsaAuto}`);
await page.screenshot({ path: "artifacts/step-03/mobile.png", fullPage: true });
await browser.close();
