# La Vineria di Montepulciano — note di design

Step 01 · Fondamenta e art direction

Questo documento registra le decisioni che non si leggono dal codice: perché un
token vale quel numero, che cosa è stato corretto rispetto alla specifica, e su
quali misure poggia ogni scelta. Tutto ciò che è verificabile automaticamente è
in `scripts/audit.mjs`, che va eseguito prima di chiudere ogni step:

```bash
npm run check
```

`check` = `lint` + `audit` + `build`. L'audit fallisce, con uscita diversa da
zero, se un colore diverge fra CSS e TypeScript, se una curva o una durata
divergono, se una coppia sotto contratto scende sotto la soglia WCAG, o se
compare un valore letterale o un anti-pattern nel sorgente.

---

## 1. Contrasto: valori verificati e correzioni ai token

Tutti i rapporti sono calcolati con la formula WCAG 2.1 (luminanza relativa,
`(L1+0.05)/(L2+0.05)`), non stimati. La verifica gira a ogni `npm run audit`,
e la stessa tabella è stampata live in `/it/kitchen-sink`.

### Coppie di testo

| Coppia | Rapporto | Esito |
|---|---|---|
| `cream` su `tuff` | 15.81:1 | AA |
| `cream` su `tuff-deep` | 16.52:1 | AA |
| `cream` su `tuff-light` | 14.51:1 | AA |
| `cream` su `tuff-raised` | 12.96:1 | AA |
| `stone` su `tuff` | 9.98:1 | AA |
| `stone` su `tuff-light` | 9.16:1 | AA |
| `stone` su `tuff-raised` | 8.19:1 | AA |
| `stone-dim` su `tuff` | 5.80:1 | AA |
| `stone-dim` su `tuff-light` | 5.32:1 | AA |
| `stone-dim` su `tuff-raised` | 4.76:1 | AA |
| `brass` su `tuff` | 5.86:1 | AA |
| `brass` su `tuff-light` | 5.37:1 | AA |
| `brass` su `tuff-raised` | 4.80:1 | AA |
| `cream` su `wine` | 8.89:1 | AA |
| `cream` su `wine-lit` | 7.04:1 | AA |
| `cream` su `wine-deep` | 13.38:1 | AA |
| `error` su `tuff` | 5.57:1 | AA |
| `error` su `tuff-light` | 5.11:1 | AA |
| `tuff-deep` su `brass` | 6.12:1 | AA |
| `brass-dim` su `tuff` | 3.79:1 | solo non-testo |
| `brass-dim` su `tuff-raised` | 3.11:1 | solo non-testo |
| `brass` su `wine` | 3.29:1 | solo display |

### Correzione 1 — `--stone-dim`: `#8F857A` → `#9B9086`

Il valore della specifica passava su `--tuff` (5.00:1) ma **falliva su
`--tuff-raised` a 4.10:1**. `--stone-dim` porta le label, che sono testo di
12px: la soglia applicabile è 4.5:1, non 3:1, e le label sono il testo più
fragile dell'intero sistema — corpo minimo, maiuscoletto, tracking 0.20em.

Non è stato ristretto l'uso del token: è stato corretto il colore, in modo che
passi su **tutte e quattro** le superfici di tufo. La superficie peggiore ora
dà 4.76:1. Il salto di luminanza è minimo e la temperatura del taupe resta
identica.

### Correzione 2 — `--brass-dim` dichiarato token non-testo

`#8A6E43` dà 3.79:1 su `--tuff` e 3.11:1 su `--tuff-raised`: non è testo
leggibile a corpo normale. Schiarirlo lo renderebbe indistinguibile da
`--brass`, cioè eliminerebbe la ragione per cui esiste.

La decisione è quindi di **ruolo, non di colore**: `--brass-dim` è riservato a
bordi, filetti, tratti e superfici non testuali, dove la soglia applicabile è
3:1 (WCAG 1.4.11) e la supera su ogni superficie. È dichiarato così in
`lib/palette.ts`, e l'audit lo verifica con soglia 3.

### Correzione 3 — il focus ring della specifica non era conforme

La specifica prescriveva `ring-1 ring-[--brass]/50`. Composito su `--tuff`,
l'ottone al 50% dà **2.40:1**: sotto il minimo di 3:1 richiesto per gli
indicatori di focus. Un focus ring che non si vede è peggio di nessun focus
ring, perché dà l'illusione della conformità.

Sostituito con **ottone pieno a 2px**, `outline-offset: 3px`, dichiarato una
volta sola su `:focus-visible` in `globals.css`. Rapporto sulla superficie
peggiore: **4.80:1**. Nessun componente ridefinisce il focus.

### Correzione 4 — bordi dei controlli, e un token nuovo

`--border` a `rgba(201,191,178,0.10)` dà **1.21:1**: perfetto come filetto
decorativo, inammissibile come confine di un campo di input, che WCAG 1.4.11
vuole a 3:1. Introdotto quindi un token dedicato:

| Token | Composito | Rapporto | Ruolo |
|---|---|---|---|
| `--border` | stone 10% | 1.21:1 | filetto decorativo, esente da 1.4.11 |
| `--border-control` | stone 52% | 3.33:1 | confine dei controlli interattivi |
| `--border-hover` | brass 75% | 3.35:1 | stato hover dei controlli |

`--border-hover` era `brass 55%` nella prima stesura: **2.46:1**, scoperto e
respinto dall'audit. Portato a 75%.

### Regole d'uso non verificabili da uno script

- Il vino è accento, mai superficie: massimo ~10% del viewport visibile.
- L'ottone è condimento: filetti, testo di accento, un dettaglio. Mai campiture
  piene — l'unica eccezione è la pillola del selettore di lingua, che è
  minuscola e porta testo `tuff-deep` a 6.12:1.
- Non esiste un token di ombra nera. La profondità si costruisce con
  `--glow-brass`, `--glow-wine`, `--glow-focus`, `--glow-error`. Se qualcuno
  aggiunge `shadow-lg`, l'audit lo blocca.

---

## 2. Movimento: perché quelle curve, e perché esistono `drift` e `heavy`

I valori vivono in due posti — `lib/motion.ts` per Framer, `--ease-*` e
`--dur-*` in `globals.css` per le transizioni CSS — perché i due motori non
parlano la stessa lingua. La divergenza fra le due liste è il rischio ovvio, e
per questo l'audit confronta le quattro curve e le quattro durate a ogni
esecuzione e fallisce se un solo numero non combacia. (Ha già intercettato un
errore durante questo step.)

### Le quattro curve

| Token | Curva | Registro |
|---|---|---|
| `out` | `0.16, 1, 0.30, 1` | expo-out. Parte veloce, si posa senza rimbalzo. Reveal ed entrate. |
| `inOut` | `0.65, 0, 0.35, 1` | simmetrica. Transizioni bidirezionali, dove andata e ritorno devono somigliarsi. |
| `soft` | `0.22, 1, 0.36, 1` | reattiva ma non nervosa. Hover e micro-interazioni. |
| `drift` | `0.33, 0, 0.15, 1` | accelera tardi e decelera a lungo. Materia. |

### Perché `drift` non è `out` più lenta

`out` scarica quasi tutta la distanza nel primo terzo del tempo: è il profilo
di qualcosa che *appare*. `drift` accumula lentamente e rilascia lentamente: è
il profilo di qualcosa che *ha massa*. Rallentare `out` produce un elemento
leggero al rallentatore, che è la cosa che tradisce più in fretta
un'animazione fatta a occhio.

Nel sito convivono due velocità e non è un vezzo: le interazioni rispondono al
dito dell'utente, la materia — la scena 3D dello Step 2, il parallasse, la
discesa nel tufo — risponde alla propria inerzia. La pietra non scatta.

### Perché `spring.heavy`

Stessa ragione sul versante delle molle. `snappy` (400/30) è il ritorno di un
controllo; `heavy` (90/22) è il ritorno di qualcosa che pesa. Usare `snappy` su
un elemento presentato come pesante crea una dissonanza che si nota anche senza
saperla nominare.

### Durate

`micro` 0.2s (hover, focus) · `base` 0.6s (reveal) · `slow` 1.1s (entrate di
sezione, overlay) · `drift` 2.2s (ambientale).

Il bottone primary usa **due velocità sullo stesso elemento**: lo sweep del
riempimento è un reveal e prende `--dur-base`, mentre colore e scala sono
interazione e prendono `--dur-micro`. È il caso più piccolo dello stesso
principio.

---

## 3. Grana: come è stato scelto lo 0.14

Il valore di partenza della specifica era `opacity: 0.045` con
`mix-blend-mode: overlay`. Messo in pagina, **non produceva alcun effetto
visibile**. Due cause, entrambe reali:

1. **`feTurbulence` genera anche il canale alpha in modo casuale.** Con
   `feColorMatrix type="saturate"` si desatura l'RGB ma l'alpha resta random:
   il rettangolo risulta in gran parte trasparente e non compone quasi nulla.
   Risolto forzando l'alpha a 1 con `feComponentTransfer`.
2. **`overlay` su un fondo quasi nero scala la deviazione per la luminanza del
   fondo.** Nel ramo scuro l'operazione è `2 × base × blend`: con `base ≈ 0.10`
   la modulazione risultante è una frazione minima. A 0.045 la variazione
   misurata sul canale rosso del tufo era di **meno di un livello su 256** —
   letteralmente invisibile.

Sistemato il filtro, il rumore è stato ricentrato: `slope 1.9, intercept -0.72`
porta la media a **119.8** con **σ 54.4**. Il ricentraggio non è cosmetico —
`overlay` è neutro a 128, quindi un rumore centrato altrove *lava* il fondo
invece di modularlo, e la prima versione, centrata a 185, lo schiariva.

Poi la taratura, misurando i pixel invece di fidarsi dell'occhio:

| Opacity | Fondo tufo (canale R) | Δ livelli | Giudizio |
|---|---|---|---|
| 0.045 | 26–27 | 1 | invisibile |
| 0.12 | 27–28 | 1–2 | ai limiti |
| **0.14** | **25–28** | **~3** | **scelto** |
| 0.18 | 24–29 | 5 | il bordeaux inizia a sporcarsi |
| 0.28 | 22–29 | 7 | grana evidente sui mezzitoni |

**0.14** è il punto in cui il fondo ha materia e i mezzitoni restano puliti. Il
vincolo che decide non è il tufo ma il **vino**: `overlay` ha il massimo effetto
proprio sui mezzitoni, e il bordeaux (`#7B1E2B`, R = 0.482, appena sotto la
soglia di 0.5) è esattamente lì. A 0.28 i bottoni primari si vedevano
granulosi; a 0.14 no. Il testo crema resta invariato entro un livello su 256,
perché nel ramo chiaro `overlay` opera su `1 − base`, che per la crema è
minuscolo.

Verifica rifatta a ogni modifica: togliere la grana, rimetterla, e confrontare
la stessa area piatta.

---

## 4. Tipografia: che cosa è stato usato e perché

### I caratteri

| Ruolo | Scelta | Nota |
|---|---|---|
| Display | **Cormorant Garamond** (300–700, con corsivo) | fallback dichiarato dalla specifica |
| Corpo e UI | **Inter** (variabile 100–900) | fallback dichiarato dalla specifica |
| Numeri | **JetBrains Mono** (variabile 100–800) | civici, annate, prezzi, numerazione |

**Ogg e Canela non sono stati usati: il cliente non ha licenza.** La specifica
li indicava come prima scelta subordinata alla licenza, e la subordinata non è
soddisfatta. Se il cliente acquista una delle due licenze, la sostituzione
tocca solo `app/fonts.ts` e i file in `app/fonts/`: nessun componente nomina un
carattere, tutti passano da `--font-display`.

