const fs = require("fs");
const path = require("path");

const diretorioRaiz = path.resolve(__dirname, "..");
const diretorioSaida = path.join(diretorioRaiz, "dist");
const urlApi = (process.env.API_URL || "").trim().replace(/\/+$/, "");

if (!/^https?:\/\/[^\s]+$/.test(urlApi)) {
    throw new Error("Configure API_URL com a URL publica do backend antes do build.");
}

fs.rmSync(diretorioSaida, { recursive: true, force: true });
fs.mkdirSync(diretorioSaida, { recursive: true });
fs.copyFileSync(
    path.join(diretorioRaiz, "index.html"),
    path.join(diretorioSaida, "index.html")
);
fs.cpSync(path.join(diretorioRaiz, "css"), path.join(diretorioSaida, "css"), {
    recursive: true
});
fs.cpSync(path.join(diretorioRaiz, "js"), path.join(diretorioSaida, "js"), {
    recursive: true
});

const configuracaoPublica = `window.configuracaoIronPump = Object.freeze(${JSON.stringify({
    urlApi
}, null, 4)});\n`;

fs.writeFileSync(
    path.join(diretorioSaida, "js", "configuracao.js"),
    configuracaoPublica,
    "utf8"
);

console.log(`Frontend preparado para consumir ${urlApi}`);
