#!/usr/bin/env node
/**
 * Verifica que en.json, es.json y pt.json tengan exactamente las mismas claves,
 * sin textos vacíos y con las mismas variables {{...}} en cada clave.
 * Sin dependencias: lo usan CI, los hooks de Claude Code y las personas.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(fileURLToPath(new URL('..', import.meta.url)), 'src/i18n/locales');
const LOCALES = ['es', 'en', 'pt'];

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object') flatten(v, `${prefix}${k}.`, out);
    else out[`${prefix}${k}`] = v;
  }
  return out;
}

const data = {};
const errors = [];
for (const l of LOCALES) {
  try {
    data[l] = flatten(JSON.parse(readFileSync(join(dir, `${l}.json`), 'utf8')));
  } catch (e) {
    errors.push(`${l}.json no es JSON válido: ${e.message}`);
  }
}

if (!errors.length) {
  const vars = (s) => [...String(s).matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort().join(',');
  const base = data.es;
  for (const l of LOCALES) {
    for (const k of Object.keys(base)) if (!(k in data[l])) errors.push(`${l}: falta ${k}`);
    for (const k of Object.keys(data[l])) {
      if (!(k in base)) errors.push(`${l}: sobra ${k} (no está en es.json)`);
      if (typeof data[l][k] !== 'string' || !data[l][k].trim()) errors.push(`${l}: ${k} está vacío`);
      else if (k in base && vars(data[l][k]) !== vars(base[k])) errors.push(`${l}: ${k} usa variables distintas a es.json`);
    }
  }
}

if (errors.length) {
  console.error(`Traducciones con problemas (${errors.length}):\n  ` + errors.slice(0, 50).join('\n  '));
  process.exit(1);
}
console.log(`Traducciones OK: ${Object.keys(data.es).length} claves en ${LOCALES.join(', ')}.`);
