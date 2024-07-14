function generateRandomString(length) {
    let text = '';
    const possible = 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        let index = Math.floor(Math.random() * possible.length);
        text += possible.charAt(index);
    }

    return text;
}


