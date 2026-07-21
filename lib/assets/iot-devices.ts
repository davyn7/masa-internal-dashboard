export type IotDevice = {
  id: string
  label: string
  status: 'available' | 'assigned'
}

/** Mock inventory of IoT telematics devices. */
export const IOT_DEVICES: IotDevice[] = [
  { id: 'IOT-100101', label: 'IOT-100101 · Masa Link Pro', status: 'available' },
  { id: 'IOT-100102', label: 'IOT-100102 · Masa Link Pro', status: 'available' },
  { id: 'IOT-100103', label: 'IOT-100103 · Masa Link Pro', status: 'available' },
  { id: 'IOT-100201', label: 'IOT-100201 · Masa Link Mini', status: 'available' },
  { id: 'IOT-100202', label: 'IOT-100202 · Masa Link Mini', status: 'available' },
  { id: 'IOT-100203', label: 'IOT-100203 · Masa Link Mini', status: 'available' },
  { id: 'IOT-100301', label: 'IOT-100301 · Masa Link Heavy', status: 'available' },
  { id: 'IOT-100302', label: 'IOT-100302 · Masa Link Heavy', status: 'available' },
  { id: 'IOT-100303', label: 'IOT-100303 · Masa Link Heavy', status: 'available' },
  { id: 'IOT-100401', label: 'IOT-100401 · Masa Link Edge', status: 'available' },
  { id: 'IOT-100402', label: 'IOT-100402 · Masa Link Edge', status: 'available' },
  { id: 'IOT-100403', label: 'IOT-100403 · Masa Link Edge', status: 'available' },
  { id: 'IOT-100501', label: 'IOT-100501 · Masa Link Pro', status: 'available' },
  { id: 'IOT-100502', label: 'IOT-100502 · Masa Link Pro', status: 'available' },
  { id: 'IOT-100503', label: 'IOT-100503 · Masa Link Mini', status: 'available' },
]

export function getAvailableIotDevices(assignedDeviceIds: Iterable<string>): IotDevice[] {
  const assigned = new Set(
    [...assignedDeviceIds].map((id) => id.toUpperCase()),
  )
  return IOT_DEVICES.filter((device) => !assigned.has(device.id.toUpperCase()))
}
