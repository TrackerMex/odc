---
feature: "dev-startup-dependency-reuse"
status: draft
tags: [harness, spec, tooling]
---

# Tareas — [[dev-startup-dependency-reuse]]

> TDD por requisito de [[requirements]]. No iniciar hasta el gate humano. Nombrar tests con sus R-ids; documentar evidencia real y limitaciones.

## R1 — pnpm exacto y consistente

- [x] (1) Test rojo: declarar/invocar una versión distinta o flotante debe fallar; el runner recibe Corepack con pnpm 10.34.6 aunque el global difiera.
- [x] (2) Añadir `packageManager` y pin de imágenes/comandos, preservando dependencias y políticas existentes.
- [x] (3) Centralizar constantes necesarias y comprobar coherencia sin introducir monorepo.

## R2 — Arranque de solo lectura sin instalación

- [x] (1) Test rojo: iniciar/checkear un paquete preparado no puede llamar install, build o test ni escribir snapshots; comprobar ausencia de recorrido recursivo.
- [x] (2) Implementar guard y entrada diaria host/Docker con descarga del gestor deshabilitada durante start.
- [x] (3) Reutilizar guard y comandos evitando lógica duplicada; repetir caso caliente sin nuevas escrituras.

## R3 — Dependencias faltantes o desactualizadas

- [x] (1) Test rojo: faltar marca/dependencias; cambiar manifiesto, lock, presencia/contenido de configuraciones opcionales, plataforma/arquitectura/Node/pnpm; ningún caso inicia servidor.
- [x] (2) Comparar snapshot y entradas conocidas; emitir error con paquete y comando explícito apropiado para host/Docker.
- [x] (3) Unificar diagnóstico y comprobar que todos los rechazos siguen sin instalar ni recorrer el árbol.

## R4 — Preparación explícita y marca fiable

- [x] (1) Test rojo: setup invoca install congelado exacto una vez; falla install o cambia entrada durante install y no queda marcador válido.
- [x] (2) Instalar explícitamente, invalidar evidencia anterior y publicar snapshot solo al éxito estable; siguiente check no instala.
- [x] (3) Simplificar publicación/errores sin borrar datos, cachés ni volúmenes; cubrir recuperación tras un fallo previo.

## R5 — Imágenes, volúmenes nuevos y migración

- [ ] (1) Test rojo/wiring: Dockerfiles preparan snapshot con inputs reales; Compose inicia sin install y permite setup puntual sin iniciar aplicación/DB.
- [ ] (2) Instalar congelado en build, preparar snapshots y montar helper readonly; implementar comandos de start y sync explícitos compatibles con los contextos existentes.
- [ ] (3) Ensayar con proyecto/volúmenes aislados: fresh, warm, restart, stale/marca ausente, sync y warm final; no tocar volúmenes compartidos. Documentar configuración local divergente.

## R6 — Verificación completa sin reinstalación

- [ ] (1) Test rojo/wiring: `INSTALL_CMD` ejecuta guard y nunca instala; siguen presentes build backend/frontend, suites completas y lint.
- [ ] (2) Ajustar `init.config.sh`, Corepack exacto y límites de workers sin filtrar pruebas.
- [ ] (3) Tras preparación explícita, ejecutar `init.sh` y registrar resultado; resolver regresiones dentro de esta feature.

## R7 — Exclusiones y guía

- [ ] (1) Comprobar que reglas previas no excluyen todas las tiendas/configuraciones locales requeridas; registrar hashes de configuraciones del usuario sin mostrarlas ni agregarlas.
- [ ] (2) Ajustar ignores y escribir guía con comandos reales de preparación, arranque, actualización/sync y verificación; no limpiar cachés existentes.
- [ ] (3) Verificar exclusiones de Git/contextos Docker y preservación de archivos locales; revisar guía ejecutando los comandos aplicables.
