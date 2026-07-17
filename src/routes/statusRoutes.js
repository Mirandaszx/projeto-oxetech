const { Router } = require("express");

const controladorStatus = require("../controllers/statusController");

const roteador = Router();

roteador.get("/", controladorStatus.obterStatus);

module.exports = roteador;
