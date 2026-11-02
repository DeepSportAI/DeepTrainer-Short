import { ArrowUp, CalendarDays, ChevronDown, ChevronUp, Save, SlidersHorizontal } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { DictationButton, DictationErrorLine } from '@/components/ui/dictation-button';
import { MultiChips } from '@/components/ui/multi-chips';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { EQUIPMENT } from '@/features/exercises/catalog';
import type { DictationError } from '@/lib/speech/use-dictation';
import { useColorTokens } from '@/lib/theme/tokens';

import { exerciseCount } from '../model';
import { DAYS_PER_WEEK, PLACES, PROGRAM_WEEKS, SESSION_MINUTES, type ProgramPlan, type ProgramPreferences } from '../schema';

/** Antrenörün mesajı (sağda, volt) ve asistanın yanıtı (solda, kart). */
export function Bubble({ role, text }: { role: 'user' | 'assistant'; text: string }) {
  const user = role === 'user';
  return (
    <View className={`max-w-[88%] rounded-[20px] px-3.5 py-2.5 ${user ? 'self-end rounded-br-md bg-primary' : 'self-start rounded-bl-md border border-border bg-card'}`}>
      <Text className={`text-[15px] leading-[21px] ${user ? 'text-primary-foreground' : 'text-foreground'}`}>{text}</Text>
    </View>
  );
}

export function TypingBubble({ label }: { label: string }) {
  const muted = useColorTokens(['muted-foreground'])[0];
  return (
    <View className="flex-row items-center gap-2 self-start rounded-[20px] rounded-bl-md border border-border bg-card px-3.5 py-2.5">
      <ActivityIndicator size="small" color={muted} />
      <Text className="text-[14px] text-muted-foreground">{label}</Text>
    </View>
  );
}

