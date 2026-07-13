# MOGGED STUDIO - Facial Analysis

True facial harmony, decoded by science

## Sobre o MOGGED STUDIO

MOGGED STUDIO e uma plataforma premium de biometria geométrica focada em analise avancada de harmonia facial e alinhamento estrutural. Nossa missao e democratizar o acesso a analises esteticas de alta precisao (razoes douradas, simetria e eixos mandibulares) que anteriormente eram exclusivas de clinicas elite.

## Requisitos

1. Python 3.12
2. Node.js 18+
3. PostgreSQL 14+

## Configuracao do Ambiente

1. Clone o repositorio:

```bash
git clone https://github.com/AnaliseFacial/Analise-facial.git
cd Analise-facial
```

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

Configure o arquivo `.env` (veja `.env.example`):

```bash
cp .env.example .env
# Edite .env com suas configuracoes de banco de dados
```

Execute o backend:

```bash
uvicorn app.main:app --reload --port 8000
```

## Frontend

```bash
cd frontend
npm install
```

Configure o arquivo `.env`:

```bash
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env
```

Execute o frontend:

```bash
npm run dev
```

## API Endpoints

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/api/v1/health` | Nao | Health check |
| POST | `/api/v1/auth/register` | Nao | Registro de usuario |
| POST | `/api/v1/auth/login` | Nao | Login |
| POST | `/api/v1/analysis/calculate-metrics` | Nao | Metricas geometricas por coordenadas |
| POST | `/api/v1/analyze/` | JWT | Analise por foto (base64) |
| GET | `/api/v1/analyze/history` | JWT | Historico de analises |

## Estrutura do Projeto

```
Analise-facial/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # Rotas da API
│   │   ├── core/               # Config, security
│   │   ├── database/           # Conexao SQLAlchemy
│   │   ├── models/             # Modelos ORM
│   │   ├── repositories/       # Data access layer
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Logica de negocio
│   │   └── main.py             # FastAPI app
│   ├── alembic/                # Migrations
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── context/            # Auth context
│   │   ├── hooks/              # Custom hooks (useFaceMesh)
│   │   ├── lib/                # API client
│   │   ├── pages/              # Page components
│   │   └── routes/             # Router config
│   └── package.json
└── README.md
```

## Tecnologias

- **Frontend**: React 18, Vite, Tailwind CSS, MediaPipe FaceMesh, Recharts
- **Backend**: Python 3.12, FastAPI, SQLAlchemy (async), PostgreSQL, MediaPipe, OpenCV
- **Auth**: JWT (python-jose) + bcrypt

## Boas Práticas

1. Strings dinâmicas em React devem usar backticks para evitar erros no Vite
2. Componentes UI importados de `src/components/ui/`
3. Dependencias gerenciadas via `requirements.txt` (Python) e `package.json` (Node)

## Contribuicao

1. Fork o repositorio
2. Crie uma branch: `git checkout -b my-feature`
3. Commit suas alteracoes: `git commit -am 'Add some feature'`
4. Push: `git push origin my-feature`
5. Crie um pull request
