# impl: ui-copy-es-and-title
Fecha: 2026-08-17

Feature #29 (`in_progress`). Spec aprobada por humano el 2026-08-17
(`specs/ui-copy-es-and-title/requirements.md`, `status: approved`, casilla `[X]`,
commit de aprobación `cb25962`). No se editó ni re-aprobó la spec.

## Archivos creados

- `frontend/src/routes/__root.test.tsx` — test de R3: lee el `head()` de la ruta
  raíz y afirma el título exacto; segundo test que verifica que ninguna ruta hija
  declara `head:` (el "una sola vez" de R3).

## Archivos modificados

### Implementación (3 archivos, 5 líneas)

- `frontend/src/components/login-form.tsx` — los dos `FieldLabel`: `Email` →
  `Correo electrónico`, `Password` → `Contraseña` (R1). No se tocó `htmlFor`,
  `id`, `type`, `data-testid`, el `placeholder` `m@example.com` ni ninguna clase.
- `frontend/src/lib/login-schema.ts` — mensaje por regla: `.email(...)` y
  `.min(1, ...)` (R2). No cambia qué se valida ni cuándo, solo el texto.
- `frontend/src/routes/__root.tsx` — `title: 'TanStack Start Starter'` →
  `title: 'ODC — Órdenes de compra'` (R3). Sigue siendo el único `head()` del
  router; no se añadió `head()` a ninguna ruta hija.

### Tests actualizados (alcance legítimo, declarado en `design.md` §Tests que hay que actualizar)

Cambiar el copy rompe las queries por nombre accesible. Se actualizaron al texto
nuevo, sin cambiar lo que afirman:

- `frontend/src/components/login-form.test.tsx`
  - `fillAndSubmit`: `getByLabelText(/email/i)` → `getByLabelText('Correo electrónico')`
    y `/password/i` → `'Contraseña'`. Es el helper que usan R7/R8/R9/R12.
  - Líneas del bloque `R6,R12`: `getByLabelText('Email')` / `('Password')` →
    etiquetas en español (3 ocurrencias) y el nombre del test
    `focuses Email first…` → `focuses the email field first…`.
  - Las aserciones de R6/R7/R8/R9/R12 **no cambiaron de significado**: siguen
    comprobando `aria-invalid`, `aria-describedby`, foco, `aria-busy`, `disabled`,
    que `login` no se llama con datos inválidos y el 401. Solo cambia por qué
    etiqueta se localiza el input.
- `frontend/e2e/login.spec.ts` — `getByLabel(/email/i)` / `(/password/i)` →
  `getByLabel('Correo electrónico')` / `getByLabel('Contraseña')`.

No se editó ninguna aserción ajena para tapar una regresión: ningún test que no
hable de copy se puso rojo en ningún momento.

## Requisitos cubiertos (rojo → verde, commits separados)

### R1 — etiquetas del login en español

- Test (rojo): `b559bb9` `test(ui-copy-es-and-title): assert Spanish login labels keep input association (R1)`
  — solo `login-form.test.tsx` + `e2e/login.spec.ts`.
- Evidencia de rojo (8/8 fallando, ninguna implementación tocada todavía):

```
 ❯ fillAndSubmit src/components/login-form.test.tsx:32:27
   TestingLibraryElementError: Unable to find a label with the text of: Correo electrónico
   (el DOM impreso muestra <label for="password">Password</label>)
 Test Files  1 failed (1)
      Tests  8 failed (8)
```

- Implementación (verde): `6f06006` `feat(ui-copy-es-and-title): label login fields in Spanish (R1)`
  — solo `login-form.tsx`.
- Verde: `Test Files 1 passed (1) / Tests 8 passed (8)`.
- Test que lo nombra: `login-form.test.tsx::R1: login field labels are in Spanish
  and keep their association` — afirma `getByLabelText('Correo electrónico').id === 'email'`
  y `getByLabelText('Contraseña').id === 'password'`, es decir el observable
  exacto que pide R1 (texto visible + asociación accesible intacta).

### R2 — mensajes de validación en español

- Test (rojo): `c7c4e68` `test(ui-copy-es-and-title): assert Spanish login validation messages (R2)`
  — solo `login-form.test.tsx`.
