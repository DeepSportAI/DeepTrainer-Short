import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Pause, Play, RotateCcw, Square } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { formatClock } from '@/lib/format/clock';
import { useColorTokens } from '@/lib/theme/tokens';

import type { TimerSpec } from '../protocol';

/**
 * Test kronometresi: geri sayım (Plank 30 sn, 1 dk burpee) ya da kronometre (500 m kürek). Süre bitince titreşim;
 * erken durdurulursa geçen süre bildirilir (Plank'te tutulan süre otomatik yazılır). Çalışırken ekran kararmaz.
 */
export function TestTimer({
  spec,
  onStart,
  onFinish,
  onReset,
}: {
  spec: TimerSpec;
  onStart?: () => void;
  onFinish: (elapsedSeconds: number) => void;
  onReset?: () => void;
}) {
  const { t } = useTranslation();
  const [primaryFg, foreground] = useColorTokens(['primary-foreground', 'foreground']);
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'done'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);
  const banked = useRef(0);
  const finished = useRef(false);

  const total = spec.mode === 'countdown' ? spec.seconds : null;

  useEffect(() => {
    if (status !== 'running') return;
    void activateKeepAwakeAsync('test-timer');
    const timer = setInterval(() => {
      const value = banked.current + (Date.now() - startedAt.current) / 1000;
      if (total !== null && value >= total) {
        setElapsed(total);
        finish(total);
        return;
      }
      setElapsed(value);
    }, 100);
    return () => {
      clearInterval(timer);
      void deactivateKeepAwake('test-timer');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, total]);

  function finish(value: number) {
    if (finished.current) return;
    finished.current = true;
    setStatus('done');
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Titreşim yoksa (web) sessiz geçer.
    }
    onFinish(Math.round(value * 10) / 10);
  }

  function start() {
    if (status === 'idle') onStart?.();
    startedAt.current = Date.now();
    setStatus('running');
  }

  function pause() {
    banked.current += (Date.now() - startedAt.current) / 1000;
    setStatus('paused');
  }

  function stop() {
    const value = status === 'running' ? banked.current + (Date.now() - startedAt.current) / 1000 : banked.current;
    setElapsed(value);
    finish(value);
  }

  function reset() {
    finished.current = false;
    banked.current = 0;
    setElapsed(0);
    setStatus('idle');
    onReset?.();
  }

  const shown = total !== null ? Math.max(0, total - elapsed) : elapsed;
  const ratio = total !== null ? Math.min(1, elapsed / total) : 0;

  return (
    <View className="overflow-hidden rounded-[22px] border border-border bg-card">
      {total !== null ? (
        <View className="h-1.5 bg-muted">
          <View className="h-full bg-data" style={{ width: `${ratio * 100}%` }} />
        </View>
      ) : null}
      <View className="flex-row items-center gap-3 px-3.5 py-3">
        <View className="flex-1">
          <Text className="text-[12px] font-semibold text-muted-foreground">
            {spec.mode === 'countdown' ? t('assessment.timer.countdown') : t('assessment.timer.stopwatch')}
          </Text>
          <Text accessibilityRole="timer" className="font-num text-[44px] font-extrabold leading-[50px] text-foreground">
            {total !== null ? formatClock(Math.ceil(shown)) : formatTenths(shown)}
          </Text>
          <Text className="text-[12px] text-muted-foreground">{t(`assessment.timer.status.${status}`)}</Text>
        </View>
        {status === 'running' ? (
          <>
            {spec.mode === 'stopwatch' ? (
              <TimerButton label={t('assessment.timer.pause')} onPress={pause}>
                <Pause size={22} color={foreground} strokeWidth={2.2} />
              </TimerButton>
            ) : null}
            <TimerButton label={t('assessment.timer.stop')} onPress={stop} primary>
              <Square size={20} color={primaryFg} fill={primaryFg} strokeWidth={2} />
            </TimerButton>
          </>
        ) : status === 'done' ? (
          <TimerButton label={t('assessment.timer.reset')} onPress={reset}>
            <RotateCcw size={22} color={foreground} strokeWidth={2.2} />
          </TimerButton>
        ) : (
          <>
            {status === 'paused' ? (
              <TimerButton label={t('assessment.timer.stop')} onPress={stop}>
                <Square size={20} color={foreground} strokeWidth={2.2} />
              </TimerButton>
            ) : null}
            <TimerButton label={t('assessment.timer.start')} onPress={start} primary>
              <Play size={22} color={primaryFg} fill={primaryFg} strokeWidth={2} />
            </TimerButton>
          </>
        )}
      </View>
    </View>
  );
}

function formatTenths(seconds: number): string {
  const whole = Math.floor(seconds);
  const tenth = Math.floor((seconds - whole) * 10);
  return `${formatClock(whole)}.${tenth}`;
}

function TimerButton({ label, onPress, primary = false, children }: { label: string; onPress: () => void; primary?: boolean; children: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`h-16 w-16 items-center justify-center rounded-full active:opacity-75 ${primary ? 'bg-primary' : 'border border-border bg-background'}`}
    >
      {children}
    </Pressable>
  );
}
