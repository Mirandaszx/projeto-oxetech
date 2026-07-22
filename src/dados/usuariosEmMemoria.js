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
        && usuario.codigoVinculo === codigoNormalizado
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
    usuarios.push(usuario);
    return usuario;
}

module.exports = {
    buscarUsuarioPorEmail,
    buscarUsuarioPorId,
    buscarPersonalPorCodigo,
    listarUsuariosPorTipo,
    listarAlunosDoPersonal,
    listarSolicitacoesDoPersonal,
    buscarAlunoDoPersonal,
    buscarSolicitacaoDoPersonal,
    definirVinculoAluno,
    criarUsuario
};
