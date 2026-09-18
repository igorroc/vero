import Link from "next/link"

import { LegalPageLayout } from "@/components/legal/legal-page-layout"

export default function TermsOfUsePage() {
	return (
		<LegalPageLayout
			title="Termos de Uso"
			description="Estes termos estabelecem as regras para uso do Vero, plataforma de planejamento financeiro pessoal operada por ILRocha."
			sections={[
				{
					title: "1. Aceitação",
					content: (
						<p>
							Ao criar uma conta ou utilizar o Vero, você declara que leu e
							concorda com estes Termos de Uso e com a{" "}
							<Link
								href="/politica-de-privacidade"
								className="font-semibold text-[#16755d] underline underline-offset-4"
							>
								Política de Privacidade
							</Link>
							. Se não concordar, não utilize a plataforma.
						</p>
					),
				},
				{
					title: "2. O que o Vero oferece",
					content: (
						<p>
							O Vero permite registrar contas, eventos financeiros, orçamentos,
							reservas de segurança e planos de investimento, além de apresentar
							projeções de fluxo de caixa e limites diários de gastos. As
							projeções dependem exclusivamente das informações inseridas por
							você.
						</p>
					),
				},
				{
					title: "3. Natureza informativa",
					content: (
						<p>
							O Vero é uma ferramenta de organização e planejamento. Ele não
							oferece aconselhamento financeiro, contábil, tributário, jurídico,
							de investimento ou de crédito, nem garante resultados financeiros.
							Decisões sobre gastos, investimentos ou obrigações permanecem sob
							sua responsabilidade.
						</p>
					),
				},
				{
					title: "4. Sua conta e seus dados",
					content: (
						<p>
							Você deve fornecer dados corretos, manter sua senha em sigilo e
							comunicar imediatamente qualquer uso não autorizado da conta. Você
							é responsável pelas informações financeiras que registra e por
							manter seus lançamentos atualizados.
						</p>
					),
				},
				{
					title: "5. Uso permitido",
					content: (
						<p>
							Você pode utilizar o Vero para fins pessoais e lícitos. É proibido
							tentar acessar contas de terceiros, comprometer a segurança do
							serviço, copiar ou explorar comercialmente a plataforma sem
							autorização, inserir conteúdo ilícito ou usar o serviço em
							desacordo com a legislação aplicável.
						</p>
					),
				},
				{
					title: "6. Planos e pagamentos",
					content: (
						<p>
							Quando houver planos pagos, preço, periodicidade e condições
							aplicáveis serão apresentados antes da contratação. O pagamento e
							a gestão da assinatura podem ser processados por Stripe ou Polar,
							conforme o provedor configurado para a oferta. Cancelamentos e
							alterações seguem as condições exibidas no momento da contratação
							e no portal de cobrança disponível à pessoa usuária.
						</p>
					),
				},
				{
					title: "7. Disponibilidade e alterações",
					content: (
						<p>
							Buscamos manter o Vero disponível e seguro, mas não garantimos
							funcionamento ininterrupto ou livre de falhas. Podemos atualizar,
							modificar ou descontinuar funcionalidades, preservando os direitos
							previstos em lei e comunicando alterações relevantes quando
							necessário.
						</p>
					),
				},
				{
					title: "8. Propriedade intelectual",
					content: (
						<p>
							A marca Vero, o software, os textos, o design e demais elementos
							da plataforma pertencem à ILRocha ou a seus licenciantes. Estes
							termos não transferem direitos de propriedade intelectual a você.
						</p>
					),
				},
				{
					title: "9. Suspensão e encerramento",
					content: (
						<p>
							Podemos suspender ou encerrar o acesso em caso de violação destes
							termos, exigência legal ou risco à segurança do serviço. Você pode
							solicitar a exclusão da conta conforme a Política de Privacidade,
							observadas as hipóteses legais de retenção.
						</p>
					),
				},
				{
					title: "10. Lei aplicável e contato",
					content: (
						<p>
							Estes termos são regidos pelas leis da República Federativa do
							Brasil. Para dúvidas sobre o Vero ou estes termos, entre em
							contato pelo e-mail{" "}
							<a
								href="mailto:contato@ilrocha.com"
								className="font-semibold text-[#16755d] underline underline-offset-4"
							>
								contato@ilrocha.com
							</a>
							.
						</p>
					),
				},
			]}
		/>
	)
}
