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

- [ ] (1) Escribir test que falla para R1
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R2 — Inventario cerrado: seis rutas, todas las superficies vivas, ninguna muerta

- [ ] (1) Escribir test que falla para R2
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R3 — Cero scroll horizontal de página en las seis rutas

- [ ] (1) Escribir test que falla para R3
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R4 — Meta `viewport` intacta y cero anchos fijos > 375px (excepción: el slide del PDF)

- [ ] (1) Escribir test que falla para R4
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R5 — Los patrones responsive vigentes se conservan

- [ ] (1) Escribir test que falla para R5
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R6 — Corrección condicional, mobile-first, sin efecto a ≥ 640px

- [ ] (1) Escribir test que falla para R6
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R7 — Veredicto explícito para los tres sospechosos ya identificados

- [ ] (1) Escribir test que falla para R7
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R8 — Área táctil medida y declarada; densidad de la feature 23 intacta

- [ ] (1) Escribir test que falla para R8
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R9 — El acta `progress/verify_ui-responsive-375.md` existe, completa y firmada

- [ ] (1) Escribir test que falla para R9
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R10 — `pnpm test` y `pnpm build` en verde sin editar aserciones existentes

- [ ] (1) Escribir test que falla para R10
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes
