# RELATÓRIO DE QA E SEGURANÇA DE PRODUÇÃO — FaceMax
**Versão:** 1.0 | **Data:** 2026-07-16 | **Classificação:** CONFIDENCIAL — Engenharia de QA/Segurança
**Autor:** Hermes Agent — Engenheiro Sênior de QA e Segurança

---

## SUMÁRIO EXECUTIVO

| Métrica | Status | Risco |
|---------|--------|-------|
| **Concorrência (10 users × 5MB)** | ❌ **CRÍTICO** | SQLite + aiosqlite não suporta concorrência real; pool de conexões não configurado; OpenRouter HTTP client sem pool/limites |
| **Race Conditions (DB)** | ❌ **ALTO** | `AnalysisRepository.create()` usa `flush()` + `commit()` sem `SELECT FOR UPDATE` ou transação serializável; dois uploads simultâneos do mesmo usuário podem criar análises duplicadas ou órfãs |
| **RLS / Isolamento de Dados (LGPD)** | ❌ **CRÍTICO** | **Backend usa SQLite (sem RLS nativo)**; Frontend usa Supabase Auth + Storage mas **não há policies RLS definidas no repositório**; qualquer JWT válido pode acessar `analyses` e `storage` de terceiros |
| **Vazamento de Segredos/Stack Traces** | ⚠️ **ALTO** | `HTTPException(detail=f\"Erro na API OpenRouter: {exc.response.text[:300]}\")` vaza trechos da resposta da API externa; `detail=f\"Calculation error: {exc}\"` expõe stack trace interno |
| **Validação de Upload (XSS/Arquivo Corrompido)** | ⚠️ **MÉDIO-ALTO** | Validação **apenas client-side** (5MB, MIME via `file.type`); backend **não valida MIME real, assinatura mágica, dimensões, EXIF**; `cv2.imdecode` processa qualquer bytes sem validação prévia |
| **Rate Limiting / DoS** | ❌ **CRÍTICO** | Zero rate limiting no backend; 10 users × 5MB = 50MB upload simultâneo + 3 chamadas OpenRouter/request → DoS trivial |
| **Segredos em Produção** | ⚠️ **ALTO** | `SECRET_KEY` tem default inseguro com warning apenas em `DEBUG=False`; `OPENROUTER_API_KEY` vazio no `.env.example` |
| **Concorrência DB (SQLite)** | ❌ **CRÍTICO** | `sqlite+aiosqlite` **não suporta escrita concorrente real**; `pool_pre_ping=True` mas sem `pool_size`/`max_overflow`; trava em escrita simultânea |

---

## 1. CONDIÇÕES DE CORRIDA E CONCORRÊNCIA

### 1.1 Análise de Race Conditions no Banco de Dados

#### Cenário: Dois usuários (ou duas abas do mesmo usuário) enviam análise simultaneamente

**Código vulnerável:** `backend/app/repositories/analysis_repository.py:29-41`

```python
async def create(self, analysis_data: dict) -> FacialAnalysis:
    categories_data = analysis_data.pop("categories", [])
    analysis = FacialAnalysis(**analysis_data)
    self.db.add(analysis)
    await self.db.flush()  # ← RACE CONDITION WINDOW ABRE AQUI
    
    for cat_data in categories_data:
        category = AnalysisCategory(analysis_id=analysis.id, **cat_data)
        self.db.add(category)
    
    await self.db.commit()  # ← RACE CONDITION WINDOW FECHA AQUI
    await self.db.refresh(analysis)
    return analysis
```

**Vetores de ataque/falha:**
| Cenário | Resultado | Impacto LGPD |
|---------|-----------|--------------|
| Duas requisições `POST /api/v1/analyze` mesmo `user_id` simultâneas | Duas análises criadas com `status=pending`; frontend recebe apenas o `analysisId` da primeira resposta; segunda análise fica órfã no DB | Dado biométrico órfão sem vínculo com UI — violação de finalidade (LGPD Art. 6º) |
| `flush()` gera ID, mas `commit()` falha (deadlock SQLite) | Análise parcial persistida sem categories; `IntegrityError` não tratado | Dado inconsistente, possível vazamento de `user_id` em logs de erro |
| Concorrência em `get_pending()` (admin) + `create()` (user) | `SELECT ... WHERE status='pending'` lê estado sujo (uncommitted) | Admin vê análises que podem ser roladas back |

