'use client'

export interface ComercialMetricas {
  leadsAtivos: number
  leadsSemFollowUp: number
  taxaConversao: number
  volumePipeline: number
}

export interface ComercialDashboard {
  metricas: ComercialMetricas
  leads: any[]
  conversas: any[]
  lastSync: string
}

export async function getComercialDashboard(): Promise<ComercialDashboard | null> {
  try {
    const res = await fetch('/api/comercial/dashboard', { cache: 'no-store' })

    if (!res.ok) {
      console.warn('[COMERCIAL] API error:', res.status)
      return null
    }

    const data = await res.json().catch(() => null)

    if (!data) {
      console.warn('[COMERCIAL] Empty response')
      return null
    }

    return data as ComercialDashboard
  } catch (error) {
    console.warn('[COMERCIAL] Fetch error:', error)
    return null
  }
}

export async function getComercialLeads(): Promise<any[] | null> {
  try {
    const res = await fetch('/api/comercial/leads', { cache: 'no-store' })

    if (!res.ok) {
      return null
    }

    return await res.json().catch(() => null)
  } catch (error) {
    console.warn('[COMERCIAL LEADS] Error:', error)
    return null
  }
}

export async function getComercialConversations(): Promise<any[] | null> {
  try {
    const res = await fetch('/api/comercial/conversations', { cache: 'no-store' })

    if (!res.ok) {
      return null
    }

    return await res.json().catch(() => null)
  } catch (error) {
    console.warn('[COMERCIAL CONVERSATIONS] Error:', error)
    return null
  }
}

export async function getKommoStatus(): Promise<any | null> {
  try {
    const res = await fetch('/api/integrations/kommo/status', { cache: 'no-store' })

    if (!res.ok) {
      return null
    }

    return await res.json().catch(() => null)
  } catch (error) {
    console.warn('[KOMMO STATUS] Error:', error)
    return null
  }
}
