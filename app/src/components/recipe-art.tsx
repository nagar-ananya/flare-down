import React from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '../hooks/useTheme';
import { Segment, Shaded, shade, tones, type Point, type Tones } from './move-art';

const WOOD: Tones = ['#EED8C1', '#E3C4A3', '#D2AC86'];
const CERAMIC: Tones = ['#FFFFFF', '#F4EFE9', '#DCD4CA'];
const STEEL: Tones = ['#F2F4F6', '#C9CFD5', '#9AA3AC'];
const GREEN = '#3F7D34';

function scatter(seed: number, count: number, cx: number, cy: number, rx: number, ry: number): Point[] {
  let s = seed;
  const rand = (): number => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  return Array.from({ length: count }, () => {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand());
    return { x: cx + Math.cos(a) * rx * r, y: cy + Math.sin(a) * ry * r };
  });
}

function Specks({ seed, count, cx, cy, rx, ry, color, r = 0.8 }: {
  seed: number;
  count: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  color: string;
  r?: number;
}): React.ReactElement {
  return (
    <G>
      {scatter(seed, count, cx, cy, rx, ry).map((p, i) => (
        <Ellipse key={i} cx={p.x} cy={p.y} rx={r * 1.3} ry={r} fill={color} />
      ))}
    </G>
  );
}

function Shadow({ cx, cy, rx, ry = 7 }: { cx: number; cy: number; rx: number; ry?: number }): React.ReactElement {
  return <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#5A3A22" fillOpacity={0.16} />;
}

function Backdrop({ wall }: { wall: string }): React.ReactElement {
  return (
    <>
      <Defs>
        <LinearGradient id="table" x1={0} y1={0} x2={0} y2={1}>
          <Stop offset="0" stopColor={WOOD[0]} />
          <Stop offset="1" stopColor={WOOD[2]} />
        </LinearGradient>
        <RadialGradient id="glow" cx={130} cy={70} r={120} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.7} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={-60} y={-60} width={380} height={300} fill={wall} />
      <Rect x={-60} y={-60} width={380} height={300} fill="url(#glow)" />
      <Rect x={-60} y={108} width={380} height={140} fill="url(#table)" />
      <Path d="M -60 108 L 320 108" stroke="#B88D66" strokeOpacity={0.45} strokeWidth={1.2} />
      <G stroke="#B88D66" strokeOpacity={0.18} strokeWidth={1} fill="none">
        <Path d="M -60 128 Q 60 124 140 129 T 320 126" />
        <Path d="M -60 152 Q 80 148 170 153 T 320 150" />
        <Path d="M -60 172 Q 50 169 130 173 T 320 171" />
      </G>
    </>
  );
}

