---
trigger: model_decision
description: Apply when the task mentions releases, versions, deploy, Google Play, EAS, tags, store listing or CI/CD workflows.
---

# Versiones y deploy

- El deploy es solo por GitHub Actions. Un agente prepara el PR de versión (skill `release-prep`); una persona hace merge y crea el tag `vX.Y.Z`.
- El tag dispara `release.yml`: build de producción en EAS y envío a la pista interna de Google Play. La promoción a prueba cerrada o a producción es `promote.yml`, manual y con aprobación del entorno `play-production`.
- `versionCode` lo maneja EAS (`appVersionSource: remote`); solo se cambia `expo.version` en `app.json`.
- Nunca correr `eas build`, `eas submit`, `git tag` ni editar `.github/workflows/` o `eas.json` sin pedido explícito.
- Notas de la versión en `release-notes/vX.Y.Z/{en-US,es-419,pt-BR}.txt`, máximo 500 caracteres.
