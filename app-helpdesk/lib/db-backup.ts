export const RESTORE_CONFIRMATION = "RESTORE DATABASE"
export const BACKUP_EXTENSION = ".dump"

export type DbBackupInfo = {
  name: string
  size: number
  createdAt: string
}
