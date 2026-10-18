---
feature: "dev-startup-dependency-reuse"
status: draft
tags: [harness, spec, tooling]
---

# Trazabilidad — [[dev-startup-dependency-reuse]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `scripts/dependencies.test.cjs::R1: preparation pins Corepack pnpm even when global pnpm differs`; rechazo de gestor declarado distinto | rojo `385601a`; verde `e015495` (helper); wiring `scripts/dependency-wiring.test.cjs::R1`, rojo `2bc1258`, verde `10ba366` |
| R2 | `scripts/dependencies.test.cjs::R2: repeated warm checks and starts are readonly, bounded and never install`; arranque frontend Docker | rojo `385601a`; verde `e015495` |
| R3 | `scripts/dependencies.test.cjs::R3`: cambios de entradas/presencia opcional, entorno incompatible, archivos conocidos ausentes y metadata YAML/JSON | rojo `385601a`, `fbd69ee`; verde `e015495` |
| R4 | `scripts/dependencies.test.cjs::R4`: setup congelado, snapshots fiables, fallo/throw/mutación invalida evidencia y conserva dependencias | rojo `385601a`; verde `e015495` |
| R5 | `scripts/dependency-wiring.test.cjs::R2 R5: Compose guards both daily commands and preserves isolated dependency volumes`; `::R5: Docker snapshot executes against real build inputs and publishes portable runtime metadata`; integración Docker fresh/warm/restart/marca ausente/bind local divergente/setup offline/warm final en reporte | rojo `2bc1258`; verde `10ba366` |
| R6 | `scripts/dependencies.test.cjs::R6: executable init configuration only guards dependencies and preserves full verification`; `R6: unprepared dependencies stop init before frontend guard and expensive checks` | rojo `0657a35`; verde `6ec5694`; init completo del líder y reviewer exit0: builds, 34+885+691 pruebas y lint |
| R7 | `scripts/dependency-wiring.test.cjs::R7: Git ignores stores and markers, and Docker contexts exclude caches and local package policies`; hashes locales preservados y guía operativa verificada en reporte | rojo `2bc1258`; verde `10ba366` |

El implementer registra tests con R-ids y evidencia de integración; el reviewer confirma que no quedan filas pendientes antes de aprobar. Ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]].
