import { z } from 'zod';

import { REGIONS, type Equipment, type Region } from '@/features/exercises/catalog';

/**
 * Program asistanının çıktısı — sunucu rotası bu şemayı yapılandırılmış çıktı olarak ister
 * (`output_config.format`), uygulama gelen yanıtı yine bu şemayla doğrular. Tek kaynak: alan eklenirse iki taraf
 * birlikte değişir.
 */
export const PLAN_SECTIONS = ['warmup', 'main', 'conditioning', 'cooldown'] as const;
export type PlanSection = (typeof PLAN_SECTIONS)[number];

export const planExerciseSchema = z.object({
  catalogId: z
    .string()
    .nullable()
    .describe('Exact catalog ID when the exercise is from the catalog, otherwise null.'),
  name: z.string(),
  section: z.enum(PLAN_SECTIONS),
  sets: z.number().int().nullable(),
  reps: z.string().nullable().describe('Free text: "10-12", "8 / leg", "30 s", "max".'),
  restSeconds: z.number().int().nullable(),
  cue: z.string().nullable().describe('One short coaching cue.'),
  description: z.string().describe('Short intro of the movement (essential when catalogId is null).'),
  regions: z.array(z.enum(REGIONS as [string, ...string[]])),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export const planDaySchema = z.object({
  title: z.string(),
  focus: z.string(),
  exercises: z.array(planExerciseSchema),
});

export const programPlanSchema = z.object({
  title: z.string(),
  summary: z.string(),
  weeks: z.number().int(),
  daysPerWeek: z.number().int(),
  sessionMinutes: z.number().int(),
  focus: z.array(z.string()),
  days: z.array(planDaySchema),
  progression: z.string(),
  cautions: z.array(z.string()),
});

export const assistantOutputSchema = z.object({
  reply: z.string(),
  program: programPlanSchema.nullable(),
});

/*
 * Tel şeması (sunucu → Claude): yapılandırılmış çıktı enum kısıtını yalnız açıklama olarak taşıyor (SDK `enum`u
 * açıklamaya çeviriyor), yani model listede olmayan bir bölge yazabilir. Bu yüzden istek ESNEK şemayla gider
 * (`assistantWireSchema`), yanıt uygulamaya gitmeden `normalizeOutput` ile katı şemaya indirgenir: bilinmeyen bölge
 * düşer, bilinmeyen zorluk "medium", bilinmeyen bölüm "main" olur.
 */
const wireExerciseSchema = planExerciseSchema.extend({
  section: z.string().describe(`One of: ${PLAN_SECTIONS.join(', ')}.`),
  regions: z.array(z.string()).describe(`Allowed values: ${REGIONS.join(', ')}.`),
  difficulty: z.string().describe('One of: easy, medium, hard.'),
});

export const assistantWireSchema = z.object({
  reply: z.string(),
  program: programPlanSchema
    .extend({ days: z.array(planDaySchema.extend({ exercises: z.array(wireExerciseSchema) })) })
    .nullable(),
});

type WireOutput = z.infer<typeof assistantWireSchema>;

const DIFFICULTY_SET = new Set(['easy', 'medium', 'hard']);

export function normalizeOutput(wire: WireOutput): AssistantOutput {
  if (!wire.program) return { reply: wire.reply, program: null };
  return {
    reply: wire.reply,
    program: {
      ...wire.program,
      days: wire.program.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((exercise) => ({
          ...exercise,
          section: (PLAN_SECTIONS as readonly string[]).includes(exercise.section) ? (exercise.section as PlanSection) : 'main',
          regions: exercise.regions.filter((region): region is Region => (REGIONS as readonly string[]).includes(region)),
          difficulty: DIFFICULTY_SET.has(exercise.difficulty) ? (exercise.difficulty as PlanExercise['difficulty']) : 'medium',
        })),
      })),
    },
  };
}

export type PlanExercise = z.infer<typeof planExerciseSchema>;
export type PlanDay = z.infer<typeof planDaySchema>;
export type ProgramPlan = z.infer<typeof programPlanSchema>;
export type AssistantOutput = z.infer<typeof assistantOutputSchema>;

/* ── Varyasyon (antrenörün istediği biçim) ─────────────────────────────────── */

export type Place = 'gym' | 'home' | 'outdoor';
export const PLACES: readonly Place[] = ['gym', 'home', 'outdoor'];
export const DAYS_PER_WEEK = [2, 3, 4, 5] as const;
export const SESSION_MINUTES = [30, 45, 60, 75] as const;
export const PROGRAM_WEEKS = [4, 6, 8] as const;

export type ProgramPreferences = {
  daysPerWeek: (typeof DAYS_PER_WEEK)[number];
  sessionMinutes: (typeof SESSION_MINUTES)[number];
  weeks: (typeof PROGRAM_WEEKS)[number];
  place: Place;
  equipment: Equipment[];
};

export const DEFAULT_PREFERENCES: ProgramPreferences = {
  daysPerWeek: 3,
  sessionMinutes: 45,
  weeks: 4,
  place: 'gym',
  equipment: ['dumbbell', 'kettlebell', 'band', 'bench', 'mat'],
};

/* ── İstek gövdesi (uygulama → sunucu rotası) ──────────────────────────────── */

export const assistantRequestSchema = z.object({
  locale: z.enum(['tr', 'en']),
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(40_000) }))
    .min(1)
    .max(60),
});

export type AssistantRequest = z.infer<typeof assistantRequestSchema>;
