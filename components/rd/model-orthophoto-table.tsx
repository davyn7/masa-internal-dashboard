'use client'

import { useId, useRef } from 'react'
import { FileUp, Plus, Trash2, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type OrthophotoRowFile = {
  file: File
  name: string
} | null

export type OrthophotoRow = {
  id: string
  file: OrthophotoRowFile
  /** Southwest (bottom-left) longitude, degrees. */
  swLon: string
  /** Southwest (bottom-left) latitude, degrees. */
  swLat: string
  /** Northeast (top-right) longitude, degrees. */
  neLon: string
  /** Northeast (top-right) latitude, degrees. */
  neLat: string
}

export type ModelOrthophotoTableProps = {
  rows: OrthophotoRow[]
  onFileChange: (id: string, file: File | null) => void
  onBoundsChange: (
    id: string,
    patch: Partial<Pick<OrthophotoRow, 'swLon' | 'swLat' | 'neLon' | 'neLat'>>,
  ) => void
  onAddRow: () => void
  onRemoveRow: (id: string) => void
}

export function ModelOrthophotoTable({
  rows,
  onFileChange,
  onBoundsChange,
  onAddRow,
  onRemoveRow,
}: ModelOrthophotoTableProps) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const baseId = useId()

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="gap-2">
        <CardTitle className="text-base">Add Orthophotos</CardTitle>
        <p className="text-xs text-muted-foreground">
          JPG/PNG imagery with WGS84 southwest and northeast corners. Each photo
          is draped onto the EGM2008 elevation surface. Incomplete rows are
          skipped on Render.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className={cn(
                'grid gap-3 rounded-md border border-border/50 bg-background/20 p-3',
                'sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]',
              )}
            >
              <div className="space-y-1.5 sm:col-span-3 sm:max-w-md">
                <Label className="text-xs">Orthophoto file</Label>
                <input
                  ref={(el) => {
                    inputRefs.current[row.id] = el
                  }}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    onFileChange(row.id, file)
                    event.target.value = ''
                  }}
                />
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-w-0 flex-1 justify-start"
                    onClick={() => inputRefs.current[row.id]?.click()}
                  >
                    {row.file ? (
                      <FileUp
                        className="size-3.5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                    ) : (
                      <Upload
                        className="size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span className="truncate">
                      {row.file
                        ? row.file.name
                        : 'Upload .jpg / .png'}
                    </span>
                  </Button>
                  {row.file ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 px-2"
                      aria-label={`Clear orthophoto for row ${index + 1}`}
                      onClick={() => onFileChange(row.id, null)}
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">
                  Bottom left (southwest)
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    id={`${baseId}-sw-lon-${row.id}`}
                    inputMode="decimal"
                    placeholder="Lon"
                    aria-label={`Southwest longitude row ${index + 1}`}
                    value={row.swLon}
                    onChange={(event) =>
                      onBoundsChange(row.id, { swLon: event.target.value })
                    }
                  />
                  <Input
                    id={`${baseId}-sw-lat-${row.id}`}
                    inputMode="decimal"
                    placeholder="Lat"
                    aria-label={`Southwest latitude row ${index + 1}`}
                    value={row.swLat}
                    onChange={(event) =>
                      onBoundsChange(row.id, { swLat: event.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">
                  Top right (northeast)
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    id={`${baseId}-ne-lon-${row.id}`}
                    inputMode="decimal"
                    placeholder="Lon"
                    aria-label={`Northeast longitude row ${index + 1}`}
                    value={row.neLon}
                    onChange={(event) =>
                      onBoundsChange(row.id, { neLon: event.target.value })
                    }
                  />
                  <Input
                    id={`${baseId}-ne-lat-${row.id}`}
                    inputMode="decimal"
                    placeholder="Lat"
                    aria-label={`Northeast latitude row ${index + 1}`}
                    value={row.neLat}
                    onChange={(event) =>
                      onBoundsChange(row.id, { neLat: event.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="px-2"
                  disabled={rows.length <= 1}
                  aria-label={`Remove orthophoto row ${index + 1}`}
                  onClick={() => onRemoveRow(row.id)}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAddRow}>
          <Plus className="size-3.5" aria-hidden="true" />
          Add another orthophoto
        </Button>
      </CardContent>
    </Card>
  )
}
