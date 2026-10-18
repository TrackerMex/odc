---
feature: "dev-startup-dependency-reuse"
status: draft
tags: [harness, spec, tooling]
---

# Trazabilidad — [[dev-startup-dependency-reuse]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `scripts/dependencies.test.cjs::R1: preparation pins Corepack pnpm even when global pnpm differs`; rechazo de gestor declarado distinto | rojo `385601a`; verde `e015495` (helper; wiring Docker se registra aparte) |
| R2 | `scripts/dependencies.test.cjs::R2: repeated warm checks and starts are readonly, bounded and never install`; arranque frontend Docker | rojo `385601a`; verde `e015495` |
| R3 | `scripts/dependencies.test.cjs::R3`: cambios de entradas/presencia opcional, entorno incompatible, archivos conocidos ausentes y metadata YAML/JSON | rojo `385601a`, `fbd69ee`; verde `e015495` |
| R4 | `scripts/dependencies.test.cjs::R4`: setup congelado, snapshots fiables, fallo/throw/mutación invalida evidencia y conserva dependencias | rojo `385601a`; verde `e015495` |
| R5 | pendiente | pendiente |
| R6 | `scripts/dependencies.test.cjs::R6: executable init configuration only guards dependencies and preserves full verification`; `R6: unprepared dependencies stop init before frontend guard and expensive checks` | rojo `0657a35`; verde `6ec5694`; integración completa coordinada por líder/reviewer |
| R7 | pendiente | pendiente |

El implementer registra tests con R-ids y evidencia de integración; el reviewer confirma que no quedan filas pendientes antes de aprobar. Ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]].
