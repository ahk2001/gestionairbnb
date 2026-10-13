(function() {
// Obtenção dos dados iniciais de initialData.js (compatível com execução direta file:// e via servidor http://)
const initialData = (typeof window !== 'undefined' && window.AirbnbInitialData) ? window.AirbnbInitialData : {};
const DEFAULT_PROPERTIES = initialData.DEFAULT_PROPERTIES || [];
const INITIAL_STAFF = initialData.INITIAL_STAFF || [];
const OWNER_PROFILE = initialData.OWNER_PROFILE || {
  id: "owner_admin",
  name: "Gestor",
  email: "gestionairbnb2026@gmail.com",
  role: "Administrador",
  avatar: "AD"
};
const PRODUCT_CATALOG = initialData.PRODUCT_CATALOG || [];
const generateInitialProducts = initialData.generateInitialProducts || (() => []);
const INITIAL_NOTES = initialData.INITIAL_NOTES || [];
const INITIAL_CALENDAR_EVENTS = initialData.INITIAL_CALENDAR_EVENTS || [];
const INITIAL_PURCHASES = initialData.INITIAL_PURCHASES || [];
const INITIAL_TRASH_PRODUCTS = initialData.INITIAL_TRASH_PRODUCTS || [];
const INITIAL_TIMESHEETS = initialData.INITIAL_TIMESHEETS || [];

// Chaves de armazenamento LocalStorage (V5 com novos dados fictícios completos)
const STORAGE_DATA_KEY = 'AIRBNB_CONTROL_DATA_V5';
const STORAGE_SESSION_KEY = 'AIRBNB_CONTROL_SESSION_V3';
const STORAGE_CURRENCY_KEY = 'AIRBNB_CONTROL_CURRENCY_V2';

// Estado da Aplicação
const state = {
  data: {
    properties: [],
    products: [],
    trashProducts: [], // Produtos excluídos que ficam até 30 dias na lixeira
    staff: [],
    notes: [],
    calendar: [],
    purchases: [],
    timesheets: [], // Registros de horas trabalhadas da equipe
    ownerProfile: null // Perfil personalizado do gestor/proprietário
  },
  currentUser: null, // { type: 'staff'|'owner', id, name, role, avatar, photo }
  selectedProperty: 'JB', // 'JB' | 'VN' | 'HN' | 'ALL'
  calendarView: {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    selectedDate: null
  },
  activeTab: 'inventory', // 'products' | 'inventory' | 'notes' | 'calendar' | 'owner'
  selectedCategory: 'all',
  selectedStatus: 'all',
  searchQuery: '',
  currency: 'EUR', // Moeda padrão fixa: Euro (€)
  
  // Controle da Aba Produtos (Catálogo Mestre e Lixeira)
  catalogActiveSubTab: 'active', // 'active' | 'trash'
  catalogSearchQuery: '',
  tempEditProductPhotoBase64: null,

  // Foto temporária em base64 para edição de perfil
  tempEditProfilePhotoBase64: null,

  // Controle de PIN do Modal da Equipe
  selectedStaffForPin: null,
  enteredPin: '',
  
  // Foto temporária em base64 para comprovante
  tempReceiptBase64: null,

  // Filtros de Data de Compras na Aba Gestão
  purchaseDateFilter: 'todos', // 'todos' | 'hoje' | 'ontem' | 'semana' | 'este_mes' | 'mes_especifico'
  purchaseSelectedMonth: '', // 'YYYY-MM'

  // Foto temporária em base64 para novo produto
  tempNewProductPhotoBase64: null,

  // Controle de Horas Trabalhadas (Timesheet)
  timesheetStaffFilter: 'all', // 'all' | staffId
  activeManagerStaffId: null, // staffId aberta no popup do gestor
  activeManagerStaffDate: '', // data selecionada no popup do gestor
  managerCalendarYear: new Date().getFullYear(),
  managerCalendarMonth: new Date().getMonth(),
  tempTimesheetTimes: {
    start: '08:00',
    breakStart: '',
    breakEnd: '',
    end: ''
  }
};

// ==========================================================================
// Controla visibilidade de botões contextuais por aba
// (Ex: Botões de registrar nova compra aparecem SOMENTE no estoque; seletor de imóveis não aparece na gestão nem na aba de catálogo de produtos)
function updateTabElementsVisibility(targetTab) {
  const isInventory = targetTab === 'inventory';
  const isOwner = targetTab === 'owner';
  const isProducts = targetTab === 'products';

  const fab = document.getElementById('fab-quick-purchase');
  const bannerBuy = document.getElementById('banner-quick-purchase');
  const propOverview = document.getElementById('property-overview-card');
  const propTabsWrapper = document.getElementById('property-tabs-wrapper');

  if (fab) fab.style.display = isInventory ? 'flex' : 'none';
  if (bannerBuy) bannerBuy.style.display = isInventory ? 'flex' : 'none';
  if (propOverview) propOverview.style.display = isInventory ? 'block' : 'none';
  if (propTabsWrapper) propTabsWrapper.style.display = (isOwner || isProducts) ? 'none' : 'block';
}

function initApp() {
  loadData();

  // Aplica as traduções corretas do idioma ativo (padrão 'es' na inicialização)
  if (window.I18N && typeof window.I18N.updateDomTranslations === 'function') {
    window.I18N.updateDomTranslations();
  }

  setupEventListeners();
  updateTabElementsVisibility(state.activeTab);

  // Inicialização com Firebase Auth Segura
  if (window.AirbnbAuth) {
    AirbnbAuth.onAuthStateChanged((user, error) => {
      if (user) {
        state.currentUser = user;
        saveSession(user);
        hideGateScreen();
        updateTabElementsVisibility(state.activeTab);
        renderAll();

        // Vincula automaticamente perfil e foto do Google com o registro da equipe
        syncStaffWithCurrentUser(user).then(() => {
          renderAll();
        }).catch(err => console.warn('[Auth] Erro ao sincronizar equipe:', err));

        // Inicia sincronização em tempo real na nuvem
        if (window.AirbnbCloudSync) {
          AirbnbCloudSync.startRealtimeSync(state, (colName, items) => {
            try { localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(state.data)); } catch (e) {}
            updateBadges();
            renderAll();
          });

          // Se for gestor/dono e a nuvem estiver vazia, faz o seed inicial
          if (user.type === 'owner') {
            AirbnbCloudSync.seedCloudIfEmpty(state.data);
          }
        }
      } else if (error) {
        if (error.code === 'ACCESS_DENIED' || error.code === 'ACCOUNT_INACTIVE') {
          setGateDenied(error.message, error.email);
        } else if (error.code === 'NOT_CONFIGURED') {
          loadSession();
          if (state.currentUser) {
            hideGateScreen();
            renderAll();
          } else {
            showGateScreen();
          }
        } else {
          showGateScreen();
          showToast(error.message || 'Erro na autenticação.');
        }
      } else {
        // Usuário deslogado
        loadSession();
        if (state.currentUser && (!window.isFirebaseConfigured || !window.isFirebaseConfigured())) {
          hideGateScreen();
          renderAll();
        } else {
          state.currentUser = null;
          showGateScreen();
        }
      }
    });

    AirbnbAuth.init();
  } else {
    // Modo fallback sem módulo de auth carregado
    loadSession();
    if (state.currentUser) {
      hideGateScreen();
      renderAll();
    } else {
      showGateScreen();
    }
  }
}

function getInitials(name, fallback = 'EQ') {
  if (!name) return fallback;
  const clean = name.replace(/[^\p{L}\p{N}\s]/gu, '').trim();
  if (!clean) return fallback;
  if (/^[A-Za-z]{2}$/.test(clean)) return clean.toUpperCase();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function loadData() {
  let saved = localStorage.getItem(STORAGE_DATA_KEY);

  const sampleReceipts = [
    'assets/WhatsApp Image 2026-10-08 at 10.38.12 (2).jpeg',
    'assets/WhatsApp Image 2026-10-08 at 10.38.14 (7).jpeg',
    'assets/WhatsApp Image 2026-10-08 at 10.38.14 (9).jpeg',
    'assets/WhatsApp Image 2026-10-08 at 10.38.15 (1).jpeg',
    'assets/WhatsApp Image 2026-10-08 at 10.38.15 (2).jpeg',
    'assets/WhatsApp Image 2026-10-08 at 10.38.15 (4).jpeg',
    'assets/WhatsApp Image 2026-10-08 at 10.38.16.jpeg'
  ];

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.data = {
        properties: [...DEFAULT_PROPERTIES],
        products: (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) ? parsed.products : generateInitialProducts(),
        trashProducts: (parsed && Array.isArray(parsed.trashProducts) && parsed.trashProducts.length > 0) ? parsed.trashProducts : JSON.parse(JSON.stringify(INITIAL_TRASH_PRODUCTS)),
        staff: (parsed && Array.isArray(parsed.staff) && parsed.staff.length > 0) ? parsed.staff : [...INITIAL_STAFF],
        notes: (parsed && Array.isArray(parsed.notes) && parsed.notes.length > 0) ? parsed.notes : [...INITIAL_NOTES],
        calendar: (parsed && Array.isArray(parsed.calendar) && parsed.calendar.length > 0) ? parsed.calendar : [...INITIAL_CALENDAR_EVENTS],
        purchases: (parsed && Array.isArray(parsed.purchases) && parsed.purchases.length > 0)
          ? parsed.purchases.map((p, idx) => {
              if (!p.items || !Array.isArray(p.items) || p.items.length === 0) {
                p.items = [{
                  catalogId: p.productId || 'p01',
                  productName: p.productName || 'Produto',
                  productPhoto: p.productPhoto || '',
                  quantity: p.quantityBought || 1
                }];
              }
              if (!p.receiptPhoto) {
                const initMatch = INITIAL_PURCHASES.find(ip => ip.id === p.id);
                p.receiptPhoto = (initMatch && initMatch.receiptPhoto) ? initMatch.receiptPhoto : sampleReceipts[idx % sampleReceipts.length];
              }
              return p;
            })
          : [...INITIAL_PURCHASES],
        timesheets: (parsed && Array.isArray(parsed.timesheets) && parsed.timesheets.length > 0)
          ? parsed.timesheets
          : (INITIAL_TIMESHEETS && INITIAL_TIMESHEETS.length > 0 ? [...INITIAL_TIMESHEETS] : []),
        ownerProfile: (parsed && parsed.ownerProfile) ? parsed.ownerProfile : null
      };

      if (state.data.ownerProfile) {
        if (state.data.ownerProfile.name) OWNER_PROFILE.name = state.data.ownerProfile.name;
        if (state.data.ownerProfile.photo) OWNER_PROFILE.photo = state.data.ownerProfile.photo;
      }

      // Limpeza automática da lixeira: produtos que já estão na lixeira há mais de 30 dias (1 mês) são removidos definitivamente
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      const nowMs = Date.now();
      state.data.trashProducts = state.data.trashProducts.filter(item => {
        if (!item.deletedAt) return true;
        const diff = nowMs - new Date(item.deletedAt).getTime();
        return diff < THIRTY_DAYS_MS;
      });
      if (state.data.calendar && Array.isArray(state.data.calendar)) {
        state.data.calendar.forEach(ev => {
          if (ev.eventType === 'reserva') {
            ev.eventType = 'checking';
          }
          if (!ev.startTime) {
            if (ev.eventType === 'checkout' || ev.eventType === 'limpeza') ev.startTime = '11:00';
            else if (ev.eventType === 'checking') ev.startTime = '15:00';
            else if (ev.eventType === 'manutencao') ev.startTime = '10:00';
            else if (ev.eventType === 'compras') ev.startTime = '09:30';
            else ev.startTime = '10:00';
          }
        });
      }
      state.data.staff.forEach(s => {
        s.role = ''; // Todo funcionário é só funcionário, não tem cargos
        if (s.name && s.name.toLowerCase().includes('duda')) {
          s.name = 'Equipe';
        }
        if (!s.avatar || s.avatar.length > 2 || /[^\p{L}\p{N}]/u.test(s.avatar)) {
          s.avatar = getInitials(s.name, 'EQ');
        }
      });
      state.data.products.forEach(p => {
        if (p.note === undefined) p.note = null;
      });
      // Sincroniza produtos cadastrados pelo usuário de volta ao catálogo mestre
      state.data.products.forEach(p => {
        if (p.catalogId && !PRODUCT_CATALOG.some(c => c.id === p.catalogId)) {
          PRODUCT_CATALOG.push({
            id: p.catalogId,
            name: p.name,
            brand: p.brand || 'BOSQUE VERDE',
            category: p.category || 'limpeza',
            categoryLabel: p.categoryLabel || 'Diversos',
            unit: p.unit || 'un',
            photo: p.photo,
            estimatedPrice: p.estimatedPrice || 0,
            description: p.name
          });
        }
      });
      if (!state.data.products.some(p => p.note)) {
        const sampleProd = state.data.products.find(p => p.id === 'JB_p01');
        if (sampleProd) {
          sampleProd.note = 'Priorizar versão concentrada sem perfume';
          sampleProd.noteAuthor = 'Maria';
          sampleProd.noteUpdatedAt = new Date().toISOString();
        }
      }

      // Expurgar apenas registros com datas estritamente no futuro (ex: amanhã ou depois)
      if (state.data && Array.isArray(state.data.timesheets)) {
        const todayStr = getTodayDateString();
        const lenBefore = state.data.timesheets.length;

        state.data.timesheets = state.data.timesheets.filter(t => {
          if (!t.date) return false;
          if (t.date > todayStr) return false;
          return true;
        });

        if (state.data.timesheets.length !== lenBefore) {
          saveData();
        }
      }
    } catch (e) {
      console.error('Erro ao restaurar dados, restaurando padrões', e);
      loadFactoryDefaults();
    }
  } else {
    loadFactoryDefaults();
  }
  state.currency = 'EUR';
}

function loadFactoryDefaults() {
  state.data = {
    properties: [...DEFAULT_PROPERTIES],
    products: generateInitialProducts(),
    trashProducts: (INITIAL_TRASH_PRODUCTS && INITIAL_TRASH_PRODUCTS.length > 0) ? JSON.parse(JSON.stringify(INITIAL_TRASH_PRODUCTS)) : [],
    staff: [...INITIAL_STAFF],
    notes: [...INITIAL_NOTES],
    calendar: [...INITIAL_CALENDAR_EVENTS],
    purchases: [...INITIAL_PURCHASES],
    timesheets: (INITIAL_TIMESHEETS && INITIAL_TIMESHEETS.length > 0) ? JSON.parse(JSON.stringify(INITIAL_TIMESHEETS)) : [],
    ownerProfile: null
  };
  saveData();
}

let cloudSyncDebounceTimer = null;

function syncToCloudDebounced() {
  if (!window.AirbnbCloudSync || !window.isFirebaseConfigured || !window.isFirebaseConfigured()) return;
  if (!state.currentUser) return;

  const isOwner = state.currentUser?.type === 'owner';

  if (cloudSyncDebounceTimer) clearTimeout(cloudSyncDebounceTimer);
  cloudSyncDebounceTimer = setTimeout(async () => {
    // 1. Produtos (permitido para Gestor e Equipe)
    if (state.data.products) {
      try { await AirbnbCloudSync.syncCollectionBatch('products', state.data.products); }
      catch (e) { console.warn('[CloudSync] Falha ao sincronizar products:', e); }
    }

    // 2. Compras / Comprovantes (permitido para Gestor e Equipe)
    if (state.data.purchases) {
      try { await AirbnbCloudSync.syncCollectionBatch('purchases', state.data.purchases); }
      catch (e) { console.warn('[CloudSync] Falha ao sincronizar purchases:', e); }
    }

    // 3. Notas / Mural de Recados (permitido para Gestor e Equipe)
    if (state.data.notes) {
      try { await AirbnbCloudSync.syncCollectionBatch('notes', state.data.notes); }
      catch (e) { console.warn('[CloudSync] Falha ao sincronizar notes:', e); }
    }

    // 4. Registro de Horas / Timesheets
    if (state.data.timesheets) {
      try {
        if (isOwner) {
          await AirbnbCloudSync.syncCollectionBatch('timesheets', state.data.timesheets);
        } else {
          const myEmail = (state.currentUser?.email || '').toLowerCase().trim();
          const myId = state.currentUser?.id;
          const myTimesheets = state.data.timesheets.filter(t => 
            (myEmail && t.staffEmail && t.staffEmail.toLowerCase() === myEmail) ||
            (myId && t.staffId === myId)
          );
          if (myTimesheets.length > 0) {
            await AirbnbCloudSync.syncCollectionBatch('timesheets', myTimesheets);
          }
        }
      } catch (e) {
        console.warn('[CloudSync] Falha ao sincronizar timesheets:', e);
      }
    }

    // 5. Calendário de Escalas (permitido para Gestor e Equipe)
    if (state.data.calendar) {
      try { await AirbnbCloudSync.syncCollectionBatch('calendar', state.data.calendar); }
      catch (e) { console.warn('[CloudSync] Falha ao sincronizar calendar:', e); }
    }

    // 6. Lixeira de Produtos (permitido para Gestor e Equipe)
    if (state.data.trashProducts) {
      try { await AirbnbCloudSync.syncCollectionBatch('trashProducts', state.data.trashProducts); }
      catch (e) { console.warn('[CloudSync] Falha ao sincronizar trashProducts:', e); }
    }

    // Coleções restritas exclusivamente ao Gestor / Proprietário
    if (isOwner) {
      if (state.data.staff) {
        try { await AirbnbCloudSync.syncCollectionBatch('staff', state.data.staff); }
        catch (e) { console.warn('[CloudSync] Falha ao sincronizar staff:', e); }
      }
      if (state.data.ownerProfile) {
        try { await AirbnbCloudSync.saveDocument('settings', 'ownerProfile', state.data.ownerProfile); }
        catch (e) { console.warn('[CloudSync] Falha ao sincronizar ownerProfile:', e); }
      }
    }
  }, 1200);
}

function saveData() {
  localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(state.data));
  updateBadges();
  syncToCloudDebounced();
}

function loadSession() {
  const savedSession = localStorage.getItem(STORAGE_SESSION_KEY);
  if (savedSession) {
    try {
      state.currentUser = JSON.parse(savedSession);
      if (state.currentUser) {
        if (state.currentUser.name && state.currentUser.name.toLowerCase().includes('duda')) {
          state.currentUser.name = 'Equipe';
        }
        // Sincroniza foto e nome com a fonte mais recente (staff ou ownerProfile)
        if (state.currentUser.type === 'staff') {
          const matchedStaff = (state.data.staff || []).find(s => s.id === state.currentUser.id);
          if (matchedStaff) {
            state.currentUser.name = matchedStaff.name;
            state.currentUser.photo = matchedStaff.photo || null;
          }
        } else if (state.currentUser.type === 'owner') {
          if (state.data.ownerProfile) {
            state.currentUser.name = state.data.ownerProfile.name || state.currentUser.name;
            state.currentUser.photo = state.data.ownerProfile.photo || null;
          }
        }
        state.currentUser.avatar = getInitials(state.currentUser.name, state.currentUser.type === 'owner' ? 'AD' : 'EQ');
      }
    } catch (e) {
      state.currentUser = null;
    }
  }
}

function saveSession(user) {
  state.currentUser = user;
  if (user) {
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  }
  updateTopbarUser();
}

// ==========================================================================
// Utilitários de Moeda e Formatação (Sempre em Euro €)
// ==========================================================================
function formatMoney(amount) {
  const num = Number(amount) || 0;
  return `€ ${num.toFixed(2).replace('.', ',')}`;
}

function formatDate(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatDateTime(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  const isEs = window.I18N ? window.I18N.getLanguage() === 'es' : false;
  const separator = isEs ? ' a las ' : ' às ';
  const locale = isEs ? 'es-ES' : 'pt-BR';
  return `${d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}${separator}${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==========================================================================
// Feedback Tátil e Notificações (Toast Limpo sem Emojis)
// ==========================================================================
function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2800);
}

// ==========================================================================
// Diálogos Modais Exclusivos no App (100% In-App / Sem alertas do navegador)
// ==========================================================================
let _confirmDialogResolver = null;
let _promptDialogResolver = null;

function showConfirmDialog(options = {}) {
  const {
    title = 'Confirmar Ação',
    message = '',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    confirmDanger = false,
    icon = 'question'
  } = (typeof options === 'string' ? { message: options } : options);

  const modal = document.getElementById('modal-confirm-dialog');
  const titleEl = document.getElementById('confirm-dialog-title');
  const msgEl = document.getElementById('confirm-dialog-message');
  const btnOk = document.getElementById('btn-confirm-dialog-ok');
  const btnCancel = document.getElementById('btn-confirm-dialog-cancel');
  const iconWrap = document.getElementById('confirm-dialog-icon-wrap');

  if (!modal || !btnOk || !btnCancel) {
    return Promise.resolve(true);
  }

  if (_confirmDialogResolver) {
    _confirmDialogResolver(false);
    _confirmDialogResolver = null;
  }

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  btnOk.textContent = confirmText;
  btnCancel.textContent = cancelText;

  btnOk.className = 'confirm-dialog-btn-confirm ' + (confirmDanger ? 'is-danger' : 'is-primary');
  btnOk.style.background = confirmDanger ? '#DC2626' : 'var(--accent-navy, #0F2744)';

  if (iconWrap) {
    let iconSvg = '';
    let iconClass = 'info';

    if (icon === 'trash' || confirmDanger) {
      iconClass = 'danger';
      iconSvg = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>`;
    } else if (icon === 'warning') {
      iconClass = 'warning';
      iconSvg = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>`;
    } else if (icon === 'logout') {
      iconClass = 'info';
      iconSvg = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
      </svg>`;
    } else if (icon === 'reset') {
      iconClass = 'danger';
      iconSvg = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="23 4 23 10 17 10"></polyline>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
      </svg>`;
    } else {
      iconClass = 'info';
      iconSvg = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>`;
    }

    iconWrap.innerHTML = `<div class="confirm-dialog-icon-circle ${iconClass}">${iconSvg}</div>`;
  }

  return new Promise((resolve) => {
    const cleanup = () => {
      modal.classList.remove('active');
      btnOk.onclick = null;
      btnCancel.onclick = null;
      document.removeEventListener('keydown', handleKey);
      _confirmDialogResolver = null;
    };

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(false);
      }
    };

    _confirmDialogResolver = (val) => {
      cleanup();
      resolve(val);
    };

    btnOk.onclick = () => {
      cleanup();
      resolve(true);
    };

    btnCancel.onclick = () => {
      cleanup();
      resolve(false);
    };

    document.addEventListener('keydown', handleKey);
    modal.classList.add('active');
  });
}

function showPromptDialog(options = {}) {
  const {
    title = 'Informação',
    message = '',
    defaultValue = '',
    placeholder = '',
    inputType = 'text',
    maxLength = null,
    confirmText = 'Salvar'
  } = (typeof options === 'string' ? { message: options } : options);

  const modal = document.getElementById('modal-prompt-dialog');
  const titleEl = document.getElementById('prompt-dialog-title');
  const msgEl = document.getElementById('prompt-dialog-message');
  const formEl = document.getElementById('prompt-dialog-form');
  const inputEl = document.getElementById('prompt-dialog-input');
  const btnCancel = document.getElementById('btn-prompt-dialog-cancel');
  const btnClose = document.getElementById('btn-prompt-dialog-close');
  const btnOk = document.getElementById('btn-prompt-dialog-ok');

  if (!modal || !formEl || !inputEl) {
    return Promise.resolve(null);
  }

  if (_promptDialogResolver) {
    _promptDialogResolver(null);
    _promptDialogResolver = null;
  }

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  if (btnOk) btnOk.textContent = confirmText;

  inputEl.type = inputType;
  inputEl.value = defaultValue;
  inputEl.placeholder = placeholder;
  if (maxLength) {
    inputEl.maxLength = maxLength;
    inputEl.inputMode = 'numeric';
  } else {
    inputEl.removeAttribute('maxLength');
    inputEl.removeAttribute('inputMode');
  }

  return new Promise((resolve) => {
    const cleanup = () => {
      modal.classList.remove('active');
      formEl.onsubmit = null;
      if (btnCancel) btnCancel.onclick = null;
      if (btnClose) btnClose.onclick = null;
      document.removeEventListener('keydown', handleKey);
      _promptDialogResolver = null;
    };

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(null);
      }
    };

    _promptDialogResolver = (val) => {
      cleanup();
      resolve(val);
    };

    formEl.onsubmit = (e) => {
      e.preventDefault();
      const val = inputEl.value;
      cleanup();
      resolve(val);
    };

    if (btnCancel) {
      btnCancel.onclick = () => {
        cleanup();
        resolve(null);
      };
    }

    if (btnClose) {
      btnClose.onclick = () => {
        cleanup();
        resolve(null);
      };
    }

    document.addEventListener('keydown', handleKey);
    modal.classList.add('active');

    setTimeout(() => {
      inputEl.focus();
      inputEl.select();
    }, 120);
  });
}

// ==========================================================================
// Controle de Autenticação e Portão de Entrada
// ==========================================================================
function showGateScreen() {
  const gate = document.getElementById('gate-screen');
  if (gate) gate.style.display = 'flex';

  const idle = document.getElementById('gate-auth-idle');
  const loading = document.getElementById('gate-auth-loading');
  const denied = document.getElementById('gate-auth-denied');
  const hint = document.getElementById('gate-config-hint');

  if (idle) idle.style.display = 'block';
  if (loading) loading.style.display = 'none';
  if (denied) denied.style.display = 'none';

  if (hint) {
    hint.style.display = (window.isFirebaseConfigured && !window.isFirebaseConfigured()) ? 'block' : 'none';
  }
}

function hideGateScreen() {
  const gate = document.getElementById('gate-screen');
  if (gate) gate.style.display = 'none';
}

function setGateLoading(isLoading, text = 'Conectando e verificando permissões...') {
  const idle = document.getElementById('gate-auth-idle');
  const loading = document.getElementById('gate-auth-loading');
  const denied = document.getElementById('gate-auth-denied');
  const loadingText = document.querySelector('.gate-auth-loading-text');

  if (loadingText && text) loadingText.textContent = text;
  if (idle) idle.style.display = isLoading ? 'none' : 'block';
  if (loading) loading.style.display = isLoading ? 'block' : 'none';
  if (denied) denied.style.display = 'none';
}

function setGateDenied(message, email = '') {
  const gate = document.getElementById('gate-screen');
  if (gate) gate.style.display = 'flex';
  const idle = document.getElementById('gate-auth-idle');
  const loading = document.getElementById('gate-auth-loading');
  const denied = document.getElementById('gate-auth-denied');
  const msgEl = document.getElementById('gate-denied-message');
  const emailEl = document.getElementById('gate-denied-email-badge');

  if (idle) idle.style.display = 'none';
  if (loading) loading.style.display = 'none';
  if (denied) denied.style.display = 'block';
  if (msgEl && message) msgEl.textContent = message;
  if (emailEl) {
    emailEl.textContent = email;
    emailEl.style.display = email ? 'inline-block' : 'none';
  }

  // Desconecta a conta não autorizada no Firebase para evitar loop de sessão presa
  if (window.AirbnbAuth && typeof AirbnbAuth.logout === 'function') {
    AirbnbAuth.logout().catch(() => {});
  }
}

function showGateStep(step) {
  showGateScreen();
}

