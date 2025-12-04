/**
 * Palette Font Kit - Core Logic
 * Handles color generation, font loading, accessibility checks, and storage.
 */

/* --- Data & Configuration --- */

const fonts = [
  { h: 'Playfair Display', b: 'Lato', cat: 'Serif/Sans' },
  { h: 'Montserrat', b: 'Open Sans', cat: 'Sans/Sans' },
  { h: 'Oswald', b: 'Roboto', cat: 'Condensed/Sans' },
  { h: 'Merriweather', b: 'Source Sans 3', cat: 'Serif/Sans' },
  { h: 'Space Grotesk', b: 'Inter', cat: 'Modern/Tech' },
  { h: 'Abril Fatface', b: 'Poppins', cat: 'Display/Geometric' },
  { h: 'Lora', b: 'Mulish', cat: 'Serif/Sans' },
  { h: 'Raleway', b: 'Roboto Slab', cat: 'Geometric/Serif' },
  { h: 'Bebas Neue', b: 'Montserrat', cat: 'Display/Geometric' },
  { h: 'Syne', b: 'Inter', cat: 'Unique/Clean' },
];

const defaultPalettes = {
  minimal: ['#ffffff', '#000000', '#f3f4f6', '#9ca3af', '#111827'], // Bg, Text, Sec, Acc, Dark
  playful: ['#fff1f2', '#881337', '#fda4af', '#f43f5e', '#4c0519'], // Pink/Red theme
  bold: ['#0f172a', '#f8fafc', '#334155', '#38bdf8', '#0ea5e9'], // Dark blue theme
};

/* --- State Management --- */
let state = {
  palette: [], // Array of 5 Hex strings
  fontPair: {}, // { h: string, b: string }
  favorites: [],
  theme: 'light',
};

/* --- Utilities --- */

// Random Integer
const rand = (max) => Math.floor(Math.random() * max);

// Generate Random Hex
const randomHex = () => {
  const val = Math.floor(Math.random() * 16777215).toString(16);
  return '#' + val.padStart(6, '0');
};

// Calculate Luminance
const getLuminance = (hex) => {
  const rgb = parseInt(hex.slice(1), 16);
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = ((rgb >> 0) & 0xff) / 255;

  const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

// Calculate Contrast Ratio (WCAG 2.1)
const getContrast = (hex1, hex2) => {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

// Copy to Clipboard with Feedback
const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showToast(`Copied: ${text}`);
    })
    .catch((err) => console.error('Copy failed', err));
};

const showToast = (msg) => {
  const t = document.getElementById('toast');
  t.innerText = msg;
  t.classList.add('visible');
  setTimeout(() => t.classList.remove('visible'), 2000);
};

/* --- Core Functions --- */

// 1. Generate Logic
const generateAesthetic = (mode = 'random') => {
  if (mode === 'minimal') {
    state.palette = defaultPalettes.minimal;
    state.fontPair = fonts[4]; // Space Grotesk/Inter
  } else {
    // Generate 5 cohesive colors
    // Logic: 0=Bg, 1=Text, 2=Accent, 3=Sec, 4=Sec
    // To ensure readability, we force 0 and 1 to have contrast
    const base = randomHex();
    state.palette = [randomHex(), randomHex(), randomHex(), randomHex(), randomHex()];

    // Pick random font
    state.fontPair = fonts[rand(fonts.length)];
  }

  updateUI();
};

