# 0009 · App de guitarra eléctrica desde el mismo código

- **Estado**: aceptada · 2026-11-17 (pedido de Marcelo)

## Contexto
Marcelo quiere la misma app, pero para guitarra eléctrica de cero a intermedio. Eligió: dos apps separadas en Google Play con un motor común, Kordi como mascota de las dos, un nombre nuevo para la de guitarra (todavía sin definir) y su propio programa de 4 etapas como base del currículo (`docs/CURRICULUM-GUITAR.md`).

## Decisión
- **Un repo, dos apps por variante de build**, no npm workspaces: `app.config.ts` y el bundle leen `EXPO_PUBLIC_INSTRUMENT` (`bass` por defecto, `guitar`) y cambia nombre, `slug`, `scheme` y paquete Android (`app.ludikordo.guitar`). Mismo resultado que un monorepo (dos fichas en Play, código común) sin mover cientos de archivos ni duplicar `node_modules`, Expo y CI.
- **Perfil de instrumento** (`src/instruments/profiles.ts`, puro y con pruebas): cuerdas y afinación, trastes, rango del detector, transposición de los ejemplos sonoros y técnicas propias. El activo está en `src/instruments/current.ts` (constante de build; en las pruebas de Node, bajo). El currículo, las lecciones, los checkpoints, el cancionero y los textos de UI que nombran el instrumento se eligen con él.
- El contenido de cada instrumento vive aparte (currículo, lecciones, cancionero, claves `content.*`); la interfaz (`ui.*`), el progreso, el audio y las reglas son comunes.
- Kordi en las dos apps; en la de guitarra toca una guitarra eléctrica (nueva variante en Rive).
- La suscripción de guitarra es otra app en Play y en RevenueCat; precios y si hay paquete combinado quedan para Marcelo (ADR 0004 sigue siendo hipótesis).

## Es guitarra eléctrica, no acústica
Marcelo lo pidió explícito: todo el curso es para **guitarra eléctrica**. Eso cambia tres cosas respecto de una app de guitarra genérica:

- **Cómo escucha la app.** Una eléctrica desenchufada casi no suena: el micrófono del teléfono capta poco y mal. Los ejercicios «con guitarra» piden tocar **con el ampli encendido** (o el ampli de práctica / multiefecto con parlante) y el teléfono cerca. La fase 2 suma entrada directa por USB-C (interfaz de audio o adaptador de guitarra), que da la señal más limpia; queda para un ADR propio.
- **Distorsión y detección.** Con ganancia alta YIN y el detector de ataques fallan (armónicos, sustain comprimido). Cada ejercicio que se puntúa declara el sonido que pide: **limpio** por defecto, **crunch** solo donde la técnica lo necesita (power chords, palm mute) y con la detección probada en ese sonido. La distorsión fuerte se usa para escuchar y tocar libre, no para puntuar.
- **Cómo suenan los ejemplos.** Los ejemplos sonoros y las pistas de acompañamiento imitan una eléctrica (limpia y crunch), sintetizados por la app como en el bajo, sin grabaciones con derechos. Sin transponer: la guitarra ya suena bien en el parlante del teléfono.

El equipo es contenido desde la primera lección (1.1: pastillas, volumen, tono y ecualización del ampli), vuelve en cada módulo con un «ajuste sugerido» del ampli y tiene su módulo propio antes del proyecto final: **4.9 Tu sonido: efectos** (overdrive y distorsión, delay, reverb, modulación y wah, orden de la cadena). Lo sumó Claude con el visto bueno de Marcelo; no estaba en su programa de 4 etapas.

