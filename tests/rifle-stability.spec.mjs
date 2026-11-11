import {test,expect} from '@playwright/test';

test('rifle arms do not snap or twitch when aiming, shooting, and reloading',async({page},testInfo)=>{
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?debug=1&mode=guns',{waitUntil:'domcontentloaded'});
 const state=()=>page.evaluate(()=>window.__wanderlandsDebug.state());
 await expect.poll(async()=> (await state())?.rifleAnimations?.ready,{timeout:90000}).toBe(true);
 await expect.poll(async()=> (await state()).weapons.loaded.every(w=>w.loaded),{timeout:90000}).toBe(true);
 await page.keyboard.press('q');
 await expect.poll(async()=> (await state()).rifleAnimations.active,{timeout:6000}).toBe('aim');
 await page.waitForTimeout(800);
 const sample=async()=>page.evaluate(async()=>{
   return await new Promise(resolve=>{
     const speeds=[],distances=[],state=()=>window.__wanderlandsDebug.state();
     let last=null,count=0;
     const frame=(ts)=>{
       const now=state();
       const arms=now.weapons.armQuaternions;
       const grip=now.weapons;
       if(last){
         const delta=(ts-last.ts)/1000;
         if(delta>.001){
           for(const side of ['L','R']){
             if(!arms[side]||!last.arms[side])continue;
             for(const offset of [0,4]){
               const a=arms[side],b=last.arms[side];
               let dot=0;
               for(let i=0;i<4;i++)dot+=a[offset+i]*b[offset+i];
               const radians=2*Math.acos(Math.min(1,Math.abs(dot)));
               speeds.push(radians/delta);
             }
           }
         }
       }
       if(grip.rifleIKActive)distances.push([grip.rifleGripErrorR,grip.rifleGripErrorL]);
       last={ts,arms};count++;
       if(count<38)requestAnimationFrame(frame);
       else resolve({maxAngularSpeed:Math.max(0,...speeds),meanAngularSpeed:speeds.reduce((a,b)=>a+b,0)/Math.max(1,speeds.length),
         maxGripError:Math.max(0,...distances.flat()),frames:count});
     };
     requestAnimationFrame(frame);
   });
 });
 const idle=await sample();
 console.log('RIFLE_STABILITY_IDLE',JSON.stringify(idle));
 expect(idle.maxAngularSpeed).toBeLessThan(11.8);
 expect(idle.maxGripError).toBeLessThan(.20);
 await page.screenshot({path:testInfo.outputPath('stabilized-rifle-idle.png')});
 const before=(await state()).weapons.shotCount;
 await page.locator('canvas').click({position:{x:150,y:100}});
 await expect.poll(async()=> (await state()).weapons.shotCount,{timeout:5500}).toBeGreaterThan(before);
 const shot=await sample();
 console.log('RIFLE_STABILITY_SHOT',JSON.stringify(shot));
 expect(shot.maxAngularSpeed).toBeLessThan(11.8);
 await page.keyboard.press('r');
 await expect.poll(async()=> (await state()).rifleAnimations.active,{timeout:5500}).toBe('reload');
 const reload=await sample();
 console.log('RIFLE_STABILITY_RELOAD',JSON.stringify(reload));
 expect(reload.maxAngularSpeed).toBeLessThan(13);
 await page.screenshot({path:testInfo.outputPath('stabilized-rifle-reload.png')});
 expect(errors).toEqual([]);
});
