# Discovery — Aplicação de previsão do tempo

## Contexto

Aplicação web para consultar o clima atual e uma previsão curta de uma cidade, com foco em uma experiência simples em dispositivos móveis. A pessoa usuária pode buscar uma cidade, usar a localização atual e alternar a unidade de temperatura.

Para a v1, ficam registradas as decisões já confirmadas: usar Open-Meteo para geocodificação e previsão, considerar hoje e os quatro dias seguintes, oferecer geolocalização sem solicitá-la automaticamente, iniciar em Celsius e apresentar a interface em pt-BR.

## Resumo Executivo

- O Weather App permitirá consultar o clima atual de uma cidade e apoiar decisões do dia a dia.
- A pessoa poderá buscar pelo nome ou usar a localização atual após conceder permissão.
- A previsão cobrirá hoje e os quatro dias seguintes, com temperatura, condição e chance de chuva.
- A experiência priorizará celulares, será em pt-BR e começará em Celsius, com opção de Fahrenheit.
- A v1 dependerá de conexão, não exigirá conta e usará um serviço externo cujos limites devem ser validados antes do lançamento.

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

| Tipo | Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- | --- |
| Técnico | API lenta, indisponível ou sujeita a limites de uso. | Média | Alto | Tratar falhas e permitir nova tentativa; validar limites e condições de uso antes da publicação. |
| Produto | Seleção de cidade homônima ou incorreta. | Média | Alto | Exibir região/estado e país e exigir seleção explícita quando houver múltiplos resultados. |
| Produto | Pessoa usuária negar a geolocalização ou não compreender por que ela foi solicitada. | Média | Médio | Solicitar localização apenas após ação explícita, explicar o uso e manter a busca digitada como alternativa. |
| Técnico | Rede móvel instável ou sem conexão impede atualizar a previsão. | Média | Médio | Exibir estado de erro e ação de retry; deixar claro que a v1 requer conexão e não oferece modo offline. |
| Técnico | Erro de conversão de unidade ou fuso resulta em informação enganosa. | Baixa | Alto | Centralizar conversões e datas por fuso da cidade e validar os casos com testes. |
| Produto | Compartilhamento inesperado de coordenadas reduz a confiança no app. | Baixa | Alto | Não solicitar localização automaticamente, não persistir coordenadas e enviá-las somente ao provedor para a consulta solicitada. |
| Produto | Previsão diária não atender quem espera detalhes por hora. | Média | Médio | Informar claramente que a v1 oferece resumo diário e validar a necessidade com usuários antes de ampliar o escopo. |

## Perguntas em Aberto

- Não há decisões de produto pendentes que bloqueiem o escopo v1.
- Antes da publicação, validar condições de uso, atribuição exigida e limites de requisição da Open-Meteo. **Impacto se não validado:** risco de uso incompatível com as condições do provedor ou de indisponibilidade por limite.
- Definir o provedor de hospedagem e revisar a meta de disponibilidade quando a implantação for escolhida. **Impacto se não definido:** não é possível estabelecer ou medir um SLO de disponibilidade da aplicação.

## Decisões

| Decisão | Justificativa | Pergunta em aberto resolvida |
| --- | --- | --- |
| **Fonte de dados:** Open-Meteo para geocodificação e previsão, sem API key. | Reduz configuração e dependência de credenciais para a v1. | Qual fonte será usada? Há necessidade de API key? |
| **Janela da previsão:** cinco dias = hoje + os quatro dias seguintes. | Define uma janela diária simples e consistente com a necessidade de planejamento de curto prazo. | “5 dias” inclui hoje ou começa amanhã? |
| **Unidade padrão:** Celsius. | Define um valor inicial adequado à interface em pt-BR, mantendo a opção de alternar para Fahrenheit. | Qual unidade deve aparecer na primeira visita? |
| **Acesso e persistência:** sem autenticação e sem persistência de dados no servidor. | Evita contas e backend de usuário na v1; preferências locais do browser, como a unidade, continuam permitidas. | É necessário login? Os dados ou preferências devem ser persistidos no servidor? |
| **Idioma da UI:** pt-BR. | Mantém textos e formatos adequados ao público inicial sem introduzir escopo de i18n na v1. | Quais idiomas a interface deve suportar inicialmente? |

## Personas e Objetivos

Personas hipotéticas para orientar a spec; as métricas abaixo são propostas para validação em testes de usabilidade, não resultados de pesquisa.

| Persona | Objetivo principal | Contexto de uso | Métrica de sucesso proposta |
| --- | --- | --- | --- |
| **Decisor do dia a dia** | Consultar rapidamente o clima atual para decidir o que vestir ou levar antes de sair. | Principalmente mobile, em consultas breves antes de um deslocamento. | Em um teste, identifica a condição e a temperatura da cidade desejada em até 30 segundos, sem confundir a unidade. |
| **Viajante planejador** | Planejar roupas e atividades com base nas condições dos próximos cinco dias no destino. | Desktop ao organizar a viagem; mobile durante o deslocamento. | Em um teste, encontra o destino correto e identifica mínimas, máximas e probabilidade de chuva dos cinco dias em até 2 minutos. |

## Escopo da v1

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