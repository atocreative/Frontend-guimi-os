import Link from "next/link"

export const metadata = {
  title: "Termos de Uso — GuimiCell OS",
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Voltar ao sistema
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Última atualização: maio de 2026
        </p>

        <div className="space-y-8 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Uso do Sistema</h2>
            <p>
              O GuimiCell OS é uma plataforma de gestão empresarial desenvolvida
              exclusivamente para uso interno da GuimiCell e empresas autorizadas.
              O acesso é concedido apenas a usuários devidamente cadastrados e
              autorizados pela administração.
            </p>
            <p className="mt-2">
              O uso do sistema deve ser feito de forma profissional, respeitando
              os limites de acesso definidos pelo perfil de cada usuário. É vedado
              qualquer uso do sistema para fins pessoais, comerciais não autorizados
              ou em violação às políticas internas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Responsabilidades do Usuário</h2>
            <p>
              Cada usuário é responsável pela confidencialidade de suas credenciais
              de acesso. O compartilhamento de login e senha é estritamente proibido.
              Qualquer ação realizada com as credenciais de um usuário é de responsabilidade
              exclusiva deste.
            </p>
            <p className="mt-2">O usuário se compromete a:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Manter suas credenciais em sigilo absoluto</li>
              <li>Notificar imediatamente qualquer suspeita de acesso não autorizado</li>
              <li>Utilizar o sistema apenas para fins relacionados às atividades da empresa</li>
              <li>Não tentar acessar funcionalidades além das permitidas ao seu perfil</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Uso dos Dados</h2>
            <p>
              Os dados inseridos e acessados através do GuimiCell OS são propriedade
              da GuimiCell. O sistema coleta e processa apenas os dados necessários
              para o funcionamento das funcionalidades disponíveis.
            </p>
            <p className="mt-2">Os dados são utilizados exclusivamente para:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Gestão operacional e financeira da empresa</li>
              <li>Controle de acesso e auditoria de segurança</li>
              <li>Geração de relatórios e indicadores de desempenho</li>
              <li>Melhoria contínua dos serviços prestados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Propriedade Intelectual</h2>
            <p>
              O GuimiCell OS, incluindo seu código-fonte, design, marcas e demais
              elementos, é de propriedade exclusiva da <strong>ATO.</strong>,
              desenvolvedor do sistema. É proibida qualquer reprodução, cópia,
              modificação ou distribuição sem autorização expressa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Limitação de Responsabilidade</h2>
            <p>
              A ATO. não se responsabiliza por danos causados por uso indevido do
              sistema, falhas de conexão, ou situações fora de seu controle. O sistema
              é fornecido no estado em que se encontra, com esforços contínuos para
              garantir disponibilidade e segurança.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Alterações nos Termos</h2>
            <p>
              Estes termos podem ser atualizados a qualquer momento. Os usuários serão
              notificados sobre alterações relevantes. O uso contínuo do sistema após
              notificação implica aceitação dos novos termos.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground flex justify-between">
          <span>GuimiCell OS · Desenvolvido por ATO.</span>
          <Link href="/privacidade" className="hover:text-primary transition-colors">
            Política de Privacidade →
          </Link>
        </div>
      </div>
    </div>
  )
}
