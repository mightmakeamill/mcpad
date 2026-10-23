// Draws every menu item as a flat illustration (original art, no logos) and
// renders it to public/sprites/<id>.png with headless Chromium.
// Run once after editing the menu: `npm run draw-art` (needs Playwright).
const fs = require('fs');
const path = require('path');
const { ITEMS } = require('../lib/menu.js');

const OUT = path.join(__dirname, '..', 'public', 'sprites');
const CX = 256;

// Deterministic pseudo-random numbers so the art is stable between runs.
function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }

const C = {
  bun: '#e09a45', bunHi: '#f2b866', bunLo: '#b8702c', seed: '#fff3d6',
  beef: '#5b2c17', beefHi: '#7a3f22', cheese: '#ffc93c', lettuce: '#6cbf3f', lettuceLo: '#3f8f2a',
  tomato: '#e2402f', pickle: '#7fa63a', onion: '#f7f1e1', chicken: '#e6a548', chickenLo: '#c27f2b',
  fish: '#eea83a', egg: '#fffdf4', yolk: '#ffd64a', bacon: '#e98b85', bbq: '#7a1c10', bbqHi: '#a52a17',
  sauce: '#f4b17a', muffin: '#efcd94', muffinLo: '#c99b5a', cake: '#c47a35', syrup: '#6e2d0e',
  red: '#d6291f', redLo: '#a81b14', fry: '#ffd451', fryLo: '#e5a92c', white: '#fffaf0', ink: '#2a1a12',
};

/* ---------- Stacked sandwiches ---------- */
const H = { bunB: 46, bunM: 34, bunT: 112, beef: 34, beefT: 46, cheese: 9, lettuce: 18, shred: 16, tomato: 16, onion: 0,
  pickle: 10, chicken: 44, fish: 38, egg: 30, bacon: 14, sauce: 7, muffinB: 40, muffinT: 46, cakeB: 36, cakeT: 40,
  sausage: 30, steamB: 44, steamT: 104, spicy: 8, mustard: 0 };

