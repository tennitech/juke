const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3001;

const ClientId = process.env.SPOTIFY_CLIENT_ID;
const ClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

app.use(cors());

app.get('/login/spotify', async (req, res) => {
  if (!req.query.challenge) {
    res.status(400).send('Parameter challenge required');
  }

  const params = new URLSearchParams();
  params.append("client_id", ClientId);
  params.append("response_type", "code");
  params.append("redirect_uri", "http://localhost:3001/callback/spotify");
  params.append("scope", "user-read-email");
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", req.query.challenge);

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.search = params.toString();

  res.redirect(authUrl.toString());
});

app.get('/callback/spotify', async (req, res) => {
  if (!req.query.code) {
    res.status(400).send('Expected code parameter');
  }

  console.log("Code", req.query.code);

  res.redirect(atob("aHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1kUXc0dzlXZ1hjUQ=="));
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
