/**
 * Testes Automatizados para Filtros de Horas Trabalhadas e Correção Visual do Card Minimiziado de Check-in
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TESTE DE FILTROS DO TIMESHEET E LAYOUT MINIMIZADO DO CHECK-IN ===\n');

const htmlPath = path.join(__dirname, '..', 'index.html');
const appJsPath = path.join(__dirname, '..', 'app.js');
const cssPath = path.join(__dirname, '..', 'styles.css');
const i18nPath = path.join(__dirname, '..', 'i18n.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const i18n = fs.readFileSync(i18nPath, 'utf8');

let passed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    Erro: ${err.message}`);
    process.exit(1);
  }
}

// 1. Verificação dos Elementos de Filtro no HTML
test('index.html contém container principal de filtros (#timesheet-filter-container)', () => {
  assert(html.includes('id="timesheet-filter-container"'), 'Falta #timesheet-filter-container no HTML');
});

test('index.html contém pílulas de filtro por data (#timesheet-date-filters)', () => {
  assert(html.includes('id="timesheet-date-filters"'), 'Falta #timesheet-date-filters no HTML');
  assert(html.includes('data-ts-date-filter="todos"'), 'Falta filtro todos');
  assert(html.includes('data-ts-date-filter="este_mes"'), 'Falta filtro este_mes');
  assert(html.includes('data-ts-date-filter="semana"'), 'Falta filtro semana');
  assert(html.includes('data-ts-date-filter="hoje"'), 'Falta filtro hoje');
  assert(html.includes('data-ts-date-filter="ontem"'), 'Falta filtro ontem');
});

test('index.html contém seletor de mês específico (#timesheet-month-select)', () => {
  assert(html.includes('id="timesheet-month-select"'), 'Falta #timesheet-month-select no HTML');
});

test('index.html contém pílulas de filtro por tipo / status (#timesheet-type-filters)', () => {
  assert(html.includes('id="timesheet-type-filters"'), 'Falta #timesheet-type-filters no HTML');
  assert(html.includes('data-ts-type-filter="unpaid"'), 'Falta filtro unpaid (a cobrar)');
  assert(html.includes('data-ts-type-filter="paid"'), 'Falta filtro paid (pagados)');
  assert(html.includes('data-ts-type-filter="hours"'), 'Falta filtro hours');
  assert(html.includes('data-ts-type-filter="service"'), 'Falta filtro service (check-ins)');
  assert(html.includes('data-ts-type-filter="payment"'), 'Falta filtro payment (pagos €)');
});

test('index.html contém barra informativa e botão de limpar filtros (#timesheet-filter-info-bar)', () => {
  assert(html.includes('id="timesheet-filter-info-bar"'), 'Falta #timesheet-filter-info-bar no HTML');
  assert(html.includes('id="btn-timesheet-clear-filters"'), 'Falta #btn-timesheet-clear-filters no HTML');
});

// 2. Verificação de Estilos no CSS (Layout, Anti-Overflow e Filtros)
test('styles.css previne overflow no card (.timesheet-card com overflow: hidden)', () => {
  assert(css.includes('overflow: hidden'), 'Falta overflow: hidden');
  assert(css.includes('.timesheet-card'), 'Falta .timesheet-card');
});

test('styles.css restringe largura e overflow do título do check-in (.ts-service-title com ellipsis)', () => {
  assert(css.includes('.ts-service-title'), 'Falta .ts-service-title no CSS');
  assert(css.includes('text-overflow: ellipsis'), 'Falta text-overflow: ellipsis no CSS');
});

test('styles.css define regras para as pílulas de filtro do timesheet (.timesheet-pill e .timesheet-filter-container)', () => {
  assert(css.includes('.timesheet-filter-container'), 'Falta .timesheet-filter-container no CSS');
  assert(css.includes('.timesheet-pill'), 'Falta .timesheet-pill no CSS');
  assert(css.includes('.timesheet-month-select'), 'Falta .timesheet-month-select no CSS');
});

// 3. Verificação de Lógica em app.js
test('app.js implementa filterTimesheetsList para filtrar registros', () => {
  assert(appJs.includes('function filterTimesheetsList'), 'Falta filterTimesheetsList em app.js');
});

test('app.js implementa populateTimesheetMonthSelector para gerar meses dinâmicos', () => {
  assert(appJs.includes('function populateTimesheetMonthSelector'), 'Falta populateTimesheetMonthSelector em app.js');
});

test('app.js implementa resetTimesheetFilters para resetar filtros ao padrão', () => {
  assert(appJs.includes('function resetTimesheetFilters'), 'Falta resetTimesheetFilters em app.js');
});

// 4. Teste Funcional de Filtragem em Sandbox
test('Simulação Funcional de Filtros: Filtra corretamente por período e status', () => {
  const vm = require('vm');
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const sandbox = {
    state: {
      timesheetDateFilter: 'todos',
      timesheetSelectedMonth: '',
      timesheetTypeFilter: 'todos'
    },
    getPurchaseDateFilterRange: () => ({
      todayStr,
      yesterdayStr,
      mondayStr: todayStr,
      sundayStr: todayStr,
      currentYearMonth
    }),
    getTimesheetPaymentDetails: (t) => ({
      isFullyPaid: Boolean(t.isPaid),
      isPartial: false
    })
  };

  const codeToRun = `
    ${appJs.substring(appJs.indexOf('function filterTimesheetsList'), appJs.indexOf('function populateTimesheetMonthSelector'))}
  `;
  vm.createContext(sandbox);
  vm.runInContext(codeToRun, sandbox);

  const sampleTimesheets = [
    { id: '1', date: todayStr, type: 'hours', isPaid: false },
    { id: '2', date: yesterdayStr, type: 'service', isPaid: true },
    { id: '3', date: '2025-01-01', type: 'hours', isPaid: true },
    { id: '4', date: todayStr, type: 'payment', isPaid: true }
  ];

  // Teste 1: Todos (deve retornar os 4)
  sandbox.state.timesheetDateFilter = 'todos';
  sandbox.state.timesheetTypeFilter = 'todos';
  let res = sandbox.filterTimesheetsList(sampleTimesheets);
  assert.strictEqual(res.length, 4, 'Filtro todos deve retornar todos os registros');

  // Teste 2: Hoje (deve retornar registro 1 e 4)
  sandbox.state.timesheetDateFilter = 'hoje';
  res = sandbox.filterTimesheetsList(sampleTimesheets);
  assert.strictEqual(res.length, 2, 'Filtro hoje deve retornar 2 registros');

  // Teste 3: Ontem (deve retornar registro 2)
  sandbox.state.timesheetDateFilter = 'ontem';
  res = sandbox.filterTimesheetsList(sampleTimesheets);
  assert.strictEqual(res.length, 1, 'Filtro ontem deve retornar 1 registro');
  assert.strictEqual(res[0].id, '2');

  // Teste 4: Não pagos (unpaid)
  sandbox.state.timesheetDateFilter = 'todos';
  sandbox.state.timesheetTypeFilter = 'unpaid';
  res = sandbox.filterTimesheetsList(sampleTimesheets);
  assert.strictEqual(res.length, 1, 'Filtro unpaid deve retornar 1 registro');
  assert.strictEqual(res[0].id, '1');

  // Teste 5: Check-in / Service
  sandbox.state.timesheetTypeFilter = 'service';
  res = sandbox.filterTimesheetsList(sampleTimesheets);
  assert.strictEqual(res.length, 1, 'Filtro service deve retornar o check-in');
  assert.strictEqual(res[0].type, 'service');

  // Teste 6: Pagamentos (payment)
  sandbox.state.timesheetTypeFilter = 'payment';
  res = sandbox.filterTimesheetsList(sampleTimesheets);
  assert.strictEqual(res.length, 1, 'Filtro payment deve retornar o pagamento em dinheiro');
  assert.strictEqual(res[0].type, 'payment');
});

console.log('\n========================================');
console.log(`TOTAL: ${passed} testes aprovados, 0 falhas.`);
console.log('✅ TESTE DE FILTROS E LAYOUT DO TIMESHEET 100% APROVADO!\n');
