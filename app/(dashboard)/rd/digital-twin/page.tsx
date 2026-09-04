import { DashboardPage } from '@/components/dashboard-page'
import { DigitalTwinView } from '@/components/rd/digital-twin-view'

export default function DigitalTwinPage() {
  return (
    <DashboardPage
      title="Digital Twin"
      description="Connected 3D mine twin — topography, equipment, block model, and drill holes"
    >
      <DigitalTwinView />
    </DashboardPage>
  )
}
