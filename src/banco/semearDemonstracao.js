const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");

const { ambiente } = require("../config/ambiente");
const { obterPool, encerrarPool } = require("./conexao");
const { executarMigracoes } = require("./migrar");

async function garantirUsuario(cliente, usuario) {
    const email = usuario.email.trim().toLowerCase();
    const existente = await cliente.query(
        "SELECT id FROM usuarios WHERE email = $1 FOR UPDATE",
        [email]
    );
    const id = existente.rows[0]?.id || randomUUID();
    const senhaHash = await bcrypt.hash(usuario.senha, 10);

    if (existente.rowCount > 0) {
        await cliente.query(
            `UPDATE usuarios SET
                nome = $1,
                senha_hash = $2,
                tipo_usuario = $3,
                objetivo_treino = $4,
                codigo_vinculo = $5,
                ativo = TRUE,
                atualizado_em = CURRENT_TIMESTAMP
             WHERE id = $6`,
            [
                usuario.nome,
                senhaHash,
                usuario.tipoUsuario,
                usuario.objetivoTreino || null,
                usuario.codigoVinculo || null,
                id
            ]
        );
    } else {
        await cliente.query(
            `INSERT INTO usuarios (
                id, nome, email, senha_hash, tipo_usuario,
                objetivo_treino, codigo_vinculo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                id,
                usuario.nome,
                email,
                senhaHash,
                usuario.tipoUsuario,
                usuario.objetivoTreino || null,
                usuario.codigoVinculo || null
            ]
        );
    }

    return id;
}

async function garantirCodigoVinculoDisponivel(cliente, personal) {
    const resultado = await cliente.query(
        `SELECT email
         FROM usuarios
         WHERE codigo_vinculo = $1 AND email <> $2`,
        [personal.codigoVinculo, personal.email.trim().toLowerCase()]
    );

    if (resultado.rowCount > 0) {
        throw new Error(
            `O codigo ${personal.codigoVinculo} ja pertence a outro personal.`
        );
    }
}

async function garantirVinculoAtivo(cliente, alunoId, personalId) {
    await cliente.query(
        `UPDATE vinculos_acompanhamento SET
            status = CASE
                WHEN status = 'pendente' THEN 'cancelado'
                ELSE 'encerrado'
            END,
            encerrado_em = CURRENT_TIMESTAMP
         WHERE aluno_id = $1
           AND personal_id <> $2
           AND status IN ('pendente', 'ativo')`,
        [alunoId, personalId]
    );

    const vinculoAtual = await cliente.query(
        `SELECT id, status
         FROM vinculos_acompanhamento
         WHERE aluno_id = $1
           AND personal_id = $2
           AND status IN ('pendente', 'ativo')
         ORDER BY solicitado_em DESC
         LIMIT 1
         FOR UPDATE`,
        [alunoId, personalId]
    );

    if (vinculoAtual.rows[0]?.status === "ativo") {
        return;
    }

    if (vinculoAtual.rows[0]?.status === "pendente") {
        await cliente.query(
            `UPDATE vinculos_acompanhamento SET
                status = 'ativo',
                respondido_em = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [vinculoAtual.rows[0].id]
        );
        return;
    }

    await cliente.query(
        `INSERT INTO vinculos_acompanhamento (
            id, aluno_id, personal_id, status, respondido_em
        ) VALUES ($1, $2, $3, 'ativo', CURRENT_TIMESTAMP)`,
        [randomUUID(), alunoId, personalId]
    );
}

