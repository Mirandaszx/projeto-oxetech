import { classes } from "../interface.js";
import { renderPainelAdmin } from "./admin.js";
import { renderPainelAluno } from "./aluno.js";
import {
    renderAreaPublica,
    renderCabecalho,
    renderCarregandoInicial,
    renderFormularioPerfil
} from "./comum.js";
import { renderPainelPersonal } from "./personal.js";

export function renderAplicacao(estado) {
    return `
        <main class="relative mx-auto flex min-h-screen min-w-0 w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
            ${renderCabecalho(estado)}
            ${estado.carregandoInicial
                ? renderCarregandoInicial()
                : estado.usuario
                    ? renderAreaPrivada(estado)
                    : renderAreaPublica(estado)}
        </main>
        ${estado.usuario && estado.perfilAberto ? renderFormularioPerfil(estado) : ""}
    `;
}

function renderAreaPrivada(estado) {
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
        return renderPainelAdmin(estado);
    }

    return estado.usuario.tipoUsuario === "personal"
        ? renderPainelPersonal(estado)
        : renderPainelAluno(estado);
}
