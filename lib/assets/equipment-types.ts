import type { StaticImageData } from 'next/image'

import dozerImage from '@/equipment/dozer.png'
import dtImage from '@/equipment/dt.png'
import excaImage from '@/equipment/exca.png'
import ftImage from '@/equipment/ft.png'
import graderImage from '@/equipment/grader.png'
import lvImage from '@/equipment/lv.png'
import mhImage from '@/equipment/mh.png'
import wtImage from '@/equipment/wt.png'

export type EquipmentType = {
  id: string
  label: string
  image: StaticImageData
}

export const EQUIPMENT_TYPES: EquipmentType[] = [
  { id: 'dt', label: 'Dump Truck', image: dtImage },
  { id: 'exca', label: 'Excavator', image: excaImage },
  { id: 'lv', label: 'Light Vehicle', image: lvImage },
  { id: 'mh', label: 'Man Hauler', image: mhImage },
  { id: 'ft', label: 'Fuel Truck', image: ftImage },
  { id: 'wt', label: 'Water Truck', image: wtImage },
  { id: 'dozer', label: 'Dozer', image: dozerImage },
  { id: 'grader', label: 'Grader', image: graderImage },
]
