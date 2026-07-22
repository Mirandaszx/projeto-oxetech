const { randomUUID } = require("crypto");

const {
    buscarUsuarioPorId,
    buscarPersonalPorCodigo,
    definirVinculoAluno
} = require("../repositorios/usuariosRepositorio");
const {
    listarFichasDoAluno,
    buscarFichaDoAluno,
    criarFichaTreino,
    atualizarFichaTreino,
    removerFichaTreino
} = require("../repositorios/fichasTreinoRepositorio");
const {
    criarRegistroTreino,
    listarRegistrosDoAluno
} = require("../repositorios/registrosTreinoRepositorio");
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
        statusVinculo: aluno.statusVinculo || "sem_vinculo",
        criadoEm: aluno.criadoEm
    };
}

async function solicitarVinculo(requisicao, resposta) {
    const codigoPersonal = String(requisicao.body.codigoPersonal || "").trim().toUpperCase();

    if (!codigoPersonal) {
        return resposta.status(400).json({
            mensagem: "Informe o codigo fornecido pelo personal."
        });
    }

    if (requisicao.usuario.statusVinculo === "ativo") {
        return resposta.status(409).json({
            mensagem: "Sua conta ja esta vinculada a um personal."
        });
    }

    const personal = await buscarPersonalPorCodigo(codigoPersonal);

    if (!personal) {
        return resposta.status(404).json({
            mensagem: "Codigo de personal nao encontrado."
        });
    }

    await definirVinculoAluno(requisicao.usuario.id, personal.id, "pendente");

    return resposta.json({
        mensagem: "Solicitacao enviada. Aguarde a aprovacao do personal.",
        personal: {
            id: personal.id,
            nome: personal.nome,
            email: personal.email
        }
    });
}

async function obterMeuPainel(requisicao, resposta) {
    const [fichas, registros, personal] = await Promise.all([
        listarFichasDoAluno(requisicao.usuario.id),
        listarRegistrosDoAluno(requisicao.usuario.id),
        requisicao.usuario.personalId
            ? buscarUsuarioPorId(requisicao.usuario.personalId)
            : Promise.resolve(null)
    ]);
    const fichasAtivas = fichas.filter((ficha) => ficha.status !== "arquivada");

    return resposta.json({
        aluno: montarAlunoPublico(requisicao.usuario),
        personal: personal
            ? {
                id: personal.id,
                nome: personal.nome,
                email: personal.email
            }
            : null,
        resumo: {
            totalFichas: fichasAtivas.length,
            proximoTreino: fichasAtivas[0]?.diaSemana || null,
            totalRegistros: registros.length,
            ultimoTreino: registros[0]?.dataTreino || null
        }
    });
}

async function listarMinhasFichas(requisicao, resposta) {
    return resposta.json({
        fichas: await listarFichasDoAluno(requisicao.usuario.id)
    });
}

async function cadastrarMinhaFicha(requisicao, resposta) {
    const mensagemValidacao = validarFichaTreino(requisicao.body);

    if (mensagemValidacao) {
        return resposta.status(400).json({ mensagem: mensagemValidacao });
    }

    const ficha = await criarFichaTreino({
        id: randomUUID(),
        alunoId: requisicao.usuario.id,
        personalId: null,
        origem: "aluno",
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
        mensagem: "Ficha criada no seu diario.",
        ficha
    });
}

async function atualizarMinhaFicha(requisicao, resposta) {
    const ficha = await buscarFichaDoAluno(
        requisicao.usuario.id,
        requisicao.params.fichaId
    );

    if (!ficha) {
        return resposta.status(404).json({
            mensagem: "Ficha de treino nao encontrada na sua conta."
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
            tipoUsuario: "aluno"
        }
    });

    return resposta.json({
        mensagem: "Ficha atualizada com sucesso.",
        ficha: fichaAtualizada
    });
}

async function removerMinhaFicha(requisicao, resposta) {
    const ficha = await buscarFichaDoAluno(
        requisicao.usuario.id,
        requisicao.params.fichaId
    );

    if (!ficha) {
        return resposta.status(404).json({
            mensagem: "Ficha de treino nao encontrada na sua conta."
        });
    }

    await removerFichaTreino(ficha.id);

    return resposta.json({
        mensagem: "Ficha excluida. Os treinos registrados foram preservados no historico.",
        fichaId: ficha.id
    });
}

