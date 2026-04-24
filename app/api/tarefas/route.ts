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

const criarSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().optional(),
  priority: z.enum(["ALTA", "MEDIA", "BAIXA"]).nullable().optional(),
  dueAt: z.string().optional(),
  horario: horarioSchema.nullable().optional(),
  assigneeId: z.string().optional(),
})

export async function GET() {
  const session = await getSession()
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tarefasWhere =
    session.user.role === "COLABORADOR"
      ? { assigneeId: session.user.id }
      : {}

  const [tarefas, usuarios] = await Promise.all([
    prisma.task.findMany({
      where: tarefasWhere,
      include: { assignee: { select: assigneeSelect } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { ...assigneeSelect },
      orderBy: { name: "asc" },
    }),
  ])

  return Response.json({
    tarefas: tarefas.map(serializeTarefa),
    usuarios,
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = criarSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { title, description, priority, dueAt, horario, assigneeId } = parsed.data

  const tarefa = await prisma.task.create({
    data: {
      title,
      description: description ?? null,
      priority: priority ?? null,
      dueAt: dueAt ? parseDateLocal(dueAt) : null,
      horario: horario ?? null,
      assigneeId: assigneeId ?? session.user.id,
    },
    include: { assignee: { select: assigneeSelect } },
  })

  return Response.json({ tarefa: serializeTarefa(tarefa) }, { status: 201 })
}
