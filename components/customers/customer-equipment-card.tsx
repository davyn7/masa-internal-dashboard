'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Image from 'next/image'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EQUIPMENT_TYPES } from '@/lib/assets/equipment-types'
import { getAvailableIotDevices } from '@/lib/assets/iot-devices'
import type {
  CustomerEquipmentCount,
  CustomerEquipmentUnit,
} from '@/lib/customers/individual'
import { cn } from '@/lib/utils'

const UNIT_PREFIX: Record<string, string> = {
  dt: 'DT',
  exca: 'EX',
  lv: 'LV',
  mh: 'MH',
  ft: 'FT',
  wt: 'WT',
  dozer: 'DZ',
  grader: 'GR',
}

function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function deriveCounts(
  units: CustomerEquipmentUnit[],
): CustomerEquipmentCount[] {
  const byType = new Map<string, { total: number; installed: number }>()

  for (const unit of units) {
    const current = byType.get(unit.equipmentTypeId) ?? {
      total: 0,
      installed: 0,
    }
    current.total += 1
    if (unit.deviceId) current.installed += 1
    byType.set(unit.equipmentTypeId, current)
  }

  return EQUIPMENT_TYPES.map((type) => {
    const counts = byType.get(type.id)
    if (!counts) return null
    return {
      id: type.id,
      label: type.label,
      image: type.image,
      totalUnits: counts.total,
      iotInstalled: counts.installed,
    }
  }).filter((item): item is CustomerEquipmentCount => item !== null)
}

function nextUnitId(
  equipmentTypeId: string,
  units: CustomerEquipmentUnit[],
): string {
  const prefix = UNIT_PREFIX[equipmentTypeId] ?? equipmentTypeId.toUpperCase()
  const existing = units
    .filter((unit) => unit.equipmentTypeId === equipmentTypeId)
    .map((unit) => {
      const match = unit.unitId.match(/(\d+)$/)
      return match ? Number(match[1]) : 0
    })
  const next = (existing.length > 0 ? Math.max(...existing) : 0) + 1
  return `${prefix}-${String(next).padStart(3, '0')}`
}

