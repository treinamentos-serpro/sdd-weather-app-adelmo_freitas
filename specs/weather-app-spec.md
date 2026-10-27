# Especificação do Produto — Weather App

## Overview

Aplicação web responsiva para consultar o clima atual de uma cidade e planejar os cinco dias que começam hoje. A pessoa usuária pode buscar uma cidade ou, após uma ação explícita e consentimento do browser, consultar a localização atual. A interface é em pt-BR, inicia em Celsius e oferece Fahrenheit.

O produto prioriza consultas rápidas em dispositivos móveis. Não exige conta, depende de conexão e usa Open-Meteo para geocodificação e previsão. Esta especificação é a fonte de verdade funcional da v1; decisões de hospedagem e validações externas pré-lançamento estão registradas em Open Questions.

## Functional Requirements

- **FR-01 — Buscar cidade:** permitir busca manual por nome, enviada explicitamente; não oferecer autosuggest. Após a consulta, apresentar os resultados de geocodificação com cidade, região/estado quando disponível e país. A pessoa usuária deve selecionar um resultado antes de consultar o clima. Quando houver homônimos, os dados de localização devem permitir distingui-los.
- **FR-02 — Consultar clima atual:** para o local selecionado, apresentar temperatura, sensação térmica, condição meteorológica, umidade relativa e velocidade do vento em km/h. A condição deve ter uma descrição em pt-BR.
- **FR-03 — Consultar previsão diária:** apresentar cinco dias no fuso local do destino, incluindo hoje e os quatro dias seguintes. Para cada dia, apresentar data, resumo da condição, temperaturas mínima e máxima e probabilidade de precipitação.
- **FR-04 — Alternar unidade de temperatura:** oferecer Celsius e Fahrenheit. A unidade escolhida deve ser aplicada a todas as temperaturas atuais e previstas e persistida localmente no browser. A unidade inicial é Celsius.
- **FR-05 — Consultar localização atual:** oferecer uma ação explícita para solicitar a geolocalização do browser. Usar as coordenadas somente para a consulta solicitada; não persistir coordenadas. Se o acesso não estiver disponível ou for negado/falhar, manter a busca manual disponível.
- **FR-06 — Comunicar estados e permitir recuperação:** informar carregamento, ausência de resultados e falhas de busca ou previsão. Em falhas recuperáveis, oferecer nova tentativa. Não apresentar dados de uma consulta anterior como se fossem atuais para a consulta solicitada.
- **FR-07 — Apresentar datas e números localizados:** exibir textos e formatos de data/número em pt-BR. As datas da previsão devem corresponder ao fuso horário do local consultado.

## User Stories

- **US-01 (FR-01, FR-02):** Como **Decisor do dia a dia**, quero buscar e selecionar minha cidade para consultar rapidamente o clima antes de sair.
- **US-02 (FR-02):** Como **Decisor do dia a dia**, quero ver temperatura, sensação térmica, condição, umidade e vento para decidir o que vestir ou levar.
- **US-03 (FR-03):** Como **Viajante planejador**, quero consultar a previsão diária de hoje e dos quatro dias seguintes para planejar roupas e atividades no destino.
- **US-04 (FR-04):** Como **Viajante planejador**, quero alternar entre Celsius e Fahrenheit para interpretar as temperaturas na unidade que uso.
- **US-05 (FR-05):** Como **Decisor do dia a dia**, quero consultar o clima da minha localização após autorizar o acesso para evitar digitar uma cidade quando estou em deslocamento.
- **US-06 (FR-06, FR-07):** Como **Viajante planejador**, quero receber mensagens claras sobre carregamento, ausência de resultados ou falhas e ver datas no horário local do destino para saber se os dados estão disponíveis e a que dia se referem.

## Acceptance Criteria

Os identificadores abaixo são critérios verificáveis. Cada requisito funcional possui ao menos um critério; os critérios estão referenciados na matriz de rastreabilidade.

### FR-01 — Buscar cidade

- **AC-01.1** — Given que a busca está disponível, When a pessoa envia um nome de cidade não vazio, Then o sistema consulta a geocodificação e apresenta os resultados retornados com cidade, região/estado e país quando esses dados estiverem disponíveis.
- **AC-01.2** — Given que a geocodificação retorna um ou mais resultados, When a lista é apresentada, Then nenhum resultado é selecionado implicitamente e a consulta de clima só começa depois da seleção explícita de um resultado.
- **AC-01.3** — Given que a busca contém espaços no início/fim, When ela é enviada, Then esses espaços são desconsiderados para validação e consulta.
- **AC-01.4** — Given que há mais de um resultado com o mesmo nome de cidade, When os resultados são exibidos, Then região/estado e país são mostrados quando disponíveis para permitir a distinção.
- **AC-01.5** — Given que a pessoa não selecionou um resultado, When a lista de resultados é exibida, Then nenhum clima é apresentado como pertencente a uma cidade selecionada.
- **AC-01.6** — Given que o campo está vazio ou contém somente espaços, When a pessoa envia a busca, Then a aplicação informa que um nome de cidade é necessário e não envia uma consulta de geocodificação.
- **AC-01.7** — Given que o nome contém letras acentuadas, espaços, apóstrofos ou hífens, When a busca é enviada, Then esses caracteres são preservados como parte do nome consultado e não são tratados como conteúdo executável.

