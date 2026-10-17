# impl: odc-detail-history-hydration — frontend
Fecha: 2026-10-17 (America/Mexico_City)

## Archivos creados
- `frontend/src/components/odc/odc-hydration.test.tsx` — SSR real con renderToString, hydrateRoot, captura de onRecoverableError, fechas visibles e interacción de formularios persistido/nuevo.
- `frontend/src/components/odc/odc-upload-history.test.tsx` — API cliente y formularios reales con reemplazo de estado mediante setOdc, ambos documentos, historial previo/nuevo y fallos sin GET reparador.

## Archivos modificados
- `frontend/src/lib/odc.ts` — única línea funcional agregada: `timeZone: 'America/Mexico_City'` al formato compartido de instantes `es-MX`.
- `frontend/src/lib/odc.test.ts` — regresiones de instante límite de año, nulos y calendario bajo tres zonas predeterminadas.
- `frontend/src/components/odc/odc-form.tsx` — fecha de resumen usa `formatDate(persistedOdc?.createdAt ?? null)`, con `Pendiente` hasta tener persistencia y sin reloj durante render.

## Requisitos cubiertos
- R2: `odc-upload-history.test.tsx::applies the complete %s response without a second GET` y `keeps prior events and the existing error handling when %s upload fails`, para evidence/invoice. Test contrato `fd8458133cc8e69fc202e1e88cdb3587df18a28e`. El cliente ya aplicaba correctamente la respuesta; no se cambió producción para R2. La regresión roja del defecto de persistencia vive en el test backend `3384374`; este harness es evidencia complementaria del estado visual y no pretende probar que un fixture demuestra persistencia real.
- R4: `odc.test.ts::formats the same midnight-boundary instant in Mexico with default zone %s`; `odc-hydration.test.tsx::hydrates detail from UTC into %s with identical creation, update and history text`; `hydrates an existing form and keeps editing, validation and save operational`. Test rojo `6b80cdcd4ae1180b6cfcbadd4cb7fc78a4c302ea`; fix `2784804e9492ae7d6a7eca8cbb5620feb1af8227`.
- R5: `odc.test.ts::preserves leap day and month/year boundaries with default zone %s`; `odc-hydration.test.tsx::preserves payment, invoice and warehouse calendar days from UTC into %s` y `keeps null calendar dates pending without a hydration recovery`. Test contrato `ea4f4c2747da57ef3a39f8098c48645dfadb61e5`. `formatDateOnly` ya cumplía el contrato con UTC; no se fabricó fallo ni cambio innecesario.
- R6: `odc-hydration.test.tsx::hydrates across midnight, stays pending while editing and uses creation returned by persistence`. Test rojo `0460cba03bae7930eef6f6d9c50616d59c88c7d7`; fix `60bb73bb7d042d6df98ca594bbe575c3362886e0`.
- R7: pruebas reales de hidratación anteriores cubren detalle, formulario persistido y nuevo, marcado/texto igual, onRecoverableError vacío, edición de campos, validación y persistencia/acción posterior. Ciclos `6b80cdc → 2784804` y `0460cba → 60bb73b`.

## Decisiones de diseño
- Se respetó el gate humano explícito y no se escribió ningún test ni código de aplicación hasta recibir INIT_GREEN del líder (builds, backend 73/880, frontend 39/672 y lint).
- Los instantes usan México explícito; el formato de calendario conserva su anclaje UTC independiente. No se cambian timestamps, payloads, políticas de servidor, preferencias de usuario ni componentes visuales.
- El formulario nuevo conserva `Pendiente` durante SSR, primera hidratación, edición, validación y revisión; cambia a la fecha real retornada al guardar. El payload no contiene un createdAt calculado por el cliente.
- En Vitest threads, cambiar process.env.TZ no actualiza necesariamente la zona por defecto ICU. El test inyecta exclusivamente el default implícito de Intl.DateTimeFormat, usando el constructor nativo cuando hay zona explícita. SSR UTC y cliente México/Tokio comparten el mismo estado. Reloj SSR 2025-12-31T23:59:59Z y cliente 2026-01-01T00:00:01Z; se restauran zonas, reloj, globals y raíces.
- No se usa suppressHydrationWarning, no se desactiva SSR ni se reemplaza el historial con eventos sintéticos.
- R2 integra API cliente real, fetch multipart y setOdc real contra respuestas de contrato. La persistencia efectiva se verifica separadamente con los tests reales backend del otro implementer.

## Evidencia rojo/verde
```
R4/R7 antes del fix:
Test Files 2 failed (2)
Tests 5 failed | 6 passed (11)
UTC: recibido 1 ene 2026, 5:30 a.m.; esperado 31 dic 2025, 11:30 p.m.
Tokyo: recibido 1 ene 2026, 2:30 p.m.; esperado 31 dic 2025, 11:30 p.m.
HydrateRoot detalle (México/Tokio) y formulario persistido: onRecoverableError registró mismatch de fechas.

R4/R7 después del fix: 2 files, 11 tests passed.
R5 contrato preservado: 2 files, 17 tests passed (sin fix de producción).
R6/R7 antes del fix: 1 failed | 6 passed; mismatch nueva orden SSR31dic2025 vs cliente1ene2026.
R6/R7 después del fix y regresión existente: 3 files, 37 tests passed.
R2 contrato UI: 1 file, 4 tests passed.
```

## Output de build
```
pnpm10 run build
vite v8.1.5 building client environment for production...
4062 modules transformed.
built in 1.81s
vite v8.1.5 building ssr environment for production...
181 modules transformed.
built in 710ms
exit 0
```

## Output de tests y comprobaciones
- Suite frontend completa: pnpm10 exec vitest run --pool=threads --maxWorkers=2, exit 0. 41 archivos y 691 tests aprobados en 62.24s (transform 1.32s, setup 7.65s, import 42.00s, tests 31.62s, environment 33.88s).
- `eslint` de los cinco archivos tocados: exit 0.
- `prettier --check` de los cinco archivos tocados: All matched files use Prettier code style, exit 0. La normalización CRLF/LF no produjo hunks extra ni commit de estilo.
- `tsc --noEmit`: exit 1 con los mismos 18 diagnósticos legacy conocidos (login-form.test.tsx, odc-detail.test.tsx, odc-form.test.tsx, payment-evidence-form.test.tsx, production-reachability.test.ts, upload-invoice-form.test.tsx, __root.test.tsx y odc-routes.test.ts). Ningún error nuevo en archivos creados/modificados por esta implementación. No se afirma que el typecheck global esté limpio ni se amplía el alcance para corregir legado.

## Notas para el reviewer
- Comprobar que el historial efectivo lo devuelve el backend dentro de transacción, y enlazar las regresiones backend HTTP/PostgreSQL con el harness R2 del frontend.
- Verificar fecha Pendiente nueva y fecha persistida en México, además de calendario intacto en límites de año/mes y año bisiesto.
- `./init.sh` global y validación navegador quedan coordinados por líder/reviewer para evitar duplicar los ciclos completos entre implementers.
- No se modificaron los archivos compartidos de specs, feature_list ni progress/current/history. El líder actualiza trazabilidad con los hashes recibidos.