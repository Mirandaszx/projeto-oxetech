const { ambiente } = require("../config/ambiente");

module.exports = ambiente.persistencia === "postgres"
    ? require("./postgres/usuariosRepositorioPostgres")
    : require("../dados/usuariosEmMemoria");
