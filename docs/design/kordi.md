# Kordi · guía del personaje

Kordi es un carpincho bajista, la mascota original de LudiKordo. Esta guía es la fuente de verdad para ilustradores, animadores, locutores y agentes que generen imágenes o voces: mantiene al personaje igual en las 123 lecciones y en los 3 idiomas.

## Personalidad

- Tranquilo y paciente, como los carpinchos: nunca apura ni reta al alumno.
- Humor amable: se equivoca a propósito para mostrar errores comunes y se ríe de sí mismo.
- Frases cortas, en segunda persona («pisa», «escucha»), con una sola idea por frase.
- Ama el groove: celebra el pulso más que la velocidad.

## Forma y proporciones

Silueta de formas redondeadas y simples (rectángulos con esquinas muy redondeadas), legible a 96 px:

- Cuerpo ancho y bajo; cabeza grande (alrededor de 1/2 de la altura total) con hocico rectangular hacia la derecha.
- Ojo pequeño redondo con un brillo blanco; orejas chicas y redondas.
- Siempre con su bajo: cuerpo naranja quemado, mástil marrón, inclinado unos 24°.
- Sin ropa ni accesorios fijos (se pueden sumar por lección: auriculares, gorro de invierno).

Referencia vectorial: `src/components/Kordi.tsx` (viewBox 160×160).

## Paleta

| Parte | Color |
| --- | --- |
| Cuerpo | `#A0673C` |
| Cabeza | `#B07444` |
| Hocico y patas | `#8E5A33` |
| Orejas | `#7A4A28` |
| Nariz | `#3B2414` |
| Ojo | `#1D1B2E` + brillo `#FFFFFF` |
| Cuerpo del bajo | `#C2410C` (el acento de la app) |
| Mástil y clavijero | `#6B4423` |

Fondos de escena: la paleta de la app (`src/theme.ts`): crema `#FFF8EE`, noche `#1D1B2E`, verde azulado `#0F6E7E`.

## Manos y bajo (precisión musical)

- Kordi toca como diestro por defecto; la app espeja el diapasón para zurdos, no al personaje.
- El bajo tiene **4 cuerdas** y la más gruesa queda arriba (más cerca de la cara).
- Los dedos de la mano izquierda se numeran 1–4; en primeros planos, usar el código de color de la app: índice derecho (i) azul `#1F5FBF`, medio (m) naranja `#C2410C`.
- Nunca mostrar posturas que lastimen (muñeca muy doblada, pulgar por encima del mástil en ejercicios de técnica).

## Voz

- Una sola voz en los 3 idiomas (un modelo multilingüe con la misma voz mantiene el personaje): cálida, registro medio-grave, ritmo pausado, sonrisa audible.
- Español neutro latinoamericano, portugués de Brasil, inglés estadounidense neutro.
- Cada escena dura lo mismo en los 3 idiomas (±10%): si una traducción es más larga, se acorta el texto, no se acelera la voz.
- El identificador de la voz va en `assets/audio/VOICES.md` (no es secreto); la clave de la API, nunca en el repo.

## Plantilla para generar imágenes

Para bocetos y storyboards con un generador de imágenes, siempre partir de la referencia de `Kordi.tsx` exportada a PNG y este texto:

> Kordi, a friendly cartoon capybara bass player. Flat vector style, rounded simple shapes, flat fills without outlines, no gradients. Body #A0673C, head #B07444, snout #8E5A33, small round black eye with white highlight. Holds a 4-string electric bass, body #C2410C, neck #6B4423, tilted about 24 degrees. Calm, warm expression. Background: {escena}. Aspect ratio {16:9 | 1:1}.

Las imágenes generadas son **bocetos**: la versión final de cada escena se dibuja en vectores en Rive siguiendo esta guía.

## No hacer

- No convertir a Kordi en otro animal, ni darle rasgos humanos realistas.
- No mostrar marcas reales de bajos, amplificadores ni logotipos.
- No usar letras, melodías ni personajes de obras con derechos.
- No cambiar la paleta sin actualizar esta guía y `Kordi.tsx`.
