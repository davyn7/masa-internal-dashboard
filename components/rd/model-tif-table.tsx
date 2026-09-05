'use client'

import { useId, useRef } from 'react'
import { FileUp, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const SIZE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const

export type TifCellFile = {
  file: File
  name: string
} | null

export type ModelTifTableProps = {
  rows: number
  cols: number
  cells: TifCellFile[]
  onRowsChange: (rows: number) => void
  onColsChange: (cols: number) => void
  onCellFile: (index: number, file: File | null) => void
}

function colLetter(colIndex: number): string {
  let n = colIndex
  let label = ''
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  }
  return label
}

function cellLabel(row: number, col: number): string {
  return `${colLetter(col - 1)}${row}`
}

export function ModelTifTable({
  rows,
  cols,
  cells,
  onRowsChange,
  onColsChange,
  onCellFile,
}: ModelTifTableProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const baseId = useId()
  const filledCount = cells.filter((cell) => cell !== null).length

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base">TIF Table</CardTitle>
          <p className="text-xs text-muted-foreground">
            Upload georeferenced .tif elevation tiles (EGM2008). Cells are
            optional — leave any empty (e.g. D1). Placement uses each file&apos;s
            GeoTIFF bounds.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`${baseId}-cols`} className="text-xs">
              Columns
            </Label>
            <Select
              value={String(cols)}
              onValueChange={(value) => {
                if (value) onColsChange(Number(value))
              }}
            >
              <SelectTrigger id={`${baseId}-cols`} className="w-[88px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${baseId}-rows`} className="text-xs">
              Rows
            </Label>
            <Select
              value={String(rows)}
              onValueChange={(value) => {
                if (value) onRowsChange(Number(value))
              }}
            >
              <SelectTrigger id={`${baseId}-rows`} className="w-[88px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          {filledCount} of {rows * cols} cells filled — empty cells stay null.
        </p>
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: rows * cols }, (_, index) => {
            const cell = cells[index] ?? null
            const row = Math.floor(index / cols) + 1
            const col = (index % cols) + 1
            const label = cellLabel(row, col)
            return (
              <div
                key={index}
                className={cn(
                  'flex min-h-[112px] flex-col items-stretch justify-between gap-2 rounded-md border p-3',
                  cell
                    ? 'border-primary/40 bg-background/40'
                    : 'border-dashed border-border/50 bg-background/20',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    {label}
                  </span>
                  {cell ? (
                    <FileUp
                      className="size-3.5 text-primary"
                      aria-hidden="true"
                    />
                  ) : (
                    <span className="text-[10px] text-muted-foreground/50">
                      null
                    </span>
                  )}
                </div>
                <p
                  className="line-clamp-2 min-h-[2.5rem] text-xs text-muted-foreground"
                  title={cell?.name}
                >
                  {cell ? cell.name : 'Empty (optional)'}
                </p>
                <input
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="file"
                  accept=".tif,.tiff,image/tiff"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    onCellFile(index, file)
                    event.target.value = ''
                  }}
                />
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-w-0 flex-1"
                    onClick={() => inputRefs.current[index]?.click()}
                  >
                    <Upload className="size-3.5" aria-hidden="true" />
                    {cell ? 'Replace' : 'Upload .tif'}
                  </Button>
                  {cell ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 px-2"
                      aria-label={`Clear ${label}`}
                      onClick={() => onCellFile(index, null)}
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
