import { redirect } from "next/navigation"

// Scope 2 (section 5.10): "A tela Indicadores será removida"
// Dados redistributed em Dashboard, Financeiro, Comercial, Ranking
export default function IndicadoresPage() {
  redirect("/")
}
