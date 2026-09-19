import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import {
  seedAssets,
  seedCategories,
  seedDepartments,
  seedEmployees,
  seedInternetData,
  seedLocations,
  seedSimCards,
  seedSimPackages,
} from "../lib/mock-data"

const db = new PrismaClient()

function toDate(value: string) {
  return new Date(`${value}T00:00:00Z`)
}

async function main() {
  for (const category of seedCategories) {
    await db.category.upsert({
      where: { id: category.id },
      update: { name: category.name },
      create: { id: category.id, name: category.name },
    })
  }

  for (const department of seedDepartments) {
    await db.department.upsert({
      where: { id: department.id },
      update: { name: department.name },
      create: {
        id: department.id,
        name: department.name,
        parentId: department.parentId,
        createdAt: toDate(department.createdAt),
      },
    })
  }

  for (const employee of seedEmployees) {
    await db.employee.upsert({
      where: { id: employee.id },
      update: { name: employee.name, departmentId: employee.departmentId },
      create: {
        id: employee.id,
        name: employee.name,
        departmentId: employee.departmentId,
        createdAt: toDate(employee.createdAt),
      },
    })
  }

  for (const pkg of seedSimPackages) {
    await db.simPackage.upsert({
      where: { id: pkg.id },
      update: { name: pkg.name },
      create: { id: pkg.id, name: pkg.name },
    })
  }

  for (const location of seedLocations) {
    await db.location.upsert({
      where: { id: location.id },
      update: {
        code: location.code,
        address: location.address,
        detailStreetAddress: location.detailStreetAddress,
        latitude: location.latitude,
        longitude: location.longitude,
      },
      create: {
        id: location.id,
        code: location.code,
        address: location.address,
        detailStreetAddress: location.detailStreetAddress,
        latitude: location.latitude,
        longitude: location.longitude,
        createdAt: toDate(location.createdAt),
      },
    })
  }

  for (const item of seedInternetData) {
    await db.internetData.upsert({
      where: { id: item.id },
      update: {
        internetId: item.internetId,
        locationId: item.locationId,
        detail: item.detail,
        service: item.service,
        bandwidthMbps: item.bandwidthMbps,
        customerName: item.customerName,
        monthlyCost: item.monthlyCost,
        paymentMethod: item.paymentMethod,
      },
      create: {
        id: item.id,
        internetId: item.internetId,
        locationId: item.locationId,
        detail: item.detail,
        service: item.service,
        bandwidthMbps: item.bandwidthMbps,
        customerName: item.customerName,
        monthlyCost: item.monthlyCost,
        paymentMethod: item.paymentMethod,
        createdAt: toDate(item.createdAt),
        updatedAt: toDate(item.updatedAt),
      },
    })
  }

  for (const card of seedSimCards) {
    await db.simCard.upsert({
      where: { id: card.id },
      update: {
        phoneNumber: card.phoneNumber,
        employeeId: card.employeeId,
        departmentId: card.departmentId,
        packageId: card.packageId,
        clsDomestic: card.clsDomestic,
        clsRoaming: card.clsRoaming,
      },
      create: {
        id: card.id,
        phoneNumber: card.phoneNumber,
        employeeId: card.employeeId,
        departmentId: card.departmentId,
        packageId: card.packageId,
        clsDomestic: card.clsDomestic,
        clsRoaming: card.clsRoaming,
        createdAt: toDate(card.createdAt),
        updatedAt: toDate(card.updatedAt),
      },
    })
  }

  for (const asset of seedAssets) {
    await db.asset.upsert({
      where: { id: asset.id },
      update: {
        categoryId: asset.categoryId,
        name: asset.name,
        code: asset.code,
        serialNumber: asset.serialNumber,
        employeeId: asset.employeeId,
        departmentId: asset.departmentId,
        condition: asset.condition,
        imageUrl: asset.imageUrl,
        docUrl: asset.docUrl,
        recordDate: toDate(asset.recordDate),
        purchaseDate: asset.purchaseDate ? toDate(asset.purchaseDate) : null,
        note: asset.note,
        updatedBy: asset.updatedBy,
      },
      create: {
        id: asset.id,
        categoryId: asset.categoryId,
        name: asset.name,
        code: asset.code,
        serialNumber: asset.serialNumber,
        employeeId: asset.employeeId,
        departmentId: asset.departmentId,
        condition: asset.condition,
        imageUrl: asset.imageUrl,
        docUrl: asset.docUrl,
        recordDate: toDate(asset.recordDate),
        purchaseDate: asset.purchaseDate ? toDate(asset.purchaseDate) : null,
        note: asset.note,
        updatedBy: asset.updatedBy,
        createdAt: toDate(asset.createdAt),
        updatedAt: toDate(asset.updatedAt),
      },
    })
  }

  const username = process.env.ADMIN_USERNAME ?? "admin"
  const password = process.env.ADMIN_PASSWORD ?? "admin123"
  const name = process.env.ADMIN_NAME ?? "Admin"
  const passwordHash = await bcrypt.hash(password, 10)
  await db.user.upsert({
    where: { username },
    update: { passwordHash, name, role: "admin" },
    create: { username, passwordHash, name, role: "admin" },
  })

  await resetIdSequences()

  console.log(`Seed done. Admin: ${username}`)
}

// Seed rows use explicit ids, which leaves each table's id sequence behind the
// max id. Without this, the next auto-increment insert collides on the primary
// key. Realign every sequence after seeding.
const SEQUENCED_TABLES = [
  "Category",
  "Department",
  "Employee",
  "Asset",
  "SimPackage",
  "SimCard",
  "Location",
  "InternetData",
  "User",
  "FileBlob",
]

async function resetIdSequences() {
  for (const table of SEQUENCED_TABLES) {
    await db.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), ` +
        `(SELECT COALESCE(MAX(id), 1) FROM "${table}"), ` +
        `(SELECT COUNT(*) FROM "${table}") > 0)`
    )
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
