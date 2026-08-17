# review: ui-copy-es-and-title
Fecha: 2026-08-17
Feature: #29 (`in_progress`) — rango revisado `cb25962..HEAD` (`4240fc1`)
Veredicto: **APROBADO**

Toda la evidencia de abajo la produjo el reviewer ejecutando comandos, no leyendo
`progress/impl_ui-copy-es-and-title.md`. El informe del implementer coincide con lo
observado en los ocho puntos verificados.

---

## Checklist C1 — Arnés
- [x] N/A por regla (no es la primera feature del proyecto). `./init.sh` verificó
      "Archivos del harness presentes" y terminó `EXIT=0`.

## Checklist C2 — Estado coherente
- [x] Solo 1 feature `in_progress`: `node` sobre `feature_list.json` → `{"done":29,"in_progress":1}`,
      y la única `in_progress` es `{"id":29,"name":"ui-copy-es-and-title"}`.
- [x] `progress/current.md` describe la sesión activa (feature 29, spec aprobada
      2026-08-17, implementación TDD).
- [x] Árbol de trabajo limpio antes y después de la revisión (`git status --porcelain`
      vacío; las mutaciones de verificación se revirtieron, ver C4).

## Checklist C3 — Arquitectura
- [x] Sin cambios en backend: el diff `cb25962..HEAD` no toca `backend/`. Ningún
      archivo de `domain/`, `application/` ni `infrastructure/` aparece.
- [x] domain sin imports de infrastructure — no aplica, no se tocó dominio.
- [x] repositories/contratos en domain intactos — no se tocaron.
- [x] application depende de interfaces — no se tocó.
- [x] Todo el cambio vive en la capa de presentación del frontend (2 componentes/lib
      + 1 ruta), sin lógica de negocio nueva: son 5 líneas de texto.

## Checklist C4 — TDD
- [x] Cada R tiene test que lo nombra:
  - `frontend/src/components/login-form.test.tsx` → `describe('R1: login field labels are in Spanish and keep their association')`
  - idem → `describe('R2: login validation messages are in Spanish')`
  - `frontend/src/routes/__root.test.tsx` → `describe('R3: the document title is declared once in the root route')`
- [x] **Separación test/implementación verificada commit por commit con `git show --stat`**
      (no por el mensaje). Ningún commit mezcla `*.test.*`/`e2e/` con implementación:

| commit | archivos tocados | tipo |
|---|---|---|
| `b559bb9` | `e2e/login.spec.ts`, `login-form.test.tsx` | solo test |
| `6f06006` | `login-form.tsx` | solo impl |
| `c7c4e68` | `login-form.test.tsx` | solo test |
| `c1aeb9f` | `login-schema.ts` | solo impl |
| `cd37b1f` | `__root.test.tsx` (nuevo) | solo test |
| `46041fe` | `__root.tsx` | solo impl |
| `ea79ab7` | `__root.test.tsx` | solo test (lint) |
| `4240fc1` | `progress/`, `specs/` | solo docs |

- [x] **Rojo→verde empírico, comprobado por el reviewer con mutación real +
      `vitest run`** (baseline previo: `Test Files 2 passed (2) / Tests 12 passed (12)`).
      Cada mutación revirtió el archivo de implementación a `cb25962`, se corrió la
      suite, y se restauró (`git status` vacío tras cada una):

```
# R1 — git checkout cb25962 -- frontend/src/components/login-form.tsx
FAIL R1: login field labels are in Spanish… > labels the email and password inputs with their Spanish text
TestingLibraryElementError: Unable to find a label with the text of: Correo electrónico
(10 tests en rojo: R1, R2 x2, R7 x2, R8, R9, R6/R12 x3)

# R2 — git checkout cb25962 -- frontend/src/lib/login-schema.ts
FAIL R2 > shows the Spanish message when the email is malformed
AssertionError: expected 'Invalid email address' to be 'Ingresa un correo electrónico válido.'
FAIL R2 > shows the Spanish message when the password is empty
AssertionError: expected 'Too small: expected string to have >=1 characters' to be 'Ingresa tu contraseña.'
 Test Files  1 failed (1) / Tests  2 failed | 8 passed (10)

# R3 — git checkout cb25962 -- frontend/src/routes/__root.tsx
FAIL R3 > emits the exact global title in the root head()
AssertionError: expected [ { charSet: 'utf-8' }, …(2) ] to deep equally contain { title: 'ODC — Órdenes de compra' }
 Test Files  1 failed (1) / Tests  1 failed | 1 passed (2)
```

  Los tres tests **detectan** la ausencia de su implementación: no son verdes vacíos.

