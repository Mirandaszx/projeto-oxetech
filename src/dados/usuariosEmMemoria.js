const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");

const { ambiente } = require("../config/ambiente");

// A conta inicial permite que o primeiro personal seja criado sem abrir cadastro publico.
const usuarios = [
    {
        id: randomUUID(),
        nome: ambiente.administrador.nome,
        email: ambiente.administrador.email.trim().toLowerCase(),
        senhaHash: bcrypt.hashSync(ambiente.administrador.senha, 10),
        tipoUsuario: "admin",
        ativo: true,
        criadoEm: new Date().toISOString()
    }
];

function buscarUsuarioPorEmail(email) {
    return usuarios.find((usuario) => usuario.email === email) || null;
}

function buscarUsuarioPorId(id) {
    return usuarios.find((usuario) => usuario.id === id) || null;
}

function buscarPersonalPorCodigo(codigoVinculo) {
    const codigoNormalizado = String(codigoVinculo || "").trim().toUpperCase();

    return usuarios.find((usuario) => (
        usuario.tipoUsuario === "personal"
        && usuario.ativo !== false
        && usuario.codigoVinculo === codigoNormalizado
    )) || null;
}

function buscarPersonalPorCodigoIncluindoInativos(codigoVinculo) {
    const codigoNormalizado = String(codigoVinculo || "").trim().toUpperCase();

    return usuarios.find((usuario) => (
        usuario.tipoUsuario === "personal"
        && usuario.codigoVinculo === codigoNormalizado
    )) || null;
}

function buscarPersonalPorId(personalId) {
    return usuarios.find((usuario) => (
        usuario.id === personalId && usuario.tipoUsuario === "personal"
    )) || null;
}

function listarUsuariosPorTipo(tipoUsuario) {
    return usuarios.filter((usuario) => usuario.tipoUsuario === tipoUsuario);
}

function listarAlunosDoPersonal(personalId) {
    return usuarios.filter((usuario) => (
        usuario.tipoUsuario === "aluno"
        && usuario.personalId === personalId
        && usuario.statusVinculo === "ativo"
    ));
}

function listarSolicitacoesDoPersonal(personalId) {
    return usuarios.filter((usuario) => (
        usuario.tipoUsuario === "aluno"
        && usuario.personalId === personalId
        && usuario.statusVinculo === "pendente"
    ));
}

function buscarAlunoDoPersonal(personalId, alunoId) {
    return usuarios.find((usuario) => (
        usuario.id === alunoId
        && usuario.tipoUsuario === "aluno"
        && usuario.personalId === personalId
        && usuario.statusVinculo === "ativo"
    )) || null;
}

function buscarSolicitacaoDoPersonal(personalId, alunoId) {
    return usuarios.find((usuario) => (
        usuario.id === alunoId
        && usuario.tipoUsuario === "aluno"
        && usuario.personalId === personalId
        && usuario.statusVinculo === "pendente"
    )) || null;
}

function definirVinculoAluno(alunoId, personalId, statusVinculo) {
    const aluno = buscarUsuarioPorId(alunoId);

    if (!aluno || aluno.tipoUsuario !== "aluno") {
        return null;
    }

    aluno.personalId = personalId;
    aluno.statusVinculo = statusVinculo;
    return aluno;
}

// Este armazenamento e temporario para a etapa atual antes da migracao para PostgreSQL.
function criarUsuario(usuario) {
    const novoUsuario = {
        ...usuario,
        ativo: usuario.ativo !== false
    };

    usuarios.push(novoUsuario);
    return novoUsuario;
}

function atualizarUsuario(usuarioId, dadosAtualizados) {
    const usuario = buscarUsuarioPorId(usuarioId);

    if (!usuario) {
        return null;
    }

    Object.assign(usuario, dadosAtualizados);
    return usuario;
}

module.exports = {
    buscarUsuarioPorEmail,
    buscarUsuarioPorId,
    buscarPersonalPorCodigo,
    buscarPersonalPorCodigoIncluindoInativos,
    buscarPersonalPorId,
    listarUsuariosPorTipo,
    listarAlunosDoPersonal,
    listarSolicitacoesDoPersonal,
    buscarAlunoDoPersonal,
    buscarSolicitacaoDoPersonal,
    definirVinculoAluno,
    criarUsuario,
    atualizarUsuario
};
