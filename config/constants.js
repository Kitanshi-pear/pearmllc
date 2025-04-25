module.exports = {
    // Macro definitions and placeholders
    MACROS: {
      // System macros - these are replaced by the system
      CLICK_ID: '{click_id}',
      CAMPAIGN_ID: '{campaign_id}',
      CAMPAIGN_NAME: '{campaign_name}',
      TRAFFIC_SOURCE: '{traffic_source}',
      OFFER_ID: '{offer_id}',
      OFFER_NAME: '{offer_name}',
      LANDER_ID: '{lander_id}',
      PAYOUT: '{payout}',
      COST: '{cost}',
      
      // Custom tracking macros (subs)
      SUB1: '{sub1}',
      SUB2: '{sub2}',
      SUB3: '{sub3}',
      SUB4: '{sub4}',
      SUB5: '{sub5}',
      // ... SUB6-SUB23 would be defined similarly
    },
    
    // Traffic channel type definitions
    TRAFFIC_CHANNEL_TYPES: {
      FACEBOOK: 'facebook',
      GOOGLE: 'google',
      BING: 'bing',
      TIKTOK: 'tiktok',
      TWITTER: 'twitter',
      SNAP: 'snapchat',
      PINTEREST: 'pinterest',
      NATIVE: 'native',
      PUSH: 'push',
      EMAIL: 'email',
      CUSTOM: 'custom'
    },
    
    // Default tracking parameters by traffic source
    DEFAULT_TRACKING_PARAMS: {
      facebook: {
        campaignId: 'c_id',
        adsetId: 'a_id',
        adId: 'ad_id',
        clickId: 'fbclid'
      },
      google: {
        campaignId: 'campaignid',
        adgroupId: 'adgroupid',
        keywordId: 'keyword',
        clickId: 'gclid'
      },
      tiktok: {
        campaignId: 'campaign_id',
        adgroupId: 'adgroup_id',
        adId: 'ad_id',
        clickId: 'ttclid'
      }
      // Add more platforms as needed
    }
  };
  