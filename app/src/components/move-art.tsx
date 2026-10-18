import React from 'react';
import { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';

export const SKIN = '#E8B38E';
export const HAIR = '#3A2A22';

export type Tones = readonly [string, string, string];

export interface Point {
  x: number;
  y: number;
}

export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `#${[16, 8, 0]
    .map((shift) => {
      const c = (n >> shift) & 255;
      const v = Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount));
      return v.toString(16).padStart(2, '0');
    })
    .join('')}`;
}

export function tones(base: string, light = 0.18, dark = -0.18): Tones {
  return [shade(base, light), base, shade(base, dark)];
}

export const SKIN_TONES: Tones = [shade(SKIN, 0.22), SKIN, shade(SKIN, -0.14)];

export function ease(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
}

export function isBlinking(seconds: number): boolean {
  return seconds % 3.8 > 3.66;
}

export function arrowHead(x: number, y: number, dx: number, dy: number, size = 5): string {
  const length = Math.hypot(dx, dy);
  const ux = dx / length;
  const uy = dy / length;
  const wing = (angle: number): string => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return `${x - size * (ux * c - uy * s)} ${y - size * (ux * s + uy * c)}`;
  };
  return `M ${wing(0.6)} L ${x} ${y} L ${wing(-0.6)}`;
}

// A limb segment that narrows from wa to wb, with rounded ends.
export function capsule(a: Point, b: Point, wa: number, wb: number): string {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const nx = -(b.y - a.y) / len;
  const ny = (b.x - a.x) / len;
  const ra = wa / 2;
  const rb = wb / 2;
  return (
    `M ${a.x + nx * ra} ${a.y + ny * ra} L ${b.x + nx * rb} ${b.y + ny * rb} ` +
    `A ${rb} ${rb} 0 0 0 ${b.x - nx * rb} ${b.y - ny * rb} L ${a.x - nx * ra} ${a.y - ny * ra} ` +
    `A ${ra} ${ra} 0 0 0 ${a.x + nx * ra} ${a.y + ny * ra} Z`
  );
}

// Fills a shape light to dark across `normal`, as if lit from the upper left.
export function Shaded({
  id,
  d,
  at,
  normal,
  width,
  colors,
}: {
  id: string;
  d: string;
  at: Point;
  normal: Point;
  width: number;
  colors: Tones;
}): React.ReactElement {
  const len = Math.hypot(normal.x, normal.y) || 1;
  const flip = normal.x + normal.y < 0 ? -1 : 1;
  const nx = (normal.x / len) * flip;
  const ny = (normal.y / len) * flip;
  return (
    <>
      <Defs>
        <LinearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1={at.x - nx * width}
          y1={at.y - ny * width}
          x2={at.x + nx * width}
          y2={at.y + ny * width}
        >
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="0.5" stopColor={colors[1]} />
          <Stop offset="1" stopColor={colors[2]} />
        </LinearGradient>
      </Defs>
      <Path d={d} fill={`url(#${id})`} />
    </>
  );
}

export function Segment({
  id,
  a,
  b,
  wa,
  wb,
  colors = SKIN_TONES,
}: {
  id: string;
  a: Point;
  b: Point;
  wa: number;
  wb: number;
  colors?: Tones;
}): React.ReactElement {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return (
    <Shaded
      id={id}
      d={capsule(a, b, wa, wb)}
      at={{ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }}
      normal={{ x: -(b.y - a.y) / len, y: (b.x - a.x) / len }}
      width={(wa + wb) / 4}
      colors={colors}
    />
  );
}

export function Hand({
  at,
  toward,
  mirror,
  size = 1,
  colors = SKIN_TONES,
}: {
  at: Point;
  toward: Point;
  mirror: boolean;
  size?: number;
  colors?: Tones;
}): React.ReactElement {
  const angle = (Math.atan2(-(toward.x - at.x), toward.y - at.y) * 180) / Math.PI;
  return (
    <G transform={`translate(${at.x} ${at.y}) rotate(${angle}) scale(${mirror ? -size : size} ${size})`}>
      <Path d="M 3.6 1.5 C 7.6 3 8.6 7.4 6.6 9.2 C 5.4 10.2 4 9 3.8 7.2 Z" fill={colors[2]} />
      <Path
        d="M -4.6 -1 C -5.8 5 -5.2 11 -2.3 13.6 C 0.2 15.6 3.7 14.4 4.8 10.6 C 5.8 7 5.4 2.5 4.6 -1 Z"
        fill={colors[1]}
      />
      <Path d="M -1.4 9.5 L -1.1 13 M 1.4 9.5 L 1.7 12.8" stroke={colors[2]} strokeWidth={0.8} strokeLinecap="round" />
    </G>
  );
}

