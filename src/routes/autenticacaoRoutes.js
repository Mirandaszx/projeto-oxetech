const { Router } = require("express");

const controladorAutenticacao = require("../controllers/autenticacaoController");

const roteador = Router();

// Mantem um alias em ingles durante a transicao do projeto.
roteador.post("/cadastro", controladorAutenticacao.cadastrarUsuario);
roteador.post("/register", controladorAutenticacao.cadastrarUsuario);
roteador.post("/login", controladorAutenticacao.entrar);

module.exports = roteador;
