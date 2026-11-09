#!/usr/bin/env node
/**
 * Hook PostToolUse de Claude Code (Edit|Write|MultiEdit).
 * Recibe el evento como JSON por stdin. Salir con código 2 devuelve el mensaje
 * de stderr a Claude para que lo corrija; 0 = sin objeciones.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const root = fileURLToPath(new URL('../..', import.meta.url));
let event = {};
try {
  event = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0);
}
const file = event?.tool_input?.file_path;
if (!file) process.exit(0);
const rel = relative(root, file).split('\\').join('/');

const fail = (msg) => {
  process.stderr.write(msg + '\n');
  process.exit(2);
};

// Traducciones: paridad de claves inmediata.
if (rel.startsWith('src/i18n/locales/') && rel.endsWith('.json')) {
  try {
    execFileSync(process.execPath, [join(root, 'scripts/check-i18n.mjs')], { stdio: 'pipe' });
  } catch (e) {
    fail(`check:i18n falló después de editar ${rel}:\n${String(e.stderr || e.stdout).trim()}\nAgrega la misma clave en en.json, es.json y pt.json.`);
  }
}

// YIN existe dos veces: recordar la pareja si solo cambió un lado.
const PAIR = {
  'src/music/yin.ts': 'modules/pitch-detector/android/src/main/java/expo/modules/pitchdetector/Yin.kt',
  'modules/pitch-detector/android/src/main/java/expo/modules/pitchdetector/Yin.kt': 'src/music/yin.ts',
};
if (PAIR[rel]) {
  let changed = '';
  try {
    changed = execFileSync('git', ['diff', '--name-only', 'HEAD'], { cwd: root, encoding: 'utf8' });
  } catch {
    process.exit(0);
  }
  if (!changed.split('\n').includes(PAIR[rel])) {
    fail(`Editaste ${rel}. AGENTS.md exige el mismo cambio en ${PAIR[rel]} dentro del mismo PR (paridad de YIN).`);
  }
}

// Skills: se editan en .agents/skills, no en la copia.
if (rel.startsWith('.claude/skills/')) {
  fail(`${rel} es una copia generada. Edita .agents/skills/ y corre \`npm run sync:skills\`.`);
}

process.exit(0);
