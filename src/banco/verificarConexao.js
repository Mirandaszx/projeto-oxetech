const { testarConexao, encerrarPool } = require("./conexao");

testarConexao()
    .then(() => console.log("Conexao com PostgreSQL realizada com sucesso."))
    .catch((erro) => {
        console.error("Falha na conexao com PostgreSQL:", erro.message);
        process.exitCode = 1;
    })
    .finally(encerrarPool);
