const { Router } = require("express");

const controladorPersonal = require("../controllers/personalController");
const autenticarToken = require("../middlewares/autenticarToken");
const autorizarPerfis = require("../middlewares/autorizarPerfis");

const roteador = Router();

roteador.use(autenticarToken, autorizarPerfis("personal"));

roteador.get("/painel", controladorPersonal.obterPainel);
roteador.get("/alunos", controladorPersonal.listarAlunos);
roteador.patch("/solicitacoes/:alunoId/aprovar", controladorPersonal.aprovarSolicitacao);
roteador.patch("/solicitacoes/:alunoId/recusar", controladorPersonal.recusarSolicitacao);
roteador.get("/alunos/:alunoId", controladorPersonal.obterAlunoDaCarteira);
roteador.get("/alunos/:alunoId/fichas", controladorPersonal.listarFichasAluno);
roteador.post("/alunos/:alunoId/fichas", controladorPersonal.cadastrarFichaParaAluno);
roteador.put("/alunos/:alunoId/fichas/:fichaId", controladorPersonal.atualizarFichaDoAluno);
roteador.patch("/alunos/:alunoId/fichas/:fichaId", controladorPersonal.atualizarFichaDoAluno);
roteador.delete(
    "/alunos/:alunoId/fichas/:fichaId",
    controladorPersonal.removerFichaDoAluno
);

module.exports = roteador;
