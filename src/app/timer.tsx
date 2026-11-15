import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedCircularProgress } from '@/components/AnimatedCircularProgress';
import { type TimerState, useIntervalTimer } from '@/hooks/useIntervalTimer';
import { useTranslation } from '@/i18n';
import {
  initAudioCues,
  playLongBeep,
  playShortBeep,
  unloadAudioCues,
} from '@/services/audio';
import { haptic } from '@/services/haptics';
import { useTheme } from '@/theme/ThemeProvider';

export type IntervalConfig = {
  time: number;
  rest: number;
  reps: number;
};

type Field = keyof IntervalConfig;

type FieldConfig = { min: number; max: number };

const FIELDS: Record<Field, FieldConfig> = {
  time: { min: 1, max: 3600 },
  rest: { min: 0, max: 3600 },
  reps: { min: 1, max: 99 },
};

/** Space reserved for the floating bottom tab bar overlay. */
const TAB_BAR_SPACE = 88;

/** Tag used to scope the screen wake lock to the interval timer. */
const KEEP_AWAKE_TAG = 'pam-interval-timer';

const INITIAL_VALUES: IntervalConfig = { time: 30, rest: 10, reps: 8 };

function formatSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function TimerScreen() {
  const { colors, spacing, radius, typography, scheme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const [values, setValues] = useState<IntervalConfig>(INITIAL_VALUES);
  const [drafts, setDrafts] = useState<Record<Field, string>>({
    time: String(INITIAL_VALUES.time),
    rest: String(INITIAL_VALUES.rest),
    reps: String(INITIAL_VALUES.reps),
  });
  const [focusedField, setFocusedField] = useState<Field | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const isKeyboardOpenRef = useRef<boolean>(false);
  const inputRefs = useRef<Record<Field, ComponentRef<typeof TextInput> | null>>({
    time: null,
    rest: null,
    reps: null,
  });

  // Responsive larger circle size (~280-300dp on standard phones).
  const ringSize = Math.min(Math.round(windowWidth - spacing.lg * 2.5), 296);

  const {
    currentState,
    remainingTime,
    currentRep,
    isPaused,
    start,
    pause,
    stop,
  } = useIntervalTimer({
    workDuration: values.time,
    restDuration: values.rest,
    totalReps: values.reps,
  });

  const isRunningOrPaused = currentState === 'working' || currentState === 'resting';

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  // Listen to native OS keyboard events on both iOS and Android.
  useEffect(() => {
    const onShow = (height: number) => {
      isKeyboardOpenRef.current = true;
      setKeyboardHeight(height);
      scrollToBottom();
    };

    const onHide = () => {
      isKeyboardOpenRef.current = false;
      setKeyboardHeight(0);
    };

    const willShowSub =
      Platform.OS === 'ios'
        ? Keyboard.addListener('keyboardWillShow', (e) => onShow(e.endCoordinates.height))
        : null;
    const didShowSub = Keyboard.addListener('keyboardDidShow', (e) =>
      onShow(e.endCoordinates.height)
    );
    const willHideSub =
      Platform.OS === 'ios' ? Keyboard.addListener('keyboardWillHide', onHide) : null;
    const didHideSub = Keyboard.addListener('keyboardDidHide', onHide);

    return () => {
      willShowSub?.remove();
      didShowSub.remove();
      willHideSub?.remove();
      didHideSub.remove();
    };
  }, [scrollToBottom]);

  // 1. Preload audio cues on mount and release on unmount.
  useEffect(() => {
    initAudioCues().catch(() => {});
    return () => {
      unloadAudioCues().catch(() => {});
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, []);

  // 2. Screen Wake Lock: keep screen awake during 'working' or 'resting', release on 'idle' or 'completed'.
  useEffect(() => {
    if (currentState === 'working' || currentState === 'resting') {
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    } else {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    }
  }, [currentState]);

  // 3. Audio Cues & Haptics:
  //    - During REST: play 3 short beeps at 3s, 2s, and 1s remaining.
  //    - When REST hits 0s (transitioning to WORK): play 1 long beep.
  const lastShortBeepKeyRef = useRef<string | null>(null);
  const prevStateRef = useRef<TimerState>(currentState);

  useEffect(() => {
    if (
      currentState === 'resting' &&
      !isPaused &&
      (remainingTime === 3 || remainingTime === 2 || remainingTime === 1)
    ) {
      const beepKey = `${currentRep}-${remainingTime}`;
      if (lastShortBeepKeyRef.current !== beepKey) {
        lastShortBeepKeyRef.current = beepKey;
        playShortBeep();
        haptic.light();
      }
    }
  }, [currentState, remainingTime, currentRep, isPaused]);

  useEffect(() => {
    const prevState = prevStateRef.current;
    if (prevState !== currentState) {
      if (prevState === 'resting' && currentState === 'working') {
        playLongBeep();
        haptic.medium();
      } else if (currentState === 'resting') {
        haptic.warning();
      } else if (currentState === 'completed') {
        playLongBeep();
        haptic.success();
      }
      prevStateRef.current = currentState;
    }
  }, [currentState]);

  const activePhaseDuration =
    currentState === 'resting' ? Math.max(1, values.rest) : Math.max(1, values.time);

  // Primary palette: Green (success) and Orange (warning)
  const phaseAccentColor = currentState === 'resting' ? colors.warning : colors.success;

  const fieldColor: Record<Field, string> = {
    time: colors.success,
    rest: colors.warning,
    reps: colors.success,
  };

  const handleChangeText = (field: Field, raw: string) => {
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    setDrafts((prev) => ({ ...prev, [field]: digitsOnly }));

    if (digitsOnly !== '') {
      const parsed = parseInt(digitsOnly, 10);
      const { min, max } = FIELDS[field];
      const clamped = Math.min(max, Math.max(min, parsed));
      setValues((prev) => ({ ...prev, [field]: clamped }));
    }
  };

  const handleBlur = (field: Field) => {
    setFocusedField((current) => (current === field ? null : current));
    const raw = drafts[field];
    const { min, max } = FIELDS[field];
    const parsed = raw === '' ? values[field] : parseInt(raw, 10);
    const clamped = Math.min(max, Math.max(min, Number.isNaN(parsed) ? min : parsed));

    setValues((prev) => ({ ...prev, [field]: clamped }));
    setDrafts((prev) => ({ ...prev, [field]: String(clamped) }));
  };

  const handlePrimaryAction = () => {
    Keyboard.dismiss();
    haptic.medium();

    if (isRunningOrPaused && !isPaused) {
      pause();
    } else {
      if (currentState === 'idle' || currentState === 'completed') {
        lastShortBeepKeyRef.current = null;
      }
      start();
    }
  };

  const handleReset = () => {
    Keyboard.dismiss();
    haptic.light();
    lastShortBeepKeyRef.current = null;
    stop();
  };

  const primaryLabel = isRunningOrPaused
    ? isPaused
      ? t('timer.action.resume')
      : t('timer.action.pause')
    : t('timer.action.start');

  // Green for START / RESUME, Orange for PAUSE
  const primaryButtonColor =
    isRunningOrPaused && !isPaused ? colors.warning : colors.success;

  const isKeyboardOpen = keyboardHeight > 0;

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollRef}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          if (isKeyboardOpenRef.current || focusedField !== null) {
            scrollToBottom();
          }
        }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: isKeyboardOpen
              ? keyboardHeight + spacing.lg
              : insets.bottom + TAB_BAR_SPACE,
            gap: spacing.md,
          },
        ]}>
        <Pressable onPress={Keyboard.dismiss} style={[styles.viewport, { gap: spacing.md }]}>
          {/* Header */}
          <View>
            <Text style={[typography.largeTitle, { color: colors.textPrimary }]}>
              {t('timer.setup.title')}
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              {t('timer.setup.subtitle')}
            </Text>
          </View>

          {/* Larger Center 60fps UI-Thread Circular Progress Ring */}
          <View style={styles.ringSection}>
            <AnimatedCircularProgress
              state={currentState}
              remainingTime={remainingTime}
              totalDuration={activePhaseDuration}
              currentRep={currentRep}
              isPaused={isPaused}
              size={ringSize}
              strokeWidth={18}>
              <Text
                style={[
                  typography.headline,
                  styles.phaseBadge,
                  { color: phaseAccentColor },
                ]}>
                {t(`timer.phase.${currentState}`)}
              </Text>
              <Text
                style={[
                  typography.numericLarge,
                  styles.ringTimerText,
                  { color: colors.textPrimary },
                ]}>
                {formatSeconds(remainingTime)}
              </Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>
                {t('timer.phase.rep', { current: currentRep, total: values.reps })}
              </Text>
            </AnimatedCircularProgress>
          </View>

          {/* FR1: Inline Setup Controls (Green & Orange Accents) */}
          <View
            style={[
              styles.setupRow,
              {
                gap: spacing.sm,
                opacity: isRunningOrPaused ? 0.55 : 1,
              },
            ]}>
            {(Object.keys(FIELDS) as Field[]).map((field) => {
              const isFocused = focusedField === field;
              const activeColor = fieldColor[field];

              return (
                <Pressable
                  key={field}
                  accessibilityRole="button"
                  disabled={isRunningOrPaused}
                  onPress={() => {
                    haptic.light();
                    inputRefs.current[field]?.focus();
                  }}
                  style={[
                    styles.setupCard,
                    {
                      backgroundColor: colors.surface,
                      borderRadius: radius.lg,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.sm,
                      borderColor: isFocused ? activeColor : colors.border,
                      borderWidth: isFocused ? 2 : StyleSheet.hairlineWidth,
                    },
                  ]}>
                  <Text
                    numberOfLines={1}
                    style={[
                      typography.caption,
                      styles.cardLabel,
                      { color: activeColor },
                    ]}>
                    {t(`timer.setup.${field}`).toUpperCase()}
                  </Text>

                  <View style={styles.cardValueWrapper}>
                    <TextInput
                      ref={(el) => {
                        inputRefs.current[field] = el;
                      }}
                      editable={!isRunningOrPaused}
                      value={drafts[field]}
                      onChangeText={(text) => handleChangeText(field, text)}
                      onFocus={() => {
                        setFocusedField(field);
                        scrollToBottom();
                      }}
                      onBlur={() => handleBlur(field)}
                      keyboardType="number-pad"
                      keyboardAppearance={scheme}
                      returnKeyType="done"
                      maxLength={4}
                      selectTextOnFocus
                      onSubmitEditing={Keyboard.dismiss}
                      style={[
                        typography.title,
                        styles.cardInput,
                        { color: isFocused ? activeColor : colors.textPrimary },
                      ]}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* FR3: Bottom Action Bar (Green START / Orange PAUSE & Orange-Accented RESET) */}
          <View style={[styles.bottomBar, { gap: spacing.md }]}>
            <Pressable
              accessibilityRole="button"
              onPress={handlePrimaryAction}
              style={({ pressed }) => [
                styles.actionButton,
                styles.startButton,
                {
                  backgroundColor: primaryButtonColor,
                  borderRadius: radius.pill,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Text style={[typography.headline, { color: colors.onAccent }]}>
                {primaryLabel}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={handleReset}
              style={({ pressed }) => [
                styles.actionButton,
                styles.resetButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.warning,
                  borderRadius: radius.pill,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Text style={[typography.headline, { color: colors.warning }]}>
                {t('timer.action.stop')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
  viewport: {
    flex: 1,
    justifyContent: 'space-between',
  },
  ringSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  phaseBadge: {
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  ringTimerText: {
    fontSize: 60,
    lineHeight: 68,
    marginVertical: 2,
  },
  setupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  setupCard: {
    flex: 1,
    height: 92,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    textAlign: 'center',
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  cardValueWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardInput: {
    padding: 0,
    margin: 0,
    textAlign: 'center',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    minWidth: 48,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButton: {
    flex: 2,
  },
  resetButton: {
    flex: 1,
    borderWidth: 1,
  },
});
