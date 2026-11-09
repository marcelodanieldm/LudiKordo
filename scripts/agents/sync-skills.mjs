#!/usr/bin/env node
/**
 * Copia las skills compartidas de .agents/skills (fuente, la lee Antigravity)
 * a .claude/skills (la lee Claude Code).
 *
 *   node scripts/agents/sync-skills.mjs          copia
 *   node scripts/agents/sync-skills.mjs --check  falla si están desincronizadas (CI)
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const SRC = join(root, '.agents/skills');
const DST = join(root, '.claude/skills');
const check = process.argv.includes('--check');
const BANNER = '<!-- Generado desde .agents/skills por scripts/agents/sync-skills.mjs. No editar aquí. -->\n';

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/** El banner va después del frontmatter, para no romper el YAML. */
function withBanner(content, file) {
  if (!file.endsWith('.md')) return content;
  const m = content.match(/^---\n[\s\S]*?\n---\n/);
  return m ? m[0] + BANNER + content.slice(m[0].length) : BANNER + content;
}

const expected = new Map(walk(SRC).map((f) => [relative(SRC, f), withBanner(readFileSync(f, 'utf8'), f)]));
const actual = new Map(walk(DST).map((f) => [relative(DST, f), readFileSync(f, 'utf8')]));

if (check) {
  const problems = [];
  for (const [rel, content] of expected) {
    if (!actual.has(rel)) problems.push(`falta .claude/skills/${rel}`);
    else if (actual.get(rel) !== content) problems.push(`difiere .claude/skills/${rel}`);
  }
  for (const rel of actual.keys()) if (!expected.has(rel)) problems.push(`sobra .claude/skills/${rel}`);
  if (problems.length) {
    console.error('Skills desincronizadas. Corre `npm run sync:skills` y commitea el resultado:\n  ' + problems.join('\n  '));
    process.exit(1);
  }
  console.log(`Skills sincronizadas (${expected.size} archivos).`);
} else {
  rmSync(DST, { recursive: true, force: true });
  for (const [rel, content] of expected) {
    const out = join(DST, rel);
    mkdirSync(join(out, '..'), { recursive: true });
    writeFileSync(out, content);
  }
  console.log(`Copiadas ${expected.size} skills a .claude/skills.`);
}
