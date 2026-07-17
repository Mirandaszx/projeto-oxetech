const dotenv = require("dotenv");

dotenv.config();

const env = {
    port: Number(process.env.PORT) || 3000
};

module.exports = { env };
