---
feature: "dev-startup-dependency-reuse"
status: draft
tags: [harness, spec, tooling]
---

# Diseño — [[dev-startup-dependency-reuse]]

> Implementa [[requirements]]. Todo el cambio pertenece al tooling de infraestructura de desarrollo: no toca domain, application, contratos HTTP ni comportamiento de negocio.

## Decisiones técnicas

1. **Una versión, dos paquetes independientes (R1).** Añadir `packageManager: "pnpm@10.34.6"` a backend/frontend. Los comandos oficiales de preparación/verificación usan Corepack con versión explícita; las imágenes preparan esa misma versión en build. No hace falta `package.json` raíz ni workspace nuevo. Un pnpm global distinto no decide cómo instalar ni ejecutar la verificación. En arranque se impide la descarga de Corepack (`COREPACK_ENABLE_NETWORK=0`) o se ejecuta directamente el binario local preparado, manteniendo los scripts actuales.
2. **Helper Node compartido sin dependencias nuevas (R2–R4).** Añadir `scripts/dependencies.cjs` con operaciones documentadas `check`, `setup` y, si evita duplicación, `start`; recibe el directorio del paquete y el contexto host/Docker. Exponer comandos sencillos desde la raíz mediante Node, utilizables tanto desde PowerShell como Bash. `setup` usa Corepack exacto y `--frozen-lockfile`; `check` solo lee y compara. Los errores incluyen la ruta afectada y el comando de recuperación que se puede copiar. El helper no intenta reparar automáticamente.
3. **Snapshot pequeño dentro de `node_modules` (R2–R4).** Usar una carpeta como `node_modules/.odc-dependencies/` que contiene copias de entradas (`package.json`, `pnpm-lock.yaml`, y las configuraciones opcionales presentes) y un JSON de metadatos. Comparar bytes/presencia de esas entradas, sin escanear árboles ni requerir un hash de todo `node_modules`. Registrar formato, plataforma, arquitectura, Node mayor/ABI y pnpm exacto. Confirmar además la existencia de metadatos de pnpm y de los puntos de entrada necesarios de los servidores para detectar instalaciones vacías/incompletas evidentes, sin prometer integridad de todos los paquetes. Invalidar el marcador antes de una sincronización y publicarlo al final mediante un marcador final atómico, manipulando solo archivos de una lista explícita y sin borrado recursivo, solo si la instalación terminó correctamente y las entradas no cambiaron durante ella. No escribir al comprobar un entorno vigente.
4. **Imágenes y volúmenes con la misma evidencia (R5).** Conservar los contextos `./backend` y `./frontend`: ninguna instrucción `COPY` sale de su contexto. Instalar congelado en build y producir el snapshot del mismo formato copiando entradas y escribiendo metadatos runtime mediante Node; esto no duplica ningún algoritmo de hashing. Compose monta `./scripts` en `/scripts:ro`, y el comando del servidor primero llama al helper compartido. Las imágenes incluyen un `node_modules` preparado que Docker copia al volumen nuevo. Los volúmenes existentes se sincronizan mediante un comando puntual con `docker compose run --rm --no-deps <servicio> node /scripts/dependencies.cjs setup /app` (ajustar argumentos al CLI final), que sobrescribe el comando de servidor y usa el volumen del servicio. No utilizar `down -v` ni tocar `pgdata`.
5. **Configuración opcional conservada (R3, R5, R7).** El snapshot comprende `.npmrc` y `pnpm-workspace.yaml` si existen. Los `pnpm-workspace.yaml` actualmente sin seguimiento pertenecen al usuario: no agregarlos, sobrescribirlos ni copiar sus políticas al código versionado. Excluir esos archivos locales del contexto de las imágenes mientras sigan sin seguimiento. Una configuración local presente en el bind mount pero ausente en la imagen obliga a sincronizar explícitamente ese volumen antes del primer arranque, como cualquier otro cambio de entrada. No certificar un volumen como compatible cuando el contenido difiere. Cualquier `.npmrc` que resulte necesario no debe introducir credenciales en la imagen; revisar configuración real antes de decidir su inclusión.
6. **`init` vuelve a ser verificación (R6).** Sustituir `INSTALL_CMD` por el guard de ambos paquetes; mantener el flujo de `init.sh` y las validaciones existentes. Invocar build/tests/lint mediante Corepack fijado. Reducir concurrencia con las opciones soportadas de Jest/Vitest si el entorno lo necesita; conservar selección completa de pruebas. El arranque diario no llama a `init.sh`.
7. **Exclusiones y guía operativa (R7).** Ignorar `.pnpm-store` y metadatos locales tanto en Git como en ambos contextos Docker; mantener exclusión de `node_modules`. No limpiar la caché existente. Crear una guía de desarrollo que explique que la preparación puede descargar/instalar una vez y que la verificación completa sigue siendo costosa. Documentar variantes host/Docker, recuperación de volumen antiguo y cambios de manifiesto/lock/config. No afirmar que desaparecen todos los archivos de pnpm: se evita su regeneración recurrente.

