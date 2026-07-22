const dotenv = require("dotenv");

dotenv.config();

const ambiente = {
    porta: Number(process.env.PORT) || 3000,
    chaveJwt: process.env.JWT_SECRET || "iron-pump-chave-local",
    persistencia: process.env.PERSISTENCIA === "postgres" ? "postgres" : "memoria",
    banco: {
        url: process.env.DATABASE_URL || "",
        ssl: process.env.DATABASE_SSL === "true",
        maxConexoes: Number(process.env.DATABASE_POOL_MAX) || 10
    },
    administrador: {
        nome: process.env.ADMIN_NAME || "Administrador Iron Pump",
        email: process.env.ADMIN_EMAIL || "admin@ironpump.com",
        senha: process.env.ADMIN_PASSWORD || "123456"
    }
};

module.exports = { ambiente };
