import {
    estado,
    limparEstadoPrivado,
    limparSessao,
    redefinirFormulario,
    salvarSessao
} from "./modulos/estado.js";
import { renderAplicacao } from "./modulos/renderizacao/index.js";
import { renderNotificacao } from "./modulos/renderizacao/comum.js";
import { criarExercicioVazio, obterDataHoje } from "./modulos/utilidades.js";

const raiz = document.getElementById("app");
const areaNotificacoes = document.getElementById("notificacoes");
let timeoutNotificacao = null;

async function iniciarAplicacao() {
    raiz.addEventListener("click", (evento) => void lidarClique(evento));
    raiz.addEventListener("submit", (evento) => void lidarEnvio(evento));
    raiz.addEventListener("keydown", impedirSinalNegativo);
    raiz.addEventListener("input", lidarCampo);
    raiz.addEventListener("change", (evento) => void lidarCampo(evento));

    renderizar();

    setTimeout(() => {
        raiz.classList.add("interface-estavel");
    }, 500);

    if (estado.token) {
        await restaurarSessao();
    }

    estado.carregandoInicial = false;
    renderizar();
}


function mostrarNotificacao(texto, tipo = "sucesso") {
    clearTimeout(timeoutNotificacao);
    estado.notificacao = { texto, tipo };
    renderizarNotificacao();

    timeoutNotificacao = setTimeout(() => {
        estado.notificacao = null;
        renderizarNotificacao();
    }, 3200);
}

function renderizarNotificacao() {
    areaNotificacoes.innerHTML = renderNotificacao(estado);
}

async function requisicaoApi(caminho, { metodo = "GET", corpo } = {}) {
    const configuracao = {
        method: metodo,
        headers: {}
    };

    if (estado.token) {
        configuracao.headers.Authorization = `Bearer ${estado.token}`;
    }

    if (corpo !== undefined) {
        configuracao.headers["Content-Type"] = "application/json";
        configuracao.body = JSON.stringify(corpo);
    }

    const resposta = await fetch(caminho, configuracao);
    const tipoConteudo = resposta.headers.get("content-type") || "";
    const payload = tipoConteudo.includes("application/json")
        ? await resposta.json()
        : await resposta.text();

    if (!resposta.ok) {
        const mensagemApi = typeof payload === "object" ? payload.mensagem : "";
        let mensagem = mensagemApi || "Nao foi possivel concluir a solicitacao.";

        const contaDesativada = resposta.status === 403
            && typeof payload === "object"
            && payload.codigo === "CONTA_DESATIVADA";

        if ((resposta.status === 401 || contaDesativada) && estado.token) {
            limparSessao();
            limparEstadoPrivado();
            estado.abaAutenticacao = "login";
            mensagem = contaDesativada
                ? mensagem
                : "Sua sessao expirou. Entre novamente para continuar.";
            renderizar();
        } else if (resposta.status === 403 && !mensagemApi) {
            mensagem = "Seu perfil nao tem permissao para realizar esta acao.";
        }

        const erro = new Error(mensagem);
        erro.status = resposta.status;
        throw erro;
    }

    return payload;
}

async function restaurarSessao() {
    try {
        const dados = await requisicaoApi("/api/autenticacao/perfil");
        salvarSessao(estado.token, dados.usuario);
        await carregarPainelDoUsuario();
    } catch (_erro) {
        limparSessao();
        limparEstadoPrivado();
    }
}

async function carregarPainelDoUsuario() {
    if (!estado.usuario) {
        return;
    }

    estado.carregandoPainel = true;
    renderizar();

    try {
        if (estado.usuario.tipoUsuario === "admin") {
            await carregarPainelAdmin();
        } else if (estado.usuario.tipoUsuario === "personal") {
            await carregarPainelPersonal();
        } else {
            await carregarPainelAluno();
        }
    } finally {
        estado.carregandoPainel = false;
        renderizar();
    }
}

async function carregarPainelAdmin() {
    estado.admin.painel = await requisicaoApi("/api/admin/painel");
}

async function carregarPainelPersonal() {
    const painel = await requisicaoApi("/api/personal/painel");
    estado.personal.painel = painel;
    const alunos = painel.alunos || [];

    if (alunos.length === 0) {
        estado.personal.alunoSelecionadoId = "";
        estado.personal.detalheAluno = null;
        return;
    }

    const selecionadoAindaExiste = alunos.some((aluno) => (
        aluno.id === estado.personal.alunoSelecionadoId
    ));

    if (!selecionadoAindaExiste) {
        estado.personal.alunoSelecionadoId = alunos[0].id;
    }

    await carregarDetalheAluno(estado.personal.alunoSelecionadoId);
}

async function carregarDetalheAluno(alunoId) {
    if (!alunoId) {
        estado.personal.detalheAluno = null;
        return;
    }

    estado.personal.alunoSelecionadoId = alunoId;
    estado.personal.detalheAluno = await requisicaoApi(`/api/personal/alunos/${alunoId}`);
}

async function carregarPainelAluno() {
    const [painel, fichas, registros] = await Promise.all([
        requisicaoApi("/api/aluno/painel"),
        requisicaoApi("/api/aluno/fichas"),
        requisicaoApi("/api/aluno/registros")
    ]);

    estado.aluno.painel = painel;
    estado.aluno.fichas = fichas.fichas || [];
    estado.aluno.registros = registros.registros || [];
    const fichasAtivas = estado.aluno.fichas.filter((ficha) => (
        ficha.status !== "arquivada"
    ));

    const fichaSelecionadaExiste = fichasAtivas.some((ficha) => (
        ficha.id === estado.aluno.fichaSelecionadaId
    ));

    if (!fichaSelecionadaExiste) {
        prepararFichaAluno(fichasAtivas[0]?.id || "");
    } else if (estado.aluno.exerciciosFicha.length === 0) {
        prepararFichaAluno(estado.aluno.fichaSelecionadaId);
    }

    const fichaDeRegistroExiste = fichasAtivas.some((ficha) => (
        ficha.id === estado.aluno.fichaRegistroId
    ));

    if (fichaDeRegistroExiste) {
        prepararRegistroDaFicha(estado.aluno.fichaRegistroId);
    } else {
        estado.aluno.fichaRegistroId = "";
        estado.aluno.exerciciosRegistro = [];
    }
}

function prepararFichaAluno(fichaId) {
    const ficha = estado.aluno.fichas.find((item) => item.id === fichaId);

    if (!ficha || ficha.status === "arquivada") {
        estado.aluno.fichaSelecionadaId = "";
        estado.formularios.fichaAluno = {
            nomeFicha: "",
            diaSemana: "Segunda",
            objetivo: "",
            observacoes: ""
        };
        estado.aluno.exerciciosFicha = [criarExercicioVazio()];
        return;
    }

    estado.aluno.fichaSelecionadaId = ficha.id;
    estado.formularios.fichaAluno = {
        nomeFicha: ficha.nomeFicha,
        diaSemana: ficha.diaSemana,
        objetivo: ficha.objetivo || "",
        observacoes: ficha.observacoes || ""
    };
    estado.aluno.exerciciosFicha = ficha.exercicios.map((exercicio) => ({
        nome: exercicio.nome,
        grupoMuscular: exercicio.grupoMuscular,
        series: exercicio.series,
        repeticoes: exercicio.repeticoes,
        carga: exercicio.carga || "",
        descanso: exercicio.descanso || "",
        observacoes: exercicio.observacoes || ""
    }));
}

