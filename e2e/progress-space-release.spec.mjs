import { test, expect } from '@playwright/test';

for(const [device,viewport] of Object.entries({desktop:{width:1440,height:900},mobile:{width:390,height:844}})){
  test(`Progress, Government, and orbital exploration coexist — ${device}`,async({page},testInfo)=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.locator('.oe-home-continue').click();

    const progressNav=page.locator('.sidebar [data-nav="research"].progress-nav');
    await progressNav.click();
    await expect(page.locator('#progress-workspace')).toBeVisible();
    await expect(page.locator('.progress-tab')).toHaveCount(3);
    await expect(page.locator('.progress-tab[data-nav="research"]')).toHaveAttribute('aria-selected','true');
    await expect(page.locator('#progress-workspace')).toContainText('Empire Development');
    await expect(page.locator('.progress-node').first()).toBeVisible();
    await page.screenshot({path:testInfo.outputPath(`release-progress-${device}.png`),fullPage:true});

    await page.locator('.progress-tab[data-nav="traditions"]').click();
    await expect(page.locator('.progress-tab[data-nav="traditions"]')).toHaveAttribute('aria-selected','true');
    await expect(page.locator('.progress-detail')).toContainText('Unity');
    await page.locator('.progress-tab[data-nav="policies"]').click();
    await expect(page.locator('.progress-tab[data-nav="policies"]')).toHaveAttribute('aria-selected','true');
    await page.locator('[data-action="select-development"][data-id="open-markets"]').click();
    await expect(page.locator('.progress-detail [data-action="enact-policy"][data-id="open-markets"]')).toBeEnabled();
    await page.locator('.progress-detail [data-action="enact-policy"][data-id="open-markets"]').click();
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('orbital-empires-save-v1')));
    expect(saved.empires[0].policies).toContain('open-markets');
    await expect(page.locator('.progress-detail [data-action="enact-policy"][data-id="open-markets"]')).toBeDisabled();

    const tab=page.locator('.progress-tab[data-nav="policies"]');
    await tab.focus();await page.keyboard.press('Home');
    await expect(page.locator('.progress-tab[data-nav="research"]')).toHaveAttribute('aria-selected','true');
    await page.locator('.sidebar [data-nav="government"]').click();
    await expect(page.locator('#inspector')).toContainText('Government & Council');

    await page.locator('.sidebar [data-nav="system"]').click();
    await page.locator('[data-action="open-solar"]').first().click();
    await expect(page.locator('#solar-site-list')).toContainText('Main asteroid belt');
    await expect(page.locator('#solar-stage')).toBeVisible();
    await page.screenshot({path:testInfo.outputPath(`release-orbit-${device}.png`),fullPage:true});
    if(device==='mobile'){
       expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThan(5);
    }
    expect(errors).toEqual([]);
  });
}
