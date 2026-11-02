import { useLocalSearchParams, useRouter } from 'expo-router';
import { RotateCcw } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ContentFrame } from '@/components/ui/content-frame';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { sortedSessions } from '@/features/assessment/model';
import { useAthleteAssessments } from '@/features/assessment/queries';
import { useAthlete } from '@/features/athletes/queries';
import { fullName } from '@/features/athletes/model';
import { AssistantError } from '@/features/programs/api';
import { Bubble, Composer, PreferencesPanel, ProgramPreview, TypingBubble } from '@/features/programs/components/chat-parts';
import { clientContext, preferencesText, samePreferences } from '@/features/programs/context';
import { chatMessage, type ChatMessage } from '@/features/programs/model';
import { useAskAssistant, useSaveProgram } from '@/features/programs/mutations';
import { useProgram } from '@/features/programs/queries';
import { DEFAULT_PREFERENCES, type AssistantRequest, type ProgramPlan, type ProgramPreferences } from '@/features/programs/schema';
import { formatShortDate } from '@/lib/format/date';
import { KEYBOARD_BEHAVIOR } from '@/lib/layout/keyboard';

const SUGGESTIONS = ['fromAssessment', 'home', 'upperBody', 'short'] as const;

/**
 * Program asistanı (Kamil, 2 Kasım 2026: "buradan Claude ile konuşacak, ona uygun bir antrenman programını bizim
 * istediğimiz varyasyonuyla alacak, dikte de çalışsın"). İlk mesaj sporcunun değerlendirme özetini ve varyasyonu
 * taşır; antrenör yazarak ya da konuşarak ister, asistan programı yazar, antrenör düzelttirir ve kaydeder.
 * `programId` verilirse kayıtlı programın sohbeti kaldığı yerden sürer ve kayıt aynı programı günceller.
 */
