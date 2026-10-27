# Backlog de implementação — Weather App

Backlog derivado de [weather-app-plan.md](../plans/weather-app-plan.md) e
[weather-app-spec.md](../specs/weather-app-spec.md). A ordem abaixo respeita
dependências e o fluxo tipos → funções puras → services → hook → componentes →
integração → testes → hardening. Os arquivos indicados são prováveis; manter a
separação de responsabilidades do plano e adaptar somente se a estrutura inicial
do projeto exigir.

**Tamanho relativo:** P = pequeno, M = médio, G = grande. Cada tarefa deve
continuar limitada a um ou dois arquivos de implementação relevantes; testes
ficam em tarefas próprias. **Prioridade:** P0 = necessário ao fluxo essencial da
v1; P1 = requisito funcional complementar; P2 = hardening e validação de
lançamento.

## Entrega 1 — Contratos e funções puras

### T-01 — Definir contratos compartilhados do domínio

- **Descrição:** declarar os modelos de cidade, clima, previsão, unidade,
  estados de operação e erros consumidos pela UI, pelo hook e pelos services.
- **Tipo:** Data · **Prioridade:** P0 · **Tamanho:** P
- **Requisitos:** FR-01 a FR-07; AC-02.3, AC-03.4, AC-06.1, AC-06.3.
- **Critérios de aceite:**
  - `Unit` aceita somente `celsius` ou `fahrenheit`.
  - `City` contém `id`, `name`, `country`, `latitude` e `longitude`; `admin1`,
    `countryCode` e `timezone` são opcionais.
  - `CurrentWeather` contém `time`, `temperatureC`, `apparentTemperatureC`,
    `weatherCode`, `condition`, `relativeHumidityPercent` e `windSpeedKmh`.
    `WeatherData.current` aceita `null`.
  - `ForecastDay` contém `date`, `available`, `weatherCode`, `condition`,
    `minTemperatureC`, `maxTemperatureC` e
    `precipitationProbabilityPercent`; campos meteorológicos podem ser `null`
    para dias indisponíveis. `WeatherData` contém `city` anulável, `timezone`,
    `current` anulável e `forecast`.
  - `available` indica se todos os campos obrigatórios do dia estão presentes;
    ausência de dados permanece `null`, nunca zero ou outro valor inventado.
  - Os estados de busca e previsão distinguem `idle`, `loading`, `success` e
    `error`; busca também distingue `empty`. Os tipos de erro permitem
    identificar falha de rede/API, resposta inválida e timeout.
  - Os tipos compilam em TypeScript strict sem `any`.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `src/types/weather.ts`.

### T-02 — Implementar conversão de temperatura

- **Descrição:** criar função pura para converter valores Celsius/Fahrenheit sem
  modificar o dado de entrada.
- **Tipo:** Data · **Prioridade:** P0 · **Tamanho:** P
- **Requisitos:** FR-04; AC-02.2, AC-03.3, AC-04.2.
- **Critérios de aceite:**
  - A conversão para Fahrenheit usa `°F = °C × 9/5 + 32`; a conversão para
    Celsius retorna o valor Celsius correspondente.
  - Converter Celsius para Celsius preserva o valor original; a conversão não
    modifica o modelo nem aplica arredondamento implícito.
  - A função aceita tipos `Unit` definidos em T-01.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/temperature.ts`.

### T-03 — Mapear códigos meteorológicos WMO

- **Descrição:** implementar função pura que traduz códigos WMO para descrições
  em pt-BR.
- **Tipo:** Data · **Prioridade:** P0 · **Tamanho:** P
- **Requisitos:** FR-02, FR-03, FR-06; AC-02.1, AC-03.1, AC-06.6, AC-07.1.
- **Critérios de aceite:**
  - Os códigos `0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66,
    67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99` retornam uma descrição
    não vazia em pt-BR, sem exibir o número do código como condição.
  - Um código desconhecido retorna um rótulo neutro equivalente a “Condição
    indisponível” e não impede a apresentação dos outros campos válidos.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/weatherCode.ts`.

### T-04 — Formatar números e datas locais

