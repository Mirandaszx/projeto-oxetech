const { randomBytes, randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");

const {
    buscarUsuarioPorEmail,
    buscarPersonalPorCodigoIncluindoInativos,
    buscarPersonalPorId,
    listarUsuariosPorTipo,
    listarAlunosDoPersonal,
    listarSolicitacoesDoPersonal,
    criarUsuario,
    atualizarUsuario
} = require("../repositorios/usuariosRepositorio");
const { validarCadastroConta, validarEdicaoConta } = require("../validacoes/conta");

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
        ativo: personal.ativo !== false,
        totalAlunos: alunos.length,
        totalSolicitacoes: solicitacoes.length,
        criadoEm: personal.criadoEm
    };
}

async function gerarCodigoVinculo() {
    let codigoVinculo;

    do {
        codigoVinculo = `IP-${randomBytes(3).toString("hex").toUpperCase()}`;
    } while (await buscarPersonalPorCodigoIncluindoInativos(codigoVinculo));

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
            totalPersonaisAtivos: personais.filter((personal) => personal.ativo !== false).length,
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

async function atualizarPersonal(requisicao, resposta) {
    const personal = await buscarPersonalPorId(requisicao.params.personalId);

    if (!personal) {
        return resposta.status(404).json({ mensagem: "Personal nao encontrado." });
    }

    const mensagemValidacao = validarEdicaoConta(requisicao.body, "personal");

    if (mensagemValidacao) {
        return resposta.status(400).json({ mensagem: mensagemValidacao });
    }

    const nome = requisicao.body.nome.trim();
    const email = requisicao.body.email.trim().toLowerCase();
    const usuarioComEmail = await buscarUsuarioPorEmail(email);

    if (usuarioComEmail && usuarioComEmail.id !== personal.id) {
        return resposta.status(409).json({
            mensagem: "Ja existe uma conta cadastrada com esse email."
        });
    }

    const alteracoes = { nome, email };

    if (requisicao.body.senha) {
        alteracoes.senhaHash = await bcrypt.hash(requisicao.body.senha, 10);
    }

    const personalAtualizado = await atualizarUsuario(personal.id, alteracoes);

    return resposta.json({
        mensagem: "Dados do personal atualizados com sucesso.",
        personal: await montarPersonalPublico(personalAtualizado)
    });
}

async function definirStatusPersonal(personalId, ativo, resposta) {
    const personal = await buscarPersonalPorId(personalId);

    if (!personal) {
        return resposta.status(404).json({ mensagem: "Personal nao encontrado." });
    }

    const personalAtualizado = await atualizarUsuario(personal.id, { ativo });

    return resposta.json({
        mensagem: ativo
            ? "Personal reativado com sucesso."
            : "Personal desativado com sucesso.",
        personal: await montarPersonalPublico(personalAtualizado)
    });
}

async function alterarStatusPersonal(requisicao, resposta) {
    if (typeof requisicao.body.ativo !== "boolean") {
        return resposta.status(400).json({
            mensagem: "Informe se o personal deve ficar ativo ou inativo."
        });
    }

    return definirStatusPersonal(
        requisicao.params.personalId,
        requisicao.body.ativo,
        resposta
    );
}

async function desativarPersonal(requisicao, resposta) {
    return definirStatusPersonal(requisicao.params.personalId, false, resposta);
}

module.exports = {
    obterPainel,
    cadastrarPersonal,
    atualizarPersonal,
    alterarStatusPersonal,
    desativarPersonal
};
