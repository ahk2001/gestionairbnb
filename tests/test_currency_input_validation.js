const fs = require('fs');
const assert = require('assert');

console.log('=== TESTE DE CORREÇÃO DE VALIDAÇÃO DE INPUT DE VALORES ===\n');

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exit(1);
  }
}

test('Formulário timesheet-form possui novalidate para evitar bloqueios rígidos do navegador', () => {
  assert(html.includes('<form id="timesheet-form" class="purchase-form" novalidate>'), 'Falta novalidate em timesheet-form');
});

test('Input timesheet-payment-cash-amount aceita digitação flexível sem restrição step=0.50 e min=0.01', () => {
  assert(html.includes('id="timesheet-payment-cash-amount"'), 'Input não encontrado');
  assert(!html.includes('id="timesheet-payment-cash-amount" class="form-input" placeholder="0,00" step="0.50" min="0.01"'), 'Ainda possui step=0.50 e min=0.01 restritivo');
  assert(html.includes('inputmode="decimal" id="timesheet-payment-cash-amount"'), 'Deve usar inputmode=decimal');
});

test('Input timesheet-paid-amount-input aceita digitação flexível sem restrição step=0.50', () => {
  assert(html.includes('id="timesheet-paid-amount-input"'), 'Input não encontrado');
  assert(!html.includes('id="timesheet-paid-amount-input" class="form-input" placeholder="0,00" step="0.50"'), 'Ainda possui step=0.50');
  assert(html.includes('inputmode="decimal" id="timesheet-paid-amount-input"'), 'Deve usar inputmode=decimal');
});

test('Input timesheet-service-price aceita digitação flexível sem restrição step=0.50', () => {
  assert(html.includes('id="timesheet-service-price"'), 'Input não encontrado');
  assert(!html.includes('id="timesheet-service-price" class="form-input" placeholder="0,00" step="0.50"'), 'Ainda possui step=0.50');
  assert(html.includes('inputmode="decimal" id="timesheet-service-price"'), 'Deve usar inputmode=decimal');
});

test('app.js implementa parseTimesheetCurrency suportando inteiros, ponto e vírgula', () => {
  assert(js.includes('function parseTimesheetCurrency(val)'), 'Falta a função parseTimesheetCurrency');
  
  // Extrai a função e testa em sandbox
  const match = js.match(/function parseTimesheetCurrency\(val\)[\s\S]*?\n\}/);
  assert(match, 'Não conseguiu extrair parseTimesheetCurrency');
  const parseFn = new Function(`${match[0]}; return parseTimesheetCurrency;`)();

  assert.strictEqual(parseFn('150'), 150, 'Deve converter "150" para 150');
  assert.strictEqual(parseFn('175'), 175, 'Deve converter "175" para 175');
  assert.strictEqual(parseFn('150,00'), 150, 'Deve converter "150,00" para 150');
  assert.strictEqual(parseFn('150,50'), 150.5, 'Deve converter "150,50" para 150.5');
  assert.strictEqual(parseFn('150.50'), 150.5, 'Deve converter "150.50" para 150.5');
  assert.strictEqual(parseFn('7,00'), 7, 'Deve converter "7,00" para 7');
  assert.strictEqual(parseFn('  25,75  '), 25.75, 'Deve tratar espaços "  25,75  "');
  assert.strictEqual(parseFn('0'), 0, 'Deve aceitar 0');
  assert.strictEqual(parseFn(''), null, 'Vazio deve ser null');
  assert.strictEqual(parseFn('abc'), null, 'Letras devem ser null');
  assert.strictEqual(parseFn(null), null, 'null deve ser null');
  assert.strictEqual(parseFn(150), 150, 'Número já numérico deve ser preservado');
});

test('app.js sanitiza live input de moeda permitindo apenas dígitos, ponto e vírgula', () => {
  assert(js.includes('timesheet-payment-cash-amount') && js.includes('replace(/[^0-9.,]/g'), 'Falta sanitização live');
});

console.log('\n========================================');
console.log('TOTAL: Todos os 6 testes de validação de moeda aprovados!');
console.log('✅ CORREÇÃO DE INPUT DE VALORES 100% VALIDADA!\n');
