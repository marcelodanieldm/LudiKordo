---
name: release-prep
description: Prepare a LudiKordo release PR - semver bump, CHANGELOG, Google Play release notes in three languages. Use when asked to prepare, plan or cut a release. Does not build, tag or publish.
---

# Preparar una versión

El agente prepara; una persona crea el tag y GitHub Actions construye y envía a Google Play.

1. Último tag: `git fetch --tags && git describe --tags --abbrev=0` (si no hay, la versión de `app.json`).
2. Cambios: `git log <tag>..origin/main --pretty='%s'`. Clasifica por tipo de Conventional Commit.
3. Versión: algún `feat` → sube el minor; solo `fix` → sube el patch. `BREAKING CHANGE` antes de 1.0 → minor.
4. Rama `cc/release-vX.Y.Z` (o `ag/…`):
   - `app.json` → `expo.version` = `X.Y.Z`. No toques `versionCode`: EAS lo incrementa (`appVersionSource: remote`).
   - `CHANGELOG.md`: nueva sección arriba con la fecha y los cambios agrupados (Nuevo, Arreglos, Contenido).
   - `release-notes/vX.Y.Z/en-US.txt`, `es-419.txt`, `pt-BR.txt`: máximo 500 caracteres, en lenguaje de usuario, sin jerga técnica.
5. PR `chore(release): vX.Y.Z` con esta lista:
   - [ ] CI en verde
   - [ ] Probado en el build de preview (etiqueta `build:preview`) en un teléfono y una tablet
   - [ ] Notas de la versión revisadas en los 3 idiomas
   - [ ] Después del merge: crear el tag `vX.Y.Z` sobre `main` (lo hace una persona)
