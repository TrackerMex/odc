---
feature: "executive-workspace-v2"
status: draft
tags: [harness, spec, dashboard, tasks]
---

# Diseño — [[executive-workspace-v2]]

> Propuesta pendiente de aprobación de [[requirements]]. Base inspeccionada: `b61c761`. Arquitectura: [[../../docs/architecture|architecture]].

## Evidencia y causa de los cambios

| Comportamiento actual | Punto responsable | Cambio acotado |
|---|---|---|
| Header sale de pantalla; asides usan `top-6` | `components/layout/app-layout.tsx`, `odc-form.tsx`, `odc-detail.tsx` | Header sticky y offset coherente de resúmenes/foco |
| Mis tareas consulta todos los meses y pagina 20 | `routes/_authenticated/tasks.tsx`, `executive-tasks.tsx`, `get-executive-tasks.usecase.ts` | Mes, filtros/orden en URL y 10 filas de servidor |
| Reintento recupera página anterior | `ExecutiveTasks.loadPage`, botón usa `taskPage.page` | Estado de consulta solicitado como fuente única |
| Nuevas prioridades ADMIN quedan al final | Repositorio usa ASC antes de take: 5; `mapOrders` vuelve a ordenar ASC | Orden por rol antes de paginar; mapper no reordena prioridad |
| Dashboard recibe solamente dos meses | `getExecutiveDashboard` y `monthlyExecutiveMetrics` | Ampliar agregación a 12 meses y cohorte por creación |
| Formulario guarda al primer clic; reintento vuelve a crear | `OdcForm.runAction` siempre invoca `persist`, ruta nueva pasa `createOdc` | Resumen previo y recuperación por identidad persistida |
| Recarga oscura provoca divergencia de hidratación | `lib/theme.tsx`: SSR inicializa light; cliente lee dark y cambia Sun/Moon y label | Primer render hidratable consistente, manteniendo tema antes de pintar |

## Composición y lectura

Mantener el shell Modern aprobado y su procedencia. Área ejecutiva con título/contexto y selector «Periodo estadístico»; cuatro KPI compactos; tendencia mensual dominante y distribución por estado; tabla operativa con toolbar y paginación; proveedores y pendientes antiguos como contexto. En escritorio la tendencia tendrá más espacio que la distribución y la tabla más espacio que el contexto. En móvil se apilan en ese orden, con tabla desplazable localmente. No forzar toda la información dentro de un único viewport ni sustituir análisis con tarjetas ornamentales.

Mis tareas pasa de lista larga a tabla semántica con «Mes de creación», búsqueda explícita, filtro de estado y orden. Mantener la misma estructura de columnas/acciones del dashboard; extraer un componente compartido solo si ambas vistas realmente comparten el markup final, sin configurar un motor genérico de tablas. Crear ODC conserva el formulario existente y añade la revisión al flujo de nueva creación.

El header usa `position: sticky`, `top: 0`, superficie opaca y z-index inferior a Dialog/Sheet/Select. Revisar el contenedor real de scroll y los ancestros antes de elegir clases; no introducir otro scroll de página. Reutilizar una altura CSS del shell para `scroll-margin-top` y offsets de asides donde resulte necesario; el espacio bajo header incluye una separación visual, no solo su altura. Verificar foco en campos inválidos y enlaces al desplazar.

La auditoría comprobó un fallo de hidratación del tema: `getInitialTheme` devuelve light en servidor y lee dark persistido en cliente, por lo que `ThemeToggle` cambia icono Sun/Moon y label durante la hidratación. Corregir esa causa en `lib/theme.tsx` con un primer render SSR/cliente consistente y sincronización posterior del estado del control, conservando el script previo al pintado que aplica la clase y `colorScheme`. No resolverlo ocultando la advertencia ni aplicando light transitoriamente: la preferencia oscura debe permanecer desde el primer pintado y no sobrescribirse antes de leerla. Verificar recargas reales con tema persistido y capturar errores de consola/hidratación, además del aspecto final.

## Contratos y consultas

Ampliar `/api/odcs/executive-dashboard` y `/api/odcs/executive-dashboard/tasks`; conservar NestJS controller → caso de uso → interface del repositorio → TypeORM. No crear un servicio analítico ni duplicar los flujos existentes. Definir los tipos de filtro/página en domain, validación HTTP en application DTO y construir consultas parametrizadas en infrastructure.

