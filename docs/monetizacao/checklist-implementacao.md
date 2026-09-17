# Checklist de Implementacao de Monetizacao

## Objetivo

Este checklist acompanha a entrega de planos, assinaturas, acessos e administracao comercial definidos em [planos-e-acessos.md](./planos-e-acessos.md). Um item marcado como concluido representa codigo implementado no repositorio; ele ainda pode exigir configuracao externa, migration ou validacao em ambiente antes de estar disponivel em producao.

## Fundacao de Cobranca

- [x] Modelar assinaturas, beneficios e eventos de webhook idempotentes no Prisma.
- [x] Separar cobranca de acesso por meio de `Subscription` e `Entitlement`.
- [x] Resolver o melhor plano ativo, com retorno ao Gratuito quando nao houver beneficio valido.
- [x] Manter o Plus durante `PAST_DUE` e expirar o beneficio somente em `CANCELED` ou `UNPAID`.
- [x] Persistir clientes externos por usuario e provedor por meio de `BillingCustomer`.
- [x] Generalizar IDs de cliente, assinatura, preco e evento para suportar mais de um provedor.
- [x] Criar o contrato de adaptador de provedor e o registro central de provedores.
- [x] Implementar Stripe como primeiro adaptador, com Checkout hospedado, cartao e Customer Portal.
- [x] Criar webhook Stripe assinado em `/api/stripe/webhook`.
- [x] Adicionar acoes de contratar e gerenciar assinatura no perfil.
- [x] Cobrir a resolucao de acesso com testes unitarios.
- [ ] Criar e aplicar a migration do schema de cobranca.
- [ ] Testar Checkout, Customer Portal e webhook com a Stripe em modo de teste.
- [ ] Configurar o endpoint de webhook e os eventos necessarios no painel da Stripe.
- [ ] Configurar `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PLUS_PRICE_ID`, `BILLING_PROVIDER` e `NEXT_PUBLIC_APP_URL` no ambiente de cada deploy.
- [ ] Adicionar testes de integracao para sincronizacao de assinatura, idempotencia e falhas de webhook.
- [ ] Definir monitoramento e alerta para webhooks com `processingError`.

## Catalogo e Precos

- [x] Especificar que configuracoes comerciais pertencem ao painel de Super Admin.
- [ ] Criar modelo de catalogo comercial no banco para planos, moedas, valores em centavos, vigencia e situacao de venda.
- [ ] Criar modelo de configuracao de preco por provedor, com IDs externos de produto e preco.
- [ ] Substituir `STRIPE_PLUS_PRICE_ID` pela consulta da configuracao comercial ativa no banco.
- [ ] Preservar o preco e o ID externo contratados em cada assinatura.
- [ ] Implementar historico de preco e vigencia para novas contratacoes.
- [ ] Implementar migracao administrativa e atomica de assinaturas existentes quando um preco for alterado.
- [ ] Implementar os catalogos Profissional 3, 5 e 10 e cliente adicional.
- [ ] Impedir a contratacao de planos inativos.

## Super Admin e Operacao

- [x] Especificar o papel e as responsabilidades de Super Admin.
- [ ] Modelar o papel de Super Admin no banco e a atribuicao por outro Super Admin.
- [ ] Criar guard de autorizacao de Super Admin no servidor.
- [ ] Restringir a listagem atual de usuarios a operadores autorizados antes de criar o painel.
- [ ] Criar painel para planos, configuracoes de preco e provedores habilitados.
- [ ] Criar painel para consultar assinaturas, clientes externos, beneficios e eventos de webhook.
- [ ] Registrar auditoria de acoes administrativas, incluindo responsavel, motivo e valores antes/depois.
- [ ] Criar filtros operacionais para inadimplencia, cancelamentos, expiracoes e erros de webhook.

## Acessos Gratuitos

- [x] Modelar origens de beneficio para cortesia administrativa e promocao.
- [ ] Criar acoes de Super Admin para conceder Plus gratuito, com motivo, inicio e fim opcionais.
- [ ] Permitir revogacao manual com motivo e responsavel registrados.
- [ ] Criar tela administrativa para consultar, criar, agendar e revogar cortesias.
- [ ] Garantir que cortesias nunca criem cliente, assinatura ou cobranca em um provedor.
- [ ] Implementar avisos de expiracao sugeridos para 30, 7 e 1 dia.

## Regras de Produto e Autorizacao

- [ ] Centralizar capacidades por plano, como `canUse(feature, userId)`.
- [ ] Aplicar guards no servidor para investimentos e planos de investimento.
- [ ] Aplicar guards no servidor para dividas e pagamentos de divida.
- [ ] Aplicar limite de uma conta ativa no Gratuito, excluindo contas de investimento.
- [ ] Aplicar limite de 30 lancamentos por mes no Gratuito.
- [ ] Bloquear criacao e edicao de recursos pagos apos downgrade, preservando todos os dados existentes.
- [ ] Ajustar a interface para explicar bloqueios e oferecer contratacao do Plus.
- [ ] Implementar relatorio simples do Gratuito e restringir relatorios detalhados ao Plus.

## Profissional e Clientes

- [ ] Modelar perfil profissional, convite, vinculo com cliente e permissao de leitura ou edicao.
- [ ] Exigir aceite expresso do cliente antes de liberar acesso aos dados.
- [ ] Modelar vagas pagas e patrocinadas sem confundi-las com assinaturas individuais.
- [ ] Conceder e revogar Plus de cliente com base na vaga ativa.
- [ ] Implementar capacidade, upgrade e cliente adicional para planos profissionais.
- [ ] Garantir que o encerramento do vinculo remova imediatamente o acesso do profissional e preserve os dados do cliente.
- [ ] Criar painel de carteira de clientes para o profissional.
- [ ] Tornar acoes de profissionais auditaveis.

## Producao e Evolucao

- [ ] Definir politica operacional de retentativas, prazo maximo de inadimplencia e comunicacao ao usuario.
- [ ] Criar emails ou notificacoes para pagamento falho, cancelamento e expiracao de beneficio.
- [ ] Criar metricas de MRR, conversao, cancelamento, vagas e receita por plano.
- [ ] Definir processo de conciliacao entre dados internos e cada provedor.
- [ ] Adicionar um novo adaptador de provedor em `src/features/billing/providers/` como teste de extensibilidade quando houver necessidade comercial.
- [ ] Realizar revisao de seguranca das rotas, Server Actions, webhook e permissoes administrativas.
- [ ] Homologar os cenarios de assinatura, cancelamento, retentativa, expiracao, cortesia e downgrade antes do lancamento.

## Proximas Entregas Recomendadas

1. Criar a migration e homologar o fluxo Stripe em modo de teste.
2. Implementar catalogo comercial no banco e remover o preco Stripe das variaveis de ambiente.
3. Criar papel, autorizacao, auditoria e painel minimo de Super Admin.
4. Aplicar os guards do Gratuito e Plus nas Server Actions antes de cobrar usuarios reais.
5. Implementar cortesias administrativas no painel de Super Admin.
6. Iniciar o dominio Profissional somente depois de estabilizar assinatura individual e controle de acesso.
