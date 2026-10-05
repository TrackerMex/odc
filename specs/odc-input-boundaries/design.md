---
feature: odc-input-boundaries
status: approved
tags: [harness, spec]
---

# Diseño — #37

Reutilizar PurchaseOrder.computeTotalCents en createDraft/edit: validar ambos
operandos y producto con Number.isSafeInteger, positivo y techo int32. Editar
calcula primero con el par final antes de cambiar cualquier campo. DTO agrega
Max al IsInt/IsPositive existente (PartialType hereda para PATCH). Error puro
InvalidOdcInputError se traduce400 en el handler compartido del controller.

Un helper puro isCalendarDate comprueba expresión regular yyyy-mm-dd sin año0,
parse UTC y roundtrip a la misma fecha. DTOs combinan Matches del mismo patrón
con IsDateString({strict:true}); no se crea decorador/framework nuevo. transition
valida las tres fechas proporcionadas antes de applyTransitionData y del
cambio de estado; requiredData trata tipos no string sin TypeError.

ParseUUIDPipe nativo en todos los @Param('id'); sin restringir a v4, respetando
UUID válidos existentes. Nest ya ejecuta guards antes de pipes. No se cambian
rutas ni frontend; sus inputs date ya envían YYYY-MM-DD y omiten fecha vacía.

Pruebas pequeñas parametrizadas de dominio y HTTP real con guards/use cases/
parser, repositorios y storage simulados, assertions de cero efectos. No hace
falta PostgreSQL real para comprobar validación antes de la persistencia.
