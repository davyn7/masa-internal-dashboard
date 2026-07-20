'use client'

import { useRouter } from 'next/navigation'
import { UserRound } from 'lucide-react'

import { CustomerEquipmentCard } from '@/components/customers/customer-equipment-card'
import { CustomerFinancialMetrics } from '@/components/customers/customer-financial-metrics'
import { MineralBadge } from '@/components/customers/mineral-badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  CustomerIndividualDetail,
  CustomerOption,
} from '@/lib/customers/individual'

export function CustomerIndividualView({
  options,
  selectedId,
  customer,
}: {
  options: CustomerOption[]
  selectedId: string | null
  customer: CustomerIndividualDetail | null
}) {
  const router = useRouter()

  function onSelectCustomer(id: string | null) {
    if (!id) {
      router.push('/customers/individual')
      return
    }
    router.push(`/customers/individual?customer=${id}`)
  }

  const selectedLabel = customer
    ? `${customer.companyName} · ${customer.siteName}`
    : 'Select a customer'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserRound className="size-4 text-primary" aria-hidden="true" />
          <span>Customer</span>
        </div>
        <Select
          value={selectedId ?? undefined}
          onValueChange={(value) => onSelectCustomer(value)}
        >
          <SelectTrigger className="w-full sm:w-[320px]" aria-label="Select customer">
            <SelectValue placeholder="Select a customer">
              {selectedLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.companyName}
                <span className="text-muted-foreground">
                  {' '}
                  · {option.siteName}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!customer ? (
        <Card className="border-border/60 bg-card/80">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <UserRound
              className="size-8 text-muted-foreground/50"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-foreground">
              Select a customer to view details
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Choose from the list above, or open a customer from the Overview
              table.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border/60 bg-card/80">
            <CardContent className="flex flex-col gap-4 py-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {customer.companyName}
                </h2>
                <MineralBadge mineral={customer.mineral} />
              </div>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    Site
                  </dt>
                  <dd className="text-sm font-medium text-foreground">
                    {customer.siteName}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    Province
                  </dt>
                  <dd className="text-sm text-foreground">{customer.province}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    City
                  </dt>
                  <dd className="text-sm text-foreground">{customer.city}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    Material
                  </dt>
                  <dd className="text-sm text-foreground">{customer.mineral}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <CustomerEquipmentCard equipment={customer.equipment} />
          <CustomerFinancialMetrics customer={customer} />
        </>
      )}
    </div>
  )
}
