import { useState } from 'react'
import { ArrowLeftIcon } from 'lucide-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { getOdc, listSuppliers, submitOdc, updateOdc } from '@/lib/api'
import type { Odc } from '@/lib/odc'
import { OdcDetail } from '@/components/odc/odc-detail'
import { OdcForm } from '@/components/odc/odc-form'
import { OdcPageError, OdcPagePending } from '@/components/odc/odc-page-state'
import { buttonVariants } from '@/components/ui/button'

export async function loadOdcDetail(id: string) {
  const [odc, suppliers] = await Promise.all([getOdc(id), listSuppliers()])
  return { odc, suppliers }
}

export const Route = createFileRoute('/_authenticated/odcs/$id')({
  loader: ({ params }) => loadOdcDetail(params.id),
  pendingComponent: OdcPagePending,
  errorComponent: OdcPageError,
  component: OdcDetailPage,
})

function OdcDetailPage() {
  const loaded = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const [odc, setOdc] = useState<Odc>(loaded.odc)
  const canEdit =
    user.role === 'DIRECTOR_OPS' &&
    odc.status === 'RECHAZADA' &&
    odc.createdById === user.id

  return (
    <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeftIcon aria-hidden="true" />
          Volver al dashboard
        </Link>
        <div className="mt-5">
          <OdcDetail odc={odc} />
        </div>

        {canEdit ? (
          <section className="mt-8" aria-labelledby="edit-odc-title">
            <div className="mb-5">
              <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Corrección solicitada
              </p>
              <h2
                id="edit-odc-title"
                className="mt-2 text-2xl font-semibold tracking-tight"
              >
                Editar y reenviar
              </h2>
            </div>
            <OdcForm
              user={user}
              suppliers={loaded.suppliers}
              initialOdc={odc}
              persist={(payload) => updateOdc(odc.id ?? '', payload)}
              submit={submitOdc}
              onSuccess={setOdc}
            />
          </section>
        ) : null}
      </div>
    </main>
  )
}
