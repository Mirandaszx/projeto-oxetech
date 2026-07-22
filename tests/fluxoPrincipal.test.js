const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { after, before, test } = require("node:test");
const vm = require("node:vm");

process.env.PERSISTENCIA = "memoria";

const aplicativo = require("../src/aplicacao");
const { ambiente } = require("../src/config/ambiente");

let servidor;
let enderecoApi;

before(async () => {
    await new Promise((resolver) => {
        servidor = aplicativo.listen(0, "127.0.0.1", resolver);
    });

    enderecoApi = `http://127.0.0.1:${servidor.address().port}/api`;
});

after(async () => {
    await new Promise((resolver, rejeitar) => {
        servidor.close((erro) => erro ? rejeitar(erro) : resolver());
    });
});

async function requisicao(caminho, { metodo = "GET", token, corpo } = {}) {
    const resposta = await fetch(`${enderecoApi}${caminho}`, {
        method: metodo,
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(corpo ? { "Content-Type": "application/json" } : {})
        },
        body: corpo ? JSON.stringify(corpo) : undefined
    });
    const dados = await resposta.json();

    return { resposta, dados };
}

async function renderizarPerfilNoVm(usuario, respostasApi) {
    const raiz = {
        innerHTML: "",
        addEventListener() {}
    };
    const armazenamento = new Map([
        ["iron_pump_token", "token-de-teste"],
        ["iron_pump_usuario", JSON.stringify(usuario)]
    ]);
    const codigoFrontend = fs.readFileSync(
        path.resolve(__dirname, "../js/app.js"),
        "utf8"
    );
    const fetchSimulado = async (caminho) => {
        const payload = respostasApi[caminho];

        if (!payload) {
            throw new Error(`Resposta simulada ausente para ${caminho}`);
        }

        return {
            ok: true,
            headers: {
                get: () => "application/json"
            },
            json: async () => payload
        };
    };

    vm.runInNewContext(codigoFrontend, {
        clearTimeout,
        console,
        document: {
            getElementById: () => raiz
        },
        fetch: fetchSimulado,
        localStorage: {
            getItem: (chave) => armazenamento.get(chave) || null,
            removeItem: (chave) => armazenamento.delete(chave),
            setItem: (chave, valor) => armazenamento.set(chave, valor)
        },
        setTimeout
    });

    await new Promise((resolver) => setImmediate(resolver));
    await new Promise((resolver) => setImmediate(resolver));
    return raiz.innerHTML;
}

