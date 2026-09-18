import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeDepartment } from "@/lib/server/serializers"
import { departmentSchema, zodMessage } from "@/lib/server/validators"
import {
  departmentSubtreeDepth,
  flattenDepartments,
  MAX_DEPARTMENT_LEVEL,
} from "@/lib/departments"

export async function GET() {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const items = await db.department.findMany({ orderBy: { id: "asc" } })
  return ok(
    items.map((item) =>
      serializeDepartment({
        ...item,
        createdAt: item.createdAt,
      })
    )
  )
}

async function checkLevel(
  departments: { id: number; parentId: number | null }[],
  parentId: number | null,
  editingId?: number
): Promise<string | null> {
  if (parentId === null) return null
  const nodes = flattenDepartments(
    departments.map((item) => ({ ...item, name: "", createdAt: "" }))
  )
  const parent = nodes.find((node) => node.id === parentId)
  if (!parent) return "Parent department not found."
  const depth = editingId ? departmentSubtreeDepth(departments, editingId) : 0
  if (parent.level + depth >= MAX_DEPARTMENT_LEVEL) {
    return `Maximum ${MAX_DEPARTMENT_LEVEL} department levels.`
  }
  return null
}

export async function POST(request: Request) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const parsed = departmentSchema.safeParse(
    await request.json().catch(() => null)
  )
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const { name, parentId } = parsed.data
  const departments = await db.department.findMany()
  const existing = departments.find(
    (item) => item.name.trim().toLowerCase() === name.toLowerCase()
  )
  if (existing) return fail("Department name is already in use.", 409)

  const levelError = await checkLevel(departments, parentId)
  if (levelError) return fail(levelError)

  try {
    const item = await db.department.create({ data: { name, parentId } })
    return ok(serializeDepartment(item), 201)
  } catch (error) {
    return prismaError(error, "Department could not be created.")
  }
}
