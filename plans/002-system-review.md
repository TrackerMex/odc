# Revisión integral de ODC — operación, dashboard y fiabilidad

Fecha: 2026-09-13. Base revisada: `b61c761`. Estado: diagnóstico y propuesta; no es implementación ni certificación de producción.

## Conclusión

La base visual y la separación de roles sirven, pero el producto todavía exige demasiado recorrido para encontrar una orden y recuperarse de un error. El dashboard necesita análisis real y una tabla de trabajo, y hay fallos de integridad y entrega de archivos que deben resolverse antes de producción. Una plantilla más completa no resuelve por sí sola estos puntos.

Se revisaron frontend, backend, contratos, persistencia, pruebas, configuración de desarrollo y documentos de arquitectura. Evaluación A de UX y B de detector/navegador ejecutadas por agentes independientes; B se incorporó después de terminar A. Tercer auditor revisó backend; el responsable principal abrió y contrastó las referencias antes de sintetizar.

## Tus solicitudes convertidas en comportamiento

| Solicitud | Propuesta concreta |
|---|---|
| Dashboard con gráficas y estadísticas | Evolución del gasto pagado de 12 meses, distribución de órdenes por estado, cifras del periodo y ranking de proveedores; todo calculado en servidor, nunca con las filas de una página. |
| Filtros de tablas | En dashboard y Mis tareas: estado, búsqueda por folio/proveedor y orden visible; contador y limpiar filtros. Mis tareas añade mes de creación. Aplicar antes de paginar y conservarlos en URL. El filtro del resumen mensual se trata aparte. |
| Paginación | Tabla compacta de 10 registros por página, controles accesibles, total y página actual. Reutilizar el mecanismo existente; no hay scroll infinito técnico. |
| Navegación fija | Header sticky opaco con breadcrumb, menú y tema; ajustar paneles laterales y foco para evitar que tape contenido. |
| Confirmar creación | Resumen antes de guardar/enviar, con proveedor, descripción, cantidad × precio, total y destino. Cancelar no guarda. Tras éxito: folio, estado y siguiente paso. Confirmado por el usuario. |
| Prioridad de Administración | Más recientes primero en consulta y en el caso de uso, antes de limitar resultados. Conservar el bloque independiente de órdenes más antiguas. |
| Mis tareas por mes | Mes de creación actual por defecto; selector de meses anteriores y acceso explícito a pendientes fuera del mes. Confirmado por el usuario. |

Mes de creación y mes de pago responden preguntas distintas. Las gráficas deben rotular esta diferencia: gasto se agrupa por pago; volumen/estado de solicitudes por creación. La tabla no debe dar a entender que un filtro local cambia indicadores globales si no lo hace.

## Evidencia de verificación

- `./init.sh` inicial y final: exit 0; 471 pruebas backend y 618 frontend, builds y lint configurado verdes. Solo se modificó documentación y el registro de la nueva feature.
- `pnpm --dir frontend exec tsc --noEmit`: **18 errores en archivos de pruebas**. El build actual no ejecuta este gate. No se observó un error de compilación de código de aplicación en ese resultado.
- Detector de diseño: `detect.mjs --json frontend/src`, exit 0, `[]`. Cero hallazgos de sus reglas; no certifica UX, hidratación ni accesibilidad. Sin overlay inyectado.
- Navegador: inspección de dashboard OPS, Mis tareas, creación, detalle BORRADOR y resumen mensual. Header medido `position: static`, y de y=11 a y=-43 tras scroll de 54px. Se reprodujo pérdida de texto no guardado al navegar, sin crear registros.
- Consola: discrepancia de hidratación al iniciar con tema oscuro; icono/etiqueta inicial difieren entre servidor y cliente.
- Auditor backend comprobó SDK Cloudinary con configuración ficticia: variar `expires_at` no cambia `cloudinary.url`. Validó que DTO acepta una fecha imposible y un producto monetario que excede `int` de Postgres. No se usaron credenciales reales ni ataques.
- Auditoría de dependencias backend: 21 altas, 3 moderadas y 1 baja declaradas por el registro. Solo dos advisories altos de Multer tienen ruta runtime comprobada aquí; no se equipara el total del registro con fallos explotables del sistema.

