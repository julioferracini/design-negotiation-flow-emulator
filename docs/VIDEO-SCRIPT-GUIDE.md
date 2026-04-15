# Negotiation Flow Platform — Video Script Guide

## Para o Claude Desktop

Este documento é o briefing do projeto "Negotiation Flow Platform". Use-o para
me ajudar a criar roteiros (scripts) para os vídeos educacionais que aparecem
na Home da plataforma web.

Eu sou designer, não desenvolvedor. Fale de forma simples e direta.

---

## O que é este projeto

Uma plataforma de design e prototipagem para testar fluxos de renegociação de
dívidas (e empréstimos / cartão de crédito). Funciona em duas frentes:

- **Expo Go (mobile)** — protótipo nativo com React Native
- **Web Emulator** — interface split-screen com painel de configuração + viewport de iPhone

A Home da versão web é uma landing page com 4 módulos principais e 7 vídeos
educacionais planejados.

**Demo online:** https://julioferracini.github.io/design-negotiation-flow-emulator/

---

## Módulos da Home (Bento Grid)

| Módulo | Status | O que faz |
|--------|--------|-----------|
| **Glossary** | Disponível | Referência de termos de negócio, definições de domínio e regulamentações |
| **Flow Management** | Em breve | Gerenciamento de versões de produto, experimentos e controles admin |
| **Emulator** | Disponível | Use cases navegáveis com protótipos e parâmetros financeiros configuráveis |
| **Experience Architecture** | Disponível | Mapa visual e matriz de capabilities por linha de produto |

---

## Vídeos Planejados na Home

### Vídeo Destaque (Spotlight)

| Campo | Valor |
|-------|-------|
| **Título** | How to change the Use Case |
| **Duração** | 3 min |
| **Track** | Getting Started |
| **Descrição** | Escolher uma product line, trocar de use case, e entender o que muda automaticamente — financial rules, telas e parâmetros do fluxo se adaptam instantaneamente. |

### Grade de Vídeos (6 cards)

| # | Título | Duração | Track | Descrição |
|---|--------|---------|-------|-----------|
| 1 | **Using the AI Assistant** | 4 min | Assistant | Pedir navegação, explicações e ajuda com configuração |
| 2 | **Financial Rules — advanced mode** | 5 min | Advanced | Seleção de fórmula, valores de negociação e impacto nas ofertas |
| 3 | **Capability matrix deep dive** | 4 min | Operations | Cobertura, experimentos e visibilidade de rollout |
| 4 | **Tuning negotiation parameters** | 6 min | Advanced | Políticas de desconto, parcelas e comportamento da simulação |
| 5 | **Timeline and changelog** | 3 min | Operations | Onde checar atualizações e contexto de versão |
| 6 | **Running your first flow** | 3 min | Getting Started | Selecionar país, escolher use case, configurar telas e clicar Start Flow |

---

## Catálogo de Produtos (Use Cases no Emulator)

O emulador organiza os use cases assim: **País → Product Line → Use Case**.

### Debt Resolution (6 use cases)

- **MDR** — Multi-debt Renegotiation (BR, MX, CO, US)
- **Late Lending Short** — Renegociação curto prazo, até 90 dias (BR, MX, CO, US)
- **Late Lending Long** — Renegociação longo prazo, 90+ dias (BR, MX, CO, US)
- **CC Long Agreements** — Acordos de dívida de cartão longo prazo (BR, MX, CO, US)
- **FP – Fatura Parcelada** — Parcelamento de fatura vencida (BR apenas)
- **RDP – Renegociação de Pendências** — Resolução de pendências multi-produto (BR apenas)

### Lending (5 use cases)

- **INSS** — Crédito consignado INSS (BR, MX, CO, US)
- **Private Payroll** — Empréstimo com desconto em folha (BR, MX, CO, US)
- **SIAPE** — Consignado servidores federais (BR, MX, CO, US)
- **Military** — Consignado militar (BR, MX, CO, US)
- **Personal Loan** — Empréstimo pessoal sem garantia (BR, MX, CO, US)

### Credit Card (2 use cases)

- **Bill Installment** — Parcelamento de fatura (MX apenas)
- **Refinancing** — Refinanciamento de dívida (CO apenas)

---

## Telas do Fluxo (Building Blocks)

Estas são as telas que compõem a jornada no emulador. Cada use case liga/desliga
telas diferentes.

| Tela | O que faz | Status |
|------|-----------|--------|
| **Offer Hub** | Centraliza e compara ofertas de resolução de dívida | Pronto |
| **Suggested Conditions** | Apresenta opções e sugere a melhor com base nos inputs do usuário | Pronto |
| **Simulation** | Usuário ajusta entrada e parcelas para explorar cenários | Pronto |
| **Summary** | Consolida todas as escolhas antes da confirmação final | Pronto |
| **Installment Value** | Input modular de valor de parcela, com nudges | Pronto |
| **Due Date** | Escolha de data de vencimento com regras locais | Pendente |
| **Downpayment Value** | Valor de entrada (quando aplicável) | Pendente |
| **Downpayment Due Date** | Data de vencimento da entrada | Pendente |
| **Terms & Conditions** | Explicação de regras do produto antes da confirmação | Pendente |
| **PIN** | Confirmação de segurança | Pendente |
| **Loading** | Tela de processamento | Pendente |
| **Feedback** | Encerramento da jornada (sucesso/erro/pendente) | Pendente |

---

## O que cada Building Block faz (detalhado)

Use esta seção para escrever roteiros precisos — ela descreve a função de
produto de cada tela, não o código.

