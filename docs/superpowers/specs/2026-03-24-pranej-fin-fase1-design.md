# Pranej Fin — Fase 1: Design Spec

**Data:** 2026-03-24
**Escopo:** Dashboard + Clientes + Perfil Financeiro + Projecao Patrimonial
**Status:** Aprovado

---

## 1. Visao Geral

Transformar a ferramenta de projecao patrimonial existente (HTML puro) em um sistema completo de planejamento financeiro pessoal, com gestao de clientes, perfil financeiro detalhado e portal de acesso para clientes.

### Fases do projeto
- **Fase 1 (este spec):** Dashboard + Clientes + Perfil Financeiro + Projecao Patrimonial
- **Fase 2:** Multiplos cenarios comparativos + Metas financeiras
- **Fase 3:** Seguros, dividas detalhadas, portal avancado do cliente
- **Fase 4:** Relatorios e exportacoes

### Referencias de mercado
Kinvo (dashboard de investimentos), Warren (visual clean fintech), RightCapital (planejamento financeiro), Moneywise (gestao de clientes para planejadores).

---

## 2. Stack Tecnica

| Tecnologia | Papel |
|---|---|
| Next.js 15 (App Router) | Framework frontend/backend |
| TypeScript | Tipagem estatica |
| Supabase | Auth (Google OAuth), Postgres, Row Level Security |
| Tailwind CSS | Estilizacao utility-first |
| shadcn/ui | Componentes UI |
| Recharts | Graficos |
| Vercel | Deploy (alternativa: Cloudflare Pages) |

---

## 3. Autenticacao & Roles

### Fluxo de auth
- Supabase Auth com Google OAuth (substitui o login atual com sessionStorage)
- Ao logar, o sistema verifica o `role` na tabela `profiles`
- Middleware do Next.js redireciona:
  - `planner` -> `/dashboard`
  - `client` -> `/portal`
  - Sem role -> pagina de erro/contato

### Convite de cliente ao portal
- O planejador clica "Convidar ao portal" no perfil do cliente
- O sistema envia email com magic link (Supabase Auth)
- Ao logar, o cliente e automaticamente associado via `portal_user_id` e direcionado ao `/portal`

---

## 4. Estrutura de Rotas

```
/                          -> Landing/Login (publico)
/dashboard                 -> Painel do Planejador (protegido, role=planner)
/dashboard/clients         -> Lista de clientes
/dashboard/clients/[id]    -> Perfil do cliente (tabs: dados, financeiro, projecao)
/portal                    -> Painel do Cliente (protegido, role=client)
/portal/profile            -> Meu perfil financeiro (leitura)
/portal/projection         -> Minha projecao (leitura)
```

---

## 5. Modelo de Dados

### profiles
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid (PK, FK -> auth.users) | ID do usuario |
| role | text ('planner' \| 'client') | Papel no sistema |
| full_name | text | Nome completo |
| email | text | Email |
| phone | text | Telefone |
| avatar_url | text | URL do avatar |
| created_at | timestamptz | Data de criacao |

### clients
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid (PK) | ID do cliente |
| planner_id | uuid (FK -> profiles.id) | Planejador responsavel |
| full_name | text | Nome completo |
| email | text | Email |
| phone | text | Telefone |
| cpf | text (encrypted) | CPF criptografado |
| birth_date | date | Data de nascimento |
| occupation | text | Ocupacao |
| marital_status | text | Estado civil |
| notes | text | Observacoes |
| portal_user_id | uuid (FK -> profiles.id, nullable) | Acesso ao portal |
| created_at | timestamptz | Data de criacao |
| updated_at | timestamptz | Data de atualizacao |

### financial_profile (1:1 com clients)
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid (PK) | ID |
| client_id | uuid (FK -> clients.id, UNIQUE) | Cliente |
| monthly_income | numeric | Renda mensal bruta |
| monthly_expenses | numeric | Despesas mensais |
| emergency_fund | numeric | Reserva de emergencia |
| current_assets | numeric | Patrimonio total atual |
| monthly_contribution | numeric | Aporte mensal |
| retirement_age | integer | Idade de aposentadoria |
| life_expectancy | integer | Expectativa de vida |
| desired_retirement_income | numeric | Renda desejada na aposentadoria |
| social_security_income | numeric | Renda do INSS |
| other_income | numeric | Outras rendas |
| risk_profile | text ('conservative' \| 'moderate' \| 'aggressive') | Perfil de risco |
| updated_at | timestamptz | Data de atualizacao |

### assets
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid (PK) | ID |
| client_id | uuid (FK -> clients.id) | Cliente |
| category | text ('investment' \| 'property' \| 'vehicle' \| 'other') | Categoria |
| name | text | Nome do ativo |
| current_value | numeric | Valor atual |
| monthly_yield_rate | numeric (nullable) | Rendimento mensal |
| notes | text | Observacoes |
| created_at | timestamptz | Data de criacao |
| updated_at | timestamptz | Data de atualizacao |

### liabilities
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid (PK) | ID |
| client_id | uuid (FK -> clients.id) | Cliente |
| name | text | Nome da divida |
| total_amount | numeric | Valor total |
| remaining_amount | numeric | Saldo devedor |
| monthly_payment | numeric | Parcela mensal |
| interest_rate | numeric | Taxa de juros |
| due_date | date | Data de vencimento |
| created_at | timestamptz | Data de criacao |
| updated_at | timestamptz | Data de atualizacao |

