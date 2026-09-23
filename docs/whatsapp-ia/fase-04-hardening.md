# Fase 04 — Hardening e operação

- Status: Proposto
- Deployável isoladamente: sim (endurece as fases 01–03).

## Checklist

### Cota por plano

- Chamar `checkLimit(ai.chat.monthly)` no núcleo `answerAsUser()` antes do
  `generateText` — igual ao `POST /api/ai/chat` (ver
  `docs/ai-conciliacao/fase-04-limites-por-plano.md`).
- Sem cota → resposta fixa curta com CTA de upgrade (texto simples, sem HTML).

### Rate limit por telefone

- Máximo 30 mensagens/minuto por `phoneE164` (janela deslizante em memória ou
  tabela simples). Excedeu → "calma, processando ainda…" (evita loop de custo IA).

### Idempotência (Meta retenta webhook)

- Tabela `WhatsAppProcessedMessage { waMessageId @id, userId, createdAt }`
  (novo modelo em `prisma/schema/whatsapp.prisma` + `bun run generate`;
  migration pelo usuário).
- `POST`: `create` condicional — se `waMessageId` já existe, retorna 200 sem
  reprocessar (evita lançar 2× o mesmo "gastei 50").

### Assinatura e auth

- `X-Hub-Signature-256` obrigatória em produção (tolera ausência só em
  `development` para teste com `curl`).
- Webhook nunca recebe `userId` — sempre resolve via `WhatsAppLink` no servidor.

### Observabilidade mínima

- Log estruturado por turno: `waMessageId`, `userId` (hash?), chars in/out,
  tool chamada, latência. Sem logar conteúdo financeiro além do necessário.
- Endpoint interno de saúde (opcional): última mensagem processada com sucesso.

### Privacidade / LGPD

- Opt-out: "SAIR" ou "PARAR" → desvincula o número e confirma por texto.
- "APAGAR" → apaga a conversa `"WhatsApp"` (`deleteConversation` existente).
- Documentar na resposta de vínculo o que fica salvo (histórico do chat).

## Testes (Vitest)

- Dedupe: mesmo `waMessageId` 2× → 1 processamento.
- Rate limit: 31ª mensagem no minuto → bloqueada.
- Opt-out: "SAIR" → vínculo removido, próxima mensagem pede código.

## Validação

```bash
bun run ts-check
bun test
bun run build
```

## Critério de pronto (todas as fases)

- [ ] "quanto posso gastar hoje?" no WhatsApp bate com o chat web.
- [ ] "gastei 50 no mercado" → confirmação → `PLANNED` visível no app.
- [ ] Número desconhecido não lê nada; código expirado não vincula.
- [ ] Reenvio do mesmo webhook não duplica lançamento.
- [ ] Sem envs do WhatsApp, o app sobe normalmente (503 amigável só no webhook).