export default function ProgramChatRoute() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string; assessmentId?: string; programId?: string }>();
  const athleteId = params.id ?? '';
  const athlete = useAthlete(athleteId);
  const assessments = useAthleteAssessments(athleteId);
  const existing = useProgram(params.programId ?? '');
  const ask = useAskAssistant();
  const save = useSaveProgram();
  const scroll = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [preferences, setPreferences] = useState<ProgramPreferences>(DEFAULT_PREFERENCES);
  const [sentPreferences, setSentPreferences] = useState<ProgramPreferences | null>(null);
  const [draft, setDraft] = useState('');
  const [savedId, setSavedId] = useState<string | null>(params.programId ?? null);
  const [savedPlan, setSavedPlan] = useState<ProgramPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadedExisting = useRef(false);

  useEffect(() => {
    if (!existing.data || loadedExisting.current) return;
    loadedExisting.current = true;
    setMessages(existing.data.messages);
    setPreferences(existing.data.preferences);
    setSentPreferences(existing.data.preferences);
    setSavedPlan(existing.data.plan);
  }, [existing.data]);

  const assessment = useMemo(() => {
    const sessions = sortedSessions(assessments.data ?? []);
    const wanted = params.assessmentId ?? existing.data?.assessmentId;
    return sessions.find((item) => item.id === wanted) ?? sessions.find((item) => item.evaluation) ?? sessions[0] ?? null;
  }, [assessments.data, params.assessmentId, existing.data?.assessmentId]);

  if (!athlete.data || assessments.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }
  const person = athlete.data;

  function errorText(code: string) {
    return t(`programs.errors.${code}`, { defaultValue: t('programs.errors.upstream') });
  }

  function send(text: string, history: ChatMessage[] = messages) {
    if (!text.trim() || ask.isPending) return;
    setError(null);
    const first = history.filter((item) => item.role === 'user').length === 0;
    const prefsChanged = !sentPreferences || !samePreferences(sentPreferences, preferences);
    const content = [
      first ? clientContext(t, person, assessment) : null,
      first || prefsChanged ? preferencesText(t, preferences) : null,
      text.trim(),
    ]
      .filter(Boolean)
      .join('\n\n');
    const userMessage = chatMessage('user', text.trim(), content);
    const next = [...history, userMessage];
    setMessages(next);
    setSentPreferences(preferences);
    setDraft('');
    const body: AssistantRequest = {
      locale: i18n.language.startsWith('en') ? 'en' : 'tr',
      messages: next.map((item) => ({ role: item.role, content: item.content })),
    };
    ask.mutate(body, {
      onSuccess: (output) => {
        setMessages((current) => [
          ...current,
          chatMessage('assistant', output.reply, JSON.stringify(output), output.program),
        ]);
      },
      onError: (failure) => {
        // Gönderilemeyen mesaj geri alınır (sohbet kullanıcı mesajıyla bitemez); metin yazma alanına döner.
        setMessages(history);
        setDraft(text.trim());
        setError(errorText(failure instanceof AssistantError ? failure.code : 'upstream'));
      },
    });
  }

  function savePlan(plan: ProgramPlan) {
    save.mutate(
      {
        draft: { athleteId, assessmentId: assessment?.id ?? null, plan, preferences, messages },
        id: savedId ?? undefined,
      },
      {
        onSuccess: (program) => {
          setSavedId(program.id);
          setSavedPlan(plan);
        },
      },
    );
  }

  const openPlan = (plan: ProgramPlan) => {
    if (savedId && savedPlan === plan) {
      router.push({ pathname: '/athletes/[id]/programs/[programId]', params: { id: athleteId, programId: savedId } });
      return;
    }
    save.mutate(
      { draft: { athleteId, assessmentId: assessment?.id ?? null, plan, preferences, messages }, id: savedId ?? undefined },
      {
        onSuccess: (program) => {
          setSavedId(program.id);
          setSavedPlan(plan);
          router.push({ pathname: '/athletes/[id]/programs/[programId]', params: { id: athleteId, programId: program.id } });
        },
      },
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pb-2" style={{ paddingTop: insets.top + 8 }}>
        <ContentFrame kind="prose">
          <ScreenHeader
            title={t('programs.chat.title')}
            subtitle={[fullName(person), assessment ? t('programs.chat.basedOn', { date: formatShortDate(assessment.completedAt ?? assessment.updatedAt) }) : t('programs.chat.noAssessment')].join(' · ')}
            onBack={() => router.back()}
            backLabel={t('common.back')}
          />
        </ContentFrame>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={KEYBOARD_BEHAVIOR}>
        <ScrollView
          ref={scroll}
          contentContainerClassName="px-4 pb-4 pt-1"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        >
          <ContentFrame kind="prose" className="gap-3">
            <PreferencesPanel value={preferences} onChange={setPreferences} />

            {messages.length === 0 ? (
              <View className="gap-2.5 pt-2">
                <Text className="text-[14px] leading-[20px] text-muted-foreground">{t('programs.chat.intro')}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {SUGGESTIONS.map((key) => (
                    <Pressable
                      key={key}
                      accessibilityRole="button"
                      onPress={() => send(t(`programs.chat.suggestions.${key}`))}
                      className="rounded-full border border-border bg-card px-3.5 py-2 active:opacity-70"
                    >
                      <Text className="text-[13px] font-semibold text-foreground">{t(`programs.chat.suggestions.${key}`)}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {messages.map((message) => (
              <View key={message.id} className="gap-2">
                <Bubble role={message.role} text={message.text} />
                {message.program ? (
                  <ProgramPreview
                    plan={message.program}
                    saving={save.isPending}
                    saved={savedPlan === message.program}
                    onOpen={() => openPlan(message.program!)}
                    onSave={() => savePlan(message.program!)}
                  />
                ) : null}
              </View>
            ))}

            {ask.isPending ? <TypingBubble label={t('programs.chat.thinking')} /> : null}
            {error ? (
              <View className="gap-2 rounded-[18px] border border-destructive/40 bg-card px-3.5 py-3">
                <Text accessibilityRole="alert" className="text-[14px] text-foreground">
                  {error}
                </Text>
                <View className="self-start">
                  <Button variant="outline" icon={RotateCcw} label={t('common.retry')} onPress={() => send(draft)} />
                </View>
              </View>
            ) : null}
            {save.isError ? <Text className="text-[13px] text-destructive">{t('programs.errors.save')}</Text> : null}
          </ContentFrame>
        </ScrollView>

        <View className="border-t border-border bg-surface-bar px-4 pt-2.5" style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
          <ContentFrame kind="prose">
            <Composer value={draft} onChange={setDraft} onSend={(text) => send(text)} disabled={ask.isPending} placeholder={t('programs.chat.placeholder')} />
            <Text className="mt-1 text-center text-[11px] text-muted-foreground">
              {t('programs.chat.dictationHint')}
            </Text>
          </ContentFrame>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