- **Descrição:** criar helpers puros para exibir números em pt-BR e datas diárias
  sem deslocar o dia por causa do fuso do dispositivo.
- **Tipo:** Data · **Prioridade:** P1 · **Tamanho:** P
- **Requisitos:** FR-03, FR-07; AC-03.1, AC-03.2, AC-07.1, AC-07.2.
- **Critérios de aceite:**
  - Números são formatados com locale `pt-BR`.
  - Uma data `YYYY-MM-DD` da previsão é exibida como data-calendário local,
    preservando dia, mês e ano independentemente do fuso do dispositivo.
  - Quando a formatação envolver um instante, o helper aceita e usa o fuso do
    destino, em vez de assumir o fuso do dispositivo.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/formatting.ts`.

## Entrega 2 — Integração de dados

### T-05 — Implementar service de geocodificação

- **Descrição:** consultar a API de geocoding e converter respostas válidas em
  cidades do domínio.
- **Tipo:** Data · **Prioridade:** P0 · **Tamanho:** M
- **Requisitos:** FR-01, FR-06; AC-01.1, AC-01.2, AC-01.3, AC-01.4, AC-01.6,
  AC-01.7, AC-06.2, AC-06.3, AC-06.4.
- **Critérios de aceite:**
  - Envia `name` após trim, `count=10`, `language=pt` e `format=json` para a
    URL definida no plano; `URLSearchParams` preserva e escapa caracteres
    acentuados, espaços, apóstrofos e hífens.
  - Mapeia identificador, nome, país e coordenadas para `City`; região, código
    do país e fuso permanecem opcionais quando ausentes.
  - Retorna lista vazia quando não há resultados; não seleciona uma cidade nem
    inicia consulta de clima.
  - Falha de rede, HTTP/API ou payload inválido é exposta como erro tipado;
    timeout encerra a requisição em 10 segundos com `AbortController`.
  - Aceita sinal de cancelamento para permitir substituição de requisições.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/services/geocodingService.ts`.

### T-06 — Implementar service de previsão

- **Descrição:** consultar a Forecast API usando coordenadas e mapear clima
  atual e previsão para o modelo de domínio.
- **Tipo:** Data · **Prioridade:** P0 · **Tamanho:** M
- **Requisitos:** FR-02, FR-03, FR-06, FR-07; AC-02.1, AC-02.3, AC-03.1 a
  AC-03.4, AC-06.3, AC-06.4, AC-06.6, AC-07.2.
- **Critérios de aceite:**
  - Envia latitude/longitude, os campos `current` e `daily` especificados,
    `temperature_unit=celsius`, `wind_speed_unit=kmh`, `timezone=auto` e
    `forecast_days=5`.
  - Mapeia timezone, seção atual e arrays diários por índice para
    `WeatherData`; o modelo recebe temperaturas em Celsius.
  - Clima atual com algum campo obrigatório ausente fica indisponível, sem
    substituir campos por zero.
  - Cada dia exige data, código WMO, mínima, máxima e probabilidade; arrays
    ausentes, curtos ou inválidos tornam indisponíveis somente os dias afetados,
    preservando os completos.
  - Código WMO desconhecido recebe a descrição neutra de T-03 sem invalidar
    demais valores.
  - Resposta incompatível, falha HTTP/API ou de rede é exposta como erro; a
    chamada tem timeout de 10 segundos, cancelamento e não implementa retry
    automático.
- **Dependências:** T-01, T-03.
- **Arquivos prováveis:** `src/services/forecastService.ts`.

## Entrega 3 — Orquestração do fluxo

### T-07 — Criar hook de busca e consulta do clima

- **Descrição:** coordenar validação da busca, seleção explícita e consulta de
  clima, expondo estados e ações para a tela.
- **Tipo:** Data · **Prioridade:** P0 · **Tamanho:** M
- **Requisitos:** FR-01, FR-02, FR-03, FR-06; AC-01.2, AC-01.5, AC-01.6,
  AC-02.1, AC-06.1 a AC-06.3.
