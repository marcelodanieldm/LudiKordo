# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versiones: semver. Lo mantiene la skill `release-prep`.

## [Sin publicar]

## [0.2.0] — 2026-11-18

Primera versión en APK para instalar a mano (teléfonos y tablets), de las dos apps. No sale por Google Play.

### Nuevo
- App de guitarra eléctrica desde el mismo código (ADR 0009): curso completo de 4 niveles, 132 lecciones y 4 checkpoints, en es, en y pt.
- Ejercicios de guitarra: rasgueo, bend, vibrato e improvisación sobre una pista; ejemplos con timbres de guitarra eléctrica, pista de acompañamiento y efectos (delay, reverb, chorus).
- Cancionero de guitarra: 10 canciones originales (rock, pop, funk, jazz y gospel).
- Bajo: nivel 1 completo con checkpoint, pentagrama en clave de fa (módulo 2.6), ejemplos sonoros y cancionero de 14 canciones.
- Versiones en APK con el workflow `apk-release` (tag `apk-vX.Y.Z`): las dos apps, para ARM de 64 y 32 bits y x86_64.

### Arreglos
- Detección de notas y tempos ajustados al micrófono del teléfono; correcciones de las revisiones de cada nivel.

### Nuevo
- Código base: curriculum de 123 lecciones, 4 lecciones modelo, 4 tipos de ejercicio, detección de notas, progreso y suscripciones.
- Flujo agéntico: reglas compartidas, subagentes y skills, CI, revisión con Claude y deploy a Google Play por etapas.
