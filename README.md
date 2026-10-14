# Airbnb Control - Sistema Mobile-First de Gestão Operacional & Estoque

Sistema web mobile-first (PWA) desenvolvido para o controle de estoque, compras e rotina operacional dos 3 apartamentos de temporada:
* **JB**
* **VN**
* **HN**

---

## 📱 Como Acessar e Usar

O servidor local já está ativo em:
👉 **[http://localhost:8080](http://localhost:8080)**

> **Dica para Celular:** Para testar diretamente no seu smartphone, conecte-o na mesma rede Wi-Fi do computador e acesse pelo navegador do celular o endereço de IP local (ex.: `http://192.168.x.x:8080`).

---

## 🔑 Autenticação Oficial Google & Segurança na Nuvem

O sistema opera com autenticação real do Google e regras de segurança executadas no servidor do **Google Firebase / Firestore**:

### 1. Portão de Entrada Unificado
* **Login Oficial com Google:** Um único botão seguro com pop-up oficial do Google (`select_account`).
* **Allowlist de Segurança no Servidor:** O sistema verifica se a conta Google logada está na coleção `access` do Firestore. Se o e-mail não estiver pré-autorizado ou estiver inativo, o acesso é negado e os dados na nuvem permanecem 100% protegidos.
* **Administradores Raiz:** Os e-mails `gestionairbnb2026@gmail.com`, `gestao.airbnb.portugal@gmail.com` e `akreuch2001@gmail.com` possuem permissão administrativa raiz pré-configurada.

### 2. Gestão de Colaboradoras (Painel do Gestor)
* **Cadastro por E-mail Google:** O gestor cadastra o nome e o e-mail Google da colaboradora para autorizar o acesso.
* **Ativação / Suspensão Instantânea:** O gestor pode suspender ou reativar o acesso de qualquer colaboradora a qualquer momento com um clique.
* **Revogação Total:** Ao excluir uma colaboradora, seu registro é removido da allowlist do Firestore.

### 3. Sincronização em Tempo Real (Cloud Sync)
* Todas as alterações em estoque, recados, escalas e compras são sincronizadas em tempo real entre celulares e computadores com suporte a cache offline.
* Indicador visual no topo exibe o status da conexão (**Nuvem Conectada**, **Sincronizando...**, **Modo Offline**).

### 4. Configuração do Firebase
* Consulte o guia passo a passo em [CONFIGURAR_FIREBASE.md](file:///c:/Users/akreu/Downloads/variados/sites/Gestion%20de%20airbnb/CONFIGURAR_FIREBASE.md) para inserir suas chaves no arquivo [firebase-config.js](file:///c:/Users/akreu/Downloads/variados/sites/Gestion%20de%20airbnb/firebase-config.js).
* Enquanto as credenciais não forem preenchidas, o sistema oferece o **Modo de Demonstração (Gestor)** local para testes imediatos.

---

## 📦 Produtos & Fotos do Supermercado (Assets)
Todos os **24 produtos** fotografados no diretório `assets/` estão cadastrados e mapeados no sistema:
1. **Bosque Verde:** Amaciante Violets, Desinfetante de Tecidos, Luvas de Nitrilo, Sabão Líquido Marselha, Vinagre de Limpeza Concentrado, Limpador Box e Ducha, Multiuso com Lixívia, Spray Anticalcário, Gel WC Sanitário, Papel Higiênico Folha Dupla, Ambientador Blossom.
2. **Deliplus:** Refil Sabonete Líquido Mãos Dermo Protect, Gel de Banho Aveia, Shampoo Zero.
3. **Hacendado:** Torradas Cereais e Sementes, Bolachas Maria Integrais, Café Ristretto Alumínio, Café Colômbia Alumínio, Madalenas Tradicionais, Madalenas 700g, Leite Semidesnatado 1L.
4. **Bebidas:** Cerveja Estrella Galicia 25cl, Água Mineral Bronchales 1.5L, Água Mineral Bronchales 500ml.

---

## 🚦 Semáforo de 1 Toque
Em cada card de produto:
* 🟢 **Suficiente:** Estoque abastecido.
* 🟡 **Acabando:** Nível de atenção.
* 🔴 **Falta:** Zerado / Compra urgente necessária.

Ao tocar em qualquer uma das três cores, o status é alterado imediatamente e o contador da aba **🚨 Reposição** é atualizado em tempo real.
