import { useState, createContext } from "react";

export const SpotifyAuthContext = createContext({
    accessToken: null,
    setAccessToken: null,
    refreshToken: null,
    setRefreshToken: null
});

function loadFromStorage(setAccessToken, setRefreshToken) {
    const accessToken = localStorage.getItem("spotify_access_token");
    const refreshToken = localStorage.getItem("spotify_refresh_token");
  
    if (accessToken && refreshToken) {
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
    }
}

function loadFromUrl(setAccessToken, setRefreshToken) {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get("access_token")) {
        const accessToken = params.get("access_token");
        const scope = params.get("scope");
        const refreshToken = params.get("refresh_token");
            
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
            
        saveSpotifyTokens(accessToken, refreshToken);
    
        console.log("Access Token:", accessToken);
        console.log("Refresh Token:", refreshToken);
        console.log("Scope:", scope);

        // TODO: Preserve other values in url
        window.history.pushState("Search Params", "", "/"+window.location.href.substring(window.location.href.lastIndexOf('/') + 1).split("?")[0]);
    }
}

function saveSpotifyTokens(accessToken, refreshToken) {
    localStorage.setItem("spotify_access_token", accessToken);
    localStorage.setItem("spotify_refresh_token", refreshToken);
}

export function ProvideSpotifyAuthContext({ children }) {
    const [accessToken, setAccessToken] = useState(0);
    const [refreshToken, setRefreshToken] = useState(0);

    if (!accessToken && !refreshToken) {
        loadFromStorage(setAccessToken, setRefreshToken);
    }

    if (window.location.search) {
        loadFromUrl(setAccessToken, setRefreshToken);
    }

    const invalidateAccess = () => {
        // TODO: Attempt to refresh and (failing that) set to 0

        console.log("Invalidate");

        // setAccessToken(0);
    };

    return (
        <SpotifyAuthContext.Provider value={
            {
                accessToken,
                refreshToken,
                invalidateAccess
            }
        }>
            { children }
        </SpotifyAuthContext.Provider>
    )
}
