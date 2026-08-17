---
feature: "ui-copy-es-and-title"
status: draft        # draft | approved
tags: [harness, spec]
---

# Trazabilidad — [[ui-copy-es-and-title]]

| Requisito | Test (archivo::nombre) | Commit (hash + mensaje) |
|---|---|---|
| R1 | `frontend/src/components/login-form.test.tsx::R1: login field labels are in Spanish and keep their association` | `b559bb9` test(ui-copy-es-and-title): assert Spanish login labels keep input association (R1) + `6f06006` feat(ui-copy-es-and-title): label login fields in Spanish (R1) |
| R2 | `frontend/src/components/login-form.test.tsx::R2: login validation messages are in Spanish` | `c7c4e68` test(ui-copy-es-and-title): assert Spanish login validation messages (R2) + `c1aeb9f` feat(ui-copy-es-and-title): give loginSchema Spanish validation messages (R2) |
| R3 | `frontend/src/routes/__root.test.tsx::R3: the document title is declared once in the root route` | `cd37b1f` test(ui-copy-es-and-title): assert the global document title in the root route (R3) + `46041fe` feat(ui-copy-es-and-title): set the global document title to ODC (R3) (+ `ea79ab7` test-only lint fix) |

Regla: el reviewer no aprueba si alguna fila queda "pendiente".
Convención de commit: `feat(ui-copy-es-and-title): <desc> (R1,R2)`.
El implementer actualiza esta tabla tras cada commit; el reviewer la valida
al aprobar (ver [[../../docs/specs|specs]] y [[../../CHECKPOINTS|CHECKPOINTS]] C5).
