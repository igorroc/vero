# Vero - Seu Copiloto Financeiro

## Visão Geral

O Vero é uma plataforma de planejamento financeiro pessoal focada no **futuro**, não apenas no rastreamento de despesas passadas. A aplicação atua como um "copiloto financeiro" que responde perguntas como:

- "O que vai acontecer com meu dinheiro?"
- "Quando o dinheiro vai entrar ou sair?"
- "Quanto posso gastar com segurança por dia?"
- "Estou no caminho certo para crescer meu patrimônio?"

---

## Funcionalidades Principais

### 1. Dashboard Principal

O dashboard oferece uma visão completa da sua saúde financeira em tempo real:

#### Cards de Resumo
- **Saldo Total**: Soma de todas as contas ativas
- **Limite Diário**: Quanto você pode gastar por dia com segurança
- **Projeção 30 Dias**: Variação líquida esperada no próximo mês
- **Gasto Médio/Dia**: Média de despesas diárias planejadas

#### Alertas Inteligentes
- **Eventos Críticos**: Identifica eventos que podem causar saldo negativo
- **Alerta de Saldo**: Avisa quantos dias até o saldo ficar negativo

#### Limite de Gastos Detalhado
Exibe a decomposição do cálculo:
- Saldo atual
- Despesas futuras planejadas
- Investimentos programados
- Reserva de segurança
- **Valor disponível para gastar por dia**

#### Próximos Eventos
Lista dos eventos financeiros dos próximos 7 dias com indicação visual de:
- Tipo (Receita, Despesa, Investimento)
- Valor
- Data

---

### 2. Gestão de Contas

Gerencie todas as suas contas financeiras em um só lugar.

#### Tipos de Conta Suportados
- **Conta Bancária** (BANK): Contas correntes e poupança
- **Dinheiro em Espécie** (CASH): Dinheiro físico
- **Conta de Investimento** (INVESTMENT): Corretoras, fundos, etc.

#### Funcionalidades
- Criar novas contas com saldo inicial
- Visualizar saldo atual de cada conta
- Visualizar saldo total consolidado
- Excluir contas (com confirmação)

#### Cálculo de Saldo
O saldo atual de cada conta é calculado automaticamente:
```
Saldo Atual = Saldo Inicial + Soma(Eventos Confirmados da Conta)
```

---

### 3. Gestão de Eventos Financeiros

Eventos são a base do sistema - representam qualquer movimentação financeira futura ou passada.

#### Tipos de Evento
- **Receita** (INCOME): Dinheiro entrando (salário, freelance, etc.)
- **Despesa** (EXPENSE): Dinheiro saindo (contas, compras, etc.)
- **Investimento** (INVESTMENT): Transferências para investimentos

#### Status do Evento
- **Planejado** (PLANNED): Evento futuro esperado - usado apenas para projeções
- **Confirmado** (CONFIRMED): Evento que realmente aconteceu - afeta o saldo real
- **Ignorado** (SKIPPED): Evento cancelado ou que não ocorreu

#### Tipos de Custo (para Despesas)
- **Recorrente** (RECURRENT): Gastos fixos como aluguel, contas, assinaturas
- **Excepcional** (EXCEPTIONAL): Gastos únicos como viagens, emergências

#### Eventos Recorrentes
Configure eventos que se repetem automaticamente:
- **Diário**: Todo dia
- **Semanal**: Toda semana
- **Quinzenal**: A cada 2 semanas
- **Mensal**: Todo mês
- **Anual**: Todo ano

O sistema gera automaticamente as ocorrências futuras para projeção.

#### Filtros de Visualização
- Todos os eventos
- Eventos passados
- Eventos de hoje
- Eventos futuros

#### Ações Disponíveis
- Criar novo evento
- Confirmar evento (marca como realizado)
- Ignorar evento (cancela)
- Excluir evento

---

### 4. Fluxo de Caixa (Cashflow Timeline)

Visualização dia a dia da projeção financeira.

#### Períodos Disponíveis
- 30 dias
- 60 dias
- 90 dias

#### Informações por Dia
- Data
- Saldo inicial do dia
- Eventos do dia (expansível)
- Variação líquida
- Saldo final do dia
- Indicadores visuais:
  - **Azul**: Hoje
  - **Amarelo**: Saldo abaixo da reserva de segurança
  - **Vermelho**: Saldo negativo

#### Resumo do Período
- Total de receitas
- Total de despesas
- Total de investimentos
- Variação líquida
- Alertas de dias com problemas

---

### 5. Limite Diário de Gastos

A funcionalidade central do Vero - responde "quanto posso gastar por dia?".

