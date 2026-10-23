/* The McPad menu + ordering rules. Shared by the browser and the server (UMD). */
(function (root) {
  // id|name|section
  const RAW = `1|McRib|featured
2|Hamburger|burgers
3|Cheeseburger|burgers
4|Double Cheeseburger|burgers
5|Triple Cheeseburger|burgers
6|McDouble|burgers
7|Big Mac|burgers
8|Double Big Mac|burgers
9|Grand Mac|burgers
10|Mac Jr.|burgers
11|Quarter Pounder|burgers
12|Double Quarter Pounder|burgers
13|Chicken McNuggets|chicken
14|McChicken|chicken
15|Spicy McChicken|chicken
16|McCrispy|chicken
17|Spicy McCrispy|chicken
18|Deluxe McCrispy|chicken
19|Filet-O-Fish|chicken
20|Double Filet-O-Fish|chicken
21|Snack Wrap|chicken
22|Chicken Big Mac|chicken
23|Egg McMuffin|breakfast
24|Sausage McMuffin|breakfast
25|Sausage McMuffin with Egg|breakfast
26|Hash Brown|breakfast
27|Hotcakes|breakfast
28|McGriddles|breakfast
29|Big Breakfast|breakfast
30|Sausage Burrito|breakfast
31|Fries|sides
32|Apple Slices|sides
33|Side Salad|sides
34|Big Mac Sauce|sides
35|Sweet 'N Sour Sauce|sides
36|Hot Mustard|sides
37|Tangy BBQ Sauce|sides
38|Baked Apple Pie|sweets
39|Chocolate Chip Cookie|sweets
40|Vanilla Cone|sweets
41|Hot Fudge Sundae|sweets
42|Caramel Sundae|sweets
43|McFlurry|sweets
44|Vanilla Shake|sweets
45|Chocolate Shake|sweets
46|Strawberry Shake|sweets
47|Shamrock Shake|sweets
48|Premium Roast Coffee|cafe
49|Iced Coffee|cafe
50|Caramel Frappe|cafe
51|Mocha Frappe|cafe
52|Hot Chocolate|cafe
53|Sweet Tea|cafe
54|Strawberry Banana Smoothie|cafe
55|Orange Drink|cafe
56|Arch Deluxe|vault
57|McDLT|vault
58|McLean Deluxe|vault
59|Hula Burger|vault
60|McPizza|vault
61|McSpaghetti|vault
62|McHotDog|vault
63|McLobster|vault
64|Fried Apple Pie|vault
65|Chicken Selects|vault
66|Mighty Wings|vault
67|Onion Nuggets|vault
68|Szechuan Sauce|vault
69|Land Sea and Air|secret
70|Monster Mac|secret
71|Poor Mans Big Mac|secret
72|McBrunch Burger|secret
73|Neapolitan Shake|secret
74|Working Ice Cream Machine|secret|`;

  const ITEMS = RAW.split('\n').map((line) => {
    const [id, name, section] = line.split('|');
    return { id: +id, name, section };
  });
  const COUNT = ITEMS.length;
  const byId = (id) => ITEMS[id - 1];

  const SECTIONS = [
    { key: 'featured', name: "It's Back", note: 'For a limited time' },
    { key: 'burgers', name: 'Burgers', note: 'Flame-kissed, one of each' },
    { key: 'chicken', name: 'Chicken & Fish', note: 'Crispy, spicy, fishy' },
    { key: 'breakfast', name: 'Breakfast', note: 'Rise and launch' },
    { key: 'sides', name: 'Sides & Sauces', note: 'Dip responsibly' },
    { key: 'sweets', name: 'Sweets & Treats', note: 'Cold, sweet, shakeable' },
    { key: 'cafe', name: 'Café & Drinks', note: 'Hot, iced, blended' },
    { key: 'vault', name: 'The Vault', note: 'Legends from past menus' },
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

  // Returns null when orderable, otherwise a reason string.
  function lockReason(id, caught) {
    const p = byId(id);
    if (!p) return 'That is not on the menu.';
    if (caught[id]) return `${p.name} is sold out: it has already been launched.`;
    return null;
  }

  const api = { ITEMS, COUNT, byId, SECTIONS, ticker, BALLS, lockReason };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MENU = api;
})(typeof self !== 'undefined' ? self : this);
