---
feature: "frontend-dark-mode"
status: approved
tags: [frontend, accessibility, theme]
---

# Diseño — [[frontend-dark-mode]]

## Decisiones técnicas

- Usar las variables CSS y la variante `dark` ya presentes en `frontend/src/styles.css`, evitando duplicar estilos por componente (R1, R4).
- Implementar un hook/utilidad de tema en `frontend/src/lib/` que gestione `localStorage`, `matchMedia` y la clase `dark` del documento (R1, R2, R4).
- Añadir el control de tema en el shell compartido usando el componente Button de shadcn/ui y un nombre accesible en español (R3).
- Usar `prefers-color-scheme` como valor inicial únicamente cuando no exista una preferencia guardada por el usuario (R2).

## Archivos afectados

- `frontend/src/lib/theme.ts` — persistencia y aplicación del tema en la capa de UI.
- `frontend/src/components/...` — control visible de tema en el shell compartido.
- `frontend/src/styles.css` — solo si hace falta completar tokens o `color-scheme`.
- Tests frontend junto a la utilidad y el control — cobertura de R1–R4.

## Alternativas descartadas

- Gestionar el tema solo con clases locales de React: no cubre componentes portaled ni evita parpadeo al cargar.
- Introducir una biblioteca externa de theming: el proyecto ya tiene tokens CSS y variante `dark` configurados.