#### Fórmula de Cálculo
```
Limite Diário = (Saldo Atual - Despesas Futuras - Investimentos - Reserva) / Dias até Horizonte
```

#### Modos de Horizonte
- **Fim do Mês**: Calcula até o último dia do mês atual
- **Próxima Receita**: Calcula até o próximo evento de receita planejado

#### Componentes do Cálculo
- **Saldo Atual**: Soma dos saldos confirmados de todas as contas
- **Despesas Futuras**: Soma das despesas planejadas até o horizonte
- **Investimentos Planejados**: Soma dos investimentos até o horizonte
- **Reserva de Segurança**: Valor mínimo que você deseja manter (configurável)
- **Dias até Horizonte**: Número de dias até a data do horizonte

#### Regras Especiais
- Receitas de hoje são incluídas (dinheiro disponível)
- Despesas de hoje são excluídas (já consideradas no saldo)
- Investimentos de hoje são incluídos (podem não ter sido executados)

---

### 6. Planos de Investimento

Automatize e acompanhe seus aportes em investimentos.

#### Criar Plano de Investimento
- Selecionar conta de investimento destino
- Nome do plano (ex: "Reserva de Emergência")
- Valor do aporte
- Frequência (semanal, quinzenal, mensal, anual)
- Dia de execução
- Data de início e término (opcional)

#### Funcionalidades
- Visualizar planos ativos e pausados
- Pausar/ativar planos
- Ver total de investimento mensal
- Excluir planos

#### Cálculo Mensal
O sistema converte diferentes frequências para valor mensal:
- Semanal: valor × 4.33
- Quinzenal: valor × 2.17
- Mensal: valor × 1
- Anual: valor ÷ 12

---

### 7. Configurações

Personalize o comportamento do sistema.

#### Reserva de Segurança
Valor mínimo que você deseja manter em conta. Este valor é subtraído do montante disponível para gastos.

#### Modo de Horizonte
Define como calcular o período para o limite diário:
- **Fim do Mês**: Para quem recebe mensalmente
- **Próxima Receita**: Para quem tem receitas variáveis

---

## Conceitos Importantes

### Saldo Real vs Saldo Projetado

- **Saldo Real**: Calculado apenas com eventos CONFIRMADOS
- **Saldo Projetado**: Inclui eventos PLANEJADOS para visualização futura

### Eventos Planejados vs Confirmados

Os eventos **planejados** servem apenas para projeção e cálculo do limite diário. Eles **não afetam** o saldo real das contas.

Quando um evento realmente acontece, você deve **confirmar** para que ele afete o saldo.

### Motor de Recorrência

O sistema possui um motor que gera automaticamente eventos futuros a partir de templates recorrentes:

1. Você cria um evento marcado como recorrente
2. O sistema cria um "template" de recorrência
3. Ao visualizar projeções, o sistema gera as ocorrências futuras automaticamente
4. Cada ocorrência pode ser confirmada/ignorada individualmente

---

## Arquitetura Técnica

### Stack Tecnológico
- **Frontend**: Next.js 15 + React + TypeScript
- **UI**: NextUI + Tailwind CSS + Lucide Icons
- **Backend**: Next.js Server Actions
- **Banco de Dados**: PostgreSQL via Prisma ORM
- **Autenticação**: Sistema customizado com sessões

### Armazenamento de Valores Monetários
Todos os valores são armazenados como **inteiros em centavos** para evitar problemas de ponto flutuante:
- R$ 100,00 → 10000 centavos
- R$ 1.234,56 → 123456 centavos

### Engines (Motores de Cálculo)

#### Recurrence Engine
- Gera datas de ocorrência a partir de templates
- Suporta todas as frequências
- Lida com casos especiais (fim de mês, anos bissextos)

#### Cashflow Engine
- Constrói projeção dia a dia
- Calcula saldos iniciais e finais
- Identifica dias críticos e negativos

#### Spending Limit Engine
- Calcula limite diário de gastos
- Determina data do horizonte
- Gera explicação e avisos

---

## Fluxo de Uso Recomendado

### Configuração Inicial
1. Criar suas contas com saldos atuais
2. Configurar reserva de segurança
3. Escolher modo de horizonte

### Uso Diário
1. Adicionar eventos futuros conhecidos (contas, salário, etc.)
2. Verificar o limite diário no dashboard
3. Confirmar eventos quando acontecerem

### Revisão Periódica
1. Verificar fluxo de caixa para os próximos 30-90 dias
2. Identificar potenciais problemas
3. Ajustar eventos ou planos conforme necessário

---

## Glossário

