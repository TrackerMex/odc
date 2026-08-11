import { useRef, useState } from 'react'
import { FileTextIcon } from 'lucide-react'
import type { UploadInvoicePayload } from '@/lib/api'
import type { SessionUser } from '@/lib/session'
import type { Odc } from '@/lib/odc'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'

const MAX_FILE_SIZE = 10_485_760
const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
])

export function UploadInvoiceForm({
  odc,
  role,
  upload,
  onSuccess,
}: {
  odc: Odc
  role: SessionUser['role']
  upload: (file: File, payload: UploadInvoicePayload) => Promise<Odc>
  onSuccess: (odc: Odc) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [warehouseEntryDate, setWarehouseEntryDate] = useState('')
  const [observations, setObservations] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [warehouseEntryDateError, setWarehouseEntryDateError] = useState<
    string | null
  >(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const warehouseEntryDateRef = useRef<HTMLInputElement>(null)

  if (role !== 'DIRECTOR_OPS' || odc.status !== 'EVIDENCIA_PAGO_SUBIDA') {
    return null
  }

  function fileValidationMessage(selectedFile: File | null) {
    if (!selectedFile) return 'El archivo de la factura es obligatorio.'
    if (!ALLOWED_FILE_TYPES.has(selectedFile.type)) {
      return 'Selecciona un archivo PDF, JPG o PNG.'
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      return 'El archivo no puede superar 10 MB.'
    }
    return null
  }

  function validateWarehouseEntryDate() {
    const message = warehouseEntryDate
      ? null
      : 'La fecha de entrada a almacén es obligatoria.'
    setWarehouseEntryDateError(message)
    return message
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const nextFileError = fileValidationMessage(file)
    const nextWarehouseEntryDateError = warehouseEntryDate
      ? null
      : 'La fecha de entrada a almacén es obligatoria.'
    setFileError(nextFileError)
    setWarehouseEntryDateError(nextWarehouseEntryDateError)
    if (nextFileError || nextWarehouseEntryDateError) {
      ;(nextFileError ? fileRef : warehouseEntryDateRef).current?.focus()
      return
    }

    setApiError(null)
    setDialogOpen(true)
  }

  async function handleConfirm() {
    if (submitting || !file) return
    setSubmitting(true)
    setApiError(null)
    try {
      const nextOdc = await upload(file, {
        warehouseEntryDate,
        invoiceNumber: invoiceNumber.trim() || undefined,
        invoiceDate: invoiceDate.trim() || undefined,
        observations: observations.trim() || undefined,
      })
      toast.add({
        type: 'success',
        title: 'Factura subida',
        description: 'La orden de compra se completó correctamente.',
      })
      onSuccess(nextOdc)
      setDialogOpen(false)
    } catch {
      setApiError('No pudimos subir la factura. Intenta nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-8" aria-labelledby="upload-invoice-title">
      <Card>
        <CardHeader>
          <CardTitle id="upload-invoice-title">Subir factura</CardTitle>
          <CardDescription>
            Adjunta un PDF, JPG o PNG de hasta 10 MB.
          </CardDescription>
        </CardHeader>
        <form
          className="contents"
          onSubmit={handleSubmit}
          aria-busy={submitting}
        >
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-file">Archivo de la factura</Label>
              <Input
                ref={fileRef}
                id="invoice-file"
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null
                  setFile(nextFile)
                  setFileError(fileValidationMessage(nextFile))
                  setApiError(null)
                }}
                disabled={submitting}
                aria-invalid={Boolean(fileError)}
                aria-describedby={fileError ? 'invoice-file-error' : undefined}
              />
              {fileError ? (
                <p
                  id="invoice-file-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {fileError}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-number">Número de factura</Label>
              <Input
                id="invoice-number"
                value={invoiceNumber}
                onChange={(event) => setInvoiceNumber(event.target.value)}
                disabled={submitting}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-date">Fecha de factura</Label>
              <DatePicker
                id="invoice-date"
                label="Fecha de factura"
                value={invoiceDate}
                onChange={setInvoiceDate}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warehouse-entry-date">
                Fecha de entrada a almacén
              </Label>
              <DatePicker
                id="warehouse-entry-date"
                label="Fecha de entrada a almacén"
                value={warehouseEntryDate}
                onChange={(value) => {
                  setWarehouseEntryDate(value)
                  setWarehouseEntryDateError(null)
                  setApiError(null)
                }}
                onBlur={validateWarehouseEntryDate}
                disabled={submitting}
                aria-invalid={Boolean(warehouseEntryDateError)}
                aria-describedby={
                  warehouseEntryDateError
                    ? 'warehouse-entry-date-error'
                    : undefined
                }
                inputRef={warehouseEntryDateRef}
              />
              {warehouseEntryDateError ? (
                <p
                  id="warehouse-entry-date-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {warehouseEntryDateError}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice-observations">Observaciones</Label>
              <Textarea
                id="invoice-observations"
                value={observations}
                onChange={(event) => setObservations(event.target.value)}
                disabled={submitting}
                placeholder="Opcional"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t flex flex-col items-stretch sm:flex-row sm:items-center">
            <Button type="submit" disabled={submitting}>
              <FileTextIcon aria-hidden="true" />
              Subir factura
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!submitting) setDialogOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Completar orden</DialogTitle>
            <DialogDescription>
              La factura se adjuntará y la orden quedará completada. Confirma
              que los datos son correctos.
            </DialogDescription>
          </DialogHeader>
          {apiError ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {apiError}
            </p>
          ) : null}
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => setDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="confirm"
              disabled={submitting}
              onClick={() => void handleConfirm()}
            >
              {submitting ? 'Completando…' : 'Completar orden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
