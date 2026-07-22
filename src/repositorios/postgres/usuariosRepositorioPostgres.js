const { randomUUID } = require("crypto");

const { obterPool } = require("../../banco/conexao");

const consultaBaseUsuario = `
    SELECT
        u.id,
        u.nome,
        u.email,
        u.senha_hash,
        u.tipo_usuario,
        u.objetivo_treino,
        u.codigo_vinculo,
        u.criado_em,
        vinculo.personal_id,
        vinculo.status AS status_vinculo
    FROM usuarios u
    LEFT JOIN LATERAL (
        SELECT personal_id, status
        FROM vinculos_acompanhamento
        WHERE aluno_id = u.id
          AND status IN ('pendente', 'ativo')
        ORDER BY solicitado_em DESC
        LIMIT 1
    ) vinculo ON TRUE
`;

function dataIso(data) {
    return data instanceof Date ? data.toISOString() : data;
}

function mapearUsuario(linha) {
    if (!linha) {
        return null;
    }

    return {
        id: linha.id,
        nome: linha.nome,
        email: linha.email,
        senhaHash: linha.senha_hash,
        tipoUsuario: linha.tipo_usuario,
        objetivoTreino: linha.objetivo_treino || "",
        codigoVinculo: linha.codigo_vinculo || null,
        personalId: linha.personal_id || null,
        statusVinculo: linha.tipo_usuario === "aluno"
            ? linha.status_vinculo || "sem_vinculo"
            : null,
        criadoEm: dataIso(linha.criado_em)
    };
}

async function consultarUm(condicao, valores) {
    const resultado = await obterPool().query(
        `${consultaBaseUsuario} WHERE ${condicao} LIMIT 1`,
        valores
    );

    return mapearUsuario(resultado.rows[0]);
}

async function buscarUsuarioPorEmail(email) {
    return consultarUm("u.email = $1", [email]);
}

async function buscarUsuarioPorId(id) {
    return consultarUm("u.id = $1", [id]);
}

async function buscarPersonalPorCodigo(codigoVinculo) {
    const codigoNormalizado = String(codigoVinculo || "").trim().toUpperCase();

    return consultarUm(
        "u.tipo_usuario = 'personal' AND u.codigo_vinculo = $1",
        [codigoNormalizado]
    );
}

async function listarUsuariosPorTipo(tipoUsuario) {
    const resultado = await obterPool().query(
        `${consultaBaseUsuario} WHERE u.tipo_usuario = $1 ORDER BY u.criado_em`,
        [tipoUsuario]
    );

    return resultado.rows.map(mapearUsuario);
}

async function listarAlunosDoPersonal(personalId) {
    const resultado = await obterPool().query(
        `${consultaBaseUsuario}
         WHERE u.tipo_usuario = 'aluno'
           AND vinculo.personal_id = $1
           AND vinculo.status = 'ativo'
         ORDER BY u.nome`,
        [personalId]
    );

    return resultado.rows.map(mapearUsuario);
}

async function listarSolicitacoesDoPersonal(personalId) {
    const resultado = await obterPool().query(
        `${consultaBaseUsuario}
         WHERE u.tipo_usuario = 'aluno'
           AND vinculo.personal_id = $1
           AND vinculo.status = 'pendente'
         ORDER BY u.nome`,
        [personalId]
    );

    return resultado.rows.map(mapearUsuario);
}

async function buscarAlunoDoPersonal(personalId, alunoId) {
    return consultarUm(
        `u.id = $1
         AND u.tipo_usuario = 'aluno'
         AND vinculo.personal_id = $2
         AND vinculo.status = 'ativo'`,
        [alunoId, personalId]
    );
}

async function buscarSolicitacaoDoPersonal(personalId, alunoId) {
    return consultarUm(
        `u.id = $1
         AND u.tipo_usuario = 'aluno'
         AND vinculo.personal_id = $2
         AND vinculo.status = 'pendente'`,
        [alunoId, personalId]
    );
}

