function tratarErros(erro, requisicao, resposta, _proximo) {
    const codigoStatus = erro.statusCode || 500;
    const erroInterno = codigoStatus >= 500;
    const mensagem = erroInterno
        ? "Erro interno do servidor."
        : erro.message || "Nao foi possivel concluir a solicitacao.";

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
