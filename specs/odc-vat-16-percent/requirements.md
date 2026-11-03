---
feature: "odc-vat-16-percent"
status: draft        # draft | approved
tags: [backend, frontend, odc, spec]
---

# Requisitos — [[odc-vat-16-percent]]

> Requisitos verificables en notación EARS. Ver [[design]] para el diseño y
> [[../../docs/architecture|architecture]] para las reglas de capas.

## Requisitos funcionales

- **R1 — Cálculo de ODC nuevas**: WHEN Operaciones crea una ODC después de
  habilitar esta feature THE SYSTEM SHALL tratar cada precio unitario como
  importe antes de IVA; calcular `subtotalCents` como suma de cantidad ×
  `unitPriceCents`; establecer `vatRateBps = 1600`; calcular `vatCents` una
  sola vez sobre el subtotal al 16 %, redondeando al centavo más cercano
  (mitades hacia arriba); y calcular `totalCents = subtotalCents + vatCents`.
  Todos los importes SHALL ser centavos enteros. Ejemplos: subtotal 10000 →
  IVA 1600 → total 11600; subtotal 3 → IVA 0 → total 3; subtotal 4 → IVA 1 →
  total 5. El IVA se calcula sobre el subtotal de la ODC, no se suma un IVA
  redondeado por cada partida. *Verificación*: tests de dominio con una y
  múltiples partidas, bordes de redondeo y tasa 1600 aun si el IVA redondea a 0.

- **R2 — Edición y transiciones**: WHEN el creador autorizado guarda cambios
  en una ODC gravada `BORRADOR` o `RECHAZADA` THE SYSTEM SHALL recalcular y
  persistir atómicamente subtotal, IVA y total a partir de las partidas
  guardadas, manteniendo tasa 1600. WHEN se realiza una transición de estado,
  aprobación, rechazo, pago o carga de documentos THE SYSTEM SHALL conservar
  los importes y la tasa persistidos salvo una edición autorizada conforme a
  R2 o R3; SHALL conservar las reglas vigentes de rol, propietario, concurrencia
  e historial. IF falla validación o concurrencia THEN THE SYSTEM SHALL no
  persistir cambios parciales. *Verificación*: tests de creación, edición de
  borradores y rechazadas, recálculo, transiciones, permisos y conflicto.

- **R3 — Órdenes históricas**: WHEN la migración se aplica a ODC existentes
  THE SYSTEM SHALL conservar su total anterior como `subtotalCents` y
  `totalCents`, establecer `vatRateBps = 0` y `vatCents = 0`, sin alterar
  partidas, estado, fechas, versión ni historial. WHEN el creador autorizado
  guarda una edición de un `BORRADOR` histórico THE SYSTEM SHALL cambiar su
  tasa a 1600 y recalcular los importes según R1 en la misma transacción; el
  cambio aplica incluso si solo modifica datos de cabecera o guarda sin cambiar
  partidas. La lectura, la apertura del formulario y una transición directa sin
  guardado previo SHALL NOT cambiar la tasa ni los importes persistidos. El
  flujo actual de guardar y enviar desde el formulario guarda primero; por ello
  SHALL aplicar 16 % al borrador histórico cuando ese guardado tenga éxito,
  antes de la transición de envío. IF el guardado falla THEN THE SYSTEM SHALL
  conservar la tasa e importes persistidos anteriores; IF el envío falla tras
  un guardado exitoso THEN THE SYSTEM SHALL conservar el desglose guardado al
  16 % y el estado anterior a la transición. Para esta propuesta, una ODC que
  ya estaba `RECHAZADA` al migrar conserva tasa histórica 0 al editarse y
  reenviarse; si se cambian partidas, se recalcula el subtotal sin IVA. Una ODC
  migrada en otro estado que después sea rechazada también conserva tasa 0.
  Un borrador histórico guardado con tasa 1600 la conserva si después es
  rechazado. Esta interpretación de las rechazadas queda explícitamente sujeta
  a aprobación humana. *Verificación*: comparar todas las etapas y probar
  edición sin cambios, guardado y envío fallidos en sus respectivas etapas,
  envío directo, rechazadas históricas y una orden nueva cuyo IVA redondea a
  cero, sin confundir tasa 0 con tasa 1600.

- **R4 — API y compatibilidad**: WHEN una operación autenticada devuelve una
  ODC completa en creación, edición, detalle, lista o transición THE SYSTEM
  SHALL devolver `items[]`, `subtotalCents`, `vatRateBps`, `vatCents` y
  `totalCents` coherentes y conservar los campos escalares existentes como
  proyección de la primera partida. `totalCents` representa el total final
  con IVA para órdenes gravadas y el total histórico para las migradas sin IVA.
  Los campos fiscales SHALL ser calculados por el servidor; los valores
  enviados por el cliente no SHALL modificar tasa ni importes y SHALL seguir
  la política de whitelist existente. La visibilidad y autorización existentes
  SHALL mantenerse. *Verificación*: tests HTTP/DTO y serialización para ambos
  formatos de entrada, datos fiscales manipulados, permisos y lecturas de ODC
  nuevas e históricas.

