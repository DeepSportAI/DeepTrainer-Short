import { useCallback, useEffect, useRef, useState } from 'react';

import { downsample, summarize } from '@/lib/heart-rate/summary';
import { useHeartRate } from '@/lib/heart-rate/store';

import type { HeartRateSummary } from './model';

/** Toparlanma için test bitiminden sonra kaç saniye kaydedilir. */
export const RECOVERY_SECONDS = 60;

/**
 * Test sırasındaki nabız kaydı: kronometre başlayınca kayıt başlar, bitince 60 sn toparlanma sürer, sonra özet
 * (`HeartRateSummary`) çıkar. Antrenör toparlanmayı beklemeden kaydederse o ana kadarki özet alınır (toparlanma yok).
 * Saat bağlı değilse hiçbir şey yapmaz.
 */
export function useHeartRateCapture() {
  const connected = useHeartRate((s) => s.status === 'connected');
  const deviceName = useHeartRate((s) => s.device?.name ?? null);
  const [phase, setPhase] = useState<'idle' | 'recording' | 'recovery' | 'done'>('idle');
  const [summary, setSummary] = useState<HeartRateSummary | null>(null);
  const [recoveryLeft, setRecoveryLeft] = useState(RECOVERY_SECONDS);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const finalize = useCallback((): HeartRateSummary | null => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    const recording = useHeartRate.getState().stopRecording();
    if (!recording || recording.samples.length === 0) {
      setPhase('idle');
      return null;
    }
    const stats = summarize(recording.samples, recording.endAt);
    if (!stats) return null;
    const result: HeartRateSummary = { deviceName, ...stats, endAt: recording.endAt, samples: downsample(recording.samples) };
    setSummary(result);
    setPhase('done');
    return result;
  }, [deviceName]);

  const start = useCallback(() => {
    if (!useHeartRate.getState().device || useHeartRate.getState().status !== 'connected') return;
    setSummary(null);
    useHeartRate.getState().startRecording();
    setPhase('recording');
  }, []);

  const end = useCallback(() => {
    if (!useHeartRate.getState().recording) return;
    useHeartRate.getState().markEnd();
    setPhase('recovery');
    setRecoveryLeft(RECOVERY_SECONDS);
    const startedAt = Date.now();
    timer.current = setInterval(() => {
      const left = RECOVERY_SECONDS - Math.floor((Date.now() - startedAt) / 1000);
      setRecoveryLeft(Math.max(0, left));
      if (left <= -1) finalize();
    }, 500);
  }, [finalize]);

  const reset = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    useHeartRate.getState().stopRecording();
    setSummary(null);
    setPhase('idle');
  }, []);

  /** Kaydederken: süren kayıt varsa şimdi bitir, yoksa var olan özet. */
  const take = useCallback((): HeartRateSummary | null => {
    if (phase === 'recording' || phase === 'recovery') return finalize();
    return summary;
  }, [finalize, phase, summary]);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      useHeartRate.getState().stopRecording();
    },
    [],
  );

  return { connected, phase, summary, recoveryLeft, start, end, reset, take, setSummary };
}
