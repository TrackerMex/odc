---
feature: "ui-responsive-375"
status: draft        # draft | approved
tags: [harness, spec, frontend, ui, responsive, verification]
---

# Tareas — [[ui-responsive-375]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> tiene siempre los mismos 3 sub-items, en este orden.

> **Nota de naturaleza de la feature.** R1, R3, R7 y R8 se verifican en un
> navegador real y su "test rojo → verde" es el acta de R9: el sub-item (1) es
> dejar la sección del acta en `PENDIENTE` (rojo por construcción, y la guarda
> de R9 lo detecta), el (2) es tomar la medición bajo el gate de R1, y el (3) es
> registrarla. El implementer **no rellena el acta**: deja el esqueleto y la
> guarda que la exige completa. R6 solo produce código si el acta encuentra un
> defecto; si sale limpia, sus tres sub-items se cierran como "no aplica, sin
> defecto observado" citando la sección del acta que lo demuestra.

## R1 — Gate de medición del viewport (375px real, `sm` y `md` apagados)

- [x] (1) Escribir test que falla para R1 — test rojo: la guarda del acta §0 falla con ENOENT (`e116538`)
- [x] (2) Implementación mínima que lo pasa — acta §0 con las cinco lecturas medidas (`b95e9ef`)
- [x] (3) Refactor con tests verdes — sin refactor: la guarda y el spec de Playwright quedaron como se escribieron

## R2 — Inventario cerrado: seis rutas, todas las superficies vivas, ninguna muerta

- [x] (1) Escribir test que falla para R2 — test rojo: 31 aserciones, secciones 1–6 en PENDIENTE (`c67c475`)
- [x] (2) Implementación mínima que lo pasa — acta §§1–6 con las 20 superficies montadas (`29ad1f4`)
- [x] (3) Refactor con tests verdes — sin refactor

## R3 — Cero scroll horizontal de página en las seis rutas

- [x] (1) Escribir test que falla para R3 — test rojo: 6 aserciones, ningún par de anchos registrado (`f574a8c`)
- [x] (2) Implementación mínima que lo pasa — acta §§1–6 con `scrollWidth`/`clientWidth` = 375/375 (`ed690bf`)
- [x] (3) Refactor con tests verdes — sin refactor

## R4 — Meta `viewport` intacta y cero anchos fijos > 375px (excepción: el slide del PDF)

- [x] (1) Escribir test que falla para R4 — guarda de no regresión, verde por construcción; rojo comprobado por mutación (`1081ab5`)
- [x] (2) Implementación mínima que lo pasa — **no aplica, sin defecto observado**: la meta viewport y la única excepción de ancho fijo ya cumplían
- [x] (3) Refactor con tests verdes — sin refactor

## R5 — Los patrones responsive vigentes se conservan

- [x] (1) Escribir test que falla para R5 — guarda de no regresión, verde por construcción; rojo comprobado por mutación (`96d41f6`)
- [x] (2) Implementación mínima que lo pasa — **no aplica, sin defecto observado**: los ocho patrones seguían en su sitio
- [x] (3) Refactor con tests verdes — sin refactor

## R6 — Corrección condicional, mobile-first, sin efecto a ≥ 640px

- [x] (1) Escribir test que falla para R6 — guarda de no regresión, verde por construcción; rojo comprobado por mutación (`2a21c83`)
- [x] (2) Implementación mínima que lo pasa — **no aplica, sin defecto observado**: acta §§1–6, las seis rutas cierran con «Sin corrección (R6)»
- [x] (3) Refactor con tests verdes — sin refactor: no se cambió ni una clase de ninguna superficie viva

## R7 — Veredicto explícito para los tres sospechosos ya identificados

- [x] (1) Escribir test que falla para R7 — test rojo: 4 aserciones, ningún veredicto en el acta (`3f7a34b`)
- [x] (2) Implementación mínima que lo pasa — acta §5 (R7-2) y §6 (R7-1 y R7-3), los tres con medida y veredicto (`ac89c3e`)
- [x] (3) Refactor con tests verdes — sin refactor

## R8 — Área táctil medida y declarada; densidad de la feature 23 intacta

- [x] (1) Escribir test que falla para R8 — test rojo: 5 aserciones, sección 7 en PENDIENTE (`6398777`)
- [x] (2) Implementación mínima que lo pasa — acta §7 con los cinco rectángulos y la deuda de 44px (`f047195`)
- [x] (3) Refactor con tests verdes — sin refactor: no se tocó la altura de ningún control

## R9 — El acta `progress/verify_ui-responsive-375.md` existe, completa y firmada

- [x] (1) Escribir test que falla para R9 — test rojo: el plan no citaba el acta (`be3d228`)
- [x] (2) Implementación mínima que lo pasa — plan cerrado conservando el fallo de `resize_window` (`9cbf676`)
- [x] (3) Refactor con tests verdes — sin refactor. §8 sigue en PENDIENTE: es el gate humano

## R10 — `pnpm test` y `pnpm build` en verde sin editar aserciones existentes

- [x] (1) Escribir test que falla para R10 — guarda de no regresión, verde por construcción; rojo comprobado por mutación (`714fee3`)
- [x] (2) Implementación mínima que lo pasa — **no aplica, sin defecto observado**: `pnpm test` 596/596 y `pnpm build` en verde sin editar ninguna aserción ajena
- [x] (3) Refactor con tests verdes — sin refactor
