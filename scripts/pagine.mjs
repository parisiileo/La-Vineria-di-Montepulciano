// Le pagine dedicate: uno scatto per pagina, alle due larghezze e nelle due
// lingue, più i controlli che una pagina figlia può fallire in silenzio —
// un solo h1, nessun debordo orizzontale, il dato strutturato valido.

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3111";
const OUT = "artifacts/step-07";
mkdirSync(OUT, { recursive: true });

const PAGINE = [
  ["it", "/it", "home"],
  ["it", "/it/cantina", "cantina"],
  ["it", "/it/carta", "carta"],
  ["it", "/it/locali", "locali"],
  ["en", "/en/the-cellar", "cantina-en"],
  ["en", "/en/menu", "carta-en"],
  ["en", "/en/the-rooms", "locali-en"],
];

const browser = await chromium.launch();
let problemi = 0;
const esito = (ok, testo) => {
  if (!ok) problemi++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${testo}`);
};

for (const [, percorso, nome] of PAGINE) {
  for (const [etichetta, viewport] of [
    ["1440", { width: 1440, height: 900 }],
    ["390", { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
    await page.goto(`${BASE}${percorso}`, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);

    if (etichetta === "1440") {
      const diagnosi = await page.evaluate(() => {
        const h1 = document.querySelectorAll("h1").length;
        const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(
          (s) => {
            try {
              return JSON.parse(s.textContent)["@type"];
            } catch {
              return "NON VALIDO";
            }
          },
        );
        const noindex = document
          .querySelector('meta[name="robots"]')
          ?.getAttribute("content")
          ?.includes("noindex");
        return { h1, jsonld, noindex: !!noindex };
      });
      esito(diagnosi.h1 === 1, `${nome}: un solo h1 (${diagnosi.h1})`);
      esito(!diagnosi.jsonld.includes("NON VALIDO"), `${nome}: dati strutturati validi [${diagnosi.jsonld.join(", ") || "nessuno"}]`);
      esito(!diagnosi.noindex, `${nome}: indicizzabile`);
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    esito(overflow <= 0, `${nome} @${etichetta}: nessun debordo orizzontale (${overflow}px)`);

    await page.screenshot({ path: `${OUT}/${nome}-${etichetta}.png`, fullPage: etichetta === "1440" });
    await page.close();
  }
}

await browser.close();
console.log(problemi ? `\n${problemi} problemi` : "\nTutte le prove superate");
process.exit(problemi ? 1 : 0);
