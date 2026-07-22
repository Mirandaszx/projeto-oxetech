function emailValido(email) {
    return typeof email === "string"
        && email.length <= 254
        && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validarCadastroConta(dados = {}, rotulo = "usuario") {
    const { nome, email, senha, confirmacaoSenha } = dados;

    if (
        typeof nome !== "string"
        || typeof senha !== "string"
        || typeof confirmacaoSenha !== "string"
        || !nome.trim()
        || !email
        || !senha
        || !confirmacaoSenha
    ) {
        return "Preencha nome, email, senha e confirmacao de senha.";
    }

    if (nome.trim().length < 3 || nome.trim().length > 100) {
        return `O nome do ${rotulo} deve ter entre 3 e 100 caracteres.`;
    }

    if (!emailValido(email)) {
        return "Informe um email valido.";
    }

    if (senha.length < 6 || senha.length > 128) {
        return "A senha deve ter entre 6 e 128 caracteres.";
    }

    if (senha !== confirmacaoSenha) {
        return "A confirmacao de senha nao confere.";
    }

    return null;
}

function validarLogin(dados = {}) {
    const { email, senha } = dados;

    if (!emailValido(email) || typeof senha !== "string" || !senha) {
        return "Informe email e senha validos para entrar.";
    }

    return null;
}

module.exports = {
    validarCadastroConta,
    validarLogin
};
