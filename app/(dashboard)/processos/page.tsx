import { protectPage } from "@/lib/route-protection"
import { ProcessosDashboard } from "@/components/processos/processos-dashboard"

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function ProcessosPage({ searchParams }: PageProps) {
  await protectPage({ featureId: "FINANCEIRO", requiredRole: "ADMIN" })

  const params     = await searchParams
  const now        = new Date()
  const currentMes = now.getMonth()
  const currentAno = now.getFullYear()

  const mParam    = Number(params.m)
  const yParam    = Number(params.y)
  const initialMes = mParam >= 0 && mParam <= 11 ? mParam : currentMes
  const initialAno = yParam >= 2024 && yParam <= currentAno ? yParam : currentAno

  const availableYears = Array.from({ length: currentAno - 2023 }, (_, i) => 2024 + i)

  return (
    <ProcessosDashboard
      initialMes={initialMes}
      initialAno={initialAno}
      availableYears={availableYears}
    />
  )
}
