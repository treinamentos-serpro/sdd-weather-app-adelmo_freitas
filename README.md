<div align="center">

# SDD Weather App

### Treinamento hands-on de **Spec-Driven Development** com **GitHub Copilot**

**Brief → Spec → Plan → Tasks → Code → Test → Review → Ship**

</div>

---

Este repositório é um **laboratório de treinamento de 8 horas** que ensina a
construir software guiado por especificação (**Spec-Driven Development**) usando
o **GitHub Copilot** em todas as etapas. O projeto final é um **Weather App** em
React + TypeScript que consome a API Open-Meteo.

> ## Princípio central
> **NÃO COMECE PELO CÓDIGO.** Sempre: **Spec → Plan → Tasks → Code.**

---

## O workshop

Comece pelo **[Guia do Workshop](workshop/GUIDE.md)** e siga os módulos em ordem.

| # | Módulo | Fase | Duração |
| --- | --- | --- | --- |
| 01 | [Setup](workshop/module-01-setup/README.md) | Preparação | 30 min |
| 02 | [Understanding the Problem](workshop/module-02-discovery/README.md) | Discovery | 45 min |
| 03 | [Writing the Specification](workshop/module-03-spec/README.md) | Spec | 50 min |
| 04 | [Creating the Technical Plan](workshop/module-04-plan/README.md) | Plan | 45 min |
| 05 | [Breaking Down Tasks](workshop/module-05-tasks/README.md) | Tasks | 40 min |
| 06 | [Building the UI](workshop/module-06-ui/README.md) | Code | 60 min |
| 07 | [Integrating APIs](workshop/module-07-api/README.md) | Code | 60 min |
| 08 | [Testing](workshop/module-08-testing/README.md) | Test | 55 min |
| 09 | [Hardening](workshop/module-09-hardening/README.md) | Test | 50 min |
| 10 | [Pull Request Review](workshop/module-10-review/README.md) | Review | 45 min |
| 11 | [Delivery (GitHub Pages)](workshop/module-11-delivery/README.md) | Ship | 30 min |

Cada módulo tem **README.md**, **challenge.md**, **prompts.md** e
**solution.md**.

---

## Começando

### Pré-requisitos

- **Node.js**
- **pnpm** (único gerenciador de pacotes suportado — habilite com `corepack enable`)
- **GitHub Copilot** habilitado no VS Code
- Git e uma conta no GitHub (para PR e deploy)

> O repositório inclui um **DevContainer** com tudo pré-configurado. Abra em um
> Codespace ou em "Reopen in Container" e pule a instalação manual.

### Instalação

```bash
pnpm install
pnpm exec playwright install   # navegadores para os testes E2E
```

### Scripts

```bash
pnpm dev             # servidor de desenvolvimento (Vite)
pnpm build           # build de produção
pnpm preview         # serve o build localmente
pnpm lint            # Biome (lint)
pnpm format          # Biome (formatação)
pnpm check           # Biome (lint + formatação)
pnpm test            # testes unitários (Vitest)
pnpm test:coverage   # cobertura
pnpm test:e2e        # testes E2E (Playwright)
```

---

## Arquitetura do app

### Protótipo de UI (P6.1–P6.8) — etapa histórica

O protótipo intermediário usava uma fixture em
[src/fixtures/weather.ts](src/fixtures/weather.ts), com datas fixas de 27 a
31/10/2026. Não representava o clima real nem fazia chamadas HTTP. A fixture
permanece no repositório como referência do workshop; a aplicação atual usa a
integração descrita abaixo.

### Integração Open-Meteo (P7.1–P7.5)

Execute `pnpm dev` para iniciar a aplicação. Envie uma busca manual, escolha
explicitamente uma das cidades retornadas e consulte o clima atual e a previsão
de cinco dias. A camada de serviços encapsula as APIs de geocoding e forecast,
com timeout de 10 segundos; falhas são exibidas com retry manual. Celsius e
Fahrenheit são alternados na interface sem nova consulta.

O projeto usa Open-Meteo sem API key. A unidade permanece no estado de UI durante
a sessão; persistência de preferência, geolocalização e demais itens do backlog
continuam fora desta integração.

#### Revisão de UI e acessibilidade — P6.8

- Atalho **Pular para o conteúdo**, com destino focável, para evitar navegação
  repetitiva pelo header.
- Nomes acessíveis, mensagens de validação associadas ao input, `aria-pressed`
  nos botões de unidade e foco visível em todos os controles.
- Loading e sucesso anunciados como status; erro anunciado como alerta.
  Ícones decorativos ficam ocultos de tecnologias assistivas, pois a condição
  também está escrita.
- Controles com pelo menos 44 px de altura; layout sem overflow a 320, 768 e
  1280 px, com grid de 2/3/5 colunas e temperaturas nas duas unidades.
- Texto do estado de sucesso verificado com contraste mínimo de 4,5:1,
  considerando a camada mais clara do gradiente e os fundos translúcidos.
- Spinner respeita a preferência de redução de movimento.

Validações: `pnpm lint`, `pnpm build` e `pnpm test` aprovados (52 testes
unitários). `pnpm exec playwright test --workers=2` aprovado (12 testes nos
projetos Chromium desktop e WebKit mobile), cobrindo estados, teclado, retry,
grid, overflow, contraste e ausência de chamadas Open-Meteo. Os testes de layout
geram screenshots no diretório de resultados do Playwright.
Essa revisão não substitui avaliação manual com leitores de tela nem certifica
conformidade WCAG integral.

### Estrutura

```text
src/
├── components/      # apresentação (um componente por arquivo)
│   └── states/      # loading, erro, vazio
├── hooks/           # orquestração (useWeather)
├── services/        # acesso a dados (Open-Meteo) isolado
├── lib/             # funções puras (conversão, formatação, códigos WMO)
├── types/           # contratos compartilhados
├── styles/          # Tailwind + estilos globais
├── App.tsx          # composição da tela
└── main.tsx         # bootstrap React
```

Decisões-chave:

- **Temperaturas em Celsius** internamente; conversão só na apresentação (o
  toggle °C/°F **não** faz nova requisição).
- **Rede isolada** em `services/` — componentes e hooks não conhecem URLs.
- Sempre tratar **loading**, **erro** e **vazio**.

---

## Stack

- **TypeScript** (strict) · **React** · **Vite**
- **Tailwind CSS** (tema dark glassmorphism)
- **Vitest** + **Testing Library** (unit) · **Playwright** (E2E)
- **Biome** (lint + formatação)
- **pnpm** (gerenciador de pacotes)
- **Open-Meteo** (geocoding + forecast, sem API key)

---

## Copilot no fluxo SDD

A pasta `.github/` traz a inteligência do laboratório:

- **`agents/`** — personas especializadas: Spec, Plan, Task, Code, Test, Review.
- **`prompts/`** — prompts de produção para cada etapa.
- **`instructions/`** — convenções (React, Tailwind, Testing) aplicadas
  automaticamente.
- **`workflows/`** — CI (lint/build/test/e2e), deploy no Pages e validações que
  **impõem a ordem Spec → Plan → Tasks**.

Veja [AGENTS.md](AGENTS.md) para a descrição de cada agente.

---

## Idioma

- Narrativa, comentários e documentação: **pt-BR**.
- Identificadores de código, nomes de arquivos e termos técnicos: **en-US**.

---

<div align="center">

Construído com ❤️ para capacitar times em **Spec-Driven Development** usando o poder do GitHub Copilot.

</div>