## Hallazgos priorizados

### Registro en Harness — 2026-10-01

Revalidado sobre `main` remoto/local `a8a407e34b5ecc012b732f04d8f276f55aeec1b4`.
Los seis hallazgos de la auditoría adicional corresponden a F02–F08 existentes;
no se crean nuevos IDs F. Evidencia y límites en
[progress/explore_odc-hardening.md](../progress/explore_odc-hardening.md).

| Orden solicitado | Feature Harness | Hallazgo de este plan | Prioridad |
|---|---|---|---|
| 1 | #34 `odc-multipart-protection` | F04 | P1 |
| 2 | #35 `odc-temporary-file-delivery` | F02 | P1 |
| 3 | #36 `odc-concurrent-updates` | F03 | P1 |
| 4 | #37 `odc-input-boundaries` | F05 + F06 | P1 (F06 conserva P2 individual) |
| 5 | #38 `odc-orphan-file-recovery` | F07 | P2 |
| 6 | #39 `auth-login-rate-limit` | F08 | P1 antes de exposición |

Criterios de prueba en `feature_list.json`. Se prepara solo la spec #34,
[multipart](../specs/odc-multipart-protection/requirements.md); la implementación
espera aprobación explícita según `AGENTS.md` §3–4. Las siguientes specs se
preparan secuencialmente después de verificación y prueba humana de cada feature.
Registro del backlog y spec en borrador no equivalen a correcciones implementadas.

P1: resolver en la siguiente evolución o antes de producción según el alcance indicado. P2: corrección de operación/calidad. P3: mantenimiento. Esfuerzo S = horas; M = alrededor de un día; L = varios días, incluyendo pruebas, sin compromiso de calendario. Riesgo se refiere al cambio, no a la gravedad del defecto. Confianza alta significa flujo leído o reproducido; media requiere medición adicional.

### Integridad y producción

