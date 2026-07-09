# Way of the Sword

An immersive, cinematic history website exploring the rise of samurai culture in
feudal Japan between 900 and 1300 CE.

**Thesis:** the samurai were the architects of a new civilization that dismantled
imperial authority and replaced it with a culture where military discipline, artistic
refinement, and a strict honor code defined what it meant to hold power in Japan.

---

## What is inside

A six section site built with pure HTML, CSS, and JavaScript, plus Three.js loaded
from a CDN. No build step is required. It is ready to drop straight onto GitHub Pages.

* **Landing page** with a Three.js 3D hero (a rotating katana paired with a samurai
  crest), the site title and thesis, an immersive forest tunnel moment, falling sakura
  petals, and a navigation bar linking to all five themes.
* **The Code** — Bushido, the lord and vassal bond, seppuku, and honor in daily life.
* **The Warrior** — training, the sword and its symbolism, armor design, and the art of war.
* **The Power Shift** — the Heian decline, the Genpei War, the Kamakura Shogunate, and the
  emperor as figurehead.
* **The Culture** — Zen Buddhism, poetry and waka, women in samurai society, and faith reshaped.
* **The Legacy** — the cultural legacy, the shogunate as a permanent model, why it endured,
  and the inherited Heian arts.

Every theme page has a cinematic header, four entry sections (each with a heading, a clearly
marked PLACEHOLDER paragraph, a labelled image placeholder box, and a marked citation
placeholder), smooth scroll navigation between entries, and an animated button that wipes
into the next theme.

---

## File structure

```
.
├── index.html              Landing page (Three.js hero, tunnel, theme grid)
├── README.md               This file
├── .nojekyll               Tells GitHub Pages to serve files as is
│
├── css/
│   └── styles.css          All styling: tokens, layout, animations, responsive rules
│
├── js/
│   ├── sakura.js           Falling cherry blossom petals (every page)
│   ├── hero.js             Three.js rotating katana and crest (landing only)
│   ├── tunnel.js           Three.js immersive forest and castle moment (landing only)
│   ├── theme-header.js     Three.js ember particle field (theme page headers)
│   └── scroll.js           Reveal animations, parallax, navbar, page transitions (every page)
│
└── pages/
    ├── code.html           Theme 1: The Code
    ├── warrior.html        Theme 2: The Warrior
    ├── power-shift.html    Theme 3: The Power Shift
    ├── culture.html        Theme 4: The Culture
    └── legacy.html         Theme 5: The Legacy
```

---

## How the effects work

* **Three.js 3D hero** (`js/hero.js`): a katana and a geometric samurai crest rendered in
  real 3D space with gold and steel materials, shifting point lights for reflective
  highlights, and a gentle pointer driven parallax.
* **Parallax scrolling** (`js/scroll.js` + `.parallax__layer` markup): background layers carry
  a `data-speed` value and translate at different rates on scroll for a deep, layered feel.
  The layers are built from CSS gradients and clip paths, so no image files are needed. You
  can swap in your own background images in `css/styles.css` later.
* **Scroll triggered animations** (`js/scroll.js`): elements with `reveal`, `reveal-left`,
  `reveal-right`, or `reveal-scale` classes start hidden and animate into view when an
  IntersectionObserver detects them.
* **Immersive moment** (`js/tunnel.js`): a sticky full screen Three.js scene that glides
  forward through a night forest of trees and torii gates toward a distant lit castle, with
  fog, a moon, and drifting embers.
* **Storytelling transitions** (`js/scroll.js`): any link with the `data-transition` attribute
  triggers a vertical wipe overlay seeded with rising ember and petal particles before the
  next page loads, and each page dissolves in on arrival.
* **Falling sakura** (`js/sakura.js`): a lightweight 2D canvas petal system layered above
  every page, with a capped particle count and pause on tab hide for performance.

---

## Replacing the placeholders

1. **Body text:** search each theme page for `PLACEHOLDER` inside `entry__body` paragraphs and
   replace it with your own writing.
2. **Images:** each `img-box` shows an **Image Slot** label describing what belongs there.
   To use a real image, replace the contents of the `img-box` with an `<img>` tag, for example
   `<img src="../assets/your-image.jpg" alt="description" />`. Create an `assets/` folder for
   your image files.
3. **Citations:** search for `Citation Placeholder` and replace the text below each heading
   with your real source.

A note on style: all visible text on the site avoids dashes by design, using other
punctuation instead. Keep that convention when you add your own content.

---

## Deploying to GitHub Pages

1. Create a new repository on GitHub and push all of these files to it.
2. In the repository, open **Settings**, then **Pages**.
3. Under **Build and deployment**, set the source to **Deploy from a branch**, choose your
   `main` branch and the `/ (root)` folder, then save.
4. Wait a minute, then visit `https://your-username.github.io/your-repository/`.

The `.nojekyll` file is included so GitHub Pages serves every file without running Jekyll.
Because there is no build step, what you push is exactly what is served.

---

## Local preview

Because the pages load Three.js from a CDN and use relative paths, you can simply open
`index.html` in a browser. For the cleanest result, serve the folder over a tiny local
server, for example with Python:

```
python3 -m http.server
```

Then open `http://localhost:8000`.

---

## Credits

Built with HTML, CSS, JavaScript, and [Three.js](https://threejs.org). Typefaces are Cinzel,
Cormorant Garamond, and Inter, served from Google Fonts.
