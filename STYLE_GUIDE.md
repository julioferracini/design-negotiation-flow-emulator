# Platform Visual Language

Guia de estilo da **plataforma** (a "casca" da ferramenta).
Escopo: páginas `.nf-page__*` e `web/src/styles/platform.css`.
**Fora do escopo:** protótipos (`.nf-proto__*`, `*Screen.tsx`) — governados por NuDS e pela regra [`ui-building-blocks.mdc`](./.cursor/rules/ui-building-blocks.mdc).

---

## 1. Princípios

1. **Identidade Nubank primeiro.** Tipografia custom (`Nu Sans Display` + `Nu Sans Text`), paleta Nubank e ilustrações 3D da marca. Zero dependências externas de fonte decorativa.
2. **Paleta híbrida.** Fundo branco/quente editorial (`#FAFAFA`/`#F6F3EF`). Preto `#0B0B0C` é o tom de ação e contraste. Roxo `#820AD1` é **raro** — ponto de acento em links, hover do CTA primário, chamadas específicas. Não é cor de fundo.
3. **Warmth vem dos assets da marca.** Ilustrações 3D (personagens Nubank) substituem gradient blobs, hero backgrounds gerados, icons Lucide coloridos e qualquer outro decorativo.
4. **Simetria, nunca "hero card".** Todos os feature cards têm o mesmo peso visual e o mesmo tamanho. Dominância visual é para o título da página, não para um card privilegiado.
5. **Emphasis por peso e cor, não por itálico.** `Nu Sans Display` é sans — ênfase em palavras-chave vem de `font-weight: 700` + `color: var(--nf-accent)`.
6. **Shape técnico.** Raios `6 / 10 / 16` + pill. Feel Linear/Vercel dashboard.
7. **Sombras tingidas.** Proibido `rgba(0,0,0,*)` em novas superfícies.
8. **Movimento coordenado.** Transform, shadow e cor movem juntos, no `--nf-ease`.
9. **Acessibilidade por default.** `:focus-visible` com anel roxo em todo interativo, contraste AA mínimo.
10. **Nada de decoração sem propósito.** Se um gradiente, brilho ou animação não comunica, remova.

---

## 2. Referências visuais

Direção extraída de:

