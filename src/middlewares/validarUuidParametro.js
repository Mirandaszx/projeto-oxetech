const FORMATO_UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

function validarUuidParametro(requisicao, resposta, proximo, valor) {
    if (!FORMATO_UUID.test(valor)) {
        return resposta.status(400).json({
            mensagem: "O identificador informado e invalido."
        });
    }

    return proximo();
}

module.exports = validarUuidParametro;