async function definirVinculoAluno(alunoId, personalId, statusVinculo) {
    const cliente = await obterPool().connect();

    try {
        await cliente.query("BEGIN");

        const usuario = await cliente.query(
            "SELECT tipo_usuario FROM usuarios WHERE id = $1 FOR UPDATE",
            [alunoId]
        );

        if (usuario.rows[0]?.tipo_usuario !== "aluno") {
            await cliente.query("ROLLBACK");
            return null;
        }

        const vinculoAtual = await cliente.query(
            `SELECT id, status, personal_id
             FROM vinculos_acompanhamento
             WHERE aluno_id = $1 AND status IN ('pendente', 'ativo')
             ORDER BY solicitado_em DESC
             LIMIT 1
             FOR UPDATE`,
            [alunoId]
        );
        const vinculo = vinculoAtual.rows[0];

        if (statusVinculo === "pendente") {
            if (vinculo) {
                const statusEncerrado = vinculo.status === "ativo" ? "encerrado" : "cancelado";

                await cliente.query(
                    `UPDATE vinculos_acompanhamento
                     SET status = $1, encerrado_em = CURRENT_TIMESTAMP
                     WHERE id = $2`,
                    [statusEncerrado, vinculo.id]
                );
            }

            await cliente.query(
                `INSERT INTO vinculos_acompanhamento
                    (id, aluno_id, personal_id, status)
                 VALUES ($1, $2, $3, 'pendente')`,
                [randomUUID(), alunoId, personalId]
            );
        } else if (statusVinculo === "ativo") {
            if (!vinculo || vinculo.personal_id !== personalId || vinculo.status !== "pendente") {
                await cliente.query("ROLLBACK");
                return null;
            }

            await cliente.query(
                `UPDATE vinculos_acompanhamento
                 SET status = 'ativo', respondido_em = CURRENT_TIMESTAMP
                 WHERE id = $1`,
                [vinculo.id]
            );
        } else if (statusVinculo === "sem_vinculo" && vinculo) {
            const statusEncerrado = vinculo.status === "ativo" ? "encerrado" : "cancelado";

            await cliente.query(
                `UPDATE vinculos_acompanhamento
                 SET status = $1, encerrado_em = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [statusEncerrado, vinculo.id]
            );
        }

        await cliente.query("COMMIT");
    } catch (erro) {
        await cliente.query("ROLLBACK");
        throw erro;
    } finally {
        cliente.release();
    }

    return buscarUsuarioPorId(alunoId);
}

async function criarUsuario(usuario) {
    const cliente = await obterPool().connect();

    try {
        await cliente.query("BEGIN");
        await cliente.query(
            `INSERT INTO usuarios (
                id, nome, email, senha_hash, tipo_usuario,
                objetivo_treino, codigo_vinculo, criado_em
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                usuario.id,
                usuario.nome,
                usuario.email,
                usuario.senhaHash,
                usuario.tipoUsuario,
                usuario.objetivoTreino || null,
                usuario.codigoVinculo || null,
                usuario.criadoEm
            ]
        );

        if (usuario.tipoUsuario === "aluno" && usuario.personalId) {
            await cliente.query(
                `INSERT INTO vinculos_acompanhamento
                    (id, aluno_id, personal_id, status)
                 VALUES ($1, $2, $3, $4)`,
                [
                    randomUUID(),
                    usuario.id,
                    usuario.personalId,
                    usuario.statusVinculo || "pendente"
                ]
            );
        }

        await cliente.query("COMMIT");
    } catch (erro) {
        await cliente.query("ROLLBACK");
        throw erro;
    } finally {
        cliente.release();
    }

    return buscarUsuarioPorId(usuario.id);
}

module.exports = {
    buscarUsuarioPorEmail,
    buscarUsuarioPorId,
    buscarPersonalPorCodigo,
    listarUsuariosPorTipo,
    listarAlunosDoPersonal,
    listarSolicitacoesDoPersonal,
    buscarAlunoDoPersonal,
    buscarSolicitacaoDoPersonal,
    definirVinculoAluno,
    criarUsuario
};
