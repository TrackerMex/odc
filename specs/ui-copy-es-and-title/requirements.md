---
feature: "ui-copy-es-and-title"
status: approved     # draft | approved
tags: [harness, spec]
---

# Requisitos — [[ui-copy-es-and-title]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.

Origen: los dos defectos "ajenos al refactor visual" que dejó anotados la revisión
en navegador del 2026-08-10 (`progress/ui-redesign-plan.md` §29 y §Ajenos al
refactor visual). La feature es deliberadamente pequeña: copy en español de México
en la pantalla de login, y un `<title>` de documento que hoy sigue siendo el del
starter.

## Requisitos funcionales

- **R1**: WHEN se renderiza `LoginForm` THE SYSTEM SHALL rotular el campo de correo
  con el texto visible exacto `Correo electrónico` y el campo de contraseña con el
  texto visible exacto `Contraseña`, manteniendo la asociación accesible actual
  (`FieldLabel htmlFor="email"` → `Input id="email"`, `htmlFor="password"` →
  `id="password"`), de modo que `getByLabelText('Correo electrónico')` devuelva el
  input `id="email"` y `getByLabelText('Contraseña')` el input `id="password"`.

- **R2**: WHEN `loginSchema` rechaza el correo o la contraseña THE SYSTEM SHALL
  producir el mensaje en español exacto `Ingresa un correo electrónico válido.`
  para el correo inválido o vacío y `Ingresa tu contraseña.` para la contraseña
  vacía, y THE SYSTEM SHALL renderizar ese mensaje en el `FieldError` del campo
  correspondiente (hoy zod v4 emite `Invalid email address` y
  `Too small: expected string to have >=1 characters`, ambos visibles en inglés).

- **R3**: WHEN cualquier ruta de la aplicación se renderiza THE SYSTEM SHALL
  emitir en el `<head>` del documento el título exacto `ODC — Órdenes de compra`,
  declarado una sola vez en el `head()` de la ruta raíz (`__root.tsx`), sin que
  ninguna ruta hija declare título propio.

## Fuera de alcance

Estricto. Cualquier cosa de esta lista que aparezca en el diff es motivo de
rechazo del reviewer:

- **Librería o framework de i18n** (`react-i18next`, `lingui`, `formatjs`, …),
  archivos de traducción, catálogos de mensajes o soporte multi-idioma. Los textos
  son literales en el JSX y en el schema, como en el resto de la app.
- **Cualquier cambio visual o de layout**: clases de Tailwind, tokens, espaciados,
  variantes de `Button`/`Card`/`Field`, orden de los campos. Solo cambia texto.
- **Cualquier superficie que no sea el formulario de login y el título del
  documento.** En particular queda fuera el copy en inglés de las primitivas
  `src/components/ui/` (`pagination.tsx`, `sheet.tsx`, `sidebar.tsx`), anotado como
  hallazgo en [[design]] para una feature futura.
- **El `placeholder` `m@example.com`** del campo de correo: es un ejemplo neutro,
  no copy en inglés. Se queda como está.
- **Títulos por ruta** (`head()` en `login.tsx`, `_authenticated.tsx`, etc.),
  plantillas de título, `og:title`, `<meta name="description">` y favicon.
- **Los `id`, `htmlFor`, `data-testid`, `name` y `type` de los campos**, y el
  esquema de validación en sí (qué se valida y cuándo): solo cambian los mensajes.
- El mensaje de error 401 `Correo o contraseña incorrectos.` y los textos del
  botón (`Ingresar` / `Ingresando…`) y de la tarjeta, que ya están en español.

## Aprobación

- [X] Aprobado por humano (fecha: 2026-08-17) ← gate obligatorio antes de implementar
