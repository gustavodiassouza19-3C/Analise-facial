# 📋 Análise Completa do Backend — Análise Facial

---

## 📦 Resumo Executivo

| Item | Status | Risco |
|------|--------|-------|
| **Arquitetura** | ✅ Clean Architecture | Baixo |
| **Stack** | FastAPI + SQLAlchemy Async + Pydantic v2 + MediaPipe | Baixo |
| **Testes Unitários** | ✅ 17/17 passando | Baixo |
| **Dependências** | ✅ `requirements.txt` + `requirements-dev.txt` criados | **Crítico (resolvido)** |
| **Config Pydantic** | ✅ Corrigido para `SettingsConfigDict` | Médio (resolvido) |
| **Endpoints** | ⚠️ `/analysis` vs `/analyze/face` duplicados | **Alto** |
| **Auth** | ⚠️ JWT sem expiração configurável | Médio |
| **Model User** | ❌ Ausente (FK órfão em `FacialAnalysis.user_id`) | **Crítico** |
| **Alembic** | ❌ Não configurado | Médio |
| **Validação Pydantic** | ⚠️ `extra='ignore'` ausente | Baixo |

---

## 🔴 Issues Críticos (Corrigidos ou Requerem Ação)

### 1. ❌ **Dependências não existia `requirements.txt`/`pyproject.toml`** — **RESOLVIDO**
- **Risco**: Deploy impossível, CI/CD falharia, ambiente irreprodutível.
- **Ação**: Criados:
  - `backend/requirements.txt` (36 deps de produção pinadas)
  - `backend/requirements-dev.txt` (testes, linting, typing)

### 2. ❌ **Model `User` ausente** — **BLOQUEANTE**
- `FacialAnalysis.user_id` é FK para `users.id`, mas `app/models/user.py` **não existia**.
- **Ação**: Criado `/home/dambros/Documentos/GitHub/Analise-facial/backend/app/models/user.py` com:
  ```python
  class User(Base):
      __tablename__ = "users"
      id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
      email = Column(String(255), unique=True, index=True, nullable=False)
      hashed_password = Column(String(255), nullable=False)
      is_active = Column(Boolean, default=True)
      created_at = Column(DateTime, default=datetime.utcnow)
  ```

### 3. ⚠️ **Endpoints duplicados/confusos: `/api/v1/analysis/` vs `/api/v1/analyze/face`**
| Endpoint | Método | Responsabilidade | Status |
|----------|--------|------------------|--------|
| `/analysis/` | POST | Cria análise completa (frontal + perfil + user_id) | ✅ Principal |
| `/analyze/face` | POST | Análise simplificada (só frontal, sem user) | ⚠️ Duplicado |
| `/analysis/calculate-metrics` | POST | Cálculo geométrico direto (sem MediaPipe) | ✅ Útil para frontend |

**Recomendação**: Consolidar em **um único fluxo** ou documentar claramente:
- `/analysis/` = análise completa autenticada (salva no BD)
- `/analyze/face` = análise rápida anônima (não salva, só frontend)
- Remover `/analyze/face` se não usado pelo frontend.

---

## 🟠 Issues Médios

### 4. **Config Pydantic v2 inválida** — **CORRIGIDO**
```python
# ANTES (quebra em pydantic-settings >= 2.1)
class Settings(BaseSettings):
    model_config = {"env_file": ".env", "case_sensitive": True}

# DEPOIS (corrigido em app/core/config.py)
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")
```
- Adicionado `extra="ignore"` para não quebrar com variáveis extras no `.env`.

### 5. **Auth JWT sem expiração configurável**
- `ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7` (7 dias) **hardcoded** em `app/core/security.py`.
- **Fix**: Mover para `Settings` em `config.py`:
  ```python
  ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 dias
  ```

### 6. **Alembic não configurado**
- Migrações manuais via `Base.metadata.create_all` em `app/database/connection.py` (`init_db`).
- **Risco**: Schema drift em produção, sem versionamento, rollback impossível.
- **Fix**: `pip install alembic && alembic init alembic` + configurar `env.py` com `target_metadata = Base.metadata`.

### 7. **`face_detection_service` instância global**
- Em `analysis_service.py`: `from app.services.face_detection_service import face_detection_service`
- **Risco**: MediaPipe `FaceMesh` **não é thread-safe**. Requests concorrentes podem corromper estado.
- **Fix**: Instanciar por request via `Depends()` ou usar `ThreadPoolExecutor` com instância por worker.

### 8. **Validação de `extra='ignore'` ausente nos schemas**
- `AnalysisRequest`, `AnalysisResponse`, etc. não têm `model_config = ConfigDict(extra='ignore')`.
- **Risco**: Campos extras no request não geram erro 422.

---

## 🟢 Issues Menores / Melhorias

### 9. **Scoring weights hardcoded no service**
- `analysis_service.py` importa `settings.SCORING_WEIGHTS` mas também define `SCORING_WEIGHTS` local (linha 580).
- **Fix**: Remover duplicação, usar apenas `settings.SCORING_WEIGHTS`.

