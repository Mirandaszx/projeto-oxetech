# Diário de Treino Iron Pump

O Iron Pump nasceu como um diário simples para organizar exercícios durante a semana. Ao longo do projeto, a ideia evoluiu para uma aplicação full stack em que aluno e personal podem construir juntos uma rotina de treino, sem tirar do aluno a liberdade de adaptar os exercícios às próprias necessidades.

Um exemplo disso é a substituição de um exercício: se o personal indicar agachamento livre, mas o aluno precisar realizá-lo na máquina, ele pode ajustar a ficha e continuar registrando normalmente suas séries, repetições e cargas.

## Como a aplicação funciona

Existem três tipos de acesso:

- **Administrador:** cuida das contas dos personais. Ele pode cadastrar novos profissionais, corrigir seus dados e controlar quem continua com acesso à plataforma.
- **Personal:** compartilha seu código de vínculo, aprova ou recusa solicitações e monta fichas para os alunos acompanhados.
- **Aluno:** pode usar o diário sozinho ou solicitar acompanhamento. Ele cria suas próprias fichas, adapta fichas recebidas e registra o resultado real de cada treino.

O aluno não depende de um personal para usar a aplicação. Quando existe acompanhamento, o personal oferece o direcionamento, mas a ficha continua disponível para ajustes do aluno.

## Principais funcionalidades

- Cadastro e login de alunos.
- Edição do próprio nome, email, objetivo de treino e senha.
- Cadastro e gerenciamento de personais pelo administrador.
- Alteração de nome, email e senha dos personais.
- Desativação e reativação de contas sem apagar alunos, fichas ou históricos.
- Solicitação, aprovação, recusa e encerramento de acompanhamento.
- CRUD completo de fichas de treino.
- Criação de fichas pelo aluno, mesmo com acompanhamento ativo.
- Edição pelo aluno de fichas criadas pelo personal.
- Registro de séries, repetições e cargas realizadas.
- Histórico dos treinos concluídos.
- Filtros do histórico por ficha e período.
- Pesquisa de alunos por nome, email ou objetivo no painel do personal.
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
DEMO_PERSONAL_NAME=Personal Iron Pump
DEMO_PERSONAL_EMAIL=personal@ironpump.com
DEMO_PERSONAL_PASSWORD=123456
DEMO_PERSONAL_CODE=IP-DE1234
DEMO_ALUNO_NAME=Aluno Demonstracao
DEMO_ALUNO_EMAIL=aluno@ironpump.com
DEMO_ALUNO_PASSWORD=123456
DEMO_ALUNO_OBJECTIVE=Hipertrofia
```

O valor de `DATABASE_URL` deve usar o usuário, a senha e a porta da sua instalação do PostgreSQL. Se a senha possuir caracteres especiais, eles precisam ser codificados para uso em uma URL.

O arquivo `.env` contém informações particulares e já está no `.gitignore`. Ele não deve ser enviado ao GitHub.

### 4. Crie as tabelas

```bash
npm run db:check
npm run db:migrate
```

O primeiro comando confirma que a conexão está funcionando. O segundo executa as migrations pendentes e prepara todas as tabelas necessárias. O servidor também verifica essas migrations ao iniciar, o que ajuda na primeira execução em um banco vazio durante o deploy.

### 5. Prepare os dados de demonstração

```bash
npm run db:seed
```

Esse comando deixa o projeto pronto para ser apresentado. Ele prepara os três perfis, cria um vínculo entre o personal e o aluno, adiciona uma ficha montada pelo personal e registra um treino concluído pelo aluno. O comando pode ser executado novamente sem duplicar essas informações.

### 6. Inicie a aplicação

```bash
npm start
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

## Usuários de teste

Depois de executar `npm run db:seed`, estes acessos ficam disponíveis:

| Perfil | Email | Senha |
| --- | --- | --- |
| Administrador | `admin@ironpump.com` | `123456` |
| Personal | `personal@ironpump.com` | `123456` |
| Aluno | `aluno@ironpump.com` | `123456` |

O código de vínculo do personal de demonstração é `IP-DE1234`. O aluno já começa acompanhado por esse personal, com uma ficha de três exercícios e um treino no histórico. Assim, é possível entrar em qualquer perfil e entender a proposta sem precisar preencher tudo antes.

Mesmo sem executar o seed, a aplicação cria automaticamente o administrador definido no `.env` ao iniciar um banco vazio.

## Fluxo sugerido para avaliação

Uma forma simples de conhecer todo o fluxo é:

1. Entrar como administrador para consultar a equipe e cadastrar um novo personal.
2. Ainda como administrador, editar os dados do personal, desativar a conta e conferir que ela não consegue entrar. Depois, reativá-la.
3. Entrar como personal para visualizar o aluno e montar ou editar uma ficha.
4. Pesquisar um aluno da carteira e filtrar o histórico por ficha ou período.
5. Entrar como aluno para adaptar os exercícios e registrar séries, repetições e cargas.
6. Abrir “Meu perfil” para alterar o objetivo ou testar uma nova senha.
7. Excluir uma ficha que possua treino registrado e conferir que o histórico foi preservado.
8. Criar outra conta de aluno para testar uma nova solicitação de acompanhamento.

## Gerenciamento de personais

O administrador é responsável por criar as contas dos personais. Depois do cadastro, o profissional recebe um código próprio, que pode ser informado pelos alunos ao solicitarem acompanhamento.

Se algum dado estiver incorreto, o administrador pode alterar o nome e o email. A senha também pode ser trocada, mas é opcional durante a edição: quando os campos de nova senha ficam vazios, a senha atual é mantida.

Em vez de excluir definitivamente um personal, a aplicação permite desativar sua conta. Essa escolha evita a perda acidental do trabalho já realizado. O profissional deixa de conseguir entrar, os tokens que ele já possuía são bloqueados e seu código não pode ser usado por novos alunos. Mesmo assim, os vínculos, as fichas e os históricos permanecem guardados. Se necessário, o administrador pode reativar a mesma conta mais tarde.

Por trás da tela do administrador, esse fluxo usa as seguintes rotas:

- `POST /api/admin/personais`: cadastra um personal.
- `PUT /api/admin/personais/:personalId`: atualiza nome, email e, se informada, a senha.
- `DELETE /api/admin/personais/:personalId`: desativa a conta sem excluir seus dados.
- `PATCH /api/admin/personais/:personalId/status`: reativa a conta.

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

- `usuarios`: administradores, personais e alunos, incluindo o estado ativo ou inativo de cada conta.
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

Qualquer usuário autenticado pode abrir a opção **Meu perfil** para atualizar nome, email e senha. O aluno também pode mudar seu objetivo de treino. A nova senha só é aplicada quando os dois campos de senha são preenchidos corretamente.

Quando um personal é desativado, novos logins e tokens emitidos anteriormente deixam de funcionar. A conta continua listada para o gerenciamento do administrador e pode ser reativada sem perder o trabalho já registrado.

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
- `npm run db:seed`: prepara os usuários e a ficha de demonstração.

## Testes

Para executar a suíte automatizada:

```bash
npm test
```

Os testes percorrem o caminho principal dos três perfis: autenticação, permissões, vínculos, criação e edição de fichas, registro de treinos e preservação do histórico. Há cenários específicos para a edição do próprio perfil e para o administrador, que cadastra um personal, altera seus dados e senha, desativa a conta, confirma o bloqueio do acesso e depois a reativa.

Além da suíte automatizada em memória, os fluxos de perfil e gerenciamento de personais foram conferidos com o PostgreSQL para garantir que as alterações realmente permanecem salvas no banco.

## Licença

Este é um projeto acadêmico distribuído sob a licença ISC.
