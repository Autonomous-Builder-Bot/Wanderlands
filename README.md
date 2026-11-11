# Wanderlands

A browser-based procedural 3D RPG exploration prototype powered by [Three.js](https://threejs.org/).

## Play
Enable GitHub Pages in repository Settings → Pages → Deploy from a branch → `main` / `(root)`.

Live site: https://autonomous-builder-bot.github.io/Wanderlands/

For local development, start a server inside the repository:

```bash
python -m http.server 8000
```

Then open http://localhost:8000/.

## Medieval loadout prototype (optional)
Press **M** in the live world to switch between the original firearms and medieval testing mode.
The medieval mode deliberately uses third-person/top-down views for now. Press **Q**
to swap between **one-handed sword + shield** and **two-handed greatsword**.
Use **left click** for authored one-/two-handed attacks and **right click** for
shield block / greatsword parry; WASD, sprint and jump work with matching KayKit
locomotion clips. When swimming, the normal Quaternius swimming character appears.

This mode uses the actual **CC0 KayKit rigged knight and matching swords/shield**
with the original KayKit **Rig_Medium CombatMelee** and **MovementBasic** animation
libraries. Its right/left hands, sword and shield share the same skeleton.
The previous guns and Quaternius character are preserved and can be restored
with **M**.

**Prototype limits:** No opponent damage or collision, hit registration,
combat stamina, equip inventory or first-person melee view yet. The
greatsword supports authored two-handed idle/attack/block movements; fine grip
and elbow posture will need further visual tuning.

## Controls
| Key | Action |
|---|---|
| W/A/S/D | Move |
| Shift | Sprint (also while swimming) |
| Mouse drag | Rotate camera in top-down and third-person |
| 1 / 2 / 3 | Top-down / third-person / first-person |
| Mouse in first-person | Click to lock mouse, move to look; Esc releases pointer |
| Space | Jump on land / swim up toward surface in deep water |
| C or Left Ctrl | Dive while in deep water |
| Left click | Fire equipped weapon |
| R | Reload |
| Q | Switch pistol / rifle |
| N | Generate a new world seed |

Add `?seed=2026` to the URL for a reproducible world.

## Targeted stabilization — rifle and swimming
- Smoothed third-person rifle upper-arm and elbow IK against the prior rendered pose, warm-starting the next frame without discarding the underlying KayKit rifle clips.
- Cross-fade rifle aim/shoot/reload animations to avoid abruptly resetting shoulder and wrist tracks.
- Moved right and left wrist targets slightly closer to achievable grip positions. Browser tests now measure both grip distances and maximum bone angular speed during aim, fire, and reload.
- Lifted **only the visible character** by about 9 cm while swimming. Raised the forward-swimming body/head angle by an additional 5°, retaining the existing ascend and descend tilt.
- Kept first-person controls, first-person weapon view, swimming physics, jumping, terrain, and pistol actions unchanged.
- Positional arm IK is still approximate: it does not align fingers or calculate an anatomically exact stock-to-shoulder rifle contact pose.

## Third-person grip and swim-pitch adjustments
- Kept the first-person renderer, mouse lock and camera controls unchanged.
- Moved the P226's third-person visual forward relative to its animated right hand, without replacing native pistol clips.
- Mounted the M4A1 in front of the chest instead of hanging it from the retargeted wrist. A lightweight CCD two-bone IK pass places both wrists near real grip targets. KayKit's CC0 rifle aim, fire and reload clips remain active; the support hand is released during reload.
- Adjusted chest height and foregrip targets after reviewing actual Chromium screenshots and measuring wrist-to-grip errors.
- Raised the level swimming pose by roughly 20 degrees, with additional head-up/head-down pitch when swimming upward or diving. First-person swimming is unchanged.
- This is positional wrist IK, not full hand/finger IK, and hand orientation still needs refinement for final-quality animation.

## Targeted rifle and swimming corrections
- Reduce the extra forward body tilt while swimming, so the swimmer does not look straight down; underwater movement, water rendering, and authored Swim_Fwd_Loop remain unchanged
- Keep all existing Quaternius pistol idle, shooting, and reload clips for the P226
- Add separate CC0 KayKit two-handed rifle aiming, shooting, and reloading clips for the M4A1 in third-person and top-down views
- Retarget only upper-body bone rotations from KayKit's Rig_Medium to the current Quaternius mannequin, without changing movement, first-person mouse lock, or weapon/ammunition rules
- This is not full hand IK; final grip refinement remains a possible future task

## Version 0.5 — Camera and character animation
- Pointer lock in first person: mouse movement looks around without holding the mouse button; Escape releases it
- Improved third-person gun attachment to the actual animated right hand
- Closer top-down and third-person camera for character and weapon readability
- CC0 Quaternius mannequin with its own idle, walk, sprint, jump, swim, tread, pistol idle, pistol shoot and pistol reload animation clips
- Swimming has real authored arm/leg motion, plus horizontal swimming pose; treading remains upright
- Character is still a temporary rigged mannequin for testing, not final art

## Version 0.4 — Jumping and weapons
- Gravity-based jumps, aerial movement, ground landing, and existing water interactions
- Two weapon types (pistol and rifle) with ammunition, reload, firing, weapon switching and impact indicators
- Real CC BY 4.0 weapon-and-arm GLB assets from a pinned IRONLINE revision, with an authored reload-arm clip pack
- First-person weapon models plus a held-weapon mesh attached to the temporary Soldier hand in third person
- `weapons.js` encapsulates weapon state and loading; the existing top-down/third/first person camera controls remain

## Current features
- Seeded terrain with gentler hills and a guaranteed lake near spawn
- Streamed world chunks with longer draw distance (64-unit chunks, 4-chunk radius)
- Instanced trees and rocks for improved performance
- Official Three.js `Water` add-on (r169): planar reflection, repeating normal map and sun highlights on the lake
- Water gameplay: wading, surface swimming, diving, drag, buoyancy, and a bottom-depth limit
- Temporary Quaternius CC0 rigged mannequin with 46 native animation clips; the simple fallback avatar remains if it fails to load
- Top-down, third-person, and first-person camera modes
- Sunlight, dynamic shadows, sky, atmosphere, and underwater fog

## Current limitations
- Water uses lightweight scripted gameplay physics, **not** a fluid simulation.
- Swimming and treading use Quaternius's authored CC0 clips. Body tilt, buoyancy and transitions are still simplified.
- Terrain and vegetation have no collision except a vertical ground-height constraint.
- Weapons have basic firing and ammunition, but no enemies, hit-point combat, advanced bullet physics, inventory persistence, or RPG progression yet.
- The temporary mannequin has authored jump and pistol shoot/reload clips. The rifle still uses the temporary pistol-oriented full-body animation and its first-person donor arms are not aligned through full runtime IK.
- First-person reload hand motion comes from a donor animation rig; full live hand-target IK is not integrated yet.
- The water-normal image is stored in `assets/waternormals.jpg` (original Three.js r169 binary). Three.js modules load from version-pinned jsDelivr, while the temporary Soldier model loads from the version-pinned official GitHub repository. The game therefore currently needs internet access for its engine and model.
- The reflective surface is visual only; buoyancy, drag, wading and diving are intentionally simple scripted gameplay physics, not simulated fluid dynamics.

## Next development priorities
- Properly rigged and licensed humanoid GLB with idle, walk, run, swim and dive clips
- Terrain and prop collision; improved camera occlusion
- More diverse biomes and water bodies; river/shore transitions
- Inventory, interaction, quests, and persistence

## Asset and source references
- [Official Three.js Water example](https://threejs.org/examples/webgl_shaders_ocean.html) and [Water add-on implementation](https://github.com/mrdoob/three.js/blob/r169/examples/jsm/objects/Water.js) (Three.js MIT license).
- [Official Three.js Soldier GLB and animation example](https://github.com/mrdoob/three.js/blob/r169/examples/webgl_animation_skinning_blending.html) (temporary demonstrator; verify individual asset redistribution terms before commercial release).
- [CC0 swimming animation](https://kinemiq.app/animations/move-swimming/) and [CC0 treading-water animation](https://kinemiq.app/animations/idle-in-water/) (not yet integrated).

## Automated testing
Run `npm install`, `npx playwright install chromium`, then `npm run test:browser` from the repository. GitHub Actions also runs these Chromium checks on pushes to `main`. It checks scene initialization, official lake geometry/normal map, character model loading, walking, cameras, swimming, dive and ascent.

Asset provenance: `assets/waternormals.jpg` comes from `mrdoob/three.js` tag `r169`, path `examples/textures/waternormals.jpg`, Git blob `9dfe03ce483a02fff31c35421094c53a333097bc`. See `THIRD_PARTY_NOTICES.md`.

### Additional free asset sources used for the prototype
- [IRONLINE first-person models and credited animation rigs](https://github.com/cktang88/3d-fps) (derived from CC BY 4.0 art; see `THIRD_PARTY_NOTICES.md`)
- Only loadout demonstrator assets; they are not the planned final character or weapon art.

### Character asset details
The CC0 test mannequin comes from Quaternius's Universal Animation Library (Standard), packaged as a web-ready GLB by ToonLab, pinned to the upstream commit listed in `THIRD_PARTY_NOTICES.md`. Its 46 native clips are used directly, avoiding cross-rig animation retargeting for this prototype.

### Medieval asset source
- [KayKit Adventurers, CC0](https://kaylousberg.itch.io/kaykit-adventurers): sword, shield, knight, greatsword props.
- [KayKit Character Animations, CC0](https://kaylousberg.itch.io/kaykit-character-animations): one-handed attacks, two-handed attacks, blocking, movement and jumping.
- Sources loaded from version-pinned public GitHub repositories, recorded in THIRD_PARTY_NOTICES.md.
