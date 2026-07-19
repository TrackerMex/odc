# review: backend-foundation

Fecha: 2026-07-19
Veredicto: **APROBADO**

Revisión independiente: el reviewer ejecutó `./init.sh` él mismo, leyó los 9
archivos de `backend/src/`, verificó `git log` y los diffs de cada commit.
No se aceptó ningún dato del reporte del implementer sin re-verificarlo.

---

## Checklist C1 — Arnés completo (aplica: primera feature del proyecto)

- [x] Archivos base presentes: `CLAUDE.md`, `AGENTS.md`, `CHECKPOINTS.md`, `STATUS.md`, `init.sh`, `init.config.sh`, `feature_list.json`
      (evidencia: `ls` de los 17 archivos → todos existen)
- [x] Los 5 docs presentes: `docs/architecture.md`, `conventions.md`, `verification.md`, `specs.md`, `obsidian.md`
- [x] `specs/_template/` existe (con `design.md`, `requirements.md`, `tasks.md`, `traceability.md`)
- [x] Los 5 agentes presentes en `.claude/agents/`
- [x] `./init.sh` termina con exit code 0 (ver output al final)

## Checklist C2 — Estado coherente

- [x] Solo 1 feature `in_progress` en `feature_list.json` (id 1, `backend-foundation`; las otras 12 `pending`)
- [x] `progress/current.md` describe la sesión activa (backend-foundation, spec aprobada 2026-07-18, implementer en curso, reviewer pendiente)
- [x] `progress/history.md` existe; sin entradas de sesión cerrada porque la sesión sigue activa (coherente)
- [x] Ninguna feature `done` todavía, por lo que "toda done tiene test" se cumple vacuamente

## Checklist C3 — Arquitectura

Esta feature es config/bootstrap: no introduce capas domain/application, por lo
que las reglas de capas aplican de forma reducida. Verificado sobre el código real:

- [x] No hay lógica de negocio en controllers: `backend/src/health.controller.ts`
      devuelve un objeto estático `{ status: 'ok' }` (9 líneas, sin dependencias)
- [x] `backend/src/main.ts` es entrypoint trivial: `import { bootstrap } ...; void bootstrap();` (3 líneas)
- [x] La configuración vive en factories/helpers puros y testeables:
      `config/typeorm.config.ts` (factory pura sobre `ConfigService`) y
      `bootstrap.ts` (`configureApp`, `resolvePort`)
- [x] Sin violaciones de la regla de dependencia (no existe aún código domain/application que pudiera violarla)

## Checklist C4 — TDD

- [x] Cada R1–R8 tiene al menos un test que lo nombra, verificado leyendo los 4 spec files:
  - `app.module.spec.ts` → `describe('R1: global ConfigModule loading the repo root .env')` y `describe('R8: scaffold getHello endpoint removed')`
  - `config/typeorm.config.spec.ts` → `describe('R2: ...')` y `describe('R3: ...')`
  - `bootstrap.spec.ts` → `describe('R4: ...')`, `describe("R5: ...")`, `describe('R6: ...')`
  - `health.controller.spec.ts` → `describe("R7: GET /api/health responds { status: 'ok' }")`
- [x] Los tests verifican lo que el requisito dice, no placeholders:
  - R1: asserta `{ isGlobal: true, envFilePath: '../.env' }` sobre las opciones exportadas Y que el import dinámico de `ConfigModule` en `AppModule` tiene `global: true` (resuelve la `Promise<DynamicModule>` de @nestjs/config v4 sin levantar la app)
  - R2: factory con `ConfigService` mockeado → `{ type: 'postgres', url: <DATABASE_URL>, autoLoadEntities: true }`, sin tocar Postgres
  - R3: 3 casos — `production` → `synchronize: false`; `development` y sin `NODE_ENV` → `true`
  - R4: inspecciona el `ValidationPipe` real pasado a `useGlobalPipes` y asserta `validatorOptions.whitelist === true`
  - R5: `setGlobalPrefix` llamado con `'api'`
  - R6: `resolvePort({ PORT: '8080' }) === 8080` y `resolvePort({}) === 3001`, sin sockets
  - R7: retorno exacto `{ status: 'ok' }` + metadata de ruta (`path === 'health'`, `method === GET`)
  - R8: `existsSync` false para los 3 archivos scaffold
- [x] Historial granular, no todo en un commit: 6 commits `feat` (uno por requisito o par R2,R3 / R4,R5), cada uno con su test + implementación mínima, seguido de su commit `docs(...): trace ...`. Verificado con `git show --stat` de los 6 hashes: cada `feat` toca el spec file de su R-id junto con la implementación correspondiente.
      Nota: test e implementación viajan en el mismo commit por requisito (rojo→verde colapsado en un commit); el anti-patrón que C4 prohíbe ("todo junto") no está presente.