## Checklist C5 — Trazabilidad
- [x] `specs/ui-copy-es-and-title/traceability.md` sin ninguna fila "pendiente":
      las 3 filas (R1, R2, R3) nombran archivo::test y los hashes de test + feat.
- [x] Los tests referenciados existen con esos nombres exactos (verificado abriendo
      ambos archivos).
- [x] Commits en formato convencional con R-ids: `feat(ui-copy-es-and-title): … (R1)`,
      `test(ui-copy-es-and-title): … (R2)`, etc.

## Checklist C6 — Spec aprobada
- [x] `requirements.md` con `status: approved` y `- [X] Aprobado por humano (fecha: 2026-08-17)`.
- [x] Ningún requisito modificado después del gate: `requirements.md` **no aparece**
      en `git diff --name-status cb25962..HEAD` (el diff son 8 archivos: 6 de
      frontend + `progress/impl_*.md` + `traceability.md`).

---

## Verificación 1 — Textos exactos contra la spec (carácter por carácter)

Comparación por codepoints entre `requirements.md` y el código, no por lectura visual:

| Cadena | Código | Codepoints clave | Spec | ¿Idéntico? |
|---|---|---|---|---|
| `Correo electrónico` | `login-form.tsx:109` | `ó` = 0xF3 | R1 | sí |
| `Contraseña` | `login-form.tsx:142` | `ñ` = 0xF1 | R1 | sí |
| `Ingresa un correo electrónico válido.` | `login-schema.ts:4` | `ó`=0xF3, `á`=0xE1, final 0x2E | R2 | sí |
| `Ingresa tu contraseña.` | `login-schema.ts:5` | `ñ`=0xF1, final 0x2E | R2 | sí |
| `ODC — Órdenes de compra` | `__root.tsx:26` | raya = **0x2014** (em dash), `Ó`=0xD3 | R3 (0x2014, 0xD3) | sí |

La raya del título es U+2014 en la spec **y** en el código; no se coló un guion ni
un en-dash. Los dos mensajes conservan el punto final.

## Verificación 2 — Riesgo central: ¿alguna aserción cambió de significado?

Revisado línea por línea el diff de `login-form.test.tsx` y `e2e/login.spec.ts`.
**No hay ninguna aserción debilitada ni relajada para tapar una regresión.**

Todo lo eliminado en esos dos archivos son localizadores, no aserciones:

| Antes | Después | Veredicto |
|---|---|---|
| `getByLabelText(/email/i)` / `(/password/i)` en `fillAndSubmit` | literales `'Correo electrónico'` / `'Contraseña'` | mismo input; el literal exacto es **más estricto** que el regex |
| `getByLabelText('Email')` (3 sitios del bloque R6,R12) | `getByLabelText('Correo electrónico')` / `('Contraseña')` | mismo input |
| nombre `focuses Email first…` | `focuses the email field first…` | solo el nombre; la aserción `expect(document.activeElement).toBe(...)` es la misma |
| `getByLabel(/email/i)` en e2e | `getByLabel('Correo electrónico')` | mismo locator, `toBeVisible()` intacto |

Las aserciones de R6/R7/R8/R9/R12 (`aria-invalid`, `aria-describedby`, foco,
`aria-busy`, `disabled`, `login` no llamado con datos inválidos, 401) **no aparecen
como líneas borradas en el diff**: siguen textualmente iguales. La mutación de R1
(arriba) lo confirma desde otro ángulo — al revertir el copy, esos mismos 10 tests
se ponen rojos, es decir siguen ejerciendo el formulario de verdad.

## Verificación 3 — Fuera de alcance

`git diff --name-status cb25962..HEAD` → exactamente:

```
M  frontend/e2e/login.spec.ts
M  frontend/src/components/login-form.test.tsx
M  frontend/src/components/login-form.tsx
M  frontend/src/lib/login-schema.ts
A  frontend/src/routes/__root.test.tsx
M  frontend/src/routes/__root.tsx
A  progress/impl_ui-copy-es-and-title.md
M  specs/ui-copy-es-and-title/traceability.md
```

