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
  address: string | null
  detailStreetAddress: string
  latitude: number | null
  longitude: number | null
  createdAt: Date
}) {
  return {
    id: item.id,
    code: item.code,
    address: item.address,
    detailStreetAddress: item.detailStreetAddress,
    latitude: item.latitude,
    longitude: item.longitude,
    createdAt: toDay(item.createdAt) ?? "",
  }
}

export function serializeUser(item: {
  id: number
  username: string
  name: string
  role: string
  createdAt: Date
}) {
  return {
    id: item.id,
    username: item.username,
    name: item.name,
    role: item.role === "guest" ? "guest" : "admin",
    createdAt: toDay(item.createdAt) ?? "",
  }
}

export function serializeInternet(item: {
  id: number
  internetId: string
  locationId: number | null
  detail: string | null
  service: string
  bandwidthMbps: number | null
  customerName: string
  monthlyCost: number
  paymentMethod: string | null
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
  note: string | null
  terminated: boolean
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

export function serializeDoc(item: {
  id: number
  slug: string
  title: string
  summary: string | null
  content: string
  updatedBy: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return { ...item, ...dates(item) }
}

export function serializeAssetFileHistory(item: {
  id: number
  assetId: number
  kind: string
  url: string
  fileName: string | null
  createdBy: string | null
  createdAt: Date
}) {
  return { ...item, createdAt: toDay(item.createdAt) ?? "" }
}
