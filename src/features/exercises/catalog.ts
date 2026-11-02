/**
 * Hareket kataloğu — sistematik yapı (Kamil, 2 Kasım 2026): her hareketin kısa tanıtımı, çalıştırdığı bölgeler ve
 * zorluğu (kolay · orta · zor) VAR; video varsa videolu gösterilir, yoksa tanıtım + bölgeler + zorluk yeter.
 *
 * Kimlikler DeepSport Atletik'in egzersiz kataloğuyla AYNI (enum biçimi); videolar da aynı yerde:
 * `${EXERCISE_MEDIA_BASE}/<ID>.mp4` (CloudFront). `video: true` olanların adresleri 2 Kasım 2026'da tek tek
 * denendi (79/79 yanıt 200). Atletik kataloğunda olmayan hareketler (Goblet Squat, Burpee, kürek ergometresi…)
 * videosuz; video yüklenince yalnız bayrak açılır.
 *
 * Görünen ad ve tanıtım sözlükte: `exercises.items.<ID>.name` / `.description` (tr + en). Program asistanı da bu
 * listeden seçer (`features/programs/prompt.ts`); katalog dışı bir hareket önerirse tanıtımı onun yazdığıdır.
 */

export const EXERCISE_MEDIA_BASE = 'https://d3sf4c7ysb9z1m.cloudfront.net/exercise/athletic';

export type Region =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'obliques'
  | 'lowerBack'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'adductors'
  | 'calves'
  | 'hips'
  | 'thoracic'
  | 'fullBody'
  | 'cardio';

export const REGIONS: readonly Region[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'core',
  'obliques',
  'lowerBack',
  'glutes',
  'quads',
  'hamstrings',
  'adductors',
  'calves',
  'hips',
  'thoracic',
  'fullBody',
  'cardio',
];

export type Difficulty = 'easy' | 'medium' | 'hard';
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];

export type Equipment =
  | 'bodyweight'
  | 'dumbbell'
  | 'kettlebell'
  | 'barbell'
  | 'band'
  | 'bench'
  | 'box'
  | 'mat'
  | 'foamRoller'
  | 'medBall'
  | 'machine'
  | 'pullUpBar';

export const EQUIPMENT: readonly Equipment[] = [
  'bodyweight',
  'dumbbell',
  'kettlebell',
  'barbell',
  'band',
  'bench',
  'box',
  'mat',
  'foamRoller',
  'medBall',
  'machine',
  'pullUpBar',
];

export type ExerciseCategory = 'lowerBody' | 'upperBody' | 'core' | 'conditioning' | 'mobility';
export const EXERCISE_CATEGORIES: readonly ExerciseCategory[] = ['lowerBody', 'upperBody', 'core', 'conditioning', 'mobility'];

export type Exercise = {
  id: string;
  category: ExerciseCategory;
  regions: readonly Region[];
  difficulty: Difficulty;
  equipment: readonly Equipment[];
  /** CloudFront'ta `<ID>.mp4` var mı. */
  video: boolean;
};

type Row = [id: string, category: ExerciseCategory, regions: Region[], difficulty: Difficulty, equipment: Equipment[], video: boolean];

