import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { access, copyFile, lstat, mkdir, readFile, readdir, realpath, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const GRAPHIFY_VERSION = '0.9.63';
export const PROJECT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const EXTRACTION_FLAGS = Object.freeze(['--code-only', '--no-cluster', '--max-workers', '2']);
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const EXCLUDED_DIRECTORIES = new Set(['.git', '.runtime', 'node_modules', 'dist', 'assets', 'output', 'tests', 'Img referencias']);
const MAX_GRAPH_BYTES = 32 * 1024 * 1024;
const SHA256 = /^[a-f0-9]{64}$/;
const GENERATION = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const posix = (value) => value.split(path.sep).join('/');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

export function projectPaths(root = PROJECT_ROOT) {
  const resolved = path.resolve(root);
  const cache = path.join(resolved, '.runtime', 'knowledge', 'graphify');
  const current = path.join(cache, 'current');
  const environment = path.join(resolved, '.runtime', 'graphify-venv');
  return { root: resolved, cache, current, environment,
    python: path.join(environment, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python'),
    pointer: path.join(current, 'snapshot.json'), generations: path.join(current, 'generations'), work: path.join(cache, 'work') };
}

function inside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

async function exists(file) {
  try { await access(file); return true; } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

// Never follow links into another workspace, including junctions on Windows.
async function safePath(root, candidate, create = false) {
  if (!inside(root, candidate)) throw new Error('Path escapes the project root.');
  let current = root;
  for (const part of path.relative(root, candidate).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink()) throw new Error(`Symbolic links are not permitted: ${posix(path.relative(root, current))}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      if (create) await mkdir(current);
    }
  }
  return candidate;
}

export function parseIgnore(text) {
  return text.replace(/^\uFEFF/, '').split(/\r?\n/).map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#')).map((pattern) => {
      if (pattern.startsWith('!') || pattern.includes('\\') || pattern.includes('..') || pattern.startsWith('/')) {
        throw new Error(`Unsupported .graphifyignore pattern: ${pattern}. Use relative globs without negation.`);
      }
      let expression = '';
      for (let index = 0; index < pattern.length; index += 1) {
        const character = pattern[index];
        if (character === '*' && pattern[index + 1] === '*') {
          index += 1;
          if (pattern[index + 1] === '/') { expression += '(?:.*/)?'; index += 1; }
          else expression += '.*';
        } else if (character === '*') expression += '[^/]*';
        else if (character === '?') expression += '[^/]';
        else expression += character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      if (pattern.endsWith('/')) expression += '.*';
      return new RegExp(`^${expression}$`);
    });
}

async function enumerate(root, relative, extensions, ignores = []) {
  const absolute = path.join(root, relative);
  await safePath(root, absolute);
  let stat;
  try { stat = await lstat(absolute); } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  if (stat.isSymbolicLink()) throw new Error(`Symbolic links are not permitted: ${relative}`);
  if (stat.isDirectory()) {
    const results = [];
    for (const entry of (await readdir(absolute)).sort()) {
      if (EXCLUDED_DIRECTORIES.has(entry)) continue;
      results.push(...await enumerate(root, path.join(relative, entry), extensions, ignores));
    }
    return results;
  }
  if (!stat.isFile()) throw new Error(`Only regular files are permitted: ${relative}`);
  const normalized = posix(relative);
  if (!extensions.has(path.extname(relative)) || ignores.some((rule) => rule.test(normalized))) return [];
  if (stat.size > 2 * 1024 * 1024) throw new Error(`Input exceeds the 2 MiB bound: ${normalized}`);
  return [{ path: normalized, bytes: stat.size, sha256: hash(await readFile(absolute)) }];
}

export async function collectInputs(root = PROJECT_ROOT) {
  root = await realpath(path.resolve(root));
  const ignorePath = path.join(root, '.graphifyignore');
  await safePath(root, ignorePath);
  const ignore = parseIgnore(await exists(ignorePath) ? await readFile(ignorePath, 'utf8') : '');
  const sources = [];
  for (const include of ['server.ts', 'src', 'scripts']) sources.push(...await enumerate(root, include, CODE_EXTENSIONS, ignore));
  sources.sort((a, b) => a.path.localeCompare(b.path, 'en'));
  const context = [];
  for (const include of ['knowledge', 'docs']) context.push(...await enumerate(root, include, new Set(['.md'])));
  context.push(...await enumerate(root, '.knowledge', new Set(['.json', '.md'])));
  for (const file of ['AGENTS.md', 'README.md', 'package.json', 'package-lock.json', 'tsconfig.json',
    '.gitignore', '.graphifyignore', 'scripts/knowledge/requirements-graphify.txt', '.github/workflows/knowledge-checks.yml']) {
    await safePath(root, path.join(root, file));
    if (await exists(path.join(root, file))) {
      const bytes = await readFile(path.join(root, file));
      context.push({ path: file, bytes: bytes.length, sha256: hash(bytes) });
    }
  }
  context.sort((a, b) => a.path.localeCompare(b.path, 'en'));
  const profile = { package: 'graphifyy', version: GRAPHIFY_VERSION, flags: EXTRACTION_FLAGS, network: 'blocked', format: 1 };
  const sourceFingerprint = hash(JSON.stringify(sources));
  const configFingerprint = hash(JSON.stringify({ profile, context }));
  return { root, sources, context, profile, sourceFingerprint, configFingerprint,
    fingerprint: hash(`${sourceFingerprint}:${configFingerprint}`) };
}

function sanitizedEnvironment() {
  const result = {};
  for (const key of ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'OS', 'PATHEXT', 'COMSPEC', 'SYSTEMDRIVE', 'LANG', 'LC_ALL']) {
    if (process.env[key]) result[key] = process.env[key];
  }
  return { ...result, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', PYTHONDONTWRITEBYTECODE: '1' };
}

export function runCommand(command, args, { cwd, timeout = 180_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: sanitizedEnvironment(), shell: false, windowsHide: true });
    let stdout = '';
    let stderr = '';
    const collect = (previous, chunk) => (previous + chunk.toString()).slice(-65_536);
    child.stdout.on('data', (chunk) => { stdout = collect(stdout, chunk); });
    child.stderr.on('data', (chunk) => { stderr = collect(stderr, chunk); });
    const timer = setTimeout(() => { child.kill(); }, timeout);
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('close', (code, signal) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`${path.basename(command)} failed (${signal || code}).\n${stderr || stdout}`));
      else resolve({ stdout, stderr });
    });
  });
}

async function providerVersion(paths, runner) {
  if (!await exists(paths.python)) throw new Error('Graphify is not configured. Run npm run graphify:setup first.');
  await safePath(paths.root, paths.python);
  const result = await runner(paths.python, ['-I', '-c', 'from importlib.metadata import version; print(version("graphifyy"))'], { cwd: paths.root });
  if (result.stdout.trim() !== GRAPHIFY_VERSION) throw new Error(`Expected graphifyy ${GRAPHIFY_VERSION}; got ${result.stdout.trim()}. Run graphify:setup.`);
  return GRAPHIFY_VERSION;
}

export async function setupGraphify(root = PROJECT_ROOT, { runner = runCommand } = {}) {
  const paths = projectPaths(await realpath(path.resolve(root)));
  await safePath(paths.root, paths.environment);
  await safePath(paths.root, path.dirname(paths.environment), true);
  const requirements = path.join(paths.root, 'scripts/knowledge/requirements-graphify.txt');
  await safePath(paths.root, requirements);
  if ((await readFile(requirements, 'utf8')).split(/\r?\n/).filter((line) => line.trim() && !line.startsWith('#')).join('\n') !== `graphifyy==${GRAPHIFY_VERSION}`) {
    throw new Error('The Graphify requirements must contain only the pinned graphifyy package.');
  }
  if (!await exists(paths.python)) await runner('uv', ['--no-config', 'venv', '--python', '3.12', paths.environment], { cwd: paths.root });
  const venvConfigPath = path.join(paths.environment, 'pyvenv.cfg');
  await safePath(paths.root, venvConfigPath);
  const venvConfig = await readFile(venvConfigPath, 'utf8');
  if (!/include-system-site-packages\s*=\s*false/i.test(venvConfig)) throw new Error('Graphify must use an isolated virtual environment.');
  const installed = await runner('uv', ['--no-config', 'pip', 'install', '--python', paths.python, '--requirement', requirements], { cwd: paths.root });
  await providerVersion(paths, runner);
  await writeFile(path.join(paths.environment, 'project-setup.json'), json({ schemaVersion: 1, version: GRAPHIFY_VERSION, configuredAt: new Date().toISOString() }));
  return { status: 'CONFIGURED', version: GRAPHIFY_VERSION, environment: posix(path.relative(paths.root, paths.environment)), diagnostics: installed.stderr.trim() };
}

// A Python guard denies sockets in addition to the fixed local AST-only flags.
const OFFLINE_RUNNER = [
  'import runpy, socket, sys',
  'def denied(*args, **kwargs):',
  '    raise OSError("Network access is disabled for project Graphify extraction")',
  'original_connect = socket.socket.connect',
  'original_connect_ex = socket.socket.connect_ex',
  'original_bind = socket.socket.bind',
  'def local_connect(self, *args, **kwargs):',
  '    if self.family in (socket.AF_INET, socket.AF_INET6): return denied()',
  '    return original_connect(self, *args, **kwargs)',
  'def local_connect_ex(self, *args, **kwargs):',
  '    if self.family in (socket.AF_INET, socket.AF_INET6): return denied()',
  '    return original_connect_ex(self, *args, **kwargs)',
  'def local_bind(self, *args, **kwargs):',
  '    if self.family in (socket.AF_INET, socket.AF_INET6): return denied()',
  '    return original_bind(self, *args, **kwargs)',
  'socket.create_connection = denied',
  'socket.getaddrinfo = denied',
  'socket.gethostbyname = denied',
  'socket.gethostbyname_ex = denied',
  'socket.gethostbyaddr = denied',
  'socket.socket.sendto = denied',
  'if hasattr(socket.socket, "sendmsg"): socket.socket.sendmsg = denied',
  'socket.socket.connect = local_connect',
  'socket.socket.connect_ex = local_connect_ex',
  'socket.socket.bind = local_bind',
  'if __name__ == "__main__":',
  '    sys.argv = ["graphify", *sys.argv[1:]]',
  '    runpy.run_module("graphify", run_name="__main__")',
].join('\n');

export function validateGraph(graph, sources, stagingRoot) {
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) throw new Error('Graphify returned an invalid graph schema.');
  if (!graph.nodes.length) throw new Error('Graphify returned an empty graph; the previous snapshot was preserved.');
  if ((graph.input_tokens || 0) !== 0 || (graph.output_tokens || 0) !== 0) throw new Error('Semantic extraction is prohibited in the local Graphify profile.');
  const allowed = new Set(sources.map((source) => source.path));
  const ids = new Set();
  const references = new Set();
  const normalizeSource = (value) => {
    if (typeof value !== 'string' || !value) return value;
    let source = value.replace(/\\/g, '/');
    if (path.isAbsolute(value)) {
      if (!inside(stagingRoot, value)) throw new Error(`Graph source escapes the staged corpus: ${source}`);
      source = posix(path.relative(stagingRoot, value));
    }
    source = source.replace(/^\.\//, '');
    if (!allowed.has(source)) throw new Error(`Graph source was not allowlisted: ${source}`);
    return source;
  };
  const normalized = {
    ...graph,
    nodes: graph.nodes.map((node) => {
      if (!node || typeof node.id !== 'string' || !node.id || ids.has(node.id)) throw new Error('Graph contains invalid or duplicate node IDs.');
      ids.add(node.id);
      // Upstream creates anchors for unresolved dynamic import strings. They
      // are references, not files read outside the staged corpus.
      const isReference = node._origin === 'ast' && node.confidence === 'EXTRACTED' &&
        !node.source_location && !allowed.has(node.source_file) && graph.edges.some((edge) =>
          edge.target === node.id && ['imports', 'dynamic_import'].includes(edge.relation) && allowed.has(edge.source_file));
      if (isReference) {
        references.add(node.id);
        return { ...node, source_file: undefined, reference_target: node.source_file, kind: 'external-reference' };
      }
      return { ...node, source_file: normalizeSource(node.source_file) };
    }),
    edges: graph.edges.map((edge) => {
      if (!edge || typeof edge.source !== 'string' || typeof edge.target !== 'string') throw new Error('Graph contains an invalid edge.');
      return { ...edge, source_file: normalizeSource(edge.source_file) };
    }),
    extracted_sources: (graph.extracted_sources || []).map(normalizeSource),
  };
  const extracted = new Set(normalized.extracted_sources);
  if (sources.some((source) => !extracted.has(source.path))) throw new Error('Graphify did not extract the complete staged corpus; the previous snapshot was preserved.');
  const unresolved = normalized.edges.filter((edge) => !ids.has(edge.source) || !ids.has(edge.target) || references.has(edge.target));
  return { graph: normalized, stats: { files: sources.length, nodes: normalized.nodes.length, edges: normalized.edges.length,
    externalReferenceNodes: references.size,
    unresolvedReferences: unresolved.length, unresolvedImports: unresolved.filter((edge) => ['imports', 'dynamic_import'].includes(edge.relation)).length,
    inputTokens: 0, outputTokens: 0 } };
}

export async function refreshGraph(root = PROJECT_ROOT, { runner = runCommand } = {}) {
  const inputs = await collectInputs(root);
  if (!inputs.sources.length) throw new Error('No allowlisted source files were found.');
  const paths = projectPaths(inputs.root);
  await providerVersion(paths, runner);
  const generation = randomUUID();
  const work = path.join(paths.work, generation);
  const corpus = path.join(work, 'corpus');
  const output = path.join(work, 'output');
  await safePath(paths.root, corpus, true);
  await safePath(paths.root, output, true);
  try {
    for (const source of inputs.sources) {
      const staged = path.join(corpus, source.path);
      await safePath(paths.root, path.dirname(staged), true);
      await copyFile(path.join(paths.root, source.path), staged);
      if (hash(await readFile(staged)) !== source.sha256) throw new Error(`Source changed while staging: ${source.path}`);
    }
    const offlineRunner = path.join(work, 'offline-runner.py');
    await writeFile(offlineRunner, OFFLINE_RUNNER);
    const extracted = await runner(paths.python, ['-I', offlineRunner, 'extract', corpus, ...EXTRACTION_FLAGS, '--out', output], { cwd: work });
    const log = `${extracted.stdout}\n${extracted.stderr}`;
    await writeFile(path.join(work, 'extract.log'), log);
    const raw = await boundedRead(path.join(output, 'graphify-out', 'graph.json'));
    const validated = validateGraph(JSON.parse(raw), inputs.sources, corpus);
    if ((await collectInputs(paths.root)).fingerprint !== inputs.fingerprint) throw new Error('SOURCE_DRIFT: project sources or knowledge configuration changed during extraction. Run refresh again after editing.');
    const snapshot = path.join(paths.generations, generation);
    await safePath(paths.root, snapshot, true);
    const graphText = json(validated.graph);
    const manifest = { schemaVersion: 1, generation, generatedAt: new Date().toISOString(),
      fingerprint: inputs.fingerprint, sourceFingerprint: inputs.sourceFingerprint, configFingerprint: inputs.configFingerprint,
      profile: inputs.profile, sources: inputs.sources, context: inputs.context, stats: validated.stats,
      evidence: { structural: 'verified', semantic: 'not-verified', humanReview: 'not-verified' } };
    const manifestText = json(manifest);
    await writeFile(path.join(snapshot, 'raw-graph.json'), raw);
    await writeFile(path.join(snapshot, 'graph.json'), graphText);
    await writeFile(path.join(snapshot, 'manifest.json'), manifestText);
    await writeFile(path.join(snapshot, 'extract.log'), log);
    const pointer = { schemaVersion: 1, generation, manifestSha256: hash(manifestText), graphSha256: hash(graphText), rawGraphSha256: hash(raw) };
    const temporary = path.join(paths.current, `${generation}.pending.json`);
    await writeFile(temporary, json(pointer), { flag: 'wx' });
    // Atomic replacement publishes a complete immutable generation on Windows.
    await rename(temporary, paths.pointer);
    return { status: 'CURRENT', ...manifest.stats, fingerprint: manifest.fingerprint, snapshot: posix(path.relative(paths.root, snapshot)) };
  } catch (error) {
    await writeFile(path.join(work, 'failure.json'), json({ at: new Date().toISOString(), error: error.message, previousSnapshotPreserved: true }));
    throw error;
  }
}

async function boundedRead(file) {
  if ((await lstat(file)).size > MAX_GRAPH_BYTES) throw new Error('Graphify snapshot exceeds the 32 MiB bound.');
  return readFile(file, 'utf8');
}

export async function readSnapshot(root = PROJECT_ROOT) {
  const paths = projectPaths(await realpath(path.resolve(root)));
  await safePath(paths.root, paths.pointer);
  if (!await exists(paths.pointer)) return null;
  const pointer = JSON.parse(await boundedRead(paths.pointer));
  if (pointer.schemaVersion !== 1 || !GENERATION.test(pointer.generation || '') ||
      !['manifestSha256', 'graphSha256', 'rawGraphSha256'].every((key) => SHA256.test(pointer[key] || ''))) throw new Error('Invalid Graphify snapshot pointer.');
  const snapshot = path.join(paths.generations, pointer.generation);
  await safePath(paths.root, snapshot);
  const content = {};
  for (const [name, checksum] of [['manifest.json', 'manifestSha256'], ['graph.json', 'graphSha256'], ['raw-graph.json', 'rawGraphSha256']]) {
    const file = path.join(snapshot, name);
    await safePath(paths.root, file);
    content[name] = await boundedRead(file);
    if (hash(content[name]) !== pointer[checksum]) throw new Error(`Graphify snapshot integrity check failed: ${name}`);
  }
  const manifest = JSON.parse(content['manifest.json']);
  if (manifest.schemaVersion !== 1 || manifest.generation !== pointer.generation || !SHA256.test(manifest.fingerprint || '')) throw new Error('Invalid Graphify manifest.');
  return { manifest, graph: JSON.parse(content['graph.json']), snapshot: posix(path.relative(paths.root, snapshot)) };
}

export async function graphStatus(root = PROJECT_ROOT) {
  try {
    const inputs = await collectInputs(root);
    const snapshot = await readSnapshot(inputs.root);
    if (!snapshot) return { status: 'MISSING', reason: 'No published local snapshot. Run graphify:setup and graphify:refresh.' };
    const current = snapshot.manifest.fingerprint === inputs.fingerprint;
    return { status: current ? 'CURRENT' : 'STALE', generatedAt: snapshot.manifest.generatedAt, snapshot: snapshot.snapshot,
      ...snapshot.manifest.stats, fingerprint: snapshot.manifest.fingerprint, currentFingerprint: inputs.fingerprint,
      evidence: snapshot.manifest.evidence, reason: current ? undefined : 'SOURCE_DRIFT: sources, documentation or configuration changed.' };
  } catch (error) { return { status: 'INVALID', reason: error.message }; }
}

export function queryGraph(graph, text, { limit = 10 } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error('Query limit must be an integer between 1 and 50.');
  if (typeof text !== 'string' || !text.trim() || text.length > 256) throw new Error('Query must contain 1 to 256 characters.');
  const terms = text.trim().toLocaleLowerCase('en').split(/\s+/);
  const matches = graph.nodes.filter((node) => {
    const haystack = [node.id, node.label, node.source_file].filter(Boolean).join(' ').toLocaleLowerCase('en');
    return terms.every((term) => haystack.includes(term));
  }).sort((a, b) => `${a.source_file}:${a.id}`.localeCompare(`${b.source_file}:${b.id}`, 'en'));
  const results = matches.slice(0, limit).map((node) => ({ id: node.id, label: node.label, source: node.source_file, location: node.source_location,
    kind: node.kind || 'source', referenceTarget: node.reference_target,
    connections: graph.edges.filter((edge) => edge.source === node.id || edge.target === node.id).slice(0, 10)
      .map(({ source, target, relation, confidence }) => ({ source, target, relation, confidence })) }));
  return { query: text, totalMatches: matches.length, limit, truncated: matches.length > limit, results };
}

export async function querySnapshot(root, text, options) {
  const status = await graphStatus(root);
  if (status.status === 'MISSING' || status.status === 'INVALID') throw new Error(status.reason);
  const snapshot = await readSnapshot(root);
  return { status: status.status, generatedAt: status.generatedAt, mode: 'local-text-match', ...queryGraph(snapshot.graph, text, options) };
}

export function parseArguments(argv) {
  const [command, ...args] = argv;
  if (!['setup', 'refresh', 'status', 'query'].includes(command)) throw new Error('Usage: graphify.mjs setup|refresh|status [--check]|query <text> [--limit 1..50] [--json]');
  const result = { command, json: false, check: false, limit: 10, terms: [] };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--json' && !result.json) result.json = true;
    else if (arg === '--check' && command === 'status' && !result.check) result.check = true;
    else if (arg === '--limit' && command === 'query' && /^\d+$/.test(args[index + 1] || '')) result.limit = Number(args[++index]);
    else if (command === 'query' && !arg.startsWith('--')) result.terms.push(arg);
    else throw new Error(`Unsupported argument: ${arg}`);
  }
  if (command === 'query') queryGraph({ nodes: [], edges: [] }, result.terms.join(' '), result);
  return result;
}

async function main() {
  try {
    const args = parseArguments(process.argv.slice(2));
    const result = args.command === 'setup' ? await setupGraphify() : args.command === 'refresh' ? await refreshGraph() :
      args.command === 'status' ? await graphStatus() : await querySnapshot(PROJECT_ROOT, args.terms.join(' '), { limit: args.limit });
    console.log(args.json ? JSON.stringify(result) : json(result).trimEnd());
    if (args.check && result.status !== 'CURRENT') process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) await main();
