function getHealth(_req, res) {
    return res.json({
        status: "ok",
        app: "Iron Pump",
        stage: "backend-base",
        timestamp: new Date().toISOString()
    });
}

module.exports = {
    getHealth
};
