import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { db } from "@/lib/server/db"

const BACKUP_NAME_PATTERN = /^reset-data-\d{8}-\d{6}\.json$/

export function backupDirectory(): string {
  return process.env.RESET_BACKUP_DIR ?? path.join(process.cwd(), "backups")
}

export function isValidBackupName(name: string): boolean {
  return BACKUP_NAME_PATTERN.test(name)
}

function timestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0")
  const day = `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
    date.getUTCDate()
  )}`
  const time = `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
    date.getUTCSeconds()
  )}`
  return `${day}-${time}`
}

export async function createResetBackup(
  by: string
): Promise<{ name: string; size: number }> {
  const payload = {
    generatedAt: new Date().toISOString(),
    by,
    tables: {
      assetFileHistory: await db.assetFileHistory.findMany(),
      asset: await db.asset.findMany(),
      simCard: await db.simCard.findMany(),
      internetData: await db.internetData.findMany(),
    },
  }

  const name = `reset-data-${timestamp(new Date())}.json`
  const directory = backupDirectory()
  await mkdir(directory, { recursive: true })

  const content = JSON.stringify(payload, null, 2)
  await writeFile(path.join(directory, name), content, "utf8")

  return { name, size: Buffer.byteLength(content) }
}
