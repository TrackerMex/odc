# ODC Form — Page Overrides

> Sobrescribe `../MASTER.md`. Solo desviaciones.
> Componentes: `odc-form.tsx`, `register-payment-form.tsx`, `payment-evidence-form.tsx`,
> `upload-invoice-form.tsx`, `login-form.tsx`, `ui/field.tsx`.

## Lo que ya está bien (no tocar)

El formulario ya cumple las reglas de `ux-guidelines.csv` que suelen fallar: labels
visibles con `htmlFor`, `aria-invalid` por campo, `FieldError` junto al campo,
`FieldDescription` como helper text, `aria-busy` en el form. La base es correcta; lo que
falta es densidad y momento de validación.

## Validación

- **Añadir validación en `blur`.** Hoy `fieldErrors` solo se puebla en el submit
  (`ux-guidelines.csv` → Forms/Inline Validation: *"Don't: validate only on submit"*).
- `FieldError` debe llevar `role="alert"` para que el lector de pantalla lo anuncie
  (`ux-guidelines.csv` → Accessibility/Error Messages, severity High). Verificar si
  `ui/field.tsx` ya lo emite; si no, es un cambio de una línea que arregla los 5
  formularios a la vez.
- Al fallar el submit, mover el foco al primer campo inválido.

## Densidad

- `FieldGroup` gap baja de `gap-5` a `gap-4`.
- La fila cantidad/unidad/precio se queda en `lg:grid-cols-3` — son campos cortos, la
  excepción a la regla de dos columnas del Master.
- Inputs a `h-8`, radio `--radius` (`0.375rem`).
- Padding de `CardContent`: `1rem`.

## Panel de resumen (aside)

Es el punto de mayor valor de la pantalla: el total calculado en vivo antes de enviar.
Hoy se renderiza con el mismo peso que un campo más.

- El total pasa a `text-2xl font-semibold tabular-nums`, con `border-t` sobre él.
- Los renglones intermedios (cantidad × precio) en `text-sm text-muted-foreground`.
- El panel conserva `xl:sticky xl:top-6`.

## Divulgación progresiva

`ux-guidelines.csv` → Forms/Progressive Disclosure. "Comentarios" es el único campo
opcional del formulario base: va bajo un `Collapsible` ("Añadir comentarios"), no ocupando
un bloque permanente al mismo nivel que los campos requeridos. `ui/collapsible.tsx` ya
existe.

## Acciones

- Submit primario en navy. Cancelar en `ghost`.
- Botón submit con estado de carga visible; nunca deshabilitado sin indicador.
- Barra de acciones al pie del `Card`, con `border-t`.

## Tests a verificar

`odc-form.test.tsx` (313 líneas) consulta por label y por rol. Añadir validación en blur
puede hacer aparecer errores antes de lo que algunos casos esperan — revisar los casos que
escriben en un campo y luego consultan `queryByText` de un error.
