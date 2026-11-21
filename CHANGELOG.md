# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versiones: semver. Lo mantiene la skill `release-prep`.

## [Sin publicar]

### Nuevo
- App de guitarra criolla desde el mismo código (ADR 0010, `npm run android:nylon`): ruta de 5 niveles y 151 lecciones, y los módulos gratuitos 1.1 y 1.2 en es, en y pt, con timbre de nylon, figuras de la criolla y Kordi con guitarra criolla.
- Guitarra criolla: álbum de acordes (los acordes desbloquean canciones), módulos 2.1–2.3 con 14 acordes abiertos (incluidas E7, A7, D7, G7, Em7 y Am7) y las dos primeras canciones del cancionero.
- Guitarra criolla: nivel 1 completo (25 lecciones: pulsar tirando y apoyando, pulgar en los bajos, mano izquierda, cromático, pulso, figuras, corcheas y tablatura) y checkpoint 1.

## [0.3.0] — 2026-11-19

### Nuevo
- Práctica de habilidades (bajo y guitarra): 34 ejercicios por habilidad con evaluación en vivo nota por nota (a tiempo, antes, tarde, otra nota, perdida), racha, estrellas y tempos que se desbloquean.
- Banda que acompaña: batería sintetizada en 9 estilos (rock, pop, funk, balada, shuffle, jazz, soul, reggae, bossa), bajo o guitarra y teclado según el cifrado; cada parte se prende o apaga.
- Improvisación con la escala y «Practicar con la banda» en cada canción del cancionero.
- Dibujos de la mano que se mueven con el sonido; tono del bajo más audible en el teléfono.
- APK de prueba numerados con la versión de app.json.

### Arreglos
- El cancionero de guitarra mostraba los nombres de módulo del bajo.
- El afinador y el metrónomo se apagan al salir de la pestaña Practicar.

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
