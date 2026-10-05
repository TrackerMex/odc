---
feature: odc-temporary-file-delivery
status: in_progress
tags: [harness, spec]
---

# Trazabilidad — #35

| Requisito | Test / evidencia | Commit |
|---|---|---|
| R1 | `cloudinary-temporary-url.spec.ts::R1,R2 real SDK; odc-file-delivery.http.spec.ts redirects` | tests rojo `3499c74`; implementación en el siguiente commit |
| R2 | `cloudinary-temporary-url.spec.ts::R1,R2 independently signed expiry, time, tamper` | tests rojo `3499c74`; implementación en el siguiente commit |
| R3 | `cloudinary-temporary-url.spec.ts metadata/config errors; cloudinary-file-storage.service.spec.ts legacy errors; odc-file-delivery.http.spec.ts legacy and 404/502` | tests rojo `3499c74`; implementación en el siguiente commit |
| R4 | `odc-file-delivery.http.spec.ts::R4 (22 HTTP cases, 14 existing permission/error cases already green)` | tests rojo `3499c74`; implementación en el siguiente commit |
| R5 | pendiente | pendiente |
| R6 | pendiente | pendiente |

Rojo: 13 fallos / 5 verdes SDK, 8 fallos / 14 verdes HTTP. Verde: 40/40
en tres suites, log /tmp/odc35-green.log. Implementación separada del test.
