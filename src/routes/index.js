const { Router } = require("express");

const authRoutes = require("./authRoutes");
const healthRoutes = require("./healthRoutes");

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

module.exports = router;
