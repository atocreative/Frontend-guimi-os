import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"

async function handlePasswordUpdate(req: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/password`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(body),
      }
    )

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })

  } catch (error) {
    console.error("[BFF PASSWORD ERROR]", error)

    return NextResponse.json(
      { error: "PASSWORD_UPDATE_FAILED" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  return handlePasswordUpdate(req)
}

export async function PATCH(req: NextRequest) {
  return handlePasswordUpdate(req)
}