async function garantirFichaDemonstracao(cliente, alunoId, personalId) {
    const nomeFicha = "Treino A - Demonstracao";
    const fichaExistente = await cliente.query(
        `SELECT id
         FROM fichas_treino
         WHERE aluno_id = $1 AND nome = $2
         LIMIT 1`,
        [alunoId, nomeFicha]
    );

    if (fichaExistente.rowCount > 0) {
        return fichaExistente.rows[0].id;
    }

    const fichaId = randomUUID();

    await cliente.query(
        `INSERT INTO fichas_treino (
            id, aluno_id, personal_id, criada_por_id, origem,
            status, nome, dia_semana, objetivo, observacoes
        ) VALUES ($1, $2, $3, $3, 'personal', 'ativa', $4, 'Segunda', $5, $6)`,
        [
            fichaId,
            alunoId,
            personalId,
            nomeFicha,
            "Treino geral",
            "Ficha inicial criada para demonstracao."
        ]
    );

    const exercicios = [
        ["Agachamento na maquina", "Pernas", 3, 12, "30 kg", "90s"],
        ["Supino inclinado", "Peito", 3, 10, "20 kg", "60s"],
        ["Remada baixa", "Costas", 3, 12, "25 kg", "60s"]
    ];

    for (const [indice, exercicio] of exercicios.entries()) {
        await cliente.query(
            `INSERT INTO exercicios_ficha (
                id, ficha_id, ordem, nome, grupo_muscular,
                series, repeticoes, carga, descanso
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [randomUUID(), fichaId, indice + 1, ...exercicio]
        );
    }

    return fichaId;
}

async function garantirRegistroDemonstracao(cliente, alunoId, fichaId) {
    const observacoes = "Registro inicial criado pelo fluxo de demonstracao.";
    const registroExistente = await cliente.query(
        `SELECT id
         FROM registros_treino
         WHERE aluno_id = $1
           AND ficha_id = $2
           AND observacoes = $3
         LIMIT 1`,
        [alunoId, fichaId, observacoes]
    );

    if (registroExistente.rowCount > 0) {
        return registroExistente.rows[0].id;
    }

    const exercicios = await cliente.query(
        `SELECT *
         FROM exercicios_ficha
         WHERE ficha_id = $1
         ORDER BY ordem`,
        [fichaId]
    );

    if (exercicios.rowCount === 0) {
        throw new Error("A ficha de demonstracao nao possui exercicios.");
    }

    const registroId = randomUUID();

    await cliente.query(
        `INSERT INTO registros_treino (
            id, aluno_id, ficha_id, nome_ficha,
            data_treino, observacoes
        ) VALUES ($1, $2, $3, 'Treino A - Demonstracao', CURRENT_DATE - 1, $4)`,
        [registroId, alunoId, fichaId, observacoes]
    );

    for (const exercicio of exercicios.rows) {
        await cliente.query(
            `INSERT INTO exercicios_registro (
                id, registro_id, exercicio_ficha_id, ordem, nome,
                series_planejadas, repeticoes_planejadas, carga_planejada,
                series_concluidas, repeticoes_realizadas, carga_utilizada
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $6, $7, $8)`,
            [
                randomUUID(),
                registroId,
                exercicio.id,
                exercicio.ordem,
                exercicio.nome,
                String(exercicio.series),
                String(exercicio.repeticoes),
                exercicio.carga || null
            ]
        );
    }

    return registroId;
}

async function semearDemonstracao() {
    if (ambiente.persistencia !== "postgres") {
        throw new Error("Defina PERSISTENCIA=postgres antes de executar o seed.");
    }

    await executarMigracoes();
    const cliente = await obterPool().connect();
    const personal = ambiente.demonstracao.personal;
    const aluno = ambiente.demonstracao.aluno;

    try {
        await cliente.query("BEGIN");
        await garantirCodigoVinculoDisponivel(cliente, personal);

        await garantirUsuario(cliente, {
            ...ambiente.administrador,
            tipoUsuario: "admin"
        });
        const personalId = await garantirUsuario(cliente, {
            ...personal,
            tipoUsuario: "personal"
        });
        const alunoId = await garantirUsuario(cliente, {
            ...aluno,
            tipoUsuario: "aluno"
        });

        await garantirVinculoAtivo(cliente, alunoId, personalId);
        const fichaId = await garantirFichaDemonstracao(cliente, alunoId, personalId);
        await garantirRegistroDemonstracao(cliente, alunoId, fichaId);
        await cliente.query("COMMIT");
    } catch (erro) {
        await cliente.query("ROLLBACK");
        throw erro;
    } finally {
        cliente.release();
    }

    return {
        administrador: ambiente.administrador.email,
        personal: personal.email,
        aluno: aluno.email,
        codigoVinculo: personal.codigoVinculo
    };
}

if (require.main === module) {
    semearDemonstracao()
        .then((dados) => {
            console.log("Dados de demonstracao preparados com sucesso.");
            console.log(`Administrador: ${dados.administrador}`);
            console.log(`Personal: ${dados.personal}`);
            console.log(`Aluno: ${dados.aluno}`);
            console.log(`Codigo de vinculo: ${dados.codigoVinculo}`);
        })
        .catch((erro) => {
            console.error("Falha ao preparar dados de demonstracao:", erro.message);
            process.exitCode = 1;
        })
        .finally(encerrarPool);
}

module.exports = { semearDemonstracao };
