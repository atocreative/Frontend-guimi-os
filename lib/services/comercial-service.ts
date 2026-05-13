'use client'

import { getSessionAccessToken } from '@/lib/backend-api'
import { getSession } from '@/lib/auth-session'

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001'
).replace(/\/$/, '')

export async function getComercialLeads(): Promise<any[] | null> {
  try {
    const session = await getSession()
    const token = getSessionAccessToken(session)

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${BACKEND_URL}/api/comercial/leads`, {
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      console.warn('[COMERCIAL LEADS] API error:', res.status)
      return null
    }

    const data = await res.json().catch(() => null)

    // Backend retorna { data: [] } ou { leads: [] }
    if (Array.isArray(data)) return data
    if (data?.data && Array.isArray(data.data)) return data.data
    if (data?.leads && Array.isArray(data.leads)) return data.leads

    return null
  } catch (error) {
    console.warn('[COMERCIAL LEADS] Fetch error:', error)
    return null
  }
}