function prepararRegistroDaFicha(fichaId) {
    const ficha = estado.aluno.fichas.find((item) => item.id === fichaId);

    if (!ficha || ficha.status === "arquivada") {
        estado.aluno.fichaRegistroId = "";
        estado.aluno.exerciciosRegistro = [];
        redefinirFormulario("registroTreino");
        return;
    }

    estado.aluno.fichaRegistroId = ficha.id;
    estado.formularios.registroTreino = {
        dataTreino: obterDataHoje(),
        observacoes: ""
    };
    estado.aluno.exerciciosRegistro = ficha.exercicios.map((exercicio) => ({
        exercicioId: exercicio.id,
        nome: exercicio.nome,
        seriesPlanejadas: exercicio.series,
        repeticoesPlanejadas: exercicio.repeticoes,
        cargaPlanejada: exercicio.carga || "",
        seriesConcluidas: exercicio.series,
        repeticoesRealizadas: exercicio.repeticoes,
        cargaUtilizada: exercicio.carga || ""
    }));
}

async function abrirSessao(token, usuario, mensagem) {
    salvarSessao(token, usuario);
    limparEstadoPrivado();
    await carregarPainelDoUsuario();
    mostrarNotificacao(mensagem);
}

function abrirEdicaoPerfil() {
    estado.formularios.perfil = {
        nome: estado.usuario.nome || "",
        email: estado.usuario.email || "",
        objetivoTreino: estado.usuario.objetivoTreino || "",
        senha: "",
        confirmacaoSenha: ""
    };
    estado.perfilAberto = true;
    renderizar();
}

function fecharEdicaoPerfil() {
    estado.perfilAberto = false;
    redefinirFormulario("perfil");
    renderizar();
}

function encerrarSessao() {
    limparSessao();
    limparEstadoPrivado();
    estado.abaAutenticacao = "login";
    redefinirFormulario("login");
    renderizar();
    mostrarNotificacao("Sessao encerrada.", "info");
}

async function executarEnvio(nomeProcesso, acao) {
    estado.processando = nomeProcesso;
    renderizar();

    try {
        await acao();
    } catch (erro) {
        mostrarNotificacao(erro.message, "erro");
    } finally {
        estado.processando = "";
        renderizar();
    }
}

async function enviarCadastro() {
    await executarEnvio("cadastro", async () => {
        const dados = await requisicaoApi("/api/autenticacao/cadastro", {
            metodo: "POST",
            corpo: estado.formularios.cadastro
        });

        redefinirFormulario("cadastro");
        await abrirSessao(dados.token, dados.usuario, dados.mensagem);
    });
}

async function enviarLogin() {
    await executarEnvio("login", async () => {
        const dados = await requisicaoApi("/api/autenticacao/login", {
            metodo: "POST",
            corpo: estado.formularios.login
        });

        redefinirFormulario("login");
        await abrirSessao(dados.token, dados.usuario, dados.mensagem);
    });
}

async function enviarPerfil() {
    await executarEnvio("perfil", async () => {
        const dados = await requisicaoApi("/api/autenticacao/perfil", {
            metodo: "PUT",
            corpo: estado.formularios.perfil
        });

        salvarSessao(estado.token, dados.usuario);
        estado.perfilAberto = false;
        redefinirFormulario("perfil");
        await carregarPainelDoUsuario();
        mostrarNotificacao(dados.mensagem);
    });
}

async function enviarPesquisaAlunos() {
    estado.personal.buscaAluno = estado.formularios.pesquisaAlunos.termo.trim();
    renderizar();
}

async function enviarNovoPersonal() {
    await executarEnvio("novo-personal", async () => {
        const personalEditandoId = estado.admin.personalEditandoId;
        const dados = await requisicaoApi(
            personalEditandoId
                ? `/api/admin/personais/${personalEditandoId}`
                : "/api/admin/personais",
            {
                metodo: personalEditandoId ? "PUT" : "POST",
                corpo: estado.formularios.novoPersonal
            }
        );

        redefinirFormulario("novoPersonal");
        await carregarPainelAdmin();
        mostrarNotificacao(personalEditandoId
            ? dados.mensagem
            : `${dados.mensagem} Codigo: ${dados.personal.codigoVinculo}`);
    });
}

