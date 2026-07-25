import { criarExercicioVazio, obterDataHoje } from "./utilidades.js";

const CHAVE_TOKEN = "iron_pump_token";
const CHAVE_USUARIO = "iron_pump_usuario";

function lerItemJson(chave, valorPadrao) {
    try {
        const conteudo = localStorage.getItem(chave);
        return conteudo ? JSON.parse(conteudo) : valorPadrao;
    } catch (_erro) {
        return valorPadrao;
    }
}

// Estado central compartilhado pelos formularios e pelas telas dos tres perfis.
export const estado = {
    token: localStorage.getItem(CHAVE_TOKEN) || "",
    usuario: lerItemJson(CHAVE_USUARIO, null),
    carregandoInicial: true,
    carregandoPainel: false,
    processando: "",
    abaAutenticacao: "login",
    perfilAberto: false,
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
        perfil: {
            nome: "",
            email: "",
            objetivoTreino: "",
            senha: "",
            confirmacaoSenha: ""
        },
        pesquisaAlunos: {
            termo: ""
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
        painel: null,
        personalEditandoId: ""
    },
    personal: {
        painel: null,
        detalheAluno: null,
        alunoSelecionadoId: "",
        buscaAluno: "",
        filtrosHistorico: {
            fichaId: "",
            dataInicio: "",
            dataFim: ""
        },
        fichaEditandoId: "",
        exercicios: [criarExercicioVazio()]
    },
    aluno: {
        painel: null,
        fichas: [],
        registros: [],
        filtrosHistorico: {
            fichaId: "",
            dataInicio: "",
            dataFim: ""
        },
        fichaSelecionadaId: "",
        exerciciosFicha: [criarExercicioVazio()],
        fichaRegistroId: "",
        exerciciosRegistro: []
    }
};

export function salvarSessao(token, usuario) {
    estado.token = token;
    estado.usuario = usuario;
    localStorage.setItem(CHAVE_TOKEN, token);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

export function limparSessao() {
    estado.token = "";
    estado.usuario = null;
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
}

export function redefinirFormulario(nomeFormulario) {
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
        perfil: {
            nome: "",
            email: "",
            objetivoTreino: "",
            senha: "",
            confirmacaoSenha: ""
        },
        pesquisaAlunos: {
            termo: ""
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

    if (nomeFormulario === "novoPersonal") {
        estado.admin.personalEditandoId = "";
    }
}

export function limparEstadoPrivado() {
    estado.perfilAberto = false;
    estado.admin = {
        painel: null,
        personalEditandoId: ""
    };
    estado.personal = {
        painel: null,
        detalheAluno: null,
        alunoSelecionadoId: "",
        buscaAluno: "",
        filtrosHistorico: {
            fichaId: "",
            dataInicio: "",
            dataFim: ""
        },
        fichaEditandoId: "",
        exercicios: [criarExercicioVazio()]
    };
    estado.aluno = {
        painel: null,
        fichas: [],
        registros: [],
        filtrosHistorico: {
            fichaId: "",
            dataInicio: "",
            dataFim: ""
        },
        fichaSelecionadaId: "",
        exerciciosFicha: [criarExercicioVazio()],
        fichaRegistroId: "",
        exerciciosRegistro: []
    };
    redefinirFormulario("novoPersonal");
    redefinirFormulario("perfil");
    redefinirFormulario("pesquisaAlunos");
    redefinirFormulario("vinculo");
    redefinirFormulario("novaFicha");
    redefinirFormulario("fichaAluno");
    redefinirFormulario("registroTreino");
}
