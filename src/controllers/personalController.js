const { randomUUID } = require("crypto");

const {
    buscarUsuarioPorId,
    listarAlunosDoPersonal,
    listarSolicitacoesDoPersonal,
    buscarAlunoDoPersonal,
    buscarSolicitacaoDoPersonal,
    definirVinculoAluno
} = require("../repositorios/usuariosRepositorio");
const {
    criarFichaTreino,
    listarFichasDoAluno,
    listarFichasDoPersonal,
    buscarFichaDoPersonal,
    atualizarFichaTreino,
    removerFichaTreino
} = require("../repositorios/fichasTreinoRepositorio");
const { listarRegistrosDoAluno } = require("../repositorios/registrosTreinoRepositorio");
const {
    validarFichaTreino,
    montarExercicios
} = require("../validacoes/fichaTreino");

function montarAlunoPublico(aluno) {
    return {
        id: aluno.id,
        nome: aluno.nome,
        email: aluno.email,
        objetivoTreino: aluno.objetivoTreino || "",
        statusVinculo: aluno.statusVinculo,
        criadoEm: aluno.criadoEm
    };
}

async function obterPainel(requisicao, resposta) {
    const [alunos, solicitacoes, todasFichas] = await Promise.all([
        listarAlunosDoPersonal(requisicao.usuario.id),
        listarSolicitacoesDoPersonal(requisicao.usuario.id),
        listarFichasDoPersonal(requisicao.usuario.id)
    ]);
    const fichas = todasFichas.filter((ficha) => (
        ficha.status !== "arquivada"
    ));
    const alunosPublicos = await Promise.all(alunos.map(async (aluno) => {
        const fichasDoAluno = (await listarFichasDoAluno(aluno.id)).filter((ficha) => (
            ficha.status !== "arquivada"
        ));

        return {
            ...montarAlunoPublico(aluno),
            totalFichas: fichasDoAluno.length
        };
    }));

    return resposta.json({
        personal: {
            id: requisicao.usuario.id,
            nome: requisicao.usuario.nome,
            email: requisicao.usuario.email,
            codigoVinculo: requisicao.usuario.codigoVinculo
        },
        resumo: {
            totalAlunos: alunos.length,
            totalFichas: fichas.length,
            totalSolicitacoes: solicitacoes.length
        },
        solicitacoes: solicitacoes.map(montarAlunoPublico),
        alunos: alunosPublicos
    });
}

async function aprovarSolicitacao(requisicao, resposta) {
    const aluno = await buscarSolicitacaoDoPersonal(
        requisicao.usuario.id,
        requisicao.params.alunoId
    );

    if (!aluno) {
        return resposta.status(404).json({
            mensagem: "Solicitacao de vinculo nao encontrada."
        });
    }

    const alunoAtualizado = await definirVinculoAluno(
        aluno.id,
        requisicao.usuario.id,
        "ativo"
    );

    return resposta.json({
        mensagem: "Aluno aprovado e adicionado a sua carteira.",
        aluno: montarAlunoPublico(alunoAtualizado)
    });
}

async function recusarSolicitacao(requisicao, resposta) {
    const aluno = await buscarSolicitacaoDoPersonal(
        requisicao.usuario.id,
        requisicao.params.alunoId
    );

    if (!aluno) {
        return resposta.status(404).json({
            mensagem: "Solicitacao de vinculo nao encontrada."
        });
    }

    const alunoAtualizado = await definirVinculoAluno(aluno.id, null, "sem_vinculo");

    return resposta.json({
        mensagem: "Solicitacao recusada.",
        aluno: montarAlunoPublico(alunoAtualizado)
    });
}

async function listarAlunos(requisicao, resposta) {
    const alunos = await listarAlunosDoPersonal(requisicao.usuario.id);
    const alunosPublicos = await Promise.all(alunos.map(async (aluno) => {
        const fichasDoAluno = (await listarFichasDoAluno(aluno.id)).filter((ficha) => (
            ficha.status !== "arquivada"
        ));

        return {
            ...montarAlunoPublico(aluno),
            totalFichas: fichasDoAluno.length
        };
    }));

    return resposta.json({
        alunos: alunosPublicos
    });
}

async function listarFichasAluno(requisicao, resposta) {
    const aluno = await buscarAlunoDoPersonal(
        requisicao.usuario.id,
        requisicao.params.alunoId
    );

    if (!aluno) {
        return resposta.status(404).json({
            mensagem: "Aluno nao encontrado na sua carteira."
        });
    }

    const [fichas, registros] = await Promise.all([
        listarFichasDoAluno(aluno.id),
        listarRegistrosDoAluno(aluno.id)
    ]);

    return resposta.json({
        aluno: montarAlunoPublico(aluno),
        fichas,
        registros
    });
}