function updateTopbarUser() {
  const usernameEl = document.getElementById('topbar-username');
  const roleEl = document.getElementById('topbar-role');
  const avatarEl = document.getElementById('topbar-avatar');
  const navOwnerItem = document.getElementById('nav-item-owner');
  const ownerStaffSec = document.getElementById('owner-staff-management-section');

  if (state.currentUser) {
    if (usernameEl) usernameEl.textContent = state.currentUser.name;
    if (avatarEl) {
      if (state.currentUser.photo) {
        avatarEl.innerHTML = `<img src="${state.currentUser.photo}" alt="${escapeHtml(state.currentUser.name)}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        avatarEl.style.padding = '0';
        avatarEl.style.overflow = 'hidden';
      } else {
        avatarEl.style.padding = '';
        avatarEl.style.overflow = '';
        avatarEl.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
      }
    }

    const isOwner = state.currentUser.type === 'owner';
    const roleText = window.I18N
      ? (isOwner ? window.I18N.t('topbar.roleOwner') : window.I18N.t('topbar.roleStaff'))
      : (isOwner ? 'Propietario / Gestor' : 'Equipo Operativo');

    if (isOwner) {
      if (roleEl) roleEl.textContent = roleText;
      if (avatarEl) avatarEl.className = 'user-avatar-badge is-owner';
      if (navOwnerItem) navOwnerItem.style.display = 'flex';
      if (ownerStaffSec) ownerStaffSec.style.display = 'block';
      document.querySelectorAll('.owner-only-section').forEach(sec => sec.style.display = 'block');
    } else {
      if (roleEl) roleEl.textContent = roleText;
      if (avatarEl) avatarEl.className = 'user-avatar-badge is-staff';
      // Na área do funcionário, a aba Gestão é liberada para controle de horas trabalhadas
      if (navOwnerItem) navOwnerItem.style.display = 'flex';
      if (ownerStaffSec) ownerStaffSec.style.display = 'none';
      document.querySelectorAll('.owner-only-section').forEach(sec => sec.style.display = 'none');
    }

    renderUserProfileSection();
  }
}

// ==========================================================================
// Gestão de Perfil de Usuário (Foto e Nome para Equipe e Gestor)
// ==========================================================================
function renderUserProfileSection() {
  const container = document.getElementById('user-profile-section');
  if (!container) return;

  if (!state.currentUser) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';

  const nameEl = document.getElementById('user-profile-name-display');
  const roleEl = document.getElementById('user-profile-role-display');
  const avatarBox = document.getElementById('user-profile-avatar-display');

  const isOwner = state.currentUser.type === 'owner';
  const defaultName = isOwner
    ? (window.I18N ? window.I18N.t('topbar.userManager') : 'Gestor')
    : (window.I18N ? window.I18N.t('topbar.userTeam') : 'Equipo');
  const roleText = window.I18N
    ? (isOwner ? window.I18N.t('topbar.roleOwner') : window.I18N.t('topbar.roleStaff'))
    : (isOwner ? 'Propietario / Gestor' : 'Equipo Operativo');

  if (nameEl) nameEl.textContent = state.currentUser.name || defaultName;
  if (roleEl) {
    roleEl.textContent = roleText;
    if (isOwner) {
      roleEl.classList.add('is-owner');
    } else {
      roleEl.classList.remove('is-owner');
    }
  }

  if (avatarBox) {
    if (state.currentUser.photo) {
      avatarBox.innerHTML = `<img src="${state.currentUser.photo}" alt="${escapeHtml(state.currentUser.name)}">`;
    } else {
      const initials = getInitials(state.currentUser.name, isOwner ? 'AD' : 'EQ');
      avatarBox.innerHTML = `<span>${initials}</span>`;
    }
  }
}

function compressImageFile(file, maxDimension = 960, quality = 0.8, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxDimension || h > maxDimension) {
        if (w > h) {
          h = Math.round((h * maxDimension) / w);
          w = maxDimension;
        } else {
          w = Math.round((w * maxDimension) / h);
          h = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      callback(dataUrl);
    };
    img.onerror = () => {
      callback(e.target.result);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function compressProfileImage(file, callback) {
  compressImageFile(file, 320, 0.82, callback);
}

function openEditProfileModal() {
  if (!state.currentUser) return;
  const modal = document.getElementById('modal-edit-profile');
  if (!modal) return;

  const nameInput = document.getElementById('edit-profile-name');
  const previewImg = document.getElementById('profile-photo-preview-img');
  const placeholder = document.getElementById('profile-photo-preview-placeholder');
  const btnRemove = document.getElementById('btn-remove-profile-photo');

  if (nameInput) {
    nameInput.value = state.currentUser.name || '';
  }

  state.tempEditProfilePhotoBase64 = state.currentUser.photo || null;

  if (state.tempEditProfilePhotoBase64) {
    if (previewImg) {
      previewImg.src = state.tempEditProfilePhotoBase64;
      previewImg.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
    if (btnRemove) btnRemove.style.display = 'inline-block';
  } else {
    if (previewImg) {
      previewImg.src = '';
      previewImg.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = 'flex';
    if (btnRemove) btnRemove.style.display = 'none';
  }

  modal.classList.add('active');
}

function closeEditProfileModal() {
  const modal = document.getElementById('modal-edit-profile');
  if (modal) modal.classList.remove('active');
  state.tempEditProfilePhotoBase64 = null;
  const photoInput = document.getElementById('profile-photo-input');
  if (photoInput) photoInput.value = '';
}

// ==========================================================================
// Vinculação e Sincronização de Perfil de Funcionário com a Equipe
// ==========================================================================
async function syncStaffWithCurrentUser(user) {
  if (!user) return;
  const isOwner = user.type === 'owner';
  const userEmail = (user.email || '').trim().toLowerCase();
  const userId = user.id ? String(user.id) : null;
  const userName = (user.name || '').trim();
  const userPhoto = user.photo || null;

  if (isOwner) {
    if (!state.data.ownerProfile) {
      state.data.ownerProfile = { ...OWNER_PROFILE };
    }
    let changed = false;
    if (userName && state.data.ownerProfile.name !== userName) {
      state.data.ownerProfile.name = userName;
      changed = true;
    }
    if (userPhoto && state.data.ownerProfile.photo !== userPhoto) {
      state.data.ownerProfile.photo = userPhoto;
      changed = true;
    }
    if (changed && window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
      try {
        await AirbnbCloudSync.saveDocument('settings', 'ownerProfile', state.data.ownerProfile);
      } catch (e) {
        console.warn('[Sync] Falha ao sincronizar ownerProfile:', e);
      }
    }
    return;
  }

  // Para Colaboradoras: procura ou cadastra na lista state.data.staff
  if (!state.data.staff) state.data.staff = [];
  let staff = state.data.staff.find(s => {
    if (!s) return false;
    if (userId && String(s.id) === userId) return true;
    if (userEmail && s.email && s.email.trim().toLowerCase() === userEmail) return true;
    if (userName && s.name && s.name.trim().toLowerCase() === userName.toLowerCase()) return true;
    return false;
  });

  let needSave = false;
  if (!staff) {
    // Colaboradora ainda não estava na lista local: adiciona com dados reais do Google
    staff = {
      id: userId || `staff_${Date.now()}`,
      name: userName || 'Colaboradora',
      email: userEmail,
      role: '',
      isActive: true,
      photo: userPhoto,
      avatar: getInitials(userName || 'Colaboradora', 'EQ'),
      createdAt: new Date().toISOString()
    };
    state.data.staff.push(staff);
    needSave = true;
  } else {
    // Colaboradora existe: atualiza foto e dados caso estejam vazios ou desatualizados
    if (userPhoto && staff.photo !== userPhoto) {
      staff.photo = userPhoto;
      needSave = true;
    }
    if (userName && userName !== 'Equipe' && staff.name !== userName) {
      staff.name = userName;
      staff.avatar = getInitials(userName, 'EQ');
      needSave = true;
    }
    if (userEmail && (!staff.email || staff.email.trim().toLowerCase() !== userEmail)) {
      staff.email = userEmail;
      needSave = true;
    }
  }

  if (needSave) {
    saveData();
    if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured() && staff.id) {
      try {
        await AirbnbCloudSync.saveDocument('staff', staff.id, staff);
      } catch (err) {
        console.warn('[Sync] Falha ao sincronizar membro de equipe na nuvem:', err);
      }
    }
  }
}

async function saveUserProfile(newName, newPhoto) {
  if (!state.currentUser) return;
  const trimmed = (newName || '').trim();
  if (!trimmed) {
    showToast('O nome não pode ficar em branco.');
    return;
  }

  const oldName = state.currentUser.name || '';
  const userEmail = (state.currentUser.email || '').trim().toLowerCase();
  const userId = state.currentUser.id ? String(state.currentUser.id) : null;

  state.currentUser.name = trimmed;
  state.currentUser.photo = newPhoto || null;
  state.currentUser.avatar = getInitials(trimmed, state.currentUser.type === 'owner' ? 'AD' : 'EQ');

  let updatedStaffObj = null;

  if (state.currentUser.type === 'staff') {
    if (!state.data.staff) state.data.staff = [];

    // Busca flexível na lista de equipe
    let staff = state.data.staff.find(s => {
      if (!s) return false;
      if (userId && String(s.id) === userId) return true;
      if (userEmail && s.email && s.email.trim().toLowerCase() === userEmail) return true;
      if (oldName && s.name && s.name.trim().toLowerCase() === oldName.trim().toLowerCase()) return true;
      return false;
    });

    if (staff) {
      staff.name = trimmed;
      staff.photo = newPhoto || null;
      staff.avatar = state.currentUser.avatar;
      if (userEmail && !staff.email) staff.email = userEmail;
      updatedStaffObj = staff;
    } else {
      updatedStaffObj = {
        id: userId || `staff_${Date.now()}`,
        name: trimmed,
        email: userEmail,
        role: '',
        isActive: true,
        photo: newPhoto || null,
        avatar: state.currentUser.avatar,
        createdAt: new Date().toISOString()
      };
      state.data.staff.push(updatedStaffObj);
    }

    // Sincroniza registros de horas com novo nome e foto
    let timesheetsUpdated = false;
    (state.data.timesheets || []).forEach(t => {
      const match = (t.staffId && (String(t.staffId) === userId || (updatedStaffObj && String(t.staffId) === String(updatedStaffObj.id)))) ||
                    (userEmail && t.staffEmail && t.staffEmail.toLowerCase() === userEmail) ||
                    (oldName && t.staffName && t.staffName.trim().toLowerCase() === oldName.trim().toLowerCase());
      if (match) {
        t.staffName = trimmed;
        if (newPhoto !== undefined) t.staffPhoto = newPhoto || null;
        timesheetsUpdated = true;
      }
    });

    // Sincroniza notas/recados com novo nome e foto
    let notesUpdated = false;
    (state.data.notes || []).forEach(n => {
      const match = (n.authorId && (String(n.authorId) === userId || (updatedStaffObj && String(n.authorId) === String(updatedStaffObj.id)))) ||
                    (n.authorEmail && userEmail && n.authorEmail.toLowerCase() === userEmail) ||
                    (oldName && n.authorName && n.authorName.trim().toLowerCase() === oldName.trim().toLowerCase());
      if (match) {
        n.authorName = trimmed;
        if (newPhoto !== undefined) n.authorPhoto = newPhoto || null;
        notesUpdated = true;
      }
    });

    // Sincroniza compras com novo nome e foto
    let purchasesUpdated = false;
    (state.data.purchases || []).forEach(p => {
      const match = (p.buyerStaffId && (String(p.buyerStaffId) === userId || (updatedStaffObj && String(p.buyerStaffId) === String(updatedStaffObj.id)))) ||
                    (p.buyerEmail && userEmail && p.buyerEmail.toLowerCase() === userEmail) ||
                    (oldName && p.buyerName && p.buyerName.trim().toLowerCase() === oldName.trim().toLowerCase());
      if (match) {
        p.buyerName = trimmed;
        if (newPhoto !== undefined) p.buyerPhoto = newPhoto || null;
        purchasesUpdated = true;
      }
    });

    // Sincroniza anotações de produtos
    (state.data.products || []).forEach(p => {
      if (oldName && p.noteAuthor && p.noteAuthor.trim().toLowerCase() === oldName.trim().toLowerCase()) {
        p.noteAuthor = trimmed;
        if (newPhoto !== undefined) p.noteAuthorPhoto = newPhoto || null;
      }
    });

    // Sincroniza escalas no calendário
    let calendarUpdated = false;
    (state.data.calendar || []).forEach(c => {
      const match = (c.assignedStaffId && (String(c.assignedStaffId) === userId || (updatedStaffObj && String(c.assignedStaffId) === String(updatedStaffObj.id)))) ||
                    (oldName && c.assignedStaffName && c.assignedStaffName.trim().toLowerCase() === oldName.trim().toLowerCase());
      if (match) {
        c.assignedStaffName = trimmed;
        calendarUpdated = true;
      }
    });

    // Sincronização em tempo real na nuvem (Firestore)
    if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
      try {
        if (updatedStaffObj && updatedStaffObj.id) {
          await AirbnbCloudSync.saveDocument('staff', updatedStaffObj.id, updatedStaffObj);
        }
        if (timesheetsUpdated && state.data.timesheets && state.data.timesheets.length > 0) {
          await AirbnbCloudSync.syncCollectionBatch('timesheets', state.data.timesheets);
        }
        if (notesUpdated && state.data.notes && state.data.notes.length > 0) {
          await AirbnbCloudSync.syncCollectionBatch('notes', state.data.notes);
        }
        if (purchasesUpdated && state.data.purchases && state.data.purchases.length > 0) {
          await AirbnbCloudSync.syncCollectionBatch('purchases', state.data.purchases);
        }
        if (calendarUpdated && state.data.calendar && state.data.calendar.length > 0) {
          await AirbnbCloudSync.syncCollectionBatch('calendar', state.data.calendar);
        }
      } catch (cloudErr) {
        console.warn('[CloudSync] Falha ao sincronizar perfil do colaborador na nuvem:', cloudErr);
      }
    }
  } else if (state.currentUser.type === 'owner') {
    if (!state.data.ownerProfile) {
      state.data.ownerProfile = { ...OWNER_PROFILE };
    }
    state.data.ownerProfile.name = trimmed;
    state.data.ownerProfile.photo = newPhoto || null;
    OWNER_PROFILE.name = trimmed;
    OWNER_PROFILE.photo = newPhoto || null;

    let notesUpdated = false;
    (state.data.notes || []).forEach(n => {
      if (n.authorType === 'owner' || n.authorName === oldName) {
        n.authorName = trimmed;
        if (newPhoto !== undefined) n.authorPhoto = newPhoto || null;
        notesUpdated = true;
      }
    });

    let purchasesUpdated = false;
    (state.data.purchases || []).forEach(p => {
      if (p.buyerType === 'owner' || p.buyerName === 'Gestor' || p.buyerName === oldName) {
        p.buyerName = trimmed;
        if (newPhoto !== undefined) p.buyerPhoto = newPhoto || null;
        purchasesUpdated = true;
      }
    });

    if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
      try {
        await AirbnbCloudSync.saveDocument('settings', 'ownerProfile', state.data.ownerProfile);
        if (notesUpdated && state.data.notes && state.data.notes.length > 0) {
          await AirbnbCloudSync.syncCollectionBatch('notes', state.data.notes);
        }
        if (purchasesUpdated && state.data.purchases && state.data.purchases.length > 0) {
          await AirbnbCloudSync.syncCollectionBatch('purchases', state.data.purchases);
        }
      } catch (cloudErr) {
        console.warn('[CloudSync] Falha ao salvar perfil do gestor na nuvem:', cloudErr);
      }
    }
  }

  saveData();
  saveSession(state.currentUser);
  renderAll();
  showToast('Perfil atualizado com sucesso!');
}

async function performGoogleLogin() {
  // Se o Firebase ainda não foi configurado com credenciais reais
  if (!window.isFirebaseConfigured || !window.isFirebaseConfigured()) {
    const useDemo = await showConfirmDialog({
      title: 'Configuração do Firebase',
      message: 'O Firebase ainda não está configurado em firebase-config.js. Deseja acessar em Modo de Demonstração (Gestor)?',
      confirmText: 'Entrar como Gestor (Demo)',
      cancelText: 'Cancelar',
      confirmDanger: false,
      icon: 'sync'
    });

    if (useDemo) {
      const demoUser = {
        type: 'owner',
        id: 'owner_demo',
        name: 'Gestor (Demo)',
        email: 'gestionairbnb2026@gmail.com',
        role: 'Administrador',
        avatar: 'AD',
        photo: null,
        isRoot: true
      };
      saveSession(demoUser);
      hideGateScreen();
      updateTopbarUser();
      updateTabElementsVisibility(state.activeTab);
      renderAll();
      showToast('Acesso em Modo de Demonstração liberado.');
    }
    return;
  }

  setGateLoading(true, 'Abrindo login com o Google...');

  try {
    const user = await window.AirbnbAuth.loginWithGoogle();
    if (!user) {
      // Usuário cancelou ou fechou a janela do popup
      setGateLoading(false);
    }
    // onAuthStateChanged cuidará de receber o usuário e liberar a tela
  } catch (err) {
    console.error('Erro ao efetuar login com o Google:', err);
    setGateLoading(false);

    let errMsg = 'Não foi possível concluir o login com o Google.';
    if (err && err.code) {
      if (err.code === 'auth/operation-not-allowed') {
        errMsg = 'Atenção: O login com Google ainda não foi ativado no Firebase Console (Aba "Método de login").';
      } else if (err.code === 'auth/unauthorized-domain') {
        errMsg = 'O Google ainda está propagando o domínio autorizado. Aguarde 1 minuto e tente novamente.';
      } else if (err.code === 'auth/popup-blocked') {
        errMsg = 'A janela pop-up foi bloqueada pelo navegador. Permita pop-ups neste site.';
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      } else {
        errMsg = `Erro (${err.code}): ${err.message || 'Falha de autenticação'}`;
      }
    } else if (err && err.message) {
      errMsg = `Erro: ${err.message}`;
    }
    showToast(errMsg, 7000);
  }
}

async function logout() {
  if (cloudSyncDebounceTimer) {
    clearTimeout(cloudSyncDebounceTimer);
    cloudSyncDebounceTimer = null;
  }
  // Sincroniza eventuais alterações pendentes de recados, compras ou horas antes de desconectar
  if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured() && state.currentUser) {
    try {
      if (state.data.notes) await AirbnbCloudSync.syncCollectionBatch('notes', state.data.notes);
      if (state.data.purchases) await AirbnbCloudSync.syncCollectionBatch('purchases', state.data.purchases);
      if (state.data.timesheets) {
        const isOwner = state.currentUser?.type === 'owner';
        const myEmail = (state.currentUser?.email || '').toLowerCase().trim();
        const myId = state.currentUser?.id;
        const myTimesheets = isOwner
          ? state.data.timesheets
          : state.data.timesheets.filter(t => (myEmail && t.staffEmail && t.staffEmail.toLowerCase() === myEmail) || (myId && t.staffId === myId));
        if (myTimesheets.length > 0) await AirbnbCloudSync.syncCollectionBatch('timesheets', myTimesheets);
      }
    } catch (e) {
      console.warn('[CloudSync] Falha ao descarregar pendências antes do logout:', e);
    }
  }
  if (window.AirbnbCloudSync) {
    AirbnbCloudSync.stopSync();
  }
  if (window.AirbnbAuth) {
    await AirbnbAuth.logout();
  }
  state.currentUser = null;
  saveSession(null);
  showGateScreen();
  showToast('Sessão encerrada com sucesso.');
}

// Stubs para compatibilidade com chamadas legadas
function handlePinKey() {}
function verifyEnteredPin() {}
function renderPinStaffSelector() {}
function openStaffLoginModal() { showGateScreen(); }
function closeStaffLoginModal() {}
function openOwnerLoginModal() { showGateScreen(); }
function closeOwnerLoginModal() {}

// Exposição global imediata no escopo window
if (typeof window !== 'undefined') {
  window.showGateStep = showGateStep;
  window.handlePinKey = handlePinKey;
  window.performGoogleLogin = performGoogleLogin;
  window.logout = logout;
  window.initApp = initApp;
  window.openStaffLoginModal = openStaffLoginModal;
  window.openOwnerLoginModal = openOwnerLoginModal;
}

// ==========================================================================
// Atualização dos Badges e Contadores de Alertas
// ==========================================================================
function updateBadges() {
  // Contagem de itens em Falta ou Acabando por imóvel
  const counts = { JB: 0, VN: 0, HN: 0, ALL: 0 };

  state.data.products.forEach(p => {
    if (p.status === 'falta' || p.status === 'acabando') {
      if (counts[p.propertyId] !== undefined) {
        counts[p.propertyId]++;
      }
      counts.ALL++;
    }
  });

  // Badges numéricos dos imóveis removidos a pedido do usuário
  ['JB', 'VN', 'HN', 'ALL'].forEach(prop => {
    const dot = document.getElementById(`dot-badge-${prop}`);
    if (dot) dot.style.display = 'none';
  });

  // Notificação da lixeira removida do menu inferior (aba Produtos permanece limpa)
  const navBadgeProducts = document.getElementById('nav-badge-products');
  if (navBadgeProducts) {
    navBadgeProducts.style.display = 'none';
  }

  // Atualiza banner de visão geral do imóvel atual
  updateOverviewCard();

  // Atualiza botão/banner de produtos em falta no WhatsApp
  updateWhatsappShortageButton();
}

function updateOverviewCard() {
  const titleEl = document.getElementById('overview-prop-title');
  const subEl = document.getElementById('overview-prop-subtitle');
  const badgeEl = document.getElementById('overview-prop-badge');
  const statFalta = document.getElementById('stat-count-falta');
  const statAcabando = document.getElementById('stat-count-acabando');
  const statSuficiente = document.getElementById('stat-count-suficiente');

  const filteredProducts = state.selectedProperty === 'ALL'
    ? state.data.products
    : state.data.products.filter(p => p.propertyId === state.selectedProperty);

  const numFalta = filteredProducts.filter(p => p.status === 'falta').length;
  const numAcabando = filteredProducts.filter(p => p.status === 'acabando').length;
  const numSuficiente = filteredProducts.filter(p => p.status === 'suficiente').length;

  const updateNumberWithPop = (el, val) => {
    if (!el) return;
    if (el.textContent !== String(val)) {
      el.textContent = val;
      el.classList.remove('number-pop');
      void el.offsetWidth;
      el.classList.add('number-pop');
    }
  };

  updateNumberWithPop(statFalta, numFalta);
  updateNumberWithPop(statAcabando, numAcabando);
  updateNumberWithPop(statSuficiente, numSuficiente);

  // Sincroniza destaque visual dos chips com o filtro ativo
  document.querySelectorAll('.stat-chip').forEach(chip => {
    if (state.selectedStatus && state.selectedStatus !== 'all' && chip.dataset.filterStatus === state.selectedStatus) {
      chip.classList.add('active-filter');
    } else {
      chip.classList.remove('active-filter');
    }
  });

  if (state.selectedProperty === 'ALL') {
    titleEl.textContent = window.I18N ? window.I18N.t('inventory.allPropsTitle') : 'Todos os Imóveis';
    subEl.textContent = window.I18N ? window.I18N.t('inventory.allPropsSubtitle') : 'Visão Consolidada: JB • VN • HN';
    subEl.style.display = 'block';
    badgeEl.textContent = 'GLOBAL';
    badgeEl.style.background = 'rgba(255, 255, 255, 0.2)';
    badgeEl.style.color = '#FFF';
  } else {
    const propInfo = state.data.properties.find(p => p.id === state.selectedProperty) || DEFAULT_PROPERTIES[0];
    titleEl.textContent = propInfo.name;
    subEl.textContent = '';
    subEl.style.display = 'none';
    badgeEl.textContent = propInfo.code;
    badgeEl.style.background = 'rgba(255, 255, 255, 0.20)';
    badgeEl.style.color = '#FFFFFF';
    badgeEl.style.borderColor = 'rgba(255, 255, 255, 0.25)';
  }
}

// ==========================================================================
// Renderização Principal (Estoque, Reposição, Recados, etc.)
// ==========================================================================
function renderAll() {
  updateBadges();
  updateTopbarUser();
  renderUserProfileSection();
  renderProducts();
  renderProductsTab();
  renderUrgentItems();
  renderNotes();
  renderCalendar();
  renderOwnerDashboard();
  renderPurchaseProductOptions();
}

// ==========================================================================
// 1. Estoque Completo (Cards com Foto Real, Semáforo e Botões + / -)
// ==========================================================================

// Obtém as regras de quantidades para o semáforo de um produto (Falta, Atenção, Suficiente)
function getProductThresholds(product) {
  const faltaMax = (product && product.faltaThreshold !== undefined && product.faltaThreshold !== null)
    ? Math.max(0, parseInt(product.faltaThreshold, 10))
    : 0;

  const atencaoMax = (product && product.atencaoThreshold !== undefined && product.atencaoThreshold !== null)
    ? Math.max(faltaMax + 1, parseInt(product.atencaoThreshold, 10))
    : Math.max(1, faltaMax + 1);

  const suficienteMin = (product && product.suficienteThreshold !== undefined && product.suficienteThreshold !== null)
    ? Math.max(atencaoMax + 1, parseInt(product.suficienteThreshold, 10))
    : Math.max(2, atencaoMax + 1);

  return { faltaMax, atencaoMax, suficienteMin };
}

// Determina o status ('falta', 'acabando', 'suficiente') baseado na quantidade atual e nas regras do produto
function calculateProductStatus(product, quantity) {
  const { faltaMax, atencaoMax } = getProductThresholds(product);
  const q = Number(quantity);
  if (q <= faltaMax) return 'falta';
  if (q <= atencaoMax) return 'acabando';
  return 'suficiente';
}

// Abre o modal de configuração rápida de regras do semáforo
function openThresholdsModal(productId) {
  const product = state.data.products.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('modal-product-thresholds');
  const idInput = document.getElementById('thresholds-product-id');
  const imgEl = document.getElementById('thresholds-product-img');
  const nameEl = document.getElementById('thresholds-product-name');
  const subEl = document.getElementById('thresholds-product-subtitle');
  const qtyEl = document.getElementById('thresholds-current-qty-badge');
  const faltaInput = document.getElementById('threshold-input-falta');
  const atencaoInput = document.getElementById('threshold-input-atencao');
  const suficienteInput = document.getElementById('threshold-input-suficiente');

  const { faltaMax, atencaoMax, suficienteMin } = getProductThresholds(product);

  if (idInput) idInput.value = product.id;
  if (imgEl) imgEl.src = product.photo || 'https://placehold.co/100x100?text=Produto';
  if (nameEl) nameEl.textContent = product.name;
  if (subEl) subEl.textContent = `Regras de quantidade para ${product.name} (${product.propertyId})`;
  if (qtyEl) qtyEl.textContent = `Estoque Atual: ${product.quantity} ${product.unit || 'un'}`;

  if (faltaInput) faltaInput.value = faltaMax;
  if (atencaoInput) atencaoInput.value = atencaoMax;
  if (suficienteInput) suficienteInput.value = suficienteMin;

  modal?.classList.add('active');
}

// Fecha o modal de regras do semáforo
function closeThresholdsModal() {
  const modal = document.getElementById('modal-product-thresholds');
  modal?.classList.remove('active');
}

// Salva as regras do semáforo configuradas no modal
function handleThresholdsSubmit(e) {
  e.preventDefault();
  const productId = document.getElementById('thresholds-product-id')?.value;
  const product = state.data.products.find(p => p.id === productId);
  if (!product) return;

  const faltaVal = parseInt(document.getElementById('threshold-input-falta')?.value, 10);
  const atencaoVal = parseInt(document.getElementById('threshold-input-atencao')?.value, 10);
  const suficienteVal = parseInt(document.getElementById('threshold-input-suficiente')?.value, 10);

  const faltaMax = isNaN(faltaVal) || faltaVal < 0 ? 0 : faltaVal;
  const atencaoMax = isNaN(atencaoVal) || atencaoVal <= faltaMax ? faltaMax + 1 : atencaoVal;
  const suficienteMin = isNaN(suficienteVal) || suficienteVal <= atencaoMax ? atencaoMax + 1 : suficienteVal;

  const applyAll = document.getElementById('thresholds-apply-all')?.checked;

  if (applyAll) {
    // Aplica para todos os imóveis que possuem este produto (por catalogId ou por nome)
    state.data.products.forEach(p => {
      const match = (p.catalogId && product.catalogId && p.catalogId === product.catalogId) ||
                    (p.name.toLowerCase() === product.name.toLowerCase());
      if (match) {
        p.faltaThreshold = faltaMax;
        p.atencaoThreshold = atencaoMax;
        p.suficienteThreshold = suficienteMin;
        p.status = calculateProductStatus(p, p.quantity);
        p.updatedAt = new Date().toISOString();
      }
    });

    // Atualiza também no catálogo mestre se existir
    const catItem = PRODUCT_CATALOG.find(c =>
      (c.id && product.catalogId && c.id === product.catalogId) ||
      (c.name.toLowerCase() === product.name.toLowerCase())
    );
    if (catItem) {
      catItem.faltaThreshold = faltaMax;
      catItem.atencaoThreshold = atencaoMax;
      catItem.suficienteThreshold = suficienteMin;
    }
  } else {
    // Aplica apenas para o item do imóvel atual
    product.faltaThreshold = faltaMax;
    product.atencaoThreshold = atencaoMax;
    product.suficienteThreshold = suficienteMin;
    product.status = calculateProductStatus(product, product.quantity);
    product.updatedAt = new Date().toISOString();
  }

  saveData();
  closeThresholdsModal();
  renderAll();
  showToast(`Regras de semáforo salvas para "${product.name}"!`);
}

function renderProducts() {
  const container = document.getElementById('products-list-container');
  if (!container) return;

  // Filtragem
  let list = state.data.products;

  if (state.selectedProperty !== 'ALL') {
    list = list.filter(p => p.propertyId === state.selectedProperty);
  }

  if (state.selectedCategory !== 'all') {
    list = list.filter(p => p.category === state.selectedCategory);
  }

  if (state.selectedStatus && state.selectedStatus !== 'all') {
    list = list.filter(p => p.status === state.selectedStatus);
  }

  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase().trim();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.categoryLabel && p.categoryLabel.toLowerCase().includes(q))
    );
  }

  // Atualiza contador de itens no topo da aba Estoque
  const countBadge = document.getElementById('inventory-count-display');
  if (countBadge) {
    const totalCount = list.length;
    if (window.I18N) {
      countBadge.textContent = totalCount === 1
        ? window.I18N.t('inventory.countBadgeSingular')
        : window.I18N.t('inventory.countBadge', { count: totalCount });
    } else {
      countBadge.textContent = `${totalCount} ${totalCount === 1 ? 'producto' : 'productos'}`;
    }
  }

  // Atualiza botão/banner de produtos em falta no WhatsApp
  updateWhatsappShortageButton();

  if (list.length === 0) {
    const emptyTitle = window.I18N ? window.I18N.t('inventory.emptyTitle') : 'Ningún producto encontrado';
    const emptySub = window.I18N ? window.I18N.t('inventory.emptySub') : 'Prueba a cambiar los términos de búsqueda o selecciona otra categoría.';
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 16px; background: white; border-radius: var(--radius-lg); border: 1px dashed var(--border-light);">
        <h4 style="font-weight: 700; color: var(--text-main);">${emptyTitle}</h4>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
          ${emptySub}
        </p>
      </div>
    `;
    return;
  }

  const lblZoom = window.I18N ? window.I18N.t('inventory.zoom') : 'Zoom';
  const lblSuficiente = window.I18N ? window.I18N.t('inventory.statSuficiente') : 'Suficiente';
  const lblAtencao = window.I18N ? window.I18N.t('inventory.statAtencao') : 'Atención';
  const lblFalta = window.I18N ? window.I18N.t('inventory.statFalta') : 'Falta';
  const lblCardNote = window.I18N ? window.I18N.t('inventory.btnCardNote') : '+ Nota';
  const lblCardBuy = window.I18N ? window.I18N.t('inventory.btnCardBuy') : 'Registrar Compra';

  container.innerHTML = list.map(item => {
    const isGreen = item.status === 'suficiente';
    const isYellow = item.status === 'acabando';
    const isRed = item.status === 'falta';
    const hasNote = Boolean(item.note && String(item.note).trim() !== '');

    // Regras de quantidades configuradas para este produto
    const { faltaMax, atencaoMax, suficienteMin } = getProductThresholds(item);

    const propBadgeHtml = state.selectedProperty === 'ALL'
      ? `<span class="prop-badge-small prop-badge-${(item.propertyId || '').toLowerCase()}" data-prop="${item.propertyId}">${item.propertyId}</span>`
      : '';

    return `
      <div class="product-card" id="card-${item.id}">
        ${hasNote ? `
          <button type="button" class="product-corner-note-btn btn-trigger-note" data-id="${item.id}" title="Nota anexada (clique para ver ou editar)" aria-label="Ver anotação">
            <span class="orange-pulse-dot"></span>
          </button>
        ` : ''}

        <div class="product-top-row">
          <div class="product-img-wrapper" data-zoom-src="${item.photo}" data-zoom-title="${encodeURIComponent(item.name)}" data-zoom-desc="${encodeURIComponent(item.description || '')}">
            <img class="product-img" src="${item.photo}" alt="${item.name}" loading="lazy" onerror="this.src='https://placehold.co/160x160?text=Produto'">
            <span class="zoom-hint-badge">${lblZoom}</span>
          </div>

          <div class="product-details">
            <div class="product-tags">
              <span class="brand-badge">${item.brand || 'BOSQUE VERDE'}</span>
              ${propBadgeHtml}
            </div>
            <h3 class="product-name" title="${item.name}">${item.name}</h3>

            <div class="product-qty-row">
              <div class="qty-display">
                <span class="qty-number" id="qty-val-${item.id}">${item.quantity}</span>
                <span class="qty-unit">${item.unit || 'un'}</span>
              </div>

              <!-- Ajuste Rápido - e + -->
              <div class="qty-stepper">
                <button class="stepper-btn btn-step-minus" data-id="${item.id}" type="button" aria-label="Diminuir">-</button>
                <button class="stepper-btn btn-step-plus" data-id="${item.id}" type="button" aria-label="Aumentar">+</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Mostrador de Status (Suficiente | Atenção | Falta - Indicador Automático pela Quantidade) -->
        <div class="traffic-light-container status-display-only" aria-label="Status do Estoque">
          <div class="traffic-pill status-green-btn ${isGreen ? 'active' : ''}">
            <span class="indicator-dot"></span>
            <span>${lblSuficiente}</span>
          </div>

          <div class="traffic-pill status-yellow-btn ${isYellow ? 'active' : ''}">
            <span class="indicator-dot"></span>
            <span>${lblAtencao}</span>
          </div>

          <div class="traffic-pill status-red-btn ${isRed ? 'active' : ''}">
            <span class="indicator-dot"></span>
            <span>${lblFalta}</span>
          </div>
        </div>

        <!-- Rodapé do Card com Atalhos para Nota, Editar, Excluir e Compra -->
        <div class="product-card-footer">
          <div class="card-footer-left">
            ${!hasNote ? `
              <button type="button" class="btn-card-note btn-trigger-note" data-id="${item.id}" title="Adicionar nota a este produto" aria-label="Adicionar nota">
                <span class="btn-note-dot"></span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                </svg>
                <span>${lblCardNote}</span>
              </button>
            ` : ''}

            <button type="button" class="btn-card-edit btn-trigger-edit-product" data-id="${item.id}" data-catalog-id="${item.catalogId || ''}" title="Editar informações e regras de quantidade do produto" aria-label="Editar produto">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </button>

            <button type="button" class="btn-card-delete btn-trigger-delete" data-id="${item.id}" data-name="${encodeURIComponent(item.name)}" data-prop="${item.propertyId}" title="Apagar este produto do estoque" aria-label="Apagar produto">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </div>

          <button type="button" class="btn-card-buy" data-id="${item.id}" data-name="${encodeURIComponent(item.name)}" data-prop="${item.propertyId}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span>${lblCardBuy}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Adicionar listeners nos gatilhos de nota de produto
  container.querySelectorAll('.btn-trigger-note').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openProductNoteModal(btn.dataset.id);
    });
  });

  // Adicionar listeners no botão de editar produto diretamente pelo estoque
  container.querySelectorAll('.btn-trigger-edit-product').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditProductModal(btn.dataset.catalogId, btn.dataset.id);
    });
  });

  // Adicionar listeners nos botões de excluir produto
  container.querySelectorAll('.btn-trigger-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const name = decodeURIComponent(btn.dataset.name || 'Produto');
      const propId = btn.dataset.prop;
      deleteProduct(id, name, propId);
    });
  });

  // Stepper + e - com cálculo automático pelo semáforo customizado
  container.querySelectorAll('.btn-step-minus').forEach(btn => {
    btn.addEventListener('click', () => stepProductQuantity(btn.dataset.id, -1));
  });

  container.querySelectorAll('.btn-step-plus').forEach(btn => {
    btn.addEventListener('click', () => stepProductQuantity(btn.dataset.id, 1));
  });

  // Botão Comprar do Card
  container.querySelectorAll('.btn-card-buy').forEach(btn => {
    btn.addEventListener('click', () => {
      openPurchaseModalForProduct(btn.dataset.id, btn.dataset.prop);
    });
  });

  // Clique na foto para Zoom
  container.querySelectorAll('.product-img-wrapper').forEach(wrapper => {
    wrapper.addEventListener('click', () => {
      openZoomModal(
        wrapper.dataset.zoomSrc,
        decodeURIComponent(wrapper.dataset.zoomTitle),
        decodeURIComponent(wrapper.dataset.zoomDesc)
      );
    });
  });
}

function setProductStatus(productId, status) {
  const product = state.data.products.find(p => p.id === productId);
  if (!product) return;

  const { faltaMax, atencaoMax, suficienteMin } = getProductThresholds(product);

  product.status = status;
  product.updatedAt = new Date().toISOString();

  // Ajusta quantidade sugerida se a quantidade atual conflitar com o status escolhido
  if (status === 'falta' && Number(product.quantity) > faltaMax) {
    product.quantity = faltaMax;
  } else if (status === 'acabando') {
    if (Number(product.quantity) > atencaoMax || Number(product.quantity) <= faltaMax) {
      product.quantity = atencaoMax;
    }
  } else if (status === 'suficiente' && Number(product.quantity) < suficienteMin) {
    product.quantity = suficienteMin;
  }

  saveData();
  renderProducts();
  renderUrgentItems();

  const labels = { suficiente: 'Suficiente', acabando: 'Atenção', falta: 'Falta' };
  showToast(`${product.name}: ${labels[status]}`);
}

function stepProductQuantity(productId, delta) {
  const product = state.data.products.find(p => p.id === productId);
  if (!product) return;

  const newQty = Math.max(0, Number(product.quantity) + delta);
  product.quantity = newQty;
  // Recalcula automaticamente o status baseado nas regras customizadas do produto
  product.status = calculateProductStatus(product, newQty);
  product.updatedAt = new Date().toISOString();

  saveData();
  renderProducts();
  renderUrgentItems();
}

// ==========================================================================
// 2. Aba Produtos: Catálogo Mestre, Edição, Exclusão e Lixeira (30 dias)
// ==========================================================================
function renderProductsTab() {
  const activeContainer = document.getElementById('catalog-products-container');
  const trashContainer = document.getElementById('trash-products-container');
  const countActiveEl = document.getElementById('count-products-active');
  const countTrashEl = document.getElementById('count-products-trash');
  const subtabActive = document.getElementById('subtab-view-active');
  const subtabTrash = document.getElementById('subtab-view-trash');

  if (!activeContainer && !trashContainer) return;

  const activeSubTab = state.catalogActiveSubTab || 'active';

  // Alterna visibilidade das sub-abas
  if (subtabActive) subtabActive.style.display = activeSubTab === 'active' ? 'block' : 'none';
  if (subtabTrash) subtabTrash.style.display = activeSubTab === 'trash' ? 'block' : 'none';

  // Atualiza botões de sub-aba
  document.querySelectorAll('.products-subtab-btn').forEach(btn => {
    if (btn.dataset.subtab === activeSubTab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Garante sincronia do PRODUCT_CATALOG com produtos do estoque
  state.data.products.forEach(p => {
    if (p.catalogId && !PRODUCT_CATALOG.some(c => c.id === p.catalogId)) {
      PRODUCT_CATALOG.push({
        id: p.catalogId,
        name: p.name,
        brand: p.brand || 'BOSQUE VERDE',
        category: p.category || 'limpeza',
        categoryLabel: p.categoryLabel || 'Diversos',
        unit: p.unit || 'un',
        photo: p.photo,
        estimatedPrice: p.estimatedPrice || 0,
        description: p.description || p.name
      });
    }
  });

  // Atualiza contadores
  const activeList = PRODUCT_CATALOG;
  const trashList = state.data.trashProducts || [];

  if (countActiveEl) countActiveEl.textContent = activeList.length;
  if (countTrashEl) countTrashEl.textContent = trashList.length;

  // Renderiza sub-aba de Produtos Ativos
  if (activeContainer) {
    let filtered = [...activeList];
    if (state.catalogSearchQuery && state.catalogSearchQuery.trim() !== '') {
      const q = state.catalogSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(q) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.categoryLabel && item.categoryLabel.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      const emptyTitle = window.I18N ? window.I18N.t('products.emptyTitle') : 'Nenhum produto encontrado';
      const emptySub = state.catalogSearchQuery
        ? (window.I18N ? window.I18N.t('products.emptySubSearch') : 'Tente buscar com outros termos.')
        : (window.I18N ? window.I18N.t('products.emptySubNew') : 'Toque em "+ Novo Produto" para cadastrar.');
      activeContainer.innerHTML = `
        <div style="text-align: center; padding: 36px 16px; background: white; border-radius: var(--radius-lg); border: 1px dashed var(--border-light);">
          <h4 style="font-weight: 700; color: var(--text-main);">${emptyTitle}</h4>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">${emptySub}</p>
        </div>
      `;
    } else {
      const btnEditTxt = window.I18N ? window.I18N.t('products.btnEdit') : 'Editar';
      const btnDeleteTxt = window.I18N ? window.I18N.t('products.btnDelete') : 'Excluir';
      activeContainer.innerHTML = filtered.map(item => `
        <div class="catalog-item-card" data-catalog-id="${item.id}">
          <img class="catalog-item-thumb" src="${item.photo}" alt="${item.name}" loading="lazy" onerror="this.src='https://placehold.co/100x100?text=Produto'">
          <div class="catalog-item-info">
            <h4 class="catalog-item-name" title="${item.name}">${item.name}</h4>
            <div class="catalog-item-meta">
              <span class="brand-badge">${item.brand || 'BOSQUE VERDE'}</span>
              <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">• ${item.unit || 'un'}</span>
            </div>
          </div>
          <div class="catalog-actions-group">
            <button type="button" class="btn-catalog-action btn-catalog-edit" data-id="${item.id}" title="${btnEditTxt}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              <span>${btnEditTxt}</span>
            </button>
            <button type="button" class="btn-catalog-action btn-catalog-delete" data-id="${item.id}" data-name="${encodeURIComponent(item.name)}" title="${btnDeleteTxt}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
              <span>${btnDeleteTxt}</span>
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  // Renderiza sub-aba de Lixeira (30 dias)
  if (trashContainer) {
    if (trashList.length === 0) {
      const trashEmptyTitle = window.I18N ? window.I18N.t('products.trashEmptyTitle') : 'Lixeira vazia';
      const trashEmptyDesc = window.I18N ? window.I18N.t('products.trashEmptyDesc') : 'Quando você excluir produtos do catálogo, eles ficarão guardados aqui por 30 dias para você restaurar quando quiser.';
      trashContainer.innerHTML = `
        <div style="text-align: center; padding: 36px 16px; background: white; border-radius: var(--radius-lg); border: 1px dashed var(--border-light);">
          <h4 style="font-weight: 700; color: var(--text-main);">${trashEmptyTitle}</h4>
          <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">${trashEmptyDesc}</p>
        </div>
      `;
    } else {
      const nowMs = Date.now();
      const btnRestoreTxt = window.I18N ? window.I18N.t('products.btnRestore') : 'Restaurar';
      trashContainer.innerHTML = trashList.map(item => {
        const deletedTime = item.deletedAt ? new Date(item.deletedAt).getTime() : nowMs;
        const diffDays = Math.floor((nowMs - deletedTime) / (24 * 60 * 60 * 1000));
        const daysLeft = Math.max(1, 30 - diffDays);
        const trashDaysTxt = window.I18N ? window.I18N.t('products.badgeTrashRemaining', { days: daysLeft }) : `Restam ${daysLeft} dias`;

        return `
          <div class="trash-item-card" data-trash-id="${item.id}">
            <img class="trash-item-thumb" src="${item.photo}" alt="${item.name}" loading="lazy" onerror="this.src='https://placehold.co/100x100?text=Produto'">
            <div class="trash-item-info">
              <h4 class="trash-item-name" title="${item.name}">${item.name}</h4>
              <div class="trash-item-meta">
                <span class="brand-badge">${item.brand || 'BOSQUE VERDE'}</span>
                <span class="trash-days-left">${trashDaysTxt}</span>
              </div>
            </div>
            <div class="trash-actions-group">
              <button type="button" class="btn-catalog-action btn-trash-restore" data-id="${item.id}" title="${btnRestoreTxt}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                </svg>
                <span>${btnRestoreTxt}</span>
              </button>
              <button type="button" class="btn-catalog-action btn-trash-purge" data-id="${item.id}" title="✕">
                ✕
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Event Listeners nos botões renderizados
  activeContainer?.querySelectorAll('.btn-catalog-edit').forEach(btn => {
    btn.onclick = () => openEditProductModal(btn.dataset.id);
  });

  activeContainer?.querySelectorAll('.btn-catalog-delete').forEach(btn => {
    btn.onclick = async () => {
      const name = decodeURIComponent(btn.dataset.name || 'Produto');
      const confirmed = await showConfirmDialog({
        title: 'Mover para a Lixeira',
        message: `Deseja mover "${name}" para a lixeira?\n\nEle será retirado dos estoques, mas ficará guardado por 30 dias na aba Lixeira caso queira restaurá-lo com 1 clique.`,
        confirmText: 'Mover para Lixeira',
        cancelText: 'Cancelar',
        confirmDanger: true,
        icon: 'trash'
      });
      if (confirmed) {
        moveProductToTrash(btn.dataset.id);
      }
    };
  });

  trashContainer?.querySelectorAll('.btn-trash-restore').forEach(btn => {
    btn.onclick = () => restoreTrashProduct(btn.dataset.id);
  });

  trashContainer?.querySelectorAll('.btn-trash-purge').forEach(btn => {
    btn.onclick = async () => {
      const confirmed = await showConfirmDialog({
        title: 'Excluir Definitivamente',
        message: 'Deseja excluir este produto definitivamente da lixeira? Esta ação não pode ser desfeita.',
        confirmText: 'Excluir Definitivamente',
        cancelText: 'Cancelar',
        confirmDanger: true,
        icon: 'trash'
      });
      if (confirmed) {
        purgeTrashProduct(btn.dataset.id);
      }
    };
  });
}

function moveProductToTrash(catalogId) {
  const catItem = PRODUCT_CATALOG.find(c => c.id === catalogId);
  if (!catItem) return;

  const snapshots = state.data.products
    .filter(p => p.catalogId === catalogId)
    .map(p => ({
      propertyId: p.propertyId,
      quantity: p.quantity,
      status: p.status,
      note: p.note,
      noteAuthor: p.noteAuthor,
      noteUpdatedAt: p.noteUpdatedAt
    }));

  const trashItem = {
    ...catItem,
    deletedAt: new Date().toISOString(),
    stockSnapshots: snapshots
  };

  if (!state.data.trashProducts) state.data.trashProducts = [];
  state.data.trashProducts.unshift(trashItem);

  const catIdx = PRODUCT_CATALOG.findIndex(c => c.id === catalogId);
  if (catIdx !== -1) PRODUCT_CATALOG.splice(catIdx, 1);
  state.data.products = state.data.products.filter(p => p.catalogId !== catalogId);

  saveData();
  renderAll();
  showToast(`"${catItem.name}" movido para a lixeira (guardado por 30 dias).`);
}

function restoreTrashProduct(trashId) {
  if (!state.data.trashProducts) return;
  const trashIdx = state.data.trashProducts.findIndex(t => t.id === trashId);
  if (trashIdx === -1) return;

  const item = state.data.trashProducts[trashIdx];
  state.data.trashProducts.splice(trashIdx, 1);

  const catalogItem = {
    id: item.catalogId || item.id,
    name: item.name,
    brand: item.brand,
    category: item.category,
    categoryLabel: item.categoryLabel,
    unit: item.unit,
    photo: item.photo,
    estimatedPrice: item.estimatedPrice || 0,
    description: item.description || item.name
  };
  PRODUCT_CATALOG.unshift(catalogItem);

  const props = ['JB', 'VN', 'HN'];
  props.forEach(propId => {
    const snap = (item.stockSnapshots || []).find(s => s.propertyId === propId);
    state.data.products.push({
      id: `${propId}_${catalogItem.id}`,
      propertyId: propId,
      catalogId: catalogItem.id,
      name: catalogItem.name,
      brand: catalogItem.brand,
      category: catalogItem.category,
      categoryLabel: catalogItem.categoryLabel,
      unit: catalogItem.unit,
      photo: catalogItem.photo,
      estimatedPrice: catalogItem.estimatedPrice,
      description: catalogItem.description,
      quantity: snap ? snap.quantity : 2,
      status: snap ? snap.status : 'suficiente',
      note: snap ? snap.note : null,
      noteAuthor: snap ? snap.noteAuthor : null,
      noteUpdatedAt: snap ? snap.noteUpdatedAt : null,
      updatedAt: new Date().toISOString()
    });
  });

  saveData();
  renderAll();
  showToast(`"${item.name}" restaurado com sucesso para o estoque!`);
}

function purgeTrashProduct(trashId) {
  if (!state.data.trashProducts) return;
  const item = state.data.trashProducts.find(t => t.id === trashId);
  state.data.trashProducts = state.data.trashProducts.filter(t => t.id !== trashId);
  saveData();
  renderAll();
  showToast(`Produto "${item ? item.name : ''}" excluído definitivamente.`);
}

function openEditProductModal(catalogId, productId) {
  let exemplar = null;
  if (productId) {
    exemplar = state.data.products.find(p => p.id === productId);
  }
  if (!exemplar && catalogId) {
    exemplar = state.data.products.find(p => p.catalogId === catalogId);
  }

  let item = null;
  if (catalogId) {
    item = PRODUCT_CATALOG.find(c => c.id === catalogId);
  }
  if (!item && exemplar) {
    item = PRODUCT_CATALOG.find(c => (exemplar.catalogId && c.id === exemplar.catalogId) || c.name.toLowerCase() === exemplar.name.toLowerCase()) || exemplar;
  }
  if (!item) return;

  const modal = document.getElementById('modal-edit-product');
  const idInput = document.getElementById('edit-product-catalog-id');
  const nameInput = document.getElementById('edit-product-name');
  const brandInput = document.getElementById('edit-product-brand');
  const catInput = document.getElementById('edit-product-category');
  const unitInput = document.getElementById('edit-product-unit');
  const previewImg = document.getElementById('edit-product-photo-preview');
  const faltaInput = document.getElementById('edit-product-falta');
  const atencaoInput = document.getElementById('edit-product-atencao');
  const suficienteInput = document.getElementById('edit-product-suficiente');

  if (idInput) idInput.value = item.id || catalogId || (exemplar ? exemplar.catalogId : '');
  if (nameInput) nameInput.value = item.name || '';
  if (brandInput) brandInput.value = item.brand || 'BOSQUE VERDE';
  if (catInput) catInput.value = item.category || 'limpeza';
  if (unitInput) unitInput.value = item.unit || 'un';

  // Obter limites configurados
  const { faltaMax, atencaoMax, suficienteMin } = getProductThresholds(exemplar || item);
  if (faltaInput) faltaInput.value = faltaMax;
  if (atencaoInput) atencaoInput.value = atencaoMax;
  if (suficienteInput) suficienteInput.value = suficienteMin;

  state.tempEditProductPhotoBase64 = null;
  if (previewImg) {
    if (item.photo) {
      previewImg.src = item.photo;
      previewImg.style.display = 'block';
    } else {
      previewImg.style.display = 'none';
    }
  }

  syncAllCustomControls();
  modal?.classList.add('active');
}

function closeEditProductModal() {
  closeAllCustomControls();
  const modal = document.getElementById('modal-edit-product');
  modal?.classList.remove('active');
  state.tempEditProductPhotoBase64 = null;
}

function handleEditProductSubmit(e) {
  e.preventDefault();
  const catalogId = document.getElementById('edit-product-catalog-id')?.value;
  let item = PRODUCT_CATALOG.find(c => c.id === catalogId);

  const name = document.getElementById('edit-product-name')?.value.trim() || (item ? item.name : 'Produto');
  const brand = document.getElementById('edit-product-brand')?.value.trim() || (item ? item.brand : 'BOSQUE VERDE');
  const category = document.getElementById('edit-product-category')?.value || (item ? item.category : 'limpeza');
  const unit = document.getElementById('edit-product-unit')?.value.trim() || (item ? item.unit : 'un');
  const photo = state.tempEditProductPhotoBase64 || (item ? item.photo : null);

  // Limites do semáforo
  const faltaVal = parseInt(document.getElementById('edit-product-falta')?.value, 10);
  const atencaoVal = parseInt(document.getElementById('edit-product-atencao')?.value, 10);
  const suficienteVal = parseInt(document.getElementById('edit-product-suficiente')?.value, 10);

  const faltaMax = isNaN(faltaVal) || faltaVal < 0 ? 0 : faltaVal;
  const atencaoMax = isNaN(atencaoVal) || atencaoVal <= faltaMax ? faltaMax + 1 : atencaoVal;
  const suficienteMin = isNaN(suficienteVal) || suficienteVal <= atencaoMax ? atencaoMax + 1 : suficienteVal;

  const catLabels = {
    limpeza: 'Limpeza & Rouparia',
    amenities: 'Amenities & Higiene',
    comida: 'Alimentos & Bebidas'
  };
  const categoryLabel = catLabels[category] || 'Diversos';

  if (item) {
    item.name = name;
    item.brand = brand;
    item.category = category;
    item.categoryLabel = categoryLabel;
    item.unit = unit;
    if (photo) item.photo = photo;
    item.faltaThreshold = faltaMax;
    item.atencaoThreshold = atencaoMax;
    item.suficienteThreshold = suficienteMin;
  }

  state.data.products.forEach(p => {
    const match = (catalogId && p.catalogId === catalogId) ||
                  (item && p.catalogId === item.id) ||
                  (p.name && item && p.name.toLowerCase() === item.name.toLowerCase()) ||
                  (p.name && p.name.toLowerCase() === name.toLowerCase());
    if (match) {
      p.name = name;
      p.brand = brand;
      p.category = category;
      p.categoryLabel = categoryLabel;
      p.unit = unit;
      if (photo) p.photo = photo;
      p.faltaThreshold = faltaMax;
      p.atencaoThreshold = atencaoMax;
      p.suficienteThreshold = suficienteMin;
      p.status = calculateProductStatus(p, p.quantity);
      p.updatedAt = new Date().toISOString();
    }
  });

  saveData();
  closeEditProductModal();
  renderAll();
  showToast(`Produto "${name}" atualizado com sucesso!`);
}

function renderUrgentItems() {
  const container = document.getElementById('urgent-items-container');
  if (!container) return;

  let list = state.data.products.filter(p => p.status === 'falta' || p.status === 'acabando');

  if (state.selectedProperty !== 'ALL') {
    list = list.filter(p => p.propertyId === state.selectedProperty);
  }

  list.sort((a, b) => (a.status === 'falta' ? -1 : 1));

  if (list.length === 0) {
    const stockedTitle = window.I18N ? window.I18N.t('inventory.stockedTitle') : 'Estoque Abastecido';
    const stockedDesc = window.I18N ? window.I18N.t('inventory.stockedDesc') : 'Nenhum produto está em falta ou acabando neste momento.';
    container.innerHTML = `
      <div style="text-align: center; padding: 36px 16px; background: white; border-radius: var(--radius-lg); border: 1px dashed var(--border-light);">
        <h4 style="font-weight: 800; color: var(--text-main);">${stockedTitle}</h4>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
          ${stockedDesc}
        </p>
      </div>
    `;
    return;
  }

  const stockLabel = window.I18N ? window.I18N.t('inventory.stockQty') : 'Estoque';
  const buyBtnLabel = window.I18N ? window.I18N.t('inventory.btnBuy') : 'Comprar';
  const faltaLabel = window.I18N ? window.I18N.t('inventory.statFalta') : 'Falta';
  const atencaoLabel = window.I18N ? window.I18N.t('inventory.statAtencao') : 'Atenção';

  container.innerHTML = list.map(item => {
    const isFalta = item.status === 'falta';
    return `
      <div class="urgent-item-card ${isFalta ? 'is-falta' : 'is-acabando'}">
        <img class="urgent-item-img" src="${item.photo}" alt="${item.name}" loading="lazy">
        <div class="urgent-item-info">
          <h4 class="urgent-item-title">${item.name}</h4>
          <div class="urgent-item-meta">
            <span class="status-badge-inline ${isFalta ? 'falta' : 'acabando'}">
              ${isFalta ? faltaLabel : atencaoLabel}
            </span>
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-main);">
              ${stockLabel}: ${item.quantity} ${item.unit}
            </span>
            <span class="prop-badge-small prop-badge-${(item.propertyId || '').toLowerCase()}" data-prop="${item.propertyId}">${item.propertyId}</span>
          </div>
        </div>
        <button type="button" class="urgent-buy-btn" data-id="${item.id}" data-prop="${item.propertyId}">
          ${buyBtnLabel}
        </button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.urgent-buy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openPurchaseModalForProduct(btn.dataset.id, btn.dataset.prop);
    });
  });
}

// ==========================================================================
// 3. Bloco de Notas Dinâmico
// ==========================================================================
function renderNotes() {
  const container = document.getElementById('notes-list-container');
  if (!container) return;

  let list = state.data.notes;
  if (state.selectedProperty !== 'ALL') {
    list = list.filter(n => n.propertyId === state.selectedProperty);
  }

  // Ordena por data decrescente
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (list.length === 0) {
    const emptyNotesMsg = window.I18N ? window.I18N.t('notes.empty') : 'Nenhum recado cadastrado para este imóvel. Deixe uma mensagem acima!';
    container.innerHTML = `
      <div style="text-align: center; padding: 30px; background: white; border-radius: var(--radius-md); border: 1px dashed var(--border-light); color: var(--text-muted); font-size: 0.85rem;">
        ${emptyNotesMsg}
      </div>
    `;
    return;
  }

  const reopenTxt = window.I18N ? window.I18N.t('notes.reopen') : 'Reabrir';
  const doneTxt = window.I18N ? window.I18N.t('notes.markDone') : 'Marcar Resolvido';
  const deleteTxt = window.I18N ? window.I18N.t('notes.delete') : 'Excluir';
  const defaultOwnerAuthor = window.I18N ? window.I18N.t('notes.authorOwner') : 'Gestor';
  const defaultStaffAuthor = window.I18N ? window.I18N.t('notes.authorStaff') : 'Equipe';

  container.innerHTML = list.map(note => {
    const isOwner = note.authorType === 'owner';
    let authorPhoto = note.authorPhoto || null;
    if (note.authorType === 'owner') {
      const owner = state.data.ownerProfile || OWNER_PROFILE;
      if (owner && owner.photo) authorPhoto = owner.photo;
    } else if (note.authorId) {
      const staff = (state.data.staff || []).find(s => s.id === note.authorId);
      if (staff && staff.photo) authorPhoto = staff.photo;
    } else if (state.currentUser && (note.authorName === state.currentUser.name) && state.currentUser.photo) {
      authorPhoto = state.currentUser.photo;
    }

    return `
      <div class="note-card ${note.isDone ? 'is-done' : ''}" id="note-${note.id}">
        <div class="note-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${authorPhoto
              ? `<img src="${authorPhoto}" class="note-author-avatar-img" alt="${escapeHtml(note.authorName || '')}">`
              : `<span class="note-author-avatar-img" style="background: ${isOwner ? '#D97706' : '#059669'}; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">${getInitials(note.authorName, isOwner ? 'AD' : 'EQ')}</span>`
            }
            <span class="note-author-tag ${isOwner ? 'is-owner' : 'is-staff'}">
              <span>${escapeHtml(note.authorName || (isOwner ? defaultOwnerAuthor : defaultStaffAuthor))}</span>
              <span class="prop-badge-small prop-badge-${(note.propertyId || '').toLowerCase()}" data-prop="${note.propertyId}">${note.propertyId}</span>
            </span>
          </div>
          <span class="note-time">${formatDateTime(note.createdAt)}</span>
        </div>
        <p class="note-body">${note.content}</p>
        <div class="note-footer">
          <button type="button" class="note-action-btn btn-toggle-note-done" data-id="${note.id}">
            ${note.isDone ? reopenTxt : doneTxt}
          </button>
          <button type="button" class="note-action-btn btn-delete-note" data-id="${note.id}" style="color: var(--text-muted);">
            ${deleteTxt}
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-toggle-note-done').forEach(btn => {
    btn.addEventListener('click', () => toggleNoteDone(btn.dataset.id));
  });

  container.querySelectorAll('.btn-delete-note').forEach(btn => {
    btn.addEventListener('click', () => deleteNote(btn.dataset.id));
  });
}

function addNote() {
  const textarea = document.getElementById('new-note-textarea');
  const text = textarea.value.trim();
  if (!text) {
    showToast('Digite uma mensagem antes de publicar.');
    return;
  }

  const propId = state.selectedProperty === 'ALL' ? 'JB' : state.selectedProperty;
  const newNote = {
    id: `note_${Date.now()}`,
    propertyId: propId,
    authorType: state.currentUser ? state.currentUser.type : 'staff',
    authorId: state.currentUser ? state.currentUser.id : null,
    authorName: state.currentUser ? state.currentUser.name : 'Equipe',
    authorPhoto: state.currentUser ? (state.currentUser.photo || null) : null,
    content: text,
    createdAt: new Date().toISOString(),
    isDone: false
  };

  state.data.notes.unshift(newNote);
  saveData();

  // Salva imediatamente no Firestore para sincronização instantânea com o gestor
  if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
    AirbnbCloudSync.saveDocument('notes', newNote.id, newNote).catch(err => {
      console.warn('[CloudSync] Falha no salvamento imediato do recado no Firestore:', err);
    });
  }

  textarea.value = '';
  renderNotes();
  showToast('Recado publicado com sucesso.');
}

function toggleNoteDone(noteId) {
  const note = state.data.notes.find(n => n.id === noteId);
  if (!note) return;
  note.isDone = !note.isDone;
  saveData();

  // Atualiza imediatamente o status resolvido/aberto no Firestore
  if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
    AirbnbCloudSync.saveDocument('notes', note.id, note).catch(err => {
      console.warn('[CloudSync] Falha ao atualizar status do recado no Firestore:', err);
    });
  }

  renderNotes();
}

function deleteNote(noteId) {
  state.data.notes = state.data.notes.filter(n => n.id !== noteId);
  saveData();

  // Exclui imediatamente do Firestore para não retornar no snapshot
  if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
    AirbnbCloudSync.deleteDocument('notes', noteId).catch(err => {
      console.warn('[CloudSync] Falha ao excluir recado no Firestore:', err);
    });
  }

  renderNotes();
  showToast('Recado excluído.');
}

// ==========================================================================
// 4. Calendário Operacional Visual & Interativo (Aba Escalas)
// ==========================================================================
function getI18nMonths() {
  if (window.I18N && Array.isArray(window.I18N.t('months'))) {
    return window.I18N.t('months');
  }
  return [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
}

const CAL_MONTH_NAMES = new Proxy([], {
  get(target, prop) {
    const list = getI18nMonths();
    if (prop === 'length') return list.length;
    if (typeof prop === 'string' && !isNaN(Number(prop))) {
      return list[Number(prop)];
    }
    if (typeof list[prop] === 'function') {
      return list[prop].bind(list);
    }
    return list[prop];
  }
});

function getEventColor(type) {
  switch (type) {
    case 'checking': return '#0C66E4';
    case 'checkout': return '#D97008';
    case 'limpeza': return '#10B981';
    case 'manutencao': return '#EF4444';
    case 'compras': return '#8B5CF6';
    default: return '#0F2744';
  }
}

function getEventBorderColor(type, isDone) {
  if (isDone) return '#94A3B8';
  return getEventColor(type);
}

function getEventTypeName(type) {
  const currentLang = window.I18N ? window.I18N.getLanguage() : 'es';
  switch (type) {
    case 'limpeza': return window.I18N ? window.I18N.t('calendar.typeLimpeza') : (currentLang === 'es' ? 'Limpieza' : 'Limpeza');
    case 'checking': return window.I18N ? window.I18N.t('calendar.typeChecking') : 'Checking';
    case 'checkout': return window.I18N ? window.I18N.t('calendar.typeCheckout') : 'Checkout';
    case 'manutencao': return window.I18N ? window.I18N.t('calendar.typeManutencao') : (currentLang === 'es' ? 'Mantenimiento' : 'Manutenção');
    case 'compras': return window.I18N ? window.I18N.t('calendar.typeCompras') : 'Compras';
    default: return type || 'Checking';
  }
}

function renderCalendarWidget() {
  const container = document.getElementById('calendar-widget-container');
  if (!container) return;

  if (!state.calendarView) {
    const now = new Date();
    state.calendarView = {
      year: now.getFullYear(),
      month: now.getMonth(),
      selectedDate: null
    };
  }

  const { year, month, selectedDate } = state.calendarView;
  const monthName = CAL_MONTH_NAMES[month];

  // Filtra todos os eventos relevantes para o imóvel selecionado
  let allEvents = state.data.calendar || [];
  if (state.selectedProperty !== 'ALL') {
    allEvents = allEvents.filter(e => e.propertyId === state.selectedProperty);
  }

  const monthPad = String(month + 1).padStart(2, '0');
  const monthPrefix = `${year}-${monthPad}`;
  const monthEvents = allEvents.filter(e => e.eventDate && e.eventDate.startsWith(monthPrefix));

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let daysHtml = '';

  // Dias do mês anterior
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevIso = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysHtml += `
      <div class="cal-day-cell other-month" data-nav-date="${prevIso}" title="Ir para ${d} de ${CAL_MONTH_NAMES[prevMonth]}">
        <span class="cal-day-num">${d}</span>
      </div>
    `;
  }

  // Dias do mês atual
  for (let d = 1; d <= daysInMonth; d++) {
    const dPad = String(d).padStart(2, '0');
    const isoDate = `${year}-${monthPad}-${dPad}`;
    const isToday = isoDate === todayIso;
    const isSelected = isoDate === selectedDate;

    // Eventos deste dia
    const dayEvents = monthEvents.filter(e => e.eventDate === isoDate);
    const hasEvents = dayEvents.length > 0;

    let dotsHtml = '';
    if (hasEvents) {
      dotsHtml = `
        <div class="cal-day-dots">
          ${dayEvents.slice(0, 3).map(ev => `<span class="cal-dot ${ev.eventType || 'checking'}" title="${escapeHtml(ev.title)}"></span>`).join('')}
          ${dayEvents.length > 3 ? `<span class="cal-day-count-badge">+${dayEvents.length - 3}</span>` : ''}
        </div>
      `;
    } else {
      dotsHtml = `<div class="cal-day-dots"></div>`;
    }

    daysHtml += `
      <div class="cal-day-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${hasEvents ? 'has-events' : ''}" 
           data-date="${isoDate}">
        <span class="cal-day-num">${d}</span>
        ${dotsHtml}
      </div>
    `;
  }

  // Dias do próximo mês para completar grade (35 ou 42 slots)
  const totalSlots = firstDayIndex + daysInMonth;
  const remaining = totalSlots <= 35 ? 35 - totalSlots : (totalSlots <= 42 ? 42 - totalSlots : 0);
  for (let n = 1; n <= remaining; n++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const nextIso = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
    daysHtml += `
      <div class="cal-day-cell other-month" data-nav-date="${nextIso}" title="Ir para ${n} de ${CAL_MONTH_NAMES[nextMonth]}">
        <span class="cal-day-num">${n}</span>
      </div>
    `;
  }

  const currentLang = window.I18N ? window.I18N.getLanguage() : 'es';
  const shiftSingle = window.I18N ? window.I18N.t('calendar.shiftSingle') : (currentLang === 'es' ? 'turno' : 'escala');
  const shiftPlural = window.I18N ? window.I18N.t('calendar.shiftPlural') : (currentLang === 'es' ? 'turnos' : 'escalas');
  const todayBtnTxt = window.I18N ? window.I18N.t('calendar.todayBtn') : (currentLang === 'es' ? 'Hoy' : 'Hoje');
  const weekdays = (window.I18N && Array.isArray(window.I18N.t('calendar.weekdaysShort')))
    ? window.I18N.t('calendar.weekdaysShort')
    : (currentLang === 'es' ? ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] : ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']);

  const legChecking = window.I18N ? window.I18N.t('calendar.legendChecking') : 'Checking';
  const legCheckout = window.I18N ? window.I18N.t('calendar.legendCheckout') : 'Checkout';
  const legLimpeza = window.I18N ? window.I18N.t('calendar.legendLimpeza') : (currentLang === 'es' ? 'Limpieza' : 'Limpeza');
  const legManutencao = window.I18N ? window.I18N.t('calendar.legendManutencao') : (currentLang === 'es' ? 'Mantenimiento' : 'Manutenção');
  const legCompras = window.I18N ? window.I18N.t('calendar.legendCompras') : 'Compras';

  container.innerHTML = `
    <div class="cal-board-header">
      <div class="cal-board-title-wrap">
        <h3 class="cal-board-title">${monthName} ${year}</h3>
        <span class="cal-board-badge">${monthEvents.length} ${monthEvents.length === 1 ? shiftSingle : shiftPlural}</span>
      </div>
      <div class="cal-board-nav-actions">
        <button type="button" class="cal-board-today-btn" id="cal-board-btn-today" title="${todayBtnTxt}">${todayBtnTxt}</button>
        <button type="button" class="cal-board-nav-btn" id="cal-board-btn-prev">${chevronLeftSvgIcon}</button>
        <button type="button" class="cal-board-nav-btn" id="cal-board-btn-next">${chevronRightSvgIcon}</button>
      </div>
    </div>

    <div class="cal-board-weekdays">
      ${weekdays.map(w => `<span>${w}</span>`).join('')}
    </div>

    <div class="cal-board-grid">
      ${daysHtml}
    </div>

    <div class="cal-mini-legend">
      <span class="cal-legend-item"><span class="cal-legend-dot checking"></span>${legChecking}</span>
      <span class="cal-legend-item"><span class="cal-legend-dot checkout"></span>${legCheckout}</span>
      <span class="cal-legend-item"><span class="cal-legend-dot limpeza"></span>${legLimpeza}</span>
      <span class="cal-legend-item"><span class="cal-legend-dot manutencao"></span>${legManutencao}</span>
      <span class="cal-legend-item"><span class="cal-legend-dot compras"></span>${legCompras}</span>
    </div>
  `;

  // Listeners de navegação do calendário
  container.querySelector('#cal-board-btn-prev')?.addEventListener('click', () => {
    if (state.calendarView.month === 0) {
      state.calendarView.month = 11;
      state.calendarView.year--;
    } else {
      state.calendarView.month--;
    }
    renderCalendar();
  });

  container.querySelector('#cal-board-btn-next')?.addEventListener('click', () => {
    if (state.calendarView.month === 11) {
      state.calendarView.month = 0;
      state.calendarView.year++;
    } else {
      state.calendarView.month++;
    }
    renderCalendar();
  });

  container.querySelector('#cal-board-btn-today')?.addEventListener('click', () => {
    const t = new Date();
    state.calendarView.year = t.getFullYear();
    state.calendarView.month = t.getMonth();
    state.calendarView.selectedDate = todayIso;
    renderCalendar();
  });

  // Clique em dias do mês atual: alterna seleção do dia
  container.querySelectorAll('.cal-day-cell[data-date]').forEach(cell => {
    cell.addEventListener('click', () => {
      const date = cell.dataset.date;
      if (state.calendarView.selectedDate === date) {
        state.calendarView.selectedDate = null; // desmarca e mostra todo o mês
      } else {
        state.calendarView.selectedDate = date; // filtra o dia específico
      }
      renderCalendar();
    });
  });

  // Clique em dias de outro mês: navega e seleciona
  container.querySelectorAll('.cal-day-cell[data-nav-date]').forEach(cell => {
    cell.addEventListener('click', () => {
      const navDate = cell.dataset.navDate;
      const parts = navDate.split('-');
      state.calendarView.year = parseInt(parts[0], 10);
      state.calendarView.month = parseInt(parts[1], 10) - 1;
      state.calendarView.selectedDate = navDate;
      renderCalendar();
    });
  });
}

function renderCalendarFilterBar() {
  const container = document.getElementById('calendar-filter-bar');
  if (!container) return;

  const { year, month, selectedDate } = state.calendarView || {};
  let allEvents = state.data.calendar || [];
  if (state.selectedProperty !== 'ALL') {
    allEvents = allEvents.filter(e => e.propertyId === state.selectedProperty);
  }

  const currentLang = window.I18N ? window.I18N.getLanguage() : 'es';
  const shiftSingle = window.I18N ? window.I18N.t('calendar.shiftSingle') : (currentLang === 'es' ? 'turno' : 'escala');
  const shiftPlural = window.I18N ? window.I18N.t('calendar.shiftPlural') : (currentLang === 'es' ? 'turnos' : 'escalas');
  const upcomingSingle = window.I18N ? window.I18N.t('calendar.upcomingShiftSingle') : (currentLang === 'es' ? 'próximo turno' : 'próxima escala');
  const upcomingPlural = window.I18N ? window.I18N.t('calendar.upcomingShiftPlural') : (currentLang === 'es' ? 'próximos turnos' : 'próximas escalas');
  const viewMonthFullTxt = window.I18N ? window.I18N.t('calendar.viewMonthFull') : (currentLang === 'es' ? 'Visualizando Mes Completo' : 'Visualizando Mês Completo');
  const btnScheduleTxt = window.I18N ? window.I18N.t('calendar.btnNew') : (currentLang === 'es' ? '+ Programar' : '+ Agendar');
  const btnClearFilterTxt = window.I18N ? window.I18N.t('calendar.seeMonth') : (currentLang === 'es' ? 'Ver Mes ✕' : 'Ver Mês ✕');

  if (selectedDate) {
    const parts = selectedDate.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m, d);
    const locale = currentLang === 'es' ? 'es-ES' : 'pt-BR';
    const weekdayName = dateObj.toLocaleDateString(locale, { weekday: 'long' });
    const capitalizedWeekday = weekdayName.charAt(0).toUpperCase() + weekdayName.slice(1);
    const formattedDate = `${d} de ${CAL_MONTH_NAMES[m]}`;

    const dayEvents = allEvents.filter(e => e.eventDate === selectedDate);
    const countStr = `${dayEvents.length} ${dayEvents.length === 1 ? shiftSingle : shiftPlural}`;
    const daySelectedLabel = window.I18N
      ? window.I18N.t('calendar.viewDaySelected', { weekday: capitalizedWeekday })
      : (currentLang === 'es' ? `Día Seleccionado (${capitalizedWeekday})` : `Dia Selecionado (${capitalizedWeekday})`);

    container.innerHTML = `
      <div class="cal-filter-info">
        <span class="cal-filter-label">${daySelectedLabel}</span>
        <span class="cal-filter-val">${formattedDate} • ${countStr}</span>
      </div>
      <div class="cal-filter-actions">
        <button type="button" class="cal-btn-schedule-day" id="btn-schedule-selected-day">
          ${btnScheduleTxt}
        </button>
        <button type="button" class="cal-filter-btn-clear" id="btn-clear-date-filter" title="${btnClearFilterTxt}">
          ${btnClearFilterTxt}
        </button>
      </div>
    `;

    container.querySelector('#btn-clear-date-filter')?.addEventListener('click', () => {
      state.calendarView.selectedDate = null;
      renderCalendar();
    });

    container.querySelector('#btn-schedule-selected-day')?.addEventListener('click', () => {
      openNewEventModal(selectedDate);
    });
  } else {
    const monthPad = String(month + 1).padStart(2, '0');
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const upcomingMonthEvents = allEvents.filter(e => e.eventDate && e.eventDate.startsWith(`${year}-${monthPad}`) && e.eventDate >= todayIso);
    const monthName = CAL_MONTH_NAMES[month];
    const countStr = `${upcomingMonthEvents.length} ${upcomingMonthEvents.length === 1 ? upcomingSingle : upcomingPlural}`;

    container.innerHTML = `
      <div class="cal-filter-info">
        <span class="cal-filter-label">${viewMonthFullTxt}</span>
        <span class="cal-filter-val">${monthName} de ${year} • ${countStr}</span>
      </div>
      <div class="cal-filter-actions">
        <button type="button" class="cal-btn-schedule-day" id="btn-schedule-month-event">
          ${btnScheduleTxt}
        </button>
      </div>
    `;

    container.querySelector('#btn-schedule-month-event')?.addEventListener('click', () => {
      openNewEventModal();
    });
  }
}

function renderCalendar() {
  renderCalendarWidget();
  renderCalendarFilterBar();

  const container = document.getElementById('calendar-events-container');
  if (!container) return;

  let list = state.data.calendar || [];
  if (state.selectedProperty !== 'ALL') {
    list = list.filter(e => e.propertyId === state.selectedProperty);
  }

  const { year, month, selectedDate } = state.calendarView || {};
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  if (selectedDate) {
    // Se o usuário clicou numa data específica (mesmo que já tenha passado), mostra as escalas daquela data
    list = list.filter(e => e.eventDate === selectedDate);
  } else if (year !== undefined && month !== undefined) {
    // Na visão geral do mês, não exibe escalas de dias que já passaram; apenas de hoje em diante
    const monthPad = String(month + 1).padStart(2, '0');
    list = list.filter(e => e.eventDate && e.eventDate.startsWith(`${year}-${monthPad}`) && e.eventDate >= todayIso);
  }

  list.sort((a, b) => {
    const dateDiff = new Date(a.eventDate) - new Date(b.eventDate);
    if (dateDiff !== 0) return dateDiff;
    const timeA = a.startTime || '00:00';
    const timeB = b.startTime || '00:00';
    return timeA.localeCompare(timeB);
  });

  if (list.length === 0) {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      const d = parseInt(parts[2], 10);
      const m = parseInt(parts[1], 10) - 1;
      const formattedDate = `${d} de ${CAL_MONTH_NAMES[m]}`;
      const noDayTitle = window.I18N ? window.I18N.t('calendar.noEventsDayTitle', { date: formattedDate }) : `Nenhuma escala agendada para ${formattedDate}`;
      const noDaySub = window.I18N ? window.I18N.t('calendar.noEventsDaySub') : 'O imóvel está sem atividades programadas neste dia.';
      const btnScheduleDay = window.I18N ? window.I18N.t('calendar.scheduleDay') : '+ Agendar Escala para este dia';

      container.innerHTML = `
        <div style="text-align: center; padding: 28px 18px; background: white; border-radius: 20px; border: 1.5px dashed var(--border-light); color: var(--text-muted); font-size: 0.85rem;">
          <p style="font-weight: 700; color: var(--text-main); font-size: 0.95rem; margin-bottom: 4px;">${noDayTitle}</p>
          <p style="margin-bottom: 14px; font-size: 0.80rem;">${noDaySub}</p>
          <button type="button" class="cal-btn-schedule-day" id="btn-empty-schedule-day" style="padding: 7px 16px; font-size: 0.80rem;">
            ${btnScheduleDay}
          </button>
        </div>
      `;
      container.querySelector('#btn-empty-schedule-day')?.addEventListener('click', () => {
        openNewEventModal(selectedDate);
      });
    } else {
      const monthPad = String(month + 1).padStart(2, '0');
      const allMonthEvents = (state.data.calendar || []).filter(e => {
        const matchesProp = state.selectedProperty === 'ALL' || e.propertyId === state.selectedProperty;
        return matchesProp && e.eventDate && e.eventDate.startsWith(`${year}-${monthPad}`);
      });
      const hasPastEvents = allMonthEvents.some(e => e.eventDate < todayIso);
      const btnScheduleMonth = window.I18N ? window.I18N.t('calendar.scheduleMonth') : '+ Agendar Escala';

      if (hasPastEvents) {
        const noNextTitle = window.I18N ? window.I18N.t('calendar.noEventsMonth') : 'Nenhuma próxima escala neste mês';
        const noNextSub = window.I18N ? window.I18N.t('calendar.noEventsMonthSub') : 'As escalas anteriores já passaram. Toque em uma data anterior no calendário para consultar o histórico desse dia.';
        container.innerHTML = `
          <div style="text-align: center; padding: 28px 18px; background: white; border-radius: 20px; border: 1.5px dashed var(--border-light); color: var(--text-muted); font-size: 0.85rem;">
            <p style="font-weight: 700; color: var(--text-main); font-size: 0.95rem; margin-bottom: 4px;">${noNextTitle}</p>
            <p style="margin-bottom: 14px; font-size: 0.80rem;">${noNextSub}</p>
            <button type="button" class="cal-btn-schedule-day" id="btn-empty-schedule-month" style="padding: 7px 16px; font-size: 0.80rem;">
              ${btnScheduleMonth}
            </button>
          </div>
        `;
      } else {
        const noEventsAnyTitle = window.I18N ? window.I18N.t('calendar.noEventsAny') : 'Nenhuma escala neste mês';
        const noEventsAnySub = window.I18N ? window.I18N.t('calendar.noEventsAnySub') : 'Toque em "+ Agendar" para criar um novo checking, checkout ou limpeza.';
        container.innerHTML = `
          <div style="text-align: center; padding: 28px 18px; background: white; border-radius: 20px; border: 1.5px dashed var(--border-light); color: var(--text-muted); font-size: 0.85rem;">
            <p style="font-weight: 700; color: var(--text-main); font-size: 0.95rem; margin-bottom: 4px;">${noEventsAnyTitle}</p>
            <p style="margin-bottom: 14px; font-size: 0.80rem;">${noEventsAnySub}</p>
            <button type="button" class="cal-btn-schedule-day" id="btn-empty-schedule-month" style="padding: 7px 16px; font-size: 0.80rem;">
              ${btnScheduleMonth}
            </button>
          </div>
        `;
      }
      container.querySelector('#btn-empty-schedule-month')?.addEventListener('click', () => {
        openNewEventModal();
      });
    }
    return;
  }

  const calDoneTxt = window.I18N ? window.I18N.t('calendar.done') : '✓ Concluído';
  const calMarkDoneTxt = window.I18N ? window.I18N.t('calendar.markDone') : 'Marcar Feito';
  const calDeleteTitle = window.I18N ? window.I18N.t('calendar.btnDelete') : 'Excluir agendamento';
  const defaultStaffName = window.I18N ? window.I18N.t('topbar.userTeam') : 'Equipe';

  container.innerHTML = list.map(ev => {
    const isDone = ev.status === 'concluido';
    const borderLeftColor = getEventBorderColor(ev.eventType, isDone);
    const assignedStaff = (state.data.staff || []).find(s => s.id === ev.assignedStaffId || s.name === ev.assignedStaffName);
    const staffPhoto = assignedStaff?.photo || null;
    return `
      <div class="calendar-card" style="border-left: 4px solid ${borderLeftColor}; ${isDone ? 'opacity: 0.58;' : ''}">
        <div class="cal-top">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span class="cal-type-badge ${ev.eventType || 'checking'}">${getEventTypeName(ev.eventType)}</span>
            ${ev.startTime ? `
              <span class="cal-time-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>${ev.startTime}</span>
              </span>
            ` : ''}
          </div>
          <span class="cal-date">${formatDate(ev.eventDate)}</span>
        </div>
        <h4 class="cal-title">${escapeHtml(ev.title)}</h4>
        ${ev.notes ? `<p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.35;">${escapeHtml(ev.notes)}</p>` : ''}
        <div class="cal-meta">
          <span class="cal-staff" style="display: flex; align-items: center; gap: 4px;">
            ${staffPhoto ? `<img src="${staffPhoto}" alt="" style="width: 16px; height: 16px; border-radius: 50%; object-fit: cover;">` : ''}
            <span>${escapeHtml(ev.assignedStaffName || defaultStaffName)}</span>
            <span class="prop-badge-small prop-badge-${(ev.propertyId || '').toLowerCase()}" data-prop="${ev.propertyId}" style="margin-left: 4px;">${ev.propertyId}</span>
          </span>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button type="button" class="topbar-btn btn-toggle-cal-status" data-id="${ev.id}" style="${isDone ? 'background: rgba(16,185,129,0.12); color: #047857; font-weight: 700;' : ''}">
              ${isDone ? calDoneTxt : calMarkDoneTxt}
            </button>
            <button type="button" class="cal-btn-delete-event" data-id="${ev.id}" title="${calDeleteTitle}" style="background: transparent; border: none; padding: 4px; color: #94A3B8; cursor: pointer; border-radius: 6px; display: flex; align-items: center; justify-content: center;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-toggle-cal-status').forEach(btn => {
    btn.addEventListener('click', () => {
      const ev = state.data.calendar.find(e => e.id === btn.dataset.id);
      if (ev) {
        ev.status = ev.status === 'concluido' ? 'pendente' : 'concluido';
        saveData();

        if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
          AirbnbCloudSync.saveDocument('calendar', ev.id, ev).catch(e => {
            console.warn('[CloudSync] Falha ao atualizar status da escala no Firestore:', e);
          });
        }

        renderCalendar();
        showToast(ev.status === 'concluido' ? 'Escala marcada como concluída.' : 'Escala reaberta.');
      }
    });
  });

  container.querySelectorAll('.cal-btn-delete-event').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ev = state.data.calendar.find(e => e.id === btn.dataset.id);
      if (!ev) return;
      const confirmed = await showConfirmDialog({
        title: 'Excluir Escala',
        message: `Deseja realmente excluir a escala "${ev.title}"?`,
        confirmText: 'Excluir Escala',
        cancelText: 'Cancelar',
        confirmDanger: true,
        icon: 'trash'
      });
      if (confirmed) {
        state.data.calendar = state.data.calendar.filter(e => e.id !== btn.dataset.id);
        saveData();

        if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
          AirbnbCloudSync.deleteDocument('calendar', btn.dataset.id).catch(e => {
            console.warn('[CloudSync] Falha ao excluir escala no Firestore:', e);
          });
        }

        renderCalendar();
        showToast('Escala removida.');
      }
    });
  });
}

