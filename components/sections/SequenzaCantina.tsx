"use client";

// LA SEQUENZA DELLA CANTINA — la discesa raccontata da 205 fotogrammi.
//
// È un video, ma non è un tag <video>: un video non si può scorrere all'indietro
// con la ruota senza che il browser ricostruisca i keyframe, e un video che
// riparte da capo quando l'utente risale è esattamente ciò che rompe l'illusione
// di stare guidando la camera. Qui il fotogramma è una funzione dello scroll, e
// dello scroll soltanto: si va avanti, si torna indietro, ci si ferma a metà.
//
// TRE DECISIONI DI CARICAMENTO, tutte prese contro il caso peggiore (3G, telefono).
//
//  1. **Nessuna attesa.** Non c'è un loader che trattiene la pagina finché i 205
//     fotogrammi sono arrivati: sarebbero ~19 MB e nessuno li aspetta. Si disegna
//     il primo fotogramma appena esiste, e da lì la sezione è già usabile.
//  2. **Prima l'anteprima, poi i buchi.** La coda parte con un fotogramma ogni
//     dieci — 21 immagini, ~2 MB — e solo dopo riempie gli intervalli. Con
//     l'anteprima in memoria la sequenza è già navigabile da cima a fondo: si
//     muove a scatti di dieci, non si muove a scatti di uno, ma si muove.
//  3. **Sei richieste alla volta.** Duecentocinque `new Image()` in un frame
//     saturano la coda del browser e rimandano indietro anche il primo
//     fotogramma, che è l'unico che l'utente sta davvero aspettando.
//
// Il disegno non avviene mai dentro il callback di ScrollTrigger. ScrollTrigger
// aggiorna un indice; un rAF, al più uno per frame, decide se quell'indice è
// cambiato abbastanza da valere una `drawImage`. Sono due frequenze diverse — gli
// eventi di scroll e i frame dello schermo — e confonderle è il modo classico di
// trasformare una sequenza in una presentazione a diapositive.

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { cn } from "@/lib/utils";
import { PALETTE } from "@/lib/palette";

/** Numero di fotogrammi in public/cellar. */
export const FOTOGRAMMI = 205;

/** Il primo fotogramma, precaricato dal documento: è quello che l'utente vede
 *  nel momento in cui la sezione entra in viewport. */
export const PRIMO_FOTOGRAMMA = "/cellar/001.webp";

/** Passo dell'anteprima: un fotogramma ogni dieci. */
const PASSO_ANTEPRIMA = 10;

/** Richieste in volo contemporaneamente. Sopra 8 la coda del browser si allunga
 *  e il primo fotogramma arriva più tardi, che è l'opposto dello scopo. */
const PARALLELE = 6;

/** DPR oltre il quale il costo di `drawImage` supera il guadagno visibile: la
 *  sorgente è 1920×1080, su uno schermo 3x staremmo ingrandendo del rumore. */
const DPR_MAX = 2;

/**
 * Ridisegni al secondo, al massimo.
 *
 * Il resto della pagina — testi, scrub, scroll — continua a 60. Il tetto vale
 * solo per il canvas: ridipingerlo a schermo intero significa rimandare al
 * compositor qualche megabyte di texture, e farlo sessanta volte al secondo è
 * lavoro speso su fotogrammi che nessuno distingue.
 *
 * Onestà sulla misura: da sola questa riga NON ha spostato i frame saltati in
 * modo leggibile sopra il rumore. Resta perché il lavoro risparmiato è reale e
 * gratuito — il costo vero della sezione è la decodifica, non il disegno, e
 * quello si abbatte altrove (`passoDiCampionamento`).
 *
 * 30 e non 24: la sorgente sono 205 fotogrammi su una corsa di 400vh, cioè
 * circa un fotogramma nuovo ogni 17 pixel di scroll. A 24 un gesto rapido
 * salta abbastanza fotogrammi da far vedere lo scatto; a 30 no. Ed è la stessa
 * frequenza a cui è girata la ripresa: ridisegnare più spesso della sorgente
 * ridipinge lo stesso fotogramma due volte.
 */
const RIDISEGNI_AL_SECONDO = 30;
const INTERVALLO_MIN = 1000 / RIDISEGNI_AL_SECONDO;

const sorgente = (indice: number) => `/cellar/${String(indice + 1).padStart(3, "0")}.webp`;