### 10. **`geometry_service.py` duplicia lógica do `analysis_service.py`**
- `calcular_angulo`, `calcular_distancia`, `proporcao_aurea` existem nos dois.
- **Fix**: Centralizar em `geometry_service.py` e importar.

### 11. **`calcular_inclinacao` usa landmarks errados para roll**
- Usa `OLHO_ESQ_CENTRO=33` e `OLHO_DIR_CENTRO=263` (cantos externos), mas roll ideal usa **centros das pupilas** (468/473 com `refine_landmarks=True`).
- **Impacto**: Roll impreciso em rostos inclinados.

### 12. **Tratamento de erro HTTP 422 em `validar_foto_perfil` levanta exceção**
- Em `analysis_service.py:158` levanta `HTTPException` direto no service.
- **Anti-pattern**: Service não deve conhecer HTTP. Deve levantar exceção de domínio e endpoint converte.

### 13. **`AnalysisCategory.badge` sem enum/validação**
- `String(50)` livre. Valores esperados: `"excellent"`, `"good"`, `"fair"`, `"poor"`.
- **Fix**: Usar `Enum` no model + `String` no DB ou `CheckConstraint`.

### 14. **Testes de integração (`test_scoring.py`) acoplam-se a servidor rodando**
- Usam `requests` contra `localhost:8000`.
- **Fix**: Usar `TestClient` do FastAPI (`from fastapi.testclient import TestClient`) para testes isolados.

### 15. **Frontend chama endpoints que não existem no backend**
- `frontend/src/lib/api.js` chama `/api/v1/analysis/calculate-metrics` ✅ existe
- Mas também espera `/api/v1/analyze` (router prefix) — verificar se frontend usa `/analysis` ou `/analyze`.

---

## ✅ O que está **BEM FEITO**

| Área | Detalhe |
|------|---------|
| **Arquitetura** | Clean Architecture bem separada: services / repositories / models / schemas / endpoints |
| **Async** | SQLAlchemy `AsyncSession` + `asyncpg`/`aiosqlite` corretos |
| **Pydantic v2** | Schemas bem tipados, `model_validator`, `ConfigDict` |
| **MediaPipe Mock** | `MockMediaPipeFaceMesh` em testes cobre 468 landmarks — **excelente para CI sem GPU** |
| **Scoring Gaussiano** | `zscore_to_score` com curva normal — matematicamente sólido |
| **Validação de Pose** | `validar_foto_perfil` rejeita frontais enviadas como perfil — robusto |
| **DIP Normalização** | Todas distâncias relativas à distância interpupilar — invariante a escala |
| **CORS** | Configurado corretamente em `main.py` para `localhost:5173` (Vite) |
| **Health Check** | `/health` endpoint funcional |

---

## 📋 Checklist de Ação Prioritária

| # | Ação | Arquivo(s) | Esforço |
|---|------|------------|---------|
| 1 | ✅ Criar `requirements.txt` / `requirements-dev.txt` | `backend/` | Feito |
| 2 | ✅ Corrigir `config.py` para `SettingsConfigDict` | `app/core/config.py` | Feito |
| 3 | ✅ Criar `User` model (FK órfão) | `app/models/user.py` | Feito |
| 4 | ⚠️ Consolidar endpoints `/analysis` vs `/analyze/face` | `app/api/v1/endpoints/` | 30 min |
| 5 | ⚠️ Configurar Alembic | `alembic/` | 15 min |
| 6 | ⚠️ Mover `ACCESS_TOKEN_EXPIRE_MINUTES` para `Settings` | `app/core/config.py`, `security.py` | 10 min |
| 7 | ⚠️ `face_detection_service` thread-safe (DI por request) | `app/services/face_detection_service.py`, `analysis_service.py` | 30 min |
| 8 | Adicionar `extra='ignore'` nos schemas | `app/schemas/` | 10 min |
| 9 | Centralizar geometria em `geometry_service.py` | `app/services/geometry_service.py`, `analysis_service.py` | 20 min |
| 10 | Converter `test_scoring.py` para `TestClient` | `test_scoring.py` | 20 min |

---

## 🚀 Como Rodar (Agora Funciona)

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

# Testes unitários (passam)
pytest test_analysis_engine.py -v

# Servidor
uvicorn app.main:app --reload --port 8000

# Testes integração (precisam servidor rodando)
pytest test_scoring.py -v
```

---

## 📁 Arquivos Modificados/Criados nesta Análise

| Arquivo | Ação |
|---------|------|
| `backend/requirements.txt` | **Criado** (36 deps pinadas) |
| `backend/requirements-dev.txt` | **Criado** (testes, lint, typing) |
| `backend/app/core/config.py` | **Corrigido** `SettingsConfigDict` + `extra='ignore'` |
| `backend/app/models/user.py` | **Criado** (model User faltante) |
| `backend/test_analysis_engine.py` | **Reescrito** para pytest nativo (17 testes passam) |

---

**Conclusão**: O backend tem **arquitetura sólida** e **lógica de domínio bem implementada** (scoring, geometria, validação de pose). Os **bloqueadores críticos foram resolvidos** (deps, User model, config). Restam **consolidação de endpoints**, **Alembic**, **thread-safety do MediaPipe** e **testes de integração isolados** para produção.