---
feature: "ui-surfaces-detail-forms"
status: draft        # draft | approved
tags: [harness, spec, frontend, ui, detail, forms, accessibility]
---

# Requisitos — [[ui-surfaces-detail-forms]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para el inventario de campos y decisiones, y
> [[../../docs/architecture|architecture]] para las reglas del proyecto.

## Requisitos funcionales

- **R1**: WHEN `/odcs/$id` renderiza los datos de una ODC, THE SYSTEM SHALL
  presentar `Descripción`, `Proveedor`, `Cantidad`, `Precio unitario` y
  `Última actualización` como pares semánticos `dt`/`dd` en filas de definición
  sin fondo ni radio de caja, separados por borde de 1px, en una columna base y
  dos columnas desde `sm`; SHALL no introducir una tercera columna en `lg`.
  `Total` SHALL ocupar una fila propia a ancho completo, con `border-t-2`,
  `text-xl font-semibold tabular-nums`, y SHALL ser el único valor enfatizado
  de ese modo. Los datos de pago y factura SHALL conservar sus condiciones de
  aparición y pasar a secciones con encabezado y `border-t`, sin cajas
  `DetailItem` anidadas. IF la ODC contiene `Comentarios`, THEN SHALL
  mostrarlos como una fila de definición a ancho completo, sin caja anidada.

- **R2**: WHEN `OdcDetail` renderiza historial, THE SYSTEM SHALL conservar el
  orden recibido y la línea conectora, y SHALL asignar a cada punto el token
  semántico correspondiente a su `toStatus` para los ocho estados ODC. La
  última entrada del arreglo SHALL mostrar un punto relleno con `ring-4`; todas
  las anteriores SHALL mostrar un punto hueco con borde de 1.5px. Cada entrada
  SHALL conservar la etiqueta textual de su transición, usar `pb-4` salvo la
  última y, IF contiene `note`, THEN SHALL mostrarla como texto con
  `border-l-2 pl-3`, sin fondo ni radio de caja.

- **R3**: WHEN una ODC rechazada tiene `rejectionReason`, THE SYSTEM SHALL
  conservar el banner y su texto usando únicamente tokens destructivos, radio
  `--radius-card` e icono de 1rem; el par de texto destructivo sobre su
  superficie SHALL mantener contraste WCAG AA de al menos 4.5:1 en light y
  dark. WHILE se renderiza el detalle, THE SYSTEM SHALL conservar el sidebar
  de historial de `22rem` con
  `xl:sticky xl:top-6`, el layout base apilado, el `flex-wrap` de las acciones
  de documentos y los contratos de vista previa protegida: carga diferida,
  endpoint por tipo, fallback externo, reintento, diálogo accesible y retorno
  de foco. Las superficies internas del preview SHALL usar el radio semántico
  del sistema y SHALL no reintroducir `rounded-xl` ni `rounded-2xl`.

- **R4**: WHEN `/odcs/$id` compone una acción permitida por rol y estado, THE
  SYSTEM SHALL colocar la superficie visible al pie de la columna principal
  del detalle, antes del sidebar en el orden de lectura, y SHALL conservar
  exactamente los gates vigentes: `AdminBudgetActions` para
  `ADMINISTRACION`+`PENDIENTE_ADMIN`, `GeneralApprovalActions` para
  `DIRECTOR_GENERAL`+`PRESUPUESTO_APROBADO`, `RegisterPaymentForm` para
  `DIRECTOR_OPS`+`COMPRA_APROBADA`, `PaymentEvidenceForm` para
  `ADMINISTRACION`+`PAGO_REGISTRADO` y `UploadInvoiceForm` para
  `DIRECTOR_OPS`+`EVIDENCIA_PAGO_SUBIDA`. Cada barra de acciones SHALL estar
  separada del contenido por `border-t`, ser vertical en base y horizontal
  cuando haya espacio desde `sm`, y SHALL conservar específicamente
  `flex-col ... sm:flex-row` en aprobación general. Aprobar presupuesto y
  compra, subir evidencia y enviar a Administración SHALL usar navy
  (`default`); registrar pago y completar la orden SHALL usar `confirm`;
  rechazar SHALL usar `destructive`; alternativas y cancelación SHALL usar
  `outline` o `ghost` según su jerarquía.

