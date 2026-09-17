# Plano de Implementacao: Padrao Monetario

## Objetivo

Implementar a decisao descrita em [ADR-001](./adr-001-padrao-monetario.md) de forma incremental, preservando dados existentes e mantendo os calculos financeiros corretos durante toda a transicao.

## Escopo

Inclui todos os valores financeiros de contas, eventos, transferencias, orcamentos, dividas, investimentos, metas, configuracoes e catalogo comercial.

Nao inclui multi-moeda nesta entrega. O modelo deve carregar a moeda no objeto `Money`, mas a unica moeda aceita sera BRL.

## Fase 0: Decisoes de Produto

1. Aprovar a ADR-001 e mudar seu status para `Aceito`.
2. Confirmar `HALF_UP` como arredondamento inicial para resultados persistidos e exibidos.
3. Definir se transferencias contam como lancamentos para limites comerciais.
4. Definir a regra de estimativa mensal de investimentos e substituir fatores aproximados por razoes exatas.
5. Definir o comportamento de valores com mais de duas casas no input BRL: rejeitar, e nao arredondar silenciosamente.

## Fase 1: Fundacao de Codigo

1. Adicionar `bignumber.js` como dependencia de producao.
2. Criar `src/lib/money/`:
   - `money.ts`: objeto de valor imutavel.
   - `parse-brl.ts`: parser estrito de texto monetario.
   - `format-money.ts`: formatacao baseada em `Intl.NumberFormat`.
   - `types.ts`: `MinorUnit`, moeda e politica de arredondamento.
   - `index.ts`: exports publicos.
3. Configurar `BigNumber` de forma local ao modulo, sem alterar configuracao global usada por outras bibliotecas.
4. Criar testes unitarios para parser, soma, subtracao, sinal, comparacao, arredondamento e valores muito grandes.

### Criterios de conclusao

- `Money.parseBRL("1.234,56").toMinorUnits()` retorna `"123456"`.
- Entradas invalidas, vazias, com mais de duas casas ou notacao exponencial sao rejeitadas.
- Nenhuma operacao de `Money` retorna `number`.

## Fase 2: Contratos e DTOs

1. Definir DTOs de fronteira com valores monetarios em `MinorUnit` (`string`).
2. Alterar actions para receber texto monetario de formularios e converte-lo imediatamente para `Money`.
3. Criar mapeadores de leitura que convertam valores do banco para strings de unidades menores.
4. Atualizar formularios para manter valores como texto, sem `parseFloat` ou `Number` para dinheiro.
5. Atualizar formatacao e pre-preenchimento de edicao para usar `Money`.

### Ordem sugerida

1. Contas e transferencias.
2. Eventos e recorrencias.
3. Orcamentos e configuracoes.
4. Dividas e pagamentos.
5. Investimentos e metas.
6. Catalogo comercial e cobranca.

### Criterios de conclusao

- Nenhum formulario financeiro converte dinheiro com `parseFloat` ou `Number`.
- Nenhuma action financeira declara valor monetario como `number`.
- DTOs de valores monetarios usados no cliente sao strings de unidades menores.

## Fase 3: Motores Financeiros

1. Migrar os tipos de entrada e saida em `src/lib/engines/` de `Cents = number` para o tipo monetario decidido.
2. Adaptar motores de fluxo de caixa, limite diario, dividas, orcamento, extrato e gastos por categoria.
3. Separar percentuais e coordenadas de graficos dos valores monetarios.
4. Criar adaptador de grafico que converta para `number` somente apos verificar faixa segura.
5. Corrigir `getMonthlyInvestmentAmount` para trabalhar com razoes exatas e politica explicita de arredondamento.

### Criterios de conclusao

- Nenhum engine usa ponto flutuante para dinheiro.
- A soma de eventos e saldos conserva unidades menores exatas.
- Limites diarios, parcelas e estimativas possuem politica de arredondamento coberta por testes.

## Fase 4: Persistencia

1. Alterar exclusivamente os arquivos em `prisma/schema/` para mapear campos monetarios como `Decimal @db.Decimal(30, 0)`.
2. Executar `bun run generate` depois da alteracao de schema.
3. Solicitar ao responsavel pelo banco a criacao e aplicacao da migration. Nao criar, editar ou aplicar migrations manualmente.
4. Implementar adaptadores Prisma para converter `Prisma.Decimal` e `Money` sem passar por `number`.
5. Validar em uma copia de dados que cada valor inteiro existente seja preservado sem mudanca de escala.

### Campos de migracao

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

### Criterios de conclusao

- Os valores antes e depois da migration possuem a mesma quantidade de unidades menores.
- Escritas e leituras Prisma nao fazem conversao por `number`.
- O sistema gera o cliente Prisma sem erros.

## Fase 5: Prevencao de Regressao

1. Remover `dollarsToCents`, `centsToDollars` e o alias legado `Cents` depois da migracao de todos os consumidores.
2. Adicionar regra de lint ou verificacao de repositorio para impedir em dominios financeiros:
   - `parseFloat` em valor monetario.
   - `Math.round(valor * 100)`.
   - contratos monetarios com `number`.
3. Atualizar `AGENTS.md`, `ARCHITECTURE.md` e a documentacao de funcionalidades com o padrao final.
4. Adicionar checklist de revisao para mudancas financeiras.

### Criterios de conclusao

- A busca por helpers monetarios legados e conversoes proibidas nao encontra ocorrencias nos dominios financeiros.
- A documentacao orienta um unico fluxo de entrada, dominio, persistencia e saida.
- Pull requests com alteracoes monetarias exigem testes de precisao.

## Matriz de Testes

| Caso | Resultado esperado |
| --- | --- |
| `R$ 0,01 + R$ 0,02` | `R$ 0,03` exatamente |
| `R$ 0,10` | persiste como `"10"` |
| `R$ 1.234,56` | persiste como `"123456"` |
| `-R$ 12,30` | preserva sinal e unidades menores |
| `R$ 1,234` | entrada rejeitada |
| Valor maior que `Int` atual | persiste e calcula sem perda |
| Divisao de parcela | segue a politica de arredondamento declarada |
| Transferencia | debito e credito possuem o mesmo valor absoluto |
| Atualizacao de saldo | saldo inicial mais eventos confirmados permanece exato |

## Validacao por Fase

Depois de cada fase aplicavel, executar:

```bash
bun run ts-check
bun test
bun run build
```

Depois de alteracoes no schema, executar tambem:

```bash
bun run generate
```

## Riscos e Mitigacoes

| Risco | Mitigacao |
| --- | --- |
| Migration altera escala de dados | Validar amostra e contagens antes e depois; `14990` deve permanecer `14990` |
| `BigNumber` cruza fronteiras React/Server Action | Transportar somente strings de unidades menores |
| Graficos exigem `number` | Criar adaptador com validacao de faixa segura |
| Mudanca ampla causa regressao | Migrar por dominio, manter testes dos engines e validar cada fase |
| Novo codigo reintroduz ponto flutuante | Regras automatizadas, documentacao e revisao obrigatoria |