test("executa o fluxo entre administrador, personal e aluno", async () => {
    const loginAdmin = await requisicao("/autenticacao/login", {
        metodo: "POST",
        corpo: {
            email: ambiente.administrador.email,
            senha: ambiente.administrador.senha
        }
    });

    assert.equal(loginAdmin.resposta.status, 200);
    assert.equal(loginAdmin.dados.usuario.tipoUsuario, "admin");

    const cadastroPersonal = await requisicao("/admin/personais", {
        metodo: "POST",
        token: loginAdmin.dados.token,
        corpo: {
            nome: "Carlos Personal",
            email: "carlos@teste.com",
            senha: "123456",
            confirmacaoSenha: "123456"
        }
    });

    assert.equal(cadastroPersonal.resposta.status, 201);
    assert.match(cadastroPersonal.dados.personal.codigoVinculo, /^IP-[A-F0-9]{6}$/);

    const cadastroAluno = await requisicao("/autenticacao/cadastro", {
        metodo: "POST",
        corpo: {
            nome: "Marina Aluna",
            email: "marina@teste.com",
            senha: "123456",
            confirmacaoSenha: "123456",
            tipoUsuario: "personal",
            objetivoTreino: "Hipertrofia",
            codigoPersonal: cadastroPersonal.dados.personal.codigoVinculo
        }
    });

    assert.equal(cadastroAluno.resposta.status, 201);
    assert.equal(cadastroAluno.dados.usuario.tipoUsuario, "aluno");
    assert.equal(cadastroAluno.dados.usuario.statusVinculo, "pendente");

    const acessoAdminPeloAluno = await requisicao("/admin/painel", {
        token: cadastroAluno.dados.token
    });

    assert.equal(acessoAdminPeloAluno.resposta.status, 403);

    const loginPersonal = await requisicao("/autenticacao/login", {
        metodo: "POST",
        corpo: {
            email: "carlos@teste.com",
            senha: "123456"
        }
    });

    assert.equal(loginPersonal.resposta.status, 200);
    assert.equal(loginPersonal.dados.usuario.tipoUsuario, "personal");

    const painelPendente = await requisicao("/personal/painel", {
        token: loginPersonal.dados.token
    });

    assert.equal(painelPendente.dados.resumo.totalSolicitacoes, 1);
    assert.equal(painelPendente.dados.resumo.totalAlunos, 0);

    const aprovacao = await requisicao(
        `/personal/solicitacoes/${cadastroAluno.dados.usuario.id}/aprovar`,
        {
            metodo: "PATCH",
            token: loginPersonal.dados.token
        }
    );

    assert.equal(aprovacao.resposta.status, 200);
    assert.equal(aprovacao.dados.aluno.statusVinculo, "ativo");

    const ficha = await requisicao(
        `/personal/alunos/${cadastroAluno.dados.usuario.id}/fichas`,
        {
            metodo: "POST",
            token: loginPersonal.dados.token,
            corpo: {
                nomeFicha: "Treino A",
                diaSemana: "Segunda",
                objetivo: "Peito e triceps",
                exercicios: [
                    {
                        nome: "Supino inclinado",
                        grupoMuscular: "Peito",
                        series: 3,
                        repeticoes: 12,
                        carga: "24 kg",
                        descanso: "60s"
                    }
                ]
            }
        }
    );

    assert.equal(ficha.resposta.status, 201);
    assert.equal(ficha.dados.ficha.exercicios.length, 1);
    assert.equal(ficha.dados.ficha.status, "ativa");

    const fichaAtualizadaPeloPersonal = await requisicao(
        `/personal/alunos/${cadastroAluno.dados.usuario.id}/fichas/${ficha.dados.ficha.id}`,
        {
            metodo: "PUT",
            token: loginPersonal.dados.token,
            corpo: {
                nomeFicha: "Treino A revisado",
                diaSemana: "Segunda",
                objetivo: "Peito e triceps",
                exercicios: [
                    {
                        nome: "Supino inclinado",
                        grupoMuscular: "Peito",
                        series: 3,
                        repeticoes: 12,
                        carga: "26 kg",
                        descanso: "60s"
                    }
                ]
            }
        }
    );

    assert.equal(fichaAtualizadaPeloPersonal.resposta.status, 200);
    assert.equal(fichaAtualizadaPeloPersonal.dados.ficha.exercicios[0].carga, "26 kg");
    assert.equal(
        fichaAtualizadaPeloPersonal.dados.ficha.atualizadaPor.tipoUsuario,
        "personal"
    );

    const fichaAtualizadaPeloAluno = await requisicao(
        `/aluno/fichas/${ficha.dados.ficha.id}`,
        {
        metodo: "PUT",
        token: cadastroAluno.dados.token,
        corpo: {
            nomeFicha: "Treino A ajustado",
            diaSemana: "Segunda",
            objetivo: "Peito e triceps",
            exercicios: [
                {
                    nome: "Supino inclinado",
                    grupoMuscular: "Peito",
                    series: 3,
                    repeticoes: 10,
                    carga: "28 kg",
                    descanso: "60s"
                }
            ]
        }
    });

    assert.equal(fichaAtualizadaPeloAluno.resposta.status, 200);
    assert.equal(fichaAtualizadaPeloAluno.dados.ficha.origem, "personal");
    assert.equal(fichaAtualizadaPeloAluno.dados.ficha.exercicios[0].carga, "28 kg");
    assert.equal(fichaAtualizadaPeloAluno.dados.ficha.atualizadaPor.tipoUsuario, "aluno");

    const registroTreino = await requisicao(
        `/aluno/fichas/${ficha.dados.ficha.id}/registros`,
        {
            metodo: "POST",
            token: cadastroAluno.dados.token,
            corpo: {
                dataTreino: "2026-07-20",
                observacoes: "Treino concluido sem dor.",
                exercicios: [
                    {
                        exercicioId: fichaAtualizadaPeloAluno.dados.ficha.exercicios[0].id,
                        seriesConcluidas: 3,
                        repeticoesRealizadas: 9,
                        cargaUtilizada: "30 kg"
                    }
                ]
            }
        }
    );

    assert.equal(registroTreino.resposta.status, 201);
    assert.equal(registroTreino.dados.registro.exercicios[0].cargaPlanejada, "28 kg");
    assert.equal(registroTreino.dados.registro.exercicios[0].cargaUtilizada, "30 kg");

    const fichaEditadaDepoisDoRegistro = await requisicao(
        `/aluno/fichas/${ficha.dados.ficha.id}`,
        {
            metodo: "PUT",
            token: cadastroAluno.dados.token,
            corpo: {
                nomeFicha: "Treino A ajustado",
                diaSemana: "Segunda",
                objetivo: "Peito e triceps",
                exercicios: [
                    {
                        nome: "Supino inclinado",
                        grupoMuscular: "Peito",
                        series: 4,
                        repeticoes: 8,
                        carga: "32 kg",
                        descanso: "60s"
                    }
                ]
            }
        }
    );

    assert.equal(fichaEditadaDepoisDoRegistro.resposta.status, 200);

    const registroPeloPersonal = await requisicao(
        `/aluno/fichas/${ficha.dados.ficha.id}/registros`,
        {
            metodo: "POST",
            token: loginPersonal.dados.token,
            corpo: {}
        }
    );

    assert.equal(registroPeloPersonal.resposta.status, 403);

    const novaFichaComAcompanhamento = await requisicao("/aluno/fichas", {
        metodo: "POST",
        token: cadastroAluno.dados.token,
        corpo: {
            nomeFicha: "Treino extra",
            diaSemana: "Sabado",
            exercicios: [
                {
                    nome: "Agachamento",
                    grupoMuscular: "Pernas",
                    series: 3,
                    repeticoes: 12
                }
            ]
        }
    });

    assert.equal(novaFichaComAcompanhamento.resposta.status, 201);
    assert.equal(novaFichaComAcompanhamento.dados.ficha.origem, "aluno");

    const painelAluno = await requisicao("/aluno/painel", {
        token: cadastroAluno.dados.token
    });
    const fichasAluno = await requisicao("/aluno/fichas", {
        token: cadastroAluno.dados.token
    });
    const registrosAluno = await requisicao("/aluno/registros", {
        token: cadastroAluno.dados.token
    });
    const acompanhamentoPersonal = await requisicao(
        `/personal/alunos/${cadastroAluno.dados.usuario.id}`,
        { token: loginPersonal.dados.token }
    );

    assert.equal(painelAluno.dados.aluno.statusVinculo, "ativo");
    assert.equal(painelAluno.dados.personal.nome, "Carlos Personal");
    assert.equal(painelAluno.dados.resumo.totalRegistros, 1);
    assert.equal(fichasAluno.dados.fichas.length, 2);
    assert.equal(fichasAluno.dados.fichas[0].exercicios[0].carga, "32 kg");
    assert.equal(registrosAluno.dados.registros[0].exercicios[0].cargaPlanejada, "28 kg");
    assert.equal(acompanhamentoPersonal.dados.fichas[0].nomeFicha, "Treino A ajustado");
    assert.equal(acompanhamentoPersonal.dados.registros.length, 1);

    const fichaRemovida = await requisicao(
        `/personal/alunos/${cadastroAluno.dados.usuario.id}/fichas/${ficha.dados.ficha.id}`,
        {
            metodo: "DELETE",
            token: loginPersonal.dados.token
        }
    );

    assert.equal(fichaRemovida.resposta.status, 200);
    assert.equal(fichaRemovida.dados.fichaId, ficha.dados.ficha.id);

    const edicaoDeFichaExcluida = await requisicao(
        `/aluno/fichas/${ficha.dados.ficha.id}`,
        {
            metodo: "PUT",
            token: cadastroAluno.dados.token,
            corpo: {
                nomeFicha: "Edicao indevida",
                diaSemana: "Segunda",
                exercicios: [
                    {
                        nome: "Supino inclinado",
                        grupoMuscular: "Peito",
                        series: 3,
                        repeticoes: 10
                    }
                ]
            }
        }
    );
    const registroEmFichaExcluida = await requisicao(
        `/aluno/fichas/${ficha.dados.ficha.id}/registros`,
        {
            metodo: "POST",
            token: cadastroAluno.dados.token,
            corpo: {}
        }
    );
    const consultaAposExclusao = await requisicao("/aluno/fichas", {
        token: cadastroAluno.dados.token
    });

    assert.equal(edicaoDeFichaExcluida.resposta.status, 404);
    assert.equal(registroEmFichaExcluida.resposta.status, 404);
    assert.equal(consultaAposExclusao.dados.fichas.length, 1);
    assert.equal(
        consultaAposExclusao.dados.fichas.some((item) => item.id === ficha.dados.ficha.id),
        false
    );

    const encerramentoVinculo = await requisicao("/aluno/vinculo", {
        metodo: "DELETE",
        token: cadastroAluno.dados.token
    });
    const acessoDoAntigoPersonal = await requisicao(
        `/personal/alunos/${cadastroAluno.dados.usuario.id}`,
        { token: loginPersonal.dados.token }
    );

    assert.equal(encerramentoVinculo.resposta.status, 200);
    assert.equal(encerramentoVinculo.dados.usuario.statusVinculo, "sem_vinculo");
    assert.equal(acessoDoAntigoPersonal.resposta.status, 404);

    const fichaIndependente = await requisicao("/aluno/fichas", {
        metodo: "POST",
        token: cadastroAluno.dados.token,
        corpo: {
            nomeFicha: "Treino independente",
            diaSemana: "Sabado",
            exercicios: [
                {
                    nome: "Agachamento",
                    grupoMuscular: "Pernas",
                    series: 3,
                    repeticoes: 12
                }
            ]
        }
    });
    const historicoPreservado = await requisicao("/aluno/registros", {
        token: cadastroAluno.dados.token
    });

    assert.equal(fichaIndependente.resposta.status, 201);
    assert.equal(fichaIndependente.dados.ficha.origem, "aluno");
    assert.equal(historicoPreservado.dados.registros.length, 1);
});

