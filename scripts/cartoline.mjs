// Le cartoline social: `npm run cartoline`.
//
// Genera in `public/og` le immagini che Facebook, WhatsApp, LinkedIn e X
// mostrano quando qualcuno incolla un link del sito. Si rigenerano a mano
// quando cambiano le fotografie o il marchio, e finiscono in repository come
// qualsiasi altro asset.
//
// PERCHÉ UNO SCRIPT E NON `opengraph-image.tsx` DI NEXT.
//
// La strada ovvia era la convenzione di Next, che disegna la cartolina durante
// la build con satori. È stata scritta, provata e buttata, per tre ragioni
// misurate in quest'ordine:
//
//   1. **I font.** Satori vuole TTF o OTF; qui i caratteri sono woff2 e solo
//      woff2 — risposta testuale: «Unsupported OpenType signature wOF2».
//      Il nome della casa sarebbe finito sulla cartolina in Geist, cioè in un
//      carattere che sul sito non compare da nessuna parte, oppure non ci
//      sarebbe finito affatto.
//   2. **Il peso.** La cartolina della home usciva 2,2 MB. ImageResponse
//      produce solo PNG, che su una fotografia è il formato sbagliato: nessuna
//      compressione con perdita, nessuna scelta di qualità.
//   3. **Il WebP.** La cartolina della cantina rispondeva 500: la sorgente è
//      un fotogramma `.webp` e satori non lo decodifica. Il fotogramma
//      avrebbe dovuto essere convertito a parte, cioè comunque un passaggio
//      fuori dalla build.
//
// Un browser vero non ha nessuno di questi problemi: legge il woff2 perché è
// un browser, salva in JPEG con la qualità che gli si chiede, e apre i WebP.
// In più disegna la cartolina con LE STESSE regole del sito — stesse
// variabili, stesso serif, stesso ottone — invece di una loro imitazione.
//
// Playwright è già una dipendenza di sviluppo: la usano tutti gli altri
// script di verifica in questa cartella.

import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RADICE = process.cwd();
const USCITA = join(RADICE, "public", "og");

/** 1200×630 è 1,91:1, la proporzione che le piattaforme ritagliano di meno. */
const LARGHEZZA = 1200;
const ALTEZZA = 630;

/** Qualità del JPEG. A 82 la fotografia resta pulita e la cartolina sta sotto
 *  i 200 KB: sopra quella soglia alcuni scraper — WhatsApp in particolare —
 *  rinunciano a scaricare l'anteprima e mostrano solo il titolo. */
const QUALITA = 82;

const dataUri = (percorso, mime) =>
  `data:${mime};base64,${readFileSync(join(RADICE, percorso)).toString("base64")}`;

/**
 * I token si LEGGONO da globals.css, non si ricopiano qui.
 *
 * È la stessa regola del resto del progetto — nessun file fuori da globals.css
 * dichiara un colore — e lo stesso metodo di `scripts/audit.mjs`, che quel
 * file lo rilegge per verificare la parità. Il giorno che l'ottone cambia, la
 * cartolina cambia con lui senza che nessuno se ne ricordi.
 */
const CSS = readFileSync(join(RADICE, "app", "globals.css"), "utf8");

const token = (nome) => {
  const trovato = CSS.match(new RegExp(`--${nome}:\\s*([^;]+);`));
  if (!trovato) throw new Error(`token --${nome} non trovato in globals.css`);
  return trovato[1].trim();
};

const TUFO_PROFONDO = token("color-tuff-deep");
const CREMA = token("color-cream");
const OTTONE = token("color-brass");

/** Il grading fotografico del sistema, anche questo dai token. */
const GRADING =
  `contrast(${token("foto-contrasto")}) saturate(${token("foto-saturazione")})` +
  ` brightness(${token("foto-luminosita")})`;

/** Il tufo con un'opacità. Serve alle tappe dei gradienti, e si ricava dal
 *  token invece di riscriverne i canali a mano in ogni riga. */
