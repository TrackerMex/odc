# impl: dev-startup-dependency-reuse — Docker y configuración
Fecha: 2026-10-17

## Archivos creados
- `scripts/dependency-wiring.test.cjs`: prueba pins, comandos diarios, volumen persistente, generación ejecutable del snapshot y exclusiones.
- `docs/development.md`: preparación, arranque, cambios de dependencias, migración Docker y verificación completa.

## Archivos modificados
- `backend/package.json`, `frontend/package.json`: solo `packageManager: pnpm@10.34.6`, sin cambiar dependencias ni políticas.
- Ambos `Dockerfile.dev`: pin exacto, instalación congelada durante build, snapshots del contrato compartido y CMD guardado.
- `docker-compose.yml`: helper readonly y start explícito en ambos servicios; conserva todos los volúmenes y PostgreSQL.
- `.gitignore`, ambos `.dockerignore`: excluyen tiendas y metadata; Docker también excluye configuración local opcional y potenciales credenciales.

## Requisitos cubiertos
- R1/R2/R5/R7: rojo `2bc1258`, verde `10ba366`.
- R5: `scripts/dependency-wiring.test.cjs::R5: Docker snapshot executes against real build inputs and publishes portable runtime metadata` ejecuta el paso Node de ambas imágenes contra fixtures reales y compara contenido y presencia.
- R2/R5: `::R2 R5: Compose guards both daily commands and preserves isolated dependency volumes`.
- R7: `::R7: Git ignores stores and markers, and Docker contexts exclude caches and local package policies`.
- TDD: cuatro pruebas rojas antes de cualquier modificación de configuración; commit rojo exclusivo de test. Después 4/4 verdes.

## Decisiones de diseño
- Se conserva el contexto de build de cada paquete; ningún COPY sale del contexto. El helper compartido vive en mount readonly `/scripts` durante ejecución Compose.
- Las imágenes copian snapshots de entradas presentes y escriben metadata `{format:1, platform, arch, nodeMajor, nodeAbi, pnpm:"10.34.6"}`. El helper verifica el mismo formato.
- Los archivos locales `pnpm-workspace.yaml` y `.npmrc` se excluyen de la imagen, por lo que una configuración montada divergente exige preparación explícita del volumen. No se adopta ni modifica la política local.
- Host mantiene sus scripts dev habituales; los comandos oficiales guardados son `node scripts/dependencies.cjs start backend|frontend`.

## Output de build
```text
docker build -t odc-startup41-backend:verify -f backend/Dockerfile.dev backend
exit 0; pnpm10.34.6, lockfile vigente, 698 paquetes instalados durante build.
docker build -t odc-startup41-frontend:verify -f frontend/Dockerfile.dev frontend
exit 0; pnpm10.34.6, lockfile vigente, 686 paquetes instalados durante build.
docker compose config --services
exit 0; db, backend, frontend.
```

## Output de tests
```text
node --test scripts/dependency-wiring.test.cjs
4 pass / 0 fail.
```

## Integración Docker real aislada
- Recursos exclusivos `odc-startup41-backend:verify`, `odc-startup41-frontend:verify`, `odc-startup41-backend-modules`, `odc-startup41-frontend-modules`, contenedor `odc-startup41-frontend-probe`.
- Nunca se levantó PostgreSQL ni se usaron volúmenes del proyecto de usuario.
- Todos los ensayos runtime usaron `--network none`, imágenes propias, helper `C:/sites/odc/scripts` montado readonly en `/scripts` y volumen del paquete montado en `/app/node_modules`.
- Backend fresh-volume y warm check: exit0. Dos checks consecutivos mantienen el mtime de metadata.json.
- Marca backend ausente: start exit1 antes del servidor con comando de recuperación explícita. Setup manual offline: exit0 en1.5s, `Already up to date`; check posterior exit0.
- Frontend fresh-volume check exit0. El CMD real inició Vite8.1.5 en6061ms. Restart del mismo contenedor listo en2288ms; logs sin install/build/tests. Dos checks posteriores conservan mtime de metadata.json. El contenedor propio fue retirado tras capturar evidencia.
- Bind mount real backend: `C:/sites/odc/backend:/app` más volumen propio `/app/node_modules` y helper readonly reproduce mounts Compose. El YAML local presente provoca rechazo de entradas antes de iniciar. Setup explícito con `npm_config_offline=true` reutiliza698paquetes,0descargas; pnpm reconstruye exclusivamente el volumen de ensayo al adoptar la configuración montada. Terminó en81.5s, reused698/downloaded0. Check posterior con los mismos mounts exit0. El start guard pasó con runner espía y comando exacto `corepack pnpm@10.34.6 exec nest start --watch`, `COREPACK_ENABLE_NETWORK=0` y cero install; no se levantó Nest/DB en este caso de bind local.

## Preservación
SHA256 de configuraciones locales antes y después de cambios de código (conservados, sin agregar a Git):
- Backend: `93A31F33DC5214F699F698B0539468174F1491F54B5B21164BCC4139A90416DD`.
- Frontend: `E676E4A9B95FF4B57D365C99C9D2CECD207D2FBEC06B33C471C1907F2DE3A247`.
- Ambos lockfiles sin diff. Dependencias y políticas package.json intactas.

## Notas para el reviewer
- Build/tests completos e init son coordinados por el líder; no duplicados por este implementer.
- La comprobación sólo garantiza entradas/entorno/metadatos conocidos, no integridad recursiva de todos los paquetes.
- Los tiempos de Vite se registran como evidencia del ensayo aislado, no como garantía para la laptop del usuario.
- Limpieza final: se verificaron por nombre y retiraron sólo los dos volúmenes y dos tags de imagen `odc-startup41-*` creados en esta sesión; el contenedor propio también retirado. Sin `prune`, sin borrar caches ni recursos previos. BuildKit conserva sus capas reutilizables habituales.
- Un comando compuesto terminó exit1 por intentar leer logs del contenedor frontend ya retirado, después de terminar setup backend. Se repitió por separado la comprobación bind real y el start guard, ambos exit0; no fue un fallo de instalación ni de guard.
- Una instalación explícita puede recrear el node_modules del volumen cuando difiere la configuración; esto sólo sucedió en el setup solicitado. Los arranques diarios permanecieron sin instalación.
