import { test, expect } from '@playwright/test';

for (const [mode,viewport] of Object.entries({
  desktop:{width:1440,height:900},
  mobile:{width:390,height:844}
})) {
 test(`Government & Council: ${mode} navigation, reform, civic, appointment and save persistence`, async ({page},testInfo)=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(viewport);
  await page.goto('/');
  await expect(page.locator('#modal-root')).toBeVisible();
  await page.locator('#modal-root [data-action="new"]').click();
  await page.locator('#new-scenario').selectOption('sol');
  await page.locator('[data-action="start"]').click();
  await expect(page.locator('#modal-root')).toBeHidden();

  // Use a valid save to create a high-influence civic-development test campaign.
  await page.evaluate(()=>{
    const key='orbital-empires-save-v1';
    const g=JSON.parse(localStorage.getItem(key));
    g.empires[0].influence=250;
    localStorage.setItem(key,JSON.stringify(g));
  });
  await page.reload();
  await page.locator('#modal-root .modal-close').click();

  const nav=page.locator('[data-nav="government"]');
  await nav.scrollIntoViewIfNeeded();
  await nav.focus();
  await page.keyboard.press('Enter');
  await expect(nav).toHaveClass(/active/);
  const panel=page.locator('#inspector');
  await expect(panel).toContainText('Government & Council');
  await expect(panel).toContainText('LEGITIMACY & FACTION LOYALTY');
  await expect(panel).toContainText('Trade Guilds');
  await expect(panel).toContainText('HIGH COUNCIL');
  await expect(page.locator('.government-option')).toHaveCount(16);
  await page.screenshot({path:testInfo.outputPath(`government-${mode}-initial.png`),fullPage:true});

  await page.locator('[data-action="reform-government"][data-id="parliament"]').click();
  await expect(panel).toContainText('IN FORCE');
  await expect(page.locator('[data-action="reform-government"][data-id="parliament"]')).toHaveClass(/selected/);
  await page.locator('[data-action="adopt-civic"][data-id="open-assembly"]').click();
  await page.locator('[data-action="adopt-civic"][data-id="trade-charters"]').click();
  await page.locator('[data-action="appoint-leader"][data-id="nira-chen"]').click();
  await expect(page.locator('[data-action="appoint-leader"][data-id="nira-chen"]')).toHaveClass(/selected/);

  const save=await page.evaluate(()=>JSON.parse(localStorage.getItem('orbital-empires-save-v1')));
  expect(save.empires[0].government).toBe('parliament');
  expect(save.empires[0].civics).toEqual(expect.arrayContaining(['open-assembly','trade-charters']));
  expect(save.empires[0].council.scientist).toBe('nira-chen');
  expect(save.empires[0].influence).toBe(158); // 250 - 40 - 20 - 20 - 12
  await page.screenshot({path:testInfo.outputPath(`government-${mode}-appointed.png`),fullPage:true});

  await page.reload();
  await page.locator('#modal-root .modal-close').click();
  await page.locator('[data-nav="government"]').scrollIntoViewIfNeeded();
  await page.locator('[data-nav="government"]').click();
  await expect(page.locator('[data-action="reform-government"][data-id="parliament"]')).toHaveClass(/selected/);
  await expect(page.locator('[data-action="appoint-leader"][data-id="nira-chen"]')).toHaveClass(/selected/);
  await expect(page.locator('#inspector')).toContainText('Government & Council');
  const viewportSafety=await page.locator('#inspector').evaluate(el=>({width:el.getBoundingClientRect().width,overflow:el.scrollWidth-el.clientWidth}));
  expect(viewportSafety.width).toBeGreaterThan(250);
  expect(viewportSafety.overflow).toBeLessThan(30);
  expect(errors).toEqual([]);
 });
}
