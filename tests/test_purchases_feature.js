const assert = require('assert');
const fs = require('fs');

// Carrega os arquivos
const i18nContent = fs.readFileSync('i18n.js', 'utf8');
const appJsContent = fs.readFileSync('app.js', 'utf8');

// 1. Validar que i18n possui todas as chaves de compras em ES e PT
const esKeys = [
  'purchases.btnViewMore',
  'purchases.modalAllTitle',
  'purchases.filterDateLabel',
  'purchases.allDatesBtn',
  'purchases.filteredSummary',
  'purchases.noPurchasesDate',
  'purchases.btnCloseModal'
];

esKeys.forEach(k => {
  assert(i18nContent.includes(`'${k}'`), `Chave ${k} ausente em i18n.js`);
});
console.log('✓ Todas as chaves i18n de compras verificadas.');

// Extrai a função comparePurchasesDesc diretamente de app.js via eval seguro em contexto isolado
const vm = require('vm');
const sandbox = { window: {}, console: console };
vm.createContext(sandbox);

// Executa parte de app.js relevante
const getExactTimeCode = appJsContent.slice(
  appJsContent.indexOf('function getPurchaseExactTime'),
  appJsContent.indexOf('function renderPurchaseCardHtml')
);
vm.runInContext(getExactTimeCode, sandbox);

const comparePurchasesDesc = sandbox.comparePurchasesDesc;
assert(typeof comparePurchasesDesc === 'function', 'comparePurchasesDesc deve ser uma função');

// 2. Simular exatamente o cenário do usuário:
// 4 compras no dia 13/10 e 1 compra no dia 11/10
// A compra de 1 euro foi a última registrada hoje (timestamp mais alto)
const userPurchases = [
  { id: 'pur_1728841000000', purchaseDate: '2026-10-13', productName: '10x Amaciante Concen...', totalCost: 70 },
  { id: 'pur_1728842000000', purchaseDate: '2026-10-13', productName: 'Luvas de Nitrilo Pequeno', totalCost: 20 },
  { id: 'pur_1728843000000', purchaseDate: '2026-10-13', productName: 'Luvas de Nitrilo Pequeno', totalCost: 80 },
  { id: 'pur_1728849000000', purchaseDate: '2026-10-13', productName: 'Amaciante Concentrado Violets', totalCost: 1 }, // Feita por último!
  { id: 'pur_1', purchaseDate: '2026-10-11', productName: 'Luvas dia 11', totalCost: 5 }
];

// Supondo que vieram fora de ordem do Firestore
const unsorted = [
  userPurchases[0],
  userPurchases[1],
  userPurchases[2],
  userPurchases[3],
  userPurchases[4]
];

const sorted = [...unsorted].sort(comparePurchasesDesc);

// A compra de 1 euro (última registrada hoje) DEVE ser a 1ª (índice 0)
assert.strictEqual(sorted[0].totalCost, 1, 'A compra de 1 euro DEVE ser a primeira!');
assert.strictEqual(sorted[0].id, 'pur_1728849000000');

// A compra de 80 euros deve ser a 2ª
assert.strictEqual(sorted[1].totalCost, 80);

// A compra de 20 euros deve ser a 3ª
assert.strictEqual(sorted[2].totalCost, 20);

// A compra de 70 euros deve ser a 4ª
assert.strictEqual(sorted[3].totalCost, 70);

// A compra do dia 11 deve ser a 5ª
assert.strictEqual(sorted[4].totalCost, 5);

console.log('✓ Cenário do usuário validado: compra de 1 euro aparece em 1º lugar!');
console.log('Ordem correta das 5 primeiras compras:');
sorted.forEach((p, idx) => {
  console.log(`  ${idx + 1}º: € ${p.totalCost.toFixed(2)} - ${p.productName} (${p.purchaseDate})`);
});
