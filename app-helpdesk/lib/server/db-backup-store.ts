import { mkdir, readdir, stat, unlink } from "node:fs/promises"
import path from "node:path"

import { BACKUP_EXTENSION, type DbBackupInfo } from "@/lib/db-backup"
import { runPgDump } from "@/lib/server/pg-tools"
import { backupDirectory } from "@/lib/server/reset-backup"

const NAME_PATTERN = /^(backup|pre-restore)-\d{8}-\d{6}\.dump$/

export function isValidBackupName(name: string): boolean {
  return NAME_PATTERN.test(name)
}

export function backupFilePath(name: string): string {
  return path.join(backupDirectory(), path.basename(name))
}

function timestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0")
  const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
    date.getDate()
  )}`
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(
    date.getSeconds()
  )}`
  return `${day}-${time}`
}

export async function listBackups(): Promise<DbBackupInfo[]> {
  const dir = backupDirectory()
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return []
  }

  const items: DbBackupInfo[] = []
  for (const entry of entries) {
    if (!entry.endsWith(BACKUP_EXTENSION) || !isValidBackupName(entry)) continue
    const info = await stat(path.join(dir, entry))
    items.push({
      name: entry,
      size: info.size,
      createdAt: info.mtime.toISOString(),
    })
  }

  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createBackup(
  prefix: "backup" | "pre-restore"
): Promise<DbBackupInfo> {
  const dir = backupDirectory()
  await mkdir(dir, { recursive: true })

  const name = `${prefix}-${timestamp(new Date())}${BACKUP_EXTENSION}`
  const file = path.join(dir, name)
  await runPgDump(file)

  const info = await stat(file)
  return { name, size: info.size, createdAt: info.mtime.toISOString() }
}

export async function deleteBackup(name: string): Promise<void> {
  await unlink(backupFilePath(name))
}