**Mitigação obrigatória:**
```python
# 1. Transação serializável + lock de linha no user_id
async def create(self, analysis_data: dict) -> FacialAnalysis:
    async with self.db.begin():  # transação explícita
        # Lock na linha do usuário para serializar criações concorrentes
        await self.db.execute(
            select(User).where(User.id == analysis_data["user_id"]).with_for_update()
        )
        # ... resto do create
```

### 1.2 Teste de Carga: 10 Usuários × 5MB Upload Simultâneo

#### Arquitetura Atual — Gargalos Identificados

| Componente | Configuração Atual | Limite Real | Gap para 10 Users |
|------------|-------------------|-------------|-------------------|
| **DB Engine** | `sqlite+aiosqlite:///./facial_analysis.db` | **1 escritor por vez** (file lock) | **INVIÁVEL** — trava total em escrita concorrente |
| **DB Pool** | `pool_pre_ping=True` apenas | Sem `pool_size`, `max_overflow` | Conexões ilimitadas → OOM em burst |
| **HTTP Client (OpenRouter)** | `httpx.AsyncClient(timeout=60.0)` singleton no `AnalysisService` | Sem `limits=httpx.Limits(max_connections=10, max_keepalive_connections=5)` | 10 requests → 10 conexões TCP simultâneas → esgota file descriptors / rate limit OpenRouter |
| **Uvicorn Workers** | Não configurado (default 1 worker) | 1 processo, 1 thread async | CPU-bound (MediaPipe, cv2) bloqueia event loop |
| **MediaPipe FaceLandmarker** | Instância global `_face_landmarker` | **Não thread-safe** | Concorrência corrompe estado interno → crash/segfault |

#### Plano de Teste de Carga (k6 / Locust)

```yaml
# k6-script.js
export const options = {
  scenarios: {
    ramp_up: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1m',
      preAllocatedVUs: 10,
      maxVUs: 20,
      stages: [
        { target: 5, duration: '30s' },  // warm-up
        { target: 10, duration: '2m' },  // carga alvo: 10 users simultâneos
        { target: 15, duration: '1m' },  // stress além do especificado
        { target: 0, duration: '30s' },  // ramp-down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000'],      // 95% < 5s (inclui OpenRouter)
    http_req_failed: ['rate<0.01'],         // <1% falha
    checks: ['rate>0.99'],
  },
};

const BASE_URL = 'https://api.facemax.app';  // ou localhost:8000

export default function () {
  const userId = __VU;  // 1-10
  const token = login(userId);  // pré-criar usuários de teste
  
  // 1. Upload 3 fotos (5MB cada) via multipart
  const files = [
    { name: 'frontal', data: generateImage(5 * 1024 * 1024), mime: 'image/jpeg' },
    { name: 'left',    data: generateImage(5 * 1024 * 1024), mime: 'image/jpeg' },
    { name: 'right',   data: generateImage(5 * 1024 * 1024), mime: 'image/jpeg' },
  ];
  
  const res = http.post(`${BASE_URL}/api/v1/analyze`, 
    { files },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  check(res, {
    'status 201': (r) => r.status === 201,
    'response has analysis_id': (r) => r.json('id') !== undefined,
    'no duplicate analysis': (r) => {
      // Verificar no DB se não há análises órfãs para este user_id
    },
  });
}
```

