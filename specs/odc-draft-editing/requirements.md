---
feature: "odc-draft-editing"
status: approved        # draft | approved
tags: [harness, spec, frontend]
---

# Requisitos — [[odc-draft-editing]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Esta feature corrige la edición de ODCs que ya fueron guardadas como
> `BORRADOR`. El backend ya dispone de PATCH y submit para el creador; el
> faltante es habilitar ese flujo desde el detalle de la ODC.

## Requisitos funcionales

- **R1**: WHEN un usuario con rol `DIRECTOR_OPS` consulta el detalle de una ODC
  en estado `BORRADOR` que él creó THE SYSTEM SHALL mostrar el formulario de
  edición con los valores actuales y las acciones `Guardar como Borrador` y
  `Enviar a Administración`.
  *Verificación*: test de la ruta que asserta que el formulario se renderiza
  para `DIRECTOR_OPS` creador de un `BORRADOR` y no se renderiza para una ODC
  de otro creador ni para otro rol.

- **R2**: WHEN el creador `DIRECTOR_OPS` guarda cambios de campos de una ODC en
  `BORRADOR` THE SYSTEM SHALL llamar `PATCH /api/odcs/:id`, actualizar el
  detalle con la respuesta, conservar el status `BORRADOR` y mostrar los
  valores persistidos.
  *Verificación*: test del formulario que comprueba el payload PATCH, la
  actualización del estado local y que no se llama submit al guardar.

- **R3**: WHEN el creador `DIRECTOR_OPS` elige `Enviar a Administración` desde
  la edición de una ODC en `BORRADOR` THE SYSTEM SHALL persistir primero los
  cambios mediante PATCH y después llamar
  `POST /api/odcs/:id/submit`; si ambas operaciones tienen éxito, el detalle
  SHALL mostrar la ODC en estado `PENDIENTE_ADMIN`.
  *Verificación*: test del formulario que asserta el orden PATCH → submit,
  los payloads enviados y el status final mostrado.

- **R4**: IF la edición del borrador falla al guardar THEN THE SYSTEM SHALL
  mostrar un mensaje de error en español, conservar los valores introducidos
  para poder reintentar y SHALL NOT llamar a submit; IF submit falla después
  de un PATCH exitoso THEN THE SYSTEM SHALL informar el error sin perder los
  cambios guardados ni presentar la ODC como `PENDIENTE_ADMIN`.
  *Verificación*: tests de fallo de PATCH y de fallo de submit, comprobando
  que no hay transición visual falsa y que el formulario permanece usable.

- **R5**: WHEN la ODC está en cualquier estado distinto de `BORRADOR` o el
  usuario no es el creador con rol `DIRECTOR_OPS` THE SYSTEM SHALL mantener el
  comportamiento actual de la pantalla: no mostrar este formulario de edición
  de borrador ni permitir una mutación adicional desde este flujo.
  *Verificación*: test de matriz de rol/estado para los tres roles y los
  estados de la máquina; los flujos existentes de `RECHAZADA` deben continuar
  permitiendo "Editar y reenviar".

## Fuera de alcance

- Cambiar arbitrariamente un status mediante un PATCH: las transiciones siguen
  gobernadas por la máquina de estados; `BORRADOR → PENDIENTE_ADMIN` se ejecuta
  únicamente mediante submit.
- Permitir que un usuario distinto del creador edite un borrador.
- Cambiar las reglas de edición de `RECHAZADA` o cualquier otra transición de
  aprobación, pago o cierre.
- Cambios de esquema de base de datos o nuevos endpoints backend, salvo que la
  implementación encuentre una regresión necesaria para cumplir R2–R3.

## Aprobación

- [X] Aprobado por humano (fecha: 2026-07-24) ← gate obligatorio antes de implementar
