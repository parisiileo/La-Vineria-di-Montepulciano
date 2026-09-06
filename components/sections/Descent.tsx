"use client";

// LA DISCESA — il passaggio dal respiro tipografico alla cantina.
//
// È il pezzo di bravura del sito e sostituisce il movimento di camera che in
// un altro progetto avrebbe fatto una scena 3D. Quattro cose accadono insieme,
// lentamente, sullo stesso progress:
//
//   1. il testo di respiro sale ed esce dall'alto, mangiato da una maschera a
//      gradiente — come se la volta della galleria gli passasse sopra
//   2. il fondo cambia temperatura, da --tuff a --tuff-deep
//   3. un glow caldo cresce dal basso: è la lampada in fondo alla galleria,
//      resa con un gradiente invece che con una luce
//   4. il monumento della cantina sale da sotto scalando da 1.15 a 1
//
// La scala che si riduce è ciò che comunica «sto arrivando in fondo».
//
// DUE SCOSTAMENTI DALLA SPECIFICA, entrambi motivati.
//
// Il primo. La specifica prevede che al punto 3 entri «la fotografia dei
// tunnel». Quella fotografia non esiste: lo Step 02 ha accertato che non è
// nella libreria del cliente (DESIGN_NOTES §10.0). La meccanica resta identica
// — quattro interpolazioni sullo stesso progress — e cambia solo cosa arriva
// in fondo: il monumento tipografico. Il giorno in cui gli scatti arrivano, il
// blocco 4 diventa una <Figure> senza toccare la coreografia.
//
// La sovrapposizione dei due blocchi (che su desktop occupano lo stesso
// palco) è dichiarata in globals.css sotto `html[data-motion="on"]`, non con
// una classe `md:`. Senza quella condizione, con il movimento revocato i due
// testi resterebbero sovrapposti e illeggibili: il contratto dello Step 01
// dice che il contenuto non dipende mai dal movimento, e impilare due
// paragrafi è una dipendenza dal movimento come un'altra.
//
// Il secondo. Il pin è `position: sticky` e non `pin: true` di ScrollTrigger,
// che invece si limita allo scrub. Il pin di ScrollTrigger costruisce un
// pin-spacer e riscrive il layout a partire da distanze MEMORIZZATE: è
// esattamente la misura che diventa obsoleta quando i font finiscono di
// caricare o cambia la lingua, ed è il colpevole abituale del punto 2 del
// test di fluidità. Con sticky la posizione la calcola il browser a ogni
// frame, e non c'è nessun numero da invalidare. Vedi DESIGN_NOTES §11.2.

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { duration } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Lunghezza della corsa, in altezze di viewport. Sotto 2.5 la discesa è
 *  frettolosa; sopra 3.5 l'utente si chiede se la pagina si sia bloccata. */
const CORSA_VH = 3;

export interface DescentProps {
  id?: string;
  /** Il testo del respiro: la discesa parte da qui. */
  respiro: React.ReactNode;
  /** Il monumento che arriva in fondo. */
  titolo: React.ReactNode;
  sottotesto: React.ReactNode;
  /** Riga documentaria in mono. Opzionale: quasi sempre ripete il testo che
   *  sta sopra, ed è la stessa micro-etichetta della numerazione in un'altra
   *  posizione. */
  dato?: React.ReactNode;
  /** Azione della sezione. Entra con la coda, non prima: comparire mentre il
   *  titolo sta ancora salendo la trasformerebbe nel soggetto. */
  azione?: React.ReactNode;
  className?: string;
}

