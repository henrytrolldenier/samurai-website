# The Way of the Samurai

An immersive, dark and cinematic history website exploring the rise of samurai culture in
feudal Japan between **900 and 1300 CE**.

> **Thesis:** the samurai were the architects of a new civilization that dismantled imperial
> authority and replaced it with a culture where military discipline, artistic refinement, and
> a strict honor code defined what it meant to hold power in Japan.

Built with pure HTML, CSS, and JavaScript plus [Three.js](https://threejs.org/) loaded from a
CDN. There is **no build step** and it deploys straight to GitHub Pages.

---

## Folder structure

```
.
├── index.html          Landing page (rising-sun hero glow, tunnel, thesis + theme cards)
├── code.html           Theme I  · The Code
├── warrior.html        Theme II · The Warrior
├── powershift.html     Theme III · The Power Shift
├── culture.html        Theme IV · The Culture (cherry blossom 3D, corner of header)
├── legacy.html         Theme V  · The Legacy
│
├── styles.css          Shared stylesheet (design tokens, layout, animations, responsive)
├── main.js             Shared script: cursor, loader, transitions, scroll reveal,
│                       parallax, global sakura particles, and the 3D model scene
│
├── models/             3D assets (GLB)
│   └── cherry_blossom_branch.glb         loaded on culture.html
│
├── .nojekyll           Tells GitHub Pages to serve files as-is (no Jekyll processing)
└── README.md
```

> The `models/` folder must contain `cherry_blossom_branch.glb` with **exactly** that name. The
> Culture page references it by relative path, so the name and folder are case sensitive on
> GitHub Pages.

---

## Features

* **Cherry blossom GLB model** on the Culture page, rendered with Three.js `GLTFLoader`, full
  PBR lighting via `PMREMGenerator`, ACES Filmic tone mapping, sRGB output, and soft shadows.
  It rotates in the corner of the header while individual petals fall around it.
* **Rising-sun hero glow** — a pure-CSS crimson *hinomaru* radial gradient pulses behind the
  landing-page title.
* **Global sakura particle field** on every page (200 petals, raised to 500 on the landing
  page) using Three.js `Points` with a canvas generated circular pink texture, sine wave sway,
  and occasional wind gusts.
* **Custom cursor** that follows the mouse with lag and expands over interactive elements.
* **Scroll reveal** with `IntersectionObserver`, staggered child animations.
* **Parallax** theme headers built entirely from layered CSS gradients (fog, mountains,
  forest), moving at 0.3x scroll speed.
* **Theme transition wipes** — a crimson panel sweeps across the screen between pages.
* **CSS perspective tunnel** on the landing page with kanji fading in and out.
* **Loading screen** on every page with a spinning Japanese *mon* crest and a progress bar.
* **Signature red ink brushstroke divider** (SVG) between every section.
* **Responsive** with a hamburger menu below 768px, and full `prefers-reduced-motion` support
  that disables non essential motion.

---

## Run it locally

Because the pages load GLB models with `fetch`/XHR, opening the files directly with
`file://` will be blocked by the browser. Serve the folder over HTTP instead:

```bash
# from the project root
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static server works (for example `npx serve`).

---

## Deploy to GitHub Pages

1. Create a repository on GitHub and push this folder to it:

   ```bash
   git init
   git add .
   git commit -m "The Way of the Samurai"
   git branch -M main
   git remote add origin https://github.com/<your-user>/<your-repo>.git
   git push -u origin main
   ```

2. On GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch **main** and folder **/ (root)**, then **Save**.
5. Wait about a minute, then visit `https://<your-user>.github.io/<your-repo>/`.

The included `.nojekyll` file ensures GitHub Pages serves the assets directly without running
Jekyll. No further configuration is required.

---

## Replacing the placeholder content

Each theme page ships with clearly marked slots so you can drop in your research:

* `.placeholder-text` — replace `PLACEHOLDER CONTENT: Replace with research entry paragraph`
  with your written entry.
* `.placeholder-image` — replace the `IMAGE: ...` box with an `<img>` (the label describes the
  intended image).
* `.placeholder-citation` — replace `PLACEHOLDER CITATION` with your source citation.

---

## Tech notes

* Three.js **r128** core from cdnjs on every page for the sakura particle field; the Culture
  page additionally loads `GLTFLoader`, `OrbitControls`, and `RectAreaLightUniformsLib` from the
  matching `three@0.128.0` example bundles on jsDelivr for the cherry-blossom scene.
* Fonts: **Cinzel** for headings and **Crimson Text** for body, served by Google Fonts.
* If the GLB fails to load, the page falls back to a lacquered placeholder mesh so nothing breaks.
* Geometries, materials, and renderers are disposed on page unload.
