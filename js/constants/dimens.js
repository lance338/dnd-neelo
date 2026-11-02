/**
 * Dimens stand-in. Mirrors lib/constants/dimensions.dart.
 * World sizes are in LOGICAL units on a 1162 x 806 stage (the Neelo comic frame
 * size in Figma). The game scales the stage to fit the screen, so nothing here
 * is a raw screen pixel. In Flame these become fractions of the game size.
 */
export const Dimens = Object.freeze({
  stageWidth: 1162,
  stageHeight: 806,

  spacing_xs: 4,
  spacing_sm: 8,
  spacing_md: 16,
  spacing_lg: 24,
  spacing_xl: 40,

  radius_small: 10,
  radius_medium: 18,
  radius_large: 28,
  radius_pill: 999,

  // Touch: minimum grab radius around an item, generous for small fingers
  minTouchRadius: 64,

  // HUD
  meterWidth: 360,
  meterHeight: 26,
  hudTop: 26,
  guideSize: 132,
});
