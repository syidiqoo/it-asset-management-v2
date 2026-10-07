"use client"

import * as React from "react"

import { Database, Download, RefreshCw, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { ConfirmDeleteDialog } from "@/components/pengaturan/confirm-delete-dialog"
import { RestoreDialog } from "@/components/pengaturan/restore-dialog"
import { StickyHeader } from "@/components/sticky-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RESTORE_CONFIRMATION, type DbBackupInfo } from "@/lib/db-backup"
import { formatFileSize } from "@/lib/format"

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

function formatDateTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date)
}

export function BackupRestoreView() {
  const [backups, setBackups] = React.useState<DbBackupInfo[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [pendingDelete, setPendingDelete] = React.useState<DbBackupInfo | null>(
    null
  )
  const [restoreSource, setRestoreSource] = React.useState<string | null>(null)
  const [uploadFile, setUploadFile] = React.useState<File | null>(null)
  const uploadRef = React.useRef<HTMLInputElement>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/settings/backup")
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to load backups.")
      }
      setBackups(data as DbBackupInfo[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load backups.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const createBackup = async () => {
    if (creating) return
    setCreating(true)
    try {
      const response = await fetch("/api/settings/backup", { method: "POST" })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? "Backup failed.")
      toast.success(`Backup created: ${data.name}`)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Backup failed.")
    } finally {
      setCreating(false)
    }
  }

  const openRestore = (name: string) => {
    setUploadFile(null)
    setRestoreSource(name)
  }

  const handleUpload = (file: File | undefined) => {
    if (!file) return
    setUploadFile(file)
    setRestoreSource(file.name)
  }

  const handleRestoreOpenChange = (open: boolean) => {
    if (!open) {
      setRestoreSource(null)
      setUploadFile(null)
      if (uploadRef.current) uploadRef.current.value = ""
    }
  }

  const restore = async (): Promise<string | null> => {
    if (!restoreSource) return "No backup selected."
    try {
      let response: Response
      if (uploadFile) {
        const form = new FormData()
        form.append("file", uploadFile)
        form.append("confirm", RESTORE_CONFIRMATION)
        response = await fetch("/api/settings/restore", {
          method: "POST",
          body: form,
        })
      } else {
        response = await fetch("/api/settings/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: restoreSource,
            confirm: RESTORE_CONFIRMATION,
          }),
        })
      }

      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? "Restore failed.")

      const source = restoreSource
      setRestoreSource(null)
      setUploadFile(null)
      if (uploadRef.current) uploadRef.current.value = ""
      toast.success(
        `Database restored from ${source}. Pre-restore backup: ${data.preRestoreBackup}`
      )
      await load()
      return null
    } catch (err) {
      return err instanceof Error ? err.message : "Restore failed."
    }
  }

  const remove = async (): Promise<string | null> => {
    if (!pendingDelete) return null
    const name = pendingDelete.name
    try {
      const response = await fetch(`/api/settings/backup/${name}`, {
        method: "DELETE",
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error ?? "Delete failed.")
    } catch (err) {
      return err instanceof Error ? err.message : "Delete failed."
    }
    setPendingDelete(null)
    toast.success(`Deleted ${name}`)
    await load()
    return null
  }

  const latest = backups[0]

  return (
    <div className="flex flex-col">
      <StickyHeader>
        <PageHeader
          title="Backup / Restore"
          description="Create full database backups, download or delete them, and restore the database from a backup file."
          actions={
            <>
              <input
                ref={uploadRef}
                type="file"
                accept=".dump,application/octet-stream"
                className="sr-only"
                onChange={(event) => handleUpload(event.target.files?.[0])}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => uploadRef.current?.click()}
              >
                <Upload />
                Restore from file
              </Button>
              <Button size="sm" onClick={createBackup} disabled={creating}>
                <Database />
                {creating ? "Creating…" : "Create backup"}
              </Button>
            </>
          }
        />
      </StickyHeader>

      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Database backups</CardTitle>
            <CardDescription>
              {latest
                ? `Last backup: ${formatDateTime(latest.createdAt)} (${latest.name}).`
                : "Full PostgreSQL backups stored on the server."}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="space-y-2 px-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : error ? (
              <div className="px-4">
                <Alert variant="destructive">
                  <AlertTitle>Failed to load backups</AlertTitle>
                  <AlertDescription className="flex flex-col items-start gap-3">
                    {error}
                    <Button size="sm" variant="outline" onClick={load}>
                      <RefreshCw />
                      Try again
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            ) : backups.length === 0 ? (
              <p className="px-4 text-sm text-muted-foreground">
                No backups yet. Create your first backup to get started.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.name}>
                      <TableCell className="max-w-72 truncate font-medium" title={backup.name}>
                        {backup.name}
                        {backup === latest ? (
                          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Latest
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(backup.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatFileSize(backup.size)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <a
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                            href={`/api/settings/backup/${backup.name}`}
                            download
                          >
                            <Download />
                            Download
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRestore(backup.name)}
                          >
                            <Upload />
                            Restore
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon-sm"
                            aria-label={`Delete ${backup.name}`}
                            onClick={() => setPendingDelete(backup)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={`Delete ${pendingDelete?.name}?`}
        description="The backup file will be removed from the server. This action cannot be undone."
        onConfirm={remove}
      />

      <RestoreDialog
        open={restoreSource !== null}
        onOpenChange={handleRestoreOpenChange}
        source={restoreSource ?? ""}
        onConfirm={restore}
      />
    </div>
  )
}
