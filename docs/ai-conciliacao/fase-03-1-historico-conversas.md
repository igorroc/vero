# Fase 03.1 — Histórico de conversas do chat

- Status: **Proposta** (planejamento antes da fase 04)
- Pré-requisito: fase 03 no ar (página `/assistente` com mocks).
- Deploy isolado: **sim**. Schema novo sem tocar tabelas existentes; com flag
  desligada, a página opera como hoje (sessão, sem banco).

## Objetivo

Persistir conversas e mensagens do Assistente para que a pessoa usuária veja
conversas passadas, continue de onde parou (com contexto) e gerencie a lista.
Troca os mocks atuais por dados reais, sem mudar o fluxo de resposta
(tools read-only, sanitização e regras do prompt continuam iguais).

Decisões do usuário (levantadas antes da escrita):

1. **Conteúdo:** só o texto final — `role` + texto sanitizado já exibido.
   Sem reasoning, steps ou deltas brutos.
2. **Contexto ao continuar:** últimas **N = 20** mensagens como contexto do
   modelo (constante `AI_HISTORY_LIMIT`, sem custo extra de config).
3. **Títulos e gestão:** título automático **gerado pela IA já no MVP**
   (fallback determinístico = 1ª pergunta truncada quando a IA falha),
   + renomear + buscar. Excluir incluído por padrão (higiene + LGPD);
   sem fixar por ora.
4. **Mocks:** remover tudo (`assistant-mocks.*` deletados); lista mostra só
   conversas reais, vazio mostra estado inicial.

## Fora do escopo

- Editar/regenerar mensagem individual, fixar conversa, compartilhar/exportar.
- Título gerado pela IA (evolução futura).
- Tempo real multi-dispositivo (cada aba carrega do banco ao abrir; sem socket).
- Contadores/cotas (fase 04 — esta fase só cria a base que a 04 vai contar).
- Widget flutuante: **continua sem histórico** (só sessão). Persistência é só
  da página `/assistente`.

## Design

### Schema (`prisma/schema/ai-chat.prisma`, novo — migration pelo usuário)

```prisma
model AiConversation {
  id        String         @id @default(cuid())
  userId    String
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String         @default("Nova conversa")
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  messages  AiMessage[]

  @@index([userId, updatedAt])
}

enum AiMessageRole {
  USER
  ASSISTANT
}

model AiMessage {
  id             String        @id @default(cuid())
  conversationId String
  conversation   AiConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           AiMessageRole
  content        String        // texto sanitizado exibido (MarkdownText renderiza de novo)
  createdAt      DateTime      @default(now())

  @@index([conversationId, createdAt])
}
```

Notas:

- `content` guarda o **texto sanitizado** (`sanitizeAssistantReply`), nunca o
  rascunho vazado. Blocos ` ```chart ` são Markdown puro — re-renderizam.
- `updatedAt` da conversa é atualizado a cada mensagem (ordenação da lista).
- Contagem da fase 04 usa `AiMessage WHERE role = USER AND createdAt no mês`
  (caminho principal; o fallback `AiUsage` da fase 04 deixa de ser necessário
  para o chat).
- Após alterar: `bun run generate`. Criação/aplicação da migration é do
  usuário (`AGENTS.md`). Sem `migrate:reset` sem pedido explícito.

### Fluxos

```
Página /assistente (lista via Server Action, busca server-side no título)
  -> abrir conversa: getConversation(id) valida userId, devolve últimas N
  -> ChatPanel remontado por conversationId; histórico renderizado como
     mensagens reais (sem bloco de exemplo; mocks deletados)
  -> enviar: POST /api/ai/chat { messages, conversationId? }
     - sem conversationId: cria conversa + salva msg do usuário + titulo
       provisório "Nova conversa"
     - com conversationId: valida dono, prefixa últimas N salvas ao contexto,
       salva msg do usuário, faz stream, onFinish salva resposta sanitizada
       (vazia/erro NÃO salva) e atualiza updatedAt
     - após a 1ª troca: título gerado pela IA a partir da 1ª pergunta
       (máx. 6 palavras, PT-BR; fallback = 1ª pergunta truncada em 60 chars)
     - responde conversationId ao cliente (header `x-conversation-id`) para
       a lista refletir sem reload
  -> renomear (inline na lista) | excluir (com confirmação, cascade) | buscar
```

`get_financial_summary`, prompt e sanitização: **inalterados**. A IA continua
sem saber que existe banco de chat — histórico entra como `messages` normais.

### Arquivos (criar/alterar/deletar)

Criar:

- `prisma/schema/ai-chat.prisma` (modelos acima).
- `src/features/ai-chat/conversations.ts` (`"use server"`, só `async`):
  `listConversations(query?)`, `getConversation(id)`,
  `renameConversation(id, title)`, `deleteConversation(id)` —
  todas com `userId` da sessão, nunca do cliente.
- Testes: isolamento `userId` (2 usuários), cascade, janela N, título,
  busca, resposta vazia não salva, route sem sessão → 401.

Alterar:

- `src/app/api/ai/chat/route.ts`: aceita `conversationId?`, prefixa
  histórico (últimas N), salva user + assistant (onFinish), header de retorno.
- `src/components/ai-chat/assistant-page-content.tsx`: lista/busca via
  actions, sem mocks; estado vazio inicial.
- `src/components/ai-chat/chat-panel.tsx`: aceita `conversationId` +
  `initialMessages` (histórico real); prop `leadMessages` sai de cena com
  os mocks.
- `src/features/ai-chat/index.ts`: exporta actions/constante.
- `docs/ai-conciliacao/README.md`: registra a fase 03.1 na lista.

Deletar:

- `src/components/ai-chat/assistant-mocks.ts` (+ `.test.ts`).

## Testes

- Cada action retorna/salva só dados do `userId` da sessão (2 usuários).
- Excluir conversa apaga mensagens (cascade); ler conversa alheia → erro.
- Contexto limitado às últimas N mensagens, em ordem cronológica.
- Título IA após a 1ª troca (fallback truncado se a IA falhar),
  renomear valida não-vazio; busca filtra por título (case-insensitive).
- Resposta vazia ou com erro de provedor **não** cria `AiMessage`.
- `bun run ts-check`, `bun test`, `bun run build` passam; `bun run generate`
  após o schema. Sem criar/aplicar migrations (responsabilidade do usuário).

## Critérios de aceite

- [ ] Lista mostra conversas reais ordenadas por atividade, com busca
      funcionando; mocks removidos do código.
- [ ] Abrir conversa exibe o histórico real e continuar mantém o assunto
      (últimas 20 como contexto).
- [ ] Recarregar a página preserva tudo; nova conversa começa vazia.
- [ ] Renomear e excluir funcionam (excluir com confirmação).
- [ ] Mensagens do usuário nunca vazam entre usuários (teste com 2 contas).
- [ ] Widget flutuante inalterado (segue sem histórico).
- [ ] Fase 04 consegue contar `AiMessage` de `role = USER` no mês.
