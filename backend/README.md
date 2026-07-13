# Backend - Análise Facial API

## Estrutura do Projeto

```
backend/
├── app/
│   ├── api/v1/endpoints/    # Rotas FastAPI
│   ├── core/                # Configurações e Segurança
│   ├── database/            # Conexão Async SQLAlchemy
│   ├── models/              # Entidades do Banco
│   ├── schemas/             # Validadores Pydantic
│   ├── repositories/        # Persistência isolada
│   ├── services/            # Lógica de Negócio
│   └── tests/               # Testes
├── alembic/                 # Migrations
└── requirements.txt         # Dependências
```

## Setup

```bash
# Criar virtualenv
python -m venv venv
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar .env
cp .env.example .env

# Rodar migrations
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

### Auth
- `POST /api/v1/auth/register` - Registrar usuário
- `POST /api/v1/auth/login` - Login

### Analysis
- `POST /api/v1/analyze/` - Analisar fotos (autenticado)
- `GET /api/v1/analyze/history` - Histórico de análises

### Health
- `GET /api/v1/health` - Status da API