function Bowl({
  cx,
  cy,
  rx,
  ry,
  depth,
  outside,
  children,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  depth: number;
  outside: Tones;
  children: React.ReactNode;
}): React.ReactElement {
  const body =
    `M ${cx - rx} ${cy} C ${cx - rx} ${cy + depth * 0.75} ${cx - rx * 0.45} ${cy + depth} ${cx} ${cy + depth} ` +
    `C ${cx + rx * 0.45} ${cy + depth} ${cx + rx} ${cy + depth * 0.75} ${cx + rx} ${cy} ` +
    `A ${rx} ${ry} 0 0 0 ${cx - rx} ${cy} Z`;
  return (
    <G>
      <Shadow cx={cx} cy={cy + depth + 2} rx={rx * 0.8} />
      <Ellipse cx={cx} cy={cy + depth - 2} rx={rx * 0.36} ry={5} fill={outside[2]} />
      <Shaded id={`bowl${cx}`} d={body} at={{ x: cx, y: cy }} normal={{ x: 1, y: 0 }} width={rx} colors={outside} />
      <Ellipse cx={cx} cy={cy} rx={rx - 2} ry={ry - 1.5} fill={CERAMIC[2]} />
      <Ellipse cx={cx} cy={cy + 1.5} rx={rx - 3} ry={ry - 2.5} fill={CERAMIC[1]} />
      {children}
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={CERAMIC[0]} strokeWidth={3} />
      <Path
        d={`M ${cx - rx * 0.78} ${cy + depth * 0.3} Q ${cx - rx * 0.7} ${cy + depth * 0.7} ${cx - rx * 0.35} ${cy + depth * 0.86}`}
        stroke="#FFFFFF"
        strokeOpacity={0.35}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}

function Surface({ id, cx, cy, rx, ry, colors }: {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  colors: Tones;
}): React.ReactElement {
  return (
    <>
      <Defs>
        <RadialGradient id={id} cx={cx - rx * 0.25} cy={cy - ry * 0.3} r={rx} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="0.6" stopColor={colors[1]} />
          <Stop offset="1" stopColor={colors[2]} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id})`} />
    </>
  );
}

function Plate({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }): React.ReactElement {
  return (
    <G>
      <Shadow cx={cx} cy={cy + 7} rx={rx * 0.95} ry={ry * 0.75} />
      <Ellipse cx={cx} cy={cy + 3} rx={rx} ry={ry} fill={CERAMIC[2]} />
      <Surface id={`plate${cx}`} cx={cx} cy={cy} rx={rx} ry={ry} colors={CERAMIC} />
      <Ellipse cx={cx} cy={cy + 1} rx={rx * 0.74} ry={ry * 0.72} fill="none" stroke={CERAMIC[2]} strokeWidth={1.4} />
    </G>
  );
}

function Spoon({ from, to }: { from: Point; to: Point }): React.ReactElement {
  const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  return (
    <G>
      <Segment id={`spoon${from.x}`} a={from} b={to} wa={4} wb={5.5} colors={STEEL} />
      <Ellipse
        cx={from.x}
        cy={from.y}
        rx={9}
        ry={6}
        fill={STEEL[1]}
        stroke={STEEL[2]}
        strokeWidth={0.8}
        transform={`rotate(${angle} ${from.x} ${from.y})`}
      />
      <Ellipse cx={from.x - 2} cy={from.y - 1.5} rx={4} ry={2} fill="#FFFFFF" fillOpacity={0.6} />
    </G>
  );
}

function Blueberry({ x, y, r = 4.6 }: { x: number; y: number; r?: number }): React.ReactElement {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill="#34407F" />
      <Circle cx={x + r * 0.2} cy={y + r * 0.2} r={r * 0.8} fill="#28306A" />
      <Circle cx={x - r * 0.35} cy={y - r * 0.4} r={r * 0.32} fill="#FFFFFF" fillOpacity={0.35} />
      <Path
        d={`M ${x + r * 0.1} ${y - r * 0.55} l ${r * 0.3} ${r * 0.3} M ${x + r * 0.4} ${y - r * 0.55} l ${-r * 0.3} ${r * 0.3}`}
        stroke="#161B40"
        strokeWidth={0.9}
        strokeLinecap="round"
      />
    </G>
  );
}

function Raspberry({ x, y, r = 5.5 }: { x: number; y: number; r?: number }): React.ReactElement {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill="#B8243F" />
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return <Circle key={i} cx={x + Math.cos(a) * r * 0.55} cy={y + Math.sin(a) * r * 0.55} r={r * 0.38} fill="#D7385A" />;
      })}
      <Circle cx={x} cy={y} r={r * 0.38} fill="#DE4766" />
      <Circle cx={x - r * 0.4} cy={y - r * 0.45} r={r * 0.22} fill="#FFFFFF" fillOpacity={0.45} />
    </G>
  );
}

function Leaf({ x, y, angle, size = 1, color = GREEN }: {
  x: number;
  y: number;
  angle: number;
  size?: number;
  color?: string;
}): React.ReactElement {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle}) scale(${size})`}>
      <Path d="M 0 0 C 6 -9 18 -9 24 0 C 18 8 6 8 0 0 Z" fill={color} />
      <Path d="M 0 0 C 6 -9 18 -9 24 0 Z" fill="#FFFFFF" fillOpacity={0.12} />
      <Path d="M 1 0 Q 12 -1 22 0" stroke={shade(color, 0.45)} strokeWidth={0.9} fill="none" />
    </G>
  );
}

function Walnut({ x, y, angle = 0 }: { x: number; y: number; angle?: number }): React.ReactElement {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Path d="M -7 0 C -7 -6 -2 -6 0 -4 C 2 -6 7 -6 7 0 C 7 5 2 6 0 4 C -2 6 -7 5 -7 0 Z" fill="#A87641" />
      <Path d="M -4 -2 Q -2 0 -4 2 M 4 -2 Q 2 0 4 2 M 0 -3.5 L 0 3.5" stroke="#6E4825" strokeWidth={0.9} fill="none" />
    </G>
  );
}

function PearSlice({ x, y, angle }: { x: number; y: number; angle: number }): React.ReactElement {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Path d="M 0 0 C 4 -5 6 -14 13 -16 C 20 -17 25 -10 24 -3 C 23 4 12 6 0 0 Z" fill="#C8BE52" />
      <Path d="M 2 -0.6 C 6 -5 8 -12.5 13.5 -14 C 19 -15 22.5 -9.5 21.8 -3.5 C 21 2 11.5 4 2 -0.6 Z" fill="#F5EDCB" />
      <Ellipse cx={16} cy={-7} rx={1.5} ry={2.3} fill="#5A3B22" transform="rotate(30 16 -7)" />
    </G>
  );
}