Cormorant è un Garamond con contrasto alto e grazie sottili: regge il tracking
negativo del display senza impastarsi, e il suo corsivo ha personalità
sufficiente a portare le parole emotive. È il fallback giusto, non un ripiego
neutro.

### Self-hosting e CLS

Tutti e tre i caratteri sono serviti in locale con `next/font/local`, subset
latin, `display: swap`. Google Fonts serve varianti **variabili**: i pesi
richiesti condividono lo stesso file, quindi i nove file scaricati si riducono
a **quattro, 160 KB in tutto**.

`adjustFontFallback` è impostato a `Times New Roman` per Cormorant e `Arial`
per Inter, così i fallback ricevono metriche corrette e il CLS da sostituzione
è nullo. Per JetBrains Mono è **disattivato di proposito**: sovrascrivere le
metriche di un monospazio con quelle di Arial peggiorerebbe lo scarto invece di
ridurlo, e il mono compare solo in frammenti brevi.

### La scala

Il minimo di ogni `clamp()` è scelto guardando 390px, non dividendo il valore
desktop. A 375px il display misura 40px, che è il punto in cui «Vocabolario
visivo de La Vineria» va a due righe senza spezzare parole.

Sotto 640px il tracking negativo passa da `-0.035em` a `-0.02em`. Non è una
preferenza: a corpo piccolo il tracking stretto chiude le contro-forme del
serif e la leggibilità cala.

Il motore visivo è il **contrasto fra display stretto e label larghe**:
`-0.035em` contro `+0.20em`, un salto di un quarto di em. È da lì che viene la
sensazione di cura, non dai colori.

Regole minori ma non trascurabili: `text-wrap: balance` sui titoli e
`text-wrap: pretty` sui paragrafi eliminano le righe orfane; `.measure`
mantiene il corpo fra 45 e 70 caratteri; il corsivo del serif è riservato alle
parole emotive e prende l'ottone (`h1 em, h2 em, h3 em` in `globals.css`, così
non va ripetuto).

---

## 5. Il contratto di movimento: come il contenuto resta visibile

È la parte più importante dello step, perché è il bug che rende invisibile
mezzo sito.