// Drawn around (100, 64), the size used by the close-up figure.
export function FrontHead({ blink }: { blink: boolean }): React.ReactElement {
  const lid = blink ? 0.35 : 2.6;
  return (
    <>
      <Ellipse cx={80.8} cy={66} rx={3.6} ry={5.6} fill={SKIN_TONES[2]} />
      <Ellipse cx={119.2} cy={66} rx={3.6} ry={5.6} fill={SKIN_TONES[2]} />
      <G stroke={shade(SKIN, -0.28)} strokeWidth={1} strokeLinecap="round" fill="none">
        <Path d="M 80.4 63.4 Q 78.9 66 80.6 68.8" />
        <Path d="M 119.6 63.4 Q 121.1 66 119.4 68.8" />
      </G>
      <Path
        d="M 81 64 C 81 49 89 42 100 42 C 111 42 119 49 119 64 C 119 79 111 89 100 89 C 89 89 81 79 81 64 Z"
        fill={SKIN}
      />
      <Circle cx={88} cy={72.5} r={3.6} fill="#F2876F" fillOpacity={0.3} />
      <Circle cx={112} cy={72.5} r={3.6} fill="#F2876F" fillOpacity={0.3} />
      <G stroke={HAIR} strokeWidth={1.7} strokeLinecap="round" fill="none">
        <Path d="M 88.5 58.5 Q 92 56.5 95.5 58.3" />
        <Path d="M 104.5 58.3 Q 108 56.5 111.5 58.5" />
      </G>
      <Ellipse cx={92} cy={64.5} rx={2.1} ry={lid} fill={HAIR} />
      <Ellipse cx={108} cy={64.5} rx={2.1} ry={lid} fill={HAIR} />
      {blink ? null : (
        <>
          <Circle cx={92.7} cy={63.6} r={0.7} fill="#FFFFFF" />
          <Circle cx={108.7} cy={63.6} r={0.7} fill="#FFFFFF" />
        </>
      )}
      <Path d="M 98.4 71 Q 100 72.8 101.8 71" stroke={shade(SKIN, -0.22)} strokeWidth={1.4} strokeLinecap="round" fill="none" />
      <Path d="M 95.5 78 Q 100 81.8 104.5 78" stroke="#8A3F2E" strokeWidth={1.7} strokeLinecap="round" fill="none" />
      <Path
        d="M 79.5 62 C 77 45 87 35 101 35.5 C 114 36 123 45 120.5 62 C 119 55 116.5 50.5 112 48.5 C 106 52.5 95 53.5 86.5 50 C 83 53 80.5 57 79.5 62 Z"
        fill={HAIR}
      />
      <Path
        d="M 93 39.6 Q 99 37.4 105.5 38.6"
        stroke={shade(HAIR, 0.22)}
        strokeOpacity={0.7}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

// A face in profile looking toward +x, drawn around (0, 0) at the same size as FrontHead.
export function SideHead({ blink }: { blink: boolean }): React.ReactElement {
  return (
    <>
      <Path
        d={
          'M 0 -23 C 11 -23 19 -16 19.5 -6 C 19.7 -3 20.5 -1 22.5 3 C 23 4.5 21.5 5.5 20 5.6 ' +
          'C 20.3 8 20.2 10 19.4 12 C 19 15.5 17 18.5 13.5 20 C 9 22 3 22 -1 20 ' +
          'C -12 17 -19 9 -19.5 -1 C -20 -14 -12 -23 0 -23 Z'
        }
        fill={SKIN}
      />
      <Circle cx={11} cy={6} r={3.6} fill="#F2876F" fillOpacity={0.3} />
      <Path
        d="M -20.5 2 C -23 -15 -12 -27 2 -26 C 13 -25.5 21 -18 20.5 -9 C 16 -13.5 10 -15 4 -13.5 C 0 -12 -3 -8 -5 -3 C -8 -1 -11 2 -13 6 C -16 7 -19 6 -20.5 2 Z"
        fill={HAIR}
      />
      <Path
        d="M -9 -21 Q -1 -24.5 7 -22.5"
        stroke={shade(HAIR, 0.22)}
        strokeOpacity={0.7}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
      <Ellipse cx={-6} cy={1} rx={3.6} ry={5.4} fill={SKIN_TONES[2]} />
      <Path d="M -6.6 -2 Q -8.2 1 -6.4 4" stroke={shade(SKIN, -0.28)} strokeWidth={1} strokeLinecap="round" fill="none" />
      <Path d="M 9 -8.5 Q 12.5 -10.2 16 -8.6" stroke={HAIR} strokeWidth={1.7} strokeLinecap="round" fill="none" />
      <Ellipse cx={12.5} cy={-3} rx={1.8} ry={blink ? 0.35 : 2.4} fill={HAIR} />
      {blink ? null : <Circle cx={13.1} cy={-3.8} r={0.6} fill="#FFFFFF" />}
      <Path d="M 16 11.2 Q 17.6 12 19 11" stroke="#8A3F2E" strokeWidth={1.6} strokeLinecap="round" fill="none" />
    </>
  );
}

// A shoe seen from the side: the origin is the ankle, +x points to the toe and +y to the sole.
export function SideShoe(): React.ReactElement {
  return (
    <>
      <Path
        d="M -4 -3.5 C 1 -5.5 8 -4.5 12.5 -1 C 15 0.8 15 4 12.5 4.5 L -4 4.5 C -6.5 4.5 -6.5 -2.5 -4 -3.5 Z"
        fill={HAIR}
      />
      <Path d="M -4.5 4.6 L 13 4.6" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1.4} strokeLinecap="round" />
    </>
  );
}

// A shoe seen from the front: the origin is the ankle and +y points down the leg.
export function FrontShoe(): React.ReactElement {
  return (
    <>
      <Ellipse cx={0} cy={4} rx={6.5} ry={4.2} fill={HAIR} />
      <Path d="M -5.5 7.4 Q 0 9.2 5.5 7.4" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={1.2} strokeLinecap="round" fill="none" />
    </>
  );
}