function Chickpea({ x, y, r = 4.4 }: { x: number; y: number; r?: number }): React.ReactElement {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill="#D9AE6C" />
      <Circle cx={x - r * 0.15} cy={y - r * 0.15} r={r * 0.82} fill="#E8C48A" />
      <Path d={`M ${x - r * 0.1} ${y - r * 0.8} Q ${x + r * 0.5} ${y} ${x - r * 0.1} ${y + r * 0.7}`} stroke="#B98A4C" strokeWidth={0.7} fill="none" />
      <Circle cx={x - r * 0.4} cy={y - r * 0.4} r={r * 0.25} fill="#FFFFFF" fillOpacity={0.5} />
    </G>
  );
}

function Cucumber({ x, y, angle = 0 }: { x: number; y: number; angle?: number }): React.ReactElement {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Ellipse rx={8} ry={5} fill="#3F7A35" />
      <Ellipse rx={6.8} ry={4} fill="#CFE6A6" />
      <Ellipse rx={3.6} ry={2} fill="#E4F0C4" />
      {[-2, 0, 2].map((dx) => (
        <Ellipse key={dx} cx={dx} cy={dx === 0 ? -0.8 : 0.6} rx={0.7} ry={0.45} fill="#A9C67A" />
      ))}
    </G>
  );
}

function Tomato({ x, y, r = 5.2, half = false }: { x: number; y: number; r?: number; half?: boolean }): React.ReactElement {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill="#D63B26" />
      {half ? (
        <>
          <Circle cx={x} cy={y} r={r * 0.78} fill="#EE6A4E" />
          <Path d={`M ${x} ${y - r * 0.7} L ${x} ${y + r * 0.7} M ${x - r * 0.6} ${y} L ${x + r * 0.6} ${y}`} stroke="#F7A78E" strokeWidth={0.9} />
          {[-1, 1].map((sx) => (
            <Circle key={sx} cx={x + sx * r * 0.35} cy={y + r * 0.3} r={0.8} fill="#F6D58A" />
          ))}
        </>
      ) : (
        <>
          <Circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.3} fill="#FFFFFF" fillOpacity={0.45} />
          <Path d={`M ${x - 2.5} ${y - r + 0.5} L ${x} ${y - r + 2} L ${x + 2.5} ${y - r + 0.5} M ${x} ${y - r + 2} L ${x} ${y - r - 1}`} stroke="#3F7D34" strokeWidth={1.2} strokeLinecap="round" />
        </>
      )}
    </G>
  );
}

function AvocadoSlice({ x, y, angle, size = 1 }: { x: number; y: number; angle: number; size?: number }): React.ReactElement {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle}) scale(${size})`}>
      <Path d="M -14 0 C -8 -11 8 -11 14 0 C 8 1 -8 1 -14 0 Z" fill="#3E6B2A" />
      <Path d="M -12.4 -0.8 C -7 -9.4 7 -9.4 12.4 -0.8 C 7 -0.2 -7 -0.2 -12.4 -0.8 Z" fill="#B9D162" />
      <Path d="M -10 -1.6 C -5 -5 5 -5 10 -1.6 C 5 -0.8 -5 -0.8 -10 -1.6 Z" fill="#DDE89A" />
    </G>
  );
}

function Broccoli({ x, y, size = 1 }: { x: number; y: number; size?: number }): React.ReactElement {
  return (
    <G transform={`translate(${x} ${y}) scale(${size})`}>
      <Path d="M -3 2 L -2.4 11 Q 0 13 2.4 11 L 3 2 Z" fill="#9BC46A" />
      {[
        [-6, -1, 5],
        [5.5, -1, 5],
        [-2.5, -6, 5.5],
        [3, -6.5, 5],
        [0, -2, 5.5],
      ].map(([cx, cy, r], i) => (
        <Circle key={i} cx={cx} cy={cy} r={r} fill={i % 2 === 0 ? '#3C7A32' : '#4A8A3B'} />
      ))}
      <Circle cx={-3.5} cy={-7.5} r={2} fill="#7DB35A" fillOpacity={0.7} />
      <Circle cx={4} cy={-3} r={1.6} fill="#7DB35A" fillOpacity={0.6} />
    </G>
  );
}

function Carrot({ x, y, r = 4.6 }: { x: number; y: number; r?: number }): React.ReactElement {
  return (
    <G>
      <Ellipse cx={x} cy={y + 0.8} rx={r} ry={r * 0.7} fill="#C9601C" />
      <Ellipse cx={x} cy={y} rx={r} ry={r * 0.7} fill="#F08A2E" />
      <Ellipse cx={x} cy={y} rx={r * 0.5} ry={r * 0.35} fill="#F6A85A" />
    </G>
  );
}

function SweetPotato({ x, y, angle = 0, size = 1 }: { x: number; y: number; angle?: number; size?: number }): React.ReactElement {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle}) scale(${size})`}>
      <Rect x={-5.5} y={-3.5} width={11} height={10} rx={2.6} fill="#C5601F" />
      <Rect x={-5.5} y={-5.5} width={11} height={7} rx={2.6} fill="#F0913F" />
      <Path d="M -4 -4 L 3 -4" stroke="#F8C08A" strokeWidth={1.2} strokeLinecap="round" />
    </G>
  );
}

