# Fase 01 — Conciliação via CSV/OFX (sem IA)

- Status: **Concluída** (implementada e validada: `ts-check`, testes e `build` passando)
- Pré-requisito: nenhum (só código atual).
- Deploy isolado: **sim**. Subiu sozinha; sem IA, sem banco novo, sem gate de plano.

## Objetivo

Permitir anexar extrato **CSV ou OFX**, comparar com os `Event` da conta/período e
exibir divergências, com aplicação em 1 clique. Nenhuma chamada de IA nesta fase.

## Fora do escopo

- PDF (fase 02), chat (fase 03), limites por plano (fase 04).
- Persistir arquivo ou transações do extrato (decisão: extrair → comparar → descartar).
- Criação automática sem aprovação (sempre 1 clique por sugestão).

## Design

Página isolada `src/app/(app)/conciliacao/page.tsx` (Server Component fino) +
componentes client só para upload/tabela. Parse acontece no servidor via Server Action
recebendo `FormData`; o arquivo nunca toca disco — é lido do `FormData` em memória,
parseado e descartado no fim da action.

```
Upload (client) -> FormData -> parse-statement.ts (server, sem IA)
  -> NormalizedTx[] (memória) -> reconciliation.ts (engine puro)
  x Event[] CONFIRMED + PLANNED do período/conta (userId da sessão)
  -> Divergence[] -> lista + botões [Criar] [Confirmar] [Transferir] [Dispensar]
  -> apply-suggestion.ts reusa create-event / update-event / create-transfer
```

Decisões tomadas durante a implementação (usuário):

- 5 `kind`s (não 4): `transfer_candidate` adicional para Aplicação/Resgate CDB
  (transferência comum ⇄ investimento) e Pix para o próprio titular.
- Match também com `PLANNED` (sugere confirmação em 1 clique).
- Categoria escolhida **por linha** (seletor tipo + categoria compatível).
- Transferência com seletor de conta destino/origem por linha.
- Período opcional na tela (vazio = derivado do extrato, ±3 dias de tolerância).
- Extratos de referência em `docs/ai-conciliacao/` anonimizados (nomes, contas,
  CNPJ e códigos substituídos; valores/datas/FITIDs preservados para os testes).

### Parsers (puros, sem IA, com testes)

- `src/features/reconciliation/parsers/csv.ts`
  - Detecta delimitador `;` ou `,` e cabeçalho PT/EN (`data`, `descricao`, `valor`, …).
  - Valores BR (`1.234,56`, `-50,00`, `(50,00)`) → centavos `int` sem `parseFloat`
    (parser próprio string → centavos).
  - Datas `DD/MM/YYYY`, `YYYY-MM-DD`, `DD-MM-YYYY`.
- `src/features/reconciliation/parsers/ofx.ts`
  - Parser SGML mínimo próprio (sem dep nova se possível): extrai `STMTTRN`
    (`DTPOSTED`, `TRNAMT`, `MEMO`/`NAME`, `FITID`).
  - `TRNAMT` com ponto decimal → centavos via string (nunca float).
- Limites: 10MB, máx. ~5.000 linhas; acima disso, erro orientando a fatiar por período.

### Motor (puro, testável)

- `src/lib/engines/reconciliation.ts` + `reconciliation.test.ts` (19 testes)
  - Entrada: `NormalizedTx[]` + `Event[]` (`CONFIRMED` e `PLANNED`, sem `TRANSFER` em
    `missing_in_statement`, sem `SKIPPED`; zeros do extrato descartados).
  - Saída: `Divergence[]` em 5 `kind`s (`matched`, `missing_in_vero`,
    `missing_in_statement`, `value_mismatch`, `transfer_candidate`).
  - Normalização de descrição: minúsculas, remove acento/pontuação/espaço duplo.
  - Match: valor exato + data ±3 dias; desempate por similaridade (Jaccard de tokens).
  - `value_mismatch`: mesma data (±3d) + descrição similar (≥0,5), valor diferente.
  - Dedupe por data+valor+descrição+`FITID`; resultado independente da ordem.

### Actions (só `async`, `userId` da sessão)

