const express = require("express");
const router = express.Router();
const { Lander, Campaigns, Clicks } = require("../models");

// POST /api/landers - Create
router.post("/", async (req, res) => {
  console.log("POST /api/landers - Payload:", req.body);
  try {
    const lander = await Lander.create(req.body);
    console.log("Lander created successfully:", lander);
    res.json(lander);
  } catch (err) {
    console.error("Error creating lander:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/landers - List all
router.get("/", async (req, res) => {
  console.log("GET /api/landers - Fetching all landers");
  try {
    const landers = await Lander.findAll();
    console.log("Fetched landers:", landers.length);
    res.json(landers);
  } catch (err) {
    console.error("Error fetching landers:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/landers/:id - Details
router.get("/:id", async (req, res) => {
  console.log(`GET /api/landers/${req.params.id} - Fetching lander details`);
  try {
    const lander = await Lander.findByPk(req.params.id);
    if (!lander) {
      console.warn(`Lander not found with ID: ${req.params.id}`);
      return res.status(404).json({ error: "Not found" });
    }
    console.log("Lander fetched:", lander);
    res.json(lander);
  } catch (err) {
    console.error("Error fetching lander:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/landers/:id - Update
router.put("/:id", async (req, res) => {
  console.log(`PUT /api/landers/${req.params.id} - Payload:`, req.body);
  try {
    const lander = await Lander.findByPk(req.params.id);
    if (!lander) {
      console.warn(`Lander not found for update with ID: ${req.params.id}`);
      return res.status(404).json({ error: "Not found" });
    }
    await lander.update(req.body);
    console.log("Lander updated:", lander);
    res.json(lander);
  } catch (err) {
    console.error("Error updating lander:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/landers/:id - Delete
router.delete("/:id", async (req, res) => {
  console.log(`DELETE /api/landers/${req.params.id} - Deleting lander`);
  try {
    const lander = await Lander.findByPk(req.params.id);
    if (!lander) {
      console.warn(`Lander not found for delete with ID: ${req.params.id}`);
      return res.status(404).json({ error: "Not found" });
    }
    await lander.destroy();
    console.log("Lander deleted:", req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting lander:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/track/lpview - Track LP View
router.post("/track/lpview", async (req, res) => {
  console.log("POST /api/track/lpview - Payload:", req.body);
  try {
    const { click_id, campaign_id, timestamp, url, referrer } = req.body;

    if (!click_id || !campaign_id || !timestamp || !url) {
      console.warn("Missing fields in LP View tracking");
      return res.status(400).json({ error: "Missing required fields" });
    }

    const campaign = await Campaigns.findOne({
      where: { unique_id: campaign_id },
    });

    if (!campaign) {
      console.warn("Campaign not found for LP View tracking:", campaign_id);
      return res.status(404).json({ error: "Campaign not found" });
    }

    await Clicks.create({
      click_id,
      campaign_id,
      timestamp,
      url,
      referrer,
      type: "lpview",
    });

    console.log("LP View tracked successfully:", req.body);
    return res.status(200).json({ status: "lpview tracked" });
  } catch (error) {
    console.error("Error tracking LP View:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/track/lpclick - Track LP Click
router.post("/track/lpclick", async (req, res) => {
  console.log("POST /api/track/lpclick - Payload:", req.body);
  try {
    const { click_id, campaign_id, timestamp, url } = req.body;

    if (!click_id || !campaign_id || !timestamp || !url) {
      console.warn("Missing fields in LP Click tracking");
      return res.status(400).json({ error: "Missing required fields" });
    }

    const campaign = await Campaigns.findOne({
      where: { unique_id: campaign_id },
    });

    if (!campaign) {
      console.warn("Campaign not found for LP Click tracking:", campaign_id);
      return res.status(404).json({ error: "Campaign not found" });
    }

    await Clicks.create({
      click_id,
      campaign_id,
      timestamp,
      url,
      type: "lpclick",
    });

    console.log("LP Click tracked successfully:", req.body);
    return res.status(200).json({ status: "lpclick tracked" });
  } catch (error) {
    console.error("Error tracking LP Click:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
