'use client'

import Image from 'next/image'
import { Truck } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CustomerEquipmentCount } from '@/lib/customers/individual'

export function CustomerEquipmentCard({
  equipment,
}: {
  equipment: CustomerEquipmentCount[]
}) {
  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Truck className="size-4 text-primary" aria-hidden="true" />
          <CardTitle>Equipment</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {equipment.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No equipment assigned to this customer.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {equipment.map((type) => (
              <div
                key={type.id}
                className="group flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:border-primary/30 hover:bg-muted/50"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-background/60">
                  <Image
                    src={type.image}
                    alt={type.label}
                    fill
                    className="object-contain p-1 transition-transform duration-200 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12vw"
                  />
                </div>
                <span className="text-center text-xs font-medium leading-tight text-foreground">
                  {type.label}
                </span>
                <div className="flex w-full flex-col gap-0.5 text-center">
                  <span className="font-mono text-xs tabular-nums text-foreground">
                    <span className="font-semibold">{type.iotInstalled}</span>
                    <span className="text-muted-foreground">
                      /{type.totalUnits}
                    </span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    installed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
