import { ArrowLeftIcon } from 'lucide-react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { createOdc, listSuppliers, submitOdc } from '@/lib/api'
import { OdcForm } from '@/components/odc/odc-form'
import {
  OdcPageError,
  OdcPagePending,
  RolePlaceholder,
} from '@/components/odc/odc-page-state'
import { buttonVariants } from '@/components/ui/button'

export const Route = createFileRoute('/_authenticated/odcs/new')({
  loader: listSuppliers,
  pendingComponent: OdcPagePending,
  errorComponent: OdcPageError,
  component: NewOdcPage,
})

function NewOdcPage() {
  const suppliers = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()

  if (user.role !== 'DIRECTOR_OPS') return <RolePlaceholder />

  return (
    <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <Link
            to="/"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            <ArrowLeftIcon aria-hidden="true" />
            Volver al dashboard
          </Link>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            Crear ODC
          </h1>
          <p className="mt-2 text-muted-foreground">
            Registra la compra y decide si queda como borrador o pasa a
            Administración.
          </p>
        </header>
        <OdcForm
          user={user}
          suppliers={suppliers}
          persist={createOdc}
          submit={submitOdc}
          onSuccess={(odc) => {
            if (!odc.id) return
            void navigate({ to: '/odcs/$id', params: { id: odc.id } })
          }}
        />
      </div>
    </main>
  )
}
