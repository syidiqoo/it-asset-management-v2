import { toDay } from "@/lib/server/api"

type Dated = { createdAt: Date; updatedAt?: Date }

function dates(item: Dated) {
  return {
    createdAt: toDay(item.createdAt) ?? "",
    ...(item.updatedAt ? { updatedAt: toDay(item.updatedAt) ?? "" } : {}),
  }
}

export function serializeCategory(item: { id: number; name: string }) {
  return item
}

export function serializeDepartment(item: {
  id: number
  name: string
  parentId: number | null
  createdAt: Date
}) {
  return {
    id: item.id,
    name: item.name,
    parentId: item.parentId,
    createdAt: toDay(item.createdAt) ?? "",
  }
}

export function serializeEmployee(item: {
  id: number
  name: string
  departmentId: number | null
  createdAt: Date
}) {
  return {
    id: item.id,
    name: item.name,
    departmentId: item.departmentId,
    createdAt: toDay(item.createdAt) ?? "",
  }
}

export function serializePackage(item: { id: number; name: string }) {
  return item
}

export function serializeLocation(item: {
  id: number
  code: string
  address: string
  latitude: number | null
  longitude: number | null
  createdAt: Date
}) {
  return {
    id: item.id,
    code: item.code,
    address: item.address,
    latitude: item.latitude,
    longitude: item.longitude,
    createdAt: toDay(item.createdAt) ?? "",
  }
}

export function serializeInternet(item: {
  id: number
  internetId: string
  locationId: number | null
  service: string
  bandwidthMbps: number
  customerName: string
  monthlyCost: number
  createdAt: Date
  updatedAt: Date
}) {
  return { ...item, ...dates(item) }
}

export function serializeSimCard(item: {
  id: number
  phoneNumber: string
  employeeId: number | null
  departmentId: number | null
  packageId: number | null
  clsDomestic: string | null
  clsRoaming: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return { ...item, ...dates(item) }
}

export function serializeAsset(item: {
  id: number
  categoryId: number
  name: string
  code: string
  serialNumber: string | null
  employeeId: number | null
  departmentId: number | null
  condition: string
  imageUrl: string | null
  docUrl: string | null
  recordDate: Date
  purchaseDate: Date | null
  note: string | null
  updatedBy: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...item,
    recordDate: toDay(item.recordDate) ?? "",
    purchaseDate: toDay(item.purchaseDate),
    ...dates(item),
  }
}
