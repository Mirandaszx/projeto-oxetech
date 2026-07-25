const aplicativo = require("./src/aplicacao");
const { ambiente } = require("./src/config/ambiente");
const { inicializarPersistencia } = require("./src/banco/inicializarPersistencia");
const { encerrarPool } = require("./src/banco/conexao");

async function iniciarServidor() {
    // A API so aceita requisicoes depois de validar o banco e executar as migrations.
    await inicializarPersistencia();

    const servidor = aplicativo.listen(ambiente.porta, () => {
        console.log(`Servidor Iron Pump rodando em http://localhost:${ambiente.porta}`);
    });

    async function encerrarServidor() {
        // Fecha servidor e pool para nao deixar conexoes abertas ao encerrar o processo.
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