| ID | Prioridad / hallazgo | Impacto y corrección | Esfuerzo; riesgo; confianza | Evidencia |
|---|---|---|---|---|
| F01 | P1 · Creación duplicada al reintentar envío | Crear puede funcionar y enviar fallar; reintentar llama otra vez POST crear. Reutilizar el ID guardado y actualizar ese borrador si cambia la captura; probar una sola creación. | M; medio; alta | `frontend/src/components/odc/odc-form.tsx:177`, `frontend/src/routes/_authenticated/odcs/new.tsx:49` |
| F02 | P1 · Enlaces privados sin la caducidad prometida | `expires_at` se pasa al generador equivocado. Usar entrega temporal soportada, conservar autorización por rol y comprobar el SDK real. No se comprobó acceso a activos reales. | S; medio; alta | `backend/src/modules/files/infrastructure/services/cloudinary-file-storage.service.ts:43`, `cloudinary-file-storage.service.spec.ts:171` |
| F03 | P1 · Actualizaciones simultáneas sin protección de versión | Se lee/valida antes de la transacción y luego se guarda sin estado o versión esperada. Aprobar y rechazar pueden aceptar la misma versión antigua. Escritura condicional, historial atómico y 409 para la operación perdedora. | M; medio; alta en código, concurrencia real pendiente | `backend/src/modules/odc/application/use-cases/approve-budget.usecase.ts:22`, `backend/src/modules/odc/infrastructure/repositories/purchase-order.typeorm.repository.ts:87` |
| F04 | P1 · Multipart vulnerable y límite aplicado demasiado tarde | Multer 2.2.0 está afectado; recepción en memoria sin `limits` y límite de 10MB posterior al buffer. Actualizar versión directa/transitiva corregida y limitar archivo/campos/partes durante recepción. Rutas requieren sesión y rol. | S/M; bajo; alta | `backend/pnpm-lock.yaml:49`, `backend/src/modules/odc/infrastructure/controller/odc.controller.ts:305`, `:334` |
| F05 | P1 · Cantidades válidas para API que no caben en DB | DTO exige positivo, pero cantidad × precio puede exceder `int` o precisión segura. Definir límite de negocio y validar el producto en dominio compartido por creación/edición; migrar tipo solo si el negocio requiere mayor rango. | S/M; medio; alta | `backend/src/modules/odc/application/dto/create-odc.dto.ts:16`, `backend/src/modules/odc/domain/entities/purchase-order.entity.ts:277`, `backend/src/modules/odc/infrastructure/entities/purchase-order.orm-entity.ts:33` |
| F06 | P2 · Fecha imposible e ID inválido llegan a persistencia | DTO acepta fecha de calendario inexistente; rutas no validan UUID. Rechazar en frontera HTTP con mensajes útiles, sin esperar un error de Postgres. | S; bajo; alta | `backend/src/modules/odc/application/dto/register-payment.dto.ts:11`, `backend/src/modules/odc/application/dto/upload-invoice.dto.ts:13`, `backend/src/modules/odc/infrastructure/controller/odc.controller.ts:475` |
| F07 | P2 · Archivos externos huérfanos tras fallo de guardado | Upload ocurre antes de persistir. Compensar solo cuando el rechazo de DB es inequívoco; registrar conciliación si la eliminación falla. Coordinar con concurrencia para no borrar un archivo asociado. | M; medio; alta | `backend/src/modules/odc/application/use-cases/upload-payment-evidence.usecase.ts:53`, `backend/src/modules/odc/application/use-cases/upload-invoice.usecase.ts:70` |
| F08 | P1 antes de exposición · Intentos de login ilimitados en aplicación | Añadir límites por IP/cuenta y respuesta 429, respetando proxy real. La existencia de una protección externa no fue verificada. | S/M; bajo; alta sobre aplicación | `backend/src/modules/auth/infrastructure/controller/auth.controller.ts:35`, `backend/src/modules/auth/application/use-cases/login.usecase.ts:29`, `backend/src/bootstrap.ts:6` |
| F09 | P1 antes de producción · Despliegue/migraciones no demostrados | Producción desactiva synchronize pero no hay migraciones ni arranque productivo versionado. Diseñar adopción de DB existente, despliegue y rollback probado; no usar configuración dev como producción. | L; alto; alta sobre repo | `backend/src/config/typeorm.config.ts:12`, `backend/Dockerfile.dev:16`, `frontend/Dockerfile.dev:14` |
| F10 | P1 antes de producción · Recuperación y salud incompletas | Volumen persistente no es backup probado. Health devuelve ok sin DB. Definir restauración ensayada, retención, readiness DB, logs con ID de petición y alertas mínimas. Infraestructura externa no inspeccionada. | M/L; medio; alta sobre repo | `docker-compose.yml:10`, `backend/src/health.controller.ts:9` |
| F11 | P1 · El gate verde omite verificaciones importantes | Typecheck frontend falla 18 veces en tests; no está en init. E2E backend espera Hello World y persistencia está simulada. Incorporar typecheck/lint frontend y pruebas Postgres/API aisladas para rollback, límites y carreras; evitar ampliar solo snapshots de clases. | M; bajo; alta | `init.config.sh:14`, `frontend/package.json:11`, `backend/test/app.e2e-spec.ts:25`, `frontend/src/components/login-form.test.tsx:191` |

