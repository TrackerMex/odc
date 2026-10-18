# impl: dev-startup-dependency-reuse
Fecha: 2026-10-17 (America/Mexico_City)

## Alcance
Feature #41 aprobada por el usuario en requirements.md. Implementación de tooling de desarrollo sin cambios de negocio ni de lockfiles. Informes especializados:
- progress/impl_dev-startup-dependency-reuse_tooling.md
- progress/impl_dev-startup-dependency-reuse_docker.md

## Verificación del líder
- Baseline antes de implementar: init completo verde, 73 suites / 885 pruebas backend, 41 archivos / 691 frontend, ambos builds y lint.
- Preparación explícita real host con el helper final: ambos paquetes Already up to date con pnpm10.34.6, sin reconstruir node_modules; se publicaron las marcas locales.
- Comprobación caliente backend+frontend dentro de un proceso Node: 18.79ms en este ensayo; mtimes de snapshots conservados. No es una medición del tiempo de inicio completo de Nest/Vite.
- Nueva configuración init final ejecutada sin wrappers ni instalaciones: exit0, ambos builds, 34/34 pruebas tooling, 73 suites / 885 pruebas backend, 41 archivos / 691 pruebas frontend (108.62s), lint del backend. Total 1,610 pruebas aprobadas.
- Los cuatro hashes de configuraciones locales y lockfiles registrados en progress/current.md se preservan. routeTree.gen.ts y history.md tenían cambios previos ajenos que no se incorporan a los commits de la feature.

## Criterios para revisión independiente
Contrastar R1-R7 con tests, historial rojo/verde separado y traceability. Repetir init completo usando Bash normal (sin wrapper previo); confirmar arranque solo lectura, sin install/red, fallos accionables y setup congelado. Revisar evidencia Docker de imágenes reales y volúmenes aislados en el informe especializado.

## Límites operativos
Las instalaciones anteriores necesitan setup una vez para obtener la marca. Configuración opcional local excluida de la imagen exige sync explícito del volumen montado. docs/development.md contiene comandos de host y Docker. No se han borrado las tiendas, las configuraciones locales ni los datos PostgreSQL del usuario.

## Revisión independiente
Reviewer startup_reviewer repitió ./init.sh normal sin instalaciones: exit0, ambos builds, 34/34 tooling, 73 suites/885 backend, 41 archivos/691 frontend (72.52s), lint verde. Sin defectos de código; informe definitivo en progress/review_dev-startup-dependency-reuse.md.
