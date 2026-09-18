import { fail, ok, prismaError, requireUser } from "@/lib/server/api"
import { db } from "@/lib/server/db"
import { serializeDepartment } from "@/lib/server/serializers"
import { departmentSchema, zodMessage } from "@/lib/server/validators"
import {
  collectDescendantIds,
  departmentSubtreeDepth,
  flattenDepartments,
  MAX_DEPARTMENT_LEVEL,
} from "@/lib/departments"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  const parsed = departmentSchema.safeParse(
    await request.json().catch(() => null)
  )
  if (!parsed.success) return fail(zodMessage(parsed.error))

  const { name, parentId } = parsed.data
  if (parentId === id) return fail("Parent department not found.", 400)

  const departments = await db.department.findMany()
  const existing = departments.find(
    (item) =>
      item.id !== id && item.name.trim().toLowerCase() === name.toLowerCase()
  )
  if (existing) return fail("Department name is already in use.", 409)

  if (parentId !== null) {
    const descendants = collectDescendantIds(departments, id)
    if (descendants.has(parentId)) return fail("Parent department not found.", 400)
    const nodes = flattenDepartments(
      departments.map((item) => ({ ...item, name: "", createdAt: "" }))
    )
    const parent = nodes.find((node) => node.id === parentId)
    if (!parent) return fail("Parent department not found.", 400)
    const depth = departmentSubtreeDepth(departments, id)
    if (parent.level + depth >= MAX_DEPARTMENT_LEVEL) {
      return fail(`Maximum ${MAX_DEPARTMENT_LEVEL} department levels.`)
    }
  }

  try {
    const item = await db.department.update({
      where: { id },
      data: { name, parentId },
    })
    return ok(serializeDepartment(item))
  } catch (error) {
    return prismaError(error, "Department could not be updated.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireUser())) return fail("Unauthorized.", 401)
  const id = Number((await params).id)
  if (!Number.isInteger(id)) return fail("Invalid id.", 400)

  if (await db.department.findFirst({ where: { parentId: id } })) {
    return fail("Still has sub-departments.", 409)
  }
  if (await db.employee.findFirst({ where: { departmentId: id } })) {
    return fail("Still used by employees.", 409)
  }
  if (await db.asset.findFirst({ where: { departmentId: id } })) {
    return fail("Still used by assets.", 409)
  }
  if (await db.simCard.findFirst({ where: { departmentId: id } })) {
    return fail("Still used by SIM cards.", 409)
  }

  try {
    await db.department.delete({ where: { id } })
    return ok({ ok: true })
  } catch (error) {
    return prismaError(error, "Department could not be deleted.")
  }
}
