function notFoundHandler(req, res, next) {
    if (req.originalUrl.startsWith("/api")) {
        return res.status(404).json({
            message: "Rota nao encontrada."
        });
    }

    const error = new Error("Pagina nao encontrada.");
    error.statusCode = 404;

    return next(error);
}

module.exports = notFoundHandler;
