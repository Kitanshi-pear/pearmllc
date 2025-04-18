const express = require('express');
const router = express.Router();

let redirectMap = {}; // In-memory storage (will reset when server restarts)

// POST /api/lp/save
router.post('/save', (req, res) => {
  const newMapping = req.body;

  if (!newMapping || typeof newMapping !== 'object') {
    return res.status(400).send('Invalid mapping format');
  }

  redirectMap = { ...redirectMap, ...newMapping }; // Merge new into existing
  return res.status(200).send('Mapping saved successfully');
});

// GET /api/lp?url=google.com
router.get('/', (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send('Missing "url" query parameter');
  }

  const redirectTo = redirectMap[targetUrl];

  if (!redirectTo) {
    return res.status(404).send(`No redirect mapping found for "${targetUrl}"`);
  }

  return res.redirect(redirectTo);
});

// GET /redirect/:unique_id
router.get("/redirect/:unique_id", async (req, res) => {
  try {
    const { unique_id } = req.params;

    const campaign = await Campaigns.findOne({
      where: { unique_id },
      include: [{ model: Lander }],
    });

    if (!campaign || !campaign.Lander) {
      return res.status(404).send("Campaign or associated lander not found");
    }

    const landerUrl = campaign.Lander.url;

    // Preserve query parameters (e.g. ?sub1=abc&sub2=123)
    const queryString = new URLSearchParams(req.query).toString();
    const finalRedirect = queryString
      ? `${landerUrl}?${queryString}`
      : landerUrl;

    return res.redirect(finalRedirect);
  } catch (err) {
    console.error("Redirect error:", err);
    return res.status(500).send("Internal server error");
  }
});


module.exports = router;
