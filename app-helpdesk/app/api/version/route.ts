import { readFile, stat } from "node:fs/promises"
import { join } from "node:path"

import { fail, ok, requireUser } from "@/lib/server/api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type BuildInfo = {
  commit?: string
  buildId?: string
  builtAt?: string
}

async function readText(path: string): Promise<string | null> {
  try {
    return (await readFile(path, "utf8")).trim()
  } catch {
    return null
  }
}

export async function GET() {
  if (!(await requireUser())) return fail("Unauthorized.", 401)

  const cwd = process.cwd()
  const buildIdPath = join(cwd, ".next", "BUILD_ID")

  const buildId = await readText(buildIdPath)

  let builtAt: string | null = null
  try {
    builtAt = (await stat(buildIdPath)).mtime.toISOString()
  } catch {
    builtAt = null
  }

  let info: BuildInfo = {}
  const raw = await readText(join(cwd, ".build-info.json"))
  if (raw) {
    try {
      info = JSON.parse(raw) as BuildInfo
    } catch {
      info = {}
    }
  }

  return ok({
    commit: info.commit ?? null,
    buildId: info.buildId ?? buildId ?? null,
    builtAt: info.builtAt ?? builtAt,
    startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    environment: process.env.NODE_ENV ?? null,
  })
}
