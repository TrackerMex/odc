# Conventions — ODC

> Reglas de estilo, nombres y patrones que todo el código de este proyecto
> debe seguir. Cuando tengas duda sobre cómo hacer algo, busca aquí primero.

Stack: **NestJS 11 + TypeORM + PostgreSQL** (backend, `backend/`) y
**TanStack Start + React 19 + Tailwind 4** (frontend, `frontend/`).
Código e identificadores en inglés; textos de UI en español; valores del enum
de estado de ODC en español (vienen del negocio).

---

## Nombres de archivos

Módulos backend en `backend/src/modules/<nombre>/` según la Clean Architecture
de `docs/architecture.md`:

| Tipo | Patrón | Ejemplo |
|---|---|---|
| Entidad de dominio | `domain/entities/<nombre>.entity.ts` | `purchase-order.entity.ts` |
| Interface de repositorio | `domain/repositories/<nombre>.repository.ts` | `purchase-order.repository.ts` |
| DTO de creación | `application/dto/create-<nombre>.dto.ts` | `create-odc.dto.ts` |
| DTO de actualización | `application/dto/update-<nombre>.dto.ts` | `update-odc.dto.ts` |
| Use case | `application/use-cases/<accion>-<nombre>.usecase.ts` | `approve-budget.usecase.ts` |
| Entidad ORM | `infrastructure/entities/<nombre>.orm-entity.ts` | `purchase-order.orm-entity.ts` |
| Repositorio TypeORM | `infrastructure/repositories/<nombre>.typeorm.repository.ts` | `purchase-order.typeorm.repository.ts` |
| Mapper (opcional) | `infrastructure/mappers/<nombre>.mapper.ts` | `purchase-order.mapper.ts` |
| Controller | `infrastructure/controller/<nombre>.controller.ts` | `odc.controller.ts` |
| Module | `<nombre>.module.ts` | `odc.module.ts` |
| Guard | `infrastructure/guards/<nombre>.guard.ts` | `roles.guard.ts` |
| Test unitario | junto al archivo, `<nombre>.spec.ts` | `purchase-order.entity.spec.ts` |

Frontend: rutas file-based en `frontend/src/routes/`, componentes en
`frontend/src/components/`, utilidades en `frontend/src/lib/`. Imports internos
con el alias `#/` (→ `src/`), definido en `frontend/package.json`.

Componentes UI: **shadcn/ui obligatorio**. MCP server ya configurado en
`frontend/.mcp.json`. Antes de escribir un componente de UI (botón, form,
dialog, tabla, etc.), usar las tools del MCP `shadcn` para buscar/instalar el
componente en vez de escribirlo a mano. Solo si shadcn no ofrece el
componente se justifica uno custom (dejar la razón en `design.md` de la spec).

---

## Tokens de inyección / resolución de dependencias

Los use-cases dependen de interfaces de dominio inyectadas por **token string**:
el token en `@Inject('XRepository')` y el de `{ provide: 'XRepository', useClass: ... }`
en el module deben ser **byte-idénticos**. Convención: nombre de la interface
(`'PurchaseOrderRepository'`).

---

## DTOs / validación de entrada

`class-validator` + `class-transformer` con `ValidationPipe` global
(`whitelist: true`). DTO de creación con campos obligatorios decorados;
DTO de actualización con `PartialType(CreateXDto)`. Los DTOs viven en
`application/dto/` y no importan nada de infrastructure.

Dinero siempre en **centavos enteros** (`unitPriceCents`, `totalCents`).
`totalCents` se calcula en el dominio; nunca se acepta del cliente.

---

## Manejo de errores

| Situación | Excepción/Error | Código |
|---|---|---|
| Recurso no encontrado | `NotFoundException` | 404 |
| Transición de estado inválida | `ConflictException` | 409 |
| Sin autenticación | `UnauthorizedException` | 401 |
| Rol sin permiso para la acción | `ForbiddenException` | 403 |
| Datos inválidos | `BadRequestException` (ValidationPipe) | 400 |

El dominio lanza errores propios (clases en `domain/`); el controller o un
filter los traduce a las excepciones HTTP de la tabla. El dominio nunca importa
`@nestjs/common`.

---

## Tests

- Backend: Jest (`*.spec.ts` junto al código, `rootDir: src`). Use-cases con
  repositorios mockeados — los tests unitarios NO tocan la base de datos.
  E2e opcionales en `backend/test/` (sí requieren Postgres, fuera de `TEST_CMD`).
- Frontend: Vitest + Testing Library (`*.test.tsx` junto al componente).
- Un test que cubre un requisito de spec se nombra con su R-id:

```
describe('R1: <resumen del requisito>', () => { ... })
```

---

## Commits

Conventional commits, en inglés:

```
feat(<scope>): <descripción> (R1,R2)
fix(<scope>): <descripción> (R3)
refactor(<scope>): <descripción>
```

El `<scope>` es el nombre de la feature o módulo. Los R-ids referencian los
requisitos de `specs/<feature>/requirements.md` que ese commit satisface.

---

## Variables de entorno

Definidas en `.env` en la raíz del repo (gitignored; plantilla en `.env.example`):

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión PostgreSQL (`postgres://user:pass@host:5432/db`) |
| `JWT_SECRET` | Firma de JWT de sesión |
| `PORT` | Puerto HTTP del backend (default 3001) |