function Bean({ x, y, angle = 0 }: { x: number; y: number; angle?: number }): React.ReactElement {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Ellipse rx={3.4} ry={2.2} fill="#2A2230" />
      <Ellipse cx={-1} cy={-0.8} rx={1.2} ry={0.6} fill="#FFFFFF" fillOpacity={0.35} />
    </G>
  );
}

function Citrus({ x, y, r = 9, color = '#F5D547', wedge = false, angle = 0 }: {
  x: number;
  y: number;
  r?: number;
  color?: string;
  wedge?: boolean;
  angle?: number;
}): React.ReactElement {
  const rind = shade(color, -0.2);
  if (wedge) {
    return (
      <G transform={`translate(${x} ${y}) rotate(${angle})`}>
        <Path d={`M ${-r} 0 A ${r} ${r * 0.8} 0 0 0 ${r} 0 Z`} fill={rind} />
        <Path d={`M ${-r + 1.5} 0 A ${r - 1.5} ${r * 0.8 - 1.5} 0 0 0 ${r - 1.5} 0 Z`} fill={shade(color, 0.35)} />
        <Path d={`M 0 0 L ${-r * 0.5} ${r * 0.55} M 0 0 L 0 ${r * 0.7} M 0 0 L ${r * 0.5} ${r * 0.55}`} stroke={shade(color, 0.6)} strokeWidth={0.8} />
        <Path d={`M ${-r} 0 L ${r} 0`} stroke={rind} strokeWidth={1.6} strokeLinecap="round" />
      </G>
    );
  }
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Ellipse rx={r} ry={r * 0.62} fill={rind} />
      <Ellipse rx={r - 1.4} ry={r * 0.62 - 1.2} fill={shade(color, 0.35)} />
      {Array.from({ length: 4 }, (_, i) => {
        const a = (i / 4) * Math.PI;
        return (
          <Path
            key={i}
            d={`M ${-Math.cos(a) * (r - 2)} ${-Math.sin(a) * (r * 0.62 - 2)} L ${Math.cos(a) * (r - 2)} ${Math.sin(a) * (r * 0.62 - 2)}`}
            stroke={shade(color, 0.65)}
            strokeWidth={0.8}
          />
        );
      })}
    </G>
  );
}

function Salmon({ x, y, angle }: { x: number; y: number; angle: number }): React.ReactElement {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Path d="M -24 4 C -24 -8 -12 -12 4 -11 C 18 -10 26 -6 25 2 C 24 10 10 12 -4 11 C -16 10 -24 10 -24 4 Z" fill="#D9663F" />
      <Path d="M -22 2 C -22 -7 -11 -10 4 -9.5 C 17 -9 23.5 -5 23 1 C 22 7 10 9 -4 8.6 C -15 8 -22 7.5 -22 2 Z" fill="#F28D68" />
      <G stroke="#FBD3C1" strokeWidth={1.2} strokeLinecap="round" fill="none">
        <Path d="M -12 -8 Q -8 0 -12 8" />
        <Path d="M -3 -9 Q 1 0 -3 8.5" />
        <Path d="M 6 -9 Q 10 0 6 8.5" />
        <Path d="M 15 -7 Q 18 0 15 6" />
      </G>
      <Path d="M -20 -4 C -12 -9 8 -10 20 -5" stroke="#B9502C" strokeOpacity={0.5} strokeWidth={2} strokeLinecap="round" fill="none" />
    </G>
  );
}

function Chicken({ x, y, angle = 0 }: { x: number; y: number; angle?: number }): React.ReactElement {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Path d="M -8 1 C -9 -5 -3 -6 2 -5.5 C 7 -5 9 -2 8.5 2 C 8 5.5 2 6 -2 5.6 C -6 5.2 -7.6 4 -8 1 Z" fill="#C98F52" />
      <Path d="M -7 0.5 C -8 -4.2 -3 -5 2 -4.6 C 6.4 -4.2 8 -1.6 7.4 1.6 C 6.8 4.4 2 4.8 -2 4.4 C -5.4 4 -6.6 3 -7 0.5 Z" fill="#E7BD84" />
      <Path d="M -4 -3 L -1 3 M 1 -3.6 L 4 2.6" stroke="#B57A3F" strokeOpacity={0.55} strokeWidth={1.1} strokeLinecap="round" />
    </G>
  );
}

