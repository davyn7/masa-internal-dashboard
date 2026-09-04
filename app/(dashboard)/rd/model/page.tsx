import { DashboardPage } from '@/components/dashboard-page'
import { ModelView } from '@/components/rd/model-view'

export default function ModelPage() {
  return (
    <DashboardPage
      title="Model"
      description="Upload georeferenced GeoTIFF tiles and stitch them into a 3D terrain model"
      mainClassName="min-h-0"
    >
      <ModelView />
    </DashboardPage>
  )
}
