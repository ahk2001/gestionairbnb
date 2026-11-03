/**
 * Testes Unitários e Funcionais para Pagamento em Dinheiro e Desconto Automático no Timesheet
 * Valida o caso solicitado pelo usuário:
 * "no aba de marcar hora, coloque uma opçao de marcar quanto em dinheiro foi pago,
 * com essa informação adicionada automaticamente sera descontado do valor que falta ser pago.
 * porque as vezes o gestor nao paga o funcionaro por completo do valor devedor (ex: deve 175 e paga 150)"
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TESTE DE PAGAMENTO EM DINHEIRO E DESCONTO AUTOMÁTICO (TIMESHEET) ===\n');

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

// 1. Verificação de Elementos na UI / HTML
test('index.html contém botão no cabeçalho para registrar pagamento em dinheiro (#btn-open-payment-modal)', () => {
  assert(html.includes('id="btn-open-payment-modal"'), 'Falta o botão #btn-open-payment-modal');
});

test('index.html contém botão segmentado Pago en Efectivo (#ts-type-btn-payment)', () => {
  assert(html.includes('id="ts-type-btn-payment"'), 'Falta o botão segmentado #ts-type-btn-payment');
});

test('index.html contém grupo de campos dedicados a pagamento em dinheiro (#ts-payment-fields-group)', () => {
  assert(html.includes('id="ts-payment-fields-group"'), 'Falta o grupo #ts-payment-fields-group');
  assert(html.includes('id="timesheet-payment-cash-amount"'), 'Falta o input #timesheet-payment-cash-amount');
  assert(html.includes('id="ts-payment-cash-calc-preview"'), 'Falta o preview #ts-payment-cash-calc-preview');
  assert(html.includes('id="timesheet-payment-notes"'), 'Falta o campo #timesheet-payment-notes');
});

test('index.html contém campo para indicar dinheiro pago parcial no registro (#timesheet-paid-amount-input)', () => {
  assert(html.includes('id="timesheet-paid-amount-input"'), 'Falta o input #timesheet-paid-amount-input');
  assert(html.includes('id="ts-paid-remaining-badge"'), 'Falta a badge #ts-paid-remaining-badge');
});

test('index.html contém botão de atalho para registrar pagamento no modal do gestor (#btn-mgr-ts-add-payment)', () => {
  assert(html.includes('id="btn-mgr-ts-add-payment"'), 'Falta o botão #btn-mgr-ts-add-payment');
});

// 2. Verificação de Estilos no CSS
test('styles.css possui estilo para cartão de pagamento (.ts-card-payment e .ts-payment-pill)', () => {
  assert(css.includes('.timesheet-card.ts-card-payment'), 'Falta .timesheet-card.ts-card-payment no CSS');
  assert(css.includes('.ts-payment-pill'), 'Falta .ts-payment-pill no CSS');
  assert(css.includes('.ts-payment-amount-badge'), 'Falta .ts-payment-amount-badge no CSS');
  assert(css.includes('.ts-partial-badge'), 'Falta .ts-partial-badge no CSS');
});

// 3. Verificação de Internacionalização (i18n.js)
test('i18n.js contém chaves de internacionalização para pagamentos em dinheiro e parciais', () => {
  assert(i18n.includes('timesheet.btnAddPayment'), 'Falta timesheet.btnAddPayment');
  assert(i18n.includes('modalTs.typePayment'), 'Falta modalTs.typePayment');
  assert(i18n.includes('modalTs.paidAmountLabel'), 'Falta modalTs.paidAmountLabel');
  assert(i18n.includes('toast.paymentSaved'), 'Falta toast.paymentSaved');
  assert(i18n.includes('dialog.deletePaymentConfirm'), 'Falta dialog.deletePaymentConfirm');
});

// 4. Verificação de Lógica em app.js
test('app.js implementa getTimesheetPaymentDetails para calcular valores e quitações', () => {
  assert(appJs.includes('function getTimesheetPaymentDetails'), 'Falta getTimesheetPaymentDetails');
});

test('app.js implementa updateTimesheetCashPaymentPreview e updateTimesheetPaidAmountInputBadge', () => {
  assert(appJs.includes('function updateTimesheetCashPaymentPreview'), 'Falta updateTimesheetCashPaymentPreview');
  assert(appJs.includes('function updateTimesheetPaidAmountInputBadge'), 'Falta updateTimesheetPaidAmountInputBadge');
});

test('app.js trata recordType === "payment" no submit para gravar em state.data.timesheets', () => {
  assert(appJs.includes("recordType === 'payment'"), 'Falta tratamento para recordType === payment no submit');
});

test('app.js permite excluir pagamento em dinheiro pelo botão de deletar com confirmação', () => {
  assert(appJs.includes('const isPayment = record && record.type === \'payment\';'), 'Falta detecção de isPayment na exclusão');
  assert(appJs.includes('toast.paymentDeleted'), 'Falta toast.paymentDeleted na exclusão');
});

// 5. Testes Funcionais da Matemática de Dedução
// Simulação exata do caso do usuário: deve 175 e paga 150 -> resta 25!
test('Simulação Funcional A: Gestor deve 175€ e registra pagamento de 150€ -> Resta pagar exatamente 25€', () => {
  // Mock do ambiente mínimo para rodar getTimesheetPaymentDetails e getStaffTimesheetStats
  const vm = require('vm');
  const sandbox = {
    state: {
      data: {
        timesheets: [
          // Registro 1: 10 horas trabalhadas = 100€
          { id: 'ts_1', staffId: 'staff_ana', date: '2026-11-01', startTime: '08:00', endTime: '18:00', totalMinutes: 600, type: 'hours' },
          // Registro 2: 7,5 horas trabalhadas = 75€
          { id: 'ts_2', staffId: 'staff_ana', date: '2026-11-02', startTime: '08:00', endTime: '15:30', totalMinutes: 450, type: 'hours' },
          // Total devedor bruto: 100€ + 75€ = 175€
          // Registro de pagamento dedicado em dinheiro feito pelo gestor: 150€
          { id: 'ts_pay_1', staffId: 'staff_ana', date: '2026-11-02', amount: 150, type: 'payment', isPaid: true }
        ],
        staff: [{ id: 'staff_ana', name: 'Ana Souza' }]
      }
    },
    TIMESHEET_HOURLY_RATE: 10,
    TIMESHEET_CHECKIN_RATE: 7,
    window: { I18N: null },
    formatMoney: (v) => `€ ${Number(v).toFixed(2).replace('.', ',')}`,
    minutesToFormatted: (m) => `${Math.floor(m / 60)}h ${m % 60}m`,
    getTimesheetMinutes: (t) => t.totalMinutes || 0,
    getTimesheetRecordAmount: (t) => {
      if (!t) return 0;
      if (t.type === 'payment') return Number(t.amount) || 0;
      if (t.type === 'service') return Number(t.servicePrice) || 7;
      return ((t.totalMinutes || 0) / 60) * 10;
    }
  };

  // Extrair o código de getTimesheetPaymentDetails e getStaffTimesheetStats
  const codeToRun = `
    ${appJs.substring(appJs.indexOf('function getTimesheetPaymentDetails'), appJs.indexOf('function renderTimesheets'))}
  `;
  vm.createContext(sandbox);
  vm.runInContext(codeToRun, sandbox);

  const stats = sandbox.getStaffTimesheetStats('staff_ana', null, null);

  assert.strictEqual(stats.grossGrandTotal, 175, 'O total bruto devedor deve ser 175€');
  assert.strictEqual(stats.paidGrandTotal, 150, 'O total pago em dinheiro deve ser 150€');
  assert.strictEqual(stats.unpaidGrandTotal, 25, 'O saldo que falta pagar deve ser exatamente 25€');
  assert.strictEqual(stats.hasUnpaid, true, 'Deve indicar que ainda há valor pendente');
});

test('Simulação Funcional B: Registro com pagamento parcial (deve 175€, pago 150€ no card -> resta 25€)', () => {
  const vm = require('vm');
  const sandbox = {
    TIMESHEET_HOURLY_RATE: 10,
    TIMESHEET_CHECKIN_RATE: 7,
    getTimesheetRecordAmount: (t) => Number(t.servicePrice) || 0
  };

  const codeToRun = `
    ${appJs.substring(appJs.indexOf('function getTimesheetPaymentDetails'), appJs.indexOf('function getStaffTimesheetStats'))}
  `;
  vm.createContext(sandbox);
  vm.runInContext(codeToRun, sandbox);

  const serviceRecord = {
    id: 'ts_serv_1',
    type: 'service',
    servicePrice: 175,
    paidAmount: 150
  };

  const details = sandbox.getTimesheetPaymentDetails(serviceRecord);
  assert.strictEqual(details.totalAmount, 175, 'Total do serviço deve ser 175€');
  assert.strictEqual(details.paidAmount, 150, 'Valor pago deve ser 150€');
  assert.strictEqual(details.remainingAmount, 25, 'Valor restante deve ser 25€');
  assert.strictEqual(details.isPartial, true, 'Deve constar como pagamento parcial');
  assert.strictEqual(details.isFullyPaid, false, 'Não deve constar como quitado totalmente');
});

test('Simulação Funcional C: Quitação integral de saldo devedor (deve 175€ e paga os 25€ restantes)', () => {
  const vm = require('vm');
  const sandbox = {
    state: {
      data: {
        timesheets: [
          { id: 'ts_1', staffId: 'staff_ana', startTime: '08:00', endTime: '18:00', totalMinutes: 600, type: 'hours' }, // 100€
          { id: 'ts_2', staffId: 'staff_ana', startTime: '08:00', endTime: '15:30', totalMinutes: 450, type: 'hours' }, // 75€
          { id: 'ts_pay_1', staffId: 'staff_ana', amount: 150, type: 'payment', isPaid: true }, // 150€
          { id: 'ts_pay_2', staffId: 'staff_ana', amount: 25, type: 'payment', isPaid: true }   // 25€
        ],
        staff: [{ id: 'staff_ana', name: 'Ana Souza' }]
      }
    },
    TIMESHEET_HOURLY_RATE: 10,
    TIMESHEET_CHECKIN_RATE: 7,
    window: { I18N: null },
    formatMoney: (v) => `€ ${Number(v).toFixed(2).replace('.', ',')}`,
    minutesToFormatted: (m) => `${Math.floor(m / 60)}h ${m % 60}m`,
    getTimesheetMinutes: (t) => t.totalMinutes || 0,
    getTimesheetRecordAmount: (t) => {
      if (!t) return 0;
      if (t.type === 'payment') return Number(t.amount) || 0;
      return ((t.totalMinutes || 0) / 60) * 10;
    }
  };

  const codeToRun = `
    ${appJs.substring(appJs.indexOf('function getTimesheetPaymentDetails'), appJs.indexOf('function renderTimesheets'))}
  `;
  vm.createContext(sandbox);
  vm.runInContext(codeToRun, sandbox);

  const stats = sandbox.getStaffTimesheetStats('staff_ana', null, null);
  assert.strictEqual(stats.grossGrandTotal, 175, 'Total bruto deve ser 175€');
  assert.strictEqual(stats.paidGrandTotal, 175, 'Total pago deve ser 175€');
  assert.strictEqual(stats.unpaidGrandTotal, 0, 'Saldo devedor deve ser 0€');
  assert.strictEqual(stats.hasUnpaid, false, 'Não deve haver pendências');
});

console.log('\n========================================');
console.log(`TOTAL: ${passed} testes aprovados, 0 falhas.`);
console.log('✅ TESTE DE PAGAMENTO EM DINHEIRO E DESCONTO AUTOMÁTICO 100% APROVADO!\n');
