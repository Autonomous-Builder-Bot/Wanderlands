import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { retargetClip } from 'three/addons/utils/SkeletonUtils.js';

// Source: KayKit Character Animations 1.1 (Kay Lousberg), CC0.
// Published as a GLB by NoLimitNexus, pinned at a specific commit.
const URL='https://raw.githubusercontent.com/NoLimitNexus/game-models/d188ebf93ceb3c4b95ba9bc6b1856cd1fd34915d/library/animations/Rig_Medium_CombatRanged.glb';
const CLIP_NAMES={aim:'Ranged_2H_Aiming',shoot:'Ranged_2H_Shoot',reload:'Ranged_2H_Reload'};
const ROLES=[
 ['defspine002','spine'],['defspine003','chest'],['defhead','head'],
 ['defupperarml','upperarml'],['defforearml','lowerarml'],['defhandl','handl'],
 ['defupperarmr','upperarmr'],['defforearmr','lowerarmr'],['defhandr','handr']
];
const norm=s=>s.replace(/[^a-z0-9]/gi,'').toLowerCase();
function skinned(root){
 let mesh=null;
 root.traverse(o=>{if(o.isSkinnedMesh&&o.skeleton?.bones?.length&&(!mesh||o.skeleton.bones.length>mesh.skeleton.bones.length))mesh=o;});
 return mesh;
}
function onlyUpperBody(clip,name){
 const tracks=clip.tracks.filter(track=>{
   if(!track.name.endsWith('.quaternion'))return false;
   const bone=track.name.match(/\.bones\[([^\]]+)\]/)?.[1];
   return !!bone&&ROLES.some(([target])=>norm(bone)===target);
 });
 return new THREE.AnimationClip(name,clip.duration,tracks).optimize();
}
export function loadRifleAnimations(character){
 return new Promise((resolve,reject)=>{
  new GLTFLoader().load(URL,gltf=>{
   try{
    const sourceMesh=skinned(gltf.scene),targetMesh=skinned(character);
    if(!sourceMesh||!targetMesh)throw new Error('CC0 ranged asset or character has no usable skeleton');
    // The source glTF contains real skeleton and animation; no clips are synthesized.
    gltf.scene.skeleton=sourceMesh.skeleton;
    const sourceBones=new Map(sourceMesh.skeleton.bones.map(b=>[norm(b.name),b.name]));
    const targetBones=new Map(targetMesh.skeleton.bones.map(b=>[norm(b.name),b.name]));
    const names={},mapped=[];
    for(const [targetRole,sourceRole] of ROLES){
      const t=targetBones.get(targetRole),s=sourceBones.get(sourceRole);
      if(t&&s){names[t]=s;mapped.push(t);}
    }
    const leftArm=mapped.some(n=>/upper_arm.*l$/i.test(n)),rightArm=mapped.some(n=>/upper_arm.*r$/i.test(n));
    if(!leftArm||!rightArm)throw new Error('Could not map both rifle arms: '+JSON.stringify(mapped));
    const clips=new Map(gltf.animations.map(c=>[c.name,c]));
    const mixer=new THREE.AnimationMixer(targetMesh),actions={};
    for(const [role,name] of Object.entries(CLIP_NAMES)){
      const original=clips.get(name);
      if(!original)throw new Error('CC0 pack missing '+name);
      const baked=retargetClip(targetMesh,gltf.scene,original,{
        names,hip:'__none__',fps:24,preserveBonePositions:true,preserveBoneMatrix:true
      });
      const upper=onlyUpperBody(baked,'WanderlandsRifle_'+role);
      if(upper.tracks.length<4)throw new Error('No usable upper body on '+name);
      const action=mixer.clipAction(upper);
      if(role!=='aim'){action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;}
      action.setEffectiveWeight(1);actions[role]=action;
    }
    let active=false,current=null,lastShots=0;
    function update(dt,{equipped,swimming,reloading,shotCount,reloadDuration}){
      if(!equipped||swimming){
        if(active){mixer.stopAllAction();active=false;current=null;}
        lastShots=shotCount;return;
      }
      if(!active){active=true;lastShots=shotCount;}
      let next='aim';
      if(reloading)next='reload';
      else if(shotCount!==lastShots)next='shoot';
      else if(current==='shoot'&&actions.shoot.time<Math.min(.24,actions.shoot.getClip().duration-.03))next='shoot';
      if(current!==next||(next==='shoot'&&shotCount!==lastShots)){
        if(current&&current!==next)actions[current].stop();
        const a=actions[next];a.reset();
        if(next==='shoot')a.setEffectiveTimeScale(a.getClip().duration/.26);
        else if(next==='reload')a.setEffectiveTimeScale(a.getClip().duration/Math.max(.2,reloadDuration));
        else a.setEffectiveTimeScale(1);
        a.play();current=next;
      }
      lastShots=shotCount;
      mixer.update(dt);
    }
    const debug=()=>({ready:true,source:'KayKit CC0',mappedBones:mapped,
      clips:Object.fromEntries(Object.entries(actions).map(([k,a])=>[k,{name:a.getClip().name,tracks:a.getClip().tracks.length,duration:a.getClip().duration}])),
      active:current||'none',shootTime:actions.shoot.time,holdTime:actions.aim.time});
    resolve({update,debug});
   }catch(error){reject(error);}
  },undefined,reject);
 });
}
