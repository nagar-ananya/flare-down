export type PortraitArt = 'shoulder-roll' | 'head-tilt' | 'arms-overhead';

export type BodyArt =
  | 'toe-reach'
  | 'side-bend'
  | 'standing-twist'
  | 'knees-to-chest'
  | 'lying-twist'
  | 'legs-up-wall'
  | 'lying-breath'
  | 'cat-cow'
  | 'low-lunge'
  | 'childs-pose'
  | 'walk'
  | 'walk-sun'
  | 'walk-timer';

export type MoveArt = PortraitArt | BodyArt;

// Angles are in degrees: 0 points down, 90 right, 180 up, -90 left.
// A limb is [upper, lower] or [upper, lower, foot].
export type Limb = readonly number[];

export interface BodyPose {
  x: number;
  y: number;
  torso: number;
  head: number;
  armA: Limb;
  armB: Limb;
  legA: Limb;
  legB: Limb;
  pelvis?: number;
  arch?: number;
  breath?: number;
  twist?: number;
}

export type SceneProp = 'ground' | 'moving-ground' | 'mat' | 'wall' | 'sun' | 'clock';

export interface BodyMove {
  view: 'side' | 'front';
  box?: string;
  frames: readonly (readonly [BodyPose, number])[];
  linear?: boolean;
  props?: readonly SceneProp[];
  breathAt?: { x: number; y: number };
  hint?: { d: string; heads: readonly (readonly [number, number, number, number])[] };
}

const STAND: BodyPose = {
  x: 130,
  y: 104,
  torso: 180,
  head: 180,
  armA: [8, 14],
  armB: [-6, 0],
  legA: [4, 0],
  legB: [-3, -3],
};

const TOE_REACH: BodyPose = {
  ...STAND,
  x: 122,
  y: 105,
  torso: 60,
  head: 40,
  armA: [-15, -45],
  armB: [-20, -50],
  legA: [10, 5],
  legB: [8, 3],
};

const FRONT: BodyPose = {
  ...STAND,
  armA: [-12, -8],
  armB: [12, 8],
  legA: [-4, -2],
  legB: [4, 2],
  pelvis: 180,
};

const BEND_LEFT: BodyPose = {
  ...FRONT,
  x: 134,
  torso: 200,
  head: 205,
  armA: [-6, -4],
  armB: [195, 210],
  legA: [-7, -6.5],
  legB: [-0.5, -0.5],
};

const BEND_RIGHT: BodyPose = {
  ...FRONT,
  x: 126,
  torso: 160,
  head: 155,
  armA: [-195, -210],
  armB: [6, 4],
  legA: [0.5, 0.5],
  legB: [7, 6.5],
};

const TWIST_RIGHT: BodyPose = { ...FRONT, twist: 35, armA: [40, 75], armB: [50, 35] };
const TWIST_LEFT: BodyPose = { ...FRONT, twist: -35, armA: [-50, -35], armB: [-40, -75] };

const LIE: BodyPose = {
  x: 150,
  y: 160,
  torso: -90,
  head: -90,
  armA: [120, 60],
  armB: [116, 64],
  legA: [90, 90],
  legB: [90, 90],
};

const KNEES_UP: BodyPose = { ...LIE, armA: [92, 92], armB: [88, 88], legA: [135, 10], legB: [131, 7] };
const HUG: BodyPose = { ...LIE, head: -100, armA: [125, 110], armB: [130, 112], legA: [212, 95], legB: [208, 92] };

const TOP: BodyPose = {
  ...LIE,
  y: 95,
  armA: [0, 0],
  armB: [180, 180],
  legA: [40, -25],
  legB: [48, -18],
};

const WALL: BodyPose = { ...LIE, x: 185, legA: [180, 180], legB: [178, 178] };

const TABLE: BodyPose = {
  x: 100,
  y: 131,
  torso: 98,
  head: 100,
  armA: [30, 34],
  armB: [26, 32],
  legA: [0, -90, -90],
  legB: [-4, -92, -92],
};

const LUNGE_LOW: BodyPose = {
  x: 116,
  y: 134,
  torso: 175,
  head: 178,
  armA: [28, 34],
  armB: [24, 30],
  legA: [86, 0],
  legB: [-25, -90, -90],
};

const LUNGE_REACH: BodyPose = {
  ...LUNGE_LOW,
  x: 119,
  y: 136,
  torso: 186,
  head: 190,
  armA: [176, 182],
  armB: [172, 178],
  legA: [88, -2],
  legB: [-27, -90, -90],
};

const CHILD: BodyPose = {
  x: 100,
  y: 150,
  torso: 85,
  head: 70,
  armA: [70, 86],
  armB: [74, 88],
  legA: [63, -90, -90],
  legB: [60, -92, -92],
};

