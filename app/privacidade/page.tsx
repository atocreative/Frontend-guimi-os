import Link from "next/link"

export const metadata = {
  title: "Política de Privacidade — GuimiCell OS",
}

export default function PrivacidadePage() {
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

        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Última atualização: maio de 2026
        </p>

        <div className="space-y-8 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Coleta de Dados</h2>
            <p>
              O GuimiCell OS coleta apenas os dados estritamente necessários para
              o funcionamento do sistema e prestação dos serviços. Os dados coletados
              incluem:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Informações de identificação do usuário (nome, e-mail, cargo)</li>
              <li>Dados de acesso e autenticação (logs de login, sessões)</li>
              <li>Dados operacionais inseridos no sistema (tarefas, agendamentos, indicadores)</li>
              <li>Informações de uso do sistema para fins de auditoria</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Cookies e Tecnologias de Rastreamento</h2>
            <p>
              O sistema utiliza cookies de sessão para manter o usuário autenticado
              durante o uso. Estes cookies são essenciais para o funcionamento do sistema
              e são removidos automaticamente ao encerrar a sessão.
            </p>
            <p className="mt-2">
              Não utilizamos cookies de rastreamento de terceiros, publicidade ou
              qualquer tecnologia de rastreamento além do estritamente necessário
              para a autenticação e segurança.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Uso das Informações</h2>
            <p>As informações coletadas são utilizadas exclusivamente para:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Autenticação e controle de acesso ao sistema</li>
              <li>Registro de atividades para fins de segurança e auditoria</li>
              <li>Personalização da experiência do usuário no sistema</li>
              <li>Suporte técnico quando solicitado</li>
              <li>Melhoria contínua das funcionalidades do sistema</li>
            </ul>
            <p className="mt-2">
              Nenhuma informação é vendida, alugada ou compartilhada com terceiros
              sem autorização expressa da empresa, exceto quando exigido por lei.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Segurança dos Dados</h2>
            <p>
              Adotamos medidas técnicas e organizacionais adequadas para proteger
              os dados contra acesso não autorizado, perda, destruição ou divulgação.
              As principais medidas incluem:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
              <li>Autenticação com tokens JWT de curta duração</li>
              <li>Controle de acesso baseado em perfis de usuário (RBAC)</li>
              <li>Registro de logs de acesso para auditoria</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Conformidade com a LGPD</h2>
            <p>
              O GuimiCell OS está em conformidade com a Lei Geral de Proteção de
              Dados Pessoais (Lei nº 13.709/2018 — LGPD). Em conformidade com a LGPD,
              garantimos os seguintes direitos aos titulares de dados:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Direito de acesso aos dados pessoais armazenados</li>
              <li>Direito de correção de dados incompletos ou desatualizados</li>
              <li>Direito de exclusão dos dados pessoais (quando aplicável)</li>
              <li>Direito de portabilidade dos dados</li>
              <li>Direito de informação sobre o uso dos dados</li>
            </ul>
            <p className="mt-2">
              Para exercer qualquer um desses direitos, entre em contato com o
              responsável pelo sistema em sua empresa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Retenção de Dados</h2>
            <p>
              Os dados são mantidos pelo período necessário para cumprir as finalidades
              descritas nesta política, observando os prazos legais aplicáveis. Dados
              de usuários desativados são mantidos por até 5 anos para fins de auditoria,
              após o qual são excluídos ou anonimizados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Alterações nesta Política</h2>
            <p>
              Esta política pode ser atualizada periodicamente. Notificaremos os usuários
              sobre mudanças significativas. Recomendamos a leitura periódica desta política.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground flex justify-between">
          <span>GuimiCell OS · Desenvolvido por ATO.</span>
          <Link href="/termos" className="hover:text-primary transition-colors">
            ← Termos de Uso
          </Link>
        </div>
      </div>
    </div>
  )
}
