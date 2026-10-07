export const RESET_CONFIRMATION = "REMOVE ALL DATA"

export type ResetDataDeleted = {
  assetFileHistory: number
  asset: number
  simCard: number
  internetData: number
}

export type ResetDataResult = {
  deleted: ResetDataDeleted
  backupName: string
  backupSize: number
}
