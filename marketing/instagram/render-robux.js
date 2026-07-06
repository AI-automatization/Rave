#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const packages = [
  { rb: 40,    price: 10000 },
  { rb: 80,    price: 18000 },
  { rb: 120,   price: 26000 },
  { rb: 160,   price: 36000 },
  { rb: 200,   price: 45000 },
  { rb: 240,   price: 54000 },
  { rb: 320,   price: 72000 },
  { rb: 400,   price: 70000 },
  { rb: 500,   price: 85000 },
  { rb: 660,   price: 120000 },
  { rb: 800,   price: 140000 },
  { rb: 1000,  price: 165000 },
  { rb: 1240,  price: 215000 },
  { rb: 1500,  price: 250000 },
  { rb: 1700,  price: 275000 },
  { rb: 2000,  price: 310000 },
  { rb: 3000,  price: 475000 },
  { rb: 4500,  price: 660000 },
  { rb: 5250,  price: 710000 },
  { rb: 10000, price: 1320000 },
  { rb: 11000, price: 1400000 },
  { rb: 22500, price: 2600000 },
  { rb: 24000, price: 2750000 },
];

const outDir = path.join(__dirname, 'out', 'robux');
fs.mkdirSync(outDir, { recursive: true });

for (const { rb, price } of packages) {
  const id = `Robux-${rb}`;
  const out = path.join(outDir, `robux-${rb}.png`);
  console.log(`Rendering ${id}...`);
  try {
    execSync(
      `npx remotion still --props='{"rb":${rb},"price":${price}}' ${id} "${out}"`,
      { stdio: 'inherit', cwd: __dirname }
    );
    console.log(`  ✓ ${out}`);
  } catch (e) {
    console.error(`  ✗ Failed: ${e.message}`);
  }
}

console.log(`\nDone! Cards saved to: ${outDir}`);
