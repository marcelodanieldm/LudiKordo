# 0007 · Objetivos del curso, lectura temprana y ejemplos sonoros

- **Estado**: aceptada · 2026-11-17 (pedido de Marcelo: sumar los objetivos de un programa de referencia)

## Contexto
Marcelo pidió sumar al curso los objetivos del programa de bajo de Rock School Caballito, con teoría, práctica y ejemplos sonoros. La ruta (25 módulos, 123 lecciones) no cubría: pentagrama desde temprano, escribir música, inversiones, tapping, modos con solos y licks, reggae, soul, metal, dinámica y equipo y efectos.

## Decisión
- 6 módulos nuevos, 28 lecciones: 2.6 Pentagrama y clave de fa, 3.6 Inversiones, 4.6 Reggae y soul, 4.7 Rock pesado, púa y tapping, 5.5 Modos, solos y licks, 5.6 Sonido y equipo. Total: 31 módulos, 151 lecciones, ~60 semanas.
- La clave de fa pasa del nivel 5 al 2 (2.6). El 5.3 queda como «Lectura a primera vista».
- El proyecto final sigue al final de la ruta: pasa de 5.5 a 5.7.
- Cada módulo tiene un objetivo en una frase (`content.goal.*`), visible en la ruta.
- Ejemplos sonoros sintetizados por la app (sin grabaciones): suenan una octava arriba para que se oigan en el parlante del teléfono.
- Ficha teórica por módulo armada con las tarjetas de sus lecciones, sin texto nuevo que mantener.
- Se toman solo objetivos del programa de referencia, nunca su material.

## Consecuencias
- El id `5.5` cambió de significado: si alguien guardó progreso de 5.5 (nadie todavía, no hay lecciones escritas), habría que migrarlo.
- Insertar un módulo en medio de un nivel cambia qué lección desbloquea a la siguiente (por ejemplo, 3.1.1 ahora pide 2.6.5). Hoy no hay progreso en el nivel 2; cuando haya lecciones publicadas, un cambio así exige migrar el progreso guardado.
- Mapa de objetivos y plan de los módulos pendientes: `docs/CURRICULUM.md`.
- Pendientes de código: semicorcheas en partitura, intensidad por nota, timbres y ligaduras (ver el mapa).
