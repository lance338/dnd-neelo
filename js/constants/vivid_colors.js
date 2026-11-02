/**
 * VividColors stand-in. Mirrors lib/constants/colors.dart in the Flutter app.
 * Every color used by the prototype comes from here so the developer can map
 * each token 1:1 onto an existing VividColors value (or add a new one).
 */
export const VividColors = Object.freeze({
  // Brand
  primary900: '#2B2266',
  primary700: '#4A3B9C',
  primary500: '#6C5CE0',
  primary300: '#A99CF5',
  primary100: '#E4DFFF',
  primary50: '#F6F6FE',

  // UI surfaces
  white: '#FFFFFF',
  ink: '#2B2266',
  inkSoft: '#5E5690',
  panel: '#FFFDF7',
  panelEdge: '#E9DFC8',
  shadow: 'rgba(30, 18, 70, 0.28)',

  // Feedback
  success: '#4CD48A',
  successGlow: '#B8FFD6',
  hint: '#FFC94A',
  hintGlow: '#FFE9A8',
  gentleNo: '#FF9E7A',

  // Meter
  meterTrack: 'rgba(255,255,255,0.35)',
  meterFillA: '#FFD84A',
  meterFillB: '#FF9F3D',

  // World 1: Aetheris
  w1SkyNightTop: '#22357F',
  w1SkyNightMid: '#5B4B9A',
  w1SkyNightLow: '#E58FA8',
  w1SkyDawnTop: '#6FB6F0',
  w1SkyDawnLow: '#FFD3B0',
  w1Cloud: '#F4A6B8',
  w1CloudDeep: '#C990C9',
  w1CloudFar: '#8B74B8',
  w1Grass: '#9FD35C',
  w1GrassDark: '#7DB548',
  w1Path: '#86BF4E',
  w1Earth: '#C0563E',
  w1EarthDark: '#933A2C',
  w1Water: '#5BD5F5',
  w1Stone: '#4A3F6B',

  // Day scenes
  daySkyTop: '#8FD3F4',
  daySkyLow: '#D9F3FF',
  hillFar: '#A7DB8A',
  hillNear: '#7CC56A',
  treeLeaf: '#5FAF5A',
  treeLeafLight: '#A8D88A',
  trunk: '#8A5A3C',
  soil: '#8C5A3A',
  soilDark: '#6B4128',
  snow: '#F7F4F2',
  mountain: '#5E8F99',
  ground: '#E2DFCF',

  // Items
  sunCore: '#FFE45C',
  sunEdge: '#FFB13D',
  sunRay: '#FFC93C',
  lanternBody: '#4B3D73',
  lanternDark: '#33294F',
  lanternGlass: '#7D6E9E',
  flame: '#FF7B6B',
  flameCore: '#FFF4C2',
  core: '#FF6A3D',
  coreRing: '#E04A3A',
  coreBolt: '#FF9A7A',
  machine: '#566A72',
  machineLight: '#EEF6F7',
  machineMid: '#8EB3C2',
  field: '#8DE3F0',
  gemPink: '#FF8FC8',
  gemPinkDeep: '#E25AA2',
  gemLight: '#FFD6EC',
  chimeGold: '#FFCF5A',
  chimeGoldDeep: '#E2A23A',
  wood: '#C8784A',
  woodLight: '#F2B567',
  woodDark: '#8D4A2C',
  rope: '#E6C18A',

  // NPC palette (stand-ins for Luma, Ziya, Talon)
  lumaBody: '#F3A7C6',
  lumaWing: '#D9C7F5',
  ziyaBody: '#F7D4A8',
  ziyaBow: '#FF7FA8',
  talonFur: '#9C4F2E',
  talonMuzzle: '#E3B07F',
  beak: '#FFA53D',
  eyeWhite: '#FFFFFF',
  eyeDark: '#2B2140',
  cheek: '#FF9EB5',
});
