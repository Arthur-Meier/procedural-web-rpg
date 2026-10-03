import { createHash, randomUUID } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync, renameSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { isAlias, parseDocument, visit } from 'yaml';

export const PROJECT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const slash = (value) => value.split(path.sep).join('/');
export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const normalizeText = (text) => text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
const sourceDigest = (bytes, file) => sha256(/\.(md|ts|js|mjs|cjs|json|ya?ml|txt|html|css)$/.test(file) ? normalizeText(bytes.toString('utf8')) : bytes);
const schemaRoot = path.resolve(PROJECT_ROOT, '.knowledge');
const ajv = new Ajv({ allErrors: true, strict: true, allowUnionTypes: true });
const validateProfile = ajv.compile(JSON.parse(readFileSync(path.join(schemaRoot, 'okf-profile.schema.json'), 'utf8')));
const validateConfig = ajv.compile(JSON.parse(readFileSync(path.join(schemaRoot, 'standard.schema.json'), 'utf8')));
const external = /^(https?:|mailto:)/i;

/** Reject escapes and symbolic links before reading repository material. */
export function projectPath(root, relative, { mustExist = true } = {}) {
  if (typeof relative !== 'string' || !relative || relative.includes('\0') || path.isAbsolute(relative) || /^[A-Za-z]:/.test(relative)) {
    throw new Error(`Invalid project path: ${relative}`);
  }
  const resolved = path.resolve(root, relative);
  const inside = path.relative(path.resolve(root), resolved);
  if (inside === '..' || inside.startsWith(`..${path.sep}`) || path.isAbsolute(inside)) throw new Error(`Path escapes project: ${relative}`);
  let current = path.resolve(root);
  if (lstatSync(current).isSymbolicLink()) throw new Error(`Symbolic link not allowed: ${root}`);
  for (const part of inside.split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (!existsSync(current)) {
      if (mustExist) throw new Error(`Missing path: ${relative}`);
      continue;
    }
    if (lstatSync(current).isSymbolicLink()) throw new Error(`Symbolic link not allowed: ${relative}`);
  }
  return resolved;
}

export function parseFrontmatter(text) {
  if (Buffer.byteLength(text) > 1024 * 1024) throw new Error('Knowledge document exceeds 1 MiB');
  const normalized = normalizeText(text);
  if (!normalized.startsWith('---\n')) return { metadata: null, body: normalized };
  const end = normalized.indexOf('\n---\n', 4);
  if (end < 0) throw new Error('Unterminated YAML frontmatter');
  const document = parseDocument(normalized.slice(4, end), { schema: 'core', uniqueKeys: true, merge: false });
  if (document.errors.length || document.warnings.length) throw new Error([...document.errors, ...document.warnings].map((item) => item.message).join('; '));
  visit(document, (_key, node) => {
    if (isAlias(node) || node?.anchor || node?.tag) throw new Error('YAML aliases, anchors and explicit tags are not allowed');
  });
  const metadata = document.toJS({ maxAliasCount: 0 });
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error('Frontmatter must be a mapping');
  return { metadata, body: normalized.slice(end + 5) };
}

