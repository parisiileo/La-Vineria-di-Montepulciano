// Cattura di verifica dello Step 02 (§7). Genera, per ciascuna delle quattro
// prove, uno scatto per sezione a 1440px più la pagina intera:
//
//   normale        il ritmo denso/rarefatto
//   sfocata        emerge un solo protagonista per sezione?
//   grigi          la composizione regge senza il colore?
//   senza-immagini la pagina è ancora leggibile se le foto arrivano peggiori?
//
// Il movimento è revocato di proposito: si valuta la composizione statica,
// che è quella che il visitatore vede quando smette di scorrere.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const URL = process.argv[2] ?? "http://localhost:3111/it/composizione";
const OUT = "artifacts/step-02";

const PROVE = {
  normale: "",
  sfocata: "html { filter: blur(7px); }",
  grigi: "html { filter: grayscale(1); }",
  "senza-immagini": "img { visibility: hidden !important; }",
};

const browser = await chromium.launch();
for (const [prova, css] of Object.entries(PROVE)) {
  mkdirSync(`${OUT}/${prova}`, { recursive: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
  });
  await page.goto(URL, { waitUntil: "networkidle" });
  // Scorre l'intera pagina: senza, le immagini sotto la piega non caricano.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle");
  if (css) await page.addStyleTag({ content: css });

  const sezioni = await page.locator("main > *").all();
  let i = 0;
  for (const sezione of sezioni) {
    const box = await sezione.boundingBox();
    if (!box || box.height < 24) continue;
    i++;
    const nome = (await sezione.getAttribute("id")) ?? (await sezione.evaluate((el) => el.tagName.toLowerCase()));
    await sezione.screenshot({ path: `${OUT}/${prova}/${String(i).padStart(2, "0")}-${nome}.png` });
  }
  await page.screenshot({ path: `${OUT}/${prova}/00-intera.png`, fullPage: true });
  console.log(prova, "→", i, "sezioni");
  await page.close();
}
await browser.close();