- `src/features/reconciliation/parse-statement.ts`
  - `parseStatement(formData: FormData): Promise<{ ok, transactions | error }>`
  - Valida conta (`accountId` pertence ao `userId`), período, tamanho/tipo.
  - Retorna `NormalizedTx[]` — **não persiste nada**.
- `src/features/reconciliation/get-divergences.ts`
  - Recebe `NormalizedTx[] + accountId + período`, busca `Event` via lógica de `getEvents`,
    roda o engine no servidor, retorna `Divergence[]`.
  - Alternativa simples: rodar o engine no cliente (engine é puro). Preferir servidor
    para não trafegar `Event` a mais que o necessário.
- `src/features/reconciliation/apply-suggestion.ts`
  - `createEventFromStatement` (tipo + categoria da linha), `confirmEventFromDivergence`,
    `createTransferFromStatement` (conta destino/origem da linha).
  - Delegam para `create-event.ts` / `update-event.ts` / `create-transfer.ts` existentes,
    herdando validações, convenção de sinal e cota mensal de lançamentos.
- `src/features/reconciliation/index.ts` reexporta o domínio.

### UI

- Rota `conciliacao/`: seletor de conta + período opcional + upload (CSV/OFX) + lista de
  divergências com filtro por `kind` e contadores + ações por linha.
- Componentes `src/components/reconciliation/` (`reconciliation-workspace.tsx`,
  `divergence-row.tsx` — `"use client"` só aqui); reusa `EventCategorySelect`.
- Entrada no menu lateral e no bottom nav mobile ("Conciliação", ícone `ArrowLeftRight`).
- Sem widget global nesta fase.
- Mensagens de erro claras: "linha 12: valor inválido" (nunca stack trace).

## Arquivos (criar/alterar)

Criar:

- `src/features/reconciliation/parsers/csv.ts`
- `src/features/reconciliation/parsers/ofx.ts`
- `src/features/reconciliation/parsers/normalize.ts` (moeda/data/descrição)
- `src/features/reconciliation/parse-statement.ts`
- `src/features/reconciliation/get-divergences.ts`
- `src/features/reconciliation/apply-suggestion.ts`
- `src/features/reconciliation/index.ts`
- `src/lib/engines/reconciliation.ts`
- `src/lib/engines/reconciliation.test.ts`
- `src/features/reconciliation/parsers/*.test.ts` (fixtures anonimizadas)
- `src/app/(app)/conciliacao/page.tsx`
- `src/components/reconciliation/*` (upload, tabela — `"use client"` só aqui)

Alterar:

- Menu lateral (adicionar "Conciliação").
- Nada no schema Prisma. Nada em `env`.

## Testes (Vitest)

- CSV: `;` e `,`, cabeçalhos PT/EN, `1.234,56`, negativos, parênteses, datas variadas.
- OFX: 2 bancos reais anonimizados, `FITID` preservado, `TRNAMT` negativo.
- Engine: matched / missing ambos lados / value_mismatch / tolerância ±3 dias /
  ignora `SKIPPED` e `TRANSFER` / centavos exatos (`0,10 + 0,20`-style).
- Actions: isolamento por `userId` (conta de outro usuário → erro), arquivo >10MB → erro.

## Critérios de aceite (deployável)

- [x] Upload CSV e OFX funciona de ponta a ponta sem IA e sem nova tabela.
- [x] Divergências classificadas corretamente nos 5 `kind`s.
- [x] 1 clique cria/confirma `Event`/`Transfer` com sinal e status corretos; nada é criado sozinho.
- [x] Recarregar a página descarta o extrato (nada retido).
- [x] `bun run ts-check`, testes e `bun run build` passam (27 testes novos; `build`
      com rota `/conciliacao`. Suíte total: 128 passam; `polar-subscriptions.test.ts`
      falha por falta de env no shell — pré-existente, verificado sem estas mudanças).
- [x] Rollback: remover a rota do menu desativa a feature sem afetar o resto.

> Testes de action com banco não foram automatizados (padrão do repo: só engines e
> billing têm testes); isolamento por `userId` garantido por lookup de conta
> escopado (`findFirst({ id, userId })`) em `parse-statement` e `get-divergences`.
