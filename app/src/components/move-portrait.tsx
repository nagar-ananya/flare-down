import React from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import type { PortraitArt } from '../constants/moves';
import { useTheme } from '../hooks/useTheme';
import {
  FrontHead,
  Hand,
  SKIN,
  SKIN_TONES,
  Segment,
  arrowHead,
  capsule,
  ease,
  isBlinking,
  shade,
  type Point,
} from './move-art';

const NECK_X = 100;
const SHOULDER_Y = 114;
const SHOULDER_HALF = 34;
const UPPER_ARM = 34;
const FOREARM = 31;

interface Pose {
  headTilt: number;
  shoulderLift: number;
  shoulderOut: number;
  armRaise: number;
}

const REST: Pose = { headTilt: 0, shoulderLift: 0, shoulderOut: 0, armRaise: 0 };

export const PORTRAIT_POSES: Record<PortraitArt, (seconds: number) => Pose> = {
  'shoulder-roll': (s) => {
    const turn = s * Math.PI;
    return { ...REST, shoulderLift: 7 * (1 - Math.cos(turn)), shoulderOut: -4 * Math.sin(turn) };
  },
  'head-tilt': (s) => {
    const wave = Math.sin((2 * Math.PI * s) / 4.4);
    return { ...REST, headTilt: 20 * Math.sign(wave) * Math.abs(wave) ** 0.6 };
  },
  'arms-overhead': (s) => {
    const u = (s % 4.5) / 4.5;
    const up = u < 0.3 ? ease(u / 0.3) : u < 0.6 ? 1 : u < 0.9 ? 1 - ease((u - 0.6) / 0.3) : 0;
    return { ...REST, armRaise: 164 * up, shoulderLift: 4 * up };
  },
};

function Hints({ art, color }: { art: PortraitArt; color: string }): React.ReactElement | null {
  const stroke = { stroke: color, strokeWidth: 2.6, strokeLinecap: 'round' as const, fill: 'none' };
  if (art === 'shoulder-roll') {
    return (
      <G>
        {[
          { cx: 46, flip: 1 },
          { cx: 154, flip: -1 },
        ].map(({ cx, flip }) => (
          <G key={cx}>
            <Path d={`M ${cx + 10 * flip} 92 A 10 10 0 1 ${flip > 0 ? 1 : 0} ${cx} 82`} {...stroke} />
            <Path d={arrowHead(cx, 82, 5 * flip, 0)} {...stroke} />
          </G>
        ))}
      </G>
    );
  }
  if (art === 'head-tilt') {
    return (
      <G>
        <Path d="M 72 36 Q 100 12 128 36" {...stroke} />
        <Path d={arrowHead(72, 36, -6, 6)} {...stroke} />
        <Path d={arrowHead(128, 36, 6, 6)} {...stroke} />
      </G>
    );
  }
  return null;
}

