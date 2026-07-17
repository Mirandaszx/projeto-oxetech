function tratarErros(erro, requisicao, resposta, _proximo) {
    const codigoStatus = erro.statusCode || 500;
    const mensagem = erro.message || "Erro interno do servidor.";

    // A API responde em JSON; as rotas de pagina mantem uma resposta simples.
    if (requisicao.originalUrl.startsWith("/api")) {
        return resposta.status(codigoStatus).json({ mensagem });
    }

    return resposta.status(codigoStatus).send(mensagem);
}

module.exports = tratarErros;
