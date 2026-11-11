import { test, expect } from '@playwright/test';

test('official water renders horizontally and player can swim and dive',async({page},testInfo)=>{
 const exceptions=[];
 page.on('pageerror',e=>{exceptions.push(e.message);console.error('Browser exception:',e.message)});
 page.on('requestfailed',r=>console.error('Resource failed:',r.url(),r.failure()?.errorText));
 page.on('response',r=>{if(r.status()>=400)console.error('HTTP error:',r.status(),r.url());});
 page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.error('Browser console:',m.type(),m.text());});
 await page.goto('/?debug=1&mode=guns',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#stats')).not.toHaveText(/Generating world/, {timeout:30000});
 const state=()=>page.evaluate(()=>window.__wanderlandsDebug?.state());
 await expect.poll(async()=> (await state())?.waterIsOfficial,{timeout:15000}).toBe(true);
 await expect.poll(async()=> (await state())?.waterHorizontal,{timeout:15000}).toBe(true);
 const water=(await state()).waterCenter;
 expect(water.y).toBeCloseTo(.04,3);
 expect(water.x).toBe(52);
 expect(water.z).toBe(-38);
 await expect.poll(async()=> (await state()).waterNormalsLoaded,{timeout:30000}).toBe(true);
 await expect.poll(async()=> (await state()).characterLoaded,{timeout:30000}).toBe(true);

 const before=await state();
 await page.keyboard.down('w');
 await expect.poll(async()=>{
   const after=await state();
   return Math.hypot(after.x-before.x,after.z-before.z);
 },{timeout:9000}).toBeGreaterThan(.30);
 await page.keyboard.up('w');

 await page.keyboard.press('1');
 await expect.poll(async()=> (await state()).mode).toBe(1);
 await page.keyboard.press('2');
 await expect.poll(async()=> (await state()).mode).toBe(2);
 await page.keyboard.press('3');
 await expect.poll(async()=> (await state()).mode).toBe(3);
 await page.keyboard.press('2');

 await page.evaluate(()=>window.__wanderlandsDebug.teleportLake());
 await expect.poll(async()=> (await state()).swimming,{timeout:15000}).toBe(true);
 const lake=await state();
 expect(lake.depth).toBeGreaterThan(1.8);
 await page.keyboard.down('c');
 await expect.poll(async()=> (await state()).swimDive,{timeout:6000}).toBeGreaterThan(.2);
 const deeper=(await state()).swimDive;
 await page.keyboard.up('c');
 await page.keyboard.down(' ');
 await page.waitForTimeout(1100);
 await page.keyboard.up(' ');
 await expect.poll(async()=> (await state()).swimDive,{timeout:6000}).toBeLessThan(deeper);

 await page.screenshot({path:testInfo.outputPath('lake.png')});
 expect(exceptions).toEqual([]);
});
