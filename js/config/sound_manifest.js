/**
 * Game event -> sound files.
 * `options` are the two ElevenLabs takes (A / B) from the flow
 * "Neelo - Drag and Drop SFX v2 (UI set)": one short, cohesive UI palette of
 * felt-mallet marimba, celesta and soft wood, 0.5 to 1.4 seconds each.
 * The take that plays is chosen in the Sound Lab (audio/lab/picks.json off claude.ai).
 * `trims` level-match the raw takes in game (the files themselves are untouched),
 * `gain` is a per-event trim on top of the SFX bus, and `vary` adds a tiny random
 * pitch change so repeated drops never sound identical.
 * `fallback` is an existing Neelo library sound, used only if a file is missing.
 */
const LIB = 'audio/lib/';
const DND = 'audio/dnd/';

export const SOUND_MANIFEST = {
  pickup: { label: 'Pick up', options: [DND + 'dnd-pickup-a.mp3', DND + 'dnd-pickup-b.mp3'], trims: [0.56, 2.6], fallback: LIB + 'ui-tap-B-bubble-pop-a.mp3', gain: 0.8, vary: 0.05 },
  snap: { label: 'Snap into place', options: [DND + 'dnd-snap-a.mp3', DND + 'dnd-snap-b.mp3'], trims: [0.52, 0.81], fallback: null, gain: 0.9, vary: 0.04 },
  hit: { label: 'Correct drop (hits the target)', options: [DND + 'dnd-hit-a.mp3', DND + 'dnd-hit-b.mp3'], trims: [3.05, 1.84], fallback: LIB + 'coin-F-marimba-3-note-a.mp3', gain: 0.9, vary: 0.03 },
  bounce: { label: 'Not this one (bounce back)', options: [DND + 'dnd-bounce-a.mp3', DND + 'dnd-bounce-b.mp3'], trims: [1.88, 0.84], fallback: null, gain: 0.75, vary: 0.04 },
  return: { label: 'Glide home', options: [DND + 'dnd-return-a.mp3', DND + 'dnd-return-b.mp3'], trims: [0.99, 0.76], fallback: null, gain: 0.6, vary: 0.05 },
  plank: { label: 'Bridge plank', options: [DND + 'dnd-plank-a.mp3', DND + 'dnd-plank-b.mp3'], trims: [1.74, 0.97], fallback: LIB + 'footstep-wood-a.mp3', gain: 1, vary: 0.06 },
  ignite: { label: 'Lantern lights', options: [DND + 'dnd-ignite-a.mp3', DND + 'dnd-ignite-b.mp3'], trims: [3.98, 2.37], fallback: null, gain: 0.9, vary: 0 },
  powerup: { label: 'Machine powers on', options: [DND + 'dnd-powerup-a.mp3', DND + 'dnd-powerup-b.mp3'], trims: [0.79, 0.6], fallback: null, gain: 0.9, vary: 0 },
  poof: { label: 'Clean up poof', options: [DND + 'dnd-poof-a.mp3', DND + 'dnd-poof-b.mp3'], trims: [1.06, 2.26], fallback: null, gain: 0.8, vary: 0.08 },
  transform: { label: 'State change', options: [DND + 'dnd-transform-a.mp3', DND + 'dnd-transform-b.mp3'], trims: [0.6, 1.46], fallback: null, gain: 0.85, vary: 0 },
  chime: { label: 'Consideration Chime', options: [DND + 'dnd-chime-a.mp3', DND + 'dnd-chime-b.mp3'], trims: [1.07, 2.92], fallback: null, gain: 1, vary: 0 },
  gem: { label: 'Empathy Gem', options: [DND + 'dnd-gem-a.mp3', DND + 'dnd-gem-b.mp3'], trims: [2.75, 2.92], fallback: null, gain: 0.9, vary: 0 },
  meter: { label: 'Meter tick', options: [DND + 'dnd-meter-a.mp3', DND + 'dnd-meter-b.mp3'], trims: [2.0, 3.98], fallback: null, gain: 0.55, vary: 0.02 },
  npc: { label: 'NPC reacts', options: [LIB + 'cutehello-female.mp3', LIB + 'npc-pop-A-bubble-boing-a.mp3'], fallback: null, gain: 0.6, vary: 0.03 },
  complete: { label: 'Victory jingle', options: [LIB + 'victory-B-4s-bouncy-fanfare-a.mp3', LIB + 'victory-F-4s-bouncy-fanfare-2-a.mp3'], fallback: null, gain: 1, vary: 0, bus: 'jingle' },
};
