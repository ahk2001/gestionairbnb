# Documento de Especificação do Projeto
## Sistema de Gestão e Estoque Operacional Airbnb (JB • VN • HN)

---

### 1. Visão Geral e Objetivos

O sistema é uma aplicação web mobile-first (PWA) desenvolvida para centralizar e coordenar a rotina operacional, compras e abastecimento de 3 imóveis de temporada independentes:
* **JB**
* **VN**
* **HN**

#### 1.1. Perfil Operacional e Dinâmica de Perfis
O acesso à plataforma é estruturado em dois níveis de atuação bem definidos:
* **Proprietário / Gestor:** Possui controle total da plataforma, relatórios financeiros de compras e gerenciamento da equipe (criação, edição e definição do PIN de acesso dos colaboradores). O acesso do proprietário é autenticado exclusivamente via **Google Login**.
* **Equipe de Limpeza e Manutenção (Duda e demais colaboradoras):** Acessam a área operacional rápida via **PIN numérico individual**, sem burocracia de e-mail/senha ou conta Google. Podem atualizar status de estoque, registrar compras com valor gasto, usar o bloco de notas e consultar o calendário de limpezas.

---

### 2. Tela de Entrada e Fluxo de Autenticação (Portão de Acesso)

Ao abrir o aplicativo ou site, o usuário encontra imediatamente uma tela de acolhimento e seleção de perfil:

```
┌────────────────────────────────────────────────────────┐
│                   AIRBNB CONTROL                       │
│             Gestão Operacional JB • VN • HN            │
├────────────────────────────────────────────────────────┤
│                                                        │
│       [ 🔑 Área do Dono ]       [ 🧹 Área da Equipe ]    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### 2.1. Fluxo "Área do Dono"
1. Ao tocar em **"Área do Dono"**, o sistema exibe o botão oficial **"Continuar com o Google"**.
2. Apenas contas Google previamente autorizadas (ou configuradas como administradoras) têm liberação para acessar o painel de gestão.
3. Permissões exclusivas do dono:
   * **Gestão de Funcionários:** Cadastrar colaboradoras (ex.: Duda, Maria) e definir/alterar o PIN numérico de acesso de cada uma.
   * **Ativação/Desativação:** Bloquear temporária ou definitivamente o acesso de qualquer colaboradora com um único toque.
   * **Visão Consolidada Financeira:** Histórico de todos os gastos com compras e prestação de contas dos 3 apartamentos.

#### 2.2. Fluxo "Área do Funcionário"
1. Ao tocar em **"Área do Funcionário"**, a colaboradora vê um teclado numérico simples (ou lista com os nomes das colaboradoras ativas + campo de PIN).
2. A colaboradora seleciona seu nome e digita seu **PIN de 4 dígitos** (cadastrado pelo dono).
3. **Sem atrito:** Não exige conta de e-mail, criação de senhas complexas nem confirmação em duas etapas.
4. **Sessão Salva:** O celular pode memorizar o login para não exigir digitação a cada conferência de armário durante a faxina.

---

### 3. Estrutura por Imóvel (Navegação Principal)

Tanto na visão operacional da funcionária quanto na visão do dono, a navegação principal é dividida entre os 3 apartamentos (**JB**, **VN** e **HN**). Cada imóvel possui seu próprio ambiente isolado contendo 4 módulos:

```
┌────────────────────────────────────────────────────────┐
│  [ JB ]              [ VN ]              [ HN ]        │
├────────────────────────────────────────────────────────┤
│  📅 1. Calendário Operacional (Escalas & Limpezas)    │
│  📝 2. Bloco de Notas do Imóvel (Anotações & Recados) │
│  🚨 3. Painel de Reposição Urgente (Produtos em Falta) │
│  📦 4. Estoque Completo (Limpeza & Comida)             │
└────────────────────────────────────────────────────────┘
```

#### 3.1. Módulo: Calendário Operacional
* Visualização simplificada de agendamento de limpezas, datas de reservas e dias de reposição.
* **Atribuição simples:** Dono ou equipe podem associar a colaboradora responsável pela faxina (ex.: Duda no JB, Maria no VN).

#### 3.2. Módulo: Bloco de Notas Dinâmico
* Campo de recados rápidos por imóvel com data, hora e nome de quem escreveu (ex.: *"Duda: Torneira da cozinha do VN gotejando"*, *"Dono: Hóspede do JB solicitou toalhas extras"*).

#### 3.3. Módulo: Painel de Reposição Urgente (Lista de Compras)
* Filtro de acesso rápido que reúne todos os itens do imóvel marcados como **Falta 🔴** ou **Acabando 🟡**.
* Serve como lista de compras prática e em tempo real quando alguém da equipe estiver no mercado.

---

### 4. Gestão de Produtos e Estoque

#### 4.1. Identificação Visual Obrigatória (Fotos)
* Todo produto cadastrado possui obrigatoriamente uma **foto/imagem** de referência.
* Garante que a colaboradora ou o dono comprem a marca, aroma e embalagem corretos.

#### 4.2. Etiquetas de Status por Clique (Semáforo)
Ao tocar no produto, altera-se o status instantaneamente:
* 🟢 **Suficiente:** Estoque abastecido e em níveis seguros.
* 🟡 **Acabando:** Nível de atenção; comprar na próxima ida ao mercado.
* 🔴 **Falta:** Zerado ou em falta crítica; necessita reposição urgente.

#### 4.3. Ajuste Rápido de Quantidades
* Controles `-` e `+` de toque rápido e campo numérico editável para ajustes diretos.

---

### 5. Registro Financeiro e Compras

Sempre que a Duda ou outra colaboradora fizer compras para qualquer um dos apartamentos, ela registra a entrada com os seguintes dados:

* **Valor Total Gasto:** Campo explícito para digitar o total em dinheiro desembolsado na compra (ex.: `R$ 145,80` ou `€ 32,50`).
* **Data da Compra:** Padrão dia atual (editável).
* **Quantidade Comprada:** Unidades adicionadas ao imóvel (ex.: +10 rolos, +4 sabonetes).
* **Comprado / Registrado por:** Identificação automática da colaboradora logada via PIN.
* **Comprovante Opcional:** Botão para tirar foto do cupom fiscal.
* **Atualização em Cadeia:** O estoque soma as quantidades e o status do item migra automaticamente para 🟢 **Suficiente**.

---

### 6. Modelo Conceitual do Banco de Dados

```sql
-- 1. Tabela de Gestores (Autenticados via Google)
create table owners (
  id uuid primary key default gen_random_uuid(),
  google_id text unique not null,
  email text unique not null,
  name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. Tabela de Funcionários / Equipe Operacional (Autenticados via PIN)
create table staff_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references owners(id) on delete cascade, -- Dono ao qual está vinculada
  name text not null,                                   -- ex: "Duda", "Maria"
  phone text,
  pin_code text not null,                               -- PIN numérico de 4 a 6 dígitos escolhido pelo dono
  is_active boolean default true,                       -- Permite desativar sem excluir histórico
  created_at timestamptz default now()
);

