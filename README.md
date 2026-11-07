# Plants vs. Zombies — HTML Edition

A browser-based remake/prototype built from the visual assets inside the supplied Scratch `.sb3` project.

## Run
Open `index.html` in a modern browser. No build tools or server are required.

## Files
- `index.html` — page structure and HUD
- `style.css` — interface styling
- `game.js` — canvas rendering, plant placement, sun collection, zombie movement, projectiles, waves, and lawn mowers
- `assets/` — selected original SVG artwork extracted from the Scratch project

## Current prototype
- 5 lanes × 9 planting columns
- 8 plant types: Peashooter, Sunflower, Wall-nut, Cherry Bomb, Snow Pea, Potato Mine, Chomper, Repeater
- Sun currency and falling sun pickups
- Normal, Conehead, and Buckethead zombies
- Projectiles, basic plant/zombie health, lawn mowers, one wave, pause, and restart
- Right-click a planted tile to remove the plant

## Notes
This is a first playable browser conversion, not a 1:1 port of every Scratch block. Some advanced animations, sound, exact timing, level progression, and additional original Scratch behaviors remain to be implemented. The project uses the original artwork bundled with the supplied Scratch file.
