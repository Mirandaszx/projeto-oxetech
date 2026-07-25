import { classes } from "../interface.js";
import {
    escaparHtml,
    filtrarRegistrosHistorico
} from "../utilidades.js";
import { renderMetrica, renderVazio } from "./comum.js";
import {
    renderCardFicha,
    renderFiltrosHistorico,
    renderHistoricoFichasRemovidas
} from "./treinos.js";

export function renderPainelAluno(estado) {
    const painel = estado.aluno.painel;
    const fichas = estado.aluno.fichas;
    const fichasAtivas = fichas.filter((ficha) => ficha.status !== "arquivada");
    const registros = estado.aluno.registros;
    const registrosFiltrados = filtrarRegistrosHistorico(
        registros,
        estado.aluno.filtrosHistorico
    );
    const idsFichasAtivas = new Set(fichasAtivas.map((ficha) => ficha.id));
    const registrosSemFicha = registrosFiltrados.filter((registro) => (
        !idsFichasAtivas.has(registro.fichaId)
    ));

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
                ${renderAcompanhamentoAluno(estado, painel)}
                <section class="soft-rise ${classes.painel}">
                    <div class="flex items-center justify-between gap-3">
                        <div>
                            <p class="${classes.badge} w-fit">Treinos</p>
                            <h3 class="mt-4 font-display text-2xl font-semibold text-white">Minhas fichas</h3>
                        </div>
                        <span class="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-stone-300">${fichasAtivas.length}</span>
                    </div>
                    ${renderFiltrosHistorico(estado, fichas, registros, "aluno")}
                    <div class="mt-6 space-y-4">
                        ${fichasAtivas.length === 0 ? renderVazio("Nenhuma ficha disponivel no momento.") : fichasAtivas.map((ficha) => renderCardFicha(
                            estado,
                            ficha,
                            true,
                            registrosFiltrados.filter((registro) => registro.fichaId === ficha.id)
                        )).join("")}
                        ${renderHistoricoFichasRemovidas(registrosSemFicha)}
                    </div>
                </section>
            </div>

            ${renderFormularioFichaAluno(estado, painel, fichasAtivas)}
        </section>
    `;
}

function renderFormularioFichaAluno(estado, painel, fichas) {
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
    const atributosQuantidade = (nome, tipo) => (
        tipo === "number"
            ? ` min="1" max="${nome === "series" ? 20 : 500}" step="1" data-quantidade-positiva`
            : ""
    );
    const campo = (nome, rotulo, placeholder, tipo = "text") => `
        <label class="block">
            <span class="mb-2 block text-sm font-medium text-stone-300">${rotulo}</span>
            <input data-indice="${indice}" data-ficha-aluno-campo="${nome}" type="${tipo}"${atributosQuantidade(nome, tipo)} class="${classes.campo}" placeholder="${placeholder}" value="${escaparHtml(exercicio[nome])}">
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

function renderAcompanhamentoAluno(estado, painel) {
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
