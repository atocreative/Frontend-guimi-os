import { NextRequest } from "next/server"

/**
 * GET /api/integrations/status
 *
 * Returns the connection status of integrated services
 * Scope 2 - Section 5.7: Integration Status Dashboard
 *
 * Integrations tracked:
 * - Fone Ninja: Telemarketing automation
 * - Kommo CRM: Lead and sales management
 * - Meu Assessor: Sales support/coaching
 */
export async function GET(req: NextRequest) {
  try {
    // TODO: Fetch actual status from backend or integration providers
    // For now, return template status structure

    return Response.json({
      fone_ninja: {
        status: "disconnected", // connected | disconnected | error
        last_sync: null,
        connected_at: null,
        error_message: null,
      },
      kommo: {
        status: "disconnected",
        last_sync: null,
        connected_at: null,
        error_message: null,
      },
      meu_assessor: {
        status: "disconnected",
        last_sync: null,
        connected_at: null,
        error_message: null,
      },
    })
  } catch (error) {
    console.error("[integrations/status] Error:", error)
    return Response.json(
      { error: "Failed to fetch integration status" },
      { status: 500 }
    )
  }
}
