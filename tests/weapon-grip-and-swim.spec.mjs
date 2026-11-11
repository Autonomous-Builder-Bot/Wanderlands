import {test,expect} from '@playwright/test';

test('third-person rifle grips actually meet hands, pistol remains independent and swimmer looks up',async({page},testInfo)=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>console.log('ASSET_FAIL',r.url(),r.failure()?.errorText));
  await page.goto('/?debug=1',{waitUntil:'domcontentloaded'});
  const state=()=>page.evaluate(()=>window.__wanderlandsDebug.state());
  await expect.poll(async()=> (await state())?.rifleAnimations?.ready,{timeout:90000}).toBe(true);
  await expect.poll(async()=> (await state()).weapons.loaded.every(w=>w.loaded),{timeout:90000}).toBe(true);
  await expect.poll(async()=> (await state()).activeCharacterState,{timeout:6000}).toBe('pistolIdle');
  await page.waitForTimeout(400);
  const pistol=await state();
  const diff=pistol.weapons.worldGunPosition.map((v,i)=>v-pistol.weapons.rightHandPosition[i]);
  const projected=diff.reduce((sum,v,i)=>sum+v*pistol.visualForward[i],0);
  console.log('PISTOL_WORLD_GRIP',JSON.stringify({projected,gun:pistol.weapons.worldGunPosition,hand:pistol.weapons.rightHandPosition}));
  expect(projected).toBeGreaterThan(.10);
  await page.screenshot({path:testInfo.outputPath('pistol-forward.png')});
  await page.keyboard.press('q');
  await expect.poll(async()=> (await state()).weapons.active).toBe('m4a1');
  await expect.poll(async()=> (await state()).rifleAnimations.active,{timeout:7000}).toBe('aim');
  await page.waitForTimeout(900);
  const rifle=await state();
  const playerPos=[rifle.x,rifle.y,rifle.z];
  const d=rifle.weapons.worldGunPosition.map((v,i)=>v-playerPos[i]);
  const projection=d.reduce((sum,v,i)=>sum+v*rifle.visualForward[i],0);
  console.log('RIFLE_GRIP',JSON.stringify({projection,errors:[rifle.weapons.rifleGripErrorR,rifle.weapons.rifleGripErrorL],
    hands:[rifle.weapons.rightHandPosition,rifle.weapons.leftHandPosition],
    targets:rifle.weapons.rifleTargets,gun:rifle.weapons.worldGunPosition,
    anim:rifle.rifleAnimations.active,modelYaw:rifle.playerYaw}));
  expect(projection).toBeGreaterThan(.38);
  expect(rifle.weapons.mount).toBe('chest');
  expect(rifle.weapons.rifleGripErrorR).toBeLessThan(.15);
  expect(rifle.weapons.rifleGripErrorL).toBeLessThan(.15);
  await page.screenshot({path:testInfo.outputPath('rifle-grip.png')});

  const count=rifle.weapons.shotCount;
  await page.locator('canvas').click({position:{x:120,y:140}});
  await expect.poll(async()=> (await state()).weapons.shotCount,{timeout:5000}).toBeGreaterThan(count);
  await page.screenshot({path:testInfo.outputPath('rifle-shoot-ik.png')});
  await page.keyboard.press('r');
  await expect.poll(async()=> (await state()).rifleAnimations.active,{timeout:6000}).toBe('reload');
  await page.screenshot({path:testInfo.outputPath('rifle-reload-hand.png')});
  await expect.poll(async()=> (await state()).weapons.reloading,{timeout:18000}).toBe(false);
  await page.keyboard.press('q');
  await expect.poll(async()=> (await state()).activeCharacterState,{timeout:7000}).toBe('pistolIdle');
  await page.evaluate(()=>window.__wanderlandsDebug.teleportLake());
  await expect.poll(async()=> (await state()).swimming,{timeout:12000}).toBe(true);
  await page.keyboard.down('w');
  await expect.poll(async()=> (await state()).activeCharacterState,{timeout:8000}).toBe('swim');
  await expect.poll(async()=> (await state()).swimBodyTilt,{timeout:7000}).toBeGreaterThan(-.25);
  let level=(await state()).swimBodyTilt;
  console.log('SWIM_LEVEL',level);
  await page.screenshot({path:testInfo.outputPath('swim-head-up.png')});
  await page.keyboard.down('Space');
  await expect.poll(async()=> (await state()).swimBodyTilt,{timeout:7000}).toBeGreaterThan(level+.12);
  await page.screenshot({path:testInfo.outputPath('swim-rise.png')});
  await page.keyboard.up('Space');
  await page.keyboard.down('c');
  await expect.poll(async()=> (await state()).swimBodyTilt,{timeout:7000}).toBeLessThan(level-.12);
  await page.screenshot({path:testInfo.outputPath('swim-dive.png')});
  await page.keyboard.up('c');
  await page.keyboard.up('w');
  expect(errors).toEqual([]);
});
