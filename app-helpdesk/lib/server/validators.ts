import { z } from "zod"
import { normalizeInternetId, validateInternetId } from "@/lib/internet"
import {
  normalizeLocationCode,
  validateLocationCode,
} from "@/lib/locations"

export const conditionSchema = z.enum([
  "Good",
  "Fair",
  "Damaged",
  "Under Repair",
])

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
})

export const departmentSchema = z.object({
  name: z.string().trim().min(1, "Department name is required."),
  parentId: z.number().int().positive().nullable(),
})

export const employeeSchema = z.object({
  name: z.string().trim().min(1, "Employee name is required."),
  departmentId: z.number().int().positive().nullable(),
})

export const packageSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
})

export const locationSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Code is required.")
    .refine((value) => !validateLocationCode(value), {
      message: "Code must be numeric 1–100.",
    })
    .transform(normalizeLocationCode),
  address: z.string().trim().min(1, "Address is required."),
  detailStreetAddress: z
    .string()
    .trim()
    .min(1, "Detail street address is required."),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
})

export const internetSchema = z.object({
  internetId: z
    .string()
    .trim()
    .min(1, "Internet ID is required.")
    .refine((value) => !validateInternetId(value), {
      message: "Internet ID is invalid.",
    })
    .transform(normalizeInternetId),
  locationId: z.number().int().positive(),
  service: z.string().trim().min(1, "Service is required."),
  bandwidthMbps: z.number().positive("Bandwidth must be greater than 0."),
  customerName: z.string().trim().min(1, "Customer name is required."),
  monthlyCost: z.number().min(0, "Monthly cost cannot be negative."),
})

export const simCardSchema = z.object({
  phoneNumber: z.string().trim().min(1, "Phone Number is required."),
  employeeId: z.number().int().positive().nullable(),
  departmentId: z.number().int().positive().nullable(),
  packageId: z.number().int().positive().nullable(),
  clsDomestic: z.string().trim().min(1).nullable().optional(),
  clsRoaming: z.string().trim().min(1).nullable().optional(),
})

export const assetSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().trim().min(1, "Asset name is required."),
  code: z.string().trim().min(1, "Code is required."),
  serialNumber: z.string().trim().min(1).nullable().optional(),
  employeeId: z.number().int().positive().nullable(),
  departmentId: z.number().int().positive().nullable(),
  condition: conditionSchema,
  imageUrl: z.string().trim().min(1).nullable().optional(),
  docUrl: z.string().trim().min(1).nullable().optional(),
  purchaseDate: z.string().trim().min(1).nullable().optional(),
  note: z.string().trim().min(1).nullable().optional(),
})

export function zodMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input."
}

export const importRowsSchema = z.object({
  rows: z.array(z.array(z.string())).min(1, "CSV rows are required."),
})
