/* The McPad menu + ordering rules. Shared by the browser and the server (UMD). */
(function (root) {
  // id|name|section|builtOn (an item that must be on-chain first)
  const RAW = `1|McRib|featured|
2|Hamburger|burgers|
3|Cheeseburger|burgers|2
4|Double Cheeseburger|burgers|3
5|Triple Cheeseburger|burgers|4
6|McDouble|burgers|3
7|Big Mac|burgers|
8|Double Big Mac|burgers|7
9|Grand Mac|burgers|7
10|Mac Jr.|burgers|7
11|Quarter Pounder|burgers|
12|Double Quarter Pounder|burgers|11
13|Chicken McNuggets|chicken|
14|McChicken|chicken|
15|Spicy McChicken|chicken|14
16|McCrispy|chicken|
17|Spicy McCrispy|chicken|16
18|Deluxe McCrispy|chicken|16
19|Filet-O-Fish|chicken|
20|Double Filet-O-Fish|chicken|19
21|Snack Wrap|chicken|
22|Chicken Big Mac|chicken|7
23|Egg McMuffin|breakfast|
24|Sausage McMuffin|breakfast|
25|Sausage McMuffin with Egg|breakfast|24
26|Hash Brown|breakfast|
27|Hotcakes|breakfast|
28|McGriddles|breakfast|27
29|Big Breakfast|breakfast|
30|Sausage Burrito|breakfast|
31|Fries|sides|
32|Apple Slices|sides|
33|Side Salad|sides|
34|Big Mac Sauce|sides|7
35|Sweet 'N Sour Sauce|sides|13
36|Hot Mustard|sides|13
37|Tangy BBQ Sauce|sides|1
38|Baked Apple Pie|sweets|
39|Chocolate Chip Cookie|sweets|
40|Vanilla Cone|sweets|
41|Hot Fudge Sundae|sweets|40
42|Caramel Sundae|sweets|40
43|McFlurry|sweets|
44|Vanilla Shake|sweets|
45|Chocolate Shake|sweets|44
46|Strawberry Shake|sweets|44
47|Shamrock Shake|sweets|44
48|Premium Roast Coffee|cafe|
49|Iced Coffee|cafe|48
50|Caramel Frappe|cafe|48
51|Mocha Frappe|cafe|50
52|Hot Chocolate|cafe|
53|Sweet Tea|cafe|
54|Strawberry Banana Smoothie|cafe|
55|Orange Drink|cafe|
56|Arch Deluxe|vault|
57|McDLT|vault|
58|McLean Deluxe|vault|
59|Hula Burger|vault|
60|McPizza|vault|
61|McSpaghetti|vault|
62|McHotDog|vault|
63|McLobster|vault|
64|Fried Apple Pie|vault|38
65|Chicken Selects|vault|
66|Mighty Wings|vault|
67|Onion Nuggets|vault|
68|Szechuan Sauce|vault|13
69|Land Sea and Air|secret|
70|Monster Mac|secret|8
71|Poor Mans Big Mac|secret|6
72|McBrunch Burger|secret|
73|Neapolitan Shake|secret|
74|Working Ice Cream Machine|secret|`;

  const ITEMS = RAW.split('\n').map((line) => {
    const [id, name, section, from] = line.split('|');
    return { id: +id, name, section, from: from ? +from : null };
  });
  const COUNT = ITEMS.length;
  const byId = (id) => ITEMS[id - 1];

  const SECTIONS = [
    { key: 'featured', name: "It's Back", note: 'For a limited time' },
    { key: 'burgers', name: 'Burgers', note: 'Flame-kissed, one of each' },
    { key: 'chicken', name: 'Chicken & Fish', note: 'Crispy, spicy, fishy' },
    { key: 'breakfast', name: 'Breakfast', note: 'Served 5:00 to 10:30 AM ET' },
    { key: 'sides', name: 'Sides & Sauces', note: 'Dip responsibly' },
    { key: 'sweets', name: 'Sweets & Treats', note: 'Subject to machine availability' },
    { key: 'cafe', name: 'Café & Drinks', note: 'Hot, iced, blended' },
    { key: 'vault', name: 'The Vault', note: 'Discontinued. Back by popular demand.' },
    { key: 'secret', name: 'Secret Menu', note: "You have to know how to ask" },
  ];

  // On-chain tickers. Long names get a hand-picked one; the rest are the name, letters only.
  const SYM = {
    3: 'CHEESEBRGR', 4: 'DBLCHEESE', 5: 'TRIPLECHZ', 8: 'DBLBIGMAC', 11: 'QTRPOUNDER', 12: 'DOUBLEQP',
    13: 'NUGGETS', 15: 'SPICYMCCHK', 17: 'SPICYCRISP', 18: 'DLXCRISPY', 20: 'DBLFISH', 22: 'CHICKENMAC',
    23: 'EGGMUFFIN', 24: 'SAUSMUFFIN', 25: 'SAUSAGEEGG', 29: 'BIGBFAST', 30: 'BURRITO', 34: 'MACSAUCE',
    37: 'BBQSAUCE', 38: 'APPLEPIE', 39: 'COOKIE', 41: 'HOTFUDGE', 42: 'CARAMEL', 44: 'VANSHAKE',
    45: 'CHOCSHAKE', 46: 'STRAWSHAKE', 47: 'SHAMROCK', 48: 'COFFEE', 50: 'FRAPPE', 51: 'MOCHA',
    52: 'HOTCOCOA', 54: 'SMOOTHIE', 55: 'ORANGE', 64: 'FRIEDPIE', 65: 'SELECTS', 66: 'WINGS',
    40: 'CONE', 58: 'MCLEAN', 61: 'SPAGHETTI', 67: 'ONIONNUGS', 68: 'SZECHUAN', 69: 'LANDSEAAIR',
    71: 'POORMANS', 72: 'MCBRUNCH', 74: 'ICEMACHINE',
  };
  const ticker = (p) => SYM[p.id] || p.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

  // Sizes = the dev's first buy on the pump.fun bonding curve. Kept as BALLS
  // so the shared launch engine (lib/app.js) reads them unchanged.
  const BALLS = [
    { key: 'small', name: 'Small', sol: 0.1, blurb: 'A snack. 0.1 SOL first buy.' },
    { key: 'medium', name: 'Medium', sol: 0.5, blurb: 'The usual. 0.5 SOL first buy.' },
    { key: 'large', name: 'Large', sol: 1.5, blurb: 'Hungry. 1.5 SOL first buy.' },
    { key: 'super', name: 'Super Size', sol: 5, blurb: 'Back from 2004. 5 SOL first buy. One per customer.', oncePerTrainer: true },
  ];

  const ICE_CREAM = [40, 41, 42, 43, 44, 45, 46, 47, 73];
  const ICE_CREAM_FIX = 12;
  const ALL_DAY_BREAKFAST = 25;

  // Locks taken from the menu's real history.
  const SPECIAL = {
    47: { need: 20, why: "Shamrock Shake season starts once 20 items are on-chain." },
    56: { need: 15, why: 'The Arch Deluxe returns once 15 items are on-chain.' },
    57: { need: 15, why: 'The McDLT (hot side hot, cool side cool) returns once 15 items are on-chain.' },
    58: { need: 20, why: 'The McLean Deluxe returns once 20 items are on-chain.' },
    59: { need: 20, why: 'The Hula Burger returns once 20 items are on-chain.' },
    60: { need: 30, why: 'The McPizza returns once 30 items are on-chain. Bring patience.' },
    61: { need: 30, why: 'McSpaghetti returns once 30 items are on-chain.' },
    62: { need: 30, why: 'The McHotDog returns once 30 items are on-chain.' },
    63: { need: 40, why: 'The McLobster returns once 40 items are on-chain.' },
    65: { need: 25, why: 'Chicken Selects return once 25 items are on-chain.' },
    66: { need: 25, why: 'Mighty Wings return once 25 items are on-chain.' },
    67: { need: 25, why: 'Onion Nuggets return once 25 items are on-chain.' },
    68: { need: 40, why: 'Szechuan Sauce drops once 40 items are on-chain. Keep calm.' },
    69: { needIds: [7, 14, 19], why: 'Land, Sea and Air needs a Big Mac, a McChicken and a Filet-O-Fish on-chain.' },
    72: { needIds: [11, 23, 26], why: 'The McBrunch Burger needs a Quarter Pounder, an Egg McMuffin and a Hash Brown on-chain.' },
    73: { needIds: [44, 45, 46], why: 'The Neapolitan Shake needs vanilla, chocolate and strawberry shakes on-chain.' },
    74: { need: 73, why: 'A working ice cream machine appears only when every other item is on-chain.' },
  };

  // Breakfast hours, US Eastern time, like the real menu.
  const hourFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
  function breakfastHours(now = Date.now()) {
    const [h, m] = hourFmt.format(now).split(':').map(Number);
    const mins = h * 60 + m;
    return mins >= 300 && mins < 630;
  }

  // Returns null when orderable, otherwise a reason string.
  function lockReason(id, caught, now = Date.now()) {
    const p = byId(id);
    if (!p) return 'That is not on the menu.';
    if (caught[id]) return `${p.name} is sold out: it has already been launched.`;
    if (p.from && !caught[p.from]) return `${p.name} is built on the ${byId(p.from).name}. Launch ${byId(p.from).name} first.`;
    const n = Object.keys(caught).length;
    if (ICE_CREAM.includes(id) && n < ICE_CREAM_FIX)
      return `Sorry, the ice cream machine is broken. A technician comes once ${ICE_CREAM_FIX} items are on-chain.`;
    if (p.section === 'breakfast' && n < ALL_DAY_BREAKFAST && !breakfastHours(now))
      return `Breakfast is served 5:00 to 10:30 AM ET. All Day Breakfast starts once ${ALL_DAY_BREAKFAST} items are on-chain.`;
    const s = SPECIAL[id];
    if (s) {
      if (s.need && n < s.need) return s.why;
      if (s.needIds && s.needIds.some((x) => !caught[x])) return s.why;
    }
    return null;
  }

  // Punch-card stamps, earned by the sections a customer has launched from.
  const BADGES = [
    { name: 'Grill Master', section: 'burgers', count: 4 },
    { name: 'Clucker', section: 'chicken', count: 3 },
    { name: 'Early Bird', section: 'breakfast', count: 2 },
    { name: 'Fry Cook', section: 'sides', count: 3 },
    { name: 'Sweet Tooth', section: 'sweets', count: 2 },
    { name: 'Barista', section: 'cafe', count: 2 },
    { name: 'Vault Raider', section: 'vault', count: 2 },
    { name: 'In The Know', section: 'secret', count: 1 },
    { name: 'Rib Royalty', section: 'featured', count: 1 },
  ];

  function badgesFor(trainer, caught) {
    const tally = {};
    for (const [id, c] of Object.entries(caught)) {
      if (c.trainer !== trainer) continue;
      const s = byId(+id).section;
      tally[s] = (tally[s] || 0) + 1;
    }
    return BADGES.map((b) => ({ ...b, have: tally[b.section] || 0, earned: (tally[b.section] || 0) >= b.count }));
  }

  const api = { ITEMS, COUNT, byId, SECTIONS, ticker, BALLS, SPECIAL, ICE_CREAM, breakfastHours, lockReason, BADGES, badgesFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MENU = api;
})(typeof self !== 'undefined' ? self : this);
