import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AthleteForm } from '@/features/athletes/components/athlete-form';
import { useCreateAthlete } from '@/features/athletes/mutations';
import { EMPTY_ATHLETE_FORM, fieldsFromForm } from '@/features/athletes/schema';

/** Yeni sporcu → kaydedince doğrudan analiz sayfası (oradan "Test al"). */
export default function NewAthleteRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const create = useCreateAthlete();

  return (
    <AthleteForm
      title={t('athleteForm.newTitle')}
      subtitle={t('athleteForm.newSubtitle')}
      initial={EMPTY_ATHLETE_FORM}
      submitLabel={t('athleteForm.create')}
      pending={create.isPending}
      error={create.isError ? t('athleteForm.errors.save') : null}
      onBack={() => router.back()}
      onSubmit={(values) =>
        create.mutate(fieldsFromForm(values), {
          onSuccess: (athlete) => router.replace({ pathname: '/athletes/[id]', params: { id: athlete.id } }),
        })
      }
    />
  );
}
