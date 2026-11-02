#!/usr/bin/env node
/**
 * Sözlük denetimi (DeepSport Atletik'teki `verify:i18n`in kısası):
 *  1) tr.json ve en.json aynı anahtar kümesini taşır;
 *  2) kodda geçen her düz anahtar (`t('a.b')`) sözlükte vardır;
 *  3) şablonlu anahtarlar (`t(\`a.${x}.b\`)`) en az bir anahtarla eşleşir.
 * Çoğul anahtarlar (`_one` / `_other`) taban adıyla sayılır.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const load = (lang) => JSON.parse(readFileSync(join(root, `src/lib/i18n/locales/${lang}.json`), 'utf8'));

function flatten(obj, prefix = '', out = new Set()) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, path, out);
    else out.add(path.replace(/_(zero|one|two|few|many|other)$/, ''));
  }
  return out;
}

const tr = flatten(load('tr'));
const en = flatten(load('en'));
let failures = 0;
for (const key of tr) if (!en.has(key)) { console.error(`en eksik: ${key}`); failures++; }
for (const key of en) if (!tr.has(key)) { console.error(`tr eksik: ${key}`); failures++; }

// Nesne/dizi döndüren anahtarlar (returnObjects) ve ara düğümler de kabul edilir.
const nodes = new Set();
for (const key of tr) {
  const parts = key.split('.');
  for (let i = 1; i < parts.length; i++) nodes.add(parts.slice(0, i).join('.'));
}

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const literal = /\bt\(\s*['"]([a-zA-Z][\w.]*)['"]/g;
const template = /\bt\(\s*`([^`]+)`/g;
for (const file of files(join(root, 'src'))) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(literal)) {
    const key = match[1];
    if (!key.includes('.')) continue;
    if (!tr.has(key) && !nodes.has(key)) { console.error(`${file.replace(root, '')}: sözlükte yok: ${key}`); failures++; }
  }
  for (const match of source.matchAll(template)) {
    const raw = match[1];
    if (!raw.includes('${')) {
      if (!tr.has(raw) && !nodes.has(raw)) { console.error(`${file.replace(root, '')}: sözlükte yok: ${raw}`); failures++; }
      continue;
    }
    const pattern = new RegExp(`^${raw.split(/\$\{[^}]+\}/).map((part) => part.replace(/[.*+?^()|[\]\\]/g, '\\$&')).join('[\\w]+')}$`);
    if (![...tr].some((key) => pattern.test(key))) { console.error(`${file.replace(root, '')}: eşleşen anahtar yok: ${raw}`); failures++; }
  }
}

if (failures > 0) {
  console.error(`\n${failures} sorun`);
  process.exit(1);
}
console.log(`i18n tamam: ${tr.size} anahtar (tr = en)`);
