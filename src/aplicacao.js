const express = require("express");
const cors = require("cors");
const path = require("path");

const { ambiente } = require("./config/ambiente");
const rotasApi = require("./routes");
const rotaNaoEncontrada = require("./middlewares/rotaNaoEncontrada");
const tratarErros = require("./middlewares/tratadorErros");

const aplicativo = express();
const diretorioRaiz = path.resolve(__dirname, "..");

// Em producao, somente as origens configuradas podem consumir a API pelo navegador.
aplicativo.use(cors({
    origin(origem, concluir) {
        if (!origem || ambiente.origensCors.includes(origem.replace(/\/$/, ""))) {
            return concluir(null, true);
        }

        return concluir(null, false);
    }
}));
aplicativo.use(express.json({ limit: "100kb" }));
aplicativo.use(express.urlencoded({ extended: true, limit: "100kb" }));

// A API e os arquivos do frontend sao entregues pelo mesmo servidor Express.
aplicativo.use("/css", express.static(path.join(diretorioRaiz, "css")));
aplicativo.use("/js", express.static(path.join(diretorioRaiz, "js")));
aplicativo.use("/api", rotasApi);

aplicativo.get("/", (_requisicao, resposta) => {
    resposta.sendFile(path.join(diretorioRaiz, "index.html"));
});

aplicativo.use(rotaNaoEncontrada);
aplicativo.use(tratarErros);

module.exports = aplicativo;