function PepperStrip({ x, y, angle, color }: { x: number; y: number; angle: number; color: string }): React.ReactElement {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Path d="M -10 0 Q 0 -6 10 0" stroke={shade(color, -0.25)} strokeWidth={4.6} strokeLinecap="round" fill="none" />
      <Path d="M -10 -0.6 Q 0 -6.6 10 -0.6" stroke={color} strokeWidth={3.4} strokeLinecap="round" fill="none" />
      <Path d="M -6 -3 Q 0 -5.6 5 -3.6" stroke="#FFFFFF" strokeOpacity={0.4} strokeWidth={1} strokeLinecap="round" fill="none" />
    </G>
  );
}

function Steam({ x, y }: { x: number; y: number }): React.ReactElement {
  return (
    <G stroke="#FFFFFF" strokeOpacity={0.75} strokeWidth={2.4} strokeLinecap="round" fill="none">
      {[-16, 0, 16].map((dx, i) => (
        <Path key={dx} d={`M ${x + dx} ${y - i * 2} q -6 -8 0 -15 q 6 -7 0 -15`} />
      ))}
    </G>
  );
}

function TurmericOats(): React.ReactElement {
  return (
    <>
      <G transform="translate(214 128)">
        <Shadow cx={0} cy={18} rx={16} ry={4} />
        <Path d="M 0 -16 C 8 -16 7 -4 11 2 C 15 9 10 18 0 18 C -10 18 -15 9 -11 2 C -7 -4 -8 -16 0 -16 Z" fill="#C2B647" />
        <Path d="M -4 -12 C -4 -6 -8 0 -8 6" stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={2.5} strokeLinecap="round" fill="none" />
        <Path d="M 0 -16 Q 1 -21 4 -23" stroke="#6B4A2A" strokeWidth={1.6} strokeLinecap="round" fill="none" />
        <Leaf x={2} y={-20} angle={-30} size={0.4} color="#5E9A3F" />
      </G>
      <Bowl cx={122} cy={98} rx={64} ry={21} depth={50} outside={tones('#2C6FA3', 0.25, -0.25)}>
        <Surface id="oats" cx={122} cy={101} rx={58} ry={17} colors={['#F7D477', '#E8B04A', '#C98E2C']} />
        <Specks seed={7} count={26} cx={122} cy={101} rx={52} ry={14} color="#F9E3A6" r={1.3} />
        <Specks seed={11} count={30} cx={118} cy={100} rx={40} ry={11} color="#6B4A2A" r={0.7} />
        <PearSlice x={132} y={102} angle={-30} />
        <PearSlice x={138} y={104} angle={-10} />
        <PearSlice x={144} y={106} angle={10} />
        <Walnut x={96} y={96} angle={-10} />
        <Walnut x={106} y={104} angle={20} />
        <Walnut x={89} y={104} angle={5} />
      </Bowl>
      <Spoon from={{ x: 160, y: 96 }} to={{ x: 200, y: 66 }} />
    </>
  );
}

function BerrySmoothie(): React.ReactElement {
  const glass = 'M 94 62 L 100 158 Q 120 166 140 158 L 146 62 Z';
  return (
    <>
      <Shadow cx={120} cy={161} rx={30} ry={6} />
      <Shaded
        id="smoothie"
        d="M 94.6 72 L 100 158 Q 120 166 140 158 L 145.4 72 Z"
        at={{ x: 120, y: 100 }}
        normal={{ x: 1, y: 0 }}
        width={26}
        colors={['#D75A8E', '#B23A6E', '#7E2350']}
      />
      <Ellipse cx={120} cy={72} rx={25.4} ry={6.5} fill="#E07AA5" />
      <Specks seed={5} count={18} cx={120} cy={72} rx={22} ry={5} color="#2B1B22" r={0.8} />
      <Path d={glass} fill="#FFFFFF" fillOpacity={0.12} stroke="#FFFFFF" strokeOpacity={0.8} strokeWidth={1.6} />
      <Path d="M 99 68 L 104 150" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={3.5} strokeLinecap="round" />
      <Ellipse cx={120} cy={62} rx={26} ry={7} fill="none" stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={1.6} />
      <G>
        <Segment id="straw" a={{ x: 128, y: 74 }} b={{ x: 145, y: 41 }} wa={6} wb={6} colors={['#FFFFFF', '#F6F1EC', '#DCD4CA']} />
        {[0.3, 0.6, 0.9].map((t) => (
          <Path
            key={t}
            d={`M ${128 + 17 * t - 3} ${74 - 33 * t - 1.4} L ${128 + 17 * t + 3} ${74 - 33 * t + 1.6}`}
            stroke="#B8461F"
            strokeWidth={3}
          />
        ))}
      </G>
      <Raspberry x={109} y={67} r={5} />
      <Blueberry x={119} y={69} r={4.2} />
      <Leaf x={100} y={68} angle={-60} size={0.6} />
      <Blueberry x={178} y={150} />
      <Blueberry x={188} y={156} r={4} />
      <Raspberry x={196} y={146} />
      <Leaf x={58} y={150} angle={-15} size={0.9} />
      <G>
        <Ellipse cx={78} cy={155} rx={9} ry={5} fill="#E9D79A" />
        <Ellipse cx={78} cy={154} rx={7.6} ry={4} fill="#FBF3D6" />
        <Ellipse cx={78} cy={154} rx={2} ry={1.2} fill="#E3CF8C" />
      </G>
    </>
  );
}

