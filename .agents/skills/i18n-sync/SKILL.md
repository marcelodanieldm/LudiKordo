---
name: i18n-sync
description: Add, change or translate LudiKordo texts so en, es and pt-BR stay in sync and follow the glossary. Use when adding UI strings, when check:i18n fails, or when asked to translate or review translations.
---

# Sincronizar traducciones

Archivos: `src/i18n/locales/en.json`, `es.json`, `pt.json`. Glosario: `src/i18n/GLOSSARY.md`.

1. Corre `npm run check:i18n` para ver claves faltantes o sobrantes por idioma.
2. Para cada clave nueva:
   - Escribe la versión en español (tuteo, neutro), después inglés y portugués de Brasil.
   - Mismas variables `{{...}}` en los 3.
   - Plurales de i18next con sufijos `_one` / `_other` en los 3 idiomas.
   - Términos del glosario (en portugués, «casa» para el espacio entre trastes).
3. Nunca dejes un texto en otro idioma como relleno ni una cadena vacía.
4. Busca textos escritos directamente en componentes: `grep -rnE ">[A-Za-zÁÉÍÓÚáéíóúñ ]{3,}<" app src/components`. Muévelos a claves.
5. Verifica con `npm run check:i18n` y `npm test`.
