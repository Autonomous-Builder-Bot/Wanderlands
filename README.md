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

## Controls
| Key | Action |
|---|---|
| W/A/S/D | Move |
| Shift | Sprint (also while swimming) |
| Mouse drag | Rotate camera |
| 1 / 2 / 3 | Top-down / third-person / first-person |
| Space | Jump on land / swim up toward surface in deep water |
| C or Left Ctrl | Dive while in deep water |
| Left click | Fire equipped weapon |
| R | Reload |
| Q | Switch pistol / rifle |
| N | Generate a new world seed |

Add `?seed=2026` to the URL for a reproducible world.

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
- Temporary Soldier GLB sourced from the official Three.js examples, with its authored idle/walk/run animation clips; placeholder used if loading fails
- Top-down, third-person, and first-person camera modes
- Sunlight, dynamic shadows, sky, atmosphere, and underwater fog

## Current limitations
- Water uses lightweight scripted gameplay physics, **not** a fluid simulation.
- The temporary Soldier character does not yet have authored swim clips; it uses a tilted idle pose underwater. Real CC0 swimming motions are available from Quaternius/KinemIQ for future retargeting.
- Terrain and vegetation have no collision except a vertical ground-height constraint.
- Weapons have basic firing and ammunition, but no enemies, hit-point combat, advanced bullet physics, inventory persistence, or RPG progression yet.
- The temporary Soldier model has no authored jump or full-body shooting clips, so airborne posing is basic.
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
