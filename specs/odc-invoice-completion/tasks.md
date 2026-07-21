---
feature: "odc-invoice-completion"
status: draft        # draft | approved
tags: [harness, spec]
---

# Tareas — [[odc-invoice-completion]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> tiene siempre los mismos 3 sub-items, en este orden.
>
> Nota de orden sugerido (no obligatorio): R1–R3 (`UploadInvoiceDto` +
> `UploadInvoiceUseCase`) no dependen de R5–R7 y pueden implementarse
> primero, replicando directamente el patrón de T8. R4 (mapper de respuesta)
> tampoco depende de los demás y puede ir en cualquier momento. R7 (generalizar
> la ruta a `:kind`) depende de que `GetInvoiceFileUseCase` (R5, R6) ya exista,
> porque el handler generalizado debe poder despachar a ambos use-cases desde
> el primer commit que lo introduce — implementarlo al final evita dejar la
> ruta de `odc-payment-evidence` rota a medio camino.

## R1 — `UploadInvoiceDto` + validación de archivo (MIME/tamaño) y `warehouseEntryDate` obligatorio, 400 si falta o es inválido

- [ ] (1) Escribir test que falla para R1
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R2 — `POST /api/odcs/:id/invoice` (T9): éxito DIRECTOR_OPS sube a Cloudinary, persiste `public_id` y transiciona a COMPLETADA; 403 otro rol

- [ ] (1) Escribir test que falla para R2
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R3 — invoice: 404 id inexistente, 409 si no está en EVIDENCIA_PAGO_SUBIDA, sin subir a Cloudinary en ningún caso de error

- [ ] (1) Escribir test que falla para R3
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R4 — Respuestas de ODC nunca exponen `invoiceFile` crudo; exponen `hasInvoice` booleano

- [ ] (1) Escribir test que falla para R4
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R5 — `GET /api/odcs/:id/files/invoice`: 302 a URL firmada de Cloudinary de corta expiración

- [ ] (1) Escribir test que falla para R5
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R6 — files/invoice: 404 id inexistente, 404 sin factura aún, 403 BORRADOR ajeno

- [ ] (1) Escribir test que falla para R6
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R7 — Generalizar `GET /api/odcs/:id/files/:kind` (evidence|invoice) sin regresión de odc-payment-evidence; 400 si `kind` no es soportado

- [ ] (1) Escribir test que falla para R7
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes
