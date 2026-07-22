const registrosTreino = [];

function criarRegistroTreino(registroTreino) {
    registrosTreino.unshift(registroTreino);
    return registroTreino;
}

function listarRegistrosDoAluno(alunoId) {
    return registrosTreino.filter((registroTreino) => (
        registroTreino.alunoId === alunoId
    ));
}

module.exports = {
    criarRegistroTreino,
    listarRegistrosDoAluno
};