| Termo | Descrição |
|-------|-----------|
| **Evento** | Qualquer movimentação financeira (passada ou futura) |
| **Horizonte** | Data limite para cálculo do limite diário |
| **Reserva de Segurança** | Valor mínimo a manter em conta |
| **Limite Diário** | Quanto você pode gastar por dia |
| **Projeção** | Simulação do futuro financeiro |
| **Template de Recorrência** | Modelo para gerar eventos recorrentes |
| **Saldo Confirmado** | Saldo real baseado em eventos confirmados |
| **Saldo Projetado** | Saldo futuro incluindo eventos planejados |

---

## Limitações Atuais e Funcionalidades Futuras

### O que o sistema AINDA NÃO faz:

#### Integrações Bancárias
- ❌ Conexão automática com bancos (Open Finance)
- ❌ Importação automática de extratos
- ❌ Sincronização de saldos em tempo real
- ❌ Leitura de faturas de cartão de crédito

#### Categorização e Análise
- ✅ Categorias personalizadas para despesas, organizadas em grupos predefinidos
- ❌ Tags ou etiquetas para organização
- ❌ Relatórios de gastos por categoria
- ❌ Gráficos e visualizações históricas
- ❌ Comparativo mês a mês
- ❌ Análise de tendências de gastos

#### Orçamentos
- ❌ Definição de orçamentos por categoria
- ❌ Alertas de estouro de orçamento
- ❌ Metas de economia

#### Meta de Patrimônio Líquido
- ❌ Interface para definir meta de patrimônio (modelo existe no banco)
- ❌ Acompanhamento de progresso da meta
- ❌ Projeção de quando atingirá a meta
- ❌ Cálculo de quanto precisa investir por mês

#### Notificações
- ❌ Notificações por email
- ❌ Notificações push no navegador
- ❌ Lembretes de contas a vencer
- ❌ Alertas de eventos não confirmados (atrasados)

#### Cartões de Crédito
- ❌ Gestão de faturas
- ❌ Controle de limite disponível
- ❌ Parcelamentos
- ❌ Lançamento automático da fatura como evento

#### Multi-moeda
- ❌ Suporte a múltiplas moedas
- ❌ Conversão automática de câmbio
- ❌ Contas em moeda estrangeira

#### Compartilhamento
- ❌ Compartilhar conta com cônjuge/família
- ❌ Permissões diferenciadas por usuário
- ❌ Contas conjuntas

#### Edição de Eventos
- ❌ Editar eventos existentes (apenas criar/excluir)
- ❌ Editar eventos recorrentes em lote
- ❌ Duplicar eventos

#### Importação/Exportação
- ❌ Importar dados de planilhas (CSV, Excel)
- ❌ Exportar relatórios em PDF
- ❌ Backup dos dados
- ❌ Migração de outros apps financeiros

#### Mobile
- ❌ Aplicativo nativo (iOS/Android)
- ❌ PWA otimizado para mobile
- ❌ Widget para tela inicial

#### Inteligência Artificial
- ❌ Sugestões automáticas de categorização
- ❌ Previsão de gastos baseada em histórico
- ❌ Insights personalizados
- ❌ Detecção de gastos anormais

#### Segurança Avançada
- ❌ Autenticação de dois fatores (2FA)
- ❌ Login com Google/Apple
- ❌ Histórico de sessões
- ❌ PIN ou biometria no app

#### Outros
- ❌ Modo escuro (dark mode) - estrutura existe mas não há toggle
- ❌ Busca global por eventos/contas
- ❌ Anexar comprovantes aos eventos
- ❌ Notas/comentários em eventos
- ❌ Histórico de alterações (audit log)
- ❌ Desfazer ações recentes

---

### Funcionalidades Parcialmente Implementadas

| Funcionalidade | Status | Observação |
|----------------|--------|------------|
| Meta de Patrimônio | 🟡 Parcial | Modelo no banco, sem interface |
| Notificações | 🟡 Parcial | Modelo no banco, sem envio |
| Tipos de Conta | 🟡 Parcial | Existe CHECKING/SAVINGS/CREDIT_CARD no schema, mas UI usa BANK/CASH/INVESTMENT |
| Dark Mode | 🟡 Parcial | CSS preparado, sem toggle |

---

### Próximos Passos Sugeridos (Prioridade)

1. **Alta Prioridade**
   - Edição de eventos existentes
   - Categorias para eventos
   - Relatórios básicos com gráficos

2. **Média Prioridade**
   - Interface para meta de patrimônio
   - Notificações por email
   - Importação de CSV

3. **Baixa Prioridade**
   - Integração Open Finance
   - Aplicativo mobile
   - Multi-moeda

---

## Suporte

Para dúvidas ou problemas, acesse as configurações do sistema ou entre em contato com o suporte técnico.

---

*Vero - Planeje seu futuro financeiro com confiança.*
