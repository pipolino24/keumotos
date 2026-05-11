# KEU Empreendimentos

Sistema completo para a rede **KEU Empreendimentos** — uma família de três
unidades em Juazeiro do Norte/CE:

- **KEU Moto Peças** e Borracharia Padre Cícero — (88) 98814-3757 — @keumotopecas
- **KEU Loca Motos** — Realizando sonhos sobre duas rodas
- **KEU Multimarcas** — Compra, vende, troca — (88) 99850-5859 — @keumultimarcass

## Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript** + **Tailwind CSS v4**
- **lucide-react** para ícones
- Tema customizado vermelho/preto KEU

## Páginas implementadas

### Públicas
- `/` — Landing page com hero, unidades, serviços, destaques e contato
- `/login` — Login para vendedores/admin e clientes (tabs)
- `/register` — Cadastro com escolha de tipo de conta

### Dashboard (vendedores)
- `/dashboard` — Visão geral com KPIs e atalhos
- `/dashboard/vendas` — Catálogo à venda + histórico de transações
- `/dashboard/aluguel` — Locações ativas + frota disponível
- `/dashboard/estoque` — Inventário completo com análise financeira
- `/dashboard/estoque/novo` — Cadastro completo de moto
- `/dashboard/contatos` — Pipeline de leads (Kanban)
- `/dashboard/usuarios` — Clientes, vendedores e admins com ranking

## Modelo de dados das motos

O cadastro segue padrão do mercado brasileiro de revenda:

**Identificação:** marca, modelo, versão, ano fabricação/modelo, cor, placa.

**Documentação:** chassi (17 dígitos), RENAVAM (11 dígitos), número do motor.

**Especificações técnicas:** cilindrada, potência, km, combustível
(flex / gasolina / elétrica), câmbio (manual / automático / semi / CVT),
partida (elétrica / pedal / ambas).

**Valores comerciais:**
- **Valor FIPE** — referência de mercado
- **Valor de compra** — custo de aquisição
- **Valor anunciado** — preço público
- **Valor mínimo** — limite para negociação
- **Comissão** do vendedor

O formulário calcula automaticamente:
- Margem bruta (anunciado − compra)
- Margem mínima (mínimo − compra)
- Percentual vs FIPE

**Aluguel (quando aplicável):** diária, semanal, mensal, caução.

**Auditoria:** data de entrada, vendedor responsável, fornecedor, loja
(multimarcas / loca / peças), status (disponível / reservada / vendida /
alugada / manutenção).

## Classificação de usuários

- **Admin** — controle total do sistema
- **Vendedor** — acesso ao dashboard de vendas, gerenciamento de leads
- **Cliente** — pode visualizar catálogo e fazer propostas

Vendedores passam por aprovação do administrador antes da ativação.

## Como rodar

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Build de produção

```bash
npm run build
npm start
```
