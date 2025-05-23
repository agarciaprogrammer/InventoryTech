// routes/verificar.js
const express = require("express");
const authenticateToken = require("../../middle/authenticateToken");
const router = express.Router();

router.get("/", authenticateToken, (req, res) => {
  res.json({ message: "Acceso a la ruta protegida exitoso.", user: req.user });
});

module.exports = router;
