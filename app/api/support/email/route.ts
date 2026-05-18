import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { z } from "zod"

const schema = z.object({
  nome: z.string().min(1).max(120),
  email: z.string().email().max(254),
  assunto: z.string().min(1).max(200),
  mensagem: z.string().min(1).max(5000),
})

// Mapa IP → timestamps para anti-spam simples (em memória, por processo)
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minuto
const RATE_LIMIT_MAX = 3

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (rateLimitMap.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  )
  if (timestamps.length >= RATE_LIMIT_MAX) return true
  timestamps.push(now)
  rateLimitMap.set(ip, timestamps)
  return false
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um minuto e tente novamente." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { nome, email, assunto, mensagem } = parsed.data

  const supportEmail = process.env.SUPPORT_EMAIL
  const supportPassword = process.env.SUPPORT_EMAIL_PASSWORD

  if (!supportEmail || !supportPassword) {
    console.error("[support/email] SUPPORT_EMAIL ou SUPPORT_EMAIL_PASSWORD não configurados.")
    return NextResponse.json(
      { error: "Serviço de e-mail não configurado." },
      { status: 503 }
    )
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: supportEmail,
      pass: supportPassword,
    },
  })

  const dataFormatada = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  })

  try {
    await transporter.sendMail({
      from: `"GuimiCell OS Suporte" <${supportEmail}>`,
      to: supportEmail,
      replyTo: email,
      subject: `[GuimiCell OS] Novo chamado de suporte — ${assunto}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#0f42f2">Novo chamado de suporte</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px;font-weight:bold;color:#555">Nome</td><td style="padding:8px">${nome}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;color:#555">E-mail</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:8px;font-weight:bold;color:#555">Data</td><td style="padding:8px">${dataFormatada}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;color:#555">Assunto</td><td style="padding:8px">${assunto}</td></tr>
          </table>
          <h3 style="color:#555;margin-top:24px">Mensagem</h3>
          <div style="background:#f5f5f5;padding:16px;border-radius:8px;white-space:pre-wrap">${mensagem}</div>
          <hr style="margin-top:32px;border:none;border-top:1px solid #eee"/>
          <p style="font-size:12px;color:#aaa">Enviado pelo formulário de suporte do GuimiCell OS</p>
        </div>
      `,
    })
  } catch (err) {
    console.error("[support/email] Falha ao enviar e-mail:", err)
    return NextResponse.json(
      { error: "Falha ao enviar o e-mail. Tente novamente mais tarde." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