Framer Motion scrive lo stato iniziale — `opacity: 0`, `transform`, `filter` —
**anche nell'HTML del server**. Se JavaScript non parte, quello stato resta lì
per sempre. Il rimedio abituale (una classe aggiunta dopo l'idratazione) o
lampeggia o non arriva mai.

La soluzione qui ha quattro pezzi.

**1. Uno script bloccante nel `<head>`** (`components/MotionRuntime.tsx`),
eseguito prima del primo paint e non dopo l'idratazione. Scrive
`data-motion="on"` su `<html>` solo se JS è attivo e `prefers-reduced-motion`
non è attivo. Verificato: nell'HTML statico `data-motion="on"` **non compare
mai**, e lo script è a byte 2796 contro il `<body>` a 3138.

**2. Un guard CSS** in `globals.css`:

```css
html:not([data-motion="on"]) [data-motion-guard] {
  opacity: 1 !important;
  transform: none !important;
  filter: none !important;
  clip-path: none !important;
}
```

Ogni wrapper animato marca sé stesso con `data-motion-guard`. Se il permesso
non c'è, l'`!important` annulla lo stato inline scritto da Framer — **senza
attendere JavaScript e senza lampeggiare**.

**3. Due failsafe**, che revocano `data-motion` e fanno scattare il guard:

- *Idratazione mancata*: lo script arma un timeout di 2s e revoca se `MotionReady`
  non ha scritto `data-hydrated`.
- *Compositore fermo*: `MotionReady` verifica che arrivi un `requestAnimationFrame`
  entro 1.2s. Se non arriva, revoca.

Il secondo failsafe **non era previsto ed è stato aggiunto su evidenza**.
Durante la verifica è emerso che nel pannello di anteprima `rAF` non gira
affatto pur con `visibilityState: "visible"`: di conseguenza nessun
IntersectionObserver riceve callback, nessun `whileInView` scatta, e ogni
elemento in attesa di entrare sarebbe rimasto nascosto per sempre. Lo stesso
succede in webview incorporate, tab throttlate e strumenti di cattura. Il
contratto copriva «idratazione fallita» ma non «idratazione riuscita, rendering
fermo».

**4. `prefers-reduced-motion`** su tre livelli: lo script non scrive
l'attributo; un listener lo revoca se l'utente cambia preferenza a pagina
aperta; il blocco `@media` in `globals.css` neutralizza comunque il guard. Ogni
componente motion consulta inoltre `useReducedMotion` e rende il proprio
elemento semplice, senza Framer.

### Verifica eseguita

| Caso | Esito |
|---|---|
| `data-motion` presente | 9 elementi guardati con `opacity: 0`, `y: 24`, `blur(6px)` — pronti ad animare |
| `data-motion` rimosso | 9 su 9 a `opacity: 1`, `transform: none`, `filter: none`. **Zero elementi invisibili** |
| HTML del server | testo integrale presente nel sorgente; nessun `data-motion="on"` |
| Failsafe rAF | scattato realmente in anteprima: pagina completamente leggibile |

---

## 6. Un bug di architettura corretto in `SplitText`

La prima stesura metteva `whileInView` **su ogni parola**. Ogni parola è
traslata del 110% fuori dal proprio contenitore `overflow-hidden`: poiché
l'IntersectionObserver ritaglia l'area di intersezione con gli antenati che
hanno overflow, la parola ha intersezione **zero** e non risulta mai in
viewport. L'animazione non parte, la parola resta tagliata, il titolo non
compare più. Stallo permanente, non intermittente.

Il trigger è stato spostato **sul contenitore**, che non è ritagliato; le
parole sono diventate figlie a variante, orchestrate con `staggerChildren`. Il
ritardo supplementare delle parole accentate passa dal `custom` di Framer, che
si somma allo sfasamento invece di sostituirlo.

Altre scelte del componente: divisione **per parole e non per lettere**, perché
su un serif elegante le lettere singole distruggono il ritmo tipografico e il
kerning; frase intera in `sr-only` e parole in `aria-hidden`, così gli screen
reader leggono una frase e non una collana di parole; `--split-descender`
compensa il ritaglio delle discendenti, altrimenti il serif perde la coda di
«g» e «p».

---

## 7. Altre decisioni degne di nota

**`aria-modal` sul dialogo.** Le versioni recenti di Radix hanno smesso di
emetterlo, affidandosi a `aria-hidden` sui fratelli. Verificato assente e
dichiarato esplicitamente: alcuni screen reader più vecchi ci si appoggiano
ancora, e l'attributo non contraddice il resto dell'albero.

**Nessun `<select>` nativo.** Non è stilizzabile in modo coerente fra Windows e
Android. Il componente è su Radix headless, con pannello su superficie
`tuff-raised` e voci alte 44px.

**Corpo dei campi bloccato a 16px** (`--text-field`), non fluido. Sotto quella
soglia iOS zooma al focus e rompe il layout. È un vincolo di piattaforma, non
una scelta estetica.

**Validazione al blur, mai al change.** Correggere qualcuno mentre sta ancora
scrivendo è ostile e fa lampeggiare il bordo.

**Ordine di impilamento dichiarato** in due token (`--z-overlay: 50`,
`--z-grain: 100`) invece di numeri sparsi. La grana sta sopra tutto, dialoghi
inclusi: una grana che si ferma al bordo di una finestra modale si legge come
un difetto.

**`.press`, `.sweep`, `.underline-grow`, `.shake` vivono in `globals.css`.**
Sono comportamenti, non decorazioni: un solo posto da cambiare per tutto il
sito, e nessun componente ridefinisce una durata.

---

## 8. Dati non confermati

Marcati `// TODO: verificare col cliente` in `lib/data/locali.ts`. Finché non
sono confermati valgono `null` e nessuna interfaccia li mostra: un dato falso
pubblicato su un'attività reale è un danno, non un dettaglio.

- **Sede di Cortona** — esistenza, indirizzo, stato. `SEDE_CORTONA_CONFERMATA = false`.
- **Profondità ed estensione dei tunnel** — `null`. Nessuna misura pubblicata.
  (Il campione tipografico della kitchen-sink cita «dodici metri»: è testo di
  esempio in `messages/`, non un dato, e va sostituito quando i contenuti
  reali arrivano allo Step 4.)
- **Gratuità del tour della cantina** — `null`.
- **Anno di fondazione** — `null`. Meglio nessuna data che una falsa.
- **Orari delle due sedi** — `null`, ed esclusi dal JSON-LD: pubblicare orari
  inventati in `schema.org` è il modo più veloce per mandare clienti davanti a
  una porta chiusa. Nell'interfaccia c'è una stringa dedicata
  (`common.orariNonDisponibili`).

Confermati e usati: famiglia Ercolani; Via di Gracciano nel Corso 101 e 72;
+39 0578 850153; etichetta propria «Il Brillo»; cantina in tunnel medievali
visitabili; pozzo medievale sotto pavimento di vetro al numero 72.

Anche i **nomi d'uso dei due locali** sono provvisori: in mancanza di conferma
sono identificati dal civico («Numero 101», «Numero 72»), che per fortuna è
coerente con l'art direction — il numero è un dato documentario e si compone in
mono.

La **carta** (`lib/data/menu.ts`) contiene tipi e struttura ma **zero piatti e
zero prezzi**: arrivano dal cliente allo Step 4.

---

## 9. Debiti aperti verso gli step successivi

- **`npm audit` segnala 2 vulnerabilità** (1 alta, 1 moderata) nel `postcss`
  interno a Next 15. Riguardano il build, non il runtime servito. La correzione
  automatica impone Next 16, che contraddice lo stack fissato dalla specifica.
  Da rivalutare allo Step 5.
- **184 KB di First Load JS sulla home** sono quasi tutti Framer Motion, su una
  pagina che allo Step 1 è un segnaposto. Da riprendere allo Step 5, quando il
  peso reale sarà noto.
- **Lenis è installato ma non agganciato**, come da specifica. Lo scroll lock
  del dialogo è oggi quello di Radix e andrà ricondotto al RAF condiviso allo
  Step 3.
- **Le animazioni allo scroll non sono state verificate visivamente**, perché
  nel pannello di anteprima `rAF` non gira. Sono verificati lo stato statico,
  lo stato con movimento revocato e la struttura delle varianti. La conferma
  visiva va fatta in un browser reale.
- **Nessuna fotografia.** Il campione di `Parallax` usa una gradazione di tufo.
  Le foto vanno recuperate da `lavineriadimontepulciano.it` allo Step 4.

---
---

# Step 02 · Immagine e composizione editoriale

Questo step sostituisce quella che in un altro progetto sarebbe la scena 3D.
Senza WebGL la profondità si costruisce con tre strumenti classici — la scala,
la stratificazione, il ritmo — e con una regola sola: **ogni composizione ha un
solo protagonista**. Se guardando una sezione non sai dove posare l'occhio per
primo, la composizione è sbagliata, e il §10.6 racconta le due volte in cui è
successo.

---

## 10. Composizione

### 10.0 Il fatto che ha deciso lo step

Prima di comporre qualsiasi cosa è stata recuperata **l'intera libreria
fotografica del cliente** dal WordPress di `lavineriadimontepulciano.it`: 255
elementi in `wp-json/wp/v2/media`, di cui 51 fotografie vere (il resto sono
loghi, icone e materiale demo del tema del 2018). Il debito aperto al §9 dello
Step 01 — «Nessuna fotografia, da recuperare allo Step 4» — è saldato qui.

Da quello spoglio è emerso il fatto che ha riscritto la partitura:

> **Le due fotografie dichiarate «critiche» dalla direzione artistica non
> esistono.** Non ci sono immagini dei tunnel della cantina. Non c'è il pozzo
> medievale sotto il pavimento di vetro. Non nella home: in tutta la libreria.
> La ricerca per parola chiave su titoli, didascalie e testi alternativi
> (`cantina|pozzo|tunnel|cellar|grotta|sotterran`) restituisce zero risultati.

Le alternative erano tre. Una stock photo toscana: esclusa, si riconosce a un
chilometro e su un'attività familiare vera distrugge in un colpo la
credibilità che tutto il resto del sito costruisce. Un'altra fotografia
spacciata per la cantina: peggio, è una bugia. Oppure **togliere la
fotografia**, che è la strada presa.

Cosa esiste invece, ed è stato usato: interni serali con la parete di
bottiglie, le due facciate (una fotografia dedicata per civico), la squadra
vera davanti alla porta, i taglieri, la pasta fatta a mano, il calice inciso
in verticale, e — il ritrovamento più prezioso — una **fotografia d'archivio
in bianco e nero della famiglia Ercolani su un carro carico di ceste da
vendemmia**.

Elenco di ciò che manca, tipizzato in `lib/data/foto.ts` (`FOTO_MANCANTI`),
perché una mancanza dichiarata in codice non si dimentica come una nota in un
documento.

### 10.1 Il ritmo: perché quella sequenza di densità

L'ordine degli archetipi è una partitura, e la regola di verifica è che **non
esistano due sezioni consecutive della stessa densità**.

| # | sezione | archetipo | densità |
|---|---------|-----------|---------|
| — | hero | **A** piena immagine | 5 |
| — | marquee | frattura | 2 |
| 01 | la famiglia | **B** editoriale + inserto d'archivio | 3 |
| — | respiro | **D** tipografica, registro *respiro* | 1 |
| 02 | la cantina | **D** tipografica, registro *monumento* | 5 |
| 03 | il vino | **B** editoriale, lato opposto | 3 |
| 04 | la cucina | **E** griglia asimmetrica | 4 |
| 05 | i locali | **C** dittico con occlusione | 3 |
| — | risalita | **D** tipografica, registro *respiro* | 1 |
| — | prenotazione | funzionale | 2 |
| — | footer | tipografica | 1 |

`5 · 2 · 3 · 1 · 5 · 3 · 4 · 3 · 1 · 2 · 1` — nessuna coppia consecutiva
uguale.

Le due sezioni a densità 1 sono **la discesa e la risalita**: sono il verticale
del concetto tradotto in ritmo invece che in movimento di camera, e sono i due
momenti in cui il sito rallenta. Il rallentamento è ciò che rende memorabile
quello che viene dopo — nel caso della prima, la cantina.

**Perché la cantina è un archetipo D e non un A.** La partitura originale
prevedeva lì una fotografia piena a densità massima. Quella fotografia non
esiste (§10.0). Sostituirla con un D in registro *respiro*, come suggerirebbe
la regola di ripiego, avrebbe però prodotto due sezioni consecutive a densità
minima — la discesa seguita da un'altra discesa — e un buco esattamente nel
punto più profondo della pagina.

Da qui il **secondo registro dell'archetipo D**: `monumento`. Stessa famiglia,
densità opposta — full-bleed su tufo profondo, corpo `--t-hero`, filetto
d'ottone, sorgente di luce in vino, dato in mono. Non è un ripiego travestito:
è l'unico modo in cui una sezione senza fotografia può reggere il peso che la
partitura le assegna. E il testo dice esattamente quello che sta succedendo —
«La cantina non si fotografa. Si scende.» — trasformando il vincolo di
produzione nell'argomento della sezione.

Quando il cliente fornirà gli scatti dei tunnel, la sezione torna un archetipo
A senza toccare nient'altro: cambia il componente, non il ritmo, perché A e D
in registro *monumento* hanno la stessa densità.

### 10.2 Il grading: come sono stati scelti i numeri

I valori dello specifica erano `contrast(1.08) saturate(0.92) brightness(0.95)`,
con l'istruzione di calibrarli sulle foto reali. Sono stati calibrati
**misurando**, non guardando: le 14 fotografie scelte sono state disegnate su
canvas in Chromium headless applicando ogni catena candidata come `ctx.filter`,
e per ciascuna si sono calcolati i percentili di L\* (CIELAB, D65) e la croma
media C\*.

Il corpus grezzo, prima di qualsiasi intervento:

| metrica | valore |
|---|---|
| L\* p02 / p05 | 2.5 / 4.8 |
| L\* mediana | 50.1 |
| L\* p95 / p99 | 85.3 / 92.0 |
| croma media C\* | 19.3 |

Il fondo tufo `#1A1512` vale **L\* 6.6**. Da qui i tre obiettivi, dichiarati
prima di scegliere: saturazione giù di circa il 10–14 % (le foto di cibo sono
sature come un menù da fast food), luminanza mediana verso i 44 (le foto devono
*appartenere* al fondo, non galleggiarci sopra), e nessuna alta luce bruciata.

Il risultato inatteso della misura è che **il filtro da solo non basta, e il
problema non è quello che sembrava**. Applicando la catena dello specifica il
fondo ombre scende a L\* p02 = 1.2, cioè **sotto** il livello della parete: la
fotografia non si posa sul tufo, ci apre un buco. E i fondi ombre delle
quattordici foto restano fra loro incoerenti (da 0.3 a 11.7 di p02), perché
sono scatti di sessioni diverse.

Da qui il terzo strato, che nella specifica non c'era:

| strato | cosa fa |
|---|---|
| **grade** | `contrast(1.10) saturate(0.90) brightness(0.94)` sull'`<img>` |
| **lift** | tufo in `mix-blend-mode: lighten` al 70 % — porta il fondo ombre di *ogni* foto sullo stesso livello |
| **velo** | tufo in `normal` al 6 % — incolla la temperatura al fondo |

Confronto delle candidate misurate (medie sul corpus):

| catena | p02 | p50 | p99 | C\* | ΔC |
|---|---|---|---|---|---|
| grezza | 2.5 | 50.1 | 92.0 | 19.3 | — |
| specifica + velo 6 % | 1.2 | 44.6 | 85.7 | 17.3 | −10.1 % |
| 1.10/0.90/0.94 + velo 6 % + **lift 70 %** | **4.9** | **44.1** | **85.5** | **16.7** | **−13.2 %** |
| 1.10/0.90/0.94 + velo 6 % + lift 80 % | 5.6 | 44.1 | 85.5 | 16.8 | −13.0 % |
| 1.12/0.88/0.92 + velo 6 % + lift 75 % | 5.2 | 43.1 | 84.4 | 16.3 | −15.5 % |

La riga scelta è la terza. Il p02 medio passa da 2.5 a 4.9 — sotto il tufo, ma
di poco: quel margine residuo è ciò che impedisce alla fotografia di sembrare
incollata piatta sulla parete. Il dato più importante però è per-foto: dopo il
lift **quasi tutte le immagini hanno lo stesso fondo ombre, intorno a 4.5**.
Tre fotografi diversi, un solo nero. È il lift, più del filtro, a fare del
corpus un corpo unico — ed è l'unica cosa in questo step che non si sarebbe mai
trovata a occhio.

I cinque numeri sono token in `globals.css` (`--foto-contrasto`,
`--foto-saturazione`, `--foto-luminosita`, `--foto-lift`, `--foto-velo`).

### 10.3 I crop: quali e perché

`aspect-ratio` è una **prop obbligatoria** di `Figure`. Nessuna immagine è usata
a proporzione nativa «perché è così che è», e ogni `object-position` è scelto
sul soggetto — con un override sotto i 768 px dove il ritaglio si stringe.

| immagine | rapporto | perché |
|---|---|---|
| sala col bancone → hero | 21/9 | la fessura cinematica; l'ambiente è profondo e il taglio orizzontale lo allunga |
| la squadra in via | **3/2** | *l'eccezione motivata*: è un ritratto di gruppo, e il 4/5 taglia le persone ai due bordi. Il nativo qui è una scelta, non inerzia |
| archivio Ercolani (inserto) | 3/2 | è un documento: si mostra come è stato scattato |
| calice inciso | 4/5 | verticale, intimo — è l'unico scatto nativo verticale del corpus |
| tagliere (dominante griglia) | 3/2 | il rapporto più largo della griglia: è la cella che comanda |
| pecorini | 4/5 | verticale in una griglia orizzontale: irregolarità voluta |
| pasta | 1/1 | cella di griglia, la più piccola |
| mani al bancone | 16/9 | fascia bassa, chiude la griglia |
| facciata 101 | 16/9 | è una via: il rapporto della strada |
| facciata 72 | 4/5 | anta piccola del dittico; il verticale ne accentua la subordinazione |

Due `object-position` sono stati corretti dopo averli guardati, non prima:
il **calice** stava al 34 % verticale e l'inquadratura conteneva soprattutto
cielo — portato al 66 %, che è dove sta il calice; la **facciata 72** era al
62 % orizzontale, cioè su muro cieco — portata al 78 %, dove ci sono la porta e
l'insegna.

Nota tecnica utile per lo Step 4: su una sorgente 3/2 ritagliata in 16/9 il
ritaglio è **solo verticale**, e la componente orizzontale di `object-position`
non ha alcun effetto. Vale per entrambe le facciate.

### 10.4 Duotone: adottato, come registro d'archivio

Il duotone è adottato, e la regola di appartenenza è **una sola**:

> Una fotografia che non documenta il presente non può stare a colori accanto a
> una che lo fa.

Non «le immagini secondarie», non «le facciate e i bicchieri»: quei criteri
sono estetici, e un criterio estetico applicato a metà è esattamente
l'incidente da evitare. Il criterio adottato è invece verificabile guardando lo
scatto: documenta oggi, sì o no.

Oggi l'archivio contiene **una sola fotografia**, quella della famiglia sul
carro. Un sistema di uno non è un sistema debole se la regola è chiara: è un
sistema con un solo membro, e chiunque aggiunga materiale d'archivio sa già
come va trattato senza doverlo chiedere.

Implementazione: `registro: "archivio"` nel registro fotografico attiva
`filter: url(#duotone-archivio)`, un `feColorMatrix` di luminanza percettiva
seguito da un `feComponentTransfer` che mappa le ombre su `--tuff-deep` e le
luci su `--brass`. I sei `tableValues` **non sono colori scelti lì**: sono le
componenti sRGB dei due token, e la loro parità è verificata da
`scripts/audit.mjs` (controllo 5). Se qualcuno cambia l'ottone nel design
system e non aggiorna il filtro, l'audit fallisce.

### 10.5 Stratificazione e leggibilità

Le quattro tecniche, in ordine di impatto:

**Occlusione a tre livelli** (dittico dei locali). Sotto: un filetto d'ottone
con la via in mono, che parte *dentro* la fotografia e riemerge sul tufo alla
sua destra. In mezzo: la fotografia. Sopra: il civico `101` a `--t-hero` in
ottone, che esce dal bordo basso e continua sul fondo. Tre piani in un colpo
d'occhio, zero WebGL.

Tre correzioni sono state necessarie e sono istruttive.
*Prima*: il numero era ancorato alla colonna — che contiene anche il paragrafo
sotto — e finiva in fondo al testo senza toccare niente. Ora i tre livelli
vivono in un contenitore attorno alla sola immagine.
*Seconda*: le cifre di Cormorant sono minuscole (oldstyle) di default e il loro
inchiostro sta molto più in basso della scatola di riga, il che faceva
sbagliare il segno a ogni offset calcolato sulle metriche. Sono state portate a
`lining-nums` — un civico è una targa, non una parola.
*Terza*: il filetto collideva con l'anta piccola, che gli passava sopra. È
stato alzato sopra il suo bordo.

Resta un **limite noto e non risolto in CSS**: nella fotografia che il cliente
possiede oggi l'angolo in basso a sinistra del 101 è selciato chiaro, e
l'ottone lì sopra perde contrasto (misurato 1.37:1 sul pixel peggiore).
Spostare il numero a un terzo della base lo rende più leggibile ma gli toglie
l'ancoraggio all'angolo, che è la ragione per cui sta lì: provato, guardato,
scartato. La correzione vera è uno scatto con l'angolo basso in ombra, ed è una
richiesta per il servizio fotografico. Il numero è `aria-hidden` e il civico è
comunque scritto in chiaro sotto: è un difetto di composizione, non di
accessibilità.

**Parallasse differenziale.** L'immagine a intensità 1, il blocco tipografico a
0.4. Il differenziale è ciò che il cervello legge come distanza. È servito un
componente nuovo, `ParallaxShift`: il `Parallax` dello Step 01 posiziona il
contenuto in assoluto dentro una scatola più alta — giusto per una fotografia
in un contenitore dimensionato, ma su un blocco di testo ne farebbe collassare
l'altezza a zero.

**Bordi fuori griglia.** Tre sezioni rompono il `max-width: 1440px`: l'hero, il
marquee e la cantina in registro monumento.

**Gradienti ambientali.** Due per pagina, non tre: uno in vino dietro la
cantina, uno in ottone dietro la risalita. Il limite non è una buona
intenzione, è il controllo 7 di `scripts/audit.mjs`, che conta i
`<AmbientGlow>` per pagina e fallisce a partire dal terzo.

**Leggibilità del testo sulle fotografie.** `scripts/leggibilita.mjs` nasconde
il testo, fotografa esattamente il suo riquadro con sotto la fotografia e i
suoi strati, e calcola il contrasto WCAG fra il colore composto del testo e il
**pixel peggiore** del riquadro (95° percentile di luminanza). Il gradiente di
leggibilità è stato irrobustito finché la prova non è passata: il titolo
dell'hero è salito da **3.00:1 a 5.89:1**, il dato in mono da **4.49:1 a
5.70:1**. Serve anche come rete per lo Step 4: le fotografie che il cliente
manderà potrebbero essere più chiare di queste, e la prova si rilancia in due
secondi.

### 10.6 Esito della verifica §7

**1 · Screenshot di ogni sezione a 1440 px, in fila. Il ritmo è visibile?**
Sì. `artifacts/step-02/strip-normale.png` mostra le undici sezioni alla stessa
larghezza e con l'altezza vera: l'alternanza fra blocchi alti e densi (hero,
cantina, cucina, locali) e bande sottili e vuote (marquee, respiro, risalita,
footer) si legge senza sforzo. Nessuna coppia consecutiva della stessa densità
(tabella §10.1).

**2 · Sfocando, emerge un solo protagonista per sezione?**
Non subito: **la griglia della cucina ne aveva due.** Con la dominante a 7
colonne su 12 e la cella alta a 4, il tagliere e il piatto di pecorini
pesavano uguale — il secondo è anche più chiaro, e sfocato vinceva. Corretto
portando il rapporto a **8 contro 3**: è la scala a fare la gerarchia, non il
rapporto né la posizione. Riverificato sfocato: un solo protagonista. Tutte le
altre sezioni passavano già.

**3 · In scala di grigi, la composizione regge senza il colore?**
Sì. Struttura, gerarchia e i tre livelli di occlusione restano leggibili senza
una goccia di bordeaux: la composizione poggia su scala e posizione, non sul
colore. L'unica perdita è quella già dichiarata al §10.5 — il civico che
attraversa il selciato chiaro sparisce quasi del tutto in grigio, che è il
sintomo dello stesso difetto misurato a colori.

**4 · Coprendo le immagini, la pagina è ancora leggibile e composta?**
Sì. `artifacts/step-02/strip-senza-immagini.png`: ogni sezione conserva il
proprio ancoraggio tipografico e la sequenza si legge ancora come una sequenza.
Le aree fotografiche diventano vuoti — è il costo onesto di un impianto
fotografico — ma nessuna sezione perde il titolo, il numero o il dato. La
cantina, che immagini non ne ha, è identica: era il punto.

**Verifiche aggiuntive, non richieste dal §7 ma dovute allo Step 01**
- **Scorrimento orizzontale**: `scrollWidth` = `clientWidth` a 1440, 768 e
  390 px. Un difetto reale è stato trovato e corretto qui: la sorgente di luce
  della risalita sbordava di 141 px dal box della sezione. La correzione sta
  nel componente — `TypeSection` monta ora il glow dentro uno strato che
  ritaglia — e non nel punto di chiamata, così chi monterà il prossimo glow non
  deve ricordarselo.
- **Movimento revocato** e **JavaScript disattivo**: testo, layout, grading e
  gradiente restano intatti (`artifacts/step-02/senza-js.png`). Il contratto di
  movimento del §5 regge anche sui componenti nuovi.
- **Mobile a 390 px**: l'inserto d'archivio non viene più nascosto. Sotto i
  768 px l'occlusione decade — due immagini sovrapposte su schermo stretto sono
  solo due immagini sovrapposte — ma l'inserto resta, in flusso sotto la prima.
  Nasconderlo avrebbe tolto al visitatore mobile l'unico documento d'archivio
  del sito per salvare un effetto.

### 10.7 Errori commessi e corretti, per memoria

- **Misure in `ch` sul contenitore invece che sull'elemento.** `max-w-[22ch]`
  su un wrapper vale il corpo del `body`, non quello del display: un ventesimo
  della misura voluta. Ogni titolo andava a capo dopo due parole. Le misure
  stanno ora sull'elemento che porta il corpo.
- **`<br />` in un messaggio next-intl.** `t.rich` vuole una coppia di tag:
  `<br></br>`. Con l'autochiusura la stringa finiva a schermo.
- **La sonda di contrasto sbagliava di suo.** Tailwind esprime le opacità in
  `oklab()`, e leggerne le componenti come canali RGB dà numeri plausibili e
  completamente sbagliati: un testo perfettamente leggibile risultava a 1.32:1.
  Il colore viene ora risolto dal browser su canvas e l'alfa composta sullo
  sfondo campionato. I numeri del titolo e del dato erano invece corretti, e
  hanno guidato una correzione vera.

### 10.8 Dati trovati durante lo spoglio, da portare allo Step 4

Non sono stati applicati — cambiare `lib/data/locali.ts` è fuori dal perimetro
di questo step — ma sono verificabili sul sito del cliente e chiudono due punti
aperti al §8:

- **La sede di Cortona esiste**: Piazza Luca Signorelli 28, 52044 Cortona (AR),
  tel. +39 0575 1890158. `SEDE_CORTONA_CONFERMATA` è oggi `false`.
- **Il numero 72 ha un telefono proprio**: +39 0578 850195. Oggi il progetto
  espone un solo recapito per entrambe le sedi.
- Email `vineriatoscana@gmail.com`, ragione sociale **La Vineria Ercolani SRL**,
  P.IVA 01551730524.

Restano non confermati, e quindi ancora `null`: profondità ed estensione dei
tunnel, gratuità del tour, anno di fondazione, orari.

### 10.9 Cosa chiedere al cliente per il servizio fotografico

In ordine di impatto sul sito:

1. **I tunnel della cantina.** È il momento visivo mancante. Finché non
   arrivano, la sezione più profonda della pagina è tipografica.
2. **Il pozzo sotto il pavimento di vetro**, al 72. Stessa ragione.
3. **Un ritratto verticale di una o due persone della casa**, non di tutta la
   squadra: le facce vendono più dei piatti, e un 4/5 su un gruppo di quindici
   persone non esiste.
4. **La facciata del 101 con l'angolo in basso a sinistra in ombra**, per il
   civico che esce dal bordo (§10.5).

---
---

# Step 03 · Movimento e fluidità

Senza 3D il movimento non può essere spettacolare, quindi deve essere
impeccabile. È un vincolo favorevole: cinque animazioni perfette si leggono
come più cura di venti approssimative, e la fluidità è un problema di coerenza
e di frame rate, non di quantità.

---

## 11. Movimento

### 11.0 Uno scostamento dichiarato

La §3.2 della specifica prevede che, durante la discesa, «la fotografia dei
tunnel entri dal basso con `RevealImage`, scalando da 1.15 a 1». Quella
fotografia non esiste: lo Step 02 ha accertato che non è nella libreria del
cliente (§10.0).

La meccanica della discesa è rimasta identica — quattro interpolazioni sullo
stesso progress — e cambia solo cosa arriva in fondo: il monumento tipografico
della cantina, che sale da sotto scalando **da 1.15 a 1** esattamente come
avrebbe fatto la fotografia. Il giorno in cui gli scatti arrivano, il quarto
blocco diventa una `<Figure>` e la coreografia non si tocca.

### 11.1 Lo scroll: i tre numeri e il loop unico

`lerp 0.085`, `wheelMultiplier 0.9`, **spento su touch**.

Il terzo non è un'ottimizzazione, è una scelta di merito: lo scroll nativo di
iOS è migliore di qualsiasi emulazione, e il rubber-band è ciò che rende
credibile il gesto. Lenis su mobile è la causa numero uno di scroll che «sembra
rotto», e qui non gira: `lib/scroll/lenis.ts` esce subito se
`(pointer: coarse)`. Verificato su iPhone 13 emulato — nessuna classe di Lenis
sulla radice.

Un solo loop: `gsap.ticker` guida `lenis.raf`, `lenis.on("scroll")` chiama
`ScrollTrigger.update`, `lagSmoothing(0)` impedisce a GSAP di comprimere il
tempo dopo un frame lungo. Senza quest'ultima riga lo scroll smooth e le
timeline legate allo scroll divergono dopo ogni intoppo, e il sintomo — una
sezione che «rimane indietro» — sembra un problema di performance e non lo è.

**Il conteggio dei loop è esposto** (`contaLoop()`) invece che assunto.

### 11.2 La discesa: perché `sticky` e non `pin: true`

È il pezzo più rischioso dello step, e l'ho dichiarato prima di scriverlo: non
per l'effetto — sono quattro interpolazioni sullo stesso progress — ma perché
è l'unico punto in cui tre sistemi che misurano il documento devono restare
d'accordo: Lenis che riscrive la posizione di scroll, ScrollTrigger che
memorizza le distanze, Framer che osserva le intersezioni.

Il pin è quindi `position: sticky`, e ScrollTrigger si limita allo `scrub: 1`.

Il pin di ScrollTrigger costruisce un pin-spacer e riscrive il layout a partire
da distanze **memorizzate**: sono esattamente le misure che diventano obsolete
quando i font finiscono di caricare, quando arriva un'immagine o quando cambia
la lingua, ed è il colpevole abituale del punto 2 del test di fluidità. Con
`sticky` la posizione la calcola il browser a ogni frame e non c'è nessun
numero da invalidare. Il `refresh()` resta agganciato a `document.fonts.ready`,
a `load`, al `ResizeObserver` sul body e al cambio di percorso — ma serve solo
allo `scrub`, non a tenere in piedi il pin.

Il ritardo è `scrub: 1` e non `true`: un secondo di smoothing è ciò che rende
il movimento burroso invece che scattoso, e assorbe il jitter della rotella
senza staccarsi dal gesto.

**Su mobile nessun pin.** Una sezione che trattiene lo scroll per tre schermate
su uno schermo da sei pollici si legge come una pagina bloccata, non come una
discesa. Resta il racconto — il fondo che si raffredda, il glow che cresce —
legato allo scroll naturale: cambia il mezzo, non la cosa.

**Il pin è condizionato al contratto di movimento**, non a un breakpoint. Le
regole che impilano i due blocchi vivono sotto `html[data-motion="on"]` in
`globals.css`: senza movimento la sezione torna un blocco normale con i due
testi uno sotto l'altro. Impilare due paragrafi che solo un'animazione separa è
contenuto che dipende dal movimento, ed è quello che il contratto dello Step 01
vieta.

### 11.3 Il difetto più grave trovato in questo step

**`RevealImage` non poteva funzionare, e funzionava per caso.**

Il componente si nascondeva con `clip-path: inset(100% 0 0 0)` sullo stesso
nodo che veniva osservato da `whileInView`. Chromium calcola l'intersezione di
un elemento **dopo** avergli applicato il proprio `clip-path`: un elemento che
si ritaglia a zero risulta grande zero, e `isIntersecting` è sempre `false`.
L'elemento si nascondeva da solo e non poteva mai essere visto entrare.

Misurato, stesso elemento e stesso osservatore:

| | `isIntersecting` | altezza dell'intersezione |
|---|---|---|
| con `clip-path` | `false` | 0 |
| senza `clip-path` | `true` | 684 |

In pratica nove immagini su dieci entravano lo stesso, vincendo una corsa fra
l'applicazione della maschera e il primo giro dell'osservatore. L'hero, la cui
maschera è applicata all'idratazione, quella corsa la perdeva sempre: la
fotografia più importante del sito restava invisibile.

La correzione è strutturale: **il nodo osservato non porta mai la maschera**.
Tre nodi — uno osservato che propaga le varianti, uno per la maschera, uno per
la scala. È lo stesso motivo per cui `SplitText` osserva il contenitore e non
le parole, ed era già scritto nei commenti dello Step 01: la lezione c'era, non
l'avevo applicata al componente nuovo.

**Perché lo Step 02 non l'aveva visto.** Tutta la verifica fotografica girava
con `reducedMotion: "reduce"`, dove `RevealImage` restituisce un `div` nudo.
Verificare solo a movimento revocato nasconde per costruzione ogni difetto di
movimento. Da qui in avanti le catture di composizione restano a movimento
revocato — è la composizione che si giudica — ma esiste una suite separata che
gira col movimento acceso.

### 11.4 Gli altri difetti trovati guardando

**Il menu era largo quanto la barra.** Il pannello `fixed inset-0` era montato
dentro la barra di navigazione, che porta `translate` per nascondersi allo
scroll. Un valore diverso da `none` su `transform`, `translate`, `rotate` o
`scale` rende quell'elemento il **blocco contenitore** dei discendenti
`position: fixed`: il menu copriva ottanta pixel in cima, col resto che
debordava sopra la pagina. È lo stesso meccanismo che la specifica cita per il
`backdrop-filter`, in un'altra veste. Il pannello vive ora in un portale sul
`body`.

**Il menu copriva il proprio pulsante di chiusura.** Risolto con un token
nuovo, `--z-nav: 60`, e non con un numero al volo: in questo sistema l'ordine
di impilamento è dichiarato in un solo posto.

**Il glow della discesa diventava un banco di nebbia.** `gsap.to(el, {opacity: 1})`
scriveva `opacity: 1` inline e cancellava lo `0.10` del token. Due nodi: fuori
l'opacità che GSAP anima, dentro quella della classe.

**Il velo della barra pagava una sfocatura invisibile.** Il `backdrop-filter`
restava montato anche a `opacity: 0`. Ora la classe viene aggiunta solo quando
il velo è visibile — è anche il modo di restare sotto il limite di due filtri
attivi insieme quando la tenda è aperta.

**La barra spariva dentro la fotografia.** Al primo schermo la barra è
trasparente per scelta, ma l'hero ha un soffitto illuminato e le voci in
`stone` ci si perdevano dentro: misurate a **4.11:1**, sotto la soglia AA, e la
lingua non attiva a 3.52:1. Aggiunta una velatura permanente — un gradiente
alto 160px, non un fondo — con i valori scelti misurando finché la voce più
debole non è passata: ora la barra sta fra **7.6 e 12.6:1** e la lingua non
attiva a 5.16:1. Protegge anche le fotografie che il cliente manderà.

### 11.4bis La sonda di contrasto sbagliava tre volte

`scripts/leggibilita.mjs` è stato scritto allo Step 02 e in questo step ha
prodotto **tre falsi allarmi consecutivi**, tutti sullo stesso testo. Vale la
pena elencarli, perché sono tre modi diversi di misurare male la stessa cosa:

1. **Misurava contenitori invece di testo.** Da quando il titolo dell'hero
   entra parola per parola, ogni parola ha due nodi che la incartano: il loro
   riquadro è più alto del glifo e il loro colore è quello ereditato. La parola
   in ottone risultava a 2.77:1. Ora si misura solo un elemento che contiene
   un nodo di testo non vuoto fra i figli diretti — l'unica definizione di
   «elemento che dipinge testo» che non lasci ambiguità.
2. **Misurava il testo contro se stesso.** La regola che nasconde i glifi
   prima della cattura elencava dei tag (`h1, h2, h3, p, span, a`) e ne
   dimenticava altri: il glifo restava nel ritaglio e finiva nel campione di
   sfondo. Ora nasconde `body, body *`.
3. **Leggeva i riquadri mentre la barra era fuori campo.** La barra si nasconde
   scorrendo in giù, e la sonda leggeva le posizioni subito dopo la scorsa di
   caricamento: tutti i testi della barra risultavano a coordinate negative,
   venivano riportati a zero e misurati contro un pezzo di pagina sbagliato.

Il costo di questi errori non è stato solo tempo: **il primo mi ha portato a
scurire la fotografia dell'hero per un difetto che non esisteva.** Le tappe del
gradiente di leggibilità erano state alzate a 96/84/46, che rendeva quasi nera
la metà inferiore dell'immagine. Con la misura corretta sono tornate a valori
intermedi (95/78/40), che portano la parola in ottone a 3.98:1 — sopra soglia
con margine, e con la fotografia ancora viva. Una sonda che sbaglia in modo
conservativo fa danni silenziosi, perché il suo errore assomiglia a prudenza.

La sonda ora copre anche ciò che sta **fuori da `main`**, cercando la
sovrapposizione geometrica con una qualsiasi fotografia invece
dell'appartenenza alla stessa sezione: la barra non è dentro nessuna
`<section>`, ed era esattamente il testo che rischiava di più.

### 11.5 Profilazione

`npm run profilo`, con Chromium reale:

| controllo | esito |
|---|---|
| ascoltatori bloccanti su wheel/touch | **3**, tutti di Lenis — è il prezzo dello smooth scroll |
| ascoltatori non passivi su `scroll` | 3, ma su `scroll` il flag è ininfluente: l'evento non è annullabile |
| `will-change` statici | **nessuno** |
| `backdrop-filter` attivi insieme | riposo 0, barra 1, menu 1 — mai 2 |
| `getBoundingClientRect` in ~2 s di scroll | **2** — nessuno misura dentro il ciclo |

`npm run fps`, rotella vera dispatchata via CDP (quindi passando per Lenis) per
dodici secondi:

| CPU | fps medi | 95° percentile | frame > 33 ms |
|---|---|---|---|
| 4× rallentata | 60.0 | 59.9 | **0.0 %** |
| 6× rallentata | 59.5 | 59.9 | 0.3 % |

Il numero che conta non è la media, che una manciata di frame buoni gonfia, ma
la coda: a 4× non c'è un solo frame saltato in milleventi.

Il conteggio dei layer compositi resta l'unica voce del §4 non automatizzata:
va guardata nel pannello Layers di un browser vero.

### 11.6 Esito del test di fluidità §5

Eseguito da `npm run fluidita`, non a occhio. Il metodo: si registra
un'impronta dello stato animato — trasformazioni, opacità, maschere, geometria,
posizione di scroll — e la si confronta dopo aver maltrattato la pagina.

| # | prova | esito |
|---|---|---|
| 1 | discesa a velocità normale | **ok** — frame peggiore 17 ms, 0 % oltre 33 ms |
| 2 | giù veloce, poi ritorno in cima di colpo | **ok** — stato identico |
| 3 | dieci giri: il decimo come il primo | **ok** — impronta stabile |
| 4 | ridimensionamento durante lo scroll | **ok** — tutto riallineato |
| 5 | cambio lingua a metà pagina e ritorno | **ok** — stato ricostruito uguale |
| 5b | immagini scavalcate da un salto | **ok** — 9 scavalcate, 9 recuperate risalendo |
| 6 | `prefers-reduced-motion` di sistema | **ok** — nessun testo nascosto, nessun pin, permesso revocato, nessuno scorrimento orizzontale |

Il punto 2 è quello che rompe la maggior parte dei siti guidati dallo scroll,
ed è anche quello che un occhio umano giudica peggio: uno scarto di venti pixel
su una sezione pinnata si vede solo se si sa già dove guardare.

**Due prove sono fallite prima di passare, e in entrambi i casi il difetto era
nel test.** La prova 4 confrontava un'impronta presa con la rotella con una
presa a colpo secco: due posizioni di scroll diverse. La posizione fa ora parte
dell'impronta, così l'errore non può ripetersi in silenzio. La prova 5
confrontava le maschere delle fotografie fra due visite con storie diverse:
un'immagine scavalcata con un salto **non deve** essere entrata, e le prove che
riguardano le misure usano ora il sottoinsieme invariante. Il recupero delle
immagini scavalcate ha una prova sua, la 5b, che prima non esisteva.

### 11.7 Mobile

`npm run mobile`, su iPhone 13 emulato: niente Lenis, niente pin (la discesa è
alta 834 px, il suo contenuto, invece di tre schermate), niente cursore
custom, nessuno scorrimento orizzontale, e l'inserto d'archivio presente.

**I ritardi sono dimezzati, le durate no.** `useMotionScale` restituisce 0.5
sotto i 768 px e scala ritardi e sfasamenti in `Reveal`, `SplitText` e nella
cronologia dell'hero. Le durate restano quelle: è la loro coerenza a dare
l'impressione di cura, mentre è la lunghezza delle sequenze a diventare un
problema su uno schermo che si scorre veloce.

### 11.8 Trade-off presi, e cosa ho semplificato

**Il marquee avanza per frame invece che con `@keyframes`.** La modulazione da
velocità di scroll richiede di cambiare passo a metà corsa, cosa che
un'animazione CSS non consente. Il costo è un `requestAnimationFrame` sempre
vivo: mitigato fermando il loop quando la banda esce dal viewport, con un
`IntersectionObserver`. La velocità è in **pixel al secondo**, non «un giro in
N secondi», altrimenti la banda correrebbe su desktop e striscerebbe su mobile.

**Il contorno del marquee ha un colore di ricaduta.** `-webkit-text-stroke` non
ha ancora un equivalente standard: dove manca, `color: transparent` renderebbe
il testo invisibile. Il ripiego — ottone al 22 % — è dichiarato prima e
sovrascritto solo dentro `@supports`.

**Il cursore custom non tocca il focus da tastiera.** Resta l'anello d'ottone
del design system, che è più visibile dell'outline nativo che sostituisce.

**La transizione di pagina non attende l'uscita prima di navigare.** Bloccare
la navigazione per aspettare un'animazione è il modo più rapido per far sembrare
lento un sito che è veloce: la tenda copre, la navigazione parte, la tenda si
ritira.

**Lo scroll lock è ovunque `lenis.stop()`**, mai `overflow: hidden` sul body.
Il debito lasciato aperto dallo Step 01 (§9) sul dialogo è saldato qui: il
dialogo su Radix usa ora lo stesso blocco del menu.

**Le ancore di navigazione passano da `lenis.scrollTo`.** Un `href="#..."`
nativo salta di colpo e scavalca lo scroll smooth, lasciando ScrollTrigger in
un punto dove non è mai passato. Senza JavaScript resta il salto del browser, e
`scroll-margin-top: 6rem` sulle sezioni evita che il titolo finisca sotto la
barra.

### 11.9 Debiti aperti verso lo Step 04

- **Il peso è cresciuto**: 252 kB di First Load JS sulla pagina di prova, contro
  i 194 dello Step 02. Sono GSAP con ScrollTrigger più Lenis. Da rivedere allo
  Step 05 con il peso reale della home.
- **Il conteggio dei layer compositi** non è automatizzato.
- **La cronologia dell'hero è vincolata all'LCP**: il titolo entra a 0.30 s con
  `SplitText`, e il testo alternativo resta nell'albero di accessibilità. Se
  Lighthouse peggiora, si riduce la sequenza — non si contratta.
- **`Magnetic` dello Step 01 non è ancora usato**: aspetta le CTA reali.


---

## 12. Contenuti, dati e interfacce di servizio (Step 04)

Lo Step 04 chiude il sito: la partitura degli archetipi diventa la pagina
vera, con il copy definitivo, la carta, la prenotazione e il footer.

### 12.1 Un conflitto nel copy, e perché non l'ho risolto da solo

Il brief chiede, per la sezione della famiglia: «Da decenni sullo stesso
corso… gli Ercolani stanno a Montepulciano da generazioni». Il sito attuale
del cliente si descrive con parole opposte: «siamo un team di giovani amici,
cresciuti insieme tra le colline toscane». `ANNO_FONDAZIONE` è `null`.

Non è una sfumatura di tono: «da decenni» è una **affermazione verificabile su
un'attività reale**, e le due fonti disponibili si contraddicono. La regola di
progetto non ammette di sceglierne una perché suona meglio.

In pagina c'è «Cresciuti su *questo* corso», che tiene la struttura e il
calore del brief e poggia solo su fatti confermati — la scala che scende in
cantina al 101, il pozzo medievale sotto il vetro al 72. La riga esatta del
brief è in `DA-VERIFICARE.md` §1, pronta da incollare quando l'anno arriva.

Stessa sorte per l'ordine delle aperture (prima la cantina, poi il 101, poi il
72), che il brief dà per noto e che nessuno ha confermato.

### 12.2 La cosa peggiore trovata: `cn()` cancellava i corpi tipografici

**È il difetto più grave dello step, ed esisteva dallo Step 01.**

`tailwind-merge` risolve i conflitti per gruppo di utilità, e non sa niente
dei token dichiarati in `@theme`. Davanti a `text-hero text-brass` non vede
una dimensione e un colore: vede due classi `text-*` dello stesso gruppo, e
tiene solo l'ultima. **Il colore vince sempre**, perché il colore si scrive
sempre dopo.

```
"font-display text-hero leading-[0.7] text-brass"
  → "font-display leading-[0.7] text-brass"        ← text-hero sparito
"font-mono text-mono uppercase text-brass"
  → "font-mono uppercase text-brass"               ← text-mono sparito
```

Nessun errore, nessun avviso, nessuna riga rossa: il testo esce
semplicemente al corpo del body. Il numero civico `101` del dittico, che deve
essere alto 108px e sbordare dalla fotografia, era **una scritta di 17px**
appoggiata all'angolo. I bottoni, che devono essere `text-label` a 12px con
tracking largo, uscivano a 17px con tracking normale.

Perché non si era mai visto: le classi scritte a mano nel JSX non passano da
`cn()` e stavano bene; solo le composizioni — e i componenti che accettano un
`className` — perdevano il corpo. E il risultato sbagliato è *plausibile*:
un bottone a 17px non sembra rotto, sembra un bottone.

