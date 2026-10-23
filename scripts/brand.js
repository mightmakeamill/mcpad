// Draws the McPad brand kit: the mark (a burger lifting off), the wordmark lockups,
// social images and favicons. Writes brand/ and the site's favicon + link card into public/.
// Run: `npm run brand` (needs Playwright; fonts load from Google Fonts).
const fs = require('fs');
const path = require('path');
const { COUNT } = require('../lib/menu.js');

const ROOT = path.join(__dirname, '..');
const BRAND = path.join(ROOT, 'brand');
const PUB = path.join(ROOT, 'public');

const C = { night: '#120e0b', board: '#1c1612', ketchup: '#e2382b', ketchupLo: '#9e2018', mustard: '#f6b92f', pickle: '#93c552', glow: '#fbf1de', receipt: '#f6f2e8', ink: '#2a2018', amber: '#ffb340' };

// The burger, drawn on a 512 grid, tilted up with lift-off lines under it.
const burger = (bun = C.mustard, patty = C.night, seeds = C.night, lettuce = C.pickle, lines = C.mustard, simple = false) => `
  <g transform="rotate(-8 256 270)">
    <path d="M104 236 C104 104 408 104 408 236 Z" fill="${bun}"/>
    ${simple ? '' : `<ellipse cx="196" cy="168" rx="13" ry="7" transform="rotate(-24 196 168)" fill="${seeds}"/>
    <ellipse cx="256" cy="150" rx="13" ry="7" fill="${seeds}"/>
    <ellipse cx="316" cy="168" rx="13" ry="7" transform="rotate(24 316 168)" fill="${seeds}"/>
    <ellipse cx="226" cy="204" rx="13" ry="7" transform="rotate(-10 226 204)" fill="${seeds}"/>
    <ellipse cx="290" cy="204" rx="13" ry="7" transform="rotate(10 290 204)" fill="${seeds}"/>`}
    <path d="M92 244 H420 V258 Q402 278 384 258 Q366 278 348 258 Q330 278 312 258 Q294 278 276 258 Q258 278 240 258 Q222 278 204 258 Q186 278 168 258 Q150 278 132 258 Q114 278 92 258 Z" fill="${lettuce}"/>
    <rect x="86" y="274" width="340" height="54" rx="27" fill="${patty}"/>
    <path d="M104 344 H408 V358 Q408 392 374 392 H138 Q104 392 104 358 Z" fill="${bun}"/>
  </g>
  ${simple ? '' : `<g fill="${lines}">
    <rect x="150" y="420" width="96" height="22" rx="11"/>
    <rect x="270" y="420" width="56" height="22" rx="11"/>
    <rect x="198" y="458" width="64" height="22" rx="11"/>
    <rect x="286" y="458" width="28" height="22" rx="11"/>
  </g>`}`;

