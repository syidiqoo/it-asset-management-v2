import type {
  Asset,
  Category,
  Condition,
  Department,
  DocInput,
  Employee,
  InternetData,
  Location,
  SimCard,
  SimPackage,
} from "@/lib/types"

export const ADMIN_NAME = "Admin"

export const seedCategories: Category[] = [
  { id: 1, name: "Laptop" },
  { id: 2, name: "Phone" },
  { id: 3, name: "PC" },
  { id: 4, name: "Printer" },
]

export const seedDepartments: Department[] = [
  { id: 1, name: "IT", parentId: null, createdAt: "2026-01-05" },
  { id: 2, name: "HR", parentId: null, createdAt: "2026-01-05" },
  { id: 3, name: "Finance", parentId: null, createdAt: "2026-01-05" },
  { id: 4, name: "Operations", parentId: null, createdAt: "2026-01-05" },
  { id: 5, name: "Infrastructure", parentId: 1, createdAt: "2026-01-06" },
  { id: 6, name: "Network", parentId: 5, createdAt: "2026-01-06" },
  { id: 7, name: "Base", parentId: 4, createdAt: "2026-01-07" },
  { id: 8, name: "Base Jakarta", parentId: 7, createdAt: "2026-01-07" },
  { id: 9, name: "Base Surabaya", parentId: 7, createdAt: "2026-01-07" },
  { id: 10, name: "Support", parentId: 4, createdAt: "2026-01-08" },
  { id: 11, name: "Recruitment", parentId: 2, createdAt: "2026-01-08" },
]

export const seedEmployees: Employee[] = [
  { id: 1, name: "Budi Santoso", departmentId: 5, createdAt: "2026-01-10" },
  { id: 2, name: "Siti Nurhaliza", departmentId: 2, createdAt: "2026-01-10" },
  { id: 3, name: "Agus Prasetyo", departmentId: 8, createdAt: "2026-01-11" },
  { id: 4, name: "Dewi Lestari", departmentId: 3, createdAt: "2026-01-11" },
  { id: 5, name: "Rizky Ramadhan", departmentId: 6, createdAt: "2026-01-12" },
  { id: 6, name: "Andi Wijaya", departmentId: 9, createdAt: "2026-01-12" },
  { id: 7, name: "Maya Anggraini", departmentId: 10, createdAt: "2026-01-13" },
  { id: 8, name: "Fajar Nugroho", departmentId: 5, createdAt: "2026-01-13" },
  { id: 9, name: "Putri Handayani", departmentId: 11, createdAt: "2026-01-14" },
  { id: 10, name: "Hendra Gunawan", departmentId: 4, createdAt: "2026-01-14" },
]

export const seedSimPackages: SimPackage[] = [
  { id: 1, name: "Basic 25GB" },
  { id: 2, name: "Business 50GB" },
  { id: 3, name: "Corporate 100GB" },
  { id: 4, name: "Data Only 10GB" },
]

export const seedLocations: Location[] = [
  {
    id: 1,
    code: "001",
    address: "Gedung Utama",
    detailStreetAddress:
      "Gedung Utama, Jl. Jenderal Sudirman No. 1, Jakarta Pusat, DKI Jakarta 10220",
    latitude: -6.2088,
    longitude: 106.8456,
    createdAt: "2026-01-09",
  },
  {
    id: 2,
    code: "002",
    address: "IT Warehouse",
    detailStreetAddress:
      "IT Warehouse, Jl. TB Simatupang No. 22, Jakarta Selatan, DKI Jakarta 12430",
    latitude: -6.2615,
    longitude: 106.8106,
    createdAt: "2026-01-09",
  },
  {
    id: 3,
    code: "003",
    address: "Surabaya Branch Office",
    detailStreetAddress:
      "Surabaya Branch Office, Jl. Basuki Rahmat No. 45, Surabaya 60271",
    latitude: -7.2575,
    longitude: 112.7521,
    createdAt: "2026-01-09",
  },
  {
    id: 4,
    code: "004",
    address: "Base Jakarta",
    detailStreetAddress:
      "Base Jakarta, Jl. Gatot Subroto No. 88, Jakarta Selatan, DKI Jakarta 12710",
    latitude: -6.2297,
    longitude: 106.8296,
    createdAt: "2026-01-10",
  },
  {
    id: 5,
    code: "005",
    address: "Data Center",
    detailStreetAddress:
      "Data Center, Jl. Kuningan Barat No. 10, Jakarta Selatan, DKI Jakarta 12710",
    latitude: -6.2345,
    longitude: 106.8256,
    createdAt: "2026-01-10",
  },
  {
    id: 6,
    code: "006",
    address: "Bandung Office",
    detailStreetAddress:
      "Bandung Office, Jl. Asia Afrika No. 133, Bandung 40112",
    latitude: null,
    longitude: null,
    createdAt: "2026-01-11",
  },
]

