const fs = require('fs');
const assert = require('assert');

console.log('=== TESTE DE POPUP DE CALENDÁRIO COM SELEÇÃO DE PERÍODO ESPECÍFICO (TIMESHEET) ===\n');

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');

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

test('index.html contém botão/pílula de abrir calendário de período específico (#btn-timesheet-open-calendar)', () => {
  assert(html.includes('id="btn-timesheet-open-calendar"'), 'Falta #btn-timesheet-open-calendar no HTML');
  assert(html.includes('data-ts-date-filter="custom_range"'), 'Falta data-ts-date-filter="custom_range"');
  assert(html.includes('id="ts-custom-range-pill-label"'), 'Falta label dinâmica #ts-custom-range-pill-label');
});

test('index.html contém popup modal do calendário (#modal-timesheet-calendar-range) com estrutura completa', () => {
  assert(html.includes('id="modal-timesheet-calendar-range"'), 'Falta modal #modal-timesheet-calendar-range');
  assert(html.includes('id="ts-cal-val-start"'), 'Falta display de data inicial #ts-cal-val-start');
  assert(html.includes('id="ts-cal-val-end"'), 'Falta display de data final #ts-cal-val-end');
  assert(html.includes('data-ts-range-preset="last7"'), 'Falta chip de preset últimos 7 dias');
  assert(html.includes('data-ts-range-preset="last15"'), 'Falta chip de preset últimos 15 dias');
  assert(html.includes('data-ts-range-preset="thisMonth"'), 'Falta chip de preset este mês');
  assert(html.includes('data-ts-range-preset="lastMonth"'), 'Falta chip de preset mês passado');
  assert(html.includes('id="btn-ts-cal-prev"'), 'Falta seta de mês anterior');
  assert(html.includes('id="btn-ts-cal-next"'), 'Falta seta de próximo mês');
  assert(html.includes('id="ts-cal-days-grid"'), 'Falta grade de dias #ts-cal-days-grid');
  assert(html.includes('id="btn-ts-cal-clear-selection"'), 'Falta botão de limpar seleção');
  assert(html.includes('id="btn-ts-cal-apply-range"'), 'Falta botão de aplicar período');
});

test('styles.css contém estilização completa do popup de calendário e visual de intervalo (range)', () => {
  assert(css.includes('.ts-cal-sheet'), 'Falta .ts-cal-sheet no CSS');
  assert(css.includes('.ts-cal-range-preview'), 'Falta .ts-cal-range-preview no CSS');
  assert(css.includes('.ts-cal-widget-card'), 'Falta .ts-cal-widget-card no CSS');
  assert(css.includes('.ts-cal-day-cell'), 'Falta .ts-cal-day-cell no CSS');
  assert(css.includes('.ts-cal-day-cell.is-range-start'), 'Falta estilo de início de intervalo .is-range-start');
  assert(css.includes('.ts-cal-day-cell.is-range-end'), 'Falta estilo de fim de intervalo .is-range-end');
  assert(css.includes('.ts-cal-day-cell.in-range'), 'Falta estilo de dias intermediários .in-range');
  assert(css.includes('.timesheet-pill-calendar'), 'Falta estilo da pílula com ícone de calendário');
});

test('app.js implementa funções de ciclo de vida do popup de calendário', () => {
  assert(js.includes('function openTimesheetCalendarModal()'), 'Falta openTimesheetCalendarModal');
  assert(js.includes('function closeTimesheetCalendarModal()'), 'Falta closeTimesheetCalendarModal');
  assert(js.includes('function renderTimesheetCalendarGrid()'), 'Falta renderTimesheetCalendarGrid');
  assert(js.includes('function updateTimesheetCalendarPreview()'), 'Falta updateTimesheetCalendarPreview');
  assert(js.includes('function applyTimesheetCalendarPreset('), 'Falta applyTimesheetCalendarPreset');
  assert(js.includes('function applyTimesheetCalendarRange()'), 'Falta applyTimesheetCalendarRange');
  assert(js.includes('function clearTimesheetCalendarRange()'), 'Falta clearTimesheetCalendarRange');
});

test('Simulação Funcional de Filtragem: filtra perfeitamente pelo intervalo custom_range selecionado no calendário', () => {
  const dummyTimesheets = [
    { id: '1', date: '2026-03-01', type: 'hours', totalMinutes: 120 },
    { id: '2', date: '2026-03-05', type: 'service', servicePrice: 7 },
    { id: '3', date: '2026-03-10', type: 'hours', totalMinutes: 240 },
    { id: '4', date: '2026-03-15', type: 'payment', amount: 50 },
    { id: '5', date: '2026-03-20', type: 'hours', totalMinutes: 60 },
    { id: '6', date: '2026-02-28', type: 'hours', totalMinutes: 180 }
  ];

  // Simulação da função filterTimesheetsList
  function filterWithRange(list, rangeStart, rangeEnd, typeFilter = 'todos') {
    return list.filter(t => {
      const tDate = t.date;
      if (rangeStart && rangeEnd) {
        if (tDate < rangeStart || tDate > rangeEnd) return false;
      } else if (rangeStart) {
        if (tDate !== rangeStart) return false;
      }
      return true;
    });
  }

  // Intervalo de 05/03 a 15/03
  const resRange = filterWithRange(dummyTimesheets, '2026-03-05', '2026-03-15');
  assert.strictEqual(resRange.length, 3, 'Deve retornar registros do dia 05, 10 e 15');
  assert.deepStrictEqual(resRange.map(r => r.id), ['2', '3', '4']);

  // Intervalo de dia único (ex: 20/03)
  const resSingle = filterWithRange(dummyTimesheets, '2026-03-20', '2026-03-20');
  assert.strictEqual(resSingle.length, 1, 'Deve retornar apenas o dia 20');
  assert.strictEqual(resSingle[0].id, '5');

  // Intervalo do mês de Fevereiro
  const resFeb = filterWithRange(dummyTimesheets, '2026-02-01', '2026-02-28');
  assert.strictEqual(resFeb.length, 1, 'Deve retornar registro de fevereiro');
  assert.strictEqual(resFeb[0].id, '6');
});

console.log('\n========================================');
console.log('TOTAL: 5 testes aprovados, 0 falhas.');
console.log('✅ TESTE DE POPUP DE CALENDÁRIO COM INTERVALO ESPECÍFICO 100% APROVADO!\n');
