import puppeteer from './node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const existing = fs.readdirSync(dir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(Boolean);
let n = nums.length ? Math.max(...nums) + 1 : 1;

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Force all reveals
await page.evaluate(() => {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
});
await new Promise(r => setTimeout(r, 1200));

// Get total height
const totalHeight = await page.evaluate(() => document.body.scrollHeight);

// Take viewport screenshots scrolling down
const sections = [0, 900, 1800, 2700, 3600, 4500, 5400];
for (const y of sections) {
  if (y > totalHeight) break;
  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
  await new Promise(r => setTimeout(r, 300));
  const file = path.join(dir, `screenshot-${n}-section-${y}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`Saved: ${file}`);
  n++;
}

await browser.close();
