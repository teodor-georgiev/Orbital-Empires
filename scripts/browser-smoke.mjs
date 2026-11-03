// Headless end-to-end smoke test against a local, isolated copy of the game.
// Uses installed Chrome and pinned playwright-core in CI; no production writes.
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const port = 4179;
const origin = 'http://127.0.0.1:' + port;
const browserPath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { stdio: 'ignore' });
let browser;
const errors = [];
const snapshots = [];
function watch(page) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400 && new URL(response.url()).origin === origin) {
      errors.push('HTTP ' + response.status() + ' ' + response.url());
    }
  });
}
async function serve() {
  for (let n = 0; n < 45; n++) {
    try { const response = await fetch(origin); if (response.ok) return; }
    catch { /* server is starting */ }
    await delay(200);
  }
  throw new Error('local HTTP server did not start');
}
async function visible(page, selector) {
  await page.locator(selector).first().waitFor({ state: 'visible', timeout: 10000 });
}
async function capture(page, filename) {
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/' + filename, fullPage: true, animations: 'disabled' });
  snapshots.push(filename);
}
async function run() {
  await serve();
  browser = await chromium.launch({ executablePath: browserPath, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  watch(page);
  await page.goto(origin, { waitUntil: 'networkidle', timeout: 30000 });
  await page.locator('#modal-root [data-action="close-modal"]').click();
  await visible(page, '#galaxy-canvas');
  assert.match(await page.locator('#top-turn').innerText(), /CYCLE 01/);
  await capture(page, 'galaxy-desktop.png');

  await page.locator('.sidebar .progress-nav').click();
  await visible(page, '#progress-workspace .progress-tabbar');
  assert.equal(await page.locator('.main-layout').evaluate(el => el.classList.contains('progress-mode')), true);
  assert.equal(await page.locator('#progress-workspace .progress-tab').count(), 3);
  assert.equal(await page.locator('#progress-workspace .progress-node').count() >= 10, true);
  const areaWidth = await page.locator('#progress-workspace').evaluate(el => el.getBoundingClientRect().width);
  assert.ok(areaWidth > 900, 'Progress workspace must use large main width (got ' + areaWidth + ')');

  // Locked choices must be inspectable but not action-able.
  await page.locator('#progress-workspace [data-action="select-development"][data-id="quantum-labs"]').click();
  await visible(page, '#progress-workspace .progress-detail-action [data-action="research"]:disabled');
  const before = await page.locator('#resource-bar').innerText();
  const ready = page.locator('#progress-workspace .progress-node.available').first();
  await ready.click();
  assert.equal(await page.locator('#resource-bar').innerText(), before, 'selection must not spend resources');
  await capture(page, 'progress-technology-desktop.png');

  await page.locator('#progress-workspace .progress-tab[data-nav="traditions"]').click();
  await visible(page, '#progress-workspace .progress-node[data-id="frontier-spirit"]');
  assert.match(await page.locator('#progress-workspace').innerText(), /Unity/);
  await capture(page, 'progress-traditions-desktop.png');
  await page.locator('#progress-workspace .progress-tab[data-nav="policies"]').click();
  await visible(page, '#progress-workspace .progress-node[data-id="open-markets"]');
  const policyInfo = await page.locator('#progress-workspace .progress-detail').innerText();
  assert.ok(policyInfo.length > 10);
  await capture(page, 'progress-policies-desktop.png');

  // The original game remains reachable from the development viewer.
  await page.locator('#progress-workspace .progress-back').click();
  await visible(page, '#galaxy-canvas');
  assert.equal(await page.locator('.main-layout').evaluate(el => el.classList.contains('progress-mode')), false);
  await page.locator('#inspector [data-action="open-solar"]').click();
  await visible(page, '#solar-stage');
  assert.ok((await page.locator('#solar-planet-list .solar-planet-option').count()) >= 4);
  await page.locator('#solar-planet-list .solar-planet-option').last().click();
  await visible(page, '#solar-planet-detail');
  await page.locator('#solar-stage [data-action="close-solar"]').click();
  assert.equal(await page.locator('#solar-stage').isHidden(), true);

  await page.locator('[data-action="end-turn"]').click();
  assert.match(await page.locator('#top-turn').innerText(), /CYCLE 02/);
  await page.locator('#modal-root [data-action="close-modal"]').click();
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#modal-root [data-action="close-modal"]').click();
  assert.match(await page.locator('#top-turn').innerText(), /CYCLE 02/, 'reload must retain saved turn');

  // Narrow viewport: navigation and full resource bar remain available.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.sidebar .progress-nav').click();
  await visible(page, '#progress-workspace .progress-tabbar');
  assert.equal(await page.locator('#resource-bar').isVisible(), true);
  assert.equal(await page.locator('#progress-workspace .progress-tab').count(), 3);
  const viewport = await page.evaluate(() => ({ contentWidth: document.documentElement.scrollWidth, viewportWidth: window.innerWidth }));
  assert.ok(viewport.contentWidth <= viewport.viewportWidth + 4, 'mobile page must not overflow horizontally: ' + JSON.stringify(viewport));
  await capture(page, 'progress-mobile.png');
  assert.deepEqual(errors, [], 'Browser page errors or missing local assets');
  await context.close();
  console.log('PASS: galaxy, three progress tabs, prerequisites, nonmutating selection, solar scene, End Turn, save/reload, mobile layout');
  console.log('Screenshots: ' + snapshots.join(', '));
}
try { await run(); }
finally { if (browser) await browser.close(); server.kill('SIGTERM'); }
