// Riassunto leggibile di un report Lighthouse: i punteggi, le metriche e le
// diagnosi che pesano di più. Il JSON intero è illeggibile e il report HTML
// non si può incollare in un rapporto.

import { readFileSync } from "node:fs";

for (const file of process.argv.slice(2)) {
  const lh = JSON.parse(readFileSync(file, "utf8"));
  const c = lh.categories;
  const a = lh.audits;
  const p = (x) => (x == null ? "—" : Math.round(x * 100));
  console.log(`\n=== ${file.split("/").pop()} · ${lh.configSettings.formFactor} ===`);
  console.log(
    `Performance ${p(c.performance.score)}  Accessibility ${p(c.accessibility.score)}  ` +
      `Best Practices ${p(c["best-practices"].score)}  SEO ${p(c.seo.score)}`,
  );
  for (const k of [
    "largest-contentful-paint",
    "cumulative-layout-shift",
    "total-blocking-time",
    "first-contentful-paint",
    "speed-index",
    "interactive",
  ]) {
    if (a[k]) console.log(`  ${k.padEnd(28)} ${a[k].displayValue ?? "—"}`);
  }

  const falliti = Object.values(a).filter(
    (x) => x.score !== null && x.score < 1 && x.scoreDisplayMode !== "informative",
  );
  if (falliti.length) {
    console.log("  audit non superati:");
    for (const f of falliti.sort((x, y) => (x.score ?? 0) - (y.score ?? 0))) {
      const risparmio = f.details?.overallSavingsMs
        ? ` (−${Math.round(f.details.overallSavingsMs)}ms)`
        : f.details?.overallSavingsBytes
          ? ` (−${(f.details.overallSavingsBytes / 1024).toFixed(0)}kB)`
          : "";
      console.log(`    ${String(p(f.score)).padStart(3)}  ${f.id}${risparmio}`);
    }
  }
}
