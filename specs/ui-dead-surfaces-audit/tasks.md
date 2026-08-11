---
feature: "ui-dead-surfaces-audit"
status: draft        # draft | approved
tags: [harness, spec, frontend, audit, routes]
---

# Tareas — [[ui-dead-surfaces-audit]]

> Disciplina TDD. Cada tarea corresponde a un requisito de [[requirements]] y
> sigue test rojo → implementación mínima → refactor con tests verdes.

## R1 + R3 — Detectar y eliminar las tres superficies sustituidas

- [ ] (1) Escribir y ejecutar primero la guarda de alcanzabilidad para R1,R3;
      SHALL fallar nombrando exactamente los tres dashboards todavía presentes
- [ ] (2) Eliminar los seis archivos, retirar sus referencias activas y
      actualizar la documentación normativa/planificación mínima hasta que la
      guarda pase
- [ ] (3) Refactor del resolvedor de imports con tests verdes y fallo legible;
      conservar la evidencia histórica en specs y reportes previos

## R2 — Conservar una sola portada ejecutiva para los tres roles

- [ ] (1) Identificar la cobertura existente de R2 y añadir solo las aserciones
      de caracterización que falten; no fabricar un rojo cambiando producción
- [ ] (2) Mantener `loadAuthenticatedDashboard` y `ExecutiveDashboard` sin
      cambios; la eliminación de R1 SHALL conservar esas guardas verdes
- [ ] (3) Ejecutar la suite dirigida y confirmar ausencia de ramas por rol y de
      llamadas `listOdcs`

## R4 — Preservar las superficies montadas de las features 26 y 27

- [ ] (1) Identificar la cobertura existente de los caminos y gates enumerados
      en R4 y añadir solo las aserciones de caracterización que falten
- [ ] (2) Conservar rutas y superficies vigentes; limitar la implementación a
      retirar código muerto
- [ ] (3) Ejecutar las suites de detalle, formularios, login y resumen mensual
      y confirmar que permanecen verdes
