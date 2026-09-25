# Buckshot Roulette - GitHub Pages

This is the uploaded Buckshot Roulette web build prepared for GitHub Pages. The original CDN dependency was removed from `index.html`; all game assets are loaded from the same GitHub Pages directory.

## Publish

1. Create a **public** GitHub repository (GitHub Free supports Pages for public repositories).
2. Upload the contents of this folder to the repository root. Keep all `.part*` files unchanged.
3. Go to **Settings -> Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then Save.
6. GitHub Pages will publish `index.html`.

The project site will normally be at `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`. Publishing can take several minutes.

## Google Sites

After the Pages site is live, use **Google Sites -> Insert -> Embed -> By URL** and enter the GitHub Pages URL.

## Files

The build is about 389 MB total. Each split PCK/WASM file is below GitHub's per-file 100 MB repository limit, so the split files can be stored normally. GitHub Pages is a static host and serves the files directly.
