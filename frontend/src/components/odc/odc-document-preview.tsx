import { useEffect, useRef, useState } from 'react'
import {
  ExternalLinkIcon,
  EyeIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { odcFileUrl } from '@/lib/odc'
import { cn } from '@/lib/utils'

type DocumentKind = 'evidence' | 'invoice'
type PreviewState = 'loading' | 'ready' | 'error'
const PREVIEW_TIMEOUT_MS = 15_000

export function OdcDocumentPreview({
  odcId,
  kind,
  label,
}: {
  odcId: string
  kind: DocumentKind
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [previewState, setPreviewState] = useState<PreviewState>('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const url = odcFileUrl(odcId, kind)
  const labelLowercase = label.toLocaleLowerCase('es-MX')
  const previewTitle =
    kind === 'invoice'
      ? 'Vista previa de la factura'
      : 'Vista previa del comprobante de pago'

  useEffect(() => {
    if (!open || previewState !== 'loading') return
    const timeout = window.setTimeout(
      () => setPreviewState('error'),
      PREVIEW_TIMEOUT_MS,
    )
    return () => window.clearTimeout(timeout)
  }, [open, previewState, reloadKey])

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) setPreviewState('loading')
    else queueMicrotask(() => triggerRef.current?.focus())
  }

  function retry() {
    setPreviewState('loading')
    setReloadKey((key) => key + 1)
  }

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="sm"
        onClick={() => changeOpen(true)}
      >
        <EyeIcon aria-hidden="true" />
        Ver {labelLowercase}
      </Button>

      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden p-4 sm:max-w-5xl sm:p-6">
          <DialogHeader className="min-w-0 pr-10">
            <DialogTitle className="truncate text-lg">{label}</DialogTitle>
            <DialogDescription>
              Vista protegida de la ODC. El acceso al archivo expira en unos
              minutos.
            </DialogDescription>
          </DialogHeader>

          <div className="relative min-h-72 min-w-0 overflow-hidden rounded-card bg-muted/60 ring-1 ring-foreground/5 sm:min-h-[32rem] dark:ring-foreground/10">
            {previewState === 'loading' ? (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-sm text-muted-foreground"
                aria-live="polite"
              >
                <LoaderCircleIcon
                  className="size-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
                Cargando documento…
              </div>
            ) : null}

            {previewState === 'error' ? (
              <div className="flex h-full min-h-72 items-center justify-center p-4 sm:min-h-[32rem]">
                <Alert variant="destructive" className="max-w-lg">
                  <AlertTitle>No pudimos mostrar el documento</AlertTitle>
                  <AlertDescription>
                    Reintenta la vista previa o abre el archivo en otra pestaña.
                  </AlertDescription>
                  <Button
                    className="mt-3"
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={retry}
                  >
                    <RefreshCwIcon aria-hidden="true" />
                    Reintentar
                  </Button>
                </Alert>
              </div>
            ) : open ? (
              <iframe
                key={reloadKey}
                title={previewTitle}
                src={url}
                className={cn(
                  'h-full min-h-72 w-full bg-background sm:min-h-[32rem]',
                  previewState === 'loading' && 'opacity-0',
                )}
                referrerPolicy="no-referrer"
                onLoad={() => setPreviewState('ready')}
                onErrorCapture={() => setPreviewState('error')}
              />
            ) : null}
          </div>

          <DialogFooter className="items-stretch sm:items-center">
            <DialogClose
              render={<Button type="button" variant="outline" size="sm" />}
            >
              Cerrar
            </DialogClose>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: 'sm' })}
            >
              <ExternalLinkIcon aria-hidden="true" />
              Abrir en otra pestaña
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
