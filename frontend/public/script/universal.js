(function () {
    const TRACKING_DOMAIN = "http://localhost:5000"; // Update this in production
    const campaignId = new URLSearchParams(window.location.search).get("campaign_id");
    const storedClickId = localStorage.getItem("click_id");
  

  
    // Track page view
    fetch(`${TRACKING_DOMAIN}/lander/track/view?campaign_id=${campaignId}&click_id=${storedClickId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem("click_id", data.click_id);
          localStorage.setItem("campaign_id", data.campaign_id);
          console.log("[Tracker] View tracked", data);
        }
      })
      .catch(err => console.error("[Tracker] View tracking error:", err));
  
  
    // 2. Attach click tracking to all CTAs
    window.addEventListener("DOMContentLoaded", () => {
      const click_id = localStorage.getItem("click_id");
      const campaign_id = localStorage.getItem("campaign_id");
  
      document.querySelectorAll("[data-track-cta]").forEach(el => {
        el.addEventListener("click", () => {
          if (!click_id || !campaign_id) return;
  
          fetch(`${TRACKING_DOMAIN}/track/click`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ click_id, campaign_id })
          })
            .then(res => res.json())
            .then(data => console.log("[Tracker] CTA click tracked", data))
            .catch(err => console.error("[Tracker] Click tracking error:", err));
        });
      });
    });
  })();
  