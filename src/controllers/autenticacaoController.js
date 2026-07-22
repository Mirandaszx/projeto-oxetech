const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { ambiente } = require("../config/ambiente");
const {
    buscarUsuarioPorEmail,
    buscarUsuarioPorId,
    buscarPersonalPorCodigo,
    criarUsuario
} = require("../repositorios/usuariosRepositorio");
const {
    validarCadastroConta,
    validarLogin
} = require("../validacoes/conta");

function montarUsuarioPublico(usuario) {
    return {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipoUsuario: usuario.tipoUsuario,
        objetivoTreino: usuario.objetivoTreino || "",
        personalId: usuario.personalId || null,
        statusVinculo: usuario.statusVinculo || null,
        codigoVinculo: usuario.codigoVinculo || null,
        criadoEm: usuario.criadoEm
    };
}

function criarToken(usuario) {
    return jwt.sign(
        {
            sub: usuario.id,
            email: usuario.email,
            nome: usuario.nome,
            tipoUsuario: usuario.tipoUsuario
        },
        ambiente.chaveJwt,
        {
            expiresIn: "12h"
        }
    );
}

async function cadastrarUsuario(requisicao, resposta) {
    const mensagemValidacao = validarCadastroConta(requisicao.body, "aluno");

    if (mensagemValidacao) {
        return resposta.status(400).json({ mensagem: mensagemValidacao });
    }

    const nome = requisicao.body.nome.trim();
    const email = requisicao.body.email.trim().toLowerCase();
    const senha = requisicao.body.senha;
    const objetivoTreino = String(requisicao.body.objetivoTreino || "").trim();
    const codigoPersonal = String(requisicao.body.codigoPersonal || "").trim().toUpperCase();

    if (await buscarUsuarioPorEmail(email)) {
        return resposta.status(409).json({
            mensagem: "Ja existe uma conta cadastrada com esse email."
        });
    }

    const personal = codigoPersonal ? await buscarPersonalPorCodigo(codigoPersonal) : null;

    if (codigoPersonal && !personal) {
        return resposta.status(404).json({
            mensagem: "Codigo de personal nao encontrado. Confira o codigo ou deixe o campo vazio."
        });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = await criarUsuario({
        id: randomUUID(),
        nome,
        email,
        tipoUsuario: "aluno",
        objetivoTreino,
        personalId: personal?.id || null,
        statusVinculo: personal ? "pendente" : "sem_vinculo",
        senhaHash,
        criadoEm: new Date().toISOString()
    });

    return resposta.status(201).json({
        mensagem: personal
            ? "Conta criada. Agora aguarde a aprovacao do personal."
            : "Conta de aluno criada com sucesso.",
        token: criarToken(usuario),
        usuario: montarUsuarioPublico(usuario)
    });
}

async function entrar(requisicao, resposta) {
    const mensagemValidacao = validarLogin(requisicao.body);

    if (mensagemValidacao) {
        return resposta.status(400).json({ mensagem: mensagemValidacao });
    }

    const email = requisicao.body.email.trim().toLowerCase();
    const senha = requisicao.body.senha;
    const usuario = await buscarUsuarioPorEmail(email);

    if (!usuario) {
        return resposta.status(401).json({
            mensagem: "Email ou senha invalidos."
        });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash);

    if (!senhaCorreta) {
        return resposta.status(401).json({
            mensagem: "Email ou senha invalidos."
        });
    }

    return resposta.json({
        mensagem: "Login realizado com sucesso.",
        token: criarToken(usuario),
        usuario: montarUsuarioPublico(usuario)
    });
}

async function obterPerfil(requisicao, resposta) {
    const usuario = await buscarUsuarioPorId(requisicao.usuario.id);

    return resposta.json({
        usuario: montarUsuarioPublico(usuario)
    });
}

module.exports = {
    cadastrarUsuario,
    entrar,
    obterPerfil
};
