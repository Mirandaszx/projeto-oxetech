const { Pool } = require("pg");

const { ambiente } = require("../config/ambiente");

let pool;

function obterPool() {
    if (pool) {
        return pool;
    }

    if (!ambiente.banco.url) {
        throw new Error("DATABASE_URL nao foi configurada para a persistencia PostgreSQL.");
    }

    pool = new Pool({
        connectionString: ambiente.banco.url,
        ssl: ambiente.banco.ssl ? { rejectUnauthorized: false } : undefined,
        max: ambiente.banco.maxConexoes,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
    });

    pool.on("error", (erro) => {
        console.error("Erro inesperado em uma conexao ociosa do PostgreSQL:", erro);
    });

    return pool;
}

async function testarConexao() {
    await obterPool().query("SELECT 1");
}

async function encerrarPool() {
    if (pool) {
        const poolAtual = pool;
        pool = null;
        await poolAtual.end();
    }
}

module.exports = {
    obterPool,
    testarConexao,
    encerrarPool
};
