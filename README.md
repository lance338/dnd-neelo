# Neelo Drag & Drop: design prototype

**Play it:** https://lance338.github.io/dnd-neelo/ (GitHub Pages, served from `main` at the repo root).

Outside claude.ai the game, Tuning panel, voice lines and sound effects all work as-is. The Sound Lab's
live ElevenLabs generation and shared picks need the claude.ai artifact runtime, so on GitHub Pages it
opens read-only and plays the takes already in `audio/`. The helper scripts the README mentions under
`tools/` were not part of the published build and are not in this repo yet.

A playable spec for the Drag and Drop game type. It covers the seven templates from the Figma
"Games: Drag and Drop" page plus the drag moments mapped onto the Aetheris module (w1_r3_p1)
from "Games: Drag and Drop - Exploration of Existing Content".

This is plain HTML, JS and Canvas so design can iterate fast. It is **not** meant to be ported
line by line. Rebuild it in Flutter + Flame however you see fit; use this to see and feel
every interaction, animation, sound and rule.

Run locally: `python3 -m http.server` in this folder, open `http://localhost:8000`.
Press **T** in any level (or the sliders button) for the Tuning panel.

## What to look at

| Template | Level file | What it proves |
| --- | --- | --- |
| Simple drag onto | `simple_lantern`, `w1_r3_p1_l1_intro` | Many-to-one target, progressive state (lantern warms with each sundrop), scene change on completion |
| Match the outline | `match_nests` | One-to-one targets, ghost silhouette in the target, NPC reaction per drop |
| Grouping / sorting | `sort_toys` | Tag-based acceptance, multi-slot targets (3 per basket), per-item hint on a wrong drop |
| Solve the puzzle | `puzzle_bridge`, `w1_r3_p1_l5_aerial` | Any-of-a-kind into any open slot, payoff animation that uses the placed pieces |
| State change | `state_power`, `w1_r3_p1_l3_outro`, `w1_r3_p1_l3_lesson`, `w1_r3_p1_l5_lesson` | Target art swaps, world reacts, SEL story beat plays after the drop |
| Clean up | `cleanup_garden` | Absorbing target, each drop changes the world where the item used to be |
| Right or wrong | `choose_seed`, `w1_r3_p1_l4_feelings` | Distractors, `blindTargets` (targets never glow for the right answer), rounds |

