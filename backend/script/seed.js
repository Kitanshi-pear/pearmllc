const db = require("../models");

const seed = async () => {
  await db.sequelize.sync({ force: true });

  const campaign = await db.Campaign.create({ name: "Test Campaign" });
  const domain = await db.Domain.create({ domain_name: "example.com" });
  const lander = await db.Lander.create({ name: "Lander 1", url: "https://lander.com" });
  const offer = await db.Offer.create({ title: "Free iPhone", offer_url: "https://offer.com" });
  const offerSource = await db.OfferSource.create({ name: "ClickDealer" });
  const channel = await db.TrafficChannel.create({ name: "Facebook", platform: "facebook", pixel_id: "123", conversion_id: "456", ad_account_id: "789" });

  const click = await db.Click.create({
    click_id: "abc123",
    source_id: channel.id,
    timestamp: new Date(),
    CampaignId: campaign.id,
    DomainId: domain.id,
    LanderId: lander.id,
    OfferId: offer.id,
    OfferSourceId: offerSource.id,
    TrafficChannelId: channel.id
  });

  await db.Cost.create({ click_id: click.id, cost_value: 1.2, currency: "USD" });
  await db.Revenue.create({ click_id: click.id, revenue_value: 3.5, currency: "USD" });
  await db.Macro.create({ click_id: click.id, source_id: channel.id, subid1: "sub1", subid2: "sub2" });

  console.log("🌱 Seed complete!");
  process.exit();
};

seed();