- **R5**: WHEN un usuario inicia un rechazo administrativo o general, THE
  SYSTEM SHALL conservar un `Dialog` de la primitiva local Base UI con título,
  explicación, motivo requerido, cancelación y confirmación destructiva, y
  SHALL no llamar `reject` hasta confirmar un motivo no vacío. WHEN un
  `DIRECTOR_OPS` intenta enviar una factura válida que completará la ODC, THE
  SYSTEM SHALL abrir un `Dialog` explícito que indique que la acción completa
  la orden, SHALL permitir cancelar sin llamar `upload`, y SHALL llamar
  `upload` una sola vez únicamente al activar `Completar orden` con variante
  `confirm`. WHILE cualquiera de esas mutaciones está pendiente, THE SYSTEM
  SHALL conservar el diálogo, bloquear duplicados y mostrar texto de carga;
  IF la API falla, THEN SHALL conservar los datos, el estado anterior y una
  acción habilitada para reintentar, y SHALL mostrar el error recuperable
  dentro del diálogo activo, no oculto detrás del overlay.

- **R6**: WHEN cualquier validación de cliente de los cinco formularios de
  esta feature falla, THE SYSTEM SHALL mostrar el mensaje junto al campo,
  anunciarlo con `role="alert"`, marcar el control con `aria-invalid="true"`
  y asociarlo al mensaje mediante `aria-describedby` e ids estables. WHEN un
  submit contiene varios campos inválidos, THE SYSTEM SHALL enfocar el primer
  control inválido según el orden visual. Los errores de API SHALL permanecer
  como alertas de formulario, sin sustituir ni atribuirse a un campo concreto.

- **R7**: WHEN el usuario sale de `Descripción`, `Cantidad`, `Unidad` o
  `Precio unitario` en `OdcForm`, THE SYSTEM SHALL validar solo ese campo con
  las reglas vigentes de `odcFormSchema`; WHEN cierra o abandona el selector
  `Proveedor`, SHALL validar que exista una selección. `Comentarios` SHALL
  seguir siendo opcional y SHALL no producir un error requerido inventado.
  WHEN un submit de guardar o enviar es inválido, THE SYSTEM SHALL validar los
  campos requeridos y enfocar en este orden el primero inválido:
  `Descripción`, `Cantidad`, `Unidad`, `Precio unitario`, `Proveedor`. WHEN el
  usuario corrige un campo, SHALL limpiar solo el error de ese campo.

- **R8**: WHEN `OdcForm` se abre sin comentarios, THE SYSTEM SHALL presentar
  el campo opcional bajo un `Collapsible` cerrado con trigger accesible
  `Añadir comentarios`; IF edita una ODC con comentarios existentes, THEN
  SHALL abrirlo inicialmente y conservar el valor. WHEN el usuario cierra y
  vuelve a abrir la sección, THE SYSTEM SHALL preservar el texto escrito.
  WHILE renderiza el formulario, THE SYSTEM SHALL conservar `lg:grid-cols-3` para
  cantidad/unidad/precio, usar densidad `gap-4` y padding de 1rem, y SHALL
  mostrar en el resumen sticky (`xl:sticky xl:top-6`) el desglose
  cantidad × precio en texto muted y el `Total estimado` tras `border-t` con
  `text-2xl font-semibold tabular-nums`. Guardar borrador SHALL conservar su
  contrato distinto de enviar, y ambas acciones SHALL vivir en el footer con
  separación superior y loading visible.

- **R9**: WHEN el usuario sale de `Fecha de pago` o `Método de pago` en
  `RegisterPaymentForm`, THE SYSTEM SHALL validar individualmente que el campo
  requerido no esté vacío; `DatePicker` SHALL propagar blur, asociación ARIA y
  foco a su input de texto para hacer observable esa conducta. `Referencia` y
  `Notas` SHALL seguir opcionales y no SHALL recibir reglas nuevas. WHEN el
  submit es inválido, THE SYSTEM SHALL enfocar primero `Fecha de pago` y luego
  `Método de pago`; WHEN es válido, SHALL conservar el payload recortado, el
  bloqueo de duplicados, el toast de éxito y la transición devuelta por el
  servidor.

