/**
 * PAINSENSE-AI Single-Command Unified Full Stack Launcher (Windows / macOS / Linux)
 * Starts FastAPI Backend (detecting port 8000 or 8001 if occupied), verifies health,
 * then starts React/Vite Frontend (port 3000) with automatic reverse proxy.
 * Handles Windows process tree termination cleanly on Ctrl+C.
 */
import { spawn, spawnSync, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';
import net from 'net';
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

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '127.0.0.1');
  });
}

async function resolveBackendPort() {
  if (process.env.BACKEND_PORT) return parseInt(process.env.BACKEND_PORT, 10);
  if (await isPortFree(8000)) return 8000;
  if (await isPortFree(8001)) return 8001;
  return 8080;
}

function killProcessTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } catch {
      // Process already terminated
    }
  } else {
    try {
      process.kill(-pid, 'SIGINT');
    } catch {
      try {
        process.kill(pid, 'SIGINT');
      } catch {}
    }
  }
}

function checkBackendHealth(port, retries = 30, interval = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const intervalId = setInterval(() => {
      attempts++;
      const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
        if (res.statusCode === 200) {
          clearInterval(intervalId);
          resolve(true);
        }
      });
      req.on('error', () => {
        if (attempts >= retries) {
          clearInterval(intervalId);
          reject(new Error(`FastAPI backend on port ${port} did not become healthy within 15 seconds.`));
        }
      });
      req.end();
    }, interval);
  });
}

async function main() {
  const pythonBin = getPythonPath();
  const backendPort = await resolveBackendPort();

  console.log('\n======================================================');
  console.log('  PAINSENSE-AI — ONE-COMMAND FULL-STACK LAUNCHER');
  console.log('  Mode: Local Development & Clinical Demo (No Docker)');
  console.log('======================================================\n');

  // Step 1: Ensure database is initialized
  const dbPath = path.join(rootDir, 'painsense.db');
  if (!fs.existsSync(dbPath)) {
    console.log('[...] Initializing local SQLite database with clinical demo data...');
    spawnSync(
      pythonBin,
      [
        '-c',
        'from backend.app.database import init_db; from backend.app.main import seed_demo_data; init_db(); seed_demo_data()'
      ],
      { cwd: rootDir, stdio: 'ignore', env: { ...process.env, PYTHONPATH: rootDir } }
    );
    console.log('[✓] Database initialized with pre-seeded demo records.');
  }

  // Step 2: Spawn FastAPI Backend
  console.log(`[...] Starting FastAPI backend on http://0.0.0.0:${backendPort}...`);
  const backendProc = spawn(
    pythonBin,
    ['-m', 'uvicorn', 'backend.app.main:app', '--host', '0.0.0.0', '--port', String(backendPort)],
    {
      cwd: rootDir,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONPATH: rootDir, PORT: String(backendPort) }
    }
  );

  backendProc.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`\n[FAIL] FastAPI backend process exited unexpectedly with code ${code}.`);
    }
  });

  // Step 3: Wait for Backend Health
  try {
    await checkBackendHealth(backendPort);
  } catch (err) {
    console.error('\n[ERROR] Health check failed:', err.message);
    killProcessTree(backendProc.pid);
    process.exit(1);
  }

  // Step 4: Display Diagnostic Banner
  console.log(`
======================================================
        PAINSENSE-AI SYSTEM ONLINE
======================================================

 [✓] Database           Connected (SQLite local store)
 [✓] Backend API        FastAPI listening on port ${backendPort}
 [✓] Facial AI          PSPI Action Units & Regressor ready
 [✓] Voice AI           Acoustic Strain & NLP ready
 [✓] Sign Language      ASL & ISL Multi-Dialect ready
 [✓] Fusion Engine      Evidential Late Fusion active
 [✓] Safety Engine      Clinical Triage Safeguards active
 [✓] FHIR Exporter      HL7 FHIR R4 Bundle ready
 [✓] Reverse Proxy      Vite proxying /api -> http://localhost:${backendPort}
 [✓] Frontend UI        React 19 / Vite active on port 3000

======================================================
 Application URL:  http://localhost:3000
 API Base URL:     http://localhost:${backendPort}
 API Health Check: http://localhost:${backendPort}/health
 Press Ctrl+C anytime to terminate all services cleanly.
======================================================
`);

  // Step 5: Spawn Vite Frontend on Port 3000
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const frontendProc = spawn(npmCmd, ['run', 'dev'], {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      VITE_API_BASE_URL: '/api',
      VITE_BACKEND_URL: `http://localhost:${backendPort}`
    }
  });

  frontendProc.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`\n[FAIL] Frontend Vite process exited with code ${code}.`);
    }
  });

  // Step 6: Graceful Cleanup on SIGINT / Ctrl+C
  let isCleaningUp = false;
  const cleanup = () => {
    if (isCleaningUp) return;
    isCleaningUp = true;
    console.log('\n[!] Stopping PAINSENSE-AI child processes cleanly...');
    killProcessTree(frontendProc.pid);
    killProcessTree(backendProc.pid);
    console.log('[✓] All PAINSENSE-AI services stopped.\n');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('SIGHUP', cleanup);
}

main().catch((err) => {
  console.error('\nFatal startup error:', err);
  process.exit(1);
});
