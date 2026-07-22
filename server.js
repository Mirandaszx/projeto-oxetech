const aplicativo = require("./src/aplicacao");
const { ambiente } = require("./src/config/ambiente");
const { inicializarPersistencia } = require("./src/banco/inicializarPersistencia");
const { encerrarPool } = require("./src/banco/conexao");

async function iniciarServidor() {
    await inicializarPersistencia();

    const servidor = aplicativo.listen(ambiente.porta, () => {
        console.log(
            `Servidor Iron Pump rodando em http://localhost:${ambiente.porta} `
            + `com persistencia em ${ambiente.persistencia}`
        );
    });

    async function encerrarServidor() {
        servidor.close(async () => {
            await encerrarPool();
            process.exit(0);
        });
    }

    process.once("SIGINT", encerrarServidor);
    process.once("SIGTERM", encerrarServidor);
}

iniciarServidor().catch((erro) => {
    console.error("Nao foi possivel iniciar o servidor:", erro.message);
    process.exitCode = 1;
});
