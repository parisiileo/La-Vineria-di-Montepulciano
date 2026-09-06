"use client";

// Fattore di scala dei ritardi, non delle durate.
//
// Su schermo stretto si scrolla molto più veloce che con una rotella: una
// sequenza che si esaurisce dopo un secondo arriva quando l'utente è già alla
// sezione successiva, e l'unica cosa che vede è un blocco che compare a metà.
// Le durate restano quelle — è la loro coerenza a fare l'impressione di cura —
// mentre i ritardi e gli sfasamenti si dimezzano.

import { useEffect, useState } from "react";

const SOGLIA = "(max-width: 767px)";

export function useMotionScale(): number {
  const [stretto, setStretto] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(SOGLIA);
    const sync = () => setStretto(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return stretto ? 0.5 : 1;
}
