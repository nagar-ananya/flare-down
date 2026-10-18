import React from 'react';
import Svg, { Circle, Defs, Ellipse, G, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import type { BodyMove, BodyPose, Limb, SceneProp } from '../constants/moves';
import { useTheme } from '../hooks/useTheme';
import type { Palette } from '../theme';
import {
  FrontHead,
  FrontShoe,
  HAIR,
  Hand,
  SKIN,
  SKIN_TONES,
  Segment,
  Shaded,
  SideHead,
  SideShoe,
  arrowHead,
  ease,
  isBlinking,
  shade,
  type Point,
  type Tones,
} from './move-art';

const GROUND_Y = 171;
const WALK_SPEED = 79;

interface Look {
  skin: Tones;
  sleeve: Tones;
  pants: Tones;
}

function along(from: Point, angle: number, length: number): Point {
  const r = (angle * Math.PI) / 180;
  return { x: from.x + Math.sin(r) * length, y: from.y + Math.cos(r) * length };
}

function path(...points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

function mix(a: BodyPose, b: BodyPose, k: number): BodyPose {
  const n = (p = 0, q = 0): number => p + (q - p) * k;
  const limb = (p: Limb, q: Limb): Limb => p.map((v, i) => n(v, q[i] ?? v));
  return {
    x: n(a.x, b.x),
    y: n(a.y, b.y),
    torso: n(a.torso, b.torso),
    head: n(a.head, b.head),
    armA: limb(a.armA, b.armA),
    armB: limb(a.armB, b.armB),
    legA: limb(a.legA, b.legA),
    legB: limb(a.legB, b.legB),
    pelvis: n(a.pelvis ?? a.torso, b.pelvis ?? b.torso),
    arch: n(a.arch, b.arch),
    breath: n(a.breath, b.breath),
    twist: n(a.twist, b.twist),
  };
}

// Each frame says how long it takes to get to that pose from the one before.
export function poseAt(move: BodyMove, seconds: number): BodyPose {
  const { frames } = move;
  const cycle = frames.reduce((sum, [, duration]) => sum + duration, 0);
  let t = seconds % cycle;
  for (let i = 0; i < frames.length; i++) {
    const [pose, duration] = frames[i];
    if (t < duration) {
      const from = frames[(i + frames.length - 1) % frames.length][0];
      const k = t / duration;
      return mix(from, pose, move.linear ? k : ease(k));
    }
    t -= duration;
  }
  return frames[0][0];
}

function Arm({
  id,
  from,
  limb,
  look,
  mirror,
}: {
  id: string;
  from: Point;
  limb: Limb;
  look: Look;
  mirror: boolean;
}): React.ReactElement {
  const elbow = along(from, limb[0], 26);
  const wrist = along(elbow, limb[1], 23);
  const cuff = along(from, limb[0], 11);
  const hem = along({ x: 0, y: 0 }, limb[0] + 90, 5.7);
  return (
    <G>
      <Segment id={`${id}u`} a={from} b={elbow} wa={10} wb={8.5} colors={look.skin} />
      <Segment id={`${id}l`} a={elbow} b={wrist} wa={8.5} wb={6.6} colors={look.skin} />
      <Hand at={wrist} toward={along(wrist, limb[1], 1)} mirror={mirror} size={0.68} colors={look.skin} />
      <Segment id={`${id}s`} a={from} b={cuff} wa={12.5} wb={11.5} colors={look.sleeve} />
      <Line
        x1={cuff.x - hem.x}
        y1={cuff.y - hem.y}
        x2={cuff.x + hem.x}
        y2={cuff.y + hem.y}
        stroke={shade(look.sleeve[2], -0.3)}
        strokeOpacity={0.7}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </G>
  );
}

function Leg({
  id,
  from,
  knee,
  ankle,
  foot,
  side,
  look,
}: {
  id: string;
  from: Point;
  knee: Point;
  ankle: Point;
  foot: number;
  side: boolean;
  look: Look;
}): React.ReactElement {
  const shin = (Math.atan2(ankle.x - knee.x, ankle.y - knee.y) * 180) / Math.PI;
  return (
    <G>
      <G
        transform={
          side
            ? `translate(${ankle.x} ${ankle.y}) rotate(${90 - foot}) scale(0.78)`
            : `translate(${ankle.x} ${ankle.y}) rotate(${-shin}) scale(0.8)`
        }
      >
        {side ? <SideShoe /> : <FrontShoe />}
      </G>
      <Segment id={`${id}u`} a={from} b={knee} wa={14} wb={12} colors={look.pants} />
      <Segment id={`${id}l`} a={knee} b={ankle} wa={12} wb={10} colors={look.pants} />
    </G>
  );
}

function SideTorso({ hip, pose, look }: { hip: Point; pose: BodyPose; look: Look }): React.ReactElement {
  const p0 = along(hip, pose.torso, 8);
  const p1 = along(hip, pose.torso, 42);
  const c = along(along(hip, pose.torso, 25), pose.torso + 90, pose.arch ?? 0);
  const breath = pose.breath ?? 0;
  const front: Point[] = [];
  const back: Point[] = [];
  let mid = { at: p0, normal: { x: 1, y: 0 } };
  let topWidth = 10.5;
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const u = 1 - t;
    const p = {
      x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
      y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
    };
    const dx = 2 * u * (c.x - p0.x) + 2 * t * (p1.x - c.x);
    const dy = 2 * u * (c.y - p0.y) + 2 * t * (p1.y - c.y);
    const len = Math.hypot(dx, dy) || 1;
    const f = { x: -dy / len, y: dx / len };
    const wf = 10.5 + 2.2 * t + 1.8 * breath * Math.sin(Math.PI * t);
    front.push({ x: p.x + f.x * wf, y: p.y + f.y * wf });
    back.push({ x: p.x - f.x * 10.5, y: p.y - f.y * 10.5 });
    if (i === 5) mid = { at: p, normal: f };
    topWidth = wf;
  }
  const r = (topWidth + 10.5) / 2;
  const d =
    `${path(...front)} A ${r} ${r} 0 0 0 ${back[10].x} ${back[10].y} ` +
    `${back
      .slice(0, 10)
      .reverse()
      .map((p) => `L ${p.x} ${p.y}`)
      .join(' ')} Z`;
  return (
    <>
      <Shaded id="torso" d={d} at={mid.at} normal={mid.normal} width={12} colors={look.sleeve} />
      <Line
        x1={front[0].x}
        y1={front[0].y}
        x2={back[0].x}
        y2={back[0].y}
        stroke={shade(look.sleeve[2], -0.3)}
        strokeOpacity={0.7}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </>
  );
}

function FrontTorso({
  hip,
  pose,
  spread,
  look,
}: {
  hip: Point;
  pose: BodyPose;
  spread: number;
  look: Look;
}): React.ReactElement {
  const at = (h: number, w: number): Point => along(along(hip, pose.torso, h), pose.torso + (w < 0 ? 90 : -90), Math.abs(w));
  const p = (h: number, w: number): string => {
    const q = at(h, w);
    return `${q.x} ${q.y}`;
  };
  const d =
    `M ${p(46, -7.5)} Q ${p(46, -(spread - 4))} ${p(43.5, -(spread + 1.5))} L ${p(31, -(spread - 3))} ` +
    `Q ${p(18, -(spread - 2))} ${p(6, -12.5)} L ${p(6, 12.5)} Q ${p(18, spread - 2)} ${p(31, spread - 3)} ` +
    `L ${p(43.5, spread + 1.5)} Q ${p(46, spread - 4)} ${p(46, 7.5)} Q ${p(41, 0)} ${p(46, -7.5)} Z`;
  const dark = shade(look.sleeve[2], -0.3);
  return (
    <>
      <Shaded id="torso" d={d} at={at(25, 0)} normal={along({ x: 0, y: 0 }, pose.torso - 90, 1)} width={18} colors={look.sleeve} />
      <Path d={`M ${p(46, -7.5)} Q ${p(41, 0)} ${p(46, 7.5)}`} stroke={dark} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <Path d={`M ${p(6, -12.5)} L ${p(6, 12.5)}`} stroke={dark} strokeOpacity={0.7} strokeWidth={1.8} strokeLinecap="round" />
      <G stroke={dark} strokeOpacity={0.35} strokeWidth={1.2} strokeLinecap="round" fill="none">
        <Path d={`M ${p(27, -(spread - 6))} Q ${p(20, -(spread - 9))} ${p(12, -(spread - 7))}`} />
        <Path d={`M ${p(27, spread - 6)} Q ${p(20, spread - 9)} ${p(12, spread - 7)}`} />
      </G>
    </>
  );
}

function FrontPants({ hip, angle, look }: { hip: Point; angle: number; look: Look }): React.ReactElement {
  const p = (h: number, w: number): string => {
    const q = along(along(hip, angle, h), angle + (w < 0 ? 90 : -90), Math.abs(w));
    return `${q.x} ${q.y}`;
  };
  const d =
    `M ${p(8, -13)} L ${p(8, 13)} Q ${p(3, 14.8)} ${p(-5, 15)} L ${p(-7, 3)} ` +
    `Q ${p(-9, 0)} ${p(-7, -3)} L ${p(-5, -15)} Q ${p(3, -14.8)} ${p(8, -13)} Z`;
  return <Shaded id="pelvis" d={d} at={hip} normal={along({ x: 0, y: 0 }, angle - 90, 1)} width={15} colors={look.pants} />;
}

function Scene({ prop, seconds, palette }: { prop: SceneProp; seconds: number; palette: Palette }): React.ReactElement {
  const ground = (
    <>
      <Rect x={-60} y={GROUND_Y} width={380} height={40} fill={palette.blue} fillOpacity={0.16} />
      <Line x1={-60} y1={GROUND_Y} x2={320} y2={GROUND_Y} stroke={palette.blue} strokeOpacity={0.22} strokeWidth={1} />
    </>
  );
  switch (prop) {
    case 'mat':
      return (
        <G>
          <Rect x={42} y={18} width={196} height={154} rx={12} fill={palette.blue} fillOpacity={0.16} />
          <Rect x={48} y={24} width={184} height={142} rx={8} fill="none" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={1.2} />
        </G>
      );
    case 'wall':
      return (
        <G>
          <Rect x={193} y={-20} width={90} height={GROUND_Y + 20} fill="#FFFFFF" fillOpacity={0.5} />
          <Rect x={193} y={-20} width={4} height={GROUND_Y + 20} fill={palette.blue} fillOpacity={0.22} />
          <Rect x={193} y={GROUND_Y - 7} width={90} height={7} fill={palette.blue} fillOpacity={0.25} />
        </G>
      );
    case 'sun':
      return (
        <G transform={`translate(40 38) rotate(${seconds * 25})`}>
          <Circle r={20} fill={palette.bandElevatedFill} fillOpacity={0.18} />
          {Array.from({ length: 8 }, (_, i) => {
            const a = along({ x: 0, y: 0 }, i * 45, 16);
            const b = along({ x: 0, y: 0 }, i * 45, 22);
            return (
              <Line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={palette.bandElevatedFill}
                strokeWidth={3}
                strokeLinecap="round"
              />
            );
          })}
          <Circle r={11.5} fill={palette.bandElevatedFill} />
          <Circle cx={-3.5} cy={-3.5} r={5} fill="#FFFFFF" fillOpacity={0.3} />
        </G>
      );
    case 'clock':
      return (
        <G transform={`translate(222 40) rotate(${8 * Math.sin(seconds * 20)})`}>
          <Path d="M -9 15 L -12 19 M 9 15 L 12 19" stroke={HAIR} strokeWidth={2.4} strokeLinecap="round" />
          <Circle cx={-9.5} cy={-11.5} r={5.5} fill={palette.bandElevatedFill} stroke={HAIR} strokeWidth={1.6} />
          <Circle cx={9.5} cy={-11.5} r={5.5} fill={palette.bandElevatedFill} stroke={HAIR} strokeWidth={1.6} />
          <Circle r={14.5} fill="#FFFFFF" stroke={palette.primary} strokeWidth={3} />
          <Path d="M 0 -8 L 0 0 L 6 0" stroke={HAIR} strokeWidth={2} strokeLinecap="round" fill="none" />
          <Circle r={1.6} fill={HAIR} />
        </G>
      );
    case 'moving-ground':
      return (
        <G>
          {ground}
          {Array.from({ length: 10 }, (_, i) => {
            const x = ((((i * 40 - seconds * WALK_SPEED) % 400) + 400) % 400) - 70;
            return (
              <Rect key={i} x={x} y={GROUND_Y + 4} width={16} height={3.5} rx={1.75} fill={palette.blue} fillOpacity={0.3} />
            );
          })}
        </G>
      );
    default:
      return ground;
  }
}

export function BodyFigure({
  move,
  seconds,
  height,
}: {
  move: BodyMove;
  seconds: number;
  height: number;
}): React.ReactElement {
  const { palette } = useTheme();
  const pose = poseAt(move, seconds);
  const side = move.view === 'side';
  const blink = isBlinking(seconds);

  const near: Look = {
    skin: SKIN_TONES,
    sleeve: [shade(palette.primary, 0.16), palette.primary, palette.primaryDeep],
    pants: [shade(palette.blue, 0.18), palette.blue, shade(palette.blue, -0.28)],
  };
  const far: Look = side
    ? {
        skin: [shade(SKIN, 0.04), shade(SKIN, -0.1), shade(SKIN, -0.24)],
        sleeve: [palette.primary, palette.primaryDeep, shade(palette.primaryDeep, -0.2)],
        pants: [shade(palette.blue, -0.08), shade(palette.blue, -0.24), shade(palette.blue, -0.4)],
      }
    : near;

  const hip = { x: pose.x, y: pose.y };
  const chest = along(hip, pose.torso, 44);
  const neck = along(hip, pose.torso, 50);
  const headAt = along(neck, pose.head, side ? 15 : 17);
  const spread = side ? 0 : 17 * Math.cos(((pose.twist ?? 0) * Math.PI) / 180);
  const shoulders = side ? chest : along(hip, pose.torso, 40);
  const shoulderA = along(shoulders, pose.torso + 90, spread);
  const shoulderB = along(shoulders, pose.torso - 90, spread);
  const pelvis = pose.pelvis ?? pose.torso;
  const hipA = side ? hip : along(hip, pelvis + 90, 9);
  const hipB = side ? hip : along(hip, pelvis - 90, 9);
  const breath = pose.breath ?? 0;

  const legs = [
    { id: 'legA', from: hipA, limb: pose.legA, look: near },
    { id: 'legB', from: hipB, limb: pose.legB, look: far },
  ].map((leg) => {
    const knee = along(leg.from, leg.limb[0], 33);
    const ankle = along(knee, leg.limb[1], 31);
    return { ...leg, knee, ankle, foot: leg.limb[2] ?? leg.limb[1] + 90 };
  });
  const [legA, legB] = legs.map((leg) => (
    <Leg
      key={leg.id}
      id={leg.id}
      from={leg.from}
      knee={leg.knee}
      ankle={leg.ankle}
      foot={leg.foot}
      side={side}
      look={leg.look}
    />
  ));
  const armA = <Arm id="armA" from={shoulderA} limb={pose.armA} look={near} mirror={false} />;
  const armB = <Arm id="armB" from={shoulderB} limb={pose.armB} look={far} mirror={!side} />;

  const grounded = move.props?.some((prop) => prop === 'ground' || prop === 'moving-ground' || prop === 'wall');
  const low = [hip, chest, headAt, ...legs.flatMap((leg) => [leg.knee, leg.ankle])].filter(
    (p) => p.y > GROUND_Y - 26,
  );
  const shadow =
    grounded && low.length > 0
      ? { min: Math.min(...low.map((p) => p.x)), max: Math.max(...low.map((p) => p.x)) }
      : null;
  const center = { x: (hip.x + chest.x) / 2, y: (hip.y + chest.y) / 2 };

  return (
    <Svg width="100%" height={height} viewBox={move.box ?? '0 0 260 180'}>
      <Defs>
        <RadialGradient id="halo" cx={center.x} cy={center.y} r={95} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.6} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={center.x} cy={center.y} r={95} fill="url(#halo)" />
      {move.props?.map((prop) => <Scene key={prop} prop={prop} seconds={seconds} palette={palette} />)}
      {shadow ? (
        <Ellipse
          cx={(shadow.min + shadow.max) / 2}
          cy={GROUND_Y + 1.5}
          rx={(shadow.max - shadow.min) / 2 + 12}
          ry={3.4}
          fill="#1B3A52"
          fillOpacity={0.13}
        />
      ) : null}

      {side ? (
        <>
          {legB}
          {armB}
          {legA}
          <Shaded
            id="pelvis"
            d={`M ${hip.x - 11} ${hip.y} A 11 11 0 1 0 ${hip.x + 11} ${hip.y} A 11 11 0 1 0 ${hip.x - 11} ${hip.y} Z`}
            at={hip}
            normal={{ x: 1, y: 1 }}
            width={12}
            colors={near.pants}
          />
        </>
      ) : (
        <>
          {legA}
          {legB}
          <FrontPants hip={hip} angle={pelvis} look={near} />
        </>
      )}
      <Segment id="neck" a={chest} b={headAt} wa={side ? 8.5 : 9.5} wb={side ? 8 : 9} />
      {side ? <SideTorso hip={hip} pose={pose} look={near} /> : <FrontTorso hip={hip} pose={pose} spread={spread} look={near} />}
      {side ? (
        armA
      ) : (
        <>
          {armA}
          {armB}
        </>
      )}
      <G
        transform={
          side
            ? `translate(${headAt.x} ${headAt.y}) rotate(${180 - pose.head}) scale(0.6)`
            : `translate(${headAt.x} ${headAt.y}) rotate(${180 - pose.head}) scale(0.6) translate(-100 -64)`
        }
      >
        {side ? <SideHead blink={blink} /> : <FrontHead blink={blink} />}
      </G>
      {move.hint ? (
        <G stroke={palette.blue} strokeWidth={2.5} strokeLinecap="round" fill="none">
          <Path d={move.hint.d} />
          {move.hint.heads.map(([x, y, dx, dy]) => (
            <Path key={`${x},${y}`} d={arrowHead(x, y, dx, dy)} />
          ))}
        </G>
      ) : null}
      {move.breathAt ? (
        <Circle
          cx={move.breathAt.x}
          cy={move.breathAt.y}
          r={6 + 10 * breath}
          fill={palette.blue}
          fillOpacity={0.18}
          stroke={palette.blue}
          strokeOpacity={0.5}
          strokeWidth={2}
        />
      ) : null}
    </Svg>
  );
}
