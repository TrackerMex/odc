---
feature: "frontend-dashboard-template"
status: verified
tags: [harness, spec, frontend, dashboard]
---

# Trazabilidad — [[frontend-dashboard-template]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | frontend/src/components/layout/app-layout.test.tsx::R1: frontend-dashboard-template shell preserves route context, permissions and controls | test fba3c47; feat 247f41b |
| R2 | frontend/src/components/odc/executive-dashboard.test.tsx::frontend-dashboard-template R2: financial panel, priority and operating context | test efd77fb; feat 31d5695 |
| R3 | frontend/src/components/odc/executive-dashboard.test.tsx::frontend-dashboard-template R3: real monthly comparison and edge cases | test efd77fb; feat 31d5695 |
| R4 | frontend/src/components/odc/executive-dashboard.test.tsx::frontend-dashboard-template R4: complete and accessible priority table | test efd77fb; feat 31d5695 |
| R5 | frontend/src/components/odc/executive-dashboard.test.tsx::frontend-dashboard-template R5: supplier bars and independent empty states | test efd77fb; feat 31d5695 |
| R6 | frontend/src/components/odc/executive-dashboard.test.tsx::frontend-dashboard-template R6: loading announcement and recovery | test efd77fb; feat 31d5695 |
| R7 | frontend/e2e/dashboard-template.spec.ts::frontend-dashboard-template R1,R2,R7 (tres roles, cuatro anchos, dos temas, teclado, targets y movimiento reducido); frontend/src/styles.tokens.test.ts::R5 contraste | test 1cccb99, 2b0f493; feat 755b2af |
| R8 | frontend/src/design-system.guardrails.test.ts::frontend-dashboard-template R8: template provenance; init.sh | test 1cccb99; feat 755b2af |

El implementer actualiza cada fila tras su commit. No declarar `done` con filas pendientes. Adjuntar evidencia visual de R7 junto a los tests, sin sustituir comprobaciones funcionales. Ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]].
