import {test,expect} from '@playwright/test';

for(const [mode,size] of Object.entries({desktop:{width:1440,height:900},mobile:{width:390,height:844}})){
 test(`Unified Progress + Government + orbital objects coexist — ${mode}`,async ({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(size);
  await page.goto('/');
  await page.locator('.oe-home-continue').click();
  await expect(page.locator('#modal-root')).toBeHidden();
  await page.locator('.progress-nav').click();
  await expect(page.locator('#progress-workspace')).toBeVisible();
  await expect(page.locator('.main-layout')).toHaveClass(/progress-mode/);
  await expect(page.locator('#progress-workspace .progress-tab')).toHaveCount(3);
  await expect(page.locator('#progress-workspace .progress-node').first()).toBeVisible();
  await page.screenshot({path:testInfo.outputPath(`progress-${mode}-research.png`),fullPage:true});
  await page.locator('#progress-workspace [data-nav="traditions"]').click();
  await expect(page.locator('#progress-workspace')).toContainText('Frontier Spirit');
  await page.locator('#progress-workspace [data-nav="policies"]').click();
  await expect(page.locator('#progress-workspace')).toContainText('Open Markets');
  await page.screenshot({path:testInfo.outputPath(`progress-${mode}-policies.png`),fullPage:true});
  await page.locator('[data-nav="government"]').click();
  await expect(page.locator('.main-layout')).not.toHaveClass(/progress-mode/);
  await expect(page.locator('#inspector')).toContainText('Government & Council');
  await page.locator('[data-nav="system"]').first().click();
  await page.locator('[data-action="open-solar"]').first().click();
  await expect(page.locator('#solar-planet-list .solar-planet-option')).toHaveCount(8);
  await expect(page.locator('#solar-site-list .solar-site-option')).toHaveCount(2);
  await page.locator('[data-action="solar-site"][data-id="asteroid-belt"]').click();
  await expect(page.locator('#inspector')).toContainText('MINE ASTEROIDS');
  const outer=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(outer).toBeLessThan(5);
  expect(errors).toEqual([]);
 });
}
