---
feature: "executive-workspace-v2"
status: implemented
tags: [harness, spec, tdd]
---

# Tareas — [[executive-workspace-v2]]

> No implementar antes de la aprobación humana de [[requirements]]. Cada bloque produce test rojo antes de código, implementación mínima y trazabilidad de commits. No ejecutar features de la auditoría en paralelo a esta.

## Preparación tras aprobación

- [x] Verificar `init.sh`, leer progreso, registrar feature 32 en curso y enmiendas de diseño aprobadas.
- [x] Inspeccionar tipo/zona reales de `createdAt` y registrar convención observada; resolver cualquier ambigüedad antes de convertir límites de creación. No migrar datos.
- [x] Revisar consumidores de contratos, `OdcForm`, layout y queries; elegir reutilización de primitivas locales.

## R1 — Navegación fija

- [x] (1) Test rojo: scroll de formulario/detalle y dashboard conserva header; foco y aside no quedan debajo.
- [x] (2) Aplicar sticky, fondo, capa y offsets coherentes para 58/64px.
- [x] (3) Refactor mínimo; verificar menú/modal sobre header, escritorio y móvil.

## R2 — Mes de creación

- [x] (1) Test rojo: mes actual México difiere de UTC, inicio inclusivo/fin exclusivo, cambio de año, histórico y `all` explícito.
- [x] (2) Añadir validación y filtro de creación al servidor, selector/URL y valor inicial coherente con SSR.
- [x] (3) Refactor mínimo; probar consultas reales y conservar significado de tareas accionables.

## R3 — Filtros completos

- [x] (1) Test rojo: búsqueda por folio/proveedor, mayúsculas, espacios, `%`/`_`, límite 120, estado por rol, búsqueda fuera de primera página y limpiar.
- [x] (2) Ampliar DTO/tipos/consulta parametrizada y toolbar de ambas tablas.
- [x] (3) Refactor mínimo; comprobar total filtrado y que ninguna rama amplíe visibilidad.

## R4 — Páginas y URL

- [x] (1) Test rojo: 25+ registros, páginas de 10/10/resto, desempate estable, extremos, página vacía, cambio de filtros y back/forward/recarga.
- [x] (2) Paginar en servidor, mantener parámetros en URL y mostrar totales/controles correctos.
- [x] (3) Refactor mínimo; demostrar sin duplicados/omisiones con datos fijos y sin paginar estadísticas.

## R5 — Prioridades recientes de Administración

- [x] (1) Test rojo: nueva tarea ADMIN queda primera aunque haya más de 10 antiguas; mapper conserva orden; defaults OPS/DG y orden elegible.
- [x] (2) Ordenar antes de LIMIT/OFFSET con id de desempate y quitar reordenamiento de prioridad en application.
- [x] (3) Refactor mínimo; verificar seguimiento antiguo ASC independiente.

## R6 — Periodo estadístico

- [x] (1) Test rojo: selector actual/histórico y URL actualizan solo estadísticas; tabla anuncia todos los meses; q/status/page no alteran gráficas.
- [x] (2) Ampliar consulta dashboard y separar alcance visible de controles de estadísticas y tabla.
- [x] (3) Refactor mínimo; verificar recarga y navegación de periodo sin ocultar pendientes antiguos.

## R7 — Tendencia mensual real

- [x] (1) Test rojo: 12 meses ordenados, año anterior, meses ausentes/ceros, definición de pago y cifras mayores que las filas visibles.
- [x] (2) Agregar por `paymentDate` en servidor y representar serie accesible con escala desde cero y equivalente textual.
- [x] (3) Refactor mínimo; comprobar MXN/centavos, sin doce consultas ni cifras inventadas.

## R8 — Distribución por estado

- [x] (1) Test rojo: ocho estados, cohorte de creación, borrador ajeno excluido, total 0 y porcentajes finitos si se muestran.
- [x] (2) Agregar cohorte visible en servidor y renderizar cantidades/estado actual con alternativa textual.
- [x] (3) Refactor mínimo; verificar total consistente con los estados y etiqueta inequívoca de creación.

## R9 — Indicadores completos

- [x] (1) Test rojo: los cuatro KPI conservan definiciones/periodos, búsqueda no altera pendientes globales y comparación null difiere de 0.
- [x] (2) Conectar agregados completos y labels de periodo/criterio, con comparaciones neutrales de gasto.
- [x] (3) Refactor mínimo; no calcular métricas completas desde una página.

## R10 — Contexto y acceso a antiguos

- [x] (1) Test rojo: columnas/acciones por rol, ranking de 5, antiguos 5, vacíos independientes y enlace `/tasks?month=all` aun sin tareas del mes.
- [x] (2) Adaptar tabla/contexto a la composición y conservar enlaces de flujo real.
- [x] (3) Refactor mínimo; verificar datos largos, acceso autorizado y orden del seguimiento.

## R11 — Resumen antes de crear

- [x] (1) Test rojo: payload válido abre revisión sin mutación; cancelar/Escape conserva; inválido enfoca; destino y datos revisados coinciden con confirmación.
- [x] (2) Reutilizar Dialog y snapshot validado para save/send de nuevas ODC.
- [x] (3) Refactor mínimo; comprobar teclado, foco y edición existente sin regresión.

## R12 — Folio y recuperación sin recreación

- [x] (1) Test rojo: doble confirmación crea una vez; éxito enseña folio/estado; creación exitosa+envío fallido+reintento usa mismo id y un solo POST; error de resultado incierto no anuncia éxito.
- [x] (2) Conservar identidad, bloquear operaciones pendientes y presentar resultado real/recuperación de envío.
- [x] (3) Refactor mínimo; revisar todos los consumidores del formulario y no prometer idempotencia de servidor inexistente.

## R13 — Carga, errores y respuestas tardías

- [x] (1) Test rojo: falla página 2 tras página 1; reintentar pide página 2 con todos sus filtros; petición lenta antigua no sobrescribe selección nueva; no aparecen cifras previas bajo periodo nuevo.
- [x] (2) Usar estado de consulta solicitado y claves/dependencias completas, con error/carga accesibles.
- [x] (3) Refactor mínimo; verificar sesión expirada y permisos actuales.

## R14 — Accesibilidad y cierre

- [x] (1) Comprobación roja de criterios visuales/interacción: 375/768/1024/1440px, dos temas, tres roles, teclado, scroll y contenido largo; reproducir recarga con dark persistido y error de hidratación Sun/Moon y label en `lib/theme.tsx`.
- [x] (2) Ajustar foco, contraste, 44px, movimiento reducido, dialog y tablas; corregir el primer render del tema sin destello claro ni sobrescribir preferencia; registrar evidencia sin introducir controles sin función.
- [x] (3) Ejecutar `init.sh`, pruebas PostgreSQL y Playwright relevantes, incluidas recargas dark persistido sin errores de hidratación y regresión de tema claro/sistema; reviewer independiente valida requisitos, historia TDD y trazabilidad. Actualizar STATUS, progreso e historia, commits convencionales y repositorio limpio al cierre.
