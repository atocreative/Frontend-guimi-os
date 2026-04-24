import { NextRequest } from "next/server"
import { getSession } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await ctx.params

  const item = await prisma.checklistItem.findUnique({ where: { id } })
  if (!item) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const updated = await prisma.checklistItem.update({
    where: { id },
    data: { concluido: !item.concluido },
  })

  return Response.json({ item: updated })
}
