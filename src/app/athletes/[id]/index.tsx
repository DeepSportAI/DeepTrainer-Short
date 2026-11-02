import { useLocalSearchParams, useRouter } from 'expo-router';
import { ClipboardPlus, FileText, MessageSquarePlus, Pencil, Play } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { StackTabBar } from '@/components/ui/floating-tab-bar';
import { MenuRow } from '@/components/ui/menu-row';
import { Text } from '@/components/ui/text';
import { analysisView } from '@/features/assessment/analysis';
import { AnalysisTab } from '@/features/assessment/components/analysis-tab';
import { HistoryTab } from '@/features/assessment/components/history-tab';
import { lastActivityAt, type Assessment } from '@/features/assessment/model';
import { useStartAssessment } from '@/features/assessment/mutations';
import { useAthleteAssessments } from '@/features/assessment/queries';
import { recommendNext } from '@/features/assessment/recommend';
import { AthleteHeader, PillTabs } from '@/features/athletes/components/athlete-header';
import { ageOf, bmiOf, fullName, initials } from '@/features/athletes/model';
import { useAthlete } from '@/features/athletes/queries';
import { ProgramsTab } from '@/features/programs/components/programs-tab';
import { useAthletePrograms } from '@/features/programs/queries';
import { ReportSheet } from '@/features/reports/components/report-sheet';
import { useShareAssessmentReport } from '@/features/reports/use-reports';
import { formatAgo } from '@/lib/format/ago';
import { formatShortDate } from '@/lib/format/date';
import { formatDecimal } from '@/lib/format/quantity';
import { CONTENT_MAX } from '@/lib/layout/breakpoints';
import { useTabBarPosition } from '@/lib/layout/use-layout';
import { useColorTokens } from '@/lib/theme/tokens';

type Tab = 'analysis' | 'history' | 'programs';

/**
 * Sporcunun analiz sayfası (ana sayfadaki karttan açılır; Kamil, 2 Kasım 2026: "ana sayfadan tıkla detaya git, detay
 * analiz ekranından teste git"). Rota üç özelliği birleştirir: sporcu (üst kart), değerlendirme (Analiz, Geçmiş),
 * program (Programlar) ve rapor (PDF).
 */
