# Verificar #37 — límites, fechas y UUID

La cantidad, el precio en centavos y el total deben ser enteros de1 a
2147483647 inclusive. Fechas civiles reales YYYY-MM-DD, años0001–9999,
sin hora/offset. Fecha de factura opcional: omitirla si no tiene valor.

Prueba automática sin DB/Cloudinary reales ni puertos fijos:

```sh
pnpm --dir backend test --runInBand purchase-order.boundaries.spec.ts odc-input-boundaries.http.spec.ts
```

192 casos pasan: dominio directo y Nest HTTP con guards, parser multipart y
casos de uso reales. Crear/PATCH revisa el producto, incluso con campo parcial;
edición inválida no cambia datos. Pago/factura rechaza fechas antes de subidas
y guardados. Los11 endpoints con:id responden400 por UUID malformado;
401/403 tienen prioridad por sesión/rol, un UUID válido ausente mantiene404.

En tu equipo, reinicia backend y usa órdenes exclusivamente de test. Crear o
editar cantidad50000 y precio50000centavos debe devolver400 y mantener la
orden sin cambios. Probar PATCH parcial cuando el otro operando ya es50000.
El máximo con cantidad1/precio2147483647 se admite; su+1 se rechaza.

Para pago y factura, comprobar2024-02-29 aceptado y2026-02-29/2026-04-31
rechazados. Los inputs date del frontend envían ya el formato correcto; para
probar calendarios imposibles o timestamps hay que llamar la API directamente.
Con la sesión del navegador, un GET /api/odcs/not-a-uuid devuelve400 y un UUID
válido inexistente404; sin sesión,401. Usa los puertos habituales de tu equipo.

Evidencia: bash init.sh exit0,836backend/661frontend, ambos builds y lint verdes.
Typecheck adicional conserva70errores antiguos, cero nuevos. Prueba manual del
usuario en su equipo: NOT RUN; cierre técnico con autorización delegada.
