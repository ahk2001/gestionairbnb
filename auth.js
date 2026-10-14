// auth.js
// Módulo de Autenticação Segura com Google Firebase Auth & Controle de Acesso (Allowlist)
(function(root) {
  'use strict';

  const FIREBASE_SDK_VERSION = '13.0.0';
  const CDN_BASE = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;

  let firebaseApp = null;
  let firebaseAuth = null;
  let firestoreDb = null;
  let authInitialized = false;
  let authListeners = [];
  let currentUserState = null;
  let lastAuthError = null;
  let isSuppressingNullAuth = false;

  let cachedModules = null;
  let activeAccessUnsubscribe = null;

  function stopAccessWatcher() {
    if (activeAccessUnsubscribe) {
      try { activeAccessUnsubscribe(); } catch (e) {}
      activeAccessUnsubscribe = null;
    }
  }

  // Carregamento dinâmico dos módulos do Firebase SDK
  async function loadFirebaseModules() {
    if (cachedModules) {
      return cachedModules;
    }

    try {
      const [appMod, authMod, firestoreMod] = await Promise.all([
        import(`${CDN_BASE}/firebase-app.js`),
        import(`${CDN_BASE}/firebase-auth.js`),
        import(`${CDN_BASE}/firebase-firestore.js`)
      ]);

      const config = root.AIRBNB_FIREBASE_CONFIG;
      firebaseApp = appMod.initializeApp(config);
      firebaseAuth = authMod.getAuth(firebaseApp);

      // Habilita persistência local no navegador
      try {
        await authMod.setPersistence(firebaseAuth, authMod.browserLocalPersistence);
      } catch (e) {
        console.warn('[AirbnbAuth] Persistência padrão mantida:', e);
      }

      // Inicializa Firestore com cache local persistente para uso offline em apartamentos
      try {
        firestoreDb = firestoreMod.initializeFirestore(firebaseApp, {
          localCache: firestoreMod.persistentLocalCache({
            tabManager: firestoreMod.persistentMultipleTabManager()
          })
        });
      } catch (e) {
        console.warn('[AirbnbAuth] Fallback para Firestore padrão:', e);
        firestoreDb = firestoreMod.getFirestore ? firestoreMod.getFirestore(firebaseApp) : null;
      }

      cachedModules = {
        appMod,
        authMod,
        firestoreMod,
        firebaseApp,
        firebaseAuth,
        firestoreDb
      };

      return cachedModules;
    } catch (err) {
      console.error('[AirbnbAuth] Falha ao carregar Firebase SDK da CDN:', err);
      throw err;
    }
  }

  // Verifica se o e-mail pertence aos administradores raiz
  function isRootOwnerEmail(email) {
    if (!email) return false;
    const cleanEmail = String(email).trim().toLowerCase();
    const rootOwners = (root.AIRBNB_ROOT_OWNERS || []).map(e => String(e).trim().toLowerCase());
    return rootOwners.includes(cleanEmail);
  }

  // Consulta o registro de permissão (allowlist) no Firestore com retry automático contra oscilações de rede
  async function checkUserAccess(email, firestoreMod, maxRetries = 3) {
    if (!email || !firestoreDb) return null;
    const cleanEmail = String(email).trim().toLowerCase();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const accessDocRef = firestoreMod.doc(firestoreDb, 'access', cleanEmail);
        const snapshot = await firestoreMod.getDoc(accessDocRef);

        if (snapshot.exists()) {
          const data = snapshot.data() || {};
          return { id: snapshot.id, ...data };
        }

        // Se for o dono raiz e o documento ainda não existir na nuvem, faz o bootstrap automático
        if (isRootOwnerEmail(cleanEmail)) {
          const rootAccess = {
            email: cleanEmail,
            role: 'owner',
            active: true,
            name: 'Gestor dos Imóveis',
            createdAt: new Date().toISOString(),
            isRoot: true
          };
          try {
            await firestoreMod.setDoc(accessDocRef, rootAccess, { merge: true });
          } catch (setErr) {
            console.warn('[AirbnbAuth] Aviso ao salvar doc raiz:', setErr);
          }
          return rootAccess;
        }

        // Documento verificado e comprovadamente não existe na nuvem
        return null;
      } catch (err) {
        console.warn(`[AirbnbAuth] Tentativa ${attempt}/${maxRetries} ao consultar permissões no Firestore:`, err);
        if (attempt < maxRetries) {
          await new Promise(res => setTimeout(res, attempt * 350));
        } else {
          // Se for o dono raiz, garante acesso mesmo com erro temporário de leitura da coleção
          if (isRootOwnerEmail(cleanEmail)) {
            return {
              email: cleanEmail,
              role: 'owner',
              active: true,
              name: 'Gestor dos Imóveis',
              isRoot: true
            };
          }
          // Retorna objeto indicando erro de conexão para não deslogar imediatamente por falso "Acesso Negado"
          return { _networkError: true, error: err };
        }
      }
    }
    return null;
  }

  // Notifica todos os observadores cadastrados sobre a alteração de autenticação
  function notifyListeners(user, error = null) {
    currentUserState = user;
    lastAuthError = error;
    authListeners.forEach(listener => {
      try {
        listener(user, error);
      } catch (e) {
        console.error('[AirbnbAuth] Erro em listener de auth:', e);
      }
    });

    const event = new CustomEvent('airbnb-auth-changed', {
      detail: { user, error }
    });
    window.dispatchEvent(event);
  }

  // Inicialização principal
  async function init() {
    if (authInitialized) return;
    authInitialized = true;

    if (!root.isFirebaseConfigured || !root.isFirebaseConfigured()) {
      console.warn('[AirbnbAuth] Firebase ainda não configurado em firebase-config.js. Modo de demonstração ativo.');
      notifyListeners(null, { code: 'NOT_CONFIGURED', message: 'Firebase não configurado' });
      return;
    }

    try {
      const { authMod, firestoreMod } = await loadFirebaseModules();

      authMod.onAuthStateChanged(firebaseAuth, async (fbUser) => {
        if (!fbUser) {
          stopAccessWatcher();
          if (isSuppressingNullAuth) {
            return;
          }
          notifyListeners(null, null);
          return;
        }

        try {
          const userEmail = fbUser.email;
          const cleanEmail = String(userEmail || '').trim().toLowerCase();
          const access = await checkUserAccess(cleanEmail, firestoreMod);

          if (access && access._networkError) {
            notifyListeners(null, {
              code: 'NETWORK_ERROR',
              email: userEmail,
              message: 'Não foi possível conectar com o banco de dados. Verifique sua conexão e tente novamente.'
            });
            return;
          }

          if (!access) {
            stopAccessWatcher();
            // Conta Google autenticada, porém NÃO está na lista de e-mails permitidos
            const deniedErr = {
              code: 'ACCESS_DENIED',
              email: userEmail,
              message: `O e-mail ${userEmail} não possui autorização de acesso ao sistema.`
            };

            // Desconecta silenciosamente a conta não autorizada no Firebase
            try {
              isSuppressingNullAuth = true;
              await authMod.signOut(firebaseAuth);
            } catch (signOutErr) {
              console.warn('[AirbnbAuth] Aviso ao desconectar conta não permitida:', signOutErr);
            } finally {
              setTimeout(() => {
                isSuppressingNullAuth = false;
              }, 800);
            }

            notifyListeners(null, deniedErr);
            return;
          }

          if (access.active === false) {
            stopAccessWatcher();
            // Acesso suspenso pelo administrador
            const inactiveErr = {
              code: 'ACCOUNT_INACTIVE',
              email: userEmail,
              message: `O acesso para o e-mail ${userEmail} está suspenso temporariamente.`
            };

            try {
              isSuppressingNullAuth = true;
              await authMod.signOut(firebaseAuth);
            } catch (signOutErr) {
              console.warn('[AirbnbAuth] Aviso ao desconectar conta suspensa:', signOutErr);
            } finally {
              setTimeout(() => {
                isSuppressingNullAuth = false;
              }, 800);
            }

            notifyListeners(null, inactiveErr);
            return;
          }

          const appUser = {
            type: access.role || 'staff',
            id: access.staffId || fbUser.uid,
            email: userEmail,
            name: fbUser.displayName || access.name || (access.role === 'owner' ? 'Gestor' : 'Equipe'),
            photo: fbUser.photoURL || access.photo || null,
            roleTitle: access.role === 'owner' ? 'Proprietário / Gestor' : 'Equipe Operacional',
            isRoot: Boolean(access.isRoot || isRootOwnerEmail(userEmail)),
            raw: fbUser
          };

          notifyListeners(appUser, null);

          // Observador em tempo real: se o administrador suspender ou revogar a conta enquanto o usuário estiver ativo, desconecta instantaneamente
          stopAccessWatcher();
          if (!isRootOwnerEmail(cleanEmail) && firestoreDb) {
            try {
              const accessDocRef = firestoreMod.doc(firestoreDb, 'access', cleanEmail);
              activeAccessUnsubscribe = firestoreMod.onSnapshot(accessDocRef, async (snap) => {
                // Blindagem: ignora snapshots vazios vindos de cache local antes do handshake com o servidor
                if (snap.metadata && snap.metadata.fromCache && !snap.exists()) {
                  return;
                }

                if (!snap.exists()) {
                  stopAccessWatcher();
                  try {
                    isSuppressingNullAuth = true;
                    await authMod.signOut(firebaseAuth);
                  } catch (e) {}
                  finally {
                    setTimeout(() => { isSuppressingNullAuth = false; }, 800);
                  }
                  notifyListeners(null, {
                    code: 'ACCESS_DENIED',
                    email: cleanEmail,
                    message: `O acesso para o e-mail ${cleanEmail} foi revogado pelo administrador.`
                  });
                } else {
                  const currentAccess = snap.data();
                  if (currentAccess && currentAccess.active === false) {
                    stopAccessWatcher();
                    try {
                      isSuppressingNullAuth = true;
                      await authMod.signOut(firebaseAuth);
                    } catch (e) {}
                    finally {
                      setTimeout(() => { isSuppressingNullAuth = false; }, 800);
                    }
                    notifyListeners(null, {
                      code: 'ACCOUNT_INACTIVE',
                      email: cleanEmail,
                      message: `O acesso para o e-mail ${cleanEmail} foi suspenso temporariamente.`
                    });
                  }
                }
              }, (errSnap) => {
                console.warn('[AirbnbAuth] Aviso no observador em tempo real de acesso:', errSnap);
              });
            } catch (listenErr) {
              console.warn('[AirbnbAuth] Falha ao registrar observador de revogação imediata:', listenErr);
            }
          }
        } catch (err) {
          console.error('[AirbnbAuth] Erro ao validar conta:', err);
          notifyListeners(null, {
            code: 'AUTH_CHECK_FAILED',
            message: 'Erro ao verificar permissões de acesso: ' + (err.message || 'Falha de rede')
          });
        }
      });
    } catch (err) {
      console.error('[AirbnbAuth] Falha na inicialização do Firebase:', err);
      notifyListeners(null, {
        code: 'INIT_ERROR',
        message: 'Não foi possível inicializar o Firebase. Verifique sua conexão e a chave no firebase-config.js'
      });
    }
  }

  // Efetua login real com o Google via Pop-up com seleção explícita de conta
  async function loginWithGoogle() {
    if (!root.isFirebaseConfigured || !root.isFirebaseConfigured()) {
      throw new Error('CONFIG_REQUIRED');
    }

    const { authMod } = await loadFirebaseModules();
    const provider = new authMod.GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await authMod.signInWithPopup(firebaseAuth, provider);
      return result.user;
    } catch (err) {
      // Ignora erro quando o próprio usuário fecha o popup
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return null;
      }
      console.error('[AirbnbAuth] Erro no signInWithPopup:', err);
      throw err;
    }
  }

  // Desconecta o usuário do Firebase
  async function logout() {
    stopAccessWatcher();
    if (firebaseAuth) {
      const { authMod } = await loadFirebaseModules();
      await authMod.signOut(firebaseAuth);
    }
    notifyListeners(null, null);
  }

  // Gerenciamento da Allowlist no Firestore (Exclusivo do Dono)
  async function addStaffToAllowlist({ email, name, role = 'staff', staffId = null, active = true }) {
    if (!email) throw new Error('E-mail obrigatório');
    const cleanEmail = String(email).trim().toLowerCase();

    // Impede que administradores secundários tentem rebaixar ou alterar a raiz
    if (isRootOwnerEmail(cleanEmail) && (!currentUserState || !currentUserState.isRoot)) {
      throw new Error('Apenas o gestor raiz pode alterar o usuário mestre.');
    }

    const { firestoreMod } = await loadFirebaseModules();

    const docRef = firestoreMod.doc(firestoreDb, 'access', cleanEmail);
    const data = {
      email: cleanEmail,
      name: (name || '').trim(),
      role: role,
      active: active !== false,
      staffId: staffId || `staff_${Date.now()}`,
      updatedAt: new Date().toISOString()
    };

    await firestoreMod.setDoc(docRef, data, { merge: true });
    return data;
  }

  async function setStaffActiveInAllowlist(email, active) {
    if (!email) return;
    const cleanEmail = String(email).trim().toLowerCase();
    // Proteção: administradores raiz nunca podem ser inativados
    if (isRootOwnerEmail(cleanEmail)) return;

    const { firestoreMod } = await loadFirebaseModules();

    const docRef = firestoreMod.doc(firestoreDb, 'access', cleanEmail);
    await firestoreMod.setDoc(docRef, {
      active: Boolean(active),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  async function removeStaffFromAllowlist(email) {
    if (!email) return;
    const cleanEmail = String(email).trim().toLowerCase();
    // Proteção: administradores raiz nunca podem ser excluídos da allowlist
    if (isRootOwnerEmail(cleanEmail)) return;

    const { firestoreMod } = await loadFirebaseModules();

    const docRef = firestoreMod.doc(firestoreDb, 'access', cleanEmail);
    await firestoreMod.deleteDoc(docRef);
  }

  // Sincroniza em lote toda a lista de colaboradores para a allowlist do Firestore
  async function ensureStaffAllowlistBatch(staffList) {
    if (!Array.isArray(staffList) || staffList.length === 0) return;
    for (const s of staffList) {
      if (s && s.email) {
        try {
          await addStaffToAllowlist({
            email: s.email,
            name: s.name,
            role: 'staff',
            staffId: s.id,
            active: s.isActive !== false
          });
        } catch (e) {
          console.warn('[AirbnbAuth] Aviso ao sincronizar allowlist em lote:', s.email, e);
        }
      }
    }
  }

  // API pública exposta em window.AirbnbAuth
  root.AirbnbAuth = {
    init,
    loginWithGoogle,
    logout,
    onAuthStateChanged: (cb) => {
      authListeners.push(cb);
      if (authInitialized) {
        cb(currentUserState, lastAuthError);
      }
    },
    getCurrentUser: () => currentUserState,
    getLastError: () => lastAuthError,
    loadFirebaseModules,
    getDb: () => firestoreDb,
    getAuth: () => firebaseAuth,
    isRootOwnerEmail,
    addStaffToAllowlist,
    setStaffActiveInAllowlist,
    removeStaffFromAllowlist,
    ensureStaffAllowlistBatch
  };

})(window);
