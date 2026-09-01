// Calcola i rapporti di contrasto WCAG 2.1 delle coppie di token della palette.
// Uso: node scripts/contrast.mjs   —  rieseguire dopo ogni modifica ai colori in app/globals.css
const hex = h => h.replace('#','').match(/../g).map(x => parseInt(x,16)/255);
const lin = c => c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)**2.4;
const L = h => { const [r,g,b] = hex(h).map(lin); return 0.2126*r + 0.7152*g + 0.0722*b; };
const ratio = (a,b) => { const [x,y] = [L(a),L(b)].sort((m,n)=>n-m); return (x+0.05)/(y+0.05); };

const C = {
  'tuff-deep':'#14100D','tuff':'#1A1512','tuff-light':'#241D18','tuff-raised':'#2E2620',
  'wine-deep':'#4A0E1C','wine':'#7B1E2B',
  'brass':'#B08D57','brass-dim':'#8A6E43',
  'cream':'#F4EFE6','stone':'#C9BFB2','stone-dim':'#8F857A',
};
const pairs = [
  ['cream','tuff',4.5],['cream','tuff-deep',4.5],['cream','tuff-light',4.5],['cream','tuff-raised',4.5],
  ['stone','tuff',4.5],['stone','tuff-deep',4.5],['stone','tuff-light',4.5],['stone','tuff-raised',4.5],
  ['stone-dim','tuff',4.5],['stone-dim','tuff-light',4.5],['stone-dim','tuff-raised',4.5],
  ['brass','tuff',4.5],['brass','tuff-light',4.5],['brass','tuff-raised',4.5],
  ['brass-dim','tuff',4.5],['brass-dim','tuff-light',4.5],
  ['cream','wine',4.5],['cream','wine-deep',4.5],
  ['brass','wine',3.0],['stone','wine',4.5],
];
const pad = (s,n) => String(s).padEnd(n);
console.log(pad('FG',12)+pad('BG',12)+pad('RATIO',9)+pad('AA 4.5',8)+pad('AA-large 3.0',14)+'ESITO');
console.log('-'.repeat(70));
for (const [fg,bg,target] of pairs) {
  const r = ratio(C[fg],C[bg]);
  const ok45 = r >= 4.5, ok3 = r >= 3;
  const esito = r >= target ? 'PASS' : (ok3 ? 'SOLO TESTO GRANDE' : 'FAIL');
  console.log(pad(fg,12)+pad(bg,12)+pad(r.toFixed(2)+':1',9)+pad(ok45?'si':'no',8)+pad(ok3?'si':'no',14)+esito);
}