export function withoutCode(body) {
  return body.replace(/^\s*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*\1\s*$/gm, '').replace(/`[^`\n]*`/g, '');
}

export function markdownLinks(body) {
  const clean = withoutCode(body);
  const links = [];
  const definitions = new Map();
  for (const match of clean.matchAll(/^\s*\[([^\]^]+)\]:\s*(<[^>]+>|\S+)/gm)) definitions.set(match[1].trim().toLowerCase(), match[2].replace(/^<|>$/g, ''));
  for (const match of clean.matchAll(/!?\[[^\]\n]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^\n]*?["'])?\s*\)/g)) links.push(match[1].replace(/^<|>$/g, ''));
  for (const match of clean.matchAll(/!?\[([^\]\n]+)\]\[([^\]\n]*)\]/g)) {
    const label = (match[2] || match[1]).trim().toLowerCase();
    links.push(definitions.get(label) ?? `missing-reference:${label}`);
  }
  for (const match of clean.matchAll(/(?<!!)\[([^\]\n]+)\](?![(:\[])/g)) {
    const label = match[1].trim().toLowerCase();
    if (definitions.has(label)) links.push(definitions.get(label));
  }
  return [...new Set(links)];
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

function headingAnchors(body) {
  const anchors = new Set();
  const counts = new Map();
  for (const match of withoutCode(body).matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)) {
    const key = match[1].toLowerCase().replace(/[^\p{L}\p{N}_\-\s]/gu, '').trim().replace(/\s/g, '-');
    const count = counts.get(key) ?? 0;
    counts.set(key, count + 1);
    anchors.add(count ? `${key}-${count}` : key);
  }
  return anchors;
}

export function resolveResource(root, documentPath, resource) {
  if (external.test(resource)) return null;
  if (/^[A-Za-z][\w+.-]*:/.test(resource) || resource.includes('\\')) throw new Error(`Unsupported resource: ${resource}`);
  const filePart = decodeURIComponent(resource.split(/[?#]/)[0]);
  const relative = filePart.startsWith('/') ? path.join('knowledge', filePart.slice(1)) : path.join(path.dirname(documentPath), filePart || path.basename(documentPath));
  const absolute = projectPath(root, relative);
  if (!lstatSync(absolute).isFile()) throw new Error(`Resource is not a file: ${resource}`);
  return slash(path.relative(root, absolute));
}

export function loadBundle(root = PROJECT_ROOT) {
  const documents = [];
  const issues = [];
  const issue = (code, file, message) => issues.push({ severity: 'error', code, file, message });
  let config;
  try {
    config = JSON.parse(readFileSync(projectPath(root, '.knowledge/standard.json'), 'utf8'));
    if (!validateConfig(config)) throw new Error(ajv.errorsText(validateConfig.errors));
  } catch (error) { issue('CONFIG', '.knowledge/standard.json', error.message); }
  function walk(directory) {
    for (const entry of readdirSync(projectPath(root, directory), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const relative = slash(path.join(directory, entry.name));
      if (entry.isSymbolicLink()) { issue('SYMLINK', relative, 'Symbolic links are not knowledge sources'); continue; }
      if (entry.isDirectory()) { walk(relative); continue; }
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      try {
        const text = readFileSync(projectPath(root, relative), 'utf8');
        const parsed = parseFrontmatter(text);
        const reserved = ['index.md', 'log.md'].includes(entry.name);
        const profileValid = reserved || validateProfile(parsed.metadata);
        if (!profileValid) issue('PROFILE', relative, ajv.errorsText(validateProfile.errors));
        documents.push({ path: relative, text, ...parsed, reserved, profileValid });
      } catch (error) { issue('FRONTMATTER', relative, error.message); }
    }
  }
  try { walk('knowledge'); } catch (error) { issue('BUNDLE', 'knowledge', error.message); }
  return { config, documents, issues };
}

export function validateKnowledge(root = PROJECT_ROOT, { checkBaseline = true } = {}) {
  const bundle = loadBundle(root);
  const { config, documents } = bundle;
  const issues = [...bundle.issues];
  const issue = (severity, code, file, message) => issues.push({ severity, code, file, message });
  const ids = new Map();
  const indexed = new Set();
  const concepts = documents.filter((item) => !item.reserved);
  const sourceHashes = {};
  for (const document of documents) {
    const { metadata, path: file, body } = document;
    if (!document.profileValid) continue;
    if (document.reserved) {
      if (file === 'knowledge/index.md') {
        if (!metadata || metadata.okf_version !== '0.2' || Object.keys(metadata).some((key) => key !== 'okf_version')) issue('error', 'OKF_VERSION', file, 'Root index must declare only okf_version: "0.2"');
      } else if (metadata) issue('error', 'RESERVED_FRONTMATTER', file, 'Index and log files have no concept frontmatter');
      if (path.basename(file) === 'log.md') {
        for (const match of body.matchAll(/^##\s+(.+)$/gm)) if (!validDate(match[1].trim())) issue('error', 'LOG_DATE', file, `Invalid log date: ${match[1]}`);
      }
    } else {
      if (metadata?.id) {
        if (ids.has(metadata.id)) issue('error', 'DUPLICATE_ID', file, `Duplicate ID ${metadata.id}: ${ids.get(metadata.id).path}`);
        else ids.set(metadata.id, document);
      }
      for (const field of ['created', 'updated', 'decision_date']) {
        if (metadata?.[field] != null && !validDate(metadata[field])) issue('error', 'DATE', file, `Invalid ${field}: ${metadata[field]}`);
      }
      if (metadata?.created > metadata?.updated) issue('error', 'DATE_ORDER', file, 'updated precedes created');
      const events = [...(metadata?.generated ? [metadata.generated] : []), ...(metadata?.verified ? (Array.isArray(metadata.verified) ? metadata.verified : [metadata.verified]) : [])];
      const timestamps = [...events.map((event) => event.at), metadata?.stale_after, ...metadata.sources.map((source) => source.last_modified)].filter((value) => value != null);
      for (const timestamp of timestamps) if (Number.isNaN(Date.parse(timestamp)) || !validDate(timestamp.slice(0, 10))) issue('error', 'TIMESTAMP', file, `Invalid provenance timestamp: ${timestamp}`);
      if (metadata?.stale_after && Date.now() >= Date.parse(metadata.stale_after)) issue('warning', 'STALE_CONCEPT', file, 'Declared stale_after has elapsed; review content');
      if (metadata?.type === 'Architecture Decision') {
        if (file !== `knowledge/architecture/decisions/${metadata.id}.md`) issue('error', 'ADR_LOCATION', file, 'ADR filename and directory must match its ID');
        for (const section of ['Contexto', '(Decisão|Proposta)', 'Alternativas', 'Consequências', 'Evidência(s)?']) {
          if (!new RegExp(`^#{1,3} ${section}`, 'mi').test(body)) issue('error', 'ADR_SECTION', file, `Missing ADR section: ${section}`);
        }
        if (metadata.decision_status === 'proposed' && (metadata.decision_date != null || metadata.decided_by != null || metadata.approval_reference != null)) issue('error', 'ADR_APPROVAL', file, 'Proposed ADR must not carry acceptance metadata');
      }
      const sources = {};
      for (const source of Array.isArray(metadata?.sources) ? metadata.sources : []) {
        if (typeof source?.resource !== 'string') continue;
        try {
          const resource = resolveResource(root, file, source.resource);
          if (!resource) { issue('warning', 'EXTERNAL_SOURCE', file, `External source not fetched: ${source.resource}`); continue; }
          const bytes = readFileSync(projectPath(root, resource));
          sources[resource] = sourceDigest(bytes, resource);
          if (source.revision && source.revision.replace(/^sha256:/, '').toLowerCase() !== sha256(bytes)) issue('error', 'SOURCE_REVISION', file, `Source revision differs: ${resource}`);
        } catch (error) { issue('error', 'SOURCE', file, error.message); }
      }
      sourceHashes[file] = { documentHash: sha256(normalizeText(document.text)), sources };
    }
    for (const link of markdownLinks(body)) {
      if (external.test(link)) continue;
      try {
        const target = resolveResource(root, file, link);
        const anchor = link.includes('#') ? decodeURIComponent(link.slice(link.indexOf('#') + 1)) : '';
        if (anchor && target.endsWith('.md')) {
          const targetBody = parseFrontmatter(readFileSync(projectPath(root, target), 'utf8')).body;
          if (!headingAnchors(targetBody).has(anchor)) throw new Error(`Missing heading anchor: ${link}`);
        }
        if (path.basename(file) === 'index.md') indexed.add(target);
      } catch (error) { issue('error', 'LINK', file, error.message); }
    }
  }
  if (!documents.some((item) => item.path === 'knowledge/index.md')) issue('error', 'INDEX', 'knowledge/index.md', 'Root knowledge index is required');
  if (!documents.some((item) => item.path === 'knowledge/log.md')) issue('error', 'LOG', 'knowledge/log.md', 'Knowledge change log is required');
  for (const document of concepts) {
    if (!document.profileValid) continue;
    if (!indexed.has(document.path)) issue('error', 'UNINDEXED', document.path, 'Concept must be linked from a knowledge index');
    const metadata = document.metadata ?? {};
    for (const target of Array.isArray(metadata.relates_to) ? metadata.relates_to : []) {
      if (!ids.has(target)) issue('error', 'RELATION', document.path, `Unknown related ID: ${target}`);
      if (target === metadata.id) issue('error', 'SELF_RELATION', document.path, 'Concept cannot relate to itself');
    }
    if (metadata.type !== 'Architecture Decision') continue;
    if (metadata.supersedes) {
      const previous = ids.get(metadata.supersedes)?.metadata;
      if (!previous || previous.type !== 'Architecture Decision' || metadata.supersedes === metadata.id) issue('error', 'ADR_PREDECESSOR', document.path, 'supersedes must name another ADR');
      else if (['accepted', 'superseded'].includes(metadata.decision_status) && (previous.decision_status !== 'superseded' || previous.superseded_by !== metadata.id)) issue('error', 'ADR_RECIPROCAL', document.path, 'Decided successor requires reciprocal superseded predecessor');
    }
    if (metadata.decision_status === 'superseded') {
      const successor = ids.get(metadata.superseded_by)?.metadata;
      if (!successor || successor.supersedes !== metadata.id || !['accepted', 'superseded'].includes(successor.decision_status)) issue('error', 'ADR_RECIPROCAL', document.path, 'Superseded ADR requires a reciprocal accepted successor');
    }
    const seen = new Set([metadata.id]);
    let previousId = metadata.supersedes;
    while (previousId && ids.has(previousId)) {
      if (seen.has(previousId)) { issue('error', 'ADR_CYCLE', document.path, 'ADR supersession cycle'); break; }
      seen.add(previousId);
      previousId = ids.get(previousId).metadata?.supersedes;
    }
  }
  if (checkBaseline && config) {
    try {
      const baseline = JSON.parse(readFileSync(projectPath(root, config.validation.sourceBaseline), 'utf8'));
      if (baseline.schemaVersion !== 1 || baseline.algorithm !== 'sha256' || baseline.normalization !== 'utf8-lf-text' || baseline.semantic !== 'not-verified' || baseline.humanReview !== 'not-verified' || !baseline.documents || typeof baseline.documents !== 'object') throw new Error('Invalid baseline contract');
      for (const [file, entry] of Object.entries(sourceHashes)) {
        const stored = baseline.documents[file];
        if (!stored) { issue('error', 'BASELINE_MISSING', file, 'No source baseline for this concept'); continue; }
        if (stored.documentHash !== entry.documentHash) issue('error', 'DOCUMENT_DRIFT', file, 'Document changed since source observation; inspect and update the baseline');
        for (const [source, hash] of Object.entries(entry.sources)) if (stored.sources?.[source] !== hash) issue('error', 'SOURCE_DRIFT', file, `Source changed since observation: ${source}`);
      }
    } catch (error) { issue('error', 'BASELINE', '.knowledge/source-baseline.json', error.message); }
  }
  return {
    valid: !issues.some((item) => item.severity === 'error'),
    errors: issues.filter((item) => item.severity === 'error').length,
    warnings: issues.filter((item) => item.severity === 'warning').length,
    concepts: concepts.length,
    adrs: concepts.filter((item) => item.metadata?.type === 'Architecture Decision').length,
    semantic: 'not-verified',
    humanReview: 'not-verified',
    issues,
    documents,
    sourceHashes
  };
}

