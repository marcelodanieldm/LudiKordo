---
description: Prepare a release PR (version, changelog, Google Play notes in three languages). Does not build or publish. Usage /release-prep
---

1. Sigue la skill `release-prep` para calcular la versión y listar los cambios desde el último tag.
2. Crea la rama `ag/release-vX.Y.Z`, actualiza `app.json`, `CHANGELOG.md` y `release-notes/vX.Y.Z/`.
// turbo
3. Corre `npm run verify`.
4. Abre el PR `chore(release): vX.Y.Z` con la lista de verificación de la skill y la etiqueta `build:preview` para que CI genere un APK de prueba.
5. Recuerda en el Walkthrough: después del merge, una persona crea el tag `vX.Y.Z` y GitHub Actions envía el build a la pista interna de Google Play.
