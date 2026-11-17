# Comic to Check-In · Camera Pan (W5R1P1 Level 1)

**Play it:** https://lance338.github.io/dnd-neelo/comic-to-checkin/
**Figma:** W5 R1 P1 Overcoming Performance Stress, "All Assets for Export" page (`L1 Components`, node 3662:635371 is the wide background).

This folder is a self-contained copy of the prototype that plays one lesson end to end:
Tremu's comic, Tremu's two overlay lines, the drag and drop, the camera zoom and burst, then
Nova's check-in. It is the reference for how the **camera pan** should feel. As with the rest of
this repo, rebuild it in Flutter + Flame however you see fit; this page shows the exact timing,
positions and order.

Run locally: `python3 -m http.server` in this folder, open `http://localhost:8000`.
Press **T** during the drag for the Tuning panel (feel values for drag, snap and effects).

The level is data: `game_data/drag_drop/w5_r1_p1_l1_c2c_v2.json`.
The scene logic is `js/games/drag_drop/scenes/everglen_stress.js`.
The camera lives in `js/games/drag_drop/drag_drop_game.js` (`cam`, `camHome`, `zoomTo`, `panTo`, `_toStage`).
The overlay beats and the comic live in `js/games/drag_drop/drag_drop_game_view.js` (`runIntro`, `showOverlay`, `hideOverlay`, `playComic`).

---

## 1. Coordinate system

Everything is in **stage units**: the Figma frame is **1162 x 806**, origin top left.
The screen scales the stage to fit (letterboxed, never stretched). Anything wider than the
stage on a wide screen shows more of the world to the left and right.

| Thing | Position (stage units) | Size | Notes |
| --- | --- | --- | --- |
| Camera centre, start | (581, 403) | zoom 1 | The stage centre: the view shows x 0 to 1162 |
| Camera centre, after the pan | (370.5, 403) | zoom 1 | The NPCs end up in the middle of the screen |
| Wide background (3 layers) | x from -904 to 1162, y 0 | 2066 x 806 | The original 1162 frame is the right-hand part; 904 units extend to the left |
| Target: the three Everglenians | centre (370.5, 498.2) | art 511 x 395 | Hit circle radius 250, centred 30 units above the art centre |
| Item: body stress symbol | (target x, 169.3) | 175 x 175 | Always directly above the target (see section 4) |
| Tremu, line 1 (standing pose) | top left (764, 112) | width 362 | Screen space: does not move with the camera |
| Tremu, line 2 (pointing pose) | top left (648, 112) | width 479 | Screen space |
| Tremu's text box | top left (85, 705) | 991 x 77 | Screen space; the art is `assets/img/w5_textbox_1.svg` / `_2.svg` |

**World vs screen:** the forest, the Everglenians and the symbol are in the **world** (they move
when the camera pans). Tremu, his text box, Nova's hint circle and the HUD buttons are **screen
space** (they never move with the camera). In Flame: world components under `World`, HUD and
the Tremu overlay on `camera.viewport` or as Flutter overlays.

## 2. The sequence, beat by beat

