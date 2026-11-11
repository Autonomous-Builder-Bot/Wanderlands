import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// Retarget local rotations relative to each rig's bind pose.

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
function retargetLocally(sourceRoot,sourceClip,pairs,sourceRest,targetRest,name){
  // Preserve authored two-handed motion, but express every source bone's
  // angular change relative to its bind pose in the target bone's bind basis.
  // This avoids the 90-degree wrist/shoulder mismatch of direct world rotations.
  const frames=Math.max(3,Math.ceil(sourceClip.duration*24)+1);
  const times=new Float32Array(frames);
  const samples=pairs.map(pair=>({bone:pair.target.name,values:new Float32Array(frames*4)}));
  const mixer=new THREE.AnimationMixer(sourceRoot);
  mixer.clipAction(sourceClip).play();
  const qDelta=new THREE.Quaternion(),qResult=new THREE.Quaternion();
  for(let f=0;f<frames;f++){
    const time=Math.min(sourceClip.duration-.0001,f*sourceClip.duration/(frames-1));
    mixer.setTime(time);times[f]=f*sourceClip.duration/(frames-1);
    for(let i=0;i<pairs.length;i++){
      const pair=pairs[i],restInv=sourceRest.get(pair.source.name);
      qDelta.copy(restInv).multiply(pair.source.quaternion);
      qResult.copy(targetRest.get(pair.target.name)).multiply(qDelta).normalize();
      qResult.toArray(samples[i].values,f*4);
    }
  }
  mixer.stopAllAction();
  return new THREE.AnimationClip(name,sourceClip.duration,
    samples.map(s=>new THREE.QuaternionKeyframeTrack(
      '.bones['+s.bone+'].quaternion',times,s.values
    ))).optimize();
}

export function loadRifleAnimations(character){
 return new Promise((resolve,reject)=>{
  new GLTFLoader().load(URL,gltf=>{
   try{
    const sourceMesh=skinned(gltf.scene),targetMesh=skinned(character);
    if(!targetMesh)throw new Error('Quaternius target character has no skinned mesh');
    // KayKit's animation-only GLB exports a hierarchy of animated nodes, but
    // may not instantiate a SkinnedMesh. SkeletonUtils only needs bones with
    // names and Object3D matrices, so construct that lookup from the nodes.
    const neededSourceNames=new Set(['root','hips','spine','chest','head',
      'upperarml','lowerarml','handl','upperarmr','lowerarmr','handr']);
    const sourceNodes=[];
    gltf.scene.traverse(o=>{
      if(neededSourceNames.has(norm(o.name)))sourceNodes.push(o);
    });
    if(sourceNodes.length<8)throw new Error('KayKit node hierarchy missing: '+JSON.stringify(
      sourceNodes.map(b=>b.name)));
    gltf.scene.skeleton=sourceMesh?.skeleton||new THREE.Skeleton(sourceNodes);
    const sourceBones=new Map(gltf.scene.skeleton.bones.map(b=>[norm(b.name),b.name]));
    const targetBones=new Map(targetMesh.skeleton.bones.map(b=>[norm(b.name),b.name]));
    const mapped=[],pairs=[];
    for(const [targetRole,sourceRole] of ROLES){
      const t=targetBones.get(targetRole),s=sourceBones.get(sourceRole);
      if(t&&s){
        mapped.push(t);
        pairs.push({target:targetMesh.skeleton.getBoneByName(t),
          source:gltf.scene.skeleton.getBoneByName(s)});
      }
    }
    // Copy the native Quaternius rest quaternions, not its current pistol pose.
    targetMesh.skeleton.pose();
    const sourceRest=new Map(pairs.map(p=>[
      p.source.name,p.source.quaternion.clone().invert()
    ]));
    const targetRest=new Map(pairs.map(p=>[
      p.target.name,p.target.quaternion.clone()
    ]));
    const leftArm=mapped.some(n=>/upper_arm.*l$/i.test(n)),rightArm=mapped.some(n=>/upper_arm.*r$/i.test(n));
    if(!leftArm||!rightArm)throw new Error('Could not map both rifle arms: '+JSON.stringify(mapped));
    const clips=new Map(gltf.animations.map(c=>[c.name,c]));
    const mixer=new THREE.AnimationMixer(targetMesh),actions={};
    for(const [role,name] of Object.entries(CLIP_NAMES)){
      const original=clips.get(name);
      if(!original)throw new Error('CC0 pack missing '+name);
      const upper=retargetLocally(gltf.scene,original,pairs,
        sourceRest,targetRest,'WanderlandsRifle_'+role);
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
      else if(current==='shoot'&&actions.shoot.time<actions.shoot.getClip().duration-.04)next='shoot';
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
