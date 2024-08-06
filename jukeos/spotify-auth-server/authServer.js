const getToken = async code => {
    let codeVerifier = localStorage.getItem('code_verifier');
    const payload = {
        method: 'POST', 
        headers: {'Content Type': 'application/x-www-form-urlencoded'}, 
        body: new URLSearchParams({
            client_id: clientId, 
            grant_type: 'authorization_code',
            code, 
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
        }),
    }

    const body = await fetch(url, payload);
    const response = await body.json();

    localStorage.setItem('access_token', response.access_token);
}


export default getToken;