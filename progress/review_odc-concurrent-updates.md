# Revisión técnica #36 — 2026-10-05

Auto-revisión, cierre delegado; no revisión independiente ni prueba humana
inventada. C1–C6: spec aacb4bc anterior al código; tests primero08441ef, CAS
f6a1f9c, ampliación roja528281d y solución nativa f07ee5c. Trazabilidad completa,
último init exit0:644backend/661frontend, ambos builds y lint backend verdes.
Log /tmp/odc36-init-final.log. Pruebas PostgreSQL16/16 exit0 tras ajustes de
fixtures; ningún contenedor propio permanece al finalizar su script.

Las 13 carreras con dos conexiones diferentes y barrera ejercitan las ocho
mutaciones reales: aprobar/rechazar presupuesto y compra, envío/reenvío,
edición/envío, dos ediciones, pago, comprobante y factura. Ganador único,
versión+1, payload preservado y una transición (ninguna si gana edición).
Fallos FK de historial revierten actualización y versión. Relectura de nueva
versión permite otra edición; reutilizar la anterior falla. SQL aditivo probado
sobre filas existentes y repetido; no se aplicó a bases compartidas.

32 HTTP checks409/401/403/404, contratos de repositorio y mapper (49 dirigidos).
La revisión detectó DATE crudo en RETURNING, cubierto por nueva prueba roja;
manager.update + lectura ORM en la transacción mantiene YYYY-MM-DD. El token
version se omite del DTO y no exige cambiar contratos frontend.

Typecheck adicional no es verde global: conserva exactamente70errores anteriores
a esta rama (comparación normalizada con3e07ccc), cero añadidos. Se corrigieron
solo fixtures/any de esta entrega y una anotación del test #34. Deuda F11 no se
mezcla con la feature. Ver guía verify_odc-concurrent-updates.md para pruebas y
rollout sin mezclar backends viejos/nuevos.

Prueba manual del usuario:NOT RUN. Cloudinary de #35:NOT RUN; el usuario
confirmó continuar y configurar las credenciales al terminar. Upload perdedor
puede dejar activo sin asociar hasta #38; se documenta sin afirmar limpieza.
