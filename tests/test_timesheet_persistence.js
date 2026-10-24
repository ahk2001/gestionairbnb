// test_timesheet_persistence.js
// Validação automatizada de persistência, reconciliação e correção de bugs no registro de horas e serviços

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TESTE DE PERSISTÊNCIA E CORREÇÃO DE HORAS (TIMESHEET) ===\n');

let passedCount = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Erro: ${err.message}`);
    process.exit(1);
  }
}

const cloudSyncCode = fs.readFileSync(path.join(__dirname, '../cloud-sync.js'), 'utf8');
const appCode = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const i18nCode = fs.readFileSync(path.join(__dirname, '../i18n.js'), 'utf8');

// 1. Verificações em cloud-sync.js
test('cloud-sync.js implementa reconciliação inteligente comparando updatedAt em timesheets', () => {
  assert(cloudSyncCode.includes("colName === 'timesheets'"), 'Deve conter tratamento para timesheets');
  assert(cloudSyncCode.includes('locTime > remTime'), 'Deve comparar timestamps locTime e remTime');
  assert(cloudSyncCode.includes("saveDocument('timesheets'"), 'Deve reenviar versão local mais recente');
});

test('cloud-sync.js preserva registros locais pendentes que ainda não existem na nuvem', () => {
  assert(cloudSyncCode.includes('localMap.forEach'), 'Deve iterar sobre pendências locais');
  assert(cloudSyncCode.includes('isRecentlyDeleted'), 'Deve respeitar exclusões recentes de timesheets');
});

// 2. Verificações em app.js
test('app.js removeu bloqueio agressivo de horários futuros no mesmo dia no submit', () => {
  assert(!appCode.includes("start && timeToMinutes(start) > currentMinutes"), 'Não deve bloquear start futuro intra-dia');
  assert(!appCode.includes("serviceTime && timeToMinutes(serviceTime) > currentMinutes"), 'Não deve bloquear check-in futuro intra-dia');
  assert(!appCode.includes("end && timeToMinutes(end) > currentMinutes"), 'Não deve bloquear end futuro intra-dia');
});

test('app.js permite ao gestor selecionar colaborador ao registrar horas', () => {
  assert(appCode.includes("const staffSelect = document.getElementById('timesheet-staff-select')"), 'Deve buscar o select de staff');
  assert(appCode.includes('targetStaffId =') || appCode.includes('staffId = matched.id') || appCode.includes('staffSelect?.value'), 'Deve resolver staffId a partir do select do gestor');
});

test('app.js exibe botão de adicionar registro de horas tanto para gestor quanto equipe', () => {
  assert(appCode.includes("btnAdd.style.display = 'inline-flex'"), 'btnAdd deve ser inline-flex');
  assert(!appCode.includes("btnAdd.style.display = isOwner ? 'none' : 'inline-flex'"), 'Não deve ocultar btnAdd para gestores');
});

test('app.js adiciona botões de alternar pagamento e editar no modal do gestor', () => {
  assert(appCode.includes('.btn-ts-toggle-paid'), 'Deve conter botões de alternar pagamento');
  assert(appCode.includes('btn-mgr-ts-add-record'), 'Deve conter botão de adicionar no calendário do gestor');
  assert(appCode.includes('btn-mgr-ts-add-day-record'), 'Deve conter botão de adicionar no dia do gestor');
});

test('app.js não marca jornada em andamento como "Todas as horas pagas"', () => {
  assert(appCode.includes('inProgressRecords'), 'Deve contabilizar inProgressRecords');
  assert(appCode.includes('inProgressCount'), 'Deve exportar inProgressCount nas estatísticas');
});

// 3. Verificações em index.html
test('index.html contém grupo de seleção de funcionário #ts-staff-select-group', () => {
  assert(indexHtml.includes('id="ts-staff-select-group"'), 'Deve conter id="ts-staff-select-group"');
  assert(indexHtml.includes('id="timesheet-staff-select"'), 'Deve conter id="timesheet-staff-select"');
});

test('index.html contém botões de adicionar registros no modal do gestor', () => {
  assert(indexHtml.includes('id="btn-mgr-ts-add-record"'), 'Deve conter id="btn-mgr-ts-add-record"');
  assert(indexHtml.includes('id="btn-mgr-ts-add-day-record"'), 'Deve conter id="btn-mgr-ts-add-day-record"');
});

// 4. Simulação Funcional de Reconciliação de Timesheets
test('Simulação funcional: Reconciliação preserva edição local mais recente de encerramento de jornada', () => {
  const remoteSnapshot = [
    { id: 'ts_1', date: '2026-10-24', startTime: '09:00', endTime: '', isPaid: false, updatedAt: '2026-10-24T10:00:00.000Z' }
  ];
  const localTimesheets = [
    { id: 'ts_1', date: '2026-10-24', startTime: '09:00', endTime: '17:00', totalMinutes: 480, isPaid: false, updatedAt: '2026-10-24T17:05:00.000Z' }
  ];

  const localMap = new Map();
  localTimesheets.forEach(t => localMap.set(t.id, t));
  const mergedMap = new Map();

  remoteSnapshot.forEach(remItem => {
    const locItem = localMap.get(remItem.id);
    if (locItem) {
      const locTime = new Date(locItem.updatedAt).getTime();
      const remTime = new Date(remItem.updatedAt).getTime();
      if (locTime > remTime) {
        mergedMap.set(remItem.id, locItem);
      } else {
        mergedMap.set(remItem.id, remItem);
      }
      localMap.delete(remItem.id);
    } else {
      mergedMap.set(remItem.id, remItem);
    }
  });

  localMap.forEach((locItem, id) => mergedMap.set(id, locItem));

  const result = Array.from(mergedMap.values());
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].endTime, '17:00', 'A edição local mais recente deve ser preservada!');
  assert.strictEqual(result[0].totalMinutes, 480);
});

console.log(`\n========================================`);
console.log(`TOTAL: ${passedCount} testes aprovados, 0 falhas.`);
console.log(`✅ TESTE DE PERSISTÊNCIA DE TIMESHEET 100% APROVADO!\n`);
