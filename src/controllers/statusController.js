function obterStatus(_requisicao, resposta) {
    return resposta.json({
        status: "ok",
        aplicacao: "Iron Pump",
        etapa: "fluxo-admin-personal-aluno",
        geradoEm: new Date().toISOString()
    });
}

module.exports = {
    obterStatus
};
