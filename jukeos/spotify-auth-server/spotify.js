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
}


export default requestAuthorization;