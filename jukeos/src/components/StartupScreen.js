import React, {useState, useEffect, useContext} from 'react';
import { motion } from 'framer-motion';
import jukeIcon from '../assets/juke-icon.svg';
import jukeLogo from '../assets/juke-logo.svg';
import spotifyWhiteLogo from '../assets/spotify-white-icon.svg'
import {requestUserAuthorization} from "./Profile";
import {performFetch, SpotifyAuthContext} from "../contexts/spotify";
import axios from "axios";
import {saveSpotifyTokens} from "../contexts/spotify";

const StartupScreen = ({ isLoading }) => {
    const { accessToken, refreshToken, setRefreshToken, setAccessToken, setExpires, invalidateAccess } = useContext(SpotifyAuthContext);
    const [showStartup, setShowStartup] = useState(false);

    //TODO: There is a bug with access token/refresh token here. See Issues
    useEffect(() => {
        if(!refreshToken || !accessToken){
            console.log("Null access/refresh. User must login");
            setShowStartup(true);
            return;
        }

        //Logic to check and refresh the tokens
        performFetch(
            "https://api.spotify.com/v1/me", {}, accessToken, invalidateAccess
        ).then((data) => {
            //Access token is valid
            setShowStartup(false);
        }).catch((err) => {
            //Must access token is bad must refresh.
            if(!err.response.status === 401){
                console.error("Unexpected error. Not refreshing token");
                setShowStartup(true);
                return;
            }

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
            }).catch(() => {
                //If refresh fails delete everything
                setAccessToken(0);
                setRefreshToken(0);
                saveSpotifyTokens(0, 0);
                setShowStartup(true);
            });
        });


    }, [refreshToken,accessToken]);


    return (
        showStartup &&
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "radial-gradient(circle, rgba(0,0,0,0.5) 70%, rgba(0,0,0,1) 100%)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
                backdropFilter: "blur(10px)"
            }}
        >
            <div style={{
                position: "absolute",
                top: "30%", // Change to move up and down
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                color: "white",
            }}>
                <div>
                    <motion.img
                        src={jukeIcon}
                        style={{width: "19vw"}}
                        animate={{rotate: 360}}
                        transition={{
                            repeat: Infinity,
                            duration: 15,
                            ease: "linear",
                        }}
                    />
                    <img src={jukeLogo} alt="Juke Logo" style={{width: "25vw"}}/>
                </div>
            </div>

            <button
                style={{
                    backgroundColor: "#1DB954", // Same as Profile login
                    color: "white",
                    padding: "12px 32px",
                    position: "absolute",
                    bottom: "25%",
                    fontSize: "18px",
                    fontFamily: 'Loubag, sans-serif',
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 6px rgba(255,255,255,0.2)",
                    transition: "transform 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                }}
                onClick={() => {
                    setShowStartup(false);
                    requestUserAuthorization();
                }}
            >
                <img
                    src={spotifyWhiteLogo}
                    alt="Spotify Logo"
                    style={{width: "24px", height: "24px", translate: "-10px"}}
                />
                Sign in with Spotify
            </button>
        </div>
    );
};


export default StartupScreen;