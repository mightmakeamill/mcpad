# McPad: the drive-thru launchpad on pump.fun

The McRib is back. McPad is a Solana launchpad shaped like a backlit drive-thru menu board. It has 74 menu items, and each one can be launched on pump.fun **once**, by the first customer who orders it.

## How it plays

| Drive-thru piece | What it does on the launchpad |
|---|---|
| **The menu board** | Nine panels: It's Back, Burgers, Chicken & Fish, Breakfast, Sides & Sauces, Sweets & Treats, Café & Drinks, The Vault, and the Secret Menu. Every item can be ordered right away. Each one shows its number, `$TICKER`, and whether it's open, being prepared, or launched. |
| **Sizes** | Your dev first buy on the bonding curve: Small 0.1 · Medium 0.5 · Large 1.5 · Super Size 5 SOL. Each wallet gets one Super Size. |
| **The speaker post** | Ordering opens the drive-thru speaker and order screen. You pick a size and place the order. The screen then walks through Ringing it up, Pay at the window (wallet approval) and Cooking (the transaction confirming). |
| **The receipt** | Prints once the coin is live, with the order number, mint, transaction, and any stamps earned. |
| **Order status screen** | Preparing (live 2-minute holds) and Now Serving (recent launches). |
| **Punch card** | Nine stamps earned by launching from each part of the menu, plus your orders with pump.fun links. |
| **Regulars** | The leaderboard. |
| **LED ticker** | Recent orders and how much of the menu is left. |

All item art is original, drawn by `scripts/draw-art.js` and served from `public/sprites/`.

## How a launch works

1. The browser generates a fresh mint keypair.
2. `POST /api/catch/prepare` checks the item is still open and holds the item for 2 minutes. It then uploads the art and metadata to pump.fun IPFS (or falls back to `/api/meta/:id`) and gets a `create` transaction from PumpPortal.
3. The mint keypair co-signs. Then the wallet signs and sends through Phantom's `signAndSendTransaction`.
4. `POST /api/catch/confirm` waits for confirmation, checks the signers, the pump.fun program and the mint, and records the launch. Wallets without `signAndSendTransaction` use `/api/catch/submit` instead.

The server never holds a private key. The API route names (`/api/catch/*`) come from the shared PokéPad engine and are left unchanged.

## Run it

```bash
npm install
cp .env.example .env   # put your Helius key in SOLANA_RPC
npm start              # http://localhost:3000
```

`npm run build:demo` writes `dist/mcpad-demo.html`, a self-contained page that runs in simulated demo mode.
`npm run draw-art` redraws `public/sprites/` (it needs Playwright).

## Deploy to Vercel

1. Import this repo in Vercel. No build settings are needed; `vercel.json` sets them.
2. Open **Storage → Create Database → Upstash Redis** (Free, US East, no read regions) and connect it to the project.
3. In **Settings → Environment Variables**, add `SOLANA_RPC` (your Helius URL with key) and `SITE_URL` (your custom domain, e.g. `https://mcpad.xyz`). Optionally add `TWITTER_URL`, `TELEGRAM_URL` and `PRIORITY_FEE`.
4. Add a custom domain under **Settings → Domains**, since Phantom flags `*.vercel.app`. Then redeploy.

## Before going public

- `/api/registry` should return `{"caught":{},"pending":{}}`.
- Do one test launch with a Small, and check that the chip in the top bar says LIVE.
- **Brand risk.** McPad is a parody and says so in the footer. The menu item names are trademarks of their owner. Expect takedown risk.
