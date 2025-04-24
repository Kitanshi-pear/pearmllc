
const BASE_URL = 'https://pearmllc.onrender.com';
const saveToBackend = async () => {
    try {
      const response = await fetch("https://pearmllc.onrender.com/api/save-channel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
  
      const result = await response.json();
      console.log("✅ Backend response:", result);
    } catch (err) {
      console.error("❌ Error saving to backend:", err);
    }
  };
  
const validateFacebookToken = async () => {
  const { pixelId, apiAccessToken } = formData;

  try {
    const res = await fetch("https://pearmllc.onrender.com/api/validate-fb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pixelId, apiAccessToken }),
    });

    const result = await res.json();

    if (result.valid) {
      setIsFacebookConnected(true);
      console.log("✅ Facebook token validated");
    } else {
      alert("❌ Invalid Facebook Access Token or Pixel ID");
    }
  } catch (err) {
    console.error("Validation error", err);
  }
};

const connectFacebook = async () => {
    const { pixelId, apiAccessToken } = formData;

    if (!pixelId || !apiAccessToken) {
        alert("Please enter Pixel ID and API Access Token.");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/connect-facebook`, {   // Use BASE_URL
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pixelId,
                apiAccessToken
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log('Facebook Connected:', data);
            alert('Facebook account connected successfully!');
        } else {
            console.error('Facebook connection failed:', data);
            alert('Failed to connect Facebook.');
        }
    } catch (error) {
        console.error('Error connecting Facebook:', error);
        alert('An error occurred while connecting Facebook.');
    }
};

const connectGoogle = async () => {
    const { googleAdsAccountId, googleMccAccountId } = formData;

    if (!googleAdsAccountId) {
        alert("Please enter Google Ads Account ID.");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/connect-google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                googleAdsAccountId,
                googleMccAccountId
            })
        });

        const data = await response.json();
        console.log(data);
        if (response.ok) {
            console.log('Google Connected:', data);
            alert('Google account connected successfully!');
        } else {
            console.error('Google connection failed:', data);
            alert('Failed to connect Google.');
        }
    } catch (error) {
        console.error('Error connecting Google:', error);
        alert('An error occurred while connecting Google.');
    }
};

const handleSubmit = async () => {
    if (selectedChannel === "Facebook") {
        await connectFacebook();
    }

    if (selectedChannel === "Google") {
        await connectGoogle();
    }
    
    console.log("Data saved:", formData);
    alert("Integration settings saved successfully!");
    window.location.href = '/trafficchannel';  // Redirect to display results
};
