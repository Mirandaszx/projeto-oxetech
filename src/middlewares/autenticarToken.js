const jwt = require("jsonwebtoken");

const { ambiente } = require("../config/ambiente");
const { buscarUsuarioPorId } = require("../repositorios/usuariosRepositorio");

async function autenticarToken(requisicao, resposta, proximo) {
    const cabecalhoAutorizacao = requisicao.headers.authorization || "";
    const [tipo, token] = cabecalhoAutorizacao.split(" ");

    if (tipo !== "Bearer" || !token) {
        return resposta.status(401).json({
            mensagem: "Token de acesso nao informado."
        });
    }

    let conteudoToken;

    try {
        conteudoToken = jwt.verify(token, ambiente.chaveJwt);
    } catch (_erro) {
        return resposta.status(401).json({
            mensagem: "Sessao invalida ou expirada."
        });
    }

    try {
        const usuario = await buscarUsuarioPorId(conteudoToken.sub);

        if (!usuario) {
            return resposta.status(401).json({
                mensagem: "Sessao invalida ou expirada."
            });
        }

        if (usuario.ativo === false) {
            return resposta.status(403).json({
                codigo: "CONTA_DESATIVADA",
                mensagem: "Esta conta foi desativada. Procure o administrador."
            });
        }

        requisicao.usuario = usuario;
        return proximo();
    } catch (erro) {
        return proximo(erro);
    }
}

module.exports = autenticarToken;
