const fs = require('fs');
const path = require('path');

const projectDir = path.resolve(__dirname, '..');
const i18nContent = fs.readFileSync(path.join(projectDir, 'i18n.js'), 'utf8');
const htmlContent = fs.readFileSync(path.join(projectDir, 'index.html'), 'utf8');
const appContent = fs.readFileSync(path.join(projectDir, 'app.js'), 'utf8');

// Mock browser context
global.window = global;
global.document = {
  documentElement: { lang: 'es' },
  querySelectorAll: () => [],
  addEventListener: () => {},
  readyState: 'complete'
};
global.localStorage = {
  getItem: () => 'es',
  setItem: () => {}
};

eval(i18nContent);
const I18N = global.I18N;
const es = I18N.TRANSLATIONS.es;
const pt = I18N.TRANSLATIONS.pt;

console.log('=== AUDITORIA GERAL DE INTERNACIONALIZAÇÃO ===');
console.log(`Dicionário ES: ${Object.keys(es).length} chaves`);
console.log(`Dicionário PT: ${Object.keys(pt).length} chaves`);

// 1. Simetria de chaves
const esOnly = Object.keys(es).filter(k => !(k in pt));
const ptOnly = Object.keys(pt).filter(k => !(k in es));
console.log(`Chaves apenas em ES: ${esOnly.length}`, esOnly);
console.log(`Chaves apenas em PT: ${ptOnly.length}`, ptOnly);

if (esOnly.length > 0 || ptOnly.length > 0) {
  console.error('ERRO: Dicionários assimétricos!');
  process.exit(1);
}

// 2. Chaves no HTML
const dataI18nKeys = [...htmlContent.matchAll(/data-i18n(?:-[a-z]+)?="([^"]+)"/g)].map(m => m[1]);
const uniqueHtmlKeys = [...new Set(dataI18nKeys)];
console.log(`\nTotal de marcações data-i18n no HTML: ${dataI18nKeys.length} (únicas: ${uniqueHtmlKeys.length})`);

const missingHtmlInEs = uniqueHtmlKeys.filter(k => !(k in es));
const missingHtmlInPt = uniqueHtmlKeys.filter(k => !(k in pt));
console.log(`Chaves do HTML faltando em ES: ${missingHtmlInEs.length}`, missingHtmlInEs);
console.log(`Chaves do HTML faltando em PT: ${missingHtmlInPt.length}`, missingHtmlInPt);

if (missingHtmlInEs.length > 0 || missingHtmlInPt.length > 0) {
  console.error('ERRO: Chaves do HTML não encontradas no dicionário!');
  process.exit(1);
}

// 3. Chamadas I18N.t(...) e t(...) em app.js
const appI18nCalls = [
  ...appContent.matchAll(/(?:I18N\.t|\bt)\(['"]([^'"]+)['"]/g)
].map(m => m[1]);
const uniqueAppKeys = [...new Set(appI18nCalls)];
console.log(`\nTotal de chamadas de tradução em app.js: ${appI18nCalls.length} (únicas: ${uniqueAppKeys.length})`);

const missingAppInEs = uniqueAppKeys.filter(k => !(k in es));
const missingAppInPt = uniqueAppKeys.filter(k => !(k in pt));
console.log(`Chaves usadas no JS faltando em ES: ${missingAppInEs.length}`, missingAppInEs);
console.log(`Chaves usadas no JS faltando em PT: ${missingAppInPt.length}`, missingAppInPt);

if (missingAppInEs.length > 0 || missingAppInPt.length > 0) {
  console.error('ERRO: Chaves usadas no JS não existem no dicionário!');
  process.exit(1);
}

// 4. Teste de troca de idioma
I18N.setLanguage('pt');
console.log(`\nIdioma após setLanguage('pt'): ${I18N.getLanguage()}`);
console.log(`Exemplo de tradução PT 'topbar.roleStaff': "${I18N.t('topbar.roleStaff')}"`);
console.log(`Exemplo de tradução PT 'thresholds.faltaLabel': "${I18N.t('thresholds.faltaLabel')}"`);
console.log(`Exemplo de tradução PT 'thresholds.upTo': "${I18N.t('thresholds.upTo')}"`);

I18N.setLanguage('es');
console.log(`\nIdioma após setLanguage('es'): ${I18N.getLanguage()}`);
console.log(`Exemplo de tradução ES 'topbar.roleStaff': "${I18N.t('topbar.roleStaff')}"`);
console.log(`Exemplo de tradução ES 'thresholds.faltaLabel': "${I18N.t('thresholds.faltaLabel')}"`);
console.log(`Exemplo de tradução ES 'thresholds.upTo': "${I18N.t('thresholds.upTo')}"`);

console.log('\n✅ AUDITORIA CONCLUÍDA COM 100% DE SUCESSO!');