function AvocadoToast(): React.ReactElement {
  const slice = 'M -26 14 L -26 -6 C -34 -10 -30 -22 -18 -20 C -10 -27 10 -27 18 -20 C 30 -22 34 -10 26 -6 L 26 14 Q 0 18 -26 14 Z';
  const inner = 'M -22.5 11 L -22.5 -7 C -29 -10 -26 -18.5 -17 -16.6 C -9.5 -23 9.5 -23 17 -16.6 C 26 -18.5 29 -10 22.5 -7 L 22.5 11 Q 0 14.5 -22.5 11 Z';
  return (
    <>
      <Plate cx={128} cy={130} rx={98} ry={30} />
      {[
        { x: 92, y: 120, a: -10 },
        { x: 164, y: 122, a: 8 },
      ].map(({ x, y, a }, i) => (
        <G key={x} transform={`translate(${x} ${y}) rotate(${a}) scale(1.3 1.05)`}>
          <Path d={slice} fill="#A86A33" transform="translate(0 3)" />
          <Path d={slice} fill="#C88A4A" />
          <Path d={inner} fill="#EDCB92" />
          <Path d="M -21 -3 C -14 -14 14 -14 21 -3 C 22 4 14 9 0 9 C -14 9 -22 4 -21 -3 Z" fill="#9DBE4F" />
          <Specks seed={13 + i} count={14} cx={0} cy={-2} rx={17} ry={8} color="#6E9235" r={1.1} />
          <Specks seed={23 + i} count={10} cx={0} cy={-2} rx={17} ry={8} color="#2B2B2B" r={0.5} />
          {i === 1 ? (
            <>
              <Path d="M -15 -2 C -18 -12 -4 -16 6 -13 C 16 -11 18 -2 12 3 C 6 8 -12 7 -15 -2 Z" fill="#FFFFFF" />
              <Circle cx={0} cy={-4} r={6.5} fill="#F2A81D" />
              <Circle cx={-2} cy={-6} r={2.2} fill="#FFFFFF" fillOpacity={0.5} />
              <Specks seed={41} count={8} cx={0} cy={-2} rx={14} ry={7} color="#C8321E" r={0.8} />
            </>
          ) : (
            <>
              <Path d="M -16 2 C -18 -8 -6 -12 3 -10 C 12 -8 14 0 9 4 C 4 8 -13 9 -16 2 Z" fill="#FFFFFF" />
              <Circle cx={-2} cy={-2} r={6} fill="#F2A81D" />
              <Circle cx={-4} cy={-4} r={2} fill="#FFFFFF" fillOpacity={0.5} />
              <Specks seed={42} count={6} cx={-2} cy={-1} rx={13} ry={6} color="#C8321E" r={0.8} />
            </>
          )}
        </G>
      ))}
      <Citrus x={196} y={138} wedge angle={-15} />
    </>
  );
}

function ChickpeaBowl(): React.ReactElement {
  return (
    <>
      <Bowl cx={128} cy={98} rx={68} ry={22} depth={50} outside={tones('#E7DFD4', 0.4, -0.18)}>
        <Surface id="quinoa" cx={128} cy={101} rx={62} ry={18} colors={['#F2E7C6', '#E3D2A6', '#C9B482']} />
        <Specks seed={3} count={60} cx={128} cy={101} rx={58} ry={15} color="#B79C64" r={0.9} />
        {scatter(19, 13, 98, 99, 17, 7).map((p, i) => (
          <Chickpea key={i} x={p.x} y={p.y} r={5} />
        ))}
        <AvocadoSlice x={128} y={94} angle={-12} size={1.15} />
        <AvocadoSlice x={133} y={97} angle={0} size={1.15} />
        <AvocadoSlice x={138} y={100} angle={12} size={1.15} />
        {[
          [104, 109, -10],
          [120, 112, -4],
          [136, 112, 4],
          [151, 109, 10],
        ].map(([x, y, a]) => (
          <G key={x} transform={`translate(${x} ${y}) scale(1.2)`}>
            <Cucumber x={0} y={0} angle={a} />
          </G>
        ))}
        <Tomato x={160} y={95} r={6} half />
        <Tomato x={170} y={102} r={6} half />
        <Tomato x={158} y={103} r={5.6} />
        <Path d="M 96 92 Q 120 86 140 92 T 172 94" stroke="#E2D45A" strokeOpacity={0.6} strokeWidth={1.2} fill="none" />
      </Bowl>
      <Citrus x={212} y={146} wedge angle={10} />
      <Citrus x={50} y={150} r={10} />
    </>
  );
}

