import { useState } from 'react'
import { FileTextIcon } from 'lucide-react'
import type { UploadInvoicePayload } from '@/lib/api'
import type { SessionUser } from '@/lib/session'
import type { Odc } from '@/lib/odc'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (role !== 'DIRECTOR_OPS' || odc.status !== 'EVIDENCIA_PAGO_SUBIDA') {
    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    if (!file) {
      setError('El archivo de la factura es obligatorio.')
      return
    }
    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      setError('Selecciona un archivo PDF, JPG o PNG.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('El archivo no puede superar 10 MB.')
      return
    }
    if (!warehouseEntryDate) {
      setError('La fecha de entrada a almacén es obligatoria.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      onSuccess(
        await upload(file, {
          warehouseEntryDate,
          invoiceNumber: invoiceNumber.trim() || undefined,
          invoiceDate: invoiceDate.trim() || undefined,
          observations: observations.trim() || undefined,
        }),
      )
    } catch {
      setError('No pudimos subir la factura. Intenta nuevamente.')
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
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            aria-busy={submitting}
          >
            <div className="space-y-2">
              <Label htmlFor="invoice-file">Archivo de la factura</Label>
              <Input
                id="invoice-file"
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null)
                  setError(null)
                }}
                disabled={submitting}
              />
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
              <Input
                id="invoice-date"
                type="date"
                value={invoiceDate}
                onChange={(event) => setInvoiceDate(event.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warehouse-entry-date">
                Fecha de entrada a almacén
              </Label>
              <Input
                id="warehouse-entry-date"
                type="date"
                value={warehouseEntryDate}
                onChange={(event) =>
                  setWarehouseEntryDate(event.target.value)
                }
                disabled={submitting}
              />
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
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={submitting}>
              <FileTextIcon aria-hidden="true" />
              {submitting ? 'Subiendo…' : 'Subir factura'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
