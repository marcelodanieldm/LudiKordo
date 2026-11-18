# 0009 · App de guitarra eléctrica desde el mismo código

- **Estado**: aceptada · 2026-11-17 (pedido de Marcelo)

## Contexto
Marcelo quiere la misma app, pero para guitarra eléctrica de cero a intermedio. Eligió: dos apps separadas en Google Play con un motor común, Kordi como mascota de las dos, un nombre nuevo para la de guitarra (todavía sin definir) y su propio programa de 4 etapas como base del currículo (`docs/CURRICULUM-GUITAR.md`).

## Decisión
- **Un repo, dos apps por variante de build**, no npm workspaces: `app.config.ts` lee `APP_INSTRUMENT` (`bass` por defecto, `guitar`) y cambia nombre, `slug`, `scheme` y paquete Android (`app.ludikordo.guitar`). Mismo resultado que un monorepo (dos fichas en Play, código común) sin mover cientos de archivos ni duplicar `node_modules`, Expo y CI.
- **Perfil de instrumento** (`src/instruments/profiles.ts`, puro y con pruebas): cuerdas y afinación, trastes, rango del detector, transposición de los ejemplos sonoros y técnicas propias. Lo lee `src/instruments/active.ts` desde `extra.instrument`.
- El contenido de cada instrumento vive aparte (currículo, lecciones, cancionero, claves `content.*`); la interfaz (`ui.*`), el progreso, el audio y las reglas son comunes.
- Kordi en las dos apps; en la de guitarra toca una guitarra eléctrica (nueva variante en Rive).
- La suscripción de guitarra es otra app en Play y en RevenueCat; precios y si hay paquete combinado quedan para Marcelo (ADR 0004 sigue siendo hipótesis).

## Es guitarra eléctrica, no acústica
Marcelo lo pidió explícito: todo el curso es para **guitarra eléctrica**. Eso cambia tres cosas respecto de una app de guitarra genérica:

- **Cómo escucha la app.** Una eléctrica desenchufada casi no suena: el micrófono del teléfono capta poco y mal. Los ejercicios «con guitarra» piden tocar **con el ampli encendido** (o el ampli de práctica / multiefecto con parlante) y el teléfono cerca. La fase 2 suma entrada directa por USB-C (interfaz de audio o adaptador de guitarra), que da la señal más limpia; queda para un ADR propio.
- **Distorsión y detección.** Con ganancia alta YIN y el detector de ataques fallan (armónicos, sustain comprimido). Cada ejercicio que se puntúa declara el sonido que pide: **limpio** por defecto, **crunch** solo donde la técnica lo necesita (power chords, palm mute) y con la detección probada en ese sonido. La distorsión fuerte se usa para escuchar y tocar libre, no para puntuar.
- **Cómo suenan los ejemplos.** Los ejemplos sonoros y las pistas de acompañamiento imitan una eléctrica (limpia y crunch), sintetizados por la app como en el bajo, sin grabaciones con derechos. Sin transponer: la guitarra ya suena bien en el parlante del teléfono.

El equipo es contenido desde la primera lección (1.1: pastillas, volumen, tono y ecualización del ampli) y vuelve en cada módulo con un «ajuste sugerido» del ampli.

## Consecuencias
- Hay que generalizar lo que hoy asume 4 cuerdas: `STRINGS` y `StringId` en `notes.ts`, `Fretboard`, `TabStaff`, `CartoonPlayer`, el afinador y el rango de YIN (ambas copias). Va en PRs chicos, con el bajo sin cambios de comportamiento.
- La guitarra necesita cosas que el bajo no tiene: diagramas de acordes, rasgueo y **detección de acordes** (YIN es monofónico; hace falta un cromagrama, en TS puro y en Kotlin). Hasta tenerla, los ejercicios de acordes con guitarra validan ritmo con el detector de ataques y notas sueltas del acorde con YIN; los checkpoints siguen sin autoevaluación.
- Los bends y el vibrato se miden con YIN siguiendo la afinación en cents en el tiempo.
- `eas.json` y los workflows (con dueño en CODEOWNERS) necesitan un perfil y un job para la variante de guitarra: se piden en un PR aparte con aprobación de Marcelo.
- El nombre visible es provisional («Kordi Guitar», cambiable con `APP_GUITAR_NAME`); el paquete Android no depende del nombre.