- **[isomeet.com](https://www.isomeet.com/)** — ritmo editorial, CTAs pretos, feature cards simétricos, seções divididas por respiro (não por cartões flutuantes)
- **[cosmos.so](https://www.cosmos.so/)** — whitespace confiante, display expressivo, paleta contida
- **[realfood.gov](https://realfood.gov/)** — hierarquia clara, frases curtas, confiança
- **[luffu.com](https://www.luffu.com/)** — tom humano, paleta morna, sombras de papel
- **[oevra.com](https://oevra.com/)** — silêncio, minimalismo, ofício
- **Assets Nubank 3D** em [`web/public/brand/`](./web/public/brand/) — warmth e identidade

Traço comum: editorial, confiante, calmo, sem gradient blobs, com tipografia e ilustrações fazendo o trabalho pesado.

---

## 3. Tokens

Todos definidos em [`web/src/styles/platform.css`](./web/src/styles/platform.css). **Sempre** consuma via `var(--nf-*)` — nunca hard-code valores.

### 3.1 Cores (paleta Nubank preservada, uso refinado)

| Token                 | Light              | Dark                           | Uso                                           |
|-----------------------|--------------------|--------------------------------|-----------------------------------------------|
| `--nf-bg`             | `#FAFAFA`          | `#09090A`                      | Plano de fundo da página                      |
| `--nf-bg-secondary`   | `#FFFFFF`          | `#141414`                      | Superfície de card                            |
| `--nf-bg-warm`        | `#F6F3EF`          | `#161214`                      | Hover de linha, seção sutil, feature thumb bg |
| `--nf-bg-elevated`    | `#FFFFFF`          | `#1A1A1A`                      | Modais, toasts                                |
| `--nf-bg-dark`        | `#0B0B0C`          | `#0B0B0C`                      | CTA primário, hero visual panel               |
| `--nf-text`           | `#1F0230`          | `#FFFFFF`                      | Texto primário                                |
| `--nf-text-secondary` | `#6B5C75`          | `#A0A0A0`                      | Texto secundário                              |
| `--nf-text-tertiary`  | `rgba(31,2,48,.4)` | `rgba(255,255,255,.4)`         | Metadados, índices, muted                     |
| `--nf-text-on-dark`   | `#FFFFFF`          | `#FFFFFF`                      | Texto sobre superfície preta                  |
| `--nf-border`         | `#EEECEF`          | `#2A2A2A`                      | Borda sutil                                   |
| `--nf-border-strong`  | `#DAD6DD`          | `#383838`                      | Borda de hover                                |
| `--nf-accent`         | `#820AD1`          | `#A78BFA`                      | **Acento raro** — link, ênfase, hover de CTA  |
| `--nf-accent-subtle`  | `#F5EFFB`          | `rgba(167,139,250,.14)`        | Fundo de badge accent                         |

**Regra de ouro:** se você está prestes a pintar uma superfície grande de roxo, pare. Roxo é para pontos, não áreas.

### 3.2 Elevação (sombras tingidas, mais sutis)

| Token                     | Uso típico                                   |
|---------------------------|----------------------------------------------|
| `--nf-shadow-flat`        | `none` — a maioria das superfícies           |
| `--nf-shadow-raised`      | Cards em repouso, inputs em hover            |
| `--nf-shadow-floating`    | Cards em hover, hero visual panel, toast     |
| `--nf-shadow-overlay`     | Modais, menus suspensos                      |
| `--nf-shadow-accent`      | Momento raro de destaque roxo                |

Aliases `--nf-shadow-sm/md/lg` são legados — não use.

### 3.3 Forma

```css
--nf-radius-sm: 6px;     /* botão, input, chip, badge */
--nf-radius-md: 10px;    /* table wrap, toast, modal-close */
--nf-radius-lg: 16px;    /* card, modal, feature, hero visual */
--nf-radius-pill: 9999px;/* hero pill, CTA, theme toggle */
```

### 3.4 Tipografia

```css
--nf-font-display: 'Nu Sans Display', 'Nu Sans Text', -apple-system, sans-serif;
--nf-font-text:    'Nu Sans Text',    -apple-system, sans-serif;
--nf-font-mono:    'JetBrains Mono', 'SF Mono', monospace;
```

**Por que Nu Sans Display?** Já está carregada via `@font-face`. Zero dependência externa. Identidade 100% Nubank. Ênfase vem de **peso + cor**, não de itálico.

**Escala (guia, não lei):**

| Uso                       | Família  | Tamanho        | Weight | Tracking    | Line-height |
|---------------------------|----------|----------------|--------|-------------|-------------|
| Hero title                | display  | `clamp(44–88)` | 500    | -0.025em    | 0.98        |
| Hero title (emphasis)     | display  | =              | 700    | -0.025em    | 0.98        |
| Section title             | display  | `clamp(28–44)` | 500    | -0.022em    | 1.02        |
| Video row title           | display  | 18px           | 500    | -0.012em    | 1.25        |
| Feature title             | display  | 20px           | 600    | -0.015em    | 1.2         |
| Modal title               | display  | 22px           | 600    | -0.018em    | —           |
| Body                      | text     | 13–16px        | 400    | 0           | 1.5         |
| CTA button                | text     | 13px           | 600    | -0.005em    | —           |
| Hero pill                 | mono     | 11px           | 500    | 0.02em      | —           |
| Eyebrow                   | mono     | 11px           | 500    | 0.08em CAPS | 1.2         |
| Feature meta, index       | mono     | 10–11px        | 500    | 0.06–0.08em | —           |
| Duração, versão, ID       | mono     | 11px           | 500    | 0.04em      | —           |

**Padrão de ênfase** (no lugar de itálico):

```tsx
<h1 className="nf-page__hero-title">
  Design. <span className="nf-page__hero-mute">Simulate.</span>{' '}
  <span className="nf-page__hero-emph">Ship.</span>
</h1>
```

- `.nf-page__hero-emph` → weight 700 + cor accent
- `.nf-page__hero-mute` → weight 400 + cor secondary

### 3.5 Movimento

```css
--nf-ease:     cubic-bezier(0.22, 1, 0.36, 1);
--nf-ease-out: cubic-bezier(0.33, 1, 0.68, 1);
--nf-dur-fast: 160ms;  /* input, chip, toggle */
--nf-dur:      260ms;  /* card, modal */
--nf-dur-slow: 420ms;  /* imagem zoom, seção */
```

### 3.6 Foco

```css
--nf-focus-ring: 0 0 0 3px rgba(130, 10, 209, 0.18);
```

Aplicado em todo interativo `.nf-page__*`.

---

## 4. Padrões de uso

### 4.1 Assets da marca (Nubank 3D)

Localizados em [`web/public/brand/`](./web/public/brand/) e [`web/public/brand/cards/`](./web/public/brand/cards/):

**Cards transparentes** (`srgba 4.0`, alpha: Blend) — usar no hero com `object-fit: contain`, sem box:

| Arquivo                       | Semântica                         | Onde usar             |
|-------------------------------|-----------------------------------|-----------------------|
| `cards/hero.png`              | Cartão Nubank 360 — ângulo frontal| Hero visual (padrão)  |
| `cards/angle-66.png`          | Cartão quase perpendicular        | Variação editorial    |
| `cards/angle-69.png`          | Cartão em ângulo dramático        | Variação editorial    |
| `cards/angle-79.png`          | Cartão em perspectiva diagonal    | Variação editorial    |

**Personagens 3D** (fundo pastel queimado, não transparente) — usar no feature card como thumb full-bleed:

| Arquivo                       | Semântica                            | Onde usar                      |
|-------------------------------|--------------------------------------|--------------------------------|
| `emulator.png`                | Voo, ação, experimento               | Feature card: Emulator         |
| `flow-management.png`         | Estado controlado, freeze/rollout    | Feature card: Flow Management  |
| `snowball.png`                | Crescimento sistêmico, arquitetura   | Feature card: Experience Arch. |
| `glossary.png`                | Busca, dúvida, referência            | Feature card: Glossary         |
| `relax.png`                   | Calma, pausa                         | PlaceholderPage (futuro)       |

**Regra:** se um asset tem fundo opaco embutido (srgb 3.0 sem alpha), ele **nunca** vai pro hero visual (`.nf-page__hero-visual`). Só vai pra feature thumb, onde o overlay gradient absorve o fundo. Para hero, use **só PNGs com canal alpha** (os da pasta `brand/cards/`).

### 4.2 Feature grid — Overlap Studio (simétrico com ritmo)

4 entries em colunas iguais (`repeat(4, 1fr)`). **Tamanhos idênticos**, mas cards pares (nth-child(even)) recebem `transform: translateY(48px)` que cria ritmo vertical editorial **sem hierarquia** — nenhum card é maior, mais claro ou mais importante. Apenas alternam de altura.

A imagem é **fundo mudo full-bleed** (`position: absolute; inset: 0; opacity: 0.45; saturate(0.85)`), com scrim gradient branco subindo da base pra garantir legibilidade do texto. No hover:
- Card sobe 6px (preservando o offset base do overlap)
- Imagem vai a `opacity: 0.72` + `saturate(1)` + `scale(1.04)`
- Arrow button aparece no canto superior direito, rotaciona e troca pra preto

```tsx
<div className="nf-page__feature-grid">
  {FEATURES.map((f, i) => (
    <motion.button
      className="nf-page__feature"
      initial={{ opacity: 0, y: 48, rotate: i % 2 === 0 ? -1.2 : 1.2 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="nf-page__feature-thumb">
        <img src={f.image} alt="" />
      </div>
      <div className="nf-page__feature-arrow"><ArrowUpRight /></div>
      <div className="nf-page__feature-body">
        <div className="nf-page__feature-meta">{/* 01 · Ready */}</div>
        <h3 className="nf-page__feature-title">{f.title}</h3>
        <p className="nf-page__feature-desc">{f.description}</p>
      </div>
    </motion.button>
  ))}
</div>
```

### 4.3 Hero visual — transparent asset with bleed

O asset do hero é um PNG **transparente** (canal alpha real). O container **não tem background nem border-radius** — a imagem sangra diretamente no fundo da página.

- Image: `width: 118%; height: 118%` (passa do container para efeito "estourado")
- `filter: drop-shadow` roxo grande + text shadow neutra compõem a "sombra tingida"
- `::before` com radial-gradient roxo blurrado cria um halo atrás da imagem
- Cursor move aplica `rotateX/rotateY` (±14deg max) com `useSpring` suavizando
- Parallax: `useTransform(scrollY, [0, 1], [0, -140])` faz a imagem escapar pra cima conforme rola

### 4.4 Editorial list (substitui grid de vídeos)

Listas longas (vídeos, changelog, itens de biblioteca) viram linhas editoriais, não grids de card:

```
01   GETTING STARTED   Running your first flow                   3 min   ↗
02   ASSISTANT         Using the AI Assistant                    4 min   ↗
03   ADVANCED          Financial rules — advanced mode           5 min   ↗
```

Classe: `.nf-page__video-list` + `.nf-page__video-row`.

### 4.5 CTA editorial

- Primário: preto → hover roxo (`.nf-page__cta`)
- Ghost: borda + texto → hover warm bg (`.nf-page__cta--ghost`)

Evite botões coloridos redundantes. Preto é o tom de ação; roxo é a recompensa do hover.

### 4.6 Scroll-linked motion (agressivo, coordenado)

A HomePage usa 4 camadas de motion ligadas ao scroll:

1. **Hero parallax** — `useScroll` no `heroRef`; imagem escapa pra cima (`y: 0 → -140`) enquanto a cópia escapa mais lenta (`y: 0 → -60`), criando efeito de separação de camadas.
2. **Section title scrub** — `useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.92, 1, 1, 0.96])` pra scale, e `[40, 0, 0, -20]` pra y. O título entra crescendo e sai encolhendo, linked ao scroll do próprio container da seção.
3. **Sticky eyebrow** — `.nf-page__eyebrow--sticky` usa `position: sticky; top: 28px` pra grudar no topo enquanto a seção passa.
4. **Staircase reveal** — video rows entram de `x: -28` + fade, com delay staggered de 0.05s cada. Feature cards entram de `y: 48, rotate: ±1.2deg` (alternando) + fade, com delay de 0.08s.

### 4.7 Cursor-tilt no hero visual

O hero visual recebe `rotateX/rotateY` suavizado por `useSpring` (stiffness 150, damping 18) baseado na posição relativa do mouse. Máximo ±14deg Y e ±10deg X. `onMouseLeave` reseta. Efeito Linear/Vercel.

---

## 5. Do / Don't

### Estrutura

| Don't | Do |
|-------|----|
| Bento grid asymmetric com "hero card" | Grid simétrico 4-col / 2-col / 1-col |
| Fold spotlight + fold grid com mesmo CTA | Um só fold editorial (list ou grid) |
| Theme toggle com orb de gradientes cônicos | `.nf-page__theme-toggle` minimalista |
| 6 cards, cada um com `accent` aleatório diferente | Mesma paleta em todos; variação vem da imagem |

### Tipografia

| Don't | Do |
|-------|----|
| Itálico em sans (não existe elegante) | Weight 700 + cor accent para ênfase |
| `font-weight: 500` pra tudo | Display 500–700, body 400, mono 500 |
| Inter/Geist importados do Google | Nu Sans Display + Nu Sans Text já carregadas |

### Cor

| Don't | Do |
|-------|----|
| Superfícies grandes pintadas de roxo | Roxo só em hover do CTA, ênfase de palavra, link |
| Gradient roxo→azul→rosa de decoração | Asset real da marca ou fundo sólido |
| Accent random por card (`#7C3AED`, `#EC4899`...) | Consistência — todos os cards branco + border |

### Sombra

| Don't | Do |
|-------|----|
| `box-shadow: 0 8px 24px rgba(0,0,0,0.1)` | `box-shadow: var(--nf-shadow-floating)` |
| Sombra forte em card em repouso | `var(--nf-shadow-raised)` base, `floating` só em hover |

### Interação

| Don't | Do |
|-------|----|
| `:hover { opacity: 0.9 }` | Coordenar 2+ propriedades |
| `transition: all .2s ease` | Lista explícita de props + `var(--nf-ease)` |
| `outline: none` sem substituto | `:focus-visible { box-shadow: var(--nf-focus-ring) }` |

### Decoração

| Don't | Do |
|-------|----|
| 3 gradient blobs animados no background | Fundo limpo `var(--nf-bg)` |
| `hero-bg.png` genérico como decorativo | `/brand/*.png` com propósito semântico |
| Emoji como hierarquia | Tipografia e spacing resolvem |

---

## 6. Checklist de PR (visual)

- [ ] Só `var(--nf-*)` usado (nenhum hex/rgba novo)
- [ ] Display em `var(--nf-font-display)`, metadata em `var(--nf-font-mono)`
- [ ] Raios no sistema `sm` / `md` / `lg` / `pill`
- [ ] Nenhum `rgba(0,0,0,*)` novo
- [ ] Nenhum `:hover { opacity: X }` ou `:hover { scale: X }` isolado
- [ ] `:focus-visible` presente em interativos
- [ ] Contraste AA verificado
- [ ] Ênfase tipográfica via `.nf-page__hero-emph` / `--mute`, não itálico
- [ ] Sem accent colors aleatórios por item (tudo consistente)
- [ ] Sem "hero card" variant — feature grid simétrico
- [ ] Sem spotlight fold duplicado — um fold editorial por vez
- [ ] Novo asset visual é da biblioteca Nubank (`/brand/`), não decorativo genérico
- [ ] Protótipo (`*Screen.tsx`, `.nf-proto__*`, `prototype.css`) intocado
- [ ] `STYLE_GUIDE.md` atualizado se tokens/padrões mudaram

---

## 7. Roadmap

1. **Chrome de navegação**: `Sidebar`, `HamburgerButton`, `SplitScreen`, `ParameterPanel` — migrar para tokens `--nf-*` e padrões editoriais.
2. **Painéis flutuantes**: `AIFloatingButton`, `AIChatPanel`, `RulesFloatingButton`, `RulesPanel` — refatorar com mesma linguagem e remover `neon-breathe`.
3. **Dark mode polish**: refinar contraste e densidade visual no escuro.
4. **Motion brand assets (.mp4)**: integrar loops do Roxinho em momentos-chave de onboarding / placeholder pages.

---

## 8. Rollback

Stylesheet anterior preservado em [`web/src/styles/platform.legacy.css`](./web/src/styles/platform.legacy.css). Em [`web/src/index.css`](./web/src/index.css), trocar o import para rollback. HomePage pré-rework está no git history.