## Checklist C5 — Trazabilidad

- [x] `specs/backend-foundation/traceability.md`: 8 filas, ninguna "pendiente"
- [x] Los 6 hashes referenciados existen en `git log`: `c96671e` (R1), `7e0c964` (R2,R3), `def07ce` (R4,R5), `1e2809e` (R6), `d7747e2` (R7), `87bb410` (R8)
- [x] Los nombres de test de la tabla coinciden byte a byte con los `describe(...)` reales de los spec files
- [x] Formato de commit correcto: `feat(backend-foundation): <desc> (R-ids)` en los 6 commits

## Checklist C6 — Spec aprobada

- [x] `requirements.md` con `status: approved` en el frontmatter
- [x] Casilla "Aprobado por humano" marcada con fecha 2026-07-18
- [x] Ningún requisito modificado tras la aprobación: `git diff` de `requirements.md` muestra únicamente el cambio de aprobación en sí (`draft → approved` + checkbox con fecha). El texto de R1–R8 está intacto.

---

## Evaluación de la deuda reportada por el implementer

| Deuda | ¿Bloquea? | Motivo |
|---|---|---|
| `synchronize: true` fuera de producción | No | Deuda ya documentada en design.md y declarada "fuera de alcance" en la spec (migraciones antes de producción). R3 garantiza `false` en production. |
| `backend/test/app.e2e-spec.ts` espera "Hello World!" en `GET /` | No — anotable | Verificado: el scaffold e2e sigue desactualizado. Está fuera de `TEST_CMD` (init.sh no lo ejecuta, exit 0 lo confirma) y la spec declara los e2e explícitamente fuera de alcance. Fallará si alguien corre `pnpm test:e2e` (endpoint eliminado por R8 + requiere Postgres). **Acción recomendada**: actualizarlo o eliminarlo en `auth-users` o cuando se aborden los e2e. |
| Conexión Postgres solo en runtime | No | Por diseño de la spec (tests unitarios sin DB). `DATABASE_URL` está definida en `.env` (init.sh lo verifica). |
| Orden `setGlobalPrefix`/`useGlobalPipes` | No | Indiferente en Nest; ambos verificados por R4/R5. |

## Observaciones (no bloqueantes)

1. El frontmatter de `traceability.md` conserva `status: draft` heredado de la
   plantilla. CHECKPOINTS C5 no lo exige, pero convendría alinearlo o quitar el
   campo de la plantilla de trazabilidad para evitar confusión futura.
2. Los cambios de cierre (`feature_list.json` reformateado + `in_progress`,
   `progress/current.md`, aprobación en `requirements.md`) están sin commitear
   en el working tree — son del leader, no del implementer. El leader debe
   commitearlos al marcar la feature como `done` y cerrar la sesión en
   `progress/history.md`.
3. `resolvePort` no cubre el caso degenerado `PORT=''` (daría `0`); fuera del
   alcance de R6, que solo exige presente/ausente.

## Comandos ejecutados

```
./init.sh                                  → exit 0, "✅ Todo verde"
git log --oneline -25                      → 6 feat + 6 docs trace + chore deps, R-ids en cada feat
git show --stat <6 hashes>                 → cada feat incluye su spec + impl mínima
git diff -- specs/backend-foundation/requirements.md   → solo el cambio de aprobación
git diff -- feature_list.json              → solo reformateo + spec_ready→in_progress (leader)
ls <archivos del harness>                  → los 17 + specs/_template presentes
Lectura completa de los 9 archivos de backend/src/ y de backend/test/app.e2e-spec.ts
```

## Output de ./init.sh

```
══════════════════════════════════════════
  INIT — ODC (Harness SDD)
══════════════════════════════════════════
→ Verificando entorno...
✅ node disponible   ✅ pnpm disponible
→ Verificando variables de entorno...
✅ .env encontrado   ✅ DATABASE_URL definida   ✅ JWT_SECRET definida
→ Instalando dependencias...
✅ Dependencias instaladas
→ Verificando coherencia del harness...
✅ Archivos del harness presentes
⚠️  Feature en progreso: backend-foundation
→ Build...
backend: nest build OK
frontend: vite build OK (client + ssr)
✅ Build exitoso
→ Ejecutando tests...
backend (jest): Test Suites: 4 passed, 4 total
                Tests:       15 passed, 15 total
frontend (vitest): No test files found, exiting with code 0 (--passWithNoTests)
✅ Tests pasados
→ Lint...
✅ Lint sin errores
══════════════════════════════════════════
✅ Todo verde. Listo para trabajar.
EXIT_CODE=0
```
