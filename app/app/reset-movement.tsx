import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { PressableScale, Reveal } from '../src/components/motion';
import { MoveFigure } from '../src/components/move-figure';
import { Button, Card, Kicker, NumberCircle, Screen, Txt } from '../src/components/primitives';
import { MOVE_TIMERS } from '../src/constants/reset';
import { useAlarm } from '../src/hooks/useAlarm';
import { formatClock, useCountdown } from '../src/hooks/useCountdown';
import { useTheme } from '../src/hooks/useTheme';
import { radius, spacing } from '../src/theme';

export default function MovementTimerScreen(): React.ReactElement {
  useKeepAwake();
  const { palette } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const timer = MOVE_TIMERS.find((t) => t.id === params.id) ?? MOVE_TIMERS[0];
  const total = timer.minutes * 60;
  const clock = useCountdown(total);
  const alarm = useAlarm();
  const [ringing, setRinging] = useState(false);

  useEffect(() => {
    if (clock.done) {
      alarm.ring();
      setRinging(true);
    }
  }, [clock.done]);

  const stopAlarm = (): void => {
    alarm.stop();
    setRinging(false);
  };

  const progress = 1 - clock.secondsLeft / total;
  const timerStep = Math.min(timer.steps.length - 1, Math.floor(progress * timer.steps.length));
  const [picked, setPicked] = useState<number | null>(null);
  const current = picked ?? timerStep;
  const step = timer.steps[current];

  useEffect(() => {
    setPicked(null);
  }, [timerStep]);

  return (
    <Screen edges={[]} contentStyle={{ paddingBottom: spacing.xxl }}>
      <Stack.Screen options={{ title: 'Movement' }} />
      <Reveal>
        <Txt variant="title">{timer.title}</Txt>
        <Txt tone="muted" style={{ marginTop: spacing.xs }}>
          {`${timer.minutes} min timer`}
        </Txt>
      </Reveal>

      <Reveal delay={30}>
        <Card style={{ marginTop: spacing.lg }}>
          <View style={{ borderRadius: radius.lg, backgroundColor: palette.blueSoft, overflow: 'hidden' }}>
            <MoveFigure art={step.art} />
          </View>
          <Kicker style={{ marginTop: spacing.md }}>{`Step ${current + 1} of ${timer.steps.length}`}</Kicker>
          <Txt variant="label" style={{ marginTop: 2 }}>
            {step.text}
          </Txt>
        </Card>
      </Reveal>

      <Reveal delay={60}>
        <Card style={{ marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.xl }}>
          <Txt
            style={{
              fontSize: 76,
              lineHeight: 84,
              fontWeight: '700',
              letterSpacing: -2,
              color: clock.done ? palette.bandLowText : palette.text,
              fontVariant: ['tabular-nums'],
            }}
          >
            {clock.done ? 'Done!' : formatClock(clock.secondsLeft)}
          </Txt>
          <Txt tone="muted" style={{ marginTop: spacing.xs }}>
            {clock.done ? "Time's up" : clock.running ? 'Keep going' : 'Paused'}
          </Txt>
          <View
            style={{
              alignSelf: 'stretch',
              height: 10,
              marginTop: spacing.xl,
              borderRadius: radius.pill,
              backgroundColor: palette.surfaceAlt,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${Math.round(progress * 100)}%`,
                height: 10,
                borderRadius: radius.pill,
                backgroundColor: clock.done ? palette.bandLowFill : palette.primary,
              }}
            />
          </View>
        </Card>
      </Reveal>

      <Reveal delay={100}>
        {ringing ? (
          <Button label="Stop alarm" onPress={stopAlarm} style={{ marginTop: spacing.lg }} />
        ) : clock.done ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button label="Again" variant="secondary" onPress={clock.restart} style={{ flex: 1 }} />
            <Button label="Finish" onPress={() => router.back()} style={{ flex: 1 }} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button
              label={clock.running ? 'Pause' : 'Resume'}
              onPress={clock.running ? clock.pause : clock.resume}
              style={{ flex: 1 }}
            />
            <Button label="Restart" variant="secondary" onPress={clock.restart} style={{ flex: 1 }} />
          </View>
        )}
      </Reveal>

      <Reveal delay={140}>
        <Card style={{ marginTop: spacing.xl }}>
          <Kicker style={{ marginBottom: spacing.sm }}>What to do</Kicker>
          {timer.steps.map((item, i) => (
            <PressableScale key={item.text} onPress={() => setPicked(i)} accessibilityLabel={`Show how: ${item.text}`}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs }}>
                <NumberCircle
                  value={i + 1}
                  size={26}
                  color={i === current ? undefined : palette.textFaint}
                  background={i === current ? undefined : palette.surfaceAlt}
                />
                <Txt variant={i === current ? 'label' : 'body'} style={{ flex: 1 }}>
                  {item.text}
                </Txt>
              </View>
            </PressableScale>
          ))}
        </Card>
      </Reveal>
    </Screen>
  );
}
