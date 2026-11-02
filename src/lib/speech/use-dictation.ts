import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useCallback, useRef, useState } from 'react';

import i18n from '@/lib/i18n';

/**
 * Dikte (Kamil, 2 Kasım 2026: "dikte de çalışsın; söylesin yazsın hemen program oluştursun").
 *
 * Cihazın konuşma tanıması (iOS Speech, Android SpeechRecognizer, web'de Chrome'un Web Speech API'si) etkin dilde
 * dinler; ara sonuçlar canlı gösterilir. Kesinleşen parçalar birikir (Android ve web parça parça kesinleştirir, iOS
 * sonda bütün metni) — ikisi de aynı kuralla doğru birleşir. Durunca `onFinal` bütün metinle çağrılır.
 *
 * Aynı anda tek dinleme olur (konuşma tanıma tek kaynak); başka bir alan dinlemeye başlarsa olaylar ona gider.
 */
export type DictationError = 'unavailable' | 'permission' | 'noSpeech' | 'failed';

const LANG: Record<string, string> = { tr: 'tr-TR', en: 'en-US' };

let activeOwner: symbol | null = null;

export function useDictation({ onFinal }: { onFinal?: (text: string) => void } = {}) {
  const owner = useRef(Symbol('dictation')).current;
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<DictationError | null>(null);
  const committed = useRef('');
  const [committedText, setCommittedText] = useState('');
  const interimRef = useRef('');
  const show = (text: string) => {
    interimRef.current = text;
    setInterim(text);
  };

  const mine = () => activeOwner === owner;

  useSpeechRecognitionEvent('start', () => {
    if (mine()) setListening(true);
  });
  useSpeechRecognitionEvent('result', (event) => {
    if (!mine()) return;
    const transcript = event.results[0]?.transcript ?? '';
    if (event.isFinal) {
      committed.current = [committed.current, transcript.trim()].filter(Boolean).join(' ');
      setCommittedText(committed.current);
      show('');
    } else {
      show(transcript);
    }
  });
  useSpeechRecognitionEvent('error', (event) => {
    if (!mine()) return;
    setError(event.error === 'not-allowed' ? 'permission' : event.error === 'no-speech' ? 'noSpeech' : 'failed');
  });
  useSpeechRecognitionEvent('end', () => {
    if (!mine()) return;
    activeOwner = null;
    setListening(false);
    const text = [committed.current, interimRef.current.trim()].filter(Boolean).join(' ').trim();
    committed.current = '';
    setCommittedText('');
    show('');
    if (text) onFinal?.(text);
  });

  const start = useCallback(async () => {
    setError(null);
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      setError('unavailable');
      return;
    }
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setError('permission');
      return;
    }
    committed.current = '';
    setCommittedText('');
    show('');
    activeOwner = owner;
    ExpoSpeechRecognitionModule.start({
      lang: LANG[i18n.language.slice(0, 2)] ?? 'tr-TR',
      interimResults: true,
      continuous: true,
      addsPunctuation: true,
    });
  }, [owner]);

  const stop = useCallback(() => {
    if (mine()) ExpoSpeechRecognitionModule.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Dinlerken ekranda görünen metin (kesinleşen + ara). */
  const live = [committedText, interim].filter(Boolean).join(' ');

  return { listening, live, error, start, stop, toggle: listening ? stop : start };
}
