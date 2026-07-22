const { obterPool } = require("../../banco/conexao");

const consultaBaseFicha = `
    SELECT
        f.*,
        criador.nome AS criada_por_nome,
        atualizador.nome AS atualizada_por_nome,
        arquivador.nome AS arquivada_por_nome,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', exercicio.id,
                    'nome', exercicio.nome,
                    'grupoMuscular', exercicio.grupo_muscular,
                    'series', exercicio.series::text,
                    'repeticoes', exercicio.repeticoes::text,
                    'carga', COALESCE(exercicio.carga, ''),
                    'descanso', COALESCE(exercicio.descanso, ''),
                    'observacoes', COALESCE(exercicio.observacoes, '')
                ) ORDER BY exercicio.ordem
            ) FILTER (WHERE exercicio.id IS NOT NULL),
            '[]'::json
        ) AS exercicios
    FROM fichas_treino f
    JOIN usuarios criador ON criador.id = f.criada_por_id
    LEFT JOIN usuarios atualizador ON atualizador.id = f.atualizada_por_id
    LEFT JOIN usuarios arquivador ON arquivador.id = f.arquivada_por_id
    LEFT JOIN exercicios_ficha exercicio ON exercicio.ficha_id = f.id
`;

function dataIso(data) {
    return data instanceof Date ? data.toISOString() : data;
}

function mapearFicha(linha) {
    if (!linha) {
        return null;
    }

    return {
        id: linha.id,
        alunoId: linha.aluno_id,
        personalId: linha.personal_id,
        origem: linha.origem,
        status: linha.status,
        nomeFicha: linha.nome,
        diaSemana: linha.dia_semana,
        objetivo: linha.objetivo || "",
        observacoes: linha.observacoes || "",
        criadaEm: dataIso(linha.criada_em),
        criadaPor: {
            id: linha.criada_por_id,
            nome: linha.criada_por_nome
        },
        ...(linha.atualizada_em ? {
            atualizadaEm: dataIso(linha.atualizada_em),
            atualizadaPor: {
                id: linha.atualizada_por_id,
                nome: linha.atualizada_por_nome,
                tipoUsuario: linha.atualizada_por_tipo
            }
        } : {}),
        ...(linha.arquivada_em ? {
            arquivadaEm: dataIso(linha.arquivada_em),
            arquivadaPor: {
                id: linha.arquivada_por_id,
                nome: linha.arquivada_por_nome
            }
        } : {}),
        exercicios: linha.exercicios
    };
}

async function consultarFichas(condicao, valores = [], apenasUma = false) {
    const resultado = await obterPool().query(
        `${consultaBaseFicha}
         WHERE ${condicao}
         GROUP BY f.id, criador.nome, atualizador.nome, arquivador.nome
         ORDER BY f.criada_em${apenasUma ? " LIMIT 1" : ""}`,
        valores
    );

    return apenasUma
        ? mapearFicha(resultado.rows[0])
        : resultado.rows.map(mapearFicha);
}

async function inserirExercicios(cliente, fichaId, exercicios) {
    for (const [indice, exercicio] of exercicios.entries()) {
        await cliente.query(
            `INSERT INTO exercicios_ficha (
                id, ficha_id, ordem, nome, grupo_muscular,
                series, repeticoes, carga, descanso, observacoes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                exercicio.id,
                fichaId,
                indice + 1,
                exercicio.nome,
                exercicio.grupoMuscular,
                Number(exercicio.series),
                Number(exercicio.repeticoes),
                exercicio.carga || null,
                exercicio.descanso || null,
                exercicio.observacoes || null
            ]
        );
    }
}

async function criarFichaTreino(fichaTreino) {
    const cliente = await obterPool().connect();

    try {
        await cliente.query("BEGIN");
        await cliente.query(
            `INSERT INTO fichas_treino (
                id, aluno_id, personal_id, criada_por_id, origem, status,
                nome, dia_semana, objetivo, observacoes, criada_em
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                fichaTreino.id,
                fichaTreino.alunoId,
                fichaTreino.personalId,
                fichaTreino.criadaPor.id,
                fichaTreino.origem,
                fichaTreino.status || "ativa",
                fichaTreino.nomeFicha,
                fichaTreino.diaSemana,
                fichaTreino.objetivo || null,
                fichaTreino.observacoes || null,
                fichaTreino.criadaEm
            ]
        );
        await inserirExercicios(cliente, fichaTreino.id, fichaTreino.exercicios);
        await cliente.query("COMMIT");
    } catch (erro) {
        await cliente.query("ROLLBACK");
        throw erro;
    } finally {
        cliente.release();
    }

    return buscarFichaDoAluno(fichaTreino.alunoId, fichaTreino.id);
}