/** Yanıttaki program: başlık, özet, günler; "Aç" önizleme, "Kaydet" sporcuya kaydeder. */
export function ProgramPreview({
  plan,
  onOpen,
  onSave,
  saving,
  saved,
}: {
  plan: ProgramPlan;
  onOpen: () => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  const { t } = useTranslation();
  const [interactive] = useColorTokens(['interactive']);
  return (
    <View className="gap-2.5 self-stretch rounded-[22px] border border-border bg-card px-3.5 py-3">
      <View className="flex-row items-center gap-2">
        <CalendarDays size={18} color={interactive} strokeWidth={2} />
        <Text className="flex-1 text-[16px] font-bold text-foreground">{plan.title}</Text>
      </View>
      <Text className="text-[13px] leading-[18px] text-muted-foreground">{plan.summary}</Text>
      <Text className="text-[12px] font-semibold text-foreground">
        {t('programs.preview.meta', { days: plan.daysPerWeek, minutes: plan.sessionMinutes, weeks: plan.weeks, count: exerciseCount(plan) })}
      </Text>
      <View className="gap-1">
        {plan.days.map((day, index) => (
          <Text key={`${day.title}-${index}`} numberOfLines={1} className="text-[13px] text-foreground">
            <Text className="font-bold">{t('programs.preview.day', { number: index + 1 })}</Text> · {day.title}
          </Text>
        ))}
      </View>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button shape="pill" variant="outline" label={t('programs.preview.open')} onPress={onOpen} />
        </View>
        <View className="flex-1">
          <Button shape="pill" icon={Save} label={saved ? t('programs.preview.saved') : t('programs.preview.save')} loading={saving} disabled={saved} onPress={onSave} />
        </View>
      </View>
    </View>
  );
}

/** Varyasyon paneli: gün / süre / hafta / ortam / ekipman. Kapalıyken tek satır özet. */
export function PreferencesPanel({ value, onChange }: { value: ProgramPreferences; onChange: (next: ProgramPreferences) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [interactive, foreground] = useColorTokens(['interactive', 'foreground']);
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <View className="rounded-[22px] border border-border bg-card px-3.5">
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} className="min-h-[54px] flex-row items-center gap-2.5 py-2 active:opacity-70">
        <SlidersHorizontal size={18} color={interactive} strokeWidth={2} />
        <View className="flex-1">
          <Text className="text-[13px] font-semibold text-muted-foreground">{t('programs.preferences.title')}</Text>
          <Text numberOfLines={1} className="text-[14px] font-semibold text-foreground">
            {t('programs.preferences.short', {
              days: value.daysPerWeek,
              minutes: value.sessionMinutes,
              weeks: value.weeks,
              place: t(`programs.preferences.place.${value.place}`),
            })}
          </Text>
        </View>
        <Chevron size={18} color={foreground} strokeWidth={2} />
      </Pressable>
      {open ? (
        <View className="gap-3.5 pb-3.5">
          <ChoiceChips
            label={t('programs.preferences.days')}
            options={DAYS_PER_WEEK.map((days) => ({ value: String(days), label: t('programs.preferences.daysOption', { count: days }) }))}
            value={String(value.daysPerWeek)}
            onChange={(days) => onChange({ ...value, daysPerWeek: Number(days) as ProgramPreferences['daysPerWeek'] })}
          />
          <ChoiceChips
            label={t('programs.preferences.minutes')}
            options={SESSION_MINUTES.map((minutes) => ({ value: String(minutes), label: t('programs.preferences.minutesOption', { count: minutes }) }))}
            value={String(value.sessionMinutes)}
            onChange={(minutes) => onChange({ ...value, sessionMinutes: Number(minutes) as ProgramPreferences['sessionMinutes'] })}
          />
          <ChoiceChips
            label={t('programs.preferences.weeks')}
            options={PROGRAM_WEEKS.map((weeks) => ({ value: String(weeks), label: t('programs.preferences.weeksOption', { count: weeks }) }))}
            value={String(value.weeks)}
            onChange={(weeks) => onChange({ ...value, weeks: Number(weeks) as ProgramPreferences['weeks'] })}
          />
          <ChoiceChips
            label={t('programs.preferences.placeLabel')}
            options={PLACES.map((place) => ({ value: place, label: t(`programs.preferences.place.${place}`) }))}
            value={value.place}
            onChange={(place) => onChange({ ...value, place })}
          />
          <MultiChips
            label={t('programs.preferences.equipment')}
            options={EQUIPMENT.filter((item) => item !== 'bodyweight').map((item) => ({ value: item, label: t(`exercises.equipment.${item}`) }))}
            value={value.equipment}
            onChange={(equipment) => onChange({ ...value, equipment })}
          />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Yazma alanı: metin + mikrofon + gönder. Dikte (Kamil: "söylesin yazsın hemen program oluştursun"): mikrofona dokun,
 * konuş — metin canlı yazılır; durdurunca mesaj KENDİLİĞİNDEN gönderilir.
 */
export function Composer({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (text: string) => void;
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder: string;
}) {
  const { t } = useTranslation();
  const [muted, primaryFg] = useColorTokens(['muted-foreground', 'primary-foreground']);
  const [live, setLive] = useState<string | null>(null);
  const [error, setError] = useState<DictationError | null>(null);
  const canSend = !disabled && value.trim().length > 0;

  return (
    <View className="gap-1">
      <View className="flex-row items-end gap-2">
        <View className="min-h-[48px] flex-1 justify-center rounded-[24px] border border-input bg-card px-4 py-1.5">
          <TextInput
            accessibilityLabel={placeholder}
            multiline
            value={live !== null ? [value, live].filter(Boolean).join(' ') : value}
            editable={live === null && !disabled}
            onChangeText={onChange}
            placeholder={live !== null ? t('dictation.listening') : placeholder}
            placeholderTextColor={muted}
            className={`max-h-[120px] py-1.5 text-[16px] ${live !== null ? 'text-muted-foreground' : 'text-foreground'}`}
          />
        </View>
        <DictationButton
          size={48}
          onLive={setLive}
          onError={setError}
          onText={(text) => {
            const message = [value.trim(), text].filter(Boolean).join(' ');
            if (!disabled && message) onSend(message);
            else onChange(message);
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('programs.chat.send')}
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          onPress={() => onSend(value.trim())}
          className={`h-12 w-12 items-center justify-center rounded-full bg-primary active:opacity-80 ${canSend ? '' : 'opacity-40'}`}
        >
          <ArrowUp size={22} color={primaryFg} strokeWidth={2.6} />
        </Pressable>
      </View>
      <DictationErrorLine error={error} />
    </View>
  );
}
