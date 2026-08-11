---
feature: "ui-surfaces-dashboards"
status: approved     # draft | approved
tags: [harness, spec, frontend, design-system, surfaces, dashboards]
---

# Tareas — [[ui-surfaces-dashboards]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> tiene siempre los mismos 3 sub-items, en este orden.
>
> Los tests de auditoría de código fuente van a
> `frontend/src/design-system.guardrails.test.ts`; los de render, al
> `*.test.tsx` del componente correspondiente. Ver la tabla "Dónde vive cada
> test" de [[design]].
>
> Recordatorio de R13: los tests afirman **invariantes**. Un valor visual solo
> puede fijarse en un test si está escrito en `design-system/odc/MASTER.md` o en
> `design-system/odc/pages/dashboard.md`.
>
> **Orden obligatorio: R1 y R2 primero** (fase 3e). El badge se ve en las cinco
> superficies de 3a; cambiarlo después obligaría a revisarlas dos veces.
> Después R3–R11 superficie por superficie, y R12–R15 al cierre.

## R1 — El badge consume los 8 pares de tokens `--status-*`, sin variantes `dark:`

- [X] (1) Escribir test que falla para R1
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R2 — El badge conserva su contrato accesible (`data-status`, etiqueta, sin borde, motion-reduce)

- [X] (1) Escribir test que falla para R2
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R3 — Ancho `max-w-[1400px]` y padding de página `p-4 sm:p-6` en las cinco superficies

- [X] (1) Escribir test que falla para R3
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R4 — Header compacto: `h1` a `text-2xl` y fuera el párrafo descriptivo

- [X] (1) Escribir test que falla para R4
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R5 — Etiquetas en mayúsculas a `tracking-[0.06em]` (14 apariciones)

- [X] (1) Escribir test que falla para R5
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R6 — Densidad de los CTA: fuera `size="lg"` (cierre de D-V3 en el dashboard)

- [X] (1) Escribir test que falla para R6
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R7 — Tarjetas de cola: barra de acento de 2px, radio, padding y estado vacío

- [X] (1) Escribir test que falla para R7
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R8 — Contadores a `text-2xl` en `--muted-foreground`, con la excepción de `RECHAZADA`

- [X] (1) Escribir test que falla para R8
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R9 — Filas más densas conservando hover, foco e importe tabular

- [X] (1) Escribir test que falla para R9
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R10 — Cero `rounded-xl` / `rounded-2xl` en los seis archivos (15 apariciones)

- [X] (1) Escribir test que falla para R10
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R11 — Cero color literal en los seis archivos; el ámbar de las alertas pasa a `--status-pending`

- [X] (1) Escribir test que falla para R11
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R12 — Las seis aserciones sobre `className` y texto siguen intactas

- [X] (1) Escribir test que falla para R12 — ampliar el bloque de guardas con las
      2 filas nuevas (`executive-dashboard.test.tsx:143`,
      `general-dashboard.test.tsx:88`)
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R13 — Los tests afirman invariantes, no valores visuales inventados

- [X] (1) Escribir test que falla para R13 — auditoría del propio código de test
      de esta feature
- [X] (2) Implementación mínima que lo pasa
- [X] (3) Refactor con tests verdes

## R14 — Verificación en navegador antes del cierre

- [X] (1) Escribir test que falla para R14 — existencia y estructura mínima de
      `progress/verify_ui-surfaces-dashboards.md` (las 5 secciones); el contenido
      visual lo juzga el humano, no el test
- [X] (2) Ejecutar la sesión en navegador y redactar el archivo, con lecturas en
      vivo de `getComputedStyle` — hecho por el leader el 2026-08-11, sesiones
      `DIRECTOR_OPS` y `ADMINISTRACION`, ambos temas
- [X] (3) Recoger el veredicto humano con fecha, y la observación sobre la
      saturación de las badges de dark — veredicto **afirmativo** de Alexis,
      2026-08-11, §5 del acta; la observación de las badges queda en §3 sin abrir
      feature, a revisar cuando varias coincidan en pantalla

## R15 — Alcance cerrado, sin dependencias nuevas, build y tests en verde

- [X] (1) Escribir test que falla para R15 — `frontend/package.json` sin
      dependencias nuevas
- [X] (2) `pnpm test` y `pnpm build` en verde
- [X] (3) `git status` limpio fuera de la lista de archivos de [[design]] —
      en particular `frontend/src/styles.css` y `frontend/src/components/ui/`
      sin tocar