Trovato guardando lo scatto della sezione dei locali e chiedendosi dove fosse
finito il numero civico. **Dal codice quella riga è corretta.**

La correzione è in `lib/utils.ts`: `extendTailwindMerge` con l'elenco dei
corpi del progetto. La regressione è impedita dal **controllo 8 di
`scripts/audit.mjs`**, che confronta i token `--text-*` di `globals.css` con
`CORPI_TESTO`: un corpo nuovo aggiunto solo al CSS fa fallire l'audit.

### 12.3 Le altre cose trovate guardando

* **L'occhiello dell'hero non veniva disegnato affatto.** `FullBleedSection`
  mostrava la testata solo con `numero && etichetta`, e l'hero non ha un
  numero — non è una voce della partitura. Un ramo mancante, non un errore
  di stile.
* **Il pulsante del menu non disegnava una croce**, disegnava un accento
  circonflesso con un puntino in mezzo. Due cause sovrapposte: senza
  `transform-box: view-box` il browser calcola `transform-origin` sul riquadro
  di ciascun tracciato invece che sul sistema di coordinate dell'SVG — e per
  una linea orizzontale quel riquadro è alto zero, quindi le due aste ruotano
  attorno a perni sbagliati e non si incrociano mai; e l'asta centrale,
  schiacciata a `scaleX: 0` con `strokeLinecap="round"`, lasciava in mezzo il
  proprio terminale tondo. Difetto dello Step 03, visibile solo a 4×.
