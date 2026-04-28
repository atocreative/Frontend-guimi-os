import { getSession } from "@/lib/auth-session"

export async function GET() {
  const session = await getSession()

  if (!session?.accessToken) {
    return Response.json(
      { error: "Sessão expirada. Faça login novamente." },
      { status: 401 }
    )
  }

  return Response.json({ token: session.accessToken })
}
