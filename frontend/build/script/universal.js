(function () {
    const cookieName = 'click_id_store';
    const cookieDurationDays = 30;
  
    // TODO: Replace these URLs with your production ones
    const clickApi = 'http://localhost:5000/api/track/click'; // Logs the click
    const viewApi = 'http://localhost:5000/api/track/view';   // Logs the LP view
    const cookieDomain = window.location.hostname; // Automatically set domain
  
    const urlParams = new URLSearchParams(window.location.search);
    const campaignId = urlParams.get('cmpid') || null;
    const trafficSource = urlParams.get('tsource') || null;
    const referrer = document.referrer;
  
    let clickId = getCookie(cookieName);
  
    function getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    }
  
    function setCookie(name, value, days) {
      const d = new Date();
      d.setTime(d.getTime() + (days * 86400000));
      document.cookie = `${name}=${value}; expires=${d.toUTCString()}; path=/; domain=${cookieDomain}`;
    }
  
    function trackClick() {
      fetch(clickApi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          source: trafficSource,
          referrer: referrer,
          timestamp: new Date().toISOString()
        })
      })
      .then(res => res.json())
      .then(data => {
        clickId = data.click_id;
        sessionStorage.setItem('click_id', clickId);
        setCookie(cookieName, clickId, cookieDurationDays);
        triggerView();
      })
      .catch(err => console.error('Error tracking click:', err));
    }
  
    function triggerView() {
      if (sessionStorage.getItem('view_once') === '1') return;
  
      if (!clickId) return; // clickId must exist
  
      fetch(`${viewApi}?click_id=${clickId}&referrer=${encodeURIComponent(referrer)}`)
        .catch(err => console.error('Error tracking view:', err));
  
      sessionStorage.setItem('view_once', '1');
    }
  
    if (!clickId) {
      trackClick();
    } else {
      sessionStorage.setItem('click_id', clickId);
      triggerView();
    }
  })();
  