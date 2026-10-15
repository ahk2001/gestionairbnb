// cloud-sync.js
// Sincronização em Tempo Real com Firestore, Suporte Offline e Cache no Navegador
(function(root) {
  'use strict';

  let syncActive = false;
  let activeUnsubscribes = [];
  let syncStatus = 'idle'; // 'idle' | 'syncing' | 'synced' | 'offline' | 'error'
  let syncStatusListeners = [];
  let saveDebounceTimer = null;
  let lastKnownData = null;

  // Registro persistente de exclusões para blindagem contra reconciliação, concorrência e recarregamento
  const DELETED_STORAGE_KEY = 'AIRBNB_DELETED_DOCS_V2';
  const recentlyDeleted = new Map(); // `${colName}:${docId}` -> timestamp

  function loadPersistedDeleted() {
    try {
      const raw = localStorage.getItem(DELETED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const now = Date.now();
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        Object.entries(parsed).forEach(([key, time]) => {
          if (now - time < SEVEN_DAYS_MS) {
            recentlyDeleted.set(key, time);
          }
        });
      }
    } catch (e) {}
  }
  loadPersistedDeleted();

  function savePersistedDeleted() {
    try {
      const obj = {};
      recentlyDeleted.forEach((time, key) => {
        obj[key] = time;
      });
      localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {}
  }

  function markAsDeleted(colName, docId) {
    if (!docId) return;
    recentlyDeleted.set(`${colName}:${String(docId)}`, Date.now());
    savePersistedDeleted();
  }

  function isRecentlyDeleted(colName, docId) {
    if (!docId) return false;
    const key = `${colName}:${String(docId)}`;
    const time = recentlyDeleted.get(key);
    if (!time) return false;
    // Mantém blindagem por 7 dias para assegurar que exclusões não sejam ressuscitadas por caches locais
    if (Date.now() - time > 7 * 24 * 60 * 60 * 1000) {
      recentlyDeleted.delete(key);
      savePersistedDeleted();
      return false;
    }
    return true;
  }

  function notifySyncStatus(status, details = null) {
    syncStatus = status;
    syncStatusListeners.forEach(fn => {
      try { fn(status, details); } catch (e) { console.error(e); }
    });

    const badge = document.getElementById('cloud-sync-indicator');
    if (badge) {
      badge.className = `cloud-sync-badge status-${status}`;
      const textEl = badge.querySelector('.sync-badge-text');
      if (textEl) {
        if (status === 'synced') textEl.textContent = 'Nuvem Conectada';
        else if (status === 'syncing') textEl.textContent = 'Sincronizando...';
        else if (status === 'offline') textEl.textContent = 'Modo Offline';
        else if (status === 'error') textEl.textContent = 'Erro de Conexão';
        else textEl.textContent = 'Local';
      }
    }
  }

  // Registra ouvinte para status da sincronização
  function onSyncStatusChange(fn) {
    syncStatusListeners.push(fn);
    fn(syncStatus);
  }

  // Inicializa os snapshots em tempo real de todas as coleções do sistema
  async function startRealtimeSync(appState, onDataUpdate) {
    if (syncActive) stopSync();
    syncActive = true;

    if (!root.isFirebaseConfigured || !root.isFirebaseConfigured()) {
      notifySyncStatus('idle');
      return;
    }

    try {
      const { firestoreMod, firestoreDb } = await root.AirbnbAuth.loadFirebaseModules();
      if (!firestoreDb) return;

      notifySyncStatus('syncing');

      const collectionsToSync = [
        'products',
        'trashProducts',
        'staff',
        'notes',
        'calendar',
        'purchases',
        'timesheets'
      ];

      // Ouve mudanças de rede no navegador
      window.addEventListener('online', () => notifySyncStatus('syncing'));
      window.addEventListener('offline', () => notifySyncStatus('offline'));

      let initialLoadsRemaining = collectionsToSync.length + 1; // +1 para settings/ownerProfile

      function checkInitialLoadComplete() {
        initialLoadsRemaining--;
        if (initialLoadsRemaining <= 0) {
          notifySyncStatus('synced');
        }
      }

      // 1. Escuta as coleções de listas
      collectionsToSync.forEach(colName => {
        const colRef = firestoreMod.collection(firestoreDb, colName);
        const unsub = firestoreMod.onSnapshot(colRef, (snapshot) => {
          const items = [];
          snapshot.forEach(docSnap => {
            if (!isRecentlyDeleted(colName, docSnap.id)) {
              items.push({ id: docSnap.id, ...docSnap.data() });
            }
          });

          // Atualiza o estado da aplicação
          if (appState && appState.data) {
            if (colName === 'purchases') {
              // Garante que compras locais criadas recentemente não sejam descartadas antes da confirmação da nuvem
              const remoteIds = new Set(items.map(it => String(it.id)));
              const localPending = (appState.data.purchases || []).filter(p => p && p.id && !remoteIds.has(String(p.id)));
              const combinedPurchases = [...localPending, ...items];
              if (typeof root.comparePurchasesDesc === 'function') {
                combinedPurchases.sort(root.comparePurchasesDesc);
              } else {
                combinedPurchases.sort((a, b) => {
                  const dateA = String(a.purchaseDate || '').slice(0, 10);
                  const dateB = String(b.purchaseDate || '').slice(0, 10);
                  if (dateA !== dateB) return dateB.localeCompare(dateA);
                  const numA = Number(String(a.id || '').replace(/\D/g, '')) || 0;
                  const numB = Number(String(b.id || '').replace(/\D/g, '')) || 0;
                  return numB - numA;
                });
              }
              appState.data.purchases = combinedPurchases;
            } else if (colName === 'notes') {
              // Garante que recados locais recém-criados não sejam descartados antes da confirmação da nuvem
              const remoteIds = new Set(items.map(it => String(it.id)));
              const localPending = (appState.data.notes || []).filter(n => n && n.id && !remoteIds.has(String(n.id)));
              const combined = [...localPending, ...items];
              combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              appState.data.notes = combined;
            } else if (colName === 'calendar') {
              // Garante que escalas locais recém-criadas não sejam descartadas antes da confirmação da nuvem
              const remoteIds = new Set(items.map(it => String(it.id)));
              const localPending = (appState.data.calendar || []).filter(e => e && e.id && !remoteIds.has(String(e.id)));
              appState.data.calendar = [...localPending, ...items];
            } else if (colName === 'timesheets') {
              // Garante que registros de horas locais recém-criados não sejam descartados antes da confirmação da nuvem
              const remoteIds = new Set(items.map(it => String(it.id)));
              const localPending = (appState.data.timesheets || []).filter(t => t && t.id && !remoteIds.has(String(t.id)));
              const combined = [...localPending, ...items];
              combined.sort((a, b) => {
                if (b.date !== a.date) return (b.date || '').localeCompare(a.date || '');
                return (b.startTime || '').localeCompare(a.startTime || '');
              });
              appState.data.timesheets = combined;
            } else if (colName === 'staff') {
              // Sincronização inteligente de equipe: atualiza nomes e fotos da nuvem em tempo real
              const currentList = Array.isArray(appState.data.staff) ? appState.data.staff : [];
              const merged = [];
              const seenKeys = new Set();

              // Prioridade para os documentos mais recentes do Firestore
              items.forEach(remItem => {
                const sId = remItem.id ? String(remItem.id) : null;
                const sEmail = remItem.email ? String(remItem.email).trim().toLowerCase() : null;
                merged.push(remItem);
                if (sId) seenKeys.add('id:' + sId);
                if (sEmail) seenKeys.add('email:' + sEmail);
              });

              // Preserva colaboradores locais que ainda não tenham sido descarregados na nuvem
              currentList.forEach(locItem => {
                const sId = locItem.id ? String(locItem.id) : null;
                const sEmail = locItem.email ? String(locItem.email).trim().toLowerCase() : null;
                const hasId = sId && seenKeys.has('id:' + sId);
                const hasEmail = sEmail && seenKeys.has('email:' + sEmail);
                if (!hasId && !hasEmail) {
                  merged.push(locItem);
                  if (sId) seenKeys.add('id:' + sId);
                  if (sEmail) seenKeys.add('email:' + sEmail);
                }
              });

              appState.data.staff = merged;

              // Se o usuário atual for gestor, garante que toda a equipe da nuvem tenha allowlist ativa no Firestore
              if (appState.currentUser && appState.currentUser.type === 'owner' && root.AirbnbAuth && typeof root.AirbnbAuth.ensureStaffAllowlistBatch === 'function') {
                root.AirbnbAuth.ensureStaffAllowlistBatch(merged).catch(() => {});
              }
            } else if (colName === 'products') {
              // Sincroniza produtos do estoque preservando criações locais pendentes e honrando exclusões
              const remoteIds = new Set(items.map(it => String(it.id)));
              const trashIds = new Set((appState.data.trashProducts || []).map(t => String(t.id || t.catalogId)).filter(Boolean));
              const trashNames = new Set((appState.data.trashProducts || []).map(t => String(t.name || '').trim().toLowerCase()).filter(Boolean));

              const isItemTrashedOrDeleted = (p) => {
                if (!p) return true;
                const cId = p.catalogId ? String(p.catalogId) : '';
                const pId = p.id ? String(p.id) : '';
                const pName = p.name ? String(p.name).trim().toLowerCase() : '';
                return (cId && trashIds.has(cId)) ||
                       (pId && trashIds.has(pId)) ||
                       (pName && trashNames.has(pName)) ||
                       isRecentlyDeleted('products', pId) ||
                       (cId && isRecentlyDeleted('products', cId));
              };

              const localPending = (appState.data.products || []).filter(p =>
                p && p.id && !remoteIds.has(String(p.id)) && !isRecentlyDeleted('products', p.id) && !isItemTrashedOrDeleted(p)
              );
              const cleanRemoteItems = items.filter(it => !isItemTrashedOrDeleted(it));
              appState.data.products = [...localPending, ...cleanRemoteItems];
            } else if (colName === 'trashProducts') {
              // A lixeira reflete exatamente a coleção remota (inclusive vazia)
              appState.data.trashProducts = items;
              // Remove imediatamente do estoque quaisquer produtos que estejam na lixeira
              if (appState.data.products && Array.isArray(appState.data.products)) {
                const trashIds = new Set(items.map(t => String(t.id || t.catalogId)).filter(Boolean));
                const trashNames = new Set(items.map(t => String(t.name || '').trim().toLowerCase()).filter(Boolean));
                const prodsBefore = appState.data.products.length;
                appState.data.products = appState.data.products.filter(p => {
                  if (!p) return false;
                  const cId = p.catalogId ? String(p.catalogId) : '';
                  const pId = p.id ? String(p.id) : '';
                  const pName = p.name ? String(p.name).trim().toLowerCase() : '';
                  if (cId && trashIds.has(cId)) return false;
                  if (pId && trashIds.has(pId)) return false;
                  if (pName && trashNames.has(pName)) return false;
                  return true;
                });
                if (appState.data.products.length !== prodsBefore) {
                  try { localStorage.setItem('airbnb_stock_data_v2', JSON.stringify(appState.data)); } catch (e) {}
                }
              }
            } else {
              // Se o Firestore retornou dados para essa coleção, substitui no estado
              if (items.length > 0) {
                appState.data[colName] = items;
              }
            }
            if (onDataUpdate) onDataUpdate(colName, appState.data[colName]);
          }
          checkInitialLoadComplete();
        }, (err) => {
          console.warn(`[CloudSync] Erro na coleção ${colName}:`, err);
          notifySyncStatus('error', err);
          checkInitialLoadComplete();
        });

        activeUnsubscribes.push(unsub);
      });

      // 2. Escuta configurações gerais / perfil do gestor
      const settingsRef = firestoreMod.doc(firestoreDb, 'settings', 'ownerProfile');
      const unsubSettings = firestoreMod.onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists() && appState && appState.data) {
          appState.data.ownerProfile = docSnap.data();
          if (onDataUpdate) onDataUpdate('ownerProfile', docSnap.data());
        }
        checkInitialLoadComplete();
      }, (err) => {
        console.warn('[CloudSync] Erro no perfil do gestor:', err);
        checkInitialLoadComplete();
      });

      activeUnsubscribes.push(unsubSettings);

    } catch (err) {
      console.error('[CloudSync] Erro ao iniciar sincronização:', err);
      notifySyncStatus('error', err);
    }
  }

  // Interrompe todos os observadores ao deslogar
  function stopSync() {
    activeUnsubscribes.forEach(unsub => {
      try { unsub(); } catch (e) {}
    });
    activeUnsubscribes = [];
    syncActive = false;
    notifySyncStatus('idle');
  }

  // Salva um documento individual no Firestore
  async function saveDocument(collectionName, docId, data) {
    if (!root.isFirebaseConfigured || !root.isFirebaseConfigured()) return;
    try {
      const { firestoreMod, firestoreDb } = await root.AirbnbAuth.loadFirebaseModules();
      if (!firestoreDb) return;

      const docRef = firestoreMod.doc(firestoreDb, collectionName, String(docId));
      const cleanData = JSON.parse(JSON.stringify(data));
      await firestoreMod.setDoc(docRef, cleanData, { merge: true });
    } catch (err) {
      console.error(`[CloudSync] Erro ao salvar doc ${collectionName}/${docId}:`, err);
      throw err;
    }
  }

  // Exclui um documento individual no Firestore
  async function deleteDocument(collectionName, docId) {
    if (!docId) return;
    markAsDeleted(collectionName, docId);
    if (!root.isFirebaseConfigured || !root.isFirebaseConfigured()) return;
    try {
      const { firestoreMod, firestoreDb } = await root.AirbnbAuth.loadFirebaseModules();
      if (!firestoreDb) return;

      const docRef = firestoreMod.doc(firestoreDb, collectionName, String(docId));
      await firestoreMod.deleteDoc(docRef);
    } catch (err) {
      console.error(`[CloudSync] Erro ao excluir doc ${collectionName}/${docId}:`, err);
      throw err;
    }
  }

  // Exclui múltiplos documentos em lote no Firestore
  async function deleteDocuments(collectionName, docIds) {
    if (!Array.isArray(docIds) || docIds.length === 0) return;
    docIds.forEach(id => markAsDeleted(collectionName, id));
    if (!root.isFirebaseConfigured || !root.isFirebaseConfigured()) return;
    try {
      const { firestoreMod, firestoreDb } = await root.AirbnbAuth.loadFirebaseModules();
      if (!firestoreDb) return;

      const BATCH_SIZE = 400;
      for (let i = 0; i < docIds.length; i += BATCH_SIZE) {
        const batch = firestoreMod.writeBatch(firestoreDb);
        const slice = docIds.slice(i, i + BATCH_SIZE);
        slice.forEach(id => {
          if (!id) return;
          const docRef = firestoreMod.doc(firestoreDb, collectionName, String(id));
          batch.delete(docRef);
        });
        await batch.commit();
      }
    } catch (err) {
      console.error(`[CloudSync] Erro ao excluir lote em ${collectionName}:`, err);
      throw err;
    }
  }

  // Sincroniza em lote uma lista inteira de documentos no Firestore
  async function syncCollectionBatch(collectionName, items) {
    if (!root.isFirebaseConfigured || !root.isFirebaseConfigured()) return;
    if (!Array.isArray(items)) return;

    try {
      const { firestoreMod, firestoreDb } = await root.AirbnbAuth.loadFirebaseModules();
      if (!firestoreDb) return;

      // O Firestore permite até 500 operações por batch
      const BATCH_SIZE = 400;
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = firestoreMod.writeBatch(firestoreDb);
        const slice = items.slice(i, i + BATCH_SIZE);

        slice.forEach((item, itemIdx) => {
          const docId = String(item.id || item.catalogId || `doc_${Date.now()}_${itemIdx}_${Math.random().toString(36).slice(2, 7)}`);
          if (isRecentlyDeleted(collectionName, docId)) return;
          const docRef = firestoreMod.doc(firestoreDb, collectionName, docId);
          const cleanItem = JSON.parse(JSON.stringify(item));
          batch.set(docRef, cleanItem, { merge: true });
        });

        await batch.commit();
      }
    } catch (err) {
      console.error(`[CloudSync] Erro ao sincronizar lote de ${collectionName}:`, err);
      throw err;
    }
  }

  // Inicializa o banco de dados na nuvem com os dados padrão se estiver vazio
  async function seedCloudIfEmpty(initialData) {
    if (!root.isFirebaseConfigured || !root.isFirebaseConfigured()) return false;
    try {
      const { firestoreMod, firestoreDb } = await root.AirbnbAuth.loadFirebaseModules();
      if (!firestoreDb) return false;

      // Checa se a coleção de produtos já possui algum item
      const prodsRef = firestoreMod.collection(firestoreDb, 'products');
      const testSnap = await firestoreMod.getDocs ? await firestoreMod.getDocs(prodsRef) : null;

      if (!testSnap || testSnap.empty) {
        console.log('[CloudSync] Banco na nuvem vazio. Inicializando com catálogo mestre...');
        notifySyncStatus('syncing');

        if (initialData.products && initialData.products.length > 0) {
          await syncCollectionBatch('products', initialData.products);
        }
        if (initialData.staff && initialData.staff.length > 0) {
          await syncCollectionBatch('staff', initialData.staff);
        }
        if (initialData.notes && initialData.notes.length > 0) {
          await syncCollectionBatch('notes', initialData.notes);
        }
        if (initialData.calendar && initialData.calendar.length > 0) {
          await syncCollectionBatch('calendar', initialData.calendar);
        }
        if (initialData.purchases && initialData.purchases.length > 0) {
          await syncCollectionBatch('purchases', initialData.purchases);
        }
        if (initialData.trashProducts && initialData.trashProducts.length > 0) {
          await syncCollectionBatch('trashProducts', initialData.trashProducts);
        }

        notifySyncStatus('synced');
        return true;
      }

      return false;
    } catch (err) {
      console.warn('[CloudSync] Não foi possível verificar necessidade de seed:', err);
      return false;
    }
  }

  // Limpa completamente dados de teste do Firestore mantendo apenas acessos de gestores e os 24 produtos com quantidade zerada
  async function wipeCloudDataForCleanSlate(cleanProducts) {
    if (!root.isFirebaseConfigured || !root.isFirebaseConfigured()) return false;
    try {
      const { firestoreMod, firestoreDb } = await root.AirbnbAuth.loadFirebaseModules();
      if (!firestoreDb) return false;

      notifySyncStatus('syncing');

      // 1. Coleções operacionais a serem limpas
      const collectionsToWipe = [
        'purchases',
        'notes',
        'calendar',
        'timesheets',
        'trashProducts',
        'staff'
      ];

      for (const colName of collectionsToWipe) {
        const colRef = firestoreMod.collection(firestoreDb, colName);
        const snapshot = await firestoreMod.getDocs(colRef);
        if (!snapshot.empty) {
          const batch = firestoreMod.writeBatch(firestoreDb);
          snapshot.forEach(docSnap => batch.delete(docSnap.ref));
          await batch.commit();
        }
      }

      // 2. Limpar allowlist de acesso mantendo estritamente os gestores/proprietários
      try {
        const accessRef = firestoreMod.collection(firestoreDb, 'access');
        const accessSnap = await firestoreMod.getDocs(accessRef);
        if (!accessSnap.empty) {
          const batch = firestoreMod.writeBatch(firestoreDb);
          let count = 0;
          accessSnap.forEach(docSnap => {
            const data = docSnap.data();
            const email = String(docSnap.id || '').toLowerCase().trim();
            const isRoot = (root.AIRBNB_ROOT_OWNERS || []).some(e => String(e).toLowerCase().trim() === email);
            const isOwner = data && data.role === 'owner';
            if (!isRoot && !isOwner) {
              batch.delete(docSnap.ref);
              count++;
            }
          });
          if (count > 0) {
            await batch.commit();
          }
        }
      } catch (e) {
        console.warn('[CloudSync] Allowlist preservada ou erro ao limpar contas não gestoras:', e);
      }

      // 3. Atualizar produtos para os 24 produtos iniciais com quantidade 0
      if (Array.isArray(cleanProducts) && cleanProducts.length > 0) {
        await syncCollectionBatch('products', cleanProducts);
      }

      notifySyncStatus('synced');
      return true;
    } catch (err) {
      console.error('[CloudSync] Erro ao zerar banco na nuvem:', err);
      notifySyncStatus('error', err);
      throw err;
    }
  }

  // Agendador de sincronização com debounce para não sobrecarregar requisições
  function scheduleSave(collectionName, docId, data) {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    notifySyncStatus('syncing');

    saveDebounceTimer = setTimeout(async () => {
      try {
        if (collectionName && docId && data) {
          await saveDocument(collectionName, docId, data);
        }
        notifySyncStatus('synced');
      } catch (err) {
        notifySyncStatus('error', err);
      }
    }, 350);
  }

  root.AirbnbCloudSync = {
    startRealtimeSync,
    stopSync,
    saveDocument,
    deleteDocument,
    deleteDocuments,
    syncCollectionBatch,
    seedCloudIfEmpty,
    wipeCloudDataForCleanSlate,
    scheduleSave,
    onSyncStatusChange,
    getStatus: () => syncStatus
  };

})(window);
