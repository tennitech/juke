const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const cors = require('cors');

// NOTE: This is a hack because node is evoked in src/auth-server
require('dotenv').config({ path: `${__dirname}/../../.env` });

const app = express();
const port = 3001;

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const redirectUri = 'http://localhost:3000/callback';

app.use(cors());

app.get('/login', (req, res) => {
  const scope = 'user-read-private user-read-email';
  const queryParams = querystring.stringify({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scope,
  });
  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  const authOptions = {
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer.from(clientId + ':' + clientSecret).toString('base64')),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: querystring.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri
    }),
  };

  try {
    const response = await axios(authOptions);
    const access_token = response.data.access_token;
    const refresh_token = response.data.refresh_token;
    res.redirect(`http://localhost:3000/#access_token=${access_token}&refresh_token=${refresh_token}`);
  } catch (error) {
    console.error('Error getting access token', error);
    res.send('Error getting access token');
  }
});

app.post('/get-token', async (req, res) => {
  const code = req.body.code || null;

  const authOptions = {
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer.from(clientId + ':' + clientSecret).toString('base64')),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: querystring.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri
    }),
  };

  try {
    const response = await axios(authOptions);
    const accessToken = response.data.access_token;
    const refreshToken = response.data.refresh_token;

    res.send({
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.error('Error getting access token', error);
    res.status(500).send('Error getting access token');
  }
});

app.get('/playlists', async (req, res) => {
  const accessToken = req.session.accessToken;

  const options = {
    url: 'https://api.spotify.com/v1/me/playlists',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
    },
  };

  try {
    const response = await axios(options);
    res.send(response.data);
  } catch (error) {
    console.error('Error getting playlists', error);
    res.status(500).send('Error getting playlists');
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
