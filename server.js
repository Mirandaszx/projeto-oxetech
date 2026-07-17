const app = require("./src/app");
const { env } = require("./src/config/env");

app.listen(env.port, () => {
    console.log(`Iron Pump backend rodando em http://localhost:${env.port}`);
});
