# Fase 00 — Setup na Meta (sem código)

- Status: Proposto
- Pré-requisito de todas as fases seguintes.
- Tempo estimado: ~1h (maioria aguardando verificação da Meta).

## Objetivo

Ter número, tokens e webhook configurados na Meta para a Cloud API oficial direta
(sem BSP), no modo reativo (usuário chama → Vero responde em até 24h, gratuito).

## Passo a passo

1. **Meta Business Manager** (`business.facebook.com`): criar/verificar empresa
   (CNPJ). A verificação leva 1–3 dias — fazer primeiro.
2. **Criar app** em `developers.facebook.com` → adicionar produto **WhatsApp** →
   criar/associar o **WABA** (WhatsApp Business Account).
3. **Conectar o número**: pode ser o pessoal via **Coexistence** (app do celular
   continua funcionando junto com a API) ou um número novo dedicado.
4. **Tokens e IDs** (guardar em local seguro, nunca versionar):
   - `WHATSAPP_ACCESS_TOKEN` (token permanente do app)
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_APP_SECRET` (para validar `X-Hub-Signature-256`)
   - Definir `WHATSAPP_VERIFY_TOKEN`: string aleatória longa (você inventa).
5. **Webhook**: `https://<seu-app>.vercel.app/api/whatsapp/webhook`, assinar o
   campo **`messages`**. A rota só existirá após a fase 02 — a Meta permite
   cadastrar e validar depois (o `GET` de verificação será implementado lá).
6. **Templates**: não criar nenhum nesta fase. Resposta reativa não precisa de
   template aprovado.

## Resultado esperado

- [ ] Empresa verificada, WABA ativo, número conectado.
- [ ] Os 4 valores de env anotados (serão cadastrados na Vercel na fase 02).
- [ ] Webhook cadastrado (validação concluída na fase 02).

## Custo esperado (uso pessoal reativo)

~R$ 0 de tarifa Meta (mensagem de serviço dentro de 24h é gratuita). Só infra
Vercel existente.

## Próxima fase

[Fase 01 — Vínculo número ↔ usuário](./fase-01-vinculo.md).