- **Critérios de aceite:**
  - Expor estados discriminados de busca e previsão, resultados, cidade
    selecionada, dados atuais e ações de busca, seleção e retry.
  - Busca é trimada; string vazia informa a necessidade de nome e não chama
    geocoding.
  - Resultados de geocoding não selecionam cidade automaticamente; somente a
    seleção explícita chama o service de previsão.
  - Uma nova busca/seleção limpa dados anteriores que poderiam parecer atuais;
    erro comunica falha e permite tentativa manual.
  - Busca sem resultados gera `empty`, distinto de `loading` ou `error`.
- **Dependências:** T-01, T-05, T-06.
- **Arquivos prováveis:** `src/hooks/useWeatherApp.ts`.

### T-08 — Persistir e aplicar unidade escolhida

- **Descrição:** integrar a preferência de unidade ao hook, mantendo Celsius
  como padrão e tratando falhas de armazenamento.
- **Tipo:** Data · **Prioridade:** P1 · **Tamanho:** P
- **Requisitos:** FR-04; AC-02.2, AC-03.3, AC-04.1 a AC-04.4.
- **Critérios de aceite:**
  - Unidade inicial é Celsius quando não há preferência local válida.
  - Alterar unidade atualiza o estado em memória e persiste somente a
    preferência; leitura/gravação indisponível não impede o uso durante a
    sessão.
  - Não dispara nova requisição meteorológica ao trocar unidade.
  - Nenhum dado além da unidade é armazenado em `localStorage`.
- **Dependências:** T-01, T-02, T-07.
- **Arquivos prováveis:** `src/hooks/useWeatherApp.ts`.

### T-09 — Integrar geolocalização e recuperação de requisições

- **Descrição:** oferecer consulta por localização após ação explícita e
  gerenciar timeout, retry e chamadas substituídas.
- **Tipo:** Data · **Prioridade:** P1 · **Tamanho:** M
- **Requisitos:** FR-05, FR-06; AC-05.1 a AC-05.4, AC-06.1, AC-06.3 a AC-06.5.
- **Critérios de aceite:**
  - Browser não solicita localização ao abrir a aplicação; somente ação
    explícita inicia a geolocalização.
  - Coordenadas obtidas são usadas apenas na consulta solicitada e não são
    persistidas; permissão negada, API indisponível ou falha da operação
    comunicam erro e mantêm busca manual disponível.
  - Retry é manual e inicia uma nova chamada; não há loop de retry automático.
  - Requisição substituída é cancelada ou ignorada, sem permitir que resposta
    fora de ordem sobrescreva estado mais recente.
  - Timeout de 10 segundos chega à interface como falha recuperável.
- **Dependências:** T-07.
- **Arquivos prováveis:** `src/hooks/useWeatherApp.ts`.

## Entrega 4 — Componentes e integração visual

### T-10 — Implementar formulário de busca acessível

- **Descrição:** permitir inserir e enviar nome de cidade sem autosuggest.
- **Tipo:** UI · **Prioridade:** P0 · **Tamanho:** P
- **Requisitos:** FR-01, FR-06; AC-01.1, AC-01.3, AC-01.6, AC-01.7.
- **Critérios de aceite:**
  - Input tem rótulo acessível e envio explícito por botão e teclado.
  - Envia o texto ao callback do pai sem implementar requisição ou autosuggest.
  - Estados de envio impedem ação duplicada e não removem a possibilidade de
    nova busca.
- **Dependências:** T-07.
- **Arquivos prováveis:** `src/components/CitySearch.tsx`.

### T-11 — Apresentar resultados de cidades selecionáveis

- **Descrição:** listar resultados de geocodificação e comunicar informações
  suficientes para distinguir homônimos.
- **Tipo:** UI · **Prioridade:** P0 · **Tamanho:** P
- **Requisitos:** FR-01; AC-01.1, AC-01.2, AC-01.4, AC-01.5.
- **Critérios de aceite:**
  - Cada opção mostra cidade, região/estado e país quando disponíveis.
  - Resultados são controles acessíveis e selecionáveis por teclado; nenhum
    vem selecionado por padrão.
  - Nenhuma consulta de clima é iniciada pela simples renderização da lista.
- **Dependências:** T-01, T-07.
- **Arquivos prováveis:** `src/components/CityResults.tsx`.

