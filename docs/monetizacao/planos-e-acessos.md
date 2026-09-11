# Planos, Assinaturas e Gestao de Acessos

## Status

Esta e uma especificacao de produto para orientar a implementacao futura de monetizacao, assinaturas e acessos compartilhados. Nenhuma das regras deste documento deve ser considerada implementada ate que exista suporte correspondente na aplicacao e no banco de dados.

## Objetivo

O Vero atende dois publicos iniciais:

- Pessoas que desejam organizar as proprias financas e identificar gastos desnecessarios.
- Profissionais independentes, como consultores financeiros e contadores, que acompanham as financas de clientes.

O produto deve permanecer acessivel para pessoas fisicas e permitir que profissionais tragam clientes para a plataforma. O cliente continua dono dos seus dados financeiros, mesmo quando um profissional custeia seu acesso.

## Principios

- O acesso a recursos e separado da cobranca. Uma pessoa pode receber um plano por assinatura propria, por uma vaga de profissional ou por cortesia.
- Uma pessoa nunca e cobrada automaticamente por perder uma cortesia. Ao perder o beneficio, ela escolhe assinar ou permanecer no plano Gratuito.
- Dados financeiros nao sao apagados por cancelamento, expiracao ou revogacao de acesso.
- O nivel de acesso efetivo sempre e o melhor beneficio ativo disponivel para a pessoa.
- Um profissional so acessa os dados de um cliente apos convite e autorizacao expressa do cliente.
- O profissional nunca recebe acesso automatico as financas pessoais da propria conta.
- Todos os valores comerciais sao mensais e expressos em reais. A implementacao deve armazenar valores monetarios em centavos.

## Catalogo Inicial

### Vero Gratuito

Preco: R$ 0 por mes.

Destinado a pessoas que querem testar e manter uma organizacao financeira basica.

Inclui:

- Uma conta financeira ativa.
- Ate 30 lancamentos por mes.
- Categorias e orcamentos.
- Lancamentos manuais.
- Relatorio mensal simples, com visao basica por categoria.

Nao inclui:

- Gestao de investimentos.
- Gestao de dividas.
- Relatorios detalhados e comparativos.
- Recursos futuros de sincronizacao via Open Finance.

O limite de contas nao deve liberar uma conta de investimentos no plano Gratuito. Investimentos sao um diferencial do plano pago.

### Vero Plus

Preco: R$ 14,90 por mes.

Destinado a pessoas que desejam usar o Vero de forma completa.

Inclui todos os recursos do plano Gratuito, sem os limites deste plano, e tambem:

- Contas financeiras e lancamentos sem limite de plano.
- Orcamentos sem limite de plano.
- Gestao de investimentos e planos de investimento.
- Gestao de dividas.
- Relatorios detalhados, graficos, comparativos e visoes de gastos mais completas.
- Recursos de planejamento financeiro ja disponiveis no produto, como fluxo de caixa, reserva de seguranca e limite diario.

Nao havera periodo de teste para o plano Plus. O plano Gratuito cumpre o papel de avaliacao do produto.

### Vero Profissional

O Vero Profissional atende tanto consultores quanto contadores no lancamento. A comunicacao pode usar o termo "profissional"; nao ha diferenca de produto ou preco entre esses perfis inicialmente.

Cada vaga de cliente ativa inclui, para aquele cliente, os recursos equivalentes ao Vero Plus. O cliente nao precisa manter uma assinatura individual enquanto ocupar uma vaga ativa do profissional.

| Plano | Clientes ativos incluidos | Preco mensal |
| --- | ---: | ---: |
| Profissional 3 | Ate 3 | R$ 59,90 |
| Profissional 5 | Ate 5 | R$ 89,90 |
| Profissional 10 | Ate 10 | R$ 149,90 |
| Cliente adicional | Acima de 10 | R$ 14,90 por cliente por mes |

O produto profissional inclui:

- Painel geral da carteira de clientes vinculados.
- Convites para novos clientes.
- Acesso de leitura ou edicao, definido pelo cliente para cada vinculo.
- Consulta aos lancamentos, orcamentos, relatorios, dividas e investimentos que o cliente permitir.
- Gestao de vagas pagas e patrocinadas.

O produto profissional nao inclui, no lancamento:

- Marca branca.
- Equipes internas do escritorio.
- Comentarios, tarefas ou chat com o cliente.
- Acesso sem autorizacao aos dados do cliente.

## Assinaturas

### Regras de cobranca

- Todos os planos pagos usam cobranca mensal.
- O lancamento nao tera plano anual, desconto anual ou periodo de teste.
- Uma assinatura individual ativa concede Vero Plus ao titular.
- Uma assinatura profissional ativa concede as vagas previstas no plano contratado.
- O pagamento do Vero Profissional e responsabilidade do profissional, nunca dos clientes vinculados a ele.
- Uma assinatura cancelada permanece ativa ate o fim do periodo ja pago, salvo excecao administrativa documentada.