New prototypes: `w2_r1_p1_backpack` (Pack for the Trail, W2 Cragspire), `w1_r3_p1_l4_feelings`
(What's Brio Feeling?, 4 rounds, see `rounds` in the JSON), `w4_wake_bots` (Wake the Bots, W4),
`w1_r3_p1_l1_outro` (Light the Lantern Tower).

## Mapping to the Flutter architecture

```
js/constants/        -> lib/constants/ (VividColors, Dimens, VividTypography stand-ins)
js/config/           -> tuning defaults + sound manifest (seed a tuning provider / AudioService map); no ambience loops
js/services/         -> AudioService, tuning Notifier
js/games/drag_drop/
  drag_drop_game_view.js   -> drag_drop_game_view.dart  (GameWidget + overlays: Nova intro, hint circle, feedback bubble, meter, buttons, Nova finale)
  drag_drop_game.js        -> drag_drop_game.dart       (FlameGame: loop, input, drop rules, facade methods)
  game_controller.js       -> games/common/game_controller.dart (progress, attempts, completion summary)
  components/*.js          -> *_component.dart (item, zone, actor/NPC, effects, hint hand)
  scenes/*.js              -> per-level reactions (see "Scenes" below)
  art/*.js                 -> SVG stand-in art, one key per asset
game_data/drag_drop/*.json -> game_data/<module>/*_level.json (gameType would be a new `drag_drop` enum value)
```

The layers follow `flame-games.md`: components never touch services; they call facade methods on
the game (`t()` for tuning, `play()` for sound, `say()` for the guide, `actor()`, `zone()`, `wait()`).
The view owns exit handling and calls `onExit()` once (button or dispose).

## Level JSON

```jsonc
{
  "id": "sort_toys", "template": "sort", "scene": "sort", "background": "schoolyard",
  "world": 1,                        // Nova's outfit: 1 aviator, 2 orange jacket, 3 diving helmet, 4 Lumina, 5 Everglen
  "guide": { "intro": "...", "success": "...", "cheers": ["..."], "wrong": "fallback hint", "hint": "optional line for the hint circle (falls back to intro)" },
  "actors": [{ "id": "luma", "npc": "luma", "x": 300, "y": 352, "size": 190, "mood": "neutral", "facing": 1 }],
  "zones": [{
    "id": "basket_luma", "art": "basket_pink", "x": 300, "y": 520, "size": 210,
    "accepts": ["outside"],          // item ids or tags
    "capacity": 3,
    "slots": [{ "dx": -52, "dy": -44, "scale": 0.62, "rot": -0.15 }],  // where placed items sit
    "mode": "stay",                  // or "absorb" (item shrinks into the target)
    "hitRadius": 118, "ghost": "egg_pink", "icon": "ball",
    "snapSound": "snap", "landSound": "powerup", "wrongHint": "..."
    // "actor": "ziya" makes the target follow an NPC
  }],
  "items": [{ "id": "ball", "art": "ball", "x": 515, "y": 698, "size": 86, "tags": ["outside"],
              "required": true, "hint": "...", "float": false }]
}
```

Positions are on a **1162 x 806 logical stage** (the comic frame size in Figma), scaled to fit the
screen. Backgrounds extend past the stage so they cover any ratio. In Flame, express these as
fractions of the game size per `docs/flame-sizing-strategy.md`.

## Interaction spec (the part that makes it feel good)

All numbers live in the Tuning panel. Export JSON from there; the defaults are in
`js/config/tuning_defaults.js`.

1. **Pick up**: item springs to 1.14x, lifts with a growing soft shadow, other items dim, every
   valid target glows. Pickup sound.
2. **Drag**: item follows the finger on a critically damped spring and sits **46 units above the
   finger** so small hands never cover it. It tilts with horizontal speed. If the finger has not
   moved yet, nothing jumps.
3. **Hover**: inside the snap radius of a valid target, the target grows and glows green, the item
   is pulled toward the slot (magnet), one soft hover shimmer plays.
4. **Correct drop**: spring into the slot, squash and stretch on landing, sparkles + ring, snap
   then success sound, meter fills, scene reaction.
5. **Wrong target**: target shakes "not me", item arcs home, friendly boing, guide shows the item's
   specific hint. No score penalty language anywhere.
6. **Help ladder**: after 2 misses on an item the right target pulses gold and the item glows.
   After 9 idle seconds a ghost hand demonstrates the drag twice.
7. **Full target of the right kind**: not counted as a mistake; item glides home and the open
   target pulses.
8. **Dropped on nothing**: glides home with a soft whoosh.
9. **Tap alternative**: tap an item (it lifts and bobs), then tap a target. For children who find
   holding a drag hard.
10. **Completion**: scene payoff first, then confetti and the victory jingle, then Nova's finale.

## Nova (guide) flow

Art: `nova_w{1-5}_{quiz,incorrect,correct}.png` (Figma "Assets" section, check-in poses per world)
plus square portraits `nova_w{n}_head.png` / `_head_flat.png` for the circle.

1. **Intro**: input is locked (`game.lock()`). Nova in the world outfit (quiz pose) springs up from
   below the screen, then the dialog box (white, purple border, navy "Nova" tag, tail pointing at
   him) pops in with `guide.intro` and a "Let's go!" button. Tapping Nova, the dialog or the scrim
   also continues. `introAutoContinue` in tuning can auto-advance.
2. **Into the circle**: Nova scales and flies so his head lands exactly in the hint circle (bottom
   right, 124px; 92 to 96px on phones). The circle pops in. `game.unlock()`.
3. **Feedback**: every `say()` opens a large bubble above the circle. Tones: cheer (green, star),
   hint (amber, ?), info (purple). Nova hops for cheers and shakes with a flat mouth for hints. The
   bubble stays at least `feedbackMinSeconds` (or about 14 characters per second), lifts itself
   above any item waiting in a tray it would cover (a dotted stem keeps it tied to Nova), and ducks
   away the moment the player starts a drag.
4. **Hint circle**: tapping it calls `game.requestHint()`: says `scene.hintText()` or `guide.hint`
   (falling back to `guide.intro`), and runs the hand demo for the next item. The idle hint also
   makes the circle ring and wiggle. Hint taps are counted in the summary.
5. **Voice**: every line Nova says is also spoken (ElevenLabs voice "Nova V3", Eleven v4, stability 0.32,
   similarity 0.75, delivery tags per sentence, 85 lines, takes A and B). `audio.speak(text)` looks the exact on-screen text up in `audio/nova/lines.json`
   and plays `audio/nova/{a,b}/<file>.mp3` on its own voice bus (tuning: Nova voice volume and take).
   A new line cuts off the previous one. In the feelings level Nova also reads each situation.
   Recording script: `audio/nova/script.json`; downloads are split per line with
   `python3 tools/split_nova.py <folder>` (it recognises each take by its length).
6. **Finale**: the circle hides and Nova (correct pose, arms up, a bit smaller so the payoff stays
   visible) rises with `guide.success`, the stats and Play again / Next.

## Scenes

Generic behavior is the engine. A scene script only adds the story beat for that level:
`init`, `update`, `drawBack / drawMid / drawFront`, `onPlace`, `onWrong`, `onComplete` (async, the
engine waits for it). In Flame this is a small `DragDropScene` interface with one implementation
per beat, chosen by the level JSON `scene` field.

SEL notes baked into the lesson scenes (from the research review):
- The Empathy Gem success is Ziya feeling understood, then an invitation she can accept. Not
  instant happiness.
- The Consideration Chime ends in a shared plan (soccer first, then jump rope), both NPCs heard.
- Sorting sorts toys by what each NPC enjoys. Nothing sorts feelings into good and bad.

## Sound

`js/config/sound_manifest.js` maps each game event to two ElevenLabs takes (A and B, pick in the
Tuning panel). The set comes from the ElevenLabs flow "Neelo - Drag and Drop SFX v2 (UI set)":
one palette (felt-mallet marimba, celesta, soft wood), short UI lengths (0.5s for pickup, hover,
snap and meter; 0.6s for bounce, return, plank and poof; 1 to 1.4s for hit, gem, chime, ignite,
powerup and transform). Model `eleven_text_to_sound_v2`, prompt influence 0.65, duration set per
sound. Event list: pickup, hover, snap, hit, bounce, return, plank, ignite, powerup, poof,
transform, chime, gem, meter, npc, complete. `trims` per take level-match the raw files in game;
the files themselves are unnormalized (-16 LUFS normalization is applied only on request).
New takes live in `audio/dnd/`, library sounds (NPC hello, victory jingles) in `audio/lib/`.

### Sound Lab (prototype tooling)

`#sounds` (the Sound Lab button on the hub) lists every sound in the prototype: the 16 sound
effects in `sound_manifest.js` and all 96 voice lines in `audio/nova/lines.json`. The list is
generated by `tools/build_sound_catalog.py` into `js/config/sound_catalog.js`; rerun it after
adding sounds or lines. Each sound can be played, given one new ElevenLabs take, set as the one
the game uses, and cleared of unused options.

- New takes come from the ElevenLabs connector, called from the page. Sound effects and the comic
  lines rerun their existing node; Nova lines (which were recorded as one take per level) get a
  node of their own in the "Neelo - Sound Lab" flow the first time.
- Each press of Generate makes two takes. Choices are shared through the artifact's database
  (`lab/<sound id>`).
- The published page can't load audio straight from ElevenLabs (its links are on another domain),
  so a new take opens in a new tab until it is synced: `tools/sync_lab_takes.py` downloads takes
  into `audio/lab/` and lists them in `audio/lab/index.json`. Synced takes play on the page and in
  game, and sound effect takes are level-matched to the built-in A/B takes.
- "Delete unused" hides built-in files and drops generated takes; the repo files stay put.
- For the Flutter build, chosen takes should become plain asset files: download the picks into
  `audio/` and update the manifests (Claude can do this on request).

## Comic strips and the night sky

A level can carry a comic: `comic.before` frames play before the game and
`comic.after` frames after it, each `{ img, who, text }`. A frame slides in, its
line plays in the speaker's voice (looked up as `who|text` in
`audio/nova/lines.json`, then plain `text`), and it moves on when the line ends;
a tap skips ahead. A story beat marked `"over": "comic"` pops up over the last
frame (Skyrian after frame 3 of the L1 outro); the next beat is shown over the
game. After `comic.after`, the end card (stats, Play again, Next) sits on the
last frame. Frames are exported at 2x from Figma ("L1 - Intro & Outro") into
`assets/comic/`.

