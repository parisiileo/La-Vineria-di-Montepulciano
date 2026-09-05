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

