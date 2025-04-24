const express = require('express');
const router = express.Router();
const { handlePostback } = require('../controller/postbackController');
const { PostbackLog } = require('../models'); // Make sure this path is correct

router.get('/postback', handlePostback); // <- Must match your URL exactly

// Route to fetch all postback logs
router.get('/logs', async (req, res) => {
    try {
      const logs = await PostbackLog.findAll({
        order: [['createdAt', 'DESC']],
      });
      res.status(200).json(logs);
    } catch (err) {
      console.error('Error fetching postback logs:', err.message);
      res.status(500).json({ error: 'Failed to fetch postback logs' });
    }
  });

module.exports = router;