async function listarFichasDoAluno(alunoId) {
    return consultarFichas("f.aluno_id = $1", [alunoId]);
}

async function buscarFichaDoAluno(alunoId, fichaId) {
    return consultarFichas(
        "f.aluno_id = $1 AND f.id = $2",
        [alunoId, fichaId],
        true
    );
}

async function buscarFichaDoPersonal(personalId, alunoId, fichaId) {
    return consultarFichas(
        "f.personal_id = $1 AND f.aluno_id = $2 AND f.id = $3",
        [personalId, alunoId, fichaId],
        true
    );
}

async function atualizarFichaTreino(fichaId, dadosAtualizados) {
    const cliente = await obterPool().connect();
    let alunoId;

    try {
        await cliente.query("BEGIN");
        const resultadoAtual = await cliente.query(
            "SELECT * FROM fichas_treino WHERE id = $1 FOR UPDATE",
            [fichaId]
        );
        const atual = resultadoAtual.rows[0];

        if (!atual) {
            await cliente.query("ROLLBACK");
            return null;
        }

        alunoId = atual.aluno_id;
        const atualizadaPor = dadosAtualizados.atualizadaPor;
        const arquivadaPor = dadosAtualizados.arquivadaPor;

        await cliente.query(
            `UPDATE fichas_treino SET
                nome = $1,
                dia_semana = $2,
                objetivo = $3,
                observacoes = $4,
                status = $5,
                atualizada_em = $6,
                atualizada_por_id = $7,
                atualizada_por_tipo = $8,
                arquivada_em = $9,
                arquivada_por_id = $10
             WHERE id = $11`,
            [
                dadosAtualizados.nomeFicha ?? atual.nome,
                dadosAtualizados.diaSemana ?? atual.dia_semana,
                dadosAtualizados.objetivo ?? atual.objetivo,
                dadosAtualizados.observacoes ?? atual.observacoes,
                dadosAtualizados.status ?? atual.status,
                dadosAtualizados.atualizadaEm ?? atual.atualizada_em,
                atualizadaPor?.id ?? atual.atualizada_por_id,
                atualizadaPor?.tipoUsuario ?? atual.atualizada_por_tipo,
                dadosAtualizados.arquivadaEm ?? atual.arquivada_em,
                arquivadaPor?.id ?? atual.arquivada_por_id,
                fichaId
            ]
        );

        if (Array.isArray(dadosAtualizados.exercicios)) {
            await cliente.query("DELETE FROM exercicios_ficha WHERE ficha_id = $1", [fichaId]);
            await inserirExercicios(cliente, fichaId, dadosAtualizados.exercicios);
        }

        await cliente.query("COMMIT");
    } catch (erro) {
        await cliente.query("ROLLBACK");
        throw erro;
    } finally {
        cliente.release();
    }

    return buscarFichaDoAluno(alunoId, fichaId);
}

async function removerFichaTreino(fichaId) {
    const resultado = await obterPool().query(
        "DELETE FROM fichas_treino WHERE id = $1",
        [fichaId]
    );

    return resultado.rowCount > 0;
}

async function listarFichasDoPersonal(personalId) {
    return consultarFichas("f.personal_id = $1", [personalId]);
}

module.exports = {
    criarFichaTreino,
    listarFichasDoAluno,
    buscarFichaDoAluno,
    buscarFichaDoPersonal,
    atualizarFichaTreino,
    removerFichaTreino,
    listarFichasDoPersonal
};
