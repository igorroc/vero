# Fase 02 — Webhook somente-leitura

- Status: Proposto
- Deployável isoladamente: sim. Entrega consultas ("quanto posso gastar hoje?",
  "como está meu fim de mês?") sem nenhum risco de escrita.

## Problema

O núcleo de IA mora acoplado à rota web com streaming
(`src/app/api/ai/chat/route.ts` usa `streamText` + `toUIMessageStreamResponse()`).
O WhatsApp precisa de **texto completo** (envio via REST da Meta), e a
autenticação é por vínculo (fase 01), não cookie.

## Solução em 3 passos

### 1. Extrair núcleo agnóstico de transporte

Novo `src/features/ai-chat/answer.ts` (sem `"use server"` no núcleo puro;
`userId` recebido como parâmetro do chamador autenticado):

```ts
// Pseudocontrato
import { generateText, stepCountIs } from "ai"

export async function answerAsUser(userId: string, text: string): Promise<string> {
  // 1. detectPromptInjection(text) → REFUSAL_INJECTION (igual à rota web)
  // 2. checkLimit(ai.chat.monthly) → mensagem de cota/upgrade se estourar
  // 3. getHistoryForModel(userId, whatsappConversationId) + saveChatMessage(USER)
  // 4. generateText({ model: getStatementModel(), system: buildSystemPrompt(),
  //      messages, tools: chatToolsLeitura, stopWhen: stepCountIs(5) })
  // 5. sanitizeAssistantReply() → toWhatsAppText() → saveChatMessage(ASSISTANT)
}
```

- Refatorar `src/app/api/ai/chat/route.ts` para chamar o mesmo núcleo
  (mantém `streamText` na borda web; o núcleo compartilha guardrails, prompt,
  tools e persistência). Nenhuma divergência web × WhatsApp.
- Conversa: `get-or-create` de `AiConversation` com título `"WhatsApp"` por
  usuário; reutiliza `saveChatMessage` / `getHistoryForModel` / `ensureConversationTitle`
  (título fixo — não gera título por IA para essa conversa).

### 2. Webhook `src/app/api/whatsapp/webhook/route.ts`

- `GET`: valida `hub.mode=subscribe`, `hub.verify_token === WHATSAPP_VERIFY_TOKEN`,
  devolve `hub.challenge`. (É o que valida o cadastro feito na fase 00.)
- `POST`:
  1. Valida `X-Hub-Signature-256` (HMAC com `WHATSAPP_APP_SECRET`) → 401 se inválido.
  2. Ignora `statuses[]`; extrai `messages[0]` (só `type=text`; áudio/imagem →
     resposta fixa "por enquanto só entendo texto").
  3. Normaliza `from` → E.164 → `resolveUserIdByPhone`:
     - desconhecido → pede código `VERO-XXXXXX` (ou vincula, se o texto for o código).
     - conhecido → `answerAsUser(userId, text)`.
  4. Envia resposta via `POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`
     com `WHATSAPP_ACCESS_TOKEN`.
  5. Sempre responde `200` rápido (`maxDuration = 60`); idempotência por
     `wa_message_id` (fase 04 detalha a tabela).
- Formatação `to-whatsapp-text.ts` (puro, testável): `**bold**` → `*bold*`,
  tabelas → listas com `-`, remove bloco ```` ```chart ````, garante ≤ 4096 chars
  com split em quebra de parágrafo (nunca corta número no meio).

### 3. Envs (`src/lib/env.ts` + `.env.example` + Vercel)

`WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`,
`WHATSAPP_APP_SECRET` — todos opcionais com zod (sem eles, webhook responde 503
amigável; resto do app intacto — mesmo padrão do `AiNotConfiguredError`).

## Testes (Vitest)

- `to-whatsapp-text`: markdown→texto, remoção de bloco chart, split 4096.
- Webhook `GET`: token certo/incorreto.
- Assinatura HMAC: válida/inválida.
- Roteamento: número desconhecido → pede código; texto não-texto → resposta fixa.

## Validação

```bash
bun run ts-check
bun test
bun run build
```

Teste manual fim a fim: mandar "quanto posso gastar hoje?" no WhatsApp e comparar
com a mesma pergunta no chat web (respostas devem convergir nos números).

## Próxima fase

[Fase 03 — Lançamentos por texto](./fase-03-lancamentos.md).
