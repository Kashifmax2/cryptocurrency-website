# Chainwise

A crypto publication built to be submitted to ad networks: original guides, a glossary,
clear editorial and privacy pages, and ad slots that stay out of the reading column.

Static HTML, CSS and two small scripts. No build step.

## Files

| File | Purpose |
|---|---|
| `index.html` | Front page: hero, lead story, latest guides, market basics |
| `learn.html` | Every guide, grouped |
| `what-is-bitcoin.html` | Guide |
| `how-blockchains-work.html` | Guide |
| `wallets-and-self-custody.html` | Guide |
| `reading-the-market.html` | Guide |
| `crypto-scams.html` | Guide |
| `glossary.html` | 45 terms, A to Z |
| `about.html` | What the desk is, editorial standards, advertising policy |
| `contact.html` | Contact form and security note |
| `privacy.html` | Cookies, ad partners, data rights |
| `terms.html` | Information only, no advice |
| `monetag.html` | URL-only sponsored page (`/monetag`) for Monetag, noindex and not linked |
| `styles.css` | Tokens, type, layout, ad bands |
| `ads.js` | Ad codes, one key per slot |
| `site.js` | Ad loader: iframe banners, lazy mount, sticky anchor |
| `vercel.json` | Clean URLs so `/learn` works without `.html` |

## Deploy as its own site

This folder is its own repository, `Kashifmax2/cryptocurrency-website`, with these files at
the root. It also sits inside the larger ads repo, which is why older notes mention a
`cryptocurrency-website` path; ignore that here.

1. In Vercel, **New Project** and import `Kashifmax2/cryptocurrency-website`.
2. Framework preset: **Other**. Build command: empty. Output directory: empty.
3. Deploy, then open the new domain.

Do not add this to the existing ads project. The ad networks expect a separate property,
and both would fight over the same paths.

## Add the ad codes

Open `ads.js`. Every slot has an empty string. Paste the network snippet between the
backticks of the key you want to fill.

```js
window.AD_CODES = {
  "top": `<script>...728x90...</script>`,
  "mid": `<script>...300x250...</script>`,
  "side-1": `...`,
  "side-2": `...`,
  "bottom": `...`,
  "anchor": `...`,
  "native": `...`,
  "pop": `...`,
  "social": `...`
};
```

A key that stays empty hides its band completely, so the site never shows a blank box.
As soon as a key has a code, the band appears on the page.

Slots per page:

| Page | Visible slots |
|---|---|
| Front page | `top`, `mid`, `bottom`, `anchor` |
| Guides | `top`, `side-1`, `side-2`, `bottom`, `anchor` |
| Glossary | `top`, `bottom`, `anchor` |
| About, contact, policies | `top`, `side-1` where present, `bottom`, `anchor` |

Hidden slots (`native`, `pop`, `social`) load once on every page.

## Contact form

`contact.html` ships with `data-endpoint=""`, and the script in `site.js` blocks the
submit while it is empty, so an unconfigured form never leaks a message into the URL.

To make it send, set the endpoint in one place:

```html
<form class="form" data-endpoint="https://formspree.io/f/xxxxxxx" aria-label="Message the desk">
```

`site.js` posts the fields to that URL, clears the form on success, and writes the result
into the `data-form-status` line under the button. No other edit is needed.

## Sponsored page (`/monetag`)

`monetag.html` is a URL-only advertising page on this domain. Nothing links to it, and it
carries `noindex, nofollow`:

```
https://cryptocurrency-website-silk.vercel.app/monetag
```

It runs Monetag and a wall of sponsored tiles that open the Monetag Direct Link (zone
`12224273`) in a new tab. It exists so the crypto property can carry Monetag traffic
without mixing every provider into one site.

### Zones on this page

| Zone | Format | Where |
|---|---|---|
| `307882` | Multitag (popunder, push, vignette, in-page push) | all in one tag |
| `12224255` | OnClick (popunder) | all in one tag |
| `12226779` | In-Page Push (banner) | all in one tag |
| `12224273` | Direct Link | the tiles and the two sponsor strips |

### Why there are no 728x90 boxes here

Monetag does not sell a fixed-size display banner. Its formats are Multitag, OnClick
(popunder), Push, In-Page Push, Vignette Banner and Direct Link only. "Banner" in the
Monetag dashboard means the **In-Page Push (banner)** zone type, which renders a floating
native card, not a 728x90 IAB slot.

So the visible, always-on inventory on this page is:

- the In-Page Push zone, which earns impressions, and
- the sponsor tiles and the two sponsor strips, which are house creatives pointing at the
  Direct Link and earn on clicks.

If you want real 728x90 / 300x250 / 468x60 boxes on this domain, add the domain to a
network that sells display banners (Adsterra or ProfitOn) and paste those codes in.

Monetag ties a zone to a verified site. The meta is already in this page and in
`index.html`:

```html
<meta name="monetag" content="f4abe85b2963045eeecfe285f434191b">
```

Add `cryptocurrency-website-silk.vercel.app` as a site in Monetag and let it verify before
expecting the zone scripts to serve here. The Direct Link tiles work without verification.

## Domain verification for networks

Every page carries the ProfitOn verification meta:

```html
<meta name="profiton-domain-verification" content="e95c9ff57c43ef7f27b93172f4b1ba4f611fa2ead5712ec9dd052ca87fd2babe">
```

Add the new domain in the ProfitOn dashboard and let it verify. Adsterra needs the new
domain added as a website before its codes will serve.

## Before submitting to a network

- Replace the example dates only if you keep publishing. The site reads as a desk with
  a publishing record, and networks do check that a site is updated.
- Keep the guides and glossary in place. They are the original content the reviewer
  looks for.
- Make sure the contact form actually sends, or remove it before review.
- Set a real favicon and a real social image if you have them.

## Local preview

Any static server works:

```
npx serve .
```

Then open the printed address. The ad bands stay hidden until `ads.js` has codes.
