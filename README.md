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
| Space | Swim up / rise toward the surface |
| C or Left Ctrl | Dive while in deep water |
| R | Generate a new world seed |

Add `?seed=2026` to the URL for a reproducible world.

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
- There is no combat, inventory, saving, NPCs, or RPG progression yet.
- Three.js, the Water normals texture and temporary character are currently loaded from pinned jsDelivr URLs, so gameplay needs internet access unless these assets are vendored locally.
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
