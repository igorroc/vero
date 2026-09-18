import { LegalPageLayout } from "@/components/legal/legal-page-layout"

export default function PrivacyPolicyPage() {
	return (
		<LegalPageLayout
			title="Política de Privacidade"
			description="Esta política explica como o Vero trata dados pessoais em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD, Lei nº 13.709/2018)."
			sections={[
				{
					title: "1. Controlador e canal de contato",
					content: (
						<p>
							O controlador dos dados pessoais tratados no Vero é ILRocha,
							inscrita no CNPJ sob o nº 50.630.327/0001-15. Para exercer seus
							direitos ou esclarecer dúvidas sobre privacidade, escreva para{" "}
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
				{
					title: "2. Dados que tratamos",
					content: (
						<>
							<p>
								Tratamos dados de cadastro, como nome, endereço de e-mail e
								senha protegida por hash. Também tratamos os dados financeiros
								que você decide informar, como nomes e saldos de contas, eventos
								de receita, despesa e investimento, categorias, orçamentos,
								reserva de segurança e planos de investimento.
							</p>
							<p>
								Para manter o serviço seguro e funcional, podemos tratar dados
								técnicos e de sessão, incluindo cookies estritamente
								necessários, identificadores de sessão, preferências de
								visualização e registros técnicos de acesso. Em planos pagos, o
								provedor de pagamento pode tratar dados cadastrais e de cobrança
								necessários à transação.
							</p>
						</>
					),
				},
				{
					title: "3. Finalidades e bases legais",
					content: (
						<>
							<p>
								Usamos os dados para criar e autenticar sua conta,
								disponibilizar os recursos de planejamento financeiro, calcular
								projeções a partir dos lançamentos inseridos, administrar
								assinaturas, responder a solicitações, prevenir fraudes e
								cumprir obrigações legais.
							</p>
							<p>
								O tratamento ocorre principalmente para execução do contrato ou
								de procedimentos relacionados à sua solicitação, cumprimento de
								obrigação legal e exercício regular de direitos. Quando
								aplicável, também poderá ocorrer com base em legítimo interesse,
								sempre observando seus direitos e expectativas.
							</p>
						</>
					),
				},
				{
					title: "4. Compartilhamento",
					content: (
						<p>
							Não vendemos dados pessoais. Podemos compartilhar dados
							estritamente necessários com operadores que viabilizam a
							infraestrutura do serviço e com o provedor de pagamento utilizado
							na contratação, atualmente Stripe ou Polar quando configurados.
							Esses terceiros tratam dados conforme suas próprias políticas e
							instruções contratuais aplicáveis.
						</p>
					),
				},
				{
					title: "5. Transferências internacionais",
					content: (
						<p>
							Alguns fornecedores de infraestrutura ou pagamento podem processar
							dados fora do Brasil. Quando isso ocorrer, buscaremos adotar as
							salvaguardas exigidas pela LGPD para transferências internacionais
							de dados.
						</p>
					),
				},
				{
					title: "6. Retenção e exclusão",
					content: (
						<p>
							Manteremos seus dados enquanto a conta estiver ativa e pelo
							período necessário para as finalidades desta política, para o
							cumprimento de obrigações legais ou para resguardar direitos. Após
							uma solicitação de exclusão, dados que não precisem ser retidos
							serão eliminados ou anonimizados de forma razoável e segura.
						</p>
					),
				},
				{
					title: "7. Seus direitos",
					content: (
						<p>
							Nos termos da LGPD, você pode solicitar confirmação da existência
							de tratamento, acesso, correção, anonimização, bloqueio,
							eliminação, portabilidade, informação sobre compartilhamentos,
							revogação de consentimento quando aplicável e revisão de decisões
							automatizadas. Responderemos às solicitações pelo canal indicado,
							observadas as hipóteses e prazos legais.
						</p>
					),
				},
				{
					title: "8. Cookies e segurança",
					content: (
						<p>
							O Vero utiliza cookies estritamente necessários para autenticação
							e para lembrar preferências de visualização. Não identificamos, no
							produto, cookies de publicidade comportamental. Adotamos medidas
							técnicas e organizacionais razoáveis para proteger os dados, mas
							nenhum sistema é totalmente imune a riscos.
						</p>
					),
				},
				{
					title: "9. Crianças e adolescentes",
					content: (
						<p>
							O Vero é destinado a pessoas maiores de 18 anos. Caso dados de
							crianças ou adolescentes sejam tratados, isso deverá ocorrer nos
							limites e condições previstos na legislação aplicável.
						</p>
					),
				},
				{
					title: "10. Atualizações desta política",
					content: (
						<p>
							Podemos atualizar esta política para refletir mudanças no serviço
							ou na legislação. A versão vigente ficará disponível nesta página,
							com a data de atualização. Mudanças relevantes poderão ser
							comunicadas por meios adicionais quando apropriado.
						</p>
					),
				},
			]}
		/>
	)
}
