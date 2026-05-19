/**
 * Testes Unitários de Arquitetura — Frontend (Estuda+)
 * Ferramenta: ArchUnitTS (archunit)
 *
 * Instalação:
 *   cd EstudaMais
 *   npm install archunit --save-dev
 *
 * Execução:
 *   node --test src/arch/frontend-arch.test.js
 *
 * Arquitetura por Responsabilidade verificada:
 *
 *   App.jsx
 *       ↓
 *   views/  → depende de → ui/ + api/ + lib.js
 *   api/    → client.js como base; outros api/* importam de client
 *   lib.js  → utilitários puros, sem deps de views ou api
 *   ui/     → componentes puros, sem deps de views ou api
 *
 * Regras:
 *  1. views/ não importa outros views/ diretamente
 *  2. api/ não importa views/
 *  3. api/client não importa outros módulos api/
 *  4. lib não importa views/ nem api/
 *  5. Sem dependências circulares no frontend
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectFiles } from 'archunit';

// Ajuste se necessário
const ROOT = './src';

function formatViolations(violations) {
  if (violations.length === 0) return '';
  return '\nViolações:\n' + violations
    .map(v => {
      if (v.dependency) return `  ✗ ${v.dependency.sourceLabel} → ${v.dependency.targetLabel}`;
      if (v.filePath) return `  ✗ ${v.filePath}`;
      return `  ✗ ${JSON.stringify(v).substring(0, 120)}`;
    })
    .join('\n');
}

// ─── TESTE 1 ─────────────────────────────────────────────────────────────────
test('[Frontend] views/ não deve importar outros views/ diretamente', async () => {
  const rule = projectFiles()
    .inFolder(`${ROOT}/views/**`)
    .shouldNot()
    .dependOnFiles()
    .inFolder(`${ROOT}/views/**`);

  const violations = await rule.check({ allowEmptyTests: true });
  assert.equal(
    violations.length,
    0,
    `views/ não deve ter acoplamento direto entre si${formatViolations(violations)}`
  );
});

// ─── TESTE 2 ─────────────────────────────────────────────────────────────────
test('[Frontend] api/ não deve importar views/', async () => {
  const rule = projectFiles()
    .inFolder(`${ROOT}/api/**`)
    .shouldNot()
    .dependOnFiles()
    .inFolder(`${ROOT}/views/**`);

  const violations = await rule.check({ allowEmptyTests: true });
  assert.equal(
    violations.length,
    0,
    `A camada api/ não deve conhecer views/${formatViolations(violations)}`
  );
});

// ─── TESTE 3 ─────────────────────────────────────────────────────────────────
test('[Frontend] api/client não deve importar outros módulos api/', async () => {
  const rule = projectFiles()
    .inFolder(`${ROOT}/api/client*`)
    .shouldNot()
    .dependOnFiles()
    .inFolder(`${ROOT}/api/**`);

  const violations = await rule.check({ allowEmptyTests: true });
  assert.equal(
    violations.length,
    0,
    `api/client é a base da camada api — não pode depender de outros módulos api/${formatViolations(violations)}`
  );
});

// ─── TESTE 4 ─────────────────────────────────────────────────────────────────
test('[Frontend] lib não deve importar views/ nem api/', async () => {
  const [v1, v2] = await Promise.all([
    projectFiles()
      .inFolder(`${ROOT}/lib*`)
      .shouldNot()
      .dependOnFiles()
      .inFolder(`${ROOT}/views/**`)
      .check({ allowEmptyTests: true }),
    projectFiles()
      .inFolder(`${ROOT}/lib*`)
      .shouldNot()
      .dependOnFiles()
      .inFolder(`${ROOT}/api/**`)
      .check({ allowEmptyTests: true }),
  ]);

  const all = [...v1, ...v2];
  assert.equal(
    all.length,
    0,
    `lib.js é utilitário puro — não deve conhecer views/ ou api/${formatViolations(all)}`
  );
});

// ─── TESTE 5 ─────────────────────────────────────────────────────────────────
test('[Frontend] não deve ter dependências circulares', async () => {
  const rule = projectFiles()
    .inFolder(`${ROOT}/**`)
    .should()
    .haveNoCycles();

  const violations = await rule.check({ allowEmptyTests: true });
  assert.equal(
    violations.length,
    0,
    `Ciclos detectados no frontend${formatViolations(violations)}`
  );
});
