#!/usr/bin/env bash
# Configura el repositorio de GitHub para el flujo agéntico: etiquetas, entornos
# de deploy y protección de la rama main. Requiere `gh auth login` con permisos de admin.
#
#   scripts/github/setup-repo.sh                    # repo actual, 0 aprobaciones (desarrollador solo)
#   APPROVALS=1 scripts/github/setup-repo.sh        # equipo: 1 aprobación + dueños de CODEOWNERS
#
# Con APPROVALS=0 los PR igual necesitan CI en verde; la persona hace merge después de revisar.
# GitHub no deja aprobar tus propios PR, y los agentes abren PR con tu cuenta: por eso 0 si trabajas solo.
set -euo pipefail

REPO="${REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
APPROVALS="${APPROVALS:-0}"
echo "Configurando $REPO (aprobaciones requeridas: $APPROVALS)"

# 1. Etiquetas
label() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null; echo "  etiqueta $1"; }
label "agent:antigravity" "4285F4" "Trabajo hecho por Antigravity"
label "agent:claude"      "D97757" "Trabajo hecho por Claude Code"
label "agent:autofix"     "B60205" "Claude intenta arreglar CI una vez (se quita sola)"
label "build:preview"     "0F6E7E" "Genera un APK de prueba en EAS"
label "test:e2e"          "1F5FBF" "Corre las pruebas E2E de Maestro en un emulador"
label "content"           "C2410C" "Lecciones y contenido pedagógico"
label "i18n"              "5319E7" "Traducciones en, es, pt"
label "native"            "1D1B2E" "Módulo nativo y audio"
label "billing"           "FBCA04" "Suscripciones"
label "ui"                "C5DEF5" "Interfaz"
label "feature"           "0E8A16" "Funcionalidad nueva"
label "bug"               "D73A4A" "Error"
label "dependencies"      "EDEDED" "Actualización de dependencias"

# 2. Entornos de deploy
gh api -X PUT "repos/$REPO/environments/play-internal" >/dev/null
echo "  entorno play-internal"
ME=$(gh api user -q .id)
gh api -X PUT "repos/$REPO/environments/play-production" --input - >/dev/null <<JSON
{ "reviewers": [ { "type": "User", "id": $ME } ], "deployment_branch_policy": null }
JSON
echo "  entorno play-production (requiere tu aprobación)"

# 3. Protección de main
CODEOWNERS_REVIEW=false
[ "$APPROVALS" -gt 0 ] && CODEOWNERS_REVIEW=true
gh api -X PUT "repos/$REPO/branches/main/protection" --input - >/dev/null <<JSON
{
  "required_status_checks": { "strict": true, "contexts": ["verify", "agents-config"] },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": $APPROVALS,
    "require_code_owner_reviews": $CODEOWNERS_REVIEW,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
echo "  main protegida: PR obligatorio, checks verify y agents-config, sin force push"

cat <<'TXT'

Falta cargar los secretos (Settings > Secrets and variables > Actions):
  ANTHROPIC_API_KEY                   o CLAUDE_CODE_OAUTH_TOKEN (y cambiar el input en los workflows)
  EXPO_TOKEN                          token de un robot de Expo (expo.dev > Access tokens)
  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON    en el entorno play-production (solo lo usa promote.yml)
Y en EAS, una sola vez: `eas credentials` > Android > Google Service Account (para el envío automático).
Instalar la GitHub App de Claude: https://github.com/apps/claude
TXT