async function cadastrarFichaParaAluno(requisicao, resposta) {
    const aluno = await buscarAlunoDoPersonal(
        requisicao.usuario.id,
        requisicao.params.alunoId
    );

    if (!aluno) {
        return resposta.status(404).json({
            mensagem: "Aluno nao encontrado na sua carteira."
        });
    }

    const mensagemValidacao = validarFichaTreino(requisicao.body);

    if (mensagemValidacao) {
        return resposta.status(400).json({ mensagem: mensagemValidacao });
    }

    const fichaTreino = await criarFichaTreino({
        id: randomUUID(),
        alunoId: aluno.id,
        personalId: requisicao.usuario.id,
        origem: "personal",
        status: "ativa",
        nomeFicha: requisicao.body.nomeFicha.trim(),
        diaSemana: requisicao.body.diaSemana.trim(),
        objetivo: String(requisicao.body.objetivo || "").trim(),
        observacoes: String(requisicao.body.observacoes || "").trim(),
        criadaEm: new Date().toISOString(),
        criadaPor: {
            id: requisicao.usuario.id,
            nome: requisicao.usuario.nome
        },
        exercicios: montarExercicios(requisicao.body.exercicios)
    });

    return resposta.status(201).json({
        mensagem: "Ficha de treino criada com sucesso.",
        aluno: montarAlunoPublico(aluno),
        ficha: fichaTreino
    });
}

async function atualizarFichaDoAluno(requisicao, resposta) {
    const aluno = await buscarAlunoDoPersonal(
        requisicao.usuario.id,
        requisicao.params.alunoId
    );

    if (!aluno) {
        return resposta.status(404).json({
            mensagem: "Aluno nao encontrado na sua carteira."
        });
    }

    const ficha = await buscarFichaDoPersonal(
        requisicao.usuario.id,
        aluno.id,
        requisicao.params.fichaId
    );

    if (!ficha) {
        return resposta.status(404).json({
            mensagem: "Ficha criada por este personal nao encontrada."
        });
    }

    if (ficha.status === "arquivada") {
        return resposta.status(409).json({
            mensagem: "Uma ficha arquivada fica disponivel apenas para consulta."
        });
    }

    const mensagemValidacao = validarFichaTreino(requisicao.body);

    if (mensagemValidacao) {
        return resposta.status(400).json({ mensagem: mensagemValidacao });
    }

    const fichaAtualizada = await atualizarFichaTreino(ficha.id, {
        nomeFicha: requisicao.body.nomeFicha.trim(),
        diaSemana: requisicao.body.diaSemana.trim(),
        objetivo: String(requisicao.body.objetivo || "").trim(),
        observacoes: String(requisicao.body.observacoes || "").trim(),
        exercicios: montarExercicios(requisicao.body.exercicios),
        atualizadaEm: new Date().toISOString(),
        atualizadaPor: {
            id: requisicao.usuario.id,
            nome: requisicao.usuario.nome,
            tipoUsuario: "personal"
        }
    });

    return resposta.json({
        mensagem: "Ficha atualizada pelo personal.",
        ficha: fichaAtualizada
    });
}

async function removerFichaDoAluno(requisicao, resposta) {
    const aluno = await buscarAlunoDoPersonal(
        requisicao.usuario.id,
        requisicao.params.alunoId
    );

    if (!aluno) {
        return resposta.status(404).json({
            mensagem: "Aluno nao encontrado na sua carteira."
        });
    }

    const ficha = await buscarFichaDoPersonal(
        requisicao.usuario.id,
        aluno.id,
        requisicao.params.fichaId
    );

    if (!ficha) {
        return resposta.status(404).json({
            mensagem: "Somente fichas criadas por voce podem ser excluidas."
        });
    }

    await removerFichaTreino(ficha.id);

    return resposta.json({
        mensagem: "Ficha excluida. Os treinos registrados foram preservados no historico.",
        fichaId: ficha.id
    });
}

async function obterAlunoDaCarteira(requisicao, resposta) {
    const aluno = await buscarAlunoDoPersonal(
        requisicao.usuario.id,
        requisicao.params.alunoId
    );

    if (!aluno) {
        return resposta.status(404).json({
            mensagem: "Aluno nao encontrado na sua carteira."
        });
    }

    const [personal, fichas, registros] = await Promise.all([
        buscarUsuarioPorId(requisicao.usuario.id),
        listarFichasDoAluno(aluno.id),
        listarRegistrosDoAluno(aluno.id)
    ]);

    return resposta.json({
        aluno: {
            ...montarAlunoPublico(aluno),
            personal: {
                id: personal.id,
                nome: personal.nome,
                email: personal.email
            }
        },
        fichas,
        registros
    });
}

module.exports = {
    obterPainel,
    aprovarSolicitacao,
    recusarSolicitacao,
    listarAlunos,
    listarFichasAluno,
    cadastrarFichaParaAluno,
    atualizarFichaDoAluno,
    removerFichaDoAluno,
    obterAlunoDaCarteira
};
