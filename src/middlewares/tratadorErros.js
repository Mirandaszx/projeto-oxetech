function tratarErros(erro, requisicao, resposta, _proximo) {
    const errosRequisicao = {
        "entity.parse.failed": {
            status: 400,
            mensagem: "O corpo da requisicao deve conter um JSON valido."
        },
        "entity.too.large": {
            status: 413,
            mensagem: "O corpo da requisicao ultrapassou o limite de tamanho permitido."
        }
    };
    const errosPostgres = {
        "22001": {
            status: 400,
            mensagem: "Um dos campos ultrapassou o tamanho permitido."
        },
        "22007": {
            status: 400,
            mensagem: "Uma data informada e invalida."
        },
        "22P02": {
            status: 400,
            mensagem: "Um dos valores informados e invalido."
        },
        "23503": {
            status: 409,
            mensagem: "A operacao conflita com dados relacionados."
        },
        "23505": {
            status: 409,
            mensagem: "Ja existe um registro com esses dados."
        },
        "23514": {
            status: 400,
            mensagem: "Um dos valores informados nao e permitido."
        }
    };
    const erroRequisicao = errosRequisicao[erro.type];
    const erroPostgres = errosPostgres[erro.code];
    const codigoStatus = erroRequisicao?.status
        || erro.statusCode
        || erroPostgres?.status
        || 500;
    const erroInterno = codigoStatus >= 500;
    const mensagem = erroInterno
        ? "Erro interno do servidor."
        : erroRequisicao?.mensagem
            || erroPostgres?.mensagem
            || erro.message
            || "Nao foi possivel concluir a solicitacao.";

    if (erroInterno) {
        console.error(erro);
    }

    // A API responde em JSON; as rotas de pagina mantem uma resposta simples.
    if (requisicao.originalUrl.startsWith("/api")) {
        return resposta.status(codigoStatus).json({ mensagem });
    }

    return resposta.status(codigoStatus).send(mensagem);
}

module.exports = tratarErros;
