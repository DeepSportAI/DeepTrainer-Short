import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type { Assessment } from '@/features/assessment/model';
import { assessmentRepository } from '@/features/assessment/repository';
import { fullName, type Athlete } from '@/features/athletes/model';
import { goalView } from '@/features/goals/model';
import { goalRepository } from '@/features/goals/repository';
import type { ProgramPlan } from '@/features/programs/schema';
import { useCoachStore } from '@/features/settings/coach-store';
import { dateToIsoDay } from '@/lib/format/iso-day';
import { photoDataUri } from '@/lib/files/photos';

import { buildAssessmentReportHtml } from './assessment-report';
import { buildProgramReportHtml } from './program-report';
import { fileSafe, sharePdf } from './share';

/**
 * Analiz raporu: HTML kurulur, PDF'e basılır, paylaşım sayfası açılır. Fotoğraflar yalnız seçilirse gömülür. Önceki
 * oturumlar (karşılaştırma, gelişim grafikleri) ve hedefler depodan burada okunur; çağıranlar yalnız oturumu verir.
 */
export function useShareAssessmentReport() {
  const { t, i18n } = useTranslation();
  const coachName = useCoachStore((s) => s.coachName);
  const organization = useCoachStore((s) => s.organization);
  return useMutation({
    mutationFn: async ({
      athlete,
      assessment,
      includePhotos,
      program,
    }: {
      athlete: Athlete;
      assessment: Assessment;
      includePhotos: boolean;
      program: ProgramPlan | null;
    }) => {
      const m = assessment.measurements;
      const photos = includePhotos && m
        ? {
            front: m.photoFront ? await photoDataUri(m.photoFront) : null,
            side: m.photoSide ? await photoDataUri(m.photoSide) : null,
          }
        : null;
      const [sessions, goals] = await Promise.all([
        assessmentRepository.listForAthlete(athlete.id),
        goalRepository.listForAthlete(athlete.id),
      ]);
      const now = Date.now();
      const html = buildAssessmentReportHtml({
        t,
        lang: i18n.language,
        athlete,
        assessment,
        sessions,
        goals: goals.map((goal) => goalView(goal, sessions, now)),
        now,
        coach: { coachName, organization },
        photos,
        program,
        exerciseName: (id) => t(`exercises.items.${id}.name`),
      });
      const day = dateToIsoDay(new Date(assessment.completedAt ?? assessment.updatedAt));
      await sharePdf(html, `${fileSafe(fullName(athlete))}-${fileSafe(t('report.fileSuffix'))}-${day}`, t('report.shareTitle'));
    },
  });
}

export function useShareProgramReport() {
  const { t, i18n } = useTranslation();
  const coachName = useCoachStore((s) => s.coachName);
  const organization = useCoachStore((s) => s.organization);
  return useMutation({
    mutationFn: async ({ athlete, plan, updatedAt }: { athlete: Athlete; plan: ProgramPlan; updatedAt: number }) => {
      const html = buildProgramReportHtml({
        t,
        lang: i18n.language,
        athlete,
        plan,
        updatedAt,
        coach: { coachName, organization },
        exerciseName: (id) => t(`exercises.items.${id}.name`),
      });
      await sharePdf(html, `${fileSafe(fullName(athlete))}-${fileSafe(t('report.program.fileSuffix'))}`, t('report.shareTitle'));
    },
  });
}
