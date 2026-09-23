# Fase 02 — Conciliação via PDF com IA (sem chat)

- Status: **Concluída** (implementada e validada: `ts-check`, testes e `build` passando)
- Pré-requisito: Fase 01 ✅ (reutiliza engine, contratos e tela).
- Deploy isolado: **sim**. Sem chave de IA, PDF desabilita com mensagem; CSV/OFX intactos.

## Objetivo

Adicionar suporte a extrato **PDF** na mesma tela de conciliação, usando IA só para
**extração estruturada** (vision → JSON validado). Sem chat nesta fase.

## Fora do escopo

- Chat/conversação (fase 03). Explicações em linguagem natural continuam sendo o
  `hint` determinístico do motor.
- OCR local; PDF escaneado/imagem de baixa qualidade entra como erro orientado
  ("exporte o PDF textual do banco") no MVP.
- Retenção de arquivo ou transações (mantida a decisão: extrair → comparar → descartar).

## Design

```
Upload PDF -> extract-pdf-statement.ts (server)
  -> IA vision + structured output (zod) -> NormalizedTx[] (memória)
  -> mesmo engine + mesma tabela + mesmo apply da fase 01
  -> descarta PDF e transações ao sair
```

### Extração (único ponto com IA)

- Provedor trocável via **Vercel AI SDK** (`ai` + `@ai-sdk/openai` + `@ai-sdk/google`
  - `@ai-sdk/openai-compatible`).
    `src/lib/ai/client.ts` lê `AI_PROVIDER` (`openai`|`google`|`openrouter`) + `AI_MODEL`
    do env — trocar de modelo é só mudar env, sem reescrever código.
- Opções: `openai` + `gpt-4o-mini` (pago, <US$ 0,01 por extrato, sem treino com os
  dados) ou `openrouter` + `openrouter/free` (gratuito, 50 req/dia sem cartão; router
  escolhe sozinho um modelo free com PDF + JSON + tools). No OpenRouter, desligar o
  treino com seus dados e ativar ZDR em Privacy settings.
- Prompt pede array JSON `{date, amountCents, description, confidence}`.
  Validação rígida com `zod` + pós-validação determinística (`toNormalizedTx`).
- **Fallback sem `structured-outputs`**: modelos gratuitos do router podem rejeitar
  `response_format` (400). Nesse caso `extractPdfStatement` tenta de novo via
  `generateText` (`extractViaText`) e valida o JSON com o mesmo schema.
- Prompt entende sufixos `D`/`C` da Caixa (`228,51 D` → -22851) e datas com hora.
- Linhas com `confidence < 0.7` entram em revisão manual na tela (`PdfReview`:
  edita data/valor, remove linha) antes de comparar.
- Limite: PDF até 10MB; sem contagem de páginas (sem dep nova) — erro orienta a fatiar.
- Custo controlado: uma chamada de extração por upload; log só com
  `hash + nº linhas + modelo` (nunca conteúdo bancário).

### Arquivos (criar/alterar)

Criar:

- `src/lib/ai/client.ts` (provedor via env + `AiNotConfiguredError`)
- `src/lib/ai/statement-schema.ts` (+ `statement-schema.test.ts`: 8 testes)
- `src/features/reconciliation/parsers/pdf.ts` (+ `pdf.test.ts` com
  `MockLanguageModelV4`, sem custo de API)
- `src/features/reconciliation/extract-pdf-statement.ts` (Server Action `async`)

Alterar:

- `src/features/reconciliation/parse-statement.ts`: aceita `.pdf` e delega à action
  de extração (retorna `source: "pdf"` + `model`).
- Tela `conciliacao/`: aceita `.pdf`; após extração, etapa de revisão (`PdfReview`)
  com badge "Extraído via IA · modelo" — compara direto se tudo com boa confiança.
- `src/lib/env.ts` + `.env.example`: `AI_PROVIDER`, `AI_MODEL`, `OPENAI_API_KEY`,
  `GOOGLE_GENERATIVE_AI_API_KEY`, `OPENROUTER_API_KEY` (todas opcionais).
- `package.json`: `ai`, `@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/openai-compatible`.

Não alterar: schema Prisma (nada novo), engine (mesmo), apply (mesmo).

## Testes (Vitest, sem custo de IA)

- Schema rejeita valor float, data inválida, descrição vazia.
- Pós-validação acusa soma divergente e marca `needs_review` em confiança baixa.
- Action sem `OPENAI_API_KEY` → erro amigável, CSV/OFX intactos.
- Isolamento por `userId` herdado da fase 01.

## Critérios de aceite (deployável)

- [x] Upload PDF gera `NormalizedTx[]` válido e cai na mesma tabela de divergências.
- [x] Linha de baixa confiança exige revisão manual antes de comparar.
- [x] Sem chave de IA, PDF desabilita com mensagem; CSV/OFX funcionam.
- [x] Nenhum PDF ou transação persiste após sair da página.
- [x] `bun run ts-check`, `bun test` (140/140), `bun run build` passam.
- [x] Rollback: remover `.pdf` do dropzone + action volta à fase 01 sem resíduo.

> Validação manual feita com chave real (OpenRouter gratuito): PDF anonimizado do
> Inter extraiu **35/35 transações** (igual ao CSV/OFX), 0 ignoradas, ~84s.
> Ressalva: o router free nem sempre suporta `response_format` nativo — a validação
> `zod` + `needs_review` é a rede de segurança nesses casos.
>
> Descoberta com o PDF da Caixa: o OpenRouter **parseia até scan** (o texto veio no
> `file_annotations`), mas o modelo free servido rejeitou `structured-outputs`
> (400). Correções aplicadas: fallback `extractViaText`, prompt com sufixos `D`/`C`
> e datas com hora, e logs de erro sanitizados (o erro cru carrega o extrato no
> `responseBody` — nunca logar o objeto inteiro).
