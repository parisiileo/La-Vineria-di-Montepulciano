// Gli stati che non si vedono scorrendo: la carta e la tenda del menu.
//
// Sono le due superfici dove il progetto rischia di più su telefono — un
// pannello che parte dal basso e una tenda che copre tutto — e sono anche le
// due che nessuno scatto di pagina intera mostra.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3111";
const OUT = "artifacts/step-06";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

for (const [nome, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
  await page.goto(`${BASE}/it`, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: /guarda la carta/i }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/carta-${nome}.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);

  // Aprire la carta ha portato la pagina alla sezione della cucina, e la
  // barra si nasconde scorrendo in giù: senza tornare in cima, il pulsante
  // del menu è fuori dal viewport e il clic non arriva.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(900);

  await page.locator("[data-navbar] button[aria-expanded]").click();
  // Il puntatore viene spostato lontano: fermo sul pulsante, l'attenuazione
  // dei fratelli resta accesa e lo scatto documenta uno stato di hover.
  await page.mouse.move(viewport.width / 2, viewport.height - 60);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/menu-${nome}.png` });

  await page.close();
}

await browser.close();
console.log("pannelli catturati in", OUT);
