# Sesion activa — PAUSADA 2026-08-10

```
feature: ui-dark-mode-chroma
id: 24
inicio: 2026-08-10
plan: corregir el techo de chroma de dark (D-V1) y resolver el verde
      desalineado en dark (D-V2). Origen: revision en navegador del
      resultado de la #23, en progress/ui-redesign-plan.md
estado: spec_ready — BLOQUEADA en el gate humano
bloqueos: dos preguntas abiertas al humano (abajo)
spec_author: hecho -> specs/ui-dark-mode-chroma/requirements.md (11 requisitos)
implementer: —
reviewer: —
```

## Para retomar: dos preguntas esperando respuesta humana

1. **Techo de chroma autorreferencial.** La spec define el limite como
   `s = C/L <= s(:root --primary)` = 0.2126, derivado del navy en tiempo de
   test. Funciona y no rompe ningun token existente (verificado), pero
   `--primary` en light da exactamente 0.2126 porque *es* la referencia: por
   construccion nunca puede violar su propio techo, y si alguien sube su
   chroma, el techo sube solo para todos los demas. Alternativa propuesta:
   congelar `0.2126` como constante documentada y sujetar el navy a ella como
   a cualquier otro token.
2. **R10 pide una fila de enmienda en `specs/ui-design-tokens/requirements.md`**,
   que es una spec ya firmada. El spec_author no la toco, hizo bien.
   Autorizarla es parte de aprobar esta spec.

Hasta que ambas se respondan y la casilla de
`specs/ui-dark-mode-chroma/requirements.md` este marcada por un humano, **no se
lanza el implementer**.

## Verificado por el leader antes de pausar

- Gate limpio: `status: draft`, linea 186 `- [ ] Aprobado por humano`, cero
  casillas marcadas en los 4 archivos de la spec.
- Matematicas de la spec correctas: `s` del navy = 0.21259; cruce con el techo
  plano viejo en L = 0.4704; candidato B (`oklch(0.6800 0.1400 254.62)`) da
  s = 0.2059, dentro del techo.
- Hallazgo R5 real: exactamente 6 tokens declarados fuera del gamut sRGB
  (`--status-pending-surface`, `--status-approved-surface`,
  `--status-paid-surface`, y en dark `--status-approved`, `--status-paid`,
  `--status-rejected`). El navegador los remapea, asi que el test de contraste
  de la #23 audita colores que no se pintan. Sin contraste roto: el reviewer
  de la #23 ya habia hecho gamut mapping y lo hallo conservador.
- Ningun token no exento excede el techo nuevo.

## Estado del entorno

- Rama `ui-design-system-docs`, 12 commits, **sin push**.
- Dev server detenido al pausar. Para retomar la verificacion visual:
  `cd frontend && pnpm vite dev --port 3005` (backend en contenedor, puerto 3001).
- Feature 23 `done` y revisada en navegador. Fases 3a-3e pendientes como
  features 25-27, sin anadir a `feature_list.json`.
- Sin verificar todavia: responsive a 375px (el resize del navegador no tuvo
  efecto). Sigue pendiente en el checklist de `MASTER.md` §10.