function LentilSoup(): React.ReactElement {
  return (
    <>
      <Steam x={124} y={74} />
      <Bowl cx={124} cy={98} rx={64} ry={21} depth={50} outside={tones('#FFFFFF', 0.2, -0.16)}>
        <Surface id="soup" cx={124} cy={101} rx={58} ry={17} colors={['#EBA157', '#D47C2F', '#A9581C']} />
        <Specks seed={17} count={40} cx={124} cy={101} rx={54} ry={14} color="#F2C27F" r={1.1} />
        <Specks seed={29} count={18} cx={124} cy={101} rx={50} ry={13} color="#7A3E14" r={0.7} />
        {[
          [106, 98],
          [140, 104],
          [124, 108],
          [150, 96],
        ].map(([x, y]) => (
          <Carrot key={x} x={x} y={y} />
        ))}
        <Leaf x={112} y={92} angle={-10} size={0.8} />
        <Leaf x={128} y={98} angle={15} size={0.7} color="#4A8A3B" />
      </Bowl>
      <Path d="M 66 106 Q 124 120 182 106" stroke="#2C6FA3" strokeOpacity={0.6} strokeWidth={3} fill="none" />
      <Spoon from={{ x: 206, y: 150 }} to={{ x: 242, y: 128 }} />
      <G>
        <Ellipse cx={52} cy={152} rx={14} ry={6} fill="#C8A36E" />
        <Ellipse cx={52} cy={150} rx={12} ry={4.6} fill="#E3C493" />
      </G>
    </>
  );
}

function BeanTacos(): React.ReactElement {
  return (
    <>
      <Plate cx={130} cy={134} rx={104} ry={30} />
      {[
        { x: 74, y: 126, a: -8 },
        { x: 186, y: 126, a: 8 },
        { x: 130, y: 118, a: 0 },
      ].map(({ x, y, a }, i) => (
        <G key={x} transform={`translate(${x} ${y}) rotate(${a}) scale(1.2)`}>
          <Path d="M -26 -4 C -26 -16 26 -16 26 -4 Z" fill="#D8B061" />
          <Path d="M -23 -6 C -18 -15 18 -15 23 -6 L 23 0 L -23 0 Z" fill="#F1E2B5" />
          <Path d="M -22 -6 C -14 -12 14 -12 22 -6 L 22 -2 L -22 -2 Z" fill="#6E9A3A" />
          {[-14, -4, 7, 16].map((dx, j) => (
            <SweetPotato key={dx} x={dx} y={-10 + (j % 2) * 2} angle={dx} size={0.7} />
          ))}
          {[-10, 0, 11, -18, 18].map((dx, j) => (
            <Bean key={dx} x={dx} y={-6 - (j % 2) * 3} angle={dx * 3} />
          ))}
          <AvocadoSlice x={2} y={-12} angle={-6} size={0.7} />
          <Specks seed={60 + i} count={7} cx={0} cy={-9} rx={18} ry={3} color="#D8432B" r={1.4} />
          <Path d="M -26 -4 C -26 14 26 14 26 -4 C 18 2 -18 2 -26 -4 Z" fill="#E7C47A" />
          <Path d="M -26 -4 C -18 2 18 2 26 -4" stroke="#C99B4E" strokeWidth={1.4} fill="none" />
          <Specks seed={70 + i} count={6} cx={0} cy={5} rx={18} ry={4} color="#C99B4E" r={1} />
        </G>
      ))}
      <Citrus x={42} y={146} wedge angle={-20} color="#9BCB3C" />
      <Citrus x={222} y={148} wedge angle={20} color="#9BCB3C" />
    </>
  );
}

