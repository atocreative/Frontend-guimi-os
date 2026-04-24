import bcrypt from "bcryptjs"
import { z } from "zod"
import { getSession } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"

const usuarioSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  jobTitle: true,
  active: true,
  createdAt: true,
} as const

const criarUsuarioSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório"),
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  jobTitle: z.string().trim().min(1, "Cargo obrigatório"),
  role: z.enum(["COLABORADOR", "GESTOR"]),
})

export async function GET() {
  const session = await getSession()
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role === "COLABORADOR") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: usuarioSelect,
    })

    return Response.json({
      usuarios: user
        ? [{ ...user, createdAt: user.createdAt.toISOString() }]
        : [],
    })
  }

  const usuarios = await prisma.user.findMany({
    where: { active: true },
    select: usuarioSelect,
    orderBy: { name: "asc" },
  })

  return Response.json({
    usuarios: usuarios.map((usuario) => ({
      ...usuario,
      createdAt: usuario.createdAt.toISOString(),
    })),
  })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = criarUsuarioSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, password, role, jobTitle } = parsed.data
  const emailNormalizado = email.toLowerCase()

  const existente = await prisma.user.findUnique({
    where: { email: emailNormalizado },
    select: { id: true },
  })

  if (existente) {
    return Response.json(
      { error: "Já existe um usuário cadastrado com este email." },
      { status: 409 }
    )
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const usuario = await prisma.user.create({
    data: {
      name,
      email: emailNormalizado,
      password: passwordHash,
      role,
      jobTitle,
    },
    select: usuarioSelect,
  })

  return Response.json(
    {
      usuario: {
        ...usuario,
        createdAt: usuario.createdAt.toISOString(),
      },
    },
    { status: 201 }
  )
}