export const seedInternetData: InternetData[] = [
  {
    id: 1,
    internetId: "1001",
    locationId: 1,
    detail: "Kantor Pusat",
    service: "Fiber Optic",
    bandwidthMbps: 200,
    customerName: "PT Nusantara Jaya",
    monthlyCost: 7500000,
    paymentMethod: "Virtual Account",
    createdAt: "2026-02-15",
    updatedAt: "2026-02-15",
  },
  {
    id: 2,
    internetId: "1002",
    locationId: 1,
    detail: "Ruang Server",
    service: "Dedicated Internet",
    bandwidthMbps: 100,
    customerName: "PT Nusantara Jaya",
    monthlyCost: 12000000,
    paymentMethod: "Virtual Account",
    createdAt: "2026-02-15",
    updatedAt: "2026-02-15",
  },
  {
    id: 3,
    internetId: "1003",
    locationId: 2,
    detail: "Gudang",
    service: "Fiber Optic",
    bandwidthMbps: 100,
    customerName: "CV Mitra Abadi",
    monthlyCost: 4500000,
    paymentMethod: "Virtual Account",
    createdAt: "2026-02-16",
    updatedAt: "2026-02-16",
  },
  {
    id: 4,
    internetId: "1004",
    locationId: 3,
    detail: "Kantor Cabang",
    service: "Metro Ethernet",
    bandwidthMbps: 300,
    customerName: "PT Sinar Surabaya",
    monthlyCost: 15500000,
    paymentMethod: "Manual Transfer",
    createdAt: "2026-02-16",
    updatedAt: "2026-02-16",
  },
  {
    id: 5,
    internetId: "1005",
    locationId: 4,
    detail: "Lantai 1",
    service: "Fiber Optic",
    bandwidthMbps: 100,
    customerName: "PT Karya Bersama",
    monthlyCost: 4200000,
    paymentMethod: "Virtual Account",
    createdAt: "2026-02-17",
    updatedAt: "2026-02-17",
  },
  {
    id: 6,
    internetId: "1006",
    locationId: 4,
    detail: "Mess",
    service: "Wireless Broadband",
    bandwidthMbps: 50,
    customerName: "PT Karya Bersama",
    monthlyCost: 2750000,
    paymentMethod: "Virtual Account",
    createdAt: "2026-02-17",
    updatedAt: "2026-02-17",
  },
  {
    id: 7,
    internetId: "1007",
    locationId: 5,
    detail: "Rak Utama",
    service: "Dedicated Internet",
    bandwidthMbps: 500,
    customerName: "Data Center Internal",
    monthlyCost: 32000000,
    paymentMethod: "Virtual Account",
    createdAt: "2026-02-18",
    updatedAt: "2026-02-18",
  },
  {
    id: 8,
    internetId: "1008",
    locationId: 5,
    detail: "Rak Cadangan",
    service: "Metro Ethernet",
    bandwidthMbps: 1000,
    customerName: "Data Center Internal",
    monthlyCost: 45000000,
    paymentMethod: "Virtual Account",
    createdAt: "2026-02-18",
    updatedAt: "2026-02-18",
  },
  {
    id: 9,
    internetId: "1009",
    locationId: 6,
    detail: "Kantor",
    service: "Wireless Broadband",
    bandwidthMbps: 30,
    customerName: "Bandung Office",
    monthlyCost: 1850000,
    paymentMethod: "Manual Transfer",
    createdAt: "2026-02-19",
    updatedAt: "2026-02-19",
  },
  {
    id: 10,
    internetId: "1010",
    locationId: 2,
    detail: "Musholla",
    service: "Fiber Optic",
    bandwidthMbps: 50,
    customerName: "IT Warehouse",
    monthlyCost: 2500000,
    paymentMethod: "Virtual Account",
    createdAt: "2026-02-19",
    updatedAt: "2026-02-19",
  },
  {
    id: 11,
    internetId: "1011",
    locationId: 3,
    detail: "Hanggar",
    service: "Fiber Optic",
    bandwidthMbps: 100,
    customerName: "PT Sinar Surabaya",
    monthlyCost: 4800000,
    paymentMethod: "Virtual Account",
    createdAt: "2026-02-20",
    updatedAt: "2026-02-20",
  },
  {
    id: 12,
    internetId: "1012",
    locationId: 1,
    detail: "Pos Satpam",
    service: "Wireless Broadband",
    bandwidthMbps: 50,
    customerName: "Head Office",
    monthlyCost: 2600000,
    paymentMethod: "Virtual Account",
    createdAt: "2026-02-20",
    updatedAt: "2026-02-20",
  },
]

