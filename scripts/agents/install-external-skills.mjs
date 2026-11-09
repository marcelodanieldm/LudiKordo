#!/usr/bin/env node
/**
 * Instala o actualiza las skills de terceros listadas en .agents/external-skills.json.
 * Las copia a .agents/skills/<nombre>, fija el commit en .agents/external-skills.lock.json
 * y sincroniza la copia de Claude Code (.claude/skills).
 *
 *   node scripts/agents/install-external-skills.mjs                     # las no opcionales
 *   node scripts/agents/install-external-skills.mjs --include-optional
 *   node scripts/agents/install-external-skills.mjs --only expo-router,expo-module
 *
 * Revisa el diff antes de commitear: una skill es texto que el agente obedece.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const manifestPath = join(root, '.agents/external-skills.json');
const lockPath = join(root, '.agents/external-skills.lock.json');
const args = process.argv.slice(2);
const includeOptional = args.includes('--include-optional');
const onlyArg = args.find((a) => a.startsWith('--only'));
const only = onlyArg ? (onlyArg.includes('=') ? onlyArg.split('=')[1] : args[args.indexOf(onlyArg) + 1]).split(',') : null;

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const lock = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, 'utf8')) : { skills: {} };

const wanted = manifest.skills.filter((s) => (only ? only.includes(s.name) : includeOptional || !s.optional));
if (!wanted.length) {
  console.error('Nada para instalar (revisa --only).');
  process.exit(1);
}

const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const byRepo = new Map();
for (const s of wanted) byRepo.set(s.repo, [...(byRepo.get(s.repo) ?? []), s]);

let ok = 0;
for (const [repo, skills] of byRepo) {
  const dir = mkdtempSync(join(tmpdir(), 'ext-skill-'));
  try {
    git(dir, 'clone', '--depth', '1', '--filter=blob:none', '--sparse', repo, 'src');
    const src = join(dir, 'src');
    git(src, 'sparse-checkout', 'set', ...skills.map((s) => s.path));
    const commit = git(src, 'rev-parse', 'HEAD');
    for (const s of skills) {
      const from = join(src, s.path);
      if (!existsSync(join(from, 'SKILL.md'))) {
        console.error(`✗ ${s.name}: no encontré ${s.path}/SKILL.md en ${repo} (¿cambió la ruta upstream?)`);
        continue;
      }
      const to = join(root, '.agents/skills', s.name);
      rmSync(to, { recursive: true, force: true });
      cpSync(from, to, { recursive: true });
      lock.skills[s.name] = { repo, path: s.path, commit, installedAt: new Date().toISOString().slice(0, 10) };
      console.log(`✓ ${s.name} @ ${commit.slice(0, 7)}`);
      ok++;
    }
  } catch (e) {
    console.error(`✗ ${repo}: ${String(e.stderr || e.message).trim()}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
execFileSync(process.execPath, [join(root, 'scripts/agents/sync-skills.mjs')], { stdio: 'inherit' });
console.log(`\n${ok} de ${wanted.length} skills instaladas. Revisa \`git diff .agents/skills\` antes de commitear.`);
process.exit(ok === wanted.length ? 0 : 1);
