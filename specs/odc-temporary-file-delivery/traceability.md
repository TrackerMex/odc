---
feature: odc-temporary-file-delivery
status: done
tags: [harness, spec]
---

# Trazabilidad — #35

| Requisito | Test / evidencia | Commit |
|---|---|---|
| R1 | `cloudinary-temporary-url.spec.ts::R1,R2 real SDK; odc-file-delivery.http.spec.ts redirects` | tests rojo `3499c74`; verde `52ac0f7` |
| R2 | `cloudinary-temporary-url.spec.ts::R1,R2 independently signed expiry, time, tamper` | tests rojo `3499c74`; verde `52ac0f7` |
| R3 | `cloudinary-temporary-url.spec.ts metadata/config errors; cloudinary-file-storage.service.spec.ts legacy errors; odc-file-delivery.http.spec.ts legacy and 404/502` | tests rojo `3499c74`; verde `52ac0f7` |
| R4 | `odc-file-delivery.http.spec.ts::R4 (22 HTTP cases, 14 existing permission/error cases already green)` | tests rojo `3499c74`; verde `52ac0f7` |
| R5 | `cloudinary-live-probe.spec.ts::R5` (opt-in/config requeridos); `scripts/verify-temporary-file-delivery.cjs` acceso real **NOT RUN**, bloqueo y guía en `progress/verify_odc-temporary-file-delivery.md` | rojo `ca7c853`; verde `41d94b7` |
| R6 | `bash init.sh` exit 0, 610 backend / 661 frontend, builds/lint verdes; auto-revisión C1–C6 y guía `progress/verify_odc-temporary-file-delivery.md` | `798d0da` cierre técnico (recuento corregido a 610 en commit siguiente) |

Rojo: 13 fallos / 5 verdes SDK, 8 fallos / 14 verdes HTTP. Verde: 40/40
en tres suites, log /tmp/odc35-green.log. Implementación separada del test.
