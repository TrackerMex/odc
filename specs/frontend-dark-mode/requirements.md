---
feature: "frontend-dark-mode"
status: approved
tags: [frontend, accessibility, theme]
---

# Requisitos — [[frontend-dark-mode]]

## Requisitos funcionales

- **R1**: WHEN the user activates the theme control THE SYSTEM SHALL apply the dark visual theme to the complete application shell and persist the selection for future visits.
- **R2**: WHEN the application starts THE SYSTEM SHALL restore the persisted theme selection, or use the user's system color preference when no selection exists.
- **R3**: WHILE the dark visual theme is active THE SYSTEM SHALL expose an accessible theme control that identifies the current theme and provides an accessible name in Spanish.
- **R4**: WHEN the user switches between themes THE SYSTEM SHALL update the document color scheme and application colors without requiring a page reload.

## Fuera de alcance

- Añadir temas de color personalizados distintos de claro, oscuro y preferencia del sistema.
- Cambiar la identidad visual o rediseñar componentes que ya usan los tokens de tema existentes.

## Aprobación

- [X] Aprobado por humano (fecha: ____) ← gate obligatorio antes de implementar
