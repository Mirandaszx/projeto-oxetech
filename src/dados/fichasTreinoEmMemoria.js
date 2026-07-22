const fichasTreino = [];

function criarFichaTreino(fichaTreino) {
    fichasTreino.push(fichaTreino);
    return fichaTreino;
}

function listarFichasDoAluno(alunoId) {
    return fichasTreino.filter((fichaTreino) => fichaTreino.alunoId === alunoId);
}

function buscarFichaDoAluno(alunoId, fichaId) {
    return fichasTreino.find((fichaTreino) => (
        fichaTreino.id === fichaId && fichaTreino.alunoId === alunoId
    )) || null;
}

function buscarFichaDoPersonal(personalId, alunoId, fichaId) {
    return fichasTreino.find((fichaTreino) => (
        fichaTreino.id === fichaId
        && fichaTreino.alunoId === alunoId
        && fichaTreino.personalId === personalId
    )) || null;
}

function atualizarFichaTreino(fichaId, dadosAtualizados) {
    const fichaTreino = fichasTreino.find((ficha) => ficha.id === fichaId);

    if (!fichaTreino) {
        return null;
    }

    Object.assign(fichaTreino, dadosAtualizados);
    return fichaTreino;
}

function removerFichaTreino(fichaId) {
    const indiceFicha = fichasTreino.findIndex((ficha) => ficha.id === fichaId);

    if (indiceFicha === -1) {
        return false;
    }

    fichasTreino.splice(indiceFicha, 1);
    return true;
}

function listarFichasDoPersonal(personalId) {
    return fichasTreino.filter((fichaTreino) => fichaTreino.personalId === personalId);
}

module.exports = {
    criarFichaTreino,
    listarFichasDoAluno,
    buscarFichaDoAluno,
    buscarFichaDoPersonal,
    atualizarFichaTreino,
    removerFichaTreino,
    listarFichasDoPersonal
};
