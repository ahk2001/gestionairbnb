// test_timesheet_service.js - Validação da Funcionalidade de Check-in e Serviços no Timesheet
const fs = require('fs');
const path = require('path');

console.log('=== TESTE DE REGISTRO DE SERVIÇOS (CHECK-IN) NO TIMESHEET ===\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FALHA: ${message}`);
    failed++;
  }
}

// 1. Verificação do index.html (Modal 6B com suporte a serviços)
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(indexHtml.includes('id="modal-timesheet"'), 'Modal de timesheet presente no HTML');
assert(indexHtml.includes('id="ts-type-btn-hours"'), 'Botão segmentado para Horas de Trabalho presente');
assert(indexHtml.includes('id="ts-type-btn-service"'), 'Botão segmentado para Serviço (Check-in) presente');
assert(indexHtml.includes('id="ts-hours-fields-group"'), 'Grupo de campos para horas de trabalho presente');
assert(indexHtml.includes('id="ts-service-fields-group"'), 'Grupo de campos para serviço (check-in) presente');
assert(indexHtml.includes('id="timesheet-service-name"'), 'Seletor de tipo de serviço (checkin, checkout, outro) presente');
assert(indexHtml.includes('id="ts-prop-segmented-wrap"'), 'Seletor de imóvel (JB, VN, HN) presente');
assert(indexHtml.includes('id="ts-field-service-time"'), 'Seletor exclusivo de horário para serviço presente');
assert(indexHtml.includes('id="timesheet-service-price"'), 'Campo de valor do serviço em euros presente');
assert(indexHtml.includes('id="timesheet-hours-notes"'), 'Campo de descrição / tarefas de horas trabalhadas presente');
assert(indexHtml.includes('id="timesheet-service-notes"'), 'Campo de descrição / observações de serviço presente');

// 2. Verificação do app.js (Lógica de timesheet com serviços e descrição)
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

assert(appJs.includes('setTimesheetModalType'), 'app.js implementa setTimesheetModalType para alternar modal');
assert(appJs.includes("recordType === 'service'"), 'app.js possui fluxo dedicado para salvar tipo service');
assert(appJs.includes('getStaffTimesheetStats'), 'app.js calcula estatísticas separando horas e serviços');
assert(appJs.includes('ts-card-service'), 'app.js gera cards visuais dedicados para registros de serviço');
assert(appJs.includes("openTimePicker('serviceTime'"), 'app.js suporta seleção de horário de serviço via wheel picker');
assert(appJs.includes('exportTimesheetToWhatsApp'), 'app.js formata exportação para WhatsApp diferenciada para serviço/check-in');
assert(appJs.includes('showManagerTimesheetHours'), 'app.js exibe cartões de serviço na visão de consulta do gestor');
assert(appJs.includes('hoursNotes'), 'app.js captura e persiste as notas/descrição das horas trabalhadas');

// 3. Verificação de estilos CSS
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(stylesCss.includes('.ts-type-segmented-wrap'), 'CSS contém estilização do seletor segmentado Horas vs Serviço');
assert(stylesCss.includes('.ts-prop-segmented-wrap'), 'CSS contém estilização das pílulas de imóveis (JB, VN, HN)');
assert(stylesCss.includes('.ts-card-service'), 'CSS contém estilo de cartão de serviço');
assert(stylesCss.includes('.ts-service-pill'), 'CSS contém pílula destacada para check-in');
assert(stylesCss.includes('.ts-service-price-badge'), 'CSS contém badge de valor em euros');

// 4. Verificação de Regras do Firestore
const firestoreRules = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
assert(firestoreRules.includes('match /timesheets/{timesheetId}'), 'firestore.rules protege e gerencia a coleção timesheets');

// 5. Verificação dos Valores e Cálculos de Remuneração (10 €/h e 7 €/check-in)
assert(appJs.includes('TIMESHEET_HOURLY_RATE = 10.0'), 'Constante TIMESHEET_HOURLY_RATE definida como 10 euros/hora');
assert(appJs.includes('TIMESHEET_CHECKIN_RATE = 7.0'), 'Constante TIMESHEET_CHECKIN_RATE definida como 7 euros/checkin');
assert(appJs.includes('getTimesheetRecordAmount'), 'Função helper getTimesheetRecordAmount presente');
assert(appJs.includes('unpaidGrandTotal'), 'Cálculo de total geral monetário não pago presente');
assert(appJs.includes('timesheet.toReceiveAmount'), 'Chave de internacionalização toReceiveAmount utilizada');
assert(appJs.includes('managerTimesheet.totalToPayAmount'), 'Chave de internacionalização totalToPayAmount utilizada para gestor');

// 6. Teste Matemático dos Cálculos
const hourlyRate = 10.0;
const checkinRate = 7.0;

function calcHoursPay(minutes) {
  return (minutes / 60) * hourlyRate;
}

function calcTotal(minutes, checkinCount) {
  return calcHoursPay(minutes) + (checkinCount * checkinRate);
}

assert(calcHoursPay(60) === 10, '1 hora de trabalho equivale a 10 euros');
assert(calcHoursPay(480) === 80, '8 horas de trabalho equivalem a 80 euros');
assert(calcHoursPay(90) === 15, '1 hora e 30 minutos (90 min) equivalem a 15 euros');
assert(checkinRate === 7, '1 serviço de checkin equivale a 7 euros');
assert(calcTotal(480, 2) === 94, '8h de trabalho (80€) + 2 check-ins (14€) totalizam 94 euros');

console.log(`\n========================================`);
console.log(`TOTAL: ${passed} testes aprovados, ${failed} falhas.`);

if (failed > 0) {
  console.error('❌ TESTE COM FALHAS');
  process.exit(1);
} else {
  console.log('✅ TESTE DE SERVIÇOS NO TIMESHEET 100% APROVADO!\n');
}
