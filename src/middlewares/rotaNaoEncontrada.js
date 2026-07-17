function rotaNaoEncontrada(requisicao, resposta, proximo) {
    if (requisicao.originalUrl.startsWith("/api")) {
        return resposta.status(404).json({
            mensagem: "Rota nao encontrada."
        });
    }

    const erro = new Error("Pagina nao encontrada.");
    erro.statusCode = 404;

    return proximo(erro);
}

module.exports = rotaNaoEncontrada;
