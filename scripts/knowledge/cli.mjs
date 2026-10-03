import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT, createADR, impactKnowledge, projectPath, queryKnowledge, recordBaseline, validateKnowledge } from './core.mjs';

const args = process.argv.slice(2);
const command = args.shift();
const jsonIndex = args.indexOf('--json');
const json = jsonIndex >= 0;
if (json) args.splice(jsonIndex, 1);
const limitIndex = args.indexOf('--limit');
let limit = 10;
if (limitIndex >= 0) {
  limit = Number(args[limitIndex + 1]);
  args.splice(limitIndex, 2);
}

try {
  if (args.some((value) => value.startsWith('--'))) throw new Error('Unknown option');
  let result;
  switch (command) {
    case 'validate': {
      if (args.length) throw new Error('validate takes no positional arguments');
      const { documents, sourceHashes, ...report } = validateKnowledge(PROJECT_ROOT);
      result = report;
      const reportPath = projectPath(PROJECT_ROOT, '.runtime/knowledge/validation.json', { mustExist: false });
      mkdirSync(path.dirname(reportPath), { recursive: true });
      writeFileSync(reportPath, `${JSON.stringify({ ...report, checkedAt: new Date().toISOString() }, null, 2)}\n`);
      process.exitCode = report.valid ? 0 : 1;
      break;
    }
    case 'baseline':
      if (args.length) throw new Error('baseline takes no positional arguments');
      result = recordBaseline(PROJECT_ROOT);
      if (!json) result = { recorded: '.knowledge/source-baseline.json', documents: Object.keys(result.documents).length, semantic: result.semantic, humanReview: result.humanReview };
      break;
    case 'query': result = queryKnowledge(PROJECT_ROOT, args.join(' '), limit); break;
    case 'impact': result = impactKnowledge(PROJECT_ROOT, args); break;
    case 'adr': result = createADR(PROJECT_ROOT, args.join(' ')); break;
    default: throw new Error('Usage: knowledge <validate|baseline|query TEXT|impact PATH...|adr TITLE> [--json] [--limit 1..50]');
  }
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(JSON.stringify({ error: error.message }));
  process.exitCode = 1;
}
