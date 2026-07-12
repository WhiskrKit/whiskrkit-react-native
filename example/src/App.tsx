import { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { initialize, present, checkAndPresent } from 'react-native-whiskrkit';

/**
 * Manual test harness for the WhiskrKit wrapper.
 *
 * WhiskrKit is fire-and-forget by design: none of the calls report an
 * outcome, so the log below records *actions taken*, not SDK events. The
 * survey either appears or it doesn't; failure details go to the native log
 * (Console.app / Logcat).
 */

// Built-in mock survey IDs (withMockedSurveys: true). Toast and sheet IDs
// exist on both platforms; the fullscreen mock ID differs per platform.
const PRESETS = [
  { label: 'Toast', surveyId: 'welcome-toast' },
  { label: 'Sheet', surveyId: 'choice-survey' },
  {
    label: 'Fullscreen',
    surveyId: Platform.select({
      ios: 'satisfaction-survey',
      default: 'full-survey',
    }),
  },
  { label: 'Unknown ID', surveyId: 'does-not-exist' },
];

export default function App() {
  const [surveyId, setSurveyId] = useState('welcome-toast');
  const [initialized, setInitialized] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const appendLog = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString();
    setLog((current) => [`${time}  ${message}`, ...current]);
  }, []);

  const onInitialize = () => {
    initialize('example-api-key', { withMockedSurveys: true });
    setInitialized(true);
    appendLog('initialize(withMockedSurveys: true)');
  };

  const onPresent = () => {
    present(surveyId);
    appendLog(`present("${surveyId}")`);
  };

  const onCheckAndPresent = () => {
    checkAndPresent(surveyId);
    appendLog(`checkAndPresent("${surveyId}")`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WhiskrKit example</Text>
      <Text style={styles.platform}>
        Running on {Platform.OS} {Platform.Version}
        {Platform.OS === 'ios'
          ? ' — sheet/toast placement is iOS-only (iPad, regular width)'
          : ''}
      </Text>

      <Button
        label={initialized ? 'Initialized ✓' : 'Initialize (mocked surveys)'}
        onPress={onInitialize}
        disabled={initialized}
      />

      <Text style={styles.sectionLabel}>Survey ID</Text>
      <TextInput
        style={styles.input}
        value={surveyId}
        onChangeText={setSurveyId}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.presetRow}>
        {PRESETS.map((preset) => (
          <Pressable
            key={preset.label}
            style={[
              styles.preset,
              surveyId === preset.surveyId && styles.presetActive,
            ]}
            onPress={() => setSurveyId(preset.surveyId)}
          >
            <Text style={styles.presetText}>{preset.label}</Text>
          </Pressable>
        ))}
      </View>

      <Button label="Present" onPress={onPresent} disabled={!initialized} />
      <Button
        label="Check eligibility and present"
        onPress={onCheckAndPresent}
        disabled={!initialized}
      />

      <Text style={styles.sectionLabel}>
        Action log (calls made, not SDK events — WhiskrKit reports no outcome)
      </Text>
      <ScrollView style={styles.log}>
        {log.map((entry, index) => (
          <Text key={index} style={styles.logEntry}>
            {entry}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

function Button({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  platform: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  preset: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#eee',
  },
  presetActive: {
    backgroundColor: '#cde3ff',
  },
  presetText: {
    fontSize: 13,
  },
  button: {
    backgroundColor: '#2f6fed',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a8bede',
  },
  buttonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  log: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 8,
    padding: 8,
    marginBottom: 20,
  },
  logEntry: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    marginBottom: 4,
  },
});
