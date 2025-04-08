const { OfferSource, PostbackLog } = require('../models');

exports.handlePostback = async (req, res) => {
  const { clickid, sum, currency, source_id } = req.query;

  try {
    if (!clickid || !sum) {
      return res.status(400).json({ error: "Missing clickid or sum" });
    }

    // ✅ Check if the offer source exists
    const sourceExists = await OfferSource.findByPk(source_id);
    if (!sourceExists) {
      return res.status(404).json({ error: "OfferSource not found" });
    }

    console.log('Received Postback:', req.query);

    const log = await PostbackLog.create({
      clickid,
      sum,
      currency,
      source_id,
      raw_query: JSON.stringify(req.query),
    });

    res.status(200).json({
      message: "Postback received and logged internally",
      logId: log.id,
    });
  } catch (err) {
    console.error("Postback error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
