# 📊 Relatório Técnico: Algoritmo de Pontuação Facial

---

## 1. Visão Geral da Arquitetura

O scoring facial é calculado em **3 camadas**:

```
┌─────────────────────────────────────────────────────────────┐
│  ENTRADA: 3 imagens (frontal, perfil esquerdo, perfil direito)│
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 1 — EXTRAÇÃO (MediaPipe FaceMesh 468 landmarks)      │
│  • Frontal: 468 pontos → simetria, terços, DIP, inclinação  │
│  • Perfis:  468 pts cada → ângulo nasolabial, Ricketts,      │
│             contorno mandibular                              │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 2 — NORMALIZAÇÃO (DIP = Distância Interpupilar)     │
│  Todas as distâncias/ângulos → z-score vs população de ref. │
└─────────────────────┬───────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  CAMADA 3 — AGREGAÇÃO (Pesos fixos → Score 0-100)           │
│  Frontal 60% + Perfil 40% → overall_score                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Detecção e Validação (Pré-Scoring)

### 2.1 Landmarks MediaPipe (468 pontos)
```python
# Índices principais usados (zero-based)
OLHO_ESQ_CENTRO = 33      # Centro olho esquerdo
OLHO_DIR_CENTRO = 263     # Centro olho direito
NARIZ_PONTA = 1           # Ponta do nariz
MENTO = 152               # Mento (queixo)
GLABELLA = 8              # Glabela (entre sobrancelhas)
SUBNASALE = 2             # Subnasale (base nariz)
```

### 2.2 Validações Obrigatórias (Rejeitam antes de pontuar)
| Validação | Critério | Erro HTTP |
|-----------|----------|-----------|
| **Pose frontal** | `|roll| ≤ 5°` e `|yaw| ≤ 5°` | 422 "Rosto inclinado" |
| **DIP > 0** | Distância interpupilar calculável | 422 "Não foi possível calcular DIP" |
| **Perfil válido** | Landmarks 234 (maxila) e 454 (mandíbula) detectados | 422 "Perfil não detectado" |
| **Imagens únicas** | Histograma frontal ≠ perfil (similaridade < 0.95) | 422 "Fotos idênticas" |

---

## 3. Métricas Base (Camada 1)

### 3.1 DIP — Distância Interpupilar (Normalizador)
```python
def calcular_dip(landmarks):
    olho_esq = landmarks[OLHO_ESQ_CENTRO]   # ponto 33
    olho_dir = landmarks[OLHO_DIR_CENTRO]   # ponto 263
    return hypot(olho_esq.x - olho_dir.x, olho_esq.y - olho_dir.y)
```
**Uso**: Todas as distâncias lineares são divididas pelo DIP → **adimensional, invariante a escala**.

### 3.2 Simetria Lateral (Frontal)
```python
# 15 pares de landmarks simétricos (MediaPipe)
PARES_SIMETRIA = [
    (33, 263),   # centros dos olhos
    (133, 362),  # cantos internos olhos
    (61, 291),   # cantos da boca
    (234, 454),  # laterais da face (maxila/mandíbula)
    # ... + 11 pares de sobrancelhas, bochechas, nariz
]

def calcular_simetria(landmarks, dip):
    assimetrias = []
    for esq, dir in PARES_SIMETRIA:
        # Distância horizontal normalizada de cada ponto ao eixo central
        dx_esq = abs(landmarks[esq].x - centro_x) / dip
        dx_dir = abs(landmarks[dir].x - centro_x) / dip
        assimetrias.append(abs(dx_esq - dx_dir))  # diferença absoluta

    assimetria_media = mean(assimetrias)
    score = zscore_to_score(assimetria_media, REFERENCIAS["simetria"])  # μ=0.02, σ=0.01
    return score, {"assimetria_media": assimetria_media}
```
**Referência populacional**: `μ=0.02, σ=0.01` (assimetria média normalizada por DIP)

### 3.3 Terços Faciais (Frontal) — Proporções Verticais
```python
def calcular_tercos(landmarks, dip):
    trichion    = landmarks[10]    # linha do cabelo (aprox)
    glabella    = landmarks[8]     # glabela
    subnasale   = landmarks[2]     # base do nariz
    menton      = landmarks[152]   # mento

    # Distâncias verticais normalizadas
    terco_sup = abs(glabella.y - trichion.y)    / dip
    terco_med = abs(subnasale.y - glabella.y)   / dip
    terco_inf = abs(menton.y - subnasale.y)     / dip

    return {
        "superior": terco_sup,
        "medio":    terco_med,
        "inferior": terco_inf,
    }, {"terco_sup": terco_sup, "terco_med": terco_med, "terco_inf": terco_inf}
