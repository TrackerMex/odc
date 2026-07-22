---
feature: "frontend-odc-form"
status: approved        # draft | approved
tags: [frontend, odc, spec]
---

# Diseño — [[frontend-odc-form]]

> Ver [[requirements]] para los requisitos y [[../../docs/architecture|architecture]]
> para las reglas generales del proyecto.

## Decisiones técnicas

- **Cliente API tipado en `frontend/src/lib/api.ts`**: añadir funciones para
  listar proveedores, listar ODCs, obtener detalle, crear, editar y enviar. Se
  reutiliza `apiFetch`, incluyendo cookies, URL SSR y `ApiError` ya entregados
  por `frontend-foundation` (R1–R10).
- **Rutas file-based**: reemplazar el placeholder de
  `src/routes/_authenticated/index.tsx` por el dashboard y añadir rutas para
  crear y ver/editar una ODC (`/odcs/new` y `/odcs/$id`). Así los enlaces del
  dashboard son navegables y el detalle puede recargarse directamente (R1,
  R5, R7–R9).
- **Formulario controlado con schema local**: mantener una única forma de
  validación para crear y editar. La UI representa `unitPrice` en MXN con dos
  decimales y convierte a `unitPriceCents` justo antes de crear o actualizar;
  el total visual se calcula desde los valores actuales y nunca se manda al
  backend (R2–R6, R8–R9).
- **Catálogo de proveedores**: el selector consume `GET /api/suppliers`,
  conserva el nombre como valor del campo y muestra carga/error separado del
  resto del formulario (R3, R10).
- **Datos de dashboard por cuatro consultas filtradas**: usar el contrato
  paginado existente y `total` para los contadores, sin inferir contadores a
  partir de una página parcial. Cada tarjeta maneja su lista vacía y enlaza al
  detalle (R1).
- **Reutilización de shadcn/ui**: usar los componentes existentes y añadir vía
  MCP/CLI solo los componentes necesarios que no estén instalados, en especial
  `Select`, `Textarea`, `Badge` y componentes de feedback. No se crearán
  primitivos visuales duplicados; cualquier componente custom deberá justificarse
  aquí antes de implementarlo (R1–R12).
- **SSR seguro**: las cargas de rutas usarán el contexto por-request de
  TanStack Router para el usuario, sin leer sesión global desde el servidor.
  Las acciones de navegador usarán el cliente API existente (R1–R12).
- **Formato**: presentar importes con `Intl.NumberFormat('es-MX', { style:
  'currency', currency: 'MXN' })` y fechas con formato local estable; los
  estados de negocio se mantienen como valores en español recibidos del
  backend (R4, R7, R12).

## Archivos afectados

- `frontend/src/lib/api.ts` — tipos y funciones HTTP de ODC/proveedores.
- `frontend/src/lib/odc.ts` — tipos de respuesta, validación, conversión de
  pesos a centavos y formateadores, si la separación mejora la testeabilidad.
- `frontend/src/routes/_authenticated/index.tsx` — dashboard de
  `DIRECTOR_OPS`.
- `frontend/src/routes/_authenticated/odcs/new.tsx` — creación de ODC.
- `frontend/src/routes/_authenticated/odcs/$id.tsx` — detalle, edición y
  reenvío de ODC rechazada.
- `frontend/src/components/odc/` — formulario, tarjetas/listas, badge de
  estado e historial reutilizables.
- `frontend/src/components/ui/` — solo componentes shadcn que falten.
- Tests Vitest junto a cada módulo/componente, nombrados con R1–R12.

## Alternativas descartadas

- **Guardar el precio en centavos en el input**: se descarta porque el usuario
  opera en MXN; el contrato de centavos se respeta en la frontera API.
- **Calcular los cuatro contadores desde una única lista sin filtro**: se
  descarta porque la API pagina y además aplica visibilidad por usuario.
- **Crear una nueva store global para el formulario**: se descarta; el alcance
  no requiere persistencia y un formulario local evita estado obsoleto entre
  ODCs.
- **Duplicar el formulario de creación y el de rechazo**: se descarta; ambos
  comparten campos T1 y deben mantener idéntica conversión/validación.