- **R5 — Presentación y agregados**: WHEN Operaciones captura o revisa una
  ODC THE SYSTEM SHALL mostrar subtotal, IVA y total en la captura, vista
  previa y detalle. WHILE se edita un borrador histórico THE SYSTEM SHALL
  mostrar en captura y vista previa el desglose proyectado al 16 % y avisar
  que se aplicará al guardar; esta proyección SHALL NOT alterar los valores
  persistidos antes de un guardado exitoso. WHEN Administración o Dirección
  General revisa o aprueba una ODC THE SYSTEM SHALL mostrar el mismo desglose
  persistido. Las órdenes
  históricas SHALL indicar que se registraron sin IVA, sin calificarlas como
  exentas; una tasa 1600 con `vatCents = 0` SHALL mostrarse como IVA 16 % de
  $0.00. Las listas compactas, dashboard, analíticas, resumen mensual y su
  exportación SHALL seguir usando `totalCents`: IVA incluido para órdenes
  nuevas e importe histórico para las anteriores; sus agregados SHALL ser la
  suma de esos totales, sin volver a añadir IVA. *Verificación*: tests de UI,
  repositorio y reportes con una orden de cada régimen y redondeo a cero.

- **R6 — Migración y backfill**: WHEN se prepara el esquema fiscal THE SYSTEM
  SHALL proveer una migración SQL versionada y transaccional, posterior al
  esquema de partidas 040 o a su equivalente ya desplegado, que verifique
  previamente que las partidas persistidas y totales históricos son coherentes
  antes de establecer los valores de R3. IF faltan partidas requeridas,
  existen inconsistencias o falla cualquier paso THEN THE SYSTEM SHALL abortar
  sin cambios parciales e identificar la ODC o precondición que requiere
  conciliación. La migración SHALL verificarse en PostgreSQL aislado con ODC en
  varios estados, comparando cabeceras, partidas e historial y ensayando
  rollback antes de aplicarse a una base compartida. *Verificación*: prueba de
  migración y rollback en base aislada; preparación y revisión de precondiciones
  para el entorno destino antes de cualquier aplicación compartida.

- **R7 — Límites e integridad**: IF alguna cantidad, precio, producto,
  subtotal, IVA o total excede los límites enteros vigentes o PostgreSQL `int`,
  o no puede calcularse con precisión entera THEN THE SYSTEM SHALL rechazar la
  operación antes de persistir, mediante HTTP 400 en entrada y error de dominio
  equivalente fuera de HTTP. El cálculo SHALL validar explícitamente el total
  después de sumar IVA y usar aritmética que no desborde en los productos
  intermedios. WHEN se hidrata una ODC THE SYSTEM SHALL validar su desglose
  coherente con partidas, tasa y total sin imponer la antigua igualdad de
  `totalCents` con la suma de partidas para órdenes gravadas. *Verificación*:
  pruebas de límites exactos y desbordamiento por IVA, resultados históricos y
  gravados, datos inconsistentes y ausencia de escritura ante error.

## Decisiones propuestas para revisión humana

- El plan exceptúa del tratamiento histórico solamente a los borradores
  antiguos al guardar una edición. Por ello R3 conserva tasa 0 en rechazadas
  históricas incluso si se editan; confirmar si también deben pasar a 16 %.
- En un borrador histórico, cualquier guardado autorizado cuenta como edición,
  aunque solo cambie comentarios o no cambie partidas. El botón del formulario
  que guarda y envía guarda primero y aplica IVA; una transición directa de
  envío sin guardar mantiene el importe histórico. Confirmar este comportamiento.
- Una tasa 0 identifica un registro histórico sin IVA aplicado, no una
  clasificación fiscal de exención. No se incorpora un selector de tasa.

## Fuera de alcance

- Cotizaciones adjuntas; exenciones, tasas variables y tratamiento fiscal por
  proveedor o partida; cálculos de retenciones u otros impuestos.
- Crear o aprobar el concentrado semanal. Su futura spec deberá conservar el
  desglose fiscal como parte de su instantánea.
- Alterar permisos o estados de ODC; modificar precios históricos por la
  migración; desplegar o ejecutar la migración en una base compartida sin
  verificar sus precondiciones.

## Aprobación

- [ ] Aprobado por humano (fecha: ____)
