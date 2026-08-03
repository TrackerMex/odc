#!/usr/bin/env node
// PreToolUse guard: blocks edits to .env (secrets live there, use .env.example for shape changes).

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
  if (/(^|\/)\.env$/.test(filePath)) {
    console.error(
      'Blocked: .env contains secrets (DATABASE_URL, JWT_SECRET). Edit .env.example for shape changes, or ask the user to edit .env directly.',
    );
    process.exit(2);
  }

  process.exit(0);
});
