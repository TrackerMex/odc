import { AlertCircleIcon, LoaderCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function OdcPagePending() {
  return (
    <main
      className="flex min-h-[60vh] items-center justify-center p-6"
      aria-busy="true"
    >
      <div className="text-center text-sm text-muted-foreground">
        <LoaderCircleIcon
          className="mx-auto mb-3 size-5 animate-spin"
          aria-hidden="true"
        />
        Cargando información…
      </div>
    </main>
  )
}

export function OdcPageError() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-6">
      <div
        role="alert"
        className="max-w-md rounded-3xl border bg-card p-6 text-center shadow-sm"
      >
        <AlertCircleIcon
          className="mx-auto mb-3 size-6 text-destructive"
          aria-hidden="true"
        />
        <h1 className="font-medium">No pudimos cargar esta información</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Revisa tu conexión y vuelve a intentarlo.
        </p>
        <Button className="mt-5" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    </main>
  )
}

export function RolePlaceholder() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md rounded-3xl border bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-medium">Panel en preparación</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este panel corresponde al flujo del Director de Operaciones.
        </p>
      </div>
    </main>
  )
}
