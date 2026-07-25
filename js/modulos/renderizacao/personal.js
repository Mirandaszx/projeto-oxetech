import { classes } from "../interface.js";
import {
    escaparHtml,
    filtrarRegistrosHistorico,
    normalizarTexto,
    pluralizar
} from "../utilidades.js";
import { renderMetrica, renderVazio } from "./comum.js";
import {
    renderCardFicha,
    renderFiltrosHistorico,
    renderHistoricoFichasRemovidas
} from "./treinos.js";

export function renderPainelPersonal(estado) {
    const painel = estado.personal.painel;
    const alunos = painel?.alunos || [];
    const termoBusca = normalizarTexto(estado.personal.buscaAluno);
    const alunosFiltrados = termoBusca
        ? alunos.filter((aluno) => normalizarTexto(
            `${aluno.nome} ${aluno.email} ${aluno.objetivoTreino || ""}`
        ).includes(termoBusca))
        : alunos;
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
                    ${renderCarteiraAlunos(estado, alunosFiltrados, alunos.length)}
                    ${renderDetalheAluno(estado, alunoAtual, fichasAtual, registrosAtuais)}
                </div>
                ${renderFormularioNovaFicha(estado, alunos, alunoAtual)}
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

function renderCarteiraAlunos(estado, alunos, totalAlunos) {
    const pesquisando = Boolean(estado.personal.buscaAluno);

    return `
        <section class="soft-rise ${classes.painel}">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <p class="${classes.badge} w-fit">Carteira</p>
                    <h3 class="mt-4 font-display text-2xl font-semibold text-white">Alunos vinculados</h3>
                </div>
                <span class="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-stone-300">${pesquisando ? `${alunos.length}/${totalAlunos}` : alunos.length}</span>
            </div>
            <form data-form-submit="pesquisa-alunos" class="mt-5 flex flex-col gap-3 sm:flex-row">
                <input data-formulario="pesquisaAlunos" name="termo" type="search" class="${classes.campo}" placeholder="Buscar por nome, email ou objetivo" value="${escaparHtml(estado.formularios.pesquisaAlunos.termo)}">
                <button type="submit" class="${classes.botaoPrimario} px-5 py-2">Buscar</button>
                ${pesquisando ? `<button type="button" data-acao="limpar-pesquisa-alunos" class="${classes.botaoSecundario} px-5 py-2">Limpar</button>` : ""}
            </form>
            <div class="mt-6 space-y-3">
                ${alunos.length === 0 ? renderVazio(pesquisando ? "Nenhum aluno corresponde a pesquisa." : "Aprove uma solicitacao para adicionar o primeiro aluno.") : alunos.map((aluno) => `
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

function renderDetalheAluno(estado, alunoAtual, fichasAtual, registrosAtuais) {
    if (!alunoAtual) {
        return `<section class="soft-rise ${classes.painel}">${renderVazio("Selecione um aluno para consultar suas fichas.")}</section>`;
    }

    const fichasDisponiveis = fichasAtual.filter((ficha) => ficha.status !== "arquivada");
    const idsFichas = new Set(fichasDisponiveis.map((ficha) => ficha.id));
    const registrosFiltrados = filtrarRegistrosHistorico(
        registrosAtuais,
        estado.personal.filtrosHistorico
    );
    const registrosSemFicha = registrosFiltrados.filter((registro) => (
        !idsFichas.has(registro.fichaId)
    ));

    return `
        <section class="soft-rise ${classes.painel}">
            <p class="${classes.badge} w-fit">Aluno selecionado</p>
            <h3 class="mt-4 font-display text-2xl font-semibold text-white">${escaparHtml(alunoAtual.nome)}</h3>
            <p class="mt-2 text-sm text-stone-400">${escaparHtml(alunoAtual.email)} | ${escaparHtml(alunoAtual.objetivoTreino || "Sem objetivo")}</p>
            ${renderFiltrosHistorico(estado, fichasAtual, registrosAtuais, "personal")}
            <div class="mt-6 space-y-4">
                ${fichasDisponiveis.length === 0 ? renderVazio("Esse aluno ainda nao possui uma ficha.") : fichasDisponiveis.map((ficha) => renderCardFicha(
                    estado,
                    ficha,
                    false,
                    registrosFiltrados.filter((registro) => registro.fichaId === ficha.id),
                    true
                )).join("")}
                ${renderHistoricoFichasRemovidas(registrosSemFicha)}
            </div>
        </section>
    `;
}

function renderFormularioNovaFicha(estado, alunos, alunoAtual) {
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
    const atributosQuantidade = (nome, tipo) => (
        tipo === "number"
            ? ` min="1" max="${nome === "series" ? 20 : 500}" step="1" data-quantidade-positiva`
            : ""
    );
    const campo = (nome, rotulo, placeholder, tipo = "text") => `
        <label class="block">
            <span class="mb-2 block text-sm font-medium text-stone-300">${rotulo}</span>
            <input data-indice="${indice}" data-exercicio-campo="${nome}" type="${tipo}"${atributosQuantidade(nome, tipo)} class="${classes.campo}" placeholder="${placeholder}" value="${escaparHtml(exercicio[nome])}">
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
