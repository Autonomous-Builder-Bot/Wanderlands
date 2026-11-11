import { test, expect } from '@playwright/test';

test('jump, load asset-based weapons, reload with authored hand clip',async({page},testInfo)=>{
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('requestfailed',r=>console.log('FAILED URL',r.url(),r.failure()?.errorText));
 page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log('BROWSER LOG',m.type(),m.text())});
 await page.goto('/?debug=1',{waitUntil:'domcontentloaded'});
 const state=()=>page.evaluate(()=>window.__wanderlandsDebug?.state());
 await expect.poll(async()=>!!(await state()),{timeout:45000}).toBe(true);
 await expect.poll(async()=> (await state()).weapons.loaded.every(w=>w.loaded),{timeout:90000}).toBe(true);
 await expect.poll(async()=> (await state()).characterClipNames.includes('Swim_Fwd_Loop'),{timeout:90000}).toBe(true);
 await expect.poll(async()=> (await state()).weapons.reloadAssetLoaded,{timeout:50000}).toBe(true);
 const clips=(await state()).weapons.reloadClipNames;
 console.log('RELOAD CLIPS:',JSON.stringify(clips));
 expect(clips.length).toBeGreaterThan(0);
 expect((await state()).weapons.handBone).toBeTruthy();
 expect((await state()).weapons.gunAttached).toBe(true);
 expect((await state()).weapons.worldGunVisible).toBe(true);
 expect((await state()).weapons.worldGunSize?.every(x=>Number.isFinite(x))).toBe(true);

 const before=await state();
 await page.keyboard.down('Space');
 await page.waitForTimeout(125);
 await page.keyboard.up('Space');
 await expect.poll(async()=> (await state()).jumpCount).toBeGreaterThan(before.jumpCount);
 // Software-WebGL test frames can skip the very brief airborne sample.
 // jumpCount confirms takeoff, and onGround plus height confirms landing.
 await expect.poll(async()=> (await state()).onGround,{timeout:12000}).toBe(true);
 const after=await state();
 expect(after.y-after.groundY).toBeLessThan(.4);

 await page.keyboard.press('3');
 await expect.poll(async()=> (await state()).mode).toBe(3);
 await expect.poll(async()=> (await state()).weapons.modelVisible).toBe(true);

 if(!(await state()).pointerLocked)await page.locator('canvas').click({position:{x:150,y:110}});
 await expect.poll(async()=> (await state()).pointerLocked,{timeout:3500}).toBe(true);
 const ammoBefore=(await state()).weapons.ammo;
 await page.locator('canvas').click({position:{x:150,y:110}});
 await expect.poll(async()=> (await state()).weapons.ammo).toBe(ammoBefore-1);

 await page.keyboard.press('2');
 await expect.poll(async()=> (await state()).pointerLocked,{timeout:3500}).toBe(false);
 await page.keyboard.press('KeyR');
 await expect.poll(async()=> (await state()).weapons.reloading).toBe(true);
 console.log('During reload:',JSON.stringify((await state()).weapons));
 // Must animate both donor first-person hand tracks and native third-person pistol reload.
 await expect.poll(async()=> (await state()).weapons.clipPlaying,{timeout:2500}).toBe(true);
 await expect.poll(async()=> (await state()).activeCharacterState,{timeout:2500}).toBe('pistolReload');
 await expect.poll(async()=> (await state()).animationWeights.reload,{timeout:5000}).toBeGreaterThan(.25);
 await page.screenshot({path:testInfo.outputPath('third-person-reload.png')});
 await expect.poll(async()=> (await state()).weapons.reloading,{timeout:15000}).toBe(false);
 expect((await state()).weapons.ammo).toBe(12);
 expect((await state()).weapons.reserve).toBeLessThan(60);

 await page.keyboard.press('KeyQ');
 await expect.poll(async()=> (await state()).weapons.active).toBe('m4a1');
 expect((await state()).weapons.modelVisible).toBe(true);
 await page.screenshot({path:testInfo.outputPath('weapons.png')});
 expect(errors).toEqual([]);
});
