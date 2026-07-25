const { Router } = require("express");

const controladorAluno = require("../controllers/alunoController");
const autenticarToken = require("../middlewares/autenticarToken");
const autorizarPerfis = require("../middlewares/autorizarPerfis");
const validarUuidParametro = require("../middlewares/validarUuidParametro");

const roteador = Router();

roteador.param("fichaId", validarUuidParametro);

// A partir daqui, todas as rotas exigem JWT valido e perfil de aluno.
roteador.use(autenticarToken, autorizarPerfis("aluno"));

roteador.get("/painel", controladorAluno.obterMeuPainel);

// Recurso principal do projeto: CRUD completo das fichas de treino.
roteador.get("/fichas", controladorAluno.listarMinhasFichas);
roteador.post("/fichas", controladorAluno.cadastrarMinhaFicha);
roteador.put("/fichas/:fichaId", controladorAluno.atualizarMinhaFicha);
roteador.patch("/fichas/:fichaId", controladorAluno.atualizarMinhaFicha);
roteador.delete("/fichas/:fichaId", controladorAluno.removerMinhaFicha);
roteador.get("/registros", controladorAluno.listarMeusRegistros);
roteador.post("/fichas/:fichaId/registros", controladorAluno.registrarTreino);
roteador.post("/vinculo", controladorAluno.solicitarVinculo);
roteador.delete("/vinculo", controladorAluno.encerrarVinculo);

module.exports = roteador;
