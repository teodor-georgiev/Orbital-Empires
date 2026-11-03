import { test,expect } from '@playwright/test';

test('starbase defense, selectable ships and persisted tactical orders in Sol', async ({page},testInfo)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');
 await page.locator('.oe-home-continue').click();
 await page.locator('[data-action="clock-toggle"]').click();
 await page.locator('[data-action="open-solar"]').first().click();
 await expect(page.locator('#solar-command-panel')).toBeVisible();
 await expect(page.locator('#solar-command-panel')).toContainText('Frontier Post');
 await expect(page.locator('#solar-command-panel')).toContainText('DEF');
 const units=page.locator('#solar-command-panel .oe-unit-button');
 await expect(units).toHaveCount(3);
 await units.first().click();
 await expect(page.locator('.oe-unit-button[aria-pressed="true"]')).toHaveCount(1);
 await page.locator('[data-action="ship-orbit"]').click();
 let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('orbital-empires-save-v1')));
 expect(saved.fleets.some(f=>f.owner===0&&f.localOrder?.kind==='orbit')).toBe(true);
 const pre=saved.systems[saved.empires[0].home].outpost.level;
 await page.locator('[data-action="outpost-upgrade"]').first().click();
 saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('orbital-empires-save-v1')));
 expect(saved.systems[saved.empires[0].home].outpost.level).toBe(pre+1);
 await page.screenshot({path:testInfo.outputPath('system-outpost-ships-desktop.png'),fullPage:true});
 await page.reload();
 await page.locator('.oe-home-continue').click();
 await page.locator('[data-action="clock-toggle"]').click();
 await page.locator('[data-action="open-solar"]').first().click();
 await expect(page.locator('#solar-command-panel')).toContainText('Defense Station');
 await expect(page.locator('#solar-command-panel .oe-unit-button')).toHaveCount(3);
 expect(errors).toEqual([]);
});

test('mobile tactical commands are accessible and tappable',async ({page},testInfo)=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await page.locator('.oe-home-continue').click();
 await page.locator('[data-action="clock-toggle"]').click();
 await page.locator('[data-action="open-solar"]').first().click();
 await expect(page.locator('#solar-command-panel')).toBeVisible();
 await page.locator('.oe-unit-button').first().click();
 await page.locator('[data-action="ship-patrol"]').click();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('orbital-empires-save-v1')));
 expect(saved.fleets.some(f=>f.owner===0&&f.localOrder?.kind==='patrol')).toBe(true);
 await page.screenshot({path:testInfo.outputPath('system-outpost-ships-mobile.png'),fullPage:true});
});
