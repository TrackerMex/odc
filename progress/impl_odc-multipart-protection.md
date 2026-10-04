# Implementación #34 — odc-multipart-protection

Fecha: 2026-10-04 UTC. Rama: `audit/odc-hardening-20261001`.
Estado: implementación verificada, `in_progress` hasta prueba humana local.
Spec aprobada por humano en `3e07ccc` (2026-10-03); arranque `3575a5b`.

## Resultado

- Ambas rutas comparten límites durante recepción, validación de firma/MIME,
  metadatos planos/permitidos y traducción 400/413. Casos de uso, dominio y
  frontend conservados; ningún cambio a las features #35–#39.
- 10 MiB exactos aceptados; +1 byte y stream +4 MiB reciben 413 sin construir
  un Buffer completo excesivo. Writable/pipeline nativos, sin archivos temporales.
- PDF/JPEG/PNG verificados por firma y MIME coincidente; vacíos, ausentes,
  truncados, MIME falsos y otros formatos rechazados antes del caso de uso.
- Campos/partes/archivos acotados, 8192 bytes UTF-8 inclusive, nombres máximo
  100, arrays/nesting deshabilitados. Campos desconocidos y duplicados rechazados.
- Multer 2.4.0 directo y vía Nest 11.1.28; `pnpm why multer` prueba una sola
  versión. Override específico de esa dependencia y lockfile generado por pnpm.
- 401/403 ocurren antes de procesar multipart, con guards y JWT reales.
  Todos los rechazos prueban cero llamadas a caso de uso, upload, consulta,
  guardado y ningún cambio a orden/referencias/historial de test.

## Test-primero y commits

- `341c48c`: 2 pruebas R5 rojas por Multer 2.2.0; verde `e90e455`.
- `5e226d9`: suite HTTP inicial 34 rojos / 38 verdes. Reprodujo vacío/MIME
  falso aceptados, exceso solo rechazado después de buffer y campos desconocidos
  aceptados. R6 ya estaba verde; se conservó como contrato de los guards existentes.
- `903f0b4`: fixtures JPEG/PNG reales en los tests anteriores, sin cambiar aserciones.
- `f0ad2db`: implementación R1–R6 verde. Firmas con Buffer nativo, límites y campos
  compartidos. No dependencia adicional ni fallback al MIME declarado.
- `9bbdc7a`: ampliación de ambos órdenes de campos, opcionales y stream truncado;
  sin cambios de aplicación posteriores a `f0ad2db`.
- R7 está cubierto por la suite HTTP y el gate; no se fabricó un comportamiento
  adicional para generar un rojo. Trazabilidad R1–R7 completa en la spec.

## Verificación

| Comprobación | Resultado |
|---|---|
| Init inicial (`bash init.sh`) | exit 0, 489 backend / 661 frontend, builds y lint |
| HTTP real + dependencias #34 | 84 + 2 pruebas verdes |
| Focalizadas con controller anterior | 170/170 verdes |
| Init final (`bash init.sh`) | exit 0, 575 backend / 661 frontend, ambos builds y lint backend |
| ESLint de archivos modificados | verde |
| `git diff --check` | verde |
| Multer directo/transitivo | única versión 2.4.0 |
| Typecheck backend completo, incluidos tests | 70 errores históricos, mismos 70 que baseline `3e07ccc`; ningún error nuevo |

El checkout Linux no tiene bit ejecutable en init.sh; se ejecutó el mismo script
con Bash. Esto no requirió cambiar los scripts ni saltar checks.

## Revisión técnica C1–C6

Auto-revisión del agente implementer; no se presenta como revisión independiente.

- C1: harness presente y init verde.
- C2: una sola feature en progreso (#34); al cerrar, current se archiva en history.
- C3: cambios exclusivamente de infraestructura HTTP y dependencia Multer;
  dominio/aplicación sin imports ni cambios nuevos.
- C4: pruebas con R-ids y commits test antes de código. Caracterización existente
  R6 y requisito de verificación R7 documentados sin rojos artificiales.
- C5: R1–R7 trazables; no filas de requisito sin test/commit.
- C6: aprobación humana anterior al código y frontmatter approved; requisitos
  no alterados. Enmiendas de diseños anteriores enlazan la spec #34 aprobada.
- Gate final: prueba humana de negocio en el equipo del usuario, todavía por recibir.
  Por eso #34 no se marca done ni se inicia #35.

## Entorno y prueba humana

Tests con Nest/Multer/guards/JWT/controlador/casos de uso/dominio reales,
servidor en `127.0.0.1:0` y cierre por suite. DB y Cloudinary simulados;
ningún servicio persistente ni datos compartidos modificados.
No se arrancó el stack completo ni se ocuparon sus puertos habituales.

No ejecutado aquí: uploads/descargas Cloudinary reales, navegador de negocio
ni prueba humana. Corresponden al usuario, según su instrucción.
Guía: [[verify_odc-multipart-protection]]. Instalar/reconstruir y reiniciar
backend es necesario para que Nest use Multer actualizado en su equipo.