/**
 * Ogni quanti fotogrammi la sequenza si ferma su questa macchina.
 *
 * Il costo dominante della sezione non è disegnare: è DECODIFICARE. Misurato
 * con una traccia CDP sotto CPU rallentata 4×, su sei secondi di scorrimento
 * il thread principale spende 2,2 s in `Decode Image` — più di ogni altra
 * voce, compresi raster e commit. La ragione è che 205 fotogrammi 1920×1080
 * fanno circa 1,7 GB di bitmap decodificate: nessuna cache del browser li
 * tiene, quindi ogni passaggio li ridecodifica.
 *
 * Il numero lo dice la misura, non l'intuito. Stessa macchina, stesso gesto,
 * `scripts/fps.mjs` a CPU rallentata 4×, servendo in rete un fotogramma ogni
 * N e lasciando che il componente si arrangi con quelli:
 *
 *     205 fotogrammi   18–24% di frame saltati (quattro prove)
 *     103 fotogrammi   15,7%
 *      21 fotogrammi   11,7%
 *     home e locali     1–4%   ← il resto del sito, per confronto
 *
 * La misura è rumorosa e va letta come una banda, non come una cifra. Il
 * verso però è netto, e regge anche con i fotogrammi vecchi da 1600×900, dove
 * la stessa scala dava 15,6% / 4,3%: meno decodifiche, meno frame persi.
 *
 * Quindi: passo 1 dove c'è margine, passo 2 dove non c'è — la metà dei
 * fotogrammi, metà della decodifica, e una sequenza che resta continua perché
 * `piuVicinoCaricato` copre i buchi. Le due spie sono grossolane e sono le
 * uniche che il browser espone; nel dubbio si sceglie il passo pieno, perché
 * una macchina veloce trattata da lenta si vede, il contrario anche.
 *
 * LA VERA CORREZIONE È NEGLI ASSET, non qui, e questo passo la rimanda
 * soltanto. I fotogrammi sono passati da 1600×900 a 1920×1080 e la sezione ha
 * perso quello che aveva guadagnato: +44% di pixel da decodificare, e i frame
 * saltati sono saliti dalla banda 12–16% a quella 18–24%. Riesportati a
 * 1280×720 costerebbero meno della metà dei pixel di adesso. A schermo intero,
 * dietro il velo, la differenza di nitidezza non si vede: quella sui frame
 * saltati sì. Vedi la nota in DA-VERIFICARE.md.
 */
function passoDiCampionamento(): number {
  if (typeof navigator === "undefined") return 1;
  const memoria = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const core = navigator.hardwareConcurrency;
  const debole = (memoria !== undefined && memoria <= 4) || (core !== undefined && core <= 4);
  return debole ? 2 : 1;
}

export interface BloccoSequenza {
  /**
   * Il titolo, come nodo e non come stringa: porta l'accento in `<em>`, che
   * la regola di globals.css rende corsivo e ottone. È l'unica gerarchia
   * dentro il blocco — qui sopra non c'è più nessuna etichetta a numerare i
   * capitoli — ed è quindi il titolo stesso a doversi far vedere.
   */
  titolo: React.ReactNode;
  sottotitolo: string;
  /** Fascia di progresso in cui il blocco è in scena: [entrata, uscita]. */
  fascia: readonly [number, number];
}

export interface SequenzaCantinaProps {
  blocchi: readonly BloccoSequenza[];
  /** Descrizione della sequenza per chi non la vede. Il canvas è decorativo: il
   *  contenuto della sezione sono i tre blocchi, che sono testo vero. */
  descrizione: string;
  className?: string;
}

