"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Plus, Users, Trash2, X, Search, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { UsuarioCard } from "@/components/configuracoes/usuario-card"
import { NovoColaboradorModal } from "@/components/usuarios/novo-colaborador-modal"
import { EditarUsuarioModal } from "@/components/configuracoes/editar-usuario-modal"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { api } from "@/lib/api-client"
import { toast } from "sonner"
import type { UsuarioSistema } from "@/types/usuarios"

const PAGE_SIZE = 10

interface UsuariosSectionProps {
  canManageUsers: boolean
  currentUserRole?: string
}

export function UsuariosSection({ canManageUsers, currentUserRole }: UsuariosSectionProps) {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioSistema | undefined>()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("TODOS")
  const [page, setPage] = useState(1)

  const carregarUsuarios = useCallback(async () => {
    setLoading(true)
    try {
      const { users } = await api.getUsers()
      setUsuarios(users)
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      toast.error("Erro ao carregar usuários")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregarUsuarios() }, [carregarUsuarios])

  const filtered = useMemo(() => {
    let list = usuarios
    if (roleFilter !== "TODOS") {
      list = list.filter((u) => u.role === roleFilter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    }
    return list
  }, [usuarios, roleFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [search, roleFilter])

  function handleCreated(usuario: UsuarioSistema) {
    setUsuarios((current) =>
      [...current, usuario].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    )
  }

  function handleEdit(usuario: UsuarioSistema) {
    setUsuarioEditando(usuario)
    setEditModalOpen(true)
  }

  function handleSaved(usuario: UsuarioSistema) {
    setUsuarios((current) => current.map((u) => (u.id === usuario.id ? usuario : u)))
  }

  function handleDeleted(usuarioId: string) {
    setUsuarios((current) => current.filter((u) => u.id !== usuarioId))
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(usuarioId); return next })
  }

  function handleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      checked ? next.add(id) : next.delete(id)
      return next
    })
  }

  function handleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(paginated.map((u) => u.id)) : new Set())
  }

  async function handleBulkDelete() {
    setBulkDeleting(true)
    try {
      const result = await api.bulkDeleteUsers(Array.from(selectedIds)) as { deleted: number }
      await carregarUsuarios()
      setSelectedIds(new Set())
      toast.success(`${result.deleted} usuário(s) excluído(s) com sucesso`)
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao excluir usuários"
      toast.error(msg)
    } finally {
      setBulkDeleting(false)
      setBulkDeleteOpen(false)
    }
  }

  const allPageSelected = paginated.length > 0 && paginated.every((u) => selectedIds.has(u.id))
  const somePageSelected = paginated.some((u) => selectedIds.has(u.id)) && !allPageSelected

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Usuários</h3>
          {!loading && (
            <span className="text-xs text-muted-foreground">
              {filtered.length === usuarios.length
                ? `${usuarios.length} cadastrados`
                : `${filtered.length} de ${usuarios.length}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={carregarUsuarios}
            disabled={loading}
            title="Recarregar"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {canManageUsers && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Novo Colaborador
            </Button>
          )}
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            <SelectItem value="SUPER_USER">Super Admin</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="GESTOR">Gerente</SelectItem>
            <SelectItem value="COLABORADOR">Colaborador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2">
          <Badge variant="outline" className="border-destructive/30 text-destructive text-xs">
            {selectedIds.size} selecionado(s)
          </Badge>
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" />
              Excluir selecionados
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setSelectedIds(new Set())}>
              <X className="h-3.5 w-3.5" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Select all (current page) */}
      {canManageUsers && !loading && paginated.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <Checkbox
            checked={allPageSelected || (somePageSelected ? "indeterminate" : false)}
            onCheckedChange={(checked) => handleSelectAll(!!checked)}
            aria-label="Selecionar todos desta página"
          />
          <span className="text-xs text-muted-foreground">Selecionar todos desta página</span>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[68px] rounded-lg" />)
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
            <Users className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
            {(search || roleFilter !== "TODOS") && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setSearch(""); setRoleFilter("TODOS") }}>
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          paginated.map((usuario) => (
            <UsuarioCard
              key={usuario.id}
              usuario={usuario}
              onEdit={canManageUsers ? handleEdit : undefined}
              onDelete={canManageUsers ? handleDeleted : undefined}
              selected={selectedIds.has(usuario.id)}
              onSelect={canManageUsers ? handleSelect : undefined}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedIds.size} usuário(s)? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleting ? "Excluindo..." : "Excluir usuários"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NovoColaboradorModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />

      {usuarioEditando && (
        <EditarUsuarioModal
          open={editModalOpen}
          usuario={usuarioEditando}
          onClose={() => { setEditModalOpen(false); setUsuarioEditando(undefined) }}
          onSaved={handleSaved}
          currentUserRole={currentUserRole}
        />
      )}
    </section>
  )
}
