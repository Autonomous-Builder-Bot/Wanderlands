import { test, expect } from '@playwright/test';

test('jump, load asset-based weapons, reload with authored hand clip',async({page},testInfo)=>{
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',r=>console.log('FAILED URL',r.url(),r.failure()?.errorText));
 page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log('BROWSER LOG',m.type(),m.text())});
 await page.goto('/?debug=1',{waitUntil:'domcontentloaded'});
 const state=()=>page.evaluate(()=>window.__wanderlandsDebug?.state());
 await expect.poll(async()=>!!(await state()),{timeout:45000}).toBe(true);
 await expect.poll(async()=> (await state()).weapons.loaded.every(w=>w.loaded),{timeout:50000}).toBe(true);
 await expect.poll(async()=> (await state()).weapons.reloadAssetLoaded,{timeout:50000}).toBe(true);
 const clips=(await state()).weapons.reloadClipNames;
 console.log('RELOAD CLIPS:',JSON.stringify(clips));
 expect(clips.length).toBeGreaterThan(0);
 expect((await state()).weapons.handBone).toBeTruthy();
 expect((await state()).weapons.gunAttached).toBe(true);

 const before=await state();
 await page.keyboard.down('Space');
 await page.waitForTimeout(125);
 await page.keyboard.up('Space');
 await expect.poll(async()=> (await state()).jumpCount).toBeGreaterThan(before.jumpCount);
 await expect.poll(async()=> !(await state()).onGround).toBe(true);
 await expect.poll(async()=> (await state()).onGround,{timeout:3500}).toBe(true);
 const after=await state();
 expect(after.y-after.groundY).toBeLessThan(.4);

 await page.keyboard.press('3');
 await expect.poll(async()=> (await state()).mode).toBe(3);
 await expect.poll(async()=> (await state()).weapons.modelVisible).toBe(true);

 const ammoBefore=(await state()).weapons.ammo;
 await page.locator('canvas').click({position:{x:150,y:110}});
 await expect.poll(async()=> (await state()).weapons.ammo).toBe(ammoBefore-1);

 await page.keyboard.press('KeyR');
 await expect.poll(async()=> (await state()).weapons.reloading).toBe(true);
 console.log('During reload:',JSON.stringify((await state()).weapons));
 // Must play an authored reload animation; a timer-only reload is insufficient.
 await expect.poll(async()=> (await state()).weapons.clipPlaying,{timeout:2500}).toBe(true);
 await expect.poll(async()=> (await state()).weapons.reloading,{timeout:8000}).toBe(false);
 expect((await state()).weapons.ammo).toBe(ammoBefore);

 await page.keyboard.press('KeyQ');
 await expect.poll(async()=> (await state()).weapons.active).toBe('m4a1');
 expect((await state()).weapons.modelVisible).toBe(true);
 await page.screenshot({path:testInfo.outputPath('weapons.png')});
 expect(errors).toEqual([]);
});
