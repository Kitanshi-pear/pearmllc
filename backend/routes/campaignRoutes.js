const express = require("express");
const router = express.Router();
const { Campaigns, Domain, TrafficChannel, Lander } = require("../models");
const { v4: uuidv4 } = require("uuid");
const campaignController = require("../controller/campaignController");

// GET /api/campaigns - Get all campaigns with associations
router.get("/", campaignController.getAllCampaigns);

// GET /api/campaigns/:id - Get a campaign by ID
router.get("/:id", campaignController.getCampaignById);

// POST /api/campaigns - Create a campaign