function SalmonTray(): React.ReactElement {
  const outer = 'M 40 82 L 220 82 Q 230 82 232 92 L 244 152 Q 246 164 234 164 L 26 164 Q 14 164 16 152 L 28 92 Q 30 82 40 82 Z';
  const paper = 'M 44 88 L 216 88 Q 223 88 225 95 L 235 149 Q 236 157 228 157 L 32 157 Q 24 157 25 149 L 35 95 Q 37 88 44 88 Z';
  return (
    <>
      <Shadow cx={130} cy={166} rx={112} ry={6} />
      <Shaded id="tray" d={outer} at={{ x: 130, y: 120 }} normal={{ x: 1, y: 0.4 }} width={110} colors={STEEL} />
      <Path d={paper} fill="#F4EAD8" />
      <Path d="M 60 96 Q 90 92 120 97 M 150 150 Q 180 146 210 150" stroke="#E2D2B6" strokeWidth={1.2} fill="none" />
      <Salmon x={104} y={114} angle={-8} />
      <Salmon x={160} y={124} angle={10} />
      <Citrus x={104} y={107} r={7} angle={-8} />
      <Citrus x={162} y={117} r={7} angle={10} />
      <Broccoli x={64} y={104} />
      <Broccoli x={204} y={108} size={0.95} />
      <Broccoli x={78} y={142} size={0.9} />
      {[
        [56, 128, 10],
        [130, 146, -12],
        [190, 146, 20],
        [212, 132, -5],
        [140, 98, 15],
        [96, 146, 30],
      ].map(([x, y, a]) => (
        <SweetPotato key={`${x}${y}`} x={x} y={y} angle={a} />
      ))}
      <PepperStrip x={176} y={98} angle={20} color="#D9412B" />
      <PepperStrip x={58} y={146} angle={-25} color="#D9412B" />
      <PepperStrip x={122} y={136} angle={5} color="#F2C230" />
      <Specks seed={77} count={30} cx={130} cy={124} rx={95} ry={30} color="#3A2A22" r={0.6} />
    </>
  );
}

function ChickenStirFry(): React.ReactElement {
  return (
    <>
      <Plate cx={124} cy={130} rx={100} ry={31} />
      <G>
        <Path d="M 54 132 C 52 112 76 102 100 104 C 122 106 128 118 124 132 C 112 140 66 140 54 132 Z" fill="#CDB38C" />
        <Path d="M 57 130 C 56 114 78 106 100 107.5 C 119 109 125 119 121.5 130 C 110 137 68 137 57 130 Z" fill="#E6D3B2" />
        {scatter(31, 46, 90, 120, 30, 12).map((p, i) => (
          <Ellipse
            key={i}
            cx={p.x}
            cy={p.y}
            rx={1.8}
            ry={0.9}
            fill={i % 3 === 0 ? '#C9AE85' : '#F5EADA'}
            transform={`rotate(${(i * 37) % 180} ${p.x} ${p.y})`}
          />
        ))}
      </G>
      <Ellipse cx={160} cy={126} rx={46} ry={15} fill="#8A4E22" fillOpacity={0.35} />
      {[
        [142, 120, 10],
        [166, 128, -15],
        [184, 120, 30],
        [152, 132, 0],
      ].map(([x, y, a]) => (
        <Chicken key={`${x}${y}`} x={x} y={y} angle={a} />
      ))}
      <PepperStrip x={170} y={114} angle={-15} color="#D9412B" />
      <PepperStrip x={140} y={130} angle={25} color="#F2C230" />
      <PepperStrip x={192} y={132} angle={-35} color="#D9412B" />
      <Broccoli x={158} y={116} size={0.9} />
      <Broccoli x={200} y={124} size={0.8} />
      <Carrot x={176} y={134} />
      <Carrot x={134} y={122} r={4} />
      <Path d="M 140 112 Q 160 108 186 114" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1.4} fill="none" />
      <Segment id="stick1" a={{ x: 176, y: 92 }} b={{ x: 248, y: 150 }} wa={3.4} wb={4.6} colors={['#E9C48E', '#C99559', '#9C6C34']} />
      <Segment id="stick2" a={{ x: 186, y: 88 }} b={{ x: 252, y: 142 }} wa={3.4} wb={4.6} colors={['#E9C48E', '#C99559', '#9C6C34']} />
    </>
  );
}

const DISHES: Record<string, () => React.ReactElement> = {
  'turmeric-oat': TurmericOats,
  'berry-smoothie': BerrySmoothie,
  'avocado-egg-toast': AvocadoToast,
  'chickpea-bowl': ChickpeaBowl,
  'lentil-soup': LentilSoup,
  'bean-tacos': BeanTacos,
  'salmon-tray': SalmonTray,
  'chicken-stir-fry': ChickenStirFry,
};

export function hasRecipeArt(id: string): boolean {
  return id in DISHES;
}

export function RecipeArt({ id, height = 210 }: { id: string; height?: number }): React.ReactElement | null {
  const { palette } = useTheme();
  const Dish = DISHES[id];
  if (!Dish) return null;
  return (
    <Svg width="100%" height={height} viewBox="8 38 244 135">
      <Backdrop wall={palette.primarySoft} />
      <Dish />
    </Svg>
  );
}