const ROWS: Row[] = [
  // Alt vücut
  ['AIR_SQUAT', 'lowerBody', ['quads', 'glutes', 'core'], 'easy', ['bodyweight'], true],
  ['SQUAT', 'lowerBody', ['quads', 'glutes'], 'easy', ['bodyweight'], true],
  ['SUMO_SQUAT', 'lowerBody', ['adductors', 'glutes', 'quads'], 'easy', ['bodyweight'], true],
  ['GOBLET_SQUAT', 'lowerBody', ['quads', 'glutes', 'core'], 'medium', ['dumbbell', 'kettlebell'], false],
  ['FRONT_SQUAT_WITH_DUMBBELL', 'lowerBody', ['quads', 'glutes', 'core'], 'medium', ['dumbbell'], true],
  ['BACK_SQUAT_WITH_BAR', 'lowerBody', ['quads', 'glutes', 'lowerBack'], 'hard', ['barbell'], true],
  ['BULGARIAN_SPLIT_SQUAT', 'lowerBody', ['quads', 'glutes'], 'medium', ['bench', 'dumbbell'], true],
  ['BACK_LUNGE', 'lowerBody', ['glutes', 'quads'], 'easy', ['bodyweight'], true],
  ['FORWARD_LUNGE', 'lowerBody', ['quads', 'glutes'], 'easy', ['bodyweight'], true],
  ['LATERAL_LUNGE', 'lowerBody', ['adductors', 'glutes', 'quads'], 'medium', ['bodyweight'], true],
  ['WALKING_LUNGE_WITH_MED_BALL', 'lowerBody', ['quads', 'glutes', 'core'], 'medium', ['medBall'], true],
  ['STEP_UP', 'lowerBody', ['quads', 'glutes'], 'easy', ['box'], false],
  ['SINGLE_LEG_SQUAT_WITH_STEP', 'lowerBody', ['quads', 'glutes'], 'hard', ['box'], true],
  ['HIP_HINGE_DRILL', 'lowerBody', ['hamstrings', 'glutes'], 'easy', ['bodyweight'], false],
  ['GOOD_MORNING', 'lowerBody', ['hamstrings', 'glutes', 'lowerBack'], 'easy', ['bodyweight'], true],
  ['DUMBBELL_ROMANIAN_DEADLIFT', 'lowerBody', ['hamstrings', 'glutes', 'lowerBack'], 'medium', ['dumbbell'], false],
  ['SINGLE_ARM_KETTLEBELL_DEADLIFT', 'lowerBody', ['hamstrings', 'glutes', 'core'], 'medium', ['kettlebell'], true],
  ['DEADLIFT_WITH_BAR', 'lowerBody', ['hamstrings', 'glutes', 'lowerBack', 'back'], 'hard', ['barbell'], true],
  ['HIP_BRIDGE', 'lowerBody', ['glutes', 'hamstrings'], 'easy', ['mat'], true],
  ['HIP_THRUST_WITH_BENCH', 'lowerBody', ['glutes', 'hamstrings'], 'medium', ['bench'], true],
  ['HIP_THRUST_WITH_BAR', 'lowerBody', ['glutes', 'hamstrings'], 'hard', ['barbell', 'bench'], true],
  ['CALF_RAISES', 'lowerBody', ['calves'], 'easy', ['bodyweight'], true],
  ['WALL_SIT', 'lowerBody', ['quads', 'glutes'], 'easy', ['bodyweight'], true],
  ['CLAMSHELL_WITH_MINIBAND', 'lowerBody', ['glutes', 'hips'], 'easy', ['band'], true],
  ['SIDE_WALK_WITH_BAND', 'lowerBody', ['glutes', 'hips'], 'easy', ['band'], true],
  ['DONKEY_KICKS', 'lowerBody', ['glutes'], 'easy', ['mat'], true],

  // Üst vücut
  ['WALL_PUSH_UP', 'upperBody', ['chest', 'triceps', 'shoulders'], 'easy', ['bodyweight'], true],
  ['INCLINE_PUSH_UP', 'upperBody', ['chest', 'triceps', 'shoulders'], 'easy', ['bench'], false],
  ['NEGATIVE_PUSH_UP', 'upperBody', ['chest', 'triceps'], 'easy', ['bodyweight'], true],
  ['PUSH_UP', 'upperBody', ['chest', 'triceps', 'shoulders', 'core'], 'medium', ['bodyweight'], true],
  ['PIKE_PUSH_UP', 'upperBody', ['shoulders', 'triceps'], 'hard', ['bodyweight'], true],
  ['DUMBBELL_CHEST_PRESS_WITH_BENCH', 'upperBody', ['chest', 'triceps', 'shoulders'], 'medium', ['dumbbell', 'bench'], true],
  ['BENCH_PRESS_WITH_BAR', 'upperBody', ['chest', 'triceps', 'shoulders'], 'hard', ['barbell', 'bench'], true],
  ['DUMBBELL_BENT_OVER_ROW', 'upperBody', ['back', 'biceps', 'shoulders'], 'medium', ['dumbbell'], true],
  ['KETTLEBELL_SEESAW_ROW', 'upperBody', ['back', 'biceps'], 'medium', ['kettlebell'], true],
  ['RENEGADE_ROW_WITH_DUMBBELL', 'upperBody', ['back', 'core', 'shoulders'], 'hard', ['dumbbell'], true],
  ['SEATED_90_ROW_WITH_BAND', 'upperBody', ['back', 'biceps'], 'easy', ['band'], true],
  ['BANDED_LAT_PULLDOWN', 'upperBody', ['back', 'biceps'], 'easy', ['band'], true],
  ['BAND_ASSISTED_PULL_UP', 'upperBody', ['back', 'biceps'], 'hard', ['pullUpBar', 'band'], false],
  ['DEAD_HANG', 'upperBody', ['back', 'shoulders'], 'easy', ['pullUpBar'], false],
  ['BAND_PULL_APART', 'upperBody', ['back', 'shoulders'], 'easy', ['band'], true],
  ['REVERSE_FLY', 'upperBody', ['back', 'shoulders'], 'easy', ['dumbbell'], true],
  ['WALL_ANGEL', 'upperBody', ['back', 'shoulders', 'thoracic'], 'easy', ['bodyweight'], true],
  ['SHOULDER_PRESS', 'upperBody', ['shoulders', 'triceps'], 'medium', ['dumbbell'], true],
  ['SHOULDER_LATERAL_RAISE_WITH_DUMBBELL', 'upperBody', ['shoulders'], 'easy', ['dumbbell'], true],
  ['BICEPS_CURL', 'upperBody', ['biceps'], 'easy', ['dumbbell'], true],
  ['TRICEPS_DIPS', 'upperBody', ['triceps', 'chest', 'shoulders'], 'medium', ['bench'], true],
  ['SINGLE_ARM_DUMBBELL_OVERHEAD_TRICEP_EXTENSION', 'upperBody', ['triceps'], 'easy', ['dumbbell'], true],

  // Core
  ['PLANK', 'core', ['core', 'shoulders'], 'easy', ['mat'], true],
  ['SIDE_PLANK', 'core', ['obliques', 'core'], 'medium', ['mat'], true],
  ['CONTRALATERAL_DEADBUG_ONE_SIDE', 'core', ['core', 'lowerBack'], 'easy', ['mat'], true],
  ['BIRD_DOG', 'core', ['core', 'lowerBack', 'glutes'], 'easy', ['mat'], true],
  ['CRUNCH', 'core', ['core'], 'easy', ['mat'], true],
  ['SUPERMAN', 'core', ['lowerBack', 'glutes', 'back'], 'easy', ['mat'], true],
  ['REVERSE_CRUNCH', 'core', ['core'], 'medium', ['mat'], true],
  ['BICYCLE', 'core', ['obliques', 'core'], 'medium', ['mat'], true],
  ['RUSSIAN_TWIST', 'core', ['obliques', 'core'], 'medium', ['bodyweight'], true],
  ['MOUNTAIN_CLIMBER', 'core', ['core', 'shoulders', 'cardio'], 'medium', ['bodyweight'], true],
  ['SHOULDER_TAPS', 'core', ['core', 'shoulders'], 'medium', ['bodyweight'], true],
  ['STAND_WOODCHOP', 'core', ['obliques', 'core', 'shoulders'], 'medium', ['band'], true],
  ['FARMER_CARRY', 'core', ['core', 'back', 'fullBody'], 'easy', ['dumbbell', 'kettlebell'], false],
  ['OVERHEAD_CARRY_DUMBBELL_WALKING', 'core', ['shoulders', 'core'], 'medium', ['dumbbell'], true],
  ['BEAR_CRAWL', 'core', ['core', 'shoulders', 'fullBody'], 'medium', ['bodyweight'], false],
  ['HOLLOW_BODY_HOLD', 'core', ['core'], 'hard', ['mat'], true],
  ['LYING_DOUBLE_LEG_RAISE', 'core', ['core'], 'hard', ['mat'], true],
  ['PLANK_TO_PUSH_UP', 'core', ['core', 'chest', 'triceps', 'shoulders'], 'hard', ['bodyweight'], true],
  ['PLANK_DUMBBELL_PULL_THROUGH', 'core', ['core', 'obliques', 'shoulders'], 'hard', ['dumbbell'], true],
  ['TURKISH_GET_UP_WITH_DUMBBELL', 'core', ['fullBody', 'shoulders', 'core'], 'hard', ['dumbbell'], true],

  // Kondisyon
  ['JUMPING_JACK', 'conditioning', ['cardio', 'fullBody'], 'easy', ['bodyweight'], true],
  ['HIGH_KNEE_RUN', 'conditioning', ['cardio', 'quads', 'core'], 'easy', ['bodyweight'], true],
  ['ROW_ERG', 'conditioning', ['cardio', 'back', 'fullBody'], 'medium', ['machine'], false],
  ['SKI_ERG', 'conditioning', ['cardio', 'back', 'shoulders'], 'medium', ['machine'], false],
  ['BURPEE_WITHOUT_PUSH_UP', 'conditioning', ['fullBody', 'cardio'], 'medium', ['bodyweight'], true],
  ['JUMPING_SQUAT', 'conditioning', ['quads', 'glutes', 'cardio'], 'medium', ['bodyweight'], true],
  ['KETTLEBELL_SWING', 'conditioning', ['glutes', 'hamstrings', 'core', 'cardio'], 'medium', ['kettlebell'], true],
  ['FRONT_SQUAT_TO_SHOULDER_PRESS', 'conditioning', ['fullBody', 'quads', 'shoulders'], 'medium', ['dumbbell'], true],
  ['BURPEE', 'conditioning', ['fullBody', 'cardio'], 'hard', ['bodyweight'], false],
  ['JUMP_LUNGE', 'conditioning', ['quads', 'glutes', 'cardio'], 'hard', ['bodyweight'], true],
  ['DUMBBELL_HANG_POWER_CLEAN_AND_PUSH_PRESS', 'conditioning', ['fullBody', 'shoulders', 'glutes'], 'hard', ['dumbbell'], true],

  // Mobilite
  ['ARM_CIRCLE', 'mobility', ['shoulders'], 'easy', ['bodyweight'], true],
  ['OVERHEAD_REACH', 'mobility', ['shoulders', 'thoracic', 'core'], 'easy', ['bodyweight'], false],
  ['CAT_CAMEL', 'mobility', ['thoracic', 'lowerBack'], 'easy', ['mat'], true],
  ['OPEN_BOOK', 'mobility', ['thoracic', 'chest'], 'easy', ['mat'], true],
  ['QUADRUPED_THORACIC_ROTATION', 'mobility', ['thoracic'], 'easy', ['mat'], true],
  ['THORACIC_EXTENSION_FOAM_ROLLER', 'mobility', ['thoracic', 'back'], 'easy', ['foamRoller'], true],
  ['INCH_WORM', 'mobility', ['hamstrings', 'shoulders', 'core'], 'easy', ['bodyweight'], true],
  ['HAMSTRING_FLOW', 'mobility', ['hamstrings'], 'easy', ['bodyweight'], true],
  ['HIP_FLEXOR_STRETCH', 'mobility', ['hips', 'quads'], 'easy', ['mat'], true],
  ['HIP_90_90_FORWARD_REACHING', 'mobility', ['hips', 'glutes'], 'easy', ['mat'], true],
  ['WORLD_GREATEST_STRETCH', 'mobility', ['hips', 'thoracic', 'hamstrings'], 'easy', ['bodyweight'], false],
  ['CHILD_POSE_STRETCH', 'mobility', ['lowerBack', 'back'], 'easy', ['mat'], true],
  ['DOWNWARD_TO_COBRA', 'mobility', ['hamstrings', 'calves', 'core', 'lowerBack'], 'easy', ['mat'], true],
  ['PIGEON_HIP_ROTATOR_STRETCH', 'mobility', ['hips', 'glutes'], 'medium', ['mat'], true],
];

