import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// Weapon/arm art is loaded from a fixed revision of IRONLINE's credited CC BY 4.0
// FPS model collection. See THIRD_PARTY_NOTICES.md for individual authors.
// All bullets, magazine state and input rules below are Wanderlands code.
const SOURCE='https://raw.githubusercontent.com/cktang88/3d-fps/130ac2a5c856401ec36e7d35afcfefe40c5801f4/public/assets/models/';
const SPECS=[
  { id:'p226', name:'P226 Pistol', magazine:12, ammo:12, reserve:60, interval:.24, automatic:false, reloadSeconds:2.3, size:.32 },
  { id:'m4a1', name:'M4A1 Rifle', magazine:30, ammo:30, reserve:150, interval:.105, automatic:true, reloadSeconds:2.6, size:.83 }
];

export function createWeaponSystem({camera,scene,raycastTargets=()=>[]}) {
  const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const fpRoot=new THREE.Group();
  fpRoot.name='FirstPersonWeaponView';
  camera.add(fpRoot);
  // A camera-parented light illuminates viewmodels under bright sky and in shade.
  const fill=new THREE.PointLight(0xf2eddd,1.4,5);
  fill.position.set(0,.1,-.5);fpRoot.add(fill);
  const models=new Map(),gunMeshes=new Map(),gunHolders=new Map();
  const weapons=SPECS.map(x=>({...x,modelLoaded:false,assetError:null}));
  let selected=0, character=null, boundHand=null;
  let shotCount=0,swimmingState=false;
  let activeReload=null, reloadTime=0, cooldown=0, recoil=0, muzzleTime=0, heldFire=false;
  let reloadScene=null,reloadMixer=null,reloadClips=[],reloadAction=null,reloadError=null;
  const shotMarks=[];
  const flash=new THREE.Mesh(new THREE.ConeGeometry(.09,.34,7),
    new THREE.MeshBasicMaterial({color:0xffe1a2,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  flash.rotation.x=-Math.PI/2;flash.position.set(.08,-.10,-1.16);flash.visible=false;fpRoot.add(flash);
  const crosshair=document.createElement('div');
  crosshair.id='crosshair';
  crosshair.textContent='+';
  Object.assign(crosshair.style,{position:'fixed',left:'50%',top:'50%',transform:'translate(-50%,-50%)',
    font:'24px monospace',color:'#e9f6e5',textShadow:'0 1px 2px #111',pointerEvents:'none',
    zIndex:'5',display:'none'});
  document.body.appendChild(crosshair);
  const display=document.createElement('div');
  display.id='weapon-hud';
  Object.assign(display.style,{position:'fixed',bottom:'65px',right:'18px',color:'#fff',
    background:'#0b1823bd',font:'14px system-ui',padding:'11px 14px',borderRadius:'8px',
    pointerEvents:'none',zIndex:'4'});
  document.body.appendChild(display);

  function bindCharacter(model) {
    character=model;
    const bones=[];
    model.traverse(o=>{if(o.isBone)bones.push(o)});
    boundHand=bones.find(o=>/right[_ .]?hand$/i.test(o.name))||
              bones.find(o=>/hand[_.]?r(ight)?$/i.test(o.name))||
              bones.find(o=>/hand/i.test(o.name)&&/(right|[_ .]r$)/i.test(o.name))||null;
    if(!boundHand)console.warn('Rig hand bone not found; using approximate body mount',bones.map(b=>b.name).slice(-30));
    // Hands on the temporary Soldier rig follow authored idle/walk/run clips.
    for(const w of weapons)attachWorldGun(w.id);
  }

  function attachWorldGun(id) {
    const gun=gunMeshes.get(id);
    if(!gun||!character)return;
    const old=gunHolders.get(id);if(old)old.parent?.remove(old);
    const holder=new THREE.Group();
    holder.name='Held_'+id;
    if(boundHand) {
      boundHand.add(holder);
      // Keep the mount tied to the animated hand; source weapon meshes are rigid.
      holder.position.set(0,-.08,.08);
      holder.rotation.set(0,Math.PI/2,Math.PI/2);
    }else{
      character.add(holder);
      holder.position.set(.36,1.4,-.26);
      holder.rotation.set(0,Math.PI,0);
    }
    // Fit the actual donor gun mesh to world scale in its own local frame.
    // This avoids subtracting a world-space bounding-box center inside a bone transform.
    const copy=gun.clone(true);
    copy.traverse(obj=>{if(obj.isMesh){obj.visible=true;obj.frustumCulled=false;obj.castShadow=true;}});
    const normalized=new THREE.Group();
    normalized.add(copy);normalized.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(normalized);
    const dimension=bounds.getSize(new THREE.Vector3());
    const longest=Math.max(dimension.x,dimension.y,dimension.z,.0001);
    const center=bounds.getCenter(new THREE.Vector3());
    // Centre asset BEFORE scaling its geometry and mounting it on the character bone.
    copy.position.sub(center);
    const scale=(weapons.find(w=>w.id===id)?.size??.3)/longest;
    normalized.scale.setScalar(scale);
    holder.add(normalized);
    gunHolders.set(id,holder);
    holder.userData.geometrySize=dimension.toArray();
    holder.userData.scale=scale;
    holder.visible=weapons[selected].id===id&&!swimmingState;
  }
  for(const w of weapons) {
    loader.load(SOURCE+'fp/'+w.id+'.glb',gltf=>{
      const slot=new THREE.Group();
      slot.position.set(.28,-.26,-.68);
      slot.scale.setScalar(.5);
      slot.name='FP_'+w.id;
      const model=gltf.scene;model.traverse(obj=>{
        if(obj.isMesh){obj.castShadow=false;obj.receiveShadow=false;obj.frustumCulled=false;}
      });
      slot.add(model);fpRoot.add(slot);models.set(w.id,slot);
      const gun=model.getObjectByName('Gun_'+w.id);
      if(gun){gunMeshes.set(w.id,gun);attachWorldGun(w.id);}
      else console.warn('Missing gun mesh in FPS model',w.id);
      w.modelLoaded=true;
      applyVisibility();
    },undefined,error=>{
      w.assetError=String(error?.message||error);
      console.warn('FPS weapon model failed:',w.id,error);
    });
  }
  // Donor clips include baked hand / finger movement, not just a fake tilt.
  loader.load(SOURCE+'weapons/animated_reload_arms.glb',gltf=>{
    reloadScene=gltf.scene;
    reloadScene.name='AuthoredReloadArms';
    reloadScene.traverse(obj=>{if(obj.isMesh){obj.frustumCulled=false;obj.castShadow=false;}});
    reloadScene.position.set(.27,-.36,-.78);
    reloadScene.scale.setScalar(.34);
    reloadScene.visible=false;
    fpRoot.add(reloadScene);
    reloadMixer=new THREE.AnimationMixer(reloadScene);
    reloadClips=gltf.animations.map(clip=>clip.name);
    reloadScene.userData.loadedClips=gltf.animations;
  },undefined,error=>{
    reloadError=String(error?.message||error);
    console.warn('Reload arms could not load:',error);
  });

  function applyVisibility() {
    for(const [id,mesh] of models)mesh.visible=id===weapons[selected].id;
    for(const [id,holder] of gunHolders)holder.visible=id===weapons[selected].id&&!swimmingState;
  }

  function setPerspective(n,swimming=false) {
    fpRoot.visible=n===3&&!swimming;
    crosshair.style.display=n===3&&!swimming?'block':'none';
    display.style.display=swimming?'none':'block';
  }

  function choose(index) {
    if(activeReload!==null)return false;
    selected=(index+weapons.length)%weapons.length;
    heldFire=false;recoil=0;
    applyVisibility();updateHud();
    return true;
  }

  function switchWeapon(){return choose(selected+1)}
  const weapon=()=>weapons[selected];

  function fire() {
    const w=weapon();
    if(activeReload!==null||cooldown>0||w.ammo<=0||!fpRoot.userData.canFire)return false;
    w.ammo--;cooldown=w.interval;recoil=.16;muzzleTime=.08;shotCount++;
    const targetOrigin=camera.getWorldPosition(new THREE.Vector3());
    const rayDir=camera.getWorldDirection(new THREE.Vector3());
    const ray=new THREE.Raycaster(targetOrigin,rayDir,0,250);
    const hit=ray.intersectObjects(raycastTargets(),false)[0];
    if(hit){
      const mark=new THREE.Mesh(new THREE.SphereGeometry(.11,7,5),
        new THREE.MeshBasicMaterial({color:0xffd18a,transparent:true,opacity:.85,depthWrite:false}));
      mark.position.copy(hit.point);scene.add(mark);
      shotMarks.push({mesh:mark,t:.28});
    }
    updateHud();
    return true;
  }

  function setTrigger(pressed) {
    if(pressed&&!heldFire)fire();
    heldFire=pressed;
  }

  function reload() {
    const w=weapon();
    if(activeReload!==null||w.ammo>=w.magazine||w.reserve<=0||!fpRoot.userData.canFire)return false;
    activeReload=w.id;
    reloadTime=w.reloadSeconds;
    reloadAction=null;
    if(reloadMixer&&reloadScene) {
      const names=['reload_'+w.id+'_tactical','reload_'+w.id+'_empty'];
      const directName=names.find(name=>reloadClips.includes(name));
      const animation=directName ? THREE.AnimationClip.findByName({animations:reloadScene.userData.loadedClips},directName) : null;
      if(animation) {
        reloadMixer.stopAllAction();
        reloadAction=reloadMixer.clipAction(animation);
        reloadAction.reset();reloadAction.setLoop(THREE.LoopOnce,1);
        reloadAction.clampWhenFinished=true;reloadAction.play();
        reloadTime=Math.max(.7,animation.duration);
        reloadScene.visible=true;
      }
    }
    updateHud();
    return true;
  }

  function cancelReload() {
    activeReload=null;reloadTime=0;reloadAction=null;
    if(reloadScene)reloadScene.visible=false;
  }

  function updateHud() {
    const w=weapon();
    display.textContent=w.name+'  '+w.ammo+' / '+w.reserve+
      (activeReload!==null?'  · RELOADING':w.ammo===0?'  · R TO RELOAD':'');
  }

  let elapsed=0;
  function update(dt,{mode=2,swimming=false,moving=false,sprint=false}={}) {
    elapsed+=dt;cooldown=Math.max(0,cooldown-dt);
    recoil=THREE.MathUtils.damp(recoil,0,14,dt);
    muzzleTime=Math.max(0,muzzleTime-dt);
    for(let i=shotMarks.length-1;i>=0;i--){
      const p=shotMarks[i];p.t-=dt;
      p.mesh.material.opacity=Math.max(0,p.t/.28)*.85;
      if(p.t<=0){scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();shotMarks.splice(i,1);}
    }
    setPerspective(mode,swimming);
    if(swimming!==swimmingState){swimmingState=swimming;applyVisibility();}
    fpRoot.userData.canFire=!swimming;
    if(activeReload!==null) {
      reloadTime-=dt;
      if(reloadMixer)reloadMixer.update(dt);
      if(reloadTime<=0) {
        const w=weapons.find(w=>w.id===activeReload);
        if(w) {
          const take=Math.min(w.magazine-w.ammo,w.reserve);
          w.ammo+=take;w.reserve-=take;
        }
        cancelReload();updateHud();
      }
    }else if(heldFire&&weapon().automatic) fire();

    const bob=moving?Math.sin(elapsed*(sprint?14:9))*.012:Math.sin(elapsed*1.8)*.003;
    const selectedMesh=models.get(weapon().id);
    if(selectedMesh){
      selectedMesh.position.set(.28,-.26+bob-recoil*.17,-.68+recoil*.25);
      selectedMesh.rotation.x=-recoil*.18;
      selectedMesh.rotation.z=activeReload!==null?Math.sin(elapsed*4)*.11:0;
    }
    flash.visible=muzzleTime>0&&mode===3&&!swimming;
  }

  function animationState(){
    return {
      id:weapon().id,reloading:activeReload!==null,
      reloadDuration:weapon().reloadSeconds,shotCount,
      ammo:weapon().ammo,reserve:weapon().reserve
    };
  }

  // The reload pack contains real baked animation tracks; keep its metadata
  // so clip names remain verifiable after loading from a separate GLB.
  function debug(){
    return {
      active:weapon().id,ammo:weapon().ammo,reserve:weapon().reserve,
      loaded:weapons.map(w=>({id:w.id,loaded:w.modelLoaded,error:w.assetError})),
      reloadAssetLoaded:!!reloadScene,reloadClipNames:[...reloadClips],
      reloadError,reloading:activeReload!==null,
      gunAttached:gunHolders.has(weapon().id),handBone:boundHand?.name||null,
      canFire:!!fpRoot.userData.canFire,cooldown,clipPlaying:!!reloadAction,
      modelVisible:!!models.get(weapon().id)?.visible,
      worldGunVisible:!!gunHolders.get(weapon().id)?.visible,
      worldGunChildren:gunHolders.get(weapon().id)?.children.length||0,
      worldGunSize:gunHolders.get(weapon().id)?.userData.geometrySize||null,
      worldGunScale:gunHolders.get(weapon().id)?.userData.scale||null,
      shotCount
    };
  }
  updateHud();
  return {bindCharacter,setPerspective,choose,switchWeapon,setTrigger,reload,update,animationState,debug,fire};
}
