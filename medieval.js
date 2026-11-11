import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Fully CC0 KayKit character / accessory / animation sources.
// Sources are pinned to verified public GitHub revisions; see THIRD_PARTY_NOTICES.md.
const KNIGHT='https://raw.githubusercontent.com/sion-rgb/tactical-slash/8bf8d835cb7afa7cb3f4d893b0966c6b4e9b7727/assets/characters/player/player_swordsman.glb';
const ANIM='https://raw.githubusercontent.com/NoLimitNexus/game-models/d188ebf93ceb3c4b95ba9bc6b1856cd1fd34915d/library/animations/';
const GREAT='https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/672074b73ba276876a19e8816ecdc5241817ab47/addons/kaykit_character_pack_adventures/Assets/gltf/sword_2handed.gltf';

export function createMedievalCombat({parent}) {
 const loader=new GLTFLoader(),root=new THREE.Group();
 root.name='KayKitMedievalCombatCharacter';root.visible=false;parent.add(root);
 let model=null,mixer=null,ready=false,active=false,swimming=false,style='swordShield';
 let oneHand=null,shield=null,twoHand=null,assetError=null,animationError=null;
 let modelReady=false,meleeReady=false,movementReady=false,twoHandReady=false;
 const clips=new Map(),actions=new Map();
 let currentAction=null,currentClip=null,attackRemaining=0,attackName=null;
 let shieldHeld=false,attacks=0,switches=0;
 const attacks1=['Melee_1H_Attack_Slice_Horizontal','Melee_1H_Attack_Chop','Melee_1H_Attack_Stab'];
 const attacks2=['Melee_2H_Attack_Chop','Melee_2H_Attack_Slice','Melee_2H_Attack_Spin'];
 const hud=document.createElement('div');hud.id='medieval-hud';
 Object.assign(hud.style,{position:'fixed',bottom:'65px',right:'18px',background:'#17231ccf',color:'#fff',
   borderRadius:'8px',padding:'11px 14px',font:'14px system-ui',zIndex:'7',pointerEvents:'none',display:'none'});
 document.body.appendChild(hud);
 function showHud(){
   hud.style.display=active&&!swimming?'block':'none';
   if(!active)return;
   hud.textContent=style==='swordShield'?'Sword + Shield · Click: slash · Right click: block · Q: greatsword':
     'Two-Handed Sword · Click: swing · Right click: parry · Q: sword + shield';
 }
 function findNode(name){let found=null;model?.traverse(o=>{if(o.name===name)found=o});return found;}
 function prepareClip(clip){
   // The game already moves the player across terrain. Discard source root
   // translations so melee attacks do not move the model separately.
   const c=clip.clone();
   c.tracks=c.tracks.filter(t=>!/(^|[./])(root|armature|rig_medium)\.position$/i.test(t.name));
   return c;
 }
 function addClips(gltf) {
   for(const clip of gltf.animations)clips.set(clip.name,prepareClip(clip));
 }
 function setupActions(){
   if(!model||!meleeReady||!movementReady)return;
   ready=true;
   mixer=new THREE.AnimationMixer(model);
   for(const [name,clip] of clips){
     const action=mixer.clipAction(clip);
     const once=/Attack_|_Attack|Jump_Full|Jump_Start|Jump_Land|Melee_Block_Hit/.test(name)&&name!=='Melee_Blocking';
     if(once){action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;}
     actions.set(name,action);
   }
   showEquipment();showHud();
 }
 function showEquipment(){
   if(oneHand)oneHand.visible=style==='swordShield';
   if(shield)shield.visible=style==='swordShield';
   if(twoHand)twoHand.visible=style==='greatsword';
 }
 loader.load(KNIGHT,gltf=>{
   model=gltf.scene;model.name='KayKitKnight';
   model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;}});
   root.add(model);
   oneHand=findNode('1H_Sword');shield=findNode('Round_Shield');
   if(!oneHand||!shield){assetError='Knight model does not include expected 1H_Sword and Round_Shield nodes';}
   addClips(gltf);modelReady=true;
   setupActions();
   if(oneHand){
     // Both props are made for KayKit. Match the one-handed sword's real
     // right-hand socket, not a guessed location relative to the torso.
     loader.load(GREAT,great=>{
       twoHand=great.scene;twoHand.name='2H_Sword';
       oneHand.parent.add(twoHand);
       twoHand.position.copy(oneHand.position);
       twoHand.quaternion.copy(oneHand.quaternion);
       twoHand.scale.copy(oneHand.scale);
       twoHand.traverse(o=>{if(o.isMesh){o.castShadow=true;o.frustumCulled=false;}});
       twoHandReady=true;
       showEquipment();
     },undefined,e=>{assetError='Two-handed sword did not load: '+String(e?.message||e);console.warn(assetError);});
   }
 },undefined,e=>{assetError='Knight did not load: '+String(e?.message||e);console.warn(assetError);});
 loader.load(ANIM+'Rig_Medium_CombatMelee.glb',gltf=>{
   addClips(gltf);meleeReady=true;setupActions();
 },undefined,e=>{animationError='Melee animations did not load: '+String(e?.message||e);console.warn(animationError);});
 loader.load(ANIM+'Rig_Medium_MovementBasic.glb',gltf=>{
   addClips(gltf);movementReady=true;setupActions();
 },undefined,e=>{animationError='Movement animations did not load: '+String(e?.message||e);console.warn(animationError);});
 function switchClip(name,{restart=false}={}){
   const action=actions.get(name);
   if(!action)return;
   if(currentClip===name&&!restart)return;
   if(currentAction===action)currentAction.stop();
   action.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).play();
   if(currentAction&&currentAction!==action)action.crossFadeFrom(currentAction,.15,false);
   currentAction=action;currentClip=name;
 }
 function setActive(flag){
   active=!!flag;shieldHeld=false;attackRemaining=0;
   root.visible=active&&!swimming;
   showHud();
 }
 function setSwimming(flag){
   swimming=!!flag;root.visible=active&&!swimming;showHud();
 }
 function switchStyle(){
   if(!active)return false;
   // Do not permit an invisible greatsword until the real KayKit asset loads.
   if(style==='swordShield'&&!twoHandReady)return false;
   style=style==='swordShield'?'greatsword':'swordShield';
   attacks=0;attackRemaining=0;shieldHeld=false;switches++;
   showEquipment();showHud();currentClip=null;return true;
 }
 function attack(){
   if(!active||swimming||!ready||attackRemaining>0)return false;
   const variants=style==='swordShield'?attacks1:attacks2;
   const clip=variants[attacks++%variants.length];
   if(!actions.has(clip))return false;
   attackName=clip;attackRemaining=clips.get(clip).duration;
   shieldHeld=false;switchClip(clip,{restart:true});return true;
 }
 function setBlock(pressed){if(active&&!swimming)shieldHeld=!!pressed;}
 function update(dt,{moving=false,sprint=false,onGround=true,swimming:inWater=false}={}){
   setSwimming(inWater);
   if(!active||!ready||!mixer)return;
   if(attackRemaining>0){
     attackRemaining=Math.max(0,attackRemaining-dt);
   }
   let next;
   if(attackRemaining>0)next=attackName;
   else if(shieldHeld)next=style==='swordShield'?'Melee_Blocking':'Melee_Block';
   else if(!onGround)next='Jump_Full_Short';
   else if(moving)next=sprint?'Running_A':'Walking_A';
   else next=style==='greatsword'?'Melee_2H_Idle':'Idle';
   if(actions.has(next))switchClip(next);
   else switchClip('Idle');
   mixer.update(dt);
 }
 function debug(){
   const meshes=model?[]:null;
   if(model)model.traverse(o=>{if(o.isMesh)meshes.push(o.name);});
   return {active,swimming,ready,modelReady,meleeReady,movementReady,twoHandReady,
     style,characterVisible:root.visible,oneHandVisible:!!oneHand?.visible,
     shieldVisible:!!shield?.visible,twoHandVisible:!!twoHand?.visible,
     meshCount:meshes?.length||0,hasRealSword:!!oneHand,hasRealShield:!!shield,
     animationCount:clips.size,clipNames:[...clips.keys()],currentClip,attacks,switches,
     blocking:shieldHeld,attackRemaining,assetError,animationError};
 }
 return {setActive,setSwimming,switchStyle,attack,setBlock,update,debug,
   get active(){return active;},get ready(){return ready;},get swimming(){return swimming;}};
}
