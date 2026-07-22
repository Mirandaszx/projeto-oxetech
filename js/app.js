const CHAVE_TOKEN = "iron_pump_token";
const CHAVE_USUARIO = "iron_pump_usuario";

const classes = {
    painel: "metal-panel relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl",
    painelCompacto: "metal-panel relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl",
    campo: "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-ember-400/60 focus:bg-black/45 focus:ring-2 focus:ring-ember-500/20",
    botaoPrimario: "inline-flex items-center justify-center rounded-full border border-ember-300/30 bg-ember-500 px-5 py-3 text-sm font-semibold text-coal-950 transition hover:bg-ember-400 disabled:cursor-not-allowed disabled:opacity-55",
    botaoSecundario: "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-stone-100 transition hover:border-ember-400/35 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-55",
    botaoPerigo: "inline-flex items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-55",
    badge: "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-stone-300",
    metrica: "rounded-[24px] border border-white/10 bg-black/25 p-4"
};

const estado = {
    token: localStorage.getItem(CHAVE_TOKEN) || "",
    usuario: lerItemJson(CHAVE_USUARIO, null),
    carregandoInicial: true,
    carregandoPainel: false,
    processando: "",
    abaAutenticacao: "login",
    notificacao: null,
    formularios: {
        cadastro: {
            nome: "",
            email: "",
            senha: "",
            confirmacaoSenha: "",
            objetivoTreino: "",
            codigoPersonal: ""
        },
        login: {
            email: "",
            senha: ""
        },
        novoPersonal: {
            nome: "",
            email: "",
            senha: "",
            confirmacaoSenha: ""
        },
        vinculo: {
            codigoPersonal: ""
        },
        novaFicha: {
            nomeFicha: "",
            diaSemana: "Segunda",
            objetivo: "",
            observacoes: ""
        },
        fichaAluno: {
            nomeFicha: "",
            diaSemana: "Segunda",
            objetivo: "",
            observacoes: ""
        },
        registroTreino: {
            dataTreino: obterDataHoje(),
            observacoes: ""
        }
    },
    admin: {
        painel: null
    },
    personal: {
        painel: null,
        detalheAluno: null,
        alunoSelecionadoId: "",
        fichaEditandoId: "",
        exercicios: [criarExercicioVazio()]
    },
    aluno: {
        painel: null,
        fichas: [],
        registros: [],
        fichaSelecionadaId: "",
        exerciciosFicha: [criarExercicioVazio()],
        fichaRegistroId: "",
        exerciciosRegistro: []
    }
};

const raiz = document.getElementById("app");
let timeoutNotificacao = null;

async function iniciarAplicacao() {
    raiz.addEventListener("click", (evento) => void lidarClique(evento));
    raiz.addEventListener("submit", (evento) => void lidarEnvio(evento));
    raiz.addEventListener("input", lidarCampo);
    raiz.addEventListener("change", (evento) => void lidarCampo(evento));

    renderizar();

    if (estado.token) {
        await restaurarSessao();
    }

    estado.carregandoInicial = false;
    renderizar();
}

function lerItemJson(chave, valorPadrao) {
    try {
        const conteudo = localStorage.getItem(chave);
        return conteudo ? JSON.parse(conteudo) : valorPadrao;
    } catch (_erro) {
        return valorPadrao;
    }
}

function criarExercicioVazio() {
    return {
        nome: "",
        grupoMuscular: "",
        series: "3",
        repeticoes: "12",
        carga: "",
        descanso: "60s",
        observacoes: ""
    };
}

function escaparHtml(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, (caractere) => {
        const mapa = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#039;"
        };

        return mapa[caractere];
    });
}

function pluralizar(quantidade, singular, plural) {
    return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

function nomeDoPerfil(tipoUsuario) {
    const nomes = {
        admin: "Administrador",
        personal: "Personal",
        aluno: "Aluno"
    };

    return nomes[tipoUsuario] || "Usuario";
}

function obterIniciais(nome) {
    return String(nome || "IP")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase() || "")
        .join("");
}

