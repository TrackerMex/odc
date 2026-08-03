#!/usr/bin/env node
// PostToolUse: eslint --fix on the saved file, scoped to backend/src|test/**/*.ts.
// Remaining (unfixable) errors are surfaced to Claude via stderr + exit 2.

import { execFileSync } from 'node:child_process';
import path from 'node:path';

let data = '';
process.stdin.on('data', (chunk) => (data += chunk));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(data);
  } catch {
    process.exit(0);
  }

  const filePath = (input.tool_input?.file_path || '').replace(/\\/g, '/');
  const match = filePath.match(/^(.*\/backend)\/(?:src|test)\/.*\.ts$/);
  if (!match) process.exit(0);

  const backendDir = match[1];
  const relativeFile = path.relative(backendDir, filePath);
  const eslintBin = path.join(backendDir, 'node_modules', 'eslint', 'bin', 'eslint.js');

  try {
    execFileSync(process.execPath, [eslintBin, '--fix', relativeFile], { cwd: backendDir, stdio: 'pipe' });
    process.exit(0);
  } catch (err) {
    const output = (err.stdout || err.message || '').toString();
    console.error(`ESLint found issues in ${relativeFile}:\n${output}`);
    process.exit(2);
  }
});
