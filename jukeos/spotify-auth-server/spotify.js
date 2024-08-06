function generateRandomString(length) {
    let text = '';
    const possible = 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        const index = Math.floor(Math.random() * possible.length);
        text += possible.charAt(index);
    }

    return text;
}


async function getHash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const digest = await window.crypto.subtle.digest('SHA-256', data);

    return digest
}


function base64Encode(input) {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}


async function generateCodeChallenge(codeVerifier) {
    const hash = await getHash(codeVerifier);
    const codeChallenge = base64Encode(hash);

    return codeChallenge;
}


async function requestAuthorization() {
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    require('dotenv').config();
    
    const clientID = process.env.SPOTIFY_CLIENT_ID;
    const redirectURI = 'http://localhost:8080'; // To be changed during the production phase.
    const scope = 'user-read-private user-read-email';
    const authUrl = new URL("https://accounts.spotify.com/authorize");
    const params =  {
        response_type: 'code',
        client_id: clientID,
        scope,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        redirect_uri: redirectURI,
    }
    
    window.localStorage.setItem('code_verifier', codeVerifier);
    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
}