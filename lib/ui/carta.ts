// Apertura della carta, da qualunque punto del sito.
//
// La carta è un pannello e non una pagina, ma i punti che la aprono sono tre
// — la barra, la tenda del menu e la sezione della cucina — e stanno in tre
// rami diversi dell'albero. Passarsi lo stato da un antenato comune
// significherebbe farlo salire fino al layout e ridiscendere per tre strade;
// un contesto React costringerebbe a rimontare tutto ciò che sta sotto.
//
// Qui c'è un booleano con dei sottoscrittori. Il pannello è montato una volta
// sola nel layout, e chi lo apre non ha bisogno di conoscerlo.

import { useSyncExternalStore } from "react";

let aperta = false;
const iscritti = new Set<() => void>();

function notifica() {
  for (const f of iscritti) f();
}

export function apriCarta(): void {
  if (aperta) return;
  aperta = true;
  notifica();
}

export function impostaCarta(valore: boolean): void {
  if (aperta === valore) return;
  aperta = valore;
  notifica();
}

function iscrivi(f: () => void) {
  iscritti.add(f);
  return () => {
    iscritti.delete(f);
  };
}

const leggi = () => aperta;
// Sul server la carta è chiusa: l'HTML iniziale non deve dipendere da uno
// stato che esiste solo nel browser.
const leggiServer = () => false;

export function useCartaAperta(): boolean {
  return useSyncExternalStore(iscrivi, leggi, leggiServer);
}
