---
feature: "backend-foundation"
status: draft        # draft | approved
tags: [harness, spec]
---

# Tareas — [[backend-foundation]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> tiene siempre los mismos 3 sub-items, en este orden.

## Preparación (prerequisito, sin ciclo TDD)

- [ ] Instalar dependencias en `backend/`: `@nestjs/typeorm`, `typeorm`, `pg`,
      `@nestjs/config` (`pnpm add`). Verificar `pnpm build` en verde antes de
      empezar los ciclos TDD.

## R1 — ConfigModule global leyendo `.env` de la raíz

- [ ] (1) Escribir test que falla para R1
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R2 — Opciones TypeORM: url desde `DATABASE_URL` + `autoLoadEntities`

- [ ] (1) Escribir test que falla para R2
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R3 — `synchronize` true solo fuera de producción

- [ ] (1) Escribir test que falla para R3
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R4 — `ValidationPipe` global con `whitelist: true`

- [ ] (1) Escribir test que falla para R4
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R5 — Prefijo global de rutas `/api`

- [ ] (1) Escribir test que falla para R5
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R6 — Puerto desde `PORT` con default 3001

- [ ] (1) Escribir test que falla para R6
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R7 — `GET /api/health` → `{ status: 'ok' }`

- [ ] (1) Escribir test que falla para R7
- [ ] (2) Implementación mínima que lo pasa
- [ ] (3) Refactor con tests verdes

## R8 — Scaffold `app.controller`/`app.service` eliminado

- [ ] (1) Escribir test que falla para R8 (la suite ya no depende del scaffold;
      chequeo estructural de ausencia de `getHello`)
- [ ] (2) Implementación mínima que lo pasa (eliminar/reconvertir los archivos)
- [ ] (3) Refactor con tests verdes