**Critérios de Aceite (Go/No-Go para Produção):**
| Métrica | Threshold | Ação se Falhar |
|---------|-----------|----------------|
| Taxa de erro HTTP 5xx | < 0.5% | **BLOQUEAR DEPLOY** — migrar para PostgreSQL + PgBouncer |
| Latência p95 (end-to-end) | < 8s | Otimizar: pool DB, connection pooling OpenRouter, workers Uvicorn |
| Análises duplicadas/órfãs | 0 | Implementar `SELECT FOR UPDATE` + idempotency key |
| CPU usage (MediaPipe) | < 70% sustained | Migrar MediaPipe para worker process separado (Celery/RQ) |
| Memória (RSS) | < 2GB | Configurar `uvicorn --workers 4 --limit-concurrency 50` |

---

## 2. SEGURANÇA DE DADOS E VULNERABILIDADES DE PRODUÇÃO

### 2.1 Auditoria de RLS (Row Level Security) — **FALHA CRÍTICA**

#### Arquitetura Atual
```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js + Supabase)            │
│  • Supabase Auth (JWT)                                          │
│  • Supabase Storage (bucket: analysis-photos)                   │
│  • Supabase Client → `supabase.from('analyses').insert(...)`   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS + JWT no header
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI + SQLite)               │
│  • JWT validation via `get_current_user()` (HS256)              │
│  • SQLAlchemy ORM → SQLite (arquivo local)                      │
│  • **NENHUM RLS — SQLite não suporta**                          │
│  • OpenRouter API Key em `AnalysisService._http.headers`        │
└─────────────────────────────────────────────────────────────────┘
```

#### Matriz de Ameaça — Acesso Não Autorizado a Dados Biométricos

| Vetor de Ataque | Backend (SQLite) | Frontend (Supabase) | Veredito |
|-----------------|------------------|---------------------|----------|
| **JWT manipulado (`sub` alterado)** | `get_current_user()` decodifica `sub` → busca `User` por ID → **acessa dados do user_id injetado** | Supabase RLS **não configurado** no repositório → policy padrão `USING (true)` permite tudo | 🔴 **CRÍTICO** |
| **Token roubado (XSS/localStorage)** | Token válido → `get_current_user()` retorna user legítimo → acesso total aos dados desse user | Mesmo — token válido = acesso total ao bucket `analysis-photos` do user | 🔴 **CRÍTICO** |
| **IDOR em `/api/v1/analysis/history`** | `get_user_analises(user_id)` usa `current_user.id` do JWT → **seguro se JWT íntegro** | `supabase.from('analyses').select().eq('user_id', user.id)` — **depende de RLS** | 🟡 **MÉDIO** (backend OK, frontend falho) |
| **Acesso direto ao Storage** | N/A (backend não usa Supabase Storage) | `getPublicUrl(path)` — **qualquer URL pública acessível**; path contém `user_id` mas não é secreto | 🔴 **CRÍTICO** — fotos biométricas em URL pública! |

#### Policies RLS Necessárias (Supabase SQL) — **AUSENTES NO REPOSITÓRIO**

```sql
-- 1. Tabela 'analyses' — isolamento por user_id
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_analyses" ON analyses
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "users_insert_own_analyses" ON analyses
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "users_update_own_analyses" ON analyses
  FOR UPDATE USING (auth.uid()::text = user_id);

-- ADMIN: policy separada com role 'service_role' ou claim 'is_admin'
CREATE POLICY "admin_see_all" ON analyses
  FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

-- 2. Storage bucket 'analysis-photos' — isolamento por pasta user_id
-- Policy de INSERT (upload)
CREATE POLICY "users_upload_own_folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'analysis-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy de SELECT (visualização)
CREATE POLICY "users_read_own_folder" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'analysis-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy de DELETE (purge)
CREATE POLICY "users_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'analysis-photos' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

**Ação Imediata:** Executar SQL acima no Supabase Dashboard **ANTES** de qualquer deploy em produção. Validar com `supabase db diff` e testes de penetração.

### 2.2 Higienização de Erros em Produção — Vazamento de Segredos

#### Códigos Vulneráveis Encontrados

| Arquivo:Linha | Código Problemático | Vaza |
|---------------|---------------------|------|
| `analysis_service.py:118` | `detail=f\"Erro na API OpenRouter ({exc.response.status_code}): {exc.response.text[:300]}\"` | **Trecho da resposta da API externa** — pode conter chaves, IDs internos, estrutura de erro |
| `analysis_service.py:123` | `detail=f\"Erro ao comunicar com a API de análise: {exc}\"` | **Exception message completo** — stack trace, caminhos de arquivo, variáveis locais |
| `analysis.py:98` | `detail=f\"Calculation error: {exc}\"` | **Stack trace Python** em produção |
| `analysis.py:128` | `detail=f\"Face detection error: {exc}\"` | **Detalhes internos do MediaPipe/OpenCV** |

#### Padrão Obrigatório de Error Handling (Produção)

```python
# backend/app/core/exceptions.py — NOVO ARQUIVO
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import logging
import uuid

logger = logging.getLogger(__name__)

class SanitizedHTTPException(HTTPException):
    """HTTPException que NUNCA vaza detalhes internos em produção."""
    def __init__(self, status_code: int, public_detail: str, internal_detail: str = None):
        super().__init__(status_code=status_code, detail=public_detail)
        self.internal_detail = internal_detail or public_detail

async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = str(uuid.uuid4())[:8]
    
    # Log interno COMPLETO (apenas nos logs do servidor)
    logger.error(
        f"[{request_id}] {request.method} {request.url.path} - {type(exc).__name__}: {exc}",
        exc_info=True,
        extra={"request_id": request_id, "path": request.url.path}
    )
    
    # Resposta pública HIGIENIZADA
    if isinstance(exc, SanitizedHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.detail, "request_id": request_id}
        )
    
    # Erro inesperado — mensagem genérica
    return JSONResponse(
        status_code=500,
        content={
            "error": "Erro interno do servidor",
            "request_id": request_id,
            "message": "Nossa equipe foi notificada. Tente novamente em alguns instantes."
        }
    )

# Uso no analysis_service.py:
raise SanitizedHTTPException(
    status_code=status.HTTP_502_BAD_GATEWAY,
    public_detail="Serviço de análise temporariamente indisponível",
    internal_detail=f"OpenRouter API error: {exc.response.status_code} - {exc.response.text[:500]}"
)
```

### 2.3 Gestão de Segredos — Hardening Obrigatório

| Segredo | Status Atual | Ação Requerida |
|---------|--------------|----------------|
| `SECRET_KEY` | Default inseguro com `warnings.warn` apenas | **Gerar 64 bytes aleatórios**; armazenar em vault (AWS Secrets Manager / Doppler / 1Password CLI); remover default |
| `OPENROUTER_API_KEY` | Vazio no `.env.example` | **Obrigatório em produção**; rotacionar a cada 90 dias; monitorar uso via OpenRouter dashboard |
| `DATABASE_URL` | `sqlite+aiosqlite:///./facial_analysis.db` | **Migrar para PostgreSQL** (Supabase/Neon/RDS) com SSL `require`; connection pooling via PgBouncer |
| JWT `ALGORITHM` | `HS256` (simétrico) | **Migrar para RS256** (chave pública/privada); rotação de chaves sem invalidar sessões |

---

## 3. VALIDAÇÃO DE INPUTS EM LOTE — DEFESA EM PROFUNDIDADE

### 3.1 Matriz de Ameaças de Upload

