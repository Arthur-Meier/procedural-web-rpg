# Modelo de conceito OKF do projeto

Copie o bloco para um novo arquivo em `knowledge/concepts/`, substitua todos os exemplos e acrescente o documento ao índice. Este modelo é orientação e não é um conceito publicado.

```yaml
---
type: Domain Concept
id: nome-do-conceito
title: Título legível
status: draft
implementation_status: planned
created: 2026-10-02
updated: 2026-10-02
sources:
  - resource: ../../src/caminho/real.ts
    title: Fonte inspecionada
    # revision: sha256:DIGEST_REAL_DE_64_CARACTERES
relates_to: []
tags: [termo-de-busca]
---
```

`type` é obrigatório no OKF v0.2 nativo. Os demais campos obrigatórios neste exemplo são o perfil do projeto. `status` indica estabilidade documental (`draft`, `stable`, `deprecated`); `implementation_status` indica evidência (`planned`, `partial`, `observed`, `not-applicable`). Sources são objetos com `resource` relativo ao diretório do documento (`../../src/...` a partir de `knowledge/concepts/`) ou começando com `/` a partir da base `knowledge/`; use caminhos existentes, sem escapar do projeto. `relates_to` deve referenciar IDs existentes. Datas e hashes devem refletir fatos reais.

## Título do conceito

### Contexto e responsabilidade

Descreva a capacidade e o problema a que ela responde. Separe comportamento observado de proposta futura.

### Comportamento e contratos

Descreva entradas, saídas, responsabilidades e invariantes relevantes. Aponte as fontes com links relativos e escreva o suficiente para orientar uma alteração.

### Impacto de alterações

Explique quais conceitos, decisões e contratos precisam de revisão quando esta parte muda.

### Evidência e limites

Registre o que foi inspecionado ou executado e o que continua sem verificação. Não acrescente `verified` sem um evento real e não apresente build ou grafo como prova de comportamento completo.

Consulte [manutenção do conhecimento](../../knowledge/concepts/knowledge-maintenance.md) antes de publicar o documento.
