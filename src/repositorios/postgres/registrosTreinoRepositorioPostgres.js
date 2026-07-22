const { randomUUID } = require("crypto");

const { obterPool } = require("../../banco/conexao");

function dataIso(data) {
    return data instanceof Date ? data.toISOString() : data;
}

function dataSemHorario(data) {
    return dataIso(data)?.slice(0, 10) || null;
}

function mapearRegistro(linha) {
    return {
        id: linha.id,
        alunoId: linha.aluno_id,
        fichaId: linha.ficha_id,
        nomeFicha: linha.nome_ficha,
        dataTreino: dataSemHorario(linha.data_treino),
        observacoes: linha.observacoes || "",
        criadoEm: dataIso(linha.criado_em),
        exercicios: linha.exercicios
    };
}

async function criarRegistroTreino(registroTreino) {
    const cliente = await obterPool().connect();

    try {
        await cliente.query("BEGIN");
        await cliente.query(
            `INSERT INTO registros_treino (
                id, aluno_id, ficha_id, nome_ficha,
                data_treino, observacoes, criado_em
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                registroTreino.id,
                registroTreino.alunoId,
                registroTreino.fichaId,
                registroTreino.nomeFicha,
                registroTreino.dataTreino,
                registroTreino.observacoes || null,
                registroTreino.criadoEm
            ]
        );

        for (const [indice, exercicio] of registroTreino.exercicios.entries()) {
            await cliente.query(
                `INSERT INTO exercicios_registro (
                    id, registro_id, exercicio_ficha_id, ordem, nome,
                    series_planejadas, repeticoes_planejadas, carga_planejada,
                    series_concluidas, repeticoes_realizadas, carga_utilizada
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                    randomUUID(),
                    registroTreino.id,
                    exercicio.exercicioId,
                    indice + 1,
                    exercicio.nome,
                    exercicio.seriesPlanejadas,
                    exercicio.repeticoesPlanejadas,
                    exercicio.cargaPlanejada || null,
                    exercicio.seriesConcluidas,
                    exercicio.repeticoesRealizadas,
                    exercicio.cargaUtilizada || null
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

    const registros = await listarRegistrosDoAluno(registroTreino.alunoId);
    return registros.find((registro) => registro.id === registroTreino.id) || null;
}

async function listarRegistrosDoAluno(alunoId) {
    const resultado = await obterPool().query(
        `SELECT
            registro.*,
            COALESCE(
                json_agg(
                    json_build_object(
                        'exercicioId', exercicio.exercicio_ficha_id,
                        'nome', exercicio.nome,
                        'seriesPlanejadas', exercicio.series_planejadas,
                        'repeticoesPlanejadas', exercicio.repeticoes_planejadas,
                        'cargaPlanejada', COALESCE(exercicio.carga_planejada, ''),
                        'seriesConcluidas', exercicio.series_concluidas,
                        'repeticoesRealizadas', exercicio.repeticoes_realizadas,
                        'cargaUtilizada', COALESCE(exercicio.carga_utilizada, '')
                    ) ORDER BY exercicio.ordem
                ) FILTER (WHERE exercicio.id IS NOT NULL),
                '[]'::json
            ) AS exercicios
         FROM registros_treino registro
         LEFT JOIN exercicios_registro exercicio ON exercicio.registro_id = registro.id
         WHERE registro.aluno_id = $1
         GROUP BY registro.id
         ORDER BY registro.data_treino DESC, registro.criado_em DESC`,
        [alunoId]
    );

    return resultado.rows.map(mapearRegistro);
}

module.exports = {
    criarRegistroTreino,
    listarRegistrosDoAluno
};