| # | What happens | Timing | Input |
| --- | --- | --- | --- |
| 1 | **Comic**: 5 frames of Tremu's body stress comic (`comic.before` in the JSON). Each frame slides in over the last (0.55 s, from 5% right and 98.5% scale, `cubic-bezier(.2,.9,.3,1)`), its voice line plays, then it moves on by itself 0.7 s after the line ends | Per line | Tap anywhere skips to the next frame |
| 2 | The comic fades out (0.45 s) and the forest scene is behind it. Camera at the start position: the Everglenians stand on the left (x 370.5), nothing is centred yet | | |
| 3 | **Tremu line 1** rises from below (standing pose): character slides up from 110% below over 0.75 s (`cubic-bezier(.25,1.3,.45,1)`, a soft overshoot), the text box slides up 170 units over 0.5 s after a 0.3 s delay (`cubic-bezier(.3,1.4,.5,1)`). Voice starts 0.6 s after the rise starts. Blinks every 2.2 to 4.8 s | Waits for a tap | Tap advances |
| 4 | **Tremu line 2** (pointing pose): same Tremu, the text crossfades (0.42 s) and he does a small squash (0.45 s). **At the same moment the body stress symbol spawns**, 0.6 s after line 2 starts: it pops in from scale 0 to 1 on a spring, directly above the Everglenians | Waits for a tap | Tap advances. The symbol can't be dragged yet |
| 5 | **Tremu leaves**: character slides down 110% (0.5 s ease-in), the text box drops 170 units (0.35 s ease-in). Nova's hint circle pops in at the corner. 0.25 s later the drag unlocks | 0.56 s + 0.25 s | |
| 6 | **Camera pan** (the point of this prototype): the camera moves from x 581 to x 370.5 so the Everglenians and the symbol come to the centre. **1.0 s, ease-in-out cubic. Position only, zoom stays 1.** Everything in the world moves together (no parallax). The symbol stays exactly above the Everglenians because it is in the world | 1.0 s | Drag is live from the start of the pan |
| 7 | **Drag and drop**: one item, one target. Wrong drops and misses glide home. Idle hint hand after 9 s | Player | |
| 8 | **Correct drop**: the symbol is absorbed into the Everglenians. 0.35 s, then 0.2 s more, then the payoff (section 5) | | Input locked |
| 9 | **Payoff**: zoom in on the Everglenians, they tremble, burst, they turn calm, zoom back out to the panned position (x 370.5, zoom 1) | about 3.5 s | |
| 10 | 0.6 s later **Nova's check-in** takes over the screen (question, three answers, feedback, coins). See `checkin` in the JSON | | |

Going back: the back control (bottom right) during Tremu's lines steps back one beat, or back
into the last comic frame. If you step back from line 2 to line 1, the symbol disappears again.

## 3. The camera

One camera, defined by a **centre point** (in stage units) and a **zoom**. Zoom 1 at (581, 403)
is the normal view. The camera has a **resting point** (`camHome`): where it returns after any
temporary move like the payoff zoom.

- **Pan:** `panTo(370.5, 403, 1.0)` sets the resting point to (370.5, 403) and eases the centre
  there over 1.0 s, zoom 1.
- **Payoff zoom:** eases the centre to (target x, target y + 30) and the zoom to 1.6 over 0.75 s,
  then later back to the resting point at zoom 1 over 0.85 s. Because the resting point is the
  panned position, the zoom out returns to the panned view, **not** to the stage centre.
- **Easing (every camera move):** ease-in-out cubic,
  `k < 0.5 ? 4k³ : 1 - (-2k + 2)³ / 2`. Flutter: `Curves.easeInOutCubic`.
- **Shake:** a small offset added on top of the camera each frame, built from a few sine waves
  (x: `sin(t·61)·a·0.7 + sin(t·37)·a·0.3`, y: `cos(t·53)·a·0.6 + sin(t·29)·a·0.3`). The amplitude
  either fades out over the duration or, for a "build up", grows from 25% to 100%.
- **Input follows the camera:** a touch is converted from screen to world by undoing the camera:
  `world = (screen - stageCentre) / zoom + cameraCentre - shake`. In Flame you get this for free
  when draggable components live in the `World` that the `CameraComponent` looks at.

**Flame sketch** (Flame 1.x, `CameraComponent` + `World`):

```dart
// Setup: a fixed-resolution camera on the 1162 x 806 stage
final camera = CameraComponent.withFixedResolution(world: world, width: 1162, height: 806);
camera.viewfinder.anchor = Anchor.center;
camera.viewfinder.position = Vector2(581, 403);   // start: the stage centre
Vector2 camHome = Vector2(581, 403);

// Step 6: pan to the NPCs once Tremu has left
void panToNpcs() {
  camHome = Vector2(370.5, 403);
  camera.viewfinder.add(MoveEffect.to(
    camHome,
    EffectController(duration: 1.0, curve: Curves.easeInOutCubic),
  ));
}

// Step 9: payoff zoom, then back to wherever the camera rests
Future<void> payoff(Vector2 target) async {
  final ec = EffectController(duration: 0.75, curve: Curves.easeInOutCubic);
  camera.viewfinder.add(MoveEffect.to(target + Vector2(0, 30), ec));
  camera.viewfinder.add(ScaleEffect.to(Vector2.all(1.6), EffectController(duration: 0.75, curve: Curves.easeInOutCubic)));
  // ... tremble 0.75 s, burst, hold 1.0 s ...
  camera.viewfinder.add(MoveEffect.to(camHome, EffectController(duration: 0.85, curve: Curves.easeInOutCubic)));
  camera.viewfinder.add(ScaleEffect.to(Vector2.all(1), EffectController(duration: 0.85, curve: Curves.easeInOutCubic)));
}
```

