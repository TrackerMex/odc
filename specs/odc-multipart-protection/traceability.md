---
feature: "odc-multipart-protection"
status: implemented
tags: [harness, spec]
---

# Trazabilidad - [[odc-multipart-protection]]

Tests en `backend/src/modules/odc/infrastructure/controller/`.

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `odc-multipart.http.spec.ts::R1: valid content, inclusive size and metadata` (ambas rutas, 3 formatos, 10 MiB y vacío); fixtures reales en `odc.controller.spec.ts` | rojo `5e226d9` → verde `f0ad2db`; fixtures `903f0b4` |
| R2 | `odc-multipart.http.spec.ts::R2: limit during streamed reception, before buffering or effects` (+1 byte y +4 MiB, 413, sin Buffer completo excesivo ni efectos) | rojo `5e226d9` → verde `f0ad2db` |
| R3 | `odc-multipart.http.spec.ts::R3: detect signatures and match declared MIME` (MIME falso, texto, ausente, truncados, formato no permitido) | rojo `5e226d9` → verde `f0ad2db` |
| R4 | `odc-multipart.http.spec.ts::R4,R5: bounded and flat multipart fields` (campos/partes/archivos, 8192/+1 UTF-8, nombres 100/+1, duplicados, estructura, orden de campos) | rojo `5e226d9` → verde `f0ad2db` |
| R5 | `odc-upload-dependencies.spec.ts::R5: patched Multer in both runtime dependency paths`; casos de estructura de R4/R5 con parser real | rojo `341c48c` → versión corregida `e90e455`; límites cero y traducción por código `f0ad2db` |
| R6 | `odc-multipart.http.spec.ts::R6: guards precede parsing; every rejection preserves state`; `expectNoEffects` en todos los casos rechazados | caracterización test-primero `5e226d9` (guards existentes ya verdes); garantías de nuevos rechazos `f0ad2db` |
| R7 | `odc-multipart.http.spec.ts::R7: real Nest/Multer HTTP upload boundary` (suite HTTP completa, casos de uso/dominio reales, DB y Cloudinary simulados) | rojo `5e226d9` (34 fallos/38 verdes) → verde `f0ad2db` (84 HTTP + 2 dependencias; 12 casos adicionales de orden/opcionales/stream truncado); gate completo registrado en [[../../progress/impl_odc-multipart-protection]] |

La spec fue aprobada por el humano en `3e07ccc` antes de código.
La implementación conserva ambas rutas, roles, DTOs y transiciones existentes.
La prueba humana de negocio se realiza en el equipo del usuario; la feature
permanece `in_progress` hasta esa evidencia. No se declara `done` ni se abre #35.
