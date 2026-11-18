# Currículo de guitarra eléctrica

4 niveles, 27 módulos, 127 lecciones, unas 52 semanas a 15–20 minutos por día. Base: el programa de 4 etapas que trajo Marcelo (6 a 12 meses de práctica constante, de inicial a intermedio). Mismo formato que el bajo: lecciones de 4 pasos (Mira, Entiende, Practica sin guitarra, Practica con guitarra), una habilidad nueva por lección, criterio de dominio medible, objetivo de una frase por módulo y checkpoint al final de cada nivel.

Afinación estándar: E2 A2 D3 G3 B3 E4 (MIDI 40, 45, 50, 55, 59, 64); cuerda 6 = Mi grave, cuerda 1 = Mi aguda. Perfil en `src/instruments/profiles.ts`.

## Nivel 1 · Fundamentos y control (semanas 1–8)

Familiarizarse con el instrumento, controlar el ruido de las cuerdas y coordinar las dos manos.

| Módulo | Lecc. | Objetivo |
| --- | --- | --- |
| 1.1 Tu guitarra y tu ampli | 5 | Nombrar las partes, usar selector de pastillas, volumen y tono, y armar un sonido limpio con ganancia, graves, medios y agudos. |
| 1.2 Postura y púa | 5 | Sentarte y pararte sin tensión, sostener la púa y tocar abajo-arriba en cuerdas al aire con metrónomo. |
| 1.3 Dedos independientes | 5 | Tocar el cromático 1-2-3-4 en las 6 cuerdas con un dedo por traste. |
| 1.4 Silencio entre notas | 4 | Apagar las cuerdas que no suenan con las dos manos. |
| 1.5 Leer guitarra | 5 | Leer diagramas de acordes y tablatura con negras, corcheas y silencios. |

**Checkpoint 1**: riff original en cuerdas al aire con púa alternada, leído de TAB, sin ruido de cuerdas.

## Nivel 2 · Acordes, ritmo y riffs (semanas 9–17)

Sentido del tiempo y la base rítmica del rock y el pop.

| Módulo | Lecc. | Objetivo |
| --- | --- | --- |
| 2.1 Primeros acordes | 5 | Tocar Em, E, Am y A limpios, cuerda por cuerda. |
| 2.2 Más acordes abiertos | 5 | Sumar C, G, D y Dm. |
| 2.3 Cambiar sin parar | 5 | Cambiar entre acordes abiertos con rasgueos de negras y corcheas sin perder el pulso. |
| 2.4 Power chords | 5 | Mover la quinta con tónica en 6.ª y 5.ª cuerda para tocar riffs. |
| 2.5 Palm muting | 5 | Apagar con la palma sobre el puente para dar peso y dinámica a los riffs. |
| 2.6 Pentatónica menor | 5 | Tocar la 1.ª posición de la pentatónica menor con metrónomo. |

**Checkpoint 2**: progresión de 4 acordes abiertos rasgueada + riff de power chords con palm mute.

## Nivel 3 · Expresión y paso a intermedio (semanas 18–30)

Las técnicas que le dan voz a la guitarra eléctrica y el mapa del mástil.

| Módulo | Lecc. | Objetivo |
| --- | --- | --- |
| 3.1 Ligados | 5 | Conectar notas con hammer-ons y pull-offs. |
| 3.2 Slides | 4 | Deslizar entre notas llegando al traste justo. |
| 3.3 Bending | 5 | Estirar medio tono y un tono llegando a la afinación exacta. |
| 3.4 Vibrato | 4 | Hacer un vibrato parejo y controlado. |
| 3.5 Cejilla forma de E | 5 | Tocar acordes mayores y menores con cejilla desde la 6.ª cuerda en todo el mástil. |
| 3.6 Cejilla forma de A | 5 | Lo mismo desde la 5.ª cuerda. |
| 3.7 Mapa del mástil | 4 | Encontrar todas las notas naturales en la 6.ª y la 5.ª cuerda. |

**Checkpoint 3**: solo corto con bends afinados, vibrato y ligados sobre una progresión con cejillas.

## Nivel 4 · Improvisación y nivel intermedio (semanas 31–52)

Crear música, ganar velocidad y entender la armonía.

| Módulo | Lecc. | Objetivo |
| --- | --- | --- |
| 4.1 Las 5 cajas pentatónicas | 5 | Tocar las cinco posiciones de la pentatónica. |
| 4.2 Todo el mástil | 5 | Unir las cajas y moverte en horizontal. |
| 4.3 Escala mayor y menor natural | 5 | Construirlas por intervalos y tocarlas en dos posiciones. |
| 4.4 Modos básicos | 4 | Reconocer y usar dórico, mixolidio y frigio a partir de la escala mayor. |
| 4.5 Fraseo | 5 | Improvisar con motivos rítmicos y notas objetivo sobre pistas de acompañamiento. |
| 4.6 Púa rápida | 4 | Subir el tempo del alternate picking sin perder limpieza. |
| 4.7 Double stops y tríadas | 5 | Tocar notas dobles y arpegios de tríadas mayores y menores. |
| 4.8 Tapping | 4 | Tocar un patrón básico de tapping a dos manos. |
| 4.9 Proyecto final | 4 | Componer y tocar tu propio solo sobre una pista de acompañamiento. |

**Checkpoint 4** = proyecto final.

## Diferencias con el bajo que piden trabajo nuevo

| Necesidad | Módulos | Cómo |
| --- | --- | --- |
| Diagrama de acorde (componente) | 1.5 en adelante | SVG nuevo, respeta zurdos. |
| Detección de acordes | 2.1–2.3, 3.5–3.6 | Cromagrama en `src/music/` y en Kotlin; mientras tanto, ritmo con el detector de ataques y notas del acorde de a una con YIN. |
| Patrones de rasgueo | 2.3 | Extender `score` con dirección (abajo/arriba). |
| Bends y vibrato | 3.3, 3.4 | YIN en el tiempo: cents alcanzados y regularidad. |
| Palm mute | 2.5 | Duración corta y menos agudos; se valida con el detector de ataques + autodetección de sustain. |
| Pistas de acompañamiento | 4.5, 4.9 | Sintetizadas por la app, como los ejemplos sonoros. |
| Rango de YIN | todo | 70–1400 Hz en las dos copias (TS y Kotlin). |

## Cancionero

Mismo esquema que el bajo (ADR 0008): riffs y progresiones **originales**, desbloqueados por los módulos que usan. Géneros pendientes de elegir (el programa sugiere rock, blues, metal, pop y funk).

## Gratis

Igual que en el bajo: módulos 1.1 y 1.2, afinador y metrónomo.