| Block | Função de produto |
|-------|-------------------|
| **Offer Hub** | O usuário recebe propostas personalizadas e decide se aceita ou customiza, usando comparação visual para decidir rápido. Tem abas (Tudo, Cartão, Empréstimos) e cada oferta mostra badge, valor de pagamento, benefício e CTA. |
| **Eligibility** | Filtra quem qualifica para parcelas flexíveis. Garante que só clientes elegíveis acessem planos mensais. |
| **Breathing Screen** | Tela de "respiro" entre etapas — prepara o usuário com instruções breves antes de qualquer tarefa complexa. |
| **Suggested Conditions** | Reduz carga cognitiva recomendando a melhor opção (em vez de só listar). Mostra parcelas com destaque no "best match". |
| **Value (Installment & Down Payment)** | Input reutilizável com nudges para evitar paralisia de decisão. Slider ou campo de valor. |
| **Simulation** | O usuário ajusta entrada e parcelas para ver como cada variável afeta o acordo. Gera senso de controle. |
| **Due Date** | Usuário escolhe datas seguindo regras locais (formatos, dias úteis, horários de corte). |
| **Product Explanation** | Torna regras do produto transparentes antes da confirmação (auto-débito, juros por atraso, penalidades). |
| **Summary** | "Checkout" da renegociação — reúne todas as escolhas numa visão editável antes do compromisso final. |
| **Feedback** | Tela de encerramento — pode ter formas diferentes (sucesso, pendente, erro) mas sempre comunica o estado final e próximos passos. |

---

## Parâmetros Financeiros Configuráveis

Estes são os controles que aparecem no painel esquerdo do emulador e que mudam
o comportamento das telas:

| Parâmetro | O que controla |
|-----------|----------------|
| **Locale** | País + idioma (pt-BR, es-MX, es-CO, en-US) — muda textos, moeda e regras |
| **Product Line** | Categoria (Debt Resolution, Lending, Credit Card) |
| **Use Case** | Cenário específico dentro da product line |
| **Total Debt** | Valor total da dívida (divide entre cartão e empréstimo) |
| **CC Balance / Loan Balance** | Quanto da dívida é cartão vs empréstimo |
| **Discount % Max** | Desconto máximo que o sistema pode oferecer |
| **Interest Rate Monthly** | Taxa de juros mensal |
| **Installment Range** | Mínimo e máximo de parcelas disponíveis |
| **Downpayment Enabled** | Se o fluxo inclui entrada (nem todos têm) |
| **PIN Enabled** | Se o fluxo exige PIN de confirmação |
| **Formula** | Tipo de cálculo: `flat_discount` (desconto fixo), `price` (tabela Price), `sac` (SAC) |
| **Screen toggles** | Liga/desliga telas individuais do fluxo |
| **Simulated Latency** | Atraso artificial para simular tempo de resposta real |

---

## Glossário Rápido

- **Product Line** = categoria (Debt Resolution, Lending, Credit Card)
- **Use Case** = cenário específico dentro de uma product line (ex: MDR, INSS)
- **Locale** = país + idioma (pt-BR, es-MX, es-CO, en-US)
- **Financial Rules** = regras de cálculo (taxa de juros, desconto máximo, range de parcelas)
- **Formula** = tipo de cálculo: `flat_discount`, `price`, `sac`
- **Flow Type** = variante do fluxo (A, B, ou both)
- **Screen Visibility** = quais telas aparecem para cada use case
- **Emulator** = interface web split-screen (painel de config + viewport iPhone)
- **Building Block** = componente de tela reutilizável no fluxo
- **Bento Grid** = layout de cards da Home com os 4 módulos
- **Spotlight** = vídeo em destaque na Home (maior, com gradiente)
- **Track** = categoria do vídeo (Getting Started, Advanced, Operations, Assistant)

---

## Instruções para o Claude

### O que eu vou pedir

Vou pedir ajuda para criar **roteiros de vídeo** para cada um dos 7 vídeos
listados acima. Os roteiros devem incluir:

1. **Intro** (5-10 segundos) — o que o vídeo ensina
2. **Passos visuais** — descrever o que aparece na tela a cada momento
3. **Narração** — texto para eu gravar como voice-over (ou legenda)
4. **Duração estimada** por trecho
5. **Dica final** — encerrar cada vídeo com 1 dica prática

### Tom dos vídeos

- Claro, direto, sem jargão técnico desnecessário
- Como se estivesse explicando para um designer que não programa
- Frases curtas, ritmo de tutorial
- Em inglês (público internacional) — mas posso pedir versão em PT-BR

### O que NÃO fazer

- Não invente funcionalidades que não existem no projeto
- Não misture conceitos do Expo (mobile) com o web emulator sem avisar
- Se não souber algo sobre o projeto, pergunte antes de inventar

### Formato de entrega

Para cada vídeo, entregue assim:

```
## [Título do Vídeo]
Track: [Getting Started / Advanced / Operations / Assistant]
Duração: [X min]

### Cena 1 — [Título] (0:00 – 0:XX)
**Visual:** [o que aparece na tela]
**Narração:** "[texto do voice-over]"

### Cena 2 — [Título] (0:XX – 0:XX)
**Visual:** [o que aparece na tela]
**Narração:** "[texto do voice-over]"

...

### Dica Final (X:XX – X:XX)
**Visual:** [o que aparece]
**Narração:** "[dica prática]"
```

### Exemplos de pedidos que eu posso fazer

- "Crie o roteiro do vídeo 'Running your first flow'"
- "Agora faça o roteiro do Spotlight — 'How to change the Use Case'"
- "Reescreva a Cena 3 com menos texto"
- "Faça versão em PT-BR do roteiro do vídeo 2"
- "Sugira 3 opções de dica final para o vídeo do AI Assistant"
