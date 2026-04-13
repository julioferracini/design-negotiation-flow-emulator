# Hosting Comparison — GitHub Pages vs AWS S3 vs Vercel

> Generated: 2026-04-09
> Project: Negotiation Flow Platform (SPA — Vite + React + Tailwind)

## Project Context

- **SPA estática** sem backend
- **Password gate client-side** com hashes SHA-256 e rate limiting via localStorage
- Deploy automático no push para `develop`
- Uso interno (protótipo de negociação)

---

## Comparison Table

| Critério | GitHub Pages | AWS S3 + CloudFront | Vercel |
|---|---|---|---|
| **Custo** | Gratuito | ~$1–5/mês | Gratuito (plano Hobby) |
| **Setup inicial** | Já feito | Alto (bucket, IAM, CloudFront, ACM) | Muito baixo — conecta o repo e pronto |
| **CI/CD** | Já funciona (Actions) | Reescrever workflow + secrets AWS | Automático — push = deploy |
| **HTTPS** | Automático | Precisa CloudFront + certificado | Automático |
| **Preview por PR** | Não tem | Não tem (sem trabalho extra) | **Sim — cada PR ganha URL própria** |
| **Domínio custom** | Limitado | Flexível | Flexível + fácil |
| **Performance CDN** | Boa (Fastly) | Excelente (CloudFront) | Excelente (Edge global) |
| **SPA routing** | Hack `404.html` | Custom Error Response | Nativo (`rewrites` no config) |
| **Proteção de acesso** | Nenhuma nativa | Pode restringir por IP/VPN | **Password Protection nativa** (plano Pro) |
| **Variáveis de ambiente** | Não suporta | Via workflow + Secrets Manager | **Suporta nativamente** |
| **Rollback** | Revert no git | Manual | **Um clique no dashboard** |
| **Compatibilidade Vite** | Precisa config especial (`vite.config.ghpages.ts`) | Precisa ajustar `base` | **Zero config — detecta Vite automaticamente** |
| **Complexidade para designer** | Baixa | Alta | **Muito baixa** |

---

## Key Differences for This Project

### 1. Password Gate — Server-side vs Client-side

O projeto usa `PasswordGate.tsx` para proteção client-side. Funciona, mas pode ser contornado limpando localStorage ou desabilitando JavaScript.

| Plataforma | Proteção |
|---|---|
| GitHub Pages | Nenhuma nativa — depende do password gate client-side |
| AWS S3 | Não nativa — precisaria de Lambda@Edge, aumentando complexidade |
| Vercel Pro ($20/mês) | **Password Protection nativa no servidor** — o HTML nunca é entregue sem autenticação |

### 2. Preview Deployments

Cada pull request no Vercel gera automaticamente uma URL de preview única — ideal para comparar variações de fluxos de negociação sem afetar o ambiente principal.

Nem GitHub Pages nem S3 oferecem isso sem configuração manual significativa.

### 3. Eliminação de Configs Especiais

O projeto mantém dois configs de Vite (`vite.config.ts` e `vite.config.ghpages.ts`) e stubs em `web/src/stubs/` para contornar limitações do GitHub Pages. Com Vercel, bastaria o `vite.config.ts` padrão — sem `base` path, sem stubs de CI.

### 4. SPA Routing

O hack de copiar `index.html` para `404.html` no workflow de deploy deixa de ser necessário com Vercel, que faz fallback de SPA nativamente.

---

## AWS S3 — When It Makes Sense

Migrar para S3 é **tecnicamente viável**, mas adiciona complexidade sem ganho claro para este projeto:

- Configurar bucket, IAM, CloudFront, ACM Certificate, DNS
- Reescrever o GitHub Actions workflow
- Gerenciar billing e credenciais AWS
- Sem preview deployments nativos

**Faz sentido se:** há exigência corporativa de AWS (compliance, VPN, restrição por IP), ou o projeto evoluir para ter backend na AWS.

---

## Recommendation

| Cenário | Recomendação |
|---|---|
| Manter tudo como está, sem custo | **GitHub Pages** (já funciona) |
| Preview por PR + deploy mais limpo + sem configs especiais | **Vercel (free)** |
| Proteção server-side de verdade (sem depender do client) | **Vercel Pro** ($20/mês) |
| Exigência corporativa de AWS (compliance, VPN, etc.) | **AWS S3 + CloudFront** |

Para o perfil do projeto — protótipo de design interno, SPA estática, designer liderando — o **Vercel é o melhor custo-benefício**. É mais simples que AWS, mais poderoso que GitHub Pages, e a migração seria praticamente "conectar o repositório e fazer push".

---

*This report was generated as part of the infrastructure evaluation for the Negotiation Flow Platform.*
