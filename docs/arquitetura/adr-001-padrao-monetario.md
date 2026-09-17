# ADR-001: Padrao Monetario do Dominio

- Status: Proposto
- Data: 2026-09-17
- Decisores: Produto e Engenharia

## Contexto

O Vero planeja valores financeiros em contas, lancamentos, orcamentos, dividas, investimentos, metas, reserva de seguranca e cobranca. O schema atual persiste esses valores como `Int` em centavos, mas parte das entradas e calculos usa `number`, `parseFloat` e multiplicacao por 100.

JavaScript representa `number` em ponto flutuante binario. Portanto, valores como `0.1` nao possuem representacao exata e nao devem participar de conversoes ou calculos monetarios.

O produto e inicialmente restrito a BRL e a duas casas decimais. A arquitetura deve preservar essa regra e permitir evolucao futura sem misturar moedas ou escalas de forma implicita.

## Decisao

O dominio financeiro passara a usar um objeto de valor imutavel `Money`, implementado com `bignumber.js`.

O valor canonico de um `Money` sera uma quantidade inteira de unidades menores da moeda:

- `R$ 149,90` e representado internamente como `14990` centavos.
- Valores monetarios nao serao representados por `number` em contratos de dominio, actions, engines ou DTOs.
- Entradas humanas serao recebidas como texto e analisadas por parser proprio para BRL.
- Valores enviados entre servidor e cliente serao strings de unidades menores, por exemplo `"14990"`.
- A persistencia usara `NUMERIC(30,0)`: numero decimal exato, sem casas decimais, contendo a quantidade de unidades menores.

`Money` sera o tipo do dominio. `Prisma.Decimal` sera apenas um detalhe de infraestrutura de persistencia e nao deve chegar aos componentes ou motores financeiros.

## Regras Inviolaveis

- Nao usar `number`, `parseFloat`, `parseInt`, `Math.round(valor * 100)` ou aritmetica nativa para valores monetarios.
- Nao aceitar valores monetarios do cliente como numero JavaScript.
- Nao persistir valores em reais com casas decimais; persistir apenas a quantidade inteira de unidades menores.
- Nao converter `Money` em numero fora de adaptadores de visualizacao que verifiquem faixa segura.
- Nao misturar moedas em uma operacao. Durante o escopo inicial, toda operacao usa BRL.
- Todo arredondamento deve ser explicito, documentado e feito uma unica vez no limite da operacao.
- Os motores em `src/lib/engines/` devem ser deterministas e usar somente os tipos monetarios do dominio.

## Interface do Dominio

O formato exato sera definido na implementacao, respeitando estes contratos:

```ts
type MinorUnit = string

class Money {
  static fromMinorUnits(value: MinorUnit, currency?: "BRL"): Money
  static parseBRL(value: string): Money

  add(other: Money): Money
  subtract(other: Money): Money
  compare(other: Money): -1 | 0 | 1
  abs(): Money
  negate(): Money
  multiply(multiplier: string): Money
  divide(divisor: string, rounding: MoneyRounding): Money

  toMinorUnits(): MinorUnit
  format(locale?: string): string
}
```

O construtor deve ser privado. `Money` deve validar que a quantidade de unidades menores e inteira, que a moeda coincide entre operandos e que o texto BRL possui formato valido.

## Entrada, Persistencia e Saida

O fluxo padrao sera:

```text
Texto digitado no formulario
  -> Money.parseBRL()
  -> Money no dominio e nas regras
  -> string de unidades menores
  -> NUMERIC(30,0) no PostgreSQL
  -> string de unidades menores no DTO
  -> Money.fromMinorUnits() para formatacao na interface
```

O Prisma retorna colunas `Decimal` como `Prisma.Decimal`. Adaptadores de repositorio devem converter esse valor por meio de `toFixed(0)` para `Money.fromMinorUnits()`. Escritas devem converter `Money.toMinorUnits()` para `Prisma.Decimal` sem passar por `number`.

## Persistencia

Todos os campos monetarios atuais devem evoluir de `Int` para `Decimal @db.Decimal(30, 0)`:

- `Account.initialBalance`
- `Event.amount`
- `BudgetItem.amount`
- `Debt.totalAmount`
- `DebtInstallment.plannedAmount`
- `DebtPayment.amount`
- `InvestmentPlan.amount`
- `NetWorthGoal.targetAmount`
- `UserSettings.safetyBuffer`
- `CommercialOffer.amountCents`

A conversao preserva os dados: o valor inteiro atual `14990` continua `14990`. A criacao e aplicacao da migration sao responsabilidade do usuario, conforme `AGENTS.md`; nenhum arquivo de migration deve ser criado ou editado manualmente.

## Arredondamento

Operacoes de soma, subtracao, comparacao e negacao nao arredondam.

Divisoes e multiplicacoes que possam gerar fracao de unidade menor exigem uma politica explicita. A politica inicial proposta e `HALF_UP` para valores exibidos ou persistidos. A regra de negocio pode escolher outra politica em casos especificos, mas ela deve ser passada de forma explicita e coberta por testes.

Estimativas de aporte mensal nao devem usar os fatores decimais `4.33` ou `2.17`. Para exibicao, devem usar razoes exatas (`52 / 12` para semanal e `26 / 12` para quinzenal), com arredondamento somente no resultado. Projecoes financeiras devem priorizar ocorrencias datadas reais.

## Alternativas Consideradas

### Manter `Int` e corrigir apenas as entradas

Vantagens: menor migration e bom suporte para BRL em centavos.

Rejeitada nesta decisao porque `Int` do PostgreSQL limita o valor a aproximadamente R$ 21,47 milhoes e nao atende ao objetivo de maior capacidade de armazenamento futuro.

### Usar `BigInt`

Vantagens: representa unidades menores inteiras e aumenta significativamente o limite.

Rejeitada porque exige tratamento especial para serializacao JSON e ainda concentra a aritmetica em primitivas, sem resolver parser, moeda, arredondamento e contratos de fronteira.

### Armazenar `NUMERIC(30,2)` em reais

Vantagens: leitura direta em formato humano.

Rejeitada porque a escala do valor fica implicita no banco e torna a evolucao para moedas com outras precisoes mais ambigua. O dominio deve armazenar quantidade de unidades menores, nao uma apresentacao monetaria.

### Usar somente `Prisma.Decimal`

Vantagens: tipo exato ja associado ao Prisma.

Rejeitada porque acopla regras do dominio ao ORM e nao resolve o transporte seguro entre cliente e servidor. `Prisma.Decimal` permanece restrito aos adaptadores de persistencia.

## Consequencias

### Positivas

- Elimina erros de ponto flutuante em entrada, calculo e persistencia.
- Centraliza sinais, validacao, moeda e arredondamento no objeto de valor.
- Permite valores monetarios muito maiores que o `Int` atual.
- Prepara o dominio para suporte futuro a moedas com escalas diferentes.

### Custos

- Exige migracao coordenada de schema e adaptacao dos contratos Prisma.
- Exige conversao de DTOs para strings e atualizacao dos componentes clientes.
- Graficos que requerem `number` precisam de adaptador com verificacao de faixa segura.
- O tipo `Money` nao deve cruzar diretamente a fronteira de Server Actions ou componentes clientes.

## Garantias e Governanca

- Um guia operacional devera documentar o uso de `Money` e ser referenciado por `AGENTS.md`.
- Helpers legados de conversao serao removidos ao final da migracao.
- A revisao de codigo deve rejeitar novos contratos monetarios baseados em `number`.
- Regras automatizadas devem impedir os padroes legados nos dominios financeiros.
- Alteracoes em valores monetarios devem incluir testes de parser, arredondamento, sinais e valores limite.

## Criterios para Aceitacao

- Todos os campos monetarios persistidos usam `NUMERIC(30,0)`.
- Nenhuma Server Action financeira aceita `number` como valor monetario.
- Nenhum motor financeiro realiza calculo monetario com aritmetica nativa de `number`.
- Todos os valores trafegam como strings de unidades menores fora do dominio.
- Casos como `R$ 0,01`, `R$ 0,10`, `R$ 1.234,56`, valores negativos e valores grandes possuem testes.