| Consulta | Parámetros propuestos | Respuesta ampliada |
|---|---|---|
| Dashboard | `month`, `q?`, `status?`, `order?`, `page?` | Serie mensual de 12 meses, cohorte por estado, KPI completos, proveedores, antigüedad y prioridad paginada |
| Mis tareas | `month=YYYY-MM\|all`, `q?`, `status?`, `order?`, `page?` | `items`, `total`, `page`, `pageSize=10` y periodo efectivo |

Parámetros numéricos: entero positivo, tamaño fijo de 10. Orden permitido: `newest`/`oldest`; nunca interpolar texto de usuario como SQL. Estado: enum existente intersectado con cola del rol; un estado válido sin tareas permitidas produce cero resultados y nunca amplía permisos. Búsqueda: trim, máximo 120, coincidencia literal parcial de folio/proveedor sin distinguir mayúsculas; escapar `%` y `_` para no tratarlos como comodines introducidos por el usuario. Consultas inválidas HTTP producen 400; URL de interfaz se valida con allowlist y comunica/corrige a valores válidos, sin transformarla silenciosamente a «Todos los meses».

Los filtros se aplican antes de contar y paginar, respetando cada rama de visibilidad del rol. Se conservan `buildExecutiveTaskWhere` y la política BORRADOR visible solo a su creador; no hacer filtrado de seguridad en React. Orden estable `createdAt, id`, ambos ASC o DESC. ADMIN predeterminado DESC; otros roles predeterminado ASC. El mapper de prioridad añade antigüedad/acción sin ordenar; el seguimiento antiguo mantiene ASC y límite de 5.

Para KPI de tareas globales mantener un contador separado de `priority.total` filtrado, aunque compartan datos cuando no hay filtros. El número de ODC creadas equivale a la suma de la cohorte visible, no a tareas. Reutilizar la agregación pagada para serie/current/previous; no hacer doce peticiones ni doce consultas una por mes. El ranking usa la definición pagada existente y máximo de 5. Estadísticas nunca se construyen a partir de items paginados.

## Fechas y precisión

El mes vigente se obtiene con `Intl.DateTimeFormat` y `timeZone: 'America/Mexico_City'`, compatible con SSR/cliente; evitar `toISOString().slice(0,7)` para la selección predeterminada. Validar mes de calendario. `paymentDate` es tipo SQL `date`: agrupar directamente por fecha de pago, sin conversión horaria.

`createdAt` usa `@CreateDateColumn()` sin tipo/zona explícitos. Antes de implementar filtros por creación, verificar tipo SQL real, zona de sesión de PostgreSQL, configuración del driver y cómo se escriben/leen los timestamps existentes. No atribuir UTC a timestamps históricos por suposición. Tras documentar la convención observada, convertir los límites locales `[inicioMes, inicioMesSiguiente)` a esa representación mediante parámetros y funciones de zona explícitas; usar comparación de rango sobre la columna para filtrar. Las pruebas reales deberán incluir ambos lados del límite y lecturas coherentes con la API. Si la convención histórica no puede determinarse, registrar esa cuestión y pedir la decisión necesaria antes de convertir datos; esta feature no autoriza una migración de timestamps.

Importes: centavos enteros del backend; presentación MXN con formateadores actuales. Comparaciones contra cero producen `null`, distinto de 0. Escala visual común y finita, meses ausentes cero, sin falsa mejora cuando aumenta gasto.

## Estado de consulta y navegación

TanStack Router search validado es la fuente de periodo/filtros/página, incluido loaderDeps y recarga. Reutilizar TanStack Query si el flujo existente necesita consultas independientes; la clave debe incluir todos los parámetros y el aislamiento de sesión existente. No duplicar `initialPage` con estado local que quede desactualizado al navegar. Capturar la combinación solicitada al reintentar; la respuesta de una petición previa no puede ganar a la actual. Un estado vacío por filtros ofrece limpiarlos; un error conserva los filtros y el reintento, no presenta éxito previo bajo etiquetas nuevas.

Dashboard: `month` gobierna exclusivamente estadísticas. Los otros parámetros gobiernan su tabla de pendientes globales. `/tasks` usa su `month` para fecha de creación y admite `all`; CTA de antiguos siempre lo escribe explícitamente. Back/forward debe reconstruir vista y consulta; mutaciones completadas invalidan o recargan las consultas afectadas según el patrón actual. No incorporar polling/realtime para prometer que una fila aparecerá sin recarga.

## Gráficas y componentes

