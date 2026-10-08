---
type: Software Component
id: rendering-assets
title: Renderização Canvas e contratos de assets
status: draft
implementation_status: observed
created: 2026-10-02
updated: 2026-10-08
sources:
  - resource: ../../src/game/render/world-renderer.ts
  - resource: ../../src/game/render/environment-sprites.ts
  - resource: ../../src/game/render/wind.ts
  - resource: ../../src/game/render/wind-leaves.ts
  - resource: ../../assets/environment/tree-wind.png
  - resource: ../../assets/environment/tree-wind.json
  - resource: ../../assets/environment/tree-wind.aseprite
  - resource: ../../assets/environment/wind-leaves.png
  - resource: ../../assets/environment/wind-leaves.json
  - resource: ../../assets/environment/wind-leaves.aseprite
  - resource: ../../scripts/prepare-wind-assets.mjs
  - resource: ../../scripts/validate-wind.mjs
  - resource: ../../scripts/validate-environment-art.mjs
  - resource: ../../src/game/render/terrain-textures.ts
  - resource: ../../assets/environment/grass-ground.png
  - resource: ../../assets/environment/dirt-ground.png
  - resource: ../../assets/environment/grass-ground.aseprite
  - resource: ../../assets/environment/dirt-ground.aseprite
  - resource: ../../assets/environment/grass-ground-generated.png
  - resource: ../../assets/environment/dirt-ground-generated.png
  - resource: ../../scripts/prepare-terrain-assets.mjs
  - resource: ../../scripts/validate-terrain-art.mjs
  - resource: ../../src/game/render/player-sprite.ts
  - resource: ../../src/game/render/slime-sprite.ts
  - resource: ../../src/game/render/mage-sprite.ts
  - resource: ../../assets/enemies/RED_MAGE.md
  - resource: ../../assets/enemies/red-mage.png
  - resource: ../../assets/enemies/red-mage.json
  - resource: ../../assets/enemies/red-mage.aseprite
  - resource: ../../Img referencias/Ficha de Referência do Mago Vermelho Maligno.png
  - resource: ../../scripts/prepare-mage-assets.mjs
  - resource: ../../scripts/validate-mage-sprite.mjs
  - resource: ../../src/game/render/item-sprites.ts
  - resource: ../../src/game/render/layers/environment-layer.ts
  - resource: ../../styles.css
  - resource: ../../index.html
  - resource: ../../src/game/ui/panels/hud-panel.ts
  - resource: ../../src/game/ui/panels/inventory-panel.ts
  - resource: ../../assets/ui/README.md
  - resource: ../../assets/ui/ui-icons.png
  - resource: ../../assets/ui/ui-icons.json
  - resource: ../../assets/ui/ui-icons.aseprite
  - resource: ../../scripts/prepare-ui-assets.mjs
  - resource: ../../scripts/validate-ui-layout.mjs
  - resource: ../../assets/items/README.md
  - resource: ../../assets/items/loot-items.png
  - resource: ../../assets/items/loot-items.aseprite
  - resource: ../../assets/items/loot-items.json
  - resource: ../../scripts/prepare-item-assets.mjs
  - resource: ../../scripts/validate-item-sprites.mjs
  - resource: ../../src/game/render/layers/entity-layer.ts
  - resource: ../../src/game/render/layers/terrain-layer.ts
  - resource: ../../src/game/ui/overlay-controller.ts
  - resource: ../../assets/environment/README.md
  - resource: ../../assets/characters/README.md
  - resource: ../../assets/enemies/README.md
  - resource: ../../assets/enemies/blue-slime.png
  - resource: ../../assets/enemies/blue-slime.json
  - resource: ../../docs/ART_DIRECTION.md
  - resource: ../../scripts/prepare-slime-assets.mjs
  - resource: ../../scripts/validate-slime-sprite.mjs
  - resource: ../../scripts/validate-pages-paths.mjs
relates_to: [architecture, procedural-world, ADR-0002]
tags: [rendering, canvas, assets, sprites, depth]
---

# Renderização Canvas e contratos de assets

## Orquestração

