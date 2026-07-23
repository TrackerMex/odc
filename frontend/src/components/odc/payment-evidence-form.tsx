import { useState } from 'react'
import { UploadIcon } from 'lucide-react'
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

const MAX_FILE_SIZE = 10_485_760
const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
])

export function PaymentEvidenceForm({
  odc,
  role,
  upload,
  onSuccess,
}: {
  odc: Odc
  role: SessionUser['role']
  upload: (file: File, reference?: string) => Promise<Odc>
  onSuccess: (odc: Odc) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (role !== 'ADMINISTRACION' || odc.status !== 'PAGO_REGISTRADO') {
    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    if (!file) {
      setError('El archivo del comprobante es obligatorio.')
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

    setSubmitting(true)
    setError(null)
    try {
      onSuccess(await upload(file, reference.trim() || undefined))
    } catch {
      setError('No pudimos subir el comprobante. Intenta nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-8" aria-labelledby="payment-evidence-title">
      <Card>
        <CardHeader>
          <CardTitle id="payment-evidence-title">
            Subir comprobante de pago
          </CardTitle>
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
              <Label htmlFor="payment-evidence-file">
                Archivo del comprobante
              </Label>
              <Input
                id="payment-evidence-file"
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
              <Label htmlFor="evidence-reference">
                Referencia del comprobante
              </Label>
              <Input
                id="evidence-reference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
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
              <UploadIcon aria-hidden="true" />
              {submitting ? 'Subiendo…' : 'Subir comprobante'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}