export function atomicJson(root, relative, value) {
  const target = projectPath(root, relative, { mustExist: false });
  mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.${randomUUID()}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
  renameSync(temporary, target);
}

/** Hash observation is deliberately independent of semantic or human approval. */
export function recordBaseline(root = PROJECT_ROOT) {
  const result = validateKnowledge(root, { checkBaseline: false });
  if (!result.valid) throw new Error(`Cannot record baseline: ${result.issues.filter((item) => item.severity === 'error').map((item) => `${item.file}: ${item.message}`).join('; ')}`);
  const baseline = { schemaVersion: 1, algorithm: 'sha256', normalization: 'utf8-lf-text', observedAt: new Date().toISOString(), semantic: 'not-verified', humanReview: 'not-verified', documents: result.sourceHashes };
  atomicJson(root, '.knowledge/source-baseline.json', baseline);
  return baseline;
}

export function queryKnowledge(root, query, limit = 10) {
  if (!query?.trim()) throw new Error('Provide search text');
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error('limit must be between 1 and 50');
  const { documents, issues } = loadBundle(root);
  if (issues.length) throw new Error(issues.map((item) => `${item.file}: ${item.message}`).join('; '));
  const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return documents.filter((item) => !item.reserved).map((document) => {
    const header = `${document.metadata?.id} ${document.metadata?.title} ${(document.metadata?.tags ?? []).join(' ')}`.toLocaleLowerCase();
    const body = document.body.toLocaleLowerCase();
    const score = terms.reduce((sum, term) => sum + (header.includes(term) ? 5 : 0) + (body.includes(term) ? 1 : 0), 0);
    return { id: document.metadata?.id, title: document.metadata?.title, path: document.path, status: document.metadata?.status, decision_status: document.metadata?.decision_status, score };
  }).filter((item) => item.score).sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, limit);
}

