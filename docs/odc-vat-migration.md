# Migración de partidas históricas e IVA

La aplicación con IVA requiere las columnas fiscales de `041-odc-vat.sql` y
una partida persistida por cada ODC. No iniciar el backend nuevo contra una
base existente antes de preparar el esquema: el entorno de desarrollo usa
sincronización automática de TypeORM. Detener las escrituras y el backend
durante el cambio de esquema y el despliegue de la versión correspondiente.

Antes de ejecutar cualquier script, confirmar el entorno y la base de datos de
destino, preparar y verificar un respaldo recuperable, y comprobar que no haya
otras versiones de la aplicación escribiendo. Ambos scripts usan transacciones
y bloquean las tablas de órdenes y partidas durante su ejecución.

Para revisar las precondiciones sin modificar datos:

```sql
SELECT COUNT(*) AS ordenes,
       COUNT(*) FILTER (WHERE n = 0) AS sin_partidas,
       COUNT(*) FILTER (WHERE n > 0 AND suma <> total) AS montos_inconsistentes
FROM (
  SELECT po.id, po."totalCents"::numeric AS total,
         COUNT(i."orderId") AS n,
         COALESCE(SUM(i.quantity::bigint * i."unitPriceCents"::bigint), 0) AS suma
  FROM purchase_orders po
  LEFT JOIN purchase_order_items i ON i."orderId" = po.id
  GROUP BY po.id, po."totalCents"
) comprobacion;
```

Si la tabla de partidas no existe, primero se requiere la migración `040` y
su validación. Si ya existe pero hay órdenes sin partidas, el script opcional
`040a-reconcile-missing-items.sql` comprueba cabeceras y partidas existentes;
si son coherentes agrega únicamente la partida histórica que falta. Aborta con
el identificador de la ODC ante una inconsistencia. No reemplaza partidas,
cabeceras ni historial y puede repetirse sin duplicados.

Tras verificar que ya no faltan partidas ni hay montos inconsistentes, aplicar
`041-odc-vat.sql`. Este script vuelve a comprobar las partidas y establece
subtotal igual al total previo y tasa e IVA en cero; no altera estados, versión,
fechas ni historial. Luego verificar el esquema, los conteos y los importes
antes de iniciar la aplicación nueva. Los scripts son transacciones separadas:
si el primero termina y el segundo falla, el backfill de partidas permanece;
revisar el error y el respaldo antes de reintentar.

Ambos scripts y la secuencia se probaron en PostgreSQL aislado, incluidos los
casos de rollback. La comprobación de lectura del 3 de noviembre de 2026 en la
base local encontró 10 órdenes, 8 sin partidas y ninguna cabecera faltante
inconsistente. Es una instantánea, por lo que debe repetirse antes de actuar.
Tras respaldar la base local, restaurar el respaldo y ensayar los scripts en
una copia aislada, ambos se aplicaron a la base local: se reconciliaron 8
partidas y se conservaron las 10 órdenes históricas y sus 56 eventos. No se
aplicaron a ninguna base compartida.