- [x] Sin librería de i18n ni archivos de traducción; `package.json`/lockfile no
      aparecen en el diff (cero dependencias nuevas).
- [x] Sin cambios visuales/layout: en `login-form.tsx` solo cambia el texto interno
      de dos `FieldLabel`; ninguna clase, token, variante ni orden de campos.
- [x] Ninguna superficie fuera del login y el título; las primitivas `ui/`
      (`pagination.tsx`, `sheet.tsx`, `sidebar.tsx`) quedan sin tocar, como manda la spec.
- [x] `placeholder="m@example.com"` intacto (confirmado en el HTML servido y en el
      navegador: `EMAIL PLACEHOLDER: "m@example.com"`).
- [x] Sin títulos por ruta, `og:title`, `meta description` ni favicon en el diff.
      `grep 'head[:(]' frontend/src/routes` → una sola coincidencia real:
      `__root.tsx:16`. Ninguna ruta hija declara `head()`.
- [x] `id`, `htmlFor`, `data-testid`, `name` y `type` de los campos intactos: el
      diff de `login-form.tsx` son 2 líneas, ambas de texto de etiqueta.
- [x] `TanStack Start Starter` ya no existe en `frontend/src` (grep sin resultados).

## Verificación 4 — Accesibilidad (R1)

Comprobado, no asumido:
- jsdom: `screen.getByLabelText('Correo electrónico').id` → `'email'`;
  `screen.getByLabelText('Contraseña').id` → `'password'` (test R1 en verde).
- Chromium real: `getByLabel('Correo electrónico')` → `id=email`;
  `getByLabel('Contraseña')` → `id=password`.

La asociación `label ↔ input` sigue viva en ambos entornos.

## Verificación 5 — R2 en navegador real (lo que quedó sin verificar en la implementación)

Estado encontrado al empezar: `http://localhost:3000/login` devolvía **500**.
Causa confirmada: `odc-db-1` seguía sin red (`NetworkSettings.Networks == {}`) y el
backend moría con `getaddrinfo ENOTFOUND db`. `netstat` mostró que el puerto 5432
ya **no** estaba ocupado (el `wslrelay` PID 31240 solo retiene 3000/3001 sobre
`::1`), así que bastó `docker compose up -d` (recreó `odc-db-1`, volumen `pgdata`
intacto) + `docker compose restart backend`. **No se mató ningún proceso**;
`wslrelay` no se tocó. Tras eso `/login` → 200.

Verificación en Chromium real (Playwright headless lanzado desde un script temporal
fuera del repo, sin añadir archivos al proyecto):

```
TITLE: "ODC — Órdenes de compra"
EMAIL LABEL -> input id: email
PASSWORD LABEL -> input id: password
EMAIL PLACEHOLDER: "m@example.com"
EMPTY SUBMIT ALERTS: ["Ingresa un correo electrónico válido.","Ingresa tu contraseña."]
BAD EMAIL ALERTS: ["Ingresa un correo electrónico válido."]
```

- Envío con el formulario vacío → **los dos** mensajes en español, cada uno en su
  campo. Cubre además la rama "correo vacío" que R2 exige y que en jsdom no tiene
  test propio.
- Envío con correo malformado → mensaje español del correo, sin el de contraseña.
- Captura de pantalla revisada: etiquetas `Correo electrónico` / `Contraseña` y el
  error `Ingresa un correo electrónico válido.` visibles bajo el campo, con el
  `aria-invalid` pintando el borde rojo. Sin cambios de layout respecto al diseño previo.
- R3 confirmado también en el HTML SSR: `curl http://127.0.0.1:3000/login` →
  `<title>ODC — Órdenes de compra</title>`. No hizo falta reiniciar por caché: el
  contenedor `frontend` ya servía el estado nuevo.

**R2 queda verificado en navegador real. Ya no hay ninguna verificación pendiente.**

## Verificación 6 — Regresiones y test flaky

`./init.sh` corrido por el reviewer terminó con `EXIT=0`, y la suite frontend
completa pasó en la misma corrida (36 archivos / 601 tests), incluido
`general-approval-actions.test.tsx`. **El flaky conocido no falló**, así que no hubo
nada que imputar ni que re-correr aislado.

