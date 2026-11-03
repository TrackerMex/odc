import { useRef, useState } from 'react'
import {
  ChevronDownIcon,
  LoaderCircleIcon,
  SaveIcon,
  SendIcon,
} from 'lucide-react'
import type { SessionUser } from '@/lib/session'
import { ApiError } from '@/lib/api'
import {
  buildOdcPayload,
  computeFiscalAmounts,
  computeItemsTotalCents,
  formatCurrency,
  formatDate,
  formatUnitPriceInput,
  odcItems,
  odcMultiFormSchema,
  odcPayloadItems,
  odcLineFormSchema,
  statusLabel,
} from '@/lib/odc'
import type {
  Odc,
  OdcLineFormField,
  OdcMultiFormValues,
  OdcPayload,
  Supplier,
} from '@/lib/odc'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

type FieldErrors = {
  items: Array<Partial<Record<OdcLineFormField, string>>>
  supplier?: string
  comments?: string
}

const emptyItem = {
  description: '',
  quantity: '',
  unit: '',
  unitPrice: '',
}

const emptyValues: OdcMultiFormValues = {
  items: [emptyItem],
  supplier: '',
  comments: '',
}

function valuesFromOdc(odc?: Odc): OdcMultiFormValues {
  if (!odc) return emptyValues
  return {
    items: odcItems(odc).map((item) => ({
      description: item.description,
      quantity: String(item.quantity),
      unit: item.unit,
      unitPrice: formatUnitPriceInput(item.unitPriceCents),
    })),
    supplier: odc.supplier,
    comments: odc.comments ?? '',
  }
}

function operationErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400)
      return 'Revisa los datos del formulario e inténtalo de nuevo.'
    if (error.status === 403)
      return 'No tienes permiso para realizar esta acción.'
    if (error.status === 409)
      return 'El estado de la ODC cambió. Actualiza la información e inténtalo de nuevo.'
  }
  return 'No pudimos completar la operación. Revisa tu conexión e inténtalo de nuevo.'
}

