# Currículo de LudiKordo

5 niveles, 31 módulos, 151 lecciones, unas 60 semanas a 15–20 minutos por día. La fuente de verdad del orden es `src/content/curriculum.ts`; los títulos, objetivos y ejercicios estrella están en `content.module`, `content.goal` y `content.star` de los tres idiomas.

## Objetivos del curso

En noviembre de 2026 la ruta se comparó con el programa público de una escuela de bajo de referencia ([Rock School Caballito](https://www.escuelamusicacaballito.com.ar/clases-de-bajo), Buenos Aires). Se tomaron solo sus **objetivos**, no su material. Dónde se cubre cada uno:

| Objetivo | Dónde |
| --- | --- |
| Conocer el instrumento y sus partes | 1.1 |
| Postura y posición de las manos | 1.2, 1.3 |
| Notas, pentagrama y clave | 2.2, **2.6**, 5.3 |
| Leer y escribir música | 1.4 (tablatura), **2.6** (pentagrama y dictado), 5.3 (primera vista) |
| Teoría y armonía | 2.3, 3.1–3.4, **3.6**, 5.2 |
| Técnica básica | 1.2, 1.3, 2.4 |
| Escalas, arpegios e inversiones | 3.1, 3.2, 3.3, **3.6**, 5.2 |
| Slap, tapping y muting | 2.4 (apagado), 4.3 (slap), **4.7** (palm mute y tapping) |
| Interpretar piezas | 1.5 (Kordi Groove 1), **2.6.5** (Canon de Pachelbel), checkpoints, 5.7 |
| Solos y líneas sobre progresiones tonales y modales | 3.4, **5.5** |
| Licks | **5.5** |
| Estilos | Clásico (**2.6.5**, 5.3), jazz (4.4, 5.2), rock (4.2), metal y heavy (**4.7**), reggae y soul (**4.6**), blues (4.4, checkpoint 3), funk (4.3), bossa nova y latinos (4.5) |
| Oído musical | Ejercicios `ear` en todos los niveles; dictado en **2.6.4**; inversiones de oído en **3.6.4** |
| Expresividad y criterio | 4.1 (ligados, notas fantasma), **4.6.4** (dinámica) |
| Composición, arreglo e improvisación | 5.4, **5.5**, 5.7 |
| Equipo, efectos y sonido | 1.1 (perillas), **5.6** |

En **negrita**, lo que se agregó en esta versión.

## Teoría, práctica y ejemplos sonoros

Cada lección mantiene sus 4 pasos (Mira, Entiende, Practica sin bajo, Practica con bajo). Además:

- **Ejemplos sonoros**: una tarjeta de «Entiende» puede traer `listen` (notas, tempo, clic opcional y si se dibuja en pentagrama o tablatura). La app lo toca con un tono sintetizado, sin grabaciones con derechos. Suena una octava arriba porque el parlante de un teléfono casi no reproduce el Mi grave. Lógica en `src/music/listen.ts`.
- **Pentagrama**: clave de fa, redondas, blancas, negras y corcheas (con barra), silencios, sostenidos y líneas adicionales (`src/music/staff.ts`, `src/components/Staff.tsx`). Los ejercicios `tabReading` y `playAlong` aceptan `notation: 'staff'`, y los `quiz` pueden mostrar un pentagrama con el enunciado.
- **Ficha teórica** por módulo (`app/ficha/[module].tsx`): junta las tarjetas de sus lecciones, con figuras y ejemplos sonoros, para repasar sin rehacer la lección. Respeta Premium.

## Módulos

| Nivel | Módulo | Lecciones | Objetivo |
| --- | --- | --- | --- |
| 1 · Fundamentos (sem. 1–6) | 1.1 Conoce tu bajo | 5 ✅ | Partes, cuerdas y afinación |
| | 1.2 Mano derecha | 5 ✅ | Postura y alternancia i–m |
| | 1.3 Mano izquierda | 5 ✅ | Un dedo por traste, sin tensión |
| | 1.4 Tablatura y pulso | 5 ✅ | Leer tablatura a tempo |
| | 1.5 Primeras líneas | 5 ✅ | Líneas completas sobre una base |
| 2 · Ritmo y groove (sem. 7–16) | 2.1 Corcheas y silencios | 5 | |
| | 2.2 Notas en las cuerdas E y A | 5 | |
| | 2.3 Raíz, quinta y octava | 5 | |
| | 2.4 Apagado y articulación | 4 | |
| | 2.5 Tocar con batería | 5 | |
| | **2.6 Pentagrama y clave de fa** | 5 ✅ | Leer y escribir en pentagrama lo que ya se toca en tablatura |
| 3 · Armonía (sem. 17–27) | 3.1 Escala mayor · 3.2 Tríadas · 3.3 Pentatónicas · 3.4 Progresiones y cifrado · 3.5 Semicorcheas y síncopa | 25 | |
| | **3.6 Inversiones** | 4 | Inversiones para que la línea avance por notas cercanas |
| 4 · Técnica y estilos (sem. 28–45) | 4.1 Ligados y ghost notes · 4.2 Rock y pop · 4.3 Funk y slap inicial · 4.4 Walking blues · 4.5 Ritmos latinos y brasileños | 25 | |
| | **4.6 Reggae y soul** | 5 | Dinámica, espacio y expresión |
| | **4.7 Rock pesado, púa y tapping** | 5 | Púa, galope, palm mute y tapping inicial |
| 5 · Intermedio (sem. 46–60) | 5.1 Diapasón completo · 5.2 Arpegios de séptima · **5.3 Lectura a primera vista** (antes «Clave de fa») · 5.4 Crear tus líneas | 20 | |
| | **5.5 Modos, solos y licks** | 5 | Solos y licks sobre progresiones tonales y modales |
| | **5.6 Sonido y equipo** | 4 | Amplificador, ecualización y efectos por estilo |
| | 5.7 Proyecto final (antes 5.5) | 4 | 3 temas completos y una grabación |

La clave de fa pasó del nivel 5 al 2: leer partitura desde temprano es un objetivo del curso, y en el nivel 5 queda la lectura a primera vista.

## Plan de los módulos nuevos que faltan escribir

Mismo formato que las lecciones modelo. Solo música original o de dominio público.

**3.6 Inversiones**
1. La tríada y sus inversiones: fundamental, 3.ª en el bajo, 5.ª en el bajo (ejemplo sonoro: Do, Do/Mi, Do/Sol).
2. Acordes con barra: leer `C/E` en el cifrado y tocar la nota de abajo.
3. Líneas que bajan por grados: I – V/7 – vi – vi/5 – IV, con ejemplo sonoro.
4. Oído: ¿fundamental o invertido? y un arreglo de 8 compases (★ Línea con inversiones).

**4.6 Reggae y soul**
1. One drop: el bajo deja respirar el primer tiempo.
2. Raíz y quinta con espacio; apagado entre notas.
3. Soul de los 60: aproximaciones cromáticas y notas de paso (línea original).
4. Dinámica: piano, forte, acentos y crescendo.
5. Tema original reggae-soul a tempo (★ Groove one drop).

**4.7 Rock pesado, púa y tapping**
1. La púa: abajo-arriba, ataque y sonido.
2. Palm mute y corcheas constantes.
3. Galope: corchea y dos semicorcheas.
4. Tapping inicial: notas con las dos manos sobre el diapasón.
5. Riff original con galope (★ Riff con galope).

**5.5 Modos, solos y licks**
1. Modos desde la escala mayor: dórico y mixolidio.
2. Vamp modal: un acorde, el modo y cómo moverse.
3. Banco de licks originales: frases cortas para guardar y variar.
4. Solos sobre ii–V–I y I–IV–V: pregunta y respuesta.
5. Solo de 8 compases sobre un vamp dórico (★).

**5.6 Sonido y equipo**
1. El amplificador: ganancia, volumen y ecualización de 3 bandas.
2. El compresor: notas parejas.
3. Efectos: overdrive, chorus, octavador y filtro de envolvente.
4. Tu sonido para rock, funk y reggae (★).

### Lo que el código tiene que sumar antes

- Semicorcheas (`beats: 0.25`) en `ScoreEvent` y en la tablatura: 3.5 y el galope de 4.7.
- Intensidad por nota en los ejemplos sonoros: 4.6.4 (dinámica).
- Timbres en el motor de audio (filtro, saturación, chorus): ejemplos de 5.6.
- Ligaduras y puntillos en el pentagrama: lectura de 5.3.

## Cancionero

Canciones para practicar lo aprendido, por género y nivel (`src/content/songs.ts`, pantalla `app/cancionero/`, acceso desde Practicar). Cada canción es una **línea de bajo original** con su cifrado, un ejemplo sonoro y un play-along a tempo con el micrófono, con tempos que se desbloquean al dominarla.

Una canción se abre cuando el alumno termina los módulos que pide (o saltó ese nivel por test). Si alguno de esos módulos es Premium, la canción también lo es. La lista muestra primero lo que puede tocar y todavía no domina, y después qué le falta para el resto.

| Género | Nivel 1–2 | Nivel 3–4 |
| --- | --- | --- |
| Pop | Paseo de domingo (1.5) | Ciudad de neón (3.4) |
| Rock | Motor en marcha (1.5) | Tormenta eléctrica (4.2) |
| Baladas | Luz de vela (1.5) | Escalera de otoño (3.6) |
| Blues | Blues del carpincho (1.5) | Walking del puerto (4.4) |
| Bossa nova | Brisa del puerto (2.3) | Atardecer bossa (4.5) |
| Soul | Domingo soul (2.3 + 2.4) | Noche de soul (4.6) |
| Reggae | Sol de la tarde (2.1 + 2.6) | Raíces (4.6) |

Reglas: solo música original o de dominio público (nunca letras, cifrados ni líneas de canciones con derechos); un acorde por compás, con la raíz (o el bajo de la inversión) en la primera nota del compás; tablatura solo con negras, blancas y redondas; corcheas y silencios en pentagrama, después de 2.6. Las pruebas de `tests/songbook.test.ts` lo controlan.

Para sumar una canción: agregarla a `SONGS`, sus textos en `content.song.<id>` de los 3 idiomas y correr `npm test`.
