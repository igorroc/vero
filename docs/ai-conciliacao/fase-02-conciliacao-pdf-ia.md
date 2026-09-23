# Fase 02 — Conciliação via PDF com IA (sem chat)

- Status: Proposto
- Pré-requisito: Fase 01 deployada (reutiliza engine, contratos e tela).
- Deploy isolado: **sim**. Se a 01 não estiver no ar, esta fase leva junto o engine
  (cópia idêntica do contrato do `README.md`); nunca depende da fase 03 ou 04.

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

- Provedor sugerido (custo-benefício): **OpenAI `gpt-4o-mini`** via **Vercel AI SDK**
  (`ai` + `@ai-sdk/openai`), com `OPENAI_API_KEY` validada em `src/lib/env.ts` e
  documentada em `.env.example`. Abstração via AI SDK permite trocar para
  Gemini Flash depois sem reescrever.
- Prompt pede array JSON `{date, amountCents, description}` + `confidence` por linha.
  Validação rígida com `zod`: data válida, `amountCents` inteiro, descrição não vazia.
- Pós-validação determinística (sem IA): soma das linhas vs total do período quando o
  PDF informa; linhas com `confidence` baixa entram como `needs_review` (usuário edita
  valor/data na tela antes de comparar).
- Limites: PDF até 10MB / ~30 páginas; páginas excedentes → erro orientando a fatiar.
- Custo controlado: PDF nunca passa pelo chat; uma chamada de extração por upload.
  Logar apenas `fileHash + nº linhas + modelo` (nunca conteúdo bancário).

### Arquivos (criar/alterar)

Criar:

- `src/lib/ai/client.ts` (instancia provider a partir do env)
- `src/lib/ai/statement-schema.ts` (schemas `zod` da extração)
- `src/features/reconciliation/parsers/pdf.ts` (chamada IA + validação)
- `src/features/reconciliation/extract-pdf-statement.ts` (Server Action `async`)
- Testes: schemas + pós-validação com fixtures JSON anonimizadas (sem chamar IA real;
  mock do provider).

Alterar:

- `src/features/reconciliation/parse-statement.ts`: aceita `application/pdf` e delega.
- Tela `conciliacao/`: dropzone passa a aceitar `.pdf`; badge "extraído via IA" +
  estado `needs_review` editável.
- `src/lib/env.ts` + `.env.example`: `OPENAI_API_KEY` (opcional; sem ela, PDF mostra
  "recurso indisponível", CSV/OFX continuam funcionando).
- `package.json`: `ai`, `@ai-sdk/openai`, (já existe `zod`).

Não alterar: schema Prisma (nada novo), engine (mesmo), apply (mesmo).

## Testes (Vitest, sem custo de IA)

- Schema rejeita valor float, data inválida, descrição vazia.
- Pós-validação acusa soma divergente e marca `needs_review` em confiança baixa.
- Action sem `OPENAI_API_KEY` → erro amigável, CSV/OFX intactos.
- Isolamento por `userId` herdado da fase 01.

## Critérios de aceite (deployável)

- [ ] Upload PDF gera `NormalizedTx[]` válido e cai na mesma tabela de divergências.
- [ ] Linha de baixa confiança exige revisão manual antes de comparar.
- [ ] Sem chave de IA, PDF desabilita com mensagem; CSV/OFX funcionam.
- [ ] Nenhum PDF ou transação persiste após sair da página.
- [ ] `bun run ts-check`, `bun test`, `bun run build` passam.
- [ ] Rollback: remover `.pdf` do dropzone + action volta à fase 01 sem resíduo.
