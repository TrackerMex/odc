# impl: dev-startup-dependency-reuse — tooling
Fecha: 2026-10-17

## Archivos creados
- `scripts/dependencies.cjs`: helper Node sin dependencias adicionales; CLI check/setup/start, pnpm exacto, diagnóstico host/Docker.
- `scripts/dependencies.test.cjs`: pruebas Node nativas con instalaciones simuladas, snapshots temporales y configuración Bash ejecutada con runners falsos.
- `progress/startup-helper-contract.md`: contrato acordado con el implementer Docker para snapshots y comandos.

## Archivos modificados
- `init.config.sh`: guard de solo lectura en lugar de install; Corepack pnpm10.34.6 para builds, suites completas y lint; Jest runInBand y Vitest threads2; añade pruebas Node del tooling.
- `init.sh`: mensajes precisos de comprobación de preparación, conserva el flujo completo de validación.
- Spec tasks/traceability: evidencia de R1-R4 y R6; integración final registrada por el líder.

## Requisitos cubiertos
- R1: `scripts/dependencies.test.cjs::R1: preparation pins Corepack pnpm even when global pnpm differs`, y rechazo del packageManager distinto. Rojo `385601a`, verde `e015495`.
- R2: `scripts/dependencies.test.cjs::R2: repeated warm checks and starts are readonly, bounded and never install`, arranque frontend Docker con Vite. Rojo `385601a`, verde `e015495`.
- R3: pruebas con prefijo R3 para contenido/presencia de cuatro inputs, runtime incompatible, metadata/CLI faltantes, gestor instalado incorrecto, módulos YAML/JSON. Rojo `385601a` y `fbd69ee`, verde `e015495`.
- R4: pruebas con prefijo R4 de setup frozen una vez, publicación tras éxito, invalidación ante exit/throw/inputs mutados, preservación de dependencias y archivos ajenos. Rojo `385601a`, verde `e015495`.
- R6: `scripts/dependencies.test.cjs::R6: executable init configuration only guards dependencies and preserves full verification` y fail-fast previo a checks costosos. Rojo `0657a35`, verde `6ec5694`.

## Decisiones de diseño
- Comparar buffers de cuatro archivos conocidos y campos del runtime. Ningún readdir/recorrido de node_modules o cachés. Test caliente prohíbe readdir y compara bytes y mtimes de snapshots.
- `metadata.json` es la evidencia de validez: se retira antes del setup y se publica al final por rename atómico. Solo se manipulan nombres explícitos dentro de la carpeta de metadatos; no se borran volúmenes/tiendas/dependencias.
- Setup ejecuta Corepack exacto congelado, sin regenerar lockfiles por conveniencia; conserva políticas opcionales locales. Check acepta metadata pnpm tanto YAML como JSON (formato real observado en Windows).
- Start ejecuta únicamente Nest/Vite mediante Corepack exacto con COREPACK_ENABLE_NETWORK=0. Las compilaciones propias de esos servidores continúan.
- Windows Corepack se distribuye como cmd y el runner utiliza shell con argumentos constantes; Node24 puede mostrar DEP0190. Ningún valor del usuario se interpola en los argumentos: packageDir se pasa como cwd. El comportamiento fue ejercitado en el setup real del líder.

## Output de build
La baseline previa a los cambios terminó verde. El líder registró en progress/current.md el init final completo con la configuración final: exit0, builds backend/frontend, 34 tests tooling + 885 backend + 691 frontend (1,610 total) y lint. No se ejecutó un init paralelo desde este agente.

## Output de tests
```text
node --test scripts/*.test.cjs
Tests 34
Pass 34
Fail 0
```
30 pruebas helper (R1-R4/R6) y 4 wiring del agente Docker (R1/R2/R5/R7). Red R1-R4: 0/27 antes del helper; red adicional metadataJSON: 0/1; redR6:0/2 con config previa.

## Notas para el reviewer
- Repetir guard caliente sin writes/installs y confirmar pnpm exacto en comandos reales.
- El líder ya verificó setup real host backend/frontend: Already up to date, check correcto y mtimes conservados. Hashes de lockfiles y YAML del usuario se conservaron.
- Docker implementer ejecuta integración aislada de imágenes/volúmenes. El líder integra evidencias R5/R7 y R6(3) quedó marcado tras init final verde; reviewer independiente confirma el cierre.
- No se modificaron ni agregaron los pnpm-workspace.yaml locales del usuario, ni lockfiles ni paquetes de negocio.

## Verificación final coordinada
El líder ejecutó ./init.sh con la nueva configuración, sin wrappers ni instalaciones: exit0; ambos builds, 34 pruebas tooling, 885 backend, 691 frontend y lint aprobados. La revisión independiente repitió init y terminó exit0 con los mismos 1,610 tests, ambos builds y lint verdes.