test("aluno sem acompanhamento cria e edita a propria ficha", async () => {
    const cadastroAluno = await requisicao("/autenticacao/cadastro", {
        metodo: "POST",
        corpo: {
            nome: "Joao Aluno",
            email: "joao@teste.com",
            senha: "123456",
            confirmacaoSenha: "123456",
            objetivoTreino: "Condicionamento"
        }
    });

    assert.equal(cadastroAluno.dados.usuario.statusVinculo, "sem_vinculo");

    const fichaInvalida = await requisicao("/aluno/fichas", {
        metodo: "POST",
        token: cadastroAluno.dados.token,
        corpo: {
            nomeFicha: "Ficha invalida",
            diaSemana: "Feriado",
            exercicios: [
                {
                    nome: "Corrida",
                    grupoMuscular: "Cardio",
                    series: 0,
                    repeticoes: 20
                }
            ]
        }
    });

    assert.equal(fichaInvalida.resposta.status, 400);

    const fichaPropria = await requisicao("/aluno/fichas", {
        metodo: "POST",
        token: cadastroAluno.dados.token,
        corpo: {
            nomeFicha: "Treino livre",
            diaSemana: "Quarta",
            objetivo: "Condicionamento",
            exercicios: [
                {
                    nome: "Corrida",
                    grupoMuscular: "Cardio",
                    series: 1,
                    repeticoes: 20,
                    carga: "20 minutos"
                }
            ]
        }
    });

    assert.equal(fichaPropria.resposta.status, 201);
    assert.equal(fichaPropria.dados.ficha.origem, "aluno");

    const fichaPropriaAtualizada = await requisicao(
        `/aluno/fichas/${fichaPropria.dados.ficha.id}`,
        {
            metodo: "PUT",
            token: cadastroAluno.dados.token,
            corpo: {
                nomeFicha: "Treino livre atualizado",
                diaSemana: "Quarta",
                objetivo: "Condicionamento",
                exercicios: [
                    {
                        nome: "Corrida",
                        grupoMuscular: "Cardio",
                        series: 1,
                        repeticoes: 30,
                        carga: "30 minutos"
                    }
                ]
            }
        }
    );

    assert.equal(fichaPropriaAtualizada.resposta.status, 200);
    assert.equal(fichaPropriaAtualizada.dados.ficha.exercicios[0].repeticoes, "30");

    const registroSemPersonal = await requisicao(
        `/aluno/fichas/${fichaPropria.dados.ficha.id}/registros`,
        {
            metodo: "POST",
            token: cadastroAluno.dados.token,
            corpo: {
                dataTreino: "2026-07-20",
                exercicios: [
                    {
                        exercicioId: fichaPropriaAtualizada.dados.ficha.exercicios[0].id,
                        seriesConcluidas: 1,
                        repeticoesRealizadas: 30,
                        cargaUtilizada: "30 minutos"
                    }
                ]
            }
        }
    );

    assert.equal(registroSemPersonal.resposta.status, 201);

    const painelAdmin = await requisicao("/autenticacao/login", {
        metodo: "POST",
        corpo: {
            email: ambiente.administrador.email,
            senha: ambiente.administrador.senha
        }
    });
    const dadosAdmin = await requisicao("/admin/painel", {
        token: painelAdmin.dados.token
    });
    const codigoPersonal = dadosAdmin.dados.personais[0].codigoVinculo;
    const solicitacao = await requisicao("/aluno/vinculo", {
        metodo: "POST",
        token: cadastroAluno.dados.token,
        corpo: { codigoPersonal }
    });

    assert.equal(solicitacao.resposta.status, 200);
    assert.equal(solicitacao.dados.personal.nome, "Carlos Personal");

    const cancelamentoSolicitacao = await requisicao("/aluno/vinculo", {
        metodo: "DELETE",
        token: cadastroAluno.dados.token
    });
    const fichasDepoisDoCancelamento = await requisicao("/aluno/fichas", {
        token: cadastroAluno.dados.token
    });

    assert.equal(cancelamentoSolicitacao.resposta.status, 200);
    assert.equal(cancelamentoSolicitacao.dados.usuario.statusVinculo, "sem_vinculo");
    assert.equal(fichasDepoisDoCancelamento.dados.fichas.length, 1);

    const novaSolicitacao = await requisicao("/aluno/vinculo", {
        metodo: "POST",
        token: cadastroAluno.dados.token,
        corpo: { codigoPersonal }
    });
    const loginPersonal = await requisicao("/autenticacao/login", {
        metodo: "POST",
        corpo: {
            email: "carlos@teste.com",
            senha: "123456"
        }
    });
    const aprovacao = await requisicao(
        `/personal/solicitacoes/${cadastroAluno.dados.usuario.id}/aprovar`,
        {
            metodo: "PATCH",
            token: loginPersonal.dados.token
        }
    );
    const tentativaDeExcluirFichaDoAluno = await requisicao(
        `/personal/alunos/${cadastroAluno.dados.usuario.id}/fichas/${fichaPropria.dados.ficha.id}`,
        {
            metodo: "DELETE",
            token: loginPersonal.dados.token
        }
    );

    assert.equal(novaSolicitacao.resposta.status, 200);
    assert.equal(aprovacao.resposta.status, 200);
    assert.equal(tentativaDeExcluirFichaDoAluno.resposta.status, 404);

    const edicaoPeloAlunoAcompanhado = await requisicao(
        `/aluno/fichas/${fichaPropria.dados.ficha.id}`,
        {
            metodo: "PUT",
            token: cadastroAluno.dados.token,
            corpo: {
                nomeFicha: "Treino livre acompanhado",
                diaSemana: "Quarta",
                objetivo: "Condicionamento",
                exercicios: [
                    {
                        nome: "Corrida",
                        grupoMuscular: "Cardio",
                        series: 1,
                        repeticoes: 35,
                        carga: "35 minutos"
                    }
                ]
            }
        }
    );

    assert.equal(edicaoPeloAlunoAcompanhado.resposta.status, 200);

    const remocaoPeloAluno = await requisicao(
        `/aluno/fichas/${fichaPropria.dados.ficha.id}`,
        {
            metodo: "DELETE",
            token: cadastroAluno.dados.token
        }
    );
    const historicoAposRemocao = await requisicao("/aluno/registros", {
        token: cadastroAluno.dados.token
    });
    const fichasAposRemocao = await requisicao("/aluno/fichas", {
        token: cadastroAluno.dados.token
    });

    assert.equal(remocaoPeloAluno.resposta.status, 200);
    assert.equal(remocaoPeloAluno.dados.fichaId, fichaPropria.dados.ficha.id);
    assert.equal(historicoAposRemocao.dados.registros.length, 1);
    assert.equal(fichasAposRemocao.dados.fichas.length, 0);

    await requisicao("/aluno/vinculo", {
        metodo: "DELETE",
        token: cadastroAluno.dados.token
    });
});

