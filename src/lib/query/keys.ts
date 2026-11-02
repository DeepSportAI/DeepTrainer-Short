/**
 * Sorgu anahtarları TEK yerde: bir özellik başkasının verisini değiştirdiğinde (sporcu silinince testleri ve programları
 * da gider) özelliği içe aktarmadan doğru anahtarı geçersiz kılabilsin.
 */
export const queryKeys = {
  athletes: ['athletes'] as const,
  athlete: (id: string) => ['athletes', id] as const,
  assessments: ['assessments'] as const,
  athleteAssessments: (athleteId: string) => ['assessments', 'athlete', athleteId] as const,
  assessment: (id: string) => ['assessments', 'id', id] as const,
  programs: ['programs'] as const,
  athletePrograms: (athleteId: string) => ['programs', 'athlete', athleteId] as const,
  program: (id: string) => ['programs', 'id', id] as const,
};
