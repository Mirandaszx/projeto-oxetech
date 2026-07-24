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
    },
    demonstracao: {
        personal: {
            nome: process.env.DEMO_PERSONAL_NAME || "Personal Iron Pump",
            email: process.env.DEMO_PERSONAL_EMAIL || "personal@ironpump.com",
            senha: process.env.DEMO_PERSONAL_PASSWORD || "123456",
            codigoVinculo: process.env.DEMO_PERSONAL_CODE || "IP-DE1234"
        },
        aluno: {
            nome: process.env.DEMO_ALUNO_NAME || "Aluno Demonstracao",
            email: process.env.DEMO_ALUNO_EMAIL || "aluno@ironpump.com",
            senha: process.env.DEMO_ALUNO_PASSWORD || "123456",
            objetivoTreino: process.env.DEMO_ALUNO_OBJECTIVE || "Hipertrofia"
        }
    }
};

module.exports = { ambiente };
