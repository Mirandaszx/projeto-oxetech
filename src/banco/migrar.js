const fs = require("fs/promises");
const path = require("path");

const { obterPool, encerrarPool } = require("./conexao");

const diretorioMigracoes = path.resolve(__dirname, "../../database/migrations");

async function executarMigracoes() {
    const pool = obterPool();
    const cliente = await pool.connect();

    try {
        await cliente.query(`
            CREATE TABLE IF NOT EXISTS migracoes (
                nome VARCHAR(255) PRIMARY KEY,
                executada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const arquivos = (await fs.readdir(diretorioMigracoes))
            .filter((arquivo) => arquivo.endsWith(".sql"))
            .sort();

        for (const arquivo of arquivos) {
            const jaExecutada = await cliente.query(
                "SELECT 1 FROM migracoes WHERE nome = $1",
                [arquivo]
            );

            if (jaExecutada.rowCount > 0) {
                continue;
            }

            const sql = await fs.readFile(path.join(diretorioMigracoes, arquivo), "utf8");

            await cliente.query("BEGIN");

            try {
                await cliente.query(sql);
                await cliente.query("INSERT INTO migracoes (nome) VALUES ($1)", [arquivo]);
                await cliente.query("COMMIT");
                console.log(`Migration executada: ${arquivo}`);
            } catch (erro) {
                await cliente.query("ROLLBACK");
                throw erro;
            }
        }
    } finally {
        cliente.release();
    }
}

if (require.main === module) {
    executarMigracoes()
        .then(() => console.log("Banco de dados atualizado."))
        .catch((erro) => {
            console.error("Falha ao executar migrations:", erro.message);
            process.exitCode = 1;
        })
        .finally(encerrarPool);
}

module.exports = { executarMigracoes };
