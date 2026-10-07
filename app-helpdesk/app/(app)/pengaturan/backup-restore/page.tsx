import type { Metadata } from "next"

import { BackupRestoreView } from "@/components/pengaturan/backup-restore-view"

export const metadata: Metadata = {
  title: "Backup / Restore — IT Helpdesk",
}

export default function BackupRestorePage() {
  return <BackupRestoreView />
}
