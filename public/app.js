/* McPad client. Runs "live" when served by the API (real pump.fun launches through
   the customer's wallet); the single-file build (art inlined) runs a demo. */
(() => {
  const { ITEMS, COUNT, byId, SECTIONS, ticker, BALLS, badgesFor } = window.MENU;
  const SIZES = BALLS;
  const $ = (s, el = document) => el.querySelector(s);
  const no = (n) => String(n).padStart(2, '0');
  const short = (a) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : '');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const sprite = (id) => (window.SPRITES && window.SPRITES[id]) || `sprites/${id}.png`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('mcpad:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('mcpad:' + k, JSON.stringify(v)); } catch {} },
  };

  const state = {
    mode: 'demo',
    caught: {},
    pending: {},
    names: {},
    q: '',
    show: 'all',
    wallet: null,
    provider: null,
    size: store.get('size', 'small'),
    muted: store.get('muted', false),
    busy: false,
    open: null,
  };

  /* ---------------- Sound: register beeps and a pickup chime ---------------- */
  let actx;
  function tone(seq, type = 'sine', vol = 0.07) {
    if (state.muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      let t = actx.currentTime;
      for (const [f, d] of seq) {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d);
        t += d * 0.9;
      }
    } catch {}
  }
  const sfx = {
    beep: () => tone([[1320, 0.06]], 'square', 0.03),
    ring: () => tone([[880, 0.08], [1320, 0.12]], 'square', 0.035),
    print: () => tone(Array.from({ length: 10 }, () => [180 + Math.random() * 60, 0.07]), 'sawtooth', 0.02),
    ready: () => tone([[784, 0.18], [988, 0.18], [1175, 0.4]], 'triangle', 0.09),
    fail: () => tone([[392, 0.16], [311, 0.32]], 'triangle', 0.08),
  };

  /* ---------------- Status helpers ---------------- */
  const soldCount = () => Object.keys(state.caught).length;
  function status(id) {
    if (state.caught[id]) return 'sold';
    if (state.pending[id] && state.pending[id].trainer !== state.wallet) return 'pending';
    return 'open';
  }
  const customer = (addr) => (addr === state.wallet ? store.get('name', 'HUNGRY') : state.names[addr]) || short(addr);
  const pumpUrl = (mint) => `https://pump.fun/coin/${mint}`;
  const txUrl = (sig) => `https://solscan.io/tx/${sig}`;
  const sizeOf = (key) => SIZES.find((s) => s.key === key) || SIZES[0];
  const sectionOf = (key) => SECTIONS.find((s) => s.key === key);
  const myOrders = () =>
    Object.entries(state.caught).filter(([, c]) => c.trainer === state.wallet).map(([id, c]) => ({ id: +id, ...c })).sort((a, b) => b.ts - a.ts);
  const superUsed = () => myOrders().some((c) => c.ball === 'super');
  function ago(ts) {
    const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.round(s / 60)}m ago`;
    if (s < 86400) return `${Math.round(s / 3600)}h ago`;
    return `${Math.round(s / 86400)}d ago`;
  }
  const recent = () => Object.entries(state.caught).map(([id, c]) => ({ id: +id, ...c })).sort((a, b) => b.ts - a.ts);

  /* ---------------- Rendering ---------------- */
  function renderTop() {
    const n = soldCount();
    $('#servedNum').textContent = n;
    $('#totalNum').textContent = COUNT;
    $('#servedBar i').style.width = `${(n / COUNT) * 100}%`;
    const chip = $('#modeChip');
    chip.textContent = state.mode === 'live' ? 'LIVE' : 'DEMO';
    chip.className = 'mode' + (state.mode === 'live' ? ' live' : '');
    const w = $('#walletBtn');
    w.textContent = state.wallet ? customer(state.wallet) : 'Connect wallet';
    w.classList.toggle('on', !!state.wallet);
    $('#muteBtn').setAttribute('aria-pressed', String(state.muted));
  }

  function renderTicker() {
    const n = soldCount();
    const lines = ['THE McRIB IS <b>BACK</b>', `<b>${n}/${COUNT}</b> ITEMS LAUNCHED`, `<b>${COUNT - n}</b> STILL ON THE MENU`];
    for (const r of recent().slice(0, 8))
      lines.push(`ORDER <b>#${no(r.id)}</b> ${esc(byId(r.id).name.toUpperCase())} · $${ticker(byId(r.id))} · ${esc(customer(r.trainer))}`);
    $('#ticker').innerHTML = [...lines, ...lines].map((l) => `<span>${l}</span>`).join('');
  }

  function renderPromo() {
    const rib = byId(1), st = status(1), c = state.caught[1];
    let action;
    if (st === 'sold')
      action = `<p class="promo-sold">Gone again. $MCRIB was launched by ${esc(customer(c.trainer))} ${ago(c.ts)}.` +
        (state.mode === 'live' ? ` <a href="${pumpUrl(c.mint)}" target="_blank" rel="noopener">See it on pump.fun</a>` : '') + `</p>`;
    else if (st === 'pending') action = `<p class="promo-sold">Someone is at the window ordering it right now.</p>`;
    else action = `<button class="btn btn-primary" type="button" data-order="1">Order the McRib</button>`;
    $('#promo').innerHTML = `
      <div class="promo-art"><img src="${sprite(1)}" alt="${esc(rib.name)}, a long rib patty in BBQ sauce with onions and pickles"></div>
      <div class="promo-copy">
        <p class="promo-kicker">No. 01 · For a limited time</p>
        <h1 class="promo-title">The McRib <em>is back</em></h1>
        <p class="promo-text">Saucy, ribbed, and gone again before you know it. One person launches $MCRIB on pump.fun, and then it's off the menu for good. After that, ${COUNT - 1} more items wait on the board.</p>
        <div class="promo-meta">${action}<span class="tick-chip">$${ticker(rib)}</span></div>
      </div>`;
  }

  function renderRail() {
    $('#rail').innerHTML = SECTIONS.map((s) => {
      const items = ITEMS.filter((p) => p.section === s.key);
      const sold = items.filter((p) => state.caught[p.id]).length;
      return `<button class="plaque" type="button" data-jump="${s.key}">${esc(s.name)}<small>${sold}/${items.length}</small></button>`;
    }).join('');
  }

  function matches(p) {
    const q = state.q.trim().toLowerCase();
    if (q && !(p.name.toLowerCase().includes(q) || ticker(p).toLowerCase().includes(q) || String(p.id) === q)) return false;
    const st = status(p.id);
    if (state.show === 'open' && st !== 'open') return false;
    if (state.show === 'sold' && st !== 'sold') return false;
    return true;
  }

  function itemRow(p) {
    const st = status(p.id), c = state.caught[p.id];
    let sub = '', price = '', label = '';
    if (st === 'open') { price = `${SIZES[0].sol}<small>SOL+</small>`; label = 'Order'; }
    if (st === 'sold') {
      sub = `<span class="item-who">${esc(customer(c.trainer))} · ${ago(c.ts)}${c.trainer === state.wallet ? '<i class="mine-dot" title="Yours"></i>' : ''}</span>`;
      price = `${sizeOf(c.ball).sol}<small>SOL</small>`; label = 'Launched';
    }
    if (st === 'pending') { sub = `<span class="item-who">Someone is at the window</span>`; price = '…'; label = 'Preparing'; }
    return `<li><button class="item st-${st}" type="button" data-order="${p.id}" id="item-${p.id}">
      <span class="thumb"><img src="${sprite(p.id)}" alt="" loading="lazy"></span>
      <span class="item-main">
        <span class="item-no">No. ${no(p.id)}</span> <span class="item-tick">$${ticker(p)}</span>
        <span class="item-name">${esc(p.name)}</span>
        ${sub}
      </span>
      <span class="price"><span class="price-sol">${price}</span><span class="price-label">${label}</span></span>
    </button></li>`;
  }

  function renderBoard() {
    const html = SECTIONS.map((s) => {
      const items = ITEMS.filter((p) => p.section === s.key && matches(p));
      if (!items.length) return '';
      return `<section class="panel ${s.key}" id="sec-${s.key}" aria-labelledby="h-${s.key}">
        <header class="panel-head"><h2 id="h-${s.key}">${esc(s.name)}</h2><p>${esc(s.note)}</p></header>
        <ul class="items">${items.map(itemRow).join('')}</ul>
      </section>`;
    }).join('');
    $('#board').innerHTML = html || `<div class="panel"><p class="empty">Nothing on the menu matches that. Try another search.</p></div>`;
  }

  function renderSide() {
    const prep = Object.entries(state.pending).filter(([id]) => !state.caught[id]);
    $('#preparing').innerHTML = prep.length
      ? prep.map(([id]) => `<li><button type="button" data-order="${id}">#${no(id)}<span>${esc(byId(+id).name)}</span></button></li>`).join('')
      : `<li class="none">No orders cooking.</li>`;
    const rec = recent().slice(0, 6);
    $('#serving').innerHTML = rec.length
      ? rec.map((r) => `<li><button type="button" data-order="${r.id}">#${no(r.id)}<span>${esc(byId(r.id).name)}</span></button></li>`).join('')
      : `<li class="none">Nothing served yet.</li>`;

    const punch = $('#punch');
    if (!state.wallet) {
      punch.innerHTML = `<h2 id="cardTitle">Punch card</h2><p class="card-sub">Earn a stamp for every part of the menu you launch from.</p>
        <button class="btn btn-red" type="button" id="cardConnect">Connect wallet</button>`;
    } else {
      const stamps = badgesFor(state.wallet, state.caught);
      const mine = myOrders();
      punch.innerHTML = `<h2 id="cardTitle">Punch card</h2>
        <p class="card-sub">${stamps.filter((b) => b.earned).length} of ${stamps.length} stamps · ${mine.length} launched</p>
        <label class="card-name" for="cname">Name<input id="cname" maxlength="12" value="${esc(store.get('name', 'HUNGRY'))}"></label>
        <ul class="punches">${stamps.map((b) => `<li class="punch${b.earned ? ' got' : ''}" title="Launch ${b.count} from ${esc(sectionOf(b.section).name)}">
          <span class="hole">${b.earned ? '✓' : `${Math.min(b.have, b.count)}/${b.count}`}</span>${esc(b.name)}</li>`).join('')}</ul>
        ${mine.length ? `<ol class="my-orders">${mine.slice(0, 6).map((o) => `<li><span>#${no(o.id)} $${ticker(byId(o.id))}</span>${state.mode === 'live' ? `<a href="${pumpUrl(o.mint)}" target="_blank" rel="noopener">pump.fun</a>` : `<span>${sizeOf(o.ball).name}</span>`}</li>`).join('')}</ol>` : ''}`;
    }

    const tally = {};
    for (const c of Object.values(state.caught)) tally[c.trainer] = (tally[c.trainer] || 0) + 1;
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 5);
    $('#regulars').innerHTML = top.length
      ? top.map(([a, n]) => `<li><b>${esc(customer(a))}</b><span>${n} launched</span></li>`).join('')
      : `<li class="none">The lot is empty. Be the first car.</li>`;
  }

  function render() {
    renderTop(); renderTicker(); renderPromo(); renderRail(); renderBoard(); renderSide();
    if (state.open && !state.busy && !$('#window').hidden && !orderDone) renderOrder(state.open);
  }

  function measure() {
    const r = document.documentElement.style;
    r.setProperty('--topbar-h', `${$('.topbar').offsetHeight}px`);
    r.setProperty('--rail-h', `${$('.rail').offsetHeight}px`);
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 3800);
  }

  /* ---------------- Wallet ---------------- */
  async function connect() {
    if (state.mode === 'demo') {
      state.wallet = DEMO_ME;
      render();
      toast('Demo wallet connected. Orders here are simulated.');
      return true;
    }
    const provider = window.phantom?.solana || window.solflare || window.backpack?.solana || window.solana;
    if (!provider) { toast('No Solana wallet found. Install Phantom, Solflare or Backpack and reload.'); return false; }
    try {
      const r = await provider.connect();
      state.provider = provider;
      state.wallet = (r?.publicKey || provider.publicKey).toString();
      render();
      return true;
    } catch { toast('Wallet connection was cancelled.'); return false; }
  }

  let web3Promise;
  const loadWeb3 = () =>
    (web3Promise ||= new Promise((ok, no) => {
      if (window.solanaWeb3) return ok(window.solanaWeb3);
      const s = document.createElement('script');
      s.src = 'vendor/index.iife.min.js';
      s.onload = () => ok(window.solanaWeb3);
      s.onerror = () => no(new Error('Could not load the Solana library.'));
      document.head.appendChild(s);
    }));
  const b64ToBytes = (b) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
  const bytesToB64 = (u) => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };

  async function api(path, body) {
    const r = await fetch(path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || `Server error ${r.status}`);
    return j;
  }

  // Live launch: server builds the pump.fun create tx; the mint keypair co-signs, the wallet signs and sends.
  async function catchLive(id, ball, step) {
    const w3 = await loadWeb3();
    const mint = w3.Keypair.generate();
    step(0, 'Writing the coin\'s menu card and building the launch…');
    const prep = await api('/api/catch/prepare', { dex: id, trainer: state.wallet, mint: mint.publicKey.toBase58(), ball });
    step(1, 'Approve the launch in your wallet.');
    const tx = w3.VersionedTransaction.deserialize(b64ToBytes(prep.tx));
    // 4001 = the customer rejected it in the wallet; anything else is a send failure.
    const declined = (e) => {
      api('/api/catch/cancel', { dex: id, trainer: state.wallet }).catch(() => {});
      return e?.code === 4001 || /reject|cancel|denied/i.test(e?.message || '')
        ? new Error('You drove off. The wallet request was declined.')
        : new Error(`Your wallet could not send the launch: ${e?.message || 'unknown error'}`);
    };
    let res;
    if (state.provider.signAndSendTransaction) {
      // Preferred by Phantom: the mint co-signs first, the wallet signs and sends.
      tx.sign([mint]);
      let sent;
      try { sent = await state.provider.signAndSendTransaction(tx); } catch (e) { throw declined(e); }
      step(2, 'Waiting for Solana to confirm the launch.');
      res = await api('/api/catch/confirm', { dex: id, signature: sent.signature || sent });
    } else {
      let signed;
      try { signed = await state.provider.signTransaction(tx); } catch (e) { throw declined(e); }
      signed.sign([mint]);
      step(2, 'Waiting for Solana to confirm the launch.');
      res = await api('/api/catch/submit', { dex: id, tx: bytesToB64(signed.serialize()) });
    }
    return { mint: res.mint, signature: res.signature };
  }

  async function catchDemo(id, ball, step) {
    if (state.pending[id]) throw new Error(`Someone else is ordering the ${byId(id).name} right now. Try again in a minute.`);
    step(0, 'Writing the coin\'s menu card… (demo)'); await sleep(1000);
    step(1, 'Approve the launch in your wallet. (demo: auto-approved)'); await sleep(1100);
    step(2, 'Waiting for Solana to confirm the launch.'); await sleep(2400);
    return { mint: fakeKey(Math.random) + 'pump', signature: fakeKey(Math.random) + fakeKey(Math.random) };
  }

  /* ---------------- The order window ---------------- */
  const win = $('#window');
  let orderDone = false;
  const light = (cls) => { $('#speakerLight').className = 'speaker-light' + (cls ? ' ' + cls : ''); };

  function cupSvg(i) {
    const h = 26 + i * 9, w = 22 + i * 3;
    return `<svg width="${w + 8}" height="${h + 14}" viewBox="0 0 ${w + 8} ${h + 14}" aria-hidden="true">
      <rect x="${w / 2 + 3}" y="0" width="4" height="16" rx="2" fill="#f6b92f" transform="rotate(10 ${w / 2 + 5} 14)"/>
      <rect x="1" y="10" width="${w + 6}" height="5" rx="2" fill="#f6f2e8"/>
      <path d="M3 15 H${w + 5} L${w + 1} ${h + 13} H7 Z" fill="#e2382b"/>
      <rect x="5" y="${15 + h * 0.35}" width="${w - 2}" height="5" fill="#f6f2e8" opacity=".85"/></svg>`;
  }

  function itemHead(p, sub) {
    return `<div class="scr-head"><span id="winTitle">Order No. ${no(p.id)}</span><span>${esc(sectionOf(p.section).name)}</span></div>
      <div class="scr-item"><img src="${sprite(p.id)}" alt=""><div><h3>${esc(p.name)}</h3><p>$${ticker(p)} · ${sub}</p></div></div>`;
  }

  function renderOrder(id) {
    const p = byId(id), st = status(id), c = state.caught[id];
    const screen = $('#screen');
    $('#receipt').hidden = true;
    if (st === 'sold') {
      light('');
      screen.innerHTML = itemHead(p, `launched ${ago(c.ts)}`) +
        `<p class="scr-msg">Sold out. ${esc(customer(c.trainer))} launched it with a ${esc(sizeOf(c.ball).name)} (${sizeOf(c.ball).sol} SOL first buy). Mint ${short(c.mint)}.</p>
        <div class="scr-actions">${state.mode === 'live'
          ? `<a class="btn btn-primary" href="${pumpUrl(c.mint)}" target="_blank" rel="noopener">Trade on pump.fun</a><a class="btn btn-ghost" href="${txUrl(c.signature)}" target="_blank" rel="noopener">Solscan</a>`
          : `<button class="btn btn-ghost" type="button" data-close>Back to the menu</button>`}</div>`;
      return;
    }
    if (st === 'pending') {
      light('busy');
      screen.innerHTML = itemHead(p, 'being ordered') +
        `<p class="scr-msg">Someone else is at the window ordering this right now. Their hold lasts up to two minutes; if they drive off, it comes back on the menu.</p>
        <div class="scr-actions"><button class="btn btn-ghost" type="button" data-close>Back to the menu</button></div>`;
      return;
    }
    light('on');
    if (state.size === 'super' && superUsed()) state.size = 'large';
    const s = sizeOf(state.size);
    screen.innerHTML = itemHead(p, 'available') +
      `<div class="sizes" role="group" aria-label="Size">${SIZES.map((x, i) => {
        const off = x.oncePerTrainer && superUsed();
        return `<button class="size" type="button" data-size="${x.key}" aria-pressed="${x.key === s.key}" ${off ? 'disabled title="You already used your Super Size"' : ''}>${cupSvg(i)}<b>${esc(x.name)}</b><span>${x.sol} SOL</span></button>`;
      }).join('')}</div>
      <p class="size-note">${esc(s.blurb)}</p>
      <div class="total"><span>First buy on pump.fun</span><b>${s.sol} SOL</b></div>
      <p class="scr-msg">Plus Solana network and pump.fun creation fees. Your wallet signs and pays; McPad never holds your keys.${state.mode === 'demo' ? ' This is the demo, so nothing is sent.' : ''}</p>
      <div class="scr-actions">
        ${state.wallet
          ? `<button class="btn btn-primary" type="button" id="placeBtn">Place order · ${s.sol} SOL</button>`
          : `<button class="btn btn-primary" type="button" id="connectOrder">Connect wallet to order</button>`}
        <button class="btn btn-ghost" type="button" data-close>Cancel</button>
      </div>`;
  }

  function openOrder(id) {
    state.open = id;
    orderDone = false;
    win.hidden = false;
    document.body.style.overflow = 'hidden';
    renderOrder(id);
    sfx.ring();
    $('#winClose').focus();
  }

  function closeOrder() {
    if (state.busy) return;
    win.hidden = true;
    document.body.style.overflow = '';
    const id = state.open;
    state.open = null;
    orderDone = false;
    render();
    if (id) document.getElementById(`item-${id}`)?.focus({ preventScroll: true });
  }

  const STEPS = [
    ['Ringing it up', 'Writing the menu card and building the launch'],
    ['Pay at the window', 'Approve the launch in your wallet'],
    ['Cooking', 'Waiting for Solana to confirm'],
  ];

  async function placeOrder(id) {
    const p = byId(id), s = sizeOf(state.size);
    state.busy = true;
    store.set('size', s.key);
    light('busy');
    const screen = $('#screen');
    screen.innerHTML = itemHead(p, `${s.name} · ${s.sol} SOL`) +
      `<ol class="steps">${STEPS.map(([t, d], i) => `<li data-step="${i}"><i></i><div>${t}<small>${d}</small></div></li>`).join('')}</ol>
       <p class="scr-msg" id="stepMsg" aria-live="polite"></p>`;
    const step = (n, msg) => {
      screen.querySelectorAll('[data-step]').forEach((li, i) => { li.className = i < n ? 'done' : i === n ? 'now' : ''; });
      $('#stepMsg').textContent = msg;
      sfx.beep();
    };
    const stampsBefore = badgesFor(state.wallet, state.caught).filter((b) => b.earned).map((b) => b.name);
    try {
      const res = await (state.mode === 'live' ? catchLive : catchDemo)(id, s.key, step);
      state.caught[id] = { mint: res.mint, trainer: state.wallet, ball: s.key, signature: res.signature, ts: Date.now() };
      if (state.mode === 'demo') store.set('demoOrders', { ...store.get('demoOrders', {}), [id]: state.caught[id] });
      screen.querySelectorAll('[data-step]').forEach((li) => (li.className = 'done'));
      $('#stepMsg').textContent = '';
      const stamps = badgesFor(state.wallet, state.caught).filter((b) => b.earned && !stampsBefore.includes(b.name));
      orderDone = true;
      light('on');
      screen.insertAdjacentHTML('beforeend', `<div class="scr-actions">
        ${state.mode === 'live' ? `<a class="btn btn-primary" href="${pumpUrl(res.mint)}" target="_blank" rel="noopener">Open on pump.fun</a><a class="btn btn-ghost" href="${txUrl(res.signature)}" target="_blank" rel="noopener">Solscan</a>` : ''}
        <button class="btn ${state.mode === 'live' ? 'btn-ghost' : 'btn-primary'}" type="button" data-close>Order something else</button></div>`);
      printReceipt(p, s, res, stamps);
      render();
    } catch (e) {
      light('err');
      sfx.fail();
      screen.querySelector('.steps')?.remove();
      $('#stepMsg')?.remove();
      screen.insertAdjacentHTML('beforeend', `<div class="scr-error" role="alert"><b>We couldn't complete that order</b>${esc(e.message)}</div>
        <div class="scr-actions"><button class="btn btn-primary" type="button" data-order="${id}">Try again</button><button class="btn btn-ghost" type="button" data-close>Back to the menu</button></div>`);
      refresh();
    } finally {
      state.busy = false;
    }
  }

  function printReceipt(p, s, res, stamps) {
    const r = $('#receipt');
    const d = new Date();
    r.innerHTML = `<h4>McPAD DRIVE-THRU</h4>
      <p class="c">LANE 1 · ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      <hr><p class="c">ORDER</p><p class="big">#${no(p.id)}</p><hr>
      <div class="row"><span>1 ${esc(p.name.toUpperCase())}</span><span>${esc(s.name.toUpperCase())}</span></div>
      <div class="row"><span>TICKER</span><span>$${ticker(p)}</span></div>
      <div class="row"><span>FIRST BUY</span><span>${s.sol} SOL</span></div>
      <div class="row"><span>CUSTOMER</span><span>${esc(customer(state.wallet))}</span></div>
      <hr>
      <div class="row"><span>MINT</span><span>${short(res.mint)}</span></div>
      <div class="row"><span>TX</span><span>${short(res.signature)}</span></div>
      ${stamps.length ? `<hr>${stamps.map((b) => `<p class="c">★ STAMP EARNED: ${esc(b.name.toUpperCase())} ★</p>`).join('')}` : ''}
      <hr><p class="c">${state.mode === 'live' ? 'THANK YOU. PLEASE PULL FORWARD.' : 'DEMO RECEIPT · NOTHING WAS SENT'}</p>
      ${state.mode === 'live' ? `<div class="links"><a href="${pumpUrl(res.mint)}" target="_blank" rel="noopener">pump.fun</a><a href="${txUrl(res.signature)}" target="_blank" rel="noopener">solscan</a></div>` : ''}`;
    r.hidden = false;
    r.classList.remove('print'); void r.offsetWidth; r.classList.add('print');
    sfx.print();
    setTimeout(sfx.ready, reduced ? 0 : 1500);
    for (const b of stamps) toast(`Stamp earned: ${b.name}`);
  }

  async function startOrder(id) {
    if (state.busy) return;
    openOrder(id);
  }

  /* ---------------- Welcome ---------------- */
  function welcome() {
    $('#welcome').hidden = false;
    $('#welMcrib').focus();
  }
  function closeWelcome() { $('#welcome').hidden = true; store.set('welcomed', true); }

  /* ---------------- Demo data ---------------- */
  const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function fakeKey(r) { let s = ''; for (let i = 0; i < 40; i++) s += B58[Math.floor(r() * 58)]; return s; }
  const r0 = rng(74);
  const DEMO_ME = fakeKey(r0) + 'Rib1';
  const DEMO_CUSTOMERS = { BIGBOI: fakeKey(r0), NUGGZ: fakeKey(r0), FRYGUY: fakeKey(r0), SHAKEY: fakeKey(r0), SAUCEBOSS: fakeKey(r0) };
  function seedDemo() {
    const r = rng(11);
    const t = Object.values(DEMO_CUSTOMERS);
    const plan = {
      [DEMO_ME]: [[2, 'medium'], [3, 'small'], [31, 'small']],
      [t[0]]: [[7, 'large'], [11, 'medium'], [6, 'small'], [9, 'small'], [22, 'medium']],
      [t[1]]: [[13, 'super'], [35, 'small'], [14, 'small'], [15, 'small']],
      [t[2]]: [[23, 'medium'], [24, 'small'], [26, 'small'], [32, 'small']],
      [t[3]]: [[48, 'small'], [53, 'small'], [38, 'medium']],
      [t[4]]: [[19, 'large'], [34, 'small'], [16, 'medium']],
    };
    const now = Date.now();
    let k = 0;
    for (const [trainer, list] of Object.entries(plan))
      for (const [id, ball] of list)
        state.caught[id] = { trainer, ball, mint: fakeKey(r) + 'pump', signature: fakeKey(r), ts: now - (k++ * 41 + Math.floor(r() * 30)) * 60000 };
    Object.assign(state.caught, store.get('demoOrders', {}));
    state.pending[8] = { trainer: t[0], expires: now + 60000 };
    state.names = Object.fromEntries(Object.entries(DEMO_CUSTOMERS).map(([n, a]) => [a, n]));
    state.wallet = DEMO_ME;
  }

  async function refresh() {
    if (state.mode !== 'live') return;
    try {
      const reg = await api('/api/registry');
      state.caught = reg.caught; state.pending = reg.pending;
      if (!state.busy) render();
    } catch (e) {
      if (!refresh.warned) { refresh.warned = true; toast(e.message); }
    }
  }

  /* ---------------- Events ---------------- */
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-order]');
    if (o) { sfx.beep(); if (!$('#welcome').hidden) closeWelcome(); startOrder(+o.dataset.order); return; }
    const sz = e.target.closest('[data-size]');
    if (sz && !sz.disabled) { sfx.beep(); state.size = sz.dataset.size; renderOrder(state.open); $(`[data-size="${state.size}"]`)?.focus(); return; }
    if (e.target.closest('#placeBtn')) { placeOrder(state.open); return; }
    if (e.target.closest('#connectOrder')) { connect().then((ok) => ok && renderOrder(state.open)); return; }
    if (e.target.closest('[data-close]') || e.target.closest('#winClose') || e.target === win) { closeOrder(); return; }
    const j = e.target.closest('[data-jump]');
    if (j) {
      sfx.beep();
      if (state.q || state.show !== 'all') { state.q = ''; state.show = 'all'; $('#search').value = ''; $('#show').value = 'all'; renderBoard(); }
      document.getElementById(`sec-${j.dataset.jump}`)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      document.querySelectorAll('.plaque').forEach((b) => b.classList.toggle('on', b === j));
      return;
    }
    if (e.target.closest('#surpriseBtn')) {
      const open = ITEMS.filter((p) => status(p.id) === 'open');
      if (!open.length) { toast('The kitchen is out of everything you can order right now.'); return; }
      startOrder(open[Math.floor(Math.random() * open.length)].id);
      return;
    }
    if (e.target.closest('#walletBtn') || e.target.closest('#cardConnect')) {
      if (state.wallet) $('#punch').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); else connect();
      return;
    }
    if (e.target.closest('#welLook')) { closeWelcome(); return; }
    if (e.target.closest('#welMcrib')) { closeWelcome(); startOrder(1); return; }
    if (e.target.closest('#muteBtn')) { state.muted = !state.muted; store.set('muted', state.muted); renderTop(); }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'search') { state.q = e.target.value; renderBoard(); }
    if (e.target.id === 'cname') { store.set('name', e.target.value.toUpperCase().slice(0, 12) || 'HUNGRY'); renderTop(); }
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'show') { state.show = e.target.value; renderBoard(); }
    if (e.target.id === 'cname') { renderTicker(); renderSide(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!win.hidden) closeOrder();
    else if (!$('#welcome').hidden) closeWelcome();
  });
  addEventListener('resize', measure);

  /* ---------------- Boot ---------------- */
  async function boot() {
    // Only the single-file build (art inlined) runs the demo. A hosted site
    // stays live even if the API is down, so nobody launches a fake token.
    let apiDown = null;
    if (!window.SPRITES) {
      state.mode = 'live';
      try { await api('/api/config'); } catch (e) { apiDown = e; }
    }
    if (state.mode === 'live') {
      await refresh();
      setInterval(refresh, 12000);
      const p = window.phantom?.solana || window.solana;
      if (p?.isConnected && p.publicKey) { state.provider = p; state.wallet = p.publicKey.toString(); }
    } else seedDemo();
    render();
    measure();
    if (document.fonts) document.fonts.ready.then(measure);
    if (apiDown) toast(`Can't reach the McPad kitchen, so ordering is off. Reload in a minute.`);
    const h = parseInt(location.hash.slice(1), 10);
    if (h >= 1 && h <= COUNT) {
      const el = document.getElementById(`item-${h}`);
      el?.scrollIntoView({ block: 'center' });
      el?.classList.add('flash');
    } else if (!store.get('welcomed', false)) welcome();
  }
  boot();
})();
