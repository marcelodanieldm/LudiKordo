#!/usr/bin/env node
/**
 * MCPs opcionales: los que necesitan una clave, una app de escritorio abierta
 * o una cuenta paga. No van en .mcp.json ni en .agents/mcp_config.json (que
 * están en git); cada persona los activa en su máquina.
 *
 *   node scripts/agents/mcp-optional.mjs list
 *   node scripts/agents/mcp-optional.mjs add <nombre>     # Claude Code (alcance local) + muestra el bloque para Antigravity
 *
 * Las claves se leen de variables de entorno; nunca se escriben en el repo.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../..', import.meta.url));

const CATALOG = {
  rive: {
    why: 'Editar animaciones de Kordi (state machines, view models, data binding) en el Rive Editor de escritorio.',
    needs: 'Rive desktop abierto (macOS o Windows).',
    http: 'http://127.0.0.1:9791/mcp',
  },
  elevenlabs: {
    why: 'Voces de Kordi en en/es/pt y efectos de sonido para los cartoons.',
    needs: 'uv instalado y ELEVENLABS_API_KEY exportada.',
    stdio: ['uvx', 'elevenlabs-mcp'],
    env: { ELEVENLABS_API_KEY: null, ELEVENLABS_MCP_BASE_PATH: join(root, 'assets/audio/_inbox') },
  },
  nanobanana: {
    why: 'Bocetos, storyboards y variantes de Kordi con consistencia de personaje (Gemini image).',
    needs: 'uv instalado y GEMINI_API_KEY exportada. Servidor comunitario: revisar antes de usar.',
    stdio: ['uvx', 'nanobanana-mcp-server@latest'],
    env: { GEMINI_API_KEY: null },
  },
  revenuecat: {
    why: 'Consultar y configurar productos, permisos y ofertas de RevenueCat.',
    needs: 'Cuenta de RevenueCat (OAuth al conectar). Cambios en precios u ofertas: solo con aprobación humana.',
    http: 'https://mcp.revenuecat.ai/mcp',
  },
  figma: {
    why: 'Traer diseño desde Figma (variables, componentes) si el equipo diseña ahí.',
    needs: 'Asiento Dev o Full de Figma en un plan pago (OAuth al conectar).',
    http: 'https://mcp.figma.com/mcp',
  },
  maestro: {
    why: 'Escribir y correr flujos E2E de Maestro en el emulador desde el agente.',
    needs: 'Maestro CLI instalado (curl -fsSL https://get.maestro.mobile.dev | bash).',
    stdio: ['maestro', 'mcp'],
  },
};

const [cmd, name] = process.argv.slice(2);

if (!cmd || cmd === 'list') {
  for (const [n, s] of Object.entries(CATALOG)) console.log(`${n.padEnd(12)} ${s.why}\n${' '.repeat(13)}Requiere: ${s.needs}`);
  process.exit(0);
}

if (cmd !== 'add' || !CATALOG[name]) {
  console.error(`Uso: mcp-optional.mjs list | add <${Object.keys(CATALOG).join('|')}>`);
  process.exit(1);
}

const s = CATALOG[name];
const env = {};
for (const [k, def] of Object.entries(s.env ?? {})) {
  const v = process.env[k] ?? def;
  if (v == null) {
    console.error(`Falta la variable ${k}. Expórtala en tu shell (no la pongas en el repo) y vuelve a correr.`);
    process.exit(1);
  }
  env[k] = v;
}

// Claude Code, alcance local (queda en ~/.claude.json, no en git).
const claudeArgs = s.http
  ? ['mcp', 'add', '--transport', 'http', name, s.http]
  : ['mcp', 'add', name, ...Object.entries(env).flatMap(([k, v]) => ['-e', `${k}=${v}`]), '--', ...s.stdio];
try {
  execFileSync('claude', claudeArgs, { stdio: 'inherit', cwd: root });
  console.log(`\nClaude Code: "${name}" agregado. Usa /mcp para autenticar si hace falta.`);
} catch {
  const shown = claudeArgs.map((a) => (/\s|=/.test(a) && !a.startsWith('-') ? `"${a.replace(/=.*/, '=…')}"` : a)).join(' ');
  console.log(`No encontré el comando claude. Ejecútalo a mano:\n  claude ${shown}`);
}

// Antigravity: configuración global del usuario (las claves no van al repo).
const agEntry = s.http
  ? { serverUrl: s.http }
  : { command: s.stdio[0], args: s.stdio.slice(1), ...(Object.keys(env).length ? { env: Object.fromEntries(Object.keys(env).map((k) => [k, `<${k}>`])) } : {}) };
console.log(
  `\nAntigravity: agrega esto dentro de "mcpServers" en ~/.gemini/config/mcp_config.json\n(o desde Settings > Customizations > Installed MCP Servers > Open MCP config) y pulsa Refresh:\n` +
    JSON.stringify({ [name]: agEntry }, null, 2),
);