export default function AthleteDetailRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarShown = useTabBarPosition() === 'bottom';
  const { id, tab: initialTab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const athleteId = id ?? '';
  const [tab, setTab] = useState<Tab>(initialTab === 'programs' || initialTab === 'history' ? initialTab : 'analysis');
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [interactive] = useColorTokens(['interactive']);

  const athlete = useAthlete(athleteId);
  const assessments = useAthleteAssessments(athleteId);
  const programs = useAthletePrograms(athleteId);
  const start = useStartAssessment();
  const report = useShareAssessmentReport();

  const view = useMemo(
    () => analysisView(assessments.data ?? [], athlete.data?.gender ?? null),
    [assessments.data, athlete.data?.gender],
  );

  if (!athlete.data) {
    return (
      <View className="flex-1 items-center justify-center bg-background" style={{ paddingTop: insets.top }}>
        {athlete.isPending ? (
          <ActivityIndicator />
        ) : (
          <View className="items-center gap-3 px-6">
            <Text className="text-center text-[15px] text-foreground">{t('athleteDetail.notFound')}</Text>
            <Button shape="pill" variant="outline" label={t('common.back')} onPress={() => router.back()} />
          </View>
        )}
      </View>
    );
  }

  const person = athlete.data;
  const latestMeasure = view.measurements[view.measurements.length - 1];
  const weight = latestMeasure?.weightKg ?? person.weightKg;
  const bmi = bmiOf(weight, latestMeasure?.heightCm ?? person.heightCm);
  const age = ageOf(person);
  const lines = [
    [person.gender ? t(`athleteForm.gender.${person.gender}`) : null, age ? t('athletes.card.age', { age }) : null].filter(Boolean).join(' · '),
    [person.heightCm ? `${person.heightCm} ${t('units.cm')}` : null, weight ? `${formatDecimal(weight, 1)} ${t('units.kg')}` : null].filter(Boolean).join(' · '),
  ];

  const openSession = (session: Assessment) =>
    router.push({ pathname: '/athletes/[id]/session/[sessionId]', params: { id: athleteId, sessionId: session.id } });

  function continueSession(session: Assessment) {
    const next = recommendNext(session);
    router.push(
      next
        ? { pathname: '/athletes/[id]/session/[sessionId]/[step]', params: { id: athleteId, sessionId: session.id, step: next.step } }
        : { pathname: '/athletes/[id]/session/[sessionId]/result', params: { id: athleteId, sessionId: session.id } },
    );
  }

  function startNew() {
    start.mutate(athleteId, { onSuccess: (session) => openSession(session) });
  }

  function takeTest() {
    if (view.open) continueSession(view.open);
    else startNew();
  }

  const createProgram = () => router.push({ pathname: '/athletes/[id]/programs/chat', params: { id: athleteId } });
  const latestProgram = programs.data?.[0] ?? null;
  const reportSession = view.latest;

  function menu(action: () => void) {
    setMenuOpen(false);
    // iOS kapanan sayfanın üstüne yenisini açamıyor; Android'de hemen.
    setTimeout(action, Platform.OS === 'ios' ? 350 : 0);
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: tabBarShown ? 24 : insets.bottom + 32, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full self-center" style={{ maxWidth: CONTENT_MAX.prose }}>
          <AthleteHeader
            name={fullName(person)}
            initials={initials(person)}
            lines={lines}
            stats={[
              { value: String(view.sessions.length), label: t('athleteDetail.stats.tests') },
              {
                value: view.sessions[0] ? formatAgo(lastActivityAt(view.sessions[0])) : '—',
                label: t('athleteDetail.stats.lastTest'),
                word: true,
              },
              { value: bmi ? formatDecimal(bmi, 1) : '—', label: t('common.bmi') },
              {
                value: latestMeasure?.waistCm ? formatDecimal(latestMeasure.waistCm, 0) : '—',
                unit: latestMeasure?.waistCm ? t('units.cm') : undefined,
                label: t('athleteDetail.stats.waist'),
              },
            ]}
            onBack={() => router.back()}
            onMore={() => setMenuOpen(true)}
            primary={{
              label: view.open ? t('athleteDetail.continueTest') : t('athleteDetail.takeTest'),
              icon: <Play size={18} color={interactive} strokeWidth={2} />,
              onPress: takeTest,
            }}
            secondary={{
              label: t('athleteDetail.createProgram'),
              icon: <MessageSquarePlus size={18} color={interactive} strokeWidth={2} />,
              onPress: createProgram,
            }}
          />

          <View className="mt-3">
            <PillTabs
              tabs={[
                { value: 'analysis', label: t('athleteDetail.tabs.analysis') },
                { value: 'history', label: t('athleteDetail.tabs.history') },
                { value: 'programs', label: t('athleteDetail.tabs.programs') },
              ]}
              value={tab}
              onChange={setTab}
            />
          </View>

          <View className="mt-3">
            {assessments.isPending ? (
              <View className="py-10">
                <ActivityIndicator />
              </View>
            ) : tab === 'analysis' ? (
              <AnalysisTab
                view={view}
                heightCm={person.heightCm}
                onContinue={continueSession}
                onStart={startNew}
                onOpenResult={(session) =>
                  router.push({ pathname: '/athletes/[id]/session/[sessionId]/result', params: { id: athleteId, sessionId: session.id } })
                }
                onReport={() => setReportOpen(true)}
              />
            ) : tab === 'history' ? (
              <HistoryTab sessions={view.sessions} onOpen={openSession} onStart={startNew} />
            ) : (
              <ProgramsTab
                programs={programs.data ?? []}
                onOpen={(program) =>
                  router.push({ pathname: '/athletes/[id]/programs/[programId]', params: { id: athleteId, programId: program.id } })
                }
                onCreate={createProgram}
              />
            )}
          </View>
        </View>
      </ScrollView>

      <StackTabBar />

      <BottomSheet visible={menuOpen} onClose={() => setMenuOpen(false)} variant="panel" title={fullName(person)} closeLabel={t('common.close')}>
        <MenuRow icon={<Pencil size={20} color={interactive} strokeWidth={2} />} text={t('athleteDetail.menu.edit')} chevron onPress={() => menu(() => router.push({ pathname: '/athletes/[id]/edit', params: { id: athleteId } }))} />
        <MenuRow icon={<ClipboardPlus size={20} color={interactive} strokeWidth={2} />} text={t('athleteDetail.menu.newSession')} description={t('athleteDetail.menu.newSessionHint')} onPress={() => menu(startNew)} />
        <MenuRow
          icon={<FileText size={20} color={interactive} strokeWidth={2} />}
          text={t('athleteDetail.menu.report')}
          disabled={!reportSession}
          description={reportSession ? undefined : t('athleteDetail.menu.reportDisabled')}
          onPress={() => menu(() => setReportOpen(true))}
        />
      </BottomSheet>

      {reportSession ? (
        <ReportSheet
          visible={reportOpen}
          sessionLabel={t('report.sheet.session', { date: formatShortDate(lastActivityAt(reportSession)) })}
          hasPhotos={Boolean(reportSession.measurements?.photoFront || reportSession.measurements?.photoSide)}
          programTitle={latestProgram?.plan.title ?? null}
          pending={report.isPending}
          error={report.isError ? t('report.sheet.error') : null}
          onClose={() => setReportOpen(false)}
          onCreate={({ includePhotos, includeProgram }) =>
            report.mutate(
              { athlete: person, assessment: reportSession, includePhotos, program: includeProgram ? (latestProgram?.plan ?? null) : null },
              { onSuccess: () => setReportOpen(false) },
            )
          }
        />
      ) : null}
    </View>
  );
}
