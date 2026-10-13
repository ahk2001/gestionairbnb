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
            items.push({ id: docSnap.id, ...docSnap.data() });
          });

          // Atualiza o estado da aplicação
          if (appState && appState.data) {
            if (colName === 'purchases') {
              // Garante que compras locais criadas recentemente não sejam descartadas antes da confirmação da nuvem
              const remoteIds = new Set(items.map(it => String(it.id)));
              const localPending = (appState.data.purchases || []).filter(p => p && p.id && !remoteIds.has(String(p.id)));
              appState.data.purchases = [...localPending, ...items];
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

        slice.forEach(item => {
          const docId = String(item.id || item.catalogId || `doc_${Date.now()}`);
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

      // Se produtos já existirem mas a coleção de compras estiver vazia na nuvem, inicializa compras
      if (initialData.purchases && initialData.purchases.length > 0) {
        const purCol = firestoreMod.collection(firestoreDb, 'purchases');
        const purSnap = await firestoreMod.getDocs ? await firestoreMod.getDocs(purCol) : null;
        if (!purSnap || purSnap.empty) {
          console.log('[CloudSync] Coleção de compras vazia no Firestore. Inicializando compras...');
          await syncCollectionBatch('purchases', initialData.purchases);
        }
      }

      // Se produtos já existirem mas a coleção de recados estiver vazia na nuvem, inicializa recados
      if (initialData.notes && initialData.notes.length > 0) {
        const notesCol = firestoreMod.collection(firestoreDb, 'notes');
        const notesSnap = await firestoreMod.getDocs ? await firestoreMod.getDocs(notesCol) : null;
        if (!notesSnap || notesSnap.empty) {
          console.log('[CloudSync] Coleção de recados vazia no Firestore. Inicializando recados...');
          await syncCollectionBatch('notes', initialData.notes);
        }
      }

      // Se produtos já existirem mas a coleção de escalas estiver vazia na nuvem, inicializa escalas
      if (initialData.calendar && initialData.calendar.length > 0) {
        const calCol = firestoreMod.collection(firestoreDb, 'calendar');
        const calSnap = await firestoreMod.getDocs ? await firestoreMod.getDocs(calCol) : null;
        if (!calSnap || calSnap.empty) {
          console.log('[CloudSync] Coleção de escalas vazia no Firestore. Inicializando escalas...');
          await syncCollectionBatch('calendar', initialData.calendar);
        }
      }

      return false;
    } catch (err) {
      console.warn('[CloudSync] Não foi possível verificar necessidade de seed:', err);
      return false;
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
    syncCollectionBatch,
    seedCloudIfEmpty,
    scheduleSave,
    onSyncStatusChange,
    getStatus: () => syncStatus
  };

})(window);
