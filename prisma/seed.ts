import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const senhaPadraoHash = await bcrypt.hash("guimicell2026", 10)

  await prisma.user.upsert({
    where: { email: "joao@guimicell.com.br" },
    update: {
      name: "João",
      password: senhaPadraoHash,
      role: "COLABORADOR",
      jobTitle: "Consultor Comercial",
      active: true,
    },
    create: {
      name: "João",
      email: "joao@guimicell.com.br",
      password: senhaPadraoHash,
      role: "COLABORADOR",
      jobTitle: "Consultor Comercial",
      active: true,
    },
  })

  await prisma.user.upsert({
    where: { email: "pedro@guimicell.com.br" },
    update: {
      name: "Pedro",
      password: senhaPadraoHash,
      role: "COLABORADOR",
      jobTitle: "Consultor Comercial",
      active: true,
    },
    create: {
      name: "Pedro",
      email: "pedro@guimicell.com.br",
      password: senhaPadraoHash,
      role: "COLABORADOR",
      jobTitle: "Consultor Comercial",
      active: true,
    },
  })

  const gui = await prisma.user.findUnique({
    where: { email: "gui@guimicell.com.br" },
  })

  if (!gui) {
    console.error("Usuário gui@guimicell.com.br não encontrado. Execute o seed de usuários primeiro.")
    process.exit(1)
  }

  console.log(`Criando tarefas para ${gui.name} (${gui.id})...`)

  await prisma.task.createMany({
    data: [
      {
        title: "Responder proposta cliente VIP",
        description: "João Silva aguarda retorno sobre iPhone 15 Pro Max 256GB",
        status: "PENDENTE",
        priority: "ALTA",
        dueAt: new Date(),
        horario: "09:30",
        assigneeId: gui.id,
      },
      {
        title: "Revisar fechamento financeiro de março",
        description: "Conferir entradas e saídas com extrato do banco",
        status: "EM_ANDAMENTO",
        priority: "ALTA",
        dueAt: new Date(),
        horario: "11:00",
        assigneeId: gui.id,
      },
      {
        title: "Publicar conteúdo no Instagram",
        description: "Stories com novos aparelhos em estoque",
        status: "PENDENTE",
        priority: null,
        dueAt: new Date(),
        horario: "15:30",
        assigneeId: gui.id,
      },
    ],
    skipDuplicates: true,
  })

  const count = await prisma.task.count({ where: { assigneeId: gui.id } })
  console.log(`✓ ${count} tarefas no banco para ${gui.name}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
