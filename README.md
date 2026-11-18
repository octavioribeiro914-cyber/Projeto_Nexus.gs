# NEXUS — Quando as redes falham, a comunicação continua

![Página inicial do NEXUS](assets/images/screenshots/inicio-desktop.png)

## Descrição

Em enchentes, deslizamentos, terremotos e incêndios, a comunicação costuma ser a primeira coisa a cair: torres ficam sem energia, cabos se rompem e a rede que sobra fica congestionada. Pessoas isoladas não conseguem pedir ajuda, e as equipes de resgate não sabem onde elas estão.

O **NEXUS** é uma proposta de dispositivo e plataforma de comunicação para emergências. Com um botão SOS, o pedido de socorro, com a localização do **GPS**, vai **direto para a central de resgate** por **rádio LoRa** (antenas instaladas pela Defesa Civil) ou, se não houver antena ao alcance, por **satélite**. Não usa internet, Bluetooth, torres de celular nem depende de outros celulares por perto. As antenas LoRa formam uma **rede Mesh** entre si: se uma cair, outra assume.

Este repositório contém o **site do projeto**, que apresenta o conceito, o problema, as tecnologias e uma **simulação visual interativa** da rede NEXUS feita em JavaScript.

> **Importante:** o NEXUS está em fase de conceito e protótipo. O site não transmite mensagens reais; a simulação é apenas visual e didática.

Projeto desenvolvido para a **Global Solution 2026/2 (CitizenTech) — FIAP**, disciplina de Front-End Design Engineering.

## Funcionalidades

- **7 páginas** com navegação consistente: Início, Sobre, Como funciona, Tecnologias, FAQ, Integrantes e Contato.
- **Menu hambúrguer** no celular e no tablet, controlado por JavaScript (abre, fecha, fecha com `Esc` e ao clicar em um link).
- **Simulação da rede NEXUS** (página *Como funciona*):
  - mostra o dispositivo de origem, as antenas LoRa (em malha), o satélite, a central de resgate, o caminho percorrido, o canal usado e o status de entrega;
  - calcula o melhor caminho com o algoritmo de **Dijkstra**, preferindo as antenas LoRa e usando o satélite como reserva;
  - botão **Simular falha de conexão**: derruba uma conexão do caminho (mesmo com o alerta em trânsito) e o NEXUS desvia por outra antena ou pelo satélite;
  - clique em qualquer linha para derrubar ou restaurar aquela conexão;
  - se nenhum canal estiver disponível, o alerta fica guardado no dispositivo para reenvio.
- **FAQ** com perguntas expansíveis (acordeão), busca por texto e filtro por categoria.
- **Abas** na página de Tecnologias, com navegação por teclado (setas, Home e End).
- **Formulário de contato** com validação em JavaScript: campos obrigatórios, formato de e-mail, tamanho mínimo, contador de caracteres, destaque dos campos com erro e mensagem de sucesso (envio simulado).
- **Animações suaves**: elementos surgem ao rolar a página, contadores animados e transições nos cards e botões.
- **Responsivo** para celular (390 px), tablet (768 px) e desktop (1440 px), com Media Queries.
- **Acessibilidade básica**: HTML semântico, `alt` nas imagens, `label` nos campos, foco visível, link "Pular para o conteúdo", atributos ARIA e respeito a `prefers-reduced-motion`.

## Tecnologias utilizadas

- **HTML5** — estrutura semântica (`header`, `nav`, `main`, `section`, `article`, `footer`).
- **CSS3** — variáveis CSS, Flexbox, Grid, animações e Media Queries.
- **JavaScript puro (ES6+)** — sem frameworks nem bibliotecas.
- **SVG** — ícones, ilustrações e o desenho da simulação.
- **Git e GitHub** — versionamento e colaboração.
- Fontes **Inter** e **Space Grotesk** (Google Fonts), com fontes do sistema como alternativa.

## Estrutura de pastas

```
nexus/
├── index.html            # Página inicial: apresentação, problema e chamada para a solução
├── sobre.html            # Origem da ideia, problema, objetivos, público, importância e ODS
├── solucao.html          # Como funciona: passo a passo e simulação da rede NEXUS
├── tecnologia.html       # LoRa, satélite, Mesh das antenas e GPS (abas + comparativo)
├── faq.html              # Perguntas frequentes com busca e filtro
├── integrantes.html      # Integrantes do grupo
├── contato.html          # Formulário de contato com validação
├── README.md
├── integrantes.txt       # Identificação do grupo exigida na entrega
├── css/
│   ├── base.css          # Variáveis (cores, fontes), reset e utilitários
│   ├── components.css    # Botões, cards, badges, cabeçalho, menu e rodapé
│   ├── pages.css         # Estilos de cada página e animações
│   └── responsive.css    # Media Queries (tablet e celular)
├── js/
│   ├── script.js         # Comum a todas as páginas: menu, animações, contadores
│   ├── mesh.js           # Simulação da rede NEXUS (LoRa + satélite)
│   ├── faq.js            # Acordeão, busca e filtro do FAQ
│   ├── tecnologia.js     # Sistema de abas
│   └── contato.js        # Validação do formulário
└── assets/
    ├── icons/            # Ícones em SVG e logotipo
    └── images/           # Ilustrações, foto padrão e screenshots
```

## Como executar

1. Clone o repositório:
   ```bash
   git clone https://github.com/USUARIO/nexus.git
   ```
2. Abra o arquivo `index.html` no navegador (duplo clique).
   - Opcional: no VS Code, use a extensão **Live Server** e clique em *Go Live*.

Não é preciso instalar nada.

## Imagens do projeto

| Página inicial (celular) | Simulação da rede NEXUS |
| --- | --- |
| ![NEXUS no celular](assets/images/screenshots/inicio-mobile.png) | ![Simulação: alerta desviado por outra antena ou pelo satélite](assets/images/screenshots/simulacao-mesh.png) |

## Autores

| Nome completo | RM | Turma | GitHub | LinkedIn |
| --- | --- | --- | --- | --- |
| Octavio Sobrenome Completo | RM000001 | 1TDS | [GitHub](https://github.com/) | [LinkedIn](https://www.linkedin.com/) |
| Nome Completo do Integrante 2 | RM000002 | 1TDS | [GitHub](https://github.com/) | [LinkedIn](https://www.linkedin.com/) |

## Repositório

https://github.com/USUARIO/nexus

## Contato

- E-mail da equipe: equipe.nexus@email.com
- Ou use o formulário da página [Contato](contato.html).

## Uso de IA generativa

Ferramentas de IA generativa foram usadas como apoio no desenvolvimento (estrutura inicial do código, revisão de textos e explicação de conceitos). Todo o conteúdo foi revisado, testado e adaptado pela equipe, que conhece e sabe explicar cada parte do projeto.
