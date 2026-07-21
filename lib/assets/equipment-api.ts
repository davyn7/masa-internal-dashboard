import { apiGet, apiPatch, apiPost } from '@/lib/api/client'

export type ApiVehicleType =
  | 'dt'
  | 'exca'
  | 'lv'
  | 'dozer'
  | 'grader'
  | 'water_truck'
  | 'fuel_truck'
  | 'manhauler'

export type UiEquipmentTypeId = 'dt' | 'exca' | 'lv' | 'dozer' | 'grader' | 'wt' | 'ft' | 'mh'

export type EquipmentMakeApiRecord = {
  id?: number | string
  make_id?: number | string
  name: string
}

export type EquipmentModelApiRecord = {
  id?: number | string
  model_id?: number | string
  name: string
  make_id: number | string
  vehicle_type?: ApiVehicleType | string
}

export type EquipmentMake = {
  id: string
  name: string
}

export type EquipmentModel = {
  id: string
  makeId: string
  name: string
  vehicleTypeId: UiEquipmentTypeId | null
}

const API_TO_UI: Record<ApiVehicleType, UiEquipmentTypeId> = {
  dt: 'dt',
  exca: 'exca',
  lv: 'lv',
  dozer: 'dozer',
  grader: 'grader',
  water_truck: 'wt',
  fuel_truck: 'ft',
  manhauler: 'mh',
}

const UI_TO_API: Record<UiEquipmentTypeId, ApiVehicleType> = {
  dt: 'dt',
  exca: 'exca',
  lv: 'lv',
  dozer: 'dozer',
  grader: 'grader',
  wt: 'water_truck',
  ft: 'fuel_truck',
  mh: 'manhauler',
}

function toId(value: number | string | undefined | null): string | null {
  if (value === undefined || value === null) return null
  return String(value)
}

function resolveMakeId(record: EquipmentMakeApiRecord): string | null {
  return toId(record.make_id ?? record.id)
}

function resolveModelId(record: EquipmentModelApiRecord): string | null {
  return toId(record.model_id ?? record.id)
}

export function toApiVehicleType(typeId: UiEquipmentTypeId): ApiVehicleType {
  return UI_TO_API[typeId]
}

export function fromApiVehicleType(value: string | undefined): UiEquipmentTypeId | null {
  if (!value) return null
  if (value in API_TO_UI) {
    return API_TO_UI[value as ApiVehicleType]
  }
  if (value in UI_TO_API) {
    return value as UiEquipmentTypeId
  }
  return null
}

export function mapEquipmentMake(record: EquipmentMakeApiRecord): EquipmentMake | null {
  const id = resolveMakeId(record)
  if (!id) return null
  return {
    id,
    name: record.name,
  }
}

export function mapEquipmentModel(record: EquipmentModelApiRecord): EquipmentModel | null {
  const id = resolveModelId(record)
  const makeId = toId(record.make_id)
  if (!id || !makeId) return null
  return {
    id,
    makeId,
    name: record.name,
    vehicleTypeId: fromApiVehicleType(record.vehicle_type),
  }
}

export async function fetchEquipmentMakes(): Promise<EquipmentMake[]> {
  const records = await apiGet<EquipmentMakeApiRecord[]>('/assets/makes')
  return records
    .map(mapEquipmentMake)
    .filter((make): make is EquipmentMake => make !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchEquipmentModels(): Promise<EquipmentModel[]> {
  const records = await apiGet<EquipmentModelApiRecord[]>('/assets/all_models')
  return records
    .map(mapEquipmentModel)
    .filter((model): model is EquipmentModel => model !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchEquipmentAssets(): Promise<{
  makes: EquipmentMake[]
  models: EquipmentModel[]
}> {
  const [makes, models] = await Promise.all([
    fetchEquipmentMakes(),
    fetchEquipmentModels(),
  ])
  return { makes, models }
}

export async function addEquipmentMake(name: string): Promise<void> {
  await apiPost('/assets/add_make', { name })
}

export async function addEquipmentModel(input: {
  name: string
  makeId: string
  vehicleTypeId: UiEquipmentTypeId
}): Promise<void> {
  await apiPost('/assets/add_model', {
    name: input.name,
    make_id: input.makeId,
    vehicle_type: toApiVehicleType(input.vehicleTypeId),
  })
}

export async function updateEquipmentModel(
  modelId: string,
  input: {
    name: string
    makeId: string
    vehicleTypeId: UiEquipmentTypeId
  },
): Promise<void> {
  await apiPatch(`/assets/update_model/${modelId}`, {
    name: input.name,
    make_id: input.makeId,
    vehicle_type: toApiVehicleType(input.vehicleTypeId),
  })
}
