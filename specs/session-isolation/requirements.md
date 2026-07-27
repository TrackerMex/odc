---
feature: "session-isolation"
status: approved
tags: [harness, spec, auth, frontend]
---

# Requisitos — [[session-isolation]]

> Esta feature garantiza que los tres roles activos puedan trabajar a la vez
> desde sesiones independientes, conservando su usuario y dashboard correctos.
> Complementa `auth-users` y las rutas protegidas existentes; no cambia el
> modelo de roles ni introduce refresh tokens.

## Requisitos funcionales

- **R1**: WHEN los usuarios `DIRECTOR_OPS`, `ADMINISTRACION` y
  `DIRECTOR_GENERAL` inician sesión con credenciales válidas THE SYSTEM SHALL
  crear una sesión independiente para cada usuario, responder `{ user }` con
  su identidad y rol correctos, y mantener la cookie de sesión de cada cliente
  sin sobrescribir la sesión de otro cliente.
  *Verificación*: test de integración/unitario con tres clientes o tres
  conjuntos de cookies que comprueba tres logins y tres respuestas `/me`.

- **R2**: WHILE existen varias sesiones válidas THE SYSTEM SHALL resolver cada
  petición autenticada usando únicamente la cookie JWT recibida en esa
  petición, de modo que `/api/auth/me` nunca devuelva el usuario de otra
  sesión aunque los usuarios hayan iniciado sesión en distinto orden.
  *Verificación*: test del guard/controller con cookies A, B y C alternadas;
  cada respuesta debe conservar `id`, `email` y `role` de su cookie.

- **R3**: WHEN una sesión válida carga la ruta autenticada THE SYSTEM SHALL
  seleccionar exclusivamente el dashboard correspondiente a su rol:
  `DIRECTOR_OPS` → dashboard de operaciones,
  `ADMINISTRACION` → dashboard de administración y
  `DIRECTOR_GENERAL` → dashboard de dirección general.
  *Verificación*: test de loader con los tres usuarios que comprueba el tipo
  de dashboard y las consultas de ODC permitidas para cada rol.

- **R4**: WHILE el frontend procesa solicitudes SSR simultáneas o consecutivas
  THE SYSTEM SHALL reenviar la cookie de entrada de cada solicitud al backend
  y SHALL NOT usar un estado global compartido para resolver la sesión, evitando
  que el HTML de un visitante muestre el usuario o dashboard de otro.
  *Verificación*: test SSR con una solicitud autenticada, otra con una cookie
  distinta y otra sin cookie; ninguna respuesta puede contaminar a las demás.

- **R5**: WHEN una sesión pierde su cookie, expira o recibe logout THE SYSTEM
  SHALL redirigir únicamente a ese cliente a `/login` y limpiar únicamente su
  estado local; las otras sesiones válidas SHALL continuar resolviendo `/me` y
  cargando su dashboard.
  *Verificación*: test con tres stores/clientes que invalida uno y comprueba
  que los otros dos siguen autenticados y que el logout no afecta sus cookies.

- **R6**: IF una petición no autenticada, con JWT inválido o con un usuario
  inexistente llega a un endpoint protegido THEN THE SYSTEM SHALL responder
  `401` sin reutilizar datos de otra sesión ni permitir la carga de un
  dashboard, mientras las sesiones válidas permanecen operativas.
  *Verificación*: tests de guard y route guard con cookie ausente, inválida y
  usuario eliminado, junto con una sesión válida intercalada.

- **R7**: WHEN una navegación cliente entra a una página protegida después de
  login o recarga THE SYSTEM SHALL leer la identidad desde el contexto de la
  ruta padre `/_authenticated`, de modo que `user` nunca sea `undefined` en el
  dashboard, alta o detalle de ODC para ninguno de los tres roles.
  *Verificación*: tests de las rutas hijas que fijan el uso del contexto padre
  y prueba parametrizada de dashboard para los tres roles.

- **R8**: WHEN el login termina correctamente THE SYSTEM SHALL guardar primero
  el usuario devuelto y esperar la navegación a `/` desde un documento de login
  limpio. La transición SHALL NOT volver a consultar `/me` en el cliente ni
  renderizar datos del rol previo.
  *Verificación*: test del formulario que comprueba `setUser` y navegación
  esperada con `replace: true`.

- **R9**: WHEN cualquier llamada protegida del cliente recibe `401` THE SYSTEM
  SHALL limpiar su store local y solicitar una única redirección global a
  `/login`; un `401` de credenciales inválidas en `/api/auth/login` SHALL
  permanecer en el formulario y no disparar esa expiración global. Tanto
  expiración como logout SHALL reemplazar el documento hacia `/login` para
  descartar todos los matches y loaders de la identidad anterior.
  *Verificación*: tests del cliente API, listener raíz y logout.

- **R10**: WHILE una ruta protegida está resolviendo la sesión o sus datos THE
  SYSTEM SHALL mostrar un estado de carga accesible; IF falla por una causa no
  autenticación THEN SHALL mostrar un error sin botón manual `Reintentar`.
  *Verificación*: test de los estados pending/error que comprueba `aria-busy`,
  alerta y ausencia del botón.

## Fuera de alcance

- Refresh tokens, revocación server-side, listado administrativo de sesiones o
  cierre remoto de otras sesiones.
- Compartir una misma cuenta entre pestañas con usuarios diferentes dentro del
  mismo perfil de navegador; cada identidad necesita su propio contexto de
  cookies/cliente.
- Cambiar permisos de los tres roles o rediseñar visualmente sus dashboards.

## Aprobación

- [X] Aprobado por humano (fecha: ____) ← gate obligatorio antes de implementar
