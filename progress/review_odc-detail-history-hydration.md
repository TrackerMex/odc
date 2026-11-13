# review: odc-detail-history-hydration
Fecha: 2026-10-17T17:33:32-06:00 (America/Mexico_City)
Veredicto: APROBADO

Revisión independiente sobre HEAD `c56fce6`, tras leer el reporte consolidado y los dos reportes de implementación, código real, tests, spec aprobada, trazabilidad y commits. No se modificó código ni tests durante la revisión.

## Checklist C2 — Estado coherente
- [x] Solo 1 feature in_progress: #40 odc-detail-history-hydration; las otras 39 están done.
- [x] progress/current.md describe la sesión activa, aprobación, TDD, verificaciones y revisión en curso.
- [x] El cierre y traslado append-only a history quedan a cargo del líder tras este veredicto.

## Checklist C3 — Arquitectura
- [x] domain sin imports de infrastructure; no cambió en esta feature.
- [x] repositories/contratos en domain son interfaces puras; no cambiaron.
- [x] application depende de interfaces, no implementaciones; no cambió.
- [x] infrastructure conserva las reglas existentes y agrega solo la carga persistida del historial dentro de las transacciones de create/update.
- [x] Frontend comparte el formato de instantes con zona explícita y mantiene el calendario UTC separado; formulario sin reloj durante render.

## Checklist C4 — TDD
- [x] Cada R1..R7 tiene al menos un test que lo nombra.
- [x] Historial de commits muestra test-primero: backend `3384374` → `def6983`; instantes/hidratación `6b80cdc` → `2784804`; formulario nuevo `0460cba` → `60bb73b`.
- [x] R5 preservaba un contrato ya correcto; `ea4f4c2` agrega regresiones sin alterar producción ni fabricar rojo. R2 UI `fd84581` complementa la regresión roja backend con ambos formularios, API cliente y reemplazo real del estado.

## Checklist C5 — Trazabilidad
- [x] traceability.md contiene R1..R7, sin filas pendientes, con tests y commits comprobados.
- [x] Commits convencionales fix/test/docs con scope odc-detail-history-hydration y R-ids, conforme a docs/conventions.md; esta entrega corrige defectos existentes.

## Checklist C6 — Spec aprobada
- [x] requirements.md tiene status: approved y casilla humana marcada con fecha 2026-10-17.
- [x] La aprobación explícita corresponde al mensaje humano de la conversación; el diff de requirements.md desde `caf5249` está vacío.

## Evidencia revisada por requisito
- R1: create/update devuelven filas almacenadas con ID, actor, nota y fecha; consulta ordenada igual que findById. La edición sin transición no agrega eventos. Pruebas unitarias y PostgreSQL comparan respuestas con persistencia real.
- R2: ambos POST multipart pasan por Nest/JWT/Multer, use case, mapper y repositorio reales contra PostgreSQL. Historial previo y nuevo se comparan con segunda conexión. Pruebas UI aplican el contrato con setOdc, conservan timeline en éxito/fallo y exigen un único POST sin GET reparador. El fixture frontend no se considera evidencia de persistencia.
- R3: carga por el mismo manager transaccional después del evento y asociación del ticket, antes del mapper/commit; CAS, numeración/reintentos y locks no cambian. PostgreSQL demuestra rollback de creación y de orden/evento/ticket ante lectura fallida. Las suites previas prueban concurrencia, commit ambiguo y protección del archivo confirmado.
- R4/R5: instantes es-MX/America/Mexico_City, incluidos límites de día/año y nulos; calendario UTC conserva bisiesto y límites mes/año, con valores visibles en detalle.
- R6/R7: renderToString y hydrateRoot reales, mismo estado, relojes a ambos lados de medianoche y defaults UTC/México/Tokio; onRecoverableError vacío. Formulario nuevo muestra Pendiente durante edición/revisión y fecha real después de persistencia; controles, validación y guardado funcionan. Sin suppressHydrationWarning ni desactivación de SSR.

## Observaciones

## Alcance de verificación
`./init.sh` independiente terminó exit 0: ambos builds, 73 suites/885 tests backend, 41 archivos/691 tests frontend y lint backend. Se utilizó pnpm10.34.6 ya instalado, install congelado, Jest runInBand y Vitest threads/maxWorkers2, sin excluir pruebas ni cambiar dependencias/configuración versionada.

Se repitieron además las dos suites PostgreSQL con el script oficial y un contenedor efímero propio: 38/38 tests, exit 0. Docker ps quedó vacío al terminar. Git status preservó exclusivamente los cambios locales previos y archivos locales de pnpm documentados; no surgieron modificaciones de código por lint/build.