### Estados esperados

Uma assinatura deve permitir, no minimo, os estados abaixo:

| Estado | Comportamento |
| --- | --- |
| Ativa | Beneficios disponiveis ate o fim do periodo atual. |
| Com cancelamento agendado | Beneficios seguem disponiveis ate o fim do periodo atual. Nao ha renovacao. |
| Expirada | Beneficios deixam de valer; o titular usa somente outros acessos ativos ou o plano Gratuito. |
| Inadimplente | Segue a politica do provedor de pagamento. Apos eventual tolerancia, os beneficios sao removidos. |
| Cancelada administrativamente | Beneficios sao encerrados conforme a data definida e o motivo fica registrado. |

## Acesso e Beneficios

### Concessao de beneficio

Uma concessao de beneficio e um registro que fornece determinado nivel de acesso a uma pessoa ou a area financeira de um cliente. Ela possui, no minimo:

- Plano concedido, inicialmente Gratuito ou Plus.
- Origem do beneficio.
- Pessoa beneficiada e, quando aplicavel, area financeira beneficiada.
- Data de inicio.
- Data de termino opcional.
- Estado: ativa, expirada ou revogada.
- Motivo e responsavel pela concessao, quando nao for originada de assinatura.

Origens previstas:

| Origem | Exemplo |
| --- | --- |
| Assinatura individual | Pessoa contratou Vero Plus. |
| Vaga paga de profissional | Cliente esta dentro da capacidade contratada pelo profissional. |
| Vaga patrocinada | Profissional trouxe cliente com uma vaga gratuita concedida pela plataforma. |
| Cortesia administrativa | A equipe do Vero liberou Plus para amigo, parceiro ou tester. |
| Promocao | Campanha libera Plus por periodo determinado. |

### Precedencia

Quando houver mais de um beneficio ativo, aplica-se o acesso de maior nivel. A ordem inicial e:

1. Futuro plano Premium, quando existir.
2. Assinatura individual Plus ativa.
3. Vaga paga de profissional.
4. Vaga patrocinada de profissional.
5. Cortesia ou promocao Plus.
6. Vero Gratuito.

O encerramento de um beneficio nao reduz o acesso se outro beneficio equivalente ou superior continuar ativo. Por exemplo, remover uma cortesia nao afeta uma pessoa que ja possui assinatura Plus ativa.

## Vinculo Entre Profissional e Cliente

### Convite e autorizacao

O profissional inicia o processo enviando um convite ao cliente. O convite informa quem tera acesso e qual permissao esta sendo solicitada.

1. O profissional envia um convite de leitura ou edicao.
2. O cliente cria uma conta ou acessa uma conta existente.
3. O cliente aceita ou recusa o convite.
4. Ao aceitar, e criado o vinculo entre profissional e cliente.
5. Se uma vaga estiver disponivel, o cliente recebe o beneficio Plus vinculado a essa vaga.

O cliente deve poder alterar a permissao entre leitura e edicao ou remover completamente o vinculo a qualquer momento.

### Permissoes

| Permissao | O profissional pode |
| --- | --- |
| Leitura | Consultar dados, lancamentos e relatorios permitidos do cliente. |
| Edicao | Consultar e criar, editar ou organizar dados financeiros do cliente dentro das regras do produto. |

Mesmo com permissao de edicao, a propriedade dos dados permanece com o cliente. Acoes do profissional devem ser auditaveis quando esse recurso for implementado.

### Encerramento do vinculo

O vinculo pode terminar por iniciativa do cliente, do profissional ou da plataforma. Ao terminar:

- O profissional perde acesso imediatamente aos dados do cliente.
- Os dados financeiros continuam na conta do cliente.
- A vaga do profissional e liberada.
- O beneficio Plus associado a essa vaga deixa de valer, exceto se o cliente possuir outra origem de acesso ativa.

## Vagas Patrocinadas

### Objetivo

Vagas patrocinadas permitem que um profissional parceiro traga clientes sem custo para ele ou para o cliente. Sao uma ferramenta de aquisicao e validacao comercial, nao um plano independente.

### Funcionamento

- A plataforma define quantas vagas patrocinadas cada profissional recebe.
- A vaga patrocinada pode ter data de termino ou permanecer ativa sem data definida.
- O profissional usa a vaga para convidar um cliente, que ainda precisa aceitar o vinculo.
- Enquanto a vaga estiver ativa, o cliente recebe acesso equivalente ao Vero Plus.
- A vaga patrocinada nao consome a capacidade paga do plano profissional.
- A plataforma pode remover a vaga, alterar sua data de termino ou encerrar a concessao a qualquer momento, com registro do motivo.

