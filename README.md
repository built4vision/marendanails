# Anthem Landing Page Template

Built4Vision's personalized brand-anthem landing page, as a reusable template. Click **"Use this template"** on GitHub to start a new client repo from this, instead of building from scratch each time.

Live reference build: the Razors Edge page this template was extracted from (`built4vision/razorsedge`).

## Setup checklist for a new client

1. **Rename things**
   - GitHub repo name (Settings → rename)
   - `<title>`, meta description, canonical/og:url in `index.html`, `thank-you/index.html`, `schedule/index.html`

2. **Edit `js/config.js`** — the single source of truth. Fill in:
   - `businessName`, `songTitle`, `cityState`, `address`
   - `paymentLinks.package.stripe` / `paymentLinks.song.stripe` (create new Stripe Payment Links reusing the existing $197/mo and $49 Prices — don't create new Products/Prices per client)

3. **Add assets**
   - `audio/anthem.mp3` — the anthem
   - `images/logo.svg` — client logo (falls back to text wordmark if missing)
   - `images/shop-photo.jpg` — a location/team photo
   - `images/reel-1.jpg`, `images/reel-2.jpg` — two more photos for the "Imagine It In Their Feed" mockups
   - `images/social-preview.jpg` — 1200×630 social share image

4. **Write the personal content** — this is the actual creative work, not filler:
   - `index.html` hero: the 5 staged build lines (`[Detail 1]`...`[Detail 4]`)
   - `index.html` story checklist: 5 specific facts (`[Fact 1]`...`[Fact 5]`)
   - Mockup captions in the vision section
   - Spot-check `previewStartSeconds`/`previewEndSeconds` and `secondPreviewStartSeconds`/`secondPreviewEndSeconds` in `config.js` against the actual song — the defaults (0–30s, 60–90s) are guesses, not guarantees the hook actually lands there

5. **Deploy**
   - Enable GitHub Pages (Settings → Pages → Deploy from branch → root)
   - Point your custom domain path at it if using one

6. **Wire up Stripe redirects**
   - Song Only Payment Link → "After payment" → redirect to `<your-url>/thank-you/`
   - Creative Growth Package Payment Link → "After payment" → redirect to `<your-url>/schedule/`

7. **Test the full flow** before sending it to anyone: play both preview samples, click both offer buttons, complete a real purchase if possible, confirm the thank-you/schedule redirects work.

## What's reusable as-is (no per-client edits needed)

`css/style.css`, `js/main.js`, `js/config.js`'s `applyConfig`/`initAnimations` logic, the "Why Did We Make This?" section copy, the offer tier names/prices/structure, the contact panel, and the footer — all Built4Vision's own standing content and code, not specific to any one client.
