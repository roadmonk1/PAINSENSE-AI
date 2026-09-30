/**
 * Cross-platform runner for PAINSENSE-AI Preflight Doctor
 */
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function getPythonPath() {
  const venvWin = path.join(rootDir, 'backend', 'venv', 'Scripts', 'python.exe');
  const venvUnix = path.join(rootDir, 'backend', 'venv', 'bin', 'python');
  if (fs.existsSync(venvWin)) return venvWin;
  if (fs.existsSync(venvUnix)) return venvUnix;
  return 'python';
}

const pythonBin = getPythonPath();
const scriptPath = path.join(rootDir, 'scripts', 'doctor.py');

const child = spawn(pythonBin, [scriptPath], {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, PYTHONPATH: rootDir }
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
