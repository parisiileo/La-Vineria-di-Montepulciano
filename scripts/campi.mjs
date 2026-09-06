// Verifica dei controlli di modulo.
//
// Non esiste un modo automatico di dire «questo campo è vestito bene», ma
// esiste un modo di dire «questo campo NON è nativo»: nessun `type` che porti
// con sé un pannello di sistema, nessuna freccia del numero, nessuna maniglia
// di ridimensionamento. Questo script controlla quello, poi fotografa i tre
// pannelli aperti perché il resto lo deve guardare un occhio.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3111";
const OUT = "artifacts/step-06/campi";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
let problemi = 0;
const esito = (ok, testo) => {
  if (!ok) problemi++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${testo}`);
};

for (const [nome, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
  await page.goto(`${BASE}/it`, { waitUntil: "networkidle" });
  await page.locator("#prenota").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  const nativi = await page.evaluate(() => {
    const dentro = document.querySelector("#prenota");
    const brutti = [...dentro.querySelectorAll("input")]
      .map((i) => i.type)
      .filter((t) => ["date", "time", "datetime-local", "month", "week", "number", "color", "range"].includes(t));
    const resize = [...dentro.querySelectorAll("textarea")].map(
      (t) => getComputedStyle(t).resize,
    );
    // 16px esatti: sotto questa soglia iOS zooma al focus.
    const corpi = [...dentro.querySelectorAll("input, textarea, [role='option'], [role='gridcell']")]
      .map((e) => parseFloat(getComputedStyle(e).fontSize))
      .filter((n) => n > 0);
    return { brutti, resize, minCorpo: Math.min(...corpi) };
  });

  esito(nativi.brutti.length === 0, `${nome}: nessun controllo nativo con pannello di sistema${nativi.brutti.length ? " — trovati: " + nativi.brutti.join(", ") : ""}`);
  esito(nativi.resize.every((r) => r === "none"), `${nome}: nessuna maniglia di ridimensionamento (${nativi.resize.join(", ") || "nessun textarea"})`);
  esito(nativi.minCorpo >= 16, `${nome}: nessun campo sotto i 16px (minimo ${nativi.minCorpo}px)`);

  // Il calendario
  await page.getByRole("button", { name: /apri il calendario/i }).click();
  await page.waitForTimeout(400);
  const celle = await page.locator('[role="gridcell"]').count();
  esito(celle === 42, `${nome}: la griglia del calendario ha 42 celle (${celle})`);
  await page.screenshot({ path: `${OUT}/calendario-${nome}.png` });
  await page.keyboard.press("Escape");

  // L'orario
  await page.getByRole("button", { name: /scegli l'orario/i }).click();
  await page.waitForTimeout(400);
  const opzioni = await page.locator('[role="option"]').count();
  esito(opzioni === 24 + 12, `${nome}: 24 ore e 12 quarti di cinque minuti (${opzioni})`);
  // Il pannello non deve finire sotto la barra fissa mobile: se sotto non
  // c'è spazio, si apre verso l'alto.
  const dentro = await page.evaluate(() => {
    const p = document.querySelector('[role="option"]')?.closest("div")?.parentElement;
    if (!p) return null;
    const r = p.getBoundingClientRect();
    const barra = document.querySelector("[data-barra-mobile]");
    const limite = barra && getComputedStyle(barra).display !== "none"
      ? barra.getBoundingClientRect().top
      : window.innerHeight;
    return { bottom: Math.round(r.bottom), limite: Math.round(limite) };
  });
  esito(
    !dentro || dentro.bottom <= dentro.limite + 1,
    `${nome}: il pannello dell'orario non finisce sotto la barra fissa (${dentro?.bottom} su ${dentro?.limite})`,
  );
  await page.screenshot({ path: `${OUT}/orario-${nome}.png` });
  await page.keyboard.press("Escape");

  // Il contatore
  const prima = await page.locator('input[name="ospiti"], [aria-label="Ospiti"]').first().inputValue();
  await page.getByRole("button", { name: /un ospite in più/i }).click();
  await page.waitForTimeout(200);
  const dopo = await page.locator('input[name="ospiti"], [aria-label="Ospiti"]').first().inputValue();
  esito(Number(dopo) === Number(prima) + 1, `${nome}: il contatore sale (${prima} → ${dopo})`);
  await page.screenshot({ path: `${OUT}/modulo-${nome}.png` });

  await page.close();
}

await browser.close();
console.log(problemi ? `\n${problemi} problemi` : "\nTutti i controlli superati");
process.exit(problemi ? 1 : 0);
