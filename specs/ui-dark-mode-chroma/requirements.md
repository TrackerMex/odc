---
feature: "ui-dark-mode-chroma"
status: approved     # draft | approved
tags: [harness, spec, frontend, design-system, tokens, dark-mode]
---

# Requisitos — [[ui-dark-mode-chroma]]

> Notación EARS. Cada requisito tiene id único R<n>, inmutable una vez aprobado.
> Ver [[design]] para las decisiones técnicas y [[../../docs/architecture|architecture]]
> para las reglas de arquitectura que la implementación debe respetar.

Origen: defectos **D-V1** y **D-V2** de `progress/ui-redesign-plan.md`
§"Revisión en navegador (2026-08-10)", encontrados mirando la app tras cerrar la
feature 23. Fuente normativa del contenido visual: `design-system/odc/MASTER.md`
§1 y §10.

## Relación con [[../ui-design-tokens/requirements|ui-design-tokens]] (feature 23, `done`)

Esta feature **no reabre** la 23: la enmienda en un punto y extiende en otro.

| Requisito de la 23 | Qué le pasa aquí |
|---|---|
| R3, cláusula "ningún token … chroma oklch mayor que `0.10`" | **Sustituida** por R1. El techo plano era correcto en light (navy a lightness 0.35) y es la causa mecánica de D-V1 en dark (mismo token a lightness 0.71). |
| R3, resto (roles conservados en `.dark`, `--sidebar-primary` = `--primary`, sin el violeta huérfano `oklch(0.488 0.243 264.376)`) | **Sigue vigente**, sus tests siguen en verde y R3 de esta spec lo refuerza. |
| R5, los 26 pares de contraste + el par compuesto de `--destructive` | **Sigue vigente sin relajarse**, y R6 le añade 2 pares. |
| R2 (valores de `:root`), R4 (los 8 pares de estado), R6 (radios y espaciado), R7–R14 (primitivas, no regresión, motion) | **Intactos.** Esta feature no toca `:root` salvo los 3 tokens fuera de gamut de R5, y no toca ningún archivo de `components/`. |

R10 obliga a registrar la sustitución de R3 en la propia spec 23, siguiendo el
patrón de enmienda firmada que ya usa ese archivo. **Autorizado por el humano el
2026-08-11**: tocar `specs/ui-design-tokens/requirements.md` queda limitado a
añadir esa fila de enmienda; el resto del archivo, incluidas sus casillas de
aprobación, no se toca.

**Definición usada en toda esta spec.** Para un token declarado como
`oklch(L C H)` con `L > 0`, su **saturación** es `s = C / L`. Es la magnitud que
describe "cuánto color se percibe" a una lightness dada; el chroma a secas no lo
es, y por eso un techo plano de chroma se comporta de forma distinta en light y
en dark. Valores actuales relevantes: `:root --primary` → `s = 0.0736 / 0.3462 =
0.2126`; `.dark --primary` → `s = 0.0692 / 0.7137 = 0.0970` (el 46% del anterior).

## Requisitos funcionales

- **R1**: WHEN se audita `frontend/src/styles.css`, THE SYSTEM SHALL calcular la
  saturación `s = C / L` de cada token declarado en `:root` y en `.dark` cuyo
  valor sea `oklch(...)`, y SHALL cumplir `s ≤ 0.2126` en todo token cuyo nombre
  no empiece por `--status-`, ni sea `--destructive` ni `--accent-action` (misma
  lista de exenciones que la R3 de la 23, sin añadir ni quitar nombres). El techo
  `0.2126` SHALL escribirse en el test como **constante documentada** —
  originalmente la saturación del navy institucional, `0.0736 / 0.3462 =
  0.21259` — y SHALL NOT derivarse en tiempo de test de `:root --primary`.
  `:root --primary` SHALL estar sujeto al techo como cualquier otro token no
  exento. Motivo (decisión humana, 2026-08-11): un techo leído del navy es
  autorreferencial — el navy no puede violar su propio límite, y subirle el
  chroma subiría el techo para todos los demás sin que ningún test lo detecte.
  Esta cláusula sustituye al techo plano de chroma `0.10` de la R3 de la
  feature 23.

- **R2**: WHILE el tema oscuro (`.dark`) está activo, THE SYSTEM SHALL declarar
  `--primary` y `--accent-action` con una saturación de al menos el **85%** de la
  del mismo token en `:root`. Con los valores vigentes de `:root` el suelo es
  `s ≥ 0.1807` para `--primary` y `s ≥ 0.1755` para `--accent-action`.
  IF un token de esta lista queda por debajo del suelo, THEN THE SYSTEM SHALL
  tratarlo como defecto aunque su razón de contraste sea holgada — D-V1 es un
  problema de saturación percibida, no de luminancia, y ningún test de contraste
  lo detecta. La lista es exactamente esos dos tokens; ver [[design]] para por qué
  `--destructive` y los `--status-*` quedan fuera (el suelo es inalcanzable en
  sRGB a su lightness).

