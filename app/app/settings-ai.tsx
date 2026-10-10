import React from 'react';
import { Alert } from 'react-native';

import { PressableScale } from '../src/components/motion';
import { Card, NumberCircle, Screen, Txt } from '../src/components/primitives';
import { spacing } from '../src/theme';

const AI_OPTIONS = ['TypeSafe', 'Gemini', 'OpenAI'];

export default function SettingsAiScreen(): React.ReactElement {
  return (
    <Screen edges={[]} contentStyle={{ paddingBottom: 100 }}>
      <Txt tone="muted" style={{ marginBottom: spacing.lg }}>
        Pick an AI to check your score.
      </Txt>
      {AI_OPTIONS.map((name) => (
        <PressableScale
          key={name}
          onPress={() => Alert.alert(name, 'Coming soon!')}
          accessibilityLabel={name}
          scaleTo={0.99}
          style={{ marginBottom: spacing.sm }}
        >
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <NumberCircle value={name[0]} size={36} />
            <Txt variant="label" style={{ flex: 1 }}>
              {name}
            </Txt>
            <Txt variant="caption" tone="faint">
              Soon
            </Txt>
          </Card>
        </PressableScale>
      ))}
    </Screen>
  );
}