test("serve a interface com os paineis dos tres perfis", async () => {
    const pagina = await fetch(enderecoApi.replace("/api", "/"));
    const html = await pagina.text();
    const javascript = await fetch(enderecoApi.replace("/api", "/js/app.js")).then((resposta) => (
        resposta.text()
    ));

    assert.equal(pagina.status, 200);
    assert.match(html, /Diario de Treino Iron Pump/);
    assert.match(html, /tailwindcss/);
    assert.match(javascript, /renderPainelAdmin/);
    assert.match(javascript, /renderPainelPersonal/);
    assert.match(javascript, /renderPainelAluno/);
    assert.match(javascript, /renderFormularioFichaAluno/);
    assert.match(javascript, /data-ficha-aluno-campo/);
    assert.match(javascript, /renderFormularioRegistroTreino/);
    assert.match(javascript, /renderEvolucaoFicha/);
    assert.match(javascript, /data-registro-campo/);
    assert.match(javascript, /editar-ficha-personal/);
    assert.match(javascript, /remover-ficha-personal/);
    assert.match(javascript, /remover-ficha-aluno/);
    assert.match(javascript, /Historico de fichas excluidas/);
    assert.match(javascript, /encerrar-vinculo/);
    assert.match(javascript, /resposta\.status === 401/);
    assert.match(javascript, /resposta\.status === 403/);
    assert.doesNotMatch(javascript, /API offline/);
    assert.doesNotMatch(javascript, /Preto \+ laranja queimado/);
});