- **R3**: WHEN se consulta la hoja de estilos, THE SYSTEM SHALL declarar `--ring`,
  `--sidebar-primary` y `--sidebar-ring` con **el mismo valor** que `--primary`
  dentro de su propio bloque de tema, en `:root` y en `.dark`. Hoy los cuatro
  coinciden en ambos temas pero solo `--sidebar-primary` en `.dark` está atado por
  un test (R3 de la 23); sin esta invariante, corregir `--primary` dejaría el
  anillo de foco y el primario del sidebar lavados.

- **R4**: WHILE el tema oscuro está activo, THE SYSTEM SHALL declarar `--primary`
  con una lightness mayor que la de `.dark --card` y mayor que la de
  `.dark --primary-foreground`. Es la Inverted Ledger Rule expresada de forma
  verificable para este token: en dark el primario es una superficie clara con
  texto oscuro encima, y R2 SHALL NOT satisfacerse oscureciendo el token (bajar
  `L` sube `s` sin añadir color y volvería el botón un navy invisible sobre el
  fondo).

- **R5**: WHEN se convierte a sRGB lineal **sin recortar los canales** cada token
  `oklch(L C H)` declarado en `:root` y en `.dark`, THE SYSTEM SHALL producir los
  tres canales dentro de `[0, 1]` con tolerancia `1e-4`. Hoy lo incumplen 6
  tokens, que el navegador remapea silenciosamente y que el recorte por canal del
  test enmascara: `--status-pending-surface`, `--status-approved-surface` y
  `--status-paid-surface` en `:root`; `--status-approved`, `--status-paid` y
  `--status-rejected` en `.dark`. WHEN se corrijan, THE SYSTEM SHALL conservar su
  lightness y su hue exactos y SHALL ajustar únicamente el chroma. Efecto
  esperado en pantalla: ninguno — es el mismo color que el navegador ya está
  pintando; lo que cambia es que el valor declarado y el renderizado coinciden y
  la auditoría de contraste deja de medir un color que no existe.

- **R6**: WHEN se ejecuta la auditoría de contraste con los valores nuevos,
  THE SYSTEM SHALL alcanzar una razón WCAG 2.1 ≥ 4.5:1 en los 26 pares que ya
  audita la R5 de la feature 23, en el par compuesto de `--destructive` sobre
  `--destructive` al 10% sobre `--card` en dark, y además en 2 pares nuevos:
  `.dark --primary` sobre `.dark --background` y `.dark --primary` sobre
  `.dark --card`. THE SYSTEM SHALL NOT eliminar, relajar ni marcar como `skip`
  ninguna aserción de contraste existente.

- **R7**: WHEN se consulta la hoja de estilos, THE SYSTEM SHALL declarar
  `:root --accent-action` idéntico a `:root --status-done` (invariante de la
  enmienda firmada de la 23, que se conserva tal cual), y SHALL declarar
  `.dark --accent-action` y `.dark --status-done` con **el mismo hue** que sus
  contrapartes de `:root` (`165.61`), pudiendo diferir entre sí en lightness y
  chroma. THE SYSTEM SHALL actualizar `design-system/odc/MASTER.md` §1 para que
  la afirmación de verde compartido diga explícitamente que **la identidad de
  valor es solo en tema claro** y que en oscuro los dos tokens comparten hue pero
  no lightness, porque sus roles difieren (superficie de acción con texto oscuro
  encima vs. texto de badge sobre superficie oscura). Verificación: test sobre los
  hues declarados y sobre la igualdad en `:root`; para el texto del MASTER, el
  reviewer comprueba que §1 contiene esa acotación nombrando ambos tokens.

- **R8**: WHEN el implementer elija los valores concretos de `.dark`,
  THE SYSTEM SHALL tomarlos de la tabla de candidatos de [[design]] o de la sesión
  de navegador de R9, y los tests de esta feature SHALL afirmar **invariantes**
  (relación `s`, gamut, contraste, hue, igualdad entre alias) y SHALL NOT añadir
  ninguna aserción de igualdad contra un literal `oklch(...)` nuevo para los
  tokens que esta feature cambia. Las aserciones literales que la 23 tiene sobre
  `:root` se conservan intactas. Motivo: fijar un color en un requisito sin
  haberlo visto en pantalla es lo que produjo la contradicción R2/R5 de la 23 y lo
  que produjo D-V1; esta spec no lo repite.

