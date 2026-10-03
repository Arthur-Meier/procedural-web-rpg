# Modelo de ADR do projeto

Use o próximo ID livre em `knowledge/architecture/decisions/ADR-NNNN.md`. Substitua exemplos e mantenha ADRs históricos. Este modelo é orientação e não representa uma decisão.

```yaml
---
type: Architecture Decision
id: ADR-NNNN
title: Descrição da escolha arquitetural
status: draft
implementation_status: planned
created: 2026-10-02
updated: 2026-10-02
decision_status: proposed
decision_date: null
supersedes: null
sources:
  - resource: ../../../src/caminho/real.ts
relates_to: []
tags: [architecture]
---
```

`status` segue OKF (`draft`, `stable`, `deprecated`). `decision_status` segue o ciclo local (`proposed`, `accepted`, `rejected`, `superseded`). `implementation_status` é separado (`planned`, `partial`, `observed`, `not-applicable`). Código existente não comprova aprovação histórica.

Sources são objetos com `resource` relativo ao diretório do ADR: `../../../src/...` alcança as fontes do projeto. Não use caminhos inexistentes ou que escapem do repositório.

Uma aceitação ou rejeição real exige `decided_by: human:<identidade>`, `decision_date` e `approval_reference` identificando a aprovação específica e a revisão examinada no corpo/log. Ao aceitar um sucessor, `supersedes` referencia o ID anterior; o predecessor registra `superseded_by` e as relações ficam recíprocas. Um sucessor ainda proposto não substitui uma decisão aceita. Consulte [o ciclo completo](../../knowledge/concepts/knowledge-maintenance.md#ciclo-de-adr).

## ADR-NNNN — Título

### Contexto

Registre o problema concreto, restrições e evidências. Indique quando a justificativa histórica não está disponível.

### Proposta

Descreva a escolha e o comportamento resultante. Use "Decisão" após aprovação real, preservando a proposta e a identidade da revisão aprovada.

### Alternativas

Explique opções plausíveis e seus trade-offs. Não atribua comparações históricas sem evidência.

### Consequências e riscos

Registre custos, limitações, contratos afetados e consequências práticas.

### Evidência e aprovação

Referencie fontes e verificações realmente executadas. Diferencie implementação, validação estrutural, teste de comportamento e aprovação humana. Uma proposta não precisa fabricar resultados para ser útil.

### Relações

Inclua links para conceitos e ADRs relacionados, com `relates_to` coerente no frontmatter.
