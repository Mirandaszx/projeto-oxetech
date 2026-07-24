const { Router } = require("express");

const controladorAdmin = require("../controllers/adminController");
const autenticarToken = require("../middlewares/autenticarToken");
const autorizarPerfis = require("../middlewares/autorizarPerfis");

const roteador = Router();

roteador.use(autenticarToken, autorizarPerfis("admin"));

roteador.get("/painel", controladorAdmin.obterPainel);
roteador.post("/personais", controladorAdmin.cadastrarPersonal);
roteador.put("/personais/:personalId", controladorAdmin.atualizarPersonal);
roteador.patch("/personais/:personalId", controladorAdmin.atualizarPersonal);
roteador.patch("/personais/:personalId/status", controladorAdmin.alterarStatusPersonal);
roteador.delete("/personais/:personalId", controladorAdmin.desativarPersonal);

module.exports = roteador;
