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
- Animated translucent water with GPU waves and surface glints
- Water gameplay: wading, surface swimming, diving, drag, buoyancy, and a bottom-depth limit
- Placeholder humanoid with different walking and swimming animation poses
- Top-down, third-person, and first-person camera modes
- Sunlight, dynamic shadows, sky, atmosphere, and underwater fog

## Current limitations
- Water uses lightweight scripted gameplay physics, **not** a fluid simulation.
- Swimming animations are procedural placeholders, not motion-captured or rigged clips.
- Terrain and vegetation have no collision except a vertical ground-height constraint.
- There is no combat, inventory, saving, NPCs, or RPG progression yet.
- Three.js is loaded from jsDelivr and therefore currently needs internet access.

## Next development priorities
- Properly rigged and licensed humanoid GLB with idle, walk, run, swim and dive clips
- Terrain and prop collision; improved camera occlusion
- More diverse biomes and water bodies; river/shore transitions
- Inventory, interaction, quests, and persistence
