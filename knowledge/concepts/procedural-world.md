---
type: Domain Concept
id: procedural-world
title: Mundo procedural por chunks
status: draft
implementation_status: observed
created: 2026-10-02
updated: 2026-10-02
sources:
  - resource: ../../src/game/world.ts
  - resource: ../../src/game/world/generation.ts
  - resource: ../../src/game/world/queries.ts
  - resource: ../../src/game/utils.ts
  - resource: ../../src/game/constants.ts
  - resource: ../../src/game/types/world.ts
relates_to: [architecture, save-system, rendering-assets, ADR-0003]
tags: [world, procedural-generation, seed, chunks, persistence]
---

# Mundo procedural por chunks

## Comportamento observado

[World](../../src/game/world.ts) mantém a seed, um cache de chunks, o conjunto de chunks ativos, os chunks descobertos e um mapa de mutações dos objetos. `getChunk()` gera um chunk na primeira consulta e o reutiliza no cache. `updateActiveChunks()` calcula a área ativa a partir dos limites da câmera e de `ACTIVE_CHUNK_BUFFER`; sair da área ativa não remove o chunk do cache.

Em [generateChunk()](../../src/game/world/generation.ts), a seed do chunk combina a seed do mundo com suas coordenadas inteiras. A geração usa um PRNG seeded e regras para árvores, pedras e caixas; cada tentativa de posição respeita afastamentos e um limite de tentativas. IDs como `tree:cx:cy:index` permitem relacionar um objeto gerado à sua mutação persistida. A combinação de seed, coordenadas, algoritmo e regras determina o resultado; apenas manter a seed não garante o mesmo mundo após mudar esses elementos.

## Estado regenerável e estado persistido

| Estado | Tratamento |
| --- | --- |
| Objetos originais de um chunk | Regenerados sob demanda. |
| Cache de chunks e conjunto ativo | Estado de execução; não entram em `World.serialize()`. |
| Seed | Incluída em `WorldSnapshot`. |
| Chunks descobertos | Serializados como lista de chaves. |
| Dano e destruição de objetos | Serializados como pares ID/mutação. |

`updateObjectState()` registra HP e `destroyObject()` registra destruição e remove o objeto do chunk já carregado. Ao gerar um chunk, o gerador consulta as mutações e omite objetos destruídos ou usa o HP persistido. `World.fromSnapshot()` inicia um mundo com seed, descoberta e mutações; o cache é reconstruído depois.

## Impacto e compatibilidade

Alterações no PRNG, IDs, dimensões dos chunks ou ordem e regras da geração podem afetar saves existentes. Antes de alterá-las, examine o [contrato de saves](save-system.md) e [ADR-0003](../architecture/decisions/ADR-0003.md), e registre a estratégia de compatibilidade ou a limitação concreta. Atualizar uma versão numérica sem tratamento de carregamento não resolve a compatibilidade.

Alterações em streaming, cache ou consultas exigem evidência de desempenho e preservação das mutações. O grafo ajuda a localizar dependências estáticas; não comprova determinismo, ausência de colisões ou uso de memória aceitável.

## Evidência e limites

O desenho e os contratos acima foram inspecionados nas fontes. Não houve, para este documento, execução de um teste de reprodução de seeds nem verificação de saves de usuários. Os limites de mundo e desempenho existentes estão em [PERFORMANCE_RULES.md](../../docs/PERFORMANCE_RULES.md).
