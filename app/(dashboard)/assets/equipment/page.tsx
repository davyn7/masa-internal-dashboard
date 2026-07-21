import { EquipmentInventoryCard } from '@/components/assets/equipment-inventory-card'
import { DashboardPage } from '@/components/dashboard-page'

export default function EquipmentPage() {
  return (
    <DashboardPage
      title="Equipment"
      description="Fleet equipment inventory and types"
    >
      <EquipmentInventoryCard />
    </DashboardPage>
  )
}
