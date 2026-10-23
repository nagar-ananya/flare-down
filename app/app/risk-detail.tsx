import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { BandScale } from '../src/components/charts';
import { ChevronRight } from '../src/components/icons';
import { PressableScale, Reveal } from '../src/components/motion';
import { Card, Kicker, NumberCircle, Pill, Screen, ShortDisclaimer, Txt } from '../src/components/primitives';
import { rulebook, useApp } from '../src/hooks/appState';
import { useTheme } from '../src/hooks/useTheme';
import { wholePointsById } from '../src/logic/engine';
import { bandStyle, spacing } from '../src/theme';

interface Row {
  id: string;
  label: string;
  points: number | null;
  max: number;
}

export default function RiskDetailScreen(): React.ReactElement {
  const { palette } = useTheme();
  const router = useRouter();
  const { risk } = useApp();

  if (risk.status !== 'ready') {
    return (
      <Screen edges={[]}>
        <Card>
          <Txt tone="muted">
            There is no score to explain yet. Keep logging daily check-ins and it will appear here.
          </Txt>
        </Card>
      </Screen>
    );
  }

  const style = bandStyle(risk.band, palette);
  const score = risk.score;

  const partById = wholePointsById(risk.rules, rulebook);
  const rows: Row[] = rulebook.rules.map((rule) => ({
    id: rule.id,
    label: rule.label,
    points: partById.get(rule.id) ?? null,
    max: rule.points,
  }));
  const total = [...partById.values()].reduce((t, v) => t + v, 0);

  return (
    <Screen edges={[]} contentStyle={{ paddingBottom: 100 }}>
      <Stack.Screen options={{ title: 'How your score adds up' }} />

      <Reveal>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Txt variant="hero" style={{ color: style.text }}>
              {score}
            </Txt>
            <View style={{ flex: 1 }}>
              <Txt variant="label">points today</Txt>
              <Pill label={style.label} color={style.text} background={style.soft} style={{ marginTop: 6 }} />
            </View>
          </View>

          <BandScale score={score} />

          <Txt tone="muted" style={{ marginTop: spacing.lg, lineHeight: 22 }}>
            {`FlareDown checks ${rulebook.rules.length} rules. Each one adds points. Add them up and you get your score.`}
          </Txt>
        </Card>
      </Reveal>

      <Reveal delay={60}>
        <Card style={{ marginTop: spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
            <Kicker>{`The ${rulebook.rules.length} rules`}</Kicker>
            <Kicker>Today / max</Kicker>
          </View>
          {rows.map((row, i) => (
            <RuleRow key={row.id} number={i + 1} row={row} />
          ))}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingTop: spacing.md,
              borderTopWidth: 2,
              borderTopColor: palette.borderStrong,
            }}
          >
            <Txt variant="heading" style={{ flex: 1 }}>
              Total
            </Txt>
            <Txt variant="heading" style={{ color: style.text }}>
              {total === score ? `${score}` : `${total} → ${score}`}
            </Txt>
          </View>
          {total !== score ? (
            <Txt variant="caption" tone="faint" style={{ textAlign: 'right', marginTop: 2 }}>
              {total > score ? 'The score tops out at 100' : 'The score never goes below 0'}
            </Txt>
          ) : null}
        </Card>

        <PressableScale
          onPress={() => router.navigate('/rules')}
          accessibilityLabel="What do these rules mean? Open Rules"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            marginTop: spacing.lg,
            paddingVertical: spacing.md,
          }}
        >
          <Txt variant="label" tone="accent">
            What do these rules mean? See Rules
          </Txt>
          <ChevronRight size={16} color={palette.primary} />
        </PressableScale>
      </Reveal>

      <ShortDisclaimer />
    </Screen>
  );
}

function RuleRow({ number, row }: { number: number; row: Row }): React.ReactElement {
  const { palette } = useTheme();
  const active = row.points !== null && row.points !== 0;
  const tint = !active
    ? palette.textFaint
    : (row.points ?? 0) > 0
      ? palette.bandHighText
      : palette.bandLowText;
  const signed = (n: number): string => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');
  const today = row.points === null ? '—' : signed(row.points);
  const spoken =
    row.points === null
      ? 'no data yet'
      : `${row.points >= 0 ? 'added' : 'took off'} ${Math.abs(row.points)} of ${Math.abs(row.max)} points`;

  return (
    <View
      accessible
      accessibilityLabel={`Rule ${number}: ${row.label}, ${spoken}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: palette.border,
        opacity: active ? 1 : 0.55,
      }}
    >
      <NumberCircle
        value={number}
        size={28}
        color={active ? palette.primary : palette.textFaint}
        background={active ? palette.primarySoft : palette.surfaceAlt}
      />
      <Txt style={{ flex: 1, lineHeight: 21 }}>{row.label}</Txt>
      <Txt style={{ minWidth: 72, textAlign: 'right' }}>
        <Txt variant="heading" style={{ color: tint }}>
          {today}
        </Txt>
        <Txt tone="faint">{` / ${signed(row.max)}`}</Txt>
      </Txt>
    </View>
  );
}
