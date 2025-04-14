(function () {
  function getQueryParams() {
    const params = {};
    const query = window.location.search.substring(1);
    query.split("&").forEach((pair) => {
      const [key, value] = pair.split("=");
      if (key) params[key] = decodeURIComponent(value || "");
    });
    return params;
  }

  function trackEvent(endpoint, data, callback) {
    fetch("http://localhost:5000/api/lp/" + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(() => callback && callback())
      .catch((err) => console.error(`Tracking ${endpoint} failed`, err));
  }

  const params = getQueryParams();
  const clickId = params.click_id || null;
  const campaignId = params.campaign_id || null;
  const sourceId = params.source_id || null;
  const lpName = document.title || "Unnamed LP";

  if (clickId && campaignId) {
    trackEvent("view", {
      click_id: clickId,
      campaign_id: campaignId,
      source_id: sourceId,
      lp_name: lpName,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer || null
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const ctas = document.querySelectorAll("[data-lp-click]");
    ctas.forEach((el) => {
      el.addEventListener("click", function (e) {
        const href = el.getAttribute("href");
        if (!href) return;
        e.preventDefault();

        trackEvent(
          "click",
          {
            click_id: clickId,
            campaign_id: campaignId,
            source_id: sourceId,
            lp_name: lpName,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            url: window.location.href,
            destination_url: href,
            referrer: document.referrer || null
          },
          () => {
            window.location.href = href;
          }
        );
      });
    });
  });
})();