- Evidencia de rojo, con los literales en inglés que documentaba `design.md`:

```
AssertionError: expected 'Invalid email address' to be 'Ingresa un correo electrónico válido.'
AssertionError: expected 'Too small: expected string to have >=1 characters' to be 'Ingresa tu contraseña.'
 Test Files  1 failed (1)
      Tests  2 failed | 8 passed (10)
```

- Implementación (verde): `c1aeb9f` `feat(ui-copy-es-and-title): give loginSchema Spanish validation messages (R2)`
  — solo `login-schema.ts`.
- Verde: `Test Files 10 passed (10) / Tests 55 passed (55)` (login-form + `src/lib`).
- Test que lo nombra: `login-form.test.tsx::R2: login validation messages are in Spanish`.
  Afirma el literal exacto en el `FieldError` (`role="alert"`) de `email-field` y
  de `password-field`, que es lo que R2 exige (mensaje **y** que se renderice en
  el `FieldError` del campo correspondiente).

### R3 — `<title>` global

- Test (rojo): `cd37b1f` `test(ui-copy-es-and-title): assert the global document title in the root route (R3)`
  — solo `__root.test.tsx` (archivo nuevo).
- Evidencia de rojo:

```
AssertionError: expected [ { charSet: 'utf-8' }, …(2) ] to deep equally contain
  { title: 'ODC — Órdenes de compra' }
+ Received: [ …, { "title": "TanStack Start Starter" } ]
 Test Files  1 failed (1)
      Tests  1 failed | 1 passed (2)
```

  (el segundo test —"ninguna ruta hija declara `head()`"— ya pasaba en rojo: es
  un guard de no-regresión, no un test que la implementación deba poner verde.)
- Implementación (verde): `46041fe` `feat(ui-copy-es-and-title): set the global document title to ODC (R3)`
  — solo `__root.tsx`.
- Retoque posterior **solo de test**, sin tocar implementación: `ea79ab7`
  `test(ui-copy-es-and-title): drop redundant type assertion in the root head test (R3)`
  (eslint `@typescript-eslint/no-unnecessary-type-assertion` sobre el
  `as Record<string, string>` del `import.meta.glob`).
- Test que lo nombra: `__root.test.tsx::R3: the document title is declared once in
  the root route`.

Ningún commit mezcla `*.test.*` con implementación. Orden en el historial:
test(R1) → feat(R1) → test(R2) → feat(R2) → test(R3) → feat(R3) → test(R3, lint).

## Decisiones de diseño

- **`z.string().email(msg)` / `.min(1, msg)` en vez de un `errorMap` global de zod**:
  lo decidió `design.md` (hoy `login-schema.ts` es el único schema zod del
  frontend; un `errorMap` sería configuración global para un solo consumidor).
  Diff resultante: 2 líneas.
- **Segundo test en R3 ("ninguna ruta hija declara `head()`")**: R3 dice
  "declarado una sola vez … sin que ninguna ruta hija declare título propio", y
  eso no lo verifica la aserción del título. Se implementó con
  `import.meta.glob('./**/*.tsx', { query: '?raw', eager: true })` — feature nativa
  de Vite, sin dependencias ni recorrido manual de `fs`.
- **Queries por literal exacto en vez de regex** en los tests de login: con
  `Contraseña` un `/contraseña/i` también casaría con la `CardDescription`
  ("Ingresa tu correo y contraseña para continuar") si algún día se le pusiera un
  `aria-label`. El literal exacto es lo que R1 fija como observable.
- **No se tocó el `placeholder` `m@example.com`** ni ninguna clase, token,
  espaciado o variante: el diff de implementación son 5 líneas en 3 archivos, todas
  de texto.

## Output de build

`BUILD_CMD` = `(cd backend && pnpm build) && (cd frontend && pnpm build)`

```
> backend@0.0.1 build
> nest build
(sin errores)

> frontend@ build
> vite build
dist/server/server.js   172.53 kB │ gzip: 43.15 kB
✓ built in 702ms
```

## Output de tests

`TEST_CMD` = `(cd backend && pnpm test) && (cd frontend && pnpm test)`

```
backend:
Test Suites: 59 passed, 59 total
Tests:       471 passed, 471 total

frontend:
 Test Files  36 passed (36)
      Tests  601 passed (601)
```

