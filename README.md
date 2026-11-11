# Wanderlands

A procedural 3D RPG exploration prototype running in the browser with [Three.js](https://threejs.org/).

## Play
Use GitHub Pages (Settings → Pages → Deploy from a branch → main / root) or run a local HTTP server from the repository folder:

```bash
python -m http.server 8000
```

Open http://localhost:8000.

## Controls
- W/A/S/D: movement
- Shift: sprint
- Mouse drag: rotate the camera
- 1: top-down view
- 2: third-person view
- 3: first-person view
- R: new procedural world

Add `?seed=2026` to the URL for a repeatable world.

## Current features
- Seeded, chunk-based terrain streaming
- Procedural trees, rocks and hills
- Walkable avatar placeholder with animated limbs
- Three adjustable perspectives, sunlight, shadows, atmospheric fog

## Next steps
Replace the temporary avatar with a rigged, correctly licensed humanoid GLB (idle, walk, run); add terrain/prop collision, biomes, interactable objects and save data.

The project currently requires an internet connection to load Three.js from jsDelivr.