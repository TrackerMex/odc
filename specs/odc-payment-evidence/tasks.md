---
feature: "odc-payment-evidence"
status: draft        # draft | approved
tags: [harness, spec]
---

# Tareas — [[odc-payment-evidence]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> tiene siempre los mismos 3 sub-items, en este orden.
>
> Nota de orden sugerido (no obligatorio): R7 (`FileStorageService` +
> `CloudinaryFileStorageService`) no depende de ningún otro requisito de esta
> feature y es una dependencia de R2 y R5 (los use-cases lo inyectan
> mockeado); implementarlo primero evita mocks provisionales. R4 (mapper de
> respuesta) tampoco depende de los demás y puede ir en cualquier momento.

## R1 — `UploadPaymentEvidenceDto` + validación de archivo (MIME/tamaño) antes de Cloudinary, 400 si falta o es inválido

- [ ] (1) Escribir test que falla para R1
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R2 — `POST /api/odcs/:id/payment-evidence` (T8): éxito ADMINISTRACION sube a Cloudinary y persiste `public_id`, 403 otro rol

- [ ] (1) Escribir test que falla para R2
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R3 — payment-evidence: 404 id inexistente, 409 si no está en PAGO_REGISTRADO

- [ ] (1) Escribir test que falla para R3
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R4 — Respuestas de ODC nunca exponen `paymentEvidenceFile` crudo; exponen `hasPaymentEvidence` booleano

- [ ] (1) Escribir test que falla para R4
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R5 — `GET /api/odcs/:id/files/evidence`: 302 a URL firmada de Cloudinary de corta expiración

- [ ] (1) Escribir test que falla para R5
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R6 — files/evidence: 404 id inexistente, 404 sin evidencia aún, 403 BORRADOR ajeno

- [ ] (1) Escribir test que falla para R6
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R7 — `FileStorageService` (puerto) + `CloudinaryFileStorageService` (adaptador), SDK mockeado en tests

- [ ] (1) Escribir test que falla para R7
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes
