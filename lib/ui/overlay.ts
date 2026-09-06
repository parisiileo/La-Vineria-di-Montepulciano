// Contatore degli strati modali aperti.
//
// Serve a una cosa sola: la barra fissa mobile deve sparire quando la tenda
// del menu o la carta sono aperte. Senza, resta appiccicata sopra un pannello
// che occupa tutto lo schermo, e la prima cosa che il pollice trova non è il
// contenuto del pannello ma un bottone di un'altra schermata.
//
// È un contatore e non un booleano perché due strati possono sovrapporsi —
// la carta aperta e poi un select di Radix — e chiudere il secondo non deve
// riportare in scena la barra mentre il primo è ancora lì.

import { useSyncExternalStore } from "react";

let aperti = 0;
const iscritti = new Set<() => void>();

function notifica() {
  for (const f of iscritti) f();
}

/** Da chiamare all'apertura e alla chiusura di ogni strato modale. */
export function segnalaOverlay(aperto: boolean): void {
  aperti = Math.max(0, aperti + (aperto ? 1 : -1));
  notifica();
}

function iscrivi(f: () => void) {
  iscritti.add(f);
  return () => {
    iscritti.delete(f);
  };
}

const leggi = () => aperti > 0;
// Sul server non c'è nessuno strato aperto: l'HTML iniziale non deve
// dipendere da uno stato che esiste solo nel browser.
const leggiServer = () => false;

export function useOverlayAperto(): boolean {
  return useSyncExternalStore(iscrivi, leggi, leggiServer);
}
