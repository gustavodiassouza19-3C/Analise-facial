 True facial harmony, decoded by science
    
    Índice
    
    1. Sobre o MOGGED STUDIO
    2. Design System (MOGGED PREMIUM)
    3. Requisitos
    4. Configuração do Ambiente
    5. Instalação de Dependências
    6. Executando o Backend
    7. Executando o Frontend
    8. Estrutura do Projeto
    9. Tecnologias Utilizadas
    10. Boas Práticas
    11. Contribuição
    
    Sobre o MOGGED STUDIO
    
    MOGGED STUDIO é uma plataforma premium de biometria geométrica focada em análise avanzada de harmonia facial e alinhamento estrutural. Nossa missão é democratizar o acesso a análises estéticas de alta precisão (razões douradas, simetria e eixos mandibulares) que anteriormente eram exclusivas de clínicas elite.
    
    Design System (MOGGED PREMIUM)
    
    Our visual identity draws inspiration from luxury editorial design and references such as Exempla, Raycast, and Vercel.
    
    Paleta de Cores Oficial (Classes Tailwind)
    
    - Midnight Obsidian (Fundo Absoluto): bg-[#00090b]
    - Magnetic Gold (Cor de Acento): text-[#D3AB39] / bg-[#D3AB39]
    - Titanio Subduído (Texto Secundário): text-[#a1a1a1]
    - Bordas Translúcidas (Efeito de Corte a Laser): border-white/10 ou border-white/5
    
    Regra de Espaço Reservado
    
    Para componentes visuais ou renderizações 3D que ainda não estão prontos, exiba uma caixa tracejada com o texto centralizado "EM BREVE" em tipografia de espaço detalleado com cores douradas:
    html
    <div className="border-2 border-dashed border-[#D3AB39]/50 w-full h-[200px] flex items-center justify-center">
      <span className="font-mono text-[#D3AB39] tracking-wider">EM BREVE</span>
    </div>
    
    
    Requisitos
    
    A instalação e configuração da aplicação envolve as etapas abaixo. Leia uma seção só se você já completou todas as anteriores:
    
    Novo Repositório
    
    Esse repositório serve como o repositório base do repositório original.
    
    
    
    Pré-requisitos
    
    1. Python 3.12
    2. Django Framework
    3. Node.js
    4. OpenCV
    5. Google Vision API
    6. DataFrame
    
    
    
    Configuração do Ambiente de Desenvolvimento
    
    Para configurar o ambiente de desenvolvimento, siga os passos abaixo:
    
    1. Clone o repositório em sua máquina local:
       
       git clone https://github.com/AnaliseFacial/Analise-facial.git
       
    2. Entre no diretório do repositório:
       
       cd Analise-facial
       
    
    Instalação de Dependências
    
    Backend
    
    1. Crie um ambiente virtual para o backend:
       
       python -m venv venv
       
    
    2. Ativar o ambiente virtual:
       - No Windows:
         
         venv\Scripts\activate
         
       - No Linux/Mac:
         
         source venv/bin/activate
         
    
    3. Instale as dependências do backend rapidamente:
       
       pip install -r requirements.txt
       
    
    4. Entre no Diretório do Frontend
       
       cd frontend
       
    
    5. Instale e Inicie as Dependências de um Frontend e Configure um Link Global
       
       npm install
       
    
    6. Configure um Link Global do APP Frontend para utilizar no APi Application
       
       npm link
       
    
    Executando Backend
    
    Agora que você configurou o ambiente de desenvolvimento e instalou as dependências, você pode executar o backend do sistema de reconhecimento facial da FaceMAX.
    
    Abra um novo terminal e use o comando abaixo para rodar:
    
    pipenv shell
    python manage.py runserver
    
    
    Executando Frontend
    
    Agora que tudo está configurado, você pode executar o frontend. Primeiro, da em um build imagem do APP:
    
    
    npm run start
    
    
    Documentação da API
    
    A API tem endpoints os endpoints de abaixo:
    
    1. Detecção de Faces:
       - POST /api/v1/face/query: Detect face
    
    Estrutura do Projeto
    
    
    Analise-facial/
    ├── backend/
    │   ├── core/
    │   ├── músculos_faciais/
    │   ├── ssh_connect/
    │   └── manage.py
    ├── frontend/
    │   ├── public/
    │   ├── src/
    │   │   ├── components/
    │   │   ├── lib/
    │   │   ├── pages/
    │   │   └── App.tsx
    │   └── package.json
    ├── .gitignore
    └── README.md
    
    
    Tecnologias Utilizadas
    
    - Frontend: React, TypeScript, Vite, Tailwind CSS
    - Backend: Python, Django, OpenCV, Google Vision API
    - Estilo de Codificação: Template strings com craveça (  `) e TypeScript coerente
    
    Boas Práticas
    
    1. Strings Dinâmicas: Todas as strings com concatenação dinâmica em React (${}) deve usar backticks (  `) para evitar erros de compilação no Vite's esbuild.
    2. Configurações de Estilo: Componentes de UI devem ser importados a partir do caminho local como src-components/.
    3. Gerenciamento de Dependências: Todas as dependências devem ser documentadas e gerenciadas através do requirements.txt (Python) e package.json (Node.js).
    
    Contribuição
    
    Para contribuir para este projeto:
    
    1. Faça um fork do repositório.
    2. Crie uma nova branch para sua feature ou correção: git checkout -b my-feature.
    3. Realize suas alterações e commit-as: git commit -am 'Add some feature'.
    4. Envie suas alterações para o repositório original: git push origin my-feature.
    5. Crie um pull request.
    