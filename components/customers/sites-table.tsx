import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MineralBadge } from '@/components/customers/mineral-badge'
import type { CustomerSiteOverview } from '@/lib/customers/sites'

export function SitesTable({ sites }: { sites: CustomerSiteOverview[] }) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Sites</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-xs font-medium text-muted-foreground">
                Site
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Material
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Province
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Kota/Kabupaten
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Postal Code
              </TableHead>
              <TableHead className="text-right text-xs font-medium text-muted-foreground">
                Customers
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sites.map((site) => (
              <TableRow key={site.siteId} className="border-border/40">
                <TableCell className="text-xs font-medium text-foreground">
                  {site.siteName}
                </TableCell>
                <TableCell>
                  <MineralBadge mineral={site.mineral} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {site.province}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {site.kotaKabupaten}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {site.postalCode}
                </TableCell>
                <TableCell className="text-right text-xs font-medium text-foreground">
                  {site.customers.length}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