### T-12 — Implementar seletor de unidade

- **Descrição:** criar controle acessível para alternar Celsius/Fahrenheit.
- **Tipo:** UI · **Prioridade:** P1 · **Tamanho:** P
- **Requisitos:** FR-04; AC-04.1, AC-04.2.
- **Critérios de aceite:**
  - Controle nomeado acessivelmente apresenta as opções Celsius e Fahrenheit e
    comunica qual está selecionada.
  - Alterar opção chama callback do hook sem iniciar chamadas de rede.
  - Funciona por teclado.
- **Dependências:** T-08.
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`.

### T-13 — Implementar mensagens de estado e recuperação

- **Descrição:** apresentar estados de carregamento, vazio, falha e
  indisponibilidade parcial com ação de retry quando pertinente.
- **Tipo:** UI · **Prioridade:** P0 · **Tamanho:** P
- **Requisitos:** FR-02, FR-03, FR-06; AC-02.3, AC-03.4, AC-06.1 a AC-06.5.
- **Critérios de aceite:**
  - Loading, empty e erro possuem mensagens distintas e compreensíveis em
    pt-BR.
  - Erros recuperáveis mostram ação de retry acionável por teclado.
  - Seção atual ou dia indisponível é identificado sem apresentar zero ou
    informação fabricada; busca manual segue acessível em falha de localização.
- **Dependências:** T-01, T-07, T-09.
- **Arquivos prováveis:** `src/components/StatusMessage.tsx`.

### T-14 — Apresentar cartão de clima atual

- **Descrição:** renderizar valores atuais válidos e suas unidades.
- **Tipo:** UI · **Prioridade:** P0 · **Tamanho:** P
- **Requisitos:** FR-02, FR-04, FR-07; AC-02.1 a AC-02.3, AC-04.2, AC-07.1.
- **Critérios de aceite:**
  - Exibe temperatura, sensação térmica, condição pt-BR, umidade e vento em
    km/h com unidades identificadas.
  - Temperaturas exibidas usam a unidade corrente por meio de T-02; vento e
    percentuais permanecem inalterados.
  - Se `current` estiver indisponível, apresenta estado indisponível, sem
    fabricar valores.
- **Dependências:** T-02, T-03, T-04, T-08.
- **Arquivos prováveis:** `src/components/CurrentWeatherCard.tsx`.

### T-15 — Apresentar previsão de cinco dias

- **Descrição:** renderizar datas, condições e valores diários no fuso e unidade
  selecionados.
- **Tipo:** UI · **Prioridade:** P0 · **Tamanho:** M
- **Requisitos:** FR-03, FR-04, FR-07; AC-03.1 a AC-03.4, AC-04.2, AC-07.1,
  AC-07.2.
- **Critérios de aceite:**
  - Exibe os dias retornados para hoje e os quatro dias seguintes, com data,
    condição, mínima, máxima e probabilidade em cada dia completo.
  - Data `YYYY-MM-DD` conserva o calendário do destino; mínima e máxima usam a
    unidade selecionada e todas as unidades/percentuais permanecem identificadas.
  - Dia incompleto aparece como indisponível e não impede exibição dos dias
    completos.
- **Dependências:** T-02, T-03, T-04, T-08.
- **Arquivos prováveis:** `src/components/ForecastList.tsx`.

### T-16 — Integrar tela e layout responsivo

- **Descrição:** conectar hook e componentes em uma tela funcional e aplicar o
  layout dark glassmorphism responsivo.
- **Tipo:** UI · **Prioridade:** P0 · **Tamanho:** M
- **Requisitos:** FR-01 a FR-07; AC-01.1 a AC-07.2; NFR-01, NFR-03, NFR-07,
  NFR-08.
- **Critérios de aceite:**
  - Tela conecta busca, seleção, consulta, retry, localização e unidade ao
    `useWeatherApp`, sem colocar lógica HTTP nos componentes.
  - Loading, erro, empty, dados completos e parciais são exibidos sem dados
    anteriores aparentarem atuais.
  - Layout funciona a partir de 320 px até desktop, sem rolagem horizontal;
    foco visível, contraste e nomes acessíveis são preservados.
  - Entrada principal da aplicação carrega a tela sem erros de console.
- **Dependências:** T-07 a T-15.
- **Arquivos prováveis:** `src/App.tsx`, `src/index.css`.

## Entrega 5 — Testes unitários, UI e E2E

### T-17 — Testar conversão e formatação

- **Descrição:** cobrir as funções puras de unidade, mapeamento WMO e
  apresentação regional.
- **Tipo:** Test · **Prioridade:** P0 · **Tamanho:** M
- **Requisitos:** FR-02, FR-03, FR-04, FR-06, FR-07; AC-02.2, AC-03.2,
  AC-03.3, AC-04.2, AC-06.6, AC-07.1, AC-07.2.
- **Critérios de aceite:**
  - Testes unitários verificam conversão Celsius/Fahrenheit nos dois sentidos,
    valores negativos e zero, identidade na mesma unidade e ausência de
    arredondamento implícito.
  - Testes verificam códigos WMO conhecidos e desconhecidos.
  - Testes verificam locale pt-BR e que datas `YYYY-MM-DD` não mudam de dia em
    fusos de dispositivo diferentes.
  - `pnpm test -- tests/lib/weatherUtils.test.ts` executa os testes adicionados
    com sucesso.
- **Dependências:** T-02, T-03, T-04.
- **Arquivos prováveis:** `tests/lib/weatherUtils.test.ts`.

### T-18 — Testar geocodificação com fetch mockado

- **Descrição:** verificar contrato HTTP, mapeamento e falhas do service de
  geocoding sem acessar a rede.
- **Tipo:** Test · **Prioridade:** P0 · **Tamanho:** M
- **Requisitos:** FR-01, FR-06; AC-01.1 a AC-01.7, AC-06.2 a AC-06.5.
- **Critérios de aceite:**
  - `fetch` mockado confirma URL, parâmetros, escaping do nome e mapeamento dos
    campos opcionais.
  - Casos cobrem lista vazia, erro HTTP/API, rejeição de rede, payload inválido,
    timeout após 10 segundos e cancelamento.
  - Os testes falham se a função iniciar seleção implícita ou retry automático.
- **Dependências:** T-05.
- **Arquivos prováveis:** `tests/services/geocodingService.test.ts`.

### T-19 — Testar previsão com fetch mockado

- **Descrição:** verificar contrato HTTP, conversão para o domínio e tolerância a
  respostas parciais do Forecast service.
- **Tipo:** Test · **Prioridade:** P0 · **Tamanho:** M
- **Requisitos:** FR-02, FR-03, FR-06, FR-07; AC-02.1, AC-02.3, AC-03.1 a
  AC-03.4, AC-06.3, AC-06.4, AC-06.6, AC-07.2.
- **Critérios de aceite:**
  - `fetch` mockado confirma coordenadas, todos os parâmetros da previsão,
    timeout de 10 segundos e cancelamento.
  - Casos verificam mapeamento de resposta completa, timezone e cinco dias,
    campo atual ausente, arrays diários curtos/desalinhados, dia incompleto,
    código desconhecido, resposta vazia/inválida, falha HTTP/API, rede, timeout
    e cancelamento.
  - Asserções confirmam que nenhum campo ausente é convertido em zero e que um
    dia completo não é descartado por outro incompleto.
- **Dependências:** T-06.
- **Arquivos prováveis:** `tests/services/forecastService.test.ts`.

### T-20 — Testar estados e ações do hook

- **Descrição:** cobrir transições, efeitos colaterais e recuperação do hook com
  services e geolocalização controlados.
- **Tipo:** Test · **Prioridade:** P0 · **Tamanho:** M
- **Requisitos:** FR-01, FR-04, FR-05, FR-06; AC-01.2, AC-01.6, AC-04.1 a
  AC-04.4, AC-05.1 a AC-05.4, AC-06.1 a AC-06.5.
- **Critérios de aceite:**
  - Testes cobrem busca vazia sem chamada, seleção explícita, loading, sucesso,
    empty, erro, retry manual e remoção de dados anteriores.
  - Testes cobrem unidade inicial/persistida, falhas de `localStorage` e troca
    sem nova chamada de forecast.
  - Testes cobrem localização somente após ação, sucesso sem persistir
    coordenadas, erro/permissão negada e busca manual ainda disponível.
  - Teste de concorrência confirma que resultado de requisição substituída não
    altera o estado mais recente.
- **Dependências:** T-07, T-08, T-09.
- **Arquivos prováveis:** `tests/hooks/useWeatherApp.test.ts`.

### T-21 — Testar formulário, resultados e unidade

- **Descrição:** verificar interação acessível dos componentes de entrada e
  seleção.
- **Tipo:** Test · **Prioridade:** P1 · **Tamanho:** M
- **Requisitos:** FR-01, FR-04; AC-01.1 a AC-01.7, AC-04.1, AC-04.2.
- **Critérios de aceite:**
  - Testing Library verifica labels, envio por teclado, apresentação de
    homônimos e ausência de seleção automática.
  - Testes verificam seleção explícita e callbacks de Celsius/Fahrenheit por
    interação de usuário.
- **Dependências:** T-10, T-11, T-12.
- **Arquivos prováveis:** `tests/components/CitySearch.test.tsx`,
  `tests/components/CityResults.test.tsx`.

### T-22 — Testar estados visuais de carregamento, erro e vazio

- **Descrição:** testar mensagens e operações de recuperação apresentadas pelos
  componentes para cada estado da consulta.
- **Tipo:** Test · **Prioridade:** P0 · **Tamanho:** M
- **Requisitos:** FR-02, FR-03, FR-05, FR-06; AC-02.3, AC-03.4, AC-05.3,
  AC-06.1 a AC-06.5.
- **Critérios de aceite:**
  - Testing Library cobre explicitamente estados **loading**, **erro** e
    **vazio**, verificando texto e semântica acessíveis.
  - Retry é acionável por teclado e chama o callback uma vez por ação.
  - Indisponibilidade de clima/dia não mostra valores inventados e falha de
    localização não remove a busca manual.
- **Dependências:** T-13, T-14, T-15.
- **Arquivos prováveis:** `tests/components/StatusMessage.test.tsx`,
  `tests/components/WeatherDisplay.test.tsx`.

### T-23 — Configurar execução E2E no Playwright

- **Descrição:** preparar configuração de browser e servidor local para executar
  testes E2E de forma repetível.
- **Tipo:** Infra · **Prioridade:** P1 · **Tamanho:** P
- **Requisitos:** NFR-02, NFR-03.
- **Critérios de aceite:**
  - Playwright inicia a aplicação Vite em modo de teste e suporta Chromium,
    WebKit e Firefox conforme dependências disponíveis.
  - A configuração permite definir viewport e simular permissões de
    geolocalização; execução não depende de API meteorológica real.
  - O script existente `pnpm test:e2e` executa os testes sem modificar
    dependências quando a configuração atual já for suficiente.
- **Dependências:** T-16.
- **Arquivos prováveis:** `playwright.config.ts`.

### T-24 — Testar fluxo principal ponta a ponta

- **Descrição:** validar busca, seleção explícita, previsão e persistência de
  unidade no browser.
- **Tipo:** Test · **Prioridade:** P0 · **Tamanho:** M
- **Requisitos:** FR-01 a FR-04, FR-07; AC-01.1 a AC-01.5, AC-02.1, AC-03.1 a
  AC-03.3, AC-04.1 a AC-04.3, AC-07.1, AC-07.2.
- **Critérios de aceite:**
  - API é interceptada; fluxo busca cidade, seleciona resultado e confirma clima
    atual e cinco dias previstos.
  - Nenhum forecast ocorre antes da seleção explícita.
  - Alternar unidade atualiza temperaturas sem outra chamada; recarregar
    restaura a preferência.
- **Dependências:** T-16, T-23.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`.

