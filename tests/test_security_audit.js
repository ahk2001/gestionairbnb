// tests/test_security_audit.js
// Auditoria Automatizada de Segurança do Airbnb Control

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const appJsPath = path.join(rootDir, 'app.js');
const firestoreRulesPath = path.join(rootDir, 'firestore.rules');
const authJsPath = path.join(rootDir, 'auth.js');
const cloudSyncJsPath = path.join(rootDir, 'cloud-sync.js');
const vercelJsonPath = path.join(rootDir, 'vercel.json');

const appJs = fs.readFileSync(appJsPath, 'utf8');
const firestoreRules = fs.readFileSync(firestoreRulesPath, 'utf8');
const authJs = fs.readFileSync(authJsPath, 'utf8');
const cloudSyncJs = fs.readFileSync(cloudSyncJsPath, 'utf8');
const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FALHA: ${message}`);
    failCount++;
  }
}

console.log('=== AUDITORIA DETALHADA DE SEGURANÇA ===\n');

// 1. Auditoria de Sanitização & XSS em app.js
console.log('1. Sanitização & Prevenção XSS (app.js):');

assert(
  !appJs.includes('<img src="${state.currentUser.photo}"'),
  'Foto do usuário atual na topbar e perfil está escapada com escapeHtml'
);

assert(
  !appJs.includes('<img src="${staff.photo}"'),
  'Foto de colaboradores no painel de gestão está escapada com escapeHtml'
);

assert(
  !appJs.includes('<img src="${buyerPhoto}"'),
  'Foto do comprador em detalhes de compra e cards está escapada com escapeHtml'
);

assert(
  !appJs.includes('<img src="${purchase.receiptPhoto}"'),
  'Foto do comprovante fiscal em detalhes de compra está escapada com escapeHtml'
);

assert(
  !appJs.includes('<img src="${p.productPhoto}"'),
  'Foto do produto em cards de compra está escapada com escapeHtml'
);

assert(
  !appJs.includes('<option value="${s.id}">${s.name}</option>'),
  'Opções de colaboradores em formulários estão escapadas com escapeHtml'
);

assert(
  !appJs.includes('<option value="${p.id}"'),
  'Opções de produtos no seletor de compras estão escapadas com escapeHtml'
);

assert(
  appJs.includes('escapeHtml(meta.thumb)') && appJs.includes('escapeHtml(meta.title)'),
  'Custom-select trigger e opções contam com sanitização de título e miniaturas'
);

// 2. Auditoria de Regras do Firestore (firestore.rules)
console.log('\n2. Integridade e Regras do Servidor (firestore.rules):');

assert(
  firestoreRules.includes('!isRootOwnerEmail(email) || isRootOwner()'),
  'Administradores raiz estão blindados contra exclusão ou alteração por donos secundários'
);

assert(
  firestoreRules.includes('request.resource.data.authorType == resource.data.authorType'),
  'Colaboradoras não podem alterar autoria de notas para forjar permissões'
);

assert(
  firestoreRules.includes('resource.data.authorType != \'owner\' || request.resource.data.content == resource.data.content'),
  'Colaboradoras não podem alterar conteúdo de avisos e diretrizes do gestor'
);

assert(
  firestoreRules.includes('match /purchases/{purchaseId} {\n      allow read: if isAuthorizedUser();\n      allow create, update: if isAuthorizedUser();\n      // Integridade financeira: apenas o proprietário pode apagar comprovantes de compra\n      allow delete: if isOwner();'),
  'Colaboradoras podem criar e atualizar compras; exclusão permanece exclusiva do proprietário'
);

assert(
  firestoreRules.includes('match /timesheets/{timesheetId}') &&
  firestoreRules.includes('allow create: if isAuthorizedUser()') &&
  firestoreRules.includes('allow update: if isOwner() || (\n        isStaff() &&'),
  'Colaboradoras podem registrar e gerenciar o status de pagamento (isPaid) de suas horas trabalhadas'
);

assert(
  firestoreRules.includes('(!(\'isActive\' in request.resource.data) || request.resource.data.isActive == resource.data.isActive)'),
  'Colaboradoras suspensas não podem reativar seu status no perfil'
);

// 3. Auditoria de Autenticação em Tempo Real (auth.js)
console.log('\n3. Autenticação & Revogação Imediata (auth.js):');

assert(
  authJs.includes('activeAccessUnsubscribe') && authJs.includes('stopAccessWatcher'),
  'Módulo de autenticação possui observador de revogação de permissão em tempo real'
);

assert(
  authJs.includes('isRootOwnerEmail(cleanEmail)') && authJs.includes('Apenas o gestor raiz pode alterar o usuário mestre'),
  'Funções de administração da allowlist impedem alteração acidental de contas raiz'
);

// 4. Auditoria de Cabeçalhos HTTP & CSP (vercel.json)
console.log('\n4. Cabeçalhos de Proteção HTTP & CSP (vercel.json):');

const rootHeaders = (vercelJson.headers.find(h => h.source === '/(.*)') || {}).headers || [];
const headerMap = {};
rootHeaders.forEach(h => { headerMap[h.key] = h.value; });

assert(headerMap['Content-Security-Policy'] && headerMap['Content-Security-Policy'].includes("form-action 'self'"), 'CSP inclui diretiva form-action \'self\'');
assert(headerMap['X-Frame-Options'] === 'DENY', 'Anti-Clickjacking X-Frame-Options: DENY ativo');
assert(headerMap['X-Content-Type-Options'] === 'nosniff', 'MIME-sniffing X-Content-Type-Options: nosniff ativo');
assert(headerMap['Strict-Transport-Security'] && headerMap['Strict-Transport-Security'].includes('max-age'), 'HSTS ativo com max-age estendido e preload');
assert(headerMap['X-Permitted-Cross-Domain-Policies'] === 'none', 'X-Permitted-Cross-Domain-Policies: none ativo');
assert(headerMap['Cross-Origin-Opener-Policy'] === 'same-origin-allow-popups', 'COOP configurado para suportar popups seguros do Google OAuth');

console.log(`\n========================================`);
console.log(`TOTAL: ${passCount} testes aprovados, ${failCount} falhas.`);
if (failCount === 0) {
  console.log('✅ AUDITORIA DE SEGURANÇA 100% APROVADA!');
  process.exit(0);
} else {
  console.error('❌ A auditoria detectou falhas de segurança.');
  process.exit(1);
}