## Consecuencias
- Hay que generalizar lo que hoy asume 4 cuerdas: `STRINGS` y `StringId` en `notes.ts`, `Fretboard`, `TabStaff`, `CartoonPlayer`, el afinador y el rango de YIN (ambas copias). Va en PRs chicos, con el bajo sin cambios de comportamiento.
- La guitarra necesita cosas que el bajo no tiene: diagramas de acordes, rasgueo y **detección de acordes** (YIN es monofónico; hace falta un cromagrama, en TS puro y en Kotlin). Hasta tenerla, los ejercicios de acordes con guitarra validan ritmo con el detector de ataques y notas sueltas del acorde con YIN; los checkpoints siguen sin autoevaluación.
- Los bends y el vibrato se miden con YIN siguiendo la afinación en cents en el tiempo.
- `eas.json` y los workflows (con dueño en CODEOWNERS) necesitan un perfil y un job para la variante de guitarra: se piden en un PR aparte con aprobación de Marcelo.
- Nombre visible: **«LudiKordo Electric Guitar»**, elegido por Marcelo el 21 nov 2026 (antes, provisional «Kordi Guitar»; se puede cambiar con `APP_GUITAR_NAME`). El paquete Android (`app.ludikordo.guitar`) no depende del nombre y no cambia.

## Implementación (PR de la APK de guitarra)
- El motor ya no asume 4 cuerdas: `STRINGS` sale del perfil activo; diapasón, tablatura, afinador, variables de los cartoons (`{{e}} {{a}} {{d}} {{g}} {{b}} {{e1}}`) y rango de YIN (opciones `minFreq`/`maxFreq` del módulo nativo; el algoritmo no cambió) se adaptan solos.
- Contenido por instrumento: `LEVELS`, `LESSONS`, `CHECKPOINTS` y `SONGS` eligen según la build. La guitarra tiene la ruta completa y las 10 lecciones de 1.1 y 1.2; todavía sin checkpoints ni cancionero (la tarjeta del cancionero se oculta).
- Textos: `content.g.*` (ruta y lecciones), `ui.gfig.*` (figuras) y `guitar.ui.*`, que en la app de guitarra reemplaza los textos de `ui` que nombran el bajo (`src/i18n/overlay.ts`).
- Imágenes: figuras de guitarra eléctrica y ampli dibujadas en SVG con leyenda numerada (`GuitarFigures.tsx`). Kordi toca guitarra eléctrica en esa app.
- Videos: mientras no hay `.riv`, cada escena trae su ilustración animada (`cartoon.visuals`) y su sonido (`cartoon.sounds`).
- Sonidos: timbres sintetizados (`src/music/timbre.ts`): limpio, crunch, pastilla del mástil y del puente, apagado. El bajo suena igual que antes.
- Tablatura con corcheas y silencios (`src/music/tab.ts`, `TabStaff`): en la guitarra toda partitura en modo tablatura se dibuja así, porque el pentagrama de la app es en clave de fa. El bajo sigue igual (pentagrama cuando hay corcheas o silencios).
- Diagramas de acordes abiertos (Em, E, Am, A, C, G, D, Dm) en `src/music/chords.ts` + figuras `chord-*`, con prueba de que cada forma suena a su tríada.
- Rasgueo (nivel 2): ejercicio `strum` (`StrumExercise.tsx`, lógica en `src/music/strum.ts`) que puntúa cuándo cae cada golpe con un patrón de 8 corcheas por compás. El módulo nativo emite `onAttack` en cada subida de energía aunque no haya altura clara (antes los rasgueos se descartaban); YIN no cambió. Los ejemplos sonoros pueden ser rasgueos (`ListenExample.strum`, `src/music/examples.ts`).
- Diagramas en grilla para power chords (tónica en 6.ª y 5.ª) y la caja de la pentatónica menor de La (`diagramOf`).
- Bends y vibrato (nivel 3): ejercicios `bend` (cuenta intentos que llegan a ½ o 1 tono ±25 cents y se sostienen ~0,2 s; opcionalmente soltar) y `vibrato` (ventanas de 1 s: 3–8 oscilaciones/s, ancho mínimo, regularidad). Lógica pura en `src/music/bend.ts`. Los ejemplos sonoros hacen bend y vibrato (`ScoreEvent.bend`/`vibrato`); la tablatura los marca con ↗ y ~.
- Acordes con cejilla formas de E y de A (`eShape`/`aShape`, `BARRES`) y forma de octava; el diagrama dibuja la cejilla.
- APK: el workflow `apk-test` acepta `instrument: guitar` (o push a `cc/apk-guitar`) y publica «LudiKordo-guitarra-<versión>-prueba-N.apk» (la versión sale de app.json; ver el encabezado de `apk-test.yml`).
