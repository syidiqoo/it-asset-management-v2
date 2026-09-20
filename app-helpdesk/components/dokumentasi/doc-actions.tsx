"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

import { ConfirmDeleteDialog } from "@/components/pengaturan/confirm-delete-dialog"
import { Button } from "@/components/ui/button"

export function DocDeleteButton({ id, title }: { id: number; title: string }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  const remove = async () => {
    const response = await fetch(`/api/docs/${id}`, { method: "DELETE" })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      return (data?.error as string) ?? "Delete failed."
    }

    router.push("/dokumentasi")
    router.refresh()
    return null
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Trash2 />
        Delete
      </Button>
      <ConfirmDeleteDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete document"
        description={
          <>
            Dokumen <span className="font-medium">{title}</span> akan dihapus
            permanen. Tindakan ini tidak bisa dibatalkan.
          </>
        }
        onConfirm={remove}
      />
    </>
  )
}
