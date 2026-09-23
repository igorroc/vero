# Fase 01 — Vínculo número ↔ usuário

- Status: Proposto
- Deployável isoladamente: sim (sem ela, o webhook da fase 02 rejeita tudo).

## Problema

O chat web autentica via cookie (`getUserBySession()` em
`src/lib/auth.ts`). O webhook do WhatsApp não tem cookie: chega só o telefone
do remetente. É preciso um vínculo **número → userId** criado e validado no
servidor, ou qualquer pessoa com o número do Vero leria seus dados financeiros.

## Solução: pareamento com código `VERO-XXXXXX`

Fluxo (mesmo padrão de parear TV/streaming):

1. Nas **Configurações** do app, botão "Vincular WhatsApp" → Server Action gera
   código `VERO-XXXXXX` (6 chars alfanuméricos, expira em 15 min) e exibe na tela.
2. Usuário manda `VERO-XXXXXX` para o número do Vero no WhatsApp.
3. Webhook valida código + expiração → grava vínculo e responde "vinculado ✅".
4. Mensagens seguintes do número vinculado resolvem `userId` direto.
5. "Desvincular" nas Configurações remove o vínculo.

## Alterações

### Schema (novo arquivo `prisma/schema/whatsapp.prisma`)

```prisma
model WhatsAppLink {
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  phoneE164     String    @unique // "+5511999998888"
  code          String? // código de pareamento pendente
  codeExpiresAt DateTime?
  verifiedAt    DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- Adicionar `whatsappLink WhatsAppLink?` na relação do `User`
  (`prisma/schema/users.prisma`).
- Após alterar: `bun run generate`. **Não criar/aplicar migration** (responsabilidade
  do usuário) — informar que `migrate dev` será necessária.

### Lógica (`src/features/whatsapp/` — novo domínio)

- `normalize-phone.ts` (puro, testável): normaliza para E.164
  (`55` + DDD + número; remove `wa.me/`, espaços, traços). Sem acesso a banco.
- `linking.ts` (`"use server"`): `generateLinkCode()`, `verifyLinkCode(phoneE164, code)`,
  `unlink()`, `resolveUserIdByPhone(phoneE164)` — todas conferindo
  `getUserBySession()` onde houver usuário logado; o webhook usa só
  `resolveUserIdByPhone` (nunca confia em id do payload).
- UI: botão + exibição de código em Configurações (reaproveitar padrão existente).

### Testes (Vitest)

- Normalização: `" (11) 99999-8888"` → `"+5511999998888"`, `"wa.me/5511..."`, inválidos.
- Código: expiração respeitada, código errado rejeitado, um usuário = um vínculo.

## Casos de borda

- Número desconhecido manda mensagem → resposta fixa pedindo o código
  (sem revelar nada de dados).
- Código expirado → pedir novo código nas Configurações.
- Troca de número → desvincular e parear de novo.

## Validação

```bash
bun run ts-check
bun test
bun run build
bun run generate
```

## Próxima fase

[Fase 02 — Webhook somente-leitura](./fase-02-webhook-leitura.md).
