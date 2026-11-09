#!/usr/bin/env bash
# Crea el repositorio en GitHub, sube el proyecto y lo configura.
# Úsalo una sola vez, desde la carpeta del proyecto, con `gh auth login` hecho.
#
#   scripts/github/publish.sh                       # marcelodanieldm/LudiKordo, público
#   OWNER=otra-cuenta VISIBILITY=private scripts/github/publish.sh
set -euo pipefail

OWNER="${OWNER:-marcelodanieldm}"
NAME="${NAME:-LudiKordo}"
VISIBILITY="${VISIBILITY:-public}"
REPO="$OWNER/$NAME"

cd "$(git rev-parse --show-toplevel)"
gh auth status >/dev/null 2>&1 || { echo "Primero: gh auth login"; exit 1; }

if git remote get-url origin >/dev/null 2>&1; then
  echo "Ya hay un remoto origin: $(git remote get-url origin)"; exit 1
fi
if gh repo view "$REPO" >/dev/null 2>&1; then
  echo "$REPO ya existe; lo conecto y subo main."
  git remote add origin "https://github.com/$REPO.git"
  git push -u origin main
else
  gh repo create "$REPO" "--$VISIBILITY" --source . --remote origin --push \
    --description "App Android para aprender bajo de 4 cuerdas desde cero (EN/ES/PT)"
fi

# Etiquetas, entornos y protección de main (necesita los workflows ya subidos).
REPO="$REPO" scripts/github/setup-repo.sh
echo "Listo: https://github.com/$REPO"
