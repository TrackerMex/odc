---
feature: "odc-multipart-protection"
status: draft
tags: [harness, spec]
---

# Diseño - [[odc-multipart-protection]]

Ver [[requirements]]. Capa afectada: infraestructura HTTP; mantener casos de
uso y dominio sin dependencias Multer/Nest adicionales.

## Decisiones técnicas propuestas

- Límites explícitos de Multer por ruta con memoryStorage acotado (R1,R2,R4).
  No se cambia a archivos temporales. El parser limita el stream antes de
  construir el buffer completo; el pipe mantiene una segunda comprobación.
- fileSize=10485760, files=1, fields=1/4, fieldSize=8192,
  fieldNameSize=100; sin arrays, con fieldArrayIndexLimit mínimo soportado (R5).
  Verificar valores y tipos en Multer corregido; si 0 no está soportado,
  documentar el mínimo real y pedir enmienda antes de cambiar el contrato.
- Máximo lógico de partes: 2/5. Busboy puede emitir partsLimit al alcanzar el
  contador, no solo al excederlo. La implementación debe probar con parser
  real que acepta exactamente archivo+todos los campos válidos. Si requiere
  sentinela de parser 3/6 para aceptar 2/5, usarlo junto con files/fields y
  validación de nombres/duplicados; nunca confiar solo en parts. Dejar esta
  justificación y pruebas en trazabilidad (R4).
- Rechazar estructura de nombres antes de llegar al caso de uso; actualización
  del parser es esencial porque whitelist posterior no previene DoS al parsear.
- Detectar firma con mecanismo compatible con Nest/Node actuales, usando el
  buffer ya acotado. No utilizar skipMagicNumbersValidation ni fallback a
  MIME declarado. Una dependencia ESM debe cargarse de forma compatible con
  el backend; fallo de detección rechaza el archivo (R3).
- Tamaño excesivo conserva el 413 que puede producir el interceptor Nest;
  otros límites se traducen a 400. Capturar las respuestas reales en HTTP (R2,R4).
- Resolver Multer corregido también dentro de platform-express: actualizar
  dependencia y, si es necesario, override pnpm acotado y documentado. No
  actualizar todo el stack sin necesidad. Confirmar versión disponible y
  compatibilidad, sin editar el lockfile manualmente (R5).

## Archivos afectados al implementar

- `backend/package.json`, `backend/pnpm-lock.yaml`: corrección directa/transitiva.
- `backend/src/modules/odc/infrastructure/controller/odc.controller.ts`:
  interceptores, límites, pipes y respuestas.
- Helpers de validación multipart en infraestructura solo si eliminan
  duplicación necesaria; evitar un nuevo módulo genérico.
- Tests unitarios junto al controller y prueba HTTP con Nest/Multer real,
  siguiendo rootDir src o configuración aislada explícita.
- Specs anteriores de evidencia/factura: registrar la enmienda cuando sus
  pruebas de MIME confiado sean reemplazadas; no alterar aprobación histórica.

## Verificación segura

Tests HTTP con providers de casos de uso/almacenamiento mockeados, sin importar
un AppModule que conecte una base compartida. Probar procesamiento real de parser,
interceptor, guards y pipes; fixture de sesión/rol sin credenciales reales.
No ejecutar payloads de DoS en proceso compartido; regresiones de advisories,
si se añaden, deben usar subprocess aislado con timeout y memoria acotada.
La prueba de negocio humana usa solo datos de test y requiere entorno seguro.

## Alternativas descartadas

- Límite solo en ParseFilePipe: ocurre después del buffer, no satisface R2.
- MIME/extensión declarados como validación: no satisfacen R3.
- Actualizar únicamente Multer directo: Nest puede conservar la copia vulnerable.
- Compensación Cloudinary aquí: pertenece a #38, no a validación de recepción.

## Fuentes primarias

- [GHSA-wc9g-mqfw-jrwm](https://github.com/expressjs/multer/security/advisories/GHSA-wc9g-mqfw-jrwm).
- [GHSA-535w-7cp7-47q4](https://github.com/expressjs/multer/security/advisories/GHSA-535w-7cp7-47q4):
  versión corregida y configuración fieldArrayIndexLimit.
