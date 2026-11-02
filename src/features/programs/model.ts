import { getExercise } from '@/features/exercises/catalog';
import { newId } from '@/lib/id';

import type { ProgramPlan, ProgramPreferences } from './schema';

/** Sohbetteki bir satır. `content` sunucuya giden tam metin (bağlam ve tercihler dahil), `text` ekranda görünen. */
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  content: string;
  program: ProgramPlan | null;
  at: number;
};

/** Kayıtlı program: plan + onu üreten sohbet (sonradan "Sohbetle düzenle" kaldığı yerden sürer). */
export type Program = {
  id: string;
  athleteId: string;
  assessmentId: string | null;
  createdAt: number;
  updatedAt: number;
  plan: ProgramPlan;
  preferences: ProgramPreferences;
  messages: ChatMessage[];
};

/** Katalogda olmayan kimlik null'a çevrilir (yanlış video / tanıtım gösterilmesin). */
export function sanitizePlan(plan: ProgramPlan): ProgramPlan {
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((exercise) => ({
        ...exercise,
        catalogId: getExercise(exercise.catalogId) ? exercise.catalogId : null,
      })),
    })),
  };
}

export function exerciseCount(plan: ProgramPlan): number {
  return plan.days.reduce((sum, day) => sum + day.exercises.length, 0);
}

/** Son asistan yanıtındaki program (sohbetin güncel hâli). */
export function latestPlan(messages: readonly ChatMessage[]): ProgramPlan | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const plan = messages[index].program;
    if (plan) return plan;
  }
  return null;
}

export function chatMessage(role: ChatMessage['role'], text: string, content: string, program: ProgramPlan | null = null): ChatMessage {
  return { id: newId('msg'), role, text, content, program, at: Date.now() };
}
