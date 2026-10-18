import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import { useTheme } from '../hooks/useTheme';
import { rulebook } from '../logic/rulebook';
import { radius, severityWord, spacing, type Palette } from '../theme';
import { formatShort } from '../utils/dates';
import { PressableScale } from './motion';
import { Txt } from './primitives';

export interface TrendPoint {
  date: string;
  value: number | null;
}

const TREND_INSET = 7;

export function nearestIndex(x: number, width: number, count: number): number {
  if (count <= 1 || width <= 0) return 0;
  const step = width / (count - 1);
  return Math.min(count - 1, Math.max(0, Math.round(x / step)));
}

export function TrendChart({
  points,
  height = 96,
  max = 10,
  showDots = true,
  interactive = false,
  describe = (value: number) => `${value} (${severityWord(value)})`,
}: {
  points: readonly TrendPoint[];
  height?: number;
  max?: number;
  showDots?: boolean;
  interactive?: boolean;
  describe?: (value: number) => string;
}): React.ReactElement {
  const { palette } = useTheme();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const ink = palette.primary;

  const top = interactive ? 40 : 12;
  const bottom = height - 14;
  const inset = TREND_INSET;
  const plotWidth = Math.max(0, width - inset * 2);
  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const yFor = (value: number): number => bottom - (value / max) * (bottom - top);

  const widthRef = useRef(0);
  const countRef = useRef(points.length);
  countRef.current = points.length;
  const selectedRef = useRef<number | null>(null);

  const responder = useMemo(() => {
    const scrub = (x: number): void => {
      const index = nearestIndex(
        x - TREND_INSET,
        Math.max(0, widthRef.current - TREND_INSET * 2),
        countRef.current,
      );
      if (index !== selectedRef.current) {
        selectedRef.current = index;
        setSelected(index);
      }
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => interactive,
      onMoveShouldSetPanResponder: () => interactive,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => scrub(event.nativeEvent.locationX),
      onPanResponderMove: (event) => scrub(event.nativeEvent.locationX),
    });
  }, [interactive]);

  const signature = points.map((p) => `${p.date}:${p.value ?? ''}`).join('|');
  useEffect(() => {
    selectedRef.current = null;
    setSelected(null);
  }, [signature]);

  const { segments, areas, dots } = useMemo(() => {
    const segs: string[] = [];
    const ars: string[] = [];
    const ds: { x: number; y: number; last: boolean }[] = [];
    let line = '';
    let area = '';
    let startX = 0;

    points.forEach((point, index) => {
      const x = inset + index * step;
      if (point.value === null) {
        if (line) {
          segs.push(line);
          ars.push(`${area} L ${x - step} ${bottom} L ${startX} ${bottom} Z`);
        }
        line = '';
        area = '';
        return;
      }
      const y = yFor(point.value);
      if (!line) {
        line = `M ${x} ${y}`;
        area = `M ${x} ${y}`;
        startX = x;
      } else {
        line += ` L ${x} ${y}`;
        area += ` L ${x} ${y}`;
      }
      ds.push({ x, y, last: index === points.length - 1 });
    });

    if (line) {
      const endX = inset + (points.length - 1) * step;
      segs.push(line);
      ars.push(`${area} L ${endX} ${bottom} L ${startX} ${bottom} Z`);
    }
    return { segments: segs, areas: ars, dots: ds };
  }, [points, step, bottom, top, max, width]);

  const active = selected !== null && selected < points.length ? points[selected] : null;
  const activeX = selected !== null ? inset + selected * step : 0;
  const tooltipWidth = 132;
  const tooltipLeft = Math.min(Math.max(activeX - tooltipWidth / 2, 0), Math.max(width - tooltipWidth, 0));

  return (
    <View
      onLayout={(e) => {
        widthRef.current = e.nativeEvent.layout.width;
        setWidth(e.nativeEvent.layout.width);
      }}
      style={{ height }}
      {...(interactive ? responder.panHandlers : {})}
      accessibilityLabel={
        active
          ? `${formatShort(active.date)}: ${
              active.value === null ? 'no entry' : describe(active.value)
            }`
          : undefined
      }
    >
      {width > 0 ? (
        <Svg width={width} height={height} pointerEvents="none">
          <Line x1={0} y1={bottom} x2={width} y2={bottom} stroke={palette.border} strokeWidth={1} />

          {areas.map((d, i) => (
            <Path key={`a${i}`} d={d} fill={ink} fillOpacity={0.1} />
          ))}
          {segments.map((d, i) => (
            <Path
              key={`s${i}`}
              d={d}
              stroke={ink}
              strokeWidth={2.4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {showDots
            ? dots.map((dot, i) => (
                <Circle
                  key={`d${i}`}
                  cx={dot.x}
                  cy={dot.y}
                  r={dot.last ? 5.5 : 3.4}
                  fill={dot.last ? ink : palette.surface}
                  stroke={ink}
                  strokeWidth={dot.last ? 0 : 2}
                />
              ))
            : null}

          {active ? (
            <G>
              <Line
                x1={activeX}
                y1={top - 6}
                x2={activeX}
                y2={bottom}
                stroke={palette.borderStrong}
                strokeWidth={1.2}
                strokeDasharray="3 4"
              />
              {active.value !== null ? (
                <Circle
                  cx={activeX}
                  cy={yFor(active.value)}
                  r={6}
                  fill={palette.surface}
                  stroke={ink}
                  strokeWidth={2.6}
                />
              ) : null}
            </G>
          ) : null}
        </Svg>
      ) : null}

      {active ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: tooltipLeft,
            width: tooltipWidth,
            alignItems: 'center',
            backgroundColor: palette.surfaceAlt,
            borderRadius: radius.sm,
            paddingVertical: 4,
            paddingHorizontal: spacing.sm,
          }}
        >
          <Txt variant="caption" tone="faint">
            {formatShort(active.date)}
          </Txt>
          <Txt variant="label" style={{ color: active.value === null ? palette.textFaint : palette.text }}>
            {active.value === null ? 'No entry' : describe(active.value)}
          </Txt>
        </View>
      ) : interactive ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 6, right: 0 }}>
          <Txt variant="caption" tone="faint">
            Touch to read a day
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

export function DayRibbon({
  days,
  height = 34,
}: {
  days: readonly { date: string; logged: boolean }[];
  height?: number;
}): React.ReactElement {
  const { palette } = useTheme();
  const dot = Math.min(height, 18);
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', height }}
      accessibilityLabel={`${days.filter((d) => d.logged).length} of ${days.length} recent days logged`}
    >
      {days.map((day) => (
        <View key={day.date} style={{ flex: 1, alignItems: 'center' }}>
          <View
            style={{
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: day.logged ? palette.primary : 'transparent',
              borderWidth: day.logged ? 0 : 1.5,
              borderColor: palette.borderStrong,
            }}
          />
        </View>
      ))}
    </View>
  );
}

const WEEKDAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function severityColor(severity: number | null, palette: Palette): string {
  if (severity === null) return palette.surfaceAlt;
  const index = Math.min(palette.heat.length - 1, Math.floor((severity / 10) * palette.heat.length));
  return palette.heat[index];
}

export function MonthCalendar({
  month,
  severities,
  today,
  onSelect,
}: {
  month: string;
  severities: ReadonlyMap<string, number | null>;
  today: string;
  onSelect: (date: string) => void;
}): React.ReactElement {
  const { palette } = useTheme();
  const [y, m] = month.split('-').map(Number);
  const leading = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const length = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const prefix = `${y}-${String(m).padStart(2, '0')}-`;

  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length }, (_, i) => `${prefix}${String(i + 1).padStart(2, '0')}`),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {WEEKDAY_HEADERS.map((label, i) => (
          <Txt key={i} variant="caption" tone="faint" center style={{ flex: 1 }}>
            {label}
          </Txt>
        ))}
      </View>
      {weeks.map((week, w) => (
        <View key={w} style={{ flexDirection: 'row', gap: 6 }}>
          {week.map((date, i) => {
            if (!date) return <View key={i} style={{ flex: 1, aspectRatio: 1 }} />;
            const future = date > today;
            const severity = severities.get(date) ?? null;
            const isToday = date === today;
            return (
              <PressableScale
                key={date}
                onPress={() => onSelect(date)}
                disabled={future}
                accessibilityLabel={`${formatShort(date)}, ${
                  severity === null ? 'nothing logged' : `skin ${severity} of 10`
                }`}
                scaleTo={0.92}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor:
                    future || severity === null ? 'transparent' : severityColor(severity, palette),
                  borderWidth: isToday ? 2 : 0,
                  borderColor: palette.primary,
                  opacity: future ? 0.35 : 1,
                }}
              >
                <Txt
                  variant="label"
                  style={{ color: severity === null ? palette.textFaint : palette.text }}
                >
                  {Number(date.slice(8))}
                </Txt>
              </PressableScale>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function SeverityLegend({ style }: { style?: StyleProp<ViewStyle> }): React.ReactElement {
  const { palette } = useTheme();
  return (
    <View style={[{ gap: spacing.sm }, style]} accessibilityLabel="Colour scale from clear skin to most severe">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Txt variant="caption" tone="muted">
          0 Clear
        </Txt>
        <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
          {palette.heat.map((color) => (
            <View key={color} style={{ flex: 1, height: 14, borderRadius: 7, backgroundColor: color }} />
          ))}
        </View>
        <Txt variant="caption" tone="muted">
          10 Severe
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            borderWidth: 1.5,
            borderColor: palette.borderStrong,
          }}
        />
        <Txt variant="caption" tone="muted">
          Not logged
        </Txt>
      </View>
    </View>
  );
}

export function RuleChart({
  points,
  max,
  color,
  height = 220,
}: {
  points: readonly TrendPoint[];
  max: number;
  color: string;
  height?: number;
}): React.ReactElement {
  const { palette } = useTheme();
  const [width, setWidth] = useState(0);
  const axis = 34;
  const plotWidth = Math.max(0, width - axis - 7);
  const top = 12;
  const bottom = height - 26;
  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const yFor = (value: number): number => bottom - (Math.min(value, max) / max) * (bottom - top);

  const { segments, areas, last, dots } = useMemo(() => {
    const segs: string[] = [];
    const ars: string[] = [];
    const ds: { x: number; y: number }[] = [];
    let line = '';
    let startX = 0;
    let prevX = 0;
    let lastDot: { x: number; y: number } | null = null;
    const close = (): void => {
      if (!line) return;
      segs.push(line);
      ars.push(`${line} L ${prevX} ${bottom} L ${startX} ${bottom} Z`);
      line = '';
    };
    points.forEach((p, i) => {
      const x = axis + i * step;
      if (p.value === null) {
        close();
        return;
      }
      const y = yFor(p.value);
      if (!line) {
        line = `M ${x} ${y}`;
        startX = x;
      } else {
        line += ` L ${x} ${y}`;
      }
      prevX = x;
      lastDot = { x, y };
      ds.push({ x, y });
    });
    close();
    return { segments: segs, areas: ars, last: lastDot as { x: number; y: number } | null, dots: ds };
  }, [points, step, max, bottom]);

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Line x1={axis} y1={top} x2={width} y2={top} stroke={palette.borderStrong} strokeDasharray="5 5" />
          <Line x1={axis} y1={bottom} x2={width} y2={bottom} stroke={palette.border} />
          {areas.map((d, i) => (
            <Path key={`a${i}`} d={d} fill={color} fillOpacity={0.1} />
          ))}
          {segments.map((d, i) => (
            <Path
              key={`s${i}`}
              d={d}
              stroke={color}
              strokeWidth={2.6}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {dots.map((dot, i) => (
            <Circle key={`d${i}`} cx={dot.x} cy={dot.y} r={3} fill={palette.surface} stroke={color} strokeWidth={1.8} />
          ))}
          {last ? <Circle cx={last.x} cy={last.y} r={5.5} fill={color} /> : null}
        </Svg>
      ) : null}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: top - 8 }}>
        <Txt variant="caption" tone="faint">{`${max}`}</Txt>
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: bottom - 9 }}>
        <Txt variant="caption" tone="faint">0</Txt>
      </View>
      {points.length > 0 ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: axis, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-between' }}
        >
          <Txt variant="caption" tone="faint">{formatShort(points[0].date)}</Txt>
          <Txt variant="caption" tone="faint">Today</Txt>
        </View>
      ) : null}
    </View>
  );
}