const markSvg = ({ bg = C.ketchup, round = 112, ...o } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${bg ? `<rect width="512" height="512" rx="${round}" fill="${bg}"/>` : ''}<g transform="${o.simple ? 'translate(256 256) scale(.98) translate(-256 -250)' : 'translate(256 260) scale(.82) translate(-256 -290)'}">${burger(o.bun, o.patty, o.seeds, o.lettuce, o.lines, o.simple)}</g></svg>`;

const FONTS = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@600;700&family=Courier+Prime:wght@700&display=swap">`;
const page = (w, h, body, bg = 'transparent') => `<!doctype html><html><head>${FONTS}<style>
  *{box-sizing:border-box} html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:${bg}}
  .word{font-family:Anton,Impact,sans-serif;line-height:.86;letter-spacing:.01em}
  .tag{font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
  .mono{font-family:'Courier Prime',monospace;font-weight:700}
  .glow{color:${C.mustard};text-shadow:0 0 3px #fff6d8,0 0 22px rgba(246,185,47,.6),0 0 60px rgba(226,56,43,.5)}
</style></head><body>${body}</body></html>`;

const art = (id) => 'data:image/png;base64,' + fs.readFileSync(path.join(PUB, 'sprites', `${id}.png`)).toString('base64');
const markData = (o) => 'data:image/svg+xml;base64,' + Buffer.from(markSvg(o)).toString('base64');

const tickerStrip = (h, size) => `<div class="mono" style="height:${h}px;background:#0a0806;border-bottom:2px solid #3d3127;color:${C.amber};font-size:${size}px;line-height:${h}px;white-space:nowrap;overflow:hidden;letter-spacing:.08em;text-shadow:0 0 8px rgba(255,179,64,.7);padding-left:24px;background-image:radial-gradient(rgba(255,179,64,.08) 1px,transparent 1.3px);background-size:4px 4px">
  THE McRIB IS <span style="color:${C.glow}">BACK</span> &nbsp;·&nbsp; ORDER <span style="color:${C.glow}">#07</span> BIG MAC &nbsp;·&nbsp; ORDER <span style="color:${C.glow}">#31</span> FRIES &nbsp;·&nbsp; <span style="color:${C.glow}">${COUNT}</span> ITEMS · ONE LAUNCH EACH &nbsp;·&nbsp; PLEASE PULL FORWARD &nbsp;·&nbsp; ORDER <span style="color:${C.glow}">#13</span> NUGGETS</div>`;

const lockup = (dark, scale = 1) => `<div id="crop" style="display:inline-flex;align-items:center;gap:${28 * scale}px;padding:${40 * scale}px">
  <img src="${markData()}" style="width:${180 * scale}px;height:${180 * scale}px">
  <div><div class="word ${dark ? 'glow' : ''}" style="font-size:${150 * scale}px;${dark ? '' : `color:${C.ketchup}`}">McPAD</div>
  <div class="tag" style="font-size:${26 * scale}px;margin-top:${14 * scale}px;color:${dark ? '#b5a089' : C.ink}">Drive-thru launchpad · pump.fun</div></div></div>`;

const JOBS = [
  // [file, width, height, html, transparent]
  ['brand/mcpad-mark-1024.png', 1024, 1024, `<img src="${markData()}" width="1024" height="1024">`, true],
  ['brand/mcpad-mark-transparent-1024.png', 1024, 1024, `<img src="${markData({ bg: null, patty: C.ketchupLo, seeds: C.ketchup })}" width="1024" height="1024">`, true],
  ['brand/mcpad-pfp-400.png', 400, 400, `<img src="${markData({ round: 0 })}" width="400" height="400">`],
  ['brand/mcpad-wordmark-dark.png', 1200, 400, lockup(true, 1).replace('id="crop" style="', `id="crop" style="background:${C.night};`)],
  ['brand/mcpad-wordmark-light.png', 1200, 400, lockup(false, 1).replace('id="crop" style="', `id="crop" style="background:${C.receipt};`)],
  ['brand/mcpad-wordmark-transparent.png', 1200, 400, lockup(true, 1), true],
  ['public/og.png', 1200, 630, `<div style="width:1200px;height:630px;background:radial-gradient(120% 140% at 72% 45%,#b2281a 0%,#6d130b 50%,${C.night} 100%);position:relative;overflow:hidden">
      ${tickerStrip(46, 18)}
      <img src="${art(1)}" style="position:absolute;right:-40px;top:70px;width:600px;height:600px;-webkit-mask-image:radial-gradient(closest-side,#000 68%,transparent)">
      <div style="position:absolute;left:64px;top:118px;width:620px">
        <div style="display:flex;align-items:center;gap:18px"><img src="${markData()}" style="width:84px;height:84px"><div class="word glow" style="font-size:84px">McPAD</div></div>
        <div class="word" style="font-size:108px;color:${C.glow};margin-top:34px">THE McRIB<br><span style="color:${C.mustard}">IS BACK</span></div>
        <div class="tag" style="font-size:24px;color:#f3d9c4;margin-top:26px;letter-spacing:.1em;white-space:nowrap">Order a coin off the menu · ${COUNT} items · one launch each</div>
      </div></div>`],
  ['brand/mcpad-x-banner-1500x500.png', 1500, 500, `<div style="width:1500px;height:500px;background:${C.night};position:relative;overflow:hidden">
      ${tickerStrip(54, 20)}
      <div style="position:absolute;left:0;right:0;top:54px;bottom:0;display:grid;grid-template-columns:repeat(6,1fr);gap:0;opacity:.95">
        ${[1, 7, 31, 13, 43, 27].map((id) => `<div style="background:url(${art(id)}) center/cover"></div>`).join('')}
      </div>
      <div style="position:absolute;inset:54px 0 0 0;background:linear-gradient(90deg,rgba(18,14,11,.15) 0%,rgba(18,14,11,.55) 40%,rgba(18,14,11,.94) 62%)"></div>
      <div style="position:absolute;right:70px;top:120px;text-align:right">
        <div class="word glow" style="font-size:150px">McPAD</div>
        <div class="tag" style="font-size:30px;color:${C.glow};margin-top:20px;text-transform:none">THE McRIB IS BACK</div>
        <div class="tag" style="font-size:22px;color:#b5a089;margin-top:10px;letter-spacing:.16em">Order a coin off the menu · pump.fun</div>
      </div></div>`],
  ['public/apple-touch-icon.png', 180, 180, `<img src="${markData({ round: 0 })}" width="180" height="180">`],
  ['public/favicon-32.png', 32, 32, `<img src="${markData({ round: 6, simple: true })}" width="32" height="32">`, true],
];

(async () => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  fs.mkdirSync(BRAND, { recursive: true });
  fs.writeFileSync(path.join(BRAND, 'mcpad-mark.svg'), markSvg());
  fs.writeFileSync(path.join(BRAND, 'mcpad-mark-transparent.svg'), markSvg({ bg: null, patty: C.ketchupLo, seeds: C.ketchup }));
  fs.writeFileSync(path.join(PUB, 'favicon.svg'), markSvg({ round: 96 }));
  const browser = await chromium.launch();
  for (const [file, w, h, body, transparent] of JOBS) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    await p.setContent(page(w, h, body));
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    const crop = await p.$('#crop');
    if (crop) await crop.screenshot({ path: path.join(ROOT, file), omitBackground: !!transparent });
    else await p.screenshot({ path: path.join(ROOT, file), omitBackground: !!transparent });
    await p.close();
  }
  await browser.close();
  console.log(`Wrote ${JOBS.length + 3} brand files`);
})();