export function impactKnowledge(root, paths) {
  if (!paths?.length) throw new Error('Provide one or more repository-relative paths');
  const normalized = paths.map((item) => slash(path.relative(root, projectPath(root, item, { mustExist: false }))));
  const { documents, issues } = loadBundle(root);
  if (issues.length) throw new Error(issues.map((item) => `${item.file}: ${item.message}`).join('; '));
  const matched = new Map();
  for (const document of documents.filter((item) => !item.reserved)) {
    const sources = (document.metadata?.sources ?? []).map((source) => resolveResource(root, document.path, source.resource)).filter(Boolean);
    const matching = sources.filter((source) => normalized.some((changed) => source === changed || source.startsWith(`${changed}/`)));
    if (matching.length || normalized.includes(document.path)) matched.set(document.metadata.id, { id: document.metadata.id, path: document.path, reason: 'source', sources: matching });
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const document of documents.filter((item) => !item.reserved)) {
      if (matched.has(document.metadata?.id)) continue;
      const relations = (document.metadata?.relates_to ?? []).filter((id) => matched.has(id));
      if (relations.length) { matched.set(document.metadata.id, { id: document.metadata.id, path: document.path, reason: 'relation', relations }); changed = true; }
    }
  }
  return { paths: normalized, affected: [...matched.values()].sort((a, b) => a.path.localeCompare(b.path)), semantic: 'not-verified' };
}

