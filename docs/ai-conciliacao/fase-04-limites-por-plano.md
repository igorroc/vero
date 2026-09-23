# Fase 04 — Limites por plano (Plus)

- Status: Proposto
- Pré-requisito: qualquer combinação das fases 01–03 no ar.
- Deploy isolado: **sim**. Só adiciona guards; com tudo liberado por default atrás de
  flag, o deploy é neutro até a ativação comercial.

## Objetivo

Restringir IA e conciliação ao plano **Plus** com cotas decididas:
**100 mensagens + 10 conciliações/mês**, sem reter transações de extrato.

## Fora do escopo

- Mudar preços/checkout (só leitura de `entitlement` existente).
- Novos recursos de IA além de gatear o que as fases 01–03 já entregam.

## Design

Estende o catálogo existente (`src/features/billing/capabilities.ts`,
`docs/monetizacao/plano-guards-de-planos.md`) — servidor é autoridade final,
interface só reflete:

| Capacidade | Tipo | FREE | PLUS |
| --- | --- | --- | --- |
| `ai.chat.monthly` | limite | 0 (bloqueado) | 100/mês |
| `ai.reconciliation.monthly` | limite | 0 (bloqueado) | 10/mês |
| `ai.pdf-extraction` | booleano | bloqueado | liberado |

### Contagem sem reter dados bancários

- Chat: conta `AiMessage` com `role = "user"` + `createdAt` no mês-calendário
  (só se o histórico da fase 03 existir; senão, tabela mínima `AiUsage`
  `{userId, kind, createdAt}` — sem conteúdo).
- Conciliação: conta evento de uso por upload concluído (`AiUsage kind=reconciliation`
  ou `StatementImport` **só com `{userId, createdAt, sourceType, txCount}`** —
  sem valores, descrições, datas ou hash de conteúdo).
- Medição sempre no servidor a partir do `userId` da sessão; nunca recebe contagem
  do cliente. Segue o padrão `canUse`/`getLimit`/`checkLimit` + `withLimit` existente.

### Guards (depois do auth, antes de qualquer efeito/LLM)

| Ponto | Guard |
| --- | --- |
| `POST /api/ai/chat` | `checkLimit(ai.chat.monthly)` → 402/403 + CTA upgrade quando estourar |
| `parse-statement` / `extract-pdf-statement` (qualquer formato) | `checkLimit(ai.reconciliation.monthly)` antes de parsear/extrair |
| PDF especificamente | `canUse(ai.pdf-extraction)` antes de chamar o provider |
| CSV/OFX | entram na mesma cota `ai.reconciliation.monthly` (decisão: conciliação é o recurso Plus, independente do formato) |

Concorrência: usar `withLimit` (transação `Serializable`, padrão já existente) para
não ultrapassar a cota em chamadas paralelas. Custo de IA só incorre **após** o guard.

### Interface

- Widget e página `/conciliacao` exibem consumo (`37/100 mensagens`, `3/10
  conciliações`) e CTA de upgrade quando bloqueado — reflexo, nunca autoridade.
- Free vê entrada/teaser, mas a action/route nega no servidor.
- Super Admin: novas capacidades aparecem automaticamente na matriz existente
  (segue `plano-guards-de-planos.md` + seed `scripts/seed-plan-capabilities.ts`).

## Arquivos (criar/alterar)

Alterar:

- `src/features/billing/capabilities.ts`: 3 novas entradas + medição de uso.
- `scripts/seed-plan-capabilities.ts`: seeds Free/Plus das novas capacidades.
- `prisma/schema/billing.prisma` (ou novo `ai-usage.prisma`): `AiUsage`
  `{id, userId, kind, createdAt, @@index([userId, kind, createdAt])}` — só se o
  histórico do chat não for suficiente para contar; sem dados bancários.
- `src/app/api/ai/chat/route.ts`: guard + headers de cota restante.
- `src/features/reconciliation/parse-statement.ts` e `extract-pdf-statement.ts`: guard.
- `src/components/ai-chat/` e `conciliacao/`: exibição de uso + estados de bloqueio.
- Testes: `capabilities.test.ts` + testes de route/actions (Free negado, Plus dentro/
  fora da cota, downgrade mantém leitura mas bloqueia novo uso, concorrência).

Não alterar: engine, parsers, prompts (só gate em volta).

## Testes

- Free: chat → negado; upload qualquer formato → negado.
- Plus: dentro da cota → ok; 101ª msg / 11ª conciliação → negado com mensagem deUpgrade.
- Virada de mês zera o uso (mês-calendário).
- Downgrade: histórico visível, novo uso bloqueado; exclusão de `Event` continua livre.
- Isolamento `userId` + concorrência (10 chamadas paralelas na última unidade → 1 passa).

## Critérios de aceite (deployável)

- [ ] Free não usa chat nem conciliação (negado no servidor, não só na UI).
- [ ] Plus respeita 100/10 por mês-calendário, com contagem sem nenhum dado bancário.
- [ ] Sem gasto de IA quando o guard nega (checagem antes do provider).
- [ ] Painel Super Admin lista e edita as 3 capacidades com auditoria existente.
- [ ] `bun run ts-check`, `bun test`, `bun run build` (+ `bun run generate` se criar `AiUsage`) passam.
- [ ] Rollback: desabilitar guards (ou seed liberando Free) reabre sem quebrar; deploy
      com seeds ainda não rodados mantém comportamento das fases anteriores.
