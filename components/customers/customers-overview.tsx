import { getCustomerSiteOverview } from '@/lib/customers/sites'

import { IndonesiaSiteMapLoader } from './indonesia-site-map-loader'
import { SitesTable } from './sites-table'

export function CustomersOverview() {
  const sites = getCustomerSiteOverview()

  return (
    <div className="flex flex-col gap-6">
      <IndonesiaSiteMapLoader sites={sites} />
      <SitesTable sites={sites} />
    </div>
  )
}
