import { useState, createContext, useEffect } from "react";
import axios from "axios";

export const SpotifyAuthContext = createContext({
    accessToken: null,
    refreshToken: null,
    invalidateAccess: () => null
});

function loadFromStorage(setAccessToken, setRefreshToken) {
    const accessToken = localStorage.getItem("spotify_access_token");
    const refreshToken = localStorage.getItem("spotify_refresh_token");
  
    if (accessToken && refreshToken) {
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
    }
}

function loadFromUrl(setAccessToken, setRefreshToken, setExpires) {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get("access_token")) {
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const scope = params.get("scope");
        const expiresIn = params.get("expires_in");
            
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
        setExpires((new Date()).getTime() / 1000 + expiresIn);
            
        saveSpotifyTokens(accessToken, refreshToken);
    
        console.log("Access Token:", accessToken);
        console.log("Refresh Token:", refreshToken);
        console.log("Scope:", scope);

        // TODO: Preserve other values in url
        window.history.pushState("Search Params", "", "/"+window.location.href.substring(window.location.href.lastIndexOf('/') + 1).split("?")[0]);
    }
}

function saveSpotifyTokens(accessToken, refreshToken) {
    if (accessToken && refreshToken) {
        localStorage.setItem("spotify_access_token", accessToken);
        localStorage.setItem("spotify_refresh_token", refreshToken);
    } else {
        localStorage.removeItem("spotify_access_token");
        localStorage.removeItem("spotify_refresh_token");
    }
}

export async function performFetch(
    url, params,
    accessToken, invalidateAccess
) {
    try {
        const response = await axios.get(url, {
            headers: {
                "Authorization": "Bearer " + accessToken
            },
            params
        });

        return response?.data;
    } catch (err) {
        if (err.response) {
            if (err.response.status === 401) {
                return await performFetch(
                    url, params, accessToken, await invalidateAccess()
                );
            }
        }

        throw err;
    }
}

export function ProvideSpotifyAuthContext({ children }) {
    const [playbackReady, setPlaybackReady] = useState(false);
    const [accessToken, setAccessToken] = useState(0);
    const [refreshToken, setRefreshToken] = useState(0);
    const [expires, setExpires] = useState(-1);

    if (!accessToken && !refreshToken) {
        loadFromStorage(setAccessToken, setRefreshToken);
    }

    if (window.location.search) {
        loadFromUrl(setAccessToken, setRefreshToken, setExpires);
    }

    useEffect(() => {
      window.onSpotifyWebPlaybackSDKReady = () => {
        setPlaybackReady(true);
      };
    }, []);

    const invalidateAccess = () => {
        if (!accessToken || !refreshToken) {
            return;
        }

        console.log("Invalidating Access Token", accessToken, refreshToken);

        if ((new Date()).getTime() / 1000 < expires) {
            console.warn("Invalidating access token before expires");
        }

        return new Promise((resolve, reject) => {
            if (accessToken && refreshToken) {
                console.log("Fetching");

                const params = new URLSearchParams({
                    "refresh_token": refreshToken
                });

                axios.post(
                    "http://localhost:3001/refresh/spotify",
                    params.toString()
                ).then((res) => {
                    const { access_token, expires_in, refresh_token } = res.data;

                    setAccessToken(access_token);
                    if (refreshToken) {
                        setRefreshToken(refresh_token);
                    }
                    setExpires((new Date()).getTime() / 1000 + expires_in);

                    saveSpotifyTokens(access_token, refresh_token);

                    resolve(accessToken);
                }).catch((err) => {
                    setAccessToken(0);
                    setRefreshToken(0);

                    saveSpotifyTokens(0, 0);

                    reject(err);
                });

                setAccessToken(0);
            } else {
                resolve(0); // TODO: I don't know how we should handle this
            }
        });
    };

    return (
        <SpotifyAuthContext.Provider value={
            {
                playbackReady,
                accessToken,
                refreshToken,
                invalidateAccess
            }
        }>
            { children }
        </SpotifyAuthContext.Provider>
    )
}
