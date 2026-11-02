import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useConfirmSheet } from '@/components/ui/confirm-sheet';
import { AthleteForm } from '@/features/athletes/components/athlete-form';
import { fullName } from '@/features/athletes/model';
import { useDeleteAthlete, useUpdateAthlete } from '@/features/athletes/mutations';
import { useAthlete } from '@/features/athletes/queries';
import { fieldsFromForm, formFromAthlete } from '@/features/athletes/schema';

export default function EditAthleteRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const athlete = useAthlete(id ?? '');
  const update = useUpdateAthlete(id ?? '');
  const remove = useDeleteAthlete();
  const confirm = useConfirmSheet();

  if (!athlete.data) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }
  const name = fullName(athlete.data);

  return (
    <>
      <AthleteForm
        title={t('athleteForm.editTitle')}
        subtitle={name}
        initial={formFromAthlete(athlete.data)}
        submitLabel={t('common.save')}
        pending={update.isPending}
        error={update.isError ? t('athleteForm.errors.save') : null}
        onBack={() => router.back()}
        onSubmit={(values) => update.mutate(fieldsFromForm(values), { onSuccess: () => router.back() })}
        footerExtra={
          <Button
            shape="pill"
            variant="destructiveOutline"
            label={t('athleteForm.delete')}
            onPress={() =>
              confirm.ask({
                title: t('athleteForm.deleteConfirm.title'),
                description: t('athleteForm.deleteConfirm.description', { name }),
                confirmLabel: t('athleteForm.delete'),
                cancelLabel: t('common.cancel'),
                destructive: true,
                onConfirm: () => remove.mutate(id ?? '', { onSuccess: () => router.dismissTo('/') }),
              })
            }
          />
        }
      />
      {confirm.sheet}
    </>
  );
}
