const express = require('express');
const router = express.Router();
const { Domain } = require('../models');
const { v4: uuidv4 } = require('uuid');

// POST /api/domains - Create a new domain
router.post('/', async (req, res) => {
  const { url, sslEnabled } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Missing domain URL" });
  }

  try {
    const domainName = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const userId = req.user?.id || 1; // Replace with actual auth if needed

    const newDomain = await Domain.create({
      user_id: userId,
      domain: domainName,
      status: sslEnabled ? 'pending' : 'active',
      reissue_only: false,
      ssl_expiry: sslEnabled ? null : null
    });

    // (Optional) You could now queue SSL provisioning job if sslEnabled === true

    res.status(201).json({ domain: newDomain });
  } catch (error) {
    console.error('Error creating domain:', error);
    res.status(500).json({ error: 'Failed to create domain' });
  }
});

// GET /api/domains - Fetch all domains
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || 1; // Replace with real user ID
    const domains = await Domain.findAll({ where: { user_id: userId } });

    const mapped = domains.map((d, idx) => ({
      serial_no: idx + 1,
      id: d.id,
      url: `https://${d.domain}`,
      created_at: d.created_at,
      ssl_expiry: d.ssl_expiry,
      reissue_only: d.reissue_only,
      sslEnabled: d.status !== 'active' ? true : false
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Error fetching domains:', err);
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
});

router.put('/api/domains/:id', async (req, res) => {
    const { id } = req.params;
    const { url, sslEnabled } = req.body;
  
    try {
      const domain = await Domain.findByPk(id);
      if (!domain) return res.status(404).json({ error: "Domain not found" });
  
      domain.url = url;
      domain.sslEnabled = sslEnabled;
      await domain.save();
  
      res.json(domain);
    } catch (err) {
      res.status(500).json({ error: "Failed to update domain" });
    }
  });
  


module.exports = router;
