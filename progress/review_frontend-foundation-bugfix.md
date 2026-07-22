# review: frontend-foundation (bug fix, sin commit)
Fecha: 2026-07-22
Veredicto: APROBADO

> Revisión de un bug fix de dos partes sobre `frontend-foundation` (id 9,
> `in_progress`), no una feature nueva. Sigue vigente
> `specs/frontend-foundation/requirements.md` (R1-R13, `status: approved`).
> Todo el trabajo revisado está sin commitear en el working tree
> (`git status`/`git diff`), tal como pidió el usuario.

## Checklist C2 — Estado coherente
- [x] Solo 1 feature `in_progress` en `feature_list.json` (id 9,
      `frontend-foundation`) — confirmado con `grep -c '"status": "in_progress"'`.
- [x] `progress/current.md` describe la sesión activa (feature, id, causa
      raíz, fix planeado). Observación menor: el bloque solo documenta la
      Sección 1 (URL/cookie) del plan y deja `implementer: pendiente` /
      `reviewer: pendiente`, aunque el trabajo (incluida la Sección 2 de
      fuga de sesión) ya está hecho según `progress/impl_frontend-foundation-bugfix.md`.
      No bloquea la aprobación — el reporte del implementer es la fuente de
      verdad detallada y está completo — pero conviene actualizarlo antes de
      cerrar la sesión.

## Checklist C3 — Arquitectura
- [x] N/A para esta feature: es una SPA frontend (TanStack Start/React), no
      aplica la separación domain/application/infrastructure del backend.
      La separación server/client sí se respetó correctamente (ver hallazgo
      principal más abajo).

## Checklist C4 — TDD
- [x] Los tests nuevos (`api.ssr.test.ts`, `session.ssr.test.ts`) son
      cobertura de regresión de un bug real, explícitamente NO declarados
      como R-ids nuevos (instrucción del leader, respetada) — están
      anotados en `traceability.md` como ampliación de R2 y de
      R5/R6/R10/R13 respectivamente. Los tests existentes ajustados
      (`_authenticated.test.tsx`, `_authenticated.session-reuse.test.tsx`)
      siguen nombrando su R-id original (R6, R13) y solo cambiaron el
      assert de retorno (`{ user }` en vez de `undefined`), consistente con
      el nuevo contrato de `authGuardBeforeLoad`.
- [x] Historial de trabajo (según impl report) muestra investigación →
      repro en Docker → test de regresión → fix → verificación, no todo
      junto sin evidencia.

## Checklist C5 — Trazabilidad
- [x] `specs/frontend-foundation/traceability.md`: las 13 filas R1-R13
      originales están intactas, ninguna en "pendiente".
