const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");

const { ambiente } = require("../config/ambiente");
const {
    buscarUsuarioPorEmail,
    criarUsuario
} = require("../repositorios/usuariosRepositorio");
const { testarConexao } = require("./conexao");

async function garantirAdministradorInicial() {
    const email = ambiente.administrador.email.trim().toLowerCase();
    const administradorExistente = await buscarUsuarioPorEmail(email);

    if (administradorExistente) {
        return;
    }

    await criarUsuario({
        id: randomUUID(),
        nome: ambiente.administrador.nome,
        email,
        senhaHash: await bcrypt.hash(ambiente.administrador.senha, 10),
        tipoUsuario: "admin",
        criadoEm: new Date().toISOString()
    });
}

async function inicializarPersistencia() {
    if (ambiente.persistencia === "memoria") {
        return;
    }

    await testarConexao();
    await garantirAdministradorInicial();
}

module.exports = { inicializarPersistencia };
