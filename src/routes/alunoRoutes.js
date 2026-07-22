const { Router } = require("express");

const controladorAluno = require("../controllers/alunoController");
const autenticarToken = require("../middlewares/autenticarToken");
const autorizarPerfis = require("../middlewares/autorizarPerfis");

const roteador = Router();

roteador.use(autenticarToken, autorizarPerfis("aluno"));

roteador.get("/painel", controladorAluno.obterMeuPainel);
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