export function Portrait({ art, seconds, height }: { art: PortraitArt; seconds: number; height: number }): React.ReactElement {
  const { palette } = useTheme();
  const pose = PORTRAIT_POSES[art](seconds);

  const lift = pose.shoulderLift;
  const left = { x: NECK_X - SHOULDER_HALF - pose.shoulderOut, y: SHOULDER_Y - lift };
  const right = { x: NECK_X + SHOULDER_HALF + pose.shoulderOut, y: SHOULDER_Y - lift };
  const collar = 101 - lift * 0.6;
  const upper = 8 + pose.armRaise;
  const fore = upper - 4 + 14 * (pose.armRaise / 164);
  const tilt = pose.headTilt;

  const arms = [left, right].map((joint, i) => {
    const side = i === 0 ? -1 : 1;
    const step = (from: Point, deg: number, length: number): Point => {
      const r = (deg * Math.PI) / 180;
      return { x: from.x + side * Math.sin(r) * length, y: from.y + Math.cos(r) * length };
    };
    const elbow = step(joint, upper, UPPER_ARM);
    const wrist = step(elbow, fore, FOREARM);
    const sleeveEnd = step(joint, upper, 15);
    const sleeveStart = joint;
    const len = Math.hypot(sleeveEnd.x - joint.x, sleeveEnd.y - joint.y) || 1;
    const hem = { nx: -(sleeveEnd.y - joint.y) / len, ny: (sleeveEnd.x - joint.x) / len };
    return { side, joint, elbow, wrist, sleeveStart, sleeveEnd, hem, hand: step(wrist, fore, 1) };
  });
  const [l, r] = arms.map((a) => a.joint);

  const shirt =
    `M 89 ${collar} ` +
    `C 80 ${collar + 1} ${l.x + 10} ${l.y - 9} ${l.x + 2} ${l.y - 8.5} ` +
    `L ${l.x + 6} ${l.y + 16} C ${l.x + 7} ${l.y + 40} 74 160 73 212 ` +
    `L 127 212 C 126 160 ${r.x - 7} ${r.y + 40} ${r.x - 6} ${r.y + 16} ` +
    `L ${r.x - 2} ${r.y - 8.5} C ${r.x - 10} ${r.y - 9} 120 ${collar + 1} 111 ${collar} ` +
    `Q 100 ${collar + 8} 89 ${collar} Z`;

  return (
    <Svg width="100%" height={height} viewBox="30 14 140 176">
      <Defs>
        <RadialGradient id="halo" cx={100} cy={92} r={86} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.65} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="shirt" gradientUnits="userSpaceOnUse" x1={62} y1={0} x2={138} y2={0}>
          <Stop offset="0" stopColor={shade(palette.primary, 0.16)} />
          <Stop offset="0.45" stopColor={palette.primary} />
          <Stop offset="1" stopColor={palette.primaryDeep} />
        </LinearGradient>
      </Defs>

      <Circle cx={100} cy={92} r={86} fill="url(#halo)" />
      <Hints art={art} color={palette.blue} />

      <G transform={`rotate(${tilt * 0.35} 100 104)`}>
        <Path d="M 92.5 82 L 107.5 82 L 109.5 106 L 90.5 106 Z" fill={SKIN} />
        <Path d="M 92.5 84 Q 100 95 107.5 84 L 107.5 82 L 92.5 82 Z" fill={SKIN_TONES[2]} />
      </G>

      <Path d={shirt} fill="url(#shirt)" />

      {arms.map((arm, i) => (
        <G key={arm.side}>
          <Segment id={`upper${i}`} a={arm.joint} b={arm.elbow} wa={14} wb={12} />
          <Segment id={`fore${i}`} a={arm.elbow} b={arm.wrist} wa={11.5} wb={9} />
          <Hand at={arm.wrist} toward={arm.hand} mirror={arm.side > 0} />
          <Path d={capsule(arm.sleeveStart, arm.sleeveEnd, 19, 17)} fill="url(#shirt)" />
          <Path
            d={`M ${arm.sleeveEnd.x - arm.hem.nx * 7.5} ${arm.sleeveEnd.y - arm.hem.ny * 7.5} L ${
              arm.sleeveEnd.x + arm.hem.nx * 7.5
            } ${arm.sleeveEnd.y + arm.hem.ny * 7.5}`}
            stroke={shade(palette.primaryDeep, -0.3)}
            strokeOpacity={0.7}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        </G>
      ))}

      <Path
        d={`M 89 ${collar} Q 100 ${collar + 8} 111 ${collar}`}
        stroke={palette.primaryDeep}
        strokeWidth={3.2}
        strokeLinecap="round"
        fill="none"
      />
      <G stroke={palette.primaryDeep} strokeOpacity={0.5} strokeWidth={1.5} strokeLinecap="round" fill="none">
        <Path d={`M ${l.x + 11} ${l.y + 24} Q ${l.x + 16} ${l.y + 36} ${l.x + 13} ${l.y + 50}`} />
        <Path d={`M ${r.x - 11} ${r.y + 24} Q ${r.x - 16} ${r.y + 36} ${r.x - 13} ${r.y + 50}`} />
      </G>

      <G transform={`rotate(${tilt * 0.35} 100 104) rotate(${tilt * 0.65} 100 86)`}>
        <FrontHead blink={isBlinking(seconds)} />
      </G>
    </Svg>
  );
}
