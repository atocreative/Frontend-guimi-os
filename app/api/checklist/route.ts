import { getSession } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"

const SEED_ABERTURA = [
  { titulo: "Ligar sistemas e computadores", responsavel: "Gui", horario: "09:00", ordem: 1 },
  { titulo: "Verificar e-mails e mensagens do WhatsApp", responsavel: "Gui", horario: "09:05", ordem: 2 },
  { titulo: "Conferir estoque físico com o sistema", responsavel: "Ana", horario: "09:15", ordem: 3 },
  { titulo: "Organizar vitrine e expositores", responsavel: "Ana", horario: "09:20", ordem: 4 },
  { titulo: "Verificar aparelhos aguardando retirada", responsavel: "Pedro", horario: "09:15", ordem: 5 },
  { titulo: "Checar leads em aberto do dia anterior", responsavel: "Pedro", horario: "09:30", ordem: 6 },
]

const SEED_FECHAMENTO = [
  { titulo: "Registrar todas as vendas do dia no sistema", responsavel: "Gui", horario: "18:30", ordem: 1 },
  { titulo: "Conferir caixa e formas de pagamento", responsavel: "Gui", horario: "18:40", ordem: 2 },
  { titulo: "Guardar aparelhos da vitrine no cofre", responsavel: "Ana", horario: "18:45", ordem: 3 },
  { titulo: "Responder últimas mensagens do WhatsApp", responsavel: "Pedro", horario: "18:30", ordem: 4 },
  { titulo: "Desligar sistemas e câmeras", responsavel: "Gui", horario: "19:00", ordem: 5 },
]

async function seedIfEmpty() {
  const count = await prisma.checklistItem.count()
  if (count > 0) return

  await prisma.checklistItem.createMany({
    data: [
      ...SEED_ABERTURA.map((item) => ({ ...item, tipo: "ABERTURA" as const })),
      ...SEED_FECHAMENTO.map((item) => ({ ...item, tipo: "FECHAMENTO" as const })),
    ],
  })
}

export async function GET() {
  const session = await getSession()
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  await seedIfEmpty()

  const itens = await prisma.checklistItem.findMany({
    orderBy: { ordem: "asc" },
  })

  const abertura = itens.filter((i) => i.tipo === "ABERTURA")
  const fechamento = itens.filter((i) => i.tipo === "FECHAMENTO")

  return Response.json({ abertura, fechamento })
}
