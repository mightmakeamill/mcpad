// Copies the shared rules and the Solana browser library into public/.
const fs = require('fs');
const path = require('path');
const pub = path.join(__dirname, '..', 'public');
fs.mkdirSync(path.join(pub, 'vendor'), { recursive: true });
fs.copyFileSync(path.join(__dirname, '..', 'lib', 'menu.js'), path.join(pub, 'menu.js'));
fs.copyFileSync(
  path.join(path.dirname(require.resolve('@solana/web3.js/package.json')), 'lib', 'index.iife.min.js'),
  path.join(pub, 'vendor', 'index.iife.min.js')
);
// Link previews need absolute image URLs: stamp SITE_URL into index.html when it is set at build time.
const site = (process.env.SITE_URL || '').replace(/\/$/, '');
if (site) {
  const index = path.join(pub, 'index.html');
  fs.writeFileSync(index, fs.readFileSync(index, 'utf8').replace(/content="[^"]*\/og\.png"/g, `content="${site}/og.png"`));
}
