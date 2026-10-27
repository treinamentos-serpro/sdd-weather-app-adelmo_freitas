# Discovery — Aplicação de previsão do tempo

## Contexto

Aplicação de previsão do tempo para buscar cidades, consultar o clima atual e ver uma previsão de cinco dias. A interface deve funcionar em dispositivos móveis e permitir alternar entre Celsius e Fahrenheit.

Em esclarecimentos anteriores, você confirmou estas decisões adicionais: usar a API de previsão do Open-Meteo (`https://api.open-meteo.com/v1/forecast`), considerar cinco dias como hoje e os quatro dias seguintes, oferecer geolocalização além da busca digitada, usar Celsius como unidade inicial e pt-BR como idioma da interface. Elas não constam no briefing reproduzido nesta solicitação.

## Requisitos Funcionais

- **RF1 — Buscar cidades:** permitir que a pessoa usuária informe uma cidade e escolha um resultado para consultar.
- **RF2 — Clima atual:** apresentar as condições atuais para a cidade escolhida.
- **RF3 — Previsão:** apresentar a previsão de hoje e dos quatro dias seguintes para a cidade escolhida.
- **RF4 — Unidade:** permitir alternar entre Celsius e Fahrenheit e atualizar os valores exibidos.
- **RF5 — Geolocalização:** oferecer uma opção para obter o clima da localização atual, sujeita à permissão do dispositivo ou navegador.

> Os detalhes de busca, dados meteorológicos exibidos e comportamento quando não há permissão ainda precisam ser definidos nas perguntas em aberto.

## Requisitos Não-Funcionais

- **RNF1 — Uso em dispositivos móveis (explícito):** a aplicação deve ser utilizável em dispositivos móveis. Larguras suportadas, critérios de layout e navegadores ainda não foram definidos.
- **RNF2 — Responsividade (a confirmar):** adaptar o conteúdo e os controles a diferentes tamanhos de tela, sem prejudicar a consulta da previsão.
- **RNF3 — Acessibilidade (a confirmar):** definir requisitos para teclado, leitores de tela, contraste e controles de toque.
- **RNF4 — Desempenho (a confirmar):** definir tempos aceitáveis para buscar uma cidade e carregar o clima e a previsão.
- **RNF5 — Resiliência (a confirmar):** definir o comportamento durante falhas de rede ou indisponibilidade da API.

Os RNFs marcados como “a confirmar” são questões para validação, não metas já aprovadas.

## Riscos

As probabilidades e os impactos abaixo são estimativas iniciais para discussão, não dados medidos.

| Risco | Probabilidade | Impacto | Mitigação proposta |
| --- | --- | --- | --- |
| A API ficar lenta, indisponível ou limitar solicitações. | Média | Alto | Tratar falhas, comunicar o problema e oferecer nova tentativa; avaliar cache após definir requisitos de atualização. |
| A busca retornar cidades homônimas ou uma localização incorreta. | Média | Alto | Confirmar cidade antes de consultar e avaliar apresentar estado/região e país nos resultados. |
| A pessoa usuária negar a permissão de geolocalização ou o dispositivo não fornecer uma posição útil. | Média | Médio | Manter a busca digitada disponível e explicar que a localização não pôde ser obtida. |
| Conexão móvel instável impedir a atualização dos dados. | Média | Médio | Definir estados de carregamento e falha e avaliar exibir dados recentes armazenados, caso cache seja aprovado. |
| A alternância de unidade produzir valores inconsistentes entre clima atual e previsão. | Baixa | Alto | Aplicar uma única preferência de unidade a todos os valores e validar conversões com testes. |

## Perguntas em Aberto

1. **Como será feita a busca de cidades e qual fonte/endpoint de geocodificação será usado?** A URL confirmada é de previsão; sem geocodificação, não está definido como converter o nome digitado em coordenadas. **Impacto:** bloqueia a busca por nome e a seleção de cidades.
2. **Quais resultados e dados meteorológicos serão exibidos?** O briefing não especifica temperatura, condição, umidade, vento ou outros campos. **Impacto:** define o conteúdo, o layout e os dados solicitados à API.
3. **Como a busca deve tratar cidades homônimas e quais informações identificam cada resultado?** **Impacto:** pode levar à consulta do local errado.
4. **Como a previsão de cinco dias será apresentada: um resumo diário ou detalhes por horário?** A janela foi definida como hoje + quatro dias, mas não o nível de detalhe. **Impacto:** altera o modelo de dados e a interface.
5. **Quando e como solicitar geolocalização, e o que mostrar se a permissão for negada ou a posição falhar?** **Impacto:** afeta permissões, fluxo inicial e alternativa para obter uma cidade.
6. **A preferência de unidade deve persistir entre visitas ou sessões?** Celsius é a unidade inicial, mas a persistência não foi decidida. **Impacto:** determina se é necessário armazenar a escolha localmente.
7. **A interface deve funcionar offline ou mostrar dados em cache? Por quanto tempo os dados podem ser considerados recentes?** **Impacto:** define estratégia de cache, atualização e apresentação de dados possivelmente desatualizados.
8. **Favoritos ou histórico de cidades fazem parte do escopo?** **Impacto:** acrescenta fluxos de navegação e possível persistência local.
9. **Quais metas verificáveis de desempenho, acessibilidade e suporte a navegadores/dispositivos são esperadas?** **Impacto:** sem critérios, não é possível estabelecer limites nem validar esses aspectos de forma consistente.
10. **Que estados e ações devem existir durante carregamento, erro ou ausência de resultados?** **Impacto:** deixa indefinida a recuperação de falhas e a orientação à pessoa usuária.

## Suposições

- Para atualizar informações de uma API remota, a aplicação precisa de conexão com a internet; comportamento offline não foi confirmado.
- O uso de geolocalização depende de permissão do navegador ou dispositivo. A busca digitada permanece uma forma prevista de escolher a cidade.
- Os requisitos não-funcionais marcados como “a confirmar” são propostas para discussão, não compromissos de produto.