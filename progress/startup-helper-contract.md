# Contrato del helper de dependencias

Feature #41, aprobado 2026-10-17. CLI: `node scripts/dependencies.cjs check|setup|start <packageDir> [--context docker]`.

- Marca: `<packageDir>/node_modules/.odc-dependencies/metadata.json`, publicada al final por rename atómico. JSON exacto: `{format:1,platform:process.platform,arch:process.arch,nodeMajor:process.versions.node.split('.')[0],nodeAbi:process.versions.modules,pnpm:'10.34.6'}`.
- En la misma carpeta, copias con nombres originales de `package.json`, `pnpm-lock.yaml`, `.npmrc`, `pnpm-workspace.yaml`. Los dos primeros obligatorios; presencia y bytes de los opcionales deben coincidir. El build Docker solo copia los presentes.
- Metadatos conocidos: `node_modules/.modules.yaml` contiene `packageManager: pnpm@10.34.6`; CLI backend `node_modules/@nestjs/cli/bin/nest.js`, frontend `node_modules/vite/bin/vite.js` existen.
- Setup invalida metadata.json ANTES de instalar, ejecuta `corepack pnpm@10.34.6 install --frozen-lockfile --config.confirmModulesPurge=false`, verifica entradas estables y metadata pnpm/CLI, copia snapshots y publica metadata al final. Nunca borra recursivamente.
- Start comprueba primero; invoca `corepack pnpm@10.34.6 exec nest start --watch` (backend) o `corepack pnpm@10.34.6 exec vite dev --port 3000` (frontend), con `--host 0.0.0.0` solo para frontend Docker; `COREPACK_ENABLE_NETWORK=0`. Los scripts dev existentes no precisan cambio.
- Docker recuperación: `docker compose run --rm --no-deps <backend|frontend> node /scripts/dependencies.cjs setup /app --context docker`. Host desde raíz: `node scripts/dependencies.cjs setup backend` (o frontend).
- API exportada para pruebas Node: `check(packageDir, options)`, `setup(packageDir, options)`, `start(packageDir, options)`, constante `PNPM_VERSION`; inyección `options.run(command,args,spawnOptions)` y `options.runtime` para tests sin instalaciones. Operaciones síncronas y código de salida no cero ante errores.
