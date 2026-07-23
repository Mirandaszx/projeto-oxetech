# Diário de Treino Iron Pump

O Iron Pump nasceu como um diário simples para organizar exercícios durante a semana. Ao longo do projeto, a ideia evoluiu para uma aplicação full stack em que aluno e personal podem construir juntos uma rotina de treino, sem tirar do aluno a liberdade de adaptar os exercícios às próprias necessidades.

Um exemplo disso é a substituição de um exercício: se o personal indicar agachamento livre, mas o aluno precisar realizá-lo na máquina, ele pode ajustar a ficha e continuar registrando normalmente suas séries, repetições e cargas.

## Como a aplicação funciona

Existem três tipos de acesso:

- **Administrador:** cadastra as contas dos personais e acompanha quantos profissionais e alunos estão na plataforma.
- **Personal:** compartilha seu código de vínculo, aprova ou recusa solicitações e monta fichas para os alunos acompanhados.
- **Aluno:** pode usar o diário sozinho ou solicitar acompanhamento. Ele cria suas próprias fichas, adapta fichas recebidas e registra o resultado real de cada treino.

O aluno não depende de um personal para usar a aplicação. Quando existe acompanhamento, o personal oferece o direcionamento, mas a ficha continua disponível para ajustes do aluno.

## Principais funcionalidades

- Cadastro e login de alunos.
- Cadastro de personais pelo administrador.
- Solicitação, aprovação, recusa e encerramento de acompanhamento.
- CRUD completo de fichas de treino.
- Criação de fichas pelo aluno, mesmo com acompanhamento ativo.
- Edição pelo aluno de fichas criadas pelo personal.
- Registro de séries, repetições e cargas realizadas.
- Histórico dos treinos concluídos.
- Exclusão da ficha sem apagar os registros anteriores.
- Autenticação JWT e controle de acesso por perfil.
- Tratamento de respostas `401` e `403` no frontend.

## Tecnologias utilizadas

- HTML, CSS, Tailwind CSS e JavaScript no frontend.
- Node.js e Express no backend.
- PostgreSQL para persistência dos dados.
- JWT para autenticação.
- bcryptjs para proteger as senhas.
- Node Test Runner para os testes automatizados.

## Executando o projeto do zero

### 1. Pré-requisitos

Antes de começar, é necessário ter instalado:

- Node.js 18 ou superior.
- npm.
- PostgreSQL.

### 2. Baixe e instale o projeto

```bash
git clone https://github.com/Mirandaszx/projeto-oxetech.git
cd projeto-oxetech
npm install
```

### 3. Prepare o banco de dados

Com o PostgreSQL em execução, crie um banco chamado `iron_pump`:

```sql
CREATE DATABASE iron_pump;
```

Depois, crie um arquivo `.env` na raiz do projeto usando o `.env.example` como referência:

```env
PORT=3000
JWT_SECRET=troque-por-uma-chave-segura
PERSISTENCIA=postgres
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/iron_pump
DATABASE_SSL=false
DATABASE_POOL_MAX=10
ADMIN_NAME=Administrador Iron Pump
ADMIN_EMAIL=admin@ironpump.com
ADMIN_PASSWORD=123456
```

O valor de `DATABASE_URL` deve usar o usuário, a senha e a porta da sua instalação do PostgreSQL. Se a senha possuir caracteres especiais, eles precisam ser codificados para uso em uma URL.

O arquivo `.env` contém informações particulares e já está no `.gitignore`. Ele não deve ser enviado ao GitHub.

### 4. Crie as tabelas

```bash
npm run db:check
npm run db:migrate
```

O primeiro comando confirma que a conexão está funcionando. O segundo executa as migrations pendentes e prepara todas as tabelas necessárias.

### 5. Inicie a aplicação

