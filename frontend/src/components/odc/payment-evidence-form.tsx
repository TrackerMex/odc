import { useRef, useState } from 'react'
import { UploadIcon } from 'lucide-react'
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
import { toast } from '@/components/ui/toast'

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
  const [fileError, setFileError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (role !== 'ADMINISTRACION' || odc.status !== 'PAGO_REGISTRADO') {
    return null
  }

  function fileValidationMessage(selectedFile: File | null) {
    if (!selectedFile) return 'El archivo del comprobante es obligatorio.'
    if (!ALLOWED_FILE_TYPES.has(selectedFile.type)) {
      return 'Selecciona un archivo PDF, JPG o PNG.'
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      return 'El archivo no puede superar 10 MB.'
    }
    return null
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const nextFileError = fileValidationMessage(file)
    setFileError(nextFileError)
    if (!file || nextFileError) {
      fileRef.current?.focus()
      return
    }

    setSubmitting(true)
    setApiError(null)
    try {
      const nextOdc = await upload(file, reference.trim() || undefined)
      toast.add({
        type: 'success',
        title: 'Comprobante subido',
        description: 'La orden ya está lista para completar la factura.',
      })
      onSuccess(nextOdc)
    } catch {
      setApiError('No pudimos subir el comprobante. Intenta nuevamente.')
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
        <form
          className="contents"
          onSubmit={handleSubmit}
          aria-busy={submitting}
        >
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-evidence-file">
                Archivo del comprobante
              </Label>
              <Input
                ref={fileRef}
                id="payment-evidence-file"
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
                aria-describedby={
                  fileError ? 'payment-evidence-file-error' : undefined
                }
              />
              {fileError ? (
                <p
                  id="payment-evidence-file-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {fileError}
                </p>
              ) : null}
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
            {apiError ? (
              <p role="alert" className="text-sm text-destructive">
                {apiError}
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="border-t flex flex-col items-stretch sm:flex-row sm:items-center">
            <Button type="submit" disabled={submitting}>
              <UploadIcon aria-hidden="true" />
              {submitting ? 'Subiendo…' : 'Subir comprobante'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </section>
  )
}
