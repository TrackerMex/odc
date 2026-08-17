---
feature: "ui-copy-es-and-title"
status: draft        # draft | approved
tags: [harness, spec]
---

# Diseño — [[ui-copy-es-and-title]]

> Ver [[requirements]] para los requisitos que este diseño implementa y
> [[../../docs/architecture|architecture]] para las reglas de capas del proyecto.

## Estado verificado de la fuente (2026-08-17)

El plan de refactor citaba `frontend/src/components/auth/login-form.tsx`. **Esa ruta
no existe**: el formulario vive en `frontend/src/components/login-form.tsx`. Estado
comprobado de cada texto de la pantalla de login:

| Texto | Origen | Hoy | Cambia |
|---|---|---|---|
| Etiqueta correo | `login-form.tsx:109` | `Email` | sí (R1) |
| Etiqueta contraseña | `login-form.tsx:142` | `Password` | sí (R1) |
| Error validación correo | zod v4 vía `login-schema.ts:4` | `Invalid email address` | sí (R2) |
| Error validación contraseña | zod v4 vía `login-schema.ts:5` | `Too small: expected string to have >=1 characters` | sí (R2) |
| Placeholder correo | `login-form.tsx:114` | `m@example.com` | no |
| Título / descripción tarjeta | `login-form.tsx:92-95` | `Ingresa a tu cuenta` / `Ingresa tu correo y contraseña para continuar` | no |
| Botón | `login-form.tsx:179` | `Ingresar` / `Ingresando…` | no |
| Error 401 | `login-form.tsx:79` | `Correo o contraseña incorrectos.` | no |
| `<title>` documento | `routes/__root.tsx:26` | `TanStack Start Starter` | sí (R3) |

Los dos mensajes de validación en inglés se confirmaron ejecutando el schema real
con la zod instalada (`zod@4.4.3`), no por inferencia: son texto visible para el
usuario dentro del formulario de login, así que caen dentro del defecto 1.

## Decisiones técnicas

- **Textos literales en el JSX y en el schema, sin capa de i18n** (R1, R2, R3). La
  app es monolingüe español de México y no hay requisito de segundo idioma. Meter
  `react-i18next` para cuatro cadenas sería infraestructura sin usuario.
- **`Correo electrónico` y `Contraseña` como etiquetas** (R1). Registro coherente
  con `odc-form.tsx`, que usa etiquetas cortas en sentence case (`Descripción`,
  `Cantidad`, `Proveedor`, `Comentarios`) y con la propia `CardDescription` del
  login (`Ingresa tu correo y contraseña para continuar`). Se descarta `Correo` a
  secas por ambigüedad y `E-mail` por ser el anglicismo que la feature elimina.
- **Los mensajes de validación se fijan en `src/lib/login-schema.ts`**, no en el
  componente (R2). El componente ya lee `result.error.flatten().fieldErrors[...]`
  y lo pinta en `FieldError`: darle mensaje propio a cada regla zod es un
  argumento por regla y no toca el flujo de render ni la lógica de blur/submit.
  Registro: tuteo, sentence case, punto final — igual que
  `Revisa los datos del formulario e inténtalo de nuevo.` de `odc-form.tsx`.
- **Un solo título global en la ruta raíz** (R3). `__root.tsx` es hoy el único
  `head()` del router (grep `head:` sobre `src/routes/` devuelve una sola
  coincidencia) y TanStack Router propaga el `meta` de la raíz a toda ruta hija que
  no declare el suyo. Las rutas que hoy no declaran título **siguen sin
  declararlo** y heredan el global: no se añade `head()` a ninguna ruta hija.
- **`ODC — Órdenes de compra` como texto del título** (R3). Es literalmente la
  marca que ya pinta `app-sidebar.tsx:69-72` (`ODC` sobre `Órdenes de compra`),
  unida con raya. Reutilizar el nombre que el usuario ya ve en la barra lateral
  evita inventar un nombre de producto nuevo en la pestaña.

## Archivos afectados

Todo en la capa de presentación (infrastructure/UI). No se toca dominio,
aplicación ni el backend.

- `frontend/src/components/login-form.tsx` — dos `FieldLabel` (R1).
- `frontend/src/lib/login-schema.ts` — mensaje por regla en `email` y `password` (R2).
- `frontend/src/routes/__root.tsx` — `title` dentro de `head().meta` (R3).

### Tests que hay que actualizar (parte del alcance)

Cambiar las etiquetas rompe las queries `getByLabelText` / `getByLabel` vigentes.
Estos archivos deben actualizarse en el mismo commit que R1:

- `frontend/src/components/login-form.test.tsx` — `fillAndSubmit` (líneas 32 y 35,
  regex `/email/i` y `/password/i`), y las queries literales `getByLabelText('Email')`
  y `getByLabelText('Password')` de las líneas 125, 143, 156 y 157. El nombre del
  test de la línea 140 (`focuses Email first…`) también menciona la etiqueta vieja.
  Las aserciones de R7/R8/R9/R6/R12 que estos tests cubren **no cambian de
  significado**: siguen verificando lo mismo con la etiqueta nueva.
- `frontend/e2e/login.spec.ts` — `getByLabel(/email/i)` y `getByLabel(/password/i)`
  (líneas 17-18).

### Tests nuevos

- R2: hoy los dos tests de validación (`login-form.test.tsx:49` y `:59`) solo
  comprueban `textContent !== ''`, así que pasarían con el mensaje en inglés. Hace
  falta afirmar el literal español en el `FieldError` de cada campo.
- R3: no existe ningún test de `__root.tsx`. Hace falta uno que lea el `head()` de
  la ruta raíz y afirme el título exacto, más un grep-guard implícito: la cadena
  `TanStack Start Starter` no debe quedar en `frontend/src`.

## Hallazgos anotados para una feature futura (NO en este alcance)

Copy en inglés encontrado al inspeccionar, **fuera** del login y del título. Se deja
registrado aquí para que exista, no para arreglarlo ahora:

- `frontend/src/components/ui/pagination.tsx` — `aria-label="Go to previous page"`,
  `aria-label="Go to next page"` y el `sr-only` `More pages`. Visible para lectores
  de pantalla en la bandeja de trabajo.
- `frontend/src/components/ui/sidebar.tsx` — `Toggle Sidebar` (`sr-only` y
  `aria-label`), presente en todas las rutas autenticadas.
- `frontend/src/components/ui/sheet.tsx` — `sr-only` `Close`.

Son restos de shadcn/ui sin traducir. Justifican una feature propia ("copy es-MX en
primitivas `ui/`") porque tocan primitivas compartidas y tienen su propio riesgo de
regresión sobre tests que consultan por nombre accesible.

## Alternativas descartadas

- **Traducir también las primitivas `ui/` en esta feature**: infla un cambio de
  cuatro líneas a un barrido por componentes compartidos con su propio riesgo de
  romper queries por nombre accesible. Queda como hallazgo, arriba.
- **Título por ruta** (`Login — ODC`, `Nueva orden — ODC`, …): mejora real pero es
  una feature de navegación, no el defecto anotado. El defecto es que la pestaña
  dice el nombre del starter. Un título global lo cierra con una línea.
- **`errorMap` global de zod en español**: resolvería R2 para todos los schemas
  futuros, pero hoy `login-schema.ts` es el único schema zod del frontend. Un
  `errorMap` sería configuración global para un solo consumidor.
- **Cambiar los `data-testid` o los `id` para desacoplar los tests del copy**:
  cambia contratos accesibles estables para evitar editar seis líneas de test. Los
  tests se actualizan; los `id` no se tocan (R1 lo fija como observable).