```bash
npm start
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

## Acesso inicial e fluxo de teste

Ao iniciar um banco vazio, a aplicação cria automaticamente o administrador definido no `.env`. Com os valores mostrados acima, o acesso é:

- **Email:** `admin@ironpump.com`
- **Senha:** `123456`
- **Perfil:** administrador

Uma forma simples de conhecer todo o fluxo é:

1. Entrar como administrador e cadastrar um personal.
2. Guardar o email, a senha e o código de vínculo desse personal.
3. Criar uma conta de aluno pela tela de cadastro.
4. Entrar como aluno e solicitar acompanhamento usando o código recebido.
5. Entrar como personal, aprovar o aluno e criar uma ficha para ele.
6. Voltar ao aluno para adaptar a ficha e registrar o treino realizado.

## CRUD principal

O principal recurso do sistema é a ficha de treino. Ela possui nome, dia da semana, objetivo e uma lista de exercícios.

Rotas usadas pelo aluno:

- `POST /api/aluno/fichas`: cria uma ficha.
- `GET /api/aluno/fichas`: consulta as fichas.
- `PUT /api/aluno/fichas/:fichaId`: atualiza uma ficha.
- `DELETE /api/aluno/fichas/:fichaId`: exclui uma ficha.

Rotas usadas pelo personal:

- `POST /api/personal/alunos/:alunoId/fichas`: cria uma ficha para o aluno.
- `GET /api/personal/alunos/:alunoId/fichas`: consulta fichas e histórico.
- `PUT /api/personal/alunos/:alunoId/fichas/:fichaId`: atualiza uma ficha criada pelo personal.
- `DELETE /api/personal/alunos/:alunoId/fichas/:fichaId`: exclui uma ficha criada pelo personal.

Quando uma ficha é excluída, seus exercícios deixam de aparecer no diário. Os treinos já realizados continuam no histórico porque cada registro guarda uma cópia dos dados importantes daquela execução.

## Banco de dados

O PostgreSQL utiliza as seguintes tabelas:

- `usuarios`: administradores, personais e alunos.
- `vinculos_acompanhamento`: solicitações e vínculos entre aluno e personal.
- `fichas_treino`: informações gerais das fichas.
- `exercicios_ficha`: exercícios planejados em cada ficha.
- `registros_treino`: data e observações de cada treino realizado.
- `exercicios_registro`: séries, repetições e cargas realmente executadas.
- `migracoes`: controle das migrations já aplicadas.

As tabelas são relacionadas por chaves estrangeiras. Os registros usam snapshots para que a edição ou exclusão de uma ficha não altere o histórico do aluno.

## Autenticação e permissões

Depois do login, a API devolve um token JWT válido por 12 horas. As rotas privadas exigem esse token no cabeçalho `Authorization`.

Além de verificar se o usuário está autenticado, a aplicação também confere seu perfil. Dessa forma, um aluno não consegue acessar funções do administrador e um personal só pode alterar fichas criadas por ele para alunos que estejam em sua carteira.

As senhas nunca são salvas como texto puro. Antes de serem armazenadas, elas passam pelo bcrypt.

## Arquitetura

O backend foi dividido para deixar cada parte com uma responsabilidade clara:

```text
database/
|-- migrations/          # Estrutura versionada do PostgreSQL
src/
|-- banco/               # Conexão, migrations e inicialização
|-- config/              # Variáveis de ambiente
|-- controllers/         # Regras das requisições HTTP
|-- dados/               # Alternativa em memória usada nos testes
|-- middlewares/         # Autenticação, autorização e erros
|-- repositorios/        # Acesso aos dados (camada Model)
|   `-- postgres/        # Consultas e transações SQL
|-- routes/              # Endpoints da API
`-- validacoes/          # Validações reutilizáveis
tests/                   # Testes da API e da interface
```

As rotas recebem as requisições, os controllers aplicam as regras de negócio, os repositórios conversam com o banco e os middlewares protegem o acesso. Essa separação segue a organização Model, Controller, Routes e Middlewares trabalhada durante o curso.

## Comandos úteis

- `npm run dev`: inicia o servidor com recarregamento automático.
- `npm start`: inicia a aplicação normalmente.
- `npm test`: executa os testes automatizados.
- `npm run db:check`: verifica a conexão com o PostgreSQL.
- `npm run db:migrate`: executa as migrations pendentes.

## Testes

Para executar a suíte automatizada:

```bash
npm test
```

Os testes cobrem autenticação, permissões, vínculos, CRUD de fichas, preservação do histórico e renderização dos painéis. O projeto também foi validado manualmente nos três perfis, tanto em desktop quanto em celular.

## Licença

Este é um projeto acadêmico distribuído sob a licença ISC.
