"use client";

// Monta Lenis e tiene ScrollTrigger allineato al documento.
//
// Il `refresh()` non è opzionale ed è la ragione per cui questo componente
// esiste invece di due righe in un layout: ScrollTrigger memorizza le distanze
// al momento della creazione, e ogni cosa che cambia l'altezza del documento
// dopo quel momento le rende obsolete. Le tre cause reali, in ordine di
// frequenza: i font che finiscono di caricare e ricompongono i titoli, le
// immagini che arrivano, e il cambio lingua che riscrive tutti i testi.
//
// È il colpevole abituale del punto 2 del test di fluidità: si scrolla in
// fondo, si torna in cima di colpo, e una sezione pinnata resta indietro.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { creaLenis } from "@/lib/scroll/lenis";

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const distruggi = creaLenis();

    const rimisura = () => ScrollTrigger.refresh();

    // I font ricompongono i titoli: senza questo, ogni distanza calcolata
    // prima del loro arrivo è sbagliata di qualche decina di pixel.
    document.fonts?.ready.then(rimisura).catch(() => {});
    window.addEventListener("load", rimisura);

    // Le immagini arrivano dopo il `load` quando sono lazy: si rimisura anche
    // quando l'altezza del documento cambia da sola.
    const osservatore = new ResizeObserver(rimisura);
    osservatore.observe(document.body);

    return () => {
      window.removeEventListener("load", rimisura);
      osservatore.disconnect();
      distruggi?.();
    };
  }, []);

  // Cambio lingua o di pagina: i testi cambiano lunghezza, le distanze no.
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [pathname]);

  return null;
}
