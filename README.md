# Team Vikram — Coming Soon

Coming soon landing page for **Team Vikram**, a student rocketry team from Rajalakshmi Engineering College.

Live concept: branded launch loader, countdown timer, and a Three.js solar-system background.

## What’s included

| File | Purpose |
|------|---------|
| `index.html` | Page structure & meta tags |
| `styles.css` | Layout and visual styling |
| `script.js` | Loader, countdown, Three.js solar system |
| `vikram-logo-white.png` | Brand logo |
| `favicon.png` | Browser favicon |

## Local preview

This site uses ES modules and an import map for Three.js, so it should be served over **HTTP** (not opened as a raw `file://` path).

### Option A — Python

```bash
cd Vikram
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000).

### Option B — Node (npx)

```bash
cd Vikram
npx serve .
```

### Option C — VS Code / Cursor

Use the **Live Server** extension and open `index.html`.

## Host on GitHub Pages

1. Push this repo to GitHub (already set up as [RoshinRG/Vikram](https://github.com/RoshinRG/Vikram)).
2. On GitHub: **Settings → Pages**.
3. Under **Build and deployment**:
   - **Source**: Deploy from a branch
   - **Branch**: `main` / `/ (root)`
4. Click **Save**.
5. After a minute or two, the site will be at:

   `https://roshinrg.github.io/Vikram/`

> If your custom domain is `teamvikram.in`, add it under **Settings → Pages → Custom domain**, then point your DNS (A/CNAME records) to GitHub Pages.

## Host on Netlify

1. Go to [Netlify Drop](https://app.netlify.com/drop) or **Add new site → Import an existing project**.
2. Connect the `RoshinRG/Vikram` GitHub repo (or drag the project folder onto Netlify Drop).
3. Build settings for this static site:
   - **Build command**: leave empty
   - **Publish directory**: `.` (repo root)
4. Deploy. Netlify gives you a `*.netlify.app` URL; you can attach a custom domain in **Domain settings**.

## Host on Vercel

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Other**.
3. Root directory: `.`
4. No build command needed — click **Deploy**.

## Host on any static host

Upload these files to any static hosting root (cPanel, Cloudflare Pages, Firebase Hosting, AWS S3 + CloudFront, etc.):

- `index.html`
- `styles.css`
- `script.js`
- `vikram-logo-white.png`
- `favicon.png`

No build step or server-side runtime is required. Three.js loads from a CDN via the import map in `index.html`.

## Notes

- The countdown is set to **3 days from the visitor’s first visit** and is stored in `localStorage` so it continues after reload.
- Prefer `prefers-reduced-motion`: the loader finishes immediately and the Three.js canvas is hidden.
- Keep HTTPS enabled in production so the CDN module import works reliably.

## License

© 2026 Team Vikram · Rajalakshmi Engineering College
