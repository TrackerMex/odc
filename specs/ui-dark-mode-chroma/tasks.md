---
feature: "ui-dark-mode-chroma"
status: approved     # draft | approved
tags: [harness, spec, frontend, design-system, tokens, dark-mode]
---

# Tareas — [[ui-dark-mode-chroma]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> tiene siempre los mismos 3 sub-items, en este orden.
>
> Todos los tests viven en `frontend/src/styles.tokens.test.ts`, junto a los de la
> feature 23. Recordatorio de R8: los tests afirman **invariantes**, nunca un
> literal `oklch(...)` nuevo para los tokens que esta feature cambia.
>
> Orden sugerido: R1 antes que R2 (el techo debe dejar de ser plano para que el
> suelo pueda cumplirse) y R5 antes que R6 (el gamut debe estar limpio para que
> la auditoría de contraste mida el color real).

## R1 — Techo de saturación `s ≤ 0.2126` congelado (sustituye el chroma plano ≤ 0.10)

- [X] (1) Escribir test que falla para R1
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R2 — Suelo del 85% de saturación para `--primary` y `--accent-action` en dark

- [X] (1) Escribir test que falla para R2
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R3 — `--ring`, `--sidebar-primary` y `--sidebar-ring` iguales a `--primary` por tema

- [X] (1) Escribir test que falla para R3
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R4 — `.dark --primary` más claro que `--card` y que `--primary-foreground`

- [X] (1) Escribir test que falla para R4
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R5 — Ningún token declarado fuera del gamut sRGB (6 tokens a corregir)

- [X] (1) Escribir test que falla para R5
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R6 — Contraste ≥ 4.5:1 en los 26 pares + compuesto + 2 pares nuevos

- [X] (1) Escribir test que falla para R6
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R7 — Verde: identidad en light, hue compartido en dark, MASTER §1 acotado

- [X] (1) Escribir test que falla para R7
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes
- [X] (4) Editar `design-system/odc/MASTER.md` §1 (parte no cubierta por test;
      la verifica el reviewer leyendo la sección)

## R8 — Los tests afirman invariantes, no literales nuevos

- [X] (1) Escribir test que falla para R8 — auditoría del propio archivo de test:
      ningún literal `oklch(...)` nuevo asociado a los tokens que esta feature
      cambia
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R9 — Verificación en navegador antes del cierre

- [X] (1) Escribir test que falla para R9 — existencia y estructura mínima de
      `progress/verify_ui-dark-mode-chroma.md` (las 4 secciones); el contenido
      visual lo juzga el humano, no el test
- [X] (2) Ejecutar la sesión en navegador y redactar el archivo — hecho por el
      leader el 2026-08-11, Chrome real sobre `localhost:3005`
- [X] (3) Recoger el veredicto humano con fecha — **afirmativo**, Alexis,
      2026-08-11, en la sección 4 de `progress/verify_ui-dark-mode-chroma.md`

## R10 — Enmienda registrada en la spec de la feature 23

- [X] (1) Escribir test que falla para R10 — `specs/ui-design-tokens/requirements.md`
      contiene una fila de enmienda que nombra a `ui-dark-mode-chroma`
- [X] (2) Añadir la fila (y solo la fila; no tocar sus casillas de aprobación)
- [X] (3) Refactor con tests verdes

## R11 — No regresión y alcance cerrado

- [X] (1) Escribir test que falla para R11 — `frontend/package.json` sin
      dependencias nuevas
- [X] (2) `pnpm test` y `pnpm build` en verde
- [X] (3) `git status` limpio fuera de la lista de archivos de [[design]]
