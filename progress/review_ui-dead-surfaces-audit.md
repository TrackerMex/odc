# review: ui-dead-surfaces-audit
Fecha: 2026-08-11T13:29:03-06:00
Veredicto: APROBADO

## Checklist C2 — Estado coherente

- [x] Solo 1 feature `in_progress`: `ui-dead-surfaces-audit` (#30); las #26–#29
      siguen `pending` y las #1–#25 están `done`.
- [x] `progress/current.md` describe la sesión activa, el gate humano, los
      commits test/feat y el handoff de implementer a reviewer.

## Checklist C3 — Arquitectura

- [x] Domain sin imports de infrastructure: no hubo cambios bajo `backend/`.
- [x] Repositories/contratos en domain son interfaces puras: no se modificaron.
- [x] Application depende de interfaces, no implementaciones: no se modificó.
- [x] Infrastructure sin lógica de negocio: no se modificó; el alcance real fue
      retirar tres componentes frontend sustituidos, añadir tests y actualizar
      documentación.

## Checklist C4 — TDD

- [x] Cada requisito tiene al menos un test que lo nombra: R1–R4 aparecen en
      `production-reachability.test.ts`, y R2 también en
      `odc-routes.test.ts`.
- [x] El historial muestra test primero. `6153dd6` precede a `4f60a9b` y sus
      seis paths son exclusivamente `*.test.ts`/`*.test.tsx`, incluidas las
      eliminaciones de los tres tests aislados. `4f60a9b` no toca ningún
      `*.test.*`: elimina los tres componentes y actualiza solo la norma activa
      y el plan vigente.
- [x] Rojo reproducido en un worktree detached de `6153dd6`: 1 archivo, 4
      tests, 2 fallos (R1 y R3) y 2 pases (R2 y R4). Ambos fallos son
      aserciones y enumeran exactamente `admin-dashboard.tsx`,
      `general-dashboard.tsx` y `odc-dashboard.tsx`; no hubo errores del
      resolvedor. El worktree y el junction temporal de dependencias quedaron
      eliminados.

Orden verificado:

```text
70ce3e9 gate humano aprobado
6153dd6 test(ui-dead-surfaces-audit): detect unreachable ODC surfaces (R1,R2,R3,R4)
4f60a9b feat(ui-dead-surfaces-audit): remove superseded dashboards (R1,R2,R3,R4)
```

## Checklist C5 — Trazabilidad

- [x] `traceability.md` tiene filas completas R1–R4 y ninguna fila pendiente.
      La única aparición textual de “pendiente” está en la regla explicativa
      posterior a la tabla.
- [x] Los hashes `6153dd6` y `4f60a9b` existen y son commits; los nombres de
      tests registrados coinciden literalmente con los `describe` reales.
- [x] El commit de implementación sigue el formato requerido:
      `feat(ui-dead-surfaces-audit): remove superseded dashboards (R1,R2,R3,R4)`;
      el commit rojo usa el conventional commit `test(...)` y los mismos R-ids.

## Checklist C6 — Spec aprobada

- [x] `requirements.md` contiene `status: approved` y
      `[X] Aprobado por humano (fecha: 2026-08-11)`.
- [x] `70ce3e9` registra la aprobación antes de iniciar implementación.
- [x] `git diff 70ce3e9 HEAD -- requirements.md` está vacío: ningún requisito
      cambió después del gate.

## Evidencia de la spec

### R1 — Retiro de superficies sustituidas

- Los seis archivos exigidos no existen: tres componentes y sus tres tests.
- La búsqueda ejecutable bajo `frontend/` no encuentra imports, lecturas ni
  renders de `AdminDashboard`, `GeneralDashboard`, `OdcDashboard` ni de sus
  módulos.
- `design-system/odc/pages/dashboard.md` lista únicamente
  `executive-dashboard.tsx` y `executive-tasks.tsx` como dashboards activos.
  `progress/ui-redesign-plan.md` registra el resultado y ya no encarga a la #26
  retirar los tres `pb-3!`; conserva la revisión de `CardHeader` y `toast.tsx`.
- Las specs y actas anteriores conservan sus referencias como historia; no se
  borró evidencia histórica.

### R2 — Portada ejecutiva compartida

- `routes/_authenticated/index.tsx` no cambió desde el gate. Admite los tres
  roles de negocio, contiene una sola invocación fuente de
  `getExecutiveDashboard`, monta un solo `ExecutiveDashboard` con el rol de la
  respuesta y devuelve `null` para roles ajenos.
- No hay `listOdcs` ni ramas de composición por rol en la ruta.
- El test R2 ejecuta los tres roles y comprueba una llamada por caso, el mes,
  ausencia de `listOdcs` y ausencia de llamada para rol desconocido.

### R3 — Guarda de alcanzabilidad

- Las raíces son los ocho `*.tsx` de `frontend/src/routes/` que no son tests;
  `routeTree.gen.ts` no es raíz y además está excluido por nombre.
- El recorrido es transitivo y resuelve archivos/índices `.ts` y `.tsx` para
  imports relativos y el alias `@/` configurado en `tsconfig.json`.
- El parser recoge imports estáticos, re-exports, side effects e imports
  dinámicos con literal; una prueba directa del regex devolvió
  `@/lib/runtime`, `./relative`, `./side-effect` y
  `@/components/odc/lazy`, omitiendo el `import type` del probe.
- Los archivos `*.test.*`/`*.spec.*`, imports `type` de declaración completa y
  `routeTree.gen.ts` se excluyen. La reproducción roja demuestra además que
  los tests aislados y `design-system.guardrails.test.ts`, aunque leían los
  dashboards, no cuentan como alcanzabilidad de producción.
- La guarda actual encuentra alcanzables las 14 superficies `*.tsx` no-test de
  `components/odc/`; no hay huérfanas.

### R4 — Superficies y gates preservados

- `/odcs/$id` conserva `OdcDetail`, las cinco acciones/formularios y `OdcForm`
  únicamente para el creador `DIRECTOR_OPS` en `BORRADOR`/`RECHAZADA`.
- `/odcs/new` conserva `OdcForm` tras el gate `DIRECTOR_OPS`; `/login` conserva
  `LoginForm`.
- `/monthly-summary` conserva el loader `getMonthlyPurchaseSummary`, la
  redirección de roles ajenos y `MonthlySummary`; el sidebar muestra su acceso
  solo a `DIRECTOR_OPS`. `MonthlySummary` importa y renderiza
  `MonthlySummarySlide`.
- Ninguna de esas rutas, gates o superficies cambió desde `70ce3e9`. La suite
  dirigida de reachability, rutas, login, detalle, formularios y resumen
  mensual terminó con 10 archivos y 129 tests verdes. Por tanto, #26 y #27
  siguen siendo objetivos válidos.

## Observaciones

Sin observaciones bloqueantes. En Windows, `bash` del sistema resolvió a WSL
sin Node; la ejecución definitiva se hizo con Git Bash y terminó con exit 0.

## Output de ./init.sh

```text
Comando: C:\Program Files\Git\bin\bash.exe ./init.sh
Exit code: 0

Entorno: node y pnpm disponibles; DATABASE_URL y JWT_SECRET definidas
Harness: archivos presentes; ui-dead-surfaces-audit es la única feature en progreso
Build backend: exitoso
Build frontend client: 3491 modules transformed; exitoso
Build frontend SSR: 175 modules transformed; exitoso
Backend: 59 suites passed; 471 tests passed
Frontend: 35 test files passed; 419 tests passed
Lint backend: sin errores
Resultado: Todo verde. Listo para trabajar.
```
