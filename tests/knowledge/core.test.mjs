import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { createADR, impactKnowledge, loadBundle, parseFrontmatter, projectPath, queryKnowledge, recordBaseline, resolveResource, validateKnowledge } from '../../scripts/knowledge/core.mjs';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const coreURL = new URL('../../scripts/knowledge/core.mjs', import.meta.url).href;

function write(root, relative, contents) {
  const target = path.join(root, relative);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'knowledge-core-'));
  t.after(() => {
    const parent = path.resolve(tmpdir());
    const target = path.resolve(root);
    assert.equal(path.dirname(target), parent);
    assert.ok(path.basename(target).startsWith('knowledge-core-'));
    rmSync(target, { recursive: true, force: true });
  });
  mkdirSync(path.join(root, '.knowledge'));
  copyFileSync(path.join(projectRoot, '.knowledge/standard.json'), path.join(root, '.knowledge/standard.json'));
  mkdirSync(path.join(root, 'knowledge/architecture/decisions'), { recursive: true });
  write(root, 'knowledge/index.md', '---\nokf_version: "0.2"\n---\n# Knowledge\n');
  write(root, 'knowledge/log.md', '# Log\n\n## 2026-10-02\n\nTemporary regression fixture.\n');
  write(root, 'src/source.ts', 'export const fixture = 1;\n');
  return root;
}

function metadata(id = 'CONCEPT-A', overrides = {}) {
  return {
    type: 'Project Concept',
    id,
    title: `Concept ${id}`,
    status: 'stable',
    implementation_status: 'observed',
    created: '2026-10-02',
    updated: '2026-10-02',
    sources: [{ resource: '../../src/source.ts' }],
    relates_to: [],
    tags: ['fixture'],
    ...overrides,
  };
}

function concept(root, data = metadata(), { file = `knowledge/concepts/${data.id}.md`, body = `# ${data.title}\n\nFixture content.\n`, indexed = true } = {}) {
  write(root, file, `---\n${stringify(data)}---\n${body}`);
  if (indexed) {
    const index = path.join(root, 'knowledge/index.md');
    const relative = path.relative(path.join(root, 'knowledge'), path.join(root, file)).split(path.sep).join('/');
    writeFileSync(index, `${readFileSync(index, 'utf8')}\n[${data.id}](${relative})\n`);
  }
  return file;
}

function decision(root, id, overrides = {}) {
  const data = metadata(id, {
    type: 'Architecture Decision',
    status: 'draft',
    implementation_status: 'planned',
    sources: [{ resource: '../../../src/source.ts' }],
    decision_status: 'proposed',
    decision_date: null,
    supersedes: null,
    ...overrides,
  });
  return concept(root, data, {
    file: `knowledge/architecture/decisions/${id}.md`,
    body: `# ${id}\n\n## Contexto\n\nTemporary fixture.\n\n## Decisão\n\nTemporary proposal.\n\n## Alternativas\n\nTemporary alternatives.\n\n## Consequências\n\nTemporary consequences.\n\n## Evidências\n\nFixture only.\n`,
  });
}

function result(root, options = {}) {
  return validateKnowledge(root, { checkBaseline: false, ...options });
}

function valid(root, options = {}) {
  const validation = result(root, options);
  assert.equal(validation.valid, true, JSON.stringify(validation.issues, null, 2));
  assert.equal(validation.semantic, 'not-verified');
  assert.equal(validation.humanReview, 'not-verified');
  return validation;
}

function hasError(root, code, file, options = {}) {
  const validation = result(root, options);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((issue) => issue.severity === 'error' && issue.code === code && (!file || issue.file === file)), JSON.stringify(validation.issues, null, 2));
  return validation;
}

function snapshot(root) {
  const entries = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(directory, entry.name);
      const relative = path.relative(root, file).split(path.sep).join('/');
      if (entry.isDirectory()) {
        entries.push([`${relative}/`, null]);
        walk(file);
      } else {
        entries.push([relative, createHash('sha256').update(readFileSync(file)).digest('hex')]);
      }
    }
  }
  walk(root);
  return entries;
}

