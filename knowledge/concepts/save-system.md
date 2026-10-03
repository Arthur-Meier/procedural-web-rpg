---
type: Software Component
id: save-system
title: Saves locais e reconstrução de sessões
status: draft
implementation_status: observed
created: 2026-10-02
updated: 2026-10-02
sources:
  - resource: ../../src/game/save.ts
  - resource: ../../src/game/types/session.ts
  - resource: ../../src/game/types/world.ts
  - resource: ../../src/game/systems/session-system.ts
  - resource: ../../src/game/systems/session/snapshot-store.ts
  - resource: ../../src/game/systems/session/lifecycle.ts
  - resource: ../../src/game/day-night.ts
  - resource: ../../src/game/constants.ts
relates_to: [architecture, procedural-world, ADR-0003]
tags: [save, localstorage, snapshots, session, compatibility]
---

# Saves locais e reconstrução de sessões

## Armazenamento e snapshot

[save.ts](../../src/game/save.ts) lê e escreve JSON em `window.localStorage`, usando o prefixo `rpg-mundo-aberto-slot-`. A configuração expõe três slots. Esse armazenamento pertence ao navegador e à origem usada; o projeto não implementa sincronização remota, banco de dados ou backup automático de saves.

[SessionSnapshotStore.buildSnapshot()](../../src/game/systems/session/snapshot-store.ts) emite **versão 4**. O formato [GameSnapshot](../../src/game/types/session.ts) contém `version`, `meta` e `state`.

| Parte | Conteúdo observado |
| --- | --- |
| `meta` | Slot, timestamp, nível, XP, ouro, dia, HP e posição arredondada para apresentação. |
| `state.world` | Seed, descoberta e mutações do mundo procedural. |
| `state.player` | Posição, HP, progressão, atributos, inventário, direção e armas equipadas. |
| Entidades persistidas | Inimigos vivos, drops e respawns pendentes. |
| Sessão | Dia/noite, contagem de dias, contadores de IDs e quests. |

## Carregamento

O carregamento exige a presença de `state.world` e `state.player`, recria `World`, jogador e inimigos, restaura drops, respawns e quests e atualiza câmera e UI. Projéteis, partículas, queimaduras, textos flutuantes, casts e efeitos transitórios são reiniciados.

Campos opcionais recebem fallbacks: a seed pode vir do snapshot do mundo; dia/noite usa a configuração inicial quando ausente; o dia vem de `state`, depois de `meta`, depois de `1`; contadores e respawns também recebem valores padrão. Essas regras observadas não equivalem a uma política completa de migração.

## Limites atuais

- O loader não faz dispatch por `version` nem valida integralmente a estrutura JSON antes de consumir os campos. Compatibilidade com todas as versões antigas não foi estabelecida.
- O parser de slots trata JSON inválido ou ausência de metadados como save corrompido. `loadFromSlot()` retorna `null` quando o JSON não pode ser interpretado.
- Escritas dependem da disponibilidade e cota de `localStorage`; o caminho de save não captura todas as exceções de armazenamento.
- A regeneração de mundo depende dos algoritmos e IDs descritos em [mundo procedural](procedural-world.md). Mudar geração pode alterar o mundo de um save existente mesmo com a mesma seed.

Esses pontos registram o comportamento atual para orientar mudanças futuras; a adoção da base de conhecimento não modifica dados salvos nem corrige o loader.

## Impacto de alterações

Mudanças no snapshot, nas regras de geração ou nos IDs de entidades exigem revisar [ADR-0003](../architecture/decisions/ADR-0003.md), as factories de reconstrução e as regras complementares em [SAVE_SYSTEM_RULES.md](../../docs/SAVE_SYSTEM_RULES.md). Uma futura migração precisa de exemplos de entrada e saída e testes isolados que preservem dados; não execute ações de escrita em banco de dados para validá-la.

## Evidência

A versão e os fallbacks foram confirmados por inspeção de código em 2026-10-02. Este documento não comprova um ciclo real de save/load nem uma migração histórica testada. Aprovação de arquitetura e execução são fatos separados.
