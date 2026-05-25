# Zelena Pot — spletna stran za urejanje okolice

Osnovna odzivna spletna stran za majhno podjetje za urejanje okolice. Vključuje razdelke za košnjo trave, ročno obrezovanje grmovja, kidanje snega in obrazec za povpraševanje.

## Zagon lokalno

```bash
npm install
npm start
```

Nato odprite `http://localhost:3000`.

## Objavitev na Railway prek GitHuba

1. Ustvarite nov GitHub repozitorij.
2. Potisnite projekt v repozitorij.
3. V Railway izberite **New Project → Deploy from GitHub repo**.
4. Izberite svoj repozitorij.
5. Railway bi moral zaznati Node aplikacijo in zagnati `npm start`.

## Datoteke

- `server.js` — Express strežnik za Railway.
- `public/index.html` — Postavitev spletne strani.
- `public/style.css` — Odzivno oblikovanje.
- `public/script.js` — Mobilni meni in demo obnašanje obrazca.
- `.env.example` — Primer datoteke za okoljske spremenljivke.

## Kaj še prilagoditi

- Zamenjajte `Zelena Pot` z imenom svojega podjetja.
- Dodajte svojo telefonsko številko, e-pošto, območje dela in prave fotografije.
- Povežite obrazec za povpraševanje z e-pošto, bazo podatkov ali storitvijo za obrazce.
