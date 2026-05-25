# Icarus Landscaping Website

Slovenska spletna stran za storitve košnje trave, ročnega obrezovanja grmovja in kidanja snega. Projekt je pripravljen za GitHub in Railway.

## Zagon lokalno

```bash
npm install
npm run dev
```

Stran bo na voljo na `http://localhost:3000`.

## Kontaktni obrazec

Obrazec pošlje e-pošto na:

`tadejjure.gorisek@gmail.com`

Zadeva e-pošte je vedno:

`POVPRAŠEVANJE`

Za delovanje obrazca morate nastaviti SMTP okoljske spremenljivke.

## Railway nastavitve

V Railway dodajte te environment variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Če uporabljate Gmail, morate ustvariti **App Password** v Google računu. Navadno geslo za Gmail običajno ne bo delovalo.

## Deploy

1. Naložite projekt na GitHub.
2. V Railway ustvarite nov projekt iz GitHub repozitorija.
3. Dodajte zgornje SMTP environment variables.
4. Railway bo zagnal `npm start`.