Tremu's overlay, the text box, Nova's circle and the HUD must **not** be in the world, or they
will pan with it.

## 4. The item always sits above the target

Rule for every drag and drop: an item spawns **directly above its target** and **stays above it
whatever moves** (the camera or the target). In this prototype the scene sets the item's home
x to the target's x every frame, and while the item is resting it moves with it exactly (no lag).
After a wrong drop it glides home to that spot. In Flame the simplest way is to keep the item and
the target in the world with the same x (or make the item's home position derive from the
target's position), so a camera pan moves both together.

Spawn: scale springs from 0 to 1 (stiffness 300, damping 20), a soft blue glow `#8C98FF` behind
it, a gentle float (bob) while it waits.

## 5. Payoff after the correct drop (`scenes/lantern_burst.js`)

1. The symbol is absorbed into the Everglenians (`"mode": "absorb"`), sound `hit`.
2. Wait 0.35 s + 0.2 s.
3. Camera eases to (target x, target y + 30) at zoom 1.6 over 0.75 s.
4. The burst Lottie (`assets/lottie/lantern_burst.json`, 60 fps, burst marker at frame 45) plays
   on top of the Everglenians, drawn at 73% of the target art width, in the world so it zooms and
   shakes with the camera. During the 0.75 s build up the camera shakes, amplitude 5 growing.
5. At the burst marker: the target art swaps from `w5_target_stressed` to `w5_target_calm`, a
   pop on the target, sparkles at offsets (-180, -40), (0, -70) and (176, -40) from the target
   centre (colours `#B8FFD6`, `#FFFFFF`, `#FFF6B8`), sounds `ignite` and `transform`, a sharper
   shake (9 for 0.35 s).
6. Hold 1.0 s, then the camera returns to its resting point (the panned view) over 0.85 s.
7. No confetti or victory jingle in this lesson (`"celebrate": false`). 0.6 s later the check-in.

## 6. The forest (wide background)

Three layers, each 2066 x 806, placed at x = -904 (so the original 1162 frame is their right-hand part):

| Layer | Art | Motion |
| --- | --- | --- |
| Back trees | `assets/img/w5_wide_trees_back.svg` | Sways left and right: 1.6 units, `sin(t·0.55)` |
| Front trees | `assets/img/w5_wide_trees_front.svg` | Sways 2.6 units, `sin(t·0.75 + 1.3)` |
| Ground | `assets/img/w5_wide_ground.svg` | Static |

Each layer is also drawn mirrored on both sides so very wide screens never see an edge.
Between the trees and the ground: 7 falling leaves (`#9AD8B6`, 55% opacity, drifting and
rotating) and 12 slow rising pollen motes (white, pulsing 30 to 60% opacity), repeated across
the wide background. Sky colour `#D7F8EA`. These all live in the world and pan with the camera.

## 7. Sound and voice

Sound choices come from the Sound Lab (the main prototype's `#sounds` page); this folder plays
the current picks. Events used here: `pickup`, `return` (glide home), `bounce` (wrong drop),
`hit` (correct drop), `ignite` (burst), `transform` (Everglenians turn calm). Tremu's and Nova's
voice lines are in `audio/vo/w5/` (`a` and `b` takes), mapped to their text in `audio/nova/lines.json`.

## 8. Other versions

The same lesson has two sibling versions on the Comic to Check-In launch pad in the claude.ai
prototype: the Everglenians slide to the centre themselves instead of the camera moving, or
nothing moves and Tremu stays on screen during the drag. This folder is only the camera pan
version, the one to build.
