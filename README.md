# Icarus Landscaping

Fresh Railway-ready website for a local Slovenian landscaping company.

## Services

- Urejanje okolice
- Košenje
- Odstranjevanje snega na dovozih in okoli hiše

## Railway deployment

1. Push this project to GitHub.
2. Create a Railway project from the GitHub repo.
3. Add this Railway variable:

```env
RESEND_API_KEY=re_your_resend_api_key_here
```

4. Deploy.

## Contact form

Inquiries (povpraševanja) are sent to:

```txt
icarus.okolica@gmail.com
```

Override the recipient with the optional `TO_EMAIL` Railway variable. The company's official address,
`tadejjure.gorisek@gmail.com`, appears only in the footer and the privacy policy.

Email subject:

```txt
Novo povpraševanje — <kontakt> (<timestamp>)
```

Default sender is:

```txt
onboarding@resend.dev
```

You can later replace this with your verified Resend domain email.

## Pricing (calculator)

| Service | Price |
|---|---|
| Košenje trave | 0,25 €/m² (× 1,25 slope · × 1,5 overgrown) |
| Striženje živice | 2,00 €/tm (× 1,3 · × 1,7 by height) |
| Rob trava/tlakovci | 1,00 €/tm, minimum 20 € |
| Odvoz na deponijo | 30 € per drive, minimum 1 drive |
| Kidanje snega | 5,00 €/m² (× 1,3 wet · × 1,6 ice) |
| Obrezovanje grmovja | 10 €/kos (× 1,5 · × 2,2 by size) |

All rates live in `SERVICES` in `public/script.js` — the one source of truth for the one-off calculator,
the Custom subscription (× 0,85; 2×/month × 2 × 0,90) and the Basic/Pro tier rows. The displayed `svc-price`
labels in `index.html` must be kept in sync by hand.

## Design & assets

- Business clients: the `#podjetja` section ("Za poslovne objekte", linked from the header and footer nav) sells
  year-round grounds maintenance for business buildings. It has no prices on purpose (each object gets an offer
  after a free site visit); its CTA is a `mailto:` to icarus.okolica@gmail.com with a prefilled subject.

- Forest-dark theme, ONE accent: the logo's gold (`--accent` in `public/style.css`). Radius rule: cards 20px,
  inputs 12px, buttons/pills fully rounded. Fonts: Bricolage Grotesque (display) + Geist (body), Google Fonts.
- Icons: inline Phosphor SVG sprite at the top of `index.html` (`<use href="#i-name"/>`); `script.js` uses
  `ico(sym)` for the quote rows. Emoji remain only in the inquiry email.
- Photos in `public/images/web/` (WebP, two widths each) and the hero video `hero-loop.mp4` (+ `-1280`) were
  generated with Higgsfield; the raw originals and how the seamless loop was made live in
  `Desktop/icarus/custom_assets/web/icarus-okolica/` (`ASSETS.json`). The before/after photos in
  `public/images/*.jpg` are REAL work photos. Never replace them with AI images.
- Hero: landscape still + loop above 960px; a matching PORTRAIT still + loop (`hero-portrait-*.webp`,
  `hero-loop-portrait.mp4`) at 960px and below, where the photo fills the first screen and the copy starts
  below the house. The video loads after `window.load`, is skipped for reduced motion / Save-Data, pauses off
  screen, and the round button in the service strip pauses all motion (remembered in localStorage).
- Loops are made with `custom_assets/tools/seamless_video_loop.py` (constant-QP encode; CRF re-adds a loop pop).
- Accessibility: calculator cards are keyboard switches/checkboxes, before/after sliders take arrow keys, the
  quote total is announced via `#quoteStatus`, form errors are inline (no `alert()`), skip link to `#vsebina`.
