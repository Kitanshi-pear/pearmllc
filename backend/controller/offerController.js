const { Offer } = require('../models');
const Click = require('../models/Click');

exports.getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.findAll({
      include: [
        {
          model: require('../models').OfferSource,
          as: 'offerSource',
          attributes: ['name']
        }
      ]
    });
    res.json(offers);
  } catch (err) {
    console.error("Error fetching offers:", err);
    res.status(500).json({ error: "Failed to fetch offers" });
  }
};


  exports.createOffer = async (req, res) => {
    try {
      const {
        name,
        source,
        url,
        revenue,
        country,
        postbackUrl
      } = req.body;
      
      // Find the offer source ID
      const { OfferSource } = require('../models');
      const offerSource = await OfferSource.findOne({
        where: { name: source }
      });
      
      const newOffer = await Offer.create({
        Offer_name: name,
        offer_status: 'active',
        url: url,
        revenue: parseFloat(revenue || 0),
        country: country || 'Global',
        postbackUrl: postbackUrl,
        offer_source_id: offerSource ? offerSource.id : null,
        clicks: 0,
        lp_clicks: 0,
        conversion: 0,
        total_cpa: 0.00,
        epc: 0.00,
        total_revenue: 0.00,
        cost: 0.00,
        profit: 0.00,
        total_roi: 0.00,
        lp_views: 0,
        impressions: 0
      });
      
      res.status(201).json(newOffer);
    } catch (err) {
      console.error("Error creating offer:", err);
      res.status(500).json({ error: "Failed to create offer", details: err.message });
    }
  };