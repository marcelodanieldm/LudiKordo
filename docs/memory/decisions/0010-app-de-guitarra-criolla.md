# 0010 · App de guitarra criolla desde el mismo código

- **Estado**: aceptada · 2026-11-21 (pedido de Marcelo: «dale, construyendo la app»)

## Contexto
Marcelo pidió un programa de guitarra criolla de cero a intermedio, con teoría, cejillas, pentatónicas y un cancionero de rock, jazz, blues, bossa nova, música popular y pop, donde las canciones se habilitan al desbloquear acordes y se tocan con acompañamiento de otros instrumentos, siguiendo los lineamientos de LudiKordo. Aprobó el programa (`docs/CURRICULUM-NYLON.md`) y pidió construir la app.

## Decisión
- **Tercera variante de build del mismo repo**, igual que la eléctrica (ADR 0009): `EXPO_PUBLIC_INSTRUMENT=nylon` → paquete `app.ludikordo.nylon`, `slug` `ludikordo-nylon`, esquema `ludikordonylon`. Nombre visible **provisional** «Kordi Criolla» (`APP_NYLON_NAME`). Si Marcelo prefiere un instrumento dentro de la app de guitarra, se cambia sin tocar el contenido.
- **Perfil `NYLON`** (`src/instruments/profiles.ts`): misma afinación que la eléctrica (E2 A2 D3 G3 B3 E4), 19 trastes, rango del detector 70–1400 Hz, **sin ampli** (`amplified: false`), se puntúa solo en sonido limpio, técnicas `fingerstyle`, `chords`, `strumming`, `barreChords`, `vibrato` (sin púa ni bends).
- **`IS_GUITAR` pasa a significar «guitarra de 6 cuerdas»** (eléctrica o criolla): el motor se comporta igual en las dos (tablatura, timbres sin transponer, banda con bajo). El contenido se elige con **`IS_NYLON`**: `LEVELS`, `LESSONS`, `SONGS`, `CHECKPOINTS`, `DRILLS` y voces. Bajo y eléctrica no cambian de comportamiento.
- **Textos**: `content.n.*` (ruta y lecciones) y `nylon.ui`, que se superpone encima de `guitar.ui` («guitarra criolla» en vez de «guitarra eléctrica»). En inglés «classical guitar»; en portugués «violão».
- **Timbre `nylon`** (`src/music/timbre.ts`): cuerda pulsada con el dedo, redonda y con poco brillo. Es el timbre por defecto de la criolla. Uña y yema se ilustran con `clean` (brillante) y `neck` (redondo).
- **Figuras nuevas** (`GuitarFigures.tsx`): `nylon-parts`, `nylon-posture` (postura clásica con apoyapié) y `pima-hand` (p-i-m-a). Kordi toca una criolla en esa app.
- **Glosario**: «cejilla» es el acorde con barra; el accesorio es «capotraste» (en Argentina «cejilla» nombra las dos cosas). En portugués, «pestana» es la cejilla y la cejuela es «capotraste (nut)».

## Plan por PR (uno por etapa, como la eléctrica)
1. **Base** (este PR): perfil, variante, ruta completa (5 niveles, 31 módulos, 151 lecciones) y los módulos gratuitos 1.1 y 1.2.
2. Nivel 1 (1.3–1.5) y checkpoint 1. Ejercicio nuevo `arpeggio` (secuencia p-i-m-a con tempo; la app mide nota y momento, no qué dedo).
3. Nivel 2 con el **álbum de acordes** (desbloqueo por acordes) y las primeras canciones.
4. Nivel 3 con los **estilos de banda nuevos**: zamba y chacarera (6/8, bombo legüero), tango (marcato) y vals (3/4), y el género `popular` en el cancionero.
5. Niveles 4 y 5, cancionero completo (18 canciones) y Práctica (22 ejercicios).

## Consecuencias
- Mientras la criolla no tiene cancionero ni Práctica, sus tarjetas se ocultan en la pestaña Practicar; sin checkpoint, el nivel se completa con sus lecciones.
- `eas.json` y los workflows (CODEOWNERS) necesitan el perfil y el job de la variante `nylon`: van en un PR aparte con aprobación de Marcelo.
- La detección de arpegios con cuerdas de nylon que siguen sonando (YIN es monofónico) hay que medirla en teléfono antes del nivel 2.
- Pendiente de Marcelo: nombre de la app, tercera app o instrumento dentro de la de guitarra, uñas o yemas como técnica por defecto.