## Archivos afectados y distribución sugerida

| Responsable de implementación | Archivos | Cambio |
|---|---|---|
| Tooling/guard | `scripts/dependencies.cjs`, `scripts/dependencies.test.cjs` (o pruebas equivalentes con Node) | CLI explícito, snapshots, comprobación de solo lectura y pruebas con runner falso |
| Tooling/guard | `init.config.sh` | Guard en lugar de instalar; Corepack exacto para checks, concurrencia acotada si procede |
| Docker/configuración | `backend/package.json`, `frontend/package.json` | `packageManager` exacto; enlaces al helper solo si son necesarios para arranque oficial |
| Docker/configuración | `backend/Dockerfile.dev`, `frontend/Dockerfile.dev`, `docker-compose.yml` | Install congelado en build, snapshots, montaje readonly y comandos guardados sin install al arrancar |
| Docker/configuración | `.gitignore`, `backend/.dockerignore`, `frontend/.dockerignore` | Cachés/metadatos fuera; preservar archivos locales del usuario |
| Docker/configuración | `docs/development.md` o guía de desarrollo ya existente | Comandos exactos y migración segura |
| Coordinación | `feature_list.json`, `progress/current.md`, `progress/history.md`, esta spec | Estado, evidencia y cierre |

Antes de implementar, acordar con el líder el formato de snapshot y argumentos del CLI para evitar cambios simultáneos incompatibles. Los lockfiles solo cambian si la instalación congelada demuestra una necesidad real que se resuelva dentro del alcance; no se actualizan paquetes.

## Verificación prevista

- Pruebas Node con directorios temporales y runner de instalación falso: versión fijada; instalación explícita contada; check/arranque caliente con contador de instalaciones cero y sin modificar mtimes/contenido de snapshots; rechazo por manifiesto, lock, configuración opcional presente/ausente y entorno distinto; fallo de instalación o entradas mutadas no publica snapshot válido. Usar inyección pequeña del runner, sin instalar dependencias para probar el guard.
- Inspección/pruebas de wiring de Compose, Dockerfiles e `init.config.sh`: no comando install/build/test en inicio, build instala congelado, comprobación antecede servidor y `init` conserva todos sus checks.
- Ensayo Docker aislado con nombre de proyecto y volúmenes propios, sin levantar PostgreSQL compartido: imagen preparada/volumen nuevo sin configuración divergente; arranque y reinicio caliente; volumen sin marca; lock/config cambiante; sincronización explícita y siguiente arranque exitoso. No borrar los volúmenes actuales del usuario. Registrar qué pudo ejecutarse realmente.
- Verificar exclusiones sin imprimir secretos ni enumerar tiendas grandes, y comprobar que los archivos locales sin seguimiento conservan sus bytes. Ejecutar `init.sh` después de preparación explícita para demostrar builds/tests/lint completos.

## Alternativas descartadas

- **Install automático en cada inicio o al detectar cambios:** provoca actividad de disco y red inesperada, y oculta cuándo se modifican dependencias.
- **Quitar install sin guard:** deja volúmenes desactualizados aparentemente válidos y errores difíciles de diagnosticar.
- **Hash recursivo/escaneo de `node_modules`:** cuesta proporcionalmente al árbol que se quiere evitar leer.
- **Un helper por paquete o copiar fuera del contexto Docker:** duplica lógica o rompe la construcción; se comparte el helper en runtime y el snapshot de build usa copias simples.
- **Borrar volúmenes/cachés o cambiar políticas de scripts:** innecesario y fuera de la petición; puede perder datos o alterar decisiones del usuario.