test("documenta a instalacao e o CRUD completo no README", () => {
    const readme = fs.readFileSync(path.resolve(__dirname, "../README.md"), "utf8");

    assert.match(readme, /PERSISTENCIA=postgres/);
    assert.match(readme, /DATABASE_URL=/);
    assert.match(readme, /npm run db:migrate/);
    assert.match(readme, /DELETE \/api\/aluno\/fichas/);
    assert.match(readme, /admin@ironpump\.com/);
    assert.match(readme, /Arquitetura/);
});

test("mantem preparado o contrato da persistencia PostgreSQL", () => {
    const migration = fs.readFileSync(
        path.resolve(__dirname, "../database/migrations/001_estrutura_inicial.sql"),
        "utf8"
    );
    const migrationExclusao = fs.readFileSync(
        path.resolve(__dirname, "../database/migrations/002_exclusao_fisica_fichas.sql"),
        "utf8"
    );
    const repositorioUsuarios = require(
        "../src/repositorios/postgres/usuariosRepositorioPostgres"
    );
    const repositorioFichas = require(
        "../src/repositorios/postgres/fichasTreinoRepositorioPostgres"
    );
    const repositorioRegistros = require(
        "../src/repositorios/postgres/registrosTreinoRepositorioPostgres"
    );

    assert.match(migration, /CREATE TABLE IF NOT EXISTS usuarios/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS vinculos_acompanhamento/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS fichas_treino/);
    assert.match(migration, /CREATE TABLE IF NOT EXISTS exercicios_registro/);
    assert.match(migration, /vinculo_atual_unico_por_aluno/);
    assert.match(migrationExclusao, /ON DELETE SET NULL/);
    assert.match(migrationExclusao, /DELETE FROM fichas_treino/);
    assert.equal(typeof repositorioUsuarios.criarUsuario, "function");
    assert.equal(typeof repositorioFichas.atualizarFichaTreino, "function");
    assert.equal(typeof repositorioFichas.removerFichaTreino, "function");
    assert.equal(typeof repositorioRegistros.criarRegistroTreino, "function");
});

