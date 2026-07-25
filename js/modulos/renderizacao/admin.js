import { classes } from "../interface.js";
import {
    escaparHtml,
    formatarData,
    pluralizar
} from "../utilidades.js";
import { renderMetrica, renderVazio } from "./comum.js";

export function renderPainelAdmin(estado) {
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
                    ${renderMetrica("Personais ativos", String(painel?.resumo.totalPersonaisAtivos || 0), `${pluralizar(painel?.resumo.totalPersonais || 0, "conta cadastrada", "contas cadastradas")}`)}
                    ${renderMetrica("Alunos", String(painel?.resumo.totalAlunos || 0), "Alunos cadastrados na plataforma")}
                </div>
            </div>

            <div class="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                ${renderFormularioNovoPersonal(estado)}
                ${renderListaPersonais(personais)}
            </div>
        </section>
    `;
}

function renderFormularioNovoPersonal(estado) {
    const formulario = estado.formularios.novoPersonal;
    const editando = Boolean(estado.admin.personalEditandoId);

    return `
        <section class="soft-rise ${classes.painel}">
            <p class="${classes.badge} w-fit">${editando ? "Editar personal" : "Novo personal"}</p>
            <h3 class="mt-4 font-display text-2xl font-semibold text-white">${editando ? "Atualizar conta profissional" : "Criar conta profissional"}</h3>
            ${editando ? `<p class="mt-2 text-sm text-stone-400">Deixe os campos de senha vazios para manter a senha atual.</p>` : ""}
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
                        <span class="mb-2 block text-sm font-medium text-stone-300">${editando ? "Nova senha" : "Senha inicial"}</span>
                        <input data-formulario="novoPersonal" name="senha" type="password" class="${classes.campo}" placeholder="${editando ? "Opcional" : "Minimo 6 caracteres"}" value="${escaparHtml(formulario.senha)}">
                    </label>
                    <label class="block">
                        <span class="mb-2 block text-sm font-medium text-stone-300">Confirmacao</span>
                        <input data-formulario="novoPersonal" name="confirmacaoSenha" type="password" class="${classes.campo}" placeholder="Repita a senha" value="${escaparHtml(formulario.confirmacaoSenha)}">
                    </label>
                </div>
                <div class="flex flex-col gap-3 sm:flex-row">
                    <button type="submit" class="${classes.botaoPrimario} flex-1">
                        ${estado.processando === "novo-personal" ? "Salvando..." : editando ? "Salvar alteracoes" : "Cadastrar personal"}
                    </button>
                    ${editando ? `<button type="button" data-acao="cancelar-edicao-personal" class="${classes.botaoSecundario}">Cancelar</button>` : ""}
                </div>
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
                                 <span class="mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${personal.ativo !== false ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border-red-400/20 bg-red-500/10 text-red-200"}">
                                     ${personal.ativo !== false ? "Ativo" : "Inativo"}
                                 </span>
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
                         <div class="mt-5 flex flex-wrap gap-3 border-t border-white/10 pt-4">
                             <button type="button" data-acao="editar-personal" data-personal-id="${escaparHtml(personal.id)}" class="${classes.botaoSecundario} px-4 py-2">Editar</button>
                             <button type="button" data-acao="alterar-status-personal" data-personal-id="${escaparHtml(personal.id)}" data-ativo="${personal.ativo === false}" class="${personal.ativo === false ? `${classes.botaoPrimario} px-4 py-2` : classes.botaoPerigo}">
                                 ${personal.ativo === false ? "Reativar" : "Desativar"}
                             </button>
                         </div>
                     </article>
                `).join("")}
            </div>
        </section>
    `;
}
