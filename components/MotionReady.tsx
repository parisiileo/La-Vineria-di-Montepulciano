"use client";

// Conferma al runtime che React ha idratato e che il compositore è vivo.
// Disarma il failsafe da 2 secondi dello script bloccante, e ne arma un
// secondo che copre un caso che l'idratazione da sola non intercetta.

import { useEffect } from "react";

/** Entro quanto un rAF deve arrivare perché il movimento sia considerato vivo. */
const RAF_DEADLINE_MS = 1200;

export function MotionReady() {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-hydrated", "on");

    // Esistono contesti in cui React idrata correttamente ma il ciclo di
    // rendering è sospeso: webview incorporate, tab throttlate, strumenti di
    // cattura, pannelli di anteprima senza compositing. Lì requestAnimationFrame
    // non arriva mai, quindi nemmeno gli IntersectionObserver di Framer, e ogni
    // elemento in attesa di entrare resterebbe nascosto per sempre.
    // Se entro la scadenza non è arrivato un frame, si revoca il permesso di
    // animare: il guard in globals.css riporta tutto visibile.
    let painted = false;
    const frame = requestAnimationFrame(() => {
      painted = true;
    });
    const timer = window.setTimeout(() => {
      if (!painted) root.removeAttribute("data-motion");
    }, RAF_DEADLINE_MS);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      root.removeAttribute("data-hydrated");
    };
  }, []);

  return null;
}
