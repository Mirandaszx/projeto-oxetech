const dotenv = require("dotenv");

dotenv.config();

const ambiente = {
    porta: Number(process.env.PORT) || 3000
};

module.exports = { ambiente };