### FR-02 — Consultar clima atual

- **AC-02.1** — Given que um resultado de cidade foi selecionado e a resposta contém os dados atuais requeridos, When a consulta termina, Then são exibidos temperatura, sensação térmica, condição em pt-BR, umidade relativa e vento em km/h para o mesmo local.
- **AC-02.2** — Given que a temperatura está em Fahrenheit, When o clima atual é apresentado, Then todas as temperaturas atuais usam Fahrenheit e a unidade é identificada junto ao valor.
- **AC-02.3** — Given que a resposta não contém um ou mais campos obrigatórios do clima atual, When a resposta é apresentada, Then a seção de clima atual é identificada como indisponível e os campos ausentes não são inventados ou substituídos por zero.

### FR-03 — Consultar previsão diária

- **AC-03.1** — Given que um local foi selecionado e a previsão está disponível, When a consulta termina, Then são exibidas exatamente as datas locais de hoje e dos quatro dias seguintes, com resumo, mínima, máxima e probabilidade de precipitação para cada dia completo.
- **AC-03.2** — Given que o local selecionado tem fuso horário informado, When as datas da previsão são apresentadas, Then a data de cada dia corresponde ao calendário nesse fuso, inclusive quando difere do fuso do dispositivo.
- **AC-03.3** — Given que a unidade selecionada é Celsius ou Fahrenheit, When a previsão é apresentada, Then mínimas e máximas usam a unidade selecionada, identificada junto aos valores.
- **AC-03.4** — Given que a resposta de previsão contém dias incompletos, When ela é apresentada, Then dias sem todos os dados requeridos são identificados como indisponíveis e não recebem valores fabricados; dias completos continuam visíveis.

### FR-04 — Alternar unidade de temperatura

- **AC-04.1** — Given que a aplicação está na primeira visita e não há preferência local válida, When as temperaturas são exibidas, Then a unidade é Celsius.
- **AC-04.2** — Given que há temperaturas atuais ou previstas na tela, When a pessoa seleciona Fahrenheit ou Celsius, Then todos os valores de temperatura visíveis passam à unidade escolhida sem alterar umidade, vento ou probabilidade de precipitação.
- **AC-04.3** — Given que a pessoa alterou a unidade e o armazenamento local está disponível, When ela recarrega a aplicação no mesmo browser, Then a preferência escolhida é restaurada.
- **AC-04.4** — Given que o armazenamento local está indisponível ou falha, When a pessoa altera a unidade, Then a preferência permanece durante a sessão atual e a aplicação continua utilizável; em nova sessão sem preferência recuperável, inicia em Celsius.

### FR-05 — Consultar localização atual

- **AC-05.1** — Given que a pessoa ainda não solicitou localização, When a aplicação é aberta, Then o browser não recebe solicitação de geolocalização.
- **AC-05.2** — Given que a pessoa aciona a consulta por localização, When concede permissão e o browser retorna coordenadas, Then a aplicação solicita o clima para essas coordenadas e não as persiste após a consulta.
- **AC-05.3** — Given que a permissão é negada, a geolocalização falha ou não é suportada, When a tentativa termina, Then a aplicação informa que não conseguiu obter a localização e mantém a busca manual disponível.
- **AC-05.4** — Given que a pessoa autorizou a localização, When as coordenadas são enviadas para obter dados, Then elas são usadas somente pelo provedor para a consulta solicitada e não são guardadas como histórico pelo app.

### FR-06 — Comunicar estados e permitir recuperação

- **AC-06.1** — Given que a pessoa envia uma busca ou seleciona localização, When a consulta está em andamento, Then a interface indica carregamento e impede que valores da consulta anterior sejam confundidos com o resultado solicitado.
- **AC-06.2** — Given que a geocodificação retorna uma lista vazia, When a consulta termina, Then a interface informa que nenhum local foi encontrado e permite iniciar outra busca.
- **AC-06.3** — Given que a rede ou o provedor retorna falha, When a consulta termina, Then a interface comunica que os dados não puderam ser obtidos, não apresenta dados antigos como atuais e oferece ação de nova tentativa.
- **AC-06.4** — Given que uma requisição permanece sem resposta por 10 segundos, When o limite é atingido, Then ela é encerrada como timeout, a falha é comunicada e uma nova tentativa manual fica disponível.
- **AC-06.5** — Given que a pessoa aciona nova tentativa após uma falha, When a conexão está disponível, Then a aplicação faz uma nova consulta e apresenta o resultado dessa tentativa, sem iniciar retries automáticos em loop.
- **AC-06.6** — Given que o serviço retorna um código de condição desconhecido, When a condição é exibida, Then a aplicação usa um rótulo neutro de condição indisponível e mantém os demais dados válidos.

