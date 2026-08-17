---
feature: "ui-copy-es-and-title"
status: approved     # draft | approved
tags: [harness, spec]
---

# Tareas — [[ui-copy-es-and-title]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> tiene siempre los mismos 3 sub-items, en este orden.

## R1 — Etiquetas del login en español (`Correo electrónico` / `Contraseña`)

- [x] (1) Escribir test que falla para R1: en `login-form.test.tsx`, afirmar que
      `getByLabelText('Correo electrónico')` devuelve el input `id="email"` y
      `getByLabelText('Contraseña')` el input `id="password"`
- [x] (2) Implementación mínima que lo pasa: los dos `FieldLabel` de
      `login-form.tsx` (líneas 109 y 142)
- [x] (3) Refactor con tests verdes: actualizar las queries vigentes que rompen —
      `login-form.test.tsx` líneas 32, 35, 125, 143, 156, 157 y el nombre del test
      de la línea 140; `e2e/login.spec.ts` líneas 17-18. Suite completa en verde

## R2 — Mensajes de validación del login en español

- [x] (1) Escribir test que falla para R2: afirmar el literal
      `Ingresa un correo electrónico válido.` en el `FieldError` de
      `email-field` con correo malformado, y `Ingresa tu contraseña.` en el de
      `password-field` con contraseña vacía (hoy salen en inglés)
- [x] (2) Implementación mínima que lo pasa: mensaje por regla en
      `src/lib/login-schema.ts`
- [x] (3) Refactor con tests verdes: comprobar que los tests preexistentes de
      R7 (`textContent !== ''`) siguen pasando y no quedan duplicados con los nuevos

## R3 — `<title>` del documento

- [x] (1) Escribir test que falla para R3: leer el `head()` de la ruta raíz
      (`src/routes/__root.tsx`) y afirmar que su `meta` contiene exactamente
      `ODC — Órdenes de compra`
- [x] (2) Implementación mínima que lo pasa: sustituir el `title` de
      `__root.tsx:26`
- [x] (3) Refactor con tests verdes: confirmar que la cadena
      `TanStack Start Starter` ya no aparece en `frontend/src` y que ninguna ruta
      hija declara `head()`