const baseAssets: Asset[] = [
  {
    id: 1,
    categoryId: 1,
    name: "MacBook Pro 14 M3",
    code: "AST-2026-001",
    serialNumber: "C02X1Y2Z3ABC",
    employeeId: 1,
    departmentId: 5,
    condition: "Good",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-01",
    purchaseDate: "2025-11-20",
    note: "Primary unit for the Infrastructure team.",
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-01",
    updatedAt: "2026-02-01",
  },
  {
    id: 2,
    categoryId: 1,
    name: "Dell Latitude 5420",
    code: "AST-2026-002",
    serialNumber: "DL5420-88213",
    employeeId: 2,
    departmentId: 2,
    condition: "Fair",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-01",
    purchaseDate: "2024-06-15",
    note: "Battery drains fast, needs replacement.",
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-01",
    updatedAt: "2026-02-04",
  },
  {
    id: 3,
    categoryId: 1,
    name: "ThinkPad T14 Gen 4",
    code: "AST-2026-003",
    serialNumber: "TPT14-40512",
    employeeId: 5,
    departmentId: 6,
    condition: "Good",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-02",
    purchaseDate: "2025-03-10",
    note: null,
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-02",
    updatedAt: "2026-02-02",
  },
  {
    id: 4,
    categoryId: 1,
    name: "HP EliteBook 840 G9",
    code: "AST-2026-004",
    serialNumber: "HP840-77341",
    employeeId: 8,
    departmentId: 5,
    condition: "Damaged",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-02",
    purchaseDate: "2023-09-01",
    note: "Cracked screen, awaiting vendor decision.",
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-02",
    updatedAt: "2026-02-09",
  },
  {
    id: 5,
    categoryId: 1,
    name: "Asus ExpertBook B1",
    code: "AST-2026-005",
    serialNumber: "ASB1-12098",
    employeeId: 3,
    departmentId: 8,
    condition: "Good",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-03",
    purchaseDate: "2025-07-22",
    note: null,
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-03",
    updatedAt: "2026-02-03",
  },
  {
    id: 6,
    categoryId: 2,
    name: "iPhone 13",
    code: "AST-2026-006",
    serialNumber: "AP13-55219",
    employeeId: 4,
    departmentId: 3,
    condition: "Good",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-03",
    purchaseDate: "2024-01-18",
    note: "Includes office SIM card.",
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-03",
    updatedAt: "2026-02-03",
  },
  {
    id: 7,
    categoryId: 2,
    name: "Samsung Galaxy A54",
    code: "AST-2026-007",
    serialNumber: "SGA54-31087",
    employeeId: 7,
    departmentId: 10,
    condition: "Fair",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-04",
    purchaseDate: "2023-05-30",
    note: "Body has light scratches.",
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-04",
    updatedAt: "2026-02-04",
  },
  {
    id: 8,
    categoryId: 2,
    name: "Xiaomi Redmi Note 12",
    code: "AST-2026-008",
    serialNumber: "RMN12-90412",
    employeeId: 6,
    departmentId: 9,
    condition: "Under Repair",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-04",
    purchaseDate: "2024-02-14",
    note: "Rear camera not working.",
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-04",
    updatedAt: "2026-02-11",
  },
  {
    id: 9,
    categoryId: 3,
    name: "Dell OptiPlex 7090",
    code: "AST-2026-009",
    serialNumber: "OPX7090-11823",
    employeeId: null,
    departmentId: 3,
    condition: "Good",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-05",
    purchaseDate: "2023-08-08",
    note: "Finance room workstation.",
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-05",
    updatedAt: "2026-02-05",
  },
  {
    id: 10,
    categoryId: 3,
    name: "HP ProDesk 400 G7",
    code: "AST-2026-010",
    serialNumber: "PD400-66240",
    employeeId: null,
    departmentId: 10,
    condition: "Good",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-05",
    purchaseDate: "2023-03-21",
    note: null,
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-05",
    updatedAt: "2026-02-05",
  },
  {
    id: 11,
    categoryId: 3,
    name: "Lenovo ThinkCentre M70q",
    code: "AST-2026-011",
    serialNumber: "TCM70Q-45120",
    employeeId: 9,
    departmentId: 11,
    condition: "Fair",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-06",
    purchaseDate: "2022-12-02",
    note: "Needs RAM upgrade.",
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-06",
    updatedAt: "2026-02-06",
  },
  {
    id: 12,
    categoryId: 4,
    name: "Epson L3210",
    code: "AST-2026-012",
    serialNumber: "EPL3210-22045",
    employeeId: null,
    departmentId: 2,
    condition: "Good",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-06",
    purchaseDate: "2024-04-11",
    note: "HR multifunction printer.",
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-06",
    updatedAt: "2026-02-06",
  },
  {
    id: 13,
    categoryId: 4,
    name: "Canon PIXMA G2010",
    code: "AST-2026-013",
    serialNumber: "CNG2010-71230",
    employeeId: null,
    departmentId: 8,
    condition: "Damaged",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-07",
    purchaseDate: "2022-10-19",
    note: "Printer head clogged.",
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-07",
    updatedAt: "2026-02-12",
  },
  {
    id: 14,
    categoryId: 4,
    name: "Brother HL-1210W",
    code: "AST-2026-014",
    serialNumber: "BR1210W-30984",
    employeeId: null,
    departmentId: 4,
    condition: "Good",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-07",
    purchaseDate: "2023-01-25",
    note: null,
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-07",
    updatedAt: "2026-02-07",
  },
  {
    id: 15,
    categoryId: 1,
    name: "Acer Aspire 5",
    code: "AST-2026-015",
    serialNumber: "ACR5-88120",
    employeeId: 10,
    departmentId: 4,
    condition: "Under Repair",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-08",
    purchaseDate: "2023-02-28",
    note: "Keyboard has dead keys.",
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-08",
    updatedAt: "2026-02-13",
  },
  {
    id: 16,
    categoryId: 1,
    name: "Lenovo IdeaPad 3",
    code: "AST-2026-016",
    serialNumber: "IDP3-55092",
    employeeId: null,
    departmentId: null,
    condition: "Good",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-08",
    purchaseDate: "2025-01-09",
    note: "IT warehouse stock, not yet handed over.",
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-08",
    updatedAt: "2026-02-08",
  },
  {
    id: 17,
    categoryId: 2,
    name: "Samsung Galaxy S23",
    code: "AST-2026-017",
    serialNumber: "SGS23-12045",
    employeeId: 1,
    departmentId: 5,
    condition: "Good",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-09",
    purchaseDate: "2025-05-16",
    note: null,
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-09",
    updatedAt: "2026-02-09",
  },
  {
    id: 18,
    categoryId: 4,
    name: "HP LaserJet M404dn",
    code: "AST-2026-018",
    serialNumber: "HPLJ404-90123",
    employeeId: null,
    departmentId: 5,
    condition: "Good",
    imageUrl: null,
    docUrl: null,
    recordDate: "2026-02-10",
    purchaseDate: "2024-09-03",
    note: "Floor 3 network printer.",
    updatedBy: ADMIN_NAME,
    createdAt: "2026-02-10",
    updatedAt: "2026-02-10",
  },
]