### FR-07 — Apresentar datas e números localizados

- **AC-07.1** — Given que a aplicação apresenta conteúdo textual, When a interface é renderizada, Then os textos e formatos de data/número estão em pt-BR.
- **AC-07.2** — Given que os dados incluem a previsão de um local com fuso conhecido, When as datas são renderizadas, Then elas usam o fuso do local, não o fuso do dispositivo.

## Non-Functional Requirements

- **NFR-01 — Responsividade:** suportar larguras de viewport a partir de 320 px até desktop; o conteúdo principal não deve exigir rolagem horizontal.
- **NFR-02 — Compatibilidade:** suportar as duas versões estáveis mais recentes de Chrome, Safari, Firefox e Edge.
- **NFR-03 — Acessibilidade:** ter WCAG 2.2 nível AA como meta; todas as funções devem ser utilizáveis por teclado, controles devem ter nomes acessíveis e o conteúdo deve manter contraste adequado.
- **NFR-04 — Performance:** buscar renderização inicial em até 2 s e resposta de busca/previsão em até 3 s no percentil 95 em conexão estável. A medição da resposta inclui o tempo do provedor externo; timeout funcional é definido em AC-06.4.
- **NFR-05 — Privacidade:** não exigir conta. Solicitar localização somente após ação explícita. Não armazenar coordenadas nem histórico no app; enviar coordenadas ao provedor apenas para obter os dados solicitados. A única preferência persistida localmente é a unidade.
- **NFR-06 — Resiliência:** a v1 requer conexão e não oferece modo offline nem cache de previsão. Falhas de rede/provedor devem ser comunicadas e permitir nova tentativa; dados anteriores não podem ser apresentados como atuais.
- **NFR-07 — Localização regional:** interface, mensagens e formatos devem estar em pt-BR; as datas da previsão devem usar o fuso do local consultado.
- **NFR-08 — Clareza dos dados:** valores devem incluir unidade, condição deve ter descrição compreensível e ausência de dados não pode ser representada por zero ou por informação inventada.

## Edge Cases

- **Cidade inexistente:** a busca retorna zero resultados; informar que nenhum local foi encontrado e permitir editar/enviar nova busca (AC-06.2).
- **Input vazio ou apenas espaços:** validar antes da consulta; não chamar geocodificação e solicitar um nome de cidade. O comportamento para espaços é verificável por AC-01.3; campo vazio segue a mesma regra de validação.
- **Caracteres especiais ou acentuados:** preservar letras acentuadas, espaços, apóstrofos e hífens válidos em nomes de lugares. Tratar os demais caracteres como texto de busca, sem executar conteúdo; se não houver resultado, comunicar lista vazia. Caracteres de controle não devem ser exibidos como conteúdo ativo.
- **Falha de API ou de rede:** informar indisponibilidade, não mostrar dados antigos como atuais e oferecer nova tentativa (AC-06.3).
- **Timeout:** encerrar a requisição que não respondeu em 10 segundos, informar timeout e permitir nova tentativa manual (AC-06.4 e AC-06.5).
- **Geocoding sem resultados:** mostrar estado vazio distinto de carregamento e falha; manter a busca disponível (AC-06.2).
- **Resposta parcial:** manter seções independentes. Exibir uma seção apenas se seus campos obrigatórios estiverem disponíveis; para previsão, manter dias completos e identificar dias incompletos como indisponíveis. Não inferir nem substituir campos ausentes (AC-02.3 e AC-03.4).
- **Resultados homônimos:** exibir os detalhes geográficos retornados e exigir seleção explícita (AC-01.2 e AC-01.4).
- **Permissão de localização negada ou indisponível:** explicar a falha e manter a busca manual como alternativa (AC-05.3).
- **Código meteorológico desconhecido:** usar rótulo neutro sem bloquear a apresentação dos outros campos válidos (AC-06.6).
- **Preferência local indisponível:** manter a escolha de unidade durante a sessão e usar Celsius na próxima sessão sem preferência restaurável (AC-04.4).

## Assumptions

