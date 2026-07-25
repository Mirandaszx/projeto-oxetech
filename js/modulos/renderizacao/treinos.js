import { classes } from "../interface.js";
import {
    escaparHtml,
    formatarData,
    pluralizar
} from "../utilidades.js";

export function renderCardFicha(
    estado,
    ficha,
    modoAluno,
    registrosFicha = [],
    modoPersonal = false
) {
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
            ${registrandoTreino ? renderFormularioRegistroTreino(estado, ficha) : ""}
            ${renderEvolucaoFicha(registrosFicha)}
        </article>
    `;
}

function renderFormularioRegistroTreino(estado, ficha) {
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
                    <input data-indice="${indice}" data-registro-campo="seriesConcluidas" data-quantidade-positiva type="number" min="1" max="20" step="1" class="${classes.campo}" value="${escaparHtml(exercicio.seriesConcluidas)}">
                </label>
                <label class="block">
                    <span class="mb-2 block text-xs text-stone-400">Repeticoes</span>
                    <input data-indice="${indice}" data-registro-campo="repeticoesRealizadas" data-repeticoes-positivas type="text" pattern="[1-9][0-9]*(?:[ ]*/[ ]*[1-9][0-9]*)*" class="${classes.campo}" placeholder="12 ou 12/10/8" value="${escaparHtml(exercicio.repeticoesRealizadas)}">
                </label>
                <label class="block">
                    <span class="mb-2 block text-xs text-stone-400">Carga utilizada</span>
                    <input data-indice="${indice}" data-registro-campo="cargaUtilizada" type="text" class="${classes.campo}" placeholder="Ex.: 28 kg" value="${escaparHtml(exercicio.cargaUtilizada)}">
                </label>
            </div>
        </div>
    `;
}

export function renderFiltrosHistorico(estado, fichas, registros, escopo) {
    if (registros.length === 0) {
        return "";
    }

    const filtros = estado[escopo].filtrosHistorico;
    const fichasDoHistorico = new Map();

    fichas.forEach((ficha) => fichasDoHistorico.set(ficha.id, ficha.nomeFicha));
    registros.forEach((registro) => {
        if (!fichasDoHistorico.has(registro.fichaId)) {
            fichasDoHistorico.set(
                registro.fichaId,
                registro.nomeFicha || "Ficha excluida"
            );
        }
    });

    const possuiFiltro = Boolean(
        filtros.fichaId || filtros.dataInicio || filtros.dataFim
    );

    return `
        <section class="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p class="text-xs uppercase tracking-[0.2em] text-stone-500">Historico</p>
                    <h4 class="mt-1 font-display text-lg font-semibold text-white">Filtrar treinos registrados</h4>
                </div>
                ${possuiFiltro ? `<button type="button" data-acao="limpar-filtros-historico" data-escopo="${escopo}" class="${classes.botaoSecundario} px-4 py-2">Limpar filtros</button>` : ""}
            </div>
            <div class="mt-4 grid gap-3 md:grid-cols-3">
                <label class="block">
                    <span class="mb-2 block text-xs text-stone-400">Ficha</span>
                    <select data-controle="filtro-historico" data-escopo="${escopo}" data-campo="fichaId" class="${classes.campo}">
                        <option value="">Todas as fichas</option>
                        ${Array.from(fichasDoHistorico, ([fichaId, nomeFicha]) => `
                            <option value="${escaparHtml(fichaId)}" ${filtros.fichaId === fichaId ? "selected" : ""}>${escaparHtml(nomeFicha)}</option>
                        `).join("")}
                    </select>
                </label>
                <label class="block">
                    <span class="mb-2 block text-xs text-stone-400">Data inicial</span>
                    <input data-controle="filtro-historico" data-escopo="${escopo}" data-campo="dataInicio" type="date" class="${classes.campo}" value="${escaparHtml(filtros.dataInicio)}">
                </label>
                <label class="block">
                    <span class="mb-2 block text-xs text-stone-400">Data final</span>
                    <input data-controle="filtro-historico" data-escopo="${escopo}" data-campo="dataFim" type="date" class="${classes.campo}" value="${escaparHtml(filtros.dataFim)}">
                </label>
            </div>
        </section>
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

export function renderHistoricoFichasRemovidas(registros) {
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
