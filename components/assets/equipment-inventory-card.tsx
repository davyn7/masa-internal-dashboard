'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Image from 'next/image'
import { Pencil, Plus, Tag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useEquipmentAssets } from '@/hooks/use-equipment-assets'
import {
  addEquipmentMake,
  addEquipmentModel,
  updateEquipmentModel,
  type EquipmentModel,
  type UiEquipmentTypeId,
} from '@/lib/assets/equipment-api'
import { EQUIPMENT_TYPES } from '@/lib/assets/equipment-types'
import { cn } from '@/lib/utils'

const ALL = 'all'

type ModelFormState = {
  makeId: string
  name: string
  vehicleTypeId: UiEquipmentTypeId
}

function defaultModelForm(
  makeId = '',
  vehicleTypeId: UiEquipmentTypeId = 'dt',
): ModelFormState {
  return { makeId, name: '', vehicleTypeId }
}

export function EquipmentInventoryCard() {
  const { makes, models, loading, error, refresh } = useEquipmentAssets()
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [selectedMakeId, setSelectedMakeId] = useState(ALL)
  const [actionError, setActionError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [editModel, setEditModel] = useState<EquipmentModel | null>(null)
  const [editForm, setEditForm] = useState<ModelFormState>(defaultModelForm())

  const [makeDialogOpen, setMakeDialogOpen] = useState(false)
  const [makeForm, setMakeForm] = useState({ name: '' })

  const [modelDialogOpen, setModelDialogOpen] = useState(false)
  const [modelForm, setModelForm] = useState<ModelFormState>(defaultModelForm())

  const sortedMakes = useMemo(
    () => [...makes].sort((a, b) => a.name.localeCompare(b.name)),
    [makes],
  )

  const makeNameById = useMemo(() => {
    return new Map(makes.map((make) => [make.id, make.name]))
  }, [makes])

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      if (selectedTypeId && model.vehicleTypeId !== selectedTypeId) return false
      if (selectedMakeId !== ALL && model.makeId !== selectedMakeId) return false
      return true
    })
  }, [models, selectedTypeId, selectedMakeId])

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const model of models) {
      if (!model.vehicleTypeId) continue
      counts.set(
        model.vehicleTypeId,
        (counts.get(model.vehicleTypeId) ?? 0) + 1,
      )
    }
    return counts
  }, [models])

  function getMakeName(makeId: string) {
    return makeNameById.get(makeId) ?? 'Unknown make'
  }

  function getTypeLabel(typeId: string | null) {
    if (!typeId) return 'Unknown type'
    return EQUIPMENT_TYPES.find((type) => type.id === typeId)?.label ?? typeId
  }

  function openAddModelDialog() {
    setActionError(null)
    setModelForm(
      defaultModelForm(
        sortedMakes[0]?.id ?? '',
        (selectedTypeId as UiEquipmentTypeId | null) ?? 'dt',
      ),
    )
    setModelDialogOpen(true)
  }

  function openEditModelDialog(model: EquipmentModel) {
    setActionError(null)
    setEditModel(model)
    setEditForm({
      makeId: model.makeId,
      name: model.name,
      vehicleTypeId: model.vehicleTypeId ?? 'dt',
    })
  }

  async function submitMake(event: FormEvent) {
    event.preventDefault()
    const name = makeForm.name.trim()
    if (!name) return

    setSubmitting(true)
    setActionError(null)
    try {
      await addEquipmentMake(name)
      await refresh()
      setMakeDialogOpen(false)
      setMakeForm({ name: '' })
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to add make')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitModel(event: FormEvent) {
    event.preventDefault()
    const name = modelForm.name.trim()
    if (!modelForm.makeId || !name || !modelForm.vehicleTypeId) return

    setSubmitting(true)
    setActionError(null)
    try {
      await addEquipmentModel({
        name,
        makeId: modelForm.makeId,
        vehicleTypeId: modelForm.vehicleTypeId,
      })
      await refresh()
      setModelDialogOpen(false)
      setModelForm(defaultModelForm(sortedMakes[0]?.id ?? ''))
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to add model')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitEditModel(event: FormEvent) {
    event.preventDefault()
    if (!editModel) return

    const name = editForm.name.trim()
    if (!editForm.makeId || !name || !editForm.vehicleTypeId) return

    setSubmitting(true)
    setActionError(null)
    try {
      await updateEquipmentModel(editModel.id, {
        name,
        makeId: editForm.makeId,
        vehicleTypeId: editForm.vehicleTypeId,
      })
      await refresh()
      setEditModel(null)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update model')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="border-border/60 bg-card">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card">
          <CardContent className="pt-4">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-border/60 bg-card">
        <CardContent className="py-10 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button className="mt-4" size="sm" onClick={() => void refresh()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {actionError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {actionError}
        </p>
      ) : null}

      <Card className="border-border/60 bg-card">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Tag className="size-4 text-primary" aria-hidden="true" />
              <CardTitle>Equipment Inventory</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={selectedMakeId}
                onValueChange={(value) => setSelectedMakeId(value ?? ALL)}
              >
                <SelectTrigger className="w-[180px]" aria-label="Filter by make">
                  <SelectValue placeholder="Filter by make">
                    {selectedMakeId === ALL
                      ? 'All makes'
                      : getMakeName(selectedMakeId)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All makes</SelectItem>
                  {sortedMakes.map((make) => (
                    <SelectItem key={make.id} value={make.id}>
                      {make.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActionError(null)
                  setMakeDialogOpen(true)
                }}
              >
                <Plus data-icon="inline-start" />
                Add Make
              </Button>
              <Button size="sm" onClick={openAddModelDialog} disabled={sortedMakes.length === 0}>
                <Plus data-icon="inline-start" />
                Add Model
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">Filter by type</p>
            {selectedTypeId || selectedMakeId !== ALL ? (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setSelectedTypeId(null)
                  setSelectedMakeId(ALL)
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {EQUIPMENT_TYPES.map((type) => {
              const selected = selectedTypeId === type.id
              const count = typeCounts.get(type.id) ?? 0

              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() =>
                    setSelectedTypeId((current) =>
                      current === type.id ? null : type.id,
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
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {count} model{count === 1 ? '' : 's'}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card">
        <CardContent className="overflow-x-auto pt-4">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Make
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Model
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  Type
                </TableHead>
                <TableHead className="w-[120px] text-xs font-medium text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.length === 0 ? (
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-xs text-muted-foreground"
                  >
                    No equipment found for the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredModels.map((model) => (
                  <TableRow key={model.id} className="border-border/40">
                    <TableCell className="text-xs font-medium text-foreground">
                      {getMakeName(model.makeId)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {model.name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {getTypeLabel(model.vehicleTypeId)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => openEditModelDialog(model)}
                      >
                        <Pencil data-icon="inline-start" />
                        Edit row
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={editModel !== null}
        onOpenChange={(open) => {
          if (!open) setEditModel(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update equipment row</DialogTitle>
            <DialogDescription>
              Update the make, model name, and equipment type.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEditModel} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-make">Make</Label>
              <Select
                value={editForm.makeId || undefined}
                onValueChange={(value) =>
                  setEditForm((current) => ({ ...current, makeId: value }))
                }
              >
                <SelectTrigger id="edit-make" className="w-full" aria-label="Make">
                  <SelectValue placeholder="Select make">
                    {editForm.makeId ? getMakeName(editForm.makeId) : 'Select make'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sortedMakes.map((make) => (
                    <SelectItem key={make.id} value={make.id}>
                      {make.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-model-name">Model</Label>
              <Input
                id="edit-model-name"
                value={editForm.name}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={editForm.vehicleTypeId || undefined}
                onValueChange={(value) =>
                  setEditForm((current) => ({
                    ...current,
                    vehicleTypeId: value as UiEquipmentTypeId,
                  }))
                }
              >
                <SelectTrigger id="edit-type" className="w-full" aria-label="Type">
                  <SelectValue placeholder="Select equipment type">
                    {getTypeLabel(editForm.vehicleTypeId)}
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModel(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={makeDialogOpen} onOpenChange={setMakeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Make</DialogTitle>
            <DialogDescription>
              Add a new equipment make to use in the inventory table.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitMake} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="make-name">Make name</Label>
              <Input
                id="make-name"
                value={makeForm.name}
                onChange={(event) => setMakeForm({ name: event.target.value })}
                placeholder="SANY"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMakeDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                Add make
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Model</DialogTitle>
            <DialogDescription>
              Add a new model linked to a make and equipment type.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitModel} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="model-make">Make</Label>
              <Select
                value={modelForm.makeId || undefined}
                onValueChange={(value) =>
                  setModelForm((current) => ({ ...current, makeId: value }))
                }
              >
                <SelectTrigger id="model-make" className="w-full" aria-label="Model make">
                  <SelectValue placeholder="Select make">
                    {modelForm.makeId ? getMakeName(modelForm.makeId) : 'Select make'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sortedMakes.map((make) => (
                    <SelectItem key={make.id} value={make.id}>
                      {make.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="model-name">Model name</Label>
              <Input
                id="model-name"
                value={modelForm.name}
                onChange={(event) =>
                  setModelForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="SKT90S"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="model-type">Type</Label>
              <Select
                value={modelForm.vehicleTypeId || undefined}
                onValueChange={(value) =>
                  setModelForm((current) => ({
                    ...current,
                    vehicleTypeId: value as UiEquipmentTypeId,
                  }))
                }
              >
                <SelectTrigger id="model-type" className="w-full" aria-label="Model type">
                  <SelectValue placeholder="Select equipment type">
                    {getTypeLabel(modelForm.vehicleTypeId)}
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModelDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                Add model
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
