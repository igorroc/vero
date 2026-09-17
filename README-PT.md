# Vero

O Vero e uma plataforma de planejamento financeiro pessoal orientada ao futuro. Ela organiza contas e lancamentos, projeta o fluxo de caixa e ajuda a definir quanto pode ser gasto com seguranca.

## Recursos atuais

- Dashboard com saldo consolidado, projecao, alertas e limite de gastos.
- Contas bancarias, dinheiro, investimentos e transferencias entre contas.
- Lancamentos planejados, confirmados e ignorados, com categorias e edicao.
- Fluxo de caixa para 30, 60 ou 90 dias.
- Orcamentos por categoria e relatorios de orcamento e gastos por categoria.
- Dividas, parcelas e pagamentos.
- Metas de patrimonio e planos de investimento.
- Autenticacao por sessoes, configuracoes de reserva e horizonte de calculo.
- Base de assinaturas Stripe, catalogo comercial e painel inicial de Super Admin.

Consulte [docs/FUNCIONALIDADES.md](docs/FUNCIONALIDADES.md) para regras de negocio e limitacoes conhecidas. A especificacao e o andamento da monetizacao estao em [docs/monetizacao](docs/monetizacao).

## Stack

- Next.js 16, React 18 e TypeScript.
- PostgreSQL e Prisma.
- NextUI, Tailwind CSS, Lucide e Recharts.
- Server Actions por dominio e motores financeiros puros testados com Vitest.

## Requisitos

- Bun.
- Docker e Docker Compose, para o PostgreSQL local.

## Inicio rapido

1. Instale as dependencias:

```bash
bun install
```

2. Crie `.env` a partir de `.env.example` e preencha as credenciais locais. As variaveis Stripe so sao necessarias para o fluxo de cobranca.

3. Inicie o banco:

```bash
bun run compose:up
```

4. Aplique as migrations existentes e gere o cliente Prisma:

```bash
bun run migrate
```

5. Inicie a aplicacao:

```bash
bun run dev
```

Abra `http://localhost:3000`.

## Validacao

```bash
bun run ts-check
bun test
bun run build
```

## Estrutura

```text
src/
  app/          Rotas e paginas do App Router
  components/   Componentes de interface
  features/     Server Actions e regras por dominio
  lib/engines/  Motores financeiros puros
  lib/          Infraestrutura compartilhada
  types/        Tipos e utilitarios financeiros
prisma/schema/  Schema Prisma dividido por dominio
docs/           Produto, funcionalidades e monetizacao
```

As orientacoes de contribuicao e arquitetura estao em `AGENTS.md` e [ARCHITECTURE.md](ARCHITECTURE.md).
