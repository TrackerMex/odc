---
feature: "odc-quotation-attachments"
status: draft        # draft | approved
tags: [backend, frontend, odc, spec]
---

# Tareas — [[odc-quotation-attachments]]

Disciplina TDD: prueba roja, implementación mínima y refactor para cada R-id.
No comenzar hasta la aprobación humana de [[requirements]].

## R1 — Asociación múltiple
- [ ] (1) Probar cero, una y varias cotizaciones, persistencia e IVA histórico.
- [ ] (2) Implementar asociación individual a ODC propia en borrador o rechazada.
- [ ] (3) Refactorizar sin alterar estados, historial ni importes.

## R2 — Validación multipart
- [ ] (1) Probar límites, firmas y MIME con parser real.
- [ ] (2) Integrar los controles de carga existentes.
- [ ] (3) Refactorizar sin efectos ante entradas rechazadas.

## R3 — Acceso y consulta
- [ ] (1) Probar matriz de usuarios, estados, pertenencia y acceso a archivos.
- [ ] (2) Aplicar controles en todos los endpoints.
- [ ] (3) Refactorizar conservando la privacidad vigente.

## R4 — Retirada y limpieza
- [ ] (1) Probar desvinculación, errores, reintentos y protección de recursos.
- [ ] (2) Implementar desvinculación transaccional y limpieza durable segura.
- [ ] (3) Refactorizar sin afectar otros documentos.

## R5 — Recuperación y concurrencia
- [ ] (1) Probar fallos por etapa, reintento, reinicio y carreras con envío.
- [ ] (2) Extender tickets, asociación y recuperación con control de versión.
- [ ] (3) Refactorizar preservando el comportamiento anterior de archivos.

## R6 — Formulario y revisión
- [ ] (1) Probar selección múltiple, resultados, edición en rechazada, detalle y consulta por rol.
- [ ] (2) Integrar API y UI accesible.
- [ ] (3) Verificar visualmente en escritorio y móvil y refactorizar.

## R7 — Migración y regresión
- [ ] (1) Probar migración, rollback y conservación de datos en PostgreSQL aislado.
- [ ] (2) Crear migración y comprobar factura, comprobante y recuperación.
- [ ] (3) Documentar despliegue y ejecutar `./init.sh` y revisión independiente.
