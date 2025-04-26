// controller/offerController.js
const { Offer, OfferSource } = require('../models');

exports.getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.findAll({
      attributes: [
        'Serial_No',
        'Offer_name',
        'offer_status',
        'offer_source_id',
        'url',
        'revenue',
        'country',
        'postbackUrl',
        // Add other fields you want to return here
      ],
      include: [
        {
          model: OfferSource,
          as: 'OfferSource', // This is the alias defined in the Offer model
          attributes: ['name'], // Only include the 'name' field from OfferSource
        }
      ]
    });

    console.log(`Found ${offers.length} offers`);
    res.json(offers || []); // Return the offers, with OfferSource details
  } catch (err) {
    console.error("Error fetching offers:", err);
    res.status(500).json({ error: "Failed to fetch offers", details: err.message });
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
    
    console.log("Creating offer with data:", req.body);
    
    // Find the offer source ID
    let offerSourceId = null;
    
    if (source) {
      const offerSource = await OfferSource.findOne({
        where: { name: source }
      });
      
      offerSourceId = offerSource ? offerSource.id : null;
      
      if (!offerSource) {
        console.warn(`Offer source "${source}" not found in database`);
      }
    }
    
    // Create the offer with proper field mappings based on your model
    const newOffer = await Offer.create({
      Offer_name: name, // Match your model field name (capital O)
      offer_status: 'active',
      url: url,
      revenue: parseFloat(revenue || 0),
      country: country || 'Global',
      postbackUrl: postbackUrl,
      offer_source_id: offerSourceId,
      // Additional fields with defaults
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
    
    console.log("Created new offer:", newOffer.id);
    res.status(201).json(newOffer);
  } catch (err) {
    console.error("Error creating offer:", err);
    res.status(500).json({ error: "Failed to create offer", details: err.message });
  }
};