Los tests SSR/hidratación usan React real en jsdom y simulan exclusivamente el default de zona de Intl (los threads no aplican TZ al ICU); las zonas explícitas pasan al constructor nativo. No se ejecutó prueba manual contra el stack completo ni Cloudinary real. No hay cambios visuales de layout. El typecheck frontend adicional no forma parte de init y mantiene los 18 diagnósticos previos documentados por el implementer; no se declara globalmente verde.

R7 tareas (3) incluye esta revisión/init y el cierre: el líder puede marcarlo al incorporar el presente veredicto y efectuar el lifecycle. No es trabajo funcional sin implementar.

## Output de ./init.sh
```text

══════════════════════════════════════════
  INIT — ODC (Harness SDD)
══════════════════════════════════════════

→ Verificando entorno...
✅ node disponible (/c/Program Files/nodejs/node)
✅ pnpm disponible (pnpm)

→ Verificando variables de entorno...
✅ .env encontrado
✅   DATABASE_URL definida
✅   JWT_SECRET definida

→ Instalando dependencias...
Lockfile is up to date, resolution step is skipped
Already up to date

Done in 762ms using pnpm v10.34.6
Lockfile is up to date, resolution step is skipped
Already up to date

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: core-js@3.49.0.                                     │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 866ms using pnpm v10.34.6
✅ Dependencias instaladas

→ Verificando coherencia del harness...
✅ Archivos del harness presentes
⚠️  Feature en progreso: odc-detail-history-hydration

→ Build...

> backend@0.0.1 build C:\sites\odc\backend
> nest build


> frontend@ build C:\sites\odc\frontend
> vite build

vite v8.1.5 building client environment for production...

transforming...
[@tanstack/devtools-vite] Removed devtools code from: /src/routes/__root.tsx

✓ 4062 modules transformed.
rendering chunks...
computing gzip size...
dist/client/assets/inter-vietnamese-wght-normal-CBcvBZtf.woff2     10.25 kB
dist/client/assets/inter-greek-ext-wght-normal-DlzME5K_.woff2      11.23 kB
dist/client/assets/inter-cyrillic-wght-normal-DqGufNeO.woff2       18.74 kB
dist/client/assets/inter-greek-wght-normal-CkhJZR-_.woff2          18.99 kB
dist/client/assets/inter-cyrillic-ext-wght-normal-BOeWTOD4.woff2   25.96 kB
dist/client/assets/inter-latin-wght-normal-Dx4kXJAl.woff2          48.25 kB
dist/client/assets/inter-latin-ext-wght-normal-DO1Apj_S.woff2      85.06 kB
dist/client/assets/styles-CS8oYUzd.css                            111.93 kB │ gzip:  19.63 kB
dist/client/assets/separator-B02dCtu5.js                            0.05 kB │ gzip:   0.07 kB
dist/client/assets/monthly-summary-CKRVZH3e.js                      0.08 kB │ gzip:   0.09 kB
dist/client/assets/new-CKRVZH3e.js                                  0.08 kB │ gzip:   0.09 kB
dist/client/assets/useRender-PnKLwDfK.js                            0.10 kB │ gzip:   0.11 kB
dist/client/assets/chevron-down-BKSOAoYL.js                         0.12 kB │ gzip:   0.14 kB
dist/client/assets/chevron-right-BCFJZty9.js                        0.13 kB │ gzip:   0.14 kB
dist/client/assets/use-authenticated-user-BdyUzOBB.js               0.13 kB │ gzip:   0.13 kB
dist/client/assets/skeleton-v6Me-q99.js                             0.24 kB │ gzip:   0.20 kB
dist/client/assets/circle-alert-DybOpjhX.js                         0.25 kB │ gzip:   0.18 kB
dist/client/assets/typeof-B5XbjTb1.js                               0.27 kB │ gzip:   0.16 kB
dist/client/assets/tasks-Bk9Plvz8.js                                0.28 kB │ gzip:   0.22 kB
dist/client/assets/refresh-cw-BCWSKxM6.js                           0.32 kB │ gzip:   0.22 kB
dist/client/assets/_id-D0k0IaJ8.js                                  0.36 kB │ gzip:   0.29 kB
dist/client/assets/_authenticated-0Engdu5v.js                       0.52 kB │ gzip:   0.35 kB
dist/client/assets/rolldown-runtime-QTnfLwEv.js                     0.69 kB │ gzip:   0.42 kB
dist/client/assets/_authenticated-BBhHap0m.js                       0.73 kB │ gzip:   0.46 kB
dist/client/assets/useNavigate-BVMntIxV.js                          0.77 kB │ gzip:   0.45 kB
dist/client/assets/new-k9FeIxq0.js                                  1.21 kB │ gzip:   0.69 kB
dist/client/assets/createLucideIcon-DcQ4kBSe.js                     1.23 kB │ gzip:   0.71 kB
dist/client/assets/table-jJWO4e2o.js                                1.29 kB │ gzip:   0.53 kB
dist/client/assets/card-DNzzk68y.js                                 1.57 kB │ gzip:   0.59 kB
dist/client/assets/odc-page-state-D52v_BvB.js                       1.65 kB │ gzip:   0.69 kB
dist/client/assets/alert-BgK1i4EB.js                                1.95 kB │ gzip:   0.84 kB
dist/client/assets/dialog-B-xJXkch.js                               2.40 kB │ gzip:   0.94 kB
dist/client/assets/tasks-FX7u9iFH.js                                2.50 kB │ gzip:   1.17 kB
dist/client/assets/odc-status-badge-XgkNYoSB.js                     2.64 kB │ gzip:   1.07 kB
dist/client/assets/field-IfjoNG65.js                                2.94 kB │ gzip:   1.11 kB
dist/client/assets/login-Cv6h5qfF.js                                3.59 kB │ gzip:   1.53 kB
dist/client/assets/api-C19Ojmuo.js                                  3.98 kB │ gzip:   1.62 kB
dist/client/assets/preload-helper-CrUqT8dK.js                       6.73 kB │ gzip:   2.33 kB
dist/client/assets/jsx-runtime-CIxEorsV.js                          7.89 kB │ gzip:   2.98 kB
dist/client/assets/executive-task-table-CwsNYHfQ.js                 8.45 kB │ gzip:   3.08 kB
dist/client/assets/DialogTitle-kQlWm-gK.js                          9.47 kB │ gzip:   3.33 kB
dist/client/assets/odc-form-6SE6dscY.js                            20.66 kB │ gzip:   7.11 kB
dist/client/assets/purify.es-DuRL7t6i.js                           26.87 kB │ gzip:  10.45 kB
dist/client/assets/_id-Bu4Yq42O.js                                 27.67 kB │ gzip:   7.08 kB
dist/client/assets/select-Bt6-dp2N.js                              30.52 kB │ gzip:  11.07 kB
dist/client/assets/useCompositeListItem-BhNbtjPU.js                41.04 kB │ gzip:  15.40 kB
dist/client/assets/input-wVByKUpo.js                               45.61 kB │ gzip:  15.79 kB
dist/client/assets/executive-query-BBqFChdR.js                     62.30 kB │ gzip:  17.44 kB
dist/client/assets/composite-Bsy62ZXL.js                           69.42 kB │ gzip:  23.99 kB
dist/client/assets/_authenticated-A6I9k7HC.js                      75.80 kB │ gzip:  22.99 kB
dist/client/assets/date-picker-azkwTbmy.js                         80.50 kB │ gzip:  23.32 kB
dist/client/assets/index.es-BVI-yroT.js                           151.36 kB │ gzip:  48.90 kB
dist/client/assets/html2canvas-BswC5BpG.js                        199.56 kB │ gzip:  46.78 kB
dist/client/assets/index-CQ9l0XZn.js                              308.18 kB │ gzip:  97.94 kB
dist/client/assets/executive-dashboard-CKXWIt9p.js                351.24 kB │ gzip: 104.18 kB
dist/client/assets/monthly-summary-DUFeMEPF.js                    427.13 kB │ gzip: 139.36 kB

✓ built in 1.55s
vite v8.1.5 building ssr environment for production...

transforming...
[@tanstack/devtools-vite] Removed devtools code from: /src/routes/__root.tsx

✓ 181 modules transformed.
rendering chunks...
computing gzip size...
dist/server/assets/separator-DMxjynHL.js                     0.06 kB │ gzip:  0.08 kB
dist/server/assets/start-Dq46wSOO.js                         0.22 kB │ gzip:  0.17 kB
dist/server/assets/new-CVm4cYqk.js                           0.24 kB │ gzip:  0.17 kB
dist/server/assets/monthly-summary-CcF2G_28.js               0.25 kB │ gzip:  0.18 kB
dist/server/assets/empty-plugin-adapters-YdH6Vqte.js         0.28 kB │ gzip:  0.18 kB
dist/server/assets/use-authenticated-user-Rn_cqtjW.js        0.29 kB │ gzip:  0.19 kB
dist/server/assets/skeleton-0FpdSNAv.js                      0.36 kB │ gzip:  0.26 kB
dist/server/assets/tasks-CjfTp3zH.js                         0.51 kB │ gzip:  0.32 kB
dist/server/assets/_id-9hjjD9Dc.js                           0.65 kB │ gzip:  0.40 kB
dist/server/assets/new-CHo6DP0B.js                           0.70 kB │ gzip:  0.34 kB
dist/server/assets/_id-vk4lLP3P.js                           0.88 kB │ gzip:  0.45 kB
dist/server/assets/tasks-DYfFNHIg.js                         0.94 kB │ gzip:  0.44 kB
dist/server/assets/_authenticated-Cujijlmc.js                0.96 kB │ gzip:  0.49 kB
dist/server/assets/monthly-summary-qNBaRO5T.js               1.05 kB │ gzip:  0.54 kB
dist/server/assets/_authenticated-CfOEL_Sm.js                1.33 kB │ gzip:  0.62 kB
dist/server/assets/session-DEQTRa2S.js                       1.34 kB │ gzip:  0.73 kB
dist/server/assets/_authenticated-BNcMHlKG.js                1.37 kB │ gzip:  0.61 kB
dist/server/assets/table-9uTQvSqZ.js                         1.74 kB │ gzip:  0.62 kB
dist/server/assets/alert-BC9aomen.js                         1.86 kB │ gzip:  0.73 kB
dist/server/assets/new-CsmSJNOx.js                           1.95 kB │ gzip:  0.90 kB
dist/server/assets/card-SMgwy6L8.js                          2.02 kB │ gzip:  0.66 kB
dist/server/assets/odc-page-state-DJEvlzJ9.js                2.07 kB │ gzip:  0.75 kB
dist/server/assets/_authenticated-CBroPZWX.js                3.22 kB │ gzip:  1.23 kB
dist/server/assets/odc-status-badge-BQj9ZzrL.js              3.26 kB │ gzip:  1.25 kB
dist/server/assets/dialog-nBbGJSM3.js                        3.35 kB │ gzip:  1.04 kB
dist/server/assets/_tanstack-start-manifest_v-9SwkssAH.js    3.47 kB │ gzip:  1.04 kB
dist/server/assets/field-ByEyXDG-.js                         3.77 kB │ gzip:  1.26 kB
dist/server/assets/input-DHm-_SZW.js                         3.83 kB │ gzip:  1.25 kB
dist/server/assets/router-KvWJvhN6.js                        3.83 kB │ gzip:  1.35 kB
dist/server/assets/tasks-CVCI0S-u.js                         4.14 kB │ gzip:  1.50 kB
dist/server/assets/select-B75V-Uno.js                        4.98 kB │ gzip:  1.55 kB
dist/server/assets/executive-query-sTe354sd.js               5.80 kB │ gzip:  2.13 kB
dist/server/assets/login-8bX4QOMV.js                         6.38 kB │ gzip:  2.02 kB
dist/server/assets/api-CMimeIfi.js                           6.41 kB │ gzip:  2.00 kB
dist/server/assets/toast-BN_BdhlK.js                         6.70 kB │ gzip:  1.82 kB
dist/server/assets/date-picker-DxtD5WDj.js                   9.51 kB │ gzip:  2.85 kB
dist/server/assets/executive-task-table-BZh928Ri.js         13.51 kB │ gzip:  3.73 kB
dist/server/assets/odc-form-Hx-3jf7r.js                     24.34 kB │ gzip:  5.64 kB
dist/server/assets/monthly-summary-B1PkT82Q.js              24.37 kB │ gzip:  5.96 kB
dist/server/assets/executive-dashboard-ccm2s4Ll.js          28.01 kB │ gzip:  7.46 kB
dist/server/assets/_authenticated-fiuii-mG.js               38.51 kB │ gzip:  9.15 kB
dist/server/assets/_id-VNKLakPh.js                          47.18 kB │ gzip:  8.72 kB
dist/server/server.js                                      172.53 kB │ gzip: 43.15 kB

✓ built in 891ms
✅ Build exitoso
→ Ejecutando tests...

> backend@0.0.1 test C:\sites\odc\backend
> jest "--runInBand"


Test Suites: 73 passed, 73 total
Tests:       885 passed, 885 total
Snapshots:   0 total
Time:        20.009 s
Ran all test suites.

> frontend@ test C:\sites\odc\frontend
> vitest run "--passWithNoTests" "--pool=threads" "--maxWorkers=2"


 RUN  v4.1.10 C:/sites/odc/frontend


 Test Files  41 passed (41)
      Tests  691 passed (691)
   Start at  17:31:43
   Duration  65.69s (transform 1.31s, setup 7.71s, import 44.90s, tests 36.48s, environment 33.54s)

✅ Tests pasados

→ Lint...

> backend@0.0.1 lint C:\sites\odc\backend
> eslint "{src,apps,libs,test}/**/*.ts" --fix

✅ Lint sin errores

══════════════════════════════════════════
✅ Todo verde. Listo para trabajar.

  Features: 39/40 completadas | 0 pendientes



```

## Output PostgreSQL independiente
```text

Test Suites: 2 passed, 2 total
Tests:       38 passed, 38 total
Snapshots:   0 total
Time:        5.185 s, estimated 6 s
Ran all test suites matching odc-concurrent-updates.e2e-spec.ts|odc-orphan-file-recovery.e2e-spec.ts.

```
