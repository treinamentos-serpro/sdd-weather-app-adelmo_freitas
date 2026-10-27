# Discovery — Aplicação de previsão do tempo

## Contexto

Aplicação web para consultar o clima atual e uma previsão curta de uma cidade, com foco em uma experiência simples em dispositivos móveis. A pessoa usuária pode buscar uma cidade, usar a localização atual e alternar a unidade de temperatura.

Para a v1, ficam registradas as decisões já confirmadas: usar Open-Meteo para geocodificação e previsão, considerar hoje e os quatro dias seguintes, oferecer geolocalização sem solicitá-la automaticamente, iniciar em Celsius e apresentar a interface em pt-BR.

## Requisitos Funcionais

- **RF1 — Buscar cidades:** permitir busca enviada por nome e seleção de um resultado. Exibir cidade, região/estado e país para distinguir homônimos.
- **RF2 — Clima atual:** exibir temperatura, sensação térmica, condição, umidade e velocidade do vento para a cidade selecionada.
- **RF3 — Previsão:** exibir hoje e os quatro dias seguintes, com resumo diário, temperaturas mínima/máxima, condição e probabilidade de precipitação.
- **RF4 — Unidade:** permitir alternar entre Celsius e Fahrenheit; aplicar a escolha a todas as temperaturas exibidas e mantê-la localmente no mesmo dispositivo.
- **RF5 — Geolocalização:** oferecer uma ação explícita para consultar a localização atual, mediante permissão. Manter a busca por cidade como alternativa se a permissão for negada ou falhar.
- **RF6 — Estados da interface:** apresentar estados de carregamento, erro e busca sem resultados. Em caso de erro, permitir tentar novamente.

## Requisitos Não-Funcionais

- **RNF1 — Responsividade:** suportar larguras a partir de 320 px até desktop, sem rolagem horizontal para o conteúdo principal.
- **RNF2 — Compatibilidade:** suportar as duas versões estáveis mais recentes de Chrome, Safari, Firefox e Edge.
- **RNF3 — Acessibilidade:** adotar WCAG 2.2 nível AA como meta; oferecer navegação por teclado, nomes acessíveis e contraste adequado.
- **RNF4 — Performance:** buscar renderização inicial em até 2 s e resposta de busca/previsão em até 3 s no percentil 95, em conexão estável. A medição da resposta inclui o tempo do provedor externo.
- **RNF5 — Privacidade:** não exigir conta. Solicitar geolocalização somente após ação da pessoa usuária; não armazenar coordenadas nem histórico no app. Enviar coordenadas ao provedor apenas para obter os dados solicitados.
- **RNF6 — Disponibilidade e resiliência:** não estabelecer meta numérica de disponibilidade na v1. Quando a API ou a rede falhar, informar a indisponibilidade e oferecer nova tentativa; não apresentar dados antigos como atuais.
- **RNF7 — Localização:** usar pt-BR para textos e formatos de data, e o fuso horário da cidade selecionada para as datas da previsão.

## Riscos

As probabilidades e os impactos são estimativas para a v1 e devem ser revistos após observar uso e disponibilidade do provedor.

| Risco | Probabilidade | Impacto | Mitigação proposta |
| --- | --- | --- | --- |
| API lenta, indisponível ou sujeita a limites de uso. | Média | Alto | Tratar erro e permitir nova tentativa; validar limites e condições de uso antes de publicar. |
| Seleção de cidade homônima ou incorreta. | Média | Alto | Mostrar região/estado e país e exigir seleção explícita quando houver múltiplos resultados. |
| Permissão de geolocalização negada ou posição indisponível. | Média | Médio | Não solicitar automaticamente; preservar busca digitada e explicar como continuar. |
| Rede móvel instável ou sem conexão. | Média | Médio | Mostrar carregamento/erro e ação de retry; declarar que a v1 requer conexão e não tem modo offline. |
| Diferenças de unidade ou fuso causarem leitura incorreta. | Baixa | Alto | Centralizar a preferência de unidade e usar o fuso retornado para a cidade; validar conversões e datas. |
| Compartilhamento inesperado de coordenadas. | Baixa | Alto | Solicitar localização apenas por ação explícita, não persistir coordenadas e limitar o envio à consulta do clima. |

## Perguntas em Aberto

- Não há decisões de produto pendentes que bloqueiem o escopo v1.
- Antes da publicação, validar condições de uso, atribuição exigida e limites de requisição da Open-Meteo. **Impacto se não validado:** risco de uso incompatível com as condições do provedor ou de indisponibilidade por limite.
- Definir o provedor de hospedagem e revisar a meta de disponibilidade quando a implantação for escolhida. **Impacto se não definido:** não é possível estabelecer ou medir um SLO de disponibilidade da aplicação.

## Decisões para v1

- **Público e uso:** qualquer pessoa que queira consultar rapidamente o clima de uma cidade e planejar os próximos dias.
- **Busca:** usar o serviço de geocodificação da Open-Meteo; buscar após envio do formulário, sem autosuggest. Distinguir resultados por cidade, região/estado e país.
- **Clima atual:** temperatura, sensação térmica, condição, umidade e vento em km/h.
- **Previsão:** resumo diário para hoje + quatro dias, com mínima/máxima, condição e probabilidade de precipitação. Sem previsão por hora.
- **Unidades e atualização:** Celsius por padrão; alternância para Fahrenheit aplicada a todas as temperaturas e preferência salva no armazenamento local do browser. Atualizar ao selecionar a cidade ou ao tentar novamente; sem atualização automática em background.
- **Localização:** geolocalização apenas após ação explícita. Não guardar coordenadas; permitir busca manual caso falhe.
- **Idioma e tempo:** interface pt-BR e datas no fuso horário da cidade consultada.
- **Rede e persistência:** conexão é obrigatória. Sem suporte offline, cache de previsão, conta, favoritos, histórico ou alertas na v1.
- **Disponibilidade:** sem SLO numérico até escolher a hospedagem; falhas da API devem ser comunicadas e permitir retry.

## Suposições

- A aplicação é um web app para browsers modernos, sem requisito de instalação como PWA.
- A Open-Meteo fornece os dados necessários para a experiência inicial; condições, limites e eventual atribuição serão verificados antes da publicação.
- Não haverá backend próprio nem dados de usuário persistidos no servidor na v1.