// 2. DOM Updates
const updateUI = () => {
  // A. Inject Fonts
  const link = document.getElementById('dynamic-fonts');
  const h = state.fontPair.h.replace(/\s+/g, '+');
  const b = state.fontPair.b.replace(/\s+/g, '+');
  // Lazy load logic: only fetch if different
  const url = `https://fonts.googleapis.com/css2?family=${h}:wght@400;700&family=${b}:wght@400;600&display=swap`;
  if (link.href !== url) link.href = url;

  // B. Update Labels
  document.getElementById('label-heading-font').textContent = state.fontPair.h;
  document.getElementById('label-body-font').textContent = state.fontPair.b;

  // C. Apply CSS Variables to Preview Container
  const preview = document.getElementById('preview-card');

  // Smart Assignment: Ensure Color 0 (Bg) and Color 1 (Text) have contrast
  // If not, swap or adjust. For random gen, we simply assign and let user judge,
  // OR we sort by luminance for a "Dark Mode" vs "Light Mode" preview.
  // Let's sort palette by luminance to ensure logical mapping.
  const sorted = [...state.palette].sort((a, b) => getLuminance(b) - getLuminance(a));

  // If we want a light theme: sorted[0] is brightest.
  // If we want a dark theme: sorted[4] is darkest.
  // Let's randomize which "mode" the preview shows, but keep consistency.
  const useDarkBase = Math.random() > 0.5;
  const bg = useDarkBase ? sorted[4] : sorted[0];
  const text = useDarkBase ? sorted[0] : sorted[4];
  const accent = sorted[2];

  preview.style.setProperty('--gen-bg', bg);
  preview.style.setProperty('--gen-text', text);
  preview.style.setProperty('--gen-accent', accent);
  preview.style.setProperty('--gen-h-font', `"${state.fontPair.h}", sans-serif`);
  preview.style.setProperty('--gen-b-font', `"${state.fontPair.b}", sans-serif`);

  // D. Render Palette Swatches
  const grid = document.getElementById('palette-grid');
  grid.innerHTML = '';

  state.palette.forEach((color) => {
    const contrastWhite = getContrast(color, '#ffffff');
    const contrastBlack = getContrast(color, '#000000');

    const passWhite = contrastWhite >= 4.5 ? 'AA' : 'Fail';
    const passBlack = contrastBlack >= 4.5 ? 'AA' : 'Fail';

    const card = document.createElement('div');
    card.className = 'swatch';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Color ${color}. Click to copy.`);
    card.innerHTML = `
            <div class="swatch-color" style="background-color: ${color}"></div>
            <div class="swatch-info">
                <span class="hex-code">${color}</span>
                <div class="contrast-badges">
                    <span class="badge-pill ${
                      passWhite === 'AA' ? 'badge-pass' : 'badge-fail'
                    }">W: ${contrastWhite.toFixed(1)}</span>
                    <span class="badge-pill ${
                      passBlack === 'AA' ? 'badge-pass' : 'badge-fail'
                    }">B: ${contrastBlack.toFixed(1)}</span>
                </div>
            </div>
        `;

    // Click Event
    card.addEventListener('click', () => copyToClipboard(color));
    // Keyboard Enter
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        copyToClipboard(color);
      }
    });

    grid.appendChild(card);
  });
};

// 3. Favorites System
const saveFavorite = () => {
  const fav = {
    id: Date.now(),
    palette: [...state.palette],
    fonts: { ...state.fontPair },
    timestamp: new Date().toLocaleDateString(),
  };
  state.favorites.unshift(fav);
  localStorage.setItem('aesthetic.favorites', JSON.stringify(state.favorites));
  renderFavorites();
  showToast('Saved to Favorites!');
};

const deleteFavorite = (id) => {
  state.favorites = state.favorites.filter((f) => f.id !== id);
  localStorage.setItem('aesthetic.favorites', JSON.stringify(state.favorites));
  renderFavorites();
};

const loadFavorite = (id) => {
  const fav = state.favorites.find((f) => f.id === id);
  if (fav) {
    state.palette = fav.palette;
    state.fontPair = fav.fonts;
    updateUI();
    showToast('Loaded configuration');
  }
};

const renderFavorites = () => {
  const list = document.getElementById('favorites-list');
  list.innerHTML = '';

  if (state.favorites.length === 0) {
    list.innerHTML = `<p class="empty-state" style="color:var(--ui-text-muted); font-style:italic; padding:1rem;">No favorites saved yet.</p>`;
    return;
  }

  state.favorites.forEach((fav) => {
    const el = document.createElement('div');
    el.className = 'fav-item';
    // Mini preview swatches
    const swatchesHtml = fav.palette.map((c) => `<div class="mini-swatch" style="background:${c}"></div>`).join('');

    el.innerHTML = `
            <div class="fav-preview">${swatchesHtml}</div>
            <div class="fav-info">
                <strong>${fav.fonts.h}</strong> / ${fav.fonts.b}
            </div>
            <div class="fav-actions">
                <button class="btn btn-outline" onclick="loadFavorite(${fav.id})">Load</button>
                <button class="btn btn-outline" style="color:var(--ui-danger)" onclick="deleteFavorite(${fav.id})">×</button>
            </div>
        `;
    list.appendChild(el);
  });
};

// 4. Export Functions
const copyCSS = () => {
  const css = `
:root {
    --color-bg: ${state.palette[0]};
    --color-text: ${state.palette[1]};
    --color-accent: ${state.palette[2]};
    --color-sec-1: ${state.palette[3]};
    --color-sec-2: ${state.palette[4]};
    --font-heading: '${state.fontPair.h}', sans-serif;
    --font-body: '${state.fontPair.b}', sans-serif;
}
    `.trim();
  copyToClipboard(css);
};

const exportJSON = () => {
  const data = {
    palette: state.palette,
    fonts: state.fontPair,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'aesthetic-config.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('JSON Exported');
};

/* --- Initialization --- */

const init = () => {
  // 1. Load LocalStorage
  const storedFavs = localStorage.getItem('aesthetic.favorites');
  if (storedFavs) state.favorites = JSON.parse(storedFavs);
  renderFavorites();

  const storedTheme = localStorage.getItem('aesthetic.settings');
  if (storedTheme) {
    state.theme = JSON.parse(storedTheme).theme;
    applyTheme(state.theme);
  }

  // 2. Initial Gen (Minimal)
  generateAesthetic('minimal');

  // 3. Event Listeners
  document.getElementById('btn-shuffle').addEventListener('click', () => generateAesthetic());
  document.getElementById('btn-save').addEventListener('click', saveFavorite);
  document.getElementById('btn-copy-css').addEventListener('click', copyCSS);
  document.getElementById('btn-export-json').addEventListener('click', exportJSON);

  // Theme Toggle
  document.getElementById('theme-toggle').addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('aesthetic.settings', JSON.stringify({ theme: state.theme }));
    applyTheme(state.theme);
  });

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in editable areas
    if (e.target.isContentEditable || e.target.tagName === 'INPUT') return;

    if (e.code === 'Space') {
      e.preventDefault(); // Prevent scroll
      generateAesthetic();
    }
    if (e.code === 'KeyS') {
      saveFavorite();
    }
    if (e.code === 'KeyC') {
      copyCSS();
    }
  });
};

const applyTheme = (theme) => {
  const html = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const sun = btn.querySelector('.icon-sun');
  const moon = btn.querySelector('.icon-moon');

  if (theme === 'dark') {
    html.classList.add('theme-dark');
    btn.setAttribute('aria-pressed', 'true');
    sun.style.display = 'none';
    moon.style.display = 'block';
  } else {
    html.classList.remove('theme-dark');
    btn.setAttribute('aria-pressed', 'false');
    sun.style.display = 'block';
    moon.style.display = 'none';
  }
};

// Start
init();