- **R10**: WHEN cambia `Archivo del comprobante` en
  `PaymentEvidenceForm`, THE SYSTEM SHALL validar inmediatamente presencia,
  MIME (`PDF`, `JPG` o `PNG`) y máximo de 10 MB, asociando el error al input de
  archivo. `Referencia del comprobante` SHALL seguir opcional. WHEN el submit
  no tiene un archivo válido, THE SYSTEM SHALL enfocar el input de archivo y
  SHALL no llamar `upload`; WHEN es válido, SHALL conservar el recorte de la
  referencia, el bloqueo de duplicados, el toast de éxito, retry y el estado
  devuelto por el servidor.

- **R11**: WHEN cambia `Archivo de la factura` en `UploadInvoiceForm`, THE
  SYSTEM SHALL validar inmediatamente presencia, MIME (`PDF`, `JPG` o `PNG`)
  y máximo de 10 MB. WHEN el usuario sale de `Fecha de entrada a almacén`, THE
  SYSTEM SHALL validar que el campo requerido no esté vacío mediante el input
  enfocable de `DatePicker`. `Número de factura`, `Fecha de factura` y
  `Observaciones` SHALL seguir opcionales y no SHALL recibir reglas nuevas.
  WHEN el submit es inválido, THE SYSTEM SHALL enfocar primero el archivo y
  después la fecha de almacén; un submit válido SHALL continuar al diálogo de
  R5 sin alterar el archivo ni el payload recortado.

- **R12**: WHEN el usuario sale de `Email` o `Password` en `LoginForm`, THE
  SYSTEM SHALL validar individualmente ese campo con `loginSchema`; WHEN el
  submit es inválido, SHALL enfocar primero `Email` y después `Password`.
  WHILE `login` está pendiente, THE SYSTEM SHALL marcar el formulario
  `aria-busy="true"`, deshabilitar campos y submit, bloquear solicitudes
  duplicadas y mostrar `Ingresando…`; IF responde 401, THEN SHALL conservar
  los valores, el store sin usuario, la ruta `/login` y la alerta vigente.
  Las etiquetas `Email` y `Password` SHALL permanecer sin traducir en esta
  feature porque pertenecen a la feature 29.

- **R13**: WHEN se renderiza un toast, THE SYSTEM SHALL usar el radio semántico
  de superficie `rounded-card` y SHALL no emitir `rounded-2xl`, el modificador
  `!` ni otro `!important` para resolver el radio. El test de la primitiva
  SHALL verificar el radio resultante.

- **R14**: WHILE se aplica este rediseño, THE SYSTEM SHALL conservar contratos
  API, orden y forma de payloads, gates de rol/estado, datos escritos por el
  usuario, estado confirmado por servidor, bloqueo de duplicados, recuperación
  y retry tras error, previews de documentos y toasts de éxito existentes.
  THE SYSTEM SHALL usar solo tokens semánticos en light/dark, conservar foco
  visible y navegación por teclado, y SHALL aplicar
  `motion-reduce:animate-none` o `motion-reduce:transition-none` a cualquier
  indicador o transición añadidos. Las clases base apiladas y breakpoints
  modificados por R1–R12 SHALL no causar overflow por su composición; la
  auditoría completa y evidencia a 375px permanecen en la feature 28.

## Fuera de alcance

- Cambiar endpoints backend, DTOs, contratos HTTP, roles, máquina de estados o
  datos persistidos; añadir dependencias o regenerar primitivas shadcn.
- Montar o restaurar los dashboards eliminados por la feature 30.
- Rediseñar el resumen mensual de la feature 27.
- Cerrar la auditoría completa a 375px de la feature 28; aquí solo se preservan
  las clases responsive necesarias para las composiciones modificadas.
- Traducir `Email`/`Password` o cambiar el `<title>`; pertenece a la feature 29.
- Cambiar `CardHeader`: la revisión de usos activos no encontró un override de
  padding que hoy pierda por especificidad.
- Introducir reglas de validación nuevas para campos opcionales o cambiar los
  mensajes/reglas de negocio vigentes.

## Aprobación

- [ ] Aprobado por humano (fecha: ____)