function layer(kind, y, w, r) {
  const x0 = CX - w / 2, x1 = CX + w / 2, h = H[kind];
  const top = y - h;
  switch (kind) {
    case 'bunB': case 'steamB': {
      const col = kind === 'steamB' ? '#f3dcae' : C.bun;
      return `<path d="M${x0} ${top + 6} H${x1} V${y - 22} Q${x1} ${y} ${x1 - 26} ${y} H${x0 + 26} Q${x0} ${y} ${x0} ${y - 22} Z" fill="${col}"/>` +
        `<rect x="${x0}" y="${top}" width="${w}" height="12" rx="6" fill="${kind === 'steamB' ? '#fbecc9' : C.bunHi}"/>`;
    }
    case 'bunM':
      return `<rect x="${x0 + 6}" y="${top}" width="${w - 12}" height="${h}" rx="16" fill="${C.bun}"/><rect x="${x0 + 10}" y="${top}" width="${w - 20}" height="10" rx="5" fill="${C.bunHi}"/>`;
    case 'bunT': case 'steamT': {
      const col = kind === 'steamT' ? '#f6e2b8' : C.bun;
      let s = `<path d="M${x0} ${y} C${x0 - 4} ${top - 10} ${x1 + 4} ${top - 10} ${x1} ${y} Z" fill="${col}"/>` +
        `<path d="M${x0 + 40} ${top + 34} C${x0 + 70} ${top + 6} ${CX} ${top} ${CX + 40} ${top + 6}" stroke="${kind === 'steamT' ? '#fff6df' : C.bunHi}" stroke-width="14" fill="none" stroke-linecap="round"/>`;
      if (kind === 'bunT') for (let i = 0; i < 18; i++) {
        const t = r(), u = r();
        const sx = x0 + 34 + t * (w - 68), sy = y - 20 - u * (h * 0.75) * Math.sin(Math.PI * t) - 6;
        s += `<ellipse cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" rx="6" ry="3.4" transform="rotate(${(r() * 160 - 80).toFixed(0)} ${sx.toFixed(1)} ${sy.toFixed(1)})" fill="${C.seed}"/>`;
      }
      return s;
    }
    case 'beef': case 'beefT': {
      let s = `<rect x="${x0 - 6}" y="${top}" width="${w + 12}" height="${h}" rx="${h / 2}" fill="${C.beef}"/>`;
      for (let i = 0; i < 14; i++) s += `<circle cx="${(x0 + 10 + r() * (w - 20)).toFixed(1)}" cy="${(top + 6 + r() * (h - 12)).toFixed(1)}" r="${(2 + r() * 3).toFixed(1)}" fill="${C.beefHi}"/>`;
      return s;
    }
    case 'cheese': {
      const d = 26;
      return `<path d="M${x0 - 10} ${top} H${x1 + 10} L${x1 - 6} ${y + d} L${x1 - 30} ${y} H${CX + 30} L${CX + 10} ${y + d * 0.8} L${CX - 8} ${y} H${x0 + 30} L${x0 + 4} ${y + d} Z" fill="${C.cheese}"/>`;
    }
    case 'lettuce': {
      let p = `M${x0 - 14} ${y}`;
      for (let x = x0 - 14; x <= x1 + 14; x += 22) p += ` Q${x + 11} ${top - 8} ${x + 22} ${y - 4}`;
      return `<path d="${p} L${x1 + 14} ${y + 6} H${x0 - 14} Z" fill="${C.lettuce}"/>`;
    }
    case 'shred': {
      let s = '';
      for (let i = 0; i < 40; i++) {
        const x = x0 - 8 + r() * (w + 16), yy = y - r() * h;
        s += `<path d="M${x.toFixed(1)} ${yy.toFixed(1)} q8 -6 16 0" stroke="${r() > 0.5 ? C.lettuce : '#9ad85b'}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      }
      return s;
    }
    case 'tomato':
      return [0.25, 0.75].map((f) => `<ellipse cx="${x0 + f * w}" cy="${y - h / 2}" rx="${w * 0.24}" ry="${h / 2 + 2}" fill="${C.tomato}"/>`).join('');
    case 'onion': {
      let s = '';
      for (let i = 0; i < 16; i++) s += `<rect x="${(x0 + r() * w).toFixed(1)}" y="${(y - 6 + r() * 6).toFixed(1)}" width="8" height="5" rx="2" fill="${C.onion}"/>`;
      return s;
    }
    case 'pickle':
      return [0.22, 0.5, 0.78].map((f) => `<ellipse cx="${x0 + f * w}" cy="${y - h / 2}" rx="26" ry="${h / 2 + 1}" fill="${C.pickle}" stroke="#5c7f27" stroke-width="3"/>`).join('');
    case 'chicken': case 'spicy': {
      if (kind === 'spicy') return `<path d="M${x0} ${y - 2} q20 -10 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#d2401c" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      let p = `M${x0 - 10} ${y - h / 2}`;
      for (let x = x0 - 10; x < x1 + 10; x += 30) p += ` q15 ${-(h / 2 + 6 + r() * 6)} 30 ${-2 + r() * 4}`;
      let s = `<path d="${p} V${y - 8} Q${x1 + 10} ${y} ${x1 - 10} ${y} H${x0 + 10} Q${x0 - 10} ${y} ${x0 - 10} ${y - 8} Z" fill="${C.chicken}"/>`;
      for (let i = 0; i < 16; i++) s += `<circle cx="${(x0 + r() * w).toFixed(1)}" cy="${(top + 8 + r() * (h - 14)).toFixed(1)}" r="${(2 + r() * 2.5).toFixed(1)}" fill="${C.chickenLo}"/>`;
      return s;
    }
    case 'fish': {
      const fw = w * 0.78;
      let s = `<rect x="${CX - fw / 2}" y="${top}" width="${fw}" height="${h}" rx="10" fill="${C.fish}"/>`;
      for (let i = 0; i < 12; i++) s += `<circle cx="${(CX - fw / 2 + 8 + r() * (fw - 16)).toFixed(1)}" cy="${(top + 6 + r() * (h - 12)).toFixed(1)}" r="2.5" fill="#c9831f"/>`;
      return s;
    }
    case 'egg':
      return `<ellipse cx="${CX}" cy="${y - h / 2}" rx="${w / 2 - 6}" ry="${h / 2 + 2}" fill="${C.egg}"/><ellipse cx="${CX - 20}" cy="${y - h / 2 - 2}" rx="${w / 5}" ry="${h / 3}" fill="${C.yolk}" opacity=".55"/>`;
    case 'bacon':
      return `<ellipse cx="${CX}" cy="${y - h / 2}" rx="${w / 2}" ry="${h / 2 + 2}" fill="${C.bacon}"/><ellipse cx="${CX}" cy="${y - h / 2 - 2}" rx="${w / 2 - 14}" ry="${h / 2 - 3}" fill="#f2a59e"/>`;
    case 'sausage': {
      let s = `<rect x="${x0}" y="${top}" width="${w}" height="${h}" rx="${h / 2}" fill="#8b4a27"/>`;
      for (let i = 0; i < 12; i++) s += `<circle cx="${(x0 + 10 + r() * (w - 20)).toFixed(1)}" cy="${(top + 6 + r() * (h - 12)).toFixed(1)}" r="2.6" fill="#a8603a"/>`;
      return s;
    }
    case 'sauce':
      return `<rect x="${x0 - 4}" y="${top}" width="${w + 8}" height="${h}" rx="4" fill="${C.sauce}"/>`;
    case 'muffinB': case 'muffinT': {
      let s = `<rect x="${x0}" y="${top}" width="${w}" height="${h}" rx="${h / 2.4}" fill="${C.muffin}"/>`;
      if (kind === 'muffinT') s += `<rect x="${x0 + 8}" y="${top}" width="${w - 16}" height="16" rx="8" fill="#f7e2b9"/>`;
      for (let i = 0; i < 12; i++) s += `<circle cx="${(x0 + 12 + r() * (w - 24)).toFixed(1)}" cy="${(top + 8 + r() * (h - 16)).toFixed(1)}" r="2.2" fill="${C.muffinLo}"/>`;
      return s;
    }
    case 'cakeB': case 'cakeT': {
      let s = `<rect x="${x0}" y="${top}" width="${w}" height="${h}" rx="${h / 2}" fill="${C.cake}"/><rect x="${x0 + 10}" y="${top + 2}" width="${w - 20}" height="12" rx="6" fill="#d99353"/>`;
      for (let i = 0; i < 8; i++) s += `<circle cx="${(x0 + 14 + r() * (w - 28)).toFixed(1)}" cy="${(top + 12 + r() * (h - 20)).toFixed(1)}" r="4" fill="${C.syrup}"/>`;
      return s;
    }
    case 'mustard': return '';
  }
  throw new Error('Unknown layer ' + kind);
}

function stack(layers, { w = 300, base = 420, seed = 1 } = {}) {
  const r = rng(seed);
  let y = base, s = '';
  for (const k of layers) { s += layer(k, y, w, r); y -= H[k]; }
  return s;
}

/* ---------- Other items ---------- */
const shadow = (w = 330, y = 432) => `<ellipse cx="${CX}" cy="${y}" rx="${w / 2}" ry="18" fill="#000" opacity=".22"/>`;

function mcrib() {
  const r = rng(7);
  let s = shadow(400);
  // Long hoagie bottom
  s += `<rect x="56" y="330" width="400" height="80" rx="40" fill="${C.bun}"/><rect x="66" y="330" width="380" height="16" rx="8" fill="${C.bunHi}"/>`;
  // Rib patty with bone-shaped ridges
  s += `<rect x="46" y="268" width="420" height="72" rx="30" fill="#4d2412"/>`;
  for (let i = 0; i < 7; i++) s += `<rect x="${72 + i * 54}" y="276" width="30" height="58" rx="15" fill="#6e3419"/>`;
  // BBQ sauce with drips
  let p = 'M40 280';
  for (let x = 40; x < 470; x += 34) p += ` q17 ${-14 - r() * 10} 34 0`;
  s += `<path d="${p} V292 H40 Z" fill="${C.bbq}"/>`;
  for (let i = 0; i < 6; i++) { const x = 70 + i * 70 + r() * 20; s += `<path d="M${x} 288 v${30 + r() * 30} a9 9 0 0 0 18 0 v-${30} Z" fill="${C.bbq}"/>`; }
  s += `<path d="M70 268 q90 -20 180 -6 t180 -4" stroke="${C.bbqHi}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  // Onion slivers + pickles
  for (let i = 0; i < 10; i++) s += `<path d="M${80 + r() * 340} ${256 + r() * 12} q14 -10 28 0" stroke="${C.onion}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  for (let i = 0; i < 4; i++) s += `<ellipse cx="${110 + i * 96}" cy="256" rx="24" ry="9" fill="${C.pickle}" stroke="#5c7f27" stroke-width="3"/>`;
  // Long top roll with flour dust
  s += `<path d="M44 246 C44 150 468 150 468 246 Z" fill="${C.bun}"/>`;
  s += `<path d="M100 200 C160 168 280 162 360 172" stroke="${C.bunHi}" stroke-width="16" fill="none" stroke-linecap="round"/>`;
  for (let i = 0; i < 26; i++) s += `<circle cx="${(90 + r() * 330).toFixed(1)}" cy="${(180 + r() * 50).toFixed(1)}" r="${(1.5 + r() * 2).toFixed(1)}" fill="#fff0d0" opacity=".8"/>`;
  return s;
}

function carton(fill = C.red, { fries = true, count = 13, label = '' } = {}) {
  const r = rng(31);
  let s = shadow(260);
  if (fries) for (let i = 0; i < count; i++) {
    const x = 170 + i * (172 / count) + r() * 6, h = 150 + r() * 70, rot = (r() * 14 - 7).toFixed(1);
    s += `<rect x="${x.toFixed(1)}" y="${(260 - h).toFixed(1)}" width="20" height="${h.toFixed(1)}" rx="4" fill="${i % 3 ? C.fry : C.fryLo}" transform="rotate(${rot} ${x} 300)"/>`;
  }
  s += `<path d="M150 236 Q256 270 362 236 L336 430 H176 Z" fill="${fill}"/>`;
  s += `<path d="M150 236 Q256 270 362 236 L358 262 Q256 296 154 262 Z" fill="#000" opacity=".12"/>`;
  if (label) s += `<text x="256" y="372" font-family="Arial Black, Arial, sans-serif" font-size="40" fill="#fff" text-anchor="middle" opacity=".9">${label}</text>`;
  return s;
}

function nuggets({ color = C.chicken, shapes = 'blob', box = true, n = 6 } = {}) {
  const r = rng(13);
  let s = shadow(330);
  if (box) s += `<path d="M120 300 L392 300 L372 430 H140 Z" fill="${C.red}"/><path d="M120 300 L170 210 H342 L392 300 Z" fill="${C.redLo}"/>`;
  const spots = [[180, 300], [250, 286], [322, 300], [210, 336], [292, 334], [256, 248]].slice(0, n);
  for (const [x, y] of spots) {
    if (shapes === 'blob') s += `<path d="M${x - 38} ${y} q-4 -34 30 -36 q44 -6 46 28 q4 34 -34 38 q-38 4 -42 -30 Z" fill="${color}"/>`;
    else if (shapes === 'ring') s += `<ellipse cx="${x}" cy="${y}" rx="40" ry="30" fill="${color}"/><ellipse cx="${x}" cy="${y}" rx="14" ry="10" fill="#f7e9c0"/>`;
    else if (shapes === 'strip') s += `<rect x="${x - 50}" y="${y - 20}" width="100" height="40" rx="20" fill="${color}" transform="rotate(${(r() * 40 - 20).toFixed(0)} ${x} ${y})"/>`;
    else if (shapes === 'wing') s += `<path d="M${x - 40} ${y + 10} q-6 -46 40 -44 q40 4 30 40 l18 18 a10 10 0 0 1 -14 14 l-18 -16 q-40 18 -56 -12 Z" fill="${color}"/>`;
    for (let i = 0; i < 5; i++) s += `<circle cx="${(x - 24 + r() * 48).toFixed(1)}" cy="${(y - 18 + r() * 30).toFixed(1)}" r="2.6" fill="#000" opacity=".15"/>`;
  }
  return s;
}

function tub(color, lid = '#f4efe6') {
  let s = shadow(240);
  s += `<path d="M150 260 H362 L340 420 H172 Z" fill="${lid}"/><rect x="140" y="236" width="232" height="34" rx="12" fill="#e6dfd2"/>`;
  s += `<ellipse cx="256" cy="246" rx="98" ry="16" fill="${color}"/>`;
  s += `<path d="M300 236 q60 -70 100 -40 q-30 30 -80 46 Z" fill="#fffaf0" stroke="#ddd3c2" stroke-width="3"/>`;
  s += `<rect x="176" y="316" width="160" height="56" rx="10" fill="${color}"/>`;
  return s;
}

function cup({ body = C.red, band = '#fff', lid = '#f5f1ea', straw = true, clear = false, fill = '#7a4a2a', dome = false, cream = '#fff7ec', ice = false, steam = false, sleeve = false, spoon = false, drizzle = null, specks = null, tall = 1 } = {}) {
  const r = rng(77);
  const top = 150 - (tall - 1) * 60, bot = 430;
  let s = shadow(240);
  if (straw) s += `<rect x="268" y="${top - 110}" width="18" height="160" rx="6" fill="${band === '#fff' ? '#f2c84b' : band}" transform="rotate(12 276 ${top})"/>`;
  if (spoon) s += `<rect x="290" y="${top - 120}" width="20" height="170" rx="8" fill="#e0e0e0" transform="rotate(16 300 ${top})"/>`;
  const cupPath = `M150 ${top + 20} H362 L336 ${bot} H176 Z`;
  if (clear) {
    s += `<path d="${cupPath}" fill="#eaf4f7" opacity=".55"/><path d="M158 ${top + 60} H354 L336 ${bot} H176 Z" fill="${fill}"/>`;
    if (ice) for (let i = 0; i < 6; i++) s += `<rect x="${(180 + r() * 130).toFixed(1)}" y="${(top + 70 + r() * 150).toFixed(1)}" width="34" height="34" rx="6" fill="#fff" opacity=".45"/>`;
  } else {
    s += `<path d="${cupPath}" fill="${body}"/>`;
    s += `<path d="M158 ${top + 110} H354 L349 ${top + 150} H163 Z" fill="${band}" opacity=".9"/>`;
  }
  if (sleeve) s += `<path d="M162 ${top + 110} H350 L340 ${top + 210} H172 Z" fill="#a8774d"/>`;
  if (specks) for (let i = 0; i < 24; i++) s += `<circle cx="${(180 + r() * 150).toFixed(1)}" cy="${(top + 70 + r() * 200).toFixed(1)}" r="4" fill="${specks}"/>`;
  if (dome) {
    s += `<path d="M146 ${top + 24} C150 ${top - 70} 362 ${top - 70} 366 ${top + 24} Z" fill="${cream}"/>`;
    s += `<path d="M190 ${top} q30 -40 66 -30 q34 10 50 -10" stroke="#fff" stroke-width="10" fill="none" opacity=".7" stroke-linecap="round"/>`;
    if (drizzle) s += `<path d="M170 ${top + 10} q20 -40 40 -10 t40 -30 t40 10 t40 -20 t20 30" stroke="${drizzle}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
  } else s += `<rect x="140" y="${top + 6}" width="232" height="26" rx="10" fill="${lid}"/>`;
  if (steam) s += [210, 256, 302].map((x) => `<path d="M${x} ${top - 20} q-18 -30 0 -60 q18 -30 0 -60" stroke="#fff" stroke-width="8" fill="none" opacity=".55" stroke-linecap="round"/>`).join('');
  return s;
}

function cone({ cup: inCup = false, topping = null } = {}) {
  let s = shadow(200);
  if (inCup) {
    s += `<path d="M150 300 H362 L340 430 H172 Z" fill="#eef6f8" opacity=".85"/>`;
    s += `<path d="M160 304 C150 220 362 220 352 304 Z" fill="#fffaf0"/><path d="M190 260 C200 190 312 190 322 260 Z" fill="#fffaf0"/><path d="M226 214 q30 -70 60 0 Z" fill="#fffaf0"/>`;
    if (topping) s += `<path d="M170 280 q30 30 50 -10 q20 50 46 0 q24 40 52 0 q18 30 34 4 L352 300 Q256 250 160 300 Z" fill="${topping}"/><path d="M222 220 q34 30 70 -6" stroke="${topping}" stroke-width="14" fill="none" stroke-linecap="round"/>`;
    return s;
  }
  s += `<path d="M200 250 L312 250 L256 440 Z" fill="#d89a4f"/>`;
  for (let i = 0; i < 5; i++) s += `<path d="M${206 + i * 22} 250 L${256} ${440}" stroke="#b97a35" stroke-width="3"/><path d="M${306 - i * 22} 250 L${256} ${440}" stroke="#b97a35" stroke-width="3"/>`;
  s += `<path d="M186 256 C176 190 336 190 326 256 Z" fill="#fffaf0"/><path d="M206 210 C210 150 302 150 306 210 Z" fill="#fffaf0"/><path d="M230 166 q26 -70 52 0 Z" fill="#fffaf0"/>`;
  return s;
}

function pie({ fried = false, color = '#e8b465', filling = '#b8452a' } = {}) {
  const r = rng(fried ? 3 : 4);
  let s = shadow(330);
  if (!fried) s += `<path d="M100 300 L190 196 H420 L330 300 Z" fill="#d93a2b" opacity=".9"/>`;
  s += `<rect x="96" y="250" width="320" height="150" rx="40" fill="${color}"/>`;
  if (fried) for (let i = 0; i < 40; i++) s += `<circle cx="${(116 + r() * 280).toFixed(1)}" cy="${(266 + r() * 120).toFixed(1)}" r="${(3 + r() * 5).toFixed(1)}" fill="#c98a3c" opacity=".8"/>`;
  else for (let i = 0; i < 5; i++) s += `<path d="M${150 + i * 50} 300 l30 50" stroke="#b77b35" stroke-width="10" stroke-linecap="round"/><path d="M${150 + i * 50} 300 l30 50" stroke="${filling}" stroke-width="4" stroke-linecap="round"/>`;
  return s;
}

function cookie() {
  const r = rng(11);
  let s = shadow(300) + `<circle cx="256" cy="300" r="140" fill="#d6a05a"/><circle cx="256" cy="300" r="140" fill="none" stroke="#bd8442" stroke-width="10"/>`;
  for (let i = 0; i < 16; i++) s += `<ellipse cx="${(160 + r() * 190).toFixed(1)}" cy="${(200 + r() * 190).toFixed(1)}" rx="13" ry="10" fill="#4a2512"/>`;
  return s;
}

function plate(inner) { return shadow(380, 420) + `<ellipse cx="256" cy="380" rx="200" ry="56" fill="#fdfbf6"/><ellipse cx="256" cy="374" rx="150" ry="38" fill="#ece6da"/>` + inner; }

function bigBreakfast() {
  return plate(
    `<ellipse cx="190" cy="360" rx="70" ry="34" fill="${C.egg}"/><ellipse cx="190" cy="352" rx="60" ry="24" fill="${C.yolk}" opacity=".6"/>` +
    `<rect x="252" y="330" width="96" height="44" rx="20" fill="#8b4a27"/>` +
    `<ellipse cx="320" cy="300" rx="70" ry="40" fill="${C.muffin}"/>` +
    `<rect x="150" y="270" width="110" height="60" rx="30" fill="#e6b257"/>`
  );
}

function hashBrown() {
  const r = rng(5);
  let s = shadow(320) + `<path d="M120 400 Q100 260 256 236 Q412 214 400 340 Q392 430 256 432 Q132 434 120 400 Z" fill="#e7b04f"/>`;
  for (let i = 0; i < 40; i++) s += `<rect x="${(140 + r() * 240).toFixed(1)}" y="${(260 + r() * 150).toFixed(1)}" width="16" height="4" rx="2" fill="#c98a2c" transform="rotate(${(r() * 180).toFixed(0)} 256 330)"/>`;
  s += `<path d="M90 300 L180 200 H420 L360 300 Z" fill="#f4eee2" opacity=".0"/>`;
  return s;
}

function hotcakes() {
  return shadow(360) + stack(['cakeB', 'cakeB', 'cakeT'], { w: 320, base: 430, seed: 9 }).replace(/<\/?g>/g, '') +
    `<rect x="230" y="296" width="52" height="26" rx="6" fill="#ffe28a"/><path d="M150 330 q30 30 20 70 a10 10 0 0 0 20 0 q0 -40 30 -60" fill="${C.syrup}"/>`;
}

function burrito() {
  let s = shadow(360);
  s += `<rect x="96" y="250" width="320" height="140" rx="70" fill="#f2dfb2" transform="rotate(-12 256 320)"/>`;
  s += `<path d="M90 320 L420 250 L430 330 L100 400 Z" fill="#fff" opacity=".85" transform="rotate(0)"/>`;
  s += `<path d="M90 320 L420 250 L424 268 L94 338 Z" fill="${C.red}"/>`;
  return s;
}

function wrap() {
  let s = shadow(260);
  s += `<path d="M190 150 L330 150 L292 430 L228 430 Z" fill="#f4e3bb"/>`;
  s += `<path d="M190 150 q30 -40 70 -10 q40 -30 70 10 Z" fill="${C.lettuce}"/><rect x="236" y="96" width="46" height="90" rx="20" fill="${C.chicken}" transform="rotate(10 260 140)"/>`;
  s += `<path d="M206 250 L314 250 L300 360 L220 360 Z" fill="#fff" opacity=".9"/><path d="M206 250 L314 250 L312 270 L208 270 Z" fill="${C.red}"/>`;
  return s;
}

function appleSlices() {
  let s = shadow(260) + `<path d="M160 180 H352 L336 430 H176 Z" fill="#eaf4f7" opacity=".8"/>`;
  for (let i = 0; i < 5; i++) s += `<path d="M${190 + (i % 3) * 40} ${230 + i * 36} a50 50 0 0 0 100 0 Z" fill="#fbf3d5" stroke="#78b844" stroke-width="10" transform="rotate(${i * 25 - 40} ${240 + (i % 3) * 40} ${240 + i * 36})"/>`;
  return s;
}

function salad() {
  const r = rng(21);
  let s = shadow(340) + `<path d="M100 300 Q256 470 412 300 Z" fill="#f2f7f8"/>`;
  for (let i = 0; i < 18; i++) s += `<circle cx="${(130 + r() * 250).toFixed(1)}" cy="${(260 + r() * 50).toFixed(1)}" r="${(20 + r() * 16).toFixed(1)}" fill="${r() > 0.4 ? C.lettuce : C.lettuceLo}"/>`;
  s += `<circle cx="210" cy="262" r="14" fill="${C.tomato}"/><circle cx="300" cy="270" r="14" fill="${C.tomato}"/><rect x="240" y="244" width="40" height="10" rx="5" fill="#f08a3c"/>`;
  return s;
}

function pizza() {
  const r = rng(42);
  let s = shadow(380) + `<rect x="66" y="330" width="380" height="80" rx="10" fill="#e9dcc6"/><circle cx="256" cy="280" r="160" fill="#e4a64f"/><circle cx="256" cy="280" r="138" fill="#d84a2a"/>`;
  for (let i = 0; i < 26; i++) s += `<circle cx="${(150 + r() * 210).toFixed(1)}" cy="${(180 + r() * 200).toFixed(1)}" r="${(10 + r() * 10).toFixed(1)}" fill="#ffe8a8"/>`;
  for (let i = 0; i < 9; i++) s += `<circle cx="${(160 + r() * 190).toFixed(1)}" cy="${(190 + r() * 180).toFixed(1)}" r="14" fill="#9e2b1a"/>`;
  return s;
}

function spaghetti() {
  let s = '';
  for (let i = 0; i < 12; i++) s += `<path d="M${150 + i * 18} ${360 - (i % 3) * 8} q20 -60 40 -20 q20 40 40 -20" stroke="#f3d27a" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M180 330 q76 -70 152 0 q-76 30 -152 0 Z" fill="#c8331f"/><circle cx="230" cy="316" r="18" fill="#6e3419"/><circle cx="286" cy="310" r="18" fill="#6e3419"/>`;
  return plate(s);
}

function hotdog({ lobster = false } = {}) {
  const r = rng(8);
  let s = shadow(380);
  s += `<rect x="76" y="290" width="360" height="100" rx="50" fill="${lobster ? '#f4d79a' : C.bun}"/>`;
  if (lobster) {
    for (let i = 0; i < 12; i++) s += `<circle cx="${(110 + r() * 290).toFixed(1)}" cy="${(270 + r() * 30).toFixed(1)}" r="${(20 + r() * 10).toFixed(1)}" fill="${r() > 0.5 ? '#f08d6e' : '#fbe3d4'}"/>`;
    for (let i = 0; i < 8; i++) s += `<circle cx="${(110 + r() * 290).toFixed(1)}" cy="${(258 + r() * 20).toFixed(1)}" r="8" fill="${C.lettuce}"/>`;
  } else {
    s += `<rect x="56" y="262" width="400" height="56" rx="28" fill="#b4472a"/><rect x="70" y="268" width="370" height="12" rx="6" fill="#cf6340"/>`;
    s += `<path d="M90 284 l30 -14 l30 14 l30 -14 l30 14 l30 -14 l30 14 l30 -14 l30 14 l30 -14 l30 14" stroke="#f3c623" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  s += `<path d="M76 340 Q256 380 436 340 L436 350 Q256 400 76 350 Z" fill="#000" opacity=".08"/>`;
  return s;
}

function machine() {
  let s = shadow(360);
  s += `<rect x="116" y="110" width="280" height="310" rx="24" fill="#c9cfd6"/><rect x="132" y="126" width="248" height="120" rx="14" fill="#e8ecf0"/>`;
  s += `<rect x="160" y="150" width="70" height="40" rx="8" fill="#20262c"/><text x="195" y="178" font-family="Courier New, monospace" font-weight="700" font-size="22" fill="#5cff7a" text-anchor="middle">OK</text>`;
  s += `<circle cx="300" cy="170" r="16" fill="#5cff7a"/><circle cx="342" cy="170" r="16" fill="#9aa3ab"/>`;
  for (const x of [196, 316]) s += `<rect x="${x - 26}" y="246" width="52" height="40" rx="8" fill="#9aa3ab"/><rect x="${x - 6}" y="200" width="12" height="60" rx="6" fill="#20262c" transform="rotate(-25 ${x} 230)"/>`;
  s += `<path d="M226 300 C216 250 296 250 286 300 Z" fill="#fffaf0"/><path d="M220 330 L292 330 L284 300 L228 300 Z" fill="#d89a4f"/>`;
  s += `<rect x="130" y="360" width="252" height="20" rx="6" fill="#9aa3ab"/>`;
  for (const [x, y] of [[96, 120], [420, 160], [440, 330], [76, 300]]) s += `<path d="M${x} ${y - 22} L${x + 6} ${y - 6} L${x + 22} ${y} L${x + 6} ${y + 6} L${x} ${y + 22} L${x - 6} ${y + 6} L${x - 22} ${y} L${x - 6} ${y - 6} Z" fill="#fff4b0"/>`;
  return s;
}

function bagged(inner, label = '') {
  return inner;
}

/* ---------- Recipes ---------- */
const burger = (layers, opts) => () => shadow(opts?.w ? opts.w + 40 : 340) + stack(layers, opts);
const ART = {
  'McRib': mcrib,
  'Hamburger': burger(['bunB', 'beef', 'pickle', 'onion', 'bunT'], { seed: 2 }),
  'Cheeseburger': burger(['bunB', 'beef', 'cheese', 'pickle', 'onion', 'bunT'], { seed: 3 }),
  'Double Cheeseburger': burger(['bunB', 'beef', 'cheese', 'beef', 'cheese', 'pickle', 'bunT'], { seed: 4 }),
  'Triple Cheeseburger': burger(['bunB', 'beef', 'cheese', 'beef', 'cheese', 'beef', 'cheese', 'bunT'], { seed: 5 }),
  'McDouble': burger(['bunB', 'beef', 'cheese', 'beef', 'pickle', 'onion', 'bunT'], { seed: 6 }),
  'Big Mac': burger(['bunB', 'sauce', 'shred', 'cheese', 'beef', 'bunM', 'sauce', 'shred', 'pickle', 'beef', 'bunT'], { seed: 7, base: 440 }),
  'Double Big Mac': burger(['bunB', 'beef', 'shred', 'cheese', 'beef', 'bunM', 'sauce', 'shred', 'beef', 'beef', 'bunT'], { seed: 8, base: 444, w: 280 }),
  'Grand Mac': burger(['bunB', 'sauce', 'shred', 'cheese', 'beefT', 'bunM', 'sauce', 'shred', 'beefT', 'bunT'], { seed: 9, base: 440, w: 340 }),
  'Mac Jr.': burger(['bunB', 'sauce', 'shred', 'cheese', 'beef', 'pickle', 'bunT'], { seed: 10, w: 260 }),
  'Quarter Pounder': burger(['bunB', 'beefT', 'cheese', 'pickle', 'onion', 'bunT'], { seed: 11, w: 330 }),
  'Double Quarter Pounder': burger(['bunB', 'beefT', 'cheese', 'beefT', 'cheese', 'onion', 'bunT'], { seed: 12, w: 330 }),
  'Chicken McNuggets': () => nuggets(),
  'McChicken': burger(['bunB', 'chicken', 'shred', 'sauce', 'bunT'], { seed: 14 }),
  'Spicy McChicken': burger(['bunB', 'chicken', 'spicy', 'shred', 'bunT'], { seed: 15 }),
  'McCrispy': burger(['bunB', 'pickle', 'chicken', 'sauce', 'steamT'], { seed: 16, w: 320 }),
  'Spicy McCrispy': burger(['bunB', 'pickle', 'chicken', 'spicy', 'steamT'], { seed: 17, w: 320 }),
  'Deluxe McCrispy': burger(['bunB', 'chicken', 'tomato', 'lettuce', 'sauce', 'steamT'], { seed: 18, w: 320 }),
  'Filet-O-Fish': burger(['steamB', 'fish', 'cheese', 'sauce', 'steamT'], { seed: 19, w: 280 }),
  'Double Filet-O-Fish': burger(['steamB', 'fish', 'cheese', 'fish', 'sauce', 'steamT'], { seed: 20, w: 280 }),
  'Snack Wrap': wrap,
  'Chicken Big Mac': burger(['bunB', 'sauce', 'shred', 'cheese', 'chicken', 'bunM', 'sauce', 'shred', 'chicken', 'bunT'], { seed: 22, base: 444 }),
  'Egg McMuffin': burger(['muffinB', 'bacon', 'egg', 'cheese', 'muffinT'], { seed: 23, w: 280, base: 400 }),
  'Sausage McMuffin': burger(['muffinB', 'sausage', 'cheese', 'muffinT'], { seed: 24, w: 280, base: 400 }),
  'Sausage McMuffin with Egg': burger(['muffinB', 'sausage', 'cheese', 'egg', 'muffinT'], { seed: 25, w: 280, base: 400 }),
  'Hash Brown': hashBrown,
  'Hotcakes': hotcakes,
  'McGriddles': burger(['cakeB', 'sausage', 'egg', 'cheese', 'cakeT'], { seed: 28, w: 290, base: 400 }),
  'Big Breakfast': bigBreakfast,
  'Sausage Burrito': burrito,
  'Fries': () => carton(),
  'Apple Slices': appleSlices,
  'Side Salad': salad,
  'Big Mac Sauce': () => tub('#f4a46a'),
  "Sweet 'N Sour Sauce": () => tub('#e86a2c'),
  'Hot Mustard': () => tub('#d9a514'),
  'Tangy BBQ Sauce': () => tub(C.bbq),
  'Baked Apple Pie': () => pie(),
  'Chocolate Chip Cookie': cookie,
  'Vanilla Cone': () => cone(),
  'Hot Fudge Sundae': () => cone({ cup: true, topping: '#4a2311' }),
  'Caramel Sundae': () => cone({ cup: true, topping: '#d58a2a' }),
  'McFlurry': () => cup({ body: '#f1ece2', band: '#2d6cdf', dome: true, straw: false, spoon: true, specks: '#3b2416', cream: '#fffaf0' }),
  'Vanilla Shake': () => cup({ body: '#fbf3dc', band: '#e8b84a', dome: true, cream: '#fff8e6' }),
  'Chocolate Shake': () => cup({ body: '#6b3a1f', band: '#f1d6b0', dome: true, cream: '#8a4d2a', drizzle: '#3a1a0b' }),
  'Strawberry Shake': () => cup({ body: '#f6a3b7', band: '#fff', dome: true, cream: '#ffc5d3', drizzle: '#d6294a' }),
  'Shamrock Shake': () => cup({ body: '#7fd36b', band: '#fff', dome: true, cream: '#b8f0a6', drizzle: '#2e8b3a' }),
  'Premium Roast Coffee': () => cup({ body: '#f5efe4', band: '#6b4630', straw: false, steam: true, sleeve: true }),
  'Iced Coffee': () => cup({ clear: true, fill: '#9a6a43', ice: true }),
  'Caramel Frappe': () => cup({ clear: true, fill: '#c69564', dome: true, drizzle: '#d58a2a' }),
  'Mocha Frappe': () => cup({ clear: true, fill: '#7a4a2a', dome: true, drizzle: '#3a1a0b' }),
  'Hot Chocolate': () => cup({ body: '#5a2f18', band: '#f5efe4', straw: false, steam: true }),
  'Sweet Tea': () => cup({ clear: true, fill: '#a0521d', ice: true }),
  'Strawberry Banana Smoothie': () => cup({ clear: true, fill: '#f08aa0', dome: false, specks: '#c22b4c' }),
  'Orange Drink': () => cup({ body: '#ff9a1f', band: '#fff' }),
  'Arch Deluxe': burger(['bunB', 'beefT', 'cheese', 'bacon', 'tomato', 'lettuce', 'sauce', 'steamT'], { seed: 56, w: 330 }),
  'McDLT': burger(['bunB', 'beef', 'cheese', 'tomato', 'lettuce', 'onion', 'bunT'], { seed: 57 }),
  'McLean Deluxe': burger(['bunB', 'beef', 'tomato', 'lettuce', 'lettuce', 'bunT'], { seed: 58 }),
  'Hula Burger': burger(['bunB', 'cheese', 'pickle', 'bunT'], { seed: 59 }),
  'McPizza': pizza,
  'McSpaghetti': spaghetti,
  'McHotDog': () => hotdog(),
  'McLobster': () => hotdog({ lobster: true }),
  'Fried Apple Pie': () => pie({ fried: true, color: '#d79a47' }),
  'Chicken Selects': () => nuggets({ shapes: 'strip', box: true, n: 5 }),
  'Mighty Wings': () => nuggets({ shapes: 'wing', color: '#c8622a', box: false, n: 5 }),
  'Onion Nuggets': () => nuggets({ shapes: 'ring', color: '#e3b45a' }),
  'Szechuan Sauce': () => tub('#8c2a12', '#1d1d1d'),
  'Land Sea and Air': burger(['bunB', 'beef', 'cheese', 'bunM', 'chicken', 'shred', 'bunM', 'fish', 'cheese', 'bunT'], { seed: 69, base: 450, w: 280 }),
  'Monster Mac': burger(['bunB', 'beef', 'cheese', 'beef', 'cheese', 'beef', 'bunM', 'beef', 'cheese', 'beef', 'shred', 'bunT'], { seed: 70, base: 452, w: 270 }),
  'Poor Mans Big Mac': burger(['bunB', 'beef', 'cheese', 'sauce', 'shred', 'beef', 'bunT'], { seed: 71 }),
  'McBrunch Burger': burger(['bunB', 'beefT', 'cheese', 'egg', 'bacon', 'bunT'], { seed: 72, w: 320 }),
  'Neapolitan Shake': () => cup({ body: '#6b3a1f', band: '#f6a3b7', dome: true, cream: '#fff8e6', drizzle: '#d6294a' }),
  'Working Ice Cream Machine': machine,
};

const BG = {
  featured: ['#7d140c', '#c0301c'], burgers: ['#d4892a', '#f2b445'], chicken: ['#e0a52c', '#f7d26a'],
  breakfast: ['#e98a3c', '#f9c27a'], sides: ['#b72519', '#e5503a'], sweets: ['#e48aa5', '#f9c9d6'],
  cafe: ['#4a2d1c', '#8a5a3a'], vault: ['#1f2d4d', '#3c5487'], secret: ['#121212', '#3a2f12'],
};

function svg(item) {
  const draw = ART[item.name];
  if (!draw) throw new Error(`No art for ${item.name}`);
  const [a, b] = BG[item.section];
  let rays = '';
  for (let i = 0; i < 16; i++) {
    const t0 = (i / 16) * Math.PI * 2, t1 = t0 + Math.PI / 16;
    rays += `<path d="M256 256 L${256 + 520 * Math.cos(t0)} ${256 + 520 * Math.sin(t0)} L${256 + 520 * Math.cos(t1)} ${256 + 520 * Math.sin(t1)} Z" fill="#fff" opacity=".06"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<defs><radialGradient id="g" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></radialGradient></defs>
<rect width="512" height="512" fill="url(#g)"/>${rays}
<g transform="translate(256 268) scale(.96) translate(-256 -292)">${draw()}</g>
<rect x="18" y="18" width="92" height="44" rx="22" fill="#000" opacity=".35"/>
<text x="64" y="49" font-family="Arial Black, Arial, sans-serif" font-size="24" fill="#fff" text-anchor="middle">${String(item.id).padStart(2, '0')}</text>
</svg>`;
}

(async () => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
  for (const item of ITEMS) {
    await page.setContent(`<html><body style="margin:0">${svg(item)}</body></html>`);
    await page.screenshot({ path: path.join(OUT, `${item.id}.png`), clip: { x: 0, y: 0, width: 512, height: 512 } });
  }
  await browser.close();
  console.log(`Drew ${ITEMS.length} items into public/sprites/`);
})();
