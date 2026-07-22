import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/')({ component: Home })

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">ODC</h1>
      <p className="mt-4 text-lg">
        Placeholder protegido — reemplazado por el dashboard real en
        frontend-odc-form.
      </p>
    </div>
  )
}