| Vetor | Validação Atual | Gap | Mitigação Backend |
|-------|-----------------|-----|-------------------|
| **Tamanho > 5MB** | Client-side apenas (`file.size`) | Bypass via `fetch`/Postman/curl | `File(..., max_size=5_242_880)` no FastAPI + middleware de tamanho |
| **MIME Type Spoofing** | `file.type` (client) | `image/jpeg` com payload PHP/JS | **Magic bytes validation** (`python-magic` / `filetype`) |
| **Polyglot Files (GIFAR, PHAR-JPG)** | Nenhuma | Arquivo válido como imagem + script | Re-encode server-side: `cv2.imdecode → cv2.imencode('.jpg')` descarta payloads ocultos |
| **EXIF/GPS Data Leak** | Nenhuma | Metadados de localização, device, timestamp | `piexif.remove()` ou `cv2.imwrite` sem EXIF |
| **Decompression Bomb (ZIP bomb em PNG)** | Nenhuma | `cv2.imdecode` aloca memória baseada em dimensões declaradas | Limite `MAX_IMAGE_PIXELS = 16_000_000` (16MP) + `Image.MAX_IMAGE_PIXELS` |
| **SVG com JavaScript** | `accept="image/*"` no input | SVG é `image/svg+xml` — executa JS no browser | **Bloquear SVG**; aceitar apenas `jpeg`, `png`, `webp`, `heic` |
| **XSS via nome do arquivo** | `file.name` usado no path de storage | `../../../etc/passwd.jpg` ou `<script>.jpg` | Sanitizar: `secure_filename` (werkzeug) + UUID no path |
| **Base64 Data URI Injection** | Frontend envia base64 para `/detect-face` | Payload gigante → DoS memoria | Limite `max_length` no Pydantic `Field(..., max_length=10_000_000)` |

### 3.2 Implementação de Validação Robusta (Backend)

```python
# backend/app/api/v1/endpoints/analysis.py — ADICIONAR
import magic  # python-magic-bin
from fastapi import File, UploadFile, HTTPException, status
from PIL import Image
import io

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_PIXELS = 16_000_000  # 16MP

async def validate_image_file(file: UploadFile) -> bytes:
    """Validação em camadas: tamanho → MIME real → re-encode seguro."""
    # 1. Tamanho (streaming, não carrega tudo na memória)
    content = b""
    async for chunk in file.chunks():
        content += chunk
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(413, "Arquivo excede 5MB")
    
    # 2. Magic bytes (python-magic)
    mime = magic.from_buffer(content, mime=True)
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(415, f"Tipo de arquivo não permitido: {mime}")
    
    # 3. PIL/Pillow valida estrutura + dimensões + re-encode (remove EXIF, polyglots)
    try:
        img = Image.open(io.BytesIO(content))
        img.load()  # Força decode completo
        if img.width * img.height > MAX_PIXELS:
            raise HTTPException(413, f"Imagem muito grande ({img.width}x{img.height}). Máx 16MP.")
        
        # Re-encode para JPEG limpo (strip EXIF, normaliza)
        output = io.BytesIO()
        img.convert("RGB").save(output, format="JPEG", quality=90, optimize=True)
        return output.getvalue()
    except Exception as exc:
        raise HTTPException(422, "Arquivo de imagem corrompido ou inválido")

# Endpoint atualizado:
@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_face(
    frontal: UploadFile = File(...),
    left: UploadFile = File(...),
    right: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validação paralela das 3 imagens
    frontal_bytes, left_bytes, right_bytes = await asyncio.gather(
        validate_image_file(frontal),
        validate_image_file(left),
        validate_image_file(right),
    )
    
    # Converter para base64 para o service existente
    import base64
    data = AnalysisCreate(
        photo_front=f"data:image/jpeg;base64,{base64.b64encode(frontal_bytes).decode()}",
        photo_left=f"data:image/jpeg;base64,{base64.b64encode(left_bytes).decode()}",
        photo_right=f"data:image/jpeg;base64,{base64.b64encode(right_bytes).decode()}",
    )
    ...
```

### 3.3 Rate Limiting — Obrigatório para Produção

```python
# backend/app/core/rate_limit.py — NOVO
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute", "20/second"],  # Global
    storage_uri="redis://localhost:6379/1",     # Redis para multi-worker
)

# No main.py:
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Nos endpoints sensíveis:
@router.post("/analyze", ...)
@limiter.limit("5/minute; 10/hour")  # 5 analyses/min, 10/hour por IP+user
async def analyze_face(request: Request, ...):
    ...
```

---

## 4. PLANO DE TESTES DE QA — EXECUÇÃO OBRIGATÓRIA

