---
feature: "dev-startup-dependency-reuse"
status: approved
tags: [harness, spec, tooling]
---

# Requisitos — [[dev-startup-dependency-reuse]]

> Ver [[design]] y [[../../docs/architecture|architecture]]. Feature #41: reducir trabajo de disco durante el arranque sin esconder dependencias desactualizadas.

## Requisitos funcionales

- **R1**: WHEN se prepara o ejecuta una instalación de desarrollo del backend o frontend THE SYSTEM SHALL usar exactamente `pnpm@10.34.6`, declarado en ambos `package.json` y en ambas imágenes, y los comandos oficiales del host SHALL invocar esa versión mediante Corepack aunque haya otro pnpm global. La preparación no cambiará versiones de dependencias de negocio ni sus políticas actuales de scripts de instalación.
- **R2**: WHEN se arranca o reinicia el entorno diario con dependencias preparadas y vigentes THE SYSTEM SHALL iniciar únicamente los servidores de desarrollo, con cero invocaciones de instalación, build o tests; la comprobación de dependencias SHALL ser de solo lectura y acotada a archivos de entrada y metadatos conocidos, sin recorrer `node_modules`, la tienda de pnpm ni el árbol del proyecto. El arranque no descargará gestores ni paquetes.
- **R3**: IF faltan dependencias, falta la marca de preparación, cambian `package.json`, `pnpm-lock.yaml`, `.npmrc` o `pnpm-workspace.yaml` opcionales, o cambia el entorno compatible registrado THEN THE SYSTEM SHALL detenerse antes del servidor, indicar el paquete afectado y mostrar el comando explícito de preparación/sincronización correspondiente al host o Docker; no instalará automáticamente ni considerará vigentes dependencias antiguas. La presencia o ausencia de cada configuración opcional forma parte de la comprobación.
- **R4**: WHEN el operador ejecuta la preparación/sincronización explícita THE SYSTEM SHALL instalar con `--frozen-lockfile` y pnpm fijado, registrar las entradas y el entorno solo después del éxito y permitir el siguiente arranque sin instalación; IF la instalación falla o las entradas cambian durante ella THEN THE SYSTEM SHALL devolver un estado no exitoso y no dejar una marca válida nueva. La sincronización no borrará volúmenes, PostgreSQL ni cachés existentes como parte del procedimiento.
- **R5**: WHEN Docker crea volúmenes nuevos desde una imagen de desarrollo preparada THE SYSTEM SHALL poder arrancar con sus dependencias y marca incluidas sin instalar en el arranque, siempre que las entradas montadas coincidan con las de la imagen; IF un volumen previo carece de marca o las entradas montadas difieren THEN THE SYSTEM SHALL exigir una sincronización explícita ejecutable sin iniciar los servidores ni borrar volúmenes. Tras sincronizar, arranques y reinicios SHALL reutilizar las dependencias.
- **R6**: WHEN se ejecuta `init.sh` THE SYSTEM SHALL comprobar la preparación sin instalar y conservar build backend/frontend, todos los tests de ambos paquetes y lint del backend; el comando de verificación SHALL usar el pnpm fijado y podrá limitar concurrencia a un worker Jest y dos workers Vitest sin excluir pruebas. IF las dependencias no están preparadas THEN THE SYSTEM SHALL indicar preparación explícita antes de los checks costosos.
- **R7**: WHEN Git o Docker evalúan los archivos de trabajo THE SYSTEM SHALL excluir las tiendas locales `.pnpm-store` de ambos paquetes y los metadatos locales de preparación de seguimiento/contexto de construcción; la guía SHALL distinguir preparación inicial, arranque diario, actualización de dependencias, sincronización de volúmenes anteriores y verificación completa. Los archivos `pnpm-workspace.yaml` locales sin seguimiento SHALL conservarse sin modificación ni incorporarse por accidente a la imagen o al cambio versionado.

## Alcance y compatibilidad

- Los marcadores son locales a `node_modules`, separados por paquete. Distinguen como mínimo plataforma, arquitectura, versión mayor y ABI de Node, versión exacta de pnpm y versión del formato del marcador. Cambiar de instalación Windows a Linux requiere preparar el entorno correspondiente.
- Los cuatro archivos de entrada indicados se comparan por contenido y presencia; se pueden añadir entradas efectivamente utilizadas si la investigación demuestra su necesidad, documentándolas. La comprobación no calcula hashes del árbol de dependencias.
- El primer uso tras este cambio exige una preparación explícita para instalaciones previas sin marca. Una configuración opcional local que difiere de la imagen también exige sincronización explícita la primera vez; se preserva su política.
- Los comandos de desarrollo propios de Nest y Vite siguen siendo los servidores de desarrollo habituales. Las compilaciones incrementales inherentes a esos servidores continúan funcionando.

## Fuera de alcance

- Cambiar de gestor, convertir el proyecto a monorepo o rediseñar la aplicación.
- Actualizar dependencias de negocio, regenerar lockfiles por comodidad o modificar políticas `allowBuilds`/`onlyBuiltDependencies` del usuario.
- Borrar o mover automáticamente `.pnpm-store`, `node_modules`, volúmenes de Docker, datos PostgreSQL o cachés globales.
- Desactivar antivirus, alterar configuración global de Windows o garantizar una cifra de rendimiento sin medición.
- Reducir cobertura, omitir pruebas o sustituir la verificación completa por el arranque diario.

## Aprobación

- [x] Aprobado por humano (fecha: 2026-10-17). Respuesta: «Apruebo; implementa los ajustes».
