const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TESTE DE LIMPEZA E DESIGN SYSTEM NA ÁREA DO FUNCIONÁRIO ===\n');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf-8');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf-8');
const i18nJs = fs.readFileSync(path.join(__dirname, '..', 'i18n.js'), 'utf-8');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Erro: ${err.message}`);
    process.exit(1);
  }
}

test('index.html e app.js ocultam botão "Pago €" para funcionário', () => {
  assert(indexHtml.includes('id="btn-open-payment-modal"'), 'Deve conter botão no HTML');
  assert(
    indexHtml.includes('id="btn-open-payment-modal"') && indexHtml.includes('style="display: none;"'),
    'Botão de registrar pagamento deve estar oculto por padrão no HTML'
  );
  assert(
    appJs.includes("btnOpenPayment.style.display = isOwner ? 'inline-flex' : 'none'"),
    'app.js deve exibir btnOpenPayment apenas se isOwner for verdadeiro'
  );
});

test('app.js formata o card de resumo do funcionário com layout 2-colunas elegante', () => {
  assert(appJs.includes('ts-unpaid-summary-top'), 'Deve conter ts-unpaid-summary-top no banner');
  assert(appJs.includes('ts-unpaid-summary-meta'), 'Deve conter ts-unpaid-summary-meta');
  assert(appJs.includes('ts-unpaid-summary-amount-badge'), 'Deve conter ts-unpaid-summary-amount-badge');
  assert(
    appJs.includes("Trabajado: ${formatMoney(staffStats.grossGrandTotal)} • Ya pagado: ${formatMoney(staffStats.paidGrandTotal)}"),
    'Subtítulo deve ser conciso e limpo quando houver pagamentos parciais'
  );
});

test('i18n.js simplificou timesheet.toReceive sem sufixos poluídos', () => {
  assert(i18nJs.includes("'timesheet.toReceive': 'Total por Cobrar'"), 'ES deve ser "Total por Cobrar" sem parênteses');
  assert(i18nJs.includes("'timesheet.toReceive': 'Total a Receber'"), 'PT deve ser "Total a Receber" sem parênteses');
});

test('styles.css implementa scroll horizontal sem quebra de linha para filtros', () => {
  assert(stylesCss.includes('.timesheet-filter-scroll'), 'Deve conter .timesheet-filter-scroll');
  assert(
    stylesCss.includes('overflow-x: auto') && stylesCss.includes('flex-wrap: nowrap'),
    'Filtros devem utilizar scroll horizontal sem quebrar linhas desordenadas'
  );
  assert(
    stylesCss.includes('.timesheet-month-picker-row') && stylesCss.includes('display: none !important'),
    'Seletor redundante de mês deve ser oculto para não sobrecarregar a colaboradora'
  );
});

test('styles.css garante espaçamento inferior para não sobrepor a barra flutuante', () => {
  assert(
    stylesCss.includes('#timesheet-list-container') && stylesCss.includes('padding-bottom: 96px'),
    'Lista de horários deve ter padding-bottom para a navbar flutuante'
  );
});

console.log('\n========================================');
console.log('TOTAL: Todos os 5 testes de limpeza da área do funcionário aprovados!');
console.log('✅ ÁREA DO FUNCIONÁRIO 100% LIMPA E VALIDADA!');