Reutilizar Base UI/shadcn ya presente (`Table`, `Select`, `Input`, `Button`, `Dialog`, estados/alertas) y los tokens navy/estado/Inter aprobados. Buscar el componente mediante MCP shadcn si está disponible antes de instalar o escribir una nueva primitiva; si no está disponible, las primitivas locales cubren estos controles. El aviso MIT y la procedencia de la feature 31 se conservan.

No hay biblioteca de gráficas instalada. Para esta primera serie fija de 12 meses, usar SVG/CSS semántico con ejes/meses y valores accesibles, acompañado de tabla textual consultable; distribución por estado con barras y leyenda de cantidades. Los tooltips, si existen, son complementarios y deben funcionar con teclado; no son el único acceso a los valores. Esta representación específica evita traer una biblioteca por una serie. Una dependencia solo se reconsidera si las interacciones aprobadas demuestran que la opción nativa no cubre accesibilidad/mantenimiento y queda justificada expresamente; no es el plan base.

## Creación, confirmación y recuperación

Mantener `odcFormSchema`, `validatedPayload`, cálculos y proveedores vigentes. Nueva creación: validar → almacenar snapshot del payload y destino → Dialog de revisión → confirmar una sola vez → crear → opcionalmente enviar → éxito visible con folio/estado y acceso al detalle. El total del resumen es estimado; el resultado final usa la respuesta persistida. No añadir conceptos múltiples: la descripción actual representa un concepto.

Guardar y enviar siguen siendo dos operaciones backend. Tras recibir una creación válida conservar id/folio antes de enviar. Si el envío falla, mostrar estado parcial y botón «Reintentar envío» dirigido a ese id, con alternativa de abrir borrador existente para editar. Evitar volver a ejecutar `persist=createOdc` para esa recuperación. No dejar un formulario editable que pueda recrear una orden ya persistida al siguiente intento. Proteger confirmación por estado pendiente y guard síncrono si los eventos pueden entrar antes del render; un doble clic no genera dos POST.

Si la respuesta de creación se pierde no hay identidad segura: informar resultado no confirmado y no reintentar automáticamente; el usuario puede consultar sus tareas. La idempotencia de creación del servidor es un hallazgo independiente, no se sustituye con una afirmación falsa en el modal. La edición existente permanece funcional; revisar todos los consumidores de `OdcForm` antes de cambiar su contrato.

## Archivos previstos por capa

- Domain: `backend/src/modules/odc/domain/repositories/purchase-order.repository.ts`, tipos de filtros/agregados/página existentes.
- Application: `get-executive-dashboard.usecase.ts`, `get-executive-tasks.usecase.ts` y DTOs de consultas existentes.
- Infrastructure: controller ODC y `purchase-order.typeorm.repository.ts`; pruebas de repositorio y de integración de filtros/periodos con PostgreSQL. No migración por defecto.
- Frontend: `lib/api.ts`, `lib/odc.ts`, `lib/theme.tsx`, rutas autenticadas dashboard/tasks/new, componentes `executive-dashboard`, `executive-tasks`, `odc-form`, layout y offsets de `odc-detail`, CSS local mínimo y tests adyacentes.
- Verificación: tests actuales Vitest/Jest/Playwright, overrides `design-system/odc/pages/dashboard.md` y páginas afectadas, evidencia y trazabilidad.

## Verificación y límites

Tests rojos antes del código, commits separados y R-id. Fixtures incluyen 25+ tareas, dos creadores OPS, los tres roles, estados visibles/no accionables, mismo createdAt con ids distintos, cambio de año/mes y límite UTC/México, importes 0, serie vacía, búsqueda con caracteres especiales y página fuera de rango. Confirmar SQL real para rango, visibilidad, orden, COUNT y LIMIT; los mocks solos no prueban esas condiciones. Modal: cancelar no muta, datos inválidos, doble confirmación, creación exitosa+envío fallido+reintento del mismo id, error de creación, edición sin regresión. Navegador: ambos temas, cuatro anchos, contenido largo, teclado, scroll, ambos filtros/URLs y coherencia de gráficas; validación visual con datos de prueba declarados en entorno de prueba, nunca insertados silenciosamente en datos del usuario.

La auditoría completa puede producir otras features; no mezclar su implementación en esta entrega. El valor comercial no es un criterio verificable: se evalúa por flujos completos, exactitud, accesibilidad y evidencia de funcionamiento.

El gate visual de R14 incluye recarga de rutas autenticadas con dark persistido: sin errores de hidratación en consola, sin destello light ni cambio indebido de preferencia, y con conmutador correcto y funcional después de hidratar. Verificar también recarga clara y preferencia de sistema para evitar regresiones del flujo existente.
