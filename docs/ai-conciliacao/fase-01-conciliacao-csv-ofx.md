# Fase 01 — Conciliação via CSV/OFX (sem IA)

- Status: Proposto
- Pré-requisito: nenhum (só código atual).
- Deploy isolado: **sim**. Sobe sozinha; sem IA, sem banco novo, sem gate de plano.

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
  x Event[] CONFIRMED do período (via getEvents com userId da sessão)
  -> Divergence[] -> tabela + botões [Criar] [Confirmar] [Ignorar]
  -> apply-suggestion.ts reusa create-event/update-event existentes
```

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

- `src/lib/engines/reconciliation.ts` + `reconciliation.test.ts`
  - Entrada: `NormalizedTx[]` + `Event[]` (só `CONFIRMED`, sem `TRANSFER`/`SKIPPED`).
  - Saída: `Divergence[]` conforme contrato do `README.md`.
  - Normalização de descrição: minúsculas, remove acento/pontuação/espaço duplo.
  - Match: valor exato + data ±3 dias; desempate por similaridade (Jaccard de tokens).
  - `value_mismatch`: mesma data (±3d) + descrição similar, valor diferente.

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
  - `createMissingEvent`, `confirmPlannedEvent`, `dismissSuggestion` (só estado de tela).
  - Criação/confirmação delegam para `create-event.ts`/`update-event.ts` existentes,
    herdando validações e convenção de sinal.
- `src/features/reconciliation/index.ts` reexporta o domínio.

### UI

- Rota `conciliacao/`: seletor de conta + período + dropzone (CSV/OFX) + tabela de
  divergências com filtro por `kind` + botões de ação por linha.
- Entrada no menu lateral. Sem widget global nesta fase.
- Mensagens de erro claras: "linha 12: valor inválido `abc`" (nunca stack trace).

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

- [ ] Upload CSV e OFX funciona de ponta a ponta sem IA e sem nova tabela.
- [ ] Divergências classificadas corretamente nos 4 `kind`s.
- [ ] 1 clique cria/confirma `Event` com sinal e status corretos; nada é criado sozinho.
- [ ] Recarregar a página descarta o extrato (nada retido).
- [ ] `bun run ts-check`, `bun test`, `bun run build` passam.
- [ ] Rollback: remover a rota do menu desativa a feature sem afetar o resto.
