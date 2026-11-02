import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { useColorToken } from '@/lib/theme/tokens';
import type { DictationError } from '@/lib/speech/use-dictation';

import { DictationButton, DictationErrorLine } from './dictation-button';

/**
 * Antrenör notu: çok satırlı alan + mikrofon. Söylenen metin var olan notun SONUNA eklenir ("İrem lordoz oluşuyor").
 * Dinlerken alan canlı metni soluk gösterir.
 */
export function NoteField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const muted = useColorToken('muted-foreground');
  const [live, setLive] = useState<string | null>(null);
  const [error, setError] = useState<DictationError | null>(null);
  const append = useCallback(
    (text: string) => onChange([value.trim(), text].filter(Boolean).join(value.trim() ? ' ' : '')),
    [onChange, value],
  );

  return (
    <View className="gap-1.5">
      <Text className="text-[13px] font-semibold text-foreground">{label}</Text>
      <View className="min-h-[96px] flex-row items-start gap-2 rounded-2xl border border-input bg-card py-2 pl-4 pr-2">
        <TextInput
          accessibilityLabel={label}
          multiline
          value={live !== null ? [value, live].filter(Boolean).join(' ') : value}
          editable={live === null}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={muted}
          className={`min-h-[80px] flex-1 py-1.5 text-[16px] ${live !== null ? 'text-muted-foreground' : 'text-foreground'}`}
          style={{ textAlignVertical: 'top' }}
        />
        <DictationButton onText={append} onLive={setLive} onError={setError} size={40} />
      </View>
      <DictationErrorLine error={error} />
    </View>
  );
}