// ==========================================================================
// 5. Painel do Dono (Gestão de Equipe & Histórico Financeiro com Filtro de Data)
// ==========================================================================

function getPurchaseDateFilterRange() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Início e fim da semana atual (Segunda a Domingo)
  const currentDay = now.getDay();
  const distanceToMonday = (currentDay + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);
  const mondayStr = monday.toISOString().split('T')[0];

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const sundayStr = sunday.toISOString().split('T')[0];

  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return { todayStr, yesterdayStr, mondayStr, sundayStr, currentYearMonth };
}

function filterPurchasesByDate(purchases, filterType, selectedMonth) {
  const { todayStr, yesterdayStr, mondayStr, sundayStr, currentYearMonth } = getPurchaseDateFilterRange();

  return purchases.filter(p => {
    if (!p.purchaseDate) return false;
    const pDate = p.purchaseDate.split('T')[0];

    switch (filterType) {
      case 'hoje':
        return pDate === todayStr;
      case 'ontem':
        return pDate === yesterdayStr;
      case 'semana':
        return pDate >= mondayStr && pDate <= sundayStr;
      case 'este_mes':
        return pDate.startsWith(currentYearMonth);
      case 'mes_especifico':
        return selectedMonth ? pDate.startsWith(selectedMonth) : true;
      case 'todos':
      default:
        return true;
    }
  });
}

function renderOwnerDashboard() {
  // Filtra as compras de acordo com a seleção de data do gestor
  const filteredPurchases = filterPurchasesByDate(
    state.data.purchases,
    state.purchaseDateFilter,
    state.purchaseSelectedMonth
  );

  // Totais de gastos do período filtrado
  let totalConsolidado = 0;
  let totalJB = 0;
  let totalVN = 0;
  let totalHN = 0;

  filteredPurchases.forEach(p => {
    const cost = Number(p.totalCost) || 0;
    totalConsolidado += cost;
    if (p.propertyId === 'JB') totalJB += cost;
    if (p.propertyId === 'VN') totalVN += cost;
    if (p.propertyId === 'HN') totalHN += cost;
  });

  const elConsolidado = document.getElementById('fin-total-consolidado');
  const elJB = document.getElementById('fin-total-jb');
  const elVN = document.getElementById('fin-total-vn');
  const elHN = document.getElementById('fin-total-hn');

  if (elConsolidado) elConsolidado.textContent = formatMoney(totalConsolidado);
  if (elJB) elJB.textContent = formatMoney(totalJB);
  if (elVN) elVN.textContent = formatMoney(totalVN);
  if (elHN) elHN.textContent = formatMoney(totalHN);

  // Renderizar Colaboradoras (Exclusivo do Dono)
  const staffSection = document.getElementById('owner-staff-management-section');
  if (staffSection) {
    staffSection.style.display = (state.currentUser?.type === 'owner') ? 'block' : 'none';
  }

  const staffContainer = document.getElementById('staff-members-list-container');
  if (staffContainer) {
    if (state.currentUser?.type !== 'owner') {
      staffContainer.innerHTML = '';
    } else {
      const suspendedTxt = window.I18N ? window.I18N.t('staff.suspended') : 'Suspensa';
      const noEmailTxt = window.I18N ? window.I18N.t('staff.noGoogleEmail') : 'Sem e-mail Google';
      staffContainer.innerHTML = state.data.staff.map(staff => `
        <div class="staff-member-card ${staff.isActive === false ? 'is-suspended' : ''}">
          <div class="staff-info-col">
            <div class="staff-avatar-circle" title="${escapeHtml(staff.name)}">
              ${staff.photo
                ? `<img src="${staff.photo}" alt="${escapeHtml(staff.name)}">`
                : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>`
              }
            </div>
            <div class="staff-text-col">
              <div class="staff-name-row">
                <div class="staff-name-title" title="${escapeHtml(staff.name)}">${escapeHtml(staff.name)}</div>
                ${staff.isActive === false ? `<span class="staff-suspended-badge">${suspendedTxt}</span>` : ''}
              </div>
              <div class="staff-email-badge" title="${escapeHtml(staff.email || noEmailTxt)}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span>${escapeHtml(staff.email || noEmailTxt)}</span>
              </div>
            </div>
          </div>

          <div class="staff-actions-col">
            <button type="button" class="btn-edit-staff" data-id="${staff.id}" title="${escapeHtml(staff.name)}" aria-label="Editar colaboradora">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                <path d="m15 5 4 4"/>
              </svg>
            </button>
          </div>
        </div>
      `).join('');

      // Ação de Abrir Modal de Edição da Colaboradora
      staffContainer.querySelectorAll('.btn-edit-staff').forEach(btn => {
        btn.addEventListener('click', () => {
          const staffId = btn.dataset.id;
          openEditStaffModal(staffId);
        });
      });
    }
  }

  // Atualizar Seletor de Mês Específico
  const monthSelect = document.getElementById('purchase-month-select');
  if (monthSelect) {
    const monthsSet = new Set();
    state.data.purchases.forEach(p => {
      if (p.purchaseDate) {
        const ym = p.purchaseDate.slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(ym)) monthsSet.add(ym);
      }
    });

    const sortedMonths = Array.from(monthsSet).sort().reverse();
    const currentSelected = state.purchaseSelectedMonth || '';
    const allMonthsLabel = window.I18N ? window.I18N.t('purchases.allMonths') : 'Todos os meses...';

    monthSelect.innerHTML = `<option value="">${allMonthsLabel}</option>` +
      sortedMonths.map(ym => {
        const [year, month] = ym.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        const monthName = CAL_MONTH_NAMES[monthIndex] || month;
        const label = `${monthName} de ${year}`;
        const isSelected = ym === currentSelected ? 'selected' : '';
        return `<option value="${ym}" ${isSelected}>${label}</option>`;
      }).join('');

    // Sincroniza o seletor personalizado (sem seletor nativo do navegador)
    syncCustomSelect(monthSelect);
  }

  // Atualizar Indicadores de Filtro
  const totalCountBadge = document.getElementById('purchases-total-count-badge');
  if (totalCountBadge) {
    const purchaseUnit = filteredPurchases.length === 1
      ? (window.I18N ? window.I18N.t('purchases.singleCount') : 'compra')
      : (window.I18N ? window.I18N.t('purchases.pluralCount') : 'compras');
    totalCountBadge.textContent = `${filteredPurchases.length} ${purchaseUnit}`;
  }

  const filterInfoText = document.getElementById('purchase-filter-info-text');
  const filterSumVal = document.getElementById('purchase-filter-sum-val');

  const filterLabels = {
    todos: window.I18N ? window.I18N.t('purchases.filterAll') : 'Todas as compras cadastradas',
    hoje: window.I18N ? window.I18N.t('purchases.filterToday') : 'Compras de Hoje',
    ontem: window.I18N ? window.I18N.t('purchases.filterYesterday') : 'Compras de Ontem',
    semana: window.I18N ? window.I18N.t('purchases.filterWeek') : 'Compras desta Semana',
    este_mes: window.I18N ? window.I18N.t('purchases.filterMonth') : 'Compras deste Mês',
    mes_especifico: window.I18N ? window.I18N.t('purchases.filterSpecificMonth', { month: state.purchaseSelectedMonth }) : `Compras de ${state.purchaseSelectedMonth}`
  };

  if (filterInfoText) {
    filterInfoText.textContent = `${filterLabels[state.purchaseDateFilter] || 'Compras no período'} (${filteredPurchases.length})`;
  }
  if (filterSumVal) {
    filterSumVal.textContent = formatMoney(totalConsolidado);
  }

  // Renderizar Lista de Compras Clicáveis
  const purchasesContainer = document.getElementById('recent-purchases-container');
  if (purchasesContainer) {
    if (filteredPurchases.length === 0) {
      const emptyPurchasesTxt = window.I18N ? window.I18N.t('purchases.emptyPeriod') : 'Nenhuma compra registrada para o período selecionado.';
      purchasesContainer.innerHTML = `
        <div style="text-align: center; padding: 26px 16px; font-size: 0.82rem; color: var(--text-muted); background: #F8FAFC; border: 1px dashed var(--border-light); border-radius: 14px;">
          ${emptyPurchasesTxt}
        </div>
      `;
    } else {
      const sortedPurchases = [...filteredPurchases].sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
      const receiptTagTxt = window.I18N ? window.I18N.t('purchases.receiptTag') : 'Nota Fiscal';
      purchasesContainer.innerHTML = sortedPurchases.map(p => {
        const hasReceipt = Boolean(p.receiptPhoto);
        const buyerObj = (state.data.staff || []).find(s => s.id === p.buyerStaffId || s.name === p.buyerName);
        const buyerPhoto = p.buyerPhoto || buyerObj?.photo || (p.buyerName === 'Gestor' ? (state.data.ownerProfile?.photo || OWNER_PROFILE.photo) : null);
        return `
          <div class="clickable-purchase-card" data-purchase-id="${p.id}" role="button" tabindex="0" title="Clique para visualizar detalhes e nota fiscal">
            <div class="purchase-card-left">
              ${p.productPhoto
                ? `<img src="${p.productPhoto}" class="purchase-card-thumb" alt="${p.productName}">`
                : `<div class="purchase-card-thumb-placeholder">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/></svg>
                  </div>`
              }
              <div style="min-width: 0; flex: 1;">
                <h5 class="purchase-card-title">${p.productName}</h5>
                <div class="purchase-card-meta">
                  <span class="purchase-meta-prop-badge">${p.propertyId}</span>
                  <span style="display: inline-flex; align-items: center; gap: 4px;">
                    ${buyerPhoto ? `<img src="${buyerPhoto}" class="purchase-buyer-img" alt="">` : ''}
                    <span>${p.buyerName}</span>
                  </span>
                  <span>•</span>
                  <span>${formatDate(p.purchaseDate)}</span>
                  ${hasReceipt ? `
                    <span class="purchase-card-receipt-tag">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><polyline points="20 6 9 17 4 12"/></svg>
                      ${receiptTagTxt}
                    </span>
                  ` : ''}
                </div>
              </div>
            </div>
            <div class="purchase-card-right">
              <div>
                <div class="purchase-card-cost">${formatMoney(p.totalCost)}</div>
                <div class="purchase-card-qty">+${p.quantityBought} un</div>
              </div>
              <span class="purchase-card-arrow">›</span>
            </div>
          </div>
        `;
      }).join('');

      // Adiciona listener de clique para abrir o modal de detalhes e comprovante
      purchasesContainer.querySelectorAll('.clickable-purchase-card').forEach(card => {
        card.addEventListener('click', () => {
          const purchaseId = card.dataset.purchaseId;
          openViewPurchaseModal(purchaseId);
        });
      });
    }
  }

  // Renderizar Horas Trabalhadas (Timesheet)
  renderTimesheets();
}

// ==========================================================================
// 6. CONTROLE DE HORAS TRABALHADAS (TIMESHEET) & SELETOR DE HORÁRIO
// ==========================================================================

function timeToMinutes(tStr) {
  if (!tStr || !tStr.includes(':')) return null;
  const parts = tStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function minutesToFormatted(mins) {
  if (mins === null || mins === undefined || isNaN(mins)) return '--';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h}h 00min`;
  return `${h}h ${String(m).padStart(2, '0')}min`;
}

function calculateBreakMinutes(bStart, bEnd) {
  const startM = timeToMinutes(bStart);
  const endM = timeToMinutes(bEnd);
  if (startM === null || endM === null) return 0;
  return Math.max(0, endM - startM);
}

function calculateTimesheetTotalMinutes(start, breakStart, breakEnd, end) {
  const startM = timeToMinutes(start);
  const endM = timeToMinutes(end);
  if (startM === null || endM === null) return null;
  let total = endM - startM;
  if (breakStart && breakEnd) {
    const breakM = calculateBreakMinutes(breakStart, breakEnd);
    total -= breakM;
  }
  return Math.max(0, total);
}

function formatTimesheetDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const isPt = window.I18N && window.I18N.getLanguage() === 'pt';
  const days = isPt
    ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = isPt
    ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const dayName = days[d.getDay()] || '';
  const monthName = months[d.getMonth()] || '';
  return `${dayName}, ${parts[2]} de ${monthName} de ${parts[0]}`;
}

function formatTimesheetDateNoYear(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const isPt = window.I18N && window.I18N.getLanguage() === 'pt';
  const days = isPt
    ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = isPt
    ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const dayName = days[d.getDay()] || '';
  const monthName = months[d.getMonth()] || '';
  return `${dayName}, ${parts[2]} de ${monthName}`;
}

function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTimesheetShortDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const today = getTodayDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const isPt = window.I18N && window.I18N.getLanguage() === 'pt';
  const todayLabel = isPt ? 'Hoje' : 'Hoy';
  const yesterdayLabel = isPt ? 'Ontem' : 'Ayer';

  const dayMonth = `${parts[2]}/${parts[1]}`;
  if (dateStr === today) return `${todayLabel} (${dayMonth})`;
  if (dateStr === yStr) return `${yesterdayLabel} (${dayMonth})`;
  return dayMonth;
}

function getTimesheetMinutes(t) {
  if (!t) return 0;
  if (t.totalMinutes !== null && t.totalMinutes !== undefined && !isNaN(Number(t.totalMinutes))) {
    return Number(t.totalMinutes);
  }
  if (t.startTime && t.endTime) {
    const calc = calculateTimesheetTotalMinutes(t.startTime, t.breakStartTime, t.breakEndTime, t.endTime);
    return calc || 0;
  }
  return 0;
}

function getStaffTimesheetStats(staffId, staffEmail, staffName) {
  const emailLower = (staffEmail || '').trim().toLowerCase();
  const nameLower = (staffName || '').trim().toLowerCase();
  const idStr = String(staffId || '').trim();

  const staffRecords = (state.data.timesheets || []).filter(t => {
    if (!t) return false;
    if (idStr && String(t.staffId) === idStr) return true;
    if (emailLower && t.staffEmail && t.staffEmail.toLowerCase() === emailLower) return true;
    if (nameLower && t.staffName && t.staffName.toLowerCase().trim() === nameLower) return true;
    return false;
  });

  const unpaidRecords = staffRecords.filter(t => !t.isPaid && Boolean(t.endTime));
  const unpaidMinutes = unpaidRecords.reduce((acc, t) => acc + getTimesheetMinutes(t), 0);

  const paidRecords = staffRecords.filter(t => Boolean(t.isPaid) && Boolean(t.endTime));
  const paidMinutes = paidRecords.reduce((acc, t) => acc + getTimesheetMinutes(t), 0);

  return {
    allRecords: staffRecords,
    unpaidRecords,
    unpaidCount: unpaidRecords.length,
    unpaidMinutes,
    unpaidFormatted: minutesToFormatted(unpaidMinutes),
    paidCount: paidRecords.length,
    paidMinutes,
    paidFormatted: minutesToFormatted(paidMinutes)
  };
}

function renderTimesheets() {
  const isOwner = state.currentUser?.type === 'owner';
  const sectionTitle = document.getElementById('timesheet-section-title');
  const sectionSub = document.getElementById('timesheet-section-sub');
  const btnAdd = document.getElementById('btn-open-timesheet-modal');
  const filterWrap = document.getElementById('timesheet-staff-filter');
  const listContainer = document.getElementById('timesheet-list-container');

  if (!listContainer) return;

  if (sectionTitle) {
    sectionTitle.textContent = isOwner
      ? (window.I18N ? window.I18N.t('timesheet.titleOwner') : 'Horas da Equipe')
      : (window.I18N ? window.I18N.t('timesheet.titleStaff') : 'Minhas Horas');
  }
  if (sectionSub) {
    sectionSub.textContent = isOwner
      ? (window.I18N ? window.I18N.t('timesheet.subOwner') : 'Toque no funcionário para consultar os horários')
      : (window.I18N ? window.I18N.t('timesheet.subStaff') : 'Registre início, pausa e fim do seu dia de trabalho');
  }

  // Gestor NÃO consegue cadastrar nem editar, apenas equipe
  if (btnAdd) {
    btnAdd.style.display = isOwner ? 'none' : 'inline-flex';
  }

  // Na visão do gestor o filtro antigo é ocultado
  if (filterWrap) {
    filterWrap.style.display = 'none';
  }

  // =========================================================================
  // VISÃO DO GESTOR: LISTA LIMPA DE FUNCIONÁRIOS COM TOTALIZADOR DE HORAS
  // AO CLICAR EM UM FUNCIONÁRIO, ABRE O POPUP COM CALENDÁRIO E TOTAL PENDENTE
  // =========================================================================
  if (isOwner) {
    const rawStaffList = state.data.staff || [];
    if (rawStaffList.length === 0) {
      const emptyOwnerTitle = window.I18N ? window.I18N.t('timesheet.emptyOwner') : 'Nenhum funcionário cadastrado';
      const emptyOwnerSub = window.I18N ? window.I18N.t('timesheet.emptyOwnerSub') : 'Cadastre funcionários na seção de equipe abaixo para visualizar os horários.';
      listContainer.innerHTML = `
        <div class="ts-empty-state">
          <div class="ts-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div class="ts-empty-title">${emptyOwnerTitle}</div>
          <div class="ts-empty-sub">${emptyOwnerSub}</div>
        </div>
      `;
      return;
    }

    // Enriquecimento e recuperação inteligente de foto/perfil caso ainda não gravado no objeto direto
    const staffList = rawStaffList.map(st => {
      let photo = st.photo || '';
      if (!photo) {
        const tsMatch = (state.data.timesheets || []).find(t =>
          (String(t.staffId) === String(st.id) || (st.email && t.staffEmail && t.staffEmail.toLowerCase() === st.email.toLowerCase())) && t.staffPhoto
        );
        if (tsMatch && tsMatch.staffPhoto) photo = tsMatch.staffPhoto;
      }
      if (!photo) {
        const noteMatch = (state.data.notes || []).find(n =>
          (String(n.authorId) === String(st.id) || (st.email && n.authorEmail && n.authorEmail.toLowerCase() === st.email.toLowerCase())) && n.authorPhoto
        );
        if (noteMatch && noteMatch.authorPhoto) photo = noteMatch.authorPhoto;
      }
      return { ...st, photo };
    });

    const toPayTxt = window.I18N ? window.I18N.t('timesheet.toPayShort', { hours: '' }).trim() : 'a pagar';
    const allPaidTxt = window.I18N ? window.I18N.t('timesheet.allPaidShort') : 'Tudo pago';
    const noPendingTxt = window.I18N ? window.I18N.t('timesheet.noPendingShort') : 'Nenhuma pendência';

    listContainer.innerHTML = `
      <div class="ts-staff-picker-group">
        ${staffList.map(staff => {
          const photoUrl = staff.photo || '';
          const initials = staff.avatar || getInitials(staff.name, 'EQ');
          const stats = getStaffTimesheetStats(staff.id, staff.email, staff.name);
          const hasUnpaid = stats.unpaidMinutes > 0;
          const unpaidBadge = hasUnpaid
            ? `<span class="ts-staff-unpaid-pill is-unpaid" title="Total pendente de pagamento">
                <span class="ts-status-dot is-unpaid"></span>
                <span>${stats.unpaidFormatted} ${toPayTxt}</span>
              </span>`
            : `<span class="ts-staff-unpaid-pill is-paid" title="Todas as horas pagas">
                <span class="ts-status-dot is-paid"></span>
                <span>${allPaidTxt}</span>
              </span>`;

          const pendingSubTxt = stats.unpaidCount > 0
            ? (window.I18N ? window.I18N.t('timesheet.pendingCount', { count: stats.unpaidCount }) : `${stats.unpaidCount} expediente(s) pendente(s)`)
            : noPendingTxt;

          return `
          <div class="ts-staff-picker-card" data-staff-id="${staff.id}" role="button" tabindex="0">
            <div class="ts-staff-picker-left">
              <div class="ts-user-avatar ${photoUrl ? 'has-photo' : ''}" title="${escapeHtml(staff.name)}" style="overflow: hidden; padding: 0; background: ${photoUrl ? 'transparent' : '#0B0D11'};">
                ${photoUrl
                  ? `<img src="${escapeHtml(photoUrl)}" class="ts-staff-picker-avatar-img" alt="${escapeHtml(staff.name)}" onerror="this.onerror=null; this.parentElement.style.background='#0B0D11'; this.parentElement.innerHTML='${escapeHtml(initials)}';">`
                  : initials
                }
              </div>
              <div class="ts-staff-picker-info">
                <div class="ts-staff-picker-name">${escapeHtml(staff.name)}</div>
                <div class="ts-staff-picker-sub">${pendingSubTxt}</div>
              </div>
            </div>
            <div class="ts-staff-picker-right">
              ${unpaidBadge}
              <svg class="ts-staff-picker-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        `;}).join('')}
      </div>
    `;

    // Event listener: ao clicar no funcionário, abre o popup com calendário e totalizador
    listContainer.querySelectorAll('.ts-staff-picker-card').forEach(card => {
      card.addEventListener('click', () => {
        openManagerStaffTimesheetModal(card.dataset.staffId);
      });
    });

    return;
  }

  // =========================================================================
  // VISÃO DA EQUIPE (FUNCIONÁRIA): MINHAS HORAS, TOTALIZADOR A RECEBER E REGISTRO
  // =========================================================================
  const currentId = state.currentUser?.id;
  const currentName = (state.currentUser?.name || '').trim().toLowerCase();
  const currentEmail = (state.currentUser?.email || '').trim().toLowerCase();

  // Encontra o objeto correspondente no cadastro de equipe se houver
  const matchedStaff = (state.data.staff || []).find(s => 
    (currentEmail && s.email && s.email.toLowerCase() === currentEmail) ||
    (currentId && s.id === currentId) ||
    (currentName && s.name && s.name.trim().toLowerCase() === currentName)
  );
  const matchedStaffId = matchedStaff?.id;

  let timesheets = (state.data.timesheets && Array.isArray(state.data.timesheets))
    ? state.data.timesheets.filter(t => {
        if (!t) return false;
        if (currentEmail && t.staffEmail && t.staffEmail.toLowerCase() === currentEmail) return true;
        if (currentId && t.staffId === currentId) return true;
        if (matchedStaffId && t.staffId === matchedStaffId) return true;
        if (currentName && t.staffName && t.staffName.trim().toLowerCase() === currentName) return true;
        return false;
      })
    : [];

  timesheets.sort((a, b) => {
    if (b.date !== a.date) return (b.date || '').localeCompare(a.date || '');
    return (b.startTime || '').localeCompare(a.startTime || '');
  });

  if (timesheets.length === 0) {
    const emptyStaffTitle = window.I18N ? window.I18N.t('timesheet.emptyStaff') : 'Nenhuma hora registrada ainda';
    const emptyStaffSub = window.I18N ? window.I18N.t('timesheet.emptyStaffSub') : 'Clique em "Registrar Dia" acima para marcar o início, pausa e fim do seu serviço.';
    listContainer.innerHTML = `
      <div class="ts-empty-state">
        <div class="ts-empty-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 16 14"></polyline>
          </svg>
        </div>
        <div class="ts-empty-title">${emptyStaffTitle}</div>
        <div class="ts-empty-sub">${emptyStaffSub}</div>
      </div>
    `;
    return;
  }

  // Totalizador de horas pendentes de pagamento para a colaboradora
  const unpaidTimesheets = timesheets.filter(t => !t.isPaid && Boolean(t.endTime));
  const unpaidMinutes = unpaidTimesheets.reduce((acc, t) => acc + getTimesheetMinutes(t), 0);
  const unpaidFormatted = minutesToFormatted(unpaidMinutes);
  const isAllPaid = unpaidMinutes === 0;

  const summaryTitleTxt = isAllPaid
    ? (window.I18N ? window.I18N.t('timesheet.allPaid') : 'Todas as Horas Pagas')
    : (window.I18N ? window.I18N.t('timesheet.toReceive') : 'Total a Receber (Não Pago)');
  const summarySubTxt = unpaidTimesheets.length > 0
    ? (window.I18N ? window.I18N.t('timesheet.pendingCount', { count: unpaidTimesheets.length }) : `${unpaidTimesheets.length} expediente(s) pendente(s)`)
    : (window.I18N ? window.I18N.t('timesheet.noPending') : 'Nenhum valor pendente');

  const summaryBannerHtml = `
    <div class="ts-unpaid-summary-banner ${isAllPaid ? 'is-all-paid' : ''}">
      <div class="ts-unpaid-banner-content">
        <span class="ts-status-dot ${isAllPaid ? 'is-paid' : 'is-unpaid'}"></span>
        <div class="ts-unpaid-texts">
          <span class="ts-unpaid-title">${summaryTitleTxt}</span>
          <span class="ts-unpaid-sub">${summarySubTxt}</span>
        </div>
      </div>
      <div class="ts-unpaid-banner-right">
        <span class="ts-unpaid-hours-badge ${isAllPaid ? 'is-paid' : ''}">${unpaidFormatted}</span>
      </div>
    </div>
  `;

  const inProgressTxt = window.I18N ? window.I18N.t('timesheet.inProgress') : 'Em andamento';
  const noBreakTxt = window.I18N ? window.I18N.t('timesheet.noBreak') : 'Sem pausa';
  const statusPaidTxt = window.I18N ? window.I18N.t('timesheet.statusPaid') : 'Horas Pagas';
  const statusUnpaidTxt = window.I18N ? window.I18N.t('timesheet.statusUnpaid') : 'Não Pagas';
  const labelStartTxt = window.I18N ? window.I18N.t('timesheet.start') : 'Início';
  const labelBreakTxt = window.I18N ? window.I18N.t('timesheet.break', { time: '' }).replace(': {time}', '').replace(':', '').trim() : 'Pausa';
  const labelEndTxt = window.I18N ? window.I18N.t('timesheet.end') : 'Fim';
  const exportWaTxt = window.I18N ? window.I18N.t('timesheet.exportWhatsApp') : 'Exportar WhatsApp';
  const editBtnTxt = window.I18N ? window.I18N.t('timesheet.btnEdit') : 'Editar';

  listContainer.innerHTML = `
    ${summaryBannerHtml}
    <div class="timesheet-list-wrap">
      ${timesheets.map(t => {
        const dateFormatted = formatTimesheetDateNoYear(t.date);
        const hasEnd = Boolean(t.endTime);
        const totalText = (hasEnd && t.totalMinutes !== null && t.totalMinutes !== undefined)
          ? minutesToFormatted(t.totalMinutes)
          : inProgressTxt;

        let breakDisplay = noBreakTxt;
        if (t.breakStartTime && t.breakEndTime) {
          const bMin = calculateBreakMinutes(t.breakStartTime, t.breakEndTime);
          breakDisplay = `${t.breakStartTime} - ${t.breakEndTime}` + (bMin > 0 ? ` (${minutesToFormatted(bMin)})` : '');
        } else if (t.breakStartTime) {
          breakDisplay = `${labelBreakTxt}: ${t.breakStartTime}`;
        }

        const isPaid = Boolean(t.isPaid);

        const paidBadgeHtml = isPaid
          ? `<span class="ts-status-dot is-paid" title="${statusPaidTxt}"></span>`
          : `<span class="ts-status-dot is-unpaid" title="${statusUnpaidTxt}"></span>`;

        const paidBtnHtml = isPaid
          ? `<button type="button" class="btn-ts-toggle-paid is-paid" data-ts-id="${t.id}" title="${statusPaidTxt}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>${statusPaidTxt}</span>
            </button>`
          : `<button type="button" class="btn-ts-toggle-paid is-unpaid" data-ts-id="${t.id}" title="${statusUnpaidTxt}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>${statusUnpaidTxt}</span>
            </button>`;

        return `
          <div class="timesheet-card is-collapsed" data-ts-id="${t.id}">
            <div class="ts-card-header" role="button" tabindex="0">
              <div class="ts-card-user-info">
                <div class="ts-card-date-wrap">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: #64748B; flex-shrink: 0;">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                    <line x1="16" x2="16" y1="2" y2="6"></line>
                    <line x1="8" x2="8" y1="2" y2="6"></line>
                    <line x1="3" x2="21" y1="10" y2="10"></line>
                  </svg>
                  <span class="ts-card-date-txt">${dateFormatted}</span>
                </div>
              </div>
              <div class="ts-card-badges">
                ${paidBadgeHtml}
                <span class="ts-total-badge ${!hasEnd ? 'in-progress' : ''}">
                  ${totalText}
                </span>
                <svg class="ts-card-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>

            <div class="ts-card-details">
              <div class="ts-card-timeline">
                <div class="ts-time-pill pill-start">
                  <span class="ts-time-pill-label">${labelStartTxt}</span>
                  <span class="ts-time-pill-val">${t.startTime || '--:--'}</span>
                </div>
                <div class="ts-time-pill pill-break">
                  <span class="ts-time-pill-label">${labelBreakTxt}</span>
                  <span class="ts-time-pill-val" style="font-size: 0.78rem;">${breakDisplay}</span>
                </div>
                <div class="ts-time-pill pill-end">
                  <span class="ts-time-pill-label">${labelEndTxt}</span>
                  <span class="ts-time-pill-val">${t.endTime || inProgressTxt}</span>
                </div>
              </div>

              <div class="ts-card-actions">
                ${paidBtnHtml}
                <button type="button" class="btn-ts-whatsapp" data-ts-id="${t.id}" title="${exportWaTxt}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 16.67c-1.49 0-2.95-.4-4.22-1.16l-.3-.18-3.12.82.83-3.04-.2-.32a8.19 8.19 0 0 1-1.26-4.36c0-4.52 3.68-8.2 8.2-8.2 2.19 0 4.25.85 5.8 2.4 1.55 1.55 2.41 3.61 2.41 5.8 0 4.53-3.68 8.21-8.2 8.21zm4.5-6.15c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.17.25-.65.8-.8 1-.15.19-.3.21-.55.09-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.48-1.39-1.73-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.32z"/>
                  </svg>
                  <span>${exportWaTxt}</span>
                </button>
                <button type="button" class="btn-ts-edit" data-ts-id="${t.id}" title="${editBtnTxt}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  <span>${editBtnTxt}</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Listener para minimizar / expandir o card ao clicar
  listContainer.querySelectorAll('.timesheet-card').forEach(card => {
    const header = card.querySelector('.ts-card-header');
    if (header) {
      header.addEventListener('click', () => {
        card.classList.toggle('is-collapsed');
      });
    }
  });

  // Listener do botão de alternar Horas Pagas / Não Pagas (Perfil do Funcionário)
  listContainer.querySelectorAll('.btn-ts-toggle-paid').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTimesheetPaidStatus(btn.dataset.tsId);
    });
  });

  listContainer.querySelectorAll('.btn-ts-whatsapp').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportTimesheetToWhatsApp(btn.dataset.tsId);
    });
  });

  listContainer.querySelectorAll('.btn-ts-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openTimesheetModal(btn.dataset.tsId);
    });
  });
}

function toggleTimesheetPaidStatus(tsId) {
  const record = (state.data.timesheets || []).find(t => t.id === tsId);
  if (!record) return;

  record.isPaid = !Boolean(record.isPaid);
  record.updatedAt = new Date().toISOString();
  saveData();

  if (record.isPaid) {
    showToast('Horas marcadas como PAGAS! 💵');
  } else {
    showToast('Horas marcadas como NÃO PAGAS (pendente).');
  }

  renderTimesheets();
}

function exportTimesheetToWhatsApp(recordId) {
  const record = (state.data.timesheets || []).find(t => t.id === recordId);
  if (!record) return;

  const staffObj = (state.data.staff || []).find(s => s.id === record.staffId);
  const staffName = record.staffName || (staffObj ? staffObj.name : 'Colaboradora');
  const dateFormatted = formatTimesheetDate(record.date);

  let breakText = 'Não houve pausa';
  if (record.breakStartTime && record.breakEndTime) {
    const bMin = calculateBreakMinutes(record.breakStartTime, record.breakEndTime);
    breakText = `${record.breakStartTime} às ${record.breakEndTime}` + (bMin > 0 ? ` (${minutesToFormatted(bMin)})` : '');
  } else if (record.breakStartTime) {
    breakText = `Iniciada às ${record.breakStartTime}`;
  }

  const totalText = (record.endTime && record.totalMinutes !== null && record.totalMinutes !== undefined)
    ? minutesToFormatted(record.totalMinutes)
    : (record.endTime ? 'Calculando' : 'Em andamento');

  const paymentStatusText = record.isPaid ? 'Horas Pagas ✅' : 'Pendente de Pagamento ⏳';

  const textLines = [
    `📋 *Registro de Horas Trabalhadas*`,
    `👤 *Colaboradora:* ${staffName}`,
    `📅 *Data:* ${dateFormatted}`,
    ``,
    `⏰ *Início:* ${record.startTime || '--:--'}`,
    `☕ *Pausa:* ${breakText}`,
    `🏁 *Término:* ${record.endTime || 'Em andamento'}`,
    ``,
    `⏱️ *Total Trabalhado:* ${totalText}`,
    `💰 *Status Pagamento:* ${paymentStatusText}`,
    ``,
    `🏢 _Airbnb Gestão & Controle_`
  ];

  const message = textLines.join('\n');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(message).catch(() => {});
  }

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');

  showToast('Registro de horas exportado para o WhatsApp!');
}

// ==========================================================================
// POPUP DE CONSULTA DE HORAS DO FUNCIONÁRIO (VISÃO DO GESTOR - ZERO SCROLL)
// 1. Abre popup mostrando o calendário compacto embutido (cabe sem rolar)
// 2. Ao clicar em um dia, o popup muda mostrando as horas daquele dia
// ==========================================================================
function renderManagerInlineCalendar(year, month) {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  state.managerCalendarYear = year;
  state.managerCalendarMonth = month;

  const titleEl = document.getElementById('mgr-ts-cal-month-title');
  if (titleEl) {
    titleEl.textContent = `${monthNames[month]} ${year}`;
  }

  const grid = document.getElementById('mgr-ts-cal-grid');
  if (!grid) return;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Identificar quais datas possuem registros para exibir pontinho verde indicador
  const staffId = state.activeManagerStaffId;
  const staff = (state.data.staff || []).find(s => s.id === staffId);
  const sEmail = (staff?.email || '').toLowerCase().trim();
  const sName = (staff?.name || '').toLowerCase().trim();
  const staffTimesheets = (state.data.timesheets || []).filter(t => 
    staff && (
      t.staffId === staff.id ||
      (sEmail && t.staffEmail && t.staffEmail.toLowerCase() === sEmail) ||
      (sName && t.staffName && t.staffName.toLowerCase().trim() === sName)
    )
  );
  const workedDatesSet = new Set(staffTimesheets.map(t => t.date).filter(Boolean));

  let html = '';

  // Dias do mês anterior
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDay = daysInPrevMonth - i;
    html += `<span class="mgr-ts-day-cell">${prevDay}</span>`;
  }

  // Dias do mês atual
  for (let d = 1; d <= daysInMonth; d++) {
    const dPad = String(d).padStart(2, '0');
    const mPad = String(month + 1).padStart(2, '0');
    const isoDate = `${year}-${mPad}-${dPad}`;

    const isToday = isoDate === todayIso;
    const isFuture = isoDate > todayIso;
    const dayRecords = staffTimesheets.filter(t => t.date === isoDate);
    const hasWorked = dayRecords.length > 0;
    const allPaid = hasWorked && dayRecords.every(t => Boolean(t.isPaid));
    const dotClass = allPaid ? 'is-paid' : 'is-unpaid';
    const dotTitle = allPaid ? 'Horas registradas (Pagas)' : 'Horas registradas (Pendentes de pagamento)';

    if (isFuture) {
      html += `
        <span class="mgr-ts-day-cell is-future" title="Data futura não alcançada">${d}</span>
      `;
    } else {
      html += `
        <button type="button" 
          class="mgr-ts-day-btn ${isToday ? 'is-today' : ''}" 
          data-date="${isoDate}">
          <span class="mgr-ts-day-number">${d}</span>
          ${hasWorked ? `<span class="mgr-ts-day-dot ${dotClass}" title="${dotTitle}"></span>` : ''}
        </button>
      `;
    }
  }

  // Dias do próximo mês para completar grade
  const totalSlots = firstDayIndex + daysInMonth;
  const remaining = totalSlots <= 35 ? 35 - totalSlots : 42 - totalSlots;
  for (let n = 1; n <= remaining; n++) {
    html += `<span class="mgr-ts-day-cell">${n}</span>`;
  }

  grid.innerHTML = html;

  // Ao tocar em qualquer dia, transita instantaneamente para as horas trabalhadas
  grid.querySelectorAll('.mgr-ts-day-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dateVal = btn.dataset.date;
      showManagerTimesheetHours(state.activeManagerStaffId, dateVal);
    });
  });
}

function openManagerStaffTimesheetModal(staffId) {
  let staff = (state.data.staff || []).find(s => String(s.id) === String(staffId));
  if (!staff) {
    staff = (state.data.staff || []).find(s => s.name === staffId || s.email === staffId);
  }
  if (!staff) return;

  state.activeManagerStaffId = staff.id;
  state.activeManagerStaffDate = '';

  const modal = document.getElementById('modal-manager-timesheet');
  const titleEl = document.getElementById('mgr-ts-modal-title');
  const subtitleEl = document.getElementById('mgr-ts-modal-subtitle');
  const avatarEl = document.getElementById('mgr-ts-modal-avatar');
  const stepDate = document.getElementById('mgr-ts-step-date');
  const stepHours = document.getElementById('mgr-ts-step-hours');

  if (titleEl) titleEl.textContent = staff.name;
  if (subtitleEl) subtitleEl.textContent = window.I18N ? window.I18N.t('managerTimesheet.tapDay') : 'Toque no dia para consultar';
  if (avatarEl) {
    let photoUrl = staff.photo || '';
    if (!photoUrl) {
      const tsMatch = (state.data.timesheets || []).find(t =>
        (String(t.staffId) === String(staff.id) || (staff.email && t.staffEmail && t.staffEmail.toLowerCase() === staff.email.toLowerCase())) && t.staffPhoto
      );
      if (tsMatch && tsMatch.staffPhoto) photoUrl = tsMatch.staffPhoto;
    }
    const initials = staff.avatar || getInitials(staff.name, 'EQ');
    if (photoUrl) {
      avatarEl.innerHTML = `<img src="${escapeHtml(photoUrl)}" class="ts-staff-picker-avatar-img" alt="${escapeHtml(staff.name)}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" onerror="this.onerror=null; this.parentElement.style.background='#0B0D11'; this.parentElement.innerHTML='${escapeHtml(initials)}';">`;
      avatarEl.style.overflow = 'hidden';
      avatarEl.style.padding = '0';
      avatarEl.style.background = 'transparent';
    } else {
      avatarEl.style.overflow = '';
      avatarEl.style.padding = '';
      avatarEl.style.background = '#0B0D11';
      avatarEl.textContent = initials;
    }
  }

  // Renderiza o totalizador de horas pendentes da colaboradora no topo do modal
  renderManagerStaffSummaryBanner(staff);

  // Inicializa mostrando o Passo 1 (calendário embutido)
  if (stepDate) stepDate.style.display = 'block';
  if (stepHours) stepHours.style.display = 'none';

  // Renderiza o calendário embutido compacto
  const now = new Date();
  renderManagerInlineCalendar(now.getFullYear(), now.getMonth());

  if (modal) {
    modal.classList.add('active');
  }
}

function renderManagerStaffSummaryBanner(staff) {
  const container = document.getElementById('mgr-ts-unpaid-summary-box');
  if (!container || !staff) return;

  const stats = getStaffTimesheetStats(staff.id, staff.email, staff.name);
  const isAllPaid = stats.unpaidMinutes === 0;

  const summaryTitleTxt = isAllPaid
    ? (window.I18N ? window.I18N.t('timesheet.allPaid') : 'Todas as Horas Pagas')
    : (window.I18N ? window.I18N.t('managerTimesheet.totalToPay') : 'Total a Pagar (Não Pago)');
  const summarySubTxt = stats.unpaidCount > 0
    ? (window.I18N ? window.I18N.t('timesheet.pendingCount', { count: stats.unpaidCount }) : `${stats.unpaidCount} expediente(s) pendente(s)`)
    : (window.I18N ? window.I18N.t('managerTimesheet.noPendingTitle') : 'Nenhuma pendência financeira');
  const viewPendingBtnTxt = window.I18N ? window.I18N.t('managerTimesheet.btnViewPending') : 'Ver Pendentes';

  container.innerHTML = `
    <div class="ts-unpaid-summary-banner ${isAllPaid ? 'is-all-paid' : ''}">
      <div class="ts-unpaid-banner-content">
        <span class="ts-status-dot ${isAllPaid ? 'is-paid' : 'is-unpaid'}"></span>
        <div class="ts-unpaid-texts">
          <span class="ts-unpaid-title">${summaryTitleTxt}</span>
          <span class="ts-unpaid-sub">${summarySubTxt}</span>
        </div>
      </div>
      <div class="ts-unpaid-banner-right">
        <span class="ts-unpaid-hours-badge ${isAllPaid ? 'is-paid' : ''}">${stats.unpaidFormatted}</span>
        ${stats.unpaidCount > 0 ? `<button type="button" class="btn-mgr-view-unpaid-list" id="btn-mgr-view-all-unpaid" title="Ver todos os expedientes pendentes da colaboradora">${viewPendingBtnTxt}</button>` : ''}
      </div>
    </div>
  `;

  const btnView = container.querySelector('#btn-mgr-view-all-unpaid');
  if (btnView) {
    btnView.addEventListener('click', () => {
      showManagerTimesheetHours(staff.id, 'unpaid');
    });
  }
}

function closeManagerStaffTimesheetModal() {
  const modal = document.getElementById('modal-manager-timesheet');
  if (modal) {
    modal.classList.remove('active');
  }
  state.activeManagerStaffId = null;
  state.activeManagerStaffDate = '';
}

function showManagerTimesheetHours(staffId, dateStr) {
  if (!staffId) staffId = state.activeManagerStaffId;
  if (!dateStr) {
    showToast('Por favor, selecione uma data.');
    return;
  }

  const staff = (state.data.staff || []).find(s => s.id === staffId);
  if (!staff) return;

  state.activeManagerStaffDate = dateStr;

  // Atualiza banner no topo caso tenha sofrido alterações
  renderManagerStaffSummaryBanner(staff);

  const isUnpaidMode = (dateStr === 'unpaid');
  const stepDate = document.getElementById('mgr-ts-step-date');
  const stepHours = document.getElementById('mgr-ts-step-hours');
  const subtitleEl = document.getElementById('mgr-ts-modal-subtitle');
  const activeDateTxt = document.getElementById('mgr-ts-active-date-txt');
  const hoursContainer = document.getElementById('mgr-ts-hours-card-container');

  // Muda o popup para o Passo 2: Mostrando as horas trabalhadas
  if (stepDate) stepDate.style.display = 'none';
  if (stepHours) stepHours.style.display = 'block';

  if (subtitleEl) {
    subtitleEl.textContent = isUnpaidMode
      ? (window.I18N ? window.I18N.t('managerTimesheet.pendingRecords') : 'Expedientes Pendentes')
      : (window.I18N ? window.I18N.t('managerTimesheet.workedHours') : 'Horas trabalhadas');
  }

  if (activeDateTxt) {
    activeDateTxt.textContent = isUnpaidMode
      ? (window.I18N ? window.I18N.t('managerTimesheet.pending') : 'Pendentes')
      : formatTimesheetDateNoYear(dateStr);
  }

  if (!hoursContainer) return;

  // Filtrar registros do funcionário (nesta data específica ou todos não pagos)
  const staffEmail = (staff.email || '').toLowerCase().trim();
  const staffName = (staff.name || '').toLowerCase().trim();
  const records = (state.data.timesheets || []).filter(t => {
    if (!t) return false;
    const matchStaff = (t.staffId === staff.id) ||
      (staffEmail && t.staffEmail && t.staffEmail.toLowerCase() === staffEmail) ||
      (staffName && t.staffName && t.staffName.toLowerCase().trim() === staffName);
    if (!matchStaff) return false;

    if (isUnpaidMode) {
      return !t.isPaid;
    }
    return t.date === dateStr;
  });

  if (isUnpaidMode) {
    records.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  } else {
    records.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }

  if (records.length === 0) {
    const emptyTitle = isUnpaidMode
      ? (window.I18N ? window.I18N.t('managerTimesheet.noPendingTitle') : 'Nenhuma pendência')
      : (window.I18N ? window.I18N.t('managerTimesheet.noDayTitle') : 'Nenhum horário registrado');
    const emptySub = isUnpaidMode
      ? (window.I18N ? window.I18N.t('managerTimesheet.noPendingSub', { name: escapeHtml(staff.name) }) : `Todas as horas de ${escapeHtml(staff.name)} estão confirmadas como pagas!`)
      : (window.I18N ? window.I18N.t('managerTimesheet.noDaySub', { name: escapeHtml(staff.name), date: formatTimesheetDateNoYear(dateStr) }) : `${escapeHtml(staff.name)} não registrou horas em ${formatTimesheetDateNoYear(dateStr)}.`);
    const btnLabel = isUnpaidMode
      ? (window.I18N ? window.I18N.t('managerTimesheet.btnBackCalendar') : 'Voltar ao calendário')
      : (window.I18N ? window.I18N.t('managerTimesheet.btnChooseOtherDay') : 'Escolher outro dia');

    hoursContainer.innerHTML = `
      <div class="mgr-ts-empty-day">
        <div class="mgr-ts-empty-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="mgr-ts-empty-title">${emptyTitle}</div>
        <div class="mgr-ts-empty-sub">${emptySub}</div>
        <button type="button" class="mgr-ts-btn-other-date" id="btn-mgr-ts-retry-date">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
            <line x1="16" x2="16" y1="2" y2="6"></line>
            <line x1="8" x2="8" y1="2" y2="6"></line>
            <line x1="3" x2="21" y1="10" y2="10"></line>
          </svg>
          <span>${btnLabel}</span>
        </button>
      </div>
    `;

    const retryBtn = hoursContainer.querySelector('#btn-mgr-ts-retry-date');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        const subtitleEl = document.getElementById('mgr-ts-modal-subtitle');
        if (subtitleEl) subtitleEl.textContent = window.I18N ? window.I18N.t('managerTimesheet.tapDay') : 'Toque no dia para consultar';
        if (stepDate) stepDate.style.display = 'block';
        if (stepHours) stepHours.style.display = 'none';
      });
    }
    return;
  }

  const inProgressTxt = window.I18N ? window.I18N.t('timesheet.inProgress') : 'Em andamento';
  const noBreakTxt = window.I18N ? window.I18N.t('timesheet.noBreak') : 'Sem pausa';
  const labelStartTxt = window.I18N ? window.I18N.t('timesheet.start') : 'Início';
  const labelBreakTxt = window.I18N ? window.I18N.t('timesheet.break', { time: '' }).replace(': {time}', '').replace(':', '').trim() : 'Pausa';
  const labelEndTxt = window.I18N ? window.I18N.t('timesheet.end') : 'Fim';
  const exportWaTxt = window.I18N ? window.I18N.t('timesheet.exportWhatsApp') : 'Exportar WhatsApp';
  const paidTitle = window.I18N ? window.I18N.t('managerTimesheet.statusPaidTitle') : 'Status: Horas Pagas';
  const paidDesc = window.I18N ? window.I18N.t('managerTimesheet.statusPaidDesc') : 'A colaboradora marcou este expediente como pago.';
  const unpaidTitle = window.I18N ? window.I18N.t('managerTimesheet.statusUnpaidTitle') : 'Status: Não Pago (Pendente)';
  const unpaidDesc = window.I18N ? window.I18N.t('managerTimesheet.statusUnpaidDesc') : 'A colaboradora ainda não marcou este expediente como pago.';

  hoursContainer.innerHTML = `
    <div class="mgr-ts-records-list">
      ${records.map(t => {
        const hasEnd = Boolean(t.endTime);
        const totalText = (hasEnd && t.totalMinutes !== null && t.totalMinutes !== undefined)
          ? minutesToFormatted(t.totalMinutes)
          : inProgressTxt;

        let breakDisplay = noBreakTxt;
        if (t.breakStartTime && t.breakEndTime) {
          const bMin = calculateBreakMinutes(t.breakStartTime, t.breakEndTime);
          breakDisplay = `${t.breakStartTime} - ${t.breakEndTime}` + (bMin > 0 ? ` (${minutesToFormatted(bMin)})` : '');
        } else if (t.breakStartTime) {
          breakDisplay = `${labelBreakTxt}: ${t.breakStartTime}`;
        }

        const dateFormatted = formatTimesheetDateNoYear(t.date || dateStr);
        const isPaid = Boolean(t.isPaid);
        const paidBadgeHtml = isPaid
          ? `<span class="ts-status-dot is-paid" title="${paidTitle}"></span>`
          : `<span class="ts-status-dot is-unpaid" title="${unpaidTitle}"></span>`;

        const managerStatusHtml = isPaid
          ? `<div class="mgr-ts-payment-status is-paid">
              <div class="mgr-ts-status-icon-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div class="mgr-ts-status-texts">
                <span class="mgr-ts-status-title">${paidTitle}</span>
                <span class="mgr-ts-status-desc">${paidDesc}</span>
              </div>
            </div>`
          : `<div class="mgr-ts-payment-status is-unpaid">
              <div class="mgr-ts-status-icon-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div class="mgr-ts-status-texts">
                <span class="mgr-ts-status-title">${unpaidTitle}</span>
                <span class="mgr-ts-status-desc">${unpaidDesc}</span>
              </div>
            </div>`;

        return `
          <div class="timesheet-card mgr-ts-record-card is-collapsed" data-ts-id="${t.id}">
            <div class="ts-card-header" role="button" tabindex="0">
              <div class="ts-card-user-info">
                <div class="mgr-ts-card-date-wrap">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: #64748B; flex-shrink: 0;">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                    <line x1="16" x2="16" y1="2" y2="6"></line>
                    <line x1="8" x2="8" y1="2" y2="6"></line>
                    <line x1="3" x2="21" y1="10" y2="10"></line>
                  </svg>
                  <span class="mgr-ts-card-date-txt">${dateFormatted}</span>
                </div>
              </div>
              <div class="ts-card-badges">
                ${paidBadgeHtml}
                <span class="ts-total-badge ${!hasEnd ? 'in-progress' : ''}">
                  ${totalText}
                </span>
                <svg class="ts-card-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>

            <div class="ts-card-details">
              <div class="ts-card-timeline">
                <div class="ts-time-pill pill-start">
                  <span class="ts-time-pill-label">${labelStartTxt}</span>
                  <span class="ts-time-pill-val">${t.startTime || '--:--'}</span>
                </div>
                <div class="ts-time-pill pill-break">
                  <span class="ts-time-pill-label">${labelBreakTxt}</span>
                  <span class="ts-time-pill-val" style="font-size: 0.78rem;">${breakDisplay}</span>
                </div>
                <div class="ts-time-pill pill-end">
                  <span class="ts-time-pill-label">${labelEndTxt}</span>
                  <span class="ts-time-pill-val">${t.endTime || inProgressTxt}</span>
                </div>
              </div>

              ${managerStatusHtml}

              <div class="ts-card-actions">
                <button type="button" class="btn-ts-whatsapp" data-ts-id="${t.id}" title="${exportWaTxt}">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 16.67c-1.49 0-2.95-.4-4.22-1.16l-.3-.18-3.12.82.83-3.04-.2-.32a8.19 8.19 0 0 1-1.26-4.36c0-4.52 3.68-8.2 8.2-8.2 2.19 0 4.25.85 5.8 2.4 1.55 1.55 2.41 3.61 2.41 5.8 0 4.53-3.68 8.21-8.2 8.21zm4.5-6.15c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.17.25-.65.8-.8 1-.15.19-.3.21-.55.09-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.48-1.39-1.73-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.32z"/>
                  </svg>
                  <span>${exportWaTxt}</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Listener para expandir / recolher card do gestor ao clicar no header
  hoursContainer.querySelectorAll('.mgr-ts-record-card').forEach(card => {
    const header = card.querySelector('.ts-card-header');
    if (header) {
      header.addEventListener('click', () => {
        card.classList.toggle('is-collapsed');
      });
    }
  });

  hoursContainer.querySelectorAll('.btn-ts-whatsapp').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportTimesheetToWhatsApp(btn.dataset.tsId);
    });
  });
}

function openTimesheetModal(editId = null) {
  const modal = document.getElementById('modal-timesheet');
  const titleEl = document.getElementById('timesheet-modal-title');
  const dateInput = document.getElementById('timesheet-date-input');
  const editIdInput = document.getElementById('timesheet-edit-id');
  const btnDelete = document.getElementById('btn-delete-timesheet');

  if (!modal) return;

  if (dateInput) {
    dateInput.max = getTodayDateString();
    dateInput.onchange = () => {
      if (dateInput.value > getTodayDateString()) {
        showToast('Não é possível registrar horas em uma data futura.');
        dateInput.value = getTodayDateString();
      }
    };
  }

  if (editId) {
    const record = (state.data.timesheets || []).find(t => t.id === editId);
    if (!record) return;
    if (titleEl) titleEl.textContent = 'Editar Horas do Dia';
    if (editIdInput) editIdInput.value = record.id;
    if (dateInput) dateInput.value = record.date || getTodayDateString();
    state.tempTimesheetTimes = {
      start: record.startTime || '',
      breakStart: record.breakStartTime || '',
      breakEnd: record.breakEndTime || '',
      end: record.endTime || ''
    };
    if (btnDelete) btnDelete.style.display = 'block';
    updateTimesheetModalPaymentButtons(Boolean(record.isPaid));
  } else {
    if (titleEl) titleEl.textContent = 'Registrar Horas do Dia';
    if (editIdInput) editIdInput.value = '';
    if (dateInput) dateInput.value = getTodayDateString();
    const now = new Date();
    const curH = String(now.getHours()).padStart(2, '0');
    const curM = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0');
    const safeNowTime = `${curH}:${curM}`;
    state.tempTimesheetTimes = {
      start: safeNowTime,
      breakStart: '',
      breakEnd: '',
      end: ''
    };
    if (btnDelete) btnDelete.style.display = 'none';
    updateTimesheetModalPaymentButtons(false);
  }

  updateTimesheetModalFields();
  modal.classList.add('active');
}

function updateTimesheetModalPaymentButtons(isPaid) {
  const btnUnpaid = document.getElementById('ts-modal-btn-unpaid');
  const btnPaid = document.getElementById('ts-modal-btn-paid');
  const paidInput = document.getElementById('timesheet-is-paid-input');
  if (paidInput) paidInput.value = isPaid ? 'true' : 'false';

  if (btnUnpaid && btnPaid) {
    if (isPaid) {
      btnUnpaid.classList.remove('active');
      btnPaid.classList.add('active');
    } else {
      btnUnpaid.classList.add('active');
      btnPaid.classList.remove('active');
    }
  }
}

function updateTimesheetModalFields() {
  const fields = [
    { key: 'start', id: 'ts-field-start' },
    { key: 'breakStart', id: 'ts-field-breakStart' },
    { key: 'breakEnd', id: 'ts-field-breakEnd' },
    { key: 'end', id: 'ts-field-end' }
  ];

  fields.forEach(({ key, id }) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const val = state.tempTimesheetTimes[key];
    const valEl = btn.querySelector('.ts-field-value');
    if (valEl) valEl.textContent = val || '--:--';
    if (val) {
      btn.classList.add('has-value');
    } else {
      btn.classList.remove('has-value');
    }
  });

  const previewEl = document.getElementById('timesheet-total-preview');
  if (previewEl) {
    const { start, breakStart, breakEnd, end } = state.tempTimesheetTimes;
    if (start && end) {
      const totalM = calculateTimesheetTotalMinutes(start, breakStart, breakEnd, end);
      previewEl.textContent = minutesToFormatted(totalM);
    } else if (start) {
      previewEl.textContent = 'Em andamento';
    } else {
      previewEl.textContent = '--';
    }
  }
}

// ==========================================================================
// SELETOR DE HORÁRIO EXCLUSIVO (WHEEL PICKER CUSTOMIZADO)
// ==========================================================================
let _timePickerActiveField = null;
let _timePickerHour = 8;
let _timePickerMinute = 0;
let _timePickerIsCleared = false;

function initTimePicker() {
  const hoursWheel = document.getElementById('time-wheel-hours');
  const minutesWheel = document.getElementById('time-wheel-minutes');
  if (!hoursWheel || !minutesWheel) return;

  // Constrói 24 horas (00 a 23)
  let hoursHtml = '';
  for (let i = 0; i < 24; i++) {
    const val = String(i).padStart(2, '0');
    hoursHtml += `<button type="button" class="time-wheel-item" data-val="${i}">${val}</button>`;
  }
  hoursWheel.innerHTML = hoursHtml;

  // Constrói 60 minutos (00 a 59)
  let minutesHtml = '';
  for (let i = 0; i < 60; i++) {
    const val = String(i).padStart(2, '0');
    minutesHtml += `<button type="button" class="time-wheel-item" data-val="${i}">${val}</button>`;
  }
  minutesWheel.innerHTML = minutesHtml;

  // Clique em item das horas
  hoursWheel.querySelectorAll('.time-wheel-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.val, 10);
      const dateInput = document.getElementById('timesheet-date-input');
      const todayStr = getTodayDateString();
      const isToday = !dateInput || dateInput.value === todayStr;
      const now = new Date();
      if (isToday && val > now.getHours()) {
        showToast(`Horário futuro não permitido (hora máxima atual: ${String(now.getHours()).padStart(2, '0')}:00).`);
        return;
      }
      scrollToTimeWheel(hoursWheel, val);
    });
  });

  // Clique em item dos minutos
  minutesWheel.querySelectorAll('.time-wheel-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.val, 10);
      const dateInput = document.getElementById('timesheet-date-input');
      const todayStr = getTodayDateString();
      const isToday = !dateInput || dateInput.value === todayStr;
      const now = new Date();
      if (isToday && _timePickerHour === now.getHours() && val > now.getMinutes()) {
        showToast(`Minuto futuro não permitido (horário atual: ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}).`);
        return;
      }
      scrollToTimeWheel(minutesWheel, val);
    });
  });

  // Scroll nas horas
  let hScrollTimeout = null;
  hoursWheel.addEventListener('scroll', () => {
    clearTimeout(hScrollTimeout);
    hScrollTimeout = setTimeout(() => {
      updateTimeWheelActiveItem(hoursWheel, (val) => {
        const dateInput = document.getElementById('timesheet-date-input');
        const todayStr = getTodayDateString();
        const isToday = !dateInput || dateInput.value === todayStr;
        const now = new Date();
        const nowH = now.getHours();
        const nowM = now.getMinutes();

        if (isToday && val > nowH) {
          _timePickerHour = nowH;
          scrollToTimeWheel(hoursWheel, nowH);
          showToast(`Horário futuro não permitido (máximo: ${String(nowH).padStart(2, '0')}:00).`);
        } else {
          _timePickerHour = val;
        }
        _timePickerIsCleared = false;
        applyTimePickerFutureRestrictions(isToday, nowH, nowM);
        updateTimePickerDisplay();
      });
    }, 60);
  }, { passive: true });

  // Scroll nos minutos
  let mScrollTimeout = null;
  minutesWheel.addEventListener('scroll', () => {
    clearTimeout(mScrollTimeout);
    mScrollTimeout = setTimeout(() => {
      updateTimeWheelActiveItem(minutesWheel, (val) => {
        const dateInput = document.getElementById('timesheet-date-input');
        const todayStr = getTodayDateString();
        const isToday = !dateInput || dateInput.value === todayStr;
        const now = new Date();
        const nowH = now.getHours();
        const nowM = now.getMinutes();

        if (isToday && _timePickerHour === nowH && val > nowM) {
          _timePickerMinute = nowM;
          scrollToTimeWheel(minutesWheel, nowM);
          showToast(`Minuto futuro não permitido (máximo: ${String(nowH).padStart(2, '0')}:${String(nowM).padStart(2, '0')}).`);
        } else {
          _timePickerMinute = val;
        }
        _timePickerIsCleared = false;
        updateTimePickerDisplay();
      });
    }, 60);
  }, { passive: true });

  // Botão "Agora"
  document.getElementById('btn-time-now')?.addEventListener('click', () => {
    const now = new Date();
    _timePickerHour = now.getHours();
    _timePickerMinute = now.getMinutes();
    _timePickerIsCleared = false;
    setTimeWheelValues(_timePickerHour, _timePickerMinute);
    updateTimePickerDisplay();
    const dateInput = document.getElementById('timesheet-date-input');
    const todayStr = getTodayDateString();
    const isToday = !dateInput || dateInput.value === todayStr;
    applyTimePickerFutureRestrictions(isToday, now.getHours(), now.getMinutes());
  });

  // Botão "Limpar horário"
  document.getElementById('btn-time-clear')?.addEventListener('click', () => {
    _timePickerIsCleared = true;
    updateTimePickerDisplay();
  });

  // Botão "Confirmar Horário"
  document.getElementById('btn-time-confirm')?.addEventListener('click', () => {
    if (_timePickerActiveField) {
      if (_timePickerIsCleared) {
        state.tempTimesheetTimes[_timePickerActiveField] = '';
      } else {
        const dateInput = document.getElementById('timesheet-date-input');
        const todayStr = getTodayDateString();
        const isToday = !dateInput || dateInput.value === todayStr;

        if (isToday) {
          const now = new Date();
          const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
          const pickedTotalMinutes = _timePickerHour * 60 + _timePickerMinute;

          if (pickedTotalMinutes > currentTotalMinutes) {
            const curHStr = String(now.getHours()).padStart(2, '0');
            const curMStr = String(now.getMinutes()).padStart(2, '0');
            showToast(`Não é possível selecionar horário futuro (agora são ${curHStr}:${curMStr}).`);
            return;
          }
        }

        const hStr = String(_timePickerHour).padStart(2, '0');
        const mStr = String(_timePickerMinute).padStart(2, '0');
        const pickedTime = `${hStr}:${mStr}`;
        state.tempTimesheetTimes[_timePickerActiveField] = pickedTime;
      }
      updateTimesheetModalFields();
    }
    closeTimePicker();
  });

  // Fechar
  document.getElementById('btn-close-time-picker')?.addEventListener('click', () => {
    closeTimePicker();
  });
}

function applyTimePickerFutureRestrictions(isToday, maxH, maxM) {
  const hoursWheel = document.getElementById('time-wheel-hours');
  const minutesWheel = document.getElementById('time-wheel-minutes');
  if (!hoursWheel || !minutesWheel) return;

  hoursWheel.querySelectorAll('.time-wheel-item').forEach(btn => {
    const val = parseInt(btn.dataset.val, 10);
    if (isToday && val > maxH) {
      btn.classList.add('is-disabled-future');
      btn.setAttribute('title', 'Horário futuro não permitido');
    } else {
      btn.classList.remove('is-disabled-future');
      btn.removeAttribute('title');
    }
  });

  minutesWheel.querySelectorAll('.time-wheel-item').forEach(btn => {
    const val = parseInt(btn.dataset.val, 10);
    if (isToday && _timePickerHour === maxH && val > maxM) {
      btn.classList.add('is-disabled-future');
      btn.setAttribute('title', 'Minuto futuro não permitido');
    } else {
      btn.classList.remove('is-disabled-future');
      btn.removeAttribute('title');
    }
  });
}

function scrollToTimeWheel(wheelEl, index) {
  const items = wheelEl.querySelectorAll('.time-wheel-item');
  const target = items[index];
  if (target) {
    const targetScroll = target.offsetTop - (wheelEl.clientHeight / 2) + (target.clientHeight / 2);
    wheelEl.scrollTo({ top: targetScroll, behavior: 'smooth' });
  }
}

function setTimeWheelValues(h, m) {
  const hoursWheel = document.getElementById('time-wheel-hours');
  const minutesWheel = document.getElementById('time-wheel-minutes');
  if (hoursWheel) scrollToTimeWheel(hoursWheel, h);
  if (minutesWheel) scrollToTimeWheel(minutesWheel, m);
}

function updateTimeWheelActiveItem(wheelEl, onSelect) {
  const items = wheelEl.querySelectorAll('.time-wheel-item');
  const center = wheelEl.scrollTop + (wheelEl.clientHeight / 2);
  let closest = null;
  let minDiff = Infinity;

  items.forEach(item => {
    const itemCenter = item.offsetTop + (item.clientHeight / 2);
    const diff = Math.abs(itemCenter - center);
    if (diff < minDiff) {
      minDiff = diff;
      closest = item;
    }
  });

  if (closest) {
    items.forEach(it => it.classList.remove('active'));
    closest.classList.add('active');
    const val = parseInt(closest.dataset.val, 10);
    if (!isNaN(val) && onSelect) {
      onSelect(val);
    }
  }
}

function updateTimePickerDisplay() {
  const displayEl = document.getElementById('time-picker-display');
  if (!displayEl) return;
  if (_timePickerIsCleared) {
    displayEl.textContent = '--:--';
  } else {
    const hStr = String(_timePickerHour).padStart(2, '0');
    const mStr = String(_timePickerMinute).padStart(2, '0');
    displayEl.textContent = `${hStr}:${mStr}`;
  }
}

function openTimePicker(fieldKey, fieldTitle) {
  _timePickerActiveField = fieldKey;
  const titleEl = document.getElementById('time-picker-title');
  if (titleEl) titleEl.textContent = fieldTitle || 'Selecionar Horário';

  const dateInput = document.getElementById('timesheet-date-input');
  const todayStr = getTodayDateString();
  const isToday = !dateInput || dateInput.value === todayStr;
  const now = new Date();
  const nowH = now.getHours();
  const nowM = now.getMinutes();
  const currentTotalMinutes = nowH * 60 + nowM;

  const currentVal = state.tempTimesheetTimes[fieldKey] || '';
  if (currentVal && currentVal.includes(':')) {
    const parts = currentVal.split(':').map(Number);
    let h = isNaN(parts[0]) ? 8 : parts[0];
    let m = isNaN(parts[1]) ? 0 : parts[1];
    if (isToday && (h * 60 + m > currentTotalMinutes)) {
      h = nowH;
      m = nowM;
    }
    _timePickerHour = h;
    _timePickerMinute = m;
    _timePickerIsCleared = false;
  } else {
    if (isToday) {
      if (fieldKey === 'start') {
        _timePickerHour = Math.min(8, nowH);
        _timePickerMinute = 0;
      } else if (fieldKey === 'breakStart') {
        _timePickerHour = Math.min(12, nowH);
        _timePickerMinute = 0;
      } else if (fieldKey === 'breakEnd') {
        _timePickerHour = Math.min(13, nowH);
        _timePickerMinute = 0;
      } else if (fieldKey === 'end') {
        _timePickerHour = nowH;
        _timePickerMinute = Math.floor(nowM / 5) * 5;
      } else {
        _timePickerHour = nowH;
        _timePickerMinute = nowM;
      }
    } else {
      if (fieldKey === 'start') {
        _timePickerHour = 8; _timePickerMinute = 0;
      } else if (fieldKey === 'breakStart') {
        _timePickerHour = 12; _timePickerMinute = 0;
      } else if (fieldKey === 'breakEnd') {
        _timePickerHour = 13; _timePickerMinute = 0;
      } else if (fieldKey === 'end') {
        _timePickerHour = 16; _timePickerMinute = 30;
      } else {
        _timePickerHour = 8; _timePickerMinute = 0;
      }
    }
    _timePickerIsCleared = !currentVal;
  }

  updateTimePickerDisplay();
  applyTimePickerFutureRestrictions(isToday, nowH, nowM);

  const modal = document.getElementById('modal-time-picker');
  if (modal) modal.classList.add('active');

  setTimeout(() => {
    setTimeWheelValues(_timePickerHour, _timePickerMinute);
  }, 120);
}

function closeTimePicker() {
  document.getElementById('modal-time-picker')?.classList.remove('active');
}

// Modal de Visualização de Detalhes da Compra e Comprovante / Nota Fiscal
function openViewPurchaseModal(purchaseId) {
  const purchase = state.data.purchases.find(p => p.id === purchaseId);
  if (!purchase) return;

  const modal = document.getElementById('modal-view-purchase');
  if (!modal) return;

  // Imóvel Badge
  const propBadge = document.getElementById('view-purchase-prop-badge');
  if (propBadge) {
    propBadge.textContent = purchase.propertyId;
    propBadge.setAttribute('data-prop', purchase.propertyId);
    propBadge.className = `prop-badge-small prop-badge-${(purchase.propertyId || '').toLowerCase()}`;
  }

  // Valor Total
  const costEl = document.getElementById('view-purchase-total-val');
  if (costEl) costEl.textContent = formatMoney(purchase.totalCost);

  // Data formatada
  const dateEl = document.getElementById('view-purchase-date-txt');
  if (dateEl) dateEl.textContent = formatDate(purchase.purchaseDate);

  // Comprador
  const buyerEl = document.getElementById('view-purchase-buyer-txt');
  if (buyerEl) {
    const roleLabel = purchase.buyerType === 'owner' ? 'Proprietário' : 'Equipe';
    const buyerObj = (state.data.staff || []).find(s => s.id === purchase.buyerStaffId || s.name === purchase.buyerName);
    const buyerPhoto = purchase.buyerPhoto || buyerObj?.photo || (purchase.buyerName === 'Gestor' ? (state.data.ownerProfile?.photo || OWNER_PROFILE.photo) : null);
    buyerEl.innerHTML = `
      <span style="display: inline-flex; align-items: center; gap: 6px;">
        ${buyerPhoto ? `<img src="${buyerPhoto}" class="purchase-buyer-img" alt="" style="width: 18px; height: 18px; border-radius: 50%; object-fit: cover;">` : ''}
        <span>${escapeHtml(purchase.buyerName)} (${roleLabel})</span>
      </span>
    `;
  }

  // Nome do Imóvel
  const propEl = document.getElementById('view-purchase-property-txt');
  if (propEl) {
    const propNames = {
      JB: 'Jardim Botânico (JB)',
      VN: 'Vila Nova (VN)',
      HN: 'Horta Nova (HN)'
    };
    propEl.textContent = propNames[purchase.propertyId] || purchase.propertyId;
  }

  // Quantidade Total
  const unitsEl = document.getElementById('view-purchase-units-txt');
  if (unitsEl) unitsEl.textContent = `+${purchase.quantityBought || 1} unidades`;

  // Itens comprados
  const itemsContainer = document.getElementById('view-purchase-items-list');
  if (itemsContainer) {
    const items = (purchase.items && Array.isArray(purchase.items) && purchase.items.length > 0)
      ? purchase.items
      : [{
          catalogId: purchase.productId || 'p01',
          productName: purchase.productName || 'Produto',
          productPhoto: purchase.productPhoto || '',
          quantity: purchase.quantityBought || 1
        }];

    itemsContainer.innerHTML = items.map(item => `
      <div class="view-purchase-item-row">
        <div style="display: flex; align-items: center; gap: 9px; min-width: 0; flex: 1;">
          ${item.productPhoto
            ? `<img src="${item.productPhoto}" class="view-purchase-item-thumb" alt="${item.productName}">`
            : `<div class="view-purchase-item-thumb" style="background: #F1F5F9; display: flex; align-items: center; justify-content: center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/></svg>
              </div>`
          }
          <div class="view-purchase-item-info">
            <h5 class="view-purchase-item-name">${item.productName}</h5>
          </div>
        </div>
        <span class="view-purchase-item-qty">+${item.quantity} un</span>
      </div>
    `).join('');
  }

  // Observações
  const notesContainer = document.getElementById('view-purchase-notes-sec');
  const notesText = document.getElementById('view-purchase-notes-txt');
  if (notesContainer && notesText) {
    if (purchase.notes && purchase.notes.trim() !== '') {
      notesText.textContent = purchase.notes;
      notesContainer.style.display = 'block';
    } else {
      notesContainer.style.display = 'none';
    }
  }

  // Comprovante / Nota Fiscal
  const receiptContainer = document.getElementById('view-purchase-receipt-container');
  if (receiptContainer) {
    if (purchase.receiptPhoto) {
      receiptContainer.innerHTML = `
        <div class="receipt-preview-card">
          <img src="${purchase.receiptPhoto}" class="receipt-preview-thumb" id="view-purchase-receipt-img" alt="Comprovante / Nota Fiscal">
          <button type="button" class="btn-zoom-receipt" id="btn-zoom-purchase-receipt">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/>
            </svg>
            <span>Ampliar Nota Fiscal (Tela Cheia)</span>
          </button>
        </div>
      `;

      const openReceiptZoom = () => {
        openZoomModal(
          purchase.receiptPhoto,
          `Nota Fiscal • Imóvel ${purchase.propertyId}`,
          `Compra realizada em ${formatDate(purchase.purchaseDate)} por ${purchase.buyerName} — Total: ${formatMoney(purchase.totalCost)}`
        );
      };

      document.getElementById('btn-zoom-purchase-receipt')?.addEventListener('click', openReceiptZoom);
      document.getElementById('view-purchase-receipt-img')?.addEventListener('click', openReceiptZoom);
    } else {
      receiptContainer.innerHTML = `
        <div class="no-receipt-box">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="flex-shrink: 0;">
            <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 9h6"/><path d="M9 13h6"/><path d="M9 17h4"/>
          </svg>
          <div>
            <strong style="display: block; color: var(--text-main); font-size: 0.80rem; margin-bottom: 2px;">Sem comprovante anexado</strong>
            Esta compra foi registrada sem anexo de foto do recibo ou nota fiscal.
          </div>
        </div>
      `;
    }
  }

  modal.style.display = 'flex';
  modal.classList.add('active');
}

function closeViewPurchaseModal() {
  const modal = document.getElementById('modal-view-purchase');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      if (!modal.classList.contains('active')) {
        modal.style.display = 'none';
      }
    }, 320);
  }
}

window.openViewPurchaseModal = openViewPurchaseModal;
window.closeViewPurchaseModal = closeViewPurchaseModal;

// Compartilhar Resumo Financeiro no WhatsApp (respeita o filtro de período selecionado)
function copyFinancialReportToWhatsApp() {
  const filteredPurchases = filterPurchasesByDate(
    state.data.purchases,
    state.purchaseDateFilter,
    state.purchaseSelectedMonth
  );

  let totalConsolidado = 0;
  let totalJB = 0;
  let totalVN = 0;
  let totalHN = 0;

  filteredPurchases.forEach(p => {
    const cost = Number(p.totalCost) || 0;
    totalConsolidado += cost;
    if (p.propertyId === 'JB') totalJB += cost;
    if (p.propertyId === 'VN') totalVN += cost;
    if (p.propertyId === 'HN') totalHN += cost;
  });

  const filterNames = {
    todos: 'Histórico Geral',
    hoje: 'Hoje',
    ontem: 'Ontem',
    semana: 'Esta Semana',
    este_mes: 'Este Mês',
    mes_especifico: state.purchaseSelectedMonth || 'Mês Selecionado'
  };

  const periodLabel = filterNames[state.purchaseDateFilter] || 'Período Selecionado';

  const text = `RELATÓRIO FINANCEIRO • AIRBNB CONTROL
Período: ${periodLabel}
Data de emissão: ${new Date().toLocaleDateString('pt-BR')}

Gastos por Apartamento:
• JB: ${formatMoney(totalJB)}
• VN: ${formatMoney(totalVN)}
• HN: ${formatMoney(totalHN)}

TOTAL CONSOLIDADO: ${formatMoney(totalConsolidado)} (${filteredPurchases.length} compras)

Prestação de contas gerada pelo sistema de gestão Airbnb.`;

  navigator.clipboard.writeText(text).then(() => {
    showToast(`Relatório (${periodLabel}) copiado para a área de transferência.`);
  }).catch(() => {
    showPromptDialog({
      title: 'Copiar Relatório',
      message: 'Seu navegador não permitiu cópia automática. Copie o texto abaixo:',
      defaultValue: text,
      confirmText: 'Fechar'
    });
  });
}

// ==========================================================================
// COMPARTILHAR LISTA DE REPOSIÇÃO (PRODUTOS EM FALTA) NO WHATSAPP
// Filtrada pelo Airbnb selecionado (JB, VN, HN) ou todos se 'ALL' selecionado
// ==========================================================================

function generateWhatsAppShortagesMessage() {
  const products = state.data.products || [];
  const selectedProp = state.selectedProperty || 'JB';
  const isAll = selectedProp === 'ALL';

  // Filtra os produtos pelo Airbnb selecionado
  const targetProducts = isAll
    ? products
    : products.filter(p => p.propertyId === selectedProp);

  const missingProducts = targetProducts.filter(p => p.status === 'falta');

  if (missingProducts.length === 0) {
    return null;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  let text = '';

  if (!isAll) {
    // Lista exclusiva do Airbnb selecionado
    text += `🛒 *LISTA DE REPOSIÇÃO - AIRBNB ${selectedProp}*\n`;
    text += `📅 *Data:* ${dateStr} às ${timeStr}\n`;
    text += `⚠️ *Total em falta:* ${missingProducts.length} ${missingProducts.length === 1 ? 'item' : 'itens'}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    missingProducts.forEach(it => {
      const brandStr = it.brand ? ` (${it.brand})` : '';
      const qtyStr = `${it.quantity || 0} ${it.unit || 'un'}`;
      text += `• *${it.name}*${brandStr} — Estoque: ${qtyStr}\n`;
      if (it.note && String(it.note).trim() !== '') {
        text += `  ↳ _Obs: ${it.note.trim()}_\n`;
      }
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📲 _Gerado via Airbnb Control_`;
  } else {
    // Caso 'ALL' esteja selecionado: agrupa todos os Airbnbs com itens em falta
    let propertyOrder = (state.data.properties || []).map(pr => pr.id);
    if (!propertyOrder || propertyOrder.length === 0) {
      propertyOrder = ['JB', 'VN', 'HN'];
    }

    const grouped = {};
    propertyOrder.forEach(propId => {
      grouped[propId] = [];
    });

    missingProducts.forEach(item => {
      const propId = item.propertyId || 'Outro';
      if (!grouped[propId]) grouped[propId] = [];
      grouped[propId].push(item);
    });

    text += `🛒 *LISTA DE REPOSIÇÃO - TODOS OS AIRBNBS*\n`;
    text += `📅 *Data:* ${dateStr} às ${timeStr}\n`;
    text += `⚠️ *Total em falta:* ${missingProducts.length} ${missingProducts.length === 1 ? 'item' : 'itens'}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    propertyOrder.forEach(propId => {
      const items = grouped[propId] || [];
      if (items.length > 0) {
        text += `🏠 *AIRBNB ${propId}* (${items.length} ${items.length === 1 ? 'item' : 'itens'} em falta)\n`;
        items.forEach(it => {
          const brandStr = it.brand ? ` (${it.brand})` : '';
          const qtyStr = `${it.quantity || 0} ${it.unit || 'un'}`;
          text += `• *${it.name}*${brandStr} — Estoque: ${qtyStr}\n`;
          if (it.note && String(it.note).trim() !== '') {
            text += `  ↳ _Obs: ${it.note.trim()}_\n`;
          }
        });
        text += `\n`;
      } else {
        text += `🏠 *AIRBNB ${propId}* — ✅ Estoque abastecido (nada em falta)\n\n`;
      }
    });

    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📲 _Gerado via Airbnb Control_`;
  }

  return { text, totalCount: missingProducts.length, propertyId: selectedProp };
}

function shareShortagesToWhatsApp() {
  const selectedProp = state.selectedProperty || 'JB';
  const result = generateWhatsAppShortagesMessage();
  if (!result || result.totalCount === 0) {
    showToast(selectedProp === 'ALL'
      ? 'Nenhum produto em falta no estoque geral.'
      : `Nenhum produto em falta no Airbnb ${selectedProp}.`
    );
    return;
  }

  const text = result.text;
  const encodedText = encodeURIComponent(text);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  const propLabel = selectedProp === 'ALL' ? 'Todos os Airbnbs' : `Airbnb ${selectedProp}`;

  // Copia o texto para a área de transferência
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Lista (${propLabel} - ${result.totalCount} itens) copiada! Abrindo WhatsApp...`);
      window.open(whatsappUrl, '_blank');
    }).catch(() => {
      window.open(whatsappUrl, '_blank');
    });
  } else {
    window.open(whatsappUrl, '_blank');
  }
}

function updateWhatsappShortageButton() {
  const btn = document.getElementById('btn-share-whatsapp-shortages');
  const badge = document.getElementById('whatsapp-shortage-badge');
  if (!btn) return;

  const products = state.data.products || [];
  const selectedProp = state.selectedProperty || 'JB';
  const isAll = selectedProp === 'ALL';

  // Filtra itens em falta para o imóvel atualmente selecionado
  const targetProducts = isAll
    ? products
    : products.filter(p => p.propertyId === selectedProp);

  const missing = targetProducts.filter(p => p.status === 'falta');
  const count = missing.length;

  if (count > 0) {
    btn.style.display = 'inline-flex';
    btn.title = isAll
      ? `Compartilhar lista de falta no WhatsApp (Geral - ${count} itens)`
      : `Compartilhar lista de falta no WhatsApp (Airbnb ${selectedProp} - ${count} itens)`;
    if (badge) {
      badge.textContent = count;
    }
  } else {
    btn.style.display = 'none';
  }
}

// ==========================================================================
// CONTROLES DE FORMULÁRIO PERSONALIZADOS (CUSTOM SELECT & CUSTOM DATE PICKER)
// Elimina 100% dos elementos e seletores padrões do navegador/sistema
// ==========================================================================

const chevronSvgIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
const chevronLeftSvgIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`;
const chevronRightSvgIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;
const checkSvgIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const searchSvgIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;
const calendarSvgIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`;
const clockSvgIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

function getCustomOptionMeta(select, opt) {
  const val = opt.value;
  const label = opt.text;

  // Seletor de Mês Específico na Prestação de Contas
  if (select.id === 'purchase-month-select') {
    return {
      thumb: '',
      badge: '',
      badgeClass: '',
      title: label || 'Todos os meses...',
      sub: ''
    };
  }

  // Produto em compra
  if (select.id === 'purchase-product-select' || select.classList.contains('purchase-item-product-select') || (select.id && select.id.startsWith('purchase-product-select'))) {
    const product = PRODUCT_CATALOG.find(p => p.id === val);
    if (product) {
      return {
        thumb: product.photo || '',
        badge: '',
        badgeClass: '',
        title: product.name,
        sub: (product.brand ? product.brand + ' • ' : '') + (product.categoryLabel || product.category || '')
      };
    }
  }

  // Imóveis
  if (select.id === 'purchase-property-select' || select.id === 'new-product-property' || select.id === 'event-property-select') {
    let badge = val;
    let badgeClass = `badge-${val.toLowerCase()}`;
    let title = label;
    if (val === 'ALL') {
      badge = 'TODOS';
      badgeClass = 'badge-jb';
    } else if (val === 'CURRENT') {
      badge = 'ATUAL';
      badgeClass = 'badge-jb';
    }
    return { thumb: '', badge, badgeClass, title, sub: '' };
  }


  // Tipo de Evento
  if (select.id === 'event-type-select') {
    return { thumb: '', badge: label, badgeClass: 'badge-jb', title: '', sub: '' };
  }

  // Staff
  if (select.id === 'event-staff-select') {
    const initials = label.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return { thumb: '', badge: initials, badgeClass: 'badge-vn', title: label, sub: 'Equipe Operacional' };
  }

  // Categoria
  if (select.id === 'new-product-category') {
    return { thumb: '', badge: '', badgeClass: '', title: label, sub: '' };
  }

  return { thumb: '', badge: '', badgeClass: '', title: label, sub: '' };
}

function renderCustomSelectContent(select, wrapper) {
  const options = Array.from(select.options);
  const selectedIndex = select.selectedIndex >= 0 ? select.selectedIndex : 0;
  const currentOption = options[selectedIndex] || options[0];
  const meta = currentOption ? getCustomOptionMeta(select, currentOption) : { thumb: '', badge: '', badgeClass: '', title: '', sub: '' };

  const hasSearch = options.length >= 6;

  wrapper.innerHTML = `
    <button type="button" class="custom-select-trigger" id="${select.id}-trigger" aria-haspopup="listbox" aria-expanded="false">
      <div class="custom-select-trigger-content">
        ${meta.thumb ? `<img src="${meta.thumb}" class="custom-select-trigger-thumb" alt="">` : ''}
        ${meta.badge ? `<span class="custom-select-trigger-badge ${meta.badgeClass || ''}">${meta.badge}</span>` : ''}
        ${meta.title ? `<span class="custom-select-trigger-text">${meta.title}</span>` : (!meta.badge ? `<span class="custom-select-trigger-text">Selecione...</span>` : '')}
      </div>
      <span class="custom-select-chevron">${chevronSvgIcon}</span>
    </button>
    <div class="custom-select-dropdown" role="listbox">
      ${hasSearch ? `
        <div class="custom-select-search-wrap">
          <span class="custom-select-search-icon">${searchSvgIcon}</span>
          <input type="text" class="custom-select-search" placeholder="Buscar opção..." autocomplete="off">
        </div>
      ` : ''}
      <div class="custom-select-options-list">
        ${options.map(opt => {
          const optMeta = getCustomOptionMeta(select, opt);
          const isSelected = opt.value === select.value;
          return `
            <div class="custom-select-option ${isSelected ? 'selected' : ''}" data-value="${opt.value}" role="option" aria-selected="${isSelected}">
              <div class="custom-select-option-main">
                ${optMeta.thumb ? `<img src="${optMeta.thumb}" class="custom-select-option-thumb" alt="">` : ''}
                ${optMeta.badge ? `<span class="custom-select-option-badge ${optMeta.badgeClass || ''}">${optMeta.badge}</span>` : ''}
                ${(optMeta.title || optMeta.sub) ? `
                <div class="custom-select-option-info">
                  ${optMeta.title ? `<span class="custom-select-option-title">${optMeta.title}</span>` : ''}
                  ${optMeta.sub ? `<span class="custom-select-option-sub">${optMeta.sub}</span>` : ''}
                </div>
                ` : ''}
              </div>
              <span class="custom-select-option-check">${checkSvgIcon}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  const trigger = wrapper.querySelector('.custom-select-trigger');
  const searchInput = wrapper.querySelector('.custom-select-search');
  const optionsList = wrapper.querySelector('.custom-select-options-list');
  const optionEls = wrapper.querySelectorAll('.custom-select-option');

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = wrapper.classList.contains('open');
    closeAllCustomControls();
    if (!isOpen) {
      wrapper.classList.add('open');
      const formGroup = wrapper.closest('.form-group');
      if (formGroup) formGroup.classList.add('has-open-dropdown');
      trigger.setAttribute('aria-expanded', 'true');
      if (searchInput) {
        searchInput.value = '';
        filterOptions('');
        setTimeout(() => searchInput.focus(), 80);
      }
      setTimeout(() => {
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterOptions(e.target.value);
    });
    searchInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  function filterOptions(query) {
    const q = query.toLowerCase().trim();
    let hasMatch = false;
    optionEls.forEach(el => {
      const text = el.textContent.toLowerCase();
      if (!q || text.includes(q)) {
        el.style.display = 'flex';
        hasMatch = true;
      } else {
        el.style.display = 'none';
      }
    });

    let emptyEl = optionsList.querySelector('.custom-select-empty');
    if (!hasMatch) {
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.className = 'custom-select-empty';
        emptyEl.textContent = 'Nenhuma opção encontrada.';
        optionsList.appendChild(emptyEl);
      }
    } else if (emptyEl) {
      emptyEl.remove();
    }
  }

  optionEls.forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = el.dataset.value;
      select.value = val;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      syncCustomSelect(select);
      closeAllCustomControls();
    });
  });
}

function initCustomSelect(select) {
  if (!select) return;
  select.classList.add('native-control-hidden');

  let wrapper = select.nextElementSibling;
  const isWrapperExisting = wrapper && wrapper.classList.contains('custom-select-wrapper');

  if (!isWrapperExisting) {
    wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    wrapper.id = `${select.id}-custom-wrapper`;
    wrapper.dataset.targetId = select.id;
    select.parentNode.insertBefore(wrapper, select.nextSibling);
  }

  renderCustomSelectContent(select, wrapper);

  // Listener para sincronização automática caso código externo altere select.value
  select.addEventListener('change', () => {
    syncCustomSelect(select);
  });
}

function syncCustomSelect(target) {
  const select = typeof target === 'string' ? document.getElementById(target) : target;
  if (!select) return;
  const wrapper = select.nextElementSibling && select.nextElementSibling.classList.contains('custom-select-wrapper')
    ? select.nextElementSibling
    : null;

  if (!wrapper) {
    initCustomSelect(select);
    return;
  }

  const currentOptionsCount = select.options.length;
  const renderedOptionsCount = wrapper.querySelectorAll('.custom-select-option').length;

  if (currentOptionsCount !== renderedOptionsCount) {
    renderCustomSelectContent(select, wrapper);
    return;
  }

  const selectedIndex = select.selectedIndex >= 0 ? select.selectedIndex : 0;
  const currentOption = select.options[selectedIndex] || select.options[0];
  const meta = currentOption ? getCustomOptionMeta(select, currentOption) : { thumb: '', badge: '', badgeClass: '', title: '', sub: '' };

  const triggerContent = wrapper.querySelector('.custom-select-trigger-content');
  if (triggerContent) {
    triggerContent.innerHTML = `
      ${meta.thumb ? `<img src="${meta.thumb}" class="custom-select-trigger-thumb" alt="">` : ''}
      ${meta.badge ? `<span class="custom-select-trigger-badge ${meta.badgeClass || ''}">${meta.badge}</span>` : ''}
      ${meta.title ? `<span class="custom-select-trigger-text">${meta.title}</span>` : (!meta.badge ? `<span class="custom-select-trigger-text">Selecione...</span>` : '')}
    `;
  }

  const optionEls = wrapper.querySelectorAll('.custom-select-option');
  optionEls.forEach(el => {
    const isSelected = el.dataset.value === select.value;
    el.classList.toggle('selected', isSelected);
    el.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });
}

function getFormattedDateInfo(dateStr) {
  if (!dateStr) {
    const now = new Date();
    dateStr = now.toISOString().split('T')[0];
  }
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  const targetDate = new Date(y, m, d);
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  let badge = '';
  if (targetDate.getTime() === todayDate.getTime()) {
    badge = 'Hoje';
  } else if (targetDate.getTime() === yesterdayDate.getTime()) {
    badge = 'Ontem';
  } else if (targetDate.getTime() === tomorrowDate.getTime()) {
    badge = 'Amanhã';
  }

  const dPadded = String(d).padStart(2, '0');
  const mPadded = String(m + 1).padStart(2, '0');
  const formattedShort = `${dPadded}/${mPadded}/${y}`;

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return {
    raw: dateStr,
    year: y,
    month: m,
    day: d,
    badge,
    formattedShort,
    monthName: monthNames[m],
    formattedLong: `${dPadded} de ${monthNames[m]} de ${y}`
  };
}

function renderDatePickerGrid(input, wrapper, year, month) {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const titleEl = wrapper.querySelector('.custom-date-month-title');
  if (titleEl) {
    titleEl.textContent = `${monthNames[month]} ${year}`;
  }

  const grid = wrapper.querySelector('.custom-date-days-grid');
  if (!grid) return;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const selectedIso = input.value;
  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];

  let html = '';

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDay = daysInPrevMonth - i;
    html += `<button type="button" class="custom-date-day-btn other-month" tabindex="-1">${prevDay}</button>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dPad = String(d).padStart(2, '0');
    const mPad = String(month + 1).padStart(2, '0');
    const isoDate = `${year}-${mPad}-${dPad}`;

    const isSelected = isoDate === selectedIso;
    const isToday = isoDate === todayIso;

    html += `
      <button type="button" 
        class="custom-date-day-btn ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" 
        data-date="${isoDate}">
        ${d}
      </button>
    `;
  }

  const totalSlots = firstDayIndex + daysInMonth;
  const remaining = totalSlots <= 35 ? 35 - totalSlots : 42 - totalSlots;
  for (let n = 1; n <= remaining; n++) {
    html += `<button type="button" class="custom-date-day-btn other-month" tabindex="-1">${n}</button>`;
  }

  grid.innerHTML = html;

  grid.querySelectorAll('.custom-date-day-btn:not(.other-month)').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dateVal = btn.dataset.date;
      input.value = dateVal;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      syncCustomDatePicker(input);
      closeAllCustomControls();
    });
  });
}

function renderCustomDatePickerContent(input, wrapper) {
  if (!input.value) {
    input.value = new Date().toISOString().split('T')[0];
  }

  const dateInfo = getFormattedDateInfo(input.value);
  wrapper.dataset.viewYear = dateInfo.year;
  wrapper.dataset.viewMonth = dateInfo.month;

  const isEventForm = input.id === 'event-date-input';

  wrapper.innerHTML = `
    <button type="button" class="custom-date-trigger" id="${input.id}-trigger" aria-haspopup="dialog" aria-expanded="false">
      <div class="custom-date-trigger-content">
        <span class="custom-date-icon-box">${calendarSvgIcon}</span>
        <div class="custom-date-text-wrap">
          <span class="custom-date-val">${dateInfo.formattedShort}</span>
          ${dateInfo.badge ? `<span class="custom-date-badge">${dateInfo.badge}</span>` : ''}
        </div>
      </div>
      <span class="custom-select-chevron">${chevronSvgIcon}</span>
    </button>
    <div class="custom-date-popover" role="dialog" aria-label="Seletor de Data">
      <div class="custom-date-chips">
        <button type="button" class="custom-date-chip ${dateInfo.badge === 'Hoje' ? 'active' : ''}" data-action="today">Hoje</button>
        <button type="button" class="custom-date-chip ${dateInfo.badge === 'Ontem' ? 'active' : ''}" data-action="yesterday">Ontem</button>
        <button type="button" class="custom-date-chip ${dateInfo.badge === (isEventForm ? 'Amanhã' : '') ? 'active' : ''}" data-action="${isEventForm ? 'tomorrow' : 'day-before'}">
          ${isEventForm ? 'Amanhã' : 'Anteontem'}
        </button>
      </div>
      <div class="custom-date-header">
        <button type="button" class="custom-date-nav-btn" data-dir="prev" aria-label="Mês Anterior">‹</button>
        <span class="custom-date-month-title">${dateInfo.monthName} ${dateInfo.year}</span>
        <button type="button" class="custom-date-nav-btn" data-dir="next" aria-label="Próximo Mês">›</button>
      </div>
      <div class="custom-date-weekdays">
        <span>DOM</span><span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SÁB</span>
      </div>
      <div class="custom-date-days-grid"></div>
    </div>
  `;

  renderDatePickerGrid(input, wrapper, dateInfo.year, dateInfo.month);

  const trigger = wrapper.querySelector('.custom-date-trigger');
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = wrapper.classList.contains('open');
    closeAllCustomControls();
    if (!isOpen) {
      wrapper.classList.add('open');
      const formGroup = wrapper.closest('.form-group');
      if (formGroup) formGroup.classList.add('has-open-dropdown');
      trigger.setAttribute('aria-expanded', 'true');
      setTimeout(() => {
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  });

  const prevBtn = wrapper.querySelector('[data-dir="prev"]');
  const nextBtn = wrapper.querySelector('[data-dir="next"]');
  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    let y = parseInt(wrapper.dataset.viewYear, 10);
    let m = parseInt(wrapper.dataset.viewMonth, 10) - 1;
    if (m < 0) { m = 11; y--; }
    wrapper.dataset.viewYear = y;
    wrapper.dataset.viewMonth = m;
    renderDatePickerGrid(input, wrapper, y, m);
  });
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    let y = parseInt(wrapper.dataset.viewYear, 10);
    let m = parseInt(wrapper.dataset.viewMonth, 10) + 1;
    if (m > 11) { m = 0; y++; }
    wrapper.dataset.viewYear = y;
    wrapper.dataset.viewMonth = m;
    renderDatePickerGrid(input, wrapper, y, m);
  });

  const chips = wrapper.querySelectorAll('.custom-date-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = chip.dataset.action;
      const targetDate = new Date();
      if (action === 'yesterday') {
        targetDate.setDate(targetDate.getDate() - 1);
      } else if (action === 'tomorrow') {
        targetDate.setDate(targetDate.getDate() + 1);
      } else if (action === 'day-before') {
        targetDate.setDate(targetDate.getDate() - 2);
      }
      const iso = targetDate.toISOString().split('T')[0];
      input.value = iso;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      syncCustomDatePicker(input);
      closeAllCustomControls();
    });
  });
}

function initCustomDatePicker(input) {
  if (!input) return;
  input.classList.add('native-control-hidden');

  let wrapper = input.nextElementSibling;
  const isWrapperExisting = wrapper && wrapper.classList.contains('custom-date-wrapper');

  if (!isWrapperExisting) {
    wrapper = document.createElement('div');
    wrapper.className = 'custom-date-wrapper';
    wrapper.id = `${input.id}-custom-wrapper`;
    wrapper.dataset.targetId = input.id;
    input.parentNode.insertBefore(wrapper, input.nextSibling);
  }

  renderCustomDatePickerContent(input, wrapper);

  input.addEventListener('change', () => {
    syncCustomDatePicker(input);
  });
}

function syncCustomDatePicker(target) {
  const input = typeof target === 'string' ? document.getElementById(target) : target;
  if (!input) return;

  const wrapper = input.nextElementSibling && input.nextElementSibling.classList.contains('custom-date-wrapper')
    ? input.nextElementSibling
    : null;

  if (!wrapper) {
    initCustomDatePicker(input);
    return;
  }

  if (!input.value) {
    input.value = new Date().toISOString().split('T')[0];
  }

  const dateInfo = getFormattedDateInfo(input.value);
  wrapper.dataset.viewYear = dateInfo.year;
  wrapper.dataset.viewMonth = dateInfo.month;

  const trigger = wrapper.querySelector('.custom-date-trigger');
  if (trigger) {
    const valEl = trigger.querySelector('.custom-date-val');
    const badgeWrap = trigger.querySelector('.custom-date-text-wrap');
    if (valEl) valEl.textContent = dateInfo.formattedShort;
    if (badgeWrap) {
      let badgeEl = badgeWrap.querySelector('.custom-date-badge');
      if (dateInfo.badge) {
        if (!badgeEl) {
          badgeEl = document.createElement('span');
          badgeEl.className = 'custom-date-badge';
          badgeWrap.appendChild(badgeEl);
        }
        badgeEl.textContent = dateInfo.badge;
      } else if (badgeEl) {
        badgeEl.remove();
      }
    }
  }

  const isEventForm = input.id === 'event-date-input';
  wrapper.querySelectorAll('.custom-date-chip').forEach(chip => {
    const act = chip.dataset.action;
    const isActive = (act === 'today' && dateInfo.badge === 'Hoje') ||
                     (act === 'yesterday' && dateInfo.badge === 'Ontem') ||
                     (act === 'tomorrow' && dateInfo.badge === 'Amanhã');
    chip.classList.toggle('active', isActive);
  });

  renderDatePickerGrid(input, wrapper, dateInfo.year, dateInfo.month);
}

function getFormattedTimeInfo(timeStr) {
  let [hhStr, mmStr] = (timeStr || '11:00').split(':');
  let hh = parseInt(hhStr, 10);
  if (isNaN(hh)) hh = 11;
  let mm = parseInt(mmStr, 10);
  if (isNaN(mm)) mm = 0;
  const padH = String(hh).padStart(2, '0');
  const padM = String(mm).padStart(2, '0');
  let badge = 'Manhã';
  if (hh >= 12 && hh < 18) badge = 'Tarde';
  else if (hh >= 18 || hh < 6) badge = 'Noite';
  return {
    time: `${padH}:${padM}`,
    hour: padH,
    minute: padM,
    badge
  };
}

const COMMON_TIME_CHIPS = ['09:00', '10:00', '11:00', '11:30', '14:00', '15:00', '16:00', '18:00'];
const TIME_PICKER_HOURS = ['06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'];
const TIME_PICKER_MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

function renderCustomTimePickerContent(input, wrapper) {
  if (!input.value) {
    input.value = '11:00';
  }

  const timeInfo = getFormattedTimeInfo(input.value);

  const chipsHtml = COMMON_TIME_CHIPS.map(t => `
    <button type="button" class="custom-time-chip ${t === timeInfo.time ? 'active' : ''}" data-time="${t}">${t}</button>
  `).join('');

  const hoursHtml = TIME_PICKER_HOURS.map(h => `
    <button type="button" class="custom-time-item ${h === timeInfo.hour ? 'active' : ''}" data-hour="${h}">${h}h</button>
  `).join('');

  const minutesHtml = TIME_PICKER_MINUTES.map(m => `
    <button type="button" class="custom-time-item ${m === timeInfo.minute ? 'active' : ''}" data-minute="${m}">${m} min</button>
  `).join('');

  wrapper.innerHTML = `
    <button type="button" class="custom-time-trigger" id="${input.id}-trigger" aria-haspopup="dialog" aria-expanded="false">
      <div class="custom-time-trigger-content">
        <span class="custom-time-icon-box">${clockSvgIcon}</span>
        <div class="custom-time-text-wrap">
          <span class="custom-time-val">${timeInfo.time}</span>
          <span class="custom-time-badge">${timeInfo.badge}</span>
        </div>
      </div>
      <span class="custom-select-chevron">${chevronSvgIcon}</span>
    </button>
    <div class="custom-time-popover" role="dialog" aria-label="Seletor de Horário">
      <div class="custom-time-chips">
        ${chipsHtml}
      </div>
      <div class="custom-time-selector-wrap">
        <div class="custom-time-col">
          <span class="custom-time-col-header">Hora</span>
          <div class="custom-time-col-list custom-time-hours">
            ${hoursHtml}
          </div>
        </div>
        <div class="custom-time-sep">:</div>
        <div class="custom-time-col">
          <span class="custom-time-col-header">Minuto</span>
          <div class="custom-time-col-list custom-time-minutes">
            ${minutesHtml}
          </div>
        </div>
      </div>
      <div class="custom-time-footer">
        <div class="custom-time-summary">
          <span class="custom-time-summary-lbl">Início:</span>
          <strong class="custom-time-summary-val">${timeInfo.time}</strong>
        </div>
        <button type="button" class="custom-time-confirm-btn">Confirmar</button>
      </div>
    </div>
  `;

  const trigger = wrapper.querySelector('.custom-time-trigger');
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = wrapper.classList.contains('open');
    closeAllCustomControls();
    if (!isOpen) {
      wrapper.classList.add('open');
      const formGroup = wrapper.closest('.form-group');
      if (formGroup) formGroup.classList.add('has-open-dropdown');
      trigger.setAttribute('aria-expanded', 'true');
      setTimeout(() => {
        const activeHour = wrapper.querySelector('.custom-time-hours .custom-time-item.active');
        const activeMin = wrapper.querySelector('.custom-time-minutes .custom-time-item.active');
        if (activeHour) activeHour.scrollIntoView({ block: 'center' });
        if (activeMin) activeMin.scrollIntoView({ block: 'center' });
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  });

  // Quick Chips
  wrapper.querySelectorAll('.custom-time-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = chip.dataset.time;
      input.value = val;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      syncCustomTimePicker(input);
      closeAllCustomControls();
    });
  });

  // Horas
  wrapper.querySelectorAll('.custom-time-hours .custom-time-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = getFormattedTimeInfo(input.value);
      const newH = btn.dataset.hour;
      input.value = `${newH}:${current.minute}`;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      syncCustomTimePicker(input);
    });
  });

  // Minutos
  wrapper.querySelectorAll('.custom-time-minutes .custom-time-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = getFormattedTimeInfo(input.value);
      const newM = btn.dataset.minute;
      input.value = `${current.hour}:${newM}`;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      syncCustomTimePicker(input);
    });
  });

  // Botão Confirmar
  wrapper.querySelector('.custom-time-confirm-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllCustomControls();
  });
}

function initCustomTimePicker(input) {
  if (!input) return;
  input.classList.add('native-control-hidden');

  let wrapper = input.nextElementSibling;
  const isWrapperExisting = wrapper && wrapper.classList.contains('custom-time-wrapper');

  if (!isWrapperExisting) {
    wrapper = document.createElement('div');
    wrapper.className = 'custom-time-wrapper';
    wrapper.id = `${input.id}-custom-wrapper`;
    wrapper.dataset.targetId = input.id;
    input.parentNode.insertBefore(wrapper, input.nextSibling);
  }

  renderCustomTimePickerContent(input, wrapper);

  input.addEventListener('change', () => {
    syncCustomTimePicker(input);
  });
}

function syncCustomTimePicker(target) {
  const input = typeof target === 'string' ? document.getElementById(target) : target;
  if (!input) return;

  const wrapper = input.nextElementSibling && input.nextElementSibling.classList.contains('custom-time-wrapper')
    ? input.nextElementSibling
    : null;

  if (!wrapper) {
    initCustomTimePicker(input);
    return;
  }

  if (!input.value) {
    input.value = '11:00';
  }

  const timeInfo = getFormattedTimeInfo(input.value);

  const trigger = wrapper.querySelector('.custom-time-trigger');
  if (trigger) {
    const valEl = trigger.querySelector('.custom-time-val');
    const badgeEl = trigger.querySelector('.custom-time-badge');
    if (valEl) valEl.textContent = timeInfo.time;
    if (badgeEl) badgeEl.textContent = timeInfo.badge;
  }

  const summaryVal = wrapper.querySelector('.custom-time-summary-val');
  if (summaryVal) summaryVal.textContent = timeInfo.time;

  wrapper.querySelectorAll('.custom-time-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.time === timeInfo.time);
  });

  wrapper.querySelectorAll('.custom-time-hours .custom-time-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.hour === timeInfo.hour);
  });

  wrapper.querySelectorAll('.custom-time-minutes .custom-time-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.minute === timeInfo.minute);
  });
}

function closeAllCustomControls() {
  document.querySelectorAll('.custom-select-wrapper.open, .custom-date-wrapper.open, .custom-time-wrapper.open').forEach(w => {
    w.classList.remove('open');
    const trigger = w.querySelector('button[aria-expanded]');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
  document.querySelectorAll('.form-group.has-open-dropdown').forEach(g => {
    g.classList.remove('has-open-dropdown');
  });
}

function syncAllCustomControls() {
  document.querySelectorAll('select.form-input, #purchase-month-select').forEach(sel => syncCustomSelect(sel));
  document.querySelectorAll('input[type="date"].form-input').forEach(inp => syncCustomDatePicker(inp));
  document.querySelectorAll('input[type="time"].form-input').forEach(inp => syncCustomTimePicker(inp));
}

function initAllCustomControls() {
  document.querySelectorAll('select.form-input, #purchase-month-select').forEach(sel => initCustomSelect(sel));
  document.querySelectorAll('input[type="date"].form-input').forEach(inp => initCustomDatePicker(inp));
  document.querySelectorAll('input[type="time"].form-input').forEach(inp => initCustomTimePicker(inp));

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-wrapper') && !e.target.closest('.custom-date-wrapper') && !e.target.closest('.custom-time-wrapper')) {
      closeAllCustomControls();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllCustomControls();
    }
  });

  document.querySelectorAll('form').forEach(f => {
    f.addEventListener('reset', () => {
      setTimeout(() => {
        syncAllCustomControls();
      }, 50);
    });
  });
}

// ==========================================================================
// Modal de Registro de Compras (Mercado) - Sistema Multiprodutos
// ==========================================================================

// Itens dinâmicos presentes no cupom de compra
state.currentPurchaseItems = [
  { catalogId: 'p01', quantity: 2 }
];

function renderPurchaseItems() {
  const container = document.getElementById('purchase-items-container');
  const countBadge = document.getElementById('purchase-items-count-badge');
  if (!container) return;

  if (!state.currentPurchaseItems || state.currentPurchaseItems.length === 0) {
    state.currentPurchaseItems = [{ catalogId: PRODUCT_CATALOG[0]?.id || 'p01', quantity: 2 }];
  }

  if (countBadge) {
    const total = state.currentPurchaseItems.length;
    countBadge.textContent = total === 1 ? '1 item' : `${total} itens`;
  }

  container.innerHTML = state.currentPurchaseItems.map((item, idx) => {
    const isFirst = idx === 0;
    const canRemove = state.currentPurchaseItems.length > 1;
    const selectId = isFirst ? 'purchase-product-select' : `purchase-product-select-${idx}`;
    const qtyId = isFirst ? 'purchase-quantity-input' : `purchase-quantity-input-${idx}`;

    return `
      <div class="purchase-item-card purchase-item-row" data-index="${idx}">
        <div class="purchase-item-card-header">
          <span class="purchase-item-tag">Item ${idx + 1}</span>
          ${canRemove ? `
            <button type="button" class="btn-remove-purchase-item" data-remove-index="${idx}" title="Remover item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              <span>Remover</span>
            </button>
          ` : ''}
        </div>

        <select id="${selectId}" class="form-input purchase-item-product-select" data-index="${idx}" required>
          ${PRODUCT_CATALOG.map(p => `
            <option value="${p.id}" ${p.id === item.catalogId ? 'selected' : ''}>${p.name}</option>
          `).join('')}
        </select>

        <div class="purchase-item-stepper-wrap">
          <span class="purchase-stepper-label">Qtd Adicionada</span>
          <div class="purchase-stepper-controls">
            <button type="button" class="purchase-stepper-btn btn-step-minus" data-index="${idx}">–</button>
            <input type="number" id="${qtyId}" class="purchase-stepper-input purchase-item-qty-input" data-index="${idx}" min="1" step="1" value="${item.quantity}" required>
            <button type="button" class="purchase-stepper-btn btn-step-plus" data-index="${idx}">+</button>
            <span class="purchase-stepper-unit">un</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Inicializa o Custom Select para cada linha
  container.querySelectorAll('.purchase-item-product-select').forEach(sel => {
    initCustomSelect(sel);
    sel.addEventListener('change', () => {
      const idx = parseInt(sel.dataset.index, 10);
      if (state.currentPurchaseItems[idx]) {
        state.currentPurchaseItems[idx].catalogId = sel.value;
      }
    });
  });

  // Botões de remover produto
  container.querySelectorAll('.btn-remove-purchase-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.removeIndex, 10);
      if (state.currentPurchaseItems.length > 1) {
        state.currentPurchaseItems.splice(idx, 1);
        renderPurchaseItems();
      }
    });
  });

  // Stepper: diminuir
  container.querySelectorAll('.btn-step-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      const input = container.querySelector(`.purchase-item-qty-input[data-index="${idx}"]`);
      if (input && state.currentPurchaseItems[idx]) {
        let val = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
        input.value = val;
        state.currentPurchaseItems[idx].quantity = val;
      }
    });
  });

  // Stepper: aumentar
  container.querySelectorAll('.btn-step-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      const input = container.querySelector(`.purchase-item-qty-input[data-index="${idx}"]`);
      if (input && state.currentPurchaseItems[idx]) {
        let val = (parseInt(input.value, 10) || 1) + 1;
        input.value = val;
        state.currentPurchaseItems[idx].quantity = val;
      }
    });
  });

  // Input manual de quantidade
  container.querySelectorAll('.purchase-item-qty-input').forEach(input => {
    input.addEventListener('input', () => {
      const idx = parseInt(input.dataset.index, 10);
      let val = Math.max(1, parseInt(input.value, 10) || 1);
      if (state.currentPurchaseItems[idx]) {
        state.currentPurchaseItems[idx].quantity = val;
      }
    });
  });
}

