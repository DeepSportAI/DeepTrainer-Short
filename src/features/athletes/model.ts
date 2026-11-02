/**
 * Sporcu kaydı — antrenörün eklediği kişi. Sporcuya uygulama verilmez (Kamil, 2 Kasım 2026): sporcu analizini PDF
 * olarak görür; bu yüzden kayıtta giriş bilgisi yok, iletişim alanları yalnız raporu göndermek için.
 */
export type Gender = 'female' | 'male';
export const GENDERS: readonly Gender[] = ['female', 'male'];

export type Athlete = {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender | null;
  birthYear: number | null;
  heightCm: number | null;
  /** Kayıttaki kilo; ölçüm adımı her testte güncel kiloyu ayrıca tutar. */
  weightKg: number | null;
  phone: string;
  email: string;
  note: string;
  createdAt: number;
  updatedAt: number;
};

export function fullName(athlete: Pick<Athlete, 'firstName' | 'lastName'>): string {
  return `${athlete.firstName} ${athlete.lastName}`.trim();
}

export function initials(athlete: Pick<Athlete, 'firstName' | 'lastName'>): string {
  const first = athlete.firstName.trim()[0] ?? '';
  const last = athlete.lastName.trim()[0] ?? '';
  return `${first}${last}`.toLocaleUpperCase('tr') || '?';
}

export function ageOf(athlete: Pick<Athlete, 'birthYear'>, now: number = Date.now()): number | null {
  if (!athlete.birthYear) return null;
  const age = new Date(now).getFullYear() - athlete.birthYear;
  return age > 0 && age < 120 ? age : null;
}

/** VKİ (kg / m²). Boy ya da kilo yoksa null. */
export function bmiOf(weightKg: number | null | undefined, heightCm: number | null | undefined): number | null {
  if (!weightKg || !heightCm) return null;
  const meters = heightCm / 100;
  return weightKg / (meters * meters);
}

/** Ad aramasında Türkçe büyük-küçük harf duyarsız eşleşme. */
export function matchesQuery(athlete: Athlete, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase('tr');
  if (!needle) return true;
  return fullName(athlete).toLocaleLowerCase('tr').includes(needle);
}
