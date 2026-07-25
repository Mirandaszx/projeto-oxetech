export function criarExercicioVazio() {
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

export function escaparHtml(texto) {
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

export function pluralizar(quantidade, singular, plural) {
    return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

export function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

export function filtrarRegistrosHistorico(registros, filtros) {
    return registros.filter((registro) => (
        (!filtros.fichaId || registro.fichaId === filtros.fichaId)
        && (!filtros.dataInicio || registro.dataTreino >= filtros.dataInicio)
        && (!filtros.dataFim || registro.dataTreino <= filtros.dataFim)
    ));
}

export function nomeDoPerfil(tipoUsuario) {
    const nomes = {
        admin: "Administrador",
        personal: "Personal",
        aluno: "Aluno"
    };

    return nomes[tipoUsuario] || "Usuario";
}

export function obterIniciais(nome) {
    return String(nome || "IP")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase() || "")
        .join("");
}

export function formatarData(dataIso) {
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

export function obterDataHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}
