import { test, expect } from '@playwright/test';
test('inspect actual character right and left arm bones and held-gun bounds', async ({page},info)=>{
 await page.goto('/?debug=1',{waitUntil:'domcontentloaded'});
 const state=()=>page.evaluate(()=>window.__wanderlandsDebug.state());
 await expect.poll(async()=> (await state()).rifleAnimations?.ready,{timeout:90000}).toBe(true);
 await expect.poll(async()=> (await state()).weapons.worldGunVisible,{timeout:90000}).toBe(true);
 console.log('BASE_PISTOL',JSON.stringify(await state()));
 await page.screenshot({path:info.outputPath('base-pistol.png')});
 await page.keyboard.press('q');
 await expect.poll(async()=> (await state()).rifleAnimations?.active,{timeout:10000}).toBe('aim');
 await page.waitForTimeout(600);
 console.log('BASE_RIFLE',JSON.stringify(await state()));
 await page.screenshot({path:info.outputPath('base-rifle.png')});
});
