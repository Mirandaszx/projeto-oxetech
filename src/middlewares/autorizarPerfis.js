function autorizarPerfis(...perfisPermitidos) {
    return (requisicao, resposta, proximo) => {
        if (!perfisPermitidos.includes(requisicao.usuario.tipoUsuario)) {
            return resposta.status(403).json({
                mensagem: "Seu perfil nao tem permissao para acessar este recurso."
            });
        }

        return proximo();
    };
}

module.exports = autorizarPerfis;
