const { randomBytes, randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");

const {
    buscarUsuarioPorEmail,
    buscarPersonalPorCodigo,
    listarUsuariosPorTipo,
    listarAlunosDoPersonal,
    listarSolicitacoesDoPersonal,
    criarUsuario
} = require("../repositorios/usuariosRepositorio");
const { validarCadastroConta } = require("../validacoes/conta");

async function montarPersonalPublico(personal) {
    const [alunos, solicitacoes] = await Promise.all([
        listarAlunosDoPersonal(personal.id),
        listarSolicitacoesDoPersonal(personal.id)
    ]);

    return {
        id: personal.id,
        nome: personal.nome,
        email: personal.email,
        codigoVinculo: personal.codigoVinculo,
        totalAlunos: alunos.length,
        totalSolicitacoes: solicitacoes.length,
        criadoEm: personal.criadoEm
    };
}

async function gerarCodigoVinculo() {
    let codigoVinculo;

    do {
        codigoVinculo = `IP-${randomBytes(3).toString("hex").toUpperCase()}`;
    } while (await buscarPersonalPorCodigo(codigoVinculo));

    return codigoVinculo;
}

async function obterPainel(requisicao, resposta) {
    const [personais, alunos] = await Promise.all([
        listarUsuariosPorTipo("personal"),
        listarUsuariosPorTipo("aluno")
    ]);
    const personaisPublicos = await Promise.all(personais.map(montarPersonalPublico));

    return resposta.json({
        administrador: {
            id: requisicao.usuario.id,
            nome: requisicao.usuario.nome,
            email: requisicao.usuario.email
        },
        resumo: {
            totalPersonais: personais.length,
            totalAlunos: alunos.length
        },
        personais: personaisPublicos
    });
}

async function cadastrarPersonal(requisicao, resposta) {
    const mensagemValidacao = validarCadastroConta(requisicao.body, "personal");

    if (mensagemValidacao) {
        return resposta.status(400).json({ mensagem: mensagemValidacao });
    }

    const nome = requisicao.body.nome.trim();
    const email = requisicao.body.email.trim().toLowerCase();

    if (await buscarUsuarioPorEmail(email)) {
        return resposta.status(409).json({
            mensagem: "Ja existe uma conta cadastrada com esse email."
        });
    }

    const personal = await criarUsuario({
        id: randomUUID(),
        nome,
        email,
        senhaHash: await bcrypt.hash(requisicao.body.senha, 10),
        tipoUsuario: "personal",
        codigoVinculo: await gerarCodigoVinculo(),
        criadoEm: new Date().toISOString()
    });

    return resposta.status(201).json({
        mensagem: "Personal cadastrado com sucesso.",
        personal: await montarPersonalPublico(personal)
    });
}

module.exports = {
    obterPainel,
    cadastrarPersonal
};