const EXTRA_ASSET_TEMPLATES = [
  { name: "Dell Latitude 5430", categoryId: 1, serialPrefix: "DL5430" },
  { name: "Lenovo ThinkPad E14", categoryId: 1, serialPrefix: "TPE14" },
  { name: "HP ProBook 450 G9", categoryId: 1, serialPrefix: "PB450" },
  { name: "Apple MacBook Air M2", categoryId: 1, serialPrefix: "MBA2" },
  { name: "iPhone 14", categoryId: 2, serialPrefix: "AP14" },
  { name: "Samsung Galaxy A34", categoryId: 2, serialPrefix: "SGA34" },
  { name: "Xiaomi Redmi Note 13", categoryId: 2, serialPrefix: "RMN13" },
  { name: "Dell OptiPlex 3000", categoryId: 3, serialPrefix: "OPX3000" },
  { name: "HP EliteDesk 800 G8", categoryId: 3, serialPrefix: "ED800" },
  { name: "Lenovo ThinkCentre M60q", categoryId: 3, serialPrefix: "TCM60Q" },
  { name: "Epson L6290", categoryId: 4, serialPrefix: "EPL6290" },
  { name: "Canon imageCLASS LBP6030", categoryId: 4, serialPrefix: "CNLBP" },
]

const EXTRA_CONDITIONS: Condition[] = [
  "Good",
  "Good",
  "Good",
  "Fair",
  "Under Repair",
  "Damaged",
]

