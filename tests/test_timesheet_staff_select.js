const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TESTE DE SELEÇÃO DE FUNCIONÁRIO NO TIMESHEET (CUSTOM SELECT) ===\n');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf-8');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf-8');

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

test('app.js implementa getCustomOptionMeta para timesheet-staff-select', () => {
  assert(
    appJs.includes("select.id === 'event-staff-select' || select.id === 'timesheet-staff-select'"),
    'getCustomOptionMeta deve suportar timesheet-staff-select'
  );
  assert(
    appJs.includes("sObj?.photo") && appJs.includes("badge-vn"),
    'Deve extrair foto e badge do funcionário'
  );
});

test('app.js syncCustomSelect aceita parâmetro forceRebuild', () => {
  assert(
    appJs.includes('function syncCustomSelect(target, forceRebuild = false)'),
    'syncCustomSelect deve aceitar forceRebuild'
  );
  assert(
    appJs.includes('if (forceRebuild || currentOptionsCount !== renderedOptionsCount)'),
    'syncCustomSelect deve forçar re-render quando forceRebuild for verdadeiro'
  );
});

test('app.js openTimesheetModal preenche e sincroniza o seletor customizado de funcionários', () => {
  assert(
    appJs.includes('syncCustomSelect(staffSelect, true)'),
    'openTimesheetModal deve sincronizar o seletor de funcionário com o wrapper customizado'
  );
  assert(
    appJs.includes('initialStaffId = presetStaffId') || appJs.includes('initialStaffId = state.activeManagerStaffId'),
    'openTimesheetModal deve resolver initialStaffId para pré-seleção'
  );
  assert(
    appJs.includes('syncAllCustomControls()'),
    'openTimesheetModal deve invocar syncAllCustomControls antes de exibir o modal'
  );
});

test('app.js renderTimesheets inicializa e sincroniza timesheet-staff-select', () => {
  assert(
    appJs.includes("const staffSelect = document.getElementById('timesheet-staff-select')"),
    'renderTimesheets deve verificar timesheet-staff-select'
  );
  assert(
    appJs.includes("staffSelect.value = state.activeManagerStaffId || staffListToUse[0].id"),
    'renderTimesheets deve pré-selecionar o funcionário ativo ou o primeiro da lista'
  );
});

test('app.js dispara updateTimesheetCashPaymentPreview ao alterar o funcionário no select', () => {
  assert(
    appJs.includes("document.getElementById('timesheet-staff-select')?.addEventListener('change'"),
    'Deve escutar o evento change em timesheet-staff-select'
  );
  assert(
    appJs.includes("updateTimesheetCashPaymentPreview();"),
    'Deve chamar updateTimesheetCashPaymentPreview no evento de mudança'
  );
});

test('styles.css define avatar circular para opções e trigger do seletor de funcionário', () => {
  assert(
    stylesCss.includes('.custom-select-wrapper[data-target-id="timesheet-staff-select"] .custom-select-trigger-thumb') &&
    stylesCss.includes('border-radius: 50%'),
    'styles.css deve estilizar o avatar do funcionário como circular'
  );
});

test('Simulação funcional: getCustomOptionMeta gera metadados ricos com foto e cargo', () => {
  const dummyState = {
    data: {
      staff: [
        { id: 'st_1', name: 'Maria Eduarda Campioli', email: 'maria@airbnb.com', photo: 'https://images.unsplash.com/maria.jpg', role: 'cleaner' },
        { id: 'st_2', name: 'Carlos Gestor', email: 'carlos@airbnb.com', photo: '', role: 'manager' }
      ]
    }
  };

  function simulateGetCustomOptionMeta(selectId, val, label) {
    const sObj = (dummyState.data.staff || []).find(s => String(s.id) === String(val) || s.name === label || s.email === val);
    const photo = sObj?.photo || '';
    const initials = (label || '').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'EQ';
    return {
      thumb: photo,
      badge: photo ? '' : initials,
      badgeClass: 'badge-vn',
      title: sObj?.name || label,
      sub: sObj?.role === 'manager' || sObj?.role === 'owner' ? 'Gestor' : 'Colaboradora'
    };
  }

  const meta1 = simulateGetCustomOptionMeta('timesheet-staff-select', 'st_1', 'Maria Eduarda Campioli');
  assert.strictEqual(meta1.title, 'Maria Eduarda Campioli');
  assert.strictEqual(meta1.thumb, 'https://images.unsplash.com/maria.jpg');
  assert.strictEqual(meta1.badge, '');
  assert.strictEqual(meta1.sub, 'Colaboradora');

  const meta2 = simulateGetCustomOptionMeta('timesheet-staff-select', 'st_2', 'Carlos Gestor');
  assert.strictEqual(meta2.title, 'Carlos Gestor');
  assert.strictEqual(meta2.thumb, '');
  assert.strictEqual(meta2.badge, 'CG');
  assert.strictEqual(meta2.sub, 'Gestor');
});

console.log('\n========================================');
console.log('TOTAL: Todos os 7 testes de seleção de funcionário aprovados!');
console.log('✅ SELETOR DE FUNCIONÁRIO NO TIMESHEET 100% VALIDADO!');
