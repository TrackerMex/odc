---
feature: "frontend-dashboard-template"
status: draft
tags: [harness, spec, frontend, dashboard]
---

# Tareas — [[frontend-dashboard-template]]

> No implementar hasta la aprobación humana de [[requirements]]. Después, registrar primero las excepciones aprobadas en el override del dashboard. Reutilizar suites existentes; cada comprobación nombra su R-id.

## R1 — Shell y navegación por rol

- [ ] (1) Test rojo: contexto de cada ruta, tema, navegación activa y enlaces permitidos para los tres roles.
- [ ] (2) Adaptar shell/sidebar existentes y conservar sesión, controles y guards.
- [ ] (3) Refactor mínimo con tests verdes; revisar consumidores del layout.

## R2 — Composición ejecutiva

- [ ] (1) Comprobación roja: jerarquía de módulos y CTA por rol, con evidencia de escritorio y móvil.
- [ ] (2) Aplicar panel unido, tabla principal y contexto lateral desde 1280px; conservar secuencia panel → prioridad → contexto en DOM y lectura a todos los anchos.
- [ ] (3) Refactor mínimo con tests verdes, sin abstracción de variantes de plantilla.

## R3 — Métricas y comparación mensual

- [ ] (1) Test rojo: par de meses, importes dispares, ambos cero, variación nula/cero y total de tareas mayor que las filas visibles.
- [ ] (2) Renderizar cifras y dos barras con escala común, conservando formateadores y contrato.
- [ ] (3) Refactor mínimo con tests verdes y sin nuevas consultas.

## R4 — Prioridad accionable

- [ ] (1) Test rojo: tabla accesible, datos/enlaces por rol, estado vacío y acceso a todas las tareas cuando corresponde.
- [ ] (2) Adaptar la cola al patrón de tabla con scroll local accesible en móvil.
- [ ] (3) Refactor mínimo con tests verdes, manteniendo acciones y restricciones actuales.

## R5 — Proveedores y antigüedad

- [ ] (1) Test rojo: ranking y orden recibidos, importes cero, barras finitas, datos textuales equivalentes y vacíos independientes.
- [ ] (2) Presentar las dos secciones con CSS nativo y enlaces existentes.
- [ ] (3) Refactor mínimo con tests verdes; eliminar cualquier dato ornamental.

## R6 — Carga y recuperación

- [ ] (1) Test rojo: carga accesible sin cifras ficticias, error anunciado y reintento conectado.
- [ ] (2) Adaptar superficies de carga/error manteniendo exports y manejo de sesión.
- [ ] (3) Refactor mínimo con tests verdes, sin estado duplicado de consulta.

## R7 — Responsive, temas y accesibilidad

- [ ] (1) Registrar comprobación inicial que falla contra el diseño propuesto a 375/768/1024/1440px, en claro/oscuro, con contenido largo y navegación por teclado.
- [ ] (2) Ajustar composición, menú móvil, foco, contraste, áreas táctiles y movimiento reducido; preservar tokens.
- [ ] (3) Repetir comprobaciones con los tres roles y guardar evidencia visual y medidas en `progress/verify_frontend-dashboard-template.md`.

## R8 — Procedencia y cierre

- [ ] (1) Comprobación inicial: correspondencia con la plantilla, avisos de código copiado, ausencia de dependencias/endpoints nuevos y cobertura de R1–R7.
- [ ] (2) Documentar procedencia final, incluir MIT si corresponde y ejecutar `./init.sh` y verificación visual de la app.
- [ ] (3) Revisar diff y trazabilidad con checks verdes; commit convencional y cierre de estado/progreso según AGENTS.md.
