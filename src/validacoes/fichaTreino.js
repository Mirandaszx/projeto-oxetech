const { randomUUID } = require("crypto");

const DIAS_SEMANA = new Set([
    "Segunda",
    "Terca",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sabado",
    "Domingo"
]);

function textoPreenchido(valor) {
    return typeof valor === "string" && valor.trim().length > 0;
}

function quantidadePositiva(valor, limite) {
    const texto = String(valor ?? "").trim();

    return /^\d+$/.test(texto) && Number(texto) > 0 && Number(texto) <= limite;
}

function validarFichaTreino(dados = {}) {
    const { nomeFicha, diaSemana, objetivo, observacoes, exercicios } = dados;

    if (!textoPreenchido(nomeFicha) || !textoPreenchido(diaSemana)) {
        return "Informe o nome da ficha e o dia da semana.";
    }

    if (nomeFicha.trim().length > 80) {
        return "O nome da ficha deve ter no maximo 80 caracteres.";
    }

    if (!DIAS_SEMANA.has(diaSemana.trim())) {
        return "Informe um dia da semana valido.";
    }

    if (typeof objetivo !== "undefined" && String(objetivo).length > 120) {
        return "O objetivo deve ter no maximo 120 caracteres.";
    }

    if (typeof observacoes !== "undefined" && String(observacoes).length > 500) {
        return "As observacoes devem ter no maximo 500 caracteres.";
    }

    if (!Array.isArray(exercicios) || exercicios.length === 0) {
        return "Adicione pelo menos um exercicio na ficha.";
    }

    if (exercicios.length > 30) {
        return "Cada ficha pode ter no maximo 30 exercicios.";
    }

    const exercicioInvalido = exercicios.some((exercicio) => (
        !exercicio
        || !textoPreenchido(exercicio.nome)
        || exercicio.nome.trim().length > 100
        || !textoPreenchido(exercicio.grupoMuscular)
        || exercicio.grupoMuscular.trim().length > 60
        || !quantidadePositiva(exercicio.series, 20)
        || !quantidadePositiva(exercicio.repeticoes, 500)
        || String(exercicio.carga || "").length > 40
        || String(exercicio.descanso || "").length > 40
        || String(exercicio.observacoes || "").length > 300
    ));

    return exercicioInvalido
        ? "Revise os exercicios: nome, grupo muscular, series e repeticoes devem ser validos."
        : null;
}

function montarExercicios(exercicios) {
    return exercicios.map((exercicio) => ({
        id: randomUUID(),
        nome: exercicio.nome.trim(),
        grupoMuscular: exercicio.grupoMuscular.trim(),
        series: String(exercicio.series).trim(),
        repeticoes: String(exercicio.repeticoes).trim(),
        carga: String(exercicio.carga || "").trim(),
        descanso: String(exercicio.descanso || "").trim(),
        observacoes: String(exercicio.observacoes || "").trim()
    }));
}

module.exports = {
    validarFichaTreino,
    montarExercicios
};
