(function configurarApi() {
    const execucaoLocal = window.location.protocol === "file:"
        || ["localhost", "127.0.0.1"].includes(window.location.hostname);

    window.configuracaoIronPump = Object.freeze({
        urlApi: execucaoLocal ? "http://localhost:3000" : ""
    });
}());