export function createADR(root, title, date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())) {
  if (!title?.trim() || /[\r\n\0]/.test(title)) throw new Error('Provide a single-line ADR title');
  if (!validDate(date)) throw new Error('Invalid ADR creation date');
  const directory = projectPath(root, 'knowledge/architecture/decisions');
  const ids = readdirSync(directory).map((name) => /^ADR-(\d{4})\.md$/.exec(name)).filter(Boolean).map((match) => Number(match[1]));
  let number = Math.max(0, ...ids) + 1;
  for (; number <= 9999; number++) {
    const id = `ADR-${String(number).padStart(4, '0')}`;
    const relative = `knowledge/architecture/decisions/${id}.md`;
    const body = `---\ntype: Architecture Decision\nid: ${id}\ntitle: ${JSON.stringify(title.trim())}\nstatus: draft\nimplementation_status: planned\ncreated: ${date}\nupdated: ${date}\ndecision_status: proposed\ndecision_date: null\nsupersedes: null\nsources:\n  - resource: ../../index.md\nrelates_to: []\ntags: [architecture]\n---\n# ${id}: ${title.trim()}\n\n## Contexto\n\nDescreva o problema e cite as fontes reais.\n\n## Decisão\n\nProposta pendente de decisão humana explícita.\n\n## Alternativas\n\nRegistre alternativas e os critérios de comparação.\n\n## Consequências\n\nRegistre benefícios, custos, riscos e medidas de verificação.\n\n## Evidências\n\nIdentifique implementação e validações efetivamente realizadas.\n\n## Aprovação\n\nPendente. Não preencha ator, data ou referência de aprovação sem uma decisão real.\n`;
    try {
      writeFileSync(projectPath(root, relative, { mustExist: false }), body, { flag: 'wx' });
      return { id, path: relative, decision_status: 'proposed', next: 'Complete the proposal, link it from decisions/index.md, append knowledge/log.md, then validate and record the source baseline.' };
    } catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
  throw new Error('ADR numbering exhausted');
}
