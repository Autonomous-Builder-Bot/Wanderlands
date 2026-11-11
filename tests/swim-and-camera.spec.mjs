import { test, expect } from '@playwright/test';

test('first-person mouse lock and actual animated swim and third-person weapons',async({page},testInfo)=>{
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')console.log('BROWSER',m.type(),m.text())});
 page.on('requestfailed',r=>console.log('RESOURCE FAIL',r.url(),r.failure()?.errorText));
 await page.goto('/?debug=1',{waitUntil:'domcontentloaded'});
 const state=()=>page.evaluate(()=>window.__wanderlandsDebug?.state());
 await expect.poll(async()=> (await state())?.characterClipNames.length>=20,{timeout:90000}).toBe(true);
 const loaded=await state();
 console.log('NATIVE CLIPS',JSON.stringify(loaded.characterClipNames));
 console.log('GUN MOUNT',JSON.stringify(loaded.weapons));
 expect(loaded.characterClipNames).toContain('Swim_Fwd_Loop');
 expect(loaded.characterClipNames).toContain('Swim_Idle_Loop');
 expect(loaded.characterClipNames).toContain('Pistol_Reload');
 expect(loaded.characterClipNames).toContain('Pistol_Shoot');
 await expect.poll(async()=> (await state()).weapons.worldGunVisible,{timeout:90000}).toBe(true);
 const mount=await state();
 expect(mount.weapons.worldGunSize.some(n=>n>0)).toBe(true);
 expect(mount.weapons.worldGunChildren).toBeGreaterThan(0);
 console.log('VERIFIED WORLD GUN',JSON.stringify(mount.weapons));
 await page.screenshot({path:testInfo.outputPath('third-person-gun.png')});

 await page.keyboard.press('3');
 if(!(await state()).pointerLocked)await page.locator('canvas').click({position:{x:200,y:160}});
 await expect.poll(async()=> (await state()).pointerLocked,{timeout:8000}).toBe(true);
 const yaw=(await state()).yaw;
 await page.mouse.move(450,240);
 await expect.poll(async()=> (await state()).yaw,{timeout:4000}).not.toBe(yaw);
 await page.keyboard.press('2');
 await expect.poll(async()=> (await state()).pointerLocked,{timeout:5000}).toBe(false);
 await expect.poll(async()=> (await state()).weapons.worldGunVisible,{timeout:3500}).toBe(true);

 await page.evaluate(()=>window.__wanderlandsDebug.teleportLake());
 await expect.poll(async()=> (await state()).swimming,{timeout:15000}).toBe(true);
 await expect.poll(async()=> (await state()).activeCharacterState,{timeout:12000}).toBe('tread');
 await page.keyboard.down('w');
 await expect.poll(async()=> (await state()).activeCharacterState,{timeout:10000}).toBe('swim');
 await expect.poll(async()=> (await state()).animationWeights.swim,{timeout:7000}).toBeGreaterThan(.5);
 const a=(await state()).handPose;
 expect(a).toBeTruthy();
 await expect.poll(async()=>{
   const b=(await state()).handPose;
   return b?a.reduce((n,v,i)=>n+Math.abs(v-b[i]),0):0;
 },{timeout:12000}).toBeGreaterThan(.012);
 await page.keyboard.up('w');
 await page.screenshot({path:testInfo.outputPath('actual-swim.png')});
 expect(errors).toEqual([]);
});