Exemplo: um profissional do plano Profissional 3 pode ter tres clientes em vagas pagas e tres clientes em vagas patrocinadas, totalizando seis clientes vinculados.

### Conversao de vaga patrocinada

Quando a parceria for validada, a vaga patrocinada pode:

- Ser convertida para uma vaga paga do profissional, se houver capacidade ou se ele fizer upgrade.
- Ser substituida por assinatura individual do cliente.
- Ser encerrada, deixando o cliente no plano Gratuito.

## Cortesias e Promocoes para Pessoas Fisicas

### Cortesia administrativa

A equipe do Vero pode liberar Vero Plus para usuarios selecionados, como amigos, testers, parceiros e usuarios estrategicos.

O painel administrativo deve permitir:

- Selecionar o usuario beneficiado.
- Definir o plano concedido.
- Informar motivo da cortesia.
- Definir datas de inicio e termino, sendo o termino opcional.
- Consultar quem concedeu o beneficio.
- Revogar o beneficio manualmente.

Beneficios sem data de termino sao revogaveis. A comunicacao nao deve usar o termo "vitalicio".

### Promocoes futuras

Promocoes devem ser temporarias por padrao. Um caso futuro e indicacao: uma indicacao elegivel pode conceder 30 dias de Vero Plus, sem criar acesso permanente.

O programa publico de indicacao nao faz parte do lancamento. Inicialmente, cortesias e vagas patrocinadas sao controladas internamente.

## Expiracao, Revogacao e Conversao

### Regra geral

O Vero nao deve cobrar uma pessoa sem uma contratacao explicita. Quando uma vaga, cortesia ou promocao termina, o sistema remove apenas o beneficio correspondente.

Se nao existir outra fonte de acesso paga ou concedida, a pessoa passa para o Vero Gratuito e ve uma opcao clara para assinar o Plus.

### Experiencia do usuario

Antes de uma expiracao programada, o Vero deve avisar o usuario com antecedencia. Sugestao inicial: 30, 7 e 1 dia antes do fim.

Ao perder o Plus:

- Todos os dados existentes permanecem armazenados e visiveis quando possivel.
- Novas criacoes e edicoes que ultrapassem limites do Gratuito ficam bloqueadas.
- Investimentos e dividas existentes permanecem preservados, mas a criacao e edicao desses recursos ficam bloqueadas ate nova assinatura ou beneficio elegivel.
- Relatorios detalhados ficam indisponiveis; o relatorio simples do Gratuito continua acessivel.
- O usuario pode contratar o Plus a qualquer momento para recuperar os recursos pagos.

Uma revogacao administrativa imediata deve ser reservada a necessidade operacional, fraude ou encerramento de parceria. Em casos comerciais normais, deve haver data de fim e comunicacao previa.

## Gestao Operacional

O painel administrativo de monetizacao deve permitir consultar e alterar, com historico:

- Assinaturas individuais e profissionais.
- Periodo atual, estado e origem de cada assinatura.
- Clientes vinculados a cada profissional.
- Vagas pagas, vagas disponiveis e vagas patrocinadas.
- Concessoes de cortesia e promocoes.
- Datas de expiracao e revogacoes.
- Motivos, responsaveis e observacoes administrativas.

Alteracoes de plano e de vagas devem ser aplicadas de forma atomica para evitar que um cliente fique temporariamente com permissao indevida ou sem um acesso que deveria possuir.

## Metricas Iniciais

Para acompanhar a meta inicial de R$ 1.000 de receita recorrente mensal, medir:

- Receita recorrente mensal total e por tipo de plano.
- Quantidade de assinaturas Plus ativas.
- Quantidade de profissionais ativos por faixa de plano.
- Clientes ativos por profissional.
- Vagas patrocinadas ativas, expiradas e convertidas em receita.
- Conversao do Gratuito para o Plus.
- Conversao de clientes patrocinados para vaga paga ou assinatura individual.
- Cancelamentos e motivo informado.

Exemplos de combinacoes para atingir R$ 1.000 de receita mensal recorrente:

- 68 assinaturas Plus a R$ 14,90 geram R$ 1.013,20.
- 17 planos Profissional 3 a R$ 59,90 geram R$ 1.018,30.
- Uma combinacao de 5 planos Profissional 3 e 48 assinaturas Plus gera R$ 1.014,70.

## Evolucao Planejada

Quando a integracao com Open Finance estiver disponivel e sustentavel, pode ser criado um plano Premium a R$ 24,90 por mes. O Premium incluiria sincronizacao automatica de entradas e saidas, conciliacao e recursos avancados relacionados a integracao bancaria.

O Vero Plus permanece como o plano pago acessivel. O Premium so deve ser comercializado quando a integracao estiver funcional, confiavel e com custo operacional conhecido.
