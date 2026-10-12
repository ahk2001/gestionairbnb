// firebase-config.js
// Configurações do Firebase para o Airbnb Control
//
// INSTRUÇÕES:
// Cole aqui as credenciais do seu projeto Firebase geradas no Firebase Console:
// (Configurações do Projeto > Geral > Seus aplicativos > Web App </>)
//
// Mais detalhes no arquivo CONFIGURAR_FIREBASE.md

window.AIRBNB_FIREBASE_CONFIG = window.AIRBNB_FIREBASE_CONFIG || {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.firebasestorage.app",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:000000000000"
};

// E-mails que possuem perfil de Dono / Administrador Raiz pré-autorizado
// (Garante acesso ao painel mesmo antes de configurar outros usuários na allowlist)
window.AIRBNB_ROOT_OWNERS = [
  "gestionairbnb2026@gmail.com",
  "gestao.airbnb.portugal@gmail.com"
];

// Helper para verificar se o Firebase foi preenchido com credenciais reais
window.isFirebaseConfigured = function() {
  const cfg = window.AIRBNB_FIREBASE_CONFIG;
  return Boolean(
    cfg &&
    cfg.apiKey &&
    !cfg.apiKey.includes("SUA_API_KEY") &&
    cfg.projectId &&
    !cfg.projectId.includes("seu-projeto")
  );
};
