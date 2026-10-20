# Heidt Studio — website

The studio's own site: **"From blueprint to unforgettable."** Baby blue is the color of a blueprint, so the whole site is built around that idea: every client site first appears as a baby-blue line drawing, then renders into the finished build.

Plain HTML, CSS and JavaScript. No build step.

## Preview

**Shareable link (GitHub Pages):** https://cohen05heidt.github.io/heidt-studio/ — repo https://github.com/cohen05heidt/heidt-studio. It updates about a minute after each push to `main`. The `noindex` line keeps it out of search results.

**On this computer:** double-click `START-PREVIEW.bat`. Your browser opens the site at `http://localhost:8080/` (it picks the next free port if 8080 is busy). Close the window to stop it.

## What's on the page

| Section | What it does |
| --- | --- |
| Intro | The HS mark is drawn as blueprint lines, then filled in. Plays once per visit. |
| Hero background | **Particle swarm**: thousands of baby-blue particles drift, swirl together into your exact HS logo behind the headline, shimmer while an energy wave runs through it, then scatter, as a 12-second seamless loop. Drawn frame by frame from the logo vector (`_src/logo-films/anim.html`, `?mode=particles`, rendered with headless Chromium + ffmpeg). `assets/video/logo-particles-1080.mp4` (desktop, ~3.2 MB) and `-720.mp4` (phones, ~1.2 MB), poster `assets/img/brand/logo-particles-poster.jpg`. Reduced-motion and data-saver visitors get the poster. A "Scroll" cue sits in the left gutter. The blueprint-draft and glass-condense alternatives are kept in `_src/logo-films/unused/`. |
| Hero | **Render lens**: move over the blueprint of a client site and the real site shows through a circular lens. Press and hold to render it all. Cycles through all four sites. |
| Launched & live strip | Links to the four case studies. |
| Work | One explorer per client site (Nichols, Goose's, Millwood, A Fine Install). Picking a feature redraws the screenshot as a blueprint, then reveals the real section with a hotspot on that feature. Tools: Blueprint view, Full page (scrollable full screenshot), Live preview (the real site in a frame; A Fine Install blocks framing, so it opens in a new tab). Cards stack as you scroll on large screens. |
| Lab | Opens with "Welcome to The Lab": a giant title drawn as a blueprint outline that a scan line fills with baby blue, a description and a 3-step how-to. Then live demos of the features: scroll-driven film (Millwood's build film), before/after slider, dot-matrix Georgia map with filters and a 90-minute radius, Goose's real tabbed pricing, A Fine Install's speed readout, Nichols' drone films, Millwood's counters, smart form pointer. |
| Process | Discover → Blueprint → Build → Launch. The HS mark evolves from sketch to blueprint to filled to glowing as you scroll. |
| CTA band + Contact | Every **＋ Add** button on the page adds that feature to the **spec sheet** next to the form, and ticks it in the form. "Build me something like this" records which site inspired the request. A floating pill keeps count and links to the form. |

Calls to action leading to the form: nav, mobile menu, hero, every case ("Build me something like this"), every feature and Lab tile (＋ Add), Lab form tile, process, CTA band, footer and the floating pill.

## Brand

- **Logo:** your HS monogram, traced from your logo into a clean vector: `assets/img/brand/hs-mark.svg`. On the site it renders in a baby-blue gradient (white/ice version in the footer). The wordmark uses Montserrat to match your logo.
- **Colors:** white `#FFFFFF`, ice `#F3FAFE`, baby blue `#89CFF0`, soft baby `#CDEBFA`, sky `#4BA9E0`, blueprint ink `#1E78B4`, text navy `#0B2236`.
- **Type:** Anybody Light (headlines), Instrument Sans (body), Martian Mono (labels), Montserrat (wordmark). All from Google Fonts.
- **Figma:** brand board + full desktop homepage design, with color variables, text styles and button/chip components: https://www.figma.com/design/i540H809M1MB6ZqmlWRGty
- `_src/logo-concepts/` holds four alternate H marks generated in Higgsfield, plus a 3D glass render in `_src/film/`. They aren't used on the site, since your HS logo was the better fit. They're also on the Figma brand page.

## Files

```
index.html
assets/css/styles.css
assets/js/main.js          form settings at the top
assets/img/brand/          logo, share image, home-screen icon
assets/img/work/           client screenshots (*.jpg) and their blueprint versions (*-bp.jpg), full-page captures (full-*.jpg)
assets/video/              Nichols drone films + Millwood build film (copied from those sites)
_src/                      originals, logo trace, generators (not shipped, gitignored)
```

### Refreshing the portfolio screenshots

When a client site changes, re-capture it (needs Google Chrome installed):

1. `_src/tools/shoot.ps1` captures hero shots, `_src/tools/cdp.ps1` captures scrolled sections and full pages into `_src/shots/`.
2. `_src/tools/build-assets.ps1` makes the web-sized JPGs and the blueprint versions in `assets/img/work/`.

To add a fifth site: capture it the same way, copy one `<article class="case">` block in `index.html`, and add it to `SITES` in `main.js` if it should appear in the hero lens.

## Before launch

1. **Delete the `noindex` line** in `index.html` (marked `PREVIEW ONLY`).
2. **Connect the form.** In `assets/js/main.js`, paste a free Web3Forms access key into `WEB3FORMS_KEY` (https://web3forms.com, the key is emailed to you), or set `CONTACT_EMAIL` so requests open the visitor's email app. Until one is set, the form says it isn't connected yet.
3. **Contact details:** phone (912) 677-0764 and cohen.heidt13@gmail.com are in the contact section ("Prefer to talk?"), the footer, the mobile menu, the JSON-LD block and the form messages in `main.js`. If either changes, search the project for the old value. Add Instagram/Facebook links if you want them.
4. **Point the share image at your domain.** Change `og:image` to the full URL (e.g. `https://heidtstudio.com/assets/img/brand/og.jpg`), add `<link rel="canonical" href="https://yourdomain/">`, and add `"url"` to the JSON-LD block.
5. **Check with clients.** The site shows screenshots of all four sites and copies of the Nichols and Millwood hero films. Make sure each client is fine being featured.
6. Upload to Hostinger the same way as the client sites (the `.gitignore` already keeps `_src/` out).