* **Il corsivo d'accento non prendeva l'ottone** nei due respiri e nel
  monumento: la regola copriva `h1 em, h2 em, h3 em`, e quelli sono paragrafi
  composti a corpo display. Ora la regola include `[data-display] em`.
* **L'indicatore di scroll finiva sopra l'ultima riga dell'hero.** Con
  l'occhiello, il sottotitolo, due CTA e la valutazione, la pila è più alta di
  quella dello Step 02.
* **La mappa era centrata 250 metri a sud-ovest della via**, con il paese
  nell'angolo. Il riquadro era stato scelto a occhio; ora è costruito sulla
  geometria che OpenStreetMap ha di Via di Gracciano nel Corso.
* **Le etichette flottanti si sovrapponevano al contenuto dei campi** data,
  ora e numero: quei campi disegnano sempre qualcosa — «mm/gg/aaaa», «--:--»,
  il valore iniziale — e l'etichetta flottante presume un campo vuoto.

### 12.4 Il modulo di prenotazione non finge

Il modulo valida e invia a `/api/prenota`, che valida di nuovo con lo stesso
schema e inoltra a `PRENOTAZIONI_WEBHOOK`. **Quella variabile non è
configurata**: la rotta risponde 503, e l'interfaccia dice che la richiesta non
è partita e rimanda al telefono.

Non esiste un ramo che ringrazi senza aver spedito niente. Un «grazie, vi
richiamiamo» che non arriva a nessuno è la bugia più costosa che un sito di
ristorante possa raccontare: il tavolo non c'è, e l'ospite lo scopre sulla
porta.

L'orario è un campo libero e non un elenco di turni, per la stessa ragione per
cui gli orari di apertura non sono in pagina: non sono confermati, e
«19:30 / 20:00 / 21:30» dentro un menu a tendina sembra ancora più vero di una
frase.

### 12.5 Zod fuori dal browser: 91 kB

La prima versione validava col `zodResolver` di `@hookform/resolvers`, e il
First Load JS della home era **400 kB**. Zod nel bundle del client costava
circa 60 kB per validare otto campi che il browser sa già validare, e il
controllo che conta non è mai quello del client: è quello del server, che è
l'unico che nessuno può aggirare.

Lo schema Zod vive ora in `lib/data/prenotazione.server.ts` e lo importa solo
la rotta. Le costanti — minimi, massimi, la regex del telefono — stanno in un
file senza dipendenze che importano entrambi, quindi le due validazioni non
possono divergere sui numeri.

**400 kB → 309 kB.** Restano 55 kB sopra la pagina di prova dello Step 02, ed
è il prezzo di Radix (dialogo, select, checkbox) più react-hook-form.

### 12.6 La mappa: cosa fa e cosa si rifiuta di fare

L'iframe di OpenStreetMap non esiste nel DOM finché la sezione non si
avvicina, e viene montato **a tempo perso** (`requestIdleCallback`) e non nel
frame in cui la sezione entra: è un documento intero con il suo JavaScript, e
costruirlo durante lo scorrimento costava l'unico frame lungo della pagina.

Non c'è tema scuro senza chiave d'accesso: l'inversione con rotazione di tinta
è il modo standard di scurire una mappa raster, e uno strato in `color`
riporta i colori da atlante verso il tufo.

**Non c'è nessun segnaposto**, e non è una dimenticanza: le coordinate dei due
ingressi non sono confermate, e uno spillo piantato a occhio su un vicolo di
Montepulciano manda qualcuno alla porta sbagliata. I link «Indicazioni»
cercano l'indirizzo per esteso — che è il dato che conosciamo davvero.

Su puntatore grosso la mappa resta inerte finché non la si tocca: una mappa
scorrevole dentro una pagina scorrevole intrappola il pollice.

### 12.7 La barra fissa mobile

È l'elemento con più effetto sulle conversioni della pagina, e il motivo è il
contesto d'uso: chi apre questo sito da telefono è spesso in Via di Gracciano
nel Corso, e vuole il numero o la strada.

Tre comportamenti la rendono sopportabile: entra **solo dopo l'hero**, dove ci
sono già due CTA; **sparisce quando un pannello modale è aperto**, perché una
barra che galleggia sopra la carta è la prima cosa che il pollice trova e non
è quella che si stava guardando; e il footer riceve un'imbottitura pari alla
sua altezza più l'incavo del dispositivo.

La soglia d'ingresso è l'uscita dell'hero osservata, non una quota in pixel:
l'altezza dell'hero cambia con la barra di Safari.

Il conteggio degli strati aperti (`lib/ui/overlay.ts`) è un **saldo e non un
booleano**: due strati possono sovrapporsi, e chiudere il secondo non deve
riportare in scena la barra mentre il primo è ancora lì.

### 12.8 La carta: due componenti travestiti da uno

Sotto 768px è un foglio che sale dal basso e si chiude con lo stesso gesto con
cui è arrivato; sopra, una finestra centrata. Non è il `Dialog` condiviso
perché sono davvero due cose diverse, e travestirle costa più codice
condizionale di quanto ne risparmi.

`overscroll-contain` sul corpo scorrevole: senza, arrivare in fondo alla lista
trascina la pagina sotto, e chiudendo il foglio ci si ritrova altrove.

I filtri sono **una riga che scorre** sotto 768px e **una riga che va a capo**
sopra: su desktop lo scorrimento nascondeva l'ultimo filtro dietro il bordo
senza che niente lo annunciasse.

I punti di guida si allineano all'**ultima** riga del nome e non alla prima:
su 390px i nomi vanno a capo spesso, e un prezzo allineato alla prima riga
sembra il prezzo di mezzo piatto.

I prezzi mancano davvero, quindi la riga lo dice invece di mostrare uno zero.

### 12.9 Tag dietetici: l'unica parte di questo sito che può fare male

`TAG_CONFERMATI = false`. Sono marcati `vegetariano` solo i piatti in cui la
carne non compare in nessuna versione conosciuta della ricetta. **Nessun
piatto è marcato senza glutine**: non lo sappiamo, e chi filtra per quel tag
lo fa per necessità medica, non per preferenza.

La nota in fondo alla carta — «Allergie e intolleranze: parlatene con noi al
tavolo, prima di ordinare» — non è una formula di rito: finché i tag non sono
confermati è l'unica versione onesta di un filtro dietetico.

### 12.10 L'inglese dell'hero

«Sopra la tavola, sotto la storia» tradotto parola per parola non funziona:
«Above the table, below the history» è più lungo, più piatto e perde il
chiasmo. In pagina c'è **«The table above, the history below»** — stessa
figura, stessa lunghezza di riga, accento sulla stessa parola, e due righe a
1440px esattamente come l'italiano.