function isoDay(offset: number) {
  const date = new Date("2026-03-01T00:00:00Z")
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

function buildExtraAssets(startId: number, count: number): Asset[] {
  const assets: Asset[] = []

  for (let index = 0; index < count; index += 1) {
    const id = startId + index
    const template = EXTRA_ASSET_TEMPLATES[index % EXTRA_ASSET_TEMPLATES.length]
    const employee = seedEmployees[index % seedEmployees.length]
    const condition = EXTRA_CONDITIONS[index % EXTRA_CONDITIONS.length]
    const recordDate = isoDay(index)

    assets.push({
      id,
      categoryId: template.categoryId,
      name: template.name,
      code: `AST-2026-${String(id).padStart(3, "0")}`,
      serialNumber: `${template.serialPrefix}-${10000 + index}`,
      employeeId: employee.id,
      departmentId: employee.departmentId,
      condition,
      imageUrl: null,
      docUrl: null,
      recordDate,
      purchaseDate: isoDay(-400 - (index % 300)),
      note: null,
      updatedBy: ADMIN_NAME,
      createdAt: recordDate,
      updatedAt: recordDate,
    })
  }

  return assets
}

export const seedAssets: Asset[] = [
  ...baseAssets,
  ...buildExtraAssets(baseAssets.length + 1, 102),
]

// Seed rows are all active and carry no note, so those fields use DB defaults.
export const seedSimCards: Omit<SimCard, "terminated" | "note">[] = [
  {
    id: 1,
    phoneNumber: "081210000001",
    employeeId: 1,
    departmentId: 5,
    packageId: 3,
    clsDomestic: "CLS Domestic 100 GB",
    clsRoaming: "CLS Roaming 10 GB",
    createdAt: "2026-02-01",
    updatedAt: "2026-02-01",
  },
  {
    id: 2,
    phoneNumber: "081210000002",
    employeeId: 3,
    departmentId: 8,
    packageId: 2,
    clsDomestic: "CLS Domestic 50 GB",
    clsRoaming: null,
    createdAt: "2026-02-01",
    updatedAt: "2026-02-01",
  },
  {
    id: 3,
    phoneNumber: "081210000003",
    employeeId: 4,
    departmentId: 3,
    packageId: 2,
    clsDomestic: "CLS Domestic 50 GB",
    clsRoaming: "CLS Roaming 5 GB",
    createdAt: "2026-02-02",
    updatedAt: "2026-02-02",
  },
  {
    id: 4,
    phoneNumber: "081210000004",
    employeeId: 6,
    departmentId: 9,
    packageId: 1,
    clsDomestic: "CLS Domestic 25 GB",
    clsRoaming: null,
    createdAt: "2026-02-02",
    updatedAt: "2026-02-02",
  },
  {
    id: 5,
    phoneNumber: "081210000005",
    employeeId: 7,
    departmentId: 10,
    packageId: 1,
    clsDomestic: "CLS Domestic 25 GB",
    clsRoaming: null,
    createdAt: "2026-02-03",
    updatedAt: "2026-02-03",
  },
  {
    id: 6,
    phoneNumber: "081210000006",
    employeeId: 5,
    departmentId: 6,
    packageId: 3,
    clsDomestic: "CLS Domestic 100 GB",
    clsRoaming: "CLS Roaming 25 GB",
    createdAt: "2026-02-03",
    updatedAt: "2026-02-03",
  },
  {
    id: 7,
    phoneNumber: "081210000007",
    employeeId: null,
    departmentId: 4,
    packageId: 4,
    clsDomestic: "CLS Domestic 10 GB",
    clsRoaming: null,
    createdAt: "2026-02-04",
    updatedAt: "2026-02-04",
  },
  {
    id: 8,
    phoneNumber: "081210000008",
    employeeId: 10,
    departmentId: 4,
    packageId: 4,
    clsDomestic: "CLS Domestic 10 GB",
    clsRoaming: null,
    createdAt: "2026-02-04",
    updatedAt: "2026-02-04",
  },
]

export const seedDocs: DocInput[] = [
  {
    slug: "topologi-internet-kantor",
    title: "Topologi Internet Kantor",
    summary:
      "Jalur koneksi internet dari ISP sampai tiap lokasi, lengkap dengan perangkat inti dan bandwidth-nya.",
    content: `## Ringkasan

Dokumen ini mencatat topologi internet kantor: jalur dari penyedia layanan sampai tiap
lokasi, perangkat yang dipakai, dan batas bandwidth-nya. Perbarui setiap kali ada
perubahan layanan.

## Sketsa Topologi

\`\`\`
ISP Utama (1 Gbps)
  |
  +-- Router Core  (MikroTik CCR2004)
        |
        +-- Switch Distribution  (Cisco CBS350)
              |
              +-- Base Jakarta   300 Mbps
              +-- Base Bandung   200 Mbps
              +-- Gudang Bekasi  100 Mbps
\`\`\`

## Daftar Layanan

| Lokasi | Layanan | Bandwidth | Biaya / bulan |
| --- | --- | --- | --- |
| Base Jakarta | Dedicated | 300 Mbps | Rp 12.000.000 |
| Base Bandung | Broadband | 200 Mbps | Rp 4.500.000 |
| Gudang Bekasi | Broadband | 100 Mbps | Rp 2.250.000 |

Angka biaya dan bandwidth di atas bisa dicocokkan dengan menu [Internet Data](/data-internet).

## Perangkat Inti

- **Router Core** — MikroTik CCR2004, dua jalur uplink.
- **Switch Distribution** — Cisco CBS350, VLAN terpisah untuk kantor dan guest.
- **Access Point** — Ubiquiti UniFi, satu SSID per lantai.

## Catatan Operasional

> Jalur cadangan memakai provider berbeda. Kegagalan satu provider tidak boleh
> memutus dua lokasi sekaligus.

## Langkah Pemeliharaan

- [x] Uji failover jalur cadangan
- [ ] Perbarui tabel bandwidth setelah upgrade
- [ ] Cek masa berlaku kontrak ISP

## Menyisipkan Diagram

Export topologi dari draw.io sebagai PNG, lalu pakai tombol **Insert image** di editor
untuk menyisipkannya sebagai gambar di dokumen ini.
`,
  },
]
