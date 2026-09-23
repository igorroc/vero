# Fase 03 — Chat de IA para dúvidas + conciliação

- Status: **Concluída** (implementada e validada: `ts-check`, testes e `build` passando)
- Decisões: sem histórico (só sessão, sem migration), default `openrouter/free`
  (troca via env), widget global com 2 funções.
- Deploy isolado: **sim**. Sem chave, chat responde 503 amigável; resto intacto.

## Objetivo

Widget global de chat que responde dúvidas ("como está meu financeiro?", "quanto posso
gastar até fim do mês?") com dados reais do usuário e explica divergências da
conciliação em linguagem natural. A IA **lê via tools, nunca escreve no banco**:
qualquer ação continua via botões (fase 01/02).

## Fora do escopo

- Escrita autônoma da IA (criar/confirmar `Event` direto — proibido).
- Limites por plano (fase 04). Nesta fase o chat funciona aberto (ou restrito por
  flag manual) para validar uso antes de gatear.
- Persistência de extratos (decisão mantida: extrato continua só em memória).

## Design

```
Widget global (AssistantWidget) em (app)/layout.tsx
  -> POST /api/ai/chat (streaming, AI SDK, provedor via env)
    -> system prompt: PT-BR, cita valores em R$, nunca inventa número
    -> tools server-side read-only, com userId da sessão:
       get_financial_summary | get_events | get_categories | explain_divergences
    -> sem histórico: só memória da sessão (sem banco, sem migration)
```

As-built: 4 tools (resumo do dashboard cobre saldos + limite + fluxo + alertas em
1 chamada) em vez de 6. `explain_divergences` recebe `Divergence[]` da tela —
o PDF original nunca sobe. Widget tem 2 funções (modal de novo lançamento via
`EventForm` existente + chat flutuante) e substituiu os FABs "bubble" de
Lançamentos e Dashboard.

### Tools (whitelist fechada, `userId` sempre da sessão)

- `get-balances`: reutiliza `getAccountBalances` (saldos confirmados).
- `get-events`: intervalo máx. 90 dias, sem templates; respeita `userId`.
- `get-cashflow-summary`: agrega `cashflow.ts` (totais + dias críticos, não dump diário).
- `get-spending-limit`: reutiliza `spending-limit.ts` (valor + decomposição).
- `get-categories`: nomes para classificar sugestões.
- `explain-divergences`: recebe `Divergence[]` do cliente e retorna explicação —
  formatação, não recálculo (o match continua sendo o engine).

System prompt fixa: responder em PT-BR, usar `CONFIRMED` para "real" e `PLANNED`
para "projeção", declarar incerteza ("não encontrei lançamentos no período") em vez
de inventar, e sugerir próximos passos com botões existentes.

### Conversas (persistência mínima)

Para histórico, persistir **só texto do chat** (sem dados de extrato):

```prisma
model AiConversation { id String @id @default(cuid()); userId String; title String?; createdAt DateTime @default(now()); @@index([userId]) }
model AiMessage { id String @id @default(cuid()); conversationId String; role String; content String; createdAt DateTime @default(now()); @@index([conversationId]) }
```

Migration criada/aplicada pelo usuário (`AGENTS.md`); `bun run generate` após.
Se quiser subir sem banco novo, o MVP pode operar **sem histórico** (memória por
sessão) e adicionar os modelos depois — comportamento idêntico no chat.

### Arquivos (criar/alterar)

Criar:

- `src/app/api/ai/chat/route.ts` (streaming, auth via `getUserBySession`)
- `src/features/ai-chat/tools.ts` (6 tools read-only)
- `src/features/ai-chat/prompts.ts` (system prompt — módulo sem `"use server"`)
- `src/features/ai-chat/conversations.ts` (actions `async` de histórico, se com banco)
- `src/components/ai-chat/chat-widget.tsx` (+ bolhas, upload-at�alho que redireciona
  para `/conciliacao`)
- Testes: prompts (sem número inventado), tools com isolamento `userId`, route sem
  sessão → 401.

Alterar:

- `src/app/(app)/layout.tsx`: monta `<ChatWidget />` (única alteração global).
- `prisma/schema/ai-chat.prisma`: modelos acima (opcional no MVP sem histórico).
- Tela `conciliacao/`: botão "Explicar com IA" que envia `Divergence[]` ao widget.

## Testes

- Cada tool retorna só dados do `userId` da sessão (teste com 2 usuários).
- Janela máxima de 90 dias e limite de eventos por chamada (evita estouro de contexto).
- Route sem sessão → 401; sem `OPENAI_API_KEY` → mensagem amigável, resto do app ok.

## Critérios de aceite (deployável)

- [x] Widget abre em qualquer página do `(app)` e responde com saldos, próximos eventos,
      limite diário e fluxo coerentes com os engines.
- [x] IA explica divergências da tela de conciliação sem recalcular matches
      (tool recebe a lista; formatação determinística testada).
- [x] IA nunca cria/altera `Event` diretamente; ações só via botões existentes.
- [x] Extrato continua descartável; chat nunca recebe o arquivo original.
- [x] `bun run ts-check`, `bun test` (160/160), `bun run build` passam.
- [x] Rollback: remover `<AssistantWidget />` do layout desativa tudo sem quebrar rotas.

> Validação manual pendente: 3 perguntas no widget (saldo, limite diário, explicar
> divergência) com a chave OpenRouter.
