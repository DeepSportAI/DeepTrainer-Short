import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, HeartPulse, ImagePlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Text } from '@/components/ui/text';
import { deletePhoto, persistPhoto } from '@/lib/files/photos';
import { useHeartRate } from '@/lib/heart-rate/store';
import { newId } from '@/lib/id';
import { useColorTokens } from '@/lib/theme/tokens';

import type { Measurements } from '../model';
import type { ShellProps } from './intro-step';
import { StepSection, StepShell } from './step-shell';

function parseNumber(text: string): number | null {
  if (!text.trim()) return null;
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * 27–30 dk · Ölçüm: kilo, bel çevresi, foto (ön / yan). Boy sporcu kaydından gelir (değiştirilebilir); saat bağlıysa
 * dinlenik nabız tek dokunuşla alınır. Fotoğraflar cihazda kalır; rapora ancak antrenör seçerse girer.
 */
export function MeasurementsStep({
  shell,
  initial,
  heightCm,
  saving,
  onSave,
  onSkip,
}: {
  shell: ShellProps;
  initial: Measurements | null;
  heightCm: number | null;
  saving: boolean;
  onSave: (measurements: Measurements) => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();
  const [interactive] = useColorTokens(['interactive']);
  const [weight, setWeight] = useState(initial?.weightKg ? String(initial.weightKg) : '');
  const [waist, setWaist] = useState(initial?.waistCm ? String(initial.waistCm) : '');
  const [height, setHeight] = useState(initial?.heightCm ? String(initial.heightCm) : heightCm ? String(heightCm) : '');
  const [restingHr, setRestingHr] = useState(initial?.restingHr ? String(initial.restingHr) : '');
  const [front, setFront] = useState<string | null>(initial?.photoFront ?? null);
  const [side, setSide] = useState<string | null>(initial?.photoSide ?? null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const bpm = useHeartRate((s) => (s.status === 'connected' ? s.bpm : null));

  async function pick(slot: 'front' | 'side', source: 'camera' | 'library') {
    setPhotoError(null);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setPhotoError(t('assessment.measurements.photoPermission'));
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, allowsEditing: false };
      const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets[0]) return;
      const stored = await persistPhoto(result.assets[0].uri, newId(slot));
      if (slot === 'front') {
        if (front && front !== initial?.photoFront) deletePhoto(front);
        setFront(stored);
      } else {
        if (side && side !== initial?.photoSide) deletePhoto(side);
        setSide(stored);
      }
    } catch {
      setPhotoError(t('assessment.measurements.photoError'));
    }
  }

  const invalid = [weight, waist, height, restingHr].some((value) => value.trim() !== '' && parseNumber(value) === null);

  return (
    <StepShell
      {...shell}
      footer={
        <View className="gap-1">
          <Button
            shape="pill"
            glow
            label={t('assessment.step.saveAndNext')}
            loading={saving}
            disabled={invalid}
            onPress={() =>
              onSave({
                weightKg: parseNumber(weight),
                waistCm: parseNumber(waist),
                heightCm: parseNumber(height),
                restingHr: parseNumber(restingHr),
                photoFront: front,
                photoSide: side,
                completedAt: Date.now(),
              })
            }
          />
          <Button variant="text" label={t('assessment.step.skip')} onPress={onSkip} disabled={saving} />
        </View>
      }
    >
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field variant="plain" label={t('assessment.measurements.weight')} placeholder="72,5" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} adornment={<Unit text={t('units.kg')} />} />
        </View>
        <View className="flex-1">
          <Field variant="plain" label={t('assessment.measurements.waist')} placeholder="84" keyboardType="decimal-pad" value={waist} onChangeText={setWaist} adornment={<Unit text={t('units.cm')} />} />
        </View>
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Field variant="plain" label={t('assessment.measurements.height')} placeholder="170" keyboardType="decimal-pad" value={height} onChangeText={setHeight} adornment={<Unit text={t('units.cm')} />} />
        </View>
        <View className="flex-1">
          <Field
            variant="plain"
            label={t('assessment.measurements.restingHr')}
            labelAside={t('common.optional')}
            placeholder="68"
            keyboardType="number-pad"
            value={restingHr}
            onChangeText={setRestingHr}
            adornment={
              bpm ? (
                <Pressable accessibilityRole="button" accessibilityLabel={t('assessment.measurements.fromWatch')} onPress={() => setRestingHr(String(bpm))} hitSlop={6} className="flex-row items-center gap-1 rounded-full bg-interactive/10 px-2 py-1 active:opacity-70">
                  <HeartPulse size={14} color={interactive} strokeWidth={2.2} />
                  <Text className="text-[12px] font-bold text-interactive">{bpm}</Text>
                </Pressable>
              ) : (
                <Unit text={t('units.bpm')} />
              )
            }
          />
        </View>
      </View>
      {invalid ? <Text className="text-[12px] text-destructive">{t('assessment.metric.invalid')}</Text> : null}

      <StepSection title={t('assessment.measurements.photos')} aside={t('assessment.measurements.photosHint')}>
        <View className="flex-row gap-3">
          <PhotoSlot label={t('assessment.measurements.front')} uri={front} onCamera={() => void pick('front', 'camera')} onLibrary={() => void pick('front', 'library')} onRemove={() => setFront(null)} />
          <PhotoSlot label={t('assessment.measurements.side')} uri={side} onCamera={() => void pick('side', 'camera')} onLibrary={() => void pick('side', 'library')} onRemove={() => setSide(null)} />
        </View>
        {photoError ? <Text accessibilityRole="alert" className="text-[12px] text-destructive">{photoError}</Text> : null}
      </StepSection>
    </StepShell>
  );
}

function Unit({ text }: { text: string }) {
  return <Text className="pr-2 text-[13px] font-semibold text-muted-foreground">{text}</Text>;
}

function PhotoSlot({
  label,
  uri,
  onCamera,
  onLibrary,
  onRemove,
}: {
  label: string;
  uri: string | null;
  onCamera: () => void;
  onLibrary: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const [interactive, foreground] = useColorTokens(['interactive', 'foreground']);
  return (
    <View className="flex-1 gap-1.5">
      <Text className="text-[13px] font-semibold text-foreground">{label}</Text>
      <View className="overflow-hidden rounded-[18px] border border-border bg-card" style={{ aspectRatio: 3 / 4 }}>
        {uri ? (
          <>
            <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityLabel={label} />
            <Pressable accessibilityRole="button" accessibilityLabel={t('assessment.measurements.removePhoto')} onPress={onRemove} hitSlop={6} className="absolute right-2 top-2 h-9 w-9 items-center justify-center rounded-full bg-card active:opacity-70">
              <X size={16} color={foreground} strokeWidth={2.2} />
            </Pressable>
          </>
        ) : (
          <View className="flex-1 items-center justify-center gap-2 px-2">
            {Platform.OS !== 'web' ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t('assessment.measurements.takePhoto')} onPress={onCamera} className="flex-row items-center gap-1.5 rounded-full border border-border px-3 py-2 active:opacity-70">
                <Camera size={16} color={interactive} strokeWidth={2} />
                <Text className="text-[13px] font-semibold text-foreground">{t('assessment.measurements.takePhoto')}</Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" accessibilityLabel={t('assessment.measurements.choosePhoto')} onPress={onLibrary} className="flex-row items-center gap-1.5 rounded-full border border-border px-3 py-2 active:opacity-70">
              <ImagePlus size={16} color={interactive} strokeWidth={2} />
              <Text className="text-[13px] font-semibold text-foreground">{t('assessment.measurements.choosePhoto')}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
