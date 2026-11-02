import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { MultiChips } from '@/components/ui/multi-chips';
import { NoteField } from '@/components/ui/note-field';
import { Segmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';

import type { IntroAnswers } from '../model';
import { EXPERIENCES, GOALS, PAIN_REGIONS, type Experience, type Goal, type PainRegion } from '../protocol';
import { StepSection, StepShell } from './step-shell';

export type ShellProps = {
  title: string;
  subtitle: string;
  progress: { done: number; total: number };
  onBack: () => void;
  onList: () => void;
};

/**
 * 0–3 dk · Tanışma: daha önce spor yaptın mı · ağrı / sakatlık var mı · hedefin ne (yağ yakımı / kas / kondisyon).
 * Sorular sporcuya sorulur ("sen"); ağrı bölgeleri sonraki testlerde uyarı olarak döner.
 */
export function IntroStep({
  shell,
  initial,
  saving,
  onSave,
}: {
  shell: ShellProps;
  initial: IntroAnswers | null;
  saving: boolean;
  onSave: (intro: IntroAnswers) => void;
}) {
  const { t } = useTranslation();
  const [experience, setExperience] = useState<Experience | null>(initial?.experience ?? null);
  const [experienceNote, setExperienceNote] = useState(initial?.experienceNote ?? '');
  const [pain, setPain] = useState<boolean | null>(initial?.pain ?? null);
  const [painRegions, setPainRegions] = useState<PainRegion[]>(initial?.painRegions ?? []);
  const [painNote, setPainNote] = useState(initial?.painNote ?? '');
  const [goals, setGoals] = useState<Goal[]>(initial?.goals ?? []);
  const [note, setNote] = useState(initial?.note ?? '');

  return (
    <StepShell
      {...shell}
      footer={
        <Button
          shape="pill"
          glow
          label={t('assessment.step.saveAndNext')}
          loading={saving}
          onPress={() =>
            onSave({
              experience,
              experienceNote: experienceNote.trim(),
              pain,
              painRegions: pain ? painRegions : [],
              painNote: pain ? painNote.trim() : '',
              goals,
              note: note.trim(),
              completedAt: Date.now(),
            })
          }
        />
      }
    >
      <Text className="text-[14px] leading-[20px] text-muted-foreground">{t('assessment.intro.lead')}</Text>

      <StepSection title={t('assessment.intro.experience.question')}>
        <ChoiceChips
          label={t('assessment.intro.experience.label')}
          options={EXPERIENCES.map((value) => ({ value, label: t(`assessment.intro.experience.${value}`) }))}
          value={experience ?? undefined}
          onChange={setExperience}
        />
        {experience && experience !== 'none' ? (
          <NoteField label={t('assessment.intro.experience.noteLabel')} value={experienceNote} onChange={setExperienceNote} placeholder={t('assessment.intro.experience.notePlaceholder')} />
        ) : null}
      </StepSection>

      <StepSection title={t('assessment.intro.pain.question')}>
        <Segmented
          shape="pill"
          accessibilityLabel={t('assessment.intro.pain.question')}
          options={[
            { value: 'no', label: t('assessment.intro.pain.no') },
            { value: 'yes', label: t('assessment.intro.pain.yes') },
          ]}
          value={pain === null ? undefined : pain ? 'yes' : 'no'}
          onChange={(value) => setPain(value === 'yes')}
        />
        {pain ? (
          <View className="gap-3">
            <MultiChips
              label={t('assessment.intro.pain.regions')}
              options={PAIN_REGIONS.map((value) => ({ value, label: t(`assessment.painRegions.${value}`) }))}
              value={painRegions}
              onChange={setPainRegions}
            />
            <NoteField label={t('assessment.intro.pain.noteLabel')} value={painNote} onChange={setPainNote} placeholder={t('assessment.intro.pain.notePlaceholder')} />
          </View>
        ) : null}
      </StepSection>

      <StepSection title={t('assessment.intro.goals.question')}>
        <MultiChips options={GOALS.map((value) => ({ value, label: t(`assessment.goals.${value}`) }))} value={goals} onChange={setGoals} />
      </StepSection>

      <NoteField label={t('assessment.intro.note')} value={note} onChange={setNote} placeholder={t('assessment.intro.notePlaceholder')} />
    </StepShell>
  );
}