export function CustomerEquipmentCard({
  equipmentUnits: initialUnits,
}: {
  equipmentUnits: CustomerEquipmentUnit[]
}) {
  const [units, setUnits] = useState(initialUnits)
  const [filterTypeId, setFilterTypeId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [installUnit, setInstallUnit] = useState<CustomerEquipmentUnit | null>(
    null,
  )

  const [addForm, setAddForm] = useState({
    equipmentTypeId: '',
    unitId: '',
    manufacturer: '',
    model: '',
    iotInstalled: false,
    deviceId: '',
    installationDate: '',
  })
  const [installForm, setInstallForm] = useState({
    deviceId: '',
    installationDate: '',
  })

  const counts = useMemo(() => deriveCounts(units), [units])

  const assignedDeviceIds = useMemo(
    () =>
      units
        .map((unit) => unit.deviceId)
        .filter((id): id is string => Boolean(id)),
    [units],
  )

  const availableIotDevices = useMemo(
    () => getAvailableIotDevices(assignedDeviceIds),
    [assignedDeviceIds],
  )

  const selectedEquipmentLabel =
    EQUIPMENT_TYPES.find((type) => type.id === addForm.equipmentTypeId)
      ?.label ?? 'Select equipment type'

  const selectedAddDeviceLabel =
    availableIotDevices.find((device) => device.id === addForm.deviceId)
      ?.label ?? 'Select IoT device'

  const installDeviceOptions = useMemo(() => {
    if (!installUnit?.deviceId) return availableIotDevices
    const current = getAvailableIotDevices(
      assignedDeviceIds.filter((id) => id !== installUnit.deviceId),
    )
    const alreadyListed = current.some(
      (device) => device.id === installUnit.deviceId,
    )
    if (alreadyListed || !installUnit.deviceId) return current
    return [
      {
        id: installUnit.deviceId,
        label: installUnit.deviceId,
        status: 'assigned' as const,
      },
      ...current,
    ]
  }, [availableIotDevices, assignedDeviceIds, installUnit])

  const selectedInstallDeviceLabel =
    installDeviceOptions.find((device) => device.id === installForm.deviceId)
      ?.label ?? 'Select IoT device'

  const filteredUnits = useMemo(() => {
    const list = filterTypeId
      ? units.filter((unit) => unit.equipmentTypeId === filterTypeId)
      : units
    return [...list].sort((a, b) => {
      const typeCmp = a.equipmentLabel.localeCompare(b.equipmentLabel)
      if (typeCmp !== 0) return typeCmp
      return a.unitId.localeCompare(b.unitId)
    })
  }, [units, filterTypeId])

  function openAddDialog() {
    const defaultType = filterTypeId ?? EQUIPMENT_TYPES[0]?.id ?? ''
    setAddForm({
      equipmentTypeId: defaultType,
      unitId: defaultType ? nextUnitId(defaultType, units) : '',
      manufacturer: '',
      model: '',
      iotInstalled: false,
      deviceId: '',
      installationDate: '',
    })
    setAddOpen(true)
  }

  function onAddTypeChange(equipmentTypeId: string | null) {
    if (!equipmentTypeId) return
    setAddForm((prev) => ({
      ...prev,
      equipmentTypeId,
      unitId: nextUnitId(equipmentTypeId, units),
    }))
  }

  function submitAddEquipment(event: FormEvent) {
    event.preventDefault()
    const type = EQUIPMENT_TYPES.find((t) => t.id === addForm.equipmentTypeId)
    if (
      !type ||
      !addForm.unitId.trim() ||
      !addForm.manufacturer.trim() ||
      !addForm.model.trim()
    ) {
      return
    }

    if (addForm.iotInstalled) {
      if (!addForm.deviceId || !addForm.installationDate) return
    }

    const newUnit: CustomerEquipmentUnit = {
      id: `local-${Date.now()}`,
      equipmentTypeId: type.id,
      equipmentLabel: type.label,
      unitId: addForm.unitId.trim().toUpperCase(),
      manufacturer: addForm.manufacturer.trim(),
      model: addForm.model.trim(),
      deviceId: addForm.iotInstalled ? addForm.deviceId : null,
      installationDate: addForm.iotInstalled ? addForm.installationDate : null,
    }

    setUnits((prev) => [...prev, newUnit])
    setAddOpen(false)
  }

  function openInstallDialog(unit: CustomerEquipmentUnit) {
    setInstallUnit(unit)
    setInstallForm({
      deviceId: unit.deviceId ?? '',
      installationDate: unit.installationDate ?? '',
    })
  }

  function submitInstallRecord(event: FormEvent) {
    event.preventDefault()
    if (!installUnit) return
    if (!installForm.deviceId || !installForm.installationDate) return

    setUnits((prev) =>
      prev.map((unit) =>
        unit.id === installUnit.id
          ? {
              ...unit,
              deviceId: installForm.deviceId,
              installationDate: installForm.installationDate,
            }
          : unit,
      ),
    )
    setInstallUnit(null)
  }

  return (
    <div className="flex flex-col gap-4" aria-label="Equipment">
      <Card className="border-border/60 bg-card">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">Fleet units</p>
              {filterTypeId ? (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setFilterTypeId(null)}
                >
                  Clear filter
                </Button>
              ) : null}
            </div>
            <Button size="sm" onClick={openAddDialog}>
              <Plus data-icon="inline-start" />
              Add Equipment
            </Button>
          </div>

          {counts.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No equipment assigned to this customer.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {counts.map((type) => {
                const selected = filterTypeId === type.id
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() =>
                      setFilterTypeId((prev) =>
                        prev === type.id ? null : type.id,
                      )
                    }
                    aria-pressed={selected}
                    className={cn(
                      'group flex flex-col items-center gap-2 rounded-lg border bg-muted/30 p-3 text-left transition-colors hover:border-primary/30 hover:bg-muted/50',
                      selected
                        ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border/50',
                    )}
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
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card">
        <CardContent className="overflow-x-auto pt-4">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Equipment
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Unit ID
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Manufacturer
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Model
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Device ID
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Installation Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.length === 0 ? (
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-xs text-muted-foreground"
                  >
                    No equipment units
                    {filterTypeId ? ' for this type' : ''}.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUnits.map((unit) => {
                  const installed = Boolean(unit.deviceId && unit.installationDate)
                  return (
                    <TableRow key={unit.id} className="border-border/40">
                      <TableCell className="text-xs font-medium text-foreground">
                        {unit.equipmentLabel}
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums text-foreground">
                        {unit.unitId}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {unit.manufacturer}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {unit.model}
                      </TableCell>
                      {installed ? (
                        <>
                          <TableCell className="font-mono text-xs tabular-nums text-foreground">
                            {unit.deviceId}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums text-foreground">
                            {formatDate(unit.installationDate!)}
                          </TableCell>
                        </>
                      ) : (
                        <TableCell colSpan={2}>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => openInstallDialog(unit)}
                          >
                            Edit installation record
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Equipment</DialogTitle>
            <DialogDescription>
              Register a new unit for this customer site.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitAddEquipment} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-equipment-type">Equipment</Label>
              <Select
                value={addForm.equipmentTypeId || undefined}
                onValueChange={onAddTypeChange}
              >
                <SelectTrigger
                  id="add-equipment-type"
                  className="w-full"
                  aria-label="Equipment type"
                >
                  <SelectValue placeholder="Select equipment type">
                    {selectedEquipmentLabel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-unit-id">Unit ID</Label>
              <Input
                id="add-unit-id"
                value={addForm.unitId}
                onChange={(event) =>
                  setAddForm((prev) => ({
                    ...prev,
                    unitId: event.target.value,
                  }))
                }
                placeholder="DT-001"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-manufacturer">Manufacturer</Label>
              <Input
                id="add-manufacturer"
                value={addForm.manufacturer}
                onChange={(event) =>
                  setAddForm((prev) => ({
                    ...prev,
                    manufacturer: event.target.value,
                  }))
                }
                placeholder="Caterpillar"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-model">Model</Label>
              <Input
                id="add-model"
                value={addForm.model}
                onChange={(event) =>
                  setAddForm((prev) => ({
                    ...prev,
                    model: event.target.value,
                  }))
                }
                placeholder="777G"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-iot-installed">Installed with IoT?</Label>
              <Select
                value={addForm.iotInstalled ? 'yes' : 'no'}
                onValueChange={(value) => {
                  const iotInstalled = value === 'yes'
                  setAddForm((prev) => ({
                    ...prev,
                    iotInstalled,
                    deviceId: iotInstalled ? prev.deviceId : '',
                    installationDate: iotInstalled ? prev.installationDate : '',
                  }))
                }}
              >
                <SelectTrigger
                  id="add-iot-installed"
                  className="w-full"
                  aria-label="Installed with IoT"
                >
                  <SelectValue>
                    {addForm.iotInstalled ? 'Yes' : 'No'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {addForm.iotInstalled ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="add-device-id">IoT Device</Label>
                  <Select
                    value={addForm.deviceId || undefined}
                    onValueChange={(value) => {
                      if (!value) return
                      setAddForm((prev) => ({ ...prev, deviceId: value }))
                    }}
                  >
                    <SelectTrigger
                      id="add-device-id"
                      className="w-full"
                      aria-label="IoT device"
                    >
                      <SelectValue placeholder="Select IoT device">
                        {addForm.deviceId
                          ? selectedAddDeviceLabel
                          : 'Select IoT device'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableIotDevices.length === 0 ? (
                        <SelectItem value="__none" disabled>
                          No available devices
                        </SelectItem>
                      ) : (
                        availableIotDevices.map((device) => (
                          <SelectItem key={device.id} value={device.id}>
                            {device.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="add-install-date">Installation Date</Label>
                  <Input
                    id="add-install-date"
                    type="date"
                    value={addForm.installationDate}
                    onChange={(event) =>
                      setAddForm((prev) => ({
                        ...prev,
                        installationDate: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Equipment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={installUnit !== null}
        onOpenChange={(open) => {
          if (!open) setInstallUnit(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit installation record</DialogTitle>
            <DialogDescription>
              {installUnit
                ? `Link an IoT device to ${installUnit.unitId} (${installUnit.equipmentLabel}).`
                : 'Link an IoT device to this unit.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitInstallRecord} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="install-device-id">IoT Device</Label>
              <Select
                value={installForm.deviceId || undefined}
                onValueChange={(value) => {
                  if (!value) return
                  setInstallForm((prev) => ({ ...prev, deviceId: value }))
                }}
              >
                <SelectTrigger
                  id="install-device-id"
                  className="w-full"
                  aria-label="IoT device"
                >
                  <SelectValue placeholder="Select IoT device">
                    {installForm.deviceId
                      ? selectedInstallDeviceLabel
                      : 'Select IoT device'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {installDeviceOptions.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No available devices
                    </SelectItem>
                  ) : (
                    installDeviceOptions.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="install-date">Installation Date</Label>
              <Input
                id="install-date"
                type="date"
                value={installForm.installationDate}
                onChange={(event) =>
                  setInstallForm((prev) => ({
                    ...prev,
                    installationDate: event.target.value,
                  }))
                }
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInstallUnit(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Save installation</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
