# Fase 03 — Chat de IA para dúvidas + conciliação

- Status: Proposto
- Pré-requisito: fases 01 e 02 recomendadas, mas **não obrigatórias**:
  sem elas, o chat nasce respondendo dúvidas; a aba de conciliação aparece
  desabilitada com CTA para as fases anteriores.
- Deploy isolado: **sim**. Widget isolado; remover o componente desativa sem resíduo.

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
Widget global (client, "use client" só aqui) em (app)/layout.tsx
  -> POST /api/ai/chat (streaming, AI SDK + gpt-4o-mini)
    -> system prompt: PT-BR, cita valores em R$, nunca inventa número,
       sem acesso fora das tools, sem pedir/expor senha
    -> tools server-side read-only, com userId da sessão:
       get-balances | get-events | get-cashflow-summary
       get-spending-limit | get-categories | explain-divergences
    -> contexto de conciliação: o cliente envia Divergence[] atual (memória)
       para a IA explicar; o servidor nunca recebe o PDF original
```

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

- [ ] Widget abre em qualquer página do `(app)` e responde com saldos, próximos eventos,
      limite diário e fluxo coerentes com os engines.
- [ ] IA explica divergências da tela de conciliação sem recalcular matches.
- [ ] IA nunca cria/altera `Event` diretamente; ações só via botões existentes.
- [ ] Extrato continua descartável; chat nunca recebe o arquivo original.
- [ ] `bun run ts-check`, `bun test`, `bun run build` passam.
- [ ] Rollback: remover `<ChatWidget />` do layout desativa tudo sem quebrar rotas.
