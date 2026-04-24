import { NextRequest } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { serializeTarefa } from "@/lib/tarefas"

const assigneeSelect = {
  id: true,
  name: true,
  avatarUrl: true,
  role: true,
  jobTitle: true,
} as const

const horarioSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário inválido")

function parseDateLocal(dateStr: string): Date {
  return new Date(dateStr + "T12:00:00.000Z")
}

const atualizarSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"]).optional(),
  priority: z.enum(["ALTA", "MEDIA", "BAIXA"]).nullable().optional(),
  dueAt: z.string().nullable().optional(),
  horario: horarioSchema.nullable().optional(),
  assigneeId: z.string().nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params

  if (session.user.role === "COLABORADOR") {
    const existing = await prisma.task.findUnique({ where: { id } })
    if (!existing || existing.assigneeId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const body = await req.json()
  const parsed = atualizarSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { status, dueAt, horario, ...rest } = parsed.data

  const tarefa = await prisma.task.update({
    where: { id },
    data: {
      ...rest,
      ...(status !== undefined && { status }),
      ...(status === "CONCLUIDA"
        ? { completedAt: new Date() }
        : status !== undefined
          ? { completedAt: null }
          : {}),
      ...(dueAt !== undefined && {
        dueAt: dueAt ? parseDateLocal(dueAt) : null,
      }),
      ...(horario !== undefined && { horario }),
    },
    include: { assignee: { select: assigneeSelect } },
  })

  return Response.json({ tarefa: serializeTarefa(tarefa) })
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params

  if (session.user.role === "COLABORADOR") {
    const existing = await prisma.task.findUnique({ where: { id } })
    if (!existing || existing.assigneeId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  await prisma.task.delete({ where: { id } })

  return new Response(null, { status: 204 })
}