function prepararEdicaoPersonal(personalId) {
    const personal = estado.admin.painel?.personais?.find((item) => item.id === personalId);

    if (!personal) {
        mostrarNotificacao("Personal nao encontrado no painel.", "erro");
        return;
    }

    estado.admin.personalEditandoId = personal.id;
    estado.formularios.novoPersonal = {
        nome: personal.nome,
        email: personal.email,
        senha: "",
        confirmacaoSenha: ""
    };
}

async function alterarStatusPersonal(personalId, ativo) {
    await executarEnvio(`status-personal-${personalId}`, async () => {
        const dados = await requisicaoApi(
            `/api/admin/personais/${personalId}${ativo ? "/status" : ""}`,
            ativo
                ? { metodo: "PATCH", corpo: { ativo: true } }
                : { metodo: "DELETE" }
        );

        if (estado.admin.personalEditandoId === personalId) {
            redefinirFormulario("novoPersonal");
        }

        await carregarPainelAdmin();
        mostrarNotificacao(dados.mensagem, ativo ? "sucesso" : "info");
    });
}

async function enviarSolicitacaoVinculo() {
    await executarEnvio("vinculo", async () => {
        const dados = await requisicaoApi("/api/aluno/vinculo", {
            metodo: "POST",
            corpo: estado.formularios.vinculo
        });

        redefinirFormulario("vinculo");
        await carregarPainelAluno();
        mostrarNotificacao(dados.mensagem);
    });
}

async function responderSolicitacao(alunoId, respostaSolicitacao) {
    await executarEnvio(`solicitacao-${alunoId}`, async () => {
        const dados = await requisicaoApi(
            `/api/personal/solicitacoes/${alunoId}/${respostaSolicitacao}`,
            { metodo: "PATCH" }
        );

        await carregarPainelPersonal();
        mostrarNotificacao(dados.mensagem, respostaSolicitacao === "recusar" ? "info" : "sucesso");
    });
}

function montarPayloadFicha() {
    return {
        ...estado.formularios.novaFicha,
        exercicios: estado.personal.exercicios.map((exercicio) => ({ ...exercicio }))
    };
}

function prepararFichaPersonal(fichaId) {
    const ficha = estado.personal.detalheAluno?.fichas.find((item) => (
        item.id === fichaId
    ));

    if (
        !ficha
        || ficha.status === "arquivada"
        || ficha.personalId !== estado.usuario.id
    ) {
        mostrarNotificacao("Esta ficha nao esta disponivel para edicao pelo personal.", "erro");
        return;
    }

    estado.personal.fichaEditandoId = ficha.id;
    estado.formularios.novaFicha = {
        nomeFicha: ficha.nomeFicha,
        diaSemana: ficha.diaSemana,
        objetivo: ficha.objetivo || "",
        observacoes: ficha.observacoes || ""
    };
    estado.personal.exercicios = ficha.exercicios.map((exercicio) => ({
        nome: exercicio.nome,
        grupoMuscular: exercicio.grupoMuscular,
        series: exercicio.series,
        repeticoes: exercicio.repeticoes,
        carga: exercicio.carga || "",
        descanso: exercicio.descanso || "",
        observacoes: exercicio.observacoes || ""
    }));
}

async function enviarNovaFicha() {
    if (!estado.personal.alunoSelecionadoId) {
        mostrarNotificacao("Escolha um aluno antes de montar a ficha.", "erro");
        return;
    }

    const fichaId = estado.personal.fichaEditandoId;

    await executarEnvio("nova-ficha", async () => {
        const dados = await requisicaoApi(
            fichaId
                ? `/api/personal/alunos/${estado.personal.alunoSelecionadoId}/fichas/${fichaId}`
                : `/api/personal/alunos/${estado.personal.alunoSelecionadoId}/fichas`,
            {
                metodo: fichaId ? "PUT" : "POST",
                corpo: montarPayloadFicha()
            }
        );

        redefinirFormulario("novaFicha");
        await carregarPainelPersonal();
        mostrarNotificacao(dados.mensagem);
    });
}

async function removerFichaPersonal(fichaId) {
    const alunoId = estado.personal.alunoSelecionadoId;

    if (!alunoId || !fichaId) {
        return;
    }

    await executarEnvio(`remover-ficha-${fichaId}`, async () => {
        const dados = await requisicaoApi(
            `/api/personal/alunos/${alunoId}/fichas/${fichaId}`,
            { metodo: "DELETE" }
        );

        redefinirFormulario("novaFicha");
        await carregarPainelPersonal();
        mostrarNotificacao(dados.mensagem, "info");
    });
}

async function removerFichaAluno(fichaId) {
    if (!fichaId) {
        return;
    }

    await executarEnvio(`remover-ficha-${fichaId}`, async () => {
        const dados = await requisicaoApi(`/api/aluno/fichas/${fichaId}`, {
            metodo: "DELETE"
        });

        if (estado.aluno.fichaSelecionadaId === fichaId) {
            redefinirFormulario("fichaAluno");
        }

        if (estado.aluno.fichaRegistroId === fichaId) {
            estado.aluno.fichaRegistroId = "";
            estado.aluno.exerciciosRegistro = [];
            redefinirFormulario("registroTreino");
        }

        await carregarPainelAluno();
        mostrarNotificacao(dados.mensagem, "info");
    });
}

async function encerrarVinculoAluno() {
    await executarEnvio("encerrar-vinculo", async () => {
        const dados = await requisicaoApi("/api/aluno/vinculo", {
            metodo: "DELETE"
        });

        salvarSessao(estado.token, dados.usuario);
        redefinirFormulario("vinculo");
        await carregarPainelAluno();
        mostrarNotificacao(dados.mensagem, "info");
    });
}

async function enviarFichaAluno() {
    const fichaId = estado.aluno.fichaSelecionadaId;
    const editando = Boolean(fichaId);

    await executarEnvio("ficha-aluno", async () => {
        const dados = await requisicaoApi(
            editando ? `/api/aluno/fichas/${fichaId}` : "/api/aluno/fichas",
            {
                metodo: editando ? "PUT" : "POST",
                corpo: {
                    ...estado.formularios.fichaAluno,
                    exercicios: estado.aluno.exerciciosFicha.map((exercicio) => ({ ...exercicio }))
                }
            }
        );

        estado.aluno.fichaSelecionadaId = dados.ficha.id;
        await carregarPainelAluno();
        prepararFichaAluno(dados.ficha.id);
        mostrarNotificacao(dados.mensagem);
    });
}

async function enviarRegistroTreino() {
    const fichaId = estado.aluno.fichaRegistroId;

    if (!fichaId) {
        mostrarNotificacao("Escolha uma ficha para registrar o treino.", "erro");
        return;
    }

    await executarEnvio("registro-treino", async () => {
        const dados = await requisicaoApi(`/api/aluno/fichas/${fichaId}/registros`, {
            metodo: "POST",
            corpo: {
                ...estado.formularios.registroTreino,
                exercicios: estado.aluno.exerciciosRegistro.map((exercicio) => ({
                    exercicioId: exercicio.exercicioId,
                    seriesConcluidas: exercicio.seriesConcluidas,
                    repeticoesRealizadas: exercicio.repeticoesRealizadas,
                    cargaUtilizada: exercicio.cargaUtilizada
                }))
            }
        });

        await carregarPainelAluno();
        prepararRegistroDaFicha(fichaId);
        mostrarNotificacao(dados.mensagem);
    });
}

async function selecionarAluno(alunoId) {
    if (alunoId !== estado.personal.alunoSelecionadoId) {
        redefinirFormulario("novaFicha");
        estado.personal.filtrosHistorico = {
            fichaId: "",
            dataInicio: "",
            dataFim: ""
        };
    }

    estado.carregandoPainel = true;
    renderizar();

    try {
        await carregarDetalheAluno(alunoId);
    } catch (erro) {
        mostrarNotificacao(erro.message, "erro");
    } finally {
        estado.carregandoPainel = false;
        renderizar();
    }
}

