import lantern from './lantern.js';
import nests from './nests.js';
import sort from './sort.js';
import bridge from './bridge.js';
import power from './power.js';
import cleanup from './cleanup.js';
import seed from './seed.js';
import empathy from './empathy.js';
import chime from './chime.js';
import tower from './tower.js';
import backpack from './backpack.js';
import feelings from './feelings.js';
import bots from './bots.js';

/**
 * Scene scripts: the per-level reactions on top of the shared drag engine.
 * Everything generic (drag, snap, wrong, help, meter) lives in the engine;
 * scenes only add the story beat for that level.
 */
export const SCENES = { lantern, nests, sort, bridge, power, cleanup, seed, empathy, chime, tower, backpack, feelings, bots };
