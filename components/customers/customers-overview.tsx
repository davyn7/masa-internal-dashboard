import {
  getCustomerOverviewRows,
  getCustomerSiteOverview,
} from '@/lib/customers/sites'

import { CustomersTable } from './customers-table'
import { IndonesiaSiteMapLoader } from './indonesia-site-map-loader'

export function CustomersOverview() {
  const sites = getCustomerSiteOverview()
  const customers = getCustomerOverviewRows()

  return (
    <div className="flex flex-col gap-6">
      <IndonesiaSiteMapLoader sites={sites} />
      <CustomersTable customers={customers} />
    </div>
  )
}