function formatarData(dataIso) {
    if (!dataIso) {
        return "Nao informado";
    }

    const data = /^\d{4}-\d{2}-\d{2}$/.test(dataIso)
        ? new Date(`${dataIso}T12:00:00`)
        : new Date(dataIso);

    return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function obterDataHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function salvarSessao(token, usuario) {
    estado.token = token;
    estado.usuario = usuario;
    localStorage.setItem(CHAVE_TOKEN, token);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

function limparSessao() {
    estado.token = "";
    estado.usuario = null;
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
}

function redefinirFormulario(nomeFormulario) {
    const formulariosVazios = {
        cadastro: {
            nome: "",
            email: "",
            senha: "",
            confirmacaoSenha: "",
            objetivoTreino: "",
            codigoPersonal: ""
        },
        login: {
            email: "",
            senha: ""
        },
        novoPersonal: {
            nome: "",
            email: "",
            senha: "",
            confirmacaoSenha: ""
        },
        vinculo: {
            codigoPersonal: ""
        },
        novaFicha: {
            nomeFicha: "",
            diaSemana: "Segunda",
            objetivo: "",
            observacoes: ""
        },
        fichaAluno: {
            nomeFicha: "",
            diaSemana: "Segunda",
            objetivo: "",
            observacoes: ""
        },
        registroTreino: {
            dataTreino: obterDataHoje(),
            observacoes: ""
        }
    };

    estado.formularios[nomeFormulario] = formulariosVazios[nomeFormulario];

    if (nomeFormulario === "novaFicha") {
        estado.personal.fichaEditandoId = "";
        estado.personal.exercicios = [criarExercicioVazio()];
    }

    if (nomeFormulario === "fichaAluno") {
        estado.aluno.fichaSelecionadaId = "";
        estado.aluno.exerciciosFicha = [criarExercicioVazio()];
    }
}

function limparEstadoPrivado() {
    estado.admin.painel = null;
    estado.personal = {
        painel: null,
        detalheAluno: null,
        alunoSelecionadoId: "",
        fichaEditandoId: "",
        exercicios: [criarExercicioVazio()]
    };
    estado.aluno = {
        painel: null,
        fichas: [],
        registros: [],
        fichaSelecionadaId: "",
        exerciciosFicha: [criarExercicioVazio()],
        fichaRegistroId: "",
        exerciciosRegistro: []
    };
    redefinirFormulario("novoPersonal");
    redefinirFormulario("vinculo");
    redefinirFormulario("novaFicha");
    redefinirFormulario("fichaAluno");
    redefinirFormulario("registroTreino");
}

function mostrarNotificacao(texto, tipo = "sucesso") {
    clearTimeout(timeoutNotificacao);
    estado.notificacao = { texto, tipo };
    renderizar();

    timeoutNotificacao = setTimeout(() => {
        estado.notificacao = null;
        renderizar();
    }, 3200);
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

        if (resposta.status === 401 && estado.token) {
            limparSessao();
            limparEstadoPrivado();
            estado.abaAutenticacao = "login";
            mensagem = "Sua sessao expirou. Entre novamente para continuar.";
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

async function enviarNovoPersonal() {
    await executarEnvio("novo-personal", async () => {
        const dados = await requisicaoApi("/api/admin/personais", {
            metodo: "POST",
            corpo: estado.formularios.novoPersonal
        });

        redefinirFormulario("novoPersonal");
        await carregarPainelAdmin();
        mostrarNotificacao(`${dados.mensagem} Codigo: ${dados.personal.codigoVinculo}`);
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
    } else if (acao === "recarregar") {
        try {
            await carregarPainelDoUsuario();
        } catch (erro) {
            mostrarNotificacao(erro.message, "erro");
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
        "novo-personal": enviarNovoPersonal,
        vinculo: enviarSolicitacaoVinculo,
        "nova-ficha": enviarNovaFicha,
        "ficha-aluno": enviarFichaAluno,
        "registro-treino": enviarRegistroTreino
    };

    await acoes[formulario.dataset.formSubmit]?.();
}

async function lidarCampo(evento) {
    const campoFormulario = evento.target.closest("[data-formulario]");

    if (campoFormulario) {
        const nomeFormulario = campoFormulario.dataset.formulario;
        estado.formularios[nomeFormulario][campoFormulario.name] = campoFormulario.value;
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
    raiz.innerHTML = `
        ${renderNotificacao()}
        <main class="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
            ${renderCabecalho()}
            ${estado.carregandoInicial ? renderCarregandoInicial() : estado.usuario ? renderAreaPrivada() : renderAreaPublica()}
        </main>
    `;
}

function renderNotificacao() {
    if (!estado.notificacao) {
        return "";
    }

    const estilos = {
        sucesso: "border-emerald-400/20 bg-emerald-500/15 text-emerald-100",
        erro: "border-red-400/20 bg-red-500/15 text-red-100",
        info: "border-sky-400/20 bg-sky-500/15 text-sky-100"
    };

    return `
        <div class="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
            <div class="soft-rise rounded-full border px-5 py-3 text-sm font-semibold shadow-xl backdrop-blur-xl ${estilos[estado.notificacao.tipo] || estilos.info}">
                ${escaparHtml(estado.notificacao.texto)}
            </div>
        </div>
    `;
}

function renderCabecalho() {
    return `
        <header class="soft-rise ${classes.painel} mb-6 px-5 py-4 sm:px-6">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center gap-4">
                    <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-ember-400 to-ember-700 font-display text-xl font-bold text-coal-950">IP</div>
                    <div>
                        <h1 class="font-display text-2xl font-semibold text-white">Diario de Treino Iron Pump</h1>
                        <p class="mt-1 text-sm text-stone-400">Organize seus treinos em um so lugar</p>
                    </div>
                </div>
                ${estado.usuario ? renderResumoUsuarioCabecalho() : ""}
            </div>
        </header>
    `;
}

function renderResumoUsuarioCabecalho() {
    return `
        <div class="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 p-2 pl-3">
            <div class="grid h-10 w-10 place-items-center rounded-full bg-ember-500 font-display text-sm font-bold text-coal-950">
                ${escaparHtml(obterIniciais(estado.usuario.nome))}
            </div>
            <div class="hidden sm:block">
                <p class="text-sm font-semibold text-white">${escaparHtml(estado.usuario.nome)}</p>
                <p class="text-xs text-stone-400">${escaparHtml(nomeDoPerfil(estado.usuario.tipoUsuario))}</p>
            </div>
            <button type="button" data-acao="logout" class="${classes.botaoSecundario} px-4 py-2">Sair</button>
        </div>
    `;
}

function renderCarregandoInicial() {
    return `
        <section class="flex flex-1 items-center justify-center py-12">
            <div class="${classes.painel} max-w-md text-center">
                <h2 class="font-display text-3xl font-semibold text-white">Carregando...</h2>
                <p class="mt-3 text-sm text-stone-400">Aguarde enquanto sua sessao e preparada.</p>
            </div>
        </section>
    `;
}

function renderAreaPublica() {
    return `
        <section class="flex flex-1 items-start justify-center pb-10 pt-4 sm:items-center">
            <aside class="soft-rise ${classes.painel} w-full max-w-xl p-6 sm:p-8">
                <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p class="${classes.badge} w-fit">Acesso</p>
                        <h2 class="mt-4 font-display text-3xl font-semibold text-white">${estado.abaAutenticacao === "login" ? "Entrar" : "Criar conta"}</h2>
                        <p class="mt-2 text-sm text-stone-400">${estado.abaAutenticacao === "login" ? "Use seu email e senha para continuar." : "Preencha seus dados para comecar."}</p>
                    </div>
                    <div class="rounded-full border border-white/10 bg-black/20 p-1">
                        <button type="button" data-acao="trocar-aba" data-aba="login" class="rounded-full px-4 py-2 text-sm font-semibold transition ${estado.abaAutenticacao === "login" ? "bg-ember-500 text-coal-950" : "text-stone-300"}">Login</button>
                        <button type="button" data-acao="trocar-aba" data-aba="cadastro" class="rounded-full px-4 py-2 text-sm font-semibold transition ${estado.abaAutenticacao === "cadastro" ? "bg-ember-500 text-coal-950" : "text-stone-300"}">Cadastro</button>
                    </div>
                </div>

                <div class="mt-8">
                    ${estado.abaAutenticacao === "login" ? renderFormularioLogin() : renderFormularioCadastro()}
                </div>
            </aside>
        </section>
    `;
}

function renderFormularioLogin() {
    const login = estado.formularios.login;

    return `
        <form data-form-submit="login" class="space-y-4">
            <label class="block">
                <span class="mb-2 block text-sm font-medium text-stone-300">Email</span>
                <input data-formulario="login" name="email" type="email" autocomplete="email" class="${classes.campo}" placeholder="seuemail@exemplo.com" value="${escaparHtml(login.email)}">
            </label>
            <label class="block">
                <span class="mb-2 block text-sm font-medium text-stone-300">Senha</span>
                <input data-formulario="login" name="senha" type="password" autocomplete="current-password" class="${classes.campo}" placeholder="Sua senha" value="${escaparHtml(login.senha)}">
            </label>
            <button type="submit" class="${classes.botaoPrimario} w-full">
                ${estado.processando === "login" ? "Entrando..." : "Entrar"}
            </button>
        </form>
    `;
}

function renderFormularioCadastro() {
    const cadastro = estado.formularios.cadastro;

    return `
        <form data-form-submit="cadastro" class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
                <label class="block sm:col-span-2">
                    <span class="mb-2 block text-sm font-medium text-stone-300">Nome completo</span>
                    <input data-formulario="cadastro" name="nome" type="text" autocomplete="name" class="${classes.campo}" placeholder="Seu nome" value="${escaparHtml(cadastro.nome)}">
                </label>
                <label class="block sm:col-span-2">
                    <span class="mb-2 block text-sm font-medium text-stone-300">Email</span>
                    <input data-formulario="cadastro" name="email" type="email" autocomplete="email" class="${classes.campo}" placeholder="seuemail@exemplo.com" value="${escaparHtml(cadastro.email)}">
                </label>
                <label class="block">
                    <span class="mb-2 block text-sm font-medium text-stone-300">Senha</span>
                    <input data-formulario="cadastro" name="senha" type="password" autocomplete="new-password" class="${classes.campo}" placeholder="Minimo de 6 caracteres" value="${escaparHtml(cadastro.senha)}">
                </label>
                <label class="block">
                    <span class="mb-2 block text-sm font-medium text-stone-300">Confirmacao</span>
                    <input data-formulario="cadastro" name="confirmacaoSenha" type="password" autocomplete="new-password" class="${classes.campo}" placeholder="Repita a senha" value="${escaparHtml(cadastro.confirmacaoSenha)}">
                </label>
                <label class="block sm:col-span-2">
                    <span class="mb-2 block text-sm font-medium text-stone-300">Objetivo principal</span>
                    <input data-formulario="cadastro" name="objetivoTreino" type="text" class="${classes.campo}" placeholder="Ex.: Hipertrofia ou condicionamento" value="${escaparHtml(cadastro.objetivoTreino)}">
                </label>
                <label class="block sm:col-span-2">
                    <span class="mb-2 block text-sm font-medium text-stone-300">Codigo do personal <span class="text-stone-500">(opcional)</span></span>
                    <input data-formulario="cadastro" name="codigoPersonal" type="text" class="${classes.campo} uppercase" placeholder="Ex.: IP-12AB34" value="${escaparHtml(cadastro.codigoPersonal)}">
                </label>
            </div>
            <button type="submit" class="${classes.botaoPrimario} w-full">
                ${estado.processando === "cadastro" ? "Criando conta..." : "Criar conta"}
            </button>
        </form>
    `;
}

function renderAreaPrivada() {
    if (estado.carregandoPainel) {
        return `
            <section class="flex flex-1 items-center justify-center py-10">
                <div class="${classes.painel} max-w-md text-center">
                    <h2 class="font-display text-3xl font-semibold text-white">Atualizando painel...</h2>
                </div>
            </section>
        `;
    }

    if (estado.usuario.tipoUsuario === "admin") {
        return renderPainelAdmin();
    }

    return estado.usuario.tipoUsuario === "personal"
        ? renderPainelPersonal()
        : renderPainelAluno();
}

function renderMetrica(rotulo, valor, detalhe) {
    return `
        <div class="${classes.metrica}">
            <p class="text-xs uppercase tracking-[0.2em] text-stone-400">${escaparHtml(rotulo)}</p>
            <p class="mt-3 font-display text-4xl font-semibold text-white">${escaparHtml(valor)}</p>
            <p class="mt-2 text-sm text-stone-400">${escaparHtml(detalhe)}</p>
        </div>
    `;
}

function renderPainelAdmin() {
    const painel = estado.admin.painel;
    const personais = painel?.personais || [];

    return `
        <section class="space-y-6 pb-10">
            <div class="soft-rise ${classes.painel} p-7 lg:p-8">
                <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p class="${classes.badge} w-fit">Painel do administrador</p>
                        <h2 class="mt-5 font-display text-4xl font-semibold text-white">Gerencie os personais da academia.</h2>
                        <p class="mt-3 text-sm leading-7 text-stone-400">Cadastre as contas e entregue o codigo de vinculo para cada personal.</p>
                    </div>
                    <button type="button" data-acao="recarregar" class="${classes.botaoSecundario}">Atualizar painel</button>
                </div>
                <div class="mt-8 grid gap-4 sm:grid-cols-2">
                    ${renderMetrica("Personais", String(painel?.resumo.totalPersonais || 0), "Contas criadas pelo administrador")}
                    ${renderMetrica("Alunos", String(painel?.resumo.totalAlunos || 0), "Alunos cadastrados na plataforma")}
                </div>
            </div>

            <div class="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                ${renderFormularioNovoPersonal()}
                ${renderListaPersonais(personais)}
            </div>
        </section>
    `;
}

function renderFormularioNovoPersonal() {
    const formulario = estado.formularios.novoPersonal;

    return `
        <section class="soft-rise ${classes.painel}">
            <p class="${classes.badge} w-fit">Novo personal</p>
            <h3 class="mt-4 font-display text-2xl font-semibold text-white">Criar conta profissional</h3>
            <form data-form-submit="novo-personal" class="mt-6 space-y-4">
                <label class="block">
                    <span class="mb-2 block text-sm font-medium text-stone-300">Nome completo</span>
                    <input data-formulario="novoPersonal" name="nome" type="text" class="${classes.campo}" placeholder="Nome do personal" value="${escaparHtml(formulario.nome)}">
                </label>
                <label class="block">
                    <span class="mb-2 block text-sm font-medium text-stone-300">Email</span>
                    <input data-formulario="novoPersonal" name="email" type="email" class="${classes.campo}" placeholder="personal@exemplo.com" value="${escaparHtml(formulario.email)}">
                </label>
                <div class="grid gap-4 sm:grid-cols-2">
                    <label class="block">
                        <span class="mb-2 block text-sm font-medium text-stone-300">Senha inicial</span>
                        <input data-formulario="novoPersonal" name="senha" type="password" class="${classes.campo}" placeholder="Minimo 6 caracteres" value="${escaparHtml(formulario.senha)}">
                    </label>
                    <label class="block">
                        <span class="mb-2 block text-sm font-medium text-stone-300">Confirmacao</span>
                        <input data-formulario="novoPersonal" name="confirmacaoSenha" type="password" class="${classes.campo}" placeholder="Repita a senha" value="${escaparHtml(formulario.confirmacaoSenha)}">
                    </label>
                </div>
                <button type="submit" class="${classes.botaoPrimario} w-full">
                    ${estado.processando === "novo-personal" ? "Cadastrando..." : "Cadastrar personal"}
                </button>
            </form>
        </section>
    `;
}

function renderListaPersonais(personais) {
    return `
        <section class="soft-rise ${classes.painel}">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <p class="${classes.badge} w-fit">Equipe</p>
                    <h3 class="mt-4 font-display text-2xl font-semibold text-white">Personais cadastrados</h3>
                </div>
                <span class="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-stone-300">${personais.length}</span>
            </div>
            <div class="mt-6 space-y-3">
                ${personais.length === 0 ? renderVazio("Nenhum personal cadastrado.") : personais.map((personal) => `
                    <article class="rounded-[24px] border border-white/10 bg-black/25 p-5">
                        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h4 class="font-display text-xl font-semibold text-white">${escaparHtml(personal.nome)}</h4>
                                <p class="mt-1 text-sm text-stone-400">${escaparHtml(personal.email)}</p>
                            </div>
                            <div class="rounded-2xl border border-ember-400/20 bg-ember-500/10 px-4 py-3 text-center">
                                <p class="text-xs uppercase tracking-[0.2em] text-ember-200">Codigo de vinculo</p>
                                <p class="mt-1 font-display text-xl font-bold text-white">${escaparHtml(personal.codigoVinculo)}</p>
                            </div>
                        </div>
                        <div class="mt-4 flex flex-wrap gap-2 text-xs text-stone-300">
                            <span class="rounded-full border border-white/10 px-3 py-1">${pluralizar(personal.totalAlunos, "aluno", "alunos")}</span>
                            <span class="rounded-full border border-white/10 px-3 py-1">${pluralizar(personal.totalSolicitacoes, "solicitacao", "solicitacoes")}</span>
                            <span class="rounded-full border border-white/10 px-3 py-1">Criado em ${escaparHtml(formatarData(personal.criadoEm))}</span>
                        </div>
                    </article>
                `).join("")}
            </div>
        </section>
    `;
}

function renderPainelPersonal() {
    const painel = estado.personal.painel;
    const alunos = painel?.alunos || [];
    const solicitacoes = painel?.solicitacoes || [];
    const alunoAtual = estado.personal.detalheAluno?.aluno || null;
    const fichasAtual = estado.personal.detalheAluno?.fichas || [];
    const registrosAtuais = estado.personal.detalheAluno?.registros || [];

    return `
        <section class="space-y-6 pb-10">
            <div class="soft-rise ${classes.painel} p-7 lg:p-8">
                <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p class="${classes.badge} w-fit">Painel do personal</p>
                        <h2 class="mt-5 font-display text-4xl font-semibold text-white">Acompanhe seus alunos e monte as fichas.</h2>
                        <p class="mt-3 text-sm text-stone-400">Compartilhe seu codigo para receber novas solicitacoes.</p>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                        <div class="rounded-2xl border border-ember-400/20 bg-ember-500/10 px-4 py-3">
                            <p class="text-xs uppercase tracking-[0.2em] text-ember-200">Seu codigo</p>
                            <p class="mt-1 font-display text-xl font-bold text-white">${escaparHtml(painel?.personal.codigoVinculo || "-")}</p>
                        </div>
                        <button type="button" data-acao="recarregar" class="${classes.botaoSecundario}">Atualizar</button>
                    </div>
                </div>
                <div class="mt-8 grid gap-4 md:grid-cols-3">
                    ${renderMetrica("Alunos ativos", String(painel?.resumo.totalAlunos || 0), "Vinculos aprovados")}
                    ${renderMetrica("Solicitacoes", String(painel?.resumo.totalSolicitacoes || 0), "Aguardando sua resposta")}
                    ${renderMetrica("Fichas criadas", String(painel?.resumo.totalFichas || 0), "Treinos montados")}
                </div>
            </div>

            ${renderSolicitacoes(solicitacoes)}

            <div class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div class="space-y-6">
                    ${renderCarteiraAlunos(alunos)}
                    ${renderDetalheAluno(alunoAtual, fichasAtual, registrosAtuais)}
                </div>
                ${renderFormularioNovaFicha(alunos, alunoAtual)}
            </div>
        </section>
    `;
}

function renderSolicitacoes(solicitacoes) {
    return `
        <section class="soft-rise ${classes.painel}">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <p class="${classes.badge} w-fit">Novos vinculos</p>
                    <h3 class="mt-4 font-display text-2xl font-semibold text-white">Solicitacoes de alunos</h3>
                </div>
                <span class="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-stone-300">${solicitacoes.length}</span>
            </div>
            <div class="mt-6 grid gap-3 md:grid-cols-2">
                ${solicitacoes.length === 0 ? `<div class="md:col-span-2">${renderVazio("Nenhuma solicitacao pendente.")}</div>` : solicitacoes.map((aluno) => `
                    <article class="rounded-[24px] border border-white/10 bg-black/25 p-5">
                        <h4 class="font-display text-xl font-semibold text-white">${escaparHtml(aluno.nome)}</h4>
                        <p class="mt-1 text-sm text-stone-400">${escaparHtml(aluno.email)}</p>
                        <p class="mt-3 text-sm text-stone-300">Objetivo: ${escaparHtml(aluno.objetivoTreino || "Nao informado")}</p>
                        <div class="mt-5 flex gap-3">
                            <button type="button" data-acao="aprovar-aluno" data-aluno-id="${escaparHtml(aluno.id)}" class="${classes.botaoPrimario} flex-1 px-4 py-2">Aprovar</button>
                            <button type="button" data-acao="recusar-aluno" data-aluno-id="${escaparHtml(aluno.id)}" class="${classes.botaoPerigo} flex-1">Recusar</button>
                        </div>
                    </article>
                `).join("")}
            </div>
        </section>
    `;
}

function renderCarteiraAlunos(alunos) {
    return `
        <section class="soft-rise ${classes.painel}">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <p class="${classes.badge} w-fit">Carteira</p>
                    <h3 class="mt-4 font-display text-2xl font-semibold text-white">Alunos vinculados</h3>
                </div>
                <span class="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-stone-300">${alunos.length}</span>
            </div>
            <div class="mt-6 space-y-3">
                ${alunos.length === 0 ? renderVazio("Aprove uma solicitacao para adicionar o primeiro aluno.") : alunos.map((aluno) => `
                    <button type="button" data-acao="selecionar-aluno" data-aluno-id="${escaparHtml(aluno.id)}" class="w-full rounded-[24px] border px-5 py-4 text-left transition ${
                        aluno.id === estado.personal.alunoSelecionadoId
                            ? "border-ember-400/40 bg-ember-500/10"
                            : "border-white/10 bg-black/25 hover:border-ember-400/30"
                    }">
                        <div class="flex items-center justify-between gap-4">
                            <div>
                                <p class="font-display text-lg font-semibold text-white">${escaparHtml(aluno.nome)}</p>
                                <p class="mt-1 text-sm text-stone-400">${escaparHtml(aluno.email)}</p>
                            </div>
                            <div class="text-right text-sm text-stone-300">
                                <p>${escaparHtml(aluno.objetivoTreino || "Sem objetivo")}</p>
                                <p class="mt-1 text-ember-200">${pluralizar(aluno.totalFichas, "ficha", "fichas")}</p>
                            </div>
                        </div>
                    </button>
                `).join("")}
            </div>
        </section>
    `;
}

function renderDetalheAluno(alunoAtual, fichasAtual, registrosAtuais) {
    if (!alunoAtual) {
        return `<section class="soft-rise ${classes.painel}">${renderVazio("Selecione um aluno para consultar suas fichas.")}</section>`;
    }

    const fichasDisponiveis = fichasAtual.filter((ficha) => ficha.status !== "arquivada");
    const idsFichas = new Set(fichasDisponiveis.map((ficha) => ficha.id));
    const registrosSemFicha = registrosAtuais.filter((registro) => !idsFichas.has(registro.fichaId));

    return `
        <section class="soft-rise ${classes.painel}">
            <p class="${classes.badge} w-fit">Aluno selecionado</p>
            <h3 class="mt-4 font-display text-2xl font-semibold text-white">${escaparHtml(alunoAtual.nome)}</h3>
            <p class="mt-2 text-sm text-stone-400">${escaparHtml(alunoAtual.email)} | ${escaparHtml(alunoAtual.objetivoTreino || "Sem objetivo")}</p>
            <div class="mt-6 space-y-4">
                ${fichasDisponiveis.length === 0 ? renderVazio("Esse aluno ainda nao possui uma ficha.") : fichasDisponiveis.map((ficha) => renderCardFicha(
                    ficha,
                    false,
                    registrosAtuais.filter((registro) => registro.fichaId === ficha.id),
                    true
                )).join("")}
                ${renderHistoricoFichasRemovidas(registrosSemFicha)}
            </div>
        </section>
    `;
}

function renderFormularioNovaFicha(alunos, alunoAtual) {
    const formulario = estado.formularios.novaFicha;
    const editando = Boolean(estado.personal.fichaEditandoId);

    if (alunos.length === 0) {
        return `<section class="soft-rise ${classes.painel}"><p class="${classes.badge} w-fit">Ficha de treino</p><h3 class="mt-4 font-display text-2xl font-semibold text-white">Montar nova ficha</h3><div class="mt-6">${renderVazio("A ficha podera ser criada depois que um aluno for aprovado.")}</div></section>`;
    }

    return `
        <section class="soft-rise ${classes.painel}">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p class="${classes.badge} w-fit">${editando ? "Editar ficha" : "Nova ficha"}</p>
                    <h3 class="mt-4 font-display text-2xl font-semibold text-white">${editando ? "Atualizar treino" : "Montar treino semanal"}</h3>
                </div>
                ${editando ? `<button type="button" data-acao="cancelar-edicao-ficha-personal" class="${classes.botaoSecundario}">Cancelar edicao</button>` : ""}
            </div>
            <form data-form-submit="nova-ficha" class="mt-6 space-y-5">
                <label class="block">
                    <span class="mb-2 block text-sm font-medium text-stone-300">Aluno</span>
                    <select data-controle="aluno-selecionado" class="${classes.campo}">
                        ${alunos.map((aluno) => `<option value="${escaparHtml(aluno.id)}" ${aluno.id === estado.personal.alunoSelecionadoId ? "selected" : ""}>${escaparHtml(aluno.nome)}</option>`).join("")}
                    </select>
                </label>
                <div class="grid gap-4 sm:grid-cols-2">
                    <label class="block">
                        <span class="mb-2 block text-sm font-medium text-stone-300">Nome da ficha</span>
                        <input data-formulario="novaFicha" name="nomeFicha" type="text" class="${classes.campo}" placeholder="Ex.: Treino A" value="${escaparHtml(formulario.nomeFicha)}">
                    </label>
                    <label class="block">
                        <span class="mb-2 block text-sm font-medium text-stone-300">Dia da semana</span>
                        <select data-formulario="novaFicha" name="diaSemana" class="${classes.campo}">
                            ${["Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado", "Domingo"].map((dia) => `<option value="${dia}" ${formulario.diaSemana === dia ? "selected" : ""}>${dia}</option>`).join("")}
                        </select>
                    </label>
                </div>
                <label class="block">
                    <span class="mb-2 block text-sm font-medium text-stone-300">Objetivo da ficha</span>
                    <input data-formulario="novaFicha" name="objetivo" type="text" class="${classes.campo}" placeholder="Ex.: Peito e triceps" value="${escaparHtml(formulario.objetivo)}">
                </label>
                <label class="block">
                    <span class="mb-2 block text-sm font-medium text-stone-300">Observacoes gerais</span>
                    <input data-formulario="novaFicha" name="observacoes" type="text" class="${classes.campo}" placeholder="Orientacoes para o aluno" value="${escaparHtml(formulario.observacoes)}">
                </label>

                <div class="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <p class="font-semibold text-white">Exercicios</p>
                            <p class="text-sm text-stone-400">${escaparHtml(alunoAtual?.nome || "Aluno selecionado")}</p>
                        </div>
                        <button type="button" data-acao="adicionar-exercicio" class="${classes.botaoSecundario} px-4 py-2">Adicionar</button>
                    </div>
                    ${estado.personal.exercicios.map(renderLinhaExercicio).join("")}
                </div>
                <button type="submit" class="${classes.botaoPrimario} w-full">${estado.processando === "nova-ficha" ? "Salvando..." : editando ? "Salvar alteracoes" : "Criar ficha"}</button>
            </form>
        </section>
    `;
}

function renderLinhaExercicio(exercicio, indice) {
    const campo = (nome, rotulo, placeholder, tipo = "text") => `
        <label class="block">
            <span class="mb-2 block text-sm font-medium text-stone-300">${rotulo}</span>
            <input data-indice="${indice}" data-exercicio-campo="${nome}" type="${tipo}" class="${classes.campo}" placeholder="${placeholder}" value="${escaparHtml(exercicio[nome])}">
        </label>
    `;

    return `
        <article class="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <div class="mb-4 flex items-center justify-between">
                <p class="font-semibold text-white">Exercicio ${indice + 1}</p>
                <button type="button" data-acao="remover-exercicio" data-indice="${indice}" class="${classes.botaoSecundario} px-4 py-2">Remover</button>
            </div>
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                ${campo("nome", "Nome", "Supino inclinado")}
                ${campo("grupoMuscular", "Grupo muscular", "Peito")}
                ${campo("carga", "Carga", "24 kg")}
                ${campo("series", "Series", "3", "number")}
                ${campo("repeticoes", "Repeticoes", "12", "number")}
                ${campo("descanso", "Descanso", "60s")}
                <label class="block sm:col-span-2 xl:col-span-3">
                    <span class="mb-2 block text-sm font-medium text-stone-300">Observacoes</span>
                    <input data-indice="${indice}" data-exercicio-campo="observacoes" type="text" class="${classes.campo}" placeholder="Orientacao especifica" value="${escaparHtml(exercicio.observacoes)}">
                </label>
            </div>
        </article>
    `;
}

function renderPainelAluno() {
    const painel = estado.aluno.painel;
    const fichas = estado.aluno.fichas;
    const fichasAtivas = fichas.filter((ficha) => ficha.status !== "arquivada");
    const registros = estado.aluno.registros;
    const idsFichasAtivas = new Set(fichasAtivas.map((ficha) => ficha.id));
    const registrosSemFicha = registros.filter((registro) => !idsFichasAtivas.has(registro.fichaId));

    return `
        <section class="space-y-6 pb-10">
            <div class="soft-rise ${classes.painel} p-7 lg:p-8">
                <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p class="${classes.badge} w-fit">Painel do aluno</p>
                        <h2 class="mt-5 font-display text-4xl font-semibold text-white">Ola, ${escaparHtml(painel?.aluno.nome || estado.usuario.nome)}.</h2>
                        <p class="mt-3 text-sm text-stone-400">Monte sua rotina ou ajuste as fichas recebidas para manter o diario atualizado.</p>
                    </div>
                    <button type="button" data-acao="recarregar" class="${classes.botaoSecundario}">Atualizar fichas</button>
                </div>
                <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    ${renderMetrica("Fichas", String(painel?.resumo.totalFichas || 0), "Treinos disponiveis")}
                    ${renderMetrica("Treinos registrados", String(painel?.resumo.totalRegistros || 0), "Historico de execucoes")}
                    ${renderMetrica("Proximo treino", String(painel?.resumo.proximoTreino || "Livre"), "Dia indicado na primeira ficha")}
                    ${renderMetrica("Objetivo", String(painel?.aluno.objetivoTreino || "Nao informado"), "Foco atual")}
                </div>
            </div>

            <div class="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
                ${renderAcompanhamentoAluno(painel)}
                <section class="soft-rise ${classes.painel}">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <p class="${classes.badge} w-fit">Treinos</p>
                            <h3 class="mt-4 font-display text-2xl font-semibold text-white">Minhas fichas</h3>
                        </div>
                        <span class="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-stone-300">${fichasAtivas.length}</span>
                    </div>
                    <div class="mt-6 space-y-4">
                        ${fichasAtivas.length === 0 ? renderVazio("Nenhuma ficha disponivel no momento.") : fichasAtivas.map((ficha) => renderCardFicha(
                            ficha,
                            true,
                            registros.filter((registro) => registro.fichaId === ficha.id)
                        )).join("")}
                        ${renderHistoricoFichasRemovidas(registrosSemFicha)}
                    </div>
                </section>
            </div>

            ${renderFormularioFichaAluno(painel, fichasAtivas)}
        </section>
    `;
}

function renderFormularioFichaAluno(painel, fichas) {
    const acompanhado = painel?.aluno.statusVinculo === "ativo";
    const fichaSelecionada = fichas.find((ficha) => (
        ficha.id === estado.aluno.fichaSelecionadaId
    ));
    const editando = Boolean(fichaSelecionada);

    const formulario = estado.formularios.fichaAluno;
    const origemPersonal = fichaSelecionada?.origem === "personal";

    return `
        <section id="editor-ficha-aluno" class="soft-rise ${classes.painel}">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p class="${classes.badge} w-fit">Editor de ficha</p>
                    <h3 class="mt-4 font-display text-2xl font-semibold text-white">${editando ? "Editar ficha" : "Montar minha ficha"}</h3>
                    <p class="mt-3 text-sm leading-6 text-stone-400">${
                        origemPersonal
                            ? "Esta ficha foi montada pelo personal e esta disponivel para seus ajustes."
                            : editando
                                ? "Atualize exercicios, series, repeticoes e carga conforme sua rotina."
                                : acompanhado
                                    ? "Crie uma ficha complementar adaptada as suas necessidades."
                                    : "Crie sua propria rotina de treino."
                    }</p>
                </div>
                ${editando ? `<button type="button" data-acao="nova-ficha-aluno" class="${classes.botaoSecundario}">Nova ficha</button>` : ""}
            </div>

            <form data-form-submit="ficha-aluno" class="mt-6 space-y-5">
                ${fichas.length > 0 && editando ? `
                    <label class="block">
                        <span class="mb-2 block text-sm font-medium text-stone-300">Ficha selecionada</span>
                        <select data-controle="ficha-aluno-selecionada" class="${classes.campo}">
                            ${fichas.map((ficha) => `<option value="${escaparHtml(ficha.id)}" ${ficha.id === estado.aluno.fichaSelecionadaId ? "selected" : ""}>${escaparHtml(ficha.nomeFicha)} - ${escaparHtml(ficha.diaSemana)}</option>`).join("")}
                        </select>
                    </label>
                ` : ""}

                <div class="grid gap-4 sm:grid-cols-2">
                    <label class="block">
                        <span class="mb-2 block text-sm font-medium text-stone-300">Nome da ficha</span>
                        <input data-formulario="fichaAluno" name="nomeFicha" type="text" class="${classes.campo}" placeholder="Ex.: Treino A" value="${escaparHtml(formulario.nomeFicha)}">
                    </label>
                    <label class="block">
                        <span class="mb-2 block text-sm font-medium text-stone-300">Dia da semana</span>
                        <select data-formulario="fichaAluno" name="diaSemana" class="${classes.campo}">
                            ${["Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado", "Domingo"].map((dia) => `<option value="${dia}" ${formulario.diaSemana === dia ? "selected" : ""}>${dia}</option>`).join("")}
                        </select>
                    </label>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                    <label class="block">
                        <span class="mb-2 block text-sm font-medium text-stone-300">Objetivo</span>
                        <input data-formulario="fichaAluno" name="objetivo" type="text" class="${classes.campo}" placeholder="Ex.: Peito e triceps" value="${escaparHtml(formulario.objetivo)}">
                    </label>
                    <label class="block">
                        <span class="mb-2 block text-sm font-medium text-stone-300">Observacoes</span>
                        <input data-formulario="fichaAluno" name="observacoes" type="text" class="${classes.campo}" placeholder="Lembretes para o treino" value="${escaparHtml(formulario.observacoes)}">
                    </label>
                </div>

                <div class="space-y-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <p class="font-semibold text-white">Exercicios</p>
                            <p class="text-sm text-stone-400">Edite os detalhes da sua ficha</p>
                        </div>
                        <button type="button" data-acao="adicionar-exercicio-aluno" class="${classes.botaoSecundario} px-4 py-2">Adicionar</button>
                    </div>
                    ${estado.aluno.exerciciosFicha.map(renderLinhaExercicioAluno).join("")}
                </div>

                <button type="submit" class="${classes.botaoPrimario} w-full">
                    ${estado.processando === "ficha-aluno" ? "Salvando..." : editando ? "Salvar alteracoes" : "Criar ficha"}
                </button>
            </form>
        </section>
    `;
}

function renderLinhaExercicioAluno(exercicio, indice) {
    const campo = (nome, rotulo, placeholder, tipo = "text") => `
        <label class="block">
            <span class="mb-2 block text-sm font-medium text-stone-300">${rotulo}</span>
            <input data-indice="${indice}" data-ficha-aluno-campo="${nome}" type="${tipo}" class="${classes.campo}" placeholder="${placeholder}" value="${escaparHtml(exercicio[nome])}">
        </label>
    `;

    return `
        <article class="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <div class="mb-4 flex items-center justify-between gap-3">
                <p class="font-semibold text-white">Exercicio ${indice + 1}</p>
                <button type="button" data-acao="remover-exercicio-aluno" data-indice="${indice}" class="${classes.botaoSecundario} px-4 py-2">Remover</button>
            </div>
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                ${campo("nome", "Nome", "Supino inclinado")}
                ${campo("grupoMuscular", "Grupo muscular", "Peito")}
                ${campo("carga", "Carga", "24 kg")}
                ${campo("series", "Series", "3", "number")}
                ${campo("repeticoes", "Repeticoes", "12", "number")}
                ${campo("descanso", "Descanso", "60s")}
                <label class="block sm:col-span-2 xl:col-span-3">
                    <span class="mb-2 block text-sm font-medium text-stone-300">Observacoes</span>
                    <input data-indice="${indice}" data-ficha-aluno-campo="observacoes" type="text" class="${classes.campo}" placeholder="Tecnica ou lembrete" value="${escaparHtml(exercicio.observacoes)}">
                </label>
            </div>
        </article>
    `;
}

function renderAcompanhamentoAluno(painel) {
    const status = painel?.aluno.statusVinculo || "sem_vinculo";

    if (status === "ativo") {
        return `
            <section class="soft-rise ${classes.painel}">
                <p class="${classes.badge} w-fit">Acompanhamento</p>
                <h3 class="mt-4 font-display text-2xl font-semibold text-white">Personal responsavel</h3>
                <div class="mt-6 rounded-[24px] border border-ember-400/20 bg-ember-500/10 p-5">
                    <p class="font-display text-xl font-semibold text-white">${escaparHtml(painel.personal.nome)}</p>
                    <p class="mt-2 text-sm text-stone-300">${escaparHtml(painel.personal.email)}</p>
                    <p class="mt-4 text-sm font-semibold text-ember-200">Vinculo aprovado</p>
                    <button type="button" data-acao="encerrar-vinculo" class="${classes.botaoSecundario} mt-5 w-full">Encerrar acompanhamento</button>
                </div>
            </section>
        `;
    }

    if (status === "pendente") {
        return `
            <section class="soft-rise ${classes.painel}">
                <p class="${classes.badge} w-fit">Acompanhamento</p>
                <h3 class="mt-4 font-display text-2xl font-semibold text-white">Aguardando aprovacao</h3>
                <div class="mt-6 rounded-[24px] border border-amber-400/20 bg-amber-500/10 p-5">
                    <p class="font-display text-xl font-semibold text-white">${escaparHtml(painel.personal?.nome || "Personal selecionado")}</p>
                    <p class="mt-2 text-sm leading-6 text-stone-300">Sua solicitacao foi enviada. As fichas poderao ser criadas depois da aprovacao.</p>
                    <button type="button" data-acao="encerrar-vinculo" class="${classes.botaoSecundario} mt-5 w-full">Cancelar solicitacao</button>
                </div>
            </section>
        `;
    }

    const formulario = estado.formularios.vinculo;

    return `
        <section class="soft-rise ${classes.painel}">
            <p class="${classes.badge} w-fit">Acompanhamento</p>
            <h3 class="mt-4 font-display text-2xl font-semibold text-white">Vincular um personal</h3>
            <p class="mt-3 text-sm leading-6 text-stone-400">Digite o codigo recebido do personal para enviar a solicitacao.</p>
            <form data-form-submit="vinculo" class="mt-6 space-y-4">
                <label class="block">
                    <span class="mb-2 block text-sm font-medium text-stone-300">Codigo do personal</span>
                    <input data-formulario="vinculo" name="codigoPersonal" type="text" class="${classes.campo} uppercase" placeholder="IP-12AB34" value="${escaparHtml(formulario.codigoPersonal)}">
                </label>
                <button type="submit" class="${classes.botaoPrimario} w-full">${estado.processando === "vinculo" ? "Enviando..." : "Solicitar vinculo"}</button>
            </form>
        </section>
    `;
}

function renderCardFicha(ficha, modoAluno, registrosFicha = [], modoPersonal = false) {
    const criadaPeloPersonalAtual = modoPersonal && ficha.personalId === estado.usuario?.id;
    const registrandoTreino = modoAluno
        && estado.aluno.fichaRegistroId === ficha.id;

    return `
        <article class="rounded-[26px] border border-white/10 bg-black/25 p-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p class="text-xs uppercase tracking-[0.2em] text-stone-500">${escaparHtml(ficha.diaSemana || "Sem dia")}</p>
                    <h4 class="mt-2 font-display text-2xl font-semibold text-white">${escaparHtml(ficha.nomeFicha)}</h4>
                    <p class="mt-2 text-sm text-stone-400">${escaparHtml(ficha.objetivo || "Sem objetivo detalhado")}</p>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${modoAluno ? `<span class="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-stone-300">${ficha.origem === "personal" ? "Criada pelo personal" : "Criada por voce"}</span>` : ""}
                    ${modoPersonal && !criadaPeloPersonalAtual ? `<span class="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-stone-300">Criada pelo aluno</span>` : ""}
                    <span class="rounded-full border ${modoAluno ? "border-ember-400/20 bg-ember-500/10 text-ember-100" : "border-white/10 text-stone-300"} px-4 py-2 text-sm">${pluralizar(ficha.exercicios.length, "exercicio", "exercicios")}</span>
                </div>
            </div>
            ${ficha.observacoes ? `<p class="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-stone-300">${escaparHtml(ficha.observacoes)}</p>` : ""}
            <div class="mt-5 grid gap-3 xl:grid-cols-2">
                ${ficha.exercicios.map((exercicio) => `
                    <div class="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                        <h5 class="font-display text-lg font-semibold text-white">${escaparHtml(exercicio.nome)}</h5>
                        <p class="mt-1 text-sm text-stone-400">${escaparHtml(exercicio.grupoMuscular)}</p>
                        <div class="mt-4 flex flex-wrap gap-2 text-xs text-stone-300">
                            <span class="rounded-full border border-white/10 px-3 py-1">${escaparHtml(exercicio.series)} series</span>
                            <span class="rounded-full border border-white/10 px-3 py-1">${escaparHtml(exercicio.repeticoes)} repeticoes</span>
                            <span class="rounded-full border border-white/10 px-3 py-1">${escaparHtml(exercicio.carga || "Sem carga")}</span>
                            <span class="rounded-full border border-white/10 px-3 py-1">${escaparHtml(exercicio.descanso || "Sem descanso")}</span>
                        </div>
                        ${exercicio.observacoes ? `<p class="mt-4 text-sm text-stone-400">${escaparHtml(exercicio.observacoes)}</p>` : ""}
                    </div>
                `).join("")}
            </div>
            ${modoAluno ? `
                <div class="mt-5 grid gap-3 sm:grid-cols-3">
                    <button type="button" data-acao="editar-ficha-aluno" data-ficha-id="${escaparHtml(ficha.id)}" class="${classes.botaoSecundario}">Editar ficha</button>
                    <button type="button" data-acao="registrar-ficha-aluno" data-ficha-id="${escaparHtml(ficha.id)}" class="${classes.botaoPrimario}">Registrar treino</button>
                    <button type="button" data-acao="remover-ficha-aluno" data-ficha-id="${escaparHtml(ficha.id)}" class="${classes.botaoPerigo}">Excluir ficha</button>
                </div>
            ` : ""}
            ${criadaPeloPersonalAtual ? `
                <div class="mt-5 grid gap-3 sm:grid-cols-2">
                    <button type="button" data-acao="editar-ficha-personal" data-ficha-id="${escaparHtml(ficha.id)}" class="${classes.botaoSecundario}">Editar ficha</button>
                    <button type="button" data-acao="remover-ficha-personal" data-ficha-id="${escaparHtml(ficha.id)}" class="${classes.botaoPerigo}">Excluir ficha</button>
                </div>
            ` : ""}
            ${registrandoTreino ? renderFormularioRegistroTreino(ficha) : ""}
            ${renderEvolucaoFicha(registrosFicha)}
        </article>
    `;
}

function renderFormularioRegistroTreino(ficha) {
    const formulario = estado.formularios.registroTreino;

    return `
        <form data-form-submit="registro-treino" class="mt-5 space-y-4 rounded-[24px] border border-ember-400/20 bg-ember-500/[0.06] p-4">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="text-xs uppercase tracking-[0.2em] text-ember-200">Novo registro</p>
                    <h5 class="mt-2 font-display text-xl font-semibold text-white">${escaparHtml(ficha.nomeFicha)}</h5>
                </div>
                <button type="button" data-acao="cancelar-registro-treino" class="${classes.botaoSecundario} px-4 py-2">Cancelar</button>
            </div>

            <label class="block">
                <span class="mb-2 block text-sm font-medium text-stone-300">Data do treino</span>
                <input data-formulario="registroTreino" name="dataTreino" type="date" class="${classes.campo}" value="${escaparHtml(formulario.dataTreino)}">
            </label>

            <div class="space-y-3">
                ${estado.aluno.exerciciosRegistro.map(renderLinhaRegistroExercicio).join("")}
            </div>

            <label class="block">
                <span class="mb-2 block text-sm font-medium text-stone-300">Observacoes</span>
                <textarea data-formulario="registroTreino" name="observacoes" rows="2" class="${classes.campo}" placeholder="Como foi o treino?">${escaparHtml(formulario.observacoes)}</textarea>
            </label>

            <button type="submit" class="${classes.botaoPrimario} w-full">
                ${estado.processando === "registro-treino" ? "Salvando..." : "Salvar no historico"}
            </button>
        </form>
    `;
}

function renderLinhaRegistroExercicio(exercicio, indice) {
    return `
        <div class="rounded-[20px] border border-white/10 bg-black/20 p-4">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <p class="font-semibold text-white">${escaparHtml(exercicio.nome)}</p>
                <p class="text-xs text-stone-400">Planejado: ${escaparHtml(exercicio.seriesPlanejadas)} x ${escaparHtml(exercicio.repeticoesPlanejadas)} | ${escaparHtml(exercicio.cargaPlanejada || "sem carga")}</p>
            </div>
            <div class="mt-3 grid gap-3 sm:grid-cols-3">
                <label class="block">
                    <span class="mb-2 block text-xs text-stone-400">Series realizadas</span>
                    <input data-indice="${indice}" data-registro-campo="seriesConcluidas" type="number" min="0" class="${classes.campo}" value="${escaparHtml(exercicio.seriesConcluidas)}">
                </label>
                <label class="block">
                    <span class="mb-2 block text-xs text-stone-400">Repeticoes</span>
                    <input data-indice="${indice}" data-registro-campo="repeticoesRealizadas" type="text" class="${classes.campo}" placeholder="12 ou 12/10/8" value="${escaparHtml(exercicio.repeticoesRealizadas)}">
                </label>
                <label class="block">
                    <span class="mb-2 block text-xs text-stone-400">Carga utilizada</span>
                    <input data-indice="${indice}" data-registro-campo="cargaUtilizada" type="text" class="${classes.campo}" placeholder="Ex.: 28 kg" value="${escaparHtml(exercicio.cargaUtilizada)}">
                </label>
            </div>
        </div>
    `;
}

function renderEvolucaoFicha(registrosFicha) {
    return `
        <section class="mt-5 border-t border-white/10 pt-5">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <p class="text-xs uppercase tracking-[0.2em] text-stone-500">Evolucao</p>
                    <h5 class="mt-1 font-display text-lg font-semibold text-white">Historico do exercicio</h5>
                </div>
                <span class="rounded-full border border-white/10 px-3 py-1 text-xs text-stone-300">${pluralizar(registrosFicha.length, "treino", "treinos")}</span>
            </div>
            <div class="mt-4 space-y-3">
                ${registrosFicha.length === 0 ? `
                    <p class="rounded-[18px] border border-dashed border-white/10 px-4 py-4 text-sm text-stone-500">Nenhum treino registrado nesta ficha.</p>
                ` : registrosFicha.map((registro) => `
                    <article class="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                        <div class="flex items-center justify-between gap-3">
                            <p class="font-semibold text-white">${escaparHtml(formatarData(registro.dataTreino))}</p>
                            <span class="text-xs text-emerald-200">Concluido</span>
                        </div>
                        <div class="mt-3 space-y-2">
                            ${registro.exercicios.map((exercicio) => `
                                <div class="rounded-2xl bg-black/20 px-3 py-2">
                                    <p class="text-sm font-semibold text-stone-200">${escaparHtml(exercicio.nome)}</p>
                                    <p class="mt-1 text-xs text-stone-500">Planejado: ${escaparHtml(exercicio.seriesPlanejadas)} x ${escaparHtml(exercicio.repeticoesPlanejadas)} | ${escaparHtml(exercicio.cargaPlanejada || "sem carga")}</p>
                                    <p class="mt-1 text-sm text-ember-100">Realizado: ${escaparHtml(exercicio.seriesConcluidas)} x ${escaparHtml(exercicio.repeticoesRealizadas)} | ${escaparHtml(exercicio.cargaUtilizada || "sem carga")}</p>
                                </div>
                            `).join("")}
                        </div>
                        ${registro.observacoes ? `<p class="mt-3 text-sm text-stone-400">${escaparHtml(registro.observacoes)}</p>` : ""}
                    </article>
                `).join("")}
            </div>
        </section>
    `;
}

function renderHistoricoFichasRemovidas(registros) {
    if (registros.length === 0) {
        return "";
    }

    return `
        <details class="rounded-[22px] border border-white/10 bg-black/20 p-4">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-stone-200">
                <span>Historico de fichas excluidas</span>
                <span class="rounded-full border border-white/10 px-3 py-1 text-xs font-normal text-stone-400">${pluralizar(registros.length, "treino", "treinos")}</span>
            </summary>
            <div class="mt-4 space-y-3 border-t border-white/10 pt-4">
                ${registros.map((registro) => `
                    <article class="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p class="font-semibold text-white">${escaparHtml(registro.nomeFicha || "Ficha excluida")}</p>
                                <p class="mt-1 text-xs text-stone-500">${escaparHtml(formatarData(registro.dataTreino))}</p>
                            </div>
                            <span class="text-xs text-emerald-200">Concluido</span>
                        </div>
                        <div class="mt-3 space-y-2">
                            ${registro.exercicios.map((exercicio) => `
                                <div class="rounded-2xl bg-black/20 px-3 py-2">
                                    <p class="text-sm font-semibold text-stone-200">${escaparHtml(exercicio.nome)}</p>
                                    <p class="mt-1 text-sm text-ember-100">Realizado: ${escaparHtml(exercicio.seriesConcluidas)} x ${escaparHtml(exercicio.repeticoesRealizadas)} | ${escaparHtml(exercicio.cargaUtilizada || "sem carga")}</p>
                                </div>
                            `).join("")}
                        </div>
                        ${registro.observacoes ? `<p class="mt-3 text-sm text-stone-400">${escaparHtml(registro.observacoes)}</p>` : ""}
                    </article>
                `).join("")}
            </div>
        </details>
    `;
}

function renderVazio(mensagem) {
    return `<div class="rounded-[24px] border border-dashed border-white/10 bg-black/20 px-5 py-7 text-center text-sm leading-7 text-stone-400">${escaparHtml(mensagem)}</div>`;
}

iniciarAplicacao();