test("renderiza os controles de ficha e acompanhamento nas telas privadas", async () => {
    const exercicio = {
        id: "exercicio-1",
        nome: "Supino",
        grupoMuscular: "Peito",
        series: "3",
        repeticoes: "12",
        carga: "20 kg",
        descanso: "60s"
    };
    const fichaAtiva = {
        id: "ficha-1",
        alunoId: "aluno-1",
        personalId: "personal-1",
        origem: "personal",
        status: "ativa",
        nomeFicha: "Treino A",
        diaSemana: "Segunda",
        exercicios: [exercicio]
    };
    const registroFichaExcluida = {
        id: "registro-1",
        fichaId: "ficha-excluida",
        nomeFicha: "Treino antigo",
        dataTreino: "2026-07-20",
        observacoes: "",
        exercicios: [{
            nome: "Supino",
            seriesConcluidas: "3",
            repeticoesRealizadas: "12",
            cargaUtilizada: "20 kg"
        }]
    };
    const usuarioPersonal = {
        id: "personal-1",
        nome: "Carlos Personal",
        email: "carlos@teste.com",
        tipoUsuario: "personal",
        codigoVinculo: "IP-ABC123"
    };
    const htmlPersonal = await renderizarPerfilNoVm(usuarioPersonal, {
        "/api/autenticacao/perfil": { usuario: usuarioPersonal },
        "/api/personal/painel": {
            personal: usuarioPersonal,
            resumo: { totalAlunos: 1, totalSolicitacoes: 0, totalFichas: 1 },
            solicitacoes: [],
            alunos: [{
                id: "aluno-1",
                nome: "Marina",
                email: "marina@teste.com",
                objetivoTreino: "Hipertrofia",
                totalFichas: 1
            }]
        },
        "/api/personal/alunos/aluno-1": {
            aluno: {
                id: "aluno-1",
                nome: "Marina",
                email: "marina@teste.com",
                objetivoTreino: "Hipertrofia"
            },
            fichas: [fichaAtiva],
            registros: [registroFichaExcluida]
        }
    });

    assert.match(htmlPersonal, /data-acao="editar-ficha-personal"/);
    assert.match(htmlPersonal, /data-acao="remover-ficha-personal"/);
    assert.match(htmlPersonal, /Historico de fichas excluidas/);
    assert.doesNotMatch(htmlPersonal, /Arquivada/);

    const usuarioAluno = {
        id: "aluno-1",
        nome: "Marina",
        email: "marina@teste.com",
        tipoUsuario: "aluno",
        objetivoTreino: "Hipertrofia",
        statusVinculo: "ativo"
    };
    const htmlAluno = await renderizarPerfilNoVm(usuarioAluno, {
        "/api/autenticacao/perfil": { usuario: usuarioAluno },
        "/api/aluno/painel": {
            aluno: usuarioAluno,
            personal: usuarioPersonal,
            resumo: {
                totalFichas: 1,
                totalRegistros: 0,
                proximoTreino: "Segunda"
            }
        },
        "/api/aluno/fichas": { fichas: [fichaAtiva] },
        "/api/aluno/registros": { registros: [registroFichaExcluida] }
    });

    assert.match(htmlAluno, /data-acao="encerrar-vinculo"/);
    assert.match(htmlAluno, /data-acao="editar-ficha-aluno"/);
    assert.match(htmlAluno, /data-acao="registrar-ficha-aluno"/);
    assert.match(htmlAluno, /data-acao="remover-ficha-aluno"/);
    assert.match(htmlAluno, /Historico de fichas excluidas/);
});

test("renderiza a tela publica sem erro de execucao", async () => {
    const raiz = {
        innerHTML: "",
        addEventListener() {}
    };
    const armazenamento = new Map();
    const codigoFrontend = fs.readFileSync(
        path.resolve(__dirname, "../js/app.js"),
        "utf8"
    );
    const contexto = {
        clearTimeout,
        console,
        document: {
            getElementById: () => raiz
        },
        fetch,
        localStorage: {
            getItem: (chave) => armazenamento.get(chave) || null,
            removeItem: (chave) => armazenamento.delete(chave),
            setItem: (chave, valor) => armazenamento.set(chave, valor)
        },
        setTimeout
    };

    vm.runInNewContext(codigoFrontend, contexto);
    await new Promise((resolver) => setImmediate(resolver));

    assert.match(raiz.innerHTML, /Organize seus treinos em um so lugar/);
    assert.match(raiz.innerHTML, /data-form-submit="login"/);
    assert.match(raiz.innerHTML, /data-aba="cadastro"/);
    assert.doesNotMatch(raiz.innerHTML, /Cada perfil cuida da sua parte/);
    assert.doesNotMatch(raiz.innerHTML, /Acesso inicial do administrador/);
});