test('native YAML preserves source objects, unknown fields, custom types, and both verification forms', async (t) => {
  for (const verified of [{ by: 'fixture:reader', at: '2026-10-02T12:00:00Z' }, [{ by: 'fixture:reader', at: '2026-10-02T12:00:00Z' }]]) {
    await t.test(Array.isArray(verified) ? 'verification list' : 'verification object', (child) => {
      const root = fixture(child);
      const data = metadata('CUSTOM-A', {
        type: 'Custom Domain Type',
        sources: [{ resource: '../../src/source.ts', title: 'Source fixture', usage_count: 2, native_extension: { retained: true } }],
        verified,
        generated: { by: 'fixture:generator', at: '2026-10-02T12:00:00Z' },
        project_extension: { nested: ['a', 'b'], bool: true },
      });
      concept(root, data);
      const bundle = loadBundle(root);
      assert.deepEqual(bundle.documents.find((item) => item.metadata?.id === data.id).metadata, data);
      valid(root);
    });
  }
});

test('frontmatter rejects duplicate keys, aliases, anchors, explicit tags, and nonmapping roots', async (t) => {
  const cases = [
    ['duplicate keys', 'type: First\ntype: Second'],
    ['anchor', 'type: &name Project Concept'],
    ['alias', 'type: *name'],
    ['custom tag', 'type: !custom Project Concept'],
    ['explicit standard tag', 'type: !!str Project Concept'],
    ['sequence root', '- Project Concept'],
    ['scalar root', 'Project Concept'],
  ];
  for (const [name, yaml] of cases) await t.test(name, () => assert.throws(() => parseFrontmatter(`---\n${yaml}\n---\n# Body\n`)));
  assert.deepEqual(parseFrontmatter('\uFEFF---\r\ntype: Custom\r\n---\r\n# Body\r\n'), { metadata: { type: 'Custom' }, body: '# Body\n' });
  assert.throws(() => parseFrontmatter('---\ntype: Custom\n# Body\n'), /Unterminated/);
});

