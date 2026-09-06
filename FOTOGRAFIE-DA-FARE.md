# Fotografie da fare o da chiedere

Il sito **non contiene una sola immagine segnaposto e nessuna stock photo**:
tutte le 14 fotografie in pagina sono scatti reali del cliente, recuperati
dalla sua libreria allo Step 02 e ritagliati qui a rapporti scelti.

Questo elenco è quindi di due tipi:

* **A. Soggetti che mancano.** Non esistono in libreria, e la loro assenza ha
  già cambiato il progetto: la sezione della cantina è tipografica per questo.
* **B. Scatti che esistono ma sono al limite.** Sono in pagina, funzionano, e
  un ricambio dedicato li migliorerebbe in modo misurabile.

Le dimensioni indicate sono i **pixel effettivi richiesti dallo slot a 2×**,
calcolati sulla griglia a 1440px. Sotto quella soglia `next/image` serve
comunque il file, ma su schermo Retina si vede.

---

## A · Soggetti mancanti — i due critici

### A1. I tunnel della cantina
**È la fotografia più importante che non abbiamo.** La direzione artistica la
dichiara critica, il concetto del sito è verticale — si mangia sopra, la
storia sta sotto — e la sezione 02 dovrebbe essere il punto profondo della
pagina. Senza, quella sezione è composta di sola tipografia.

* rapporto **21/9**, orizzontale · **2880 × 1234 px** minimi
* serve anche una versione **4/5 verticale** (1120 × 1400) per lo slot stretto
* soggetto: la galleria che si allontana, con una sorgente di luce IN FONDO —
  è quella luce che il movimento della discesa fa crescere dal basso
* le pareti di tufo devono leggersi come materia: luce radente, non frontale
* **niente flash diretto**: appiattisce la porosità, che è tutto il soggetto

### A2. Il pozzo medievale sotto il pavimento di vetro, al 72
È il fatto più singolare delle due sale ed è oggi raccontato solo a parole.

* rapporto **4/5**, verticale · **1120 × 1400 px** minimi
* soggetto: lo sguardo dentro il pozzo attraverso il vetro, con un pezzo di
  sala attorno — deve leggersi che ci si mangia sopra, non che è una teca
* la sfida è il riflesso sul vetro: scattare con la sala in penombra e una
  luce dentro il pozzo, o con un polarizzatore

Finché non arrivano, **nessuna sezione le simula.** La regola del brief è
esplicita e la applichiamo: meglio una sezione di sola tipografia ben composta
che una foto generica di una cantina qualsiasi.

---

## B · Scatti in pagina che meritano un ricambio

### B1. Ritratto della famiglia — `squadra-in-via.jpg`
Oggi: 2048 × 1366, orizzontale, tutta la squadra in fila davanti al locale.
In pagina è **ritagliata a 4/5**, perché un ritratto verticale tiene l'occhio
molto più a lungo di una veduta larga: il ritaglio funziona, ma butta via metà
inquadratura e due persone finiscono sul bordo.

* serve uno scatto **nativo 4/5** · **1120 × 1400 px**
* soggetto: **una o due persone**, non il gruppo intero. Le facce vendono più
  dei piatti, e un gruppo di quindici non è una faccia — è un logo di squadra
* in sala o sulla soglia, luce ambiente, sguardo in macchina

### B2. Facciata del 101 — `facciata-101.jpg`
Oggi: 2048 × 1366, usata a **16/9** nel dittico.

* meglio uno scatto con **l'angolo in basso a sinistra in ombra**: lì passa il
  numero civico in ottone a corpo display, che esce dal bordo dell'immagine e
  prosegue sul tufo. Su un angolo chiaro quell'occlusione perde forza
* **2880 × 1620 px**

### B3. Facciata del 72 — `facciata-72.jpg`
Oggi **900 × 500**: è il file più piccolo del corpus, e nello slot 4/5 del
dittico viene ingrandito oltre la sua risoluzione nativa.

* rapporto **4/5** · **1120 × 1400 px**
* è anche l'occasione per far entrare nell'inquadratura l'insegna e la porta,
  che oggi stanno tutte sul lato destro (`fuoco: "78% 50%"`)

### B4. Il Cantuccimisù
Il piatto d'autore ha una scheda in carta e **nessuna fotografia**. È l'unico
piatto con un nome che la gente ripete: merita di occupare la cella dominante
della griglia della cucina, oggi tenuta dal tagliere.

* rapporto **3/2** · **1780 × 1187 px**
* piatto singolo, fondo scuro, luce laterale

### B5. La bottiglia de «Il Brillo»
La sezione 03 parla dell'etichetta di casa e mostra un calice inciso. La
bottiglia, **fotografata e non modellata in 3D**, chiuderebbe il discorso.

* rapporto **4/5** · **1120 × 1400 px**
* etichetta leggibile, fondo di tufo o di parete, niente riflessi da studio

---

## Specifiche comuni

* consegna in **JPEG di qualità massima o RAW**: la compressione la fa la
  pipeline (`next/image` produce AVIF e WebP)
* **niente ritocco di colore in partenza.** Il grading è un sistema: contrasto
  1.10, saturazione 0.90, luminosità 0.94, più un pavimento delle ombre che
  porta ogni scatto allo stesso nero. È calibrato sul corpus, e una foto
  pre-corretta ci arriva doppia
* i **lati lunghi** indicati sono minimi, non obiettivi: più grande va bene
* per ogni soggetto, se possibile, **una versione orizzontale e una
  verticale**: gli slot stretti a 390px hanno ritagli propri

---

## Dove si sostituiscono

Tutte le immagini passano da un registro unico. Aggiungere un file in
`assets/foto/`, importarlo in `lib/data/foto.ts`, dichiararne il `fuoco`
(`object-position` scelto sul soggetto, mai lasciato al centro) e l'eventuale
`fuocoStretto` per sotto i 768px. Il testo alternativo è contenuto e vive in
`messages/{it,en}.json`, sotto `foto.*`.

Quando arrivano A1 e A2, la sezione 02 torna a essere l'archetipo A —
fotografia piena — e la coreografia della discesa non si tocca: il blocco
tipografico che oggi sale scalando da 1.15 a 1 diventa una `<Figure>` che fa
lo stesso movimento.