- **R9**: WHEN la feature se proponga para `done`, THE SYSTEM SHALL existir
  `progress/verify_ui-dark-mode-chroma.md` con las cuatro cosas siguientes,
  tomadas en un navegador real con la app corriendo y el conmutador de tema de
  `lib/theme.tsx`:
  1. valores de `getComputedStyle` de `--primary`, `--ring`, `--accent-action` y
     `--status-done` en los dos temas, copiados en vivo, no deducidos del código;
  2. el CTA primario de `odc-form.tsx` junto a su botón outline en dark — la
     pantalla concreta donde D-V1 se vio peor — con el veredicto de si el
     primario ya pesa más que el secundario;
  3. las 8 badges de estado en dark, para confirmar que la corrección de gamut de
     R5 no las cambió visiblemente;
  4. una línea de veredicto humano con fecha, afirmativa o negativa.

  IF ese archivo no existe, o su veredicto no es afirmativo, THEN el reviewer
  SHALL NOT aprobar el cierre **aunque `pnpm test` y `pnpm build` estén en
  verde**: los tests de esta feature verifican invariantes, y la razón de que la
  feature exista es que un invariante verde puede seguir viéndose mal.

- **R10**: WHEN la feature se cierre, THE SYSTEM SHALL haber añadido a
  `specs/ui-design-tokens/requirements.md`, en su tabla "Enmiendas posteriores a
  la aprobación", una fila que registre que la cláusula de chroma `≤ 0.10` de su
  R3 queda sustituida por la R1 de esta feature, con la fecha y la autorización
  humana, y una nota breve del motivo (techo plano redactado mirando solo light).
  El resto de aquel archivo SHALL quedar sin tocar, incluidas sus casillas de
  aprobación.

- **R11**: WHILE se ejecutan `pnpm test` y `pnpm build` en `frontend/`,
  THE SYSTEM SHALL terminar ambos en verde; THE SYSTEM SHALL NOT añadir ninguna
  entrada nueva a `dependencies` ni a `devDependencies` de
  `frontend/package.json` (la conversión oklch→sRGB del test se amplía a mano,
  como ya se hizo en la 23); y los únicos archivos que SHALL cambiar son
  `frontend/src/styles.css`, `frontend/src/styles.tokens.test.ts`,
  `design-system/odc/MASTER.md`, la fila de enmienda de
  `specs/ui-design-tokens/requirements.md`, los de `specs/ui-dark-mode-chroma/` y
  los de `progress/`. Ningún archivo de `frontend/src/components/` ni de
  `backend/` SHALL cambiar.

## Fuera de alcance

- **Re-saturar los 8 `--status-*` de `.dark`.** Todos están hoy en torno al 37%
  de la saturación de su contraparte clara — la misma enfermedad de D-V1 — pero
  para 6 de los 8 el suelo del 85% es **inalcanzable dentro de sRGB** a su
  lightness `0.82` (tabla de gamut en [[design]]). Subir solo `--status-done`
  porque sí se puede lo sacaría de la familia de badges. Re-saturar la familia
  entera exige bajar su lightness y volver a auditar los 16 pares de estado: es
  otra feature, no un añadido a esta.
- **`--destructive` en `.dark`** (71% de la saturación clara): ya está al 99.8%
  del chroma que sRGB admite a su lightness. Corregirlo exige moverle la
  lightness y re-auditar el par compuesto. Fuera.
- `--muted-foreground`, los neutros (`--background`, `--card`, `--secondary`,
  `--muted`, `--accent`, `--border`, `--input`) y `--chart-*`: cumplen R1 y no
  son tokens de identidad.
- **Fases 3a–3e del plan** (features 25–27): dashboards, detalle, formularios,
  resumen mensual y `odc-status-badge.tsx`. Esta feature no toca `components/`.
  En particular, D-V3 (los CTA que usan `size="lg"`) y D-V4 (el anidamiento de
  cajas de `odc-detail.tsx`) siguen fuera.
- **Responsive a 375px**, que el plan dejó anotado como no verificado: sigue sin
  comprobarse y esta feature no lo cubre.
- `login-form.tsx` con etiquetas en inglés y el `<title>` "TanStack Start
  Starter": ajenos al refactor visual, registrados en el plan.
- Sustituir el conversor oklch del test por una dependencia de color, o verificar
  el contraste con un navegador headless: descartados en la 23 y aquí también.

## Aprobación

- [X] Aprobado por humano (fecha: 11/10/2026) ← gate obligatorio antes de implementar
