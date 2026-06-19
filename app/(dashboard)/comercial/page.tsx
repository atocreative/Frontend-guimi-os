import { BIDashboard } from "@/components/comercial/bi-dashboard"
import { protectPage } from "@/lib/route-protection"

export const dynamic = "force-dynamic"

export default async function ComercialPage() {
  await protectPage({ featureId: "COMERCIAL" })
  return <BIDashboard />
}