async function lidarClique(evento) {
    const botao = evento.target.closest("[data-acao]");

    if (!botao) {
        return;
    }

    const { acao } = botao.dataset;

    if (acao === "trocar-aba") {
        estado.abaAutenticacao = botao.dataset.aba || "login";
        renderizar();
    } else if (acao === "logout") {
        encerrarSessao();
    } else if (acao === "abrir-perfil") {
        abrirEdicaoPerfil();
    } else if (acao === "fechar-perfil") {
        fecharEdicaoPerfil();
    } else if (acao === "limpar-pesquisa-alunos") {
        estado.personal.buscaAluno = "";
        redefinirFormulario("pesquisaAlunos");
        renderizar();
    } else if (acao === "limpar-filtros-historico") {
        const escopo = botao.dataset.escopo === "personal" ? "personal" : "aluno";
        estado[escopo].filtrosHistorico = {
            fichaId: "",
            dataInicio: "",
            dataFim: ""
        };
        renderizar();
    } else if (acao === "recarregar") {
        try {
            await carregarPainelDoUsuario();
        } catch (erro) {
            mostrarNotificacao(erro.message, "erro");
        }
    } else if (acao === "editar-personal") {
        prepararEdicaoPersonal(botao.dataset.personalId || "");
        renderizar();
    } else if (acao === "cancelar-edicao-personal") {
        redefinirFormulario("novoPersonal");
        renderizar();
    } else if (acao === "alterar-status-personal") {
        const personalId = botao.dataset.personalId || "";
        const ativar = botao.dataset.ativo === "true";
        const acaoStatus = ativar ? "reativar" : "desativar";
        const confirmou = typeof globalThis.confirm !== "function"
            || globalThis.confirm(`Deseja ${acaoStatus} este personal?`);

        if (confirmou) {
            await alterarStatusPersonal(personalId, ativar);
        }
    } else if (acao === "selecionar-aluno") {
        await selecionarAluno(botao.dataset.alunoId || "");
    } else if (acao === "aprovar-aluno") {
        await responderSolicitacao(botao.dataset.alunoId, "aprovar");
    } else if (acao === "recusar-aluno") {
        await responderSolicitacao(botao.dataset.alunoId, "recusar");
    } else if (acao === "adicionar-exercicio") {
        estado.personal.exercicios.push(criarExercicioVazio());
        renderizar();
    } else if (acao === "remover-exercicio" && estado.personal.exercicios.length > 1) {
        estado.personal.exercicios.splice(Number(botao.dataset.indice), 1);
        renderizar();
    } else if (acao === "editar-ficha-personal") {
        prepararFichaPersonal(botao.dataset.fichaId || "");
        renderizar();
    } else if (acao === "cancelar-edicao-ficha-personal") {
        redefinirFormulario("novaFicha");
        renderizar();
    } else if (acao === "remover-ficha-personal") {
        const confirmou = typeof globalThis.confirm !== "function"
            || globalThis.confirm("Excluir definitivamente esta ficha? Os treinos registrados continuarao no historico.");

        if (confirmou) {
            await removerFichaPersonal(botao.dataset.fichaId || "");
        }
    } else if (acao === "nova-ficha-aluno") {
        prepararFichaAluno("");
        renderizar();
    } else if (acao === "editar-ficha-aluno") {
        prepararFichaAluno(botao.dataset.fichaId || "");
        renderizar();
    } else if (acao === "remover-ficha-aluno") {
        const confirmou = typeof globalThis.confirm !== "function"
            || globalThis.confirm("Excluir definitivamente esta ficha? Os treinos registrados continuarao no historico.");

        if (confirmou) {
            await removerFichaAluno(botao.dataset.fichaId || "");
        }
    } else if (acao === "adicionar-exercicio-aluno") {
        estado.aluno.exerciciosFicha.push(criarExercicioVazio());
        renderizar();
    } else if (acao === "remover-exercicio-aluno" && estado.aluno.exerciciosFicha.length > 1) {
        estado.aluno.exerciciosFicha.splice(Number(botao.dataset.indice), 1);
        renderizar();
    } else if (acao === "registrar-ficha-aluno") {
        prepararRegistroDaFicha(botao.dataset.fichaId || "");
        renderizar();
    } else if (acao === "cancelar-registro-treino") {
        estado.aluno.fichaRegistroId = "";
        estado.aluno.exerciciosRegistro = [];
        redefinirFormulario("registroTreino");
        renderizar();
    } else if (acao === "encerrar-vinculo") {
        const confirmou = typeof globalThis.confirm !== "function"
            || globalThis.confirm("Deseja encerrar este acompanhamento?");

        if (confirmou) {
            await encerrarVinculoAluno();
        }
    }
}