### 12.11 Esito delle verifiche

| prova | esito |
|---|---|
| `npm run pagina` — 390 e 1440, it ed en | 6/6 |
| `npm run contrasto` — WCAG sui testi su fotografia | 24/24 |
| `npm run audit` — regole di progetto | 8/8 |
| `npm run fluidita` — il test §5 dello Step 03 | 10/10 |
| `npm run profilo` | 4/4 |
| `npm run mobile` | 6/6 |
| `npm run fps` — CPU 4× | 59.8 fps medi, 0.3% di frame saltati |

L'hero ha richiesto un **secondo gradiente di leggibilità, orizzontale**:
l'occhiello stava a 1.25:1 e la parola accentata «storia» a 2.37:1. Alzare
ancora le tappe del gradiente verticale avrebbe spento la fotografia su tutta
la larghezza, mentre il testo occupa solo la metà sinistra. Il gradiente
laterale scurisce dove il testo c'è davvero e lascia intatto il lato destro —
che in questa fotografia è la parete di bottiglie, cioè la parte che vale.
Dopo: **4.64:1** e **4.27:1**.

Il fps scende appena rispetto allo Step 03 — da 60.0/0.0% a 59.8/0.3% — e il
colpevole è identificato: l'iframe della mappa. Prima di montarlo a tempo
perso la prova 1 della fluidità falliva con un frame da 100ms e il 2.4% di
frame saltati; ora il frame peggiore resta 100ms ma capita una volta sola
(0.4%), perché non cade più dentro una sequenza di scorrimento. Un documento
di terze parti costruito nella stessa pagina si paga comunque, e questo è il
prezzo misurato.

### 12.12 Difetti dei test corretti, di nuovo

Le prove 4 e 5 della fluidità fallivano con un riferimento preso in fondo al
documento invece che a metà discesa. La causa: **Lenis sincronizza la propria
posizione con quella del documento solo quando non sta già animando**.
`window.scrollTo` chiamato mentre Lenis è in corsa viene ignorato — Lenis
prosegue verso il proprio bersaglio.

Non si vedeva sulla pagina di prova dello Step 02 solo perché era più alta
della corsa della prova 1, e Lenis faceva in tempo a fermarsi da solo. Ora
ogni posizionamento a colpo secco è preceduto da un'attesa di quiete.

È il terzo step di fila in cui una prova fallita era colpa del test. Vale la
pena scriverlo: **una suite che non è mai in torto misura se stessa.**

### 12.13 Debiti aperti

* **First Load JS a 309 kB.** Radix Select da solo vale ~25 kB per un menu a
  due voci: un `<select>` nativo stilizzato coprirebbe il caso.
* **Il footer ha una colonna vuota** finché social e partita IVA sono `null`.
* **JSON-LD**: `restaurantJsonLd` esiste dallo Step 01 e non è ancora montato
  in pagina. Con orari e coordinate confermati diventa completo — è materia
  dello Step 05.
* **La cantina resta tipografica** finché non arrivano le due fotografie
  critiche. Vedi `FOTOGRAFIE-DA-FARE.md`.

---

## 13. Sottrazione (Step 06)

Questo step non ha aggiunto niente. Ha tolto i **tic**: elementi che sembrano
intenzionali mentre li scrivi e sanno di template appena li vedi montati.

Il criterio applicato: *se un elemento potrebbe stare identico su un sito
completamente diverso senza che nessuno se ne accorga, va tolto.*

### 13.1 La numerazione delle sezioni

Via `01 — LA FAMIGLIA`, `02 — LA CANTINA`, fino a `06 — PRENOTAZIONE`.

Non era una riga di CSS: `SectionNumber` era **cablato dentro sei archetipi**
come prop obbligatoria, più un `numero="06"` scritto a mano nella
prenotazione. Il file è stato eliminato, le prop `numero` ed `etichetta` sono
sparite dalle firme di `FullBleedSection`, `EditorialSection`,
`AsymmetricGrid`, `DiptychSection`, `TypeSection` e `Descent`, e con loro
venti chiavi di messaggio in due lingue.

Se ne è andato anche il **filetto d'ottone** che il componente portava con sé,
e che era la fonte silenziosa di metà delle linee ornamentali della pagina.

Restano gli unici numeri grandi del sito: i civici **101** e **72**. Sono dati
veri dell'attività, e ora che non competono con una numerazione decorativa
valgono di più.

### 13.2 L'occhiello e la sua versione mascherata

Via `MONTEPULCIANO · DAL CUORE DEL CORSO`. Era una didascalia del titolo: il
titolo dice già tutto, e «Montepulciano» resta nel `<title>`, nella meta
description, nel sottotitolo dell'hero, nel footer e negli indirizzi.

Ma l'occhiello aveva **una seconda forma che il brief non nominava**: la riga
`dato` in mono ottone *sotto* tre sezioni — `FAMIGLIA ERCOLANI ·
MONTEPULCIANO (SI)`, `IL BRILLO · PRODUZIONE PROPRIA`, `TUNNEL MEDIEVALI ·
VISITABILI · INGRESSO DAL 101`. Stessa funzione, stesso corpo, stesso colore,
posizione opposta. Due su tre ripetevano il testo che stavano sotto.

Tutte e tre rimosse. L'unico fatto che solo la terza portava — l'ingresso è al
101 — è entrato nel corpo del testo, dove è una frase e non un'etichetta.

### 13.3 I numeri nell'hamburger

Via `01`–`06` dalle voci del menu. Le voci erano allineate rispetto al numero
con un `flex gap-6`; ora sono `block` e partono dal bordo della colonna come
tutto il resto della pagina.

Il menu sembrava spoglio dopo il taglio, e la risposta è stata scala e
respiro, non rimettere la decorazione: spaziatura da `space-y-2` a
`space-y-4 sm:space-y-6`, e le voci a **`text-hero` sotto i 768px**,
`text-h2` sopra. È l'unico posto del sito dove il corpo *cresce* su schermo
stretto, e ha una ragione: la tenda occupa tutto lo schermo per sei voci, e a
corpo h2 su 390px restava un elenco in mezzo al vuoto. Su desktop il contrario
non è possibile — sei voci da 128px sono più alte del viewport.

### 13.4 L'hero a piena altezza

Era `min-h-[88svh]`, cioè né piena né dinamica. Ora è `100dvh` con `100vh`
come ricaduta dichiarata *prima* per i browser che non conoscono `dvh`.

La differenza non è estetica: `100vh` su iOS Safari ignora la barra
dell'indirizzo e manda la CTA sotto la piega, sul dispositivo da cui arriva la
maggior parte del traffico.

**In orizzontale l'altezza piena è controproducente** e non basta liberarla:
il blocco di testo porta `pt-40 pb-32`, cioè 288px di respiro pensati per uno
schermo alto, che su un viewport da 390px valgono tre quarti dello schermo.
Sotto i 500px di altezza l'hero torna alto quanto il contenuto **e** il
respiro interno si accorcia. Da 780px a 436px.

La verifica è ora nel codice, non nell'occhio: `scripts/pagina.mjs` misura
l'hero a **390×745** — l'altezza utile reale di un iPhone con la barra
aperta — e in orizzontale a 844×390.

### 13.5 La cronologia dell'hero, ricalibrata

La sequenza partiva dall'occhiello a 0.15 e il titolo entrava a 0.30.
Togliendo l'occhiello e lasciando gli altri numeri, il primo terzo di secondo
sarebbe stato uno schermo fermo — un buco, non un'attesa.

Il titolo prende il posto e l'orario di partenza dell'occhiello, e tutto si
stringe mantenendo gli intervalli relativi:

| | prima | dopo |
|---|---|---|
| occhiello | 0.15 | — |
| titolo | 0.30 | **0.15** |
| sommario | 0.75 | 0.60 |
| azione | 0.95 | 0.80 |

### 13.6 Il puntino mediano

Undici `·` nel copy visibile, contro un budget di due. Ora sono **zero**: le
righe `dato` che ne contenevano sette non esistono più, l'indirizzo della
prenotazione usa una virgola, e il badge di stato manda a capo invece di
separare.

**Eccezione dichiarata:** il marquee ne usa uno fra una voce e l'altra. È una
banda decorativa `aria-hidden`, e senza separatore le parole si toccherebbero.
Un separatore che separa davvero non è un tic.

### 13.7 Frasi riscritte

| prima | dopo | perché |
|---|---|---|
| «Una selezione. La carta completa cambia con la stagione e ve la portiamo al tavolo.» | «Otto piatti che trovate quasi sempre. Il resto cambia con la stagione e ve lo diciamo al tavolo.» | «una selezione» vale per qualunque carta; «otto» è un numero vero |
| «…Dura meno di quanto pensiate, ed è la cosa che i nostri ospiti si ricordano più a lungo.» | «…si scende, si cammina, si assaggia. L'ingresso è al 101.» | la seconda metà era atmosfera; l'ingresso è un fatto utile |
| «Due sale a pochi passi l'una dall'altra, su Via di Gracciano nel Corso.» | «Meno di trenta numeri civici separano l'una dall'altra.» | «a pochi passi» è di tutti; la distanza fra 101 e 72 è solo nostra |
| «Un tavolo, un tagliere, un bicchiere. Il resto viene da sé.» | «Si beve quello che riposa *sotto la sala*.» | la prima funzionava per qualunque osteria; la seconda chiude l'arco verticale aperto dalla discesa |

### 13.8 Altri tagli

* **La stella** accanto alla valutazione: l'unica icona non funzionale del
  sito, accanto a un dato già scritto in lettere.
* **I trattini** davanti a ogni tratto del dittico: erano un punto elenco
  travestito da filetto.
* **Il filetto sopra i due respiri**, che se ne va con la numerazione.
* `common.scopri` — stringa orfana mai usata in pagina.

### 13.9 Quello che ho tenuto pur essendo nella lista

Le eccezioni motivate sono legittime; quelle silenziose no.

* **Il filetto del dittico** (`h-px flex-1`, DiptychSection). Sembra una linea
  ornamentale ed è il contrario: **porta il nome della via**, parte dentro la
  fotografia che ne nasconde l'inizio e riemerge sul tufo. È il livello 1
  dell'occlusione a tre piani dell'archetipo C. Toglierlo smonta la tecnica di
  profondità più forte del sito.
* **L'indicatore di scroll** dell'hero. È l'unico orpello rimasto in quella
  sezione e ha una ragione enunciabile in una frase: esiste per l'istante in
  cui l'utente non si è ancora mosso, e sparisce al primo scroll.
* **Il separatore del marquee**, per la ragione della §13.6.
* **Il glow della risalita**. Uno solo in tutta la pagina, e la sezione è
  tipografica pura: senza, quel blocco è testo su fondo piatto.

### 13.10 Densità di orpelli

Contati come orpello: occhiello, numerazione, icone decorative, badge,
divisori, linee ornamentali, glow, sottotitoli esplicativi.

| sezione | prima | dopo |
|---|---|---|
| hero | 3 | **1** — indicatore di scroll |
| famiglia | 3 | **0** |
| cantina | 4 | **0** |
| vino | 3 | **0** |
| cucina | 2 | **0** |
| locali | 4 | **1** — il filetto che porta la via |
| risalita | 2 | **1** — glow |
| prenota | 2 | **0** |
| footer | 0 | 0 |

Sei sezioni erano sopra la soglia di due. Ora **nessuna**.

### 13.11 Il test dello screenshot sostituito

Sostituendo foto e nomi propri con quelli di un altro ristorante, quali
sezioni continuerebbero a funzionare?

