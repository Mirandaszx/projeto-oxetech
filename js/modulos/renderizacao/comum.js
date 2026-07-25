import { classes } from "../interface.js";
import {
    escaparHtml,
    nomeDoPerfil,
    obterIniciais
} from "../utilidades.js";

export function renderNotificacao(estado) {
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

export function renderCabecalho(estado) {
    return `
        <header class="soft-rise ${classes.painel} mb-6 w-full px-4 py-4 sm:px-6">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-ember-400 to-ember-700 font-display text-lg font-bold text-coal-950 sm:h-14 sm:w-14 sm:text-xl">IP</div>
                    <div class="min-w-0">
                        <h1 class="break-words font-display text-xl font-semibold leading-tight text-white sm:text-2xl">Diario de Treino Iron Pump</h1>
                        <p class="mt-1 text-sm text-stone-400">Organize seus treinos em um so lugar</p>
                    </div>
                </div>
                ${estado.usuario ? renderResumoUsuarioCabecalho(estado) : ""}
            </div>
        </header>
    `;
}

function renderResumoUsuarioCabecalho(estado) {
    return `
        <div class="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 p-2 pl-3">
            <div class="grid h-10 w-10 place-items-center rounded-full bg-ember-500 font-display text-sm font-bold text-coal-950">
                ${escaparHtml(obterIniciais(estado.usuario.nome))}
            </div>
            <div class="hidden sm:block">
                <p class="text-sm font-semibold text-white">${escaparHtml(estado.usuario.nome)}</p>
                <p class="text-xs text-stone-400">${escaparHtml(nomeDoPerfil(estado.usuario.tipoUsuario))}</p>
            </div>
            <button type="button" data-acao="abrir-perfil" class="${classes.botaoSecundario} px-4 py-2">Meu perfil</button>
            <button type="button" data-acao="logout" class="${classes.botaoSecundario} px-4 py-2">Sair</button>
        </div>
    `;
}

export function renderFormularioPerfil(estado) {
    const formulario = estado.formularios.perfil;
    const aluno = estado.usuario.tipoUsuario === "aluno";

    return `
        <div class="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
            <section class="soft-rise ${classes.painel} my-auto w-full max-w-2xl">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <p class="${classes.badge} w-fit">Minha conta</p>
                        <h2 class="mt-4 font-display text-3xl font-semibold text-white">Editar perfil</h2>
                        <p class="mt-2 text-sm text-stone-400">Atualize seus dados ou deixe a senha vazia para manter a atual.</p>
                    </div>
                    <button type="button" data-acao="fechar-perfil" class="${classes.botaoSecundario} px-4 py-2">Fechar</button>
                </div>

                <form data-form-submit="perfil" class="mt-6 space-y-4">
                    <div class="grid gap-4 sm:grid-cols-2">
                        <label class="block">
                            <span class="mb-2 block text-sm font-medium text-stone-300">Nome</span>
                            <input data-formulario="perfil" name="nome" type="text" autocomplete="name" class="${classes.campo}" value="${escaparHtml(formulario.nome)}">
                        </label>
                        <label class="block">
                            <span class="mb-2 block text-sm font-medium text-stone-300">Email</span>
                            <input data-formulario="perfil" name="email" type="email" autocomplete="email" class="${classes.campo}" value="${escaparHtml(formulario.email)}">
                        </label>
                    </div>
                    ${aluno ? `
                        <label class="block">
                            <span class="mb-2 block text-sm font-medium text-stone-300">Objetivo de treino</span>
                            <input data-formulario="perfil" name="objetivoTreino" type="text" maxlength="120" class="${classes.campo}" placeholder="Ex.: Hipertrofia ou condicionamento" value="${escaparHtml(formulario.objetivoTreino)}">
                        </label>
                    ` : ""}
                    <div class="grid gap-4 sm:grid-cols-2">
                        <label class="block">
                            <span class="mb-2 block text-sm font-medium text-stone-300">Nova senha</span>
                            <input data-formulario="perfil" name="senha" type="password" autocomplete="new-password" class="${classes.campo}" placeholder="Opcional">
                        </label>
                        <label class="block">
                            <span class="mb-2 block text-sm font-medium text-stone-300">Confirmar nova senha</span>
                            <input data-formulario="perfil" name="confirmacaoSenha" type="password" autocomplete="new-password" class="${classes.campo}" placeholder="Repita a nova senha">
                        </label>
                    </div>
                    <button type="submit" class="${classes.botaoPrimario} w-full">
                        ${estado.processando === "perfil" ? "Salvando..." : "Salvar perfil"}
                    </button>
                </form>
            </section>
        </div>
    `;
}

export function renderCarregandoInicial() {
    return `
        <section class="flex flex-1 items-center justify-center py-12">
            <div class="${classes.painel} max-w-md text-center">
                <h2 class="font-display text-3xl font-semibold text-white">Carregando...</h2>
                <p class="mt-3 text-sm text-stone-400">Aguarde enquanto sua sessao e preparada.</p>
            </div>
        </section>
    `;
}

export function renderAreaPublica(estado) {
    return `
        <section class="flex min-w-0 w-full flex-1 items-start justify-center pb-10 pt-4 sm:items-center">
            <aside class="soft-rise ${classes.painel} w-full max-w-xl p-5 sm:p-8">
                <div class="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div class="min-w-0">
                        <p class="${classes.badge} w-fit">Acesso</p>
                        <h2 class="mt-4 font-display text-3xl font-semibold text-white">${estado.abaAutenticacao === "login" ? "Entrar" : "Criar conta"}</h2>
                        <p class="mt-2 text-sm text-stone-400">${estado.abaAutenticacao === "login" ? "Use seu email e senha para continuar." : "Preencha seus dados para comecar."}</p>
                    </div>
                    <div class="flex w-full rounded-full border border-white/10 bg-black/20 p-1 sm:w-auto">
                        <button type="button" data-acao="trocar-aba" data-aba="login" class="flex-1 rounded-full px-4 py-2 text-sm font-semibold transition sm:flex-none ${estado.abaAutenticacao === "login" ? "bg-ember-500 text-coal-950" : "text-stone-300"}">Login</button>
                        <button type="button" data-acao="trocar-aba" data-aba="cadastro" class="flex-1 rounded-full px-4 py-2 text-sm font-semibold transition sm:flex-none ${estado.abaAutenticacao === "cadastro" ? "bg-ember-500 text-coal-950" : "text-stone-300"}">Cadastro</button>
                    </div>
                </div>

                <div class="mt-8">
                    ${estado.abaAutenticacao === "login" ? renderFormularioLogin(estado) : renderFormularioCadastro(estado)}
                </div>
            </aside>
        </section>
    `;
}

function renderFormularioLogin(estado) {
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

function renderFormularioCadastro(estado) {
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

export function renderMetrica(rotulo, valor, detalhe) {
    return `
        <div class="${classes.metrica}">
            <p class="text-xs uppercase tracking-[0.2em] text-stone-400">${escaparHtml(rotulo)}</p>
            <p class="mt-3 font-display text-4xl font-semibold text-white">${escaparHtml(valor)}</p>
            <p class="mt-2 text-sm text-stone-400">${escaparHtml(detalhe)}</p>
        </div>
    `;
}

export function renderVazio(mensagem) {
    return `<div class="rounded-[24px] border border-dashed border-white/10 bg-black/20 px-5 py-7 text-center text-sm leading-7 text-stone-400">${escaparHtml(mensagem)}</div>`;
}
