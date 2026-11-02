import type { TFunction } from 'i18next';

import { fullName, type Athlete } from '@/features/athletes/model';
import { getExercise } from '@/features/exercises/catalog';
import type { ProgramPlan } from '@/features/programs/schema';
import { formatShortDate } from '@/lib/format/date';

import { esc, shell } from './html';

/**
 * Antrenman programı (PDF) — sporcuya giden programın çıktısı. Her hareket: ad, bölüm, set × tekrar, dinlenme, ipucu;
 * katalogdaki hareketlerde tanıtım kataloğun, dışındakilerde asistanın yazdığı.
 */
export function programSection(t: TFunction, plan: ProgramPlan, exerciseName: (id: string) => string): string {
  const days = plan.days
    .map(
      (day, index) => `<div class="day card">
        <h3>${esc(t('report.program.day', { number: index + 1 }))} · ${esc(day.title)}</h3>
        <div class="muted">${esc(day.focus)}</div>
        <table style="margin-top:6px"><tr><th>${esc(t('report.program.exercise'))}</th><th>${esc(t('report.program.dose'))}</th><th>${esc(t('report.program.rest'))}</th></tr>
        ${day.exercises
          .map((exercise) => {
            const catalog = getExercise(exercise.catalogId);
            const name = catalog ? exerciseName(catalog.id) : exercise.name;
            const dose = [exercise.sets ? `${exercise.sets} ×` : '', exercise.reps ?? ''].join(' ').trim() || '—';
            return `<tr>
              <td><span class="section-tag">${esc(t(`programs.sections.${exercise.section}`))}</span> <b>${esc(name)}</b>
                <div class="muted">${esc(exercise.description)}</div>
                ${exercise.cue ? `<div><i>${esc(exercise.cue)}</i></div>` : ''}
                <div>${exercise.regions.map((region) => `<span class="pill">${esc(t(`exercises.regions.${region}`))}</span>`).join('')}<span class="pill">${esc(t(`exercises.difficulty.${exercise.difficulty}`))}</span></div>
              </td>
              <td style="width:18%"><b>${esc(dose)}</b></td>
              <td style="width:14%">${exercise.restSeconds ? esc(t('report.program.restValue', { seconds: exercise.restSeconds })) : '—'}</td>
            </tr>`;
          })
          .join('')}
        </table></div>`,
    )
    .join('');

  return `<h2>${esc(t('report.program.title'))}: ${esc(plan.title)}</h2>
    <div class="grid">
      <div class="stat"><div class="label">${esc(t('report.program.frequency'))}</div><div class="value">${esc(t('report.program.perWeek', { count: plan.daysPerWeek }))}</div></div>
      <div class="stat"><div class="label">${esc(t('report.program.length'))}</div><div class="value">${esc(t('report.program.minutes', { count: plan.sessionMinutes }))}</div></div>
      <div class="stat"><div class="label">${esc(t('report.program.duration'))}</div><div class="value">${esc(t('report.program.weeks', { count: plan.weeks }))}</div></div>
    </div>
    <div class="card">${esc(plan.summary)}</div>
    ${days}
    <div class="card"><b>${esc(t('report.program.progression'))}</b><div>${esc(plan.progression)}</div></div>
    ${plan.cautions.length ? `<div class="card"><b>${esc(t('report.program.cautions'))}</b><ul style="margin:4px 0 0 16px;padding:0">${plan.cautions.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></div>` : ''}`;
}

export function buildProgramReportHtml({
  t,
  lang,
  athlete,
  plan,
  updatedAt,
  coach,
  exerciseName,
}: {
  t: TFunction;
  lang: string;
  athlete: Athlete;
  plan: ProgramPlan;
  updatedAt: number;
  coach: { coachName: string; organization: string };
  exerciseName: (id: string) => string;
}): string {
  const body = `
    <div class="band">
      <div><div class="brand">DeepTrainer<span>${esc(t('report.program.badge'))}</span></div><div style="font-size:10px;opacity:.85">${esc(coach.organization)}</div></div>
      <div class="meta">${esc(t('report.date', { date: formatShortDate(updatedAt) }))}<br/>${esc(coach.coachName ? t('report.coach', { name: coach.coachName }) : '')}</div>
    </div>
    <div style="margin-top:14px"><h1>${esc(fullName(athlete))}</h1></div>
    ${programSection(t, plan, exerciseName)}
    <div class="footer">${esc(t('report.footer', { coach: coach.coachName || t('report.yourCoach') }))}</div>`;
  return shell({ title: `${fullName(athlete)} — ${plan.title}`, lang, body });
}
