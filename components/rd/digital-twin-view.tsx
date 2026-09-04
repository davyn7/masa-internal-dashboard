'use client'

import { startTransition, useState } from 'react'
import { Box, Unplug } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { DigitalTwinCanvas } from '@/components/rd/digital-twin-canvas'
import {
  BLOCK_SIZE_XY_OPTIONS,
  BLOCK_SIZE_Z_OPTIONS,
  DEFAULT_BLOCK_SIZE,
  DEFAULT_TWIN_LAYERS,
  TWIN_LAYERS,
  connectDummyDigitalTwin,
  type DigitalTwinSnapshot,
  type TwinLayerId,
} from '@/lib/rd/digital-twin-dummy'

type ConnectionStatus = 'idle' | 'connecting' | 'connected'

export function DigitalTwinView() {
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [snapshot, setSnapshot] = useState<DigitalTwinSnapshot | null>(null)
  const [layers, setLayers] = useState<TwinLayerId[]>(DEFAULT_TWIN_LAYERS)
  const [blockX, setBlockX] = useState(DEFAULT_BLOCK_SIZE.x)
  const [blockY, setBlockY] = useState(DEFAULT_BLOCK_SIZE.y)
  const [blockZ, setBlockZ] = useState(DEFAULT_BLOCK_SIZE.z)

  const connected = status === 'connected' && snapshot !== null
  const showBlockSize = connected && layers.includes('blockModel')

  async function handleConnect() {
    setStatus('connecting')
    const next = await connectDummyDigitalTwin()
    setSnapshot(next)
    setStatus('connected')
  }

  function handleDisconnect() {
    setSnapshot(null)
    setStatus('idle')
    setLayers(DEFAULT_TWIN_LAYERS)
    setBlockX(DEFAULT_BLOCK_SIZE.x)
    setBlockY(DEFAULT_BLOCK_SIZE.y)
    setBlockZ(DEFAULT_BLOCK_SIZE.z)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {connected ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 text-sm">
              <span className="size-2 rounded-full bg-success" aria-hidden="true" />
              <span className="font-medium">{snapshot.site.name}</span>
              <span className="text-muted-foreground">{snapshot.site.mineral}</span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
            >
              <Unplug data-icon="inline-start" />
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={handleConnect}
            disabled={status === 'connecting'}
          >
            {status === 'connecting' ? 'Connecting…' : 'Connect'}
          </Button>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Layers</span>
          <ToggleGroup
            multiple
            value={layers}
            onValueChange={(value) => {
              startTransition(() => {
                setLayers(value as TwinLayerId[])
              })
            }}
            variant="outline"
            size="sm"
            disabled={!connected}
            aria-label="Digital twin layers"
          >
            {TWIN_LAYERS.map((layer) => (
              <ToggleGroupItem key={layer.id} value={layer.id} className="px-3">
                {layer.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {showBlockSize ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Block size
            </span>
            <BlockAxisSelect
              label="X"
              value={blockX}
              options={BLOCK_SIZE_XY_OPTIONS}
              onChange={setBlockX}
            />
            <BlockAxisSelect
              label="Y"
              value={blockY}
              options={BLOCK_SIZE_XY_OPTIONS}
              onChange={setBlockY}
            />
            <BlockAxisSelect
              label="Z"
              value={blockZ}
              options={BLOCK_SIZE_Z_OPTIONS}
              onChange={setBlockZ}
            />
          </div>
        ) : null}
      </div>

      <div className="relative h-[min(78vh,860px)] min-h-[520px] w-full overflow-hidden rounded-xl bg-[#10161c] ring-1 ring-foreground/10">
        {connected ? (
          <>
            <DigitalTwinCanvas
              snapshot={snapshot}
              showEquipment={layers.includes('equipment')}
              showBlockModel={layers.includes('blockModel')}
              showDrillHoles={layers.includes('drillHoles')}
              blockSize={{ x: blockX, y: blockY, z: blockZ }}
            />
            <TwinLegend
              showEquipment={layers.includes('equipment')}
              showGrades={
                layers.includes('blockModel') || layers.includes('drillHoles')
              }
            />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <Box className="size-9 text-muted-foreground/50" aria-hidden="true" />
            <p className="text-sm font-medium">No mine connected</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Connect to load lease boundaries and topography, then toggle
              equipment, block model, and drill holes.
            </p>
            <Button
              type="button"
              onClick={handleConnect}
              disabled={status === 'connecting'}
            >
              {status === 'connecting' ? 'Connecting…' : 'Connect'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function BlockAxisSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: number
  options: readonly number[]
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select
        value={String(value)}
        onValueChange={(next) => {
          if (next == null) return
          startTransition(() => onChange(Number(next)))
        }}
      >
        <SelectTrigger size="sm" className="w-[76px]" aria-label={`Block ${label}`}>
          <SelectValue>
            {value} m
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option} m
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function TwinLegend({
  showEquipment,
  showGrades,
}: {
  showEquipment: boolean
  showGrades: boolean
}) {
  if (!showEquipment && !showGrades) return null

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-col gap-2 rounded-lg bg-background/80 px-3 py-2 text-[11px] ring-1 ring-foreground/10 backdrop-blur-sm">
      {showEquipment ? (
        <div>
          <p className="mb-1 font-medium text-foreground">Equipment</p>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-muted-foreground">
            <LegendSwatch color="#e8a54b" label="Dump truck" />
            <LegendSwatch color="#d4c24a" label="Excavator" />
            <LegendSwatch color="#8fb56a" label="Dozer" />
            <LegendSwatch color="#6aa88a" label="Grader" />
            <LegendSwatch color="#e4eef2" label="Light vehicle" />
            <LegendSwatch color="#5aa7c4" label="Water truck" />
            <LegendSwatch color="#d07a4a" label="Fuel truck" />
            <LegendSwatch color="#7a9eaa" label="Man hauler" />
          </ul>
        </div>
      ) : null}
      {showGrades ? (
        <div>
          <p className="mb-1 font-medium text-foreground">Ni grade</p>
          <div
            className="h-2 w-36 rounded-sm"
            style={{
              background:
                'linear-gradient(90deg, #6d6458 0%, #c4a056 35%, #8fb85c 65%, #3ea88e 100%)',
            }}
          />
          <div className="mt-0.5 flex w-36 justify-between text-muted-foreground">
            <span>0.3%</span>
            <span>2.2%</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span
        className="size-2 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label}
    </li>
  )
}
