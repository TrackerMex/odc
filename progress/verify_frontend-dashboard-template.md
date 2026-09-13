# Verificación visual: frontend-dashboard-template

Fecha: 2026-09-13. Aplicación real en Docker Compose, Chromium, datos locales existentes.

## Matriz R1, R2, R7

`pnpm --dir frontend exec playwright test dashboard-template.spec.ts --workers=1 --reporter=line`: 3 tests verdes, uno por OPS/Administración/Dirección General; cada uno recorre cuatro anchos y los dos temas (24 combinaciones).

| Ancho | Temas | Resultado |
|---|---|---|
| 375 | claro y oscuro | Encabezado 58px, menú por Enter y cierre, enlaces permitidos, controles y enlaces del dashboard ≥44×44px, sin overflow de página. Tabla con scroll propio. |
| 768 | claro y oscuro | Encabezado 64px, sidebar escritorio, panel y contexto apilados, sin overflow de página. |
| 1024 | claro y oscuro | Encabezado 64px, panel dividido, contexto debajo de prioridad, sin overflow de página. |
| 1440 | claro y oscuro | Encabezado 64px, panel unido, prioridad amplia y contexto lateral; sin overflow de página. |

- Inspección de capturas: nombres largos legibles, salto de línea sin superposición, importes alineados y foco visible. Estado sin comparación usa una raya y explicación secundaria para evitar romper palabras en móvil.
- Datos reales: septiembre sin pagos; barras en cero y proveedores vacíos son el resultado del contrato, no se inventaron valores para la captura. Los casos positivos y escalas dispares están cubiertos por R3/R5 unitarios.
- Tokens originales preservados. `styles.tokens.test.ts` comprueba contraste ≥4.5:1 de texto principal/secundario y estados; los enlaces conservan el primario auditado en ambos temas.
- Movimiento reducido: transición de sidebar desktop, panel móvil y overlay = 0s. La tabla es una región nombrada y enfocable con teclado, sin ocultar columnas.
- Comprobación manual adicional de tabla a 375px: foco en región y ArrowRight desplazó scrollLeft a 40px (ancho visible 326px, contenido 680px).
- Revisión detectó estado largo fuera de celda (43px). Tras a36ba90 la matriz comprueba que cada badge queda dentro de su columna y todo su texto cabe en altura. Repetición completa: 3/3 verde, 24 combinaciones; captura ADMIN768 inspeccionada con estado en dos líneas.
- Capturas de la matriz bajo `frontend/test-results/dashboard-template-*/{rol}-{ancho}-{tema}.png` (artefactos locales ignorados por Git y regenerables al correr la matriz).
- Capturas de entrega copiadas a `C:/Users/alex/.codex/visualizations/2026/09/13/01a09963-d969-7083-a380-3590108d7551/` con prefijo `odc-dashboard-live-`.

## Regresión de otras rutas

`responsive-375.spec.ts`: 2/2 verdes. `/login`, `/`, `/tasks`, `/odcs/new`, detalle y `/monthly-summary` midieron scrollWidth = clientWidth = 375. El test existente crea su propia orden de prueba para revisar detalle.

## Entorno

- El servidor de desarrollo muestra el control de TanStack Devtools; el build elimina ese control. No pertenece al diseño de producción.
- Vite en Docker conservó módulos tras cambios del host; reiniciar únicamente frontend refrescó CSS/JS antes de la matriz final. Sin cambios de infraestructura.
- Un primer intento en arranque frío adelantó la interacción a la hidratación. El test ahora espera el estado móvil cerrado, con hasta 30s para el arranque del servidor de desarrollo.
