# Ativacao do PostgreSQL

A aplicacao usa `memoria` por padrao. Isso permite desenvolver e executar os testes sem instalar um banco local.

## Preparacao

1. Instale o PostgreSQL e crie um banco chamado `iron_pump`.
2. Crie o arquivo `.env` a partir do `.env.example`.
3. Defina `PERSISTENCIA=postgres`.
4. Ajuste `DATABASE_URL` com usuario, senha, endereco, porta e banco corretos.
5. Use `DATABASE_SSL=true` apenas quando o provedor exigir SSL.

Exemplo local:

```env
PERSISTENCIA=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/iron_pump
DATABASE_SSL=false
```

## Comandos

```bash
npm run db:check
npm run db:migrate
npm start
```

O primeiro comando testa a conexao. O segundo executa somente migrations ainda nao registradas na tabela `migracoes`. Ao iniciar o servidor, a conta inicial de administrador e criada caso ainda nao exista.

## Retorno ao modo em memoria

Defina `PERSISTENCIA=memoria` ou remova essa variavel. Nenhuma conexao com PostgreSQL sera aberta e os testes continuarao usando os dados temporarios.