export function BandScale({ score }: { score: number }): React.ReactElement {
  const { palette } = useTheme();
  const { elevated, high } = rulebook.bands;
  const at = Math.min(100, Math.max(0, score));
  return (
    <View style={{ marginTop: spacing.md }}>
      <View style={{ height: 22, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden' }}>
          <View style={{ width: `${elevated}%`, backgroundColor: palette.bandLowFill }} />
          <View style={{ width: `${high - elevated}%`, backgroundColor: palette.bandElevatedFill }} />
          <View style={{ flex: 1, backgroundColor: palette.bandHighFill }} />
        </View>
        {[elevated, high].map((edge) => (
          <View
            key={edge}
            style={{
              position: 'absolute',
              left: `${edge}%`,
              marginLeft: -2,
              top: 6,
              width: 4,
              height: 10,
              backgroundColor: palette.surface,
            }}
          />
        ))}
        <View
          style={{
            position: 'absolute',
            left: `${at}%`,
            marginLeft: -9,
            top: 2,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: palette.background,
            borderWidth: 3,
            borderColor: palette.text,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', marginTop: spacing.xs }}>
        <Txt variant="caption" style={{ width: `${elevated}%`, color: palette.bandLowText, fontWeight: '600' }}>
          Low
        </Txt>
        <Txt
          variant="caption"
          style={{ width: `${high - elevated}%`, color: palette.bandElevatedText, fontWeight: '600' }}
        >
          Elevated
        </Txt>
        <Txt variant="caption" style={{ flex: 1, color: palette.bandHighText, fontWeight: '600' }}>
          High
        </Txt>
      </View>
    </View>
  );
}
