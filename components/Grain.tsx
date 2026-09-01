// Grana globale del tufo. feTurbulence inline: pesa zero, è nitida a ogni DPR
// e non richiede una richiesta di rete. Senza di lei il fondo scuro sembra un
// pannello invece di una parete.

export function Grain() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none fixed inset-0 z-(--z-grain) h-full w-full mix-blend-overlay"
      style={{ opacity: "var(--grain-opacity)" }}
    >
      <filter id="grain-turbulence" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
        {/* feTurbulence produce anche l'alpha in modo casuale: il rettangolo
            resterebbe quasi trasparente e su un fondo scuro non comparirebbe
            nulla. Si forza l'alpha a 1 e si ricentra la distribuzione dei
            grigi su ~120 con sigma 54: `overlay` è neutro a 128, quindi un
            rumore centrato altrove laverebbe il fondo invece di modularlo. */}
        <feComponentTransfer>
          <feFuncR type="linear" slope="1.9" intercept="-0.72" />
          <feFuncG type="linear" slope="1.9" intercept="-0.72" />
          <feFuncB type="linear" slope="1.9" intercept="-0.72" />
          <feFuncA type="linear" slope="0" intercept="1" />
        </feComponentTransfer>
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-turbulence)" />
    </svg>
  );
}
