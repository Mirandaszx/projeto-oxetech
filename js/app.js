const formTreino = document.getElementById("formTreino");
const nomeExercicio = document.getElementById("nomeExercicio");
const grupoMuscular = document.getElementById("grupoMuscular");
const diaTreino = document.getElementById("diaTreino");
const series = document.getElementById("series");
const repeticoes = document.getElementById("repeticoes");
const carga = document.getElementById("carga");
const descanso = document.getElementById("descanso");
const objetivo = document.getElementById("objetivo");
const equipamento = document.getElementById("equipamento");
const prioridade = document.getElementById("prioridade");
const observacao = document.getElementById("observacao");
const tituloFormulario = document.getElementById("tituloFormulario");
const modoFormulario = document.getElementById("modoFormulario");
const botaoSalvar = document.getElementById("botaoSalvar");
const cancelarEdicao = document.getElementById("cancelarEdicao");
const mensagemErro = document.getElementById("mensagemErro");
const mensagemStatus = document.getElementById("mensagemStatus");
const listaExercicios = document.getElementById("listaExercicios");
const totalExercicios = document.getElementById("totalExercicios");
const totalGrupos = document.getElementById("totalGrupos");
const volumeTotal = document.getElementById("volumeTotal");
const percentualConcluido = document.getElementById("percentualConcluido");
const statusProgresso = document.getElementById("statusProgresso");
const barraConcluido = document.getElementById("barraConcluido");
const tempoTreino = document.getElementById("tempoTreino");
const iniciarTimer = document.getElementById("iniciarTimer");
const pausarTimer = document.getElementById("pausarTimer");
const zerarTimer = document.getElementById("zerarTimer");
const filtroGrupo = document.getElementById("filtroGrupo");
const buscaExercicio = document.getElementById("buscaExercicio");
const statusLista = document.getElementById("statusLista");
const gradeSemana = document.getElementById("gradeSemana");
const limparTudo = document.getElementById("limparTudo");
const botoesModelos = document.querySelectorAll("[data-modelo]");
const listaHistorico = document.getElementById("listaHistorico");
const limparHistorico = document.getElementById("limparHistorico");

const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const nomesModelos = {
    push: "Push",
    pull: "Pull",
    legs: "Legs"
};

let indiceEdicao = null;
let intervaloTimer = null;
let timeoutMensagemStatus = null;

function normalizarExercicio(exercicio) {
    return {
        ...exercicio,
        equipamento: exercicio.equipamento || "Máquina",
        prioridade: exercicio.prioridade || "Normal",
        observacao: exercicio.observacao || "",
        carga: exercicio.carga || "Sem carga",
        series: String(exercicio.series || 3),
        repeticoes: String(exercicio.repeticoes || 12),
        concluido: Boolean(exercicio.concluido)
    };
}

const exerciciosPadrao = [
    {
        nome: "Supino reto",
        grupo: "Peito",
        dia: "Segunda",
        series: "4",
        repeticoes: "10",
        carga: "40 kg",
        descanso: "90s",
        objetivo: "Hipertrofia",
        equipamento: "Barra",
        prioridade: "Alta",
        observacao: "Focar na amplitude e no controle da descida.",
        concluido: false
    },
    {
        nome: "Agachamento livre",
        grupo: "Pernas",
        dia: "Quarta",
        series: "4",
        repeticoes: "8",
        carga: "60 kg",
        descanso: "120s",
        objetivo: "Força",
        equipamento: "Barra",
        prioridade: "Alta",
        observacao: "Aquecer antes da primeira série pesada.",
        concluido: false
    },
    {
        nome: "Remada curvada",
        grupo: "Costas",
        dia: "Sexta",
        series: "3",
        repeticoes: "12",
        carga: "35 kg",
        descanso: "60s",
        objetivo: "Hipertrofia",
        equipamento: "Barra",
        prioridade: "Normal",
        observacao: "Manter o tronco firme durante a puxada.",
        concluido: false
    }
];

