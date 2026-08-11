---
feature: "ui-surfaces-detail-forms"
status: draft        # draft | approved
tags: [harness, spec, frontend, ui, detail, forms, accessibility]
---

# Tareas — [[ui-surfaces-detail-forms]]

> Disciplina TDD. Cada bloque sigue test rojo → implementación mínima →
> refactor con tests verdes. Las caracterizaciones de preservación pueden nacer
> verdes; el rojo debe provenir primero del comportamiento nuevo del requisito.

## R1 — Filas de definición, secciones y total único

- [ ] (1) Escribir tests R1 que fallen por cajas `DetailItem`, tercera columna, comentarios y jerarquía actual
- [ ] (2) Implementar filas `dt`/`dd`, dos columnas, secciones y total a ancho completo
- [ ] (3) Refactor con semántica y tests de detalle verdes

## R2 — Timeline por `toStatus`

- [ ] (1) Escribir tests R2 para los ocho tokens, punto reciente, puntos anteriores y nota
- [ ] (2) Implementar el mapeo semántico y los estilos normativos mínimos
- [ ] (3) Refactor sin duplicar colores ni alterar el orden del historial

## R3 — Banner, sidebar y preview preservados

- [ ] (1) Escribir tests R3 para radio/icono/contraste, sticky 22rem, flex-wrap y radio del preview
- [ ] (2) Aplicar radios semánticos y conservar contratos de documento
- [ ] (3) Ejecutar los casos de carga, error, retry y retorno de foco con tests verdes

## R4 — Acciones al pie y variantes semánticas

- [ ] (1) Escribir tests R4 que fallen por composición/footers/variantes actuales
- [ ] (2) Componer el área de acciones en la columna principal y aplicar footers/variantes
- [ ] (3) Refactor conservando gates y `flex-col ... sm:flex-row`

## R5 — Confirmar rechazo y completar

- [ ] (1) Caracterizar los diálogos de rechazo y escribir primero tests rojos para completar y errores visibles dentro del diálogo
- [ ] (2) Implementar cancelación, confirmación `confirm`, bloqueo y retry mínimos
- [ ] (3) Refactor manteniendo foco de Dialog y una sola llamada por confirmación

## R6 — Asociación, anuncio y foco común

- [ ] (1) Escribir tests R6 por formulario para ids, `aria-describedby`, `aria-invalid`, alert y primer foco
- [ ] (2) Implementar helpers locales simples y separar errores de cliente/API
- [ ] (3) Refactor con mensajes adyacentes y navegación de teclado verdes

## R7 — Blur y orden de foco de `OdcForm`

- [ ] (1) Escribir tests R7 que fallen al salir de cada requerido y al enviar varios inválidos
- [ ] (2) Validar un campo con `odcFormSchema`, validar proveedor y enfocar en el orden fijado
- [ ] (3) Refactor conservando limpieza individual, payload y guardar/enviar

## R8 — Collapsible, densidad y resumen de `OdcForm`

- [ ] (1) Escribir tests R8 para comentarios cerrado/abierto, gap, grid, sticky, desglose, total y footer
- [ ] (2) Implementar la composición mínima con primitivas existentes
- [ ] (3) Refactor conservando valores prellenados y total en vivo

## R9 — Blur/foco de registro de pago

- [ ] (1) Escribir tests R9 para fecha/método, passthrough de DatePicker, orden de foco y opcionales
- [ ] (2) Implementar errores por campo, footer confirm y loading
- [ ] (3) Refactor conservando payload, toast, transición, duplicados y retry

## R10 — Archivo de evidencia en change

- [ ] (1) Escribir tests R10 para required/MIME/tamaño en change, asociación y foco
- [ ] (2) Implementar validación local al archivo y footer navy con loading
- [ ] (3) Refactor conservando referencia opcional, payload, toast y retry

## R11 — Factura, fecha de almacén y diálogo

- [ ] (1) Escribir tests R11 para archivo en change, fecha en blur, opcionales y orden de foco
- [ ] (2) Implementar errores por campo y paso al diálogo de R5
- [ ] (3) Refactor conservando archivo, payload, transición y retry

## R12 — Login en blur, foco y loading

- [ ] (1) Escribir tests R12 para email/password en blur, orden de foco y request pendiente
- [ ] (2) Implementar validación con `loginSchema`, busy, disabled y texto de carga
- [ ] (3) Refactor conservando 401, store, navegación y copy de #29

## R13 — Radio semántico de Toast

- [ ] (1) Escribir test R13 que falle por `rounded-2xl!`
- [ ] (2) Sustituir solo el radio del toast por `rounded-card` sin `!`
- [ ] (3) Refactor con test de la primitiva verde

## R14 — Preservación transversal y verificación visual

- [ ] (1) Nombrar con R14 las caracterizaciones necesarias de gates, API, datos, previews, toasts y responsive en riesgo
- [ ] (2) Mantener producción sin dependencias, colores crudos ni regresiones de contratos
- [ ] (3) Ejecutar suites dirigidas, `./init.sh` y verificación light/dark en 768/1024/1440; registrar que 375 queda para #28