### T-25 — Testar resiliência e localização ponta a ponta

- **Descrição:** cobrir erros, retry manual, dados parciais e geolocalização
  simulada nos fluxos do browser.
- **Tipo:** Test · **Prioridade:** P1 · **Tamanho:** M
- **Requisitos:** FR-05, FR-06; AC-05.1 a AC-05.4, AC-06.1 a AC-06.6.
- **Critérios de aceite:**
  - Testes verificam ausência de solicitação de localização no carregamento e
    consulta por coordenadas somente após ação explícita.
  - Permissão negada/falha mantém busca manual; coordenadas não são gravadas em
    armazenamento local.
  - API interceptada simula erro, lentidão/timeout e payload parcial; retry é
    manual, não há retry automático e dados antigos não parecem atuais.
- **Dependências:** T-16, T-23.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`.

### T-26 — Validar fluxo mobile e ausência de overflow

- **Descrição:** verificar fluxo essencial e operabilidade em viewport mobile,
  incluindo largura mínima definida na spec.
- **Tipo:** Test · **Prioridade:** P1 · **Tamanho:** M
- **Requisitos:** FR-01 a FR-06; NFR-01, NFR-03.
- **Critérios de aceite:**
  - Fluxo principal é executado em 320 px, viewport mobile comum e desktop.
  - Em cada viewport não há rolagem horizontal e os controles de busca,
    seleção, unidade e retry permanecem operáveis.
  - Verificações de teclado e foco visível cobrem os controles essenciais.
- **Dependências:** T-16, T-23, T-24.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`.