let exercicios = exerciciosPadrao.map((exercicio) => normalizarExercicio(exercicio));
let segundosTreino = 0;
let historico = [];

const modelos = {
    push: [
        ["Desenvolvimento militar", "Ombros", "Segunda", "4", "10", "30 kg", "90s", "Força", "Barra", "Alta"],
        ["Supino inclinado", "Peito", "Segunda", "3", "12", "24 kg", "60s", "Hipertrofia", "Halteres", "Normal"],
        ["Tríceps corda", "Tríceps", "Segunda", "3", "12", "25 kg", "60s", "Hipertrofia", "Cabo", "Normal"]
    ],
    pull: [
        ["Puxada frontal", "Costas", "Terça", "4", "10", "45 kg", "60s", "Hipertrofia", "Máquina", "Alta"],
        ["Rosca direta", "Bíceps", "Terça", "3", "12", "20 kg", "60s", "Hipertrofia", "Barra", "Normal"],
        ["Face pull", "Ombros", "Terça", "3", "15", "15 kg", "30s", "Resistência", "Cabo", "Leve"]
    ],
    legs: [
        ["Leg press", "Pernas", "Quarta", "4", "12", "120 kg", "90s", "Hipertrofia", "Máquina", "Alta"],
        ["Cadeira extensora", "Pernas", "Quarta", "3", "12", "40 kg", "60s", "Hipertrofia", "Máquina", "Normal"],
        ["Panturrilha em pé", "Pernas", "Quarta", "4", "15", "50 kg", "45s", "Resistência", "Máquina", "Normal"]
    ]
};

function formatarTempo(segundos) {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;

    return `${String(minutos).padStart(2, "0")}:${String(segundosRestantes).padStart(2, "0")}`;
}

function atualizarTempo() {
    tempoTreino.textContent = formatarTempo(segundosTreino);
}

