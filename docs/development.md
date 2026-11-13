# Desarrollo local

ODC usa dos paquetes independientes y `pnpm@10.34.6`. Los comandos oficiales usan Corepack con esa versión, aunque exista otro pnpm global. Ejecuta los comandos siguientes desde la raíz del repositorio, con Node 24 y Corepack disponibles. Docker Desktop es necesario para la variante Docker.

## Preparación del host

Prepara cada paquete explícitamente al clonar el proyecto o al adoptar este flujo por primera vez:

```powershell
node scripts/dependencies.cjs setup backend
node scripts/dependencies.cjs setup frontend
```

La preparación puede descargar el gestor y los paquetes necesarios. Instala con `--frozen-lockfile` y guarda una marca pequeña dentro de cada `node_modules`; no borra tiendas ni datos de Docker. Conserva las políticas de instalación locales existentes.

## Arranque diario del host

Ejecuta cada servidor en una terminal:

```powershell
node scripts/dependencies.cjs start backend
```

```powershell
node scripts/dependencies.cjs start frontend
```

Estos comandos comprueban los archivos de entrada y unos metadatos conocidos antes de iniciar Nest o Vite. No instalan dependencias, no descargan gestores y no ejecutan la verificación completa. Las compilaciones incrementales de los servidores siguen funcionando. Puedes detener cada servidor con Ctrl+C.

Si la comprobación encuentra cambios o una instalación previa sin marca, se detiene con el comando de preparación correspondiente. Una modificación de código de aplicación no exige preparar otra vez.

## Preparación y arranque con Docker

Construye las imágenes cuando sea necesario:

```powershell
docker compose build backend frontend
```

Las imágenes instalan con la versión fijada y el lockfile congelado durante el build. Docker copia sus dependencias y marca a los volúmenes nuevos. Si las entradas montadas coinciden con la imagen, el primer arranque puede reutilizarlas directamente.

Los archivos locales `pnpm-workspace.yaml` y `.npmrc` quedan fuera del contexto de construcción: preservamos las políticas locales y evitamos incorporar credenciales a las imágenes. Si existen en tu directorio montado, prepara explícitamente los volúmenes después del build; también debes hacerlo para volúmenes anteriores a este flujo:

```powershell
docker compose run --rm --no-deps backend node /scripts/dependencies.cjs setup /app --context docker
docker compose run --rm --no-deps frontend node /scripts/dependencies.cjs setup /app --context docker
```

Estos comandos ejecutan solo la sincronización del servicio indicado, sin iniciar el servidor ni sus servicios dependientes. Conservan los volúmenes y los datos de PostgreSQL. Reconstruir una imagen no actualiza por sí solo un volumen existente: vuelve a sincronizarlo si cambian sus entradas.

Para el trabajo diario:

```powershell
docker compose up -d
```

Para detener o reiniciar el entorno:

```powershell
docker compose stop
docker compose start
```

El inicio comprueba la preparación sin instalar. Compose monta `scripts/` como solo lectura en `/scripts`; estas imágenes de desarrollo se ejecutan mediante Compose para disponer del helper. Si cambian dependencias con los servidores en marcha, detén los servicios de aplicación antes de sincronizar sus volúmenes.

## Cuando cambian las dependencias

Al recibir cambios de `package.json`, `pnpm-lock.yaml`, `.npmrc` o `pnpm-workspace.yaml`, ejecuta de nuevo `setup` para los paquetes afectados, en el entorno donde trabajas (host o Docker). Cada entorno tiene su propia marca: no se reutilizan instalaciones Windows en Linux. Un cambio de plataforma, arquitectura, versión mayor o ABI de Node también exige preparación.

Para añadir o actualizar una dependencia intencionalmente, usa la versión fijada dentro del paquete y revisa el cambio de manifiesto y lockfile:

```powershell
cd frontend
corepack pnpm@10.34.6 add NOMBRE_DEL_PAQUETE
cd ..
node scripts/dependencies.cjs setup frontend
```

El ejemplo modifica dependencias de forma explícita; `setup` nunca regenera un lockfile desactualizado por comodidad. Si el install congelado falla, corrige primero la discrepancia de manifiesto/lockfile y vuelve a preparar. En Docker, realiza después la sincronización puntual del volumen afectado.

## Verificación completa

Con ambos paquetes preparados en el host, ejecuta desde Git Bash:

```bash
./init.sh
```

La verificación comprueba preparación y ejecuta ambos builds, todas las pruebas de backend y frontend y lint del backend. No instala dependencias. Es un trabajo completo y costoso que se utiliza para validar cambios; el arranque diario usa los comandos `start` anteriores.

Las pruebas del tooling se pueden ejecutar directamente con Node:

```powershell
node --test scripts/dependencies.test.cjs scripts/dependency-wiring.test.cjs
```

Las tiendas `.pnpm-store` pueden seguir existiendo y los servidores pueden escribir sus cachés habituales. Los ignores las mantienen fuera de Git y de los contextos Docker; este flujo evita instalaciones recurrentes sin limpiar automáticamente cachés, `node_modules` o volúmenes.