Sin regresiones. Nota: `general-approval-actions.test.tsx:163` (flaky conocido con
la suite completa) pasó en las dos corridas completas de esta sesión.

## Verificación en navegador (Chromium real, Playwright)

Con el stack levantado (`docker compose up -d`) contra `http://localhost:3000`:

```
✓ [chromium] e2e\login.spec.ts:12 › login page renders the login form (2.1s)
✓ [chromium] e2e\responsive-375.spec.ts:49 › ui-responsive-375 R1 (2.0s)
✓ [chromium] e2e\responsive-375.spec.ts:65 › ui-responsive-375 R3, seis rutas (14.8s)
  3 passed (16.1s)
```

`login.spec.ts` es el que importa para R1: localiza los campos por
`getByLabel('Correo electrónico')` y `getByLabel('Contraseña')` en el navegador,
no en jsdom.

R3 verificado en el HTML servido por el servidor real (SSR), que es exactamente lo
que pinta la pestaña:

```
$ curl -s http://localhost:3000/login | grep -aoE '<title>[^<]*</title>|>Correo electrónico<|>Contraseña<'
<title>ODC — Órdenes de compra</title>
>Correo electrónico<
>Contraseña<
```

Detalle operativo relevante para el reviewer: la primera pasada de Playwright
falló porque el contenedor `frontend` servía módulos cacheados (HMR no detectó el
cambio sobre el bind mount de Windows) — seguía emitiendo `TanStack Start Starter`.
Tras `docker compose restart frontend` el servidor pasó a servir el estado nuevo y
la e2e quedó verde. **No era un defecto del cambio**; si el reviewer ve el título
viejo en el navegador, reinicie el contenedor antes de investigar.

### Lo que NO se pudo verificar en navegador

Los mensajes de R2 **no** se llegaron a leer en Chromium: quedó verificado en
jsdom con el literal exacto (test de R2), pero no en el navegador. Motivo: a mitad
de la verificación el stack de Docker se cayó solo (`exit code 143` en los logs de
`frontend`, los tres contenedores desaparecieron de `docker compose ps`). Al
intentar levantarlo de nuevo, `odc-db-1` no puede volver a publicar el puerto
5432: lo retiene un proceso `wslrelay` (PID 31240, arrancado a las 08:42 de hoy,
horas antes de esta sesión) que además relaya 3000, 3001 y 4566, así que **no** se
mató. Estado actual: los tres contenedores corren, pero `odc-db-1` quedó sin red
(`NetworkSettings.Networks == {}`), el backend no resuelve `db` y `/login`
responde 500. Reconectarlo a la red vuelve a disparar el bind de 5432 y falla.

Se dejó el entorno como estaba (se creó y se borró una red `odc_rescue` de
prueba; no queda residuo). **Lo desbloquea un reinicio de Docker Desktop**, que no
se hizo por ser una acción sobre la máquina del usuario fuera del alcance de la
feature. Nada de esto toca el código de la feature: es infraestructura local.

## Notas para el reviewer

- Diff de la feature completo: `git diff cb25962..HEAD` → 6 archivos, 78
  inserciones / 14 borrados. Implementación: 5 líneas en 3 archivos. Ningún
  archivo de i18n, ninguna dependencia nueva, ningún cambio de clases/tokens/layout,
  ninguna superficie fuera del login y del título, `id`/`htmlFor`/`data-testid`/
  `name`/`type` intactos, `placeholder` intacto.
- `prettier --check` marca `login-form.tsx`, `login-form.test.tsx`, `__root.tsx` y
  `__root.test.tsx`, pero **también marca archivos que esta feature no toca**
  (`odc-form.tsx`, `lib/api.ts`): es el CRLF de Windows, condición preexistente,
  no una regresión de este cambio. No se corrió `prettier --write` para no meter
  ruido de fin de línea en el diff.
- `eslint` limpio sobre los archivos tocados.
- `feature_list.json` **no** se tocó: marcar `done` es del reviewer.
- No se hizo `push` ni se reescribió historial ajeno. Único `--amend`: sobre el
  commit `test(R1)` recién creado por mí, porque el heredoc del shell se coló en
  el mensaje (`@ test(...)`); el contenido del commit no cambió.
