import { EquipmentTypesCard } from '@/components/assets/equipment-types-card'
import { DashboardPage } from '@/components/dashboard-page'

export default function EquipmentPage() {
  return (
    <DashboardPage
      title="Equipment"
      description="Fleet equipment inventory and types"
    >
      <EquipmentTypesCard />
    </DashboardPage>
  )
}
