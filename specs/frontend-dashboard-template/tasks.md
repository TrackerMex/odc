---
feature: "frontend-dashboard-template"
status: done
tags: [harness, spec, frontend, dashboard]
---

# Tareas — [[frontend-dashboard-template]]

> Aprobación humana registrada antes de implementar; excepciones guardadas en el override del dashboard. Suites existentes reutilizadas; cada comprobación nombra su R-id.

## R1 — Shell y navegación por rol

- [x] (1) Test rojo: contexto de cada ruta, tema, navegación activa y enlaces permitidos para los tres roles.
- [x] (2) Adaptar shell/sidebar existentes y conservar sesión, controles y guards.
- [x] (3) Refactor mínimo con tests verdes; revisar consumidores del layout.

## R2 — Composición ejecutiva

- [x] (1) Comprobación roja: jerarquía de módulos y CTA por rol, con evidencia de escritorio y móvil.
- [x] (2) Aplicar panel unido, tabla principal y contexto lateral desde 1280px; conservar secuencia panel → prioridad → contexto en DOM y lectura a todos los anchos.
- [x] (3) Refactor mínimo con tests verdes, sin abstracción de variantes de plantilla.

## R3 — Métricas y comparación mensual

- [x] (1) Test rojo: par de meses, importes dispares, ambos cero, variación nula/cero y total de tareas mayor que las filas visibles.
- [x] (2) Renderizar cifras y dos barras con escala común, conservando formateadores y contrato.
- [x] (3) Refactor mínimo con tests verdes y sin nuevas consultas.

## R4 — Prioridad accionable

- [x] (1) Test rojo: tabla accesible, datos/enlaces por rol, estado vacío y acceso a todas las tareas cuando corresponde.
- [x] (2) Adaptar la cola al patrón de tabla con scroll local accesible en móvil.
- [x] (3) Refactor mínimo con tests verdes, manteniendo acciones y restricciones actuales.

## R5 — Proveedores y antigüedad

- [x] (1) Test rojo: ranking y orden recibidos, importes cero, barras finitas, datos textuales equivalentes y vacíos independientes.
- [x] (2) Presentar las dos secciones con CSS nativo y enlaces existentes.
- [x] (3) Refactor mínimo con tests verdes; eliminar cualquier dato ornamental.

## R6 — Carga y recuperación

- [x] (1) Test rojo: carga accesible sin cifras ficticias, error anunciado y reintento conectado.
- [x] (2) Adaptar superficies de carga/error manteniendo exports y manejo de sesión.
- [x] (3) Refactor mínimo con tests verdes, sin estado duplicado de consulta.

## R7 — Responsive, temas y accesibilidad

- [x] (1) Registrar comprobación inicial que falla contra el diseño propuesto a 375/768/1024/1440px, en claro/oscuro, con contenido largo y navegación por teclado.
- [x] (2) Ajustar composición, menú móvil, foco, contraste, áreas táctiles y movimiento reducido; preservar tokens.
- [x] (3) Repetir comprobaciones con los tres roles y guardar evidencia visual y medidas en `progress/verify_frontend-dashboard-template.md`.

## R8 — Procedencia y cierre

- [x] (1) Comprobación inicial: correspondencia con la plantilla, avisos de código copiado, ausencia de dependencias/endpoints nuevos y cobertura de R1–R7.
- [x] (2) Documentar procedencia final, incluir MIT si corresponde y ejecutar `./init.sh` y verificación visual de la app.
- [x] (3) Revisar diff y trazabilidad con checks verdes; commit convencional y cierre de estado/progreso según AGENTS.md.
