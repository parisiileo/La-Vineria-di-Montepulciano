// Definizioni del duotone d'archivio. Un solo filtro per tutto il sito,
// montato una volta per pagina: due filtri diversi sarebbero due sistemi.
//
// La mappatura porta le ombre su --tuff-deep e le luci su --brass. I valori
// di `tableValues` sono le componenti sRGB esatte di quei due token, in
// [0,1]: non sono colori scelti qui, sono gli stessi del design system.
// La parità fra questi numeri e i token è verificata in scripts/audit.mjs
// (controllo 5), così non possono divergere in silenzio.
//
//   --tuff-deep  ->  20/255  16/255  13/255   =  0.0784  0.0627  0.0510
//   --brass      -> 176/255 141/255  87/255   =  0.6902  0.5529  0.3412

export function DuotoneDefs() {
  return (
    <svg aria-hidden="true" focusable="false" className="absolute size-0" data-duotone-defs="">
      <defs>
        <filter id="duotone-archivio" colorInterpolationFilters="sRGB">
          {/* Luminanza percettiva, non media aritmetica: una media dei canali
              impasterebbe i rossi del corsivo e delle etichette. */}
          <feColorMatrix
            type="matrix"
            values="0.2126 0.7152 0.0722 0 0
                    0.2126 0.7152 0.0722 0 0
                    0.2126 0.7152 0.0722 0 0
                    0      0      0      1 0"
          />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.0784 0.6902" />
            <feFuncG type="table" tableValues="0.0627 0.5529" />
            <feFuncB type="table" tableValues="0.0510 0.3412" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  );
}
