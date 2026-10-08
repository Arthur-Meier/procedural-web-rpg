---
okf_version: "0.2"
---

# Conhecimento do procedural-web-rpg

Este é o ponto de entrada para o conhecimento técnico do projeto. A base segue [Open Knowledge Format v0.2](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md), com um perfil local documentado em [manutenção do conhecimento](concepts/knowledge-maintenance.md). Documentos descrevem o código e registram propostas de decisão; a existência de uma implementação não comprova aprovação humana.

## Conceitos

| Conceito | O que consultar |
| --- | --- |
| [Arquitetura atual](concepts/architecture.md) | Composição do jogo, sistemas, loop, servidor e limites de responsabilidade. |
| [Mundo procedural](concepts/procedural-world.md) | Seed, chunks, descoberta, mutações e compatibilidade do mundo salvo. |
| [Saves e sessões](concepts/save-system.md) | Snapshot v4, localStorage, reconstrução do estado e limites de compatibilidade. |
| [Renderização e assets](concepts/rendering-assets.md) | Canvas, sprites e profundidade, caminhos relativos compatíveis com GitHub Pages, grama com lâminas/tufos nítidos por amostragem direta da arte original, árvores/folhas ao vento, interface minimalista, HUD e glyphs Aseprite. |
| [Manutenção do conhecimento](concepts/knowledge-maintenance.md) | Perfil OKF, ciclo de ADR, validação, Graphify, arquivos versionados/exclusões locais e limites de evidência. |

## Decisões arquiteturais

O [índice de ADRs](architecture/decisions/index.md) registra o ciclo e a próxima numeração disponível.

| ADR | Proposta | Situação |
| --- | --- | --- |
| [ADR-0001](architecture/decisions/ADR-0001.md) | Adotar o perfil OKF, ADRs e Graphify local como índice derivado. | Proposta; integração implementada, aprovação específica não registrada. |
| [ADR-0002](architecture/decisions/ADR-0002.md) | Manter a composição modular em TypeScript, Canvas e sistemas com hosts explícitos. | Proposta que documenta a arquitetura observada. |
| [ADR-0003](architecture/decisions/ADR-0003.md) | Preservar o contrato de snapshots locais e do mundo procedural. | Proposta que documenta a persistência observada. |

## Uso

1. Leia o conceito relevante e suas fontes antes de alterar um comportamento.
2. Avalie os ADRs relacionados. Uma mudança material de arquitetura pode exigir uma proposta nova.
3. Atualize o conceito, as relações e o [log](log.md) quando mudar a evidência documentada.
4. Valide a estrutura e atualize o grafo conforme os [comandos de manutenção](concepts/knowledge-maintenance.md#rotina-de-manutencao).
5. Consulte as fontes diretamente quando o grafo estiver ausente, desatualizado ou incompleto.

## Referências e modelos

- [Modelo de conceito](../.knowledge/templates/concept.md).
- [Modelo de ADR](../.knowledge/templates/adr.md).
- [Registro de alterações de conhecimento](log.md).
- [Guia do projeto](../README.md).
- [Arquitetura técnica detalhada existente](../docs/TECH_ARCHITECTURE.md).
- [Regras existentes de saves](../docs/SAVE_SYSTEM_RULES.md).
- [Regras de desempenho](../docs/PERFORMANCE_RULES.md).
- [Contrato dos assets de cenário](../assets/environment/README.md).
- [Contrato do personagem](../assets/characters/README.md).
- [Contrato da slime azul](../assets/enemies/README.md).
- [Contrato do mago vermelho](../assets/enemies/RED_MAGE.md).
- [Contrato do spritesheet de itens](../assets/items/README.md).

As regras de domínio em `docs/` e as referências de assets permanecem complementares a esta base. Quando uma descrição divergir da implementação, registre a divergência e confirme o comportamento nas fontes; um índice estrutural não resolve a revisão semântica.
