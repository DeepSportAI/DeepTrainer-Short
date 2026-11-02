import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { Field } from '@/components/ui/field';
import { FormScreen } from '@/components/ui/form-screen';
import { Text } from '@/components/ui/text';

import { GENDERS } from '../model';
import { athleteFormSchema, type AthleteFormValues } from '../schema';

/**
 * Sporcu formu — yeni ve düzenle aynı form. Zorunlu yalnız ad ve soyad; boy / doğum yılı / cinsiyet değerlendirme
 * normlarını ve VKİ'yi besler, iletişim alanları raporu göndermek için.
 */
export function AthleteForm({
  title,
  subtitle,
  initial,
  submitLabel,
  pending,
  error,
  onSubmit,
  onBack,
  footerExtra,
}: {
  title: string;
  subtitle?: string;
  initial: AthleteFormValues;
  submitLabel: string;
  pending: boolean;
  error: string | null;
  onSubmit: (values: AthleteFormValues) => void;
  onBack: () => void;
  footerExtra?: ReactNode;
}) {
  const { t } = useTranslation();
  const { control, handleSubmit, formState } = useForm<AthleteFormValues>({
    resolver: zodResolver(athleteFormSchema),
    defaultValues: initial,
  });
  const message = (key: keyof AthleteFormValues) => {
    const value = formState.errors[key]?.message;
    return value ? t(value) : undefined;
  };

  return (
    <FormScreen
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      backLabel={t('common.back')}
      footer={
        <View className="gap-2.5">
          <Button shape="pill" glow label={submitLabel} loading={pending} onPress={handleSubmit(onSubmit)} />
          {footerExtra}
        </View>
      }
    >
      <View className="gap-4">
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Controller
              control={control}
              name="firstName"
              render={({ field }) => (
                <Field variant="plain" label={t('athleteForm.firstName')} required value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={message('firstName')} autoCapitalize="words" />
              )}
            />
          </View>
          <View className="flex-1">
            <Controller
              control={control}
              name="lastName"
              render={({ field }) => (
                <Field variant="plain" label={t('athleteForm.lastName')} required value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={message('lastName')} autoCapitalize="words" />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <ChoiceChips
              label={t('athleteForm.genderLabel')}
              options={GENDERS.map((value) => ({ value, label: t(`athleteForm.gender.${value}`) }))}
              value={field.value ?? undefined}
              onChange={field.onChange}
            />
          )}
        />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Controller
              control={control}
              name="birthYear"
              render={({ field }) => (
                <Field variant="plain" label={t('athleteForm.birthYear')} placeholder="1995" keyboardType="number-pad" maxLength={4} value={field.value} onChangeText={field.onChange} error={message('birthYear')} />
              )}
            />
          </View>
          <View className="flex-1">
            <Controller
              control={control}
              name="heightCm"
              render={({ field }) => (
                <Field variant="plain" label={t('athleteForm.height')} placeholder="170" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} error={message('heightCm')} />
              )}
            />
          </View>
          <View className="flex-1">
            <Controller
              control={control}
              name="weightKg"
              render={({ field }) => (
                <Field variant="plain" label={t('athleteForm.weight')} placeholder="70" keyboardType="decimal-pad" value={field.value} onChangeText={field.onChange} error={message('weightKg')} />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <Field variant="plain" label={t('athleteForm.phone')} labelAside={t('common.optional')} keyboardType="phone-pad" value={field.value} onChangeText={field.onChange} />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Field variant="plain" label={t('athleteForm.email')} labelAside={t('common.optional')} keyboardType="email-address" autoCapitalize="none" value={field.value} onChangeText={field.onChange} error={message('email')} />
          )}
        />
        <Controller
          control={control}
          name="note"
          render={({ field }) => (
            <Field variant="plain" label={t('athleteForm.note')} labelAside={t('common.optional')} multiline value={field.value} onChangeText={field.onChange} placeholder={t('athleteForm.notePlaceholder')} />
          )}
        />

        {error ? (
          <Text accessibilityRole="alert" className="text-[13px] text-destructive">
            {error}
          </Text>
        ) : null}
      </View>
    </FormScreen>
  );
}