- A v1 é um web app para browsers modernos; instalação como PWA não é necessária.
- Open-Meteo fornece geocodificação e previsão sem API key e os dados necessários à experiência inicial.
- O limite de 10 segundos é o prazo máximo de uma requisição de dados; retries são iniciados somente pela pessoa usuária.
- Campos obrigatórios de uma seção são os dados explicitamente listados no respectivo requisito funcional. Uma seção incompleta não invalida outra seção independente que esteja completa.
- A probabilidade de precipitação é exibida como percentual. A velocidade do vento é exibida em km/h e a umidade relativa em percentual.
- Não há backend próprio, autenticação ou persistência de dados de usuário no servidor na v1.
- A preferência de unidade pode ser persistida no armazenamento local do browser; nenhuma outra preferência ou dado de consulta precisa ser persistido.
- As metas de performance são objetivos para conexão estável e incluem o tempo do provedor externo, conforme NFR-04.

## Risks

| Risco | Probabilidade / impacto | Mitigação |
| --- | --- | --- |
| API lenta, indisponível ou com limites de uso | Média / alto | Tratar timeout e falhas, permitir retry manual e validar limites e condições do provedor antes do lançamento. |
| Seleção de cidade homônima ou incorreta | Média / alto | Mostrar cidade, região/estado e país quando disponíveis e exigir seleção explícita. |
| Negativa de permissão de geolocalização ou falta de confiança | Média / médio | Solicitar somente após ação explícita, explicar o uso e manter busca manual disponível. |
| Rede móvel instável impede atualização | Média / médio | Comunicar erro, permitir retry e deixar claro que não há modo offline nem dados atuais em cache. |
| Conversão de unidade ou fuso incorretos | Baixa / alto | Critérios específicos para todas as temperaturas e datas no fuso do local; validar em testes. |
| Compartilhamento inesperado de coordenadas | Baixa / alto | Não solicitar automaticamente, não persistir coordenadas e enviá-las somente ao provedor para a consulta iniciada. |
| Expectativa de previsão por hora | Média / médio | Informar no produto que a v1 oferece resumo diário e não inclui previsão horária. |
| Condições, atribuição ou limites do provedor incompatíveis com o lançamento | Desconhecida / alto | Validar termos, atribuição exigida e limites de requisição antes da publicação. |

## Out of Scope

- Previsão por hora ou período superior a hoje mais os quatro dias seguintes.
- Alertas meteorológicos, notificações ou atualização automática em background.
- Conta, autenticação, perfil ou sincronização entre dispositivos.
- Favoritos, histórico de buscas ou persistência de cidades consultadas.
- Modo offline ou cache de previsão para exibição sem conexão.
- Backend próprio para guardar dados ou coordenadas de usuários.
- Instalação como PWA, aplicativo nativo ou suporte a browsers fora da matriz definida.
- Interface em idiomas diferentes de pt-BR.
- Unidades de vento diferentes de km/h ou unidades de precipitação configuráveis.
- Comparação simultânea de cidades ou compartilhamento de consultas.

## Open Questions

Estas questões não impedem desenvolvimento e testes da v1; são gates de publicação ou operação:

- Quais condições de uso, atribuição e limites da Open-Meteo se aplicam ao lançamento? Validar com o provedor antes da publicação; a resposta pode exigir ajustes de atribuição, tráfego ou arquitetura.
- Qual provedor de hospedagem será usado e qual SLO de disponibilidade será adotado? Definir após a escolha da hospedagem; até lá não há meta numérica de disponibilidade na v1.
- Como será medido o percentil 95 das metas de performance em conexão estável no ambiente de produção? Definir o perfil de medição e a instrumentação antes de declarar conformidade operacional; isso não altera os limites funcionais já estabelecidos.

**Prontidão:** a especificação é suficiente para desenvolver e testar a v1 sem novas decisões de produto. Ela não é autorização de lançamento: as validações externas e operacionais listadas acima precisam ser concluídas antes da publicação.

## Rastreabilidade

| User Story | Requisitos funcionais | Acceptance Criteria | RNFs relevantes |
| --- | --- | --- | --- |
| US-01 | FR-01, FR-02 | AC-01.1–AC-01.5, AC-02.1 | NFR-01, NFR-02, NFR-03, NFR-04, NFR-07, NFR-08 |
| US-02 | FR-02 | AC-02.1–AC-02.3 | NFR-01, NFR-02, NFR-03, NFR-04, NFR-08 |
| US-03 | FR-03 | AC-03.1–AC-03.4 | NFR-01, NFR-02, NFR-03, NFR-04, NFR-07, NFR-08 |
| US-04 | FR-04 | AC-04.1–AC-04.4, AC-02.2, AC-03.3 | NFR-01, NFR-02, NFR-03, NFR-05, NFR-08 |
| US-05 | FR-05 | AC-05.1–AC-05.4 | NFR-01, NFR-02, NFR-03, NFR-05, NFR-06 |
| US-06 | FR-06, FR-07 | AC-06.1–AC-06.6, AC-07.1, AC-07.2 | NFR-01, NFR-02, NFR-03, NFR-04, NFR-06, NFR-07, NFR-08 |