La caducidad temporal está documentada en [Cloudinary: acceso a medios](https://cloudinary.com/documentation/control_access_to_media#providing_time_limited_access_to_private_media_assets). Los avisos primarios de Multer son [GHSA-wc9g-mqfw-jrwm](https://github.com/expressjs/multer/security/advisories/GHSA-wc9g-mqfw-jrwm) y [GHSA-535w-7cp7-47q4](https://github.com/expressjs/multer/security/advisories/GHSA-535w-7cp7-47q4), corregidos desde 2.3.0. Confirmar la versión disponible y compatibilidad al implementar.

### Operación y experiencia

| ID | Prioridad / hallazgo | Impacto y corrección | Esfuerzo; riesgo; confianza | Evidencia |
|---|---|---|---|---|
| F12 | P1 · Dashboard insuficiente para analizar | API actual solo da comparación de dos meses, top 5 y antigüedad. Extender agregados reales para serie de 12 meses, distribución por estado y KPIs definidos; tabla de tareas filtrada/paginada por separado. No dibujar series inventadas a partir de dos barras. | L; medio; alta, mejora solicitada | `frontend/src/components/odc/executive-dashboard.tsx:209`, `backend/src/modules/odc/domain/repositories/purchase-order.repository.ts:82` |
| F13 | P1 · Mis tareas mezcla meses y carece de búsqueda | Ya pagina 20 en servidor, pero muestra una lista larga y no filtra mes/estado/folio/proveedor. Mes de creación actual y 10 filas con controles visibles, total, URL e histórico. Filtrar antes de contar/paginar. | M; medio; alta | `frontend/src/components/odc/executive-tasks.tsx:66`, `frontend/src/lib/api.ts:158`, `backend/src/modules/odc/application/use-cases/get-executive-tasks.usecase.ts:12` |
| F14 | P1 · Nuevas prioridades ADMIN quedan fuera del top | Repositorio ASC y caso de uso reordena por antigüedad. Cambiar ambos para ADMIN antes del límite, desempate estable; no invertir el bloque de órdenes más antiguas. Es cambio solicitado de la regla anterior. | M; medio; alta | `backend/src/modules/odc/infrastructure/repositories/purchase-order.typeorm.repository.ts:181`, `backend/src/modules/odc/application/use-cases/get-executive-dashboard.usecase.ts:67` |
| F15 | P2 · Header desaparece durante trabajo | Sticky opaco, capa y offsets coherentes para resumen/formulario/historial. Verificar anclas, foco, menú y scroll móvil. | S; bajo; alta, medido | `frontend/src/components/layout/app-layout.tsx:27`, `frontend/src/components/odc/odc-form.tsx:428`, `frontend/src/components/odc/odc-detail.tsx:218` |
| F16 | P1 · Falta revisión previa y cierre con folio | Modal de resumen validado con destino explícito, cancelar sin guardar y feedback con folio/estado. Resolver F01 en el mismo flujo; el modal no aporta idempotencia por sí solo. | M; medio; alta, solicitado | `frontend/src/components/odc/odc-form.tsx:177`, `:191`, `:413` |
| F17 | P2 · Retorno y reintentos pierden contexto | Página solo en memoria; detalle vuelve siempre al dashboard. Tras fallar página 2, reintentar solicita la 1. Filtros/página en URL, retorno seguro a origen y reintento de la petición solicitada. | M; bajo; alta | `frontend/src/components/odc/executive-tasks.tsx:70`, `:114`, `frontend/src/routes/_authenticated/odcs/$id.tsx:61` |
| F18 | P2 · Salir descarta captura sin aviso | Valores solo en memoria. Aviso al salir con cambios reales y opción de guardar borrador; no implementar almacenamiento persistente de información sensible sin definir retención. | M; medio; alta, reproducido sin guardar | `frontend/src/components/odc/odc-form.tsx:107`, `frontend/src/routes/_authenticated/odcs/new.tsx:31` |
| F19 | P1 · Tema oscuro provoca discrepancia de hidratación | SSR inicia light; cliente inicia dark e icono/label difieren. Primer render determinista con preferencia respetada y script antideslumbramiento; test de consola al cargar ambos temas. Esperar más en E2E no arregla la causa. | S; medio; alta, consola real | `frontend/src/lib/theme.tsx:37`, `:52`, `:85` |
| F20 | P2 · Errores sin recuperación fiable | Login con error distinto de 401 relanza sin feedback. Error genérico carece de reintento. El detalle exige catálogo incluso para ADMIN/DG. Mantener captura/contexto, mensaje recuperable y cargar proveedores solo cuando hacen falta. | M; medio; alta | `frontend/src/components/login-form.tsx:77`, `frontend/src/components/odc/odc-page-state.tsx:21`, `frontend/src/routes/_authenticated/odcs/$id.tsx:41` |
| F21 | P2 · Formularios/detalle aún no comparten calidad del dashboard | BORRADOR se rotula Corrección solicitada, lectura y edición se duplican y textos largos ocupan columnas estrechas alineadas a derecha. Copy por estado, descripción amplia y acción principal reconocible. | M; bajo; alta | `frontend/src/routes/_authenticated/odcs/$id.tsx:120`, `frontend/src/components/odc/odc-detail.tsx:40`, `:102` |
| F22 | P2 · Áreas táctiles pequeñas fuera del dashboard | Formularios/tareas conservan inputs de 32px y botones pequeños; la regla móvil de 44px solo cubre header/dashboard. Ampliar objetivo táctil móvil manteniendo densidad desktop y medir superficies reales. | S/M; bajo; alta en CSS, nueva matriz móvil pendiente | `frontend/src/components/ui/input.tsx:12`, `frontend/src/components/ui/button.tsx:27`, `frontend/src/styles.css:233` |
| F23 | P2 · PDF pierde legibilidad y fallo de exportación oculta datos | Todas las filas se rasterizan en una sola A4; error export comparte error de consulta y retry no exporta. Resumen de una página + detalle multipágina, relación de aspecto estable y errores separados. | M; medio; alta | `frontend/src/components/odc/monthly-summary-slide.tsx:60`, `frontend/src/lib/monthly-summary-export.ts:33`, `frontend/src/components/odc/monthly-summary.tsx:116` |
| F24 | P2 · Periodos tienen criterios de zona horaria distintos | Dashboard usa ISO/UTC; resumen usa fecha local de ejecución. SSR y cliente pueden seleccionar meses diferentes en el cambio de mes. Fijar zona de negocio y distinguir timestamp de creación de fecha de pago; documentar tratamiento de datos antiguos. | M; medio; alta en código; volumen afectado sin medir | `frontend/src/routes/_authenticated/index.tsx:12`, `frontend/src/routes/_authenticated/monthly-summary.tsx:6`, `backend/src/modules/odc/infrastructure/entities/purchase-order.orm-entity.ts:103` |
| F25 | P2 · Escalabilidad de consultas sin evidencia de volumen | Tareas/historial ordenan sin índices dedicados declarados; resumen mensual descarga todo y pagina en cliente, además consulta tras loader. Medir planes/volumen, separar agregados de filas y evaluar índices concretos; reutilizar loaders/query actuales. | M; medio; media sobre rendimiento, alta sobre flujo | `backend/src/modules/odc/infrastructure/repositories/purchase-order.typeorm.repository.ts:111`, `:139`, `:235`, `frontend/src/components/odc/monthly-summary.tsx:86`, `:264` |

## Dashboard propuesto

1. Cabecera fija y barra de periodo visible: mes seleccionado, criterio de fecha y acceso a crear según rol.
2. Estadísticas: importe y compras pagadas del mes, solicitudes creadas y tareas accionables de todos los meses. Comparar importe y compras pagadas con el mes anterior completo, indicando ambos periodos; `null` se comunica sin base, no como 0%.
3. Evolución de gasto: 12 puntos mensuales reales, sin objetivos, ingresos ni beneficios inventados. Meses sin pagos en cero; carga/error diferenciados de cero real.
4. Distribución por estado: volumen de órdenes creadas en el mes con estados visibles para el usuario. Barra horizontal es más legible que un donut de ocho segmentos; etiquetas/cifras y alternativa textual accesible.
5. Tabla operativa: filtros, orden y paginación. ADMIN más recientes primero. Búsqueda y estado afectan esta tabla; indicadores mantienen el periodo rotulado. No calcular totales con los 10 resultados visibles.
6. Contexto: proveedores del periodo estadístico y pendientes antiguos de todos los meses. Acceso claro a histórico para evitar esconder trabajo atrasado.

El valor profesional procede de respuestas rápidas y verificables: cuánto se pagó, qué cambió, dónde está cada solicitud, quién debe actuar y si el dato se conservó. Se mantiene identidad TrackerMex, Inter y estados semánticos; se permite reemplazar la composición vigente, sin otra plantilla paralela ni un framework genérico de dashboards.

## Evoluciones de producto, separadas de defectos

- **Archivo de órdenes consultable:** actualmente Mis tareas solo incluye accionables y el resumen solo pagadas. La API general de órdenes ya existe (`frontend/src/lib/api.ts:135`, `backend/src/modules/odc/application/use-cases/list-odcs.usecase.ts:28`). Crear búsqueda de cualquier orden autorizada por folio, proveedor, fecha y estado sin convertir Mis tareas en archivo. M/L; cambia navegación y alcance, requiere spec propia.
- **Historial con responsable humano:** hay `userId` y relación de usuario en `backend/src/modules/odc/infrastructure/entities/odc-status-history.orm-entity.ts:32`, pero `frontend/src/components/odc/odc-detail.tsx:230` no muestra actor. Incorporar nombre/rol y fecha/hora desde backend, sin UUID como etiqueta ni exposición indebida. M.
- **Tiempo por etapa y seguimiento:** usar fechas del historial para distinguir espera de presupuesto, pago, evidencia y factura. Definir compromisos con negocio antes de añadir SLA, semáforos o notificaciones. Datos base existen; no hay evidencia para inventar umbrales. L, descubrimiento antes de implementación.

## Diagnóstico de diseño

Modo Operate; assessment A independiente. 22/40 orientativo, no certificación: estado3, lenguaje3, control2, consistencia3, prevención2, reconocimiento2, eficiencia2, minimalismo3, recuperación1, ayuda1 (cada dimensión sobre4).

Lo que funciona: roles y estados textuales, datos reales, tokens coherentes, validación con foco al campo erróneo. La fricción principal no es el número de opciones del menú, sino reconstruir el contexto entre buscar, editar y volver. El operador frecuente necesita filtros/retorno; el usuario móvil necesita controles accesibles y resumen antes de enviar; teclado/lector necesita anuncios y foco tras paginar. El detector dio cero hallazgos y no contradice estos resultados porque no mide recorridos ni recuperación.

## Secuencia y límites

1. **Workspace ejecutivo v2 — completado 2026-09-13:** dashboard analítico, tablas, periodos, header y creación revisable con recuperación del envío sin recrear la ODC. [Spec #32](../specs/executive-workspace-v2/requirements.md) aprobada e implementada; [acta de verificación](../progress/review_executive-workspace-v2.md) con revisión independiente `ship`, 484+655 pruebas, PostgreSQL y navegador verdes. Incluye estabilidad del tema/gráfica y filtros/página en URL; el retorno al origen desde detalle de F17 queda para el recorrido completo. Las evidencias anteriores de este informe describen la base auditada, no sustituyen el acta posterior.
2. **Integridad y archivos antes de producción:** F02–F08, empezando por caducidad/multipart y concurrencia; casos de integración acompañan la solución. No desplegar con estos puntos abiertos.
3. **Recorrido completo:** retorno al origen de F17, F18, F20–F23, archivo de órdenes e historial de responsables. Lo compartido con v2 se implementa allí, sin duplicarlo después.
4. **Entrega operable:** F09–F11 y F25, con migraciones, recuperación ensayada, observabilidad y mediciones reales. Definir infraestructura antes de aprovisionarla.

Se ejecuta una feature a la vez con spec aprobada, pruebas, revisión y commit; no se abre un programa de 25 cambios simultáneos. Este informe captura oportunidades; no autoriza a ignorar los gates del repositorio.

## Considerados y descartados / límites de la revisión

- Más recientes primero sustituye una regla previa aprobada; no se presenta ASC como bug accidental. Tampoco se elimina la cola de antigüedad.
- No falta paginación en todas partes: tareas ya pagina 20 en backend y resumen 10 en cliente. Falta consistencia, filtro y visibilidad.
- Presupuesto manual, una línea por ODC, seed de usuarios y JWT en cookie sin refresh son decisiones v1, no defectos por sí mismos. No se propone microservicios, IA ornamental, multiempresa ni un motor de permisos nuevo.
- No se comprobó infraestructura productiva externa, configuración real de Cloudinary/CDN, backups externos, carga sostenida, explotación de advisories ni concurrencia en una DB aislada. Se distinguen defectos trazados de comprobaciones pendientes.
- No se hizo una nueva matriz móvil de cada formulario en esta auditoría: sus tamaños salen de CSS y medidas desktop; la fase de implementación deberá medir 375/768/1024/1440 en ambos temas y tres roles. La matriz anterior de #31 sigue siendo evidencia de su alcance, no de todo el sistema.
- Documentación auxiliar: se corrigió el índice `plans/README.md`, que conservaba el estado inicial. `.impeccable/design.json` quedó atrás de DESIGN.md; sincronizar después de decisiones de diseño, sin usarla como autoridad frente a MASTER/overrides aprobados.
- No se le asigna un precio al software por el aspecto de una plantilla. La aceptación técnica se expresa en comportamiento, integridad, accesibilidad y operación verificables.
