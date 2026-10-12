# Guia Rápido: Como Configurar o Firebase (Login Google + Nuvem)

Este guia leva entre **5 e 10 minutos** e é feito apenas uma vez.

---

## Passo 1: Criar o Projeto no Firebase

1. Acesse o [Console do Firebase](https://console.firebase.google.com/) com a sua conta Google.
2. Clique em **"Adicionar projeto"** (ou "Criar projeto").
3. Digite o nome do projeto (ex.: `airbnb-control`).
4. Desative o Google Analytics (opcional, não é necessário para o app) e clique em **Criar projeto**.

---

## Passo 2: Ativar o Login com o Google

1. No menu lateral esquerdo, clique em **Criação** > **Authentication** (ou clique em **Começar** na tela de Auth).
2. Na aba **Sign-in method** (Método de login), clique no provedor **Google**.
3. Ative o botão **Ativar**.
4. Defina o **Nome público do projeto** (ex.: `Airbnb Control`) e o **E-mail de suporte do projeto** (selecione o seu e-mail).
5. Clique em **Salvar**.

### ⚠️ Domínios Autorizados (Muito importante!)
Ainda na página de **Authentication**, clique na aba **Settings** (Configurações) > **Authorized domains** (Domínios autorizados):
- O `localhost` já estará autorizado por padrão.
- Quando você publicar o site na Vercel (ex.: `seu-projeto.vercel.app`), clique em **Adicionar domínio** e insira o endereço da Vercel (sem `https://`).

---

## Passo 3: Ativar o Banco de Dados (Cloud Firestore)

1. No menu lateral, clique em **Criação** > **Firestore Database**.
2. Clique em **Criar banco de dados**.
3. Escolha o local do servidor (recomendado para a Europa: `europe-west1` ou `europe-west3`).
4. Em regras de segurança, selecione **Modo de produção** e clique em **Criar**.

---

## Passo 4: Aplicar as Regras de Segurança

1. Dentro do **Firestore Database**, clique na aba **Regras** (Rules).
2. Copie todo o conteúdo do arquivo [firestore.rules](file:///c:/Users/akreu/Downloads/variados/sites/Gestion%20de%20airbnb/firestore.rules) do seu projeto.
3. Cole no editor do Firebase Console substituindo o que estiver lá.
4. Clique em **Publicar** (Publish).

---

## Passo 5: Obter as Chaves e Colar no `firebase-config.js`

1. No menu superior esquerdo, clique na engrenagem ⚙️ (ao lado de "Visão geral do projeto") > **Configurações do projeto**.
2. Na aba **Geral**, role até o final da página na seção **Seus aplicativos**.
3. Clique no ícone de aplicativo Web **`</>`**.
4. Dê um apelido (ex.: `airbnb-web`) e clique em **Registrar aplicativo**.
5. O Firebase exibirá um bloco de código parecido com:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD-...",
  authDomain: "airbnb-control-xxx.firebaseapp.com",
  projectId: "airbnb-control-xxx",
  storageBucket: "airbnb-control-xxx.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef..."
};
```

6. Abra o arquivo [firebase-config.js](file:///c:/Users/akreu/Downloads/variados/sites/Gestion%20de%20airbnb/firebase-config.js) no seu projeto e substitua os valores em `window.AIRBNB_FIREBASE_CONFIG`.
7. Salve o arquivo. Pronto! O sistema já estará autenticando de verdade com a segurança do Google e sincronizando tudo na nuvem.
