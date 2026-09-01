// Guardia automatica delle regole di progetto. Sostituisce il "fai un grep
// prima di chiudere ogni step" con qualcosa che non si dimentica.
//
// Verifica:
//   1. parità dei colori fra app/globals.css e lib/palette.ts
//   2. parità di easing e durate fra app/globals.css e lib/motion.ts
//   3. contrasto di ogni coppia dichiarata nel contratto della palette
//   4. assenza di colori, durate ed easing letterali fuori da globals.css
//   5. assenza degli anti-pattern vietati
//
// Uscita diversa da zero = lo step non è chiudibile.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const CSS = readFileSync(join(ROOT, "app/globals.css"), "utf8");

let failures = 0;
const fail = (msg) => { failures++; console.error(`  FAIL  ${msg}`); };
const pass = (msg) => console.log(`  ok    ${msg}`);
const head = (msg) => console.log(`\n${msg}`);

/* ------------------------------------------------------- 1. colori in parità */
head("1. Parità colori globals.css ↔ lib/palette.ts");
const cssColors = Object.fromEntries(
  [...CSS.matchAll(/--color-([a-z-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2].toUpperCase()]),
);
const paletteSrc = readFileSync(join(ROOT, "lib/palette.ts"), "utf8");
const tsColors = Object.fromEntries(
  [...paletteSrc.matchAll(/"?([a-z-]+)"?:\s*"(#[0-9A-Fa-f]{6})"/g)].map((m) => [m[1], m[2].toUpperCase()]),
);
for (const [name, hex] of Object.entries(tsColors)) {
  if (!cssColors[name]) fail(`lib/palette.ts dichiara "${name}" che non esiste in @theme`);
  else if (cssColors[name] !== hex) fail(`"${name}": CSS ${cssColors[name]} ≠ TS ${hex}`);
}
for (const name of Object.keys(cssColors)) {
  if (!tsColors[name]) fail(`@theme dichiara --color-${name} che manca in lib/palette.ts`);
}
if (!failures) pass(`${Object.keys(cssColors).length} token cromatici allineati`);

/* -------------------------------------------- 2. movimento in parità */
head("2. Parità movimento globals.css ↔ lib/motion.ts");
const motionSrc = readFileSync(join(ROOT, "lib/motion.ts"), "utf8");
const cssEase = Object.fromEntries(
  [...CSS.matchAll(/--ease-([a-z]+):\s*cubic-bezier\(([^)]+)\)/g)].map((m) => [
    m[1] === "inout" ? "inOut" : m[1],
    m[2].split(",").map((n) => Number(n.trim())).join(","),
  ]),
);
const tsEase = Object.fromEntries(
  [...motionSrc.matchAll(/(\w+):\s*\[([^\]]+)\]\s*as Cubic/g)].map((m) => [
    m[1],
    m[2].split(",").map((n) => Number(n.trim())).join(","),
  ]),
);
for (const [name, curve] of Object.entries(tsEase)) {
  if (cssEase[name] !== curve) fail(`ease.${name}: CSS "${cssEase[name]}" ≠ TS "${curve}"`);
}
const cssDur = Object.fromEntries(
  [...CSS.matchAll(/--dur-([a-z]+):\s*(\d+)ms/g)].map((m) => [m[1], Number(m[2]) / 1000]),
);
const durBlock = /export const duration = \{([\s\S]*?)\} as const;/.exec(motionSrc)?.[1] ?? "";
const tsDur = Object.fromEntries(
  [...durBlock.matchAll(/(micro|base|slow|drift):\s*([\d.]+),/g)].map((m) => [m[1], Number(m[2])]),
);
for (const [name, secs] of Object.entries(tsDur)) {
  if (cssDur[name] !== secs) fail(`duration.${name}: CSS ${cssDur[name]}s ≠ TS ${secs}s`);
}
if (Object.keys(tsEase).length === 4 && Object.keys(tsDur).length === 4) {
  pass("4 curve e 4 durate allineate fra CSS e TS");
} else {
  fail("curve o durate non tutte trovate (attese 4 + 4)");
}

