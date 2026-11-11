import { test, expect } from '@playwright/test';

test('W moves forward and the model faces its travel direction, with guns visible',async({page},testInfo)=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>console.log('ASSET FAILED',r.url(),r.failure()?.errorText));
  await page.goto('/?debug=1',{waitUntil:'domcontentloaded'});
  const state=()=>page.evaluate(()=>window.__wanderlandsDebug?.state());
  await expect.poll(async()=> (await state())?.characterClipNames?.length>20,{timeout:90000}).toBe(true);
  await expect.poll(async()=> (await state()).weapons.loaded.every(w=>w.loaded),{timeout:90000}).toBe(true);
  await expect.poll(async()=> (await state()).weapons.worldGunVisible,{timeout:10000}).toBe(true);
  const before=await state();
  expect(before.mode).toBe(2);
  await page.keyboard.down('w');
  await expect.poll(async()=>{
    const s=await state();
    return Math.hypot(s.x-before.x,s.z-before.z);
  },{timeout:15000}).toBeGreaterThan(.8);
  await page.keyboard.up('w');
  const after=await state();
  const distance=Math.hypot(after.x-before.x,after.z-before.z);
  const motion=[(after.x-before.x)/distance,0,(after.z-before.z)/distance];
  const dot=(a,b)=>a.reduce((acc,v,i)=>acc+v*b[i],0);
  const cameraForward=after.cameraGroundForward;
  const facing=after.visualForward;
  const moveDotCamera=dot(motion,cameraForward);
  const moveDotModel=dot(motion,facing);
  const gunDot=after.weapons.worldGunBarrelAxis?dot(after.weapons.worldGunBarrelAxis,motion):null;
  console.log('THIRD_PERSON_ALIGNMENT',JSON.stringify({moveDotCamera,moveDotModel,gunDot,
    yaw:after.yaw,playerYaw:after.playerYaw,modelRootYaw:after.modelFacingRootYaw,
    facing,weaponAxis:after.weapons.worldGunBarrelAxis,gunPosition:after.weapons.worldGunPosition,
    x:after.x,z:after.z}));
  expect(moveDotCamera).toBeGreaterThan(.90);
  expect(moveDotModel).toBeGreaterThan(.88);
  expect(gunDot).toBeGreaterThan(.92);
  await page.screenshot({path:testInfo.outputPath('forward-pistol.png')});
  await page.keyboard.press('q');
  await expect.poll(async()=> (await state()).weapons.active).toBe('m4a1');
  await expect.poll(async()=> (await state()).weapons.worldGunVisible).toBe(true);
  await expect.poll(async()=> (await state()).activeCharacterState,{timeout:7000}).toBe('pistolIdle');
  await page.waitForTimeout(650);
  const rifle=await state();
  const rifleAxis=rifle.weapons.worldGunBarrelAxis;
  const rifleDot=dot(rifleAxis,rifle.visualForward);
  console.log('RIFLE_ALIGNMENT',JSON.stringify({rifleDot,weapon:rifle.weapons}));
  expect(rifleDot).toBeGreaterThan(.92);
  await page.screenshot({path:testInfo.outputPath('forward-rifle.png')});
  await page.keyboard.press('1');
  await expect.poll(async()=> (await state()).mode).toBe(1);
  expect((await state()).weapons.worldGunVisible).toBe(true);
  await page.screenshot({path:testInfo.outputPath('top-down-rifle.png')});
  expect(errors).toEqual([]);
});
