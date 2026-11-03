import { test, expect } from '@playwright/test';

test('Solar Frontier: Earth, nearby stars, eight planets and starting-year rollover', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#modal-root')).toBeVisible();
  await page.locator('#modal-root [data-action="new"]').click();
  await expect(page.locator('#new-scenario')).toBeVisible();
  await page.locator('#new-scenario').selectOption('sol');
  await page.locator('#new-start-year').fill('2250');
  await page.locator('#new-size').selectOption('60');
  await page.locator('[data-action="start"]').click();
  await expect(page.locator('#modal-root')).toBeHidden();
  await expect(page.locator('.profile-name')).toHaveText('UNITED EARTH DIRECTORATE');
  await expect(page.locator('#top-turn')).toHaveText('YEAR 2250.01');
  await expect(page.locator('#inspector')).toContainText('Sol');

  const game = await page.evaluate(() => JSON.parse(localStorage.getItem('orbital-empires-save-v1')));
  expect(game.scenario).toBe('sol');
  expect(game.startYear).toBe(2250);
  expect(game.systems[game.empires[0].home].name).toBe('Sol');
  expect(game.empires[0].species).toBe('Human');
  for (const name of ['Alpha Centauri', 'Proxima Centauri', "Barnard's Star", 'Sirius'])
    expect(game.systems.map(s => s.name)).toContain(name);

  await page.locator('[data-action="open-solar"]').first().click();
  await expect(page.locator('#solar-stage')).toBeVisible();
  const planets = page.locator('#solar-planet-list .solar-planet-option');
  await expect(planets).toHaveCount(8);
  for (const name of ['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune'])
    await expect(page.locator('#solar-planet-list')).toContainText(name);
  await expect(page.locator('#solar-planet-detail')).toContainText('Earth');
  await page.locator('#solar-planet-list .solar-planet-option').filter({ hasText: 'Mars' }).click();
  await expect(page.locator('#solar-planet-detail')).toContainText('Mars');
  await page.locator('#solar-stage [data-action="close-solar"]').first().click();
  await expect(page.locator('#solar-stage')).toBeHidden();

  await page.locator('[data-action="end-turn"]').click();
  await expect(page.locator('#top-turn')).toHaveText('YEAR 2250.02');
  await page.locator('#modal-root .modal-close').click();
  await expect(page.locator('#modal-root')).toBeHidden();
  expect(errors).toEqual([]);
});

test('Procedural non-Human faction selection and legacy save migration defaults', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('#modal-root [data-action="new"]').click();
  await page.locator('#new-scenario').selectOption('procedural');
  await page.locator('#new-faction').selectOption('auralian');
  await page.locator('#new-start-year').fill('2310');
  await page.locator('[data-action="start"]').click();
  await expect(page.locator('.profile-name')).toHaveText('AURALIS CONCORD');
  await expect(page.locator('#top-turn')).toHaveText('YEAR 2310.01');
  let data = await page.evaluate(() => JSON.parse(localStorage.getItem('orbital-empires-save-v1')));
  expect(data.empires[0].species).toBe('Auralian');
  expect(data.scenario).toBe('procedural');

  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem('orbital-empires-save-v1'));
    delete save.startYear;
    delete save.scenario;
    localStorage.setItem('orbital-empires-save-v1', JSON.stringify(save));
  });
  await page.reload();
  await expect(page.locator('#modal-root')).toBeVisible();
  await expect(page.locator('#top-turn')).toHaveText('YEAR 2201.01');
  expect(errors).toEqual([]);
});

test('WebGL-disabled browser still shows a usable Solar System planet list', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (String(type).startsWith('webgl')) return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await page.locator('#modal-root .modal-close').click();
  await page.locator('[data-action="open-solar"]').first().click();
  await expect(page.locator('#solar-renderer')).toHaveText('2D COMPATIBILITY MODE');
  await expect(page.locator('#solar-planet-list .solar-planet-option')).toHaveCount(8);
});
