import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  collectInputs, EXTRACTION_FLAGS, GRAPHIFY_VERSION, graphStatus, parseArguments,
  parseIgnore, projectPaths, queryGraph, querySnapshot, readSnapshot, refreshGraph, validateGraph,
} from '../../scripts/knowledge/graphify.mjs';

async function removeFixture(folder, prefix) {
  const temporaryRoot = await realpath(os.tmpdir());
  const target = await realpath(path.resolve(folder));
  assert.equal(path.dirname(target), temporaryRoot, 'Fixture cleanup must stay directly inside the temporary folder');
  assert.equal(path.basename(target).startsWith(prefix), true, 'Fixture cleanup must match its generated prefix');
  await rm(target, { recursive: true, force: true });
}

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'web-rpg-graphify-'));
  t.after(() => removeFixture(root, 'web-rpg-graphify-'));
  async function put(relative, content) {
    const file = path.join(root, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content);
    return file;
  }
  await put('server.ts', 'export function server() { return 1; }\n');
  await put('src/movement.ts', 'export function movePlayer() { return 2; }\n');
  await put('knowledge/index.md', '# Knowledge\n');
  await put('.graphifyignore', 'scripts/private/**\n');
  await put('package.json', '{"type":"module"}\n');
  await put('.knowledge/standard.json', '{"version":"1.0.0"}\n');
  await put(path.relative(root, projectPaths(root).python), 'fake interpreter, never executed');
  return { root, put };
}

function fakeRunner({ graph, beforeExtract, fail } = {}) {
  return async (_command, args) => {
    if (args.includes('-c')) return { stdout: GRAPHIFY_VERSION, stderr: '' };
    assert.deepEqual(args.slice(4, 8), EXTRACTION_FLAGS);
    const corpus = args[3];
    assert.equal((await readFile(path.join(corpus, 'server.ts'), 'utf8')).includes('export'), true);
    if (beforeExtract) await beforeExtract();
    if (fail) throw new Error('Simulated extractor interruption');
    const output = args[args.indexOf('--out') + 1];
    await mkdir(path.join(output, 'graphify-out'), { recursive: true });
    const result = graph || {
      nodes: [
        { id: 'server', label: 'server()', source_file: path.join(corpus, 'server.ts'), source_location: 'L1' },
        { id: 'move', label: 'movePlayer()', source_file: 'src/movement.ts', source_location: 'L1' },
      ],
      edges: [{ source: 'server', target: 'move', relation: 'calls', source_file: 'server.ts', confidence: 'EXTRACTED' },
        { source: 'server', target: 'external', relation: 'imports', source_file: 'server.ts', confidence: 'EXTRACTED' }],
      extracted_sources: [path.join(corpus, 'server.ts'), path.join(corpus, 'src/movement.ts')],
      input_tokens: 0, output_tokens: 0,
    };
    await writeFile(path.join(output, 'graphify-out', 'graph.json'), JSON.stringify(result));
    return { stdout: 'AST fixture extracted', stderr: '' };
  };
}

test('staging includes only allowlisted code and rejects secrets/dependencies/assets', async (t) => {
  const { root, put } = await fixture(t);
  await put('scripts/helper.mjs', 'export const helper = true;');
  await put('scripts/private/secret.mjs', 'secret');
  await put('src/node_modules/dependency.ts', 'excluded');
  await put('src/.env', 'secret');
  await put('assets/generated.ts', 'excluded');
  await put('dist/server.js', 'excluded');
  await put('tests/fixture.ts', 'excluded');
  await put('.knowledge/templates/concept.md', '# Authoring template\n');
  const inputs = await collectInputs(root);
  assert.deepEqual(inputs.sources.map(({ path }) => path), ['scripts/helper.mjs', 'server.ts', 'src/movement.ts']);
  assert.ok(inputs.context.some(({ path }) => path === 'knowledge/index.md'));
  assert.ok(inputs.context.some(({ path }) => path === '.knowledge/standard.json'));
  assert.ok(inputs.context.some(({ path }) => path === '.knowledge/templates/concept.md'));
});

test('source additions/deletions, documentation and configuration invalidate freshness', async (t) => {
  const { root, put } = await fixture(t);
  const baseline = await collectInputs(root);
  await put('knowledge/index.md', '# Updated knowledge\n');
  const documented = await collectInputs(root);
  assert.equal(documented.sourceFingerprint, baseline.sourceFingerprint);
  assert.notEqual(documented.configFingerprint, baseline.configFingerprint);
  await put('src/added.ts', 'export const addition = true;');
  const added = await collectInputs(root);
  assert.notEqual(added.sourceFingerprint, documented.sourceFingerprint);
  await rm(path.join(root, 'src/added.ts'));
  assert.equal((await collectInputs(root)).fingerprint, documented.fingerprint);
});

test('complete generation publishes atomically and preserves raw output plus unresolved evidence', async (t) => {
  const { root } = await fixture(t);
  const published = await refreshGraph(root, { runner: fakeRunner() });
  assert.equal(published.status, 'CURRENT');
  assert.equal(published.unresolvedImports, 1);
  const snapshot = await readSnapshot(root);
  assert.equal(snapshot.graph.nodes[0].source_file, 'server.ts');
  assert.equal(snapshot.manifest.evidence.semantic, 'not-verified');
  assert.equal((await graphStatus(root)).status, 'CURRENT');
  assert.equal(JSON.parse(await readFile(path.join(root, snapshot.snapshot, 'raw-graph.json'), 'utf8')).nodes[0].source_file.includes('corpus'), true);
});

test('failed refresh and concurrent source drift preserve the exact previous snapshot', async (t) => {
  const { root, put } = await fixture(t);
  await refreshGraph(root, { runner: fakeRunner() });
  const original = await readFile(projectPaths(root).pointer, 'utf8');
  await assert.rejects(refreshGraph(root, { runner: fakeRunner({ fail: true }) }), /interruption/);
  assert.equal(await readFile(projectPaths(root).pointer, 'utf8'), original);
  await assert.rejects(refreshGraph(root, { runner: fakeRunner({ beforeExtract: () => put('src/movement.ts', 'export const changed = true;') }) }), /SOURCE_DRIFT/);
  assert.equal(await readFile(projectPaths(root).pointer, 'utf8'), original);
  assert.equal((await graphStatus(root)).status, 'STALE');
});

test('malformed, empty, semantic, and out-of-corpus graphs cannot replace a valid snapshot', async (t) => {
  const { root } = await fixture(t);
  await refreshGraph(root, { runner: fakeRunner() });
  const original = await readFile(projectPaths(root).pointer, 'utf8');
  for (const graph of [
    { nodes: 'invalid', edges: [] },
    { nodes: [], edges: [] },
    { nodes: [{ id: 'a', source_file: 'server.ts' }], edges: [], output_tokens: 1 },
    { nodes: [{ id: 'a', source_file: '../outside.ts' }], edges: [] },
  ]) {
    await assert.rejects(refreshGraph(root, { runner: fakeRunner({ graph }) }));
    assert.equal(await readFile(projectPaths(root).pointer, 'utf8'), original);
  }
});

test('external import anchors remain explicitly unresolved; partial extraction is rejected', () => {
  const sources = [{ path: 'server.ts' }];
  const corpus = path.resolve('fixture-corpus');
  const raw = {
    nodes: [{ id: 'server', source_file: 'server.ts' },
      { id: 'external', label: 'external-package', source_file: 'external-package', confidence: 'EXTRACTED', _origin: 'ast' }],
    edges: [{ source: 'server', target: 'external', source_file: 'server.ts', relation: 'dynamic_import' }],
    extracted_sources: [path.join(corpus, 'server.ts')],
  };
  const validated = validateGraph(raw, sources, corpus);
  assert.equal(validated.graph.nodes[1].kind, 'external-reference');
  assert.equal(validated.graph.nodes[1].source_file, undefined);
  assert.equal(validated.stats.externalReferenceNodes, 1);
  assert.equal(validated.stats.unresolvedImports, 1);
  assert.throws(() => validateGraph({ ...raw, extracted_sources: [] }, sources, corpus), /complete staged corpus/);
});

test('snapshot checksum and pointer traversal tampering report INVALID', async (t) => {
  const { root, put } = await fixture(t);
  await refreshGraph(root, { runner: fakeRunner() });
  const snapshot = await readSnapshot(root);
  await put(`${snapshot.snapshot}/graph.json`, '{"nodes":[],"edges":[]}');
  assert.equal((await graphStatus(root)).status, 'INVALID');
  const pointer = { schemaVersion: 1, generation: '../escape', manifestSha256: '0'.repeat(64), graphSha256: '0'.repeat(64), rawGraphSha256: '0'.repeat(64) };
  await put(path.relative(root, projectPaths(root).pointer), JSON.stringify(pointer));
  await assert.rejects(readSnapshot(root), /pointer/);
});

test('junctions/symlinks cannot widen the corpus', async (t) => {
  const { root } = await fixture(t);
  const target = await mkdtemp(path.join(os.tmpdir(), 'web-rpg-external-'));
  t.after(() => removeFixture(target, 'web-rpg-external-'));
  await writeFile(path.join(target, 'private.ts'), 'secret');
  await symlink(target, path.join(root, 'src/external'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(collectInputs(root), /Symbolic links/);
});

test('queries are bounded literal matches and leave published snapshot and sources unchanged', async (t) => {
  const { root } = await fixture(t);
  await refreshGraph(root, { runner: fakeRunner() });
  const before = await collectInputs(root);
  const pointer = await readFile(projectPaths(root).pointer, 'utf8');
  const result = await querySnapshot(root, 'move', { limit: 1 });
  assert.equal(result.mode, 'local-text-match');
  assert.equal(result.results[0].source, 'src/movement.ts');
  assert.equal(result.results[0].connections.length, 1);
  assert.equal((await querySnapshot(root, '.*', { limit: 1 })).totalMatches, 0);
  assert.equal((await collectInputs(root)).fingerprint, before.fingerprint);
  assert.equal(await readFile(projectPaths(root).pointer, 'utf8'), pointer);
  assert.throws(() => queryGraph({ nodes: [], edges: [] }, 'a', { limit: 51 }), /limit/);
  assert.throws(() => queryGraph({ nodes: [], edges: [] }, 'a'.repeat(257)), /256/);
});

test('CLI parser accepts only fixed commands/options; ignore syntax is explicit', () => {
  assert.equal(parseArguments(['query', 'movement', '--limit', '3', '--json']).limit, 3);
  assert.equal(parseArguments(['status', '--check']).check, true);
  for (const args of [['refresh', '--postgres', 'dsn'], ['setup', '--global'], ['query', 'a', '--limit', '0'], ['status', '--out', '../escape']]) assert.throws(() => parseArguments(args));
  assert.ok(parseIgnore('**/*.key\nscripts/private/').some((rule) => rule.test('src/secret.key')));
  assert.throws(() => parseIgnore('!src/**'), /Unsupported/);
});
