const express = require("express");
const cors = require("cors");
const path = require("path");

const apiRoutes = require("./routes");
const notFoundHandler = require("./middlewares/notFoundHandler");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
const rootDir = path.resolve(__dirname, "..");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/css", express.static(path.join(rootDir, "css")));
app.use("/js", express.static(path.join(rootDir, "js")));
app.use("/api", apiRoutes);

app.get("/", (_req, res) => {
    res.sendFile(path.join(rootDir, "index.html"));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
