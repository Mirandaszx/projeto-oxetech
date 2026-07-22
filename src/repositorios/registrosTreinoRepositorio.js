const { ambiente } = require("../config/ambiente");

module.exports = ambiente.persistencia === "postgres"
    ? require("./postgres/registrosTreinoRepositorioPostgres")
    : require("../dados/registrosTreinoEmMemoria");