const STEP_A: BodyPose = {
  ...STAND,
  y: 106,
  torso: 178,
  armA: [-22, -12],
  armB: [22, 40],
  legA: [25, 12],
  legB: [-22, -35],
};
const PASS_A: BodyPose = { ...STAND, y: 103, torso: 178, armA: [0, 6], armB: [0, 6], legA: [0, -2], legB: [14, -42] };
const STEP_B: BodyPose = { ...STEP_A, armA: STEP_A.armB, armB: STEP_A.armA, legA: STEP_A.legB, legB: STEP_A.legA };
const PASS_B: BodyPose = { ...PASS_A, legA: PASS_A.legB, legB: PASS_A.legA };

const FLOOR_BOX = '45 50 190 132';

const WALK_FRAMES = [
  [STEP_A, 0.32],
  [PASS_A, 0.32],
  [STEP_B, 0.32],
  [PASS_B, 0.32],
] as const;

export const BODY_MOVES: Record<BodyArt, BodyMove> = {
  'toe-reach': {
    view: 'side',
    props: ['ground'],
    frames: [
      [STAND, 0.8],
      [TOE_REACH, 1.8],
      [TOE_REACH, 1.4],
      [STAND, 1.8],
    ],
  },
  'side-bend': {
    view: 'front',
    props: ['ground'],
    frames: [
      [FRONT, 0.6],
      [BEND_LEFT, 1.6],
      [BEND_LEFT, 1.2],
      [FRONT, 1.4],
      [BEND_RIGHT, 1.6],
      [BEND_RIGHT, 1.2],
      [FRONT, 1.4],
    ],
  },
  'standing-twist': {
    view: 'front',
    props: ['ground'],
    hint: {
      d: 'M 100 114 Q 130 136 160 114',
      heads: [
        [100, 114, -6, -5],
        [160, 114, 6, -5],
      ],
    },
    frames: [
      [TWIST_RIGHT, 1.3],
      [TWIST_RIGHT, 0.4],
      [TWIST_LEFT, 1.3],
      [TWIST_LEFT, 0.4],
    ],
  },
  'knees-to-chest': {
    view: 'side',
    box: FLOOR_BOX,
    props: ['ground'],
    frames: [
      [KNEES_UP, 0.8],
      [HUG, 1.6],
      [HUG, 1.4],
      [KNEES_UP, 1.6],
    ],
  },
  'lying-twist': {
    view: 'front',
    props: ['mat'],
    hint: {
      d: 'M 202 66 Q 224 95 202 124',
      heads: [
        [202, 66, -5, -6],
        [202, 124, -5, 6],
      ],
    },
    frames: [
      [TOP, 1.8],
      [TOP, 1.2],
      [{ ...TOP, legA: [140, 205], legB: [132, 198] }, 1.8],
      [{ ...TOP, legA: [140, 205], legB: [132, 198] }, 1.2],
    ],
  },
  'legs-up-wall': {
    view: 'side',
    box: FLOOR_BOX,
    props: ['ground', 'wall'],
    breathAt: { x: 160, y: 124 },
    frames: [
      [WALL, 2.4],
      [{ ...WALL, breath: 1 }, 2.4],
    ],
  },
  'lying-breath': {
    view: 'side',
    box: FLOOR_BOX,
    props: ['ground'],
    breathAt: { x: 128, y: 122 },
    frames: [
      [LIE, 3.2],
      [{ ...LIE, breath: 1 }, 3.2],
    ],
  },
  'cat-cow': {
    view: 'side',
    box: '30 50 190 132',
    props: ['ground'],
    hint: {
      d: 'M 121 80 L 121 100',
      heads: [
        [121, 80, 0, -6],
        [121, 100, 0, 6],
      ],
    },
    frames: [
      [{ ...TABLE, arch: -6, head: 165 }, 1.6],
      [{ ...TABLE, arch: -6, head: 165 }, 0.8],
      [{ ...TABLE, arch: 12, head: 55 }, 1.8],
      [{ ...TABLE, arch: 12, head: 55 }, 0.8],
    ],
  },
  'low-lunge': {
    view: 'side',
    props: ['ground'],
    frames: [
      [LUNGE_LOW, 1.0],
      [LUNGE_REACH, 1.8],
      [LUNGE_REACH, 1.6],
      [LUNGE_LOW, 1.8],
    ],
  },
  'childs-pose': {
    view: 'side',
    box: '40 50 190 132',
    props: ['ground'],
    breathAt: { x: 116, y: 116 },
    frames: [
      [CHILD, 2.6],
      [{ ...CHILD, arch: 6, breath: 1 }, 2.6],
    ],
  },
  walk: { view: 'side', props: ['moving-ground'], linear: true, frames: WALK_FRAMES },
  'walk-sun': { view: 'side', props: ['moving-ground', 'sun'], linear: true, frames: WALK_FRAMES },
  'walk-timer': { view: 'side', props: ['moving-ground', 'clock'], linear: true, frames: WALK_FRAMES },
};
