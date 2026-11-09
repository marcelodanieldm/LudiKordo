#!/usr/bin/env node
/**
 * Hook Stop de Claude Code: antes de que Claude dé por terminado un turno con
 * cambios en el código, corre las pruebas y los tipos. Si fallan, sale con 2 y
 * Claude sigue trabajando con el error a la vista.
 * Evita bucles: si el hook ya bloqueó una vez en esta cadena (stop_hook_active), deja terminar.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
let event = {};
try {
  event = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  // sin entrada: seguir
}
if (event.stop_hook_active) process.exit(0);

let changed = '';
try {
  changed = execSync('git status --porcelain', { cwd: root, encoding: 'utf8' });
} catch {
  process.exit(0);
}
const touchesCode = changed
  .split('\n')
  .map((l) => l.slice(3))
  .some((p) => /^(app|src|modules|tests|scripts)\//.test(p));
if (!touchesCode) process.exit(0);

const run = (cmd) => {
  try {
    execSync(cmd, { cwd: root, stdio: 'pipe', encoding: 'utf8', timeout: 240000 });
    return null;
  } catch (e) {
    const out = `${e.stdout ?? ''}\n${e.stderr ?? ''}`.trim().split('\n');
    // Para pruebas TAP, mostrar desde el primer fallo; si no, el final de la salida.
    const firstFail = out.findIndex((l) => /^\s*not ok /.test(l));
    const shown = firstFail >= 0 ? out.slice(firstFail, firstFail + 30) : out.slice(-40);
    return `$ ${cmd}\n${shown.join('\n')}`;
  }
};

const failures = [run('npm test --silent'), run('npm run --silent typecheck'), run('node scripts/check-i18n.mjs')].filter(Boolean);
if (failures.length) {
  process.stderr.write(`Hay cambios en el código y la verificación falla. Corrígelo antes de terminar:\n\n${failures.join('\n\n')}\n`);
  process.exit(2);
}
process.exit(0);