## Entrega 6 — Hardening

### T-27 — Verificar acessibilidade, compatibilidade e metas operacionais

- **Descrição:** executar a revisão final de qualidade da v1 e registrar
  resultados, limitações e gates de publicação sem ampliar o escopo funcional.
- **Tipo:** Infra · **Prioridade:** P2 · **Tamanho:** M
- **Requisitos:** NFR-02, NFR-03, NFR-04, NFR-05, NFR-06, NFR-07; gates de
  publicação listados na spec.
- **Critérios de aceite:**
  - Revisão verifica teclado, nomes acessíveis, foco visível e contraste como
    meta WCAG 2.2 AA; registra falhas com evidência e correções necessárias.
  - Smoke checks documentam browsers alvo: duas versões estáveis mais recentes
    de Chrome, Safari, Firefox e Edge; automação cobre Chromium, WebKit e
    Firefox.
  - Medição em conexão estável registra renderização inicial (meta até 2 s) e
    busca/previsão (p95 até 3 s, incluindo provedor) sem afirmar conformidade
    sem perfil de medição definido.
  - Antes da publicação, ficam identificados como gates a validação de termos,
    atribuição e limites da Open-Meteo, hospedagem/SLO e perfil de medição p95.
  - Checklist final registra execução de `pnpm lint`, `pnpm build`, `pnpm test`
    e `pnpm test:e2e`, com resultado ou bloqueio explícito.
