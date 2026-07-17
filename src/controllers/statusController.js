function obterStatus(_requisicao, resposta) {
    return resposta.json({
        status: "ok",
        aplicacao: "Iron Pump",
        etapa: "backend-base",
        geradoEm: new Date().toISOString()
    });
}

module.exports = {
    obterStatus
};
