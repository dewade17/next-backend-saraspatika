import { spawn } from 'node:child_process';
import process from 'node:process';

const PLACEHOLDER_URL = 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

if (!process.env.DATABASE_URL) {
  console.warn('[prisma-generate] DATABASE_URL is not set. Using placeholder connection string for client generation.');
  process.env.DATABASE_URL = PLACEHOLDER_URL;
}

const child = spawn('npx', ['prisma', 'generate'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
