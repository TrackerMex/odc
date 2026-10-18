'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const helper = () => require('./dependencies.cjs');
const runtime = () => ({ format: 1, platform: process.platform, arch: process.arch,
  nodeMajor: process.versions.node.split('.')[0], nodeAbi: process.versions.modules, pnpm: '10.34.6' });

function fixture(t, name = 'backend') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'odc-dependencies-test-'));
  const dir = path.join(root, name);
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, packageManager: 'pnpm@10.34.6' }));
  fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), 'lockfileVersion: 9.0\n');
  t.after(() => {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('odc-dependencies-test-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
  return dir;
}
function installed(dir) {
  const bin = path.basename(dir) === 'backend' ? '@nestjs/cli/bin/nest.js' : 'vite/bin/vite.js';
  fs.mkdirSync(path.dirname(path.join(dir, 'node_modules', bin)), { recursive: true });
  fs.writeFileSync(path.join(dir, 'node_modules', bin), '// fixture CLI');
  fs.writeFileSync(path.join(dir, 'node_modules/.modules.yaml'), 'packageManager: pnpm@10.34.6\n');
}
function prepared(dir) {
  installed(dir);
  const marker = path.join(dir, 'node_modules/.odc-dependencies');
  fs.mkdirSync(marker, { recursive: true });
  for (const input of ['package.json', 'pnpm-lock.yaml', '.npmrc', 'pnpm-workspace.yaml']) {
    if (fs.existsSync(path.join(dir, input))) fs.copyFileSync(path.join(dir, input), path.join(marker, input));
  }
  fs.writeFileSync(path.join(marker, 'metadata.json'), JSON.stringify(runtime()));
  return marker;
}

test('R1: preparation pins Corepack pnpm even when global pnpm differs', (t) => {
  const dir = fixture(t);
  const calls = [];
  assert.equal(helper().PNPM_VERSION, '10.34.6');
  helper().setup(dir, { run(command, args, options) {
    calls.push({ command, args, options }); installed(dir); return { status: 0 };
  } });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, 'corepack');
  assert.deepEqual(calls[0].args, ['pnpm@10.34.6', 'install', '--frozen-lockfile', '--config.confirmModulesPurge=false']);
  assert.equal(calls[0].options.cwd, dir);
});

test('R1: reject a floating or mismatched declared manager before installation', (t) => {
  const dir = fixture(t);
  fs.writeFileSync(path.join(dir, 'package.json'), '{"name":"backend","packageManager":"pnpm@11"}');
  let calls = 0;
  assert.throws(() => helper().setup(dir, { run() { calls++; return { status: 0 }; } }), /pnpm@10\.34\.6/);
  assert.equal(calls, 0);
});

test('R2: repeated warm checks and starts are readonly, bounded and never install', (t) => {
  const dir = fixture(t);
  const marker = prepared(dir);
  const before = fs.readdirSync(marker).map((name) => [name, fs.readFileSync(path.join(marker, name)).toString('hex'), fs.statSync(path.join(marker, name)).mtimeMs]);
  const originalRead = fs.readdirSync;
  fs.readdirSync = () => { throw new Error('recursive scan forbidden'); };
  t.after(() => { fs.readdirSync = originalRead; });
  const calls = [];
  for (let i = 0; i < 2; i++) {
    assert.equal(helper().check(dir), true);
    helper().start(dir, { run(command, args, options) { calls.push({ command, args, options }); return { status: 0 }; } });
  }
  fs.readdirSync = originalRead;
  const after = fs.readdirSync(marker).map((name) => [name, fs.readFileSync(path.join(marker, name)).toString('hex'), fs.statSync(path.join(marker, name)).mtimeMs]);
  assert.deepEqual(after, before);
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.command, 'corepack');
    assert.deepEqual(call.args, ['pnpm@10.34.6', 'exec', 'nest', 'start', '--watch']);
    assert.equal(call.options.env.COREPACK_ENABLE_NETWORK, '0');
  }
});

test('R2: frontend Docker start launches only Vite and preserves its network binding', (t) => {
  const dir = fixture(t, 'frontend'); prepared(dir);
  helper().start(dir, { context: 'docker', run(command, args, options) {
    assert.equal(command, 'corepack');
    assert.deepEqual(args, ['pnpm@10.34.6', 'exec', 'vite', 'dev', '--port', '3000', '--host', '0.0.0.0']);
    assert.equal(options.env.COREPACK_ENABLE_NETWORK, '0'); return { status: 0 };
  } });
});

