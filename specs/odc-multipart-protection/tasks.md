---
feature: "odc-multipart-protection"
status: implemented
tags: [harness, spec]
---

# Tareas - [[odc-multipart-protection]]

No iniciar antes de aprobación de [[requirements]].

## R1

- [x] (1) Escribir test que falla para R1 y guardar evidencia/commit test primero.
- [x] (2) Implementación mínima que lo pasa en commit separado.
- [x] (3) Refactor con tests verdes y actualizar [[traceability]].

## R2

- [x] (1) Escribir test que falla para R2 y guardar evidencia/commit test primero.
- [x] (2) Implementación mínima que lo pasa en commit separado.
- [x] (3) Refactor con tests verdes y actualizar [[traceability]].

## R3

- [x] (1) Escribir test que falla para R3 y guardar evidencia/commit test primero.
- [x] (2) Implementación mínima que lo pasa en commit separado.
- [x] (3) Refactor con tests verdes y actualizar [[traceability]].

## R4

- [x] (1) Escribir test que falla para R4 y guardar evidencia/commit test primero.
- [x] (2) Implementación mínima que lo pasa en commit separado.
- [x] (3) Refactor con tests verdes y actualizar [[traceability]].

## R5

- [x] (1) Escribir test que falla para R5 y guardar evidencia/commit test primero.
- [x] (2) Implementación mínima que lo pasa en commit separado.
- [x] (3) Refactor con tests verdes y actualizar [[traceability]].

## R6

- [x] (1) Escribir test que falla para R6 y guardar evidencia/commit test primero.
- [x] (2) Implementación mínima que lo pasa en commit separado.
- [x] (3) Refactor con tests verdes y actualizar [[traceability]].

## R7

- [x] (1) Escribir test que falla para R7 y guardar evidencia/commit test primero.
- [x] (2) Implementación mínima que lo pasa en commit separado.
- [x] (3) Refactor con tests verdes y actualizar [[traceability]].

## Cierre

- [x] Revisar lockfile y pnpm why multer directo/transitivo.
- [ ] ./init.sh verde; review contra CHECKPOINTS C1–C6.
- [ ] Prueba humana local y evidencia antes de done.


R6 conserva guards existentes: las pruebas HTTP se escribieron antes de
implementación y ya pasaban; no se fabricó un rojo en código correcto.
R7 es la suite y el gate de verificación, no un nuevo comportamiento de negocio.
Detalles test-primero y evidencias en [[traceability]].
La prueba humana final no se marca hasta recibir su resultado del usuario.
