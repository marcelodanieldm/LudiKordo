# 0003 · Memoria de agentes en `docs/memory/`, no en un servicio

- **Estado**: aceptada · 2026-11-09

## Contexto
Usamos dos herramientas de agentes (Antigravity y Claude Code) más Claude en GitHub Actions. Cada una tiene su propia memoria (Knowledge Items de Antigravity, memoria de Claude Code), que la otra no ve. Los servidores MCP de memoria (grafos, vectores) guardan los datos fuera de git y en la máquina de cada persona.

## Decisión
La memoria compartida es Markdown en `docs/memory/`: decisiones (ADR) y aprendizajes, con un índice corto. Los agentes la leen al empezar tareas grandes y la actualizan con la skill `remember`, siempre dentro de un PR.

## Consecuencias
- La ven todas las herramientas, incluida la ejecución en GitHub Actions.
- Tiene historia, se revisa y se puede corregir como el código.
- La memoria propia de cada herramienta sigue sirviendo para preferencias personales; lo que importa al proyecto va al repo.
- Si algún día hace falta búsqueda semántica, Basic Memory puede apuntar a esta misma carpeta sin cambiar el formato.
