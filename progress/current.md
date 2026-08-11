# Sesion en curso — 2026-08-11

```
feature: ui-dead-surfaces-audit
id: 30
inicio: 2026-08-11 12:52 -06:00
plan: auditar superficies ODC sin importadores de produccion, decidir si se
      montan o eliminan y definir una guarda contra nuevas superficies muertas
estado: in_progress; gate humano aprobado, implementacion por iniciar
bloqueos: ninguno
spec_author: hecho -> specs/ui-dead-surfaces-audit/ (4 requisitos)
gate humano: aprobado 2026-08-11
implementer: por lanzar
reviewer: no lanzado
```

## Contexto

- La feature 25 confirmo que `OdcDashboard`, `AdminDashboard` y
  `GeneralDashboard` no tienen importadores de produccion.
- La ruta `/` monta `ExecutiveDashboard` para los tres roles.
- La auditoria debe cubrir tambien las superficies previstas por las features
  26 y 27 antes de especificarlas.
- `feature_list.json` esta en `in_progress`; el gate fue aprobado por el humano
  el 2026-08-11 y queda registrado antes de lanzar implementacion.

## Decision propuesta por la spec

- Eliminar `OdcDashboard`, `AdminDashboard` y `GeneralDashboard`, sustituidos
  explicitamente por la portada comun de la feature 19.
- Conservar detalle, formularios, login y resumen mensual: todos tienen camino
  desde rutas de produccion y siguen siendo objetivos validos de las features
  26 y 27.
- Añadir una guarda transitiva de alcanzabilidad desde rutas de produccion para
  detectar futuras superficies ODC huerfanas.

## Verificacion inicial

`./init.sh` verde: 471 tests backend, 472 frontend, builds y lint correctos.
