/**
 * PAINSENSE-AI Unified Test Runner
 * Runs backend pytest, security tests, ML benchmarks, preflight doctor, and frontend build.
 */
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');

function getPythonPath() {
  const venvWin = path.join(rootDir, 'backend', 'venv', 'Scripts', 'python.exe');
  const venvUnix = path.join(rootDir, 'backend', 'venv', 'bin', 'python');
  if (fs.existsSync(venvWin)) return venvWin;
  if (fs.existsSync(venvUnix)) return venvUnix;
  return 'python';
}

const pythonBin = getPythonPath();
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

console.log('\n======================================================');
console.log('  PAINSENSE-AI UNIFIED TEST SUITE');
console.log('======================================================\n');

// 1. Pytest
console.log('--- Step 1: Running Backend & Security Pytests ---');
const pytestRes = spawnSync(pythonBin, ['-m', 'pytest', 'backend/tests'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, PYTHONPATH: rootDir }
});
if (pytestRes.status !== 0) {
  console.error('\n[FAIL] Backend pytest failed.');
  process.exit(pytestRes.status ?? 1);
}

// 2. ML Evaluations
console.log('\n--- Step 2: Running ML Evaluations & Ablation Benchmarks ---');
for (const mod of ['ml.facial.evaluation', 'ml.voice.evaluation', 'ml.evaluation.benchmark_multimodal', 'ml.evaluation.benchmark_ablation']) {
  const mlRes = spawnSync(pythonBin, ['-m', mod], {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, PYTHONPATH: rootDir }
  });
  if (mlRes.status !== 0) {
    console.error(`\n[FAIL] ML module ${mod} failed.`);
    process.exit(mlRes.status ?? 1);
  }
}

// 3. Frontend Production Build
console.log('\n--- Step 3: Running Frontend Production Build Check ---');
const buildRes = spawnSync(npmCmd, ['run', 'build'], {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: true
});
if (buildRes.status !== 0) {
  console.error('\n[FAIL] Frontend build failed.');
  process.exit(buildRes.status ?? 1);
}

// 4. Preflight Doctor
console.log('\n--- Step 4: Running Preflight Doctor ---');
const docRes = spawnSync(pythonBin, [path.join(rootDir, 'scripts', 'doctor.py')], {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, PYTHONPATH: rootDir }
});
if (docRes.status !== 0) {
  console.error('\n[FAIL] Doctor check failed.');
  process.exit(docRes.status ?? 1);
}

console.log('\n======================================================');
console.log('  ALL TEST SUITES PASSED SUCCESSFULLY');
console.log('======================================================\n');
process.exit(0);
