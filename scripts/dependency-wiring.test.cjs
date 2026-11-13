const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8').replace(/\r\n/g, '\n');
const services = ['backend', 'frontend'];

test('R1: both manifests and development images pin the same exact manager with frozen installs', () => {
  for (const service of services) {
    assert.equal(JSON.parse(read(`${service}/package.json`)).packageManager, 'pnpm@10.34.6');
    const dockerfile = read(`${service}/Dockerfile.dev`);
    assert.match(dockerfile, /corepack prepare pnpm@10\.34\.6 --activate/);
    assert.match(dockerfile, /RUN corepack pnpm@10\.34\.6 install --frozen-lockfile(?:\s|$)/);
  }
});

test('R2 R5: Compose guards both daily commands and preserves isolated dependency volumes', () => {
  const compose = read('docker-compose.yml');
  for (const service of services) {
    const block = compose.split(`  ${service}:\n`)[1]?.split(/\n  \w+:\n/)[0];
    assert.ok(block, `${service} service is present`);
    assert.match(block, /\.\/scripts:\/scripts:ro/);
    assert.match(block, /command: \["node", "\/scripts\/dependencies\.cjs", "start", "\/app", "--context", "docker"\]/);
    assert.match(block, new RegExp(`${service}_node_modules:/app/node_modules`));
    assert.doesNotMatch(block.split('command:')[1], /\b(?:install|build|test)\b/);
  }
  assert.match(compose, /pgdata:\/var\/lib\/postgresql\/data/);
});

test('R5: Docker snapshot executes against real build inputs and publishes portable runtime metadata', (t) => {
  for (const service of services) {
    const dockerfile = read(`${service}/Dockerfile.dev`);
    const snapshot = dockerfile.match(/^RUN node -e '([^\n]+)'$/m)?.[1];
    assert.ok(snapshot, `${service} has an executable image snapshot step`);
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'odc-image-snapshot-'));
    t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
    const inputs = { 'package.json': '{"name":"fixture"}\n', 'pnpm-lock.yaml': 'lockfileVersion: 9\n', '.npmrc': 'registry=https://example.invalid\n' };
    for (const [name, bytes] of Object.entries(inputs)) fs.writeFileSync(path.join(fixture, name), bytes);
    fs.mkdirSync(path.join(fixture, 'node_modules'));
    const result = spawnSync(process.execPath, ['-e', snapshot], { cwd: fixture, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const markerDir = path.join(fixture, 'node_modules/.odc-dependencies');
    for (const [name, bytes] of Object.entries(inputs)) assert.equal(fs.readFileSync(path.join(markerDir, name), 'utf8'), bytes);
    assert.equal(fs.existsSync(path.join(markerDir, 'pnpm-workspace.yaml')), false);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(markerDir, 'metadata.json'))), {
      format: 1, platform: process.platform, arch: process.arch,
      nodeMajor: process.versions.node.split('.')[0], nodeAbi: process.versions.modules, pnpm: '10.34.6',
    });
    assert.ok(dockerfile.indexOf('COPY . .') < dockerfile.indexOf("RUN node -e '"), 'snapshot follows final source copy');
  }
});

test('R7: Git ignores stores and markers, and Docker contexts exclude caches and local package policies', () => {
  const candidates = ['backend/.pnpm-store/v10/probe', 'frontend/.pnpm-store/v10/probe', 'backend/.odc-dependencies/metadata.json', 'frontend/.odc-dependencies/metadata.json'];
  const ignored = spawnSync('git', ['check-ignore', '--stdin'], { cwd: root, input: candidates.join('\n') + '\n', encoding: 'utf8' });
  assert.equal(ignored.status, 0, ignored.stderr);
  assert.deepEqual(ignored.stdout.trim().split(/\r?\n/), candidates);
  for (const service of services) {
    const rules = read(`${service}/.dockerignore`).trim().split(/\r?\n/);
    for (const pattern of ['node_modules', '.pnpm-store', '.odc-dependencies', 'pnpm-workspace.yaml', '.npmrc']) {
      assert.ok(rules.includes(pattern), `${service}: ${pattern} excluded from build context`);
    }
  }
});
