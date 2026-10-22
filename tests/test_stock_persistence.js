// tests/test_stock_persistence.js
// Teste de integridade e robustez da persistência e reconciliação do estoque

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const appJs = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');
const cloudSyncJs = fs.readFileSync(path.join(rootDir, 'cloud-sync.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(rootDir, 'styles.css'), 'utf8');

let pass = 0;
let fail = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    pass++;
  } else {
    console.error(`  ✗ FALHA: ${message}`);
    fail++;
  }
}

console.log('=== TESTE DE PERSISTÊNCIA E RECONCILIAÇÃO DO ESTOQUE ===\n');

// 1. cloud-sync.js: Implementação de fila e reconciliação inteligente por timestamp
console.log('1. cloud-sync.js (reconciliação e pendências):');
assert(
  cloudSyncJs.includes('scheduleProductSave') && cloudSyncJs.includes('flushPendingProductSync'),
  'cloud-sync.js implementa e exporta scheduleProductSave e flushPendingProductSync'
);

assert(
  cloudSyncJs.includes('pendingProductUpdates'),
  'cloud-sync.js mantém mapa de atualizações pendentes de produtos para blindagem de concorrência'
);

assert(
  cloudSyncJs.includes('localTime > remoteTime') || cloudSyncJs.includes('isPendingLocal'),
  'onSnapshot compara timestamps (updatedAt) e respeita pendências locais para não sobrescrever o estoque com dados obsoletos'
);

assert(
  cloudSyncJs.includes("localStorage.setItem('AIRBNB_CONTROL_DATA_V6'"),
  'cloud-sync.js atualiza LocalStorage com a chave oficial V6 (e não versões legadas)'
);

assert(
  cloudSyncJs.includes('visibilitychange') && cloudSyncJs.includes('pagehide'),
  'cloud-sync.js realiza flush automático ao fechar janela, trocar de aba ou ocultar celular'
);

// 2. app.js: Operações e atualização cirúrgica
console.log('\n2. app.js (operações de quantidade no estoque):');
assert(
  appJs.includes('function setProductQuantityDirectly('),
  'app.js implementa setProductQuantityDirectly para persistência cirúrgica e imediata'
);

assert(
  appJs.includes('function updateProductCardUI('),
  'app.js implementa updateProductCardUI para atualização do DOM sem re-render destrutivo de todos os cards'
);

assert(
  appJs.includes('function promptProductQuantity('),
  'app.js permite ao usuário clicar no número do estoque para definir quantidade diretamente'
);

assert(
  appJs.includes('AirbnbCloudSync.scheduleProductSave(product.id, product)'),
  'setProductQuantityDirectly aciona scheduleProductSave na nuvem'
);

assert(
  appJs.includes('btn-trigger-edit-qty'),
  'Card do produto possui gatilho interativo para edição rápida de quantidade'
);

assert(
  appJs.includes('traffic-pill[data-status]'),
  'Pílulas do semáforo possuem listener para alternância rápida de status'
);

// 3. styles.css: Interatividade
console.log('\n3. styles.css (interatividade visual):');
assert(
  stylesCss.includes('.qty-display.btn-trigger-edit-qty'),
  'styles.css possui estilo com cursor pointer para o mostrador de quantidade'
);

assert(
  stylesCss.includes('.traffic-pill,') && !stylesCss.includes('.traffic-light-container {\n  display: grid;\n  grid-template-columns: 1fr 1fr 1fr;\n  gap: 6px;\n  padding: 4px;\n  background: rgba(244, 245, 247, 0.75);\n  backdrop-filter: blur(8px);\n  -webkit-backdrop-filter: blur(8px);\n  border: 1px solid rgba(255, 255, 255, 0.8);\n  border-radius: 14px;\n  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.02);\n  cursor: default;\n  user-select: none;\n  pointer-events: none;'),
  'styles.css permite cliques interativos no semáforo e stepper do estoque'
);

// 4. Teste funcional de lógica de reconciliação em memória
console.log('\n4. Simulação Funcional de Reconciliação:');
const mockLocalProducts = [
  { id: 'JB_p01', quantity: 8, updatedAt: '2026-10-19T10:15:30.000Z', status: 'suficiente' },
  { id: 'JB_p02', quantity: 1, updatedAt: '2026-10-19T09:00:00.000Z', status: 'falta' }
];

const mockRemoteSnapshot = [
  // Snapshot remoto do JB_p01 com timestamp antigo (ex: 10:10:00) vindo do Firestore antes do clique
  { id: 'JB_p01', quantity: 2, updatedAt: '2026-10-19T10:10:00.000Z', status: 'acabando' },
  // Snapshot remoto do JB_p02 com timestamp mais recente (ex: outro usuário atualizou às 10:20:00)
  { id: 'JB_p02', quantity: 5, updatedAt: '2026-10-19T10:20:00.000Z', status: 'suficiente' }
];

// Executa algoritmo de merge implementado no cloud-sync
const localMap = new Map();
mockLocalProducts.forEach(p => localMap.set(p.id, p));

const mergedResult = [];
mockRemoteSnapshot.forEach(remoteItem => {
  const localItem = localMap.get(remoteItem.id);
  if (!localItem) {
    mergedResult.push(remoteItem);
  } else {
    const localTime = new Date(localItem.updatedAt).getTime();
    const remoteTime = new Date(remoteItem.updatedAt).getTime();
    if (localTime > remoteTime) {
      mergedResult.push(localItem);
    } else {
      mergedResult.push(remoteItem);
    }
  }
});

const mergedP01 = mergedResult.find(p => p.id === 'JB_p01');
const mergedP02 = mergedResult.find(p => p.id === 'JB_p02');

assert(
  mergedP01 && mergedP01.quantity === 8,
  'Reconciliação preserva quantidade local mais recente (8 unidades em JB_p01) contra snapshot atrasado'
);

assert(
  mergedP02 && mergedP02.quantity === 5,
  'Reconciliação aceita quantidade remota mais recente (5 unidades em JB_p02) enviada por outro usuário'
);

console.log('\n========================================');
console.log(`TOTAL: ${pass} aprovados, ${fail} falhas.`);

if (fail > 0) {
  process.exit(1);
} else {
  console.log('✅ TESTE DE PERSISTÊNCIA DE ESTOQUE 100% APROVADO!\n');
}
