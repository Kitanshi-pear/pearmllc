const express = require("express");
const router = express.Router();
const { Lander } = require("../models");

// POST /api/landers - Create
router.post("/", async (req, res) => {
  try {
    const lander = await Lander.create(req.body);
    res.json(lander);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/landers - List all
router.get("/", async (req, res) => {
  try {
    const landers = await Lander.findAll();
    res.json(landers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/landers/:id - Details
router.get("/:id", async (req, res) => {
  try {
    const lander = await Lander.findByPk(req.params.id);
    if (!lander) return res.status(404).json({ error: "Not found" });
    res.json(lander);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/landers/:id - Update
router.put("/:id", async (req, res) => {
  try {
    const lander = await Lander.findByPk(req.params.id);
    if (!lander) return res.status(404).json({ error: "Not found" });
    await lander.update(req.body);
    res.json(lander);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/landers/:id - Delete
router.delete("/:id", async (req, res) => {
  try {
    const lander = await Lander.findByPk(req.params.id);
    if (!lander) return res.status(404).json({ error: "Not found" });
    await lander.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
