---
feature: odc-concurrent-updates
status: approved
tags: [harness, spec]
---

# Requisitos — #36

F03 plan002. Depende de #35 (entrega técnica lista; acceso live externo no
verificado). Control de concurrencia entre operaciones que leen una misma
versión persistida; no cambia la API ni obliga al frontend a mandar un ETag.

- **R1**: WHEN dos mutaciones cargan la misma versión THE SYSTEM SHALL permitir
  una sola escritura y rechazar la otra como conflicto de concurrencia sin
  sobrescribir estado, datos o archivo. Todas las mutaciones deben comparar
  id, versión y estado previo en el único update del repositorio. Cada éxito,
  incluida edición sin cambio de estado, incrementa una versión entera en uno.
- **R2**: WHEN una transición gana THE SYSTEM SHALL persistir orden y su única
  entrada de historial atómicamente. IF falla historial THEN revertir también
  datos y versión. Una perdedora no genera historial ni notificaciones.
- **R3**: WHEN hay conflicto THE SYSTEM SHALL responder **409** desde todas las
  rutas de mutación, conservar 401/403/404 y explicar que se debe recargar.
  No reintentar silenciosamente una acción contra datos distintos.
- **R4**: WHEN se verifican carreras THE SYSTEM SHALL usar PostgreSQL real,
  dos conexiones diferentes y una barrera tras ambas lecturas: aprobar/rechazar
  presupuesto y compra, doble envío/reenvío, editar/enviar y dos ediciones.
  Cubrir además pago, comprobante y factura usando sus casos de uso reales.
  Verificar versión, valores ganadores e historial tras cada carrera.
- **R5**: WHEN una ODC se crea o carga THE SYSTEM SHALL preservar la versión
  en dominio/mapper. Los registros existentes reciben versión inicial 0;
  hay un SQL aditivo transaccional, sin borrado, para NODE_ENV=production
  donde synchronize está deshabilitado. En dev/test el ORM sincroniza columna.
- **R6**: WHEN se entrega la feature THE SYSTEM SHALL pasar init y la suite
  PostgreSQL aislada ejecutable sin tocar datos compartidos, documentar el
  rollout coordinado (ningún backend antiguo debe seguir haciendo save sin
  versión) y guía humana. Prueba humana no atribuida sin evidencia.

## Aprobación

- [x] Aprobado por humano por delegación expresa (2026-10-05), antes de código.

«puedes terminar todas las features pendientes, tienes mi permiso para cada
aprobacion». Cierre técnico delegado tras checks. Desarrollo en este entorno;
prueba manual del usuario en su equipo se conserva como no ejecutada.
Compensación de uploads perdedores corresponde a #38; #36 no promete todavía
limpieza Cloudinary. No incluye despliegue ni aplicación de SQL a producción.