### 4.1 Testes de Concorrência e Race Conditions

| ID | Teste | Ferramenta | Critério de Passo | Responsável |
|----|-------|------------|-------------------|-------------|
| CC-01 | 10 users simultâneos upload 3×5MB | k6 / Locust | 0 análises duplicadas/órfãs; 0 deadlocks; p95 < 8s | QA Lead |
| CC-02 | 20 users burst (ramp 0→20 em 10s) | k6 | Taxa erro < 1%; sem OOM; CPU < 80% | QA Lead |
| CC-03 | Mesmo user, 2 abas, submit simultâneo | Playwright (2 contexts paralell / Manual | Apenas 1 análise criada; segunda retorna 409 ou idempotent | Dev |
| CC-04 | Admin lista `pending` enquanto user cria | k6 + script admin | Admin não vê análises em transação não commitada | QA |
| CC-05 | OpenRouter rate limit (429) sob carga | k6 + mock server | Backend retorna 503 sanitizado; não vaza body do 429 | Dev |
| CC-06 | MediaPipe concorrente (10 requests) | pytest-xdist `-n 10` | 0 segfaults; 0 crashes; todos retornam resultado ou erro limpo | Dev |

### 4.2 Testes de Segurança e LGPD

| ID | Teste | Ferramenta | Critério de Passo |
|----|-------|------------|-------------------|
| SEC-01 | JWT com `sub` alterado → acesso a dados alheios | Postman / curl | 401 Unauthorized |
| SEC-02 | Token válido user A → `GET /analyses` → vê apenas user A | Automated test | 0 registros de user B |
| SEC-03 | Supabase Storage: URL pública de user A acessada por user B | Browser / curl | 403 Forbidden (RLS) |
| SEC-04 | Upload arquivo 10MB → reject no backend | curl | 413 Payload Too Large |
| SEC-05 | Upload `shell.php.jpg` (polyglot) → re-encode remove payload | Automated | Arquivo salvo é JPEG válido sem PHP |
| SEC-06 | Upload SVG com `<script>alert(1)</script>` → reject | Automated | 415 Unsupported Media Type |
| SEC-07 | Erro 500 forçado → response não contém stack trace | curl + log check | `{"error": "Erro interno...", "request_id": "abc123"}` |
| SEC-08 | `SECRET_KEY` default em produção → deploy falha | CI/CD check | Pipeline falha se `SECRET_KEY` in `INSECURE_DEFAULTS` |
| SEC-09 | LGPD Art. 18 — Exclusão total de dados do usuário | Script + verify | `DELETE FROM analyses WHERE user_id=?` + Storage purge + logs |
| SEC-10 | LGPD Art. 15 — Exportação completa de dados do usuário | Script + verify | JSON com todas as análises, fotos, metadados |

### 4.3 Testes de Validação de Input (Fuzzing)

| ID | Payload | Esperado |
|----|---------|----------|
| FUZZ-01 | 1000 arquivos 5MB sequenciais | Rate limit ativa após 10/hour |
| FUZZ-02 | PNG com `IDAT` chunk malformado | 422 "Imagem corrompida" |
| FUZZ-03 | JPEG com dimensões 50000×50000 (decompression bomb) | 413 "Imagem muito grande" |
| FUZZ-04 | Base64 de 50MB no `/detect-face` | 413 ou 422 (limite Pydantic) |
| FUZZ-05 | Nome arquivo `../../../etc/passwd.jpg` | Sanitizado para UUID |
| FUZZ-06 | MIME `image/jpeg` mas conteúdo PDF | 415 (magic bytes detectam `application/pdf`) |

---

## 5. ELOs MAIS FRACOS — PRIORIZAÇÃO DE CORREÇÃO

| Prioridade | Elo Fraco | Esforço | Risco se Não Corrigido |
|------------|-----------|---------|------------------------|
| **P0 — BLOQUEANTE** | **SQLite em produção** — não suporta concorrência, sem RLS, sem backup point-in-time | 2-3 dias (migração PostgreSQL + PgBouncer + migração dados) | Perda de dados, indisponibilidade, vazamento LGPD |
| **P0 — BLOQUEANTE** | **RLS ausente no Supabase** — dados biométricos expostos publicamente | 4h (SQL policies + testes) | **Vazamento de dados sensíveis (LGPD Art. 46)** — multa até 2% faturamento |
| **P0 — BLOQUEANTE** | **Validação de upload apenas client-side** | 1 dia (backend validation + re-encode) | RCE via polyglot, DoS via decompression bomb, XSS via SVG |
| **P1 — CRÍTICO** | **Error handling vaza segredos/stack traces** | 4h (exception handler global) | Information disclosure → facilita ataques direcionados |
| **P1 — CRÍTICO** | **Zero rate limiting** | 2h (slowapi + Redis) | DoS trivial, abuso OpenRouter (custo financeiro) |
| **P1 — CRÍTICO** | **MediaPipe global não thread-safe** | 1 dia (worker pool / Celery) | Crashes aleatórios sob carga, segfaults |
| **P2 — ALTO** | **JWT HS256 simétrico + SECRET_KEY default** | 4h (RS256 + vault) | Comprometimento de chave = tokens forjados para qualquer user |
| **P2 — ALTO** | **OpenRouter client sem connection pooling/limits** | 2h (httpx.Limits) | Exaustão de file descriptors, ban por rate limit |
| **P3 — MÉDIO** | **Sem idempotency key no analyze** | 2h (header `Idempotency-Key` + DB unique constraint) | Duplicatas em retry de rede |
| **P3 — MÉDIO** | **Sem observabilidade (metrics, tracing, structured logs)** | 3 dias (OpenTelemetry + Grafana + Loki) | MTTR alto, impossível debugar produção |

---

## 6. CHECKLIST DE GO/NO-GO PARA PRODUÇÃO

| Item | Status | Evidência Necessária |
|------|--------|---------------------|
| [ ] PostgreSQL em produção (não SQLite) | ❌ | `DATABASE_URL` aponta para PG; `alembic upgrade head` ok |
| [ ] PgBouncer configurado (pool 20-50) | ❌ | `SHOW POOLS` no PgBouncer |
| [ ] RLS policies aplicadas no Supabase (analyses + storage) | ❌ | `supabase db diff` limpo; testes SEC-01 a SEC-03 passam |
| [ ] Rate limiting ativo (slowapi + Redis) | ❌ | Teste CC-02 com 20 users → 429 após limite |
| [ ] Validação backend de upload (magic bytes, re-encode, size) | ❌ | Testes FUZZ-01 a FUZZ-06 passam |
| [ ] Error handler global sanitizado | ❌ | Teste SEC-07: 500 retorna JSON limpo + request_id |
| [ ] MediaPipe em worker process separado (Celery/RQ) | ❌ | Teste CC-06: 10 workers concorrentes sem crash |
| [ ] JWT RS256 + rotação de chaves | ❌ | `jwks.json` publicado; tokens assinados com RS256 |
| [ ] SECRET_KEY forte + vault | ❌ | CI falha se `SECRET_KEY` in `INSECURE_DEFAULTS` |
| [ ] OpenRouter client com `httpx.Limits(max_connections=20)` | ❌ | Logs mostram pool reutilizado |
| [ ] Idempotency key no `POST /analyze` | ❌ | Retry com mesmo key → 200 com mesmo analysis_id |
| [ ] LGPD: scripts de exportação/exclusão testados | ❌ | SEC-09, SEC-10 passam |
| [ ] Observabilidade: métricas (Prometheus), traces (Tempo), logs (Loki) | ❌ | Dashboard Grafana com RED metrics |
| [ ] Load test 10 users × 5MB → p95 < 8s, 0 erros | ❌ | Relatório k6 anexado |

---

## 7. PRÓXIMOS PASSOS RECOMENDADOS (ORDEM DE EXECUÇÃO)

### Semana 1 — Fundação (P0)
1. **Dia 1-2:** Migrar SQLite → PostgreSQL (Supabase/Neon/RDS) + PgBouncer
2. **Dia 2:** Aplicar RLS policies no Supabase (SQL anexo na Seção 2.1)
3. **Dia 3:** Implementar validação backend de upload (Seção 3.2)
4. **Dia 4:** Rate limiting (slowapi + Redis) + Error handler global sanitizado
5. **Dia 5:** Testes de integração CC-01 a CC-06, SEC-01 a SEC-10

### Semana 2 — Hardening (P1)
1. **Dia 1-2:** MediaPipe → Celery worker (Redis broker) + task queue
2. **Dia 2:** JWT RS256 + JWKS endpoint + rotação de chaves
3. **Dia 3:** OpenRouter client com connection pooling + retry/backoff
4. **Dia 4:** Idempotency key no analyze endpoint
5. **Dia 5:** LGPD scripts (export/delete) + testes automatizados

### Semana 3 — Observabilidade (P2/P3)
1. OpenTelemetry instrumentation (FastAPI, SQLAlchemy, httpx)
2. Grafana dashboards: RED metrics, DB pool, OpenRouter latency, queue depth
3. Alertas: p95 > 5s, error rate > 1%, queue depth > 50, DB pool exhausted

---

## ANEXO A — SQL PARA RLS NO SUPABASE (COPIAR E EXECUTAR NO SQL EDITOR)

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_categories ENABLE ROW LEVEL SECURITY;

-- Policies para analyses
DROP POLICY IF EXISTS "users_see_own_analyses" ON analyses;
CREATE POLICY "users_see_own_analyses" ON analyses
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_insert_own_analyses" ON analyses;
CREATE POLICY "users_insert_own_analyses" ON analyses
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_update_own_analyses" ON analyses;
CREATE POLICY "users_update_own_analyses" ON analyses
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "users_delete_own_analyses" ON analyses;
CREATE POLICY "users_delete_own_analyses" ON analyses
  FOR DELETE USING (auth.uid()::text = user_id);

-- Admin/Service role vê tudo
DROP POLICY IF EXISTS "service_role_all" ON analyses;
CREATE POLICY "service_role_all" ON analyses
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Policies para analysis_categories (via analysis_id -> analyses.user_id)
DROP POLICY IF EXISTS "categories_via_analysis" ON analysis_categories;
CREATE POLICY "categories_via_analysis" ON analysis_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM analyses a
      WHERE a.id = analysis_categories.analysis_id
      AND a.user_id = auth.uid()::text
    )
  );

-- Storage policies para bucket 'analysis-photos'
-- (Executar no painel Storage > Policies ou via SQL se disponível)
-- INSERT: user só pode upar na própria pasta
-- SELECT: user só pode ler da própria pasta
-- DELETE: user só pode apagar da própria pasta
```

---

## ANEXO B — CONFIGURAÇÃO UVICORN PARA PRODUÇÃO

```bash
# gunicorn + uvicorn workers (CPU-bound: MediaPipe, cv2)
gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --keep-alive 5 \
  --max-requests 1000 \
  --max-requests-jitter 50 \
  --limit-request-fields 100 \
  --limit-request-field_size 8190 \
  --limit-request-line 4094 \
  --worker-connections 1000 \
  --preload
```

```python
# app/main.py — Configuração de pool DB para produção
from sqlalchemy.pool import NullPool  # ou QueuePool com PgBouncer

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=20,           # Conexões persistentes
    max_overflow=10,        # Extras sob carga
    pool_timeout=30,        # Segundos esperando conexão
    pool_recycle=3600,      # Reciclar a cada 1h (evita timeouts PG)
    # Se usando PgBouncer em transaction pooling:
    # poolclass=NullPool,
)
```

---

**FIM DO RELATÓRIO**

*Este documento deve ser revisado pela equipe de Engenharia, Segurança e Legal antes do Go-Live em Produção. Todas as ações P0 são bloqueantes.*