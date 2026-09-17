# Plano de Acao: Guards de Planos

## Objetivo

Aplicar as regras dos planos Free e Plus no servidor de forma centralizada, segura e extensivel. O Super Admin deve poder ajustar limites e habilitar recursos por plano sem que as regras fiquem espalhadas nas Server Actions.

## Principios

- O servidor e a autoridade final: esconder um botao na interface nunca substitui um guard na Server Action.
- A configuracao administrativa controla valores e disponibilidade, mas somente capacidades reconhecidas pelo codigo podem ser utilizadas.
- Uma capacidade ausente, invalida ou sem configuracao deve ser negada por padrao.
- Dados existentes permanecem acessiveis apos downgrade; as regras devem bloquear apenas criacao e edicao de recursos pagos.
- Toda medicao de uso deve ser calculada no servidor, a partir dos dados do usuario autenticado.

## Capacidades Iniciais

O catalogo de capacidades deve ser definido em um modulo central, por exemplo `src/features/billing/capabilities.ts`.

| Chave | Tipo | Free | Plus | Uso |
| --- | --- | --- | --- | --- |
| `accounts.active` | limite | 1, exceto investimento | sem limite | Criacao de contas |
| `events.create.monthly` | limite | 30 por mes | sem limite | Criacao de lancamentos |
| `investments.manage` | booleano | bloqueado | liberado | Criar e editar investimentos |
| `investment-plans.manage` | booleano | bloqueado | liberado | Criar e editar planos de investimento |
| `debts.manage` | booleano | bloqueado | liberado | Criar e editar dividas |
| `debt-payments.manage` | booleano | bloqueado | liberado | Registrar pagamentos de dividas |
| `reports.basic` | booleano | liberado | liberado | Relatorio mensal simples |
| `reports.detailed` | booleano | bloqueado | liberado | Relatorios e comparativos avancados |
| `cashflow.view` | booleano | definir na regra comercial | liberado | Fluxo de caixa |
| `spending-limit.view` | booleano | definir na regra comercial | liberado | Limite diario e reserva |

`null` como limite representa ausencia de teto. O catalogo tambem deve conter nome, descricao e tipo de cada capacidade para a tela administrativa.

## Modelo de Dados

Criar o modelo `PlanCapability` no schema Prisma. A chave e armazenada como texto para permitir novas capacidades sem alterar enums; ela deve ser validada contra o catalogo central no servidor.

```prisma
model PlanCapability {
  id         String     @id @default(cuid())
  plan       AccessPlan
  capability String
  isEnabled  Boolean    @default(false)
  limit      Int?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([plan, capability])
  @@index([plan])
}
```

Valores iniciais devem ser criados para Free e Plus. A criacao e a aplicacao da migration seguem o processo definido em `AGENTS.md`.

## Servico de Autorizacao

Criar um servico em `src/features/billing` com as seguintes responsabilidades:

- Resolver o plano efetivo por meio dos entitlements ativos.
- Buscar as configuracoes `PlanCapability` do plano resolvido.
- Combinar a configuracao persistida com defaults seguros do catalogo.
- Retornar decisoes consistentes para as actions.

Interface sugerida:

```ts
canUse(userId, capability): Promise<boolean>
getLimit(userId, capability): Promise<number | null>
checkLimit(userId, capability): Promise<{ allowed: boolean; used: number; limit: number | null }>
```

Cada capacidade com limite precisa declarar, no catalogo, como seu uso e medido. Essa funcao nunca recebe contagens do cliente.

| Capacidade | Medicao no servidor |
| --- | --- |
| `accounts.active` | Contagem de contas ativas nao-investimento do usuario |
| `events.create.monthly` | Contagem de lancamentos persistidos criados no mes-calendario atual |

Antes da implementacao, deve ser definida a regra comercial para templates e ocorrencias recorrentes. Recomendacao inicial: contar apenas lancamentos persistidos, e nao ocorrencias apenas projetadas.

## Aplicacao nas Actions

Os guards devem ser chamados depois da autenticacao e antes de qualquer mutacao.

| Dominio | Regra |
| --- | --- |
| Contas | Bloquear criacao acima de `accounts.active`; impedir conta `INVESTMENT` no Free |
| Eventos | Verificar `events.create.monthly` antes de criar evento, saque ou transferencia, conforme a definicao comercial de lancamento |
| Investimentos | Bloquear criacao e edicao por `investments.manage` |
| Planos de investimento | Bloquear criacao e edicao por `investment-plans.manage` |
| Dividas | Bloquear criacao e edicao por `debts.manage` |
| Pagamentos de divida | Bloquear por `debt-payments.manage` |
| Relatorios | Permitir apenas o relatorio basico quando `reports.detailed` estiver bloqueado |

Exclusao de dados existentes deve continuar permitida apos downgrade, para que a pessoa usuaria possa reduzir o uso ao limite do plano Free.

## Painel de Super Admin

Adicionar uma tela administrativa de matriz plano por capacidade:

- Exibir cada capacidade do catalogo com nome, descricao, tipo e valor atual por plano.
- Permitir ativar ou desativar capacidades booleanas.
- Permitir editar limites inteiros ou definir ausencia de limite.
- Validar chave, tipo e limites nao negativos no servidor.
- Registrar auditoria com responsavel, data, motivo, valor anterior e valor novo.
- Revalidar os dados afetados apos cada alteracao.

O painel nao deve permitir criar chaves arbitrarias. Para acrescentar um novo recurso ao produto, primeiro se adiciona sua definicao ao catalogo e seu guard na action; depois ele se torna configuravel pelo painel.

## Interface da Pessoa Usuaria

A interface deve consumir o resultado das capacidades apenas para melhorar a experiencia:

- Ocultar ou desabilitar acoes indisponiveis.
- Exibir uso de limites, por exemplo `12 de 30 lancamentos neste mes`.
- Informar o motivo do bloqueio e oferecer contratacao do Plus.
- Recarregar as capacidades depois de uma contratacao, cancelamento ou alteracao de plano.

Esses controles nao substituem os guards no servidor.

## Etapas de Entrega

1. Definir regras comerciais pendentes para `cashflow.view`, `spending-limit.view`, transferencias e recorrencias.
2. Criar catalogo de capacidades, modelo `PlanCapability` e valores iniciais de Free e Plus.
3. Implementar o servico de resolucao, `canUse`, `getLimit` e `checkLimit`.
4. Aplicar guards de contas, eventos, investimentos, planos de investimento e dividas.
5. Adicionar painel Super Admin e auditoria das configuracoes.
6. Ajustar a interface para bloqueios, consumo e CTA de upgrade.
7. Cobrir cenarios de plano, downgrade, autorizacao e concorrencia com testes de integracao.

## Criterios de Aceite

- Uma pessoa Free nao consegue criar mais de uma conta nao-investimento nem conta de investimento.
- Uma pessoa Free nao consegue criar mais de 30 lancamentos no mesmo mes.
- Uma pessoa Free nao consegue criar ou editar investimentos, planos de investimento, dividas e pagamentos de divida.
- Dados pagos existentes continuam visiveis e podem ser excluidos apos downgrade.
- Uma pessoa Plus nao encontra limites artificiais nas capacidades ilimitadas.
- Nenhuma mutacao pode ser liberada por dados enviados pelo cliente ou apenas por controle de interface.
- Alteracoes administrativas de capacidade passam a valer para novas verificacoes e possuem registro auditavel.
- Existem testes de integracao para Free, Plus, downgrade, isolamento por `userId` e tentativas concorrentes de ultrapassar limites.
