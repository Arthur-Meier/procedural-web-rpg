# Regras de trabalho

- Preserve alterações preexistentes. Verifique `git status --short` antes de editar e revise diferenças e arquivos novos pertinentes ao final.
- Nunca crie ou reescreva commits, inclusive por aliases, ferramentas ou operações indiretas. Não inclua commits em tarefas ou planos.
- Não faça stage, push, troca de branch ou operações de histórico sem solicitação explícita. Ações destrutivas exigem autorização prévia.
- Nunca execute `xmnxj` nem habilite `-Dnxj.makeAll=true` sem solicitação explícita.
- Trabalhe apenas no escopo solicitado. Comece pelos módulos relacionados; use buscas seletivas com `rg`, agrupando consultas. Não use `xrwa`, `xflsr` ou varreduras completas por rotina.
- Execute diretamente. Comunique progresso por porcentagens em marcos relevantes. Explique falhas e limites; só informe 100% com escopo e validações obrigatórias concluídos.
- Ao finalizar, use Resultado, Arquivos, Testes e Observações; diferencie aprovação, falha e não execução.

## Banco de dados

O acesso a qualquer banco é exclusivamente para consultas comprovadamente de leitura, inclusive em desenvolvimento, testes e homologação. Não execute nem provoque escrita em dados, estruturas, objetos, permissões ou configurações, por SQL, aplicações, APIs, ORMs, builds, testes, migrations ou outros mecanismos. Não use sequências, bloqueios explícitos ou operações cujo comportamento de somente leitura não esteja comprovado.

Quando houver escopo de alteração de banco, prepare os scripts somente em `C:\Systextil\workspace\systextil-sql`, seguindo os padrões existentes. Não execute os scripts, não acrescente COMMIT a DDLs e não crie triggers/functions de regras de negócio. A aplicação cabe ao responsável. Não solicite autorização pontual para contornar esta regra.

Verifique o comportamento completo antes de executar aplicações/builds/testes que acessem banco. Se exigirem gravações, informe o bloqueio e a validação não executada.

## Conhecimento e decisões

- Comece por [knowledge/index.md](knowledge/index.md); leia apenas os conceitos, ADRs e fontes relacionados à tarefa. As regras específicas do jogo continuam em `docs/`.
- Siga [docs/KNOWLEDGE_STANDARD.md](docs/KNOWLEDGE_STANDARD.md). O manifest canônico é `.knowledge/standard.json` e o perfil é `.knowledge/okf-profile.schema.json`.
- Antes de editar, identifique o impacto com `npm.cmd run knowledge:impact -- <caminhos relativos ao repositório>` e inspecione fontes. Graphify auxilia a localizar símbolos/dependências.
- Atualize conceitos, datas, índices e `knowledge/log.md` junto da mudança. Decisões materiais exigem proposta ADR com contexto, alternativas, consequências e fontes reais.
- Novos ADRs começam `proposed`. Aceitação/rejeição exige decisão humana específica, `decided_by`, `decision_date` e `approval_reference` identificando a revisão examinada. Preserve decisões históricas e relações recíprocas de substituição.
- Não fabrique `verified`, autoria, aprovação, testes ou justificativas históricas. `status`, `implementation_status` e `decision_status` têm significados separados.
- Após conferir texto e fontes, `knowledge:baseline` registra somente hashes observados; jamais estabelece revisão semântica ou aprovação. Drift deve ser resolvido pela inspeção do conteúdo antes de renovar hashes.
- Execute `npm.cmd run check` como validação final deste projeto Node/TypeScript. Ele executa todos os testes de conhecimento, validação estrutural com drift e build. Não salte testes ou relaxe verificações.
- Mudanças de código/configuração/conhecimento exigem `graphify:refresh` e `graphify:status -- --check` quando o provider local estiver instalado. Se estiver ausente, registre explicitamente a não execução; consulte fontes diretamente.
- Use exclusivamente Graphify local `--code-only --no-cluster --max-workers 2`, versão fixada, instalação isolada em `.runtime/graphify-venv`. Não instale hooks, não execute análise por LLM nem envie o repositório para serviços de extração.
- O grafo é derivado e reconstruível; ausência de aresta não prova ausência de impacto. Preserve o último snapshot íntegro se uma atualização falhar. `.runtime/` não faz parte do bundle nem deve ser versionado.
- Validação estrutural, hashes, build e Graphify não estabelecem aprovação humana, revisão semântica, teste de gameplay ou compatibilidade de saves.
