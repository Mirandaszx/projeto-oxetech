const aplicativo = require("./src/aplicacao");
const { ambiente } = require("./src/config/ambiente");

aplicativo.listen(ambiente.porta, () => {
    console.log(`Servidor Iron Pump rodando em http://localhost:${ambiente.porta}`);
});
