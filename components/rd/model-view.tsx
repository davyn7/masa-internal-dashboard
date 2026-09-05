'use client'

import { useState } from 'react'
import { Mountain } from 'lucide-react'

import {
  ModelPolygonTable,
  type PolygonRow,
} from '@/components/rd/model-polygon-table'
import { ModelTerrainCanvas } from '@/components/rd/model-terrain-canvas'
import { ModelTifTable, type TifCellFile } from '@/components/rd/model-tif-table'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { parseElevationGeoTiffs } from '@/lib/rd/model-geotiff'
import {
  isPolygonType,
  parseGeoJsonFile,
  type ModelPolygonOverlay,
  type PolygonType,
} from '@/lib/rd/model-polygons'
import {
  buildElevationMosaic,
  mosaicToDemGrid,
  type ModelDemGrid,
} from '@/lib/rd/model-terrain'

type TabValue = 'data' | 'rendering'

function emptyCells(count: number): TifCellFile[] {
  return Array.from({ length: count }, () => null)
}

function newPolygonRow(): PolygonRow {
  return {
    // Only used after mount (Add another) — random is fine here.
    id: `poly-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: '',
    type: '',
    geojson: null,
  }
}

const INITIAL_POLYGON_ROWS: PolygonRow[] = [
  { id: 'poly-1', name: '', type: '', geojson: null },
]

function isCompletePolygonRow(
  row: PolygonRow,
): row is PolygonRow & {
  type: PolygonType
  geojson: { file: File; name: string }
} {
  return (
    row.name.trim().length > 0 &&
    isPolygonType(row.type) &&
    row.geojson !== null
  )
}

export function ModelView() {
  const [tab, setTab] = useState<TabValue>('data')
  const [rows, setRows] = useState(2)
  const [cols, setCols] = useState(2)
  const [cells, setCells] = useState<TifCellFile[]>(() => emptyCells(4))
  const [polygons, setPolygons] = useState<PolygonRow[]>(INITIAL_POLYGON_ROWS)
  const [rendering, setRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dem, setDem] = useState<ModelDemGrid | null>(null)
  const [overlays, setOverlays] = useState<ModelPolygonOverlay[]>([])
  const [sceneEpoch, setSceneEpoch] = useState(0)

  const hasFile = cells.some((cell) => cell !== null)

  function resizeGrid(nextRows: number, nextCols: number) {
    setRows(nextRows)
    setCols(nextCols)
    setCells((prev) => {
      const next = emptyCells(nextRows * nextCols)
      for (let r = 0; r < Math.min(rows, nextRows); r++) {
        for (let c = 0; c < Math.min(cols, nextCols); c++) {
          next[r * nextCols + c] = prev[r * cols + c] ?? null
        }
      }
      return next
    })
  }

  function onCellFile(index: number, file: File | null) {
    setCells((prev) => {
      const next = [...prev]
      next[index] = file ? { file, name: file.name } : null
      return next
    })
    setError(null)
  }

  function updatePolygon(
    id: string,
    patch: Partial<Omit<PolygonRow, 'id'>>,
  ) {
    setPolygons((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    )
    setError(null)
  }

  async function onRender() {
    const entries = cells
      .map((cell, index) =>
        cell
          ? {
              file: cell.file,
              label: `R${Math.floor(index / cols) + 1}C${(index % cols) + 1} (${cell.name})`,
            }
          : null,
      )
      .filter((entry): entry is { file: File; label: string } => entry !== null)

    if (entries.length === 0) {
      setError('Upload at least one .tif file before rendering.')
      return
    }

    setRendering(true)
    setError(null)

    try {
      const tiles = await parseElevationGeoTiffs(entries)
      const mosaic = buildElevationMosaic(tiles)
      const nextDem = mosaicToDemGrid(mosaic)

      const nextOverlays: ModelPolygonOverlay[] = []
      for (const row of polygons) {
        if (!isCompletePolygonRow(row)) continue
        try {
          const rings = await parseGeoJsonFile(row.geojson.file)
          nextOverlays.push({
            id: row.id,
            name: row.name.trim(),
            type: row.type,
            rings,
          })
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : `Failed to parse GeoJSON for "${row.name.trim()}".`
          throw new Error(message)
        }
      }

      setDem(nextDem)
      setOverlays(nextOverlays)
      setSceneEpoch((n) => n + 1)
      setTab('rendering')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to build terrain mosaic.'
      setError(message)
    } finally {
      setRendering(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (value === 'data' || value === 'rendering') setTab(value)
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList>
          <TabsTrigger value="data" className="px-3">
            Data
          </TabsTrigger>
          <TabsTrigger value="rendering" className="px-3">
            Rendering
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="data"
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto pt-2"
        >
          <ModelTifTable
            rows={rows}
            cols={cols}
            cells={cells}
            onRowsChange={(next) => resizeGrid(next, cols)}
            onColsChange={(next) => resizeGrid(rows, next)}
            onCellFile={onCellFile}
          />
          <ModelPolygonTable
            rows={polygons}
            onNameChange={(id, name) => updatePolygon(id, { name })}
            onTypeChange={(id, type) => updatePolygon(id, { type })}
            onGeoJsonFile={(id, file) =>
              updatePolygon(id, {
                geojson: file ? { file, name: file.name } : null,
              })
            }
            onAddRow={() =>
              setPolygons((prev) => [...prev, newPolygonRow()])
            }
            onRemoveRow={(id) =>
              setPolygons((prev) =>
                prev.length <= 1 ? prev : prev.filter((row) => row.id !== id),
              )
            }
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Heights are treated as EGM2008 orthometric elevations and applied
              directly as mesh elevations (no geoid-to-ellipsoid conversion).
              Polygon Y is sampled from the same TIF surface.
            </p>
            <Button
              type="button"
              className="shrink-0 self-end sm:self-auto"
              disabled={!hasFile || rendering}
              onClick={() => {
                void onRender()
              }}
            >
              {rendering ? 'Rendering…' : 'Render'}
            </Button>
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </TabsContent>

        <TabsContent
          value="rendering"
          keepMounted
          className="relative min-h-[min(70vh,720px)] flex-1 overflow-hidden rounded-md border border-border/60 pt-0"
        >
          {dem ? (
            <ModelTerrainCanvas
              dem={dem}
              overlays={overlays}
              active={tab === 'rendering'}
              sceneKey={`${sceneEpoch}-${dem.cols}x${dem.rows}-${overlays.length}`}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
              <Mountain
                className="size-8 text-muted-foreground/50"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-foreground">
                No terrain rendered yet
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Upload GeoTIFF tiles in the Data tab and click Render to stitch
                them into a 3D terrain model.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
