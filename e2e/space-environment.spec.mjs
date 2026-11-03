import { test, expect } from '@playwright/test';

for (const [device, viewport] of Object.entries({desktop:{width:1440,height:900},mobile:{width:390,height:844}})) {
  test(`Orbital starfield & asteroid exploration — ${device}`,async ({page},testInfo)=>{
    const errors=[];page.on('pageerror',err=>errors.push(err.message));
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.locator('.oe-home-continue').click();
    await page.locator('[data-action="open-solar"]').first().click();
    await expect(page.locator('#solar-stage')).toBeVisible();
    await expect(page.locator('#solar-planet-list .solar-planet-option')).toHaveCount(8);
    const objects=page.locator('#solar-site-list .solar-site-option');
    await expect(objects).toHaveCount(2);
    await expect(objects.filter({hasText:'Main asteroid belt'})).toHaveCount(1);
    await expect(objects.filter({hasText:'Long-period comet'})).toHaveCount(1);
    await page.locator('.solar-sites summary').click();
    await expect(page.locator('.solar-sites')).not.toHaveAttribute('open');
    await page.locator('.solar-sites summary').click();
    await expect(page.locator('.solar-sites')).toHaveAttribute('open');

    const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('orbital-empires-save-v1')).empires[0]);
    await page.locator('[data-action="solar-site"][data-id="asteroid-belt"]').click();
    await expect(page.locator('#inspector')).toContainText('Asteroid');
    const action=page.locator('[data-action="survey-site"]');
    await expect(action).toBeEnabled();
    await page.screenshot({path:testInfo.outputPath(`space-${device}-before.png`),fullPage:true});
    await action.click();
    await expect(action).toBeDisabled();
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('orbital-empires-save-v1')));
    expect(saved.empires[0].credits).toBe(before.credits-8);
    expect(saved.empires[0].alloys).toBe(before.alloys+18);
    expect(saved.spaceScans[`${saved.empires[0].home}:asteroid-belt`]).toBe(true);
    await page.screenshot({path:testInfo.outputPath(`space-${device}-mined.png`),fullPage:true});
    await page.reload();
    await page.locator('.oe-home-continue').click();
    await page.locator('[data-action="open-solar"]').first().click();
    await page.locator('[data-action="solar-site"][data-id="asteroid-belt"]').click();
    await expect(page.locator('[data-action="survey-site"]')).toBeDisabled();
    expect(errors).toEqual([]);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThan(5);
  });
}
