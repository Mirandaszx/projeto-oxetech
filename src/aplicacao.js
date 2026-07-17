const express = require("express");
const cors = require("cors");
const path = require("path");

const rotasApi = require("./routes");
const rotaNaoEncontrada = require("./middlewares/rotaNaoEncontrada");
const tratarErros = require("./middlewares/tratadorErros");

const aplicativo = express();
const diretorioRaiz = path.resolve(__dirname, "..");

aplicativo.use(cors());
aplicativo.use(express.json());
aplicativo.use(express.urlencoded({ extended: true }));

// Mantem o front atual funcionando enquanto o backend cresce por etapas.
aplicativo.use("/css", express.static(path.join(diretorioRaiz, "css")));
aplicativo.use("/js", express.static(path.join(diretorioRaiz, "js")));
aplicativo.use("/api", rotasApi);

aplicativo.get("/", (_requisicao, resposta) => {
    resposta.sendFile(path.join(diretorioRaiz, "index.html"));
});

aplicativo.use(rotaNaoEncontrada);
aplicativo.use(tratarErros);

module.exports = aplicativo;
