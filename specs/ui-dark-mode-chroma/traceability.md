---
feature: "ui-dark-mode-chroma"
status: approved     # draft | approved
tags: [harness, spec, frontend, design-system, tokens, dark-mode]
---

# Trazabilidad — [[ui-dark-mode-chroma]]

Todos los tests viven en `frontend/src/styles.tokens.test.ts`.

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `styles.tokens.test.ts::ui-dark-mode-chroma R1: techo de saturación s = C/L congelado` | test `8ab92a2` + feat `f8bff45` |
| R2 | `styles.tokens.test.ts::ui-dark-mode-chroma R2: suelo del 85% de saturación en dark` | test `8ab92a2` + feat `f8bff45` |
| R3 | `styles.tokens.test.ts::ui-dark-mode-chroma R3: --ring y los alias del sidebar siguen a --primary` | test `8ab92a2` + feat `f8bff45` |
| R4 | `styles.tokens.test.ts::ui-dark-mode-chroma R4: .dark --primary es una superficie clara` | test `8ab92a2` + feat `f8bff45` |
| R5 | `styles.tokens.test.ts::ui-dark-mode-chroma R5: ningún token declarado fuera del gamut sRGB` | test `a3d26a3` + feat `1cd88ea` |
| R6 | `styles.tokens.test.ts::ui-dark-mode-chroma R6: el primario de dark contrasta con sus fondos` (+ los 26 pares vigentes de `R5: contraste WCAG 2.1 >= 4.5:1 en los pares auditados`) | test `a3d26a3` + feat `1cd88ea` |
| R7 | `styles.tokens.test.ts::ui-dark-mode-chroma R7: el verde es un color en dos papeles` (hues e identidad en light) + verificación manual del reviewer sobre `design-system/odc/MASTER.md` §1, "Acotación 2026-08-11" | test `2c423f0` + feat `4be24a0` |
| R8 | `styles.tokens.test.ts::ui-dark-mode-chroma R8: los tests afirman invariantes, no literales nuevos` | test `2c423f0` (auditoría del propio archivo; sin implementación asociada) |
| R9 | `styles.tokens.test.ts::ui-dark-mode-chroma R9: la verificación en navegador existe` | test `2c423f0` + feat `4be24a0` (esqueleto). **Abierto**: sub-items (2) y (3) — la sesión de navegador y el veredicto humano |
| R10 | `styles.tokens.test.ts::ui-dark-mode-chroma R10: la enmienda queda registrada en la spec de la 23` | test `2c423f0` + feat `4be24a0` |
| R11 | `styles.tokens.test.ts::ui-dark-mode-chroma R11: sin dependencias nuevas en frontend` | test `2c423f0` (`pnpm test` 353/353 y `pnpm build` en verde tras `4be24a0`) |

R7 se cubre en parte con test (hues e identidad en light) y en parte con
verificación manual (el texto de `design-system/odc/MASTER.md` §1): anotadas ambas
en la fila.
R9 se cierra con `progress/verify_ui-dark-mode-chroma.md` y el veredicto humano,
no solo con el test de existencia. **Hoy el archivo existe con las 4 secciones
marcadas PENDIENTE**: el implementer no rellena valores de `getComputedStyle` ni
redacta veredictos humanos, sería fabricar evidencia de verificación.

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
