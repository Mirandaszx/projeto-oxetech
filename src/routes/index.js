const { Router } = require("express");

const rotasAutenticacao = require("./autenticacaoRoutes");
const rotasStatus = require("./statusRoutes");

const roteador = Router();

roteador.use("/status", rotasStatus);
roteador.use("/health", rotasStatus);
roteador.use("/autenticacao", rotasAutenticacao);
roteador.use("/auth", rotasAutenticacao);

module.exports = roteador;
