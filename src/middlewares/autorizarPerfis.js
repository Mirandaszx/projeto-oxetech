function autorizarPerfis(...perfisPermitidos) {
    return (requisicao, resposta, proximo) => {
        // Autenticacao confirma quem e o usuario; autorizacao confirma o que ele pode fazer.
        if (!perfisPermitidos.includes(requisicao.usuario.tipoUsuario)) {
            return resposta.status(403).json({
                mensagem: "Seu perfil nao tem permissao para acessar este recurso."
            });
        }

        return proximo();
    };
}

module.exports = autorizarPerfis;
