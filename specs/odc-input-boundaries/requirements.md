---
feature: odc-input-boundaries
status: approved
tags: [harness, spec]
---

# Requisitos — #37

F05 (P1) y F06 (P2 original conservado en plan002); entrega conjunta P1.
Depende de #36. Contrato elegido por delegación: cantidad, precio en centavos y
total deben ser enteros positivos de **1 a 2147483647** inclusive (int32).
No se cambia almacenamiento a bigint ni se aceptan cantidades fraccionarias.
Fecha civil gregoriana **YYYY-MM-DD**, año **0001–9999**, sin hora ni zona.
Fecha opcional de factura se omite cuando no hay valor; si se proporciona debe
ser válida, no null, vacía, timestamp ni calendario imposible.

- **R1**: WHEN se crea o edita una ODC THE SYSTEM SHALL validar cantidad,
  unitPriceCents y su producto como enteros seguros positivos <=2147483647
  antes de persistir. IF alguno incumple THEN responder400. Cubrir máximo,
  +1, negativos, cero, fracciones, NaN/Infinity y 50000*50000. El dominio
  computeTotalCents/createDraft/edit aplica la regla también fuera de HTTP;
  edición parcial calcula con el campo no modificado y rechaza sin mutar datos.
- **R2**: WHEN se registra pago o factura THE SYSTEM SHALL validar calendario
  real y formato exacto de paymentDate, warehouseEntryDate e invoiceDate
  opcional, tanto DTO como transition del dominio, antes de uploads/escrituras.
  Cubrir bisiestos 2000/2024, no bisiestos1900/2026, días/meses imposibles,
  límites0001/9999, año0000, timestamps/offsets y valores no string.
- **R3**: WHEN un usuario autorizado usa un id de ODC malformado THE SYSTEM
  SHALL devolver400 desde todos los endpoints con :id antes del caso de uso.
  UUID válido de cualquier versión soportada que no existe conserva404;
  guards se ejecutan antes de pipes y conservan401/403. No cambian los roles.
- **R4**: WHEN se cierra técnicamente THE SYSTEM SHALL tener tests con R-ids
  directos de dominio y HTTP de Nest real, sin persistir/subir tras rechazo,
  init verde, trazabilidad y guía de validación del usuario. Autorizaciones
  delegadas; no atribuir al usuario pruebas que no ha reportado.

## Aprobación

- [x] Aprobado por humano mediante delegación expresa (2026-10-05), antes de código.

«puedes terminar todas las features pendientes, tienes mi permiso para cada
aprobacion». La delegación incluye escoger el techo int32 y contrato de fecha
anteriores. No implica modificar registros históricos ni ejecutar producción.