export function SequenzaCantina({ blocchi, descrizione, className }: SequenzaCantinaProps) {
  const corsa = useRef<HTMLElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);

  // Ponte fra i due effetti: il movimento scrive un indice, il canvas lo legge.
  const indiceRichiesto = useRef(0);
  const richiediDisegno = useRef<() => void>(() => {});

  // ------------------------------------------------------------------ CANVAS
  // Caricamento, disegno e ridimensionamento. Vive in un effetto suo perché non
  // dipende dal movimento: anche con reduced-motion il fotogramma va disegnato.
  useEffect(() => {
    const canvas = tela.current;
    const scena = palco.current;
    if (!canvas || !scena) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const fotogrammi = new Array<HTMLImageElement | undefined>(FOTOGRAMMI);
    let indiceDisegnato = -1;
    let ultimoDisegno = 0;
    let raf = 0;
    let vivo = true;

    // Il canvas è opaco (`alpha: false`) e va riempito prima del fotogramma:
    // con un viewport più stretto di 16:9 il `cover` sborda in verticale, ma
    // l'arrotondamento a intero può lasciare una riga scoperta, e su un canvas
    // senza alpha quella riga è nera — nera vera, non tufo. Il valore si legge
    // dal token, non si scrive: `lib/palette.ts` è lo specchio del CSS.
    const fondo =
      getComputedStyle(document.documentElement).getPropertyValue("--color-tuff-deep").trim() ||
      PALETTE["tuff-deep"];

    /** Il fotogramma caricato più vicino a quello richiesto. Finché l'anteprima
     *  non è completa la sequenza salta di dieci in dieci invece di bloccarsi. */
    function piuVicinoCaricato(indice: number): number {
      if (fotogrammi[indice]) return indice;
      for (let d = 1; d < FOTOGRAMMI; d++) {
        if (fotogrammi[indice - d]) return indice - d;
        if (fotogrammi[indice + d]) return indice + d;
      }
      return -1;
    }

    /** `object-fit: cover` a mano: la sorgente è 16:9, il viewport quasi mai.
     *  Si sceglie la scala che copre il lato peggiore e si centra lo scarto. */
    function disegna(ora: number) {
      raf = 0;
      if (!vivo) return;

      // Troppo presto rispetto al ridisegno precedente: si rimanda al frame
      // dopo invece di rinunciare. Rinunciare lascerebbe il canvas fermo sul
      // fotogramma vecchio quando lo scroll si arresta proprio in questo
      // istante — l'unico caso in cui il ritardo si vedrebbe davvero.
      if (ora - ultimoDisegno < INTERVALLO_MIN) {
        raf = requestAnimationFrame(disegna);
        return;
      }

      const indice = piuVicinoCaricato(indiceRichiesto.current);
      if (indice < 0 || indice === indiceDisegnato) return;

      const img = fotogrammi[indice]!;
      const cw = canvas!.width;
      const ch = canvas!.height;
      const scala = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = img.naturalWidth * scala;
      const dh = img.naturalHeight * scala;

      ctx!.fillStyle = fondo;
      ctx!.fillRect(0, 0, cw, ch);
      ctx!.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      indiceDisegnato = indice;
      ultimoDisegno = ora;
    }

    function richiedi() {
      if (!raf && vivo) raf = requestAnimationFrame(disegna);
    }
    richiediDisegno.current = richiedi;

    function dimensiona() {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
      const w = Math.max(1, Math.round(scena!.clientWidth * dpr));
      const h = Math.max(1, Math.round(scena!.clientHeight * dpr));
      if (canvas!.width === w && canvas!.height === h) return;
      canvas!.width = w;
      canvas!.height = h;
      // Ridimensionare un canvas ne azzera il contenuto: il fotogramma corrente
      // va ridisegnato, e il confronto con l'indice precedente va disarmato.
      indiceDisegnato = -1;
      // Il ridimensionamento non aspetta il tetto: il canvas appena
      // riallocato è vuoto, e mezzo frame di nero si vede.
      ultimoDisegno = 0;
      richiedi();
    }

    // -------------------------------------------------------------- la coda
    // Prima l'anteprima (un fotogramma ogni dieci), poi tutti gli altri in
    // ordine naturale: chi scorre lentamente vede i buchi chiudersi davanti a
    // sé invece che dietro.
    const passo = passoDiCampionamento();
    const coda: number[] = [];
    for (let i = 0; i < FOTOGRAMMI; i += PASSO_ANTEPRIMA) coda.push(i);
    for (let i = 0; i < FOTOGRAMMI; i += passo) if (i % PASSO_ANTEPRIMA !== 0) coda.push(i);

    let inVolo = 0;
    const immagini: HTMLImageElement[] = [];

    function pompa() {
      while (vivo && inVolo < PARALLELE && coda.length > 0) {
        const indice = coda.shift()!;
        if (fotogrammi[indice]) continue;
        inVolo++;
        const img = new Image();
        immagini.push(img);
        img.decoding = "async";
        const finito = (ok: boolean) => {
          inVolo--;
          if (!vivo) return;
          if (ok) {
            fotogrammi[indice] = img;
            // Ogni arrivo può avvicinare il fotogramma disponibile a quello
            // richiesto: `disegna` decide da sé se c'è davvero da ridisegnare.
            richiedi();
          }
          pompa();
        };
        // Qui c'è stata una `img.decode()` prima di dichiarare pronto il
        // fotogramma, per pagare la decodifica fuori dal frame di disegno.
        // È stata tolta perché misurata: identica a `onload` sui frame saltati
        // (15,3% contro 15,6%), e in più forza in memoria bitmap che il
        // browser evinceva comunque. Una riga che non migliora niente e
        // consuma un gigabyte non è un'ottimizzazione. Il costo di decodifica
        // si abbatte decodificando MENO — vedi `passoDiCampionamento`.
        img.onload = () => finito(true);
        // Un 404 non ferma la coda: la sequenza degrada di un fotogramma.
        img.onerror = () => finito(false);
        img.src = sorgente(indice);
      }
    }

    dimensiona();
    pompa();

    // Il resize è debounced perché su desktop arriva a raffica durante il
    // trascinamento del bordo, e ogni evento costerebbe una riallocazione del
    // canvas più una `drawImage` a piena risoluzione.
    let attesa = 0;
    const alResize = () => {
      window.clearTimeout(attesa);
      attesa = window.setTimeout(() => {
        dimensiona();
        // Cambiando l'altezza del viewport cambia la corsa del pin: le distanze
        // memorizzate da ScrollTrigger vanno rifatte, non corrette.
        ScrollTrigger.refresh();
      }, 150);
    };
    window.addEventListener("resize", alResize);

    return () => {
      vivo = false;
      window.clearTimeout(attesa);
      window.removeEventListener("resize", alResize);
      if (raf) cancelAnimationFrame(raf);
      // Le richieste in volo vanno staccate: senza, i loro handler tengono in
      // vita l'array dei fotogrammi per tutta la durata del download.
      for (const img of immagini) {
        img.onload = null;
        img.onerror = null;
      }
      immagini.length = 0;
    };
  }, []);

  // ---------------------------------------------------------------- MOVIMENTO
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const scope = corsa.current;
    const scena = palco.current;
    if (!scope || !scena) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Il fotogramma non è animato direttamente: si anima un numero, ed è quel
      // numero che lo `scrub: 1` addolcisce. Arrotondare prima dello scrub
      // darebbe uno scatto a ogni cambio di valore intero.
      const testina = { fotogramma: 0 };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scope,
          start: "top top",
          end: "bottom bottom",
          // NESSUN `pin: true`. Il palco resta fermo con `position: sticky`,
          // dichiarato in globals.css, e ScrollTrigger si occupa solo dello
          // scrub. Non è una preferenza: misurato con scripts/fps.mjs a CPU
          // rallentata 4×, il pin di ScrollTrigger su questa sezione lasciava
          // indietro il 15,6% dei frame contro il 3,4% del resto del sito, e
          // il costo non era il canvas — con `drawImage` neutralizzata i frame
          // persi restavano identici. Con sticky la posizione la calcola il
          // browser a ogni frame e non c'è nessun pin-spacer da riscrivere.
          // È la stessa scelta, per la stessa ragione, della discesa in home:
          // vedi il secondo scostamento in Descent.tsx.
          //
          // Un secondo di ritardo: assorbe il jitter della ruota senza staccare
          // l'immagine dal gesto. È lo stesso valore della discesa in home.
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to(
        testina,
        {
          fotogramma: FOTOGRAMMI - 1,
          ease: "none",
          duration: 1,
          onUpdate: () => {
            indiceRichiesto.current = Math.round(testina.fotogramma);
            richiediDisegno.current();
          },
        },
        0,
      );

      // I tre blocchi, ognuno ancorato alla sua fascia di progresso. Entrata e
      // uscita sono `fromTo`: con lo scrub si scorre anche all'indietro, e un
      // `to` senza stato di partenza esplicito registrerebbe come "inizio" il
      // valore trovato al primo passaggio, cioè un valore già animato.
      blocchi.forEach((blocco, i) => {
        const righe = scena.querySelectorAll(`[data-blocco="${i}"] [data-riga]`);
        if (righe.length === 0) return;
        const [entrata, uscita] = blocco.fascia;
        const durata = 0.06;

        // Il primo blocco è già in scena quando la sezione arriva: la sua
        // entrata è un'animazione normale, non legata allo scroll. Legarla al
        // progresso lo renderebbe invisibile a progresso zero — cioè un titolo
        // che non c'è finché non si scrolla.
        if (i > 0) {
          // Stato iniziale scritto a parte, e non lasciato al `fromTo`.
          // Dichiararlo qui rende il nascondimento indipendente dall'ordine in
          // cui le animazioni vengono create: è l'ordine che aveva già
          // rimesso in scena tutti e tre i blocchi una volta, e una regola che
          // dipende dall'ordine di due righe di codice si romperà di nuovo.
          gsap.set(righe, { opacity: 0, y: 24, filter: "blur(6px)" });

          tl.fromTo(
            righe,
            { opacity: 0, y: 24, filter: "blur(6px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              ease: "power2.out",
              duration: durata,
              stagger: 0.018,
              immediateRender: false,
            },
            entrata,
          );
        }

        tl.fromTo(
          righe,
          { opacity: 1, y: 0, filter: "blur(0px)" },
          {
            opacity: 0,
            y: -18,
            filter: "blur(10px)",
            ease: "power2.out",
            duration: durata,
            stagger: 0.014,
            // SENZA QUESTA RIGA i tre blocchi sono visibili tutti insieme.
            // Un `fromTo` applica il proprio stato di partenza nel momento in
            // cui viene creato, non quando arriva il suo turno: questa uscita
            // parte da `opacity: 1`, e creandola rimetteva in scena un blocco
            // che l'entrata aveva appena nascosto. Il difetto era invisibile
            // finché c'era un `overwrite: "auto"` a spegnerlo per caso.
            immediateRender: false,
          },
          Math.max(entrata + durata, uscita - durata),
        );
      });

      // Entrata del primo blocco, sganciata dallo scroll.
      const intro = gsap.fromTo(
        scena.querySelectorAll('[data-blocco="0"] [data-riga]'),
        { opacity: 0, y: 24, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1,
          ease: "power2.out",
          stagger: 0.08,
          overwrite: "auto",
        },
      );

      return () => {
        intro.kill();
      };
    });

    // Con reduced-motion non si crea nessun trigger: il canvas resta al
    // fotogramma zero, i tre blocchi sono impilati in flusso normale e la
    // sezione è alta quanto il suo contenuto. La regola di layout sta in
    // globals.css sotto `html[data-motion="on"]`, non qui.

    return () => mm.revert();
  }, [blocchi]);

  return (
    <section
      ref={corsa}
      aria-label={descrizione}
      className={cn("cantina-corsa relative isolate", className)}
    >
      <div ref={palco} className="cantina-palco">
        <canvas
          ref={tela}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 block h-full w-full bg-tuff-deep"
        />

        {/* Senza JavaScript non c'è nessun canvas da riempire: resta un
            fotogramma vero, non un rettangolo nero con del testo sopra. */}
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PRIMO_FOTOGRAMMA}
            alt={descrizione}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </noscript>

        {/* Vignettatura e velo di leggibilità in un solo strato: due gradienti
            sulla stessa proprietà costano un nodo, non due. */}
        <div aria-hidden="true" className="cantina-velo pointer-events-none absolute inset-0" />

        <div className="relative z-10 flex h-full flex-col justify-center gap-(--section-py)">
          {blocchi.map((blocco, i) => {
            const Titolo = i === 0 ? "h1" : "h2";
            return (
              <div
                key={i}
                data-blocco={i}
                className="cantina-testo shell flex w-full flex-col justify-center"
              >
                {/* Due misure diverse e non una sola: il titolo si spezza in
                    due o tre parole per riga — è così che un display alto
                    ottanta pixel resta un'immagine e non una frase — mentre
                    il sottotitolo a 24ch diventerebbe una colonna di sette
                    righe corte, che si legge peggio di quanto sembri. */}
                <div>
                  {/* Il titolo apre il blocco. Sopra non c'è più la riga in
                      mono che numerava i capitoli: era un appoggio, e un
                      titolo che ha bisogno di essere annunciato è un titolo
                      che non regge da solo. Quello che prima faceva
                      l'etichetta — dare all'occhio un punto d'ingresso e un
                      tocco d'ottone — lo fa ora l'accento dentro il titolo.

                      `leading-[0.86]`: sotto un'etichetta il titolo poteva
                      permettersi l'interlinea di sistema, perché il blocco
                      aveva già una massa sopra di sé. Da solo su una
                      fotografia deve chiudersi: due righe strette si leggono
                      come un oggetto unico, due righe larghe come due frasi. */}
                  <Titolo
                    data-riga=""
                    data-motion-guard=""
                    className="max-w-[13ch] text-balance font-display text-hero leading-[0.86] text-cream"
                  >
                    {blocco.titolo}
                  </Titolo>
                  {/* Più distanza di prima fra titolo e sottotitolo: tolto un
                      elemento dal blocco, è lo spazio a dover dire che sono
                      due livelli diversi e non due paragrafi. */}
                  <p
                    data-riga=""
                    data-motion-guard=""
                    className="mt-10 max-w-[38ch] text-lead text-stone"
                  >
                    {blocco.sottotitolo}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
