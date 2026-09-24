export type Condition = "Good" | "Fair" | "Damaged" | "Under Repair"

export const CONDITIONS: Condition[] = [
  "Good",
  "Fair",
  "Damaged",
  "Under Repair",
]

export type Category = {
  id: number
  name: string
}

export type Department = {
  id: number
  name: string
  parentId: number | null
  createdAt: string
}

export type Employee = {
  id: number
  name: string
  departmentId: number | null
  createdAt: string
}

export type Asset = {
  id: number
  categoryId: number
  name: string
  code: string
  serialNumber: string | null
  employeeId: number | null
  departmentId: number | null
  condition: Condition
  imageUrl: string | null
  docUrl: string | null
  recordDate: string
  purchaseDate: string | null
  note: string | null
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export type SimPackage = {
  id: number
  name: string
}

export type Location = {
  id: number
  code: string
  address: string | null
  detailStreetAddress: string
  latitude: number | null
  longitude: number | null
  createdAt: string
}

export type LocationInput = Omit<Location, "id" | "createdAt">

export type InternetData = {
  id: number
  internetId: string
  locationId: number | null
  detail: string | null
  service: string
  bandwidthMbps: number | null
  customerName: string
  monthlyCost: number
  paymentMethod: string | null
  createdAt: string
  updatedAt: string
}

export type InternetDataInput = Omit<
  InternetData,
  "id" | "createdAt" | "updatedAt"
>

export type SimCard = {
  id: number
  phoneNumber: string
  employeeId: number | null
  departmentId: number | null
  packageId: number | null
  clsDomestic: string | null
  clsRoaming: string | null
  note: string | null
  terminated: boolean
  createdAt: string
  updatedAt: string
}

export type AssetInput = Omit<
  Asset,
  "id" | "createdAt" | "updatedAt" | "updatedBy"
>

export type SimCardInput = Omit<SimCard, "id" | "createdAt" | "updatedAt">

export type AssetFileHistoryItem = {
  id: number
  assetId: number
  kind: string
  url: string
  fileName: string | null
  createdBy: string | null
  createdAt: string
}

export type AssetFileHistory = {
  image: AssetFileHistoryItem[]
  document: AssetFileHistoryItem[]
}

export type DepartmentNode = Department & {
  level: number
  path: string
  children: DepartmentNode[]
}

export type Role = "admin" | "guest"

export const ROLES: Role[] = ["admin", "guest"]

export type AppUser = {
  id: number
  username: string
  name: string
  role: Role
  createdAt: string
}

export type UserInput = {
  name: string
  username: string
  role: Role
  password?: string
}

export type Doc = {
  id: number
  slug: string
  title: string
  summary: string | null
  content: string
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export type DocInput = Omit<
  Doc,
  "id" | "createdAt" | "updatedAt" | "updatedBy"
>
