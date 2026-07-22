const { ambiente } = require("../config/ambiente");

module.exports = ambiente.persistencia === "postgres"
    ? require("./postgres/fichasTreinoRepositorioPostgres")
    : require("../dados/fichasTreinoEmMemoria");
