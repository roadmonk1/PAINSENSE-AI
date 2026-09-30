/**
 * PAINSENSE-AI Local Development State Reset Script
 * Resets local SQLite database and re-seeds deterministic demo data.
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('\n--- Resetting Local PAINSENSE-AI Development State ---');

const dbPath = path.join(rootDir, 'painsense.db');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('[✓] Removed local painsense.db');
}

function getPythonPath() {
  const venvWin = path.join(rootDir, 'backend', 'venv', 'Scripts', 'python.exe');
  const venvUnix = path.join(rootDir, 'backend', 'venv', 'bin', 'python');
  if (fs.existsSync(venvWin)) return venvWin;
  if (fs.existsSync(venvUnix)) return venvUnix;
  return 'python';
}

const pythonBin = getPythonPath();
console.log('[...] Initializing fresh database schema and seeding demo users...');
const seedRes = spawnSync(
  pythonBin,
  ['-c', 'from backend.app.database import init_db; from backend.app.main import seed_demo_data; init_db(); seed_demo_data(); print("Database re-seeded successfully.")'],
  { cwd: rootDir, stdio: 'inherit', env: { ...process.env, PYTHONPATH: rootDir } }
);

if (seedRes.status === 0) {
  console.log('[✓] Local development environment successfully reset.\n');
  process.exit(0);
} else {
  console.error('[ERROR] Failed to re-seed database.\n');
  process.exit(1);
}