- [x] Las 2 filas nuevas están en una sección aparte ("Ampliación de
      cobertura (bug fix post-aprobación, sin commit)"), claramente
      marcadas como cobertura de bug fix y no como R-ids inventados.

## Checklist C6 — Spec aprobada
- [x] `requirements.md` con `status: approved` en el frontmatter.
- [x] Casilla "Aprobado por humano" marcada con fecha (2026-07-22).
- [x] Ningún requisito R1-R13 fue modificado; el fix es de implementación,
      no de contrato funcional.

## Hallazgo principal verificado: fuga de sesión SSR (lo más importante de esta revisión)

Leí `frontend/src/lib/session.ts` y `frontend/src/routes/_authenticated.tsx`
línea por línea. Confirmado con mis propios ojos:

- `resolveSession()` bifurca por `isServer()` al inicio de la función. La
  rama servidor es exactamente `return fetchSession()` — una llamada directa
  a `getMe()` envuelta en try/catch para 401, **sin tocar `useSessionStore`
  en ningún punto** (ni `.getState()`, ni `setUser`, ni `clear`). La rama
  cliente (después del `if (isServer())`) es la única que lee/escribe el
  store, y es inalcanzable durante SSR porque `isServer()` corta antes.
- `authGuardBeforeLoad` (`_authenticated.tsx`) llama a `resolveSession()` y
  retorna `{ user }` por el contexto de ruta; `AuthenticatedLayout` lee el
  usuario con `Route.useRouteContext()`, no con el hook reactivo de zustand.
  El único punto donde `_authenticated.tsx` toca `useSessionStore` es dentro
  de un `useEffect`, que por contrato de React nunca se ejecuta durante SSR
  (solo tras el montaje en el navegador).
- Recorrí el resto de componentes que importan `useSessionStore`
  (`nav-user.tsx`, `login-form.tsx`) para descartar otras vías de escritura/
  lectura durante el render server-side: ambos solo extraen funciones
  (`clear`, `setUser`) del store para usarlas en manejadores de eventos
  (`onClick`, `onSubmit`), nunca leen `state.user` para decidir qué
  renderizar. No hay ningún otro `beforeLoad`/`loader` en el árbol de rutas
  que toque el store (revisé `login.tsx`: usa `resolveSession()` igual, ya
  corregido).

Conclusión: ningún camino de ejecución del lado servidor lee ni escribe
`useSessionStore`. El diseño es correcto.

## Verificación independiente de `createIsomorphicFn`

Corrí `pnpm build` (frontend) yo mismo — cliente y SSR ambos verdes.
Inspeccioné el resultado:

```
grep -rl "getRequestHeaders" dist/client/assets/   → sin coincidencias (exit 1)
grep -rl "react-start/server" dist/client/assets/  → sin coincidencias (exit 1)
grep -rl "getRequestHeaders" dist/server/          → dist/server/assets/session-CTWXpjaF.js, dist/server/server.js
```

Confirmado: el import server-only nunca llega al bundle de cliente; solo
existe en `dist/server/`.

## Repro de seguridad repetido en Docker (independiente del reporte del implementer)

`docker restart odc-frontend-1` (proceso Node limpio, confirmado montaje
`./frontend:/app` → el contenedor corre el working tree sin commitear, no
una imagen vieja). Backend/DB ya corriendo sin cambios.

1. Sin cookie, `GET /` → **307**, `Location: /login`.
2. Login real contra `:3001` (`admin@odc.local` / `odc-dev-password`, seed).
   Con esa cookie, `GET /` → **200**; body contiene `"ADMINISTRACION"` /
   `"Administración"` (confirmado con `grep -a` sobre el body crudo — el
   primer intento con `grep` normal lo marcó como binario por el
   transfer-encoding chunked y dio falso negativo; con `-a` se ve el
   contenido real).
3. Sin ninguna cookie de nuevo, mismo proceso, sin reiniciar → **307**,
   `Location: /login`, **body vacío** (repetido 3 veces seguidas, mismo
   resultado estable). Además intercalé cookie→sin cookie→cookie→sin cookie
   en una segunda ronda sin reiniciar el contenedor: 200/307/200/307
   consistente, sin fuga en ningún orden.

No se reprodujo la fuga en ningún intento. El fix es efectivo y estable.

## Suite completa e init.sh (verificación independiente, no solo el reporte)

Corrí `./init.sh` yo mismo desde cero:

- Entorno, `.env`, dependencias: OK.
- Build: backend (`nest build`) y frontend (`vite build` cliente+SSR) verdes.
- Tests: backend `51 test suites / 436 tests` verdes; frontend
  `10 test files / 27 tests` verdes (coincide con el reporte del
  implementer, sin regresión en R1-R13 ni en el resto del backend).
- Lint (`eslint --fix` sobre backend): sin errores, y confirmé con
  `git status` que `--fix` no modificó nada (mismo set de archivos antes y
  después).
- `init.sh` terminó con exit code 0 ("Todo verde. Listo para trabajar.").

## Evaluación del caso borde pedido (punto 6): ¿contexto de ruta obsoleto tras re-render?

Revisé `frontend/src/router.tsx`: solo define `defaultPreloadStaleTime: 0`
(afecta precargas por hover/intent), sin overridear el `staleTime` real de
match/beforeLoad. Con el comportamiento por defecto de TanStack Router
(`staleTime` de match efectivo en 0), `beforeLoad` de `_authenticated` se
re-ejecuta en cada navegación real hacia una ruta bajo ese layout —
incluida la navegación entre dos rutas hijas distintas — así que el
contexto que lee `Route.useRouteContext()` no queda "congelado" desde el
primer render; se refresca en cada navegación real.

El único caso no cubierto (no introducido por este fix, y fuera del alcance
de R11-R13): si algo mutara `useSessionStore` directamente sin pasar por una
navegación completa (p.ej. una futura feature que actualice el perfil del
usuario en vivo vía WebSocket), `AuthenticatedLayout` no lo reflejaría hasta
la próxima navegación, porque ya no se suscribe reactivamente al store para
el render (antes sí, con el hook de zustand). Hoy no existe ninguna
funcionalidad así — R11/R12/R13 no la requieren — así que no es un defecto,
solo una nota de diseño para cuando (si) se agregue.

## Observaciones (no bloqueantes)

- `progress/current.md` quedó desactualizado respecto al alcance real (solo
  documenta la Sección 1 del bug, no la Sección 2 de fuga de sesión, y deja
  `implementer`/`reviewer` en `pendiente`). Actualizar antes de cerrar la
  sesión.
- La verificación manual "body contiene el nombre del usuario" requiere
  `grep -a` (forzar modo texto) por el `Transfer-Encoding: chunked` de la
  respuesta — un `grep` sin `-a` da falso negativo. Dato útil si alguien
  repite este repro después.

## Output relevante de `./init.sh` (resumen)

```
✅ node disponible / pnpm disponible
✅ .env encontrado, DATABASE_URL y JWT_SECRET definidas
✅ Dependencias instaladas
✅ Archivos del harness presentes
⚠️  Feature en progreso: frontend-foundation
✅ Build exitoso (backend nest build + frontend vite build client/ssr)
Backend:  Test Suites: 51 passed, 51 total | Tests: 436 passed, 436 total
Frontend: Test Files  10 passed (10) | Tests  27 passed (27)
✅ Tests pasados
✅ Lint sin errores
✅ Todo verde. Listo para trabajar.
  Features: 9/14 completadas | 4 pendientes
```
