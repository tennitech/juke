const express = require('express');
const axios = require('axios');
const cors = require('cors');

// NOTE: This is a hack because node is evoked in src/auth-server
require('dotenv').config({ path: `${__dirname}/../../.env` });

const app = express();
const port = 3001;

const ClientId = process.env.SPOTIFY_CLIENT_ID;
const ClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

app.use(cors());

app.get('/login/spotify', async (req, res) => {
  const params = new URLSearchParams();
  params.append("client_id", ClientId);
  params.append("response_type", "code");
  params.append("redirect_uri", "http://localhost:3001/callback/spotify");
  params.append("scope", req.query.scope || "user-read-email");
  params.append("show_dialog", false);

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.search = params.toString();

  res.redirect(authUrl.toString());
});

app.post('/refresh/spotify', (req, res) => {
  if (!req.query.refresh_token) {
    res.status(400).send(req.query.error || 'juke_unknown_error');
  } else {
    const body = new URLSearchParams();
    body.append("grant_type", "refresh_token");
    body.append("refresh_token", req.query.refresh_token);
    body.append("client_id", ClientId);

    axios.post("https://accounts.spotify.com/api/token", body.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }).then((response) => {
      const { access_token, expires_in, refresh_token, scope } = response.data;

      console.log("access token", access_token);
      console.log("expires in", expires_in);
      console.log("refresh token", refresh_token);
      console.log("scope", scope);

      res.status(200).json({ access_token, expires_in, refresh_token, scope });
    })
  }
});

app.get('/callback/spotify', (req, res) => {
  if (!req.query.code) {
    res.status(400).send(req.query.error || "juke_unknown_error");
  } else {
    const body = new URLSearchParams();
    body.append("grant_type", "authorization_code");
    body.append("code", req.query.code);
    body.append("redirect_uri", "http://localhost:3001/callback/spotify");
  
    axios.post("https://accounts.spotify.com/api/token", body.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": "Basic " + (new Buffer.from(ClientId + ":" + ClientSecret)).toString("base64")
        }
    }).then((response) => {
      const { access_token, scope, expires_in, refresh_token } = response.data;

      const params = new URLSearchParams();
      params.append("access_token", access_token);
      params.append("scope", scope);
      params.append("expires_in", expires_in);
      params.append("refresh_token", refresh_token);

      const url = new URL("http://localhost:3000");
      url.search = params.toString();

      res.redirect(url.toString());
    }).catch((err) => {
      res.status(400).send("Failed to get auth token");
    });
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