### projection_scenarios
| Coluna | Tipo | Descricao |
|---|---|---|
| id | uuid (PK) | ID |
| client_id | uuid (FK -> clients.id) | Cliente |
| name | text | Nome do cenario |
| cdi_rate | numeric | CDI anual bruto |
| cdi_percentage | numeric | % do CDI |
| tax_rate | numeric | Aliquota IR |
| inflation_rate | numeric | Inflacao anual |
| is_default | boolean | Cenario padrao |
| created_at | timestamptz | Data de criacao |
| updated_at | timestamptz | Data de atualizacao |

### Row Level Security (RLS)
- **Planejador:** `clients.planner_id = auth.uid()` — acessa apenas seus clientes e dados relacionados
- **Cliente:** `clients.portal_user_id = auth.uid()` — acessa apenas seus proprios dados
- Tabelas filhas (financial_profile, assets, liabilities, projection_scenarios) herdam acesso via JOIN com `clients`

---

## 6. Interface do Planejador

### Tema Visual
- Background: `#0F1117`
- Cards: `#1A1D26` com borda `#2A2D36`
- Accent primario: `#3B82F6` (azul)
- Accent secundario: `#10B981` (verde esmeralda)
- Texto primario: `#F1F5F9`
- Texto secundario: `#94A3B8`
- Fonte: Inter

### Sidebar (fixa, 240px)
- Logo Pranej Fin (topo)
- Itens: Dashboard, Clientes
- Perfil do planejador (bottom)

### Dashboard (`/dashboard`)
- KPIs: Total de clientes | Patrimonio total sob gestao | Clientes com deficit
- Lista rapida: Ultimos clientes acessados
- Alertas: Clientes com projecao negativa ou dados desatualizados

### Lista de Clientes (`/dashboard/clients`)
- Barra de busca + botao "Novo Cliente"
- Tabela/grid com: nome, telefone, patrimonio total, status da projecao
- Click -> abre perfil do cliente

### Perfil do Cliente (`/dashboard/clients/[id]`)
Organizado em 3 tabs:

**Tab 1 — Dados Pessoais**
- Formulario: nome, email, telefone, CPF, data de nascimento, ocupacao, estado civil, notas
- Botao "Convidar ao Portal"

**Tab 2 — Perfil Financeiro**
- Secao "Renda & Despesas": renda mensal, despesas mensais, aporte mensal
- Secao "Patrimonio": tabela editavel de ativos (nome, categoria, valor, rendimento)
- Secao "Dividas": tabela editavel de passivos (nome, valor total, parcela, taxa, vencimento)
- Resumo lateral: patrimonio liquido (ativos - dividas), reserva de emergencia, perfil de risco

**Tab 3 — Projecao Patrimonial**
- Inputs pre-preenchidos a partir do financial_profile do cliente
- Grafico + KPIs + metricas (mesma logica de calculo atual)
- Possibilidade de ajustar parametros sem alterar o perfil base

---

## 7. Portal do Cliente

### Layout
- Topbar: Logo + nome do cliente + botao sair
- Sem sidebar — navegacao por tabs horizontais

### Telas

**Meu Perfil (`/portal/profile`)**
- Dados pessoais (leitura)
- Resumo financeiro: patrimonio liquido, renda, despesas, aporte
- Lista de ativos e dividas (leitura)

**Minha Projecao (`/portal/projection`)**
- Grafico de projecao patrimonial
- KPIs: patrimonio para viver de renda, patrimonio projetado, status
- Somente leitura — cliente nao altera parametros

---

## 8. Componentes & Codigo

### Modulo de Calculo (`lib/projection-engine.ts`)
Logica pura TypeScript extraida do HTML atual:
- `computeRates(input)` — taxa real liquida a partir de CDI, %CDI, IR, inflacao
- `computeProjection(input, rates)` — patrimonio projetado, viver de renda, consumo de capital, gap
- `generateSeries(input, rates)` — series temporais para o grafico

### Componentes React
- `ProjectionChart` — Recharts, recebe series e renderiza o grafico
- `KPICard` / `MetricCard` — cards de indicadores
- `ClientForm` — formulario de dados do cliente (react-hook-form + zod)
- `AssetTable` / `LiabilityTable` — tabelas editaveis inline

### Estrutura de pastas
```
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── clients/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   ├── portal/
│   │   ├── layout.tsx
│   │   ├── profile/page.tsx
│   │   └── projection/page.tsx
│   └── middleware.ts
├── components/
│   ├── ui/                     (shadcn/ui)
│   ├── projection-chart.tsx
│   ├── kpi-card.tsx
│   ├── client-form.tsx
│   └── asset-table.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── projection-engine.ts
│   └── utils.ts
└── types/
    └── index.ts
```

---

## 9. Decisoes Tecnicas

- **CPF:** criptografado no nivel da aplicacao antes de armazenar no Supabase
- **financial_profile 1:1:** um registro por cliente, consolidando inputs da sidebar atual
- **projection_scenarios:** na Fase 1, cada cliente tem 1 cenario default; multiplos cenarios vem na Fase 2
- **Calculo client-side:** a logica de projecao roda no browser (rapida, sem round-trip ao servidor)
- **Formularios:** react-hook-form + zod para validacao tipada
- **Tema escuro:** implementado via Tailwind CSS custom theme, sem toggle claro/escuro na Fase 1
