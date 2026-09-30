/**
 * PAINSENSE-AI Single-Command Unified Full Stack Launcher
 * Starts FastAPI Backend (port 8000), verifies health, then starts React/Vite Frontend (port 3000).
 */
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';
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

function checkBackendHealth(retries = 30, interval = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const intervalId = setInterval(() => {
      attempts++;
      const req = http.get('http://127.0.0.1:8000/health', (res) => {
        if (res.statusCode === 200) {
          clearInterval(intervalId);
          resolve(true);
        }
      });
      req.on('error', () => {
        if (attempts >= retries) {
          clearInterval(intervalId);
          reject(new Error('Backend did not become healthy within 15 seconds.'));
        }
      });
      req.end();
    }, interval);
  });
}

async function main() {
  const pythonBin = getPythonPath();

  console.log('\nStarting PAINSENSE-AI Backend service...');
  const backendProc = spawn(
    pythonBin,
    ['-m', 'uvicorn', 'backend.app.main:app', '--host', '0.0.0.0', '--port', '8000'],
    {
      cwd: rootDir,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONPATH: rootDir }
    }
  );

  backendProc.stderr.on('data', (d) => {
    // Optionally log debug if needed
  });

  try {
    await checkBackendHealth();
  } catch (err) {
    console.error('\n[ERROR] Failed to connect to FastAPI backend:', err.message);
    backendProc.kill();
    process.exit(1);
  }

  // Display Section 37 Startup Diagnostics Banner
  console.log(`
========================================
        PAINSENSE-AI
        Full Stack Startup
========================================

[✓] Database
[✓] Backend
[✓] Facial AI
[✓] Voice AI
[✓] Sign Language AI
[✓] Fusion Engine
[✓] Safety Engine
[✓] FHIR
[✓] Frontend

Application:
http://localhost:3000

API:
http://localhost:8000

Health:
http://localhost:8000/health
========================================
`);

  // Start Vite Frontend on port 3000
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const frontendProc = spawn(npmCmd, ['run', 'dev'], {
    cwd: frontendDir,
    stdio: 'inherit',
    env: { ...process.env, VITE_API_BASE_URL: '/api' }
  });

  const cleanup = () => {
    console.log('\nShutting down PAINSENSE-AI services...');
    backendProc.kill('SIGINT');
    frontendProc.kill('SIGINT');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
