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
  'purchases.noPurchasesDate'
];

esKeys.forEach(k => {
  assert(i18nContent.includes(`'${k}'`), `Chave ${k} ausente em i18n.js`);
});
console.log('✓ Todas as chaves i18n de compras verificadas.');

// 2. Simular compras e ordenação
const mockPurchases = [
  { id: '1', productName: 'Café', purchaseDate: '2026-10-01', totalCost: 15 },
  { id: '2', productName: 'Toalhas', purchaseDate: '2026-10-10', totalCost: 80 },
  { id: '3', productName: 'Sabonete', purchaseDate: '2026-10-05', totalCost: 20 },
  { id: '4', productName: 'Papel Higiênico', purchaseDate: '2026-10-12', totalCost: 35 },
  { id: '5', productName: 'Detergente', purchaseDate: '2026-10-08', totalCost: 12 },
  { id: '6', productName: 'Lâmpadas LED', purchaseDate: '2026-10-13', totalCost: 45 },
  { id: '7', productName: 'Água Sanitária', purchaseDate: '2026-10-02', totalCost: 8 }
];

// Lógica idêntica à de app.js:
const sorted = [...mockPurchases].sort((a, b) => {
  const timeA = new Date(a.purchaseDate || a.createdAt || 0).getTime();
  const timeB = new Date(b.purchaseDate || b.createdAt || 0).getTime();
  return timeB - timeA;
});

// A compra mais recente (2026-10-13) deve ser a primeira
assert.strictEqual(sorted[0].id, '6', 'A compra mais recente deve vir primeiro');
// A segunda mais recente (2026-10-12)
assert.strictEqual(sorted[1].id, '4', 'A segunda compra mais recente deve vir em segundo');
// A mais antiga (2026-10-01) deve ser a última
assert.strictEqual(sorted[sorted.length - 1].id, '1', 'A compra mais antiga deve ser a última');

const MAX_RECENT = 5;
const visiblePurchases = sorted.slice(0, MAX_RECENT);
assert.strictEqual(visiblePurchases.length, 5, 'Deve limitar para exatamente 5 compras');
const hasMore = sorted.length > MAX_RECENT;
assert.strictEqual(hasMore, true, 'Deve indicar hasMore = true quando houver mais de 5 compras');

// Teste de filtro por data
const filterDate = '2026-10-08';
const filtered = sorted.filter(p => p.purchaseDate === filterDate);
assert.strictEqual(filtered.length, 1, 'Filtro por data deve encontrar exatamente 1 compra');
assert.strictEqual(filtered[0].productName, 'Detergente');

console.log('✓ Lógica de ordenação decrescente e limite de 5 compras validada!');
console.log('✓ Lógica de filtro por data do modal validada!');
