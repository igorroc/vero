# Orientacoes para IAs

## Produto

Vero e uma plataforma de planejamento financeiro pessoal orientada ao futuro. A prioridade e ajudar a pessoa usuaria a entender o fluxo de caixa projetado, manter uma reserva de seguranca e saber quanto pode gastar por dia com seguranca.

Consulte `docs/FUNCIONALIDADES.md` antes de alterar regras de negocio. Em caso de divergencia, o comportamento implementado, os testes e `prisma/schema.prisma` sao a fonte de verdade.

## Stack e arquitetura

- Next.js 16 com App Router, React 18 e TypeScript.
- PostgreSQL acessado por Prisma; schema em `prisma/schema.prisma`.
- NextUI, Tailwind CSS e Lucide para a interface.
- Server Actions e logica de negocio em `src/features/`.
- Motores deterministas de calculo em `src/lib/engines/`, cobertos por Vitest.

Mantenha as responsabilidades separadas:

- `src/app/`: rotas e paginas finas; prefira Server Components.
- `src/components/`: componentes de interface. Use `"use client"` somente quando houver interatividade ou APIs do navegador.
- `src/features/<dominio>/`: Server Actions e logica de negocio por dominio.
- `src/lib/`: infraestrutura e utilitarios compartilhados.
- `src/lib/engines/`: calculos financeiros puros, sem acesso a banco ou interface.
- `src/types/`: tipos compartilhados.

## Regras financeiras inviolaveis

- Armazene e calcule valores monetarios como inteiros em centavos. Nunca use ponto flutuante para valores financeiros.
- `CONFIRMED` afeta o saldo real; `PLANNED` afeta apenas projecoes e limite diario; `SKIPPED` nao afeta nenhum calculo.
- O saldo de uma conta e `saldo inicial + soma dos eventos confirmados` da conta.
- Preserve a convencao de sinal: receitas sao positivas; despesas e investimentos sao negativos.
- Isole calculos de recorrencia, fluxo de caixa e limite diario nos motores existentes e crie ou atualize testes para qualquer alteracao de regra.
- Toda leitura e mutacao de dados deve respeitar o `userId` da sessao. Nunca confie em um identificador de usuario vindo do cliente.

## Convencoes de codigo

- Use TypeScript estrito, sem `any` e sem suprimir erros de tipo.
- Use `kebab-case` para arquivos e diretorios.
- Prefira exports nomeados e atualize o `index.ts` do dominio quando ele existir.
- Preserve os aliases `@/` para imports internos.
- Nao misture acesso direto ao Prisma em componentes de interface; mantenha-o em actions, features ou infraestrutura de servidor.
- Arquivos com `"use server"` devem exportar somente funcoes `async`; mova constantes e valores compartilhados para modulos sem essa diretiva. Exports de tipos sao permitidos.
- Evite alterar arquivos gerados, como `node_modules/` e `.next/`.
- Nunca exponha ou versiona segredos de `.env`; use `.env.example` para documentar novas variaveis.

## Banco de dados

- Altere o schema somente em `prisma/schema.prisma` e rode `bun run prisma:generate` para atualizar o schema. Não rode migration se não for solicitado pelo usuário.
- Avalie dados existentes antes de tornar campos obrigatorios, remover colunas ou alterar semantica de valores.
- Nao execute `migrate:reset` sem solicitacao explicita: o comando remove os dados locais.
- Mantenha transactions Prisma curtas e atomicas. Nunca execute loops, geracao em massa ou trabalho potencialmente lento dentro de uma transaction; prefira operacoes em lote como `createMany` ou uma acao dedicada.

## Validacao

Depois de alterar codigo, execute os comandos aplicaveis:

```bash
npm run ts-check
npm test
npm run build
```

Para alteracoes no schema, tambem execute `npx prisma generate` e valide a migracao apropriada. Relate claramente qualquer verificacao que nao puder ser executada.
