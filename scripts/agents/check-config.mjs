#!/usr/bin/env node
/**
 * Valida la configuración de agentes para que ninguna herramienta la ignore en silencio:
 * - .agents/rules/*.md: frontmatter con trigger válido (Antigravity descarta las reglas sin él),
 *   description si es model_decision, globs si es glob, menos de 24.000 bytes.
 * - AGENTS.md: existe y no es enorme (se inyecta en cada turno).
 * - .agents/skills/<x>/SKILL.md y .claude/agents/*.md: name y description.
 * - .agents/workflows/*.md: description.
 * - .claude/settings.json: JSON válido.
 * - .claude/skills sincronizado con .agents/skills.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const errors = [];
const TRIGGERS = ['always_on', 'model_decision', 'glob', 'manual'];

function frontmatter(file) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return fm;
}

const mdIn = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => join(dir, f)) : []);

// AGENTS.md
const agentsMd = join(root, 'AGENTS.md');
if (!existsSync(agentsMd)) errors.push('Falta AGENTS.md');
else if (statSync(agentsMd).size > 16000) errors.push('AGENTS.md supera 16 KB: muévelo a reglas con trigger model_decision o glob');

// Reglas de Antigravity
for (const f of mdIn(join(root, '.agents/rules'))) {
  const fm = frontmatter(f);
  const name = f.slice(root.length);
  if (!fm) errors.push(`${name}: sin frontmatter (Antigravity la descartaría)`);
  else {
    if (!TRIGGERS.includes(fm.trigger)) errors.push(`${name}: trigger inválido "${fm.trigger}" (usa ${TRIGGERS.join(' | ')})`);
    if (fm.trigger === 'model_decision' && !fm.description) errors.push(`${name}: model_decision necesita description`);
    if (fm.trigger === 'glob' && !fm.globs) errors.push(`${name}: glob necesita globs`);
  }
  if (statSync(f).size > 24000) errors.push(`${name}: supera 24.000 bytes`);
}

// Workflows de Antigravity
for (const f of mdIn(join(root, '.agents/workflows'))) {
  const fm = frontmatter(f);
  if (!fm?.description) errors.push(`${f.slice(root.length)}: falta description en el frontmatter`);
}

// Skills compartidas
const skillsDir = join(root, '.agents/skills');
for (const d of existsSync(skillsDir) ? readdirSync(skillsDir) : []) {
  const f = join(skillsDir, d, 'SKILL.md');
  if (!existsSync(f)) {
    errors.push(`.agents/skills/${d}: falta SKILL.md`);
    continue;
  }
  const fm = frontmatter(f);
  if (!fm?.description) errors.push(`.agents/skills/${d}/SKILL.md: falta description`);
  if (fm?.name && fm.name !== d) errors.push(`.agents/skills/${d}/SKILL.md: name "${fm.name}" distinto de la carpeta`);
}

// Subagentes de Claude Code
for (const f of mdIn(join(root, '.claude/agents'))) {
  const fm = frontmatter(f);
  if (!fm?.name || !fm?.description) errors.push(`${f.slice(root.length)}: faltan name o description`);
}

// settings.json
try {
  JSON.parse(readFileSync(join(root, '.claude/settings.json'), 'utf8'));
} catch (e) {
  errors.push(`.claude/settings.json inválido: ${e.message}`);
}

// Configuración de MCPs compartida: JSON válido y forma esperada por cada herramienta.
const MCP_FILES = [
  ['.mcp.json', 'url'],
  ['.agents/mcp_config.json', 'serverUrl'],
];
for (const [rel, remoteKey] of MCP_FILES) {
  const f = join(root, rel);
  if (!existsSync(f)) continue;
  try {
    const cfg = JSON.parse(readFileSync(f, 'utf8'));
    for (const [name, s] of Object.entries(cfg.mcpServers ?? {})) {
      const remote = s.url ?? s.serverUrl;
      if (remote && !(remoteKey in s)) errors.push(`${rel}: "${name}" usa la clave equivocada para servidores remotos (debe ser ${remoteKey})`);
      if (!remote && !s.command) errors.push(`${rel}: "${name}" no tiene ni ${remoteKey} ni command`);
    }
  } catch (e) {
    errors.push(`${rel} inválido: ${e.message}`);
  }
}

// Ningún secreto en archivos de configuración de agentes ni en la memoria.
const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /sk_[A-Za-z0-9]{20,}/,
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /AIza[0-9A-Za-z_-]{30,}/,
  /Bearer\s+(?!\$|<|\{)[A-Za-z0-9._-]{20,}/,
  /"(?:api[_-]?key|token|secret)"\s*:\s*"(?!\$|<|\{)[^"]{12,}"/i,
];
function walkFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walkFiles(p) : [p];
  });
}
const scan = ['.mcp.json', '.agents', '.claude', 'docs/memory', 'assets/audio/VOICES.md', 'AGENTS.md', 'CLAUDE.md']
  .map((p) => join(root, p))
  .flatMap((p) => (existsSync(p) && statSync(p).isDirectory() ? walkFiles(p) : existsSync(p) ? [p] : []))
  .filter((p) => /\.(json|md|ya?ml|txt)$/.test(p));
for (const f of scan) {
  const text = readFileSync(f, 'utf8');
  if (SECRET_PATTERNS.some((re) => re.test(text))) errors.push(`${f.slice(root.length)}: parece contener un secreto. Usa variables de entorno.`);
}

// Skills externas: lo instalado coincide con el lockfile.
const lockFile = join(root, '.agents/external-skills.lock.json');
if (existsSync(lockFile)) {
  try {
    const lock = JSON.parse(readFileSync(lockFile, 'utf8'));
    for (const name of Object.keys(lock.skills ?? {})) {
      if (!existsSync(join(root, '.agents/skills', name, 'SKILL.md'))) errors.push(`external-skills.lock.json lista ${name} pero no está en .agents/skills`);
    }
  } catch (e) {
    errors.push(`.agents/external-skills.lock.json inválido: ${e.message}`);
  }
}

// Sincronización de skills
try {
  execFileSync(process.execPath, [join(root, 'scripts/agents/sync-skills.mjs'), '--check'], { stdio: 'pipe' });
} catch (e) {
  errors.push(String(e.stderr || e.message).trim());
}

if (errors.length) {
  console.error('Configuración de agentes con problemas:\n  ' + errors.join('\n  '));
  process.exit(1);
}
console.log('Configuración de agentes OK.');
