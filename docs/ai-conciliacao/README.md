# IA + Conciliação de Extratos — Visão Geral

- Status: Proposto
- Data: 2026-09-23
- Decisões do usuário: 100 msgs + 10 conciliações/mês no Plus; **não reter transações de extrato** (extrair, comparar, descartar).

## Problema

A pessoa usuária quer tirar dúvidas sobre o financeiro atual e, principalmente, anexar
extratos para comparar com os lançamentos (`Event`) e validar divergências.

## Princípios (invioláveis, conforme `AGENTS.md`)

- Valores monetários como **inteiros em centavos**. Nunca `float` para dinheiro.
- `CONFIRMED` afeta saldo real; `PLANNED` só projeção/limite diário; `SKIPPED` não afeta nada.
- Saldo da conta = `saldo inicial + soma dos eventos confirmados` da conta.
- Receitas positivas; despesas e investimentos negativos.
- Toda leitura/mutação respeita o `userId` da sessão. Nunca confiar em ID vindo do cliente.
- Cálculos puros e determinísticos ficam em `src/lib/engines/` com testes Vitest.
- Server Actions (`"use server"`) exportam somente funções `async`.
- Sem migration manual: schema em `prisma/schema/*`, `bun run generate` após alterar.
  Criação/aplicação de migration é do usuário.

## Decisão arquitetural central

**A IA nunca decide conciliação sozinha e nunca acessa o banco direto.**

| Camada | Responsabilidade | Usa IA? |
| --- | --- | --- |
| Parsers CSV/OFX | Extrair transações do arquivo | Não — código puro |
| Extração PDF | Extrair transações do PDF | Sim — vision + saída estruturada validada por `zod` |
| Motor de conciliação | Comparar extrato x `Event` por regra fixa | Não — engine puro + Vitest |
| Chat | Explicar, responder dúvidas, sugerir texto | Sim — tool-calling, só leitura |
| Aplicação (1 clique) | Criar/confirmar/ajustar `Event` | Não — reusa actions existentes |

Por que assim: extrato exige precisão de centavos e data. Regra fixa evita alucinação,
custa menos e é testável. A IA entra onde ela é boa: linguagem e PDF não-estruturado.

## O que significa "não reter transações"

- O arquivo original **nunca é persistido** (nem em disco, nem em blob, nem em tabela).
- As transações normalizadas vivem **só em memória durante a sessão de conciliação**
  (parse no servidor → retorno para o cliente → comparação → descarte ao sair/recarregar).
- O que persiste são apenas os efeitos aprovados pela pessoa usuária:
  `Event` criado/confirmado/ajustado via actions existentes.
- Opcional (fase 04): persistir **contadores anonimizados** para cota
  (ex.: `1 conciliação em 2026-09`), sem valores, descrições ou dados bancários.
  Nada de `StatementImport`/`StatementTransaction` em banco.

## Fases (cada uma deployável isoladamente)

Cada fase pode subir ao servidor sozinha sem quebrar o app. Nenhuma fase depende de
fase futura; fases 02–04 reutilizam contratos das anteriores quando presentes, mas
trazem fallback próprio. Detalhes em cada arquivo:

- [Fase 01 — Conciliação via CSV/OFX (sem IA)](./fase-01-conciliacao-csv-ofx.md)
- [Fase 02 — Conciliação via PDF com IA (sem chat)](./fase-02-conciliacao-pdf-ia.md)
- [Fase 03 — Chat de IA para dúvidas + conciliação](./fase-03-chat-ia.md)
- [Fase 04 — Limites por plano (Plus)](./fase-04-limites-por-plano.md)

Ordem de deploy sugerida: 01 → 02 → 03 → 04. É possível pular a 02 (só CSV/OFX)
e ir direto para 03, ou subir a 04 por último como gate.

## Contratos compartilhados (estáveis entre fases)

```ts
// Transação normalizada — existe só em memória, nunca persiste
type NormalizedTx = {
  date: string // YYYY-MM-DD
  amountCents: number // int, + receita / - despesa
  description: string // texto original sanitizado
  fitId: string | null // OFX FITID quando houver, para idempotência em tela
}

type DivergenceKind =
  | "matched"
  | "missing_in_vero" // está no extrato, não está nos Events
  | "missing_in_statement" // está nos Events CONFIRMED, não está no extrato
  | "value_mismatch" // data+descrição batem, valor difere

type Divergence = {
  kind: DivergenceKind
  statementTx: NormalizedTx | null
  eventId: string | null
  hint: string // texto determinístico do motor, sem IA
}
```

Regra de match (motor, todas as fases iguais):

1. Valor em centavos **exato**.
2. Data com tolerância de **±3 dias**.
3. Desempate por similaridade de descrição (normalizada: minúsculas, sem acento/pontuação).
4. `TRANSFER` e `SKIPPED` nunca participam; comparação usa `CONFIRMED` contra extrato
   (extrato é realidade bancária) + `PLANNED` próximo como sugestão de confirmação.

## Validação padrão de cada fase

```bash
bun run ts-check
bun test
bun run build
```
