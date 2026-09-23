# WhatsApp + IA do Vero — Visão Geral

- Status: Proposto
- Data: 2026-09-23
- Decisões do usuário: **uso pessoal** (1 número, 1 usuário) · **consultas + lançamentos**
  ("gastei 50 no mercado") · **Cloud API oficial da Meta** (direta, sem BSP) ·
  hospedagem **Vercel**.

## Problema

A pessoa usuária quer conversar com a IA do Vero pelo WhatsApp: perguntar sobre
o financeiro ("quanto posso gastar hoje?", "como está meu fim de mês?") e lançar
eventos por texto ("gastei 50 no mercado", "recebi 2000 do freela").

## Por que Cloud API oficial direta

| Opção | Veredito |
| --- | --- |
| Cloud API oficial direta da Meta | ✅ Escolhida. Sem risco de ban, sem mensalidade, resposta reativa dentro da janela de 24h é **gratuita**. Exige só dev próprio (temos). |
| BSP (Take Blip, Zenvia, Twilio) | ❌ Mensalidade (R$ 99–500/mês) à toa para 1 usuário com time técnico próprio. |
| Evolution API / Z-API / Baileys (QR code) | ❌ Viola os termos da Meta; risco real de ban permanente do número pessoal em 2026. Só faria sentido para MVP descartável. |

Referências de preço/cenário pesquisadas em 2026-09: cobrança Meta por mensagem de
template entregue (marketing ~US$ 0,0625); **mensagem de serviço (resposta a quem
chamou, dentro de 24h) gratuita**; utilidade gratuita dentro da janela de 24h.

## Princípios (invioláveis, conforme `AGENTS.md`)

- Valores monetários como **inteiros em centavos**. Nunca `float` para dinheiro.
- `CONFIRMED` afeta saldo real; `PLANNED` só projeção/limite diário; `SKIPPED`
  não afeta nada. **WhatsApp só cria `PLANNED`** (fase 03); confirmar continua no app.
- Saldo da conta = `saldo inicial + soma dos eventos confirmados` da conta.
- Receitas positivas; despesas e investimentos negativos.
- Toda leitura/mutação respeita o `userId` resolvido **no servidor** via vínculo
  número → usuário. Nunca confiar em identificador vindo do cliente/webhook.
- Cálculos puros em `src/lib/engines/` com testes Vitest; IA só apresenta texto.
- Server Actions (`"use server"`) exportam somente funções `async`.
- Sem migration manual: schema em `prisma/schema/*`, `bun run generate` após
  alterar. Criação/aplicação de migration é do usuário.

## Decisão arquitetural central

**O WhatsApp é só um novo transporte para o mesmo núcleo de IA do chat web.**

| Camada | Responsabilidade |
| --- | --- |
| Meta Cloud API | Transporte (entrega/recebimento de mensagens) |
| `POST /api/whatsapp/webhook` | Valida assinatura, dedupe, resolve `userId`, responde 200 rápido |
| Núcleo `answerAsUser()` (novo, puro de transporte) | Guardrails → `generateText` com `buildSystemPrompt()` + tools → texto |
| `chatTools` (+ `create_planned_event` na fase 03) | Único acesso a dados; `userId` sempre do servidor |
| Formatação WhatsApp | Markdown → texto simples, split ≤ 4096 chars |

O chat web (`src/app/api/ai/chat/route.ts`, streaming SSE) passa a chamar o mesmo
núcleo — nenhuma divergência de comportamento entre web e WhatsApp.

## Fases (cada uma deployável isoladamente)

- [Fase 00 — Setup na Meta](./fase-00-setup-meta.md) — conta, número, tokens, webhook. Sem código.
- [Fase 01 — Vínculo número ↔ usuário](./fase-01-vinculo.md) — modelo `WhatsAppLink`, código `VERO-XXXXXX`.
- [Fase 02 — Webhook somente-leitura](./fase-02-webhook-leitura.md) — extrai núcleo `answerAsUser()`, webhook, reusa `chatTools` de leitura.
- [Fase 03 — Lançamentos por texto](./fase-03-lancamentos.md) — tool `create_planned_event` com confirmação em duas etapas.
- [Fase 04 — Hardening e operação](./fase-04-hardening.md) — cota por plano, rate limit, idempotência, observabilidade.

Ordem de deploy sugerida: 00 → 01 → 02 → 03 → 04. A 02 já entrega valor
(consultas) sem risco de escrita.

## Contratos compartilhados (estáveis entre fases)

```ts
// Núcleo de resposta — agnóstico de transporte (web ou WhatsApp)
async function answerAsUser(userId: string, text: string): Promise<string>

// Vínculo número → usuário (fase 01)
type WhatsAppLink = {
  userId: string // @unique
  phoneE164: string // @unique, ex. "+5511999998888"
  code: string | null // código de pareamento, expira em 15 min
  codeExpiresAt: Date | null
  verifiedAt: Date | null
}

// Entrada do webhook (fase 02) — subconjunto do payload Meta
type IncomingWhatsAppMessage = {
  waMessageId: string // idempotência
  fromE164: string // remetente normalizado
  text: string // messages[0].text.body
  timestamp: number
}
```

## Estado atual do chat (ponto de partida)

- Rota web: `src/app/api/ai/chat/route.ts` — auth via `getUserBySession()` (cookie),
  `streamText` + `chatTools`, `stopWhen: stepCountIs(5)`, guardrails antes do modelo.
- Tools de leitura: `get_financial_summary`, `get_events`, `get_categories`,
  `explain_divergences` (`src/features/ai-chat/tools.ts`).
- Prompt: `buildSystemPrompt()` com data atual (`src/features/ai-chat/prompts.ts`).
- Guardrails: `detectPromptInjection` + `refusalStreamResponse` (`guardrails.ts`).
- Histórico: `AiConversation`/`AiMessage` (`prisma/schema/ai-chat.prisma`,
  `src/features/ai-chat/conversations.ts`).
- Cota: `ai.chat.monthly` por plano (ver `docs/ai-conciliacao/fase-04-limites-por-plano.md`).
- Provedor IA trocável via env (`src/lib/ai/client.ts`, `src/lib/env.ts`).

## Validação padrão de cada fase

```bash
bun run ts-check
bun test
bun run build
```

Para alterações no schema, também `bun run generate`. Não criar/aplicar migrations;
informar ao usuário quando uma migration for necessária.
