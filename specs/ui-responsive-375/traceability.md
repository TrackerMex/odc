---
feature: "ui-responsive-375"
status: draft        # draft | approved
tags: [harness, spec, frontend, ui, responsive, verification]
---

# Trazabilidad — [[ui-responsive-375]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | pendiente | pendiente |
| R2 | pendiente | pendiente |
| R3 | pendiente | pendiente |
| R4 | pendiente | pendiente |
| R5 | pendiente | pendiente |
| R6 | pendiente | pendiente |
| R7 | pendiente | pendiente |
| R8 | pendiente | pendiente |
| R9 | pendiente | pendiente |
| R10 | pendiente | pendiente |

Los requisitos que solo se pueden observar en un navegador real (R1, R3, R7, R8)
citan en la columna de test la **sección del acta**
`progress/verify_ui-responsive-375.md` que los cierra, además de la guarda de
Vitest que exige esa sección completa. R6 puede cerrarse como "sin defecto
observado" citando el acta: es un resultado válido de esta feature, no una fila
pendiente.

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(<scope>): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
