import { z } from 'zod';

import type { Athlete } from './model';

/**
 * Sporcu formu. Hata mesajları sözlük ANAHTARI olarak durur (DeepSport Atletik kuralı); ekran `t(...)` ile çözer.
 * Sayı alanları metin olarak girilir (virgül de kabul) ve gönderirken sayıya çevrilir.
 */
const optionalNumber = (min: number, max: number) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || (Number.isFinite(toNumber(value)) && toNumber(value) >= min && toNumber(value) <= max), {
      message: 'athleteForm.errors.range',
    });

export function toNumber(value: string): number {
  return Number.parseFloat(value.replace(',', '.'));
}

export const athleteFormSchema = z.object({
  firstName: z.string().trim().min(1, 'athleteForm.errors.firstName'),
  lastName: z.string().trim().min(1, 'athleteForm.errors.lastName'),
  gender: z.enum(['female', 'male']).nullable(),
  birthYear: z
    .string()
    .trim()
    .refine((value) => value === '' || /^(19|20)\d{2}$/.test(value), { message: 'athleteForm.errors.birthYear' }),
  heightCm: optionalNumber(100, 230),
  weightKg: optionalNumber(25, 250),
  phone: z.string().trim(),
  email: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\S+@\S+\.\S+$/.test(value), { message: 'athleteForm.errors.email' }),
  note: z.string(),
});

export type AthleteFormValues = z.infer<typeof athleteFormSchema>;

export const EMPTY_ATHLETE_FORM: AthleteFormValues = {
  firstName: '',
  lastName: '',
  gender: null,
  birthYear: '',
  heightCm: '',
  weightKg: '',
  phone: '',
  email: '',
  note: '',
};

export function formFromAthlete(athlete: Athlete): AthleteFormValues {
  return {
    firstName: athlete.firstName,
    lastName: athlete.lastName,
    gender: athlete.gender,
    birthYear: athlete.birthYear ? String(athlete.birthYear) : '',
    heightCm: athlete.heightCm ? String(athlete.heightCm) : '',
    weightKg: athlete.weightKg ? String(athlete.weightKg) : '',
    phone: athlete.phone,
    email: athlete.email,
    note: athlete.note,
  };
}

const numberOrNull = (value: string) => (value.trim() === '' ? null : toNumber(value));

export type AthleteFields = Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'>;

export function fieldsFromForm(values: AthleteFormValues): AthleteFields {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    gender: values.gender,
    birthYear: values.birthYear ? Number.parseInt(values.birthYear, 10) : null,
    heightCm: numberOrNull(values.heightCm),
    weightKg: numberOrNull(values.weightKg),
    phone: values.phone.trim(),
    email: values.email.trim(),
    note: values.note.trim(),
  };
}
