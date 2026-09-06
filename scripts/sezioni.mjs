// Scatto per sezione, alle due larghezze e nelle due lingue.
// La barra fissa viene nascosta: qui si guarda la composizione della sezione,
// non ciò che le galleggia sopra.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3111";
const OUT = process.argv[3] ?? "artifacts/step-06/sezioni";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
for (const [lingua, larghezza] of [["it", 1440], ["it", 390], ["en", 1440]]) {
  const page = await browser.newPage({
    viewport: { width: larghezza, height: 900 },
    reducedMotion: "reduce",
  });
  await page.goto(`${BASE}/${lingua}`, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);
  await page.addStyleTag({
    content: "[data-navbar],[data-barra-mobile]{visibility:hidden!important}",
  });

  let i = 0;
  for (const nodo of await page.locator("main > *, body > footer").all()) {
    const box = await nodo.boundingBox();
    if (!box || box.height < 24) continue;
    i++;
    await nodo.screenshot({
      path: `${OUT}/${lingua}-${larghezza}-${String(i).padStart(2, "0")}.png`,
      scale: "css",
    });
  }
  await page.close();
}
await browser.close();
console.log("fatto");
