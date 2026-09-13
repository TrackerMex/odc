# Implementation Plans

Índice de planes y revisiones. Actualizado el 2026-09-13.
Cada ejecutor: lee el plan completo antes de empezar, respeta sus condiciones
de STOP y actualiza su fila al terminar.

## Execution order & status

| Plan | Título | Priority | Effort | Depends on | Status |
|------|--------|----------|--------|------------|--------|
| [001](001-odc-purchase-system.md) | Desarrollo del Sistema de Gestión de Compras (ODC), alcance v1 | P1 | L | — | DONE (F1–F13 completadas; no equivale a despliegue productivo) |
| [002](002-system-review.md) | Revisión integral: dashboard, operación y fiabilidad | P1 | L | 001 | DONE (diagnóstico; mejoras pendientes) |
| [Spec #32](../specs/executive-workspace-v2/requirements.md) | Workspace ejecutivo v2: analítica, filtros y creación revisable | P1 | L | 002 | TODO (spec preparada, aprobación humana pendiente) |

Valores de Status: TODO | IN PROGRESS | DONE | BLOCKED (con motivo de una línea) | REJECTED (con justificación de una línea)

El plan 001 es un plan maestro: se ejecuta por fases (Fase 0 + features F1–F13)
a través del pipeline SDD del repo (`AGENTS.md` §6), con gate de aprobación
humana por spec. Registrar el avance fino en `feature_list.json` y
`progress/current.md`; esta tabla solo refleja el estado global del plan.

## Dependency notes

- Dentro de 001: Fase 0 precede a todo; F1→F2→F3 son estrictamente secuenciales
  (config → auth → dominio ODC); F4–F8 dependen de F3; F9 depende de F2;
  F10–F13 dependen de F9 y de su feature backend correspondiente
  (F10←F3, F11←F4+F7, F12←F5, F13←F6+F8).

## Findings considered and rejected

- Presupuesto almacenado en sistema: descartado por decisión del humano
  (2026-07-18) — validación manual en v1. No re-proponer sin pedido explícito.
- ODC multi-línea: el mock aprobado define una sola línea por ODC — fuera de
  alcance v1.