async function lidarEnvio(evento) {
    const formulario = evento.target.closest("[data-form-submit]");

    if (!formulario) {
        return;
    }

    evento.preventDefault();
    const acoes = {
        cadastro: enviarCadastro,
        login: enviarLogin,
        perfil: enviarPerfil,
        "pesquisa-alunos": enviarPesquisaAlunos,
        "novo-personal": enviarNovoPersonal,
        vinculo: enviarSolicitacaoVinculo,
        "nova-ficha": enviarNovaFicha,
        "ficha-aluno": enviarFichaAluno,
        "registro-treino": enviarRegistroTreino
    };

    await acoes[formulario.dataset.formSubmit]?.();
}

function limparQuantidadeInvalida(campo) {
    if (campo.matches("[data-quantidade-positiva]")) {
        const valor = campo.value.trim();

        if (valor !== "" && (!/^\d+$/.test(valor) || Number(valor) < 1)) {
            campo.value = "";
        }
    }

    if (
        campo.matches("[data-repeticoes-positivas]")
        && campo.value.includes("-")
    ) {
        campo.value = "";
    }
}

function impedirSinalNegativo(evento) {
    if (
        evento.key === "-"
        && evento.target.matches(
            "[data-quantidade-positiva], [data-repeticoes-positivas]"
        )
    ) {
        evento.preventDefault();
    }
}

async function lidarCampo(evento) {
    limparQuantidadeInvalida(evento.target);

    const campoFormulario = evento.target.closest("[data-formulario]");

    if (campoFormulario) {
        const nomeFormulario = campoFormulario.dataset.formulario;
        estado.formularios[nomeFormulario][campoFormulario.name] = campoFormulario.value;
        return;
    }

    if (evento.target.matches("[data-controle='filtro-historico']")) {
        const escopo = evento.target.dataset.escopo === "personal" ? "personal" : "aluno";
        const campo = evento.target.dataset.campo;

        estado[escopo].filtrosHistorico[campo] = evento.target.value;
        renderizar();
        return;
    }

    if (evento.target.matches("[data-exercicio-campo]")) {
        const indice = Number(evento.target.dataset.indice);
        estado.personal.exercicios[indice][evento.target.dataset.exercicioCampo] = evento.target.value;
        return;
    }

    if (evento.target.matches("[data-ficha-aluno-campo]")) {
        const indice = Number(evento.target.dataset.indice);
        const campo = evento.target.dataset.fichaAlunoCampo;
        estado.aluno.exerciciosFicha[indice][campo] = evento.target.value;
        return;
    }

    if (evento.target.matches("[data-registro-campo]")) {
        const indice = Number(evento.target.dataset.indice);
        const campo = evento.target.dataset.registroCampo;
        estado.aluno.exerciciosRegistro[indice][campo] = evento.target.value;
        return;
    }

    if (evento.target.matches("[data-controle='aluno-selecionado']")) {
        await selecionarAluno(evento.target.value);
        return;
    }

    if (evento.target.matches("[data-controle='ficha-aluno-selecionada']")) {
        prepararFichaAluno(evento.target.value);
        renderizar();
    }
}


function renderizar() {
    raiz.innerHTML = renderAplicacao(estado);
}

iniciarAplicacao();