export const EXERCISES: readonly Exercise[] = ROWS.map(([id, category, regions, difficulty, equipment, video]) => ({
  id,
  category,
  regions,
  difficulty,
  equipment,
  video,
}));

const BY_ID = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]));

export function getExercise(id: string | null | undefined): Exercise | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function exerciseVideoUrl(exercise: Exercise | undefined): string | null {
  return exercise?.video ? `${EXERCISE_MEDIA_BASE}/${exercise.id}.mp4` : null;
}

/** Zorluk merdiveni: çubuk sayısı (1–3) ve rengi (`level-*` token'ı: kolay yeşil, orta sarı, zor turuncu-kırmızı). */
export const DIFFICULTY_STEPS: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };

export type ExerciseFilter = {
  query: string;
  category: ExerciseCategory | null;
  difficulty: Difficulty | null;
  region: Region | null;
  videoOnly: boolean;
};

/** Kütüphane süzgeci — ad araması çağıranın çevirdiği adla yapılır (dil bağımsız kalsın). */
export function filterExercises(
  list: readonly Exercise[],
  filter: ExerciseFilter,
  nameOf: (id: string) => string,
): Exercise[] {
  const needle = filter.query.trim().toLocaleLowerCase('tr');
  return list.filter(
    (exercise) =>
      (!filter.category || exercise.category === filter.category) &&
      (!filter.difficulty || exercise.difficulty === filter.difficulty) &&
      (!filter.region || exercise.regions.includes(filter.region)) &&
      (!filter.videoOnly || exercise.video) &&
      (needle === '' || nameOf(exercise.id).toLocaleLowerCase('tr').includes(needle)),
  );
}