| sezione | cosa la lega a La Vineria | tenuta |
|---|---|---|
| hero | il titolo È il concetto verticale del posto | copy, non struttura |
| marquee | Il Brillo, Ercolani, 101, 72, i tunnel: solo nomi propri | forte |
| famiglia | la scala che scende al 101, il pozzo sotto il vetro al 72 | forte |
| **discesa** | **una sezione che si mangia da sola mentre la cantina sale: ha senso solo perché sotto questa sala c'è davvero una cantina** | **struttura** |
| vino | Il Brillo, etichetta di proprietà | forte |
| cucina | i piatti per nome, il Cantuccimisù inventato qui | copy, non struttura |
| **locali** | **i civici sono la composizione: il 101 esce dalla fotografia e finisce sul tufo** | **struttura** |
| risalita | riscritta in questo step; ora chiude l'arco verticale | copy |
| prenota | due sale, due numeri di telefono diversi | dati |

Due sezioni su nove reggono per **struttura** e non per contenuto: la discesa
e il dittico dei civici. Sono le uniche che, con altre foto e altri nomi, non
funzionerebbero affatto — ed è esattamente ciò che le rende il sito.

Le due più deboli restano **cucina** (la griglia asimmetrica starebbe su
qualunque ristorante) e **hero** (la fotografia piena è un archetipo comune).
Non le ho forzate: cambiare la griglia della cucina per renderla «più nostra»
significherebbe rompere la partitura di densità dello Step 02 per un problema
che il copy già risolve.

## 14. I controlli di modulo

Il modulo di prenotazione era l'ultimo posto del sito in cui il design system
finiva e cominciava il sistema operativo. Non per trascuratezza: `<input
type="date">`, `<input type="time">` e `<input type="number">` **non sono
vestibili**. Il loro pannello lo disegna il browser, fuori dal documento, e
nessuna regola CSS lo raggiunge. Su un sito dove il nero delle fotografie è
stato calibrato in CIELAB, un calendario azzurro di Chrome è una finestra su
un'altra applicazione.

C'era anche un problema di lingua, meno visibile e peggiore: il segnaposto di
formato del campo data — `mm/dd/yyyy` — viene dalla lingua del **browser**,
non da quella della pagina. Su un sito italiano aperto da un telefono
configurato in inglese, la data si chiedeva in americano, con giorno e mese
invertiti rispetto a come li scrive un italiano. Non è un dettaglio estetico:
è il campo in cui l'ospite dice quando viene a cena.

### 14.1 Che cosa è stato costruito

| controllo | sostituisce | perché |
|---|---|---|
| `Calendario` | `type="date"` | pannello di sistema, segnaposto nella lingua sbagliata |
| `Orario` | `type="time"` | pannello di sistema, e su alcune piattaforme il formato a 12 ore con AM/PM |
| `Contatore` | `type="number"` | le frecce native sono alte otto pixel: non tappabili col pollice |

Il **guscio** è condiviso — `components/ui/campo.ts` — e questo è il punto:
bordo, fondo, stati e etichetta flottante vivono in un posto solo. Prima
`Select` aveva l'etichetta **fuori** dal riquadro, in maiuscoletto, mentre
tutti gli altri campi la portavano dentro: due trattamenti per la stessa cosa
nello stesso modulo, che si notano subito anche senza saper dire cosa non
torna. Ora `Input`, `Select`, `Calendario`, `Orario` e `Contatore` sono lo
stesso campo con contenuti diversi.

### 14.2 Le decisioni che non sono estetiche

**Il valore non cambia formato.** Il calendario scrive `YYYY-MM-DD` e l'orario
`HH:MM`, esattamente come i controlli nativi. Lo schema del server non è stato
toccato di una riga, e un campo nascosto porta il valore ISO anche senza
JavaScript.

**Si può ancora scrivere.** Sotto ogni pannello c'è un campo di testo vero, non
un bottone travestito. Chi ha la data in testa la digita; il pannello è un
aiuto. La lettura di ciò che viene digitato usa l'ordine dei campi della
lingua attiva, ricavato da `Intl.DateTimeFormat().formatToParts()` e non da una
tabella scritta a mano: è la ragione per cui `03/04` non viene interpretato al
contrario. Una data inesistente — il 31 febbraio — viene scartata da un giro
completo di andata e ritorno, non da una tabella di giorni per mese.

**Ore e minuti, non turni di servizio.** È una decisione di contenuto: gli
orari di apertura non sono confermati dal cliente (DA-VERIFICARE.md §3), e
offrire «19:30 / 20:00 / 21:30» significherebbe pubblicare orari inventati
dentro un menu a tendina, dove sembrano ancora più veri.

**I pannelli si ribaltano.** Aperti verso il basso quando c'è spazio, verso
l'alto quando non ce n'è — e «non c'è spazio» include la **barra fissa
mobile**, che non fa parte del viewport ma copre lo stesso l'ultimo pezzo. Un
selettore d'orario la cui metà inferiore finisce dietro «CHIAMA» è un
selettore che non si usa. La misura si fa all'apertura, non al montaggio:
fra i due momenti la pagina è scorsa.

**Nessun `outline: none`.** Il campo del contatore riempie il proprio riquadro
e l'anello di focus è l'unica cosa che dice a chi naviga da tastiera dove si
trova. `scripts/audit.mjs` lo verifica.

**Il textarea cresce da solo.** La maniglia di ridimensionamento è un glifo
del sistema operativo, diverso su ogni piattaforma e impossibile da vestire.
È stata tolta e sostituita dalla funzione che la faceva desiderare.

### 14.3 La rete di sicurezza

`app/globals.css` disattiva comunque le frecce del numero e ricolora l'icona
nativa di data e ora, per il caso in cui uno di quei tipi rientri per errore.
`scripts/campi.mjs` lo verifica dall'esterno: nessun `type` con pannello di
sistema dentro `#prenota`, nessuna maniglia di ridimensionamento, **nessun
campo sotto i 16px** — sotto quella soglia iOS zooma al focus e manda in pezzi
il layout — e il pannello dell'orario sopra la barra fissa. Dodici controlli,
desktop e mobile.

### 14.4 Un errore commesso qui

Scurendo la mappa ho inserito un commento CSS **senza chiuderlo**, e il
commento si è mangiato la regola `.mappa-scura` che veniva subito dopo. Nessun
errore di build, nessun avviso: solo una mappa bianca al posto di una scura.
L'ho vista perché la misura di luminanza è passata da 0.049 a 0.67 — cioè da
«troppo chiara» a «bianca» — e un numero che peggiora di dodici volte dopo una
correzione non è mai la correzione che funziona.

La mappa era comunque troppo chiara davvero: luminanza mediana 0.049 contro
0.013 del pannello che la contiene, quasi quattro volte. Con `brightness(0.72)`
scende a 0.030 — ancora leggermente più chiara del fondo, che è giusto, perché
una mappa che sparisce nella pagina non è più una mappa.

## 15. Da una pagina a quattro

La barra portava sei link, più un bottone «Prenota» che ripeteva il sesto, più
l'hamburger che conteneva già lo stesso indice per intero: **tre modi di dire
la stessa cosa a dieci centimetri di distanza**. Restano due link, e portano a
due destinazioni che la home non contiene.

### 15.1 Perché tre pagine e non cinque

Il criterio non è editoriale, è di intento di ricerca. «Visita cantina
Montepulciano», «menu», «dove siamo» sono tre domande diverse, e una pagina
sola può rispondere bene a una. Le sezioni rimaste in home — la famiglia, il
vino — non hanno una domanda propria: chi le cerca sta già cercando il
ristorante, e trova la home. Una pagina «Il vino» conterrebbe i due paragrafi
che già stanno in home più nessuna fotografia nuova, e quattro URL sottili si
fanno concorrenza fra loro sulle stesse parole invece di aggiungere copertura.

| pagina | ragione |
|---|---|
| `/cantina` | prodotto a margine più alto, intento di ricerca proprio, oggi promosso da una sola CTA |
| `/carta` | «menu» è la domanda numero uno di chi sceglie dal telefono, e viveva dentro un pannello senza URL |
| `/locali` | ricerca locale: due indirizzi, due telefoni, due schede Google |

La home resta la partitura. Non è diventata un indice di anticipazioni: le
sezioni sono intatte, e la cantina ora ha **due** azioni — prenotare, per chi
è già convinto, e la pagina, per chi vuole sapere come funziona la visita.

### 15.2 I percorsi sono tradotti

`/it/cantina` ↔ `/en/the-cellar`, `/carta` ↔ `/menu`, `/locali` ↔ `/the-rooms`.
Chi cerca «cellar tour Montepulciano» e riceve un risultato che punta a
`/en/cantina` legge una parola che non conosce nella riga più visibile della
SERP. La chiave interna resta italiana ovunque nel codice — è il nome della
cosa — e la traduzione avviene solo all'uscita, in `i18n/routing.ts`.

### 15.3 Due difetti trovati facendolo

**Il matcher del middleware era disattivato da un escape.** In
`middleware.ts` stava scritto `"/((?!api|_next|_vercel|.*\.*).*)"` con un solo
backslash: dentro una stringa TypeScript `\.` non è un punto letterale, è una
sequenza di escape non valida che il motore riduce a `.`, cioè «un carattere
qualsiasi». Il matcher diventava «escludi ogni percorso lungo due caratteri o
più» — **il middleware girava solo sulla radice**.

Per mesi non si è visto niente, perché le pagine con `generateStaticParams` si
risolvono da sole senza passare dal middleware. Si è visto al primo percorso
che ha *bisogno* di una riscrittura: `/en/the-cellar` rispondeva 404 mentre
`/en/cantina` rispondeva 200. È il tipo di difetto che non produce nessun
errore finché non gli si chiede il lavoro per cui esiste.

**La canonica puntava all'altra lingua.** `alternatesFor` costruiva la
canonical sempre con `defaultLocale`: ogni pagina inglese dichiarava se stessa
duplicato della corrispondente italiana. È il modo più rapido di cancellare
metà sito dall'indice. Ora ogni pagina è canonica su se stessa e le due
versioni si dichiarano parenti con `hreflang`, che è la relazione giusta fra
traduzioni. Gli URL li costruisce `getPathname`, non una concatenazione: `/en`
+ `/cantina` darebbe un indirizzo che esiste solo come redirect, e un hreflang
che punta a un redirect è un hreflang che Google ignora.

### 15.4 Decisioni minori, motivate

- **La carta vive in due posti ma in un file solo.** `ListaCarta` è usata dal
  pannello e dalla pagina: sono due lavori diversi — lo sguardo veloce in
  contesto e la destinazione che si condivide — ma è la stessa carta, e
  tenerla in due file significa che un giorno un prezzo cambierà in uno solo.
  Il pannello non è nel DOM quando è chiuso, quindi non genera contenuto
  duplicato fra `/` e `/carta`.
- **Due colonne sulla pagina della carta**, con `break-inside-avoid` sulle
  sezioni: una carta in cui «Primi» sta in fondo a una colonna e i primi
  cominciano nell'altra non è impaginata, è traboccata.
- **La fotografia della pagina cantina è la sala, non la facciata.** La
  facciata è un dehors in pieno giorno, la fotografia più chiara del corpus:
  su una pagina che parla di gallerie fresche e buie era il soggetto sbagliato
  nel tono sbagliato. La didascalia dice comunque che quelle non sono le
  gallerie — mostrare una porta lasciando credere che sia un tunnel è la
  stessa bugia di una stock photo, solo più economica.
- **Il telefono nello schema è quello della sede.** Il 72 ha un numero suo, e
  un `Restaurant` che li dà entrambi come 850153 fa squillare la sala
  sbagliata a chi chiama dal risultato di ricerca.
- **`sitemap.ts` e `robots.ts`**, con le pagine di lavoro escluse da entrambi:
  una sitemap che elenca pagine `noindex` è un segnale contrastante.
