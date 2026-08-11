# impl: ui-dead-surfaces-audit
Fecha: 2026-08-11T13:20:57-06:00

## Archivos creados

- `frontend/src/components/odc/production-reachability.test.ts` — construye el
  grafo transitivo de imports locales desde rutas de producción y detecta
  superficies ODC huérfanas.

## Archivos modificados

- `frontend/src/design-system.guardrails.test.ts` — conserva guardas visuales
  solo para superficies activas.
- `frontend/src/routes/_authenticated/odcs/odc-routes.test.ts` — caracteriza la
  portada ejecutiva única y la ausencia de llamadas a `listOdcs`.
- `design-system/odc/pages/dashboard.md` — documenta únicamente los dashboards
  activos y retira reglas exclusivas de las colas eliminadas.
- `progress/ui-redesign-plan.md` — registra la decisión de la auditoría y quita
  de la feature 26 el retiro de los tres `pb-3!` ya eliminados.
- `specs/ui-dead-surfaces-audit/traceability.md` — enlaza R1–R4 con tests y los
  commits rojo/verde.

## Archivos eliminados

- `frontend/src/components/odc/odc-dashboard.tsx` y su test aislado.
- `frontend/src/components/odc/admin-dashboard.tsx` y su test aislado.
- `frontend/src/components/odc/general-dashboard.tsx` y su test aislado.

## Requisitos cubiertos

- R1: test `production-reachability.test.ts::R1: superseded dashboards are
  absent from executable surfaces`, commits `6153dd6` y `4f60a9b`.
- R2: tests `odc-routes.test.ts::R2: authenticated home loads one shared
  executive snapshot by role` y `production-reachability.test.ts::R2: the
  authenticated home keeps the shared executive dashboard`, commits `6153dd6`
  y `4f60a9b`.
- R3: test `production-reachability.test.ts::R3: every ODC surface is
  transitively reachable from a route`, commits `6153dd6` y `4f60a9b`.
- R4: test `production-reachability.test.ts::R4: detail, form, login and monthly
  summary surfaces stay mounted`, commits `6153dd6` y `4f60a9b`.

## Evidencia TDD

Antes de eliminar producción, la suite dirigida terminó roja únicamente por
R1/R3. Ambos fallos nombraron exactamente:

```text
admin-dashboard.tsx
general-dashboard.tsx
odc-dashboard.tsx
```

R2 y R4 pasaron en ese mismo commit de tests. Tras eliminar los componentes,
la suite dirigida quedó verde con 12 archivos y 196 tests.

## Decisiones de diseño

- Las rutas son las únicas raíces del grafo; tests, `routeTree.gen.ts` y guardas
  que leen fuentes no convierten un componente en producción alcanzable.
- El resolvedor sigue imports locales `@/` y relativos a través de archivos
  `.ts` y `.tsx`, y excluye imports exclusivamente de tipo.
- Las rutas, loaders, gates por rol/estado y superficies de las features 26/27
  no cambiaron.

## Output de build

```text
pnpm --dir frontend build
client: 3491 modules transformed, built successfully
SSR: 175 modules transformed, built successfully
```

## Output de tests

```text
pnpm --dir frontend test
Test Files  35 passed (35)
Tests       419 passed (419)

./init.sh
Backend: 59 suites, 471 tests passed
Frontend: 35 files, 419 tests passed
Build: successful
Lint: successful
Result: Todo verde
```

## Notas para el reviewer

- Verificar el historial test-only `6153dd6` → implementación `4f60a9b`.
- Confirmar que la guarda sigue detectando cadenas o ciclos huérfanos y no toma
  imports de tests ni lecturas de fuente como uso de producción.
- `feature_list.json`, `STATUS.md` y `progress/current.md` no fueron modificados;
  el cierre global corresponde al reviewer/leader.