---

## Observaciones (ninguna bloqueante)

1. **`specs/ui-copy-es-and-title/tasks.md` quedó con los 9 sub-items sin marcar**
   (`- [ ]`), mientras que features cerradas recientemente (`ui-surfaces-monthly-summary`,
   `ui-responsive-375`, `session-isolation`) los dejan todos en `- [x]`. Los tres
   pasos se ejecutaron realmente (verificado en los commits), así que es higiene
   documental, no incumplimiento de C1–C6.
2. **R2, rama "correo vacío", sin test automático.** La spec dice
   `Ingresa un correo electrónico válido.` "para el correo inválido **o vacío**";
   el test de jsdom cubre correo malformado y contraseña vacía. La rama de correo
   vacío la cubre `z.string().email(msg)` por construcción y quedó comprobada
   empíricamente en Chromium (arriba). Si se quisiera blindar, sería un `it` más
   en el mismo `describe('R2: …')`.
3. **El guard "ninguna ruta hija declara `head()`" de `__root.test.tsx` es un grep
   de texto** (`source.includes('head:')`). Detecta la forma que usa el proyecto
   (`head: () => …`), pero no vería un método abreviado `head() { … }`. Es un guard
   de no-regresión, no la aserción principal de R3; la aserción del título sí es
   estructural. Riesgo residual muy bajo.
4. **`traceability.md` conserva `status: draft` en el frontmatter.** Es el valor por
   defecto de `specs/_template/` y lo comparten muchas features ya cerradas
   (`ui-responsive-375`, `ui-design-tokens`, `odc-*`); C5/C6 hablan de
   `requirements.md`, no de este frontmatter. Solo se anota por consistencia futura.
5. **Cambio de entorno hecho por el reviewer** (no afecta al repo): `docker compose
   up -d` recreó `odc-db-1` y `docker compose restart backend` lo reconectó. El
   stack quedó **sano** (login 200), mejor que como se encontró. Volumen `pgdata`
   intacto, `wslrelay` sin tocar, árbol de git limpio.

## Output de ./init.sh

```
══════════════════════════════════════════
  INIT — ODC (Harness SDD)
══════════════════════════════════════════

→ Verificando entorno...
✅ node disponible (/c/Program Files/nodejs/node)
✅ pnpm disponible (/c/Users/alex/AppData/Local/pnpm/pnpm)

→ Verificando variables de entorno...
✅ .env encontrado
✅   DATABASE_URL definida
✅   JWT_SECRET definida

→ Instalando dependencias...
Lockfile is up to date, resolution step is skipped
Already up to date
✅ Dependencias instaladas

→ Verificando coherencia del harness...
✅ Archivos del harness presentes
⚠️  Feature en progreso: ui-copy-es-and-title

→ Build...
> backend@0.0.1 build → nest build            (sin errores)
> frontend@ build → vite build
✓ 3505 modules transformed.  ✓ built in 13.59s   (client)
✓ 176 modules transformed.   ✓ built in 996ms    (ssr, dist/server/server.js 172.53 kB)
✅ Build exitoso
   [listado de assets recortado en este reporte]

→ Ejecutando tests...
> backend@0.0.1 test → jest
Test Suites: 59 passed, 59 total
Tests:       471 passed, 471 total

> frontend@ test → vitest run --passWithNoTests
 Test Files  36 passed (36)
      Tests  601 passed (601)
   Duration  25.01s
✅ Tests pasados

→ Lint...
> backend@0.0.1 lint → eslint "{src,apps,libs,test}/**/*.ts" --fix
✅ Lint sin errores

══════════════════════════════════════════
✅ Todo verde. Listo para trabajar.

  Features: 29/30 completadas | 0 pendientes

EXIT=0
```

---

## Conclusión

C2, C3, C4, C5 y C6 en verde con evidencia propia. Los textos son byte-idénticos a
la spec aprobada, el diff no se sale del alcance, ninguna aserción existente fue
debilitada, los tres requisitos fallan sin su implementación, y R2 —lo único que
quedaba sin comprobar— está verificado en Chromium real. Feature lista para cerrar.

El reviewer **no** marcó `done` en `feature_list.json` ni hizo push: eso es del leader.
