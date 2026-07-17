function register(_req, res) {
    return res.status(501).json({
        message: "Cadastro de usuario sera implementado na proxima etapa."
    });
}

function login(_req, res) {
    return res.status(501).json({
        message: "Login com JWT sera implementado na proxima etapa."
    });
}

module.exports = {
    register,
    login
};
