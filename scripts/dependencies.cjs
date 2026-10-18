'use strict';

// Development tooling only. Checks read a fixed set of files, never dependency trees.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const PNPM_VERSION = '10.34.6';
const INPUTS = ['package.json', 'pnpm-lock.yaml', '.npmrc', 'pnpm-workspace.yaml'];
const REQUIRED = new Set(['package.json', 'pnpm-lock.yaml']);
const METADATA = 'metadata.json';

function runtime() {
  return { format: 1, platform: process.platform, arch: process.arch,
    nodeMajor: process.versions.node.split('.')[0], nodeAbi: process.versions.modules,
    pnpm: PNPM_VERSION };
}
function readOptional(file) {
  try { return fs.readFileSync(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
function markerDirectory(dir) { return path.join(dir, 'node_modules/.odc-dependencies'); }
function packageName(dir) {
  for (const file of [path.join(dir, 'package.json'), path.join(markerDirectory(dir), 'package.json')]) {
    try { const name = JSON.parse(fs.readFileSync(file, 'utf8')).name; if (name === 'backend' || name === 'frontend') return name; }
    catch { /* Recover the package identity from its saved manifest if necessary. */ }
  }
  return path.basename(dir);
}
function recovery(dir, options) {
  const name = packageName(dir);
  return options.context === 'docker'
    ? `docker compose run --rm --no-deps ${name} node /scripts/dependencies.cjs setup /app --context docker`
    : `node scripts/dependencies.cjs setup ${name}`;
}
function actionable(dir, options, error) {
  return new Error(`[${packageName(dir)}: ${dir}] ${error.message}. Ejecuta desde la raíz: ${recovery(dir, options)}`, { cause: error });
}
function inputs(dir) {
  return INPUTS.map((name) => {
    const data = readOptional(path.join(dir, name));
    if (data === null && REQUIRED.has(name)) throw new Error(`Falta ${name}`);
    return data;
  });
}
function sameInputs(left, right) {
  return left.every((data, index) => data === null ? right[index] === null
    : right[index] !== null && data.equals(right[index]));
}
function manifest(dir) {
  const value = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  if (value.packageManager !== `pnpm@${PNPM_VERSION}`) throw new Error(`packageManager debe ser pnpm@${PNPM_VERSION}`);
  if (!['backend', 'frontend'].includes(value.name)) throw new Error('El paquete debe ser backend o frontend');
  return value;
}
function installed(dir, name) {
  const metadata = fs.readFileSync(path.join(dir, 'node_modules/.modules.yaml'), 'utf8');
  let installedManager;
  try { installedManager = JSON.parse(metadata).packageManager; }
  catch { installedManager = metadata.match(/^packageManager:\s*['"]?([^\s'"\r\n]+)['"]?\s*$/m)?.[1]; }
  if (installedManager !== `pnpm@${PNPM_VERSION}`) throw new Error(`Dependencias instaladas con un pnpm distinto de ${PNPM_VERSION}`);
  const cli = name === 'backend' ? '@nestjs/cli/bin/nest.js' : 'vite/bin/vite.js';
  if (!fs.statSync(path.join(dir, 'node_modules', cli)).isFile()) throw new Error(`Falta el ejecutable ${cli}`);
}
function check(packageDir, options = {}) {
  const dir = path.resolve(packageDir);
  try {
    const pkg = manifest(dir);
    const actual = inputs(dir);
    const marker = markerDirectory(dir);
    const savedRuntime = JSON.parse(fs.readFileSync(path.join(marker, METADATA), 'utf8'));
    const expectedRuntime = options.runtime || runtime();
    for (const field of Object.keys(runtime())) {
      if (savedRuntime[field] !== expectedRuntime[field]) throw new Error(`Entorno de dependencias incompatible (${field})`);
    }
    const saved = INPUTS.map((name) => readOptional(path.join(marker, name)));
    if (!sameInputs(actual, saved)) throw new Error('Las entradas de dependencias cambiaron');
    installed(dir, pkg.name);
    return true;
  } catch (error) { throw actionable(dir, options, error); }
}
function defaultRun(command, args, options) {
  // Windows ships Corepack as corepack.cmd. Arguments here are fixed by this helper.
  return spawnSync(command, args, { ...options, shell: process.platform === 'win32' });
}
function runCorepack(dir, args, options, offline = false) {
  const result = (options.run || defaultRun)('corepack', [`pnpm@${PNPM_VERSION}`, ...args], {
    cwd: dir, stdio: 'inherit',
    env: { ...process.env, ...(offline ? { COREPACK_ENABLE_NETWORK: '0' } : {}) },
  });
  if (result?.error) throw result.error;
  if (result?.status !== 0) throw new Error(`Corepack/pnpm terminó sin éxito (${result?.signal || result?.status || 'no disponible'})`);
}
function unlinkKnown(file) {
  try { fs.unlinkSync(file); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
function setup(packageDir, options = {}) {
  const dir = path.resolve(packageDir);
  const marker = markerDirectory(dir);
  const final = path.join(marker, METADATA);
  const temporary = path.join(marker, 'metadata.pending.json');
  try {
    // Invalidate the previous evidence even when a new setup fails early.
    unlinkKnown(final);
    unlinkKnown(temporary);
    const pkg = manifest(dir);
    const before = inputs(dir);
    runCorepack(dir, ['install', '--frozen-lockfile', '--config.confirmModulesPurge=false'], options);
    if (!sameInputs(before, inputs(dir))) throw new Error('Las entradas cambiaron durante la instalación; repite la preparación');
    installed(dir, pkg.name);
    fs.mkdirSync(marker, { recursive: true });
    for (let i = 0; i < INPUTS.length; i++) {
      const destination = path.join(marker, INPUTS[i]);
      if (before[i] === null) unlinkKnown(destination);
      else fs.writeFileSync(destination, before[i]);
    }
    fs.writeFileSync(temporary, JSON.stringify(options.runtime || runtime()));
    // Recheck after snapshot writes before publishing its validity.
    if (!sameInputs(before, inputs(dir))) throw new Error('Las entradas cambiaron durante la preparación; repítela');
    fs.renameSync(temporary, final);
    return true;
  } catch (error) {
    unlinkKnown(final);
    unlinkKnown(temporary);
    throw actionable(dir, options, error);
  }
}
function start(packageDir, options = {}) {
  const dir = path.resolve(packageDir);
  check(dir, options);
  const name = manifest(dir).name;
  const args = name === 'backend' ? ['exec', 'nest', 'start', '--watch']
    : ['exec', 'vite', 'dev', '--port', '3000', ...(options.context === 'docker' ? ['--host', '0.0.0.0'] : [])];
  try { runCorepack(dir, args, options, true); }
  catch (error) { throw actionable(dir, options, error); }
  return true;
}

module.exports = { PNPM_VERSION, check, setup, start };

if (require.main === module) {
  const [operation, packageDir, ...flags] = process.argv.slice(2);
  if (!['check', 'setup', 'start'].includes(operation) || !packageDir ||
      (flags.length && (flags.length !== 2 || flags[0] !== '--context' || flags[1] !== 'docker'))) {
    process.stderr.write('Uso: node scripts/dependencies.cjs check|setup|start backend|frontend [--context docker]\n');
    process.exitCode = 1;
  } else {
    try { module.exports[operation](packageDir, { context: flags[1] }); }
    catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
  }
}
