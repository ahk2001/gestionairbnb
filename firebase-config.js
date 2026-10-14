// firebase-config.js
// Configurações do Firebase para o Airbnb Control
//
// INSTRUÇÕES:
// Cole aqui as credenciais do seu projeto Firebase geradas no Firebase Console:
// (Configurações do Projeto > Geral > Seus aplicativos > Web App </>)
//
// Mais detalhes no arquivo CONFIGURAR_FIREBASE.md

window.AIRBNB_FIREBASE_CONFIG = window.AIRBNB_FIREBASE_CONFIG || {
  apiKey: "AIzaSyDAM3AX2xJrkprBf553MNgbb1mqvcSPDjo",
  authDomain: "airbnbcontrolvalencia.firebaseapp.com",
  projectId: "airbnbcontrolvalencia",
  storageBucket: "airbnbcontrolvalencia.firebasestorage.app",
  messagingSenderId: "536915891786",
  appId: "1:536915891786:web:6085775c0066c69f68b8b3",
  measurementId: "G-69MLQXF1L9"
};

// E-mails que possuem perfil de Dono / Administrador Raiz pré-autorizado
// (Garante acesso ao painel mesmo antes de configurar outros usuários na allowlist)
window.AIRBNB_ROOT_OWNERS = [
  "gestionairbnb2026@gmail.com",
  "gestao.airbnb.portugal@gmail.com",
  "akreuch2001@gmail.com",
  "kiaramezadioses051029@gmail.com"
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
