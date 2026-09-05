'use client'

import { useId, useRef } from 'react'
import { FileUp, Plus, Trash2, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  POLYGON_TYPES,
  type PolygonType,
} from '@/lib/rd/model-polygons'
import { cn } from '@/lib/utils'

export type PolygonRowFile = {
  file: File
  name: string
} | null

export type PolygonRow = {
  id: string
  name: string
  type: PolygonType | ''
  geojson: PolygonRowFile
}

export type ModelPolygonTableProps = {
  rows: PolygonRow[]
  onNameChange: (id: string, name: string) => void
  onTypeChange: (id: string, type: PolygonType | '') => void
  onGeoJsonFile: (id: string, file: File | null) => void
  onAddRow: () => void
  onRemoveRow: (id: string) => void
}

export function ModelPolygonTable({
  rows,
  onNameChange,
  onTypeChange,
  onGeoJsonFile,
  onAddRow,
  onRemoveRow,
}: ModelPolygonTableProps) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const baseId = useId()

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="gap-2">
        <CardTitle className="text-base">Add Polygons</CardTitle>
        <p className="text-xs text-muted-foreground">
          GeoJSON is WGS84 lon/lat; elevations are taken from the EGM2008 TIF
          surface. Incomplete rows are skipped on Render.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className={cn(
                'grid gap-3 rounded-md border border-border/50 bg-background/20 p-3',
                'sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,1.4fr)_auto]',
              )}
            >
              <div className="space-y-1.5">
                <Label htmlFor={`${baseId}-name-${row.id}`} className="text-xs">
                  Name
                </Label>
                <Input
                  id={`${baseId}-name-${row.id}`}
                  value={row.name}
                  placeholder={`Polygon ${index + 1}`}
                  onChange={(event) =>
                    onNameChange(row.id, event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${baseId}-type-${row.id}`} className="text-xs">
                  Type
                </Label>
                <Select
                  value={row.type === '' ? null : row.type}
                  onValueChange={(value) => {
                    if (value === null) {
                      onTypeChange(row.id, '')
                      return
                    }
                    onTypeChange(row.id, value as PolygonType)
                  }}
                >
                  <SelectTrigger id={`${baseId}-type-${row.id}`} className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {POLYGON_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">GeoJSON file</Label>
                <input
                  ref={(el) => {
                    inputRefs.current[row.id] = el
                  }}
                  type="file"
                  accept=".geojson,.json,application/geo+json,application/json"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    onGeoJsonFile(row.id, file)
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
                    {row.geojson ? (
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
                      {row.geojson ? row.geojson.name : 'Upload .geojson'}
                    </span>
                  </Button>
                  {row.geojson ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 px-2"
                      aria-label={`Clear GeoJSON for ${row.name || `row ${index + 1}`}`}
                      onClick={() => onGeoJsonFile(row.id, null)}
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="px-2"
                  disabled={rows.length <= 1}
                  aria-label={`Remove polygon row ${index + 1}`}
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
          Add another polygon
        </Button>
      </CardContent>
    </Card>
  )
}
