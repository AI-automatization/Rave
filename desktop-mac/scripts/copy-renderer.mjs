// Copies the static renderer files (html, css, the sign-in banner image) next to the compiled renderer scripts in dist/renderer.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const from = path.join(root, 'src', 'renderer');
const to = path.join(root, 'dist', 'renderer');
fs.mkdirSync(to, { recursive: true });
for (const name of fs.readdirSync(from)) {
  if (name.endsWith('.html') || name.endsWith('.css') || name.endsWith('.webp')) fs.copyFileSync(path.join(from, name), path.join(to, name));
}
