const { Router } = require("express");

const rotasAutenticacao = require("./autenticacaoRoutes");
const rotasAdmin = require("./adminRoutes");
const rotasAluno = require("./alunoRoutes");
const rotasPersonal = require("./personalRoutes");
const rotasStatus = require("./statusRoutes");

const roteador = Router();

// Cada prefixo direciona a requisicao para uma camada de rotas especializada.
roteador.use("/status", rotasStatus);
roteador.use("/health", rotasStatus);
roteador.use("/autenticacao", rotasAutenticacao);
roteador.use("/auth", rotasAutenticacao);
roteador.use("/admin", rotasAdmin);
roteador.use("/aluno", rotasAluno);
roteador.use("/personal", rotasPersonal);

module.exports = roteador;
