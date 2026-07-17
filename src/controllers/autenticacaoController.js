function cadastrarUsuario(_requisicao, resposta) {
    return resposta.status(501).json({
        mensagem: "Cadastro de usuario sera implementado na proxima etapa."
    });
}

function entrar(_requisicao, resposta) {
    return resposta.status(501).json({
        mensagem: "Login com JWT sera implementado na proxima etapa."
    });
}

module.exports = {
    cadastrarUsuario,
    entrar
};