const tufo = (alfa) => {
  const [, r, g, b] = TUFO_PROFONDO.match(/^#(\w\w)(\w\w)(\w\w)$/);
  return `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${alfa})`;
};

const CARTOLINE = [
  {
    nome: "home",
    foto: ["assets/foto/sala-bancone.jpg", "image/jpeg"],
    // Il titolo è quello dell'hero, con la parola accentata fra <em>: la
    // stessa che sul sito arriva in ritardo, in corsivo e in ottone.
    titolo: "Sopra la tavola,<br />sotto la <em>storia</em>",
    riga: "Via di Gracciano nel Corso · Montepulciano",
  },
  {
    nome: "cantina",
    foto: ["public/cellar/100.webp", "image/webp"],
    titolo: "Sotto il corso<br />si <em>cammina</em>",
    riga: "Visita in cantina · Ingresso dal 101",
  },
];

const pagina = ({ foto, titolo, riga }) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face {
    font-family: "Cormorant";
    src: url("${dataUri("app/fonts/CormorantGaramond-Variable.woff2", "font/woff2")}") format("woff2");
    font-weight: 300 700;
  }
  @font-face {
    font-family: "Inter";
    src: url("${dataUri("app/fonts/Inter-Variable.woff2", "font/woff2")}") format("woff2");
    font-weight: 100 900;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${LARGHEZZA}px; height: ${ALTEZZA}px; overflow: hidden;
         background: ${TUFO_PROFONDO}; position: relative; }

  /* La fotografia riempie la cartolina. Il grading è quello del sistema —
     gli stessi tre numeri dei token foto-contrasto e compagni — così
     lo scatto del cliente ha in anteprima la temperatura che ha sul sito. */
  .foto { position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; filter: ${GRADING}; }

  /* Il velo, e sotto di lui la leggibilità: il testo è crema su una
     fotografia calda e chiara, e senza questi due strati non tiene il
     contrasto in nessun punto. */
  .velo { position: absolute; inset: 0; background: ${TUFO_PROFONDO}; opacity: 0.16; }
  .scrim { position: absolute; inset: 0; background:
    linear-gradient(to top, ${TUFO_PROFONDO} 4%, ${tufo(0.82)} 34%,
                    ${tufo(0.34)} 62%, ${tufo(0)} 88%),
    linear-gradient(to right, ${tufo(0.72)} 0%, ${tufo(0.28)} 44%,
                    ${tufo(0)} 70%); }

  .contenuto { position: absolute; inset: 0; padding: 72px;
               display: flex; flex-direction: column; justify-content: flex-end; }

  h1 { font-family: "Cormorant", Georgia, serif; font-weight: 400;
       font-size: 82px; line-height: 0.94; letter-spacing: -0.025em;
       color: ${CREMA}; max-width: 17ch; }
  h1 em { font-style: italic; color: ${OTTONE}; }

  .piede { display: flex; align-items: center; gap: 20px; margin-top: 34px; }
  .marchio { width: 56px; height: 56px; flex: none; }
  .riga { font-family: "Inter", system-ui, sans-serif; font-size: 21px;
          letter-spacing: 0.06em; text-transform: uppercase; color: ${OTTONE}; }
</style></head>
<body>
  <img class="foto" src="${dataUri(...foto)}" />
  <div class="velo"></div>
  <div class="scrim"></div>
  <div class="contenuto">
    <h1>${titolo}</h1>
    <div class="piede">
      <img class="marchio" src="${dataUri("app/icon.svg", "image/svg+xml")}" />
      <span class="riga">${riga}</span>
    </div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: LARGHEZZA, height: ALTEZZA },
  deviceScaleFactor: 1,
});

mkdirSync(USCITA, { recursive: true });

for (const cartolina of CARTOLINE) {
  await page.setContent(pagina(cartolina), { waitUntil: "load" });
  // I woff2 arrivano come data URI, quindi non c'è rete da attendere: basta
  // che il motore abbia finito di comporre, altrimenti si fotografa il
  // fallback e il titolo esce in Georgia.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);

  const file = join(USCITA, `${cartolina.nome}.jpg`);
  const buf = await page.screenshot({ type: "jpeg", quality: QUALITA });
  writeFileSync(file, buf);
  console.log(`  og/${cartolina.nome}.jpg  ${(buf.length / 1024).toFixed(0)} KB`);
}

await browser.close();
console.log(`\n${CARTOLINE.length} cartoline in public/og`);
