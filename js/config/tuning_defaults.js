/**
 * Every "feel" value in the drag and drop game lives here.
 * The in-game Tuning panel edits these live and exports them as JSON, which is
 * the hand-off spec for the Flutter + Flame implementation.
 *
 * Units: seconds, logical stage units (1162 x 806 stage), multipliers.
 */
export const TUNING_SCHEMA = [
  {
    group: 'Pickup',
    params: [
      { key: 'pickupScale', label: 'Lift scale', min: 1, max: 1.4, step: 0.01, def: 1.14 },
      { key: 'pickupLift', label: 'Lift height', min: 0, max: 40, step: 1, def: 14 },
      { key: 'fingerOffsetY', label: 'Finger offset (keeps item visible above finger)', min: 0, max: 120, step: 2, def: 46 },
      { key: 'dimOthers', label: 'Dim other items while dragging', min: 0, max: 0.6, step: 0.01, def: 0.18 },
      { key: 'highlightTargets', label: 'Glow valid targets on pickup', type: 'bool', def: true },
    ],
  },
  {
    group: 'Drag',
    params: [
      { key: 'followStiffness', label: 'Follow stiffness', min: 50, max: 2000, step: 10, def: 900 },
      { key: 'followDamping', label: 'Follow damping', min: 5, max: 90, step: 1, def: 52 },
      { key: 'tiltAmount', label: 'Tilt from speed', min: 0, max: 0.6, step: 0.01, def: 0.22 },
      { key: 'tiltMax', label: 'Max tilt (radians)', min: 0, max: 0.8, step: 0.01, def: 0.35 },
      { key: 'tapToPlace', label: 'Tap item, then tap target also works', type: 'bool', def: true },
    ],
  },
  {
    group: 'Snap',
    params: [
      { key: 'snapRadius', label: 'Snap radius', min: 20, max: 260, step: 2, def: 120 },
      { key: 'magnetStrength', label: 'Magnet pull when hovering', min: 0, max: 0.8, step: 0.01, def: 0.32 },
      { key: 'zoneHoverScale', label: 'Target grows on hover', min: 1, max: 1.3, step: 0.01, def: 1.08 },
      { key: 'snapStiffness', label: 'Snap stiffness', min: 50, max: 1500, step: 10, def: 520 },
      { key: 'snapDamping', label: 'Snap damping', min: 5, max: 60, step: 1, def: 20 },
      { key: 'squash', label: 'Squash and stretch on land', min: 0, max: 0.5, step: 0.01, def: 0.18 },
    ],
  },
  {
    group: 'Wrong / Return',
    params: [
      { key: 'returnStiffness', label: 'Return stiffness', min: 50, max: 1200, step: 10, def: 260 },
      { key: 'returnDamping', label: 'Return damping', min: 5, max: 60, step: 1, def: 18 },
      { key: 'returnArc', label: 'Return arc height', min: 0, max: 200, step: 2, def: 70 },
      { key: 'wrongShake', label: 'Target shakes "not me"', min: 0, max: 30, step: 1, def: 10 },
    ],
  },
  {
    group: 'Help',
    params: [
      { key: 'missesBeforeAssist', label: 'Misses before the right target glows', min: 1, max: 6, step: 1, def: 2 },
      { key: 'idleHintDelay', label: 'Idle seconds before a hint hand shows', min: 2, max: 30, step: 0.5, def: 9 },
      { key: 'showGuideBubbles', label: 'Show guide speech bubbles', type: 'bool', def: true },
    ],
  },
  {
    group: 'Nova',
    params: [
      { key: 'introAutoContinue', label: 'Intro auto-continues after (s), 0 waits for a tap', min: 0, max: 15, step: 0.5, def: 0 },
      { key: 'novaShrinkMs', label: 'Shrink into the circle (ms)', min: 300, max: 1600, step: 20, def: 780 },
      { key: 'feedbackMinSeconds', label: 'Feedback bubble stays at least (s)', min: 1, max: 6, step: 0.1, def: 2.6 },
    ],
  },
  {
    group: 'Effects',
    params: [
      { key: 'sparkleCount', label: 'Sparkles on correct drop', min: 0, max: 60, step: 1, def: 22 },
      { key: 'confettiCount', label: 'Celebration confetti', min: 0, max: 200, step: 5, def: 90 },
      { key: 'ambientMotion', label: 'Ambient motion (clouds, bob, twinkle)', min: 0, max: 2, step: 0.05, def: 1 },
      { key: 'showHitAreas', label: 'Show hit areas (debug)', type: 'bool', def: false },
    ],
  },
];

export const TUNING_DEFAULTS = Object.freeze(
  Object.fromEntries(TUNING_SCHEMA.flatMap((g) => g.params.map((p) => [p.key, p.def]))),
);
