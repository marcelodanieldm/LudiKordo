# 0008 · Cancionero con canciones originales

- **Estado**: aceptada · 2026-11-17

## Contexto
Marcelo pidió incorporar a LudiKordo una app de cancionero de terceros (cancioneroguitarra.netlify.app, «Las 50 canciones», de «El Código de tu Guitarra»), para que el alumno practique canciones según su nivel y lo aprendido, en reggae, bossa nova, soul, blues, rock, pop y baladas. La app arma su contenido con JavaScript y no se pudo leer; lo visible es su estructura (Canciones, Mis acordes, Afinador). Un cancionero de canciones conocidas lleva letras y cifrados con derechos, y AGENTS.md permite solo música original o de dominio público.

## Decisión
- Se toma la idea y la estructura, no el contenido: cancionero propio con líneas de bajo originales, 2 por género para empezar (14).
- Cada canción declara los módulos que pide; se desbloquea con el progreso y respeta Premium.
- El play-along acepta partituras con corcheas y silencios (`score`), para tocar reggae y bossa como son.

## Consecuencias
- Para sumar canciones conocidas haría falta licenciarlas (letra, música y grabación); hasta entonces, solo originales o de dominio público.
- Afinador ya existe en Practicar; «Mis acordes» queda cubierto por el cifrado de cada canción.
