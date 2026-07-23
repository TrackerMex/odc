import { useState } from 'react'
import { LoaderCircleIcon, SaveIcon, SendIcon } from 'lucide-react'
import type { SessionUser } from '@/lib/session'
import { ApiError } from '@/lib/api'
import {
  buildOdcPayload,
  computeTotalCents,
  formatCurrency,
  formatDate,
  formatUnitPriceInput,
  odcFormSchema,
} from '@/lib/odc'
import type {
  Odc,
  OdcFormField,
  OdcFormValues,
  OdcPayload,
  Supplier,
} from '@/lib/odc'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

type FieldErrors = Partial<Record<OdcFormField, string>>

const emptyValues: OdcFormValues = {
  description: '',
  quantity: '',
  unit: '',
  unitPrice: '',
  supplier: '',
  comments: '',
}

function valuesFromOdc(odc?: Odc): OdcFormValues {
  if (!odc) return emptyValues
  return {
    description: odc.description,
    quantity: String(odc.quantity),
    unit: odc.unit,
    unitPrice: formatUnitPriceInput(odc.unitPriceCents),
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
  const [values, setValues] = useState<OdcFormValues>(() =>
    valuesFromOdc(initialOdc),
  )
  const [persistedOdc, setPersistedOdc] = useState(initialOdc)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [operationError, setOperationError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<'save' | 'send' | null>(
    null,
  )

  const totalCents = computeTotalCents(values.quantity, values.unitPrice)
  const disabled = pendingAction !== null || suppliers.length === 0

  function updateField(field: OdcFormField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setOperationError(null)
  }

  function validatedPayload(): OdcPayload | null {
    const result = odcFormSchema.safeParse(values)
    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors
      setFieldErrors({
        description: flattened.description?.[0],
        quantity: flattened.quantity?.[0],
        unit: flattened.unit?.[0],
        unitPrice: flattened.unitPrice?.[0],
        supplier: flattened.supplier?.[0],
        comments: flattened.comments?.[0],
      })
      return null
    }
    setFieldErrors({})
    return buildOdcPayload(result.data)
  }

  async function runAction(action: 'save' | 'send') {
    const payload = validatedPayload()
    if (!payload) return

    setPendingAction(action)
    setOperationError(null)
    try {
      const saved = await persist(payload)
      setPersistedOdc(saved)
      setValues(valuesFromOdc(saved))

      if (action === 'save') {
        onSuccess(saved)
        return
      }

      if (!saved.id) throw new Error('Created ODC has no id')
      const sent = await submit(saved.id)
      onSuccess(sent)
    } catch (error) {
      setOperationError(operationErrorMessage(error))
    } finally {
      setPendingAction(null)
    }
  }

  function errorFor(field: OdcFormField) {
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
            <Field data-invalid={!!fieldErrors.description}>
              <FieldLabel htmlFor="description">Descripción *</FieldLabel>
              <Textarea
                id="description"
                value={values.description}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
                placeholder="Describe el bien o servicio"
                disabled={pendingAction !== null}
                aria-invalid={!!fieldErrors.description}
              />
              <FieldError errors={errorFor('description')} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field data-invalid={!!fieldErrors.quantity}>
                <FieldLabel htmlFor="quantity">Cantidad *</FieldLabel>
                <Input
                  id="quantity"
                  inputMode="numeric"
                  value={values.quantity}
                  onChange={(event) =>
                    updateField('quantity', event.target.value)
                  }
                  placeholder="1"
                  disabled={pendingAction !== null}
                  aria-invalid={!!fieldErrors.quantity}
                />
                <FieldError errors={errorFor('quantity')} />
              </Field>
              <Field data-invalid={!!fieldErrors.unit}>
                <FieldLabel htmlFor="unit">Unidad *</FieldLabel>
                <Input
                  id="unit"
                  value={values.unit}
                  onChange={(event) => updateField('unit', event.target.value)}
                  placeholder="pieza, servicio, lote…"
                  disabled={pendingAction !== null}
                  aria-invalid={!!fieldErrors.unit}
                />
                <FieldError errors={errorFor('unit')} />
              </Field>
              <Field data-invalid={!!fieldErrors.unitPrice}>
                <FieldLabel htmlFor="unit-price">
                  Precio unitario (MXN) *
                </FieldLabel>
                <Input
                  id="unit-price"
                  inputMode="decimal"
                  value={values.unitPrice}
                  onChange={(event) =>
                    updateField('unitPrice', event.target.value)
                  }
                  placeholder="0.00"
                  disabled={pendingAction !== null}
                  aria-invalid={!!fieldErrors.unitPrice}
                />
                <FieldError errors={errorFor('unitPrice')} />
              </Field>
            </div>

            <Field data-invalid={!!fieldErrors.supplier}>
              <FieldLabel htmlFor="supplier">Proveedor *</FieldLabel>
              <Select
                value={values.supplier || null}
                onValueChange={(value) => updateField('supplier', value ?? '')}
                disabled={pendingAction !== null || suppliers.length === 0}
              >
                <SelectTrigger
                  id="supplier"
                  aria-label="Proveedor"
                  aria-invalid={!!fieldErrors.supplier}
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
              <FieldError errors={errorFor('supplier')} />
            </Field>

            <Field data-invalid={!!fieldErrors.comments}>
              <FieldLabel htmlFor="comments">Comentarios</FieldLabel>
              <Textarea
                id="comments"
                value={values.comments}
                onChange={(event) =>
                  updateField('comments', event.target.value)
                }
                placeholder="Información adicional para la compra"
                disabled={pendingAction !== null}
                aria-invalid={!!fieldErrors.comments}
              />
              <FieldError errors={errorFor('comments')} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
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
                  {persistedOdc?.createdAt
                    ? formatDate(persistedOdc.createdAt)
                    : new Intl.DateTimeFormat('es-MX', {
                        dateStyle: 'medium',
                      }).format(new Date())}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">Solicita</dt>
                <dd className="text-right font-medium">{user.fullName}</dd>
              </div>
            </dl>
            <div className="rounded-2xl bg-foreground p-4 text-background">
              <p className="text-xs font-medium tracking-[0.12em] uppercase opacity-70">
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
            className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
          >
            <p className="font-medium">No se completó la operación</p>
            <p className="mt-1">{operationError}</p>
            {persistedOdc?.odcNumber ? (
              <p className="mt-2 text-foreground">
                La orden {persistedOdc.odcNumber} sí quedó guardada.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <Button type="submit" variant="outline" size="lg" disabled={disabled}>
            {pendingAction === 'save' ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : (
              <SaveIcon aria-hidden="true" />
            )}
            {pendingAction === 'save' ? 'Guardando…' : 'Guardar como Borrador'}
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={disabled}
            onClick={() => void runAction('send')}
          >
            {pendingAction === 'send' ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : (
              <SendIcon aria-hidden="true" />
            )}
            {pendingAction === 'send' ? 'Enviando…' : 'Enviar a Administración'}
          </Button>
        </div>
      </aside>
    </form>
  )
}