function criarTextoSeguro(texto) {
    return String(texto).replace(/[&<>"']/g, (caractere) => {
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

function obterTextoItens(quantidade) {
    return `${quantidade} ${quantidade === 1 ? "item" : "itens"}`;
}

function obterExerciciosFiltrados() {
    const grupoSelecionado = filtroGrupo.value;
    const busca = buscaExercicio.value.trim().toLowerCase();

    return exercicios.filter((exercicio) => {
        const passaGrupo = grupoSelecionado === "Todos" || exercicio.grupo === grupoSelecionado;
        const passaBusca = exercicio.nome.toLowerCase().includes(busca);

        return passaGrupo && passaBusca;
    });
}

function atualizarFiltroGrupo() {
    const grupoAtual = filtroGrupo.value || "Todos";
    const grupos = [...new Set(exercicios.map((exercicio) => exercicio.grupo))].sort();

    filtroGrupo.innerHTML = '<option value="Todos">Todos</option>';

    grupos.forEach((grupo) => {
        const option = document.createElement("option");
        option.value = grupo;
        option.textContent = grupo;
        filtroGrupo.appendChild(option);
    });

    filtroGrupo.value = grupos.includes(grupoAtual) ? grupoAtual : "Todos";
}

function atualizarResumo() {
    const grupos = new Set(exercicios.map((exercicio) => exercicio.grupo));
    const volume = exercicios.reduce((total, exercicio) => {
        return total + Number(exercicio.series) * Number(exercicio.repeticoes);
    }, 0);
    const concluidos = exercicios.filter((exercicio) => exercicio.concluido).length;
    const percentual = exercicios.length ? Math.round((concluidos / exercicios.length) * 100) : 0;

    totalExercicios.textContent = exercicios.length;
    totalGrupos.textContent = grupos.size;
    volumeTotal.textContent = volume;
    percentualConcluido.textContent = `${percentual}%`;
    barraConcluido.style.width = `${percentual}%`;
    statusProgresso.textContent = percentual === 100 && exercicios.length ? "Concluído" : "Em andamento";
    statusProgresso.className = percentual === 100 && exercicios.length ? "badge text-bg-success" : "badge text-bg-primary";
}

function atualizarSemana() {
    gradeSemana.innerHTML = "";

    diasSemana.forEach((dia) => {
        const exerciciosDoDia = exercicios.filter((exercicio) => exercicio.dia === dia);
        const coluna = document.createElement("article");
        coluna.className = "col-12 col-md-6 col-xl-3";

        const itens = exerciciosDoDia.length
            ? exerciciosDoDia.map((exercicio) => `<li>${criarTextoSeguro(exercicio.nome)} - ${criarTextoSeguro(exercicio.grupo)}</li>`).join("")
            : "<li>Dia livre</li>";

        coluna.innerHTML = `
            <div class="dia-card">
                <h3>${dia}</h3>
                <ul>${itens}</ul>
            </div>
        `;

        gradeSemana.appendChild(coluna);
    });
}

function atualizarLista() {
    const filtrados = obterExerciciosFiltrados();
    listaExercicios.innerHTML = "";
    statusLista.textContent = obterTextoItens(filtrados.length);

    if (filtrados.length === 0) {
        const aviso = document.createElement("p");
        aviso.className = "vazio";
        aviso.textContent = "Nenhum exercício encontrado para esse filtro.";
        listaExercicios.appendChild(aviso);
        return;
    }

    filtrados.forEach((exercicio) => {
        const indiceReal = exercicios.indexOf(exercicio);
        const card = document.createElement("article");
        card.className = `card-exercicio ${exercicio.concluido ? "concluido" : ""}`;
        card.dataset.objetivo = exercicio.objetivo;

        card.innerHTML = `
            <div class="meta-card">
                <span>${criarTextoSeguro(exercicio.dia)}</span>
                <span class="prioridade" data-prioridade="${criarTextoSeguro(exercicio.prioridade)}">${criarTextoSeguro(exercicio.prioridade)}</span>
            </div>
            <h3>${criarTextoSeguro(exercicio.nome)}</h3>
            <div class="detalhes">
                <span>${criarTextoSeguro(exercicio.grupo)}</span>
                <span>${criarTextoSeguro(exercicio.objetivo)}</span>
                <span>${criarTextoSeguro(exercicio.equipamento || "Equipamento livre")}</span>
                <span>${criarTextoSeguro(exercicio.series)} séries</span>
                <span>${criarTextoSeguro(exercicio.repeticoes)} repetições</span>
                <span>${criarTextoSeguro(exercicio.carga)}</span>
                <span>Descanso ${criarTextoSeguro(exercicio.descanso)}</span>
            </div>
            ${exercicio.observacao ? `<p class="observacao-card">${criarTextoSeguro(exercicio.observacao)}</p>` : ""}
            <div class="acoes-card">
                <button class="btn btn-outline-success btn-sm" type="button" data-acao="concluir" data-indice="${indiceReal}">
                    ${exercicio.concluido ? "Reabrir" : "Concluir"}
                </button>
                <button class="btn btn-outline-primary btn-sm" type="button" data-acao="editar" data-indice="${indiceReal}">
                    Editar
                </button>
                <button class="btn btn-outline-danger btn-sm" type="button" data-acao="remover" data-indice="${indiceReal}">
                    Remover
                </button>
            </div>
        `;

        listaExercicios.appendChild(card);
    });
}

function atualizarHistorico() {
    listaHistorico.innerHTML = "";

    if (historico.length === 0) {
        const vazio = document.createElement("p");
        vazio.className = "vazio";
        vazio.textContent = "Nenhum exercício concluído ainda.";
        listaHistorico.appendChild(vazio);
        return;
    }

    historico.slice(0, 6).forEach((item) => {
        const linha = document.createElement("article");
        linha.className = "historico-item";
        linha.innerHTML = `
            <strong>${criarTextoSeguro(item.nome)}</strong>
            <span>${criarTextoSeguro(item.grupo)} - ${criarTextoSeguro(item.data)}</span>
        `;
        listaHistorico.appendChild(linha);
    });
}

function atualizarTela() {
    atualizarFiltroGrupo();
    atualizarResumo();
    atualizarSemana();
    atualizarLista();
    atualizarHistorico();
}

function mostrarErro(texto) {
    mensagemErro.textContent = texto;
    mensagemErro.classList.remove("d-none");
}

function esconderErro() {
    mensagemErro.textContent = "";
    mensagemErro.classList.add("d-none");
}

function esconderStatus() {
    mensagemStatus.textContent = "";
    mensagemStatus.classList.add("d-none");
}

function mostrarStatus(texto) {
    clearTimeout(timeoutMensagemStatus);
    mensagemStatus.textContent = texto;
    mensagemStatus.className = "alert alert-success mensagem-status";
    timeoutMensagemStatus = setTimeout(esconderStatus, 2800);
}

function restaurarFormulario() {
    indiceEdicao = null;
    formTreino.reset();
    series.value = 3;
    repeticoes.value = 12;
    descanso.value = "60s";
    tituloFormulario.textContent = "Novo exercício";
    modoFormulario.textContent = "Cadastro";
    modoFormulario.className = "badge text-bg-primary";
    botaoSalvar.textContent = "Adicionar exercício";
    cancelarEdicao.classList.add("d-none");
    esconderErro();
}

function preencherFormulario(indice) {
    const exercicio = exercicios[indice];

    indiceEdicao = indice;
    nomeExercicio.value = exercicio.nome;
    grupoMuscular.value = exercicio.grupo;
    diaTreino.value = exercicio.dia;
    series.value = exercicio.series;
    repeticoes.value = exercicio.repeticoes;
    carga.value = exercicio.carga === "Sem carga" ? "" : exercicio.carga;
    descanso.value = exercicio.descanso;
    objetivo.value = exercicio.objetivo;
    equipamento.value = exercicio.equipamento || "Máquina";
    prioridade.value = exercicio.prioridade || "Normal";
    observacao.value = exercicio.observacao || "";
    tituloFormulario.textContent = "Editar exercício";
    modoFormulario.textContent = "Edição";
    modoFormulario.className = "badge text-bg-warning";
    botaoSalvar.textContent = "Salvar alterações";
    cancelarEdicao.classList.remove("d-none");
    nomeExercicio.focus();
}

function confirmarAcao(texto) {
    if (typeof window !== "undefined" && typeof window.confirm === "function") {
        return window.confirm(texto);
    }

    if (typeof confirm === "function") {
        return confirm(texto);
    }

    return true;
}

function removerExercicio(indice) {
    const exercicio = exercicios[indice];

    if (!confirmarAcao(`Deseja remover o exercício "${exercicio.nome}" do diário?`)) {
        return;
    }

    exercicios.splice(indice, 1);
    atualizarTela();
    mostrarStatus(`Exercício "${exercicio.nome}" removido do diário.`);
}

function alternarConclusao(indice) {
    const exercicio = exercicios[indice];

    exercicio.concluido = !exercicio.concluido;

    if (exercicio.concluido) {
        historico.unshift({
            nome: exercicio.nome,
            grupo: exercicio.grupo,
            data: new Date().toLocaleDateString("pt-BR")
        });
    }

    atualizarTela();
    mostrarStatus(
        exercicio.concluido
            ? `Exercício "${exercicio.nome}" marcado como concluído.`
            : `Exercício "${exercicio.nome}" reaberto no diário.`
    );
}

function limparDiario() {
    if (exercicios.length === 0) {
        mostrarStatus("O diário já está vazio.");
        return;
    }

    if (!confirmarAcao("Deseja limpar todos os exercícios do diário?")) {
        return;
    }

    exercicios = [];
    restaurarFormulario();
    atualizarTela();
    mostrarStatus("Diário de treino limpo com sucesso.");
}

function limparListaHistorico() {
    if (historico.length === 0) {
        mostrarStatus("O histórico já está vazio.");
        return;
    }

    if (!confirmarAcao("Deseja limpar todo o histórico de execução?")) {
        return;
    }

    historico = [];
    atualizarTela();
    mostrarStatus("Histórico de execução limpo com sucesso.");
}

function adicionarModeloRapido(chaveModelo) {
    const modelo = modelos[chaveModelo];

    modelo.forEach(([nome, grupo, dia, seriesModelo, repeticoesModelo, cargaModelo, descansoModelo, objetivoModelo, equipamentoModelo, prioridadeModelo]) => {
        exercicios.push(normalizarExercicio({
            nome,
            grupo,
            dia,
            series: seriesModelo,
            repeticoes: repeticoesModelo,
            carga: cargaModelo,
            descanso: descansoModelo,
            objetivo: objetivoModelo,
            equipamento: equipamentoModelo,
            prioridade: prioridadeModelo,
            observacao: "Inserido pelo modelo rápido.",
            concluido: false
        }));
    });

    atualizarTela();
    mostrarStatus(`Modelo ${nomesModelos[chaveModelo]} adicionado ao diário.`);
}

formTreino.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const nome = nomeExercicio.value.trim();
    const grupo = grupoMuscular.value;
    const quantidadeSeries = Number(series.value);
    const quantidadeRepeticoes = Number(repeticoes.value);
    const cargaInformada = carga.value.trim() || "Sem carga";
    const observacaoInformada = observacao.value.trim();
    const estaEditando = indiceEdicao !== null;

    if (!nome || !grupo) {
        mostrarErro("Preencha o nome do exercício e o grupo muscular.");
        return;
    }

    if (quantidadeSeries < 1 || quantidadeRepeticoes < 1) {
        mostrarErro("Séries e repetições precisam ser maiores que zero.");
        return;
    }

    const exercicio = normalizarExercicio({
        nome,
        grupo,
        dia: diaTreino.value,
        series: String(quantidadeSeries),
        repeticoes: String(quantidadeRepeticoes),
        carga: cargaInformada,
        descanso: descanso.value,
        objetivo: objetivo.value,
        equipamento: equipamento.value,
        prioridade: prioridade.value,
        observacao: observacaoInformada,
        concluido: estaEditando ? exercicios[indiceEdicao].concluido : false
    });

    if (estaEditando) {
        exercicios[indiceEdicao] = exercicio;
    } else {
        exercicios.push(exercicio);
    }

    restaurarFormulario();
    atualizarTela();
    mostrarStatus(
        estaEditando
            ? `Exercício "${exercicio.nome}" atualizado com sucesso.`
            : `Exercício "${exercicio.nome}" adicionado ao diário.`
    );
});

listaExercicios.addEventListener("click", (evento) => {
    const botao = evento.target.closest("button[data-acao]");

    if (!botao) {
        return;
    }

    const indice = Number(botao.dataset.indice);

    if (botao.dataset.acao === "remover") {
        removerExercicio(indice);
        return;
    }

    if (botao.dataset.acao === "concluir") {
        alternarConclusao(indice);
        return;
    }

    if (botao.dataset.acao === "editar") {
        preencherFormulario(indice);
    }
});

filtroGrupo.addEventListener("change", atualizarLista);
buscaExercicio.addEventListener("input", atualizarLista);
limparTudo.addEventListener("click", limparDiario);
cancelarEdicao.addEventListener("click", restaurarFormulario);
limparHistorico.addEventListener("click", limparListaHistorico);

botoesModelos.forEach((botao) => {
    botao.addEventListener("click", () => {
        adicionarModeloRapido(botao.dataset.modelo);
    });
});

iniciarTimer.addEventListener("click", () => {
    if (intervaloTimer) {
        return;
    }

    intervaloTimer = setInterval(() => {
        segundosTreino += 1;
        atualizarTempo();
    }, 1000);
});

pausarTimer.addEventListener("click", () => {
    clearInterval(intervaloTimer);
    intervaloTimer = null;
});

zerarTimer.addEventListener("click", () => {
    clearInterval(intervaloTimer);
    intervaloTimer = null;
    segundosTreino = 0;
    atualizarTempo();
    mostrarStatus("Cronômetro zerado.");
});

atualizarTela();
atualizarTempo();
