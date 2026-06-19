"use client"

import { useState, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Upload, Download, FileText, Loader2, AlertCircle, Trash2,
} from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"

export interface Material {
  id: string
  name: string
  size: number
  mimeType: string
  uploadedBy: string
  uploadedAt: string
  url: string
}

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  })
}

interface Props {
  open: boolean
  onClose: () => void
  canUpload: boolean
}

export function ModalMateriais({ open, onClose, canUpload }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data, error, isLoading, mutate } = useSWR<{ data: Material[] }>(
    open ? "/api/processos/materiais" : null,
    fetcher,
    { revalidateOnFocus: false },
  )

  const materiais: Material[] = data?.data ?? []

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/processos/materiais", { method: "POST", body: fd })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      toast.success("Arquivo enviado com sucesso.")
      mutate()
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao enviar arquivo.")
    } finally {
      setUploading(false)
    }
  }, [mutate])

  const handleDelete = useCallback(async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/processos/materiais?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success(`"${name}" removido.`)
      mutate()
    } catch {
      toast.error("Erro ao remover arquivo.")
    }
  }, [mutate])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Procedimentos e Materiais
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {canUpload && (
            <div>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.mp4,.zip"
                onChange={handleUpload}
              />
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Upload className="h-3.5 w-3.5" />}
                {uploading ? "Enviando…" : "Enviar arquivo"}
              </Button>
              <p className="text-[11px] text-muted-foreground mt-1">
                PDF, Word, Excel, PowerPoint, imagens, vídeos, ZIP
              </p>
            </div>
          )}

          <div className="space-y-1.5 min-h-[120px]">
            {isLoading && (
              <>
                <Skeleton className="h-10 rounded" />
                <Skeleton className="h-10 rounded" />
              </>
            )}

            {error && !isLoading && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Não foi possível carregar os materiais.
              </div>
            )}

            {!isLoading && !error && materiais.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhum material cadastrado.
                {canUpload && " Clique em Enviar arquivo para adicionar."}
              </p>
            )}

            {materiais.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-muted/40 transition-colors"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatBytes(m.size)} · {formatDate(m.uploadedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="outline" className="text-[10px] font-normal hidden sm:flex">
                    {m.uploadedBy}
                  </Badge>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={m.name}
                  >
                    <Button size="icon" variant="ghost" className="h-7 w-7">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                  {canUpload && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-red-500"
                      onClick={() => handleDelete(m.id, m.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