-- 3. Imóveis cadastrados (JB, VN, HN)
create table properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references owners(id) on delete cascade,
  code text unique not null,                            -- 'JB', 'VN', 'HN'
  name text not null,
  created_at timestamptz default now()
);

-- 4. Bloco de Notas por Imóvel (com autoria)
create table property_notes (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  author_type text check (author_type in ('owner', 'staff')),
  staff_id uuid references staff_members(id),
  owner_id uuid references owners(id),
  author_name text not null,
  content text default '',
  created_at timestamptz default now()
);

-- 5. Calendário Operacional
create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  assigned_staff_id uuid references staff_members(id),
  title text not null,
  event_date date not null,
  event_type text check (event_type in ('limpeza', 'reserva', 'compras', 'manutencao', 'outro')),
  created_at timestamptz default now()
);

-- 6. Produtos do Estoque por Imóvel
create table products (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,
  category text check (category in ('limpeza', 'comida', 'amenities', 'outro')) not null,
  photo_url text not null,                              -- Foto obrigatória do produto
  quantity numeric not null default 0,
  unit text default 'un',                               -- 'un', 'rolo', 'pacote', 'litro'
  status text not null default 'suficiente' check (status in ('suficiente', 'acabando', 'falta')),
  updated_at timestamptz default now()
);

-- 7. Histórico de Compras e Gastos Totais
create table purchase_records (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  buyer_type text check (buyer_type in ('owner', 'staff')),
  staff_id uuid references staff_members(id),
  buyer_name text not null,
  purchase_date date not null default current_date,
  quantity_bought numeric not null check (quantity_bought > 0),
  total_cost numeric(10,2) not null default 0.00,       -- Valor total desembolsado
  receipt_photo_url text,                               -- Foto do comprovante
  notes text,
  created_at timestamptz default now()
);
```

---

### 7. Requisitos de Interface (UI/UX)

1. **Tela de Entrada (Splash/Gate):**
   * Dois botões de destaque: `[ 🔑 Área do Dono ]` e `[ 🧹 Área da Equipe ]`.
2. **Modal de Login do Dono:**
   * Botão nativo do Google OAuth. Redireciona diretamente para o painel de controle administrativo.
3. **Modal de Login da Equipe:**
   * Lista visual dos funcionários ativos (ex.: avatar/nome da Duda). Ao tocar no nome, abre o teclado numérico para digitação do PIN de 4 dígitos.
4. **Painel de Gestão da Equipe (Exclusivo do Dono):**
   * Botão "+ Novo Funcionário" (Nome e PIN de 4 dígitos).
   * Lista de colaboradores com botão para alterar PIN e chave Liga/Desliga (`is_active`).
5. **Painel Operacional (Compartilhado):**
   * Abas superiores `[ JB ]`, `[ VN ]` e `[ HN ]`.
   * Cards de produtos com fotos nítidas, semáforo interativo (`🟢`, `🟡`, `🔴`), botões `+` e `-`.
   * Botão "Registrar Compra" com campo para valor total gasto (`R$`).