function addPurchaseItem() {
  if (!state.currentPurchaseItems) state.currentPurchaseItems = [];
  const usedIds = new Set(state.currentPurchaseItems.map(i => i.catalogId));
  const nextItem = PRODUCT_CATALOG.find(p => !usedIds.has(p.id)) || PRODUCT_CATALOG[0];

  state.currentPurchaseItems.push({
    catalogId: nextItem.id,
    quantity: 1
  });

  renderPurchaseItems();

  setTimeout(() => {
    const container = document.getElementById('purchase-items-container');
    const lastCard = container?.lastElementChild;
    if (lastCard) {
      lastCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, 50);
}

function renderPurchaseProductOptions() {
  renderPurchaseItems();
}

function openPurchaseModalForProduct(productId, propertyId) {
  const selectProp = document.getElementById('purchase-property-select');
  const inputBuyer = document.getElementById('purchase-buyer-input');
  const inputDate = document.getElementById('purchase-date-input');
  const inputCost = document.getElementById('purchase-cost-input');
  const previewImg = document.getElementById('purchase-receipt-preview');

  state.tempReceiptBase64 = null;
  if (previewImg) {
    previewImg.style.display = 'none';
    previewImg.src = '';
  }

  // Limpa valor prévio
  if (inputCost) {
    inputCost.value = '';
  }

  // Preenche comprador atual
  if (inputBuyer) {
    inputBuyer.value = state.currentUser ? state.currentUser.name : 'Equipe';
  }

  // Preenche data com hoje no formato YYYY-MM-DD
  if (inputDate) {
    const now = new Date();
    inputDate.value = now.toISOString().split('T')[0];
  }

  // Se passou imóvel específico
  if (propertyId && selectProp) {
    selectProp.value = propertyId;
  } else if (state.selectedProperty !== 'ALL' && selectProp) {
    selectProp.value = state.selectedProperty;
  }

  // Se passou ID específico do produto
  let initialCatalogId = PRODUCT_CATALOG[0]?.id || 'p01';
  if (productId) {
    initialCatalogId = productId.includes('_') ? productId.split('_')[1] : productId;
  }

  state.currentPurchaseItems = [
    { catalogId: initialCatalogId, quantity: 2 }
  ];

  renderPurchaseItems();
  syncAllCustomControls();

  document.getElementById('modal-register-purchase').classList.add('active');
}

function closePurchaseModal() {
  closeAllCustomControls();
  document.getElementById('modal-register-purchase').classList.remove('active');
  state.tempReceiptBase64 = null;
}

function handlePurchaseSubmit(e) {
  e.preventDefault();

  const propId = document.getElementById('purchase-property-select').value;
  const cost = Number(document.getElementById('purchase-cost-input').value) || 0;
  const date = document.getElementById('purchase-date-input').value || new Date().toISOString().split('T')[0];
  const buyerName = document.getElementById('purchase-buyer-input').value || 'Equipe';
  const notes = document.getElementById('purchase-notes-input').value.trim();

  // Coleta todos os itens adicionados na lista
  const rows = document.querySelectorAll('.purchase-item-row');
  const items = [];

  rows.forEach(row => {
    const sel = row.querySelector('.purchase-item-product-select');
    const qtyInput = row.querySelector('.purchase-item-qty-input');
    if (sel && qtyInput) {
      const catalogId = sel.value;
      const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
      const catItem = PRODUCT_CATALOG.find(p => p.id === catalogId);
      if (catItem) {
        items.push({
          catalogId: catItem.id,
          productName: catItem.name,
          productPhoto: catItem.photo,
          quantity: qty
        });
      }
    }
  });

  if (items.length === 0) {
    showToast('Adicione pelo menos um produto à compra.');
    return;
  }

  // Atualiza o estoque de cada produto no imóvel de destino
  items.forEach(item => {
    const targetProduct = state.data.products.find(p => 
      p.propertyId === propId && (p.catalogId === item.catalogId || p.id === `${propId}_${item.catalogId}`)
    );

    if (targetProduct) {
      targetProduct.quantity = Number(targetProduct.quantity) + item.quantity;
      targetProduct.status = 'suficiente';
      targetProduct.updatedAt = new Date().toISOString();
    }
  });

  const totalUnits = items.reduce((acc, it) => acc + it.quantity, 0);

  const summaryName = items.length === 1
    ? items[0].productName
    : `${items.length} Itens: ${items.map(i => `${i.quantity}x ${i.productName}`).slice(0, 2).join(', ')}${items.length > 2 ? '...' : ''}`;

  const newPurchase = {
    id: `pur_${Date.now()}`,
    propertyId: propId,
    productId: items[0].catalogId,
    productName: summaryName,
    productPhoto: items[0].productPhoto,
    items: items,
    buyerType: state.currentUser ? state.currentUser.type : 'staff',
    buyerStaffId: state.currentUser ? state.currentUser.id : null,
    buyerName: buyerName,
    buyerPhoto: state.currentUser ? (state.currentUser.photo || null) : null,
    purchaseDate: date,
    quantityBought: totalUnits,
    totalCost: cost,
    receiptPhoto: state.tempReceiptBase64,
    notes: notes || 'Compra registrada pelo celular'
  };

  state.data.purchases.unshift(newPurchase);
  saveData();

  // Salva imediatamente no Firestore tanto a compra quanto os produtos com estoque alterado
  if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
    AirbnbCloudSync.saveDocument('purchases', newPurchase.id, newPurchase).catch(err => {
      console.warn('[CloudSync] Falha no salvamento imediato da compra no Firestore:', err);
    });

    items.forEach(item => {
      const targetProduct = state.data.products.find(p => 
        p.propertyId === propId && (p.catalogId === item.catalogId || p.id === `${propId}_${item.catalogId}`)
      );
      if (targetProduct) {
        AirbnbCloudSync.saveDocument('products', targetProduct.id, targetProduct).catch(e => {
          console.warn('[CloudSync] Falha no salvamento imediato do estoque do produto:', e);
        });
      }
    });
  }

  closePurchaseModal();
  renderAll();

  const msg = items.length === 1
    ? `Compra de ${items[0].productName} (${items[0].quantity} un) adicionada ao imóvel ${propId}.`
    : `Compra coletiva de ${items.length} produtos (${totalUnits} un) registrada para o imóvel ${propId}.`;

  showToast(msg);
}

// ==========================================================================
// Modal de Anotação em Produto Específico (com Bolinha Laranja Pulsante)
// ==========================================================================
function openProductNoteModal(productId) {
  const product = state.data.products.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('modal-product-note');
  const inputId = document.getElementById('product-note-target-id');
  const imgTarget = document.getElementById('product-note-target-img');
  const nameTarget = document.getElementById('product-note-target-name');
  const propTarget = document.getElementById('product-note-target-prop');
  const textarea = document.getElementById('product-note-textarea');
  const metaBox = document.getElementById('product-note-meta-info');
  const metaText = document.getElementById('product-note-meta-text');
  const btnDelete = document.getElementById('btn-remove-product-note');

  if (inputId) inputId.value = product.id;
  if (imgTarget) imgTarget.src = product.photo || 'https://placehold.co/160x160?text=Produto';
  if (nameTarget) nameTarget.textContent = product.name;
  if (propTarget) propTarget.textContent = `Imóvel: ${product.propertyId} • ${product.brand || 'BOSQUE VERDE'}`;
  if (textarea) textarea.value = product.note || '';

  if (product.note && product.note.trim() !== '') {
    if (btnDelete) btnDelete.style.display = 'block';
    if (metaBox && metaText) {
      metaBox.style.display = 'block';
      const author = product.noteAuthor || 'Equipe';
      const authorStaff = (state.data.staff || []).find(s => s.name === author);
      const authorPhoto = product.noteAuthorPhoto || authorStaff?.photo || ((author === 'Gestor' || author === 'Proprietário') ? (state.data.ownerProfile?.photo || OWNER_PROFILE.photo) : null);
      const dateStr = product.noteUpdatedAt ? ` • ${formatDateTime(product.noteUpdatedAt)}` : '';
      metaText.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 6px;">
          ${authorPhoto ? `<img src="${authorPhoto}" alt="" style="width: 16px; height: 16px; border-radius: 50%; object-fit: cover; vertical-align: middle;">` : ''}
          <span>Anotado por <strong>${escapeHtml(author)}</strong>${dateStr}</span>
        </span>
      `;
    }
  } else {
    if (btnDelete) btnDelete.style.display = 'none';
    if (metaBox) metaBox.style.display = 'none';
  }

  modal?.classList.add('active');
  // Se ainda não tiver nota, foca para digitar. Se já tiver nota ativa, não foca/seleciona para não ficar com a barrinha piscando
  if (!product.note || product.note.trim() === '') {
    setTimeout(() => textarea?.focus(), 150);
  } else if (textarea) {
    textarea.blur();
  }
}

function closeProductNoteModal() {
  document.getElementById('modal-product-note')?.classList.remove('active');
}

function handleProductNoteSubmit(e) {
  e.preventDefault();
  const productId = document.getElementById('product-note-target-id')?.value;
  const noteText = document.getElementById('product-note-textarea')?.value.trim();

  const product = state.data.products.find(p => p.id === productId);
  if (!product) return;

  if (noteText) {
    product.note = noteText;
    product.noteAuthor = state.currentUser ? state.currentUser.name : 'Equipe';
    product.noteAuthorPhoto = state.currentUser ? (state.currentUser.photo || null) : null;
    product.noteUpdatedAt = new Date().toISOString();
    showToast(`Nota adicionada: ${product.name}`);
  } else {
    product.note = null;
    product.noteAuthor = null;
    product.noteAuthorPhoto = null;
    product.noteUpdatedAt = null;
    showToast(`Nota removida: ${product.name}`);
  }

  saveData();

  if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
    AirbnbCloudSync.saveDocument('products', product.id, product).catch(e => {
      console.warn('[CloudSync] Falha no salvamento imediato da nota do produto:', e);
    });
  }

  closeProductNoteModal();
  renderProducts();
}

function handleProductNoteDelete() {
  const productId = document.getElementById('product-note-target-id')?.value;
  const product = state.data.products.find(p => p.id === productId);
  if (!product) return;

  product.note = null;
  product.noteAuthor = null;
  product.noteAuthorPhoto = null;
  product.noteUpdatedAt = null;

  saveData();

  if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
    AirbnbCloudSync.saveDocument('products', product.id, product).catch(e => {
      console.warn('[CloudSync] Falha no salvamento imediato da remoção da nota do produto:', e);
    });
  }

  closeProductNoteModal();
  renderProducts();
  showToast(`Nota removida: ${product.name}`);
}

// ==========================================================================
// Gerenciamento de Produtos: Excluir e Adicionar
// ==========================================================================
async function deleteProduct(productId, name, propId) {
  const prod = state.data.products.find(p => p.id === productId);
  if (!prod) return;

  const catalogId = prod.catalogId;
  const countInOtherProps = state.data.products.filter(p => p.catalogId === catalogId && p.id !== productId).length;

  if (countInOtherProps > 0) {
    const deleteAll = await showConfirmDialog({
      title: 'Excluir Produto',
      message: `O item "${name}" também está cadastrado em outros imóveis.\n\nDeseja remover de TODOS os imóveis (JB, VN e HN)?`,
      confirmText: 'Remover de Todos',
      cancelText: `Apenas de ${propId}`,
      confirmDanger: true,
      icon: 'trash'
    });

    if (deleteAll) {
      state.data.products = state.data.products.filter(p => p.catalogId !== catalogId);
      const catIdx = PRODUCT_CATALOG.findIndex(c => c.id === catalogId);
      if (catIdx !== -1) PRODUCT_CATALOG.splice(catIdx, 1);
      saveData();
      renderAll();
      showToast(`Produto "${name}" removido de todos os imóveis.`);
      return;
    }
  }

  // Confirma exclusão específica para este imóvel
  const confirmSingle = await showConfirmDialog({
    title: 'Excluir Produto',
    message: `Confirmar exclusão de "${name}" do imóvel ${propId}?`,
    confirmText: 'Excluir deste Imóvel',
    cancelText: 'Cancelar',
    confirmDanger: true,
    icon: 'trash'
  });
  if (!confirmSingle) return;

  state.data.products = state.data.products.filter(p => p.id !== productId);
  if (catalogId && !state.data.products.some(p => p.catalogId === catalogId)) {
    const catIdx = PRODUCT_CATALOG.findIndex(c => c.id === catalogId);
    if (catIdx !== -1) PRODUCT_CATALOG.splice(catIdx, 1);
  }

  saveData();
  renderAll();
  showToast(`Produto "${name}" apagado de ${propId}.`);
}

function generateProductPlaceholderSvg(name) {
  const shortName = escapeHtml((name || 'Produto').slice(0, 14));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <rect width="160" height="160" rx="16" fill="#F3F4F6"/>
    <rect x="18" y="18" width="124" height="124" rx="12" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2"/>
    <circle cx="80" cy="68" r="22" fill="#0F2744" opacity="0.08"/>
    <path d="M72 72l5-5 5 5 6-7" stroke="#0F2744" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <text x="80" y="112" font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" font-size="11" font-weight="600" fill="#0F2744" text-anchor="middle">${shortName}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function openAddProductModal() {
  const modal = document.getElementById('modal-add-product');
  const form = document.getElementById('add-product-form');
  const photoPreview = document.getElementById('new-product-photo-preview');
  const propSelect = document.getElementById('new-product-property');

  if (form) form.reset();
  state.tempNewProductPhotoBase64 = null;
  if (photoPreview) {
    photoPreview.src = '';
    photoPreview.style.display = 'none';
  }

  // Garante que absolutamente nenhum campo venha pré-escrito, exibindo apenas os exemplos (placeholders)
  const nameInput = document.getElementById('new-product-name');
  const brandInput = document.getElementById('new-product-brand');
  const unitInput = document.getElementById('new-product-unit');
  const qtyInput = document.getElementById('new-product-quantity');
  const faltaInput = document.getElementById('new-product-falta');
  const atencaoInput = document.getElementById('new-product-atencao');
  const suficienteInput = document.getElementById('new-product-suficiente');
  const noteInput = document.getElementById('new-product-note');

  if (nameInput) nameInput.value = '';
  if (brandInput) brandInput.value = '';
  if (unitInput) unitInput.value = '';
  if (qtyInput) qtyInput.value = '';
  if (faltaInput) faltaInput.value = '';
  if (atencaoInput) atencaoInput.value = '';
  if (suficienteInput) suficienteInput.value = '';
  if (noteInput) noteInput.value = '';

  if (propSelect) {
    if (state.selectedProperty !== 'ALL') {
      propSelect.value = state.selectedProperty;
    } else {
      propSelect.value = 'ALL';
    }
  }

  syncAllCustomControls();
  modal?.classList.add('active');
  setTimeout(() => {
    document.getElementById('new-product-name')?.focus();
  }, 150);
}

function closeAddProductModal() {
  closeAllCustomControls();
  const modal = document.getElementById('modal-add-product');
  modal?.classList.remove('active');
  state.tempNewProductPhotoBase64 = null;
  const photoPreview = document.getElementById('new-product-photo-preview');
  if (photoPreview) {
    photoPreview.src = '';
    photoPreview.style.display = 'none';
  }
}

function handleNewProductSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('new-product-name');
  const brandInput = document.getElementById('new-product-brand');
  const catInput = document.getElementById('new-product-category');
  const propInput = document.getElementById('new-product-property');
  const unitInput = document.getElementById('new-product-unit');
  const qtyInput = document.getElementById('new-product-quantity');
  const noteInput = document.getElementById('new-product-note');

  const faltaInput = document.getElementById('new-product-falta');
  const atencaoInput = document.getElementById('new-product-atencao');
  const suficienteInput = document.getElementById('new-product-suficiente');

  const name = nameInput?.value.trim();
  if (!name) {
    showToast('Informe o nome do produto.');
    return;
  }

  // Se o usuário não digitar nada, assume os padrões recomendados sem forçar pré-preenchimento visual
  const brand = brandInput?.value.trim() || 'BOSQUE VERDE';
  const category = catInput?.value || 'limpeza';
  const propChoice = propInput?.value || 'CURRENT';
  const unit = unitInput?.value.trim() || 'un';
  const quantity = Math.max(0, parseInt(qtyInput?.value, 10) || 0);
  const noteText = noteInput?.value.trim();

  // Limites do semáforo configurados (se não digitou, usa os padrões 0, 1 e 2)
  const faltaVal = faltaInput?.value !== '' ? parseInt(faltaInput?.value, 10) : 0;
  const atencaoVal = atencaoInput?.value !== '' ? parseInt(atencaoInput?.value, 10) : 1;
  const suficienteVal = suficienteInput?.value !== '' ? parseInt(suficienteInput?.value, 10) : 2;

  const faltaMax = isNaN(faltaVal) || faltaVal < 0 ? 0 : faltaVal;
  const atencaoMax = isNaN(atencaoVal) || atencaoVal <= faltaMax ? faltaMax + 1 : atencaoVal;
  const suficienteMin = isNaN(suficienteVal) || suficienteVal <= atencaoMax ? atencaoMax + 1 : suficienteVal;

  const catLabels = {
    limpeza: 'Limpeza & Rouparia',
    amenities: 'Amenities & Higiene',
    comida: 'Alimentos & Bebidas'
  };
  const categoryLabel = catLabels[category] || 'Diversos';

  const photoUrl = state.tempNewProductPhotoBase64 || generateProductPlaceholderSvg(name);
  const catalogId = 'p' + Date.now();

  // Determinar imóveis destino
  let targetProps = [];
  if (propChoice === 'ALL') {
    targetProps = ['JB', 'VN', 'HN'];
  } else if (propChoice === 'CURRENT') {
    targetProps = [state.selectedProperty === 'ALL' ? 'JB' : state.selectedProperty];
  } else {
    targetProps = [propChoice];
  }

  // Adicionar ao catálogo mestre de compras
  PRODUCT_CATALOG.unshift({
    id: catalogId,
    name: name,
    brand: brand,
    category: category,
    categoryLabel: categoryLabel,
    unit: unit,
    photo: photoUrl,
    estimatedPrice: 0,
    description: name,
    faltaThreshold: faltaMax,
    atencaoThreshold: atencaoMax,
    suficienteThreshold: suficienteMin
  });

  // Criar o produto para os imóveis selecionados
  targetProps.forEach(propId => {
    const computedStatus = calculateProductStatus(
      { faltaThreshold: faltaMax, atencaoThreshold: atencaoMax, suficienteThreshold: suficienteMin },
      quantity
    );

    const newProduct = {
      id: `${propId}_${catalogId}`,
      propertyId: propId,
      catalogId: catalogId,
      name: name,
      brand: brand,
      category: category,
      categoryLabel: categoryLabel,
      unit: unit,
      photo: photoUrl,
      estimatedPrice: 0,
      description: name,
      quantity: quantity,
      status: computedStatus,
      faltaThreshold: faltaMax,
      atencaoThreshold: atencaoMax,
      suficienteThreshold: suficienteMin,
      note: noteText ? noteText : null,
      noteAuthor: noteText ? (state.currentUser ? state.currentUser.name : 'Equipe') : null,
      noteUpdatedAt: noteText ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    };
    state.data.products.unshift(newProduct);
  });

  saveData();
  closeAddProductModal();
  renderAll();
  showToast(`Produto "${name}" cadastrado com sucesso!`);
}

// ==========================================================================
// Modal de Zoom da Foto
// ==========================================================================
function openZoomModal(imgSrc, title, desc) {
  const modal = document.getElementById('modal-zoom-photo');
  const imgTarget = document.getElementById('zoom-img-target');
  const titleTarget = document.getElementById('zoom-title');
  const descTarget = document.getElementById('zoom-description');

  if (imgTarget) imgTarget.src = imgSrc;
  if (titleTarget) titleTarget.textContent = title || 'Produto';
  if (descTarget) descTarget.textContent = desc || '';

  modal.classList.add('active');
}

function closeZoomModal() {
  document.getElementById('modal-zoom-photo').classList.remove('active');
}

// ==========================================================================
// Modal de Cadastro de Colaboradora
// ==========================================================================
function openNewStaffModal() {
  document.getElementById('modal-new-staff').classList.add('active');
}

function closeNewStaffModal() {
  document.getElementById('modal-new-staff').classList.remove('active');
}

async function handleNewStaffSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById('new-staff-name');
  const emailInput = document.getElementById('new-staff-email');
  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';

  if (!name || !email) {
    showToast('Informe o nome e o e-mail Google da colaboradora.');
    return;
  }

  if (!email.includes('@') || !email.includes('.')) {
    showToast('Informe um endereço de e-mail válido.');
    return;
  }

  // Verifica se o e-mail já existe na equipe
  const alreadyExists = (state.data.staff || []).some(s => (s.email || '').toLowerCase() === email);
  if (alreadyExists) {
    showToast('Já existe uma colaboradora cadastrada com este e-mail.');
    return;
  }

  const staffId = `staff_${Date.now()}`;
  const newStaff = {
    id: staffId,
    name: name,
    email: email,
    role: '',
    isActive: true,
    avatar: getInitials(name, 'EQ'),
    createdAt: new Date().toISOString()
  };

  state.data.staff.push(newStaff);

  if (window.AirbnbAuth) {
    try {
      await AirbnbAuth.addStaffToAllowlist({
        email: email,
        name: name,
        role: 'staff',
        staffId: staffId
      });
    } catch (err) {
      console.warn('Erro ao salvar permissão na allowlist do Firebase:', err);
    }
  }

  if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
    try {
      await AirbnbCloudSync.saveDocument('staff', staffId, newStaff);
    } catch (e) {
      console.warn('Erro ao salvar colaboradora na nuvem:', e);
    }
  }

  saveData();
  closeNewStaffModal();
  if (nameInput) nameInput.value = '';
  if (emailInput) emailInput.value = '';
  renderOwnerDashboard();
  renderTimesheets();
  showToast(`Colaboradora "${name}" autorizada com o e-mail ${email}.`);
}

// ==========================================================================
// Modal de Edição de Colaboradora
// ==========================================================================
function openEditStaffModal(staffId) {
  const staff = (state.data.staff || []).find(s => s.id === staffId);
  if (!staff) return;

  const idInput = document.getElementById('edit-staff-id');
  const nameInput = document.getElementById('edit-staff-name');
  const emailInput = document.getElementById('edit-staff-email');
  const toggle = document.getElementById('edit-staff-active-toggle');
  const label = document.getElementById('edit-staff-status-label');

  if (idInput) idInput.value = staff.id;
  if (nameInput) nameInput.value = staff.name || '';
  if (emailInput) emailInput.value = staff.email || '';
  const isActive = staff.isActive !== false;
  if (toggle) toggle.checked = isActive;
  if (label) {
    label.textContent = isActive ? 'Acesso Ativo' : 'Acesso Suspenso';
    label.style.color = isActive ? '#15803D' : '#991B1B';
  }

  document.getElementById('modal-edit-staff')?.classList.add('active');
}

function closeEditStaffModal() {
  document.getElementById('modal-edit-staff')?.classList.remove('active');
}

async function handleEditStaffSubmit(e) {
  e.preventDefault();
  const idInput = document.getElementById('edit-staff-id');
  const nameInput = document.getElementById('edit-staff-name');
  const emailInput = document.getElementById('edit-staff-email');
  const toggle = document.getElementById('edit-staff-active-toggle');

  const staffId = idInput ? idInput.value : '';
  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const isActive = toggle ? toggle.checked : true;

  if (!staffId) return;

  if (!name || !email) {
    showToast('Informe o nome e o e-mail Google da colaboradora.');
    return;
  }

  if (!email.includes('@') || !email.includes('.')) {
    showToast('Informe um endereço de e-mail válido.');
    return;
  }

  // Verifica duplicidade de e-mail com outra colaboradora
  const emailConflict = (state.data.staff || []).some(s => s.id !== staffId && (s.email || '').toLowerCase() === email);
  if (emailConflict) {
    showToast('Este e-mail já está sendo utilizado por outra colaboradora.');
    return;
  }

  const staff = (state.data.staff || []).find(s => s.id === staffId);
  if (!staff) return;

  const oldEmail = (staff.email || '').toLowerCase();
  const oldName = staff.name;

  staff.name = name;
  staff.email = email;
  staff.isActive = isActive;
  staff.avatar = getInitials(name, 'EQ');

  // Atualiza referências de nome nos registros existentes (se alterado)
  if (oldName !== name) {
    (state.data.timesheets || []).forEach(t => {
      if (t.staffId === staffId) t.staffName = name;
    });
    (state.data.notes || []).forEach(n => {
      if (n.authorId === staffId) n.authorName = name;
    });
    (state.data.purchases || []).forEach(p => {
      if (p.buyerStaffId === staffId) p.buyerName = name;
    });
    (state.data.cleaningSchedule || []).forEach(c => {
      if (c.assignedStaffId === staffId) c.assignedStaffName = name;
    });
  }

  // Sincroniza com o Firebase Allowlist
  if (window.AirbnbAuth) {
    try {
      if (oldEmail && oldEmail !== email) {
        await AirbnbAuth.removeStaffFromAllowlist(oldEmail);
        await AirbnbAuth.addStaffToAllowlist({
          email: email,
          name: name,
          role: 'staff',
          staffId: staffId
        });
      }
      await AirbnbAuth.setStaffActiveInAllowlist(email, isActive);
    } catch (err) {
      console.warn('Erro ao atualizar permissão na allowlist do Firebase:', err);
    }
  }

  // Sincroniza com a coleção staff no Firestore
  if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
    try {
      await AirbnbCloudSync.saveDocument('staff', staffId, staff);
      if (oldName !== name && state.data.timesheets) {
        await AirbnbCloudSync.syncCollectionBatch('timesheets', state.data.timesheets);
      }
    } catch (e) {
      console.warn('Erro ao atualizar colaboradora na nuvem:', e);
    }
  }

  saveData();
  closeEditStaffModal();
  renderOwnerDashboard();
  renderTimesheets();
  showToast(`Colaboradora "${name}" atualizada com sucesso!`);
}

async function handleEditStaffDelete() {
  const idInput = document.getElementById('edit-staff-id');
  const staffId = idInput ? idInput.value : '';
  const staff = (state.data.staff || []).find(s => s.id === staffId);
  if (!staff) return;

  if (state.data.staff.length <= 1) {
    showToast('É necessário manter pelo menos uma colaboradora cadastrada.');
    return;
  }

  const confirmed = await showConfirmDialog({
    title: 'Excluir Colaboradora',
    message: `Tem certeza que deseja excluir ${staff.name} e revogar seu acesso Google ao sistema?`,
    confirmText: 'Excluir Colaboradora',
    cancelText: 'Cancelar',
    confirmDanger: true,
    icon: 'trash'
  });

  if (confirmed) {
    if (window.AirbnbAuth && staff.email) {
      try {
        await AirbnbAuth.removeStaffFromAllowlist(staff.email);
      } catch (err) {
        console.warn('Erro ao remover permissão da allowlist do Firebase:', err);
      }
    }
    if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
      try {
        await AirbnbCloudSync.deleteDocument('staff', staffId);
      } catch (e) {
        console.warn('Erro ao excluir colaboradora da nuvem:', e);
      }
    }
    state.data.staff = state.data.staff.filter(s => s.id !== staffId);
    saveData();
    closeEditStaffModal();
    renderOwnerDashboard();
    renderTimesheets();
    showToast(`Colaboradora "${staff.name}" excluída.`);
  }
}

// ==========================================================================
// Modal de Agendamento de Limpeza / Escala
// ==========================================================================
function openNewEventModal(prefilledDate) {
  const staffSelect = document.getElementById('event-staff-select');
  if (staffSelect) {
    const activeStaff = state.data.staff.filter(s => s.isActive);
    staffSelect.innerHTML = activeStaff.map(s => `
      <option value="${s.id}">${s.name}</option>
    `).join('');
  }

  const propSelect = document.getElementById('event-property-select');
  if (propSelect && state.selectedProperty !== 'ALL') {
    propSelect.value = state.selectedProperty;
  }

  const dateInput = document.getElementById('event-date-input');
  if (dateInput) {
    if (prefilledDate) {
      dateInput.value = prefilledDate;
    } else if (state.calendarView && state.calendarView.selectedDate) {
      dateInput.value = state.calendarView.selectedDate;
    } else {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  }

  const typeSelect = document.getElementById('event-type-select');
  const timeInput = document.getElementById('event-time-input');
  if (timeInput) {
    const currentType = typeSelect ? typeSelect.value : 'limpeza';
    if (currentType === 'checking') timeInput.value = '15:00';
    else if (currentType === 'manutencao') timeInput.value = '10:00';
    else if (currentType === 'compras') timeInput.value = '09:30';
    else timeInput.value = '11:00';
  }

  const titleInput = document.getElementById('event-title-input');
  if (titleInput) titleInput.value = '';

  const notesInput = document.getElementById('event-notes-input');
  if (notesInput) notesInput.value = '';

  syncAllCustomControls();
  const modalNewEvent = document.getElementById('modal-new-event');
  if (modalNewEvent) {
    modalNewEvent.scrollLeft = 0;
    const sheet = modalNewEvent.querySelector('.bottom-sheet');
    if (sheet) { sheet.scrollLeft = 0; sheet.scrollTop = 0; }
    const form = modalNewEvent.querySelector('form');
    if (form) form.scrollLeft = 0;
    modalNewEvent.classList.add('active');
  }
}

function closeNewEventModal() {
  closeAllCustomControls();
  document.getElementById('modal-new-event').classList.remove('active');
}

function handleNewEventSubmit(e) {
  e.preventDefault();
  const propId = document.getElementById('event-property-select').value;
  const title = document.getElementById('event-title-input').value.trim();
  const date = document.getElementById('event-date-input').value;
  const time = document.getElementById('event-time-input')?.value || '11:00';
  const type = document.getElementById('event-type-select').value;
  const staffId = document.getElementById('event-staff-select').value;
  const notes = document.getElementById('event-notes-input').value.trim();

  const staff = state.data.staff.find(s => s.id === staffId);

  const newEvent = {
    id: `cal_${Date.now()}`,
    propertyId: propId,
    title: title,
    eventDate: date,
    startTime: time,
    eventType: type,
    assignedStaffId: staffId,
    assignedStaffName: staff ? staff.name : 'Equipe',
    status: 'pendente',
    notes: notes
  };

  state.data.calendar.push(newEvent);
  saveData();

  if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
    AirbnbCloudSync.saveDocument('calendar', newEvent.id, newEvent).catch(e => {
      console.warn('[CloudSync] Falha no salvamento imediato da nova escala no Firestore:', e);
    });
  }

  const eventDateParts = date.split('-');
  if (eventDateParts.length === 3) {
    if (!state.calendarView) {
      state.calendarView = {};
    }
    state.calendarView.year = parseInt(eventDateParts[0], 10);
    state.calendarView.month = parseInt(eventDateParts[1], 10) - 1;
    state.calendarView.selectedDate = date;
  }

  closeNewEventModal();
  renderCalendar();
  showToast('Escala agendada com sucesso.');
}

// ==========================================================================
// Configuração de Event Listeners
// ==========================================================================
function setupEventListeners() {
  // Autenticação Segura Google Firebase (Portão de Entrada)
  const btnGoogleGate = document.getElementById('btn-google-login-gate');
  if (btnGoogleGate) {
    btnGoogleGate.onclick = (e) => {
      e.preventDefault();
      performGoogleLogin();
    };
  }

  const btnGateTryAnother = document.getElementById('btn-gate-try-another');
  if (btnGateTryAnother) {
    btnGateTryAnother.onclick = async (e) => {
      e.preventDefault();
      setGateLoading(true, 'Abrindo login com o Google...');
      if (window.AirbnbAuth && typeof AirbnbAuth.logout === 'function') {
        await AirbnbAuth.logout().catch(() => {});
      }
      showGateScreen();
      performGoogleLogin();
    };
  }

  // Seletor de Idiomas (Espanhol e Português)
  document.querySelectorAll('[data-lang-btn]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = btn.getAttribute('data-lang-btn');
      if (window.I18N && typeof window.I18N.setLanguage === 'function') {
        window.I18N.setLanguage(lang);
      }
    });
  });

  // Listener para evento customizado disparado quando o idioma é alterado
  window.addEventListener('airbnb-language-changed', (e) => {
    const lang = e.detail?.lang || (window.I18N ? window.I18N.getLanguage() : 'es');
    if (state.currentUser) {
      updateTopbarUser();
      renderUserProfileSection();
    }
    renderAll();
    if (typeof initAllCustomControls === 'function') {
      initAllCustomControls();
    }
  });

  // Topbar
  document.getElementById('btn-switch-user')?.addEventListener('click', async () => {
    const title = window.I18N ? window.I18N.t('dialog.confirmLogoutTitle') : 'Sair da Sessão';
    const message = window.I18N ? window.I18N.t('dialog.confirmLogoutMessage') : 'Deseja realmente sair e retornar à tela inicial?';
    const confirmText = window.I18N ? window.I18N.t('dialog.confirmLogoutBtn') : 'Sair Agora';
    const cancelText = window.I18N ? window.I18N.t('dialog.confirmLogoutCancel') : 'Cancelar';

    const confirmed = await showConfirmDialog({
      title,
      message,
      confirmText,
      cancelText,
      confirmDanger: false,
      icon: 'logout'
    });
    if (confirmed) {
      logout();
    }
  });

  // Abas de Imóveis (JB, VN, HN, ALL)
  document.querySelectorAll('.property-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.property-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedProperty = btn.dataset.prop;

      // Efeito de transição fluida no card de resumo
      const card = document.getElementById('property-overview-card');
      if (card) {
        card.style.animation = 'none';
        void card.offsetWidth;
        card.style.animation = 'cardEntrance 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
      }

      renderAll();
    });
  });

  // Cliques nos Chips do Card de Resumo (Filtro Direto no Estoque)
  document.querySelectorAll('.stat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filterStatus = chip.dataset.filterStatus;
      if (!filterStatus) return;

      if (state.selectedStatus === filterStatus) {
        state.selectedStatus = 'all';
        chip.classList.remove('active-filter');
        showToast('Filtro limpo: exibindo todo o estoque');
      } else {
        document.querySelectorAll('.stat-chip').forEach(c => c.classList.remove('active-filter'));
        state.selectedStatus = filterStatus;
        chip.classList.add('active-filter');
        const labels = { falta: 'Falta', acabando: 'Atenção', suficiente: 'Suficiente' };
        showToast(`Exibindo estoque: ${labels[filterStatus] || filterStatus}`);
      }

      // Se não estiver na aba de estoque, muda automaticamente para ela
      if (state.activeTab !== 'inventory') {
        const invBtn = document.querySelector('.bottom-nav .nav-item[data-tab="inventory"]');
        invBtn?.click();
      } else {
        renderProducts();
      }
    });
  });

  // Bottom Navigation Bar
  document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      document.querySelectorAll('.bottom-nav .nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      state.activeTab = targetTab;
      document.querySelectorAll('.tab-view').forEach(view => view.style.display = 'none');
      
      const targetView = document.getElementById(`view-${targetTab}`);
      if (targetView) targetView.style.display = 'block';

      if (targetTab === 'owner') {
        renderOwnerDashboard();
      }

      // Atualiza visibilidade dos botões contextuais por aba (Ex: botões de compra aparecem apenas no estoque)
      updateTabElementsVisibility(targetTab);

      // Rola para o topo suavemente
      document.getElementById('main-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Filtro de Busca
  const searchInput = document.getElementById('inventory-search-input');
  const clearBtn = document.getElementById('btn-clear-search');
  searchInput?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    clearBtn.style.display = state.searchQuery ? 'block' : 'none';
    renderProducts();
  });
  clearBtn?.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    clearBtn.style.display = 'none';
    renderProducts();
  });

  // Pílulas de Categoria
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.selectedCategory = pill.dataset.cat;
      renderProducts();
    });
  });

  // Bloco de Notas
  document.getElementById('btn-post-note')?.addEventListener('click', addNote);

  // FAB e Botão de Comprar na aba de Urgentes
  document.getElementById('fab-quick-purchase')?.addEventListener('click', () => {
    openPurchaseModalForProduct();
  });
  document.getElementById('btn-quick-buy-all')?.addEventListener('click', () => {
    openPurchaseModalForProduct();
  });
  document.getElementById('banner-quick-purchase')?.addEventListener('click', () => {
    openPurchaseModalForProduct();
  });
  document.getElementById('btn-banner-quick-buy')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openPurchaseModalForProduct();
  });

  // Compartilhar Lista de Falta no WhatsApp (Aba Estoque - Botão Pílula Discreto)
  const btnShareWhatsappShortages = document.getElementById('btn-share-whatsapp-shortages');
  if (btnShareWhatsappShortages) {
    btnShareWhatsappShortages.addEventListener('click', () => {
      shareShortagesToWhatsApp();
    });
  }

  // Form de Compras
  document.getElementById('btn-close-purchase-modal')?.addEventListener('click', closePurchaseModal);
  document.getElementById('purchase-form')?.addEventListener('submit', handlePurchaseSubmit);
  document.getElementById('btn-add-purchase-item')?.addEventListener('click', addPurchaseItem);

  // Upload de Recibo / Cupom Fiscal
  const receiptBox = document.getElementById('receipt-upload-box');
  const receiptFile = document.getElementById('purchase-receipt-file');
  const receiptPreview = document.getElementById('purchase-receipt-preview');

  receiptBox?.addEventListener('click', () => {
    receiptFile?.click();
  });

  receiptFile?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      compressImageFile(file, 1024, 0.75, (compressedBase64) => {
        state.tempReceiptBase64 = compressedBase64;
        if (receiptPreview) {
          receiptPreview.src = state.tempReceiptBase64;
          receiptPreview.style.display = 'block';
        }
        showToast('Foto do comprovante anexada e otimizada.');
      });
    }
  });

  // Modal Adicionar Novo Produto
  document.getElementById('btn-open-add-product')?.addEventListener('click', openAddProductModal);
  document.getElementById('btn-close-add-product-modal')?.addEventListener('click', closeAddProductModal);
  document.getElementById('add-product-form')?.addEventListener('submit', handleNewProductSubmit);

  // Upload Foto do Novo Produto
  const newProdBox = document.getElementById('new-product-photo-box');
  const newProdFile = document.getElementById('new-product-photo-file');
  const newProdPreview = document.getElementById('new-product-photo-preview');

  newProdBox?.addEventListener('click', () => {
    newProdFile?.click();
  });

  newProdFile?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      compressImageFile(file, 800, 0.78, (compressedBase64) => {
        state.tempNewProductPhotoBase64 = compressedBase64;
        if (newProdPreview) {
          newProdPreview.src = state.tempNewProductPhotoBase64;
          newProdPreview.style.display = 'block';
        }
        showToast('Foto do produto anexada e otimizada.');
      });
    }
  });

  // Modal Zoom
  document.getElementById('btn-close-zoom-modal')?.addEventListener('click', closeZoomModal);

  // Sub-abas da Aba Produtos (Ativos vs Lixeira)
  document.querySelectorAll('.products-subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.catalogActiveSubTab = btn.dataset.subtab || 'active';
      renderProductsTab();
    });
  });

  // Busca no Catálogo de Produtos
  const catalogSearchInput = document.getElementById('catalog-search-input');
  const clearCatalogSearchBtn = document.getElementById('btn-clear-catalog-search');
  catalogSearchInput?.addEventListener('input', (e) => {
    state.catalogSearchQuery = e.target.value;
    if (clearCatalogSearchBtn) {
      clearCatalogSearchBtn.style.display = state.catalogSearchQuery ? 'block' : 'none';
    }
    renderProductsTab();
  });
  clearCatalogSearchBtn?.addEventListener('click', () => {
    if (catalogSearchInput) catalogSearchInput.value = '';
    state.catalogSearchQuery = '';
    clearCatalogSearchBtn.style.display = 'none';
    renderProductsTab();
  });

  // Modal e Formulário de Edição de Informações do Produto
  document.getElementById('btn-close-edit-product-modal')?.addEventListener('click', closeEditProductModal);
  document.getElementById('edit-product-form')?.addEventListener('submit', handleEditProductSubmit);

  // Modal e Formulário de Regras de Quantidades do Semáforo (Falta, Atenção, Suficiente)
  document.getElementById('btn-close-thresholds-modal')?.addEventListener('click', closeThresholdsModal);
  document.getElementById('product-thresholds-form')?.addEventListener('submit', handleThresholdsSubmit);

  const editProdBox = document.getElementById('edit-product-photo-box');
  const editProdFile = document.getElementById('edit-product-photo-file');
  const editProdPreview = document.getElementById('edit-product-photo-preview');

  editProdBox?.addEventListener('click', () => {
    editProdFile?.click();
  });

  editProdFile?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      compressImageFile(file, 800, 0.78, (compressedBase64) => {
        state.tempEditProductPhotoBase64 = compressedBase64;
        if (editProdPreview) {
          editProdPreview.src = state.tempEditProductPhotoBase64;
          editProdPreview.style.display = 'block';
        }
        showToast('Foto do produto atualizada e otimizada.');
      });
    }
  });

  // Modal Nota de Produto
  document.getElementById('btn-close-product-note-modal')?.addEventListener('click', closeProductNoteModal);
  document.getElementById('product-note-form')?.addEventListener('submit', handleProductNoteSubmit);
  document.getElementById('btn-remove-product-note')?.addEventListener('click', handleProductNoteDelete);

  // Modal Novo Staff
  document.getElementById('btn-open-new-staff-modal')?.addEventListener('click', openNewStaffModal);
  document.getElementById('btn-close-staff-form')?.addEventListener('click', closeNewStaffModal);
  document.getElementById('new-staff-form')?.addEventListener('submit', handleNewStaffSubmit);

  // Modal Editar Staff
  document.getElementById('btn-close-edit-staff-form')?.addEventListener('click', closeEditStaffModal);
  document.getElementById('edit-staff-form')?.addEventListener('submit', handleEditStaffSubmit);
  document.getElementById('btn-delete-staff-modal')?.addEventListener('click', handleEditStaffDelete);
  document.getElementById('edit-staff-active-toggle')?.addEventListener('change', (e) => {
    const lbl = document.getElementById('edit-staff-status-label');
    if (lbl) {
      if (e.target.checked) {
        lbl.textContent = 'Acesso Ativo';
        lbl.style.color = '#15803D';
      } else {
        lbl.textContent = 'Acesso Suspenso';
        lbl.style.color = '#991B1B';
      }
    }
  });

  // Modal Novo Evento de Calendário
  document.getElementById('btn-open-new-event-modal')?.addEventListener('click', openNewEventModal);
  document.getElementById('btn-close-event-modal')?.addEventListener('click', closeNewEventModal);
  document.getElementById('new-event-form')?.addEventListener('submit', handleNewEventSubmit);

  // Sugestão de horário ao trocar o tipo de tarefa da escala
  document.getElementById('event-type-select')?.addEventListener('change', (e) => {
    const timeInput = document.getElementById('event-time-input');
    if (!timeInput) return;
    const type = e.target.value;
    if (type === 'limpeza') timeInput.value = '11:00';
    else if (type === 'checking') timeInput.value = '15:00';
    else if (type === 'checkout') timeInput.value = '11:00';
    else if (type === 'manutencao') timeInput.value = '10:00';
    else if (type === 'compras') timeInput.value = '09:30';
  });

  // Compartilhar WhatsApp
  document.getElementById('btn-share-report')?.addEventListener('click', copyFinancialReportToWhatsApp);

  // Filtros de Data de Compras na Aba Gestão
  document.querySelectorAll('#purchase-date-filters .purchase-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#purchase-date-filters .purchase-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.purchaseDateFilter = pill.dataset.dateFilter;
      const monthSel = document.getElementById('purchase-month-select');
      if (monthSel) {
        monthSel.value = '';
        syncCustomSelect(monthSel);
      }
      state.purchaseSelectedMonth = '';
      renderOwnerDashboard();
    });
  });

  // Seletor de Mês Específico de Compras
  document.getElementById('purchase-month-select')?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val) {
      document.querySelectorAll('#purchase-date-filters .purchase-pill').forEach(p => p.classList.remove('active'));
      state.purchaseDateFilter = 'mes_especifico';
      state.purchaseSelectedMonth = val;
    } else {
      state.purchaseDateFilter = 'todos';
      state.purchaseSelectedMonth = '';
      const allPill = document.querySelector('#purchase-date-filters .purchase-pill[data-date-filter="todos"]');
      if (allPill) allPill.classList.add('active');
    }
    renderOwnerDashboard();
  });

  // Modal Visualizar Detalhes da Compra e Recibo
  document.getElementById('btn-close-view-purchase')?.addEventListener('click', closeViewPurchaseModal);
  document.getElementById('btn-close-view-purchase-bottom')?.addEventListener('click', closeViewPurchaseModal);

  // Delegação de cliques para cards de compra (funciona em qualquer clique no card ou filhos)
  document.getElementById('recent-purchases-container')?.addEventListener('click', (e) => {
    const card = e.target.closest('.clickable-purchase-card, [data-purchase-id]');
    if (card && card.dataset.purchaseId) {
      openViewPurchaseModal(card.dataset.purchaseId);
    }
  });

  // Restaurar Padrões de Fábrica
  document.getElementById('btn-reset-demo')?.addEventListener('click', async () => {
    const confirmed = await showConfirmDialog({
      title: 'Restaurar Dados de Fábrica',
      message: 'Tem certeza que deseja restaurar os dados iniciais dos produtos e imóveis?\n\nTodas as informações e alterações manuais serão redefinidas para o padrão inicial.',
      confirmText: 'Restaurar Padrão',
      cancelText: 'Cancelar',
      confirmDanger: true,
      icon: 'reset'
    });
    if (confirmed) {
      loadFactoryDefaults();
      renderAll();
      showToast('Dados restaurados para o padrão original.');
    }
  });

  // Fechar modais ao clicar no fundo
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeAllCustomControls();
        if (overlay.id === 'modal-confirm-dialog' && _confirmDialogResolver) {
          _confirmDialogResolver(false);
        } else if (overlay.id === 'modal-prompt-dialog' && _promptDialogResolver) {
          _promptDialogResolver(null);
        } else {
          overlay.classList.remove('active');
        }
      }
    });
  });

  // Listeners do Sistema de Horas Trabalhadas (Timesheet)
  document.getElementById('btn-open-timesheet-modal')?.addEventListener('click', () => {
    openTimesheetModal();
  });

  document.getElementById('btn-close-timesheet-modal')?.addEventListener('click', () => {
    document.getElementById('modal-timesheet')?.classList.remove('active');
  });

  // Listeners do Modal de Horas do Gestor (Consulta por Calendário Embutido)
  document.getElementById('btn-close-mgr-ts-modal')?.addEventListener('click', closeManagerStaffTimesheetModal);

  document.getElementById('btn-mgr-ts-back-date')?.addEventListener('click', () => {
    const stepDate = document.getElementById('mgr-ts-step-date');
    const stepHours = document.getElementById('mgr-ts-step-hours');
    const subtitleEl = document.getElementById('mgr-ts-modal-subtitle');
    if (subtitleEl) subtitleEl.textContent = 'Toque no dia para consultar';
    if (stepDate) stepDate.style.display = 'block';
    if (stepHours) stepHours.style.display = 'none';
  });

  document.getElementById('btn-mgr-ts-cal-prev')?.addEventListener('click', (e) => {
    e.stopPropagation();
    let y = state.managerCalendarYear;
    let m = state.managerCalendarMonth - 1;
    if (m < 0) { m = 11; y--; }
    renderManagerInlineCalendar(y, m);
  });

  document.getElementById('btn-mgr-ts-cal-next')?.addEventListener('click', (e) => {
    e.stopPropagation();
    let y = state.managerCalendarYear;
    let m = state.managerCalendarMonth + 1;
    if (m > 11) { m = 0; y++; }
    renderManagerInlineCalendar(y, m);
  });

  document.querySelectorAll('#modal-manager-timesheet .mgr-ts-cal-quick-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const d = new Date();
      if (action === 'yesterday') {
        d.setDate(d.getDate() - 1);
      }
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      showManagerTimesheetHours(state.activeManagerStaffId, iso);
    });
  });

  const mgrModal = document.getElementById('modal-manager-timesheet');
  mgrModal?.addEventListener('click', (e) => {
    if (e.target === mgrModal) {
      closeManagerStaffTimesheetModal();
    }
  });

  document.getElementById('ts-field-start')?.addEventListener('click', () => {
    openTimePicker('start', 'Início do trabalho');
  });
  document.getElementById('ts-field-breakStart')?.addEventListener('click', () => {
    openTimePicker('breakStart', 'Início da pausa');
  });
  document.getElementById('ts-field-breakEnd')?.addEventListener('click', () => {
    openTimePicker('breakEnd', 'Fim da pausa');
  });
  document.getElementById('ts-field-end')?.addEventListener('click', () => {
    openTimePicker('end', 'Fim do trabalho');
  });

  // Listeners de alternância de pagamento no Modal de Horas (Equipe)
  document.getElementById('ts-modal-btn-unpaid')?.addEventListener('click', () => {
    updateTimesheetModalPaymentButtons(false);
  });
  document.getElementById('ts-modal-btn-paid')?.addEventListener('click', () => {
    updateTimesheetModalPaymentButtons(true);
  });

  document.getElementById('btn-delete-timesheet')?.addEventListener('click', async () => {
    const editId = document.getElementById('timesheet-edit-id')?.value;
    if (!editId) return;

    const confirmed = await showConfirmDialog({
      title: 'Excluir Registro de Horas',
      message: 'Tem certeza que deseja excluir este registro de horas trabalhadas?',
      confirmText: 'Excluir Registro',
      cancelText: 'Cancelar',
      confirmDanger: true,
      icon: 'trash'
    });

    if (confirmed) {
      state.data.timesheets = (state.data.timesheets || []).filter(t => t.id !== editId);
      saveData();

      if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
        AirbnbCloudSync.deleteDocument('timesheets', editId).catch(err => {
          console.warn('[CloudSync] Falha ao excluir horas no Firestore:', err);
        });
      }

      document.getElementById('modal-timesheet')?.classList.remove('active');
      renderTimesheets();
      showToast('Registro de horas excluído.');
    }
  });

  document.getElementById('timesheet-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('timesheet-edit-id')?.value;
    const dateInput = document.getElementById('timesheet-date-input');
    const dateVal = dateInput?.value;

    if (!dateVal) {
      showToast('Por favor, informe a data trabalhada.');
      return;
    }

    const todayStr = getTodayDateString();
    if (dateVal > todayStr) {
      showToast('Não é possível registrar horas para uma data futura.');
      return;
    }

    const { start, breakStart, breakEnd, end } = state.tempTimesheetTimes;

    if (!start) {
      showToast('Por favor, selecione pelo menos o horário de início.');
      return;
    }

    // Se for o dia de hoje, valida se qualquer horário informado está no futuro em relação ao relógio
    if (dateVal === todayStr) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const curHStr = String(now.getHours()).padStart(2, '0');
      const curMStr = String(now.getMinutes()).padStart(2, '0');
      const nowFormatted = `${curHStr}:${curMStr}`;

      if (start && timeToMinutes(start) > currentMinutes) {
        showToast(`O horário de início (${start}) não pode ser no futuro (horário atual: ${nowFormatted}).`);
        return;
      }
      if (breakStart && timeToMinutes(breakStart) > currentMinutes) {
        showToast(`O início da pausa (${breakStart}) não pode ser no futuro (horário atual: ${nowFormatted}).`);
        return;
      }
      if (breakEnd && timeToMinutes(breakEnd) > currentMinutes) {
        showToast(`O término da pausa (${breakEnd}) não pode ser no futuro (horário atual: ${nowFormatted}).`);
        return;
      }
      if (end && timeToMinutes(end) > currentMinutes) {
        showToast(`O horário de término (${end}) não pode ser no futuro (horário atual: ${nowFormatted}).`);
        return;
      }
    }

    if ((breakStart && !breakEnd) || (!breakStart && breakEnd)) {
      showToast('Para registrar pausa, preencha o início e o fim da pausa.');
      return;
    }

    if (start && breakStart) {
      const sM = timeToMinutes(start);
      const bsM = timeToMinutes(breakStart);
      if (bsM < sM) {
        showToast('O início da pausa não pode ser anterior ao início do trabalho.');
        return;
      }
    }

    if (breakStart && breakEnd) {
      const bsM = timeToMinutes(breakStart);
      const beM = timeToMinutes(breakEnd);
      if (beM <= bsM) {
        showToast('O fim da pausa deve ser posterior ao início da pausa.');
        return;
      }
    }

    if (breakEnd && end) {
      const beM = timeToMinutes(breakEnd);
      const eM = timeToMinutes(end);
      if (eM < beM) {
        showToast('O término do trabalho deve ser posterior ao fim da pausa.');
        return;
      }
    }

    if (end) {
      const sM = timeToMinutes(start);
      const eM = timeToMinutes(end);
      if (eM <= sM) {
        showToast('O horário de fim do trabalho deve ser posterior ao início.');
        return;
      }
    }

    const totalMinutes = (start && end)
      ? calculateTimesheetTotalMinutes(start, breakStart, breakEnd, end)
      : null;

    const isPaid = document.getElementById('timesheet-is-paid-input')?.value === 'true';

    const currentUser = state.currentUser;
    const staffEmail = (currentUser?.email || '').toLowerCase().trim();

    // Encontra o registro de funcionário correspondente para vincular o staffId
    const matchedStaff = (state.data.staff || []).find(s =>
      (staffEmail && s.email && s.email.toLowerCase() === staffEmail) ||
      (currentUser?.id && s.id === currentUser.id)
    );

    const staffId = matchedStaff?.id || currentUser?.id || 'staff_1';
    const staffName = currentUser?.name || matchedStaff?.name || 'Equipe';

    if (!state.data.timesheets) state.data.timesheets = [];

    if (editId) {
      const existing = state.data.timesheets.find(t => t.id === editId);
      if (existing) {
        existing.date = dateVal;
        existing.startTime = start;
        existing.breakStartTime = breakStart;
        existing.breakEndTime = breakEnd;
        existing.endTime = end;
        existing.totalMinutes = totalMinutes;
        existing.isPaid = isPaid;
        existing.staffId = staffId;
        existing.staffName = staffName;
        if (staffEmail) existing.staffEmail = staffEmail;
        if (currentUser?.photo) existing.staffPhoto = currentUser.photo;
        existing.updatedAt = new Date().toISOString();

        saveData();

        if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
          AirbnbCloudSync.saveDocument('timesheets', existing.id, existing).catch(err => {
            console.warn('[CloudSync] Falha ao atualizar horas no Firestore:', err);
          });
        }

        showToast('Registro de horas atualizado com sucesso!');
      }
    } else {
      const newRecord = {
        id: 'ts_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        staffId: staffId,
        staffName: staffName,
        staffEmail: staffEmail,
        staffPhoto: currentUser?.photo || null,
        date: dateVal,
        startTime: start,
        breakStartTime: breakStart,
        breakEndTime: breakEnd,
        endTime: end,
        totalMinutes: totalMinutes,
        isPaid: isPaid,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      state.data.timesheets.push(newRecord);
      saveData();

      if (window.AirbnbCloudSync && window.isFirebaseConfigured && window.isFirebaseConfigured()) {
        AirbnbCloudSync.saveDocument('timesheets', newRecord.id, newRecord).catch(err => {
          console.warn('[CloudSync] Falha no salvamento imediato de horas no Firestore:', err);
        });
      }

      showToast('Horas registradas com sucesso!');
    }

    document.getElementById('modal-timesheet')?.classList.remove('active');
    renderTimesheets();
  });

  // Modal de Edição de Perfil (Foto e Nome para Equipe e Gestor)
  document.getElementById('btn-open-edit-profile')?.addEventListener('click', openEditProfileModal);
  document.getElementById('user-profile-avatar-trigger')?.addEventListener('click', openEditProfileModal);
  document.getElementById('btn-close-edit-profile-modal')?.addEventListener('click', closeEditProfileModal);
  document.getElementById('btn-cancel-edit-profile')?.addEventListener('click', closeEditProfileModal);

  const btnChooseProfilePhoto = document.getElementById('btn-choose-profile-photo');
  const previewProfilePhotoBox = document.getElementById('profile-photo-preview-box');
  const profilePhotoInput = document.getElementById('profile-photo-input');
  const btnRemoveProfilePhoto = document.getElementById('btn-remove-profile-photo');

  btnChooseProfilePhoto?.addEventListener('click', () => {
    profilePhotoInput?.click();
  });

  previewProfilePhotoBox?.addEventListener('click', () => {
    profilePhotoInput?.click();
  });

  profilePhotoInput?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      compressProfileImage(file, (dataUrl) => {
        state.tempEditProfilePhotoBase64 = dataUrl;
        const previewImg = document.getElementById('profile-photo-preview-img');
        const placeholder = document.getElementById('profile-photo-preview-placeholder');
        if (previewImg) {
          previewImg.src = dataUrl;
          previewImg.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
        if (btnRemoveProfilePhoto) btnRemoveProfilePhoto.style.display = 'inline-block';
        showToast('Foto carregada! Clique em Salvar Alterações para confirmar.');
      });
    }
  });

  btnRemoveProfilePhoto?.addEventListener('click', () => {
    state.tempEditProfilePhotoBase64 = '';
    const previewImg = document.getElementById('profile-photo-preview-img');
    const placeholder = document.getElementById('profile-photo-preview-placeholder');
    if (previewImg) {
      previewImg.src = '';
      previewImg.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = 'flex';
    if (btnRemoveProfilePhoto) btnRemoveProfilePhoto.style.display = 'none';
    if (profilePhotoInput) profilePhotoInput.value = '';
    showToast('Foto removida. Clique em Salvar Alterações para confirmar.');
  });

  document.getElementById('edit-profile-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('edit-profile-name');
    const newName = nameInput ? nameInput.value : '';
    saveUserProfile(newName, state.tempEditProfilePhotoBase64);
    closeEditProfileModal();
  });

  // Inicializa o seletor de horários (Wheel Picker)
  initTimePicker();

  // Inicializa o sistema de Custom Selects e Custom Date Pickers de luxo
  initAllCustomControls();

  // Inicializa o bloqueio de rolagem do fundo quando qualquer modal/popup estiver aberto
  initModalScrollLock();
}

// ==========================================================================
// Bloqueio Absoluto de Rolagem do Fundo para Modais e Popups
// ==========================================================================
function updateBodyScrollLock() {
  const activeModals = document.querySelectorAll('.modal-overlay.active');
  const hasActiveModal = activeModals.length > 0;

  if (hasActiveModal) {
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
  }
}

function resetModalHorizontalScroll(overlay) {
  if (!overlay) return;
  overlay.scrollLeft = 0;
  const sheet = overlay.querySelector('.bottom-sheet');
  if (sheet) sheet.scrollLeft = 0;
  const forms = overlay.querySelectorAll('form');
  forms.forEach(f => { f.scrollLeft = 0; });
}

function initModalScrollLock() {
  // MutationObserver para detectar dinamicamente quando qualquer modal ganha ou perde a classe 'active'
  const observer = new MutationObserver((mutations) => {
    updateBodyScrollLock();
    mutations.forEach(m => {
      if (m.target && m.target.classList && m.target.classList.contains('active')) {
        resetModalHorizontalScroll(m.target);
      }
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    observer.observe(overlay, { attributes: true, attributeFilter: ['class', 'style'] });

    // Previne qualquer scroll horizontal indesejado no sheet
    const sheet = overlay.querySelector('.bottom-sheet');
    if (sheet) {
      sheet.addEventListener('scroll', () => {
        if (sheet.scrollLeft !== 0) sheet.scrollLeft = 0;
      }, { passive: true });
    }

    // Previne que toque ou arraste no fundo escurecido role a página de trás
    overlay.addEventListener('touchmove', (e) => {
      if (!e.target.closest('.bottom-sheet')) {
        e.preventDefault();
      }
    }, { passive: false });

    // Previne que roda do mouse no fundo escurecido role a página de trás
    overlay.addEventListener('wheel', (e) => {
      if (!e.target.closest('.bottom-sheet')) {
        e.preventDefault();
      }
    }, { passive: false });
  });

  updateBodyScrollLock();
}

// Exposição global das funções de transição de tela para suporte direto
window.renderAll = renderAll;
window.showToast = showToast;
window.showGateStep = showGateStep;
window.handlePinKey = handlePinKey;
window.performGoogleLogin = performGoogleLogin;
window.logout = logout;
window.initApp = initApp;
window.openEditProfileModal = openEditProfileModal;
window.closeEditProfileModal = closeEditProfileModal;

// Inicia aplicação com verificação de estado do documento
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

})();