/* ------------------------------------------------------- 3. contrasto */
head("3. Contrasto WCAG 2.1 delle coppie sotto contratto");
const chan = (hex) => hex.replace("#", "").match(/../g).map((x) => parseInt(x, 16) / 255);
const linz = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex) => { const [r, g, b] = chan(hex).map(linz); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x); return (h + 0.05) / (l + 0.05); };
const flat = (fg, a, bg) => {
  const f = chan(fg).map((v) => v * 255), b = chan(bg).map((v) => v * 255);
  return "#" + f.map((v, i) => Math.round(v * a + b[i] * (1 - a)).toString(16).padStart(2, "0")).join("");
};
const contractRe = /\{\s*fg:\s*"([\w-]+)",\s*bg:\s*"([\w-]+)",\s*min:\s*([\d.]+)/g;
let checked = 0;
for (const m of paletteSrc.matchAll(contractRe)) {
  const [, fg, bg, min] = m;
  const r = ratio(cssColors[fg], cssColors[bg]);
  checked++;
  if (r < Number(min)) fail(`${fg} su ${bg}: ${r.toFixed(2)}:1, richiesto ${min}:1`);
}
const borderRe = /\{\s*nome:\s*"([^"]+)",\s*fg:\s*"([\w-]+)",\s*alpha:\s*([\d.]+),\s*bg:\s*"([\w-]+)",\s*richiede3:\s*(true|false)/g;
for (const m of paletteSrc.matchAll(borderRe)) {
  const [, nome, fg, alpha, bg, needs] = m;
  const r = ratio(flat(cssColors[fg], Number(alpha), cssColors[bg]), cssColors[bg]);
  checked++;
  if (needs === "true" && r < 3) fail(`${nome} su ${bg}: ${r.toFixed(2)}:1, richiesto 3:1 (WCAG 1.4.11)`);
}
pass(`${checked} coppie verificate`);

/* ------------------------------- 4 e 5. letterali e anti-pattern nel sorgente */
head("4. Valori letterali e anti-pattern nel sorgente");
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "fonts", "scripts"]);
const walk = (dir) => readdirSync(dir).flatMap((entry) => {
  const full = join(dir, entry);
  if (SKIP_DIRS.has(entry)) return [];
  return statSync(full).isDirectory() ? walk(full) : [full];
});
const files = walk(ROOT).filter((f) => [".tsx", ".ts"].includes(extname(f)) && !f.endsWith(".d.ts"));

const RULES = [
  { re: /#[0-9A-Fa-f]{6}\b/, msg: "colore esadecimale letterale", allow: ["lib/palette.ts", "lib/utils.ts"] },
  { re: /\brgba?\(/, msg: "colore rgb() letterale", allow: [] },
  { re: /transition-all\b/, msg: "transition-all vietato", allow: [] },
  { re: /\bduration-\d+\b/, msg: "durata numerica: usare duration-(--dur-*)", allow: [] },
  { re: /\bease-\[cubic-bezier/, msg: "easing inline: usare ease-(--ease-*)", allow: [] },
  { re: /will-change:/, msg: "will-change statico", allow: [] },
  { re: /outline:\s*none|outline-none/, msg: "outline rimosso", allow: ["components/ui/Select.tsx"] },
  { re: /\bshadow-(sm|md|lg|xl|2xl|black)/, msg: "ombra generica: la profondità è luce", allow: [] },
  { re: /from-(purple|violet|blue|indigo)|to-(purple|violet|blue|indigo)/, msg: "gradiente viola/blu", allow: [] },
  { re: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, msg: "emoji nell'interfaccia", allow: [] },
];
let literals = 0;
for (const file of files) {
  const rel = file.slice(ROOT.length + 1).replace(/\\/g, "/");
  const src = readFileSync(file, "utf8");
  src.split("\n").forEach((line, i) => {
    if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*")) return;
    for (const rule of RULES) {
      if (rule.allow.includes(rel)) continue;
      if (rule.re.test(line)) { fail(`${rel}:${i + 1} ${rule.msg} → ${line.trim().slice(0, 76)}`); literals++; }
    }
  });
}
if (!literals) pass(`${files.length} file sorgente puliti`);

head(failures ? `AUDIT FALLITO — ${failures} problemi` : "AUDIT SUPERATO");
process.exit(failures ? 1 : 0);
