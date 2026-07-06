# Arquitetura de Agentes de IA (SaaS Core)

Este documento estabelece o mapeamento estrutural, técnico e operacional dos agentes autónomos integrados no ecossistema da aplicação, alinhados com o ecossistema do **React 18** e as dependências nativas de alta performance.

---

## 🚀 1. Visão Geral da Arquitetura

O sistema baseia-se numa orquestração de microsserviços orientados a eventos, onde múltiplos agentes especializados colaboram para gerir processos de análise, interface líquida (via WebGL Shaders) e sincronização de dados distribuídos.

```
                    ┌──────────────────────────┐
                    │     Interface React 18   │
                    └─────────────┬────────────┘
                                  │ (Eventos/SaaS API)
                                  ▼
                    ┌──────────────────────────┐
                    │    Agente Orquestrador   │
                    └──────┬────────────┬──────┘
                           │            │
            ┌──────────────┴───┐    ┌───┴──────────────┐
            │ Agent-Reach (UI) │    │ Analytics Agent  │
            └──────────────────┘    └──────────────────┘
```

---

## 🤖 2. Mapeamento de Agentes Ativos

### ⚡ 2.1. Agente de Alcance e Interface (`Agent-Reach`)
* **Pasta de Domínio:** `frontend/src/components/ui/` e diretórios complementares.
* **Propósito:** Monitorizar, adaptar e otimizar componentes de UI complexos (como o nosso `HeroGradient` em Shaders nativos/WebGL).
* **Responsabilidades:**
  * Garantir compatibilidade estrita do ecossistema JSX com o compilador do React 18.
  * Otimizar o ciclo de vida de renderização nos nós `<Canvas>` para impedir a reinicialização inválida de Hooks (`Invalid hook call`).
  * Assegurar que os uniformes e geometrias carregados na thread 3D mantêm performance fluida em ecrãs de alta densidade de píxeis.

### 📊 2.2. Agente de Auditoria de Configuração e Compilação
* **Propósito:** Manter a consistência estrutural dos ficheiros de tipagem e empacotamento (`tsconfig.json`, `tailwind.config.js`).
* **Responsabilidades:**
  * Impedir que o motor de varredura do Tailwind intersete acidentalmente o diretório `node_modules`.
  * Garantir o alinhamento da resolução de módulos com as normas modernas de empacotamento (`moduleResolution: "Bundler"`).

---

## 🛠️ 3. Protocolo de Comunicação e Regras Estritas de Engenharia

Para prevenir regressões técnicas, todos os agentes e engenheiros que atuem na infraestrutura devem respeitar o seguinte protocolo:

1. **Alineamento de Dependências:** É estritamente proibido atualizar componentes do Three.js/React Three Fiber para versões dependentes do React 19. As versões devem permanecer fixadas conforme a tabela homologada:
   * `react` / `react-dom`: `^18.3.1`
   * `@react-three/fiber`: `8.18.0`
   * `@react-three/drei`: `9.102.6`
   * `three`: `0.160.0`
2. **Isolamento de Estado:** Inicializações de renderizadores 3D devem ser efetuadas via `useMemo` ou referências diretas (`useRef`) nativas, blindando a renderização core de efeitos colaterais na árvore geral de componentes.
3. **Ponto de Entrada Unificado:** O ficheiro `index.html` deve conter exclusivamente a div de ancoragem com o identificador nativo `root` e a injeção via módulo para `/src/main.tsx`.

---

## 📅 4. Histórico de Sincronização de Estado (Git workflow)

* **Main Branch:** Mantida em total paridade com o upstream (`origin/main`).
* **Regra de Commit:** Commits estruturais devem ser unificados com mensagens semânticas (`feat:`, `chore:`, `fix:`) garantindo que alterações no módulo `Agent-Reach` são rastreadas de forma independente e segura.
