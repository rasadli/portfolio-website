# Portfolio conventions

- Static site served by GitHub Pages from the `main` branch root at `https://rasadli.github.io/portfolio-website/`. No workflow or server code.
- `content/portfolio.mjs` holds all copy and `build.mjs` generates the HTML with no dependencies. Do not edit `index.html`, `404.html`, `work/*.html`, `robots.txt` or `sitemap.xml` by hand.
- After changing content, run `node build.mjs` and commit the generated files. Run it for the "today" marker in the career trace to stay current.
- Preview with `python -m http.server 4173`.
- Use relative asset paths, since the site lives under `/portfolio-website/`. `404.html` is the exception and uses absolute paths.
- Accuracy: publish only what the owner has confirmed. Do not add invented metrics, and do not describe AzInTelecom work beyond what the published CV says. The graduation project is ongoing with no results.
- Never stage, commit, push or deploy without explicit approval from the owner, for each step.
