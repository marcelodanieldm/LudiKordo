---
trigger: glob
globs: "modules/**, src/music/**, src/audio/**"
---

# Audio y módulo nativo

- YIN existe en `src/music/yin.ts` (referencia con pruebas) y en `Yin.kt`. Mismo cambio en ambos, en el mismo PR.
- Cada cambio de detección empieza con una prueba en `tests/music.test.ts` usando señales sintéticas (armónicos, ruido, fundamental débil para el Mi grave).
- Los tiempos del micrófono se cuentan en muestras desde `start()`; la conversión al reloj del metrónomo está en `src/audio/mic.ts`. No mezclar relojes.
- Micrófono, metrónomo y timers se detienen al desmontar el componente o terminar el ejercicio.
- Tolerancias del producto: nota ±50 cents, tiempo ±80 ms (±60 ms en pantalla), afinación ±5 cents. Cambiarlas requiere aprobación de producto.
- Si no hay Android SDK en el entorno, el workflow `native-android` de CI compila el módulo Kotlin: revisa su resultado en el PR.