- **Dependências:** T-18, T-19, T-21 a T-26.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`,
  `tasks/weather-app-tasks.md` (registro do resultado/gates, se necessário).

## Rastreabilidade de requisitos funcionais

| Requisito da spec | Critérios associados | Tarefas que implementam ou verificam |
| --- | --- | --- |
| FR-01 — Buscar cidade | AC-01.1–AC-01.7 | T-01, T-05, T-18, T-07, T-10, T-11, T-16, T-21, T-24 |
| FR-02 — Consultar clima atual | AC-02.1–AC-02.3 | T-01, T-03, T-06, T-19, T-07, T-13, T-14, T-16, T-22, T-24 |
| FR-03 — Consultar previsão diária | AC-03.1–AC-03.4 | T-01, T-04, T-06, T-19, T-07, T-15, T-16, T-22, T-24 |
| FR-04 — Alternar unidade | AC-04.1–AC-04.4 | T-01, T-02, T-17, T-08, T-12, T-14, T-15, T-21, T-24 |
| FR-05 — Consultar localização atual | AC-05.1–AC-05.4 | T-07, T-09, T-20, T-13, T-16, T-22, T-25 |
| FR-06 — Estados e recuperação | AC-06.1–AC-06.6 | T-01, T-03, T-05, T-06, T-18, T-19, T-07, T-09, T-20, T-13, T-16, T-22, T-25 |
| FR-07 — Datas e números localizados | AC-07.1–AC-07.2 | T-03, T-04, T-06, T-17, T-14, T-15, T-16, T-24 |

Todos os requisitos funcionais FR-01 a FR-07 têm tarefas de implementação e
verificação. Os critérios NFR e os gates operacionais são cobertos pelo
hardening T-27; não há requisito funcional da spec sem tarefa correspondente.

## Sequência sugerida em fatias verticais

As fatias entregam valor observável cedo, mantendo as dependências internas
acima como pré-requisitos:

1. **Consulta por cidade visível:** T-01 → T-02 → T-03 → T-04 → T-05 → T-06 →
   T-07 → T-08 → T-09 → T-10 → T-11 → T-12 → T-13 → T-14 → T-15 → T-16.
   Entrega busca, seleção explícita, clima atual, previsão, unidade e os estados
   essenciais numa primeira fatia funcional.
2. **Confiança automatizada:** T-17 → T-18 → T-19 → T-20 → T-21 → T-22.
   Confirma conversões, mapeamento, formatação, services, hook e estados dos
   componentes.
3. **Fluxos ponta a ponta e mobile:** T-23 → T-24 → T-25 → T-26. Valida fluxo
   principal, recuperação, geolocalização e viewports mobile/desktop.
4. **Prontidão operacional:** T-27. Verifica acessibilidade, compatibilidade,
   metas de desempenho e gates de publicação.

## Prompt de implementação — T-01

> **Contexto:** implemente T-01 do backlog do Weather App. Este projeto usa
> TypeScript strict, React e Vite; os contratos compartilhados ficam em
> `src/types/`. Siga o modelo de domínio definido no plano técnico: temperaturas
> são armazenadas em Celsius; a previsão representa dias incompletos sem
> inventar valores; cidade e fuso podem ser opcionais conforme a resposta da
> Open-Meteo. Não implemente interface, chamadas HTTP, persistência ou lógica de
> conversão nesta tarefa.
>
> **Arquivo escopado:** crie `src/types/weather.ts`. Não altere arquivos fora
> deste escopo, exceto se uma configuração indispensável de TypeScript exigir
> ajuste; justifique qualquer desvio. Reutilize convenções já presentes no
> repositório e evite `any`.
>
> **Critérios de aceite:** exporte `Unit = 'celsius' | 'fahrenheit'`.
> `City` deve conter `id: number`, `name: string`, `admin1?: string`,
> `country: string`, `countryCode?: string`, `latitude: number`,
> `longitude: number` e `timezone?: string`. `CurrentWeather` deve conter
> `time: string`, `temperatureC: number`, `apparentTemperatureC: number`,
> `weatherCode: number`, `condition: string`,
> `relativeHumidityPercent: number` e `windSpeedKmh: number`.
> `ForecastDay` deve conter `date: string`, `available: boolean`,
> `weatherCode: number | null`, `condition: string | null`,
> `minTemperatureC: number | null`, `maxTemperatureC: number | null` e
> `precipitationProbabilityPercent: number | null`. `WeatherData` deve conter
> `city: City | null`, `timezone: string`, `current: CurrentWeather | null` e
> `forecast: ForecastDay[]`. Ausências devem ser representadas como `null` ou
> indisponíveis, nunca como zero fictício.
>
> Exporte estados discriminados pela propriedade `status`: busca com
> `idle | loading | success | empty | error` e previsão com
> `idle | loading | success | error`. O sucesso de busca deve carregar os
> resultados `City[]`; o sucesso de previsão deve carregar `WeatherData`; o
> estado de erro deve carregar erro tipado. Erros devem distinguir ao menos
> rede/API, resposta inválida e timeout. Todos os tipos devem compilar em
> TypeScript strict sem `any`.
>
> **Validação:** execute `pnpm build` se a estrutura de código já estiver
> disponível; caso contrário, confirme que os tipos são compatíveis com o
> `tsconfig` do projeto e informe claramente qualquer bloqueio de build. Não
> adicione testes ou dependências nesta tarefa. Ao concluir, liste arquivo
> alterado, decisões de tipagem e resultado da validação.