`"background": { "type": "nightSky" }` draws the animated sky from
`js/games/drag_drop/art/night_sky.js`: the gradient and the sparkle stars are
drawn in code (stars twinkle), the small clouds drift and bob, and the cloud
bank is two seamless tiles (`sky_clouds_back`, `sky_clouds_front`) that slide
right at different speeds and repeat across any width. `"meter": false` hides
the progress meter for a level. The meter's end icon is the yellow sundrop.

## Art

Real Neelo art is exported from the Lance's Sandbox Figma file into `assets/img/` (PNG with
transparency at 1.3x to 2x, backgrounds as JPG; `manifest.json` lists every file). Level JSON refers
to it as `img:<name>`; `dim:img:<name>` is a darkened copy used for "off" states (unlit lantern,
sleeping bots). Component variants map straight onto game states:

| Figma component | Variants used | Game state |
| --- | --- | --- |
| Lantern Tower | Stage=1..7 | one stage per sundrop (L1 Outro) |
| Power Core | State=1..6 | charges up inside the machine |
| Backpack | Open, Closed-Tent | packing, then packed |
| Sun Drops | 8 colors | draggable items |
| Ziya / Luma / Brio + Face sets | body State x Expression | NPC moods (`moods` map in level JSON) |
| Face - Brio | Very Happy, Very Sad, Terrified, Unconvinced | What's Brio Feeling? answers |
| RoundBot 3 | Default, Digital | sleeping, awake |

Where Figma has no asset yet (Empathy Gem, Consideration Chime, nests, sorting toys, clean up,
seed, bridge islands, W4 backdrop) the prototype still uses vector stand-ins in
`js/games/drag_drop/art/`. NPC moods crossfade over 0.35s, which maps to sprite swaps or a Rive
state machine.

## Analytics

`GameController.summary()` returns `levelId, template, seconds, drops, wrongDrops,
hints, firstTryAccuracy`. Nova's finale shows it for playtests; in the app it would go to Amplitude.
