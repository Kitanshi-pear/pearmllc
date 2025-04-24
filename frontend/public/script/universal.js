(function () {
  const queryParams = new URLSearchParams(window.location.search);
  const clickId = queryParams.get("click_id"); // You can pass click_id from the redirect
  const campaignId = queryParams.get("unique_id"); // Use unique_id as campaign_id

  if (!campaignId) {
    console.error("Campaign ID is missing.");
    return;
  }

  // 1. Send LP view event
  fetch("track.autofullcoverage.pro/api/track/lpview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      click_id: clickId,
      campaign_id: campaignId, // Use unique_id as campaign_id
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
    }),
  });

  // 2. Hook into click buttons (add this to your lander's "Continue" or "Next" button)
  document.addEventListener("DOMContentLoaded", () => {
    const clickElements = document.querySelectorAll("[data-track-click]");
    clickElements.forEach((el) => {
      el.addEventListener("click", () => {
        fetch("track.autofullcoverage.pro/api/track/lpclick", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            click_id: clickId,
            campaign_id: campaignId, // Use unique_id as campaign_id
            timestamp: new Date().toISOString(),
            url: window.location.href,
          }),
        });
      });
    });
  });
})();
