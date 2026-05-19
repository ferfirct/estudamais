/**
 * Testes Unitários de Arquitetura — Backend (Estuda+)
 * Ferramenta: ArchUnitTS (archunit)
 *
 * Instalação:
 *   cd backend
 *   npm install archunit --save-dev
 *
 * Execução:
 *   node --test src/arch/backend-arch.test.js
 *
 * Arquitetura em Camadas verificada:
 *
 *   server.ts
 *       ↓
 *   routes/     → depende de → services/ + middleware/ + types/
 *   services/   → depende de → middleware/ + types/
 *   middleware/ → sem dependências internas
 *   types/      → sem dependências internas (folha)
 *
 * Regras:
 *  1. routes/ não importa outros routes/
 *  2. middleware/ não importa routes/
 *  3. middleware/ não importa services/
 *  4. types/ não importa nenhuma camada interna
 *  5. services/ não importa routes/
 *  6. Sem dependências circulares no backend
 *  7. Todo arquivo em routes/ deve importar ao menos um service
 *  8. aiService não deve importar routes/ (isolamento da camada de IA)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectFiles } from 'archunit';
import fs from 'node:fs';

// Ajuste se necessário para apontar à raiz do backend
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
test('[Backend] routes/ não deve importar outros routes/', async () => {
  const rule = projectFiles()
    .inFolder(`${ROOT}/routes/**`)
    .shouldNot()
    .dependOnFiles()
    .inFolder(`${ROOT}/routes/**`);

  const violations = await rule.check({ allowEmptyTests: true });
  assert.equal(
    violations.length,
    0,
    `Violação de separação entre routes/${formatViolations(violations)}`
  );
});

// ─── TESTE 2 ─────────────────────────────────────────────────────────────────
test('[Backend] middleware/ não deve importar routes/', async () => {
  const rule = projectFiles()
    .inFolder(`${ROOT}/middleware/**`)
    .shouldNot()
    .dependOnFiles()
    .inFolder(`${ROOT}/routes/**`);

  const violations = await rule.check({ allowEmptyTests: true });
  assert.equal(
    violations.length,
    0,
    `middleware/ importando routes/ viola o fluxo de dependência${formatViolations(violations)}`
  );
});

// ─── TESTE 3 ─────────────────────────────────────────────────────────────────
test('[Backend] middleware/ não deve importar services/', async () => {
  const rule = projectFiles()
    .inFolder(`${ROOT}/middleware/**`)
    .shouldNot()
    .dependOnFiles()
    .inFolder(`${ROOT}/services/**`);

  const violations = await rule.check({ allowEmptyTests: true });
  assert.equal(
    violations.length,
    0,
    `middleware/ não deve conhecer services/${formatViolations(violations)}`
  );
});

// ─── TESTE 4 ─────────────────────────────────────────────────────────────────
test('[Backend] types/ não deve importar nenhuma camada interna', async () => {
  const [v1, v2, v3] = await Promise.all([
    projectFiles()
      .inFolder(`${ROOT}/types/**`)
      .shouldNot()
      .dependOnFiles()
      .inFolder(`${ROOT}/routes/**`)
      .check({ allowEmptyTests: true }),
    projectFiles()
      .inFolder(`${ROOT}/types/**`)
      .shouldNot()
      .dependOnFiles()
      .inFolder(`${ROOT}/services/**`)
      .check({ allowEmptyTests: true }),
    projectFiles()
      .inFolder(`${ROOT}/types/**`)
      .shouldNot()
      .dependOnFiles()
      .inFolder(`${ROOT}/middleware/**`)
      .check({ allowEmptyTests: true }),
  ]);

  const all = [...v1, ...v2, ...v3];
  assert.equal(
    all.length,
    0,
    `types/ deve ser folha sem dependências internas${formatViolations(all)}`
  );
});

// ─── TESTE 5 ─────────────────────────────────────────────────────────────────
test('[Backend] services/ não deve importar routes/', async () => {
  const rule = projectFiles()
    .inFolder(`${ROOT}/services/**`)
    .shouldNot()
    .dependOnFiles()
    .inFolder(`${ROOT}/routes/**`);

  const violations = await rule.check({ allowEmptyTests: true });
  assert.equal(
    violations.length,
    0,
    `services/ importando routes/ cria acoplamento invertido${formatViolations(violations)}`
  );
});

// ─── TESTE 6 ─────────────────────────────────────────────────────────────────
test('[Backend] não deve ter dependências circulares', async () => {
  const rule = projectFiles()
    .inFolder(`${ROOT}/**`)
    .should()
    .haveNoCycles();

  const violations = await rule.check({ allowEmptyTests: true });
  assert.equal(
    violations.length,
    0,
    `Ciclos detectados — dependências circulares violam a arquitetura em camadas${formatViolations(violations)}`
  );
});

// ─── TESTE 7 ─────────────────────────────────────────────────────────────────
test('[Backend] todo arquivo em routes/ deve importar ao menos um service', async () => {
  const rule = projectFiles()
    .inFolder(`${ROOT}/routes/**`)
    .should()
    .adhereTo((fileInfo) => {
      const content = fs.readFileSync(fileInfo.path, 'utf-8');
      return (
        content.includes("'../services/") ||
        content.includes('"../services/')
      );
    }, 'Route deve importar ao menos um módulo de services/');

  const violations = await rule.check({ allowEmptyTests: true });
  assert.equal(
    violations.length,
    0,
    `Toda route deve usar ao menos um service${formatViolations(violations)}`
  );
});

// ─── TESTE 8 ─────────────────────────────────────────────────────────────────
test('[Backend] aiService não deve importar routes/ (isolamento da IA)', async () => {
  const rule = projectFiles()
    .inFolder(`${ROOT}/services/aiService*`)
    .shouldNot()
    .dependOnFiles()
    .inFolder(`${ROOT}/routes/**`);

  const violations = await rule.check({ allowEmptyTests: true });
  assert.equal(
    violations.length,
    0,
    `aiService não deve conhecer routes/${formatViolations(violations)}`
  );
});