for (const file of ['package.json', 'pnpm-lock.yaml', '.npmrc', 'pnpm-workspace.yaml']) {
  test(`R3: reject changed content of ${file} before any server or installer`, (t) => {
    const dir = fixture(t);
    if (file.startsWith('.') || file === 'pnpm-workspace.yaml') fs.writeFileSync(path.join(dir, file), 'before');
    prepared(dir);
    fs.appendFileSync(path.join(dir, file), '\n');
    let calls = 0;
    assert.throws(() => helper().start(dir, { run() { calls++; return { status: 0 }; } }), /node scripts\/dependencies\.cjs setup backend/);
    assert.equal(calls, 0);
  });
}
for (const file of ['.npmrc', 'pnpm-workspace.yaml']) {
  for (const direction of ['added', 'removed']) {
    test(`R3: reject ${direction} optional ${file}`, (t) => {
      const dir = fixture(t);
      if (direction === 'removed') fs.writeFileSync(path.join(dir, file), 'config');
      prepared(dir);
      if (direction === 'removed') fs.unlinkSync(path.join(dir, file));
      else fs.writeFileSync(path.join(dir, file), 'config');
      assert.throws(() => helper().check(dir), /setup backend/);
    });
  }
}
for (const [field, value] of Object.entries({format: 2, platform: 'different', arch: 'different', nodeMajor: '1', nodeAbi: '0', pnpm: '11.0.0'})) {
  test(`R3: reject incompatible runtime ${field}`, (t) => {
    const dir = fixture(t); const marker = prepared(dir);
    fs.writeFileSync(path.join(marker, 'metadata.json'), JSON.stringify({ ...runtime(), [field]: value }));
    assert.throws(() => helper().check(dir), /setup backend/);
  });
}
for (const missing of ['node_modules/.odc-dependencies/metadata.json', 'node_modules/.modules.yaml', 'node_modules/@nestjs/cli/bin/nest.js']) {
  test(`R3: missing ${missing} requires explicit Docker synchronization`, (t) => {
    const dir = fixture(t); prepared(dir); fs.unlinkSync(path.join(dir, missing));
    assert.throws(() => helper().check(dir, {context: 'docker'}), /docker compose run --rm --no-deps backend node \/scripts\/dependencies\.cjs setup \/app --context docker/);
  });
}

test('R3: wrong installed pnpm metadata never starts', (t) => {
  const dir = fixture(t); prepared(dir);
  fs.writeFileSync(path.join(dir, 'node_modules/.modules.yaml'), 'packageManager: pnpm@11.0.0\n');
  assert.throws(() => helper().check(dir), /setup backend/);
});

test('R4: successful explicit frozen setup publishes inputs and permits readonly reuse', (t) => {
  const dir = fixture(t); fs.writeFileSync(path.join(dir, '.npmrc'), 'strict-peer-dependencies=false\n');
  fs.writeFileSync(path.join(dir, 'pnpm-workspace.yaml'), 'allowBuilds: {}\n');
  let calls = 0;
  helper().setup(dir, { run() { calls++; installed(dir); return { status: 0 }; } });
  assert.equal(calls, 1); assert.equal(helper().check(dir), true);
  const marker = path.join(dir, 'node_modules/.odc-dependencies');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(marker, 'metadata.json'))), runtime());
  for (const file of ['package.json', 'pnpm-lock.yaml', '.npmrc', 'pnpm-workspace.yaml']) {
    assert.deepEqual(fs.readFileSync(path.join(marker, file)), fs.readFileSync(path.join(dir, file)));
  }
});

for (const failure of ['exit', 'throw', 'mutate']) {
  test(`R4: ${failure} during setup invalidates the previous marker without removing dependencies`, (t) => {
    const dir = fixture(t); const marker = prepared(dir);
    assert.throws(() => helper().setup(dir, { run() {
      assert.equal(fs.existsSync(path.join(marker, 'metadata.json')), false);
      if (failure === 'throw') throw new Error('installer unavailable');
      if (failure === 'mutate') fs.appendFileSync(path.join(dir, 'pnpm-lock.yaml'), '\nchanged');
      return { status: failure === 'exit' ? 1 : 0 };
    } }));
    assert.equal(fs.existsSync(path.join(marker, 'metadata.json')), false);
    assert.ok(fs.existsSync(path.join(dir, 'node_modules/@nestjs/cli/bin/nest.js')));
    assert.throws(() => helper().check(dir), /setup backend/);
  });
}

test('R4: a fresh setup removes stale optional snapshots using only known files', (t) => {
  const dir = fixture(t); fs.writeFileSync(path.join(dir, '.npmrc'), 'config');
  const marker = prepared(dir); fs.unlinkSync(path.join(dir, '.npmrc'));
  fs.writeFileSync(path.join(marker, 'user-file'), 'preserve');
  helper().setup(dir, {run() { return { status: 0 }; }});
  assert.equal(helper().check(dir), true);
  assert.equal(fs.existsSync(path.join(marker, '.npmrc')), false);
  assert.equal(fs.readFileSync(path.join(marker, 'user-file'), 'utf8'), 'preserve');
});
