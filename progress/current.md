# Sesión activa

> Este archivo describe el estado de la sesión en curso.
> Al cerrar la sesión, mueve este contenido a progress/history.md y deja solo esta plantilla.

---

## Plantilla (sesión sin iniciar)

```
feature: —
inicio: —
agentes lanzados: —
estado: sin sesión activa
```


---

_Cuando inicies una sesión, reemplaza la plantilla con:_

```
feature: <nombre de la feature>
id: <id en feature_list.json>
inicio: <fecha y hora>
plan:
  - <paso 1>
  - <paso 2>
estado: pending / spec_ready / in_progress / done
bloqueos: —
spec_author: pendiente / en curso / done
implementer: pendiente / en curso / done
reviewer: pendiente / en curso / aprobado / rechazado
```

---

## Sesión activa

```
feature: frontend-foundation (reabierta — bug fix post-review)
id: 9
inicio: 2026-07-22
plan:
  - Bug encontrado al levantar la app real (docker) en el navegador: SSR
    revienta con "Failed to parse URL from /api/auth/me" en / y /login.
  - Causa: apiFetch() usa ruta relativa; Node fetch (SSR, dentro de
    beforeLoad de TanStack Start) exige URL absoluta. Además hay que
    reenviar la cookie odc_session de la request entrante al backend en
    SSR (Node fetch no manda cookies del navegador automáticamente).
  - Afecta R5/R6/R10 (resolución de sesión) en toda ruta que pase por
    _authenticated/login. No cubierto por tests existentes (mockean
    fetch/getMe, no ejercitan SSR real) — no reabrir requisitos, es un
    bug de implementación, no de spec.
  - Fix aplicado (sección 1): apiFetch construye URL absoluta en servidor
    (API_BASE_URL) y reenvía el header Cookie vía createIsomorphicFn.
    Verificado en Docker: /login y / pasaron de 500 a 200/307.
  - Segundo hallazgo (escalado por el implementer, no arreglado en la
    sección 1): useSessionStore (zustand) es un singleton de módulo
    compartido entre TODAS las requests SSR del mismo proceso Node — un
    visitante con sesión poblaba el store y el siguiente visitante sin
    cookie recibía su fullName/role server-renderizado, sin redirect a
    /login. Fuga de sesión entre usuarios.
  - Fix aplicado (sección 2): resolveSession() bifurca por isServer() —
    en servidor siempre resuelve fresco contra getMe(), nunca toca el
    store; el usuario viaja por el contexto de ruta de TanStack Router
    (Route.useRouteContext()) en vez del store. El store solo se hidrata
    client-side (useEffect) para logout/R12 y reuso de sesión R13.
  - Ambas secciones sin commit (pedido explícito del usuario) — pendiente
    que el humano revise el diff y commitee.
estado: in_progress (esperando que el humano revise y commitee el fix)
bloqueos: —
spec_author: n/a (bug fix, no requiere spec nueva)
implementer: done (2 rondas, sin commit)
reviewer: aprobado (progress/review_frontend-foundation-bugfix.md), sin commit
```

