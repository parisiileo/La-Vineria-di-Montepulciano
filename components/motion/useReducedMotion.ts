"use client";

// Unico punto di lettura della preferenza di movimento ridotto.
// Consultato da ogni componente animato: non è opzionale.

import { useReducedMotion as useFramerReducedMotion } from "motion/react";

/** `true` se l'utente ha chiesto meno movimento. Durante l'SSR vale `false`,
 *  ma il contenuto è comunque protetto dal guard CSS in globals.css. */
export function useReducedMotion(): boolean {
  return useFramerReducedMotion() === true;
}