function validarRegistroTreino({ dataTreino, exercicios }, ficha) {
    if (!dataTreino) {
        return "Informe a data em que o treino foi realizado.";
    }

    if (!Array.isArray(exercicios) || exercicios.length !== ficha.exercicios.length) {
        return "Preencha o resultado de todos os exercicios da ficha.";
    }

    const idsInformados = new Set(exercicios.map((exercicio) => exercicio.exercicioId));

    if (idsInformados.size !== ficha.exercicios.length) {
        return "Cada exercicio deve aparecer uma unica vez no registro.";
    }

    const exercicioInvalido = exercicios.some((exercicio) => {
        const pertenceAFicha = ficha.exercicios.some((itemFicha) => (
            itemFicha.id === exercicio.exercicioId
        ));
        const seriesVazias = exercicio.seriesConcluidas === undefined
            || String(exercicio.seriesConcluidas).trim() === "";
        const repeticoesVazias = exercicio.repeticoesRealizadas === undefined
            || String(exercicio.repeticoesRealizadas).trim() === "";

        return !pertenceAFicha || seriesVazias || repeticoesVazias;
    });

    return exercicioInvalido
        ? "Informe as series e repeticoes realizadas em todos os exercicios."
        : null;
}

async function registrarTreino(requisicao, resposta) {
    const ficha = await buscarFichaDoAluno(
        requisicao.usuario.id,
        requisicao.params.fichaId
    );

    if (!ficha) {
        return resposta.status(404).json({
            mensagem: "Ficha de treino nao encontrada na sua conta."
        });
    }

    if (ficha.status === "arquivada") {
        return resposta.status(409).json({
            mensagem: "Nao e possivel registrar um novo treino em uma ficha arquivada."
        });
    }

    const mensagemValidacao = validarRegistroTreino(requisicao.body, ficha);

    if (mensagemValidacao) {
        return resposta.status(400).json({ mensagem: mensagemValidacao });
    }

    const registro = await criarRegistroTreino({
        id: randomUUID(),
        alunoId: requisicao.usuario.id,
        fichaId: ficha.id,
        nomeFicha: ficha.nomeFicha,
        dataTreino: requisicao.body.dataTreino,
        observacoes: String(requisicao.body.observacoes || "").trim(),
        criadoEm: new Date().toISOString(),
        exercicios: ficha.exercicios.map((exercicioFicha) => {
            const exercicioRealizado = requisicao.body.exercicios.find((exercicio) => (
                exercicio.exercicioId === exercicioFicha.id
            ));

            return {
                exercicioId: exercicioFicha.id,
                nome: exercicioFicha.nome,
                seriesPlanejadas: exercicioFicha.series,
                repeticoesPlanejadas: exercicioFicha.repeticoes,
                cargaPlanejada: exercicioFicha.carga || "",
                seriesConcluidas: String(exercicioRealizado.seriesConcluidas).trim(),
                repeticoesRealizadas: String(exercicioRealizado.repeticoesRealizadas).trim(),
                cargaUtilizada: String(exercicioRealizado.cargaUtilizada || "").trim()
            };
        })
    });

    return resposta.status(201).json({
        mensagem: "Treino adicionado ao historico.",
        registro
    });
}

async function listarMeusRegistros(requisicao, resposta) {
    return resposta.json({
        registros: await listarRegistrosDoAluno(requisicao.usuario.id)
    });
}

async function encerrarVinculo(requisicao, resposta) {
    const statusAtual = requisicao.usuario.statusVinculo || "sem_vinculo";

    if (!requisicao.usuario.personalId || !["ativo", "pendente"].includes(statusAtual)) {
        return resposta.status(409).json({
            mensagem: "Nao existe acompanhamento ou solicitacao para encerrar."
        });
    }

    const eraSolicitacaoPendente = statusAtual === "pendente";
    const aluno = await definirVinculoAluno(
        requisicao.usuario.id,
        null,
        "sem_vinculo"
    );

    return resposta.json({
        mensagem: eraSolicitacaoPendente
            ? "Solicitacao de acompanhamento cancelada."
            : "Acompanhamento encerrado. Suas fichas e seu historico foram mantidos.",
        usuario: montarAlunoPublico(aluno)
    });
}

module.exports = {
    obterMeuPainel,
    listarMinhasFichas,
    solicitarVinculo,
    cadastrarMinhaFicha,
    atualizarMinhaFicha,
    removerMinhaFicha,
    registrarTreino,
    listarMeusRegistros,
    encerrarVinculo
};