export function OdcForm({
  user,
  suppliers,
  initialOdc,
  persist,
  submit,
  onSuccess,
}: {
  user: SessionUser
  suppliers: Supplier[]
  initialOdc?: Odc
  persist: (payload: OdcPayload) => Promise<Odc>
  submit: (id: string) => Promise<Odc>
  onSuccess: (odc: Odc) => void
}) {
  const [values, setValues] = useState<OdcMultiFormValues>(() =>
    valuesFromOdc(initialOdc),
  )
  const [persistedOdc, setPersistedOdc] = useState(initialOdc)
  const [review, setReview] = useState<{
    action: 'save' | 'send'
    payload: OdcPayload
  } | null>(null)
  const [completedOdc, setCompletedOdc] = useState<Odc | null>(null)
  const [recoveryOdc, setRecoveryOdc] = useState<Odc | null>(null)
  const [uncertainCreation, setUncertainCreation] = useState(false)
  const operationPending = useRef(false)
  const reviewTriggerRef = useRef<HTMLElement | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({ items: [] })
  const [operationError, setOperationError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<'save' | 'send' | null>(
    null,
  )
  const [commentsOpen, setCommentsOpen] = useState(
    Boolean(initialOdc?.comments),
  )
  const itemRefs = useRef<
    Array<Partial<Record<OdcLineFormField, HTMLElement | null>>>
  >([])
  const supplierRef = useRef<HTMLButtonElement>(null)

  const subtotalCents = computeItemsTotalCents(values.items)
  const historicalDraft =
    initialOdc?.status === 'BORRADOR' && (initialOdc.vatRateBps ?? 0) === 0
  const vatRateBps =
    initialOdc?.status === 'RECHAZADA' && (initialOdc.vatRateBps ?? 0) === 0
      ? 0
      : 1600
  const { vatCents, totalCents } = computeFiscalAmounts(
    subtotalCents,
    vatRateBps,
  )
  const reviewSubtotal = review
    ? odcPayloadItems(review.payload).reduce(
        (total, item) => total + item.quantity * item.unitPriceCents,
        0,
      )
    : 0
  const reviewAmounts = computeFiscalAmounts(reviewSubtotal, 1600)
  const firstItem = values.items[0] ?? emptyItem
  const unitPriceCents = Number.isFinite(Number(firstItem.unitPrice))
    ? Math.round(Number(firstItem.unitPrice) * 100)
    : 0
  const fieldsDisabled =
    pendingAction !== null ||
    !!completedOdc ||
    !!recoveryOdc ||
    uncertainCreation
  const disabled = fieldsDisabled || suppliers.length === 0

  function updateItemField(
    index: number,
    field: OdcLineFormField,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }))
    setFieldErrors((current) => ({
      ...current,
      items: current.items.map((row, itemIndex) =>
        itemIndex === index ? { ...row, [field]: undefined } : row,
      ),
    }))
    setOperationError(null)
  }

  function updateSharedField(field: 'supplier' | 'comments', value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setOperationError(null)
  }

  function validateItemField(index: number, field: OdcLineFormField) {
    const result = odcLineFormSchema.safeParse(values.items[index])
    const message = result.success
      ? undefined
      : result.error.flatten().fieldErrors[field]?.[0]
    setFieldErrors((current) => ({
      ...current,
      items: Array.from(
        { length: Math.max(current.items.length, index + 1) },
        (_, itemIndex) =>
          itemIndex === index
            ? { ...current.items[index], [field]: message }
            : (current.items[itemIndex] ?? {}),
      ),
    }))
    return message
  }

  function validateSharedField(field: 'supplier' | 'comments') {
    const result = odcMultiFormSchema.shape[field].safeParse(values[field])
    const message = result.success ? undefined : result.error.issues[0]?.message
    setFieldErrors((current) => ({ ...current, [field]: message }))
    return message
  }

  function addItem() {
    setValues((current) => ({
      ...current,
      items: [...current.items, { ...emptyItem }],
    }))
    setFieldErrors((current) => ({ ...current, items: [...current.items, {}] }))
    setOperationError(null)
  }

  function removeItem(index: number) {
    setValues((current) => ({
      ...current,
      items:
        current.items.length > 1
          ? current.items.filter((_, itemIndex) => itemIndex !== index)
          : current.items,
    }))
    setFieldErrors((current) => ({
      ...current,
      items:
        current.items.length > 1
          ? current.items.filter((_, itemIndex) => itemIndex !== index)
          : current.items,
    }))
    setOperationError(null)
  }

  function validatedPayload(): OdcPayload | null {
    const result = odcMultiFormSchema.safeParse(values)
    if (!result.success) {
      const nextErrors: FieldErrors = { items: [] }
      for (const issue of result.error.issues) {
        const [root, index, field] = issue.path
        if (
          root === 'items' &&
          typeof index === 'number' &&
          typeof field === 'string' &&
          ['description', 'quantity', 'unit', 'unitPrice'].includes(field)
        ) {
          nextErrors.items[index] = {
            ...nextErrors.items[index],
            [field]: issue.message,
          }
        } else if (root === 'supplier' || root === 'comments') {
          nextErrors[root] = issue.message
        } else if (root === 'items') {
          nextErrors.items[0] = {
            ...nextErrors.items[0],
            description: issue.message,
          }
        }
      }
      setFieldErrors(nextErrors)
      for (let index = 0; index < nextErrors.items.length; index += 1) {
        const rowErrors = nextErrors.items[index]
        const firstInvalid = (
          ['description', 'quantity', 'unit', 'unitPrice'] as const
        ).find((field) => rowErrors[field])
        if (firstInvalid) {
          itemRefs.current[index]?.[firstInvalid]?.focus()
          return null
        }
      }
      if (nextErrors.supplier) supplierRef.current?.focus()
      return null
    }
    setFieldErrors({ items: [] })
    return buildOdcPayload(result.data, Boolean(initialOdc?.items?.length))
  }

  function runAction(action: 'save' | 'send') {
    if (operationPending.current || disabled) return
    const payload = validatedPayload()
    if (!payload) return
    if (!initialOdc) {
      reviewTriggerRef.current = document.activeElement as HTMLElement
      setReview({ action, payload })
      return
    }
    void persistAndSend(action, payload)
  }

  function finish(odc: Odc) {
    setPersistedOdc(odc)
    setRecoveryOdc(null)
    if (initialOdc) onSuccess(odc)
    else setCompletedOdc(odc)
  }

  async function persistAndSend(action: 'save' | 'send', payload?: OdcPayload) {
    if (operationPending.current || completedOdc || uncertainCreation) return
    operationPending.current = true
    setPendingAction(action)
    setOperationError(null)
    let saved = payload ? undefined : recoveryOdc
    try {
      if (payload) saved = await persist(payload)
      if (!saved?.id || !saved.odcNumber)
        throw new Error('Missing saved ODC identity')
      setPersistedOdc(saved)
      setValues(valuesFromOdc(saved))

      if (action === 'save') {
        toast.add({
          type: 'success',
          title: 'ODC guardada',
          description: 'La orden quedó como borrador.',
        })
        finish(saved)
        return
      }

      const sent = await submit(saved.id)
      toast.add({
        type: 'success',
        title: 'ODC enviada',
        description: 'Administración ya puede validar el presupuesto.',
      })
      finish(sent)
    } catch (error) {
      const uncertain = !(error instanceof ApiError) || error.status >= 500
      if (saved?.id && saved.odcNumber && action === 'send') {
        setRecoveryOdc(saved)
        setOperationError(
          uncertain
            ? 'No pudimos confirmar el envío. Revisa el detalle antes de volver a enviarla.'
            : operationErrorMessage(error),
        )
      } else if (uncertain) {
        if (!initialOdc) setUncertainCreation(true)
        setOperationError(
          'No pudimos confirmar si se guardó la orden. Revisa tus órdenes antes de volver a guardarla.',
        )
      } else {
        setOperationError(operationErrorMessage(error))
      }
    } finally {
      operationPending.current = false
      setPendingAction(null)
      setReview(null)
    }
  }

  function itemErrorFor(index: number, field: OdcLineFormField) {
    const message = fieldErrors.items[index]?.[field]
    return message ? [{ message }] : []
  }

  function sharedErrorFor(field: 'supplier' | 'comments') {
    const message = fieldErrors[field]
    return message ? [{ message }] : []
  }

  return (
    <form
      noValidate
      aria-busy={pendingAction !== null}
      onSubmit={(event) => {
        event.preventDefault()
        void runAction('save')
      }}
      className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <Card className="min-w-0">
        <CardHeader className="border-b border-border/60">
          <CardTitle>
            {initialOdc ? 'Editar orden de compra' : 'Nueva orden de compra'}
          </CardTitle>
          <CardDescription>
            Los campos marcados son necesarios para guardar la ODC.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="space-y-4">
              {values.items.map((item, index) => {
                const itemNumber = index + 1
                const fieldId = (field: OdcLineFormField) =>
                  index === 0
                    ? {
                        description: 'description',
                        quantity: 'quantity',
                        unit: 'unit',
                        unitPrice: 'unit-price',
                      }[field]
                    : `odc-item-${itemNumber}-${field}`
                const errorId = (field: OdcLineFormField) =>
                  `${fieldId(field)}-error`

                return (
                  <section
                    key={itemNumber}
                    aria-labelledby={`odc-item-${itemNumber}-title`}
                    data-testid={`odc-item-row-${itemNumber}`}
                    className="min-w-0 rounded-card border border-border/70 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h2
                        id={`odc-item-${itemNumber}-title`}
                        className="text-sm font-semibold"
                      >
                        Partida {itemNumber}
                      </h2>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-9"
                        aria-label={`Quitar partida ${itemNumber}`}
                        disabled={fieldsDisabled || values.items.length === 1}
                        onClick={() => removeItem(index)}
                      >
                        Quitar partida
                      </Button>
                    </div>
                    <Field
                      data-invalid={!!fieldErrors.items[index]?.description}
                    >
                      <FieldLabel htmlFor={fieldId('description')}>
                        {itemNumber === 1
                          ? 'Descripción *'
                          : `Descripción partida ${itemNumber} *`}
                      </FieldLabel>
                      <Textarea
                        ref={(element) => {
                          itemRefs.current[index] = {
                            ...itemRefs.current[index],
                            description: element,
                          }
                        }}
                        id={fieldId('description')}
                        value={item.description}
                        onChange={(event) =>
                          updateItemField(
                            index,
                            'description',
                            event.target.value,
                          )
                        }
                        placeholder="Describe el bien o servicio"
                        disabled={fieldsDisabled}
                        onBlur={() => validateItemField(index, 'description')}
                        aria-invalid={!!fieldErrors.items[index]?.description}
                        aria-describedby={
                          fieldErrors.items[index]?.description
                            ? errorId('description')
                            : undefined
                        }
                      />
                      <FieldError
                        id={errorId('description')}
                        errors={itemErrorFor(index, 'description')}
                      />
                    </Field>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Field
                        data-invalid={!!fieldErrors.items[index]?.quantity}
                      >
                        <FieldLabel htmlFor={fieldId('quantity')}>
                          {itemNumber === 1
                            ? 'Cantidad *'
                            : `Cantidad partida ${itemNumber} *`}
                        </FieldLabel>
                        <Input
                          ref={(element) => {
                            itemRefs.current[index] = {
                              ...itemRefs.current[index],
                              quantity: element,
                            }
                          }}
                          id={fieldId('quantity')}
                          inputMode="numeric"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItemField(
                              index,
                              'quantity',
                              event.target.value,
                            )
                          }
                          placeholder="1"
                          disabled={fieldsDisabled}
                          onBlur={() => validateItemField(index, 'quantity')}
                          aria-invalid={!!fieldErrors.items[index]?.quantity}
                          aria-describedby={
                            fieldErrors.items[index]?.quantity
                              ? errorId('quantity')
                              : undefined
                          }
                        />
                        <FieldError
                          id={errorId('quantity')}
                          errors={itemErrorFor(index, 'quantity')}
                        />
                      </Field>
                      <Field data-invalid={!!fieldErrors.items[index]?.unit}>
                        <FieldLabel htmlFor={fieldId('unit')}>
                          {itemNumber === 1
                            ? 'Unidad *'
                            : `Unidad partida ${itemNumber} *`}
                        </FieldLabel>
                        <Input
                          ref={(element) => {
                            itemRefs.current[index] = {
                              ...itemRefs.current[index],
                              unit: element,
                            }
                          }}
                          id={fieldId('unit')}
                          value={item.unit}
                          onChange={(event) =>
                            updateItemField(index, 'unit', event.target.value)
                          }
                          placeholder="pieza, servicio, lote…"
                          disabled={fieldsDisabled}
                          onBlur={() => validateItemField(index, 'unit')}
                          aria-invalid={!!fieldErrors.items[index]?.unit}
                          aria-describedby={
                            fieldErrors.items[index]?.unit
                              ? errorId('unit')
                              : undefined
                          }
                        />
                        <FieldError
                          id={errorId('unit')}
                          errors={itemErrorFor(index, 'unit')}
                        />
                      </Field>
                      <Field
                        data-invalid={!!fieldErrors.items[index]?.unitPrice}
                      >
                        <FieldLabel htmlFor={fieldId('unitPrice')}>
                          {itemNumber === 1
                            ? 'Precio unitario antes de IVA (MXN) *'
                            : `Precio unitario partida ${itemNumber} antes de IVA (MXN) *`}
                        </FieldLabel>
                        <Input
                          ref={(element) => {
                            itemRefs.current[index] = {
                              ...itemRefs.current[index],
                              unitPrice: element,
                            }
                          }}
                          id={fieldId('unitPrice')}
                          inputMode="decimal"
                          value={item.unitPrice}
                          onChange={(event) =>
                            updateItemField(
                              index,
                              'unitPrice',
                              event.target.value,
                            )
                          }
                          placeholder="0.00"
                          disabled={fieldsDisabled}
                          onBlur={() => validateItemField(index, 'unitPrice')}
                          aria-invalid={!!fieldErrors.items[index]?.unitPrice}
                          aria-describedby={
                            fieldErrors.items[index]?.unitPrice
                              ? errorId('unitPrice')
                              : undefined
                          }
                        />
                        <FieldError
                          id={errorId('unitPrice')}
                          errors={itemErrorFor(index, 'unitPrice')}
                        />
                      </Field>
                    </div>
                  </section>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {values.items.length}{' '}
                {values.items.length === 1 ? 'partida' : 'partidas'}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={fieldsDisabled}
                onClick={addItem}
              >
                Agregar partida
              </Button>
            </div>

            <Field data-invalid={!!fieldErrors.supplier}>
              <FieldLabel htmlFor="supplier">Proveedor *</FieldLabel>
              <Select
                value={values.supplier || null}
                onValueChange={(value) =>
                  updateSharedField('supplier', value ?? '')
                }
                disabled={disabled}
              >
                <SelectTrigger
                  ref={supplierRef}
                  id="supplier"
                  aria-label="Proveedor"
                  aria-invalid={!!fieldErrors.supplier}
                  aria-describedby={
                    fieldErrors.supplier ? 'supplier-error' : undefined
                  }
                  onBlur={() => validateSharedField('supplier')}
                  className="w-full"
                >
                  <SelectValue placeholder="Selecciona un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {[...suppliers]
                    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
                    .map((supplier) => (
                      <SelectItem
                        key={supplier.id ?? supplier.name}
                        value={supplier.name}
                      >
                        {supplier.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {suppliers.length === 0 ? (
                <FieldDescription>
                  No hay proveedores disponibles.
                </FieldDescription>
              ) : null}
              <FieldError
                id="supplier-error"
                errors={sharedErrorFor('supplier')}
              />
            </Field>

            <Collapsible open={commentsOpen} onOpenChange={setCommentsOpen}>
              <CollapsibleTrigger
                render={<Button type="button" variant="ghost" />}
              >
                <ChevronDownIcon aria-hidden="true" />
                {commentsOpen ? 'Ocultar comentarios' : 'Añadir comentarios'}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <Field data-invalid={!!fieldErrors.comments}>
                  <FieldLabel htmlFor="comments">Comentarios</FieldLabel>
                  <Textarea
                    id="comments"
                    value={values.comments}
                    onChange={(event) =>
                      updateSharedField('comments', event.target.value)
                    }
                    placeholder="Información adicional para la compra"
                    disabled={fieldsDisabled}
                    aria-invalid={!!fieldErrors.comments}
                  />
                  <FieldError
                    id="comments-error"
                    errors={sharedErrorFor('comments')}
                  />
                </Field>
              </CollapsibleContent>
            </Collapsible>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-2 border-t sm:flex-row sm:items-center">
          <Button type="submit" variant="outline" disabled={disabled}>
            {pendingAction === 'save' ? (
              <LoaderCircleIcon
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <SaveIcon aria-hidden="true" />
            )}
            {pendingAction === 'save' ? 'Guardando…' : 'Guardar como Borrador'}
          </Button>
          <Button
            type="button"
            disabled={disabled}
            onClick={() => void runAction('send')}
          >
            {pendingAction === 'send' ? (
              <LoaderCircleIcon
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <SendIcon aria-hidden="true" />
            )}
            {pendingAction === 'send' ? 'Enviando…' : 'Enviar a Administración'}
          </Button>
        </CardFooter>
      </Card>

      <aside className="space-y-5 xl:sticky xl:top-[calc(var(--app-header-height)+1rem)] xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
            <CardDescription>Datos automáticos de la orden</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">Número</dt>
                <dd className="text-right font-medium">
                  {persistedOdc?.odcNumber ?? 'Se asignará al guardar'}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">Fecha</dt>
                <dd className="text-right font-medium">
                  {formatDate(persistedOdc?.createdAt ?? null)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">Solicita</dt>
                <dd className="text-right font-medium">{user.fullName}</dd>
              </div>
            </dl>
            <div className="border-t pt-4">
              <p
                data-testid="odc-total-breakdown"
                className="text-sm text-muted-foreground tabular-nums"
              >
                <span className="block font-medium text-foreground">
                  {firstItem.description || 'Primera partida'}
                </span>
                <span>
                  {firstItem.quantity || '0'} × {formatCurrency(unitPriceCents)}
                  {values.items.length > 1
                    ? ` · ${values.items.length} partidas`
                    : ''}
                </span>
              </p>
              <dl className="mt-3 space-y-1 text-sm tabular-nums">
                <div className="flex justify-between gap-4">
                  <dt>Subtotal</dt>
                  <dd>{formatCurrency(subtotalCents)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>
                    {vatRateBps === 1600 ? 'IVA 16 %' : 'Sin IVA registrado'}
                  </dt>
                  <dd>{formatCurrency(vatCents)}</dd>
                </div>
              </dl>
              {historicalDraft ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  El IVA se aplicará al guardar este borrador.
                </p>
              ) : null}
              <p className="mt-3 text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
                Total estimado
              </p>
              <p
                data-testid="odc-total"
                className="mt-1 text-2xl font-semibold tracking-tight tabular-nums"
              >
                {formatCurrency(totalCents)}
              </p>
            </div>
          </CardContent>
        </Card>

        {operationError ? (
          <div
            role="alert"
            className="rounded-card border border-destructive/20 bg-destructive/3 p-4 text-sm text-destructive"
          >
            <p className="font-medium">No se completó la operación</p>
            <p className="mt-1">{operationError}</p>
            {recoveryOdc ? (
              <p className="mt-2 text-foreground">
                La orden {recoveryOdc.odcNumber} quedó guardada como{' '}
                {statusLabel(recoveryOdc.status).toLocaleLowerCase('es-MX')}.
              </p>
            ) : null}
            {recoveryOdc ? (
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  type="button"
                  className="min-h-11"
                  disabled={pendingAction !== null}
                  onClick={() => void persistAndSend('send')}
                >
                  {pendingAction ? 'Enviando…' : 'Reintentar envío'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  disabled={pendingAction !== null}
                  onClick={() => onSuccess(recoveryOdc)}
                >
                  Abrir detalle para editar
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
        {completedOdc ? (
          <div className="space-y-4 rounded-card border bg-card p-4">
            <p role="status">
              Orden {completedOdc.odcNumber} ·{' '}
              {statusLabel(completedOdc.status)}
            </p>
            <Button
              type="button"
              className="min-h-11 w-full"
              onClick={() => onSuccess(completedOdc)}
            >
              Ver detalle
            </Button>
          </div>
        ) : null}
      </aside>
      <Dialog
        open={review !== null}
        onOpenChange={(open) => {
          if (!open && !operationPending.current) setReview(null)
        }}
      >
        <DialogContent
          finalFocus={reviewTriggerRef}
          showCloseButton={pendingAction === null}
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg [&_[data-slot=dialog-close]]:size-11"
          aria-busy={pendingAction !== null}
        >
          <DialogHeader className="pr-12">
            <DialogTitle>Revisar orden de compra</DialogTitle>
            <DialogDescription>
              Confirma los datos y el destino antes de crear la ODC.
            </DialogDescription>
          </DialogHeader>
          {review ? (
            <dl className="grid gap-4 [&_dt]:text-muted-foreground [&_dd]:mt-1 [&_dd]:break-words">
              <div>
                <dt>Proveedor</dt>
                <dd>{review.payload.supplier}</dd>
              </div>
              <div>
                <dt>Partidas ({odcPayloadItems(review.payload).length})</dt>
                <dd>
                  <ol
                    aria-label="Partidas de la ODC"
                    className="mt-2 space-y-3"
                  >
                    {odcPayloadItems(review.payload).map((item, index) => (
                      <li
                        key={`${item.description}-${index}`}
                        className="rounded-card border border-border/70 p-3"
                      >
                        <p className="whitespace-pre-wrap font-medium text-foreground">
                          {item.description}
                        </p>
                        <p className="mt-1 text-sm">
                          {item.quantity} <span>{item.unit}</span> ·{' '}
                          {formatCurrency(item.unitPriceCents)} por unidad
                        </p>
                      </li>
                    ))}
                  </ol>
                </dd>
              </div>
              {review.payload.comments ? (
                <div>
                  <dt>Comentarios</dt>
                  <dd className="whitespace-pre-wrap">
                    {review.payload.comments}
                  </dd>
                </div>
              ) : null}
              <div className="border-t pt-4">
                <dt>Subtotal (MXN)</dt>
                <dd>{formatCurrency(reviewAmounts.subtotalCents)}</dd>
                <dt className="mt-2">IVA 16 %</dt>
                <dd>{formatCurrency(reviewAmounts.vatCents)}</dd>
                <dt>Total estimado (MXN)</dt>
                <dd className="text-2xl font-semibold tabular-nums">
                  {formatCurrency(reviewAmounts.totalCents)}
                </dd>
              </div>
              <div>
                <dt>Destino</dt>
                <dd className="font-medium">
                  {review.action === 'save' ? 'Borrador' : 'Administración'}
                </dd>
              </div>
            </dl>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={pendingAction !== null}
              onClick={() => setReview(null)}
            >
              Volver a editar
            </Button>
            <Button
              type="button"
              className="min-h-11"
              disabled={pendingAction !== null}
              onClick={() => {
                if (review) void persistAndSend(review.action, review.payload)
              }}
            >
              {pendingAction
                ? 'Procesando…'
                : review?.action === 'save'
                  ? 'Confirmar borrador'
                  : 'Confirmar envío a Administración'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
