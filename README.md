# procedural-web-rpg

RPG 2D para navegador, escrito em TypeScript com Canvas 2D. O projeto explora mapas procedurais, combate, progressão, save/load e ciclos de dia/noite.

## Executar

Use Node.js 22 ou posterior. Em PowerShell:

```powershell
npm.cmd ci --ignore-scripts
npm.cmd start
```

O servidor local usa a porta 4174 por padrão. `npm.cmd run build` compila o código com TypeScript. As regras de cada área estão em `docs/`; a visão do jogo está em [GAME_VISION.md](docs/GAME_VISION.md).

## Conhecimento e decisões

A entrada canônica é [knowledge/index.md](knowledge/index.md). O [padrão de conhecimento](docs/KNOWLEDGE_STANDARD.md) define OKF v0.2, o perfil deste projeto, o ciclo de ADR e a integração local com Graphify. Os [ADRs](knowledge/architecture/decisions/index.md) registram propostas, evidências e aprovação específica quando houver. Modelos e conceitos usam fontes verificáveis; os índices e o log permitem navegação seletiva.

```powershell
npm.cmd run knowledge:query -- save
npm.cmd run knowledge:impact -- src/game/world.ts
npm.cmd run knowledge:adr -- "Título de uma nova proposta"
```

Após conferir as fontes e atualizar conceitos, índices e o log, registre a observação dos hashes e execute o gate completo:

```powershell
npm.cmd run knowledge:baseline
npm.cmd run check
```

`check` executa todos os testes de conhecimento, a validação estrutural com detecção de drift e o build. A baseline registra hashes, sem aprovar conteúdo ou ADRs. Os três ADRs iniciais permanecem `proposed`; revisão semântica e aprovação humana são registradas separadamente.

## Graphify

A integração usa `graphifyy==0.9.63` em uma instalação Python isolada no projeto. Disponibilize `uv`; o setup resolve Python 3.12 e instala o provider, acessando o registro de pacotes. A extração posterior é local, em modo `--code-only --no-cluster`, sem chave de API, LLM ou hooks.

```powershell
npm.cmd run graphify:setup
npm.cmd run graphify:refresh
npm.cmd run graphify:status -- --check
npm.cmd run graphify:query -- World --limit 10
```

O grafo ajuda a localizar símbolos e dependências. Ele tem fingerprints de fontes/configuração, detecta desatualização e preserva o último snapshot íntegro após falha. Os dados e relatórios gerados ficam em `.runtime/`, fora do versionamento. Consulte [o contrato completo](docs/KNOWLEDGE_STANDARD.md#graphify-local) para entender escopo e limites da extração.