```

**Referências populacionais (razão / DIP)**:
| Terço | μ (média) | σ (desvio) | Ideal estético |
|-------|-----------|------------|----------------|
| Superior (testa) | 0.38 | 0.03 | ~1/3 |
| Médio (nariz)    | 0.33 | 0.02 | ~1/3 |
| Inferior (mandíbula) | 0.35 | 0.03 | ~1/3 |

> **Nota**: A soma ≈ 1.06 (não exatamente 1.0) pois landmarks não cobrem 100% da face.

### 3.4 Ângulo Nasolabial (Perfil)
```python
def calcular_angulo_nasolabial(landmarks):
    # Perfil: pontos do MediaPipe
    subnasale = landmarks[2]      # base nariz
    lab_sup   = landmarks[13]     # lábio superior
    lab_inf   = landmarks[14]     # lábio inferior

    # Vetores: subnasale→lab_sup e subnasale→lab_inf
    v1 = (lab_sup.x - subnasale.x, lab_sup.y - subnasale.y)
    v2 = (lab_inf.x - subnasale.x, lab_inf.y - subnasale.y)
    angulo = degrees(acos(dot(v1,v2) / (norm(v1)*norm(v2))))
    return angulo
```
**Referência**: `μ=100°, σ=8°` (ângulo nasolabial ideal 90-110°)

### 3.5 Análise de Ricketts (Perfil) — Relação Lábio/Queixo
```python
def calcular_ricketts(landmarks, dip):
    # Distâncias horizontais normalizadas
    lab_sup_a_linha_estetica = (landmarks[13].x - linha_estetica_x) / dip
    lab_inf_a_linha_estetica = (landmarks[14].x - linha_estetica_x) / dip
    pogonion_a_linha_estetica = (landmarks[152].x - linha_estetica_x) / dip

    return {
        "superior": lab_sup_a_linha_estetica,   # ideal ≈ -2mm a -4mm (atrás da linha)
        "inferior": lab_inf_a_linha_estetica,   # ideal ≈ -1mm a -3mm
        "pogonion": pogonion_a_linha_estetica,  # ideal ≈ 0 a +2mm
    }
```

### 3.6 Contorno Mandibular / Score de Perfil
```python
def _calcular_score_perfil(landmarks, dip):
    # Razão: altura mandibular / largura mandibular
    gonion_esq = landmarks[234]
    gonion_dir = landmarks[454]
    menton = landmarks[152]

    largura = hypot(gonion_esq.x - gonion_dir.x, gonion_esq.y - gonion_dir.y) / dip
    altura  = abs(menton.y - (gonion_esq.y + gonion_dir.y)/2) / dip
    razao = altura / largura  # ideal ≈ 1.35 (proporção áurea inversa)

    return zscore_to_score(razao, mean=1.35, std=0.2)
```

### 3.7 Inclinação (Roll/Yaw) — Validação, não pontuação
```python
def calcular_inclinacao(landmarks):
    # Roll: inclinação lateral (linha dos olhos)
    olho_esq = landmarks[33]
    olho_dir = landmarks[263]
    roll = degrees(atan2(olho_dir.y - olho_esq.y, olho_dir.x - olho_esq.x))

    # Yaw: rotação horizontal (assimetria narinas/olhos)
    narina_esq = landmarks[98]
    narina_dir = landmarks[327]
    yaw = degrees(asin((narina_dir.x - narina_esq.x) / dip))

    return roll, yaw
```
**Threshold**: `|roll| > 5°` ou `|yaw| > 5°` → **REJEITA** a análise (422).

---

## 4. Normalização: Z-Score → Score 0-100 (Camada 2)

Todas as métricas brutas → **Z-Score** vs população de referência → **Gaussiana → 0-100**:

```python
def zscore_to_score(valor, mean, std):
    """
    Converte valor bruto em score 0-100 usando distribuição normal.
    
    z = (valor - mean) / std
    score = 100 * exp(-0.5 * z^2)  # curva gaussiana centrada na média
    
    Propriedades:
    - valor == mean        → score = 100
    - valor == mean ± 1σ   → score ≈ 60.7
    - valor == mean ± 2σ   → score ≈ 13.5
    - valor == mean ± 3σ   → score ≈ 1.1
    """
    z = (valor - mean) / std
    return max(0.0, min(100.0, 100.0 * math.exp(-0.5 * z * z)))
```

**Referências populacionais (hardcoded em `analysis_service.py:REFERENCIAS`)**:
```python
REFERENCIAS = {
    "simetria":        {"mean": 0.02,  "std": 0.01},    # assimetria média normalizada
    "terco_superior":  {"mean": 0.38,  "std": 0.03},
    "terco_medio":     {"mean": 0.33,  "std": 0.02},
    "terco_inferior":  {"mean": 0.35,  "std": 0.03},
    "angulo_nasolabial": {"mean": 100.0, "std": 8.0},   # graus
}
```

---

## 5. Agregação Final: Pesos Fixos (Camada 3)

### 5.1 Fórmula do Overall Score
```python
# Pesos explícitos (linhas 553-560 em analysis_service.py)
overall_score = (
    score_simetria      * 0.20    # 20% - Simetria lateral frontal
    + score_terco_sup   * 0.13    # 13% - Terço superior
    + score_terco_med   * 0.13    # 13% - Terço médio
    + score_terco_inf   * 0.14    # 14% - Terço inferior
    + score_nasolabial  * 0.20    # 20% - Ângulo nasolabial (perfil)
    + score_perfil      * 0.20    # 20% - Contorno mandibular (perfil)
)
```

### 5.2 Resumo dos Pesos
| Componente | Peso | Origem | Categoria |
|------------|------|--------|-----------|
| Simetria | **20%** | Frontal | Simetria |
| Terço Superior | **13%** | Frontal | Terços |
| Terço Médio | **13%** | Frontal | Terços |
| Terço Inferior | **14%** | Frontal | Terços |
| Ângulo Nasolabial | **20%** | Perfil | Perfil |
| Contorno Mandibular | **20%** | Perfil | Perfil |
| **TOTAL** | **100%** | | |

> **Frontal = 60%** (Simetria 20% + Terços 40%)  
> **Perfil = 40%** (Nasolabial 20% + Mandíbula 20%)

### 5.3 Harmony Score = Overall Score
```python
"harmony_score": round(overall_score, 1)  # alias idêntico
```

### 5.4 Confidence Score
```python
confidence = 1.0  # FIXO — todas 3 fotos são OBRIGATÓRIAS
```
> Se no futuro permitir análise só frontal: `confidence = 0.6` (frontal) ou `0.8` (frontal+1perfil)

---

## 6. Categorias e Badges (Saída para UI)

```python
def badge(score):
    if score >= 90: return "Excelente"
    if score >= 75: return "Muito Bom"
    if score >= 60: return "Bom"
    return "Regular"

categories = [
    {"name": "Simetria Lateral",      "score": round(score_simetria, 1), "badge": badge(score_simetria)},
    {"name": "Terços Faciais",        "score": round(mean(tercos_scores), 1), "badge": badge(mean(tercos_scores))},
    {"name": "Ângulo Nasolabial",     "score": round(score_nasolabial, 1), "badge": badge(score_nasolabial)},
    {"name": "Contorno Mandibular",   "score": round(score_perfil, 1), "badge": badge(score_perfil)},
]
```

### 6.1 Radar Data (Visualização)
```python
radar_data = [
    {"feature": "Simetria",      "score": round(score_simetria)},
    {"feature": "Terço Superior", "score": round(score_terco_sup)},
    {"feature": "Terço Médio",    "score": round(score_terco_med)},
    {"feature": "Terço Inferior", "score": round(score_terco_inf)},
    {"feature": "Nasolabial",     "score": round(score_nasolabial)},
    {"feature": "Mandíbula",      "score": round(score_perfil or 0)},
]
```

### 6.2 Thirds Data (Barras)
```python
thirds_data = [
    {"label": "Terço Superior (Testa)", "value": tercos["superior"]},   # razão/DIP
    {"label": "Terço Médio (Nariz)",    "value": tercos["medio"]},
    {"label": "Terço Inferior (Mand.)", "value": tercos["inferior"]},
]
```

### 6.3 Highlights (Destaques Textuais)
Gerados por thresholds:
| Condição | Texto |
|----------|-------|
| `score_simetria >= 85` | "Simetria Facial Excelente" |
| `90 <= angulo_nasolabial <= 110` | "Ângulo Nasolabial Ideal" |
| `todos terços >= 80` | "Terços Faciais Equilibrados" |
| `ricketts.superior > 0` | "Lábio Superior em Posição Ideal" |
| `score_perfil >= 80` | "Contorno Mandibular Definido" |
| `roll == 0 and yaw == 0` | "Pose Frontal Perfeita" |
**Máximo 4 highlights** retornados.

---

## 7. Exemplo Numérico Completo

### Entrada: Rosto "Ideal" (valores na média populacional)
| Métrica | Valor Bruto | Z-Score | Score 0-100 |
|---------|-------------|---------|-------------|
| Simetria | 0.02 | 0.0 | **100.0** |
| Terço Sup | 0.38 | 0.0 | **100.0** |
| Terço Med | 0.33 | 0.0 | **100.0** |
| Terço Inf | 0.35 | 0.0 | **100.0** |
| Nasolabial | 100° | 0.0 | **100.0** |
| Mandíbula | 1.35 | 0.0 | **100.0** |

### Overall Score
```
= 100*0.20 + 100*0.13 + 100*0.13 + 100*0.14 + 100*0.20 + 100*0.20
= 20 + 13 + 13 + 14 + 20 + 20
= **100.0**
```

### Entrada: Rosto com Desvios (1σ em tudo)
| Métrica | Valor | Z | Score |
|---------|-------|---|-------|
| Simetria | 0.03 | +1.0 | 60.7 |
| Terços | +1σ cada | +1.0 | 60.7 |
| Nasolabial | 108° | +1.0 | 60.7 |
| Mandíbula | 1.55 | +1.0 | 60.7 |

**Overall** = 60.7 × (0.20+0.13+0.13+0.14+0.20+0.20) = **60.7** → Badge "Bom"

---

## 8. Pontos de Atenção / Limitações Conhecidas

| # | Issue | Impacto | Mitigação |
|---|-------|---------|-----------|
| 1 | **Referências hardcoded** em `REFERENCIAS` dict | Não ajustável sem deploy | Mover para `config.py` ou DB |
| 2 | **Pesos fixos** (não configuráveis) | Diferentes etnias/idades precisam pesos distintos | Adicionar `SCORING_WEIGHTS` em Settings |
| 3 | **DIP pode falhar** se olhos não detectados | Rejeita análise (422) | Fallback: distância entre pupilas detectadas |
| 4 | **Landmarks de perfil** usam índices frontais | MediaPipe perfil ≠ frontal | Validado empiricamente, mas não garantido |
| 5 | **Trichion (linha cabelo)** = ponto 10 (aprox) | Terço superior impreciso em calvos/cabelo longo | Opcional: upload de foto com cabelo puxado |
| 6 | **Confidence = 1.0 fixo** | Não reflete qualidade real da detecção | Calcular baseado em `detection_confidence` do MediaPipe |

---

## 9. Como Estender / Customizar

### 9.1 Adicionar Nova Métrica
1. Criar função em `geometry_service.py` ou `analysis_service.py`
2. Adicionar entrada em `REFERENCIAS` com `mean`, `std`
3. Calcular `zscore_to_score(nova_metrica, **REFERENCIAS["nova"])`
4. Adicionar peso na fórmula `overall_score` (somar 100%)
5. Adicionar em `categories`, `radar_data`, `highlights`

### 9.2 Ajustar Pesos por Perfil (Ex: Etário)
```python
# Futuro: weights por faixa etária
SCORING_WEIGHTS_BY_AGE = {
    "18-25": {"simetria": 0.20, "tercos": 0.40, "perfil": 0.40},
    "26-40": {"simetria": 0.15, "tercos": 0.35, "perfil": 0.50},  # mandíbula mais importante
    "40+":   {"simetria": 0.10, "tercos": 0.30, "perfil": 0.60},
}
```

### 9.3 Calibrar Referências Populacionais
Coletar N≥1000 análises → calcular μ, σ reais por métrica → atualizar `REFERENCIAS`.

---

## 10. Arquivos Envolvidos

| Arquivo | Responsabilidade |
|---------|------------------|
| `app/services/analysis_service.py` | Orquestração, scoring, pesos, resposta |
| `app/services/geometry_service.py` | Cálculos puros: ângulos, distâncias, proporções |
| `app/services/face_detection_service.py` | MediaPipe FaceMesh, detecção landmarks |
| `app/schemas/analysis.py` | Schemas Pydantic de request/response |
| `backend/test_analysis_engine.py` | Testes unitários com mocks (468 landmarks) |

---

*Relatório gerado a partir da análise do código em `/home/dambros/Documentos/GitHub/Analise-facial/backend/app/services/analysis_service.py` (linhas 240-612) e `geometry_service.py`.*