test('project and source paths reject traversal, unsupported schemes, and symbolic links', (t) => {
  const root = fixture(t);
  assert.throws(() => projectPath(root, '../outside.ts'), /escapes/);
  assert.throws(() => projectPath(root, path.resolve(root, 'src/source.ts')), /Invalid/);
  assert.throws(() => projectPath(root, 'C:\\outside.ts'), /Invalid/);
  assert.throws(() => resolveResource(root, 'knowledge/concepts/A.md', 'file:///outside.ts'), /Unsupported/);
  const file = concept(root, metadata('CONCEPT-A', { sources: [{ resource: '../../../outside.ts' }] }));
  hasError(root, 'SOURCE', file);
  symlinkSync(path.join(root, 'src'), path.join(root, 'src-linked'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => projectPath(root, 'src-linked/source.ts'), /Symbolic link/);
  concept(root, metadata('CONCEPT-A', { sources: [{ resource: '../../src-linked/source.ts' }] }), { indexed: false });
  const validation = hasError(root, 'SOURCE', file);
  assert.ok(validation.issues.some((issue) => issue.code === 'SOURCE' && /Symbolic link/.test(issue.message)));
});

test('profile enforces required metadata without rejecting project extensions', (t) => {
  const root = fixture(t);
  const data = metadata();
  delete data.relates_to;
  const file = concept(root, data);
  hasError(root, 'PROFILE', file);
});

test('duplicate IDs, unindexed concepts, missing relations, and self relations fail validation', async (t) => {
  await t.test('duplicate IDs', (child) => {
    const root = fixture(child);
    concept(root);
    concept(root, metadata(), { file: 'knowledge/concepts/second.md' });
    hasError(root, 'DUPLICATE_ID', 'knowledge/concepts/second.md');
  });
  await t.test('unindexed concept', (child) => {
    const root = fixture(child);
    const file = concept(root, metadata(), { indexed: false });
    hasError(root, 'UNINDEXED', file);
  });
  await t.test('unknown relation', (child) => {
    const root = fixture(child);
    const file = concept(root, metadata('CONCEPT-A', { relates_to: ['MISSING'] }));
    hasError(root, 'RELATION', file);
  });
  await t.test('self relation', (child) => {
    const root = fixture(child);
    const file = concept(root, metadata('CONCEPT-A', { relates_to: ['CONCEPT-A'] }));
    hasError(root, 'SELF_RELATION', file);
  });
});

test('Markdown links require existing files and heading anchors, including reference links', async (t) => {
  for (const [name, link] of [['missing file', '[Missing](absent.md)'], ['missing anchor', '[Missing](CONCEPT-A.md#absent)'], ['reference target', '[Missing][unknown]']]) {
    await t.test(name, (child) => {
      const root = fixture(child);
      const file = concept(root, metadata(), { body: `# Existing heading\n\n${link}\n` });
      hasError(root, 'LINK', file);
    });
  }
  await t.test('valid anchors and code examples', (child) => {
    const root = fixture(child);
    concept(root, metadata(), { body: '# Existing heading\n\n[Valid](#existing-heading)\n\n`[Example](missing.md)`\n\n```md\n[Example](missing.md)\n```\n' });
    valid(root);
  });
});

test('real calendar dates and provenance timestamps are enforced', async (t) => {
  for (const [name, overrides, code] of [
    ['impossible day', { created: '2026-02-30' }, 'DATE'],
    ['impossible month', { updated: '2026-13-02' }, 'DATE'],
    ['date order', { created: '2026-10-03', updated: '2026-10-02' }, 'DATE_ORDER'],
    ['provenance timestamp', { verified: { by: 'fixture:reader', at: '2026-02-30T12:00:00Z' } }, 'TIMESTAMP'],
  ]) {
    await t.test(name, (child) => {
      const root = fixture(child);
      const file = concept(root, metadata('CONCEPT-A', overrides));
      hasError(root, code, file);
    });
  }
  await t.test('log date', (child) => {
    const root = fixture(child);
    write(root, 'knowledge/log.md', '# Log\n\n## 2026-02-30\n');
    hasError(root, 'LOG_DATE', 'knowledge/log.md');
  });
});

test('ADR proposals cannot imply approval and decided ADRs require explicit human metadata', async (t) => {
  await t.test('clean proposal', (child) => {
    const root = fixture(child);
    decision(root, 'ADR-0001');
    valid(root);
  });
  for (const field of ['decision_date', 'decided_by', 'approval_reference']) {
    await t.test(`proposed ${field}`, (child) => {
      const root = fixture(child);
      const file = decision(root, 'ADR-0001', { [field]: field === 'decision_date' ? '2026-10-02' : 'fixture-only' });
      hasError(root, 'ADR_APPROVAL', file);
    });
  }
  await t.test('accepted without approval', (child) => {
    const root = fixture(child);
    const file = decision(root, 'ADR-0001', { decision_status: 'accepted', decision_date: '2026-10-02' });
    hasError(root, 'PROFILE', file);
  });
  await t.test('automatic actor cannot satisfy human approval', (child) => {
    const root = fixture(child);
    const file = decision(root, 'ADR-0001', { decision_status: 'accepted', decision_date: '2026-10-02', decided_by: 'agent:fixture', approval_reference: 'fixture-only' });
    hasError(root, 'PROFILE', file);
  });
  await t.test('missing ADR section', (child) => {
    const root = fixture(child);
    const file = decision(root, 'ADR-0001');
    writeFileSync(path.join(root, file), readFileSync(path.join(root, file), 'utf8').replace('## Alternativas', '## Outro título'));
    hasError(root, 'ADR_SECTION', file);
  });
});

test('ADR supersession requires reciprocal references and forbids cycles', async (t) => {
  const decided = { decision_date: '2026-10-02', decided_by: 'human:fixture-reviewer', approval_reference: 'fixture-only' };
  await t.test('valid reciprocal supersession', (child) => {
    const root = fixture(child);
    decision(root, 'ADR-0001', { ...decided, decision_status: 'superseded', superseded_by: 'ADR-0002' });
    decision(root, 'ADR-0002', { ...decided, decision_status: 'accepted', supersedes: 'ADR-0001' });
    valid(root);
  });
  await t.test('missing predecessor', (child) => {
    const root = fixture(child);
    const file = decision(root, 'ADR-0001', { supersedes: 'ADR-9999' });
    hasError(root, 'ADR_PREDECESSOR', file);
  });
  await t.test('nonreciprocal successor', (child) => {
    const root = fixture(child);
    decision(root, 'ADR-0001', { ...decided, decision_status: 'accepted' });
    const file = decision(root, 'ADR-0002', { ...decided, decision_status: 'accepted', supersedes: 'ADR-0001' });
    hasError(root, 'ADR_RECIPROCAL', file);
  });
  await t.test('reciprocal cycle', (child) => {
    const root = fixture(child);
    decision(root, 'ADR-0001', { ...decided, decision_status: 'superseded', supersedes: 'ADR-0002', superseded_by: 'ADR-0002' });
    decision(root, 'ADR-0002', { ...decided, decision_status: 'superseded', supersedes: 'ADR-0001', superseded_by: 'ADR-0001' });
    hasError(root, 'ADR_CYCLE');
  });
});

test('source baselines deterministically detect source and document drift without granting approval', (t) => {
  const root = fixture(t);
  const file = concept(root);
  const before = valid(root).sourceHashes;
  assert.deepEqual(valid(root).sourceHashes, before);
  const baseline = recordBaseline(root);
  assert.deepEqual(baseline.documents, before);
  assert.equal(baseline.normalization, 'utf8-lf-text');
  assert.equal(baseline.semantic, 'not-verified');
  assert.equal(baseline.humanReview, 'not-verified');
  valid(root, { checkBaseline: true });
  write(root, 'src/source.ts', 'export const fixture = 2;\n');
  hasError(root, 'SOURCE_DRIFT', file, { checkBaseline: true });
  write(root, 'src/source.ts', 'export const fixture = 1;\n');
  writeFileSync(path.join(root, file), `${readFileSync(path.join(root, file), 'utf8')}\nDocument revision.\n`);
  hasError(root, 'DOCUMENT_DRIFT', file, { checkBaseline: true });
});

test('source baselines survive Windows CRLF and Linux LF conversion while revisions retain exact byte semantics', async (t) => {
  await t.test('portable document and text-source observation', (child) => {
    const root = fixture(child);
    const file = concept(root);
    const baseline = recordBaseline(root);
    writeFileSync(path.join(root, file), readFileSync(path.join(root, file), 'utf8').replace(/\n/g, '\r\n'));
    writeFileSync(path.join(root, 'src/source.ts'), readFileSync(path.join(root, 'src/source.ts'), 'utf8').replace(/\n/g, '\r\n'));
    const validation = valid(root, { checkBaseline: true });
    assert.deepEqual(validation.sourceHashes, baseline.documents);
    writeFileSync(path.join(root, file), readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n'));
    writeFileSync(path.join(root, 'src/source.ts'), readFileSync(path.join(root, 'src/source.ts'), 'utf8').replace(/\r\n/g, '\n'));
    assert.deepEqual(valid(root, { checkBaseline: true }).sourceHashes, baseline.documents);
    const legacyBaseline = { ...baseline };
    delete legacyBaseline.normalization;
    write(root, '.knowledge/source-baseline.json', `${JSON.stringify(legacyBaseline)}\n`);
    hasError(root, 'BASELINE', '.knowledge/source-baseline.json', { checkBaseline: true });
  });
  await t.test('explicit source revision hashes raw bytes', (child) => {
    const root = fixture(child);
    const revision = createHash('sha256').update(readFileSync(path.join(root, 'src/source.ts'))).digest('hex');
    const file = concept(root, metadata('CONCEPT-A', { sources: [{ resource: '../../src/source.ts', revision: `sha256:${revision}` }] }));
    recordBaseline(root);
    writeFileSync(path.join(root, 'src/source.ts'), readFileSync(path.join(root, 'src/source.ts'), 'utf8').replace(/\n/g, '\r\n'));
    const validation = hasError(root, 'SOURCE_REVISION', file, { checkBaseline: true });
    assert.equal(validation.issues.some((issue) => issue.code === 'SOURCE_DRIFT'), false);
  });
});

test('malformed provenance produces profile diagnostics instead of crashing validation', async (t) => {
  for (const field of ['generated', 'verified']) {
    await t.test(field, (child) => {
      const root = fixture(child);
      const file = concept(root, metadata('CONCEPT-A', { [field]: { by: 'fixture:actor', at: 2026 } }));
      hasError(root, 'PROFILE', file);
    });
  }
});

test('staleness and source modification timestamps require real calendar dates', async (t) => {
  for (const [name, overrides] of [
    ['stale_after', { stale_after: '2026-02-30T12:00:00Z' }],
    ['source last_modified', { sources: [{ resource: '../../src/source.ts', last_modified: '2026-02-30T12:00:00Z' }] }],
  ]) {
    await t.test(name, (child) => {
      const root = fixture(child);
      const file = concept(root, metadata('CONCEPT-A', overrides));
      hasError(root, 'TIMESTAMP', file);
    });
  }
});

test('query and impact reject malformed profiles with controlled filename-bearing errors', async (t) => {
  function controlledError(file) {
    return (error) => {
      assert.equal(error instanceof TypeError, false, error.message);
      assert.ok(error.message.includes(file), error.message);
      return true;
    };
  }
  for (const [name, overrides, operation] of [
    ['query tags', { tags: {} }, (root) => queryKnowledge(root, 'fixture')],
    ['impact sources object', { sources: {} }, (root) => impactKnowledge(root, ['src/source.ts'])],
    ['impact null source', { sources: [null] }, (root) => impactKnowledge(root, ['src/source.ts'])],
    ['impact relation string', { relates_to: 'CONCEPT-B' }, (root) => impactKnowledge(root, ['src/other.ts'])],
  ]) {
    await t.test(name, (child) => {
      const root = fixture(child);
      const file = concept(root, metadata('CONCEPT-A', overrides));
      const before = snapshot(root);
      assert.throws(() => operation(root), controlledError(file));
      assert.deepEqual(snapshot(root), before);
    });
  }
});

test('historical superseded successors still require a reciprocal superseded predecessor', async (t) => {
  const decided = { decision_date: '2026-10-02', decided_by: 'human:fixture-reviewer', approval_reference: 'fixture-only' };
  await t.test('valid three-ADR chain', (child) => {
    const root = fixture(child);
    decision(root, 'ADR-0001', { ...decided, decision_status: 'superseded', superseded_by: 'ADR-0002' });
    decision(root, 'ADR-0002', { ...decided, decision_status: 'superseded', supersedes: 'ADR-0001', superseded_by: 'ADR-0003' });
    decision(root, 'ADR-0003', { ...decided, decision_status: 'accepted', supersedes: 'ADR-0002' });
    valid(root);
  });
  await t.test('historical predecessor incorrectly remains accepted', (child) => {
    const root = fixture(child);
    decision(root, 'ADR-0001', { ...decided, decision_status: 'accepted' });
    const file = decision(root, 'ADR-0002', { ...decided, decision_status: 'superseded', supersedes: 'ADR-0001', superseded_by: 'ADR-0003' });
    decision(root, 'ADR-0003', { ...decided, decision_status: 'accepted', supersedes: 'ADR-0002' });
    hasError(root, 'ADR_RECIPROCAL', file);
  });
});

test('baseline refuses invalid bundles and declared source hashes must match actual source bytes', (t) => {
  const root = fixture(t);
  const file = concept(root, metadata('CONCEPT-A', { sources: [{ resource: '../../src/source.ts', revision: 'sha256:' + '0'.repeat(64) }] }));
  hasError(root, 'SOURCE_REVISION', file);
  const before = snapshot(root);
  assert.throws(() => recordBaseline(root), /Cannot record baseline/);
  assert.deepEqual(snapshot(root), before);
});

test('query and transitive impact are deterministic read-only operations', (t) => {
  const root = fixture(t);
  concept(root, metadata('CONCEPT-A', { title: 'World Generator', tags: ['world'] }));
  write(root, 'src/other.ts', 'export const other = 1;\n');
  concept(root, metadata('CONCEPT-B', { sources: [{ resource: '../../src/other.ts' }], relates_to: ['CONCEPT-A'] }));
  concept(root, metadata('CONCEPT-C', { sources: [{ resource: '../../src/other.ts' }], relates_to: ['CONCEPT-B'] }));
  recordBaseline(root);
  const before = snapshot(root);
  const queried = queryKnowledge(root, 'world');
  assert.equal(queried[0].id, 'CONCEPT-A');
  assert.deepEqual(queryKnowledge(root, 'world'), queried);
  assert.deepEqual(queryKnowledge(root, 'nothing-matches'), []);
  assert.throws(() => queryKnowledge(root, ' '), /search text/);
  assert.throws(() => queryKnowledge(root, 'world', 0), /limit/);
  const impact = impactKnowledge(root, ['src/source.ts']);
  assert.deepEqual(impact.affected.map((item) => [item.id, item.reason]), [['CONCEPT-A', 'source'], ['CONCEPT-B', 'relation'], ['CONCEPT-C', 'relation']]);
  assert.equal(impact.semantic, 'not-verified');
  assert.deepEqual(impactKnowledge(root, ['src/source.ts']), impact);
  assert.throws(() => impactKnowledge(root, ['../outside.ts']), /escapes/);
  assert.deepEqual(snapshot(root), before);
});

test('ADR creation preserves existing content, allocates increasing IDs, and creates valid pending proposals', (t) => {
  const root = fixture(t);
  write(root, 'knowledge/architecture/decisions/ADR-0001.md', 'Existing custom decision content.\n');
  write(root, 'knowledge/architecture/decisions/ADR-0007.md', 'More existing custom content.\n');
  const existing = readFileSync(path.join(root, 'knowledge/architecture/decisions/ADR-0007.md'), 'utf8');
  const first = createADR(root, 'Uma proposta: "citada"', '2026-10-02');
  const second = createADR(root, 'Outra proposta', '2026-10-02');
  assert.equal(first.id, 'ADR-0008');
  assert.equal(second.id, 'ADR-0009');
  assert.equal(first.decision_status, 'proposed');
  assert.equal(readFileSync(path.join(root, 'knowledge/architecture/decisions/ADR-0007.md'), 'utf8'), existing);
  const data = parseFrontmatter(readFileSync(path.join(root, first.path), 'utf8')).metadata;
  assert.equal(data.title, 'Uma proposta: "citada"');
  assert.equal(data.decision_date, null);
  assert.equal(data.decided_by ?? null, null);
  assert.equal(data.approval_reference ?? null, null);
  assert.equal(data.verified, undefined);
  assert.throws(() => createADR(root, 'Invalid\nTitle', '2026-10-02'), /single-line/);
  assert.throws(() => createADR(root, 'Invalid date', '2026-02-30'), /creation date/);
});

test('a newly created ADR validates once explicitly indexed and has a resolvable native source', (t) => {
  const root = fixture(t);
  const created = createADR(root, 'ADR fixture', '2026-10-02');
  writeFileSync(path.join(root, 'knowledge/index.md'), `${readFileSync(path.join(root, 'knowledge/index.md'), 'utf8')}\n[${created.id}](architecture/decisions/${created.id}.md)\n`);
  const validation = valid(root);
  assert.equal(validation.adrs, 1);
  assert.equal(validation.concepts, 1);
});

function childADR(root, title) {
  return new Promise((resolve, reject) => {
    const code = `import { createADR } from ${JSON.stringify(coreURL)}; process.stdout.write(JSON.stringify(createADR(${JSON.stringify(root)}, ${JSON.stringify(title)}, '2026-10-02')));`;
    const child = spawn(process.execPath, ['--input-type=module', '-e', code], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) { reject(new Error(`ADR child failed (${code}): ${stderr}`)); return; }
      try { resolve(JSON.parse(stdout)); } catch (error) { reject(error); }
    });
  });
}

test('parallel ADR writers allocate unique files without overwriting existing proposals', async (t) => {
  const root = fixture(t);
  const initial = createADR(root, 'Existing proposal', '2026-10-02');
  const preserved = readFileSync(path.join(root, initial.path), 'utf8');
  const created = await Promise.all(['First writer', 'Second writer', 'Third writer'].map((title) => childADR(root, title)));
  assert.equal(new Set(created.map((item) => item.id)).size, 3);
  assert.deepEqual(created.map((item) => item.id).sort(), ['ADR-0002', 'ADR-0003', 'ADR-0004']);
  assert.equal(readFileSync(path.join(root, initial.path), 'utf8'), preserved);
  assert.deepEqual(created.map((item) => parseFrontmatter(readFileSync(path.join(root, item.path), 'utf8')).metadata.title).sort(), ['First writer', 'Second writer', 'Third writer']);
});