export function Descent({
  id,
  respiro,
  titolo,
  sottotesto,
  dato,
  azione,
  className,
}: DescentProps) {
  const corsa = useRef<HTMLDivElement>(null);
  const palco = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const scope = corsa.current;
    if (!scope) return;

    const mm = gsap.matchMedia();

    // ---------------------------------------------------------- desktop
    mm.add(
      { desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)" },
      () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: scope,
            start: "top top",
            end: "bottom bottom",
            // `scrub: 1` e non `true`: il ritardo di un secondo è esattamente
            // ciò che rende il movimento burroso invece che scattoso, e
            // assorbe il jitter della ruota senza staccarsi dal gesto.
            scrub: 1,
          },
        });

        // 1 — il respiro sale e viene mangiato dall'alto.
        tl.to(
          "[data-discesa='respiro']",
          { yPercent: -34, "--morso": "128%", ease: "none" },
          0,
        );
        // 2 — il fondo si raffredda.
        tl.to("[data-discesa='fondo']", { opacity: 1, ease: "none" }, 0);
        // 3 — la lampada in fondo alla galleria cresce dal basso.
        tl.fromTo(
          "[data-discesa='glow']",
          { opacity: 0, scaleY: 0.4 },
          { opacity: 1, scaleY: 1, ease: "none" },
          0.1,
        );
        // 4 — il monumento sale e si posa. Entra in ritardo: l'immagine (qui
        //     il titolo) deve essere già ferma quando il testo la raggiunge.
        tl.fromTo(
          "[data-discesa='monumento']",
          { yPercent: 26, scale: 1.15, opacity: 0 },
          { yPercent: 0, scale: 1, opacity: 1, ease: "none" },
          0.34,
        );
        tl.fromTo(
          "[data-discesa='coda']",
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, ease: "none" },
          0.78,
        );
      },
    );

    // ----------------------------------------------------------- mobile
    // Nessun pin: su schermo stretto una sezione che trattiene lo scroll per
    // tre schermate si legge come una pagina bloccata, non come una discesa.
    // Resta il racconto — il fondo che si raffredda e il glow che cresce —
    // legato allo scroll naturale della sezione. Cambia il mezzo, non la cosa.
    mm.add(
      { mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)" },
      () => {
        gsap.to("[data-discesa='fondo']", {
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: scope, start: "top 80%", end: "center center", scrub: 1 },
        });
        gsap.fromTo(
          "[data-discesa='glow']",
          { opacity: 0, scaleY: 0.5 },
          {
            opacity: 1,
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: scope, start: "top 70%", end: "center center", scrub: 1 },
          },
        );
        gsap.fromTo(
          "[data-discesa='monumento']",
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: duration.slow,
            ease: "power3.out",
            scrollTrigger: { trigger: "[data-discesa='monumento']", start: "top 85%" },
          },
        );
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      id={id}
      ref={corsa}
      className={cn(
        "discesa-corsa full-bleed relative isolate",
        className,
      )}
      style={{ "--corsa": `${CORSA_VH * 100}svh` } as React.CSSProperties}
    >
      <div
        ref={palco}
        className="discesa-palco relative flex flex-col justify-center overflow-hidden"
      >
        {/* Fondo che si raffredda. Un secondo strato in opacità invece di
            interpolare due `var()`: l'opacità è composita, il colore no. */}
        <div
          aria-hidden="true"
          data-discesa="fondo"
          data-motion-guard=""
          className="absolute inset-0 -z-10 bg-tuff-deep opacity-0"
        />

        {/* La lampada in fondo alla galleria. */}
        {/* Due nodi: fuori l'opacità che GSAP anima, dentro quella della
            classe. Su un nodo solo l'animazione scriverebbe `opacity: 1`
            inline e cancellerebbe lo 0.10 del token — la lampada in fondo
            alla galleria diventerebbe un banco di nebbia. Successo. */}
        <div
          aria-hidden="true"
          data-discesa="glow"
          data-motion-guard=""
          className="absolute inset-x-[-10%] bottom-[-38vh] -z-10 h-[64vh] origin-bottom opacity-0"
        >
          <div className="glow-ambientale glow-ottone size-full" />
        </div>

        <div className="discesa-scena shell w-full py-[max(var(--section-py),16vh)]">
          {/* 1 — il respiro. La maschera lo mangia dall'alto: `--morso` è la
              posizione del taglio, e va da 0% a oltre 100% perché il testo
              deve sparire del tutto, non fermarsi a metà. */}
          <div
            data-discesa="respiro"
            data-motion-guard=""
            className="relative"
            style={
              {
                "--morso": "0%",
                maskImage:
                  "linear-gradient(to bottom, transparent calc(var(--morso) - 14%), black var(--morso))",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent calc(var(--morso) - 14%), black var(--morso))",
              } as React.CSSProperties
            }
          >
            <p data-display="" className="max-w-[17ch] text-balance font-display text-h2 text-cream">
              {respiro}
            </p>
          </div>

          {/* 4 — il monumento. Su desktop è sovrapposto al respiro nello
              stesso palco: è la sovrapposizione a far leggere il passaggio
              come una discesa invece che come due sezioni in fila. */}
          <div
            data-discesa="monumento"
            data-motion-guard=""
            className="mt-24"
          >
            <p data-display="" className="max-w-[15ch] text-balance font-display text-hero text-cream">
              {titolo}
            </p>
            <div data-discesa="coda" data-motion-guard="">
              <p className="measure mt-10 text-lead text-stone">{sottotesto}</p>
              {dato ? (
                <p className="mt-10 font-mono text-mono uppercase text-brass">{dato}</p>
              ) : null}
              {azione ? <div className="mt-10">{azione}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
