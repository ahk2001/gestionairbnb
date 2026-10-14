// tests/test_product_deletion.js
// Teste de integridade da exclusão de produtos e sincronização com a nuvem

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const appJs = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');
const cloudSyncJs = fs.readFileSync(path.join(rootDir, 'cloud-sync.js'), 'utf8');
const firestoreRules = fs.readFileSync(path.join(rootDir, 'firestore.rules'), 'utf8');

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

console.log('=== TESTE DE EXCLUSÃO DE PRODUTOS E CLOUD SYNC ===\n');

// 1. cloud-sync.js API e blindagem
console.log('1. cloud-sync.js:');
assert(
  cloudSyncJs.includes('deleteDocuments,') && cloudSyncJs.includes('async function deleteDocuments'),
  'cloud-sync.js expõe e implementa a função deleteDocuments para deleção em lote'
);

assert(
  cloudSyncJs.includes('function markAsDeleted') && cloudSyncJs.includes('function isRecentlyDeleted'),
  'cloud-sync.js possui rastreamento de IDs recentemente excluídos para prevenir ressuscitação por snapshot'
);

assert(
  cloudSyncJs.includes('isRecentlyDeleted(colName, docSnap.id)'),
  'onSnapshot ignora documentos recentemente deletados caso chegue um snapshot desatualizado'
);

assert(
  cloudSyncJs.includes('isRecentlyDeleted(collectionName, docId)'),
  'syncCollectionBatch não reenvia documentos que acabaram de ser excluídos'
);

// 2. app.js: Chamadas de exclusão na nuvem
console.log('\n2. app.js (operações de exclusão no estoque e catálogo):');
assert(
  appJs.includes("AirbnbCloudSync.deleteDocuments('products', toDeleteIds)"),
  'deleteProduct aciona deleteDocuments na nuvem ao excluir produto de todos os imóveis'
);

assert(
  appJs.includes("AirbnbCloudSync.deleteDocument('products', productId)"),
  'deleteProduct aciona deleteDocument na nuvem ao excluir produto de um único imóvel'
);

assert(
  appJs.includes("AirbnbCloudSync.deleteDocuments('products', prodIdsToDelete)") &&
  appJs.includes("AirbnbCloudSync.saveDocument('trashProducts', trashItem.id, trashItem)"),
  'moveProductToTrash remove os produtos do estoque no Firestore e adiciona à lixeira na nuvem'
);

assert(
  appJs.includes("AirbnbCloudSync.deleteDocument('trashProducts', trashId)") &&
  appJs.includes("AirbnbCloudSync.syncCollectionBatch('products', newProducts)"),
  'restoreTrashProduct remove o item da lixeira e recria os produtos no Firestore'
);

assert(
  appJs.includes("AirbnbCloudSync.deleteDocument('trashProducts', trashId)"),
  'purgeTrashProduct remove permanentemente o documento da lixeira na nuvem'
);

// 3. firestore.rules: Permissões de exclusão
console.log('\n3. firestore.rules (permissões de segurança):');
assert(
  firestoreRules.includes('match /products/{productId} {\n      allow read: if isAuthorizedUser();\n      allow create, update: if isAuthorizedUser();\n      allow delete: if isAuthorizedUser();'),
  'firestore.rules permite delete em /products para usuários autorizados (gestor e equipe)'
);

assert(
  firestoreRules.includes('match /trashProducts/{trashId} {\n      allow read: if isAuthorizedUser();\n      allow create, update: if isAuthorizedUser();\n      allow delete: if isAuthorizedUser();'),
  'firestore.rules permite delete em /trashProducts para usuários autorizados'
);

console.log(`\n========================================`);
console.log(`TOTAL: ${pass} aprovados, ${fail} falhas.`);
if (fail === 0) {
  console.log('✅ TESTE DE EXCLUSÃO DE PRODUTOS 100% APROVADO!');
  process.exit(0);
} else {
  console.error('❌ Falhas detectadas no teste.');
  process.exit(1);
}
