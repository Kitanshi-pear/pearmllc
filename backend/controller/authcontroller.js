const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

// Google OAuth
exports.googleAuth = async (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = 'http://localhost:5000/auth/google/callback'; 

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile`;
    
    res.redirect(authUrl);
};

// Facebook OAuth
exports.facebookAuth = async (req, res) => {
    const fbClientId = process.env.FB_CLIENT_ID;
    const fbRedirectUri = 'http://localhost:5000/auth/facebook/callback';

    const fbUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${fbClientId}&redirect_uri=${fbRedirectUri}&scope=email,public_profile`;

    res.redirect(fbUrl);
};