[WorldRenderer](../../src/game/render/world-renderer.ts) compõe `TerrainLayer`, `EnvironmentLayer`, `EntityLayer`, `EffectsLayer` e `HudFxLayer`. A câmera aplica uma única translação para o espaço do mundo, desenha terreno e elementos no chão, desenha objetos e atores por profundidade e, depois, efeitos. Os efeitos de tela são desenhados após restaurar a transformação.

`drawWorldDepth()` ordena objetos, inimigos, casa, NPC, placa e jogador pela coordenada Y do contato com o chão. Assim o ponto de contato determina a sobreposição de sprites altos. Painéis, slots e overlays são DOM; sua apresentação é coordenada separadamente pelo [OverlayController](../../src/game/ui/overlay-controller.ts).

## Assets e fallbacks

Os loaders de sprites, materiais e folhas usam `./assets/...`, relativo ao documento; URLs de imagens em CSS são relativas ao arquivo `styles.css`. A estrutura publicada mantém HTML, CSS, `assets/` e `dist/` juntos, permitindo carregar o mesmo PNG na raiz local ou em `/procedural-web-rpg/` no GitHub Pages. URLs com `/assets/...` buscavam a raiz do domínio, retornavam 404 no Pages e acionavam os desenhos de fallback. O [validador de caminhos](../../scripts/validate-pages-paths.mjs), executado após o build, instancia os loaders compilados com uma sonda de requisições de Image e confere por HTTP os bytes dos assets em ambos os mounts, incluindo CSS e imagens do HTML. Ele não valida decodificação no navegador, desenho Canvas, animações ou gameplay.

O [atlas de cenário](../../src/game/render/environment-sprites.ts) possui células de 256 × 256 em uma grade 3 × 3, com âncora de contato em `(128, 224)`. A escolha visual e a escala de objetos quebráveis combinam seu ID com a seed, sem alterar a posição de gameplay. A imagem só é considerada carregada quando suas dimensões correspondem ao contrato; a chamada de desenho retorna `false` quando indisponível.

[TerrainTextures](../../src/game/render/terrain-textures.ts) carrega materiais de 128 × 128, mantém patterns por contexto Canvas e cria um fallback procedural quando a imagem não está pronta. O carregamento válido invalida os patterns e incrementa a revisão do material. O desenho de sprites desabilita suavização.

O [terreno revisado](../../assets/environment/README.md#quiet-green-terrain) usa as referências originais preservadas. Após a grama por médias ser rejeitada como borrada, o preparador passou a amostrar diretamente o recorte central de 384 × 384, sem médias, gerando pixels nítidos em 128 × 128 com doze verdes e lâminas/tufos legíveis. Uma única linha/coluna ajusta as bordas opostas. A terra conserva médias de quatro amostras em grupos de dois pixels, oito tons e 40 acentos. Fontes editáveis, PNGs opacos e cópias foram desenhados/exportados pelo MCP Aseprite. A TerrainLayer mantém três manchas verdes suaves por célula; o fallback usa 180 tufos de três lâminas curvas com sombra ou 256 grupos de terra. Caches por contexto, limite de 48 células, reset por seed e trilha de entrada permanecem. A alteração é de apresentação, sem novo estado de mundo/sessão ou decisão material de arquitetura.

Os contratos detalhados de exportação, anchors, sprites individuais, fontes Aseprite e inspeção estão nos [assets de cenário](../../assets/environment/README.md) e [assets do personagem](../../assets/characters/README.md). Esses arquivos registram proveniência histórica; esta adoção de conhecimento não verifica novamente a autoria ou os prompts dos assets.

O [sprite da slime azul](../../src/game/render/slime-sprite.ts) carrega uma folha horizontal de 2080 × 64 pixels, com 26 células de 80 × 64 e âncora `(40, 54)`. A [EntityLayer](../../src/game/render/layers/entity-layer.ts) preserva a sombra e a barra de vida, tenta desenhar o sprite sem suavização e usa o fallback procedural azul se a imagem estiver indisponível ou tiver dimensões incorretas. A escala acompanha o raio existente; o renderer não altera inimigos ou snapshots.

A animação de repouso usa quatro frames e o relógio visual existente. Os avanços de dash usam os timers de combate: seis poses de ataque para direções horizontais, com espelhamento à esquerda, ou quatro poses de movimento para cima/baixo. O hurt timer seleciona as duas primeiras poses de dano e retorna às animações normais após expirar. As poses de movimento à esquerda e as duas últimas poses de derrota ficam disponíveis no asset editável; o sistema de morte não foi alterado. O [contrato do inimigo](../../assets/enemies/README.md) registra a referência fornecida, a preparação dos pixels e a criação/exportação real por MCP Aseprite.

## Interface e HUD

A apresentação em [index.html](../../index.html) e [styles.css](../../styles.css) usa superfícies planas verde-floresta, texto de pergaminho e um acento de latão. Títulos mantêm a fonte serifada; dados e ações usam fontes sans-serif do sistema. A tela inicial tem composição sem caixa central e reutiliza as árvores e o Cavaleiro Mago. Os [dez glyphs de UI](../../assets/ui/README.md) vêm de atlas PNG 240 × 24 e fonte Aseprite editável com camadas/slices e pivots; foram desenhados e exportados pelo MCP Aseprite. Rótulos permanecem disponíveis quando a imagem falha.

O [HUD](../../src/game/ui/panels/hud-panel.ts) concentra nível/vida/XP no canto superior esquerdo, ouro/dia e contexto de missão/pontos/interação no direito, armas/ocupação da mochila embaixo à esquerda e navegação à direita. A lista completa do inventário fica no painel dedicado. Vida/XP usam valores ARIA e as ações conservam rótulos/atalhos. Os novos botões chamam as operações já existentes do OverlayController e SessionSystem; não acrescentam estado de gameplay ou dados de save.

O OverlayController oculta o HUD enquanto um overlay está aberto. Inventário mostra o sprite real do jogador, equipamentos, a bancada existente de nove células e todos os slots; atributos, missões e slots de save usam linhas/separadores. O mapa ganha botão de fechar e a pausa concentra instruções completas de controle. A bancada conserva seu comportamento de apresentação; o layout não implementa craft. Em telas estreitas a navegação muda de posição, as grades se adaptam e o conteúdo dos painéis rola verticalmente. Transições curtas e o movimento das árvores na tela inicial respeitam `prefers-reduced-motion`.

## Vento e folhas

As três variantes de árvore usam [tree-wind.png](../../assets/environment/tree-wind.png): 24 células de 256 × 256 em uma folha de 6144 × 256, com oito poses por variante e 220 ms por pose. O renderer calcula a fase pelo timestamp visual existente, posição e hash do objeto, com uma oscilação compartilhada da brisa. A deformação cresce em direção à copa; as linhas a partir de Y=205 e a âncora `(128, 224)` preservam os pixels originais. Sombras, ordenação por contato, posições e colliders continuam nas camadas existentes. O atlas estático é o fallback quando a folha animada está ausente ou tem dimensões incorretas.

A [WindLeavesLayer](../../src/game/render/wind-leaves.ts) desenha folhas após os objetos/atores ordenados e antes dos efeitos de combate. Usa [wind-leaves.png](../../assets/environment/wind-leaves.png), 12 poses de 16 × 16 em três paletas, contorno, caule e variações de tombamento. Duas trajetórias por árvore derivam analiticamente do tempo, hash e posição: deriva à direita com pulsação, queda, flutter, rotação e fade nas extremidades do ciclo. O movimento é em coordenadas do mundo, com culling pelo viewport e limite de 48 folhas desenhadas. Não acumula partículas, não altera objetos e não acrescenta dados a snapshots. A renderização visual continua nas pausas conforme o relógio já usado pelo renderer. A falha da imagem conserva silhuetas procedurais de folhas.

O [contrato dos assets](../../assets/environment/README.md#wind-animation) documenta células, tags, fontes editáveis e GIFs. A preparação deriva das árvores originais; timelines, importações, pixels das folhas e exportações foram produzidos pelo MCP Aseprite. A integração preserva a composição discutida no ADR-0002 e não introduz uma decisão material nova de arquitetura ou persistência.

## Impacto de alterações

O [mago vermelho](../../assets/enemies/RED_MAGE.md) usa o [MageSpriteRenderer](../../src/game/render/mage-sprite.ts), com 30 células de 128 × 128 na folha horizontal de 3840 × 128 e âncora `(64, 116)`. Frente, lateral e costas representam os quatro setores existentes, com espelhamento à esquerda. Cada banco contém repouso, variação de passos/tecido, conjuração e dano. Uma WeakMap visual observa deslocamentos e guarda a transição breve de movimento; não altera inimigos/snapshots. Conjuração segue somente o spell pendente do inimigo e sua direção/progresso; cooldown completo e casts expirados/de outro inimigo não acionam a animação. A EntityLayer mantém sombra/profundidade e posiciona a barra acima da silhueta. O fallback procedural acompanha a paleta vermelha. IA, estatísticas, elemento de projétil, regras de magia e loot foram preservados.

Os [drops de materiais](../../assets/items/README.md) compartilham um spritesheet horizontal de 320 × 64 pixels: gel azul, ouro, madeira, carvão e pedra, em células de 64 × 64 com pivot `(32, 32)`. A pedra ocupa a quinta célula e representa um agrupamento de rochas fraturadas, com planos claros cinza/bege e sombras neutras compatíveis com os pedregulhos do cenário, inspirado no anexo fornecido pelo usuário. O [ItemSpriteRenderer](../../src/game/render/item-sprites.ts), chamado pela EnvironmentLayer, valida dimensões antes de desenhar, usa nearest-neighbor e mantém a oscilação existente com sombra fixa no chão. Carregamento/falha usa o desenho procedural; o fallback do gel também é azul. IDs, quantidades, geração/coleta de drops e snapshots não foram alterados. Os tokens de materiais da UI reutilizam as mesmas cinco células por CSS; a moeda está disponível como classe, sem alterar o contador textual de ouro.

Ao alterar um asset, revise dimensões, células, âncoras, transparência, atlas e arquivo individual. Ao alterar profundidade, confirme as situações em que o jogador passa à frente e atrás de objetos. Ao alterar materiais, considere os caches e a chegada assíncrona de imagens. Uma mudança de desenho pode afetar legibilidade e desempenho sem modificar o grafo de importações.

A arquitetura é discutida em [ADR-0002](../architecture/decisions/ADR-0002.md). Resultados de inspeções de assets ou navegador devem registrar comando, resultado e artefato; o grafo local não substitui essas verificações.

## Evidência e limites

Na correção de nitidez em 2026-10-03, o MCP Aseprite produziu/exportou a nova grama; a textura de terra permaneceu igual. `validate-terrain-art.mjs` aprovou três grupos em `output/terrain-crisp/art/`: igualdade Aseprite/PNG/cópias, opacidade/bordas/paletas, contraste, renderer/caches/estado e fallback ausente/dimensões inválidas. Contraste entre vizinhos: grama 11,99, terra 3,36, dentro dos limites existentes sem relaxamento. A regressão de cenário aprovou nove verificações e o inspector os onze assets. O cliente original develop-web-game completou três sequências de movimento/repouso; estado e capturas do jogo, fixture, fallback e tile ampliado por nearest-neighbor foram inspecionados. Zero tentativas de escrita em storage ou erros inesperados. Testes técnicos das versões anteriores não impediram a rejeição artística pelo usuário; contraste/paleta não comprovam aprovação humana da arte ou compatibilidade de saves.

Na revisão mais rica de 2026-10-03, após o pedido reiterado de um meio-termo com mais detalhe, as referências originais foram realmente lidas para gerar o novo padrão orgânico. MCP Aseprite desenhou/paletizou/exportou as duas fontes e PNGs. `validate-terrain-art.mjs` aprovou três grupos em `output/terrain-natural/art/`: pixels Aseprite/PNG/cópias iguais, doze/oito cores, bordas/opacidade, contraste intermediário mais alto, renderer/caches/estado e fallback. O contraste entre vizinhos ficou em 6,40 na grama (revisão anterior: 2,72; original: 28,92) e 3,36 na terra (anterior: 0,37; original: 16,09). O contrato exige limites inferiores maiores conforme o novo pedido, mantendo limites superiores abaixo do ruído original. A regressão de cenário aprovou nove verificações e o inspector os nove props/dois terrenos. Capturas do cenário real, fixture com personagens, fallback, atlas e cliente develop-web-game foram inspecionadas. O cliente executou três sequências de movimento/repouso, sem erro inesperado ou tentativa de escrita em storage. A avaliação visual não atribui aprovação humana, benchmark ou compatibilidade de saves.

Na revisão de equilíbrio em 2026-10-03, `validate-terrain-art.mjs` aprovou três grupos em `output/terrain-balanced/art/`: pixels reais Aseprite/PNG/cópias iguais, paletas de oito/seis cores, opacidade/bordas, contraste intermediário, renderer real/caches/estado e fallback. A checagem inicial detectou pixels opostos diferentes depois de adicionar detalhes nas bordas; o plano foi corrigido e reexportado pelo MCP antes da aprovação final. O contraste entre vizinhos da grama ficou em 2,72, entre o tile liso de 0,09 e o original de 28,92; terra ficou em 0,37. O contrato passou a exigir também um limite inferior de detalhe para evitar o aspecto liso rejeitado; mantém limite superior para o ruído. Capturas de fixture com cavaleiro/mago/slime, cenário real e fallback foram inspecionadas. A regressão de cenário aprovou nove verificações, o inspector os nove props/dois terrenos e o cliente original develop-web-game executou três sequências de movimento/repouso. Não houve erro inesperado nem tentativa de escrita em storage; isso não atribui aprovação artística humana, desempenho ou compatibilidade de saves.

O refinamento posterior em 2026-10-03 foi redesenhado/exportado pelo MCP Aseprite e verificado em `output/terrain-refinement/`. A grama passou de cinco para quatro cores visíveis e de oito para quatro tufos por tile; o contraste entre vizinhos passou de 0,18 para 0,09. `validate-terrain-art.mjs` aprovou três grupos, a regressão de cenário nove verificações e o inspector os nove props/dois terrenos. O cliente original develop-web-game executou três sequências de movimento/repouso. Capturas de mundo real, fixture com cavaleiro/mago/slime, fallback e cliente foram inspecionadas. Nenhuma tentativa de escrita em storage ou erro inesperado foi registrado. A comparação opcional desta execução usa os tiles originais ruidosos de `output/terrain-validation/before/`, distinguindo-os da revisão intermediária de cinco cores; não se atribui nova revisão humana ou compatibilidade de saves.

Em 2026-10-03, `node scripts/validate-terrain-art.mjs http://localhost:4174 output/terrain-validation/art output/terrain-validation/before` aprovou três grupos: igualdade de pixels Aseprite/PNG/cópias, opacidade/bordas/paletas/contraste local; renderização real com cavaleiro/mago/slime, caches em coordenadas negativas e reset por seed; fallback ausente/dimensões inválidas. A grama passou de 26 para cinco cores visíveis e a terra de 23 para quatro. O contraste médio entre pixels vizinhos caiu de 28,92 para 0,18 na grama e de 16,09 para 0,14 na terra; isso mede ruído local do asset, sem estabelecer FPS ou aprovação artística humana. As capturas de material anterior/atual/fallback usam a mesma fixture e o renderer atual; foram inspecionadas junto da captura do cliente develop-web-game e do cenário real. A regressão de cenário aprovou nove verificações, incluindo passagem de chunk, profundidade e fallback. Não houve erro inesperado de navegador nem tentativa de escrita em storage; compatibilidade de saves não foi testada.

Em 2026-10-02, `node scripts/validate-ui-layout.mjs http://localhost:4174 output/ui-validation/browser` aprovou seis grupos de verificações para a interface: pixels/slices/pivots reais da fonte Aseprite iguais ao PNG, dez glifos transparentes sem clipping, título/HUD/overlays em cinco viewports, navegação e fechamento/retomada, dados e acessibilidade do HUD, callbacks de fixtures dos painéis e comportamento sem glifos/com movimento reduzido. Capturas de título, HUD, inventário preenchido, atributos, pausa e telas estreitas foram inspecionadas. Não houve erro inesperado nem tentativa de escrita em storage. Regressões de personagem (nove verificações) e itens (quatro) passaram; o cliente develop-web-game executou movimento/repouso com captura e estado inspecionados. As fixtures comprovam apresentação e despacho dos callbacks, sem homologar equipamento/progressão/missões completos. Save/load foi limitado às listas, sem gravação/exclusão ou homologação de compatibilidade. Essas evidências não atribuem aprovação humana da direção de arte ou revisão semântica do conhecimento.

Em 2026-10-02, `node scripts/validate-wind.mjs` aprovou cinco grupos de verificação: pixels reais da fonte Aseprite iguais aos PNGs, transparência/padding, frames/tags/durações, raízes e poses neutras, bancos animados, sombras/props estáticos, trajetórias determinísticas, limite de 48 folhas e fallback ausente/inválido com folhas visíveis. A fixture das classes reais não alterou objetos/partículas de gameplay e registrou zero tentativas de escrita em storage e zero erros inesperados de navegador. As capturas `output/wind-validation/forest-wind.png`, `forest-wind-next.png`, `missing-fallback.png` e `leaf-detail.png` foram inspecionadas. As nove verificações de cenário e nove do personagem também passaram em diretórios próprios desta alteração; o cliente develop-web-game executou três sequências de movimento/repouso com capturas inspecionadas. Esses testes não são benchmark de desempenho, homologação de saves ou aprovação humana.

Em 2026-10-02, `node scripts/validate-mage-sprite.mjs` confirmou 30 células sem clipping, transparência binária, 25 cores, doze tags/durações e igualdade dos pixels da fonte Aseprite com o PNG exportado. A fixture real de EntityLayer/WorldRenderer verificou repouso/movimento, quatro direções, espelhamento, parada/relógio, conjuração somente pelo spell correspondente e dano/recuperação, com zero tentativas de escrita em storage e nenhum erro inesperado de navegador. As capturas `output/mage-validation/mages-in-world.png`, `mages-detail.png` e `missing-fallback.png` foram inspecionadas, incluindo a barra deslocada acima do capuz/cajado. As regressões existentes de slime e jogador também passaram. A referência visual do mago é uma fonte local realmente consultada; a animação de tecido/passos deriva de suas poses e não estabelece uma nova revisão de combate, saves ou aprovação humana.

Na revisão da pedra em 2026-10-02, `node scripts/validate-item-sprites.mjs http://localhost:4174 output/stone-validation` confirmou cinco células sem clipping, 42 cores, transparência binária, igualdade dos pixels/slices da fonte Aseprite com PNG/metadados e integração da quinta célula no mundo e no token de inventário. Os cenários preservaram quantidades/raios, verificaram a sombra fixa e fallback ausente/inválido e registraram zero tentativas de escrita em storage. As capturas `output/stone-validation/items-in-world.png`, `items-detail.png` e `missing-fallback.png` foram inspecionadas. Uma comparação direta de pixels com `.runtime/items/before-stone.png` confirmou a preservação integral das quatro células anteriores. A referência visual foi o anexo da conversa; não se atribui a ele um caminho local inexistente.

Na revisão inicial de itens em 2026-10-02, `scripts/validate-item-sprites.mjs` confirmou quatro células sem clipping, 34 cores, transparência binária e igualdade dos pixels/camadas exportados da fonte Aseprite com o PNG, incluindo slices e pivots dos metadados. As fixtures das classes reais de renderização verificaram células, oscilação, sombra fixa, preservação do estado, tokens CSS e fallback ausente/inválido, com zero tentativas de escrita em storage. As capturas `output/item-validation/items-in-world.png`, `items-detail.png` e `missing-fallback.png` foram inspecionadas. Esses cenários não executam a geração/coleta real de loot nem validam saves.

As afirmações de runtime acima vêm das fontes listadas. Em 2026-10-02, `scripts/validate-slime-sprite.mjs` confirmou dimensões, transparência binária, 26 células sem clipping, tags e seleção de frames no renderer real em fixtures de navegador. As capturas `output/slime-validation/slimes-in-world.png`, `slimes-detail.png` e `missing-image-fallback.png` foram inspecionadas visualmente. Não houve tentativa de escrita em storage nos cenários. Essa evidência é limitada ao sprite e à integração de renderização; não estabelece medição de FPS, compatibilidade de saves ou aprovação humana/semântica do conhecimento. As referências de outros assets incluem comandos próprios